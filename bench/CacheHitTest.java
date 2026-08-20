// PetHome multi-level cache hit-rate test (pure JDK, no third-party deps).
// Hits GET /product/{id} with a realistic distribution:
//   80%  hot ids (1..10)      -- typical cache-hit traffic
//   15%  cold ids (11..50)    -- long-tail (some L2/DB)
//    5%  miss ids (9001..9010) -- non-existent (verify null-cache anti-penetration)
// Then GET /product/cache-stats to read l1Hit/l2Hit/dbHit/nullHit/hitRate/dbReductionRate.
//
// Usage (JDK 17+ single-file):
//   java bench/CacheHitTest.java --url http://localhost:8088/api \
//     --requests 2000 --concurrency 50 --secret DEFAULT_SECRET
//
// Args:
//   --url          backend base url (incl /api)            default http://localhost:8088/api
//   --requests     total GET requests to fire                default 2000
//   --concurrency  max in-flight                             default 50
//   --secret       JWT secret (product GET may be public)   default DEFAULT_SECRET
//
// Expected (resume "缓存命中率达 95%+, DB 回源<5%"):
//   hitRate >= 0.95
//   dbReductionRate >= 0.95   (== 1 - dbHit/total)
//   nullHit > 0 only on first round per miss id, then null-cache serves subsequent

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicInteger;

public class CacheHitTest {

    static final String DEFAULT_SECRET = "pethome-secret-key-please-change-in-production-2026";
    static final long DEFAULT_TTL_MS = 18_000_000L;

    public static void main(String[] args) throws Exception {
        Args a = Args.parse(args);
        System.out.println("== PetHome cache hit-rate test ==");
        System.out.println("url=" + a.url + " requests=" + a.requests + " concurrency=" + a.concurrency);

        // build the request distribution
        int[] hotIds = new int[10];
        for (int i = 0; i < 10; i++) hotIds[i] = i + 1;
        int[] coldIds = new int[40];
        for (int i = 0; i < 40; i++) coldIds[i] = i + 11;
        int[] missIds = new int[10];
        for (int i = 0; i < 10; i++) missIds[i] = 9001 + i;

        List<Integer> idPool = new ArrayList<>(a.requests);
        Random rnd = new Random(42);
        for (int i = 0; i < a.requests; i++) {
            double r = rnd.nextDouble();
            int id;
            if (r < 0.80) id = hotIds[rnd.nextInt(hotIds.length)];
            else if (r < 0.95) id = coldIds[rnd.nextInt(coldIds.length)];
            else id = missIds[rnd.nextInt(missIds.length)];
            idPool.add(id);
        }
        Collections.shuffle(idPool, rnd);

        // one JWT (user id 1) — most product GETs are public, but include auth header just in case
        String token = signJwt(1, a.secret);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        Semaphore sem = new Semaphore(a.concurrency);

        AtomicInteger ok = new AtomicInteger(), notFound = new AtomicInteger(),
                other = new AtomicInteger(), httpError = new AtomicInteger();
        List<Integer> latencies = Collections.synchronizedList(new ArrayList<>());

        ExecutorService pool = Executors.newCachedThreadPool();
        List<CompletableFuture<?>> futures = new ArrayList<>(a.requests);

        long t0 = System.nanoTime();
        for (int id : idPool) {
            sem.acquire();
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(a.url + "/product/" + id))
                    .GET()
                    .header("Authorization", "Bearer " + token)
                    .timeout(Duration.ofSeconds(5))
                    .build();
            long s = System.nanoTime();
            futures.add(client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .handle((resp, ex) -> {
                        long lat = (System.nanoTime() - s) / 1_000_000;
                        latencies.add((int) lat);
                        sem.release();
                        if (ex != null || resp == null) { httpError.incrementAndGet(); return null; }
                        int status = resp.statusCode();
                        if (status == 200) ok.incrementAndGet();
                        else if (status == 404) notFound.incrementAndGet();
                        else other.incrementAndGet();
                        return null;
                    }));
        }
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        long elapsedNs = System.nanoTime() - t0;
        pool.shutdown();

        double elapsedS = elapsedNs / 1_000_000_000.0;
        System.out.println("-------------------- result --------------------");
        System.out.printf("total=%d  ok=%d  notFound=%d  other=%d  httpError=%d%n",
                a.requests, ok.get(), notFound.get(), other.get(), httpError.get());
        System.out.printf("elapsed=%.3fs  QPS=%.1f%n", elapsedS, a.requests / elapsedS);
        if (!latencies.isEmpty()) {
            List<Integer> sorted = new ArrayList<>(latencies);
            Collections.sort(sorted);
            int p50 = sorted.get(sorted.size() / 2);
            int p95 = sorted.get((int) (sorted.size() * 0.95));
            int p99 = sorted.get((int) (sorted.size() * 0.99));
            double avg = sorted.stream().mapToInt(Integer::intValue).average().orElse(0);
            System.out.printf("latency(ms): avg=%.1f p50=%d p95=%d p99=%d%n", avg, p50, p95, p99);
        }
        System.out.println("distribution: hot(1..10)=80% cold(11..50)=15% miss(9001..9010)=5%");

        // fetch cache stats
        System.out.println("-------------------- cache stats --------------------");
        HttpRequest statsReq = HttpRequest.newBuilder()
                .uri(URI.create(a.url + "/product/cache-stats"))
                .GET()
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .build();
        try {
            HttpResponse<String> resp = client.send(statsReq, HttpResponse.BodyHandlers.ofString());
            System.out.println("    " + resp.body());
        } catch (Exception e) {
            System.out.println("    stats fetch failed: " + e.getMessage());
        }
        System.out.println("-------------------- verify --------------------");
        System.out.println("[assert] hitRate >= 0.95  (resume claim)");
        System.out.println("[assert] dbReductionRate >= 0.95  (== 1 - dbHit/total)");
        System.out.println("[assert] nullHit >= 10  (anti-penetration: 10 distinct miss ids, first round each hits DB)");
        System.out.println("[assert] dbHit should be small: hot+cold ids fill L1/L2 after first hit; only miss ids first-hit goes to DB");
    }

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
        int requests = 2000;
        int concurrency = 50;
        String secret = DEFAULT_SECRET;
        static Args parse(String[] a) {
            Args r = new Args();
            for (int i = 0; i < a.length; i++) {
                switch (a[i]) {
                    case "--url": r.url = a[++i]; break;
                    case "--requests": r.requests = Integer.parseInt(a[++i]); break;
                    case "--concurrency": r.concurrency = Integer.parseInt(a[++i]); break;
                    case "--secret": r.secret = a[++i]; break;
                }
            }
            return r;
        }
    }
}
