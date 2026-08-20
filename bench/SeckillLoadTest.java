// PetHome seckill load tester (pure JDK, no third-party deps).
// Signs N distinct JWTs (HS256, same algo/secret as backend JwtUtil),
// concurrently POST /seckill/{voucherId}, reports QPS / success / error-code breakdown,
// and prints SQL to verify zero oversell / zero duplicate orders.
//
// Usage (JDK 17+, single-file source mode, no compile needed):
//   java bench/SeckillLoadTest.java \
//     --url http://localhost:8088/api --voucher 9001 --users 2000 --concurrency 1000
//
// Args:
//   --url          backend base url (incl context-path /api)        default http://localhost:8088/api
//   --voucher      seckill voucher id                                default 9001
//   --users        distinct users (= number of JWTs signed)          default 1000
//   --concurrency  max in-flight requests (parallelism)              default = users
//   --repeat       requests per user (>1 verifies idempotency)       default 1
//   --secret       JWT secret (must match backend pethome.jwt.secret) default DEFAULT_SECRET
//
// Error codes (from ErrorCode.java):
//   200=success 13004=soldOut 13005=duplicate 13002=notStarted 13003=ended 13001=notFound
//   HTTP 429 = rate limited
//
// Verification (run in MySQL after the test):
//   SELECT COUNT(*) FROM seckill_order WHERE voucher_id=9001;  -- should == min(stock, distinct users)
//   oversell check: set stock < users, run, then order count must == stock (no over-deduct).
//   dedup check: --repeat 2, second round should all be 13005.

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

public class SeckillLoadTest {

    // Must match backend/src/main/resources/application.yml default
    static final String DEFAULT_SECRET = "pethome-secret-key-please-change-in-production-2026";
    static final long DEFAULT_TTL_MS = 18_000_000L; // 5h, matches pethome.jwt.ttl

    public static void main(String[] args) throws Exception {
        Args a = Args.parse(args);
        System.out.println("== PetHome seckill load test ==");
        System.out.println("url=" + a.url + " voucher=" + a.voucher
                + " users=" + a.users + " concurrency=" + a.concurrency
                + " repeat=" + a.repeat);

        // 1. sign N distinct JWTs offline
        List<String> tokens = new ArrayList<>(a.users);
        for (long uid = 1; uid <= a.users; uid++) {
            tokens.add(signJwt(uid, a.secret));
        }
        System.out.println("JWTs signed: " + tokens.size());

        // 2. build request list (each user repeat times, shuffled per round)
        List<String> reqs = new ArrayList<>(a.users * a.repeat);
        for (int r = 0; r < a.repeat; r++) {
            List<String> shuffled = new ArrayList<>(tokens);
            Collections.shuffle(shuffled);
            reqs.addAll(shuffled);
        }
        final int total = reqs.size();

        // 3. fire concurrently (semaphore bounds in-flight)
        ExecutorService pool = Executors.newFixedThreadPool(Math.max(a.concurrency, 200));
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .executor(pool)
                .build();
        Semaphore sem = new Semaphore(a.concurrency);

        AtomicInteger success = new AtomicInteger(), duplicate = new AtomicInteger(),
                soldOut = new AtomicInteger(), rateLimited = new AtomicInteger(),
                notStarted = new AtomicInteger(), ended = new AtomicInteger(),
                other = new AtomicInteger(), httpError = new AtomicInteger();
        List<Integer> latencies = Collections.synchronizedList(new ArrayList<>());
        List<CompletableFuture<?>> futures = new ArrayList<>(total);
        URI uri = URI.create(a.url + "/seckill/" + a.voucher);

        long t0 = System.nanoTime();
        for (String token : reqs) {
            sem.acquire();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(uri)
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .header("Authorization", "Bearer " + token)
                    .timeout(Duration.ofSeconds(10))
                    .build();
            long s = System.nanoTime();
            futures.add(client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .handle((resp, ex) -> {
                        long lat = (System.nanoTime() - s) / 1_000_000;
                        latencies.add((int) lat);
                        sem.release();
                        classify(resp, ex, success, duplicate, soldOut,
                                rateLimited, notStarted, ended, other, httpError);
                        return null;
                    }));
        }
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        long elapsed_ns = System.nanoTime() - t0;
        pool.shutdown();

        // 4. summary
        double elapsed_s = elapsed_ns / 1_000_000_000.0;
        System.out.println("-------------------- result --------------------");
        System.out.printf("total=%d success=%d duplicate=%d soldOut=%d notStarted=%d ended=%d rateLimited=%d other=%d httpError=%d%n",
                total, success.get(), duplicate.get(), soldOut.get(),
                notStarted.get(), ended.get(), rateLimited.get(),
                other.get(), httpError.get());
        System.out.printf("elapsed=%.3fs  QPS(total)=%.1f  QPS(success)=%.1f%n",
                elapsed_s, total / elapsed_s, success.get() / elapsed_s);
        if (!latencies.isEmpty()) {
            List<Integer> sorted = new ArrayList<>(latencies);
            Collections.sort(sorted);
            int p50 = sorted.get(sorted.size() / 2);
            int p95 = sorted.get((int) (sorted.size() * 0.95));
            int p99 = sorted.get((int) (sorted.size() * 0.99));
            int max = sorted.get(sorted.size() - 1);
            double avg = sorted.stream().mapToInt(Integer::intValue).average().orElse(0);
            System.out.printf("latency(ms): avg=%.1f p50=%d p95=%d p99=%d max=%d%n",
                    avg, p50, p95, p99, max);
        }
        System.out.println("-------------------- verify --------------------");
        System.out.printf("SELECT COUNT(*) FROM seckill_order WHERE voucher_id=%d;%n", a.voucher);
        System.out.println("expected order count == min(stock, distinct users); >stock means oversell.");
        if (a.repeat > 1) {
            System.out.println("repeat=" + a.repeat + ": each user succeeds at most once; success<=users, rest=13005(duplicate).");
        }
        // oversell/dedup assertions
        if (a.repeat == 1) {
            System.out.printf("[assert] success(%d) <= initial_stock;  duplicate(%d) == 0 (first round)%n",
                    success.get(), duplicate.get());
        } else {
            System.out.printf("[assert] round1 success <= users;  round>=2 should all be duplicate(13005); total duplicate=%d%n",
                    duplicate.get());
        }
    }

    static void classify(HttpResponse<String> resp, Throwable ex,
                         AtomicInteger success, AtomicInteger duplicate, AtomicInteger soldOut,
                         AtomicInteger rateLimited, AtomicInteger notStarted, AtomicInteger ended,
                         AtomicInteger other, AtomicInteger httpError) {
        if (ex != null || resp == null) { httpError.incrementAndGet(); return; }
        int status = resp.statusCode();
        if (status == 429) { rateLimited.incrementAndGet(); return; }
        String body = resp.body() == null ? "" : resp.body();
        Integer code = extractCode(body);
        if (code == null) { other.incrementAndGet(); return; }
        if (status == 200 && code == 200) { success.incrementAndGet(); return; }
        switch (code) {
            case 13005: duplicate.incrementAndGet(); break;     // SECKILL_DUPLICATE
            case 13004: soldOut.incrementAndGet(); break;       // SECKILL_SOLD_OUT
            case 13002: notStarted.incrementAndGet(); break;    // SECKILL_NOT_STARTED
            case 13003: ended.incrementAndGet(); break;         // SECKILL_ENDED
            default: other.incrementAndGet();
        }
    }

    static Integer extractCode(String body) {
        int i = body.indexOf("\"code\"");
        if (i < 0) i = body.indexOf("code");
        if (i < 0) return null;
        int j = body.indexOf(':', i);
        int k = j + 1;
        while (k < body.length() && (body.charAt(k) == ' ' || body.charAt(k) == '"')) k++;
        int m = k;
        while (m < body.length() && Character.isDigit(body.charAt(m))) m++;
        if (m == k) return null;
        try { return Integer.parseInt(body.substring(k, m)); } catch (Exception e) { return null; }
    }

    // ---- offline JWT (HS256), equivalent to io.jsonwebtoken Jwts ----
    static String signJwt(long userId, String secret) {
        long now = System.currentTimeMillis();
        String header = b64u("{\"alg\":\"HS256\",\"typ\":\"JWT\"}");
        String payload = b64u("{\"sub\":\"" + userId + "\",\"iat\":"
                + (now / 1000) + ",\"exp\":" + ((now + DEFAULT_TTL_MS) / 1000) + "}");
        String signingInput = header + "." + payload;
        byte[] sig = hmacSha256(secret.getBytes(StandardCharsets.UTF_8), signingInput.getBytes(StandardCharsets.UTF_8));
        return signingInput + "." + b64u(sig);
    }

    static String b64u(String s) { return b64u(s.getBytes(StandardCharsets.UTF_8)); }
    static String b64u(byte[] b) {
        return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(b);
    }
    static byte[] hmacSha256(byte[] key, byte[] data) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(key, "HmacSHA256"));
            return mac.doFinal(data);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    static class Args {
        String url = "http://localhost:8088/api";
        long voucher = 9001;
        int users = 1000;
        int concurrency = 1000;
        int repeat = 1;
        String secret = DEFAULT_SECRET;
        static Args parse(String[] a) {
            Args r = new Args();
            for (int i = 0; i < a.length; i++) {
                switch (a[i]) {
                    case "--url": r.url = a[++i]; break;
                    case "--voucher": r.voucher = Long.parseLong(a[++i]); break;
                    case "--users": r.users = Integer.parseInt(a[++i]); break;
                    case "--concurrency": r.concurrency = Integer.parseInt(a[++i]); break;
                    case "--repeat": r.repeat = Integer.parseInt(a[++i]); break;
                    case "--secret": r.secret = a[++i]; break;
                }
            }
            if (r.concurrency > r.users * r.repeat) r.concurrency = r.users * r.repeat;
            return r;
        }
    }
}
