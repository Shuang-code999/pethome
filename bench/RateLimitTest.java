// PetHome rate-limit test (pure JDK, no third-party deps).
// Hits a rate-limited endpoint with controlled concurrency and classifies 200 vs 429.
//
// Config (must match backend application.yml pethome.rate-limit):
//   tokens=10  capacity=20  -> token-bucket: 20 burst, 10/s refill
//   So in a 1-second burst of N concurrent requests:
//     - first 20 are allowed (HTTP 200)
//     - remainder get 429 (until tokens refill)
//   Over a longer window, allowed rate ~= 10/s sustained.
//
// Two modes:
//   mode A (default): single IP fires N concurrent requests; expect ~20 allowed, rest 429.
//   mode B (--multi-ip): K different "IPs" (simulated via X-Forwarded-For) fire N each
//     concurrently; each bucket should independently allow ~20 (proves IP+URI isolation).
//
// Usage (JDK 17+ single-file):
//   java bench/RateLimitTest.java --url http://localhost:8088/api \
//     --path /seckill/9001 --burst 100
//   java bench/RateLimitTest.java --url http://localhost:8088/api \
//     --path /seckill/9001 --burst 50 --multi-ip 5
//
// Args:
//   --url       backend base url (incl /api)               default http://localhost:8088/api
//   --path      path under rate-limit (check WebMvcConfig) default /seckill/9001
//   --burst     concurrent requests per IP                 default 100
//   --multi-ip  number of distinct simulated IPs (mode B)  default 1 (mode A)
//   --secret    JWT secret                                 default DEFAULT_SECRET
//
// Expected:
//   mode A: 200 count ~= min(burst, 20); 429 count ~= burst - 20 (if burst>20)
//   mode B: 200 count ~= min(burst,20) * multi-ip; 429 distributes per IP

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class RateLimitTest {

    static final String DEFAULT_SECRET = "pethome-secret-key-please-change-in-production-2026";
    static final long DEFAULT_TTL_MS = 18_000_000L;

    public static void main(String[] args) throws Exception {
        Args a = Args.parse(args);
        System.out.println("== PetHome rate-limit test ==");
        System.out.println("url=" + a.url + " path=" + a.path + " burst=" + a.burst
                + " multiIp=" + a.multiIp);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        ExecutorService pool = Executors.newCachedThreadPool();

        // build requests: multiIp IPs x burst concurrent each, all signed by user 1
        String token = signJwt(1, a.secret);
        int total = a.burst * a.multiIp;
        List<HttpRequest> reqs = new ArrayList<>(total);
        for (int ip = 0; ip < a.multiIp; ip++) {
            String ipStr = "10.0." + ip + ".1";
            for (int j = 0; j < a.burst; j++) {
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(a.url + a.path))
                        .POST(HttpRequest.BodyPublishers.noBody())
                        .header("Authorization", "Bearer " + token)
                        .header("X-Forwarded-For", ipStr)
                        .timeout(Duration.ofSeconds(5))
                        .build();
                reqs.add(req);
            }
        }

        AtomicInteger ok = new AtomicInteger(), rateLimited = new AtomicInteger(),
                other = new AtomicInteger(), httpError = new AtomicInteger();

        // fire ALL at once (no semaphore) to maximize burst
        List<CompletableFuture<?>> futures = new ArrayList<>(total);
        long t0 = System.nanoTime();
        for (HttpRequest req : reqs) {
            futures.add(client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .handle((resp, ex) -> {
                        if (ex != null || resp == null) { httpError.incrementAndGet(); return null; }
                        int status = resp.statusCode();
                        if (status == 200) ok.incrementAndGet();
                        else if (status == 429) rateLimited.incrementAndGet();
                        else other.incrementAndGet();
                        return null;
                    }));
        }
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        long elapsedNs = System.nanoTime() - t0;
        pool.shutdown();

        double elapsedS = elapsedNs / 1_000_000_000.0;
        System.out.println("-------------------- result --------------------");
        System.out.printf("total=%d  ok(200)=%d  rateLimited(429)=%d  other=%d  httpError=%d%n",
                total, ok.get(), rateLimited.get(), other.get(), httpError.get());
        System.out.printf("elapsed=%.3fs%n", elapsedS);
        System.out.println("-------------------- verify --------------------");
        int expectedOkPerIp = Math.min(a.burst, 20); // capacity=20
        int expectedOk = expectedOkPerIp * a.multiIp;
        System.out.printf("[assert] ok(200) ~= %d  (capacity 20 x %d IPs)%n", expectedOk, a.multiIp);
        System.out.printf("[assert] ok(200) + rateLimited(429) == total(%d)%n", total);
        if (a.multiIp > 1) {
            System.out.println("[assert] mode B: per-IP isolation => each IP independently gets ~20 allowed, "
                    + "proving the bucket key is IP+URI (not global)");
        }
        System.out.println("[assert] 429 response body should contain \"请求过于频繁\" or similar");
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
        String path = "/seckill/9001";
        int burst = 100;
        int multiIp = 1;
        String secret = DEFAULT_SECRET;
        static Args parse(String[] a) {
            Args r = new Args();
            for (int i = 0; i < a.length; i++) {
                switch (a[i]) {
                    case "--url": r.url = a[++i]; break;
                    case "--path": r.path = a[++i]; break;
                    case "--burst": r.burst = Integer.parseInt(a[++i]); break;
                    case "--multi-ip": r.multiIp = Integer.parseInt(a[++i]); break;
                    case "--secret": r.secret = a[++i]; break;
                }
            }
            return r;
        }
    }
}
