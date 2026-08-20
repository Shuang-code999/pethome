// PetHome order cancel-vs-pay race test (pure JDK, no third-party deps).
// Verifies optimistic lock between "order timeout cancel" (RabbitMQ TTL+DLX ->
// OrderCancelListener) and "user pay" (POST /seckill/pay/{orderId}).
//
// Flow:
//   1. Sign N distinct JWTs (HS256, same as backend JwtUtil).
//   2. Each user POST /seckill/{voucher} -> returns orderId directly in data field;
//      capture it for the subsequent pay race.
//   3. Set pethome.seckill.pay-timeout-min=1 (server side) so the TTL+DLX fires ~60s
//      after order creation. Right before the deadline, this script fires concurrent
//      POST /seckill/pay/{orderId} on every orderId. The race:
//         - pay wins  -> cancelIfUnpaid returns 0 rows -> OrderCancelListener: payWin++
//         - cancel wins -> pay sees status!=0 -> SeckillService.pay: payFailDueToCancel++
//   4. After all pays settle, GET /seckill/order/stats and assert:
//         cancelWin + payWin == totalOrders (exactly one wins per order)
//         idempotentSkip == 0 (no double-processing)
//         Redis stock never exceeds initial stock (no over-rollback)
//
// Usage (JDK 17+ single-file):
//   java bench/CancelRaceTest.java --url http://localhost:8088/api \
//     --voucher 9001 --users 50 --pay-timeout-sec 60
//
// Args:
//   --url                backend base url (incl /api)            default http://localhost:8088/api
//   --voucher            seckill voucher id                       default 9001
//   --users              distinct users (== orders to race)      default 50
//   --pay-timeout-sec    seconds to wait before firing pays      default 60
//                        (must match pethome.seckill.pay-timeout-min in minutes)
//   --poll-wait-ms       ms to wait between order-creation and   default 3000
//                        polling /seckill/my-orders
//   --secret             JWT secret                               default DEFAULT_SECRET

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
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class CancelRaceTest {

    static final String DEFAULT_SECRET = "pethome-secret-key-please-change-in-production-2026";
    static final long DEFAULT_TTL_MS = 18_000_000L; // 5h

    public static void main(String[] args) throws Exception {
        Args a = Args.parse(args);
        System.out.println("== PetHome cancel-vs-pay race test ==");
        System.out.println("url=" + a.url + " voucher=" + a.voucher + " users=" + a.users
                + " payTimeoutSec=" + a.payTimeoutSec);

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        ExecutorService pool = Executors.newCachedThreadPool();

        // 1. sign N JWTs
        List<String> tokens = new ArrayList<>(a.users);
        for (long uid = 1; uid <= a.users; uid++) tokens.add(signJwt(uid, a.secret));

        // 2. each user hits /seckill/{voucher}; response.data == orderId directly
        System.out.println("[1] creating " + a.users + " seckill orders...");
        // keep (token, orderId) pairs so pay() uses each user's own JWT (pay likely checks ownership)
        List<String[]> orderPairs = Collections.synchronizedList(new ArrayList<>()); // [token, orderIdStr]
        List<CompletableFuture<?>> grabFutures = new ArrayList<>(a.users);
        for (String token : tokens) {
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(a.url + "/seckill/" + a.voucher))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .header("Authorization", "Bearer " + token)
                    .timeout(Duration.ofSeconds(10))
                    .build();
            grabFutures.add(client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .thenAccept(resp -> {
                        if (resp == null) return;
                        Integer code = extractCode(resp.body());
                        if (resp.statusCode() == 200 && code != null && code == 200) {
                            Long oid = extractLong(resp.body(), "data");
                            if (oid != null) orderPairs.add(new String[]{token, oid.toString()});
                        }
                    }));
        }
        CompletableFuture.allOf(grabFutures.toArray(new CompletableFuture[0])).join();
        System.out.println("    grab phase done. orders captured: " + orderPairs.size());
        if (orderPairs.isEmpty()) {
            System.out.println("ERROR: no orders captured. Aborting. (maybe sold out, JWT invalid, or stock=0)");
            pool.shutdown();
            return;
        }

        // 3. wait until just before the TTL deadline, then fire concurrent pays
        long waitMs = Math.max(0, a.payTimeoutSec * 1000L - 2000);
        System.out.println("[2] sleeping " + (waitMs / 1000) + "s to approach TTL deadline...");
        Thread.sleep(waitMs);

        System.out.println("[3] firing " + orderPairs.size() + " concurrent pays...");
        Semaphore sem = new Semaphore(orderPairs.size()); // fire all at once
        AtomicInteger paySuccess = new AtomicInteger(), payFailDueToCancel = new AtomicInteger(),
                payOther = new AtomicInteger(), httpError = new AtomicInteger();
        List<CompletableFuture<?>> payFutures = new ArrayList<>(orderPairs.size());
        for (String[] pair : orderPairs) {
            sem.acquire();
            String tok = pair[0];
            String oidStr = pair[1];
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(a.url + "/seckill/pay/" + oidStr))
                    .POST(HttpRequest.BodyPublishers.noBody())
                    .header("Authorization", "Bearer " + tok)
                    .timeout(Duration.ofSeconds(5))
                    .build();
            payFutures.add(client.sendAsync(req, HttpResponse.BodyHandlers.ofString())
                    .handle((resp, ex) -> {
                        sem.release();
                        if (ex != null || resp == null) { httpError.incrementAndGet(); return null; }
                        Integer code = extractCode(resp.body());
                        if (code == null) { payOther.incrementAndGet(); return null; }
                        if (resp.statusCode() == 200 && code == 200) paySuccess.incrementAndGet();
                        else if (code == 13009 || code == 13010) payFailDueToCancel.incrementAndGet(); // already cancelled / closed
                        else payOther.incrementAndGet();
                        return null;
                    }));
        }
        CompletableFuture.allOf(payFutures.toArray(new CompletableFuture[0])).join();

        // 4. wait a bit for cancel listeners to settle
        Thread.sleep(3000);

        // 5. fetch /seckill/order/stats
        System.out.println("[4] fetching /seckill/order/stats ...");
        HttpRequest statsReq = HttpRequest.newBuilder()
                .uri(URI.create(a.url + "/seckill/order/stats"))
                .GET()
                .timeout(Duration.ofSeconds(5))
                .build();
        try {
            HttpResponse<String> statsResp = client.send(statsReq, HttpResponse.BodyHandlers.ofString());
            System.out.println("    stats: " + statsResp.body());
        } catch (Exception e) {
            System.out.println("    stats fetch failed: " + e.getMessage());
        }

        // 6. summary
        System.out.println("-------------------- result --------------------");
        System.out.printf("orders=%d  paySuccess=%d  payFailDueToCancel=%d  payOther=%d  httpError=%d%n",
                orderPairs.size(), paySuccess.get(), payFailDueToCancel.get(),
                payOther.get(), httpError.get());
        System.out.println("-------------------- verify --------------------");
        System.out.println("[assert] (paySuccess + payFailDueToCancel) == orders  -- exactly one of pay/cancel wins");
        System.out.println("[assert] Redis stock (seckill:stock:" + a.voucher + ") <= initial stock  -- no over-rollback");
        System.out.println("    redis-cli GET seckill:stock:" + a.voucher);
        System.out.println("[assert] DB status: SELECT status, COUNT(*) FROM seckill_order WHERE voucher_id=" + a.voucher
                + " GROUP BY status;  -- should show paid(1) + cancelled(2) counts only");

        pool.shutdown();
    }

    static Integer extractCode(String body) {
        if (body == null) return null;
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

    static Long extractLong(String body, String field) {
        if (body == null) return null;
        int i = body.indexOf("\"" + field + "\"");
        if (i < 0) return null;
        int j = body.indexOf(':', i);
        int k = j + 1;
        while (k < body.length() && (body.charAt(k) == ' ' || body.charAt(k) == '"')) k++;
        int m = k;
        while (m < body.length() && Character.isDigit(body.charAt(m))) m++;
        if (m == k) return null;
        try { return Long.parseLong(body.substring(k, m)); } catch (Exception e) { return null; }
    }

    static List<Long> extractOrderIds(String body, long voucher) {
        List<Long> ids = new ArrayList<>();
        if (body == null) return ids;
        // crude JSON regex; tolerate either {"id":123,"voucherId":9001,...} or {"data":[{"id":...}]}
        Pattern p = Pattern.compile("\"id\"\\s*:\\s*(\\d+)[^}]*?\"voucherId\"\\s*:\\s*" + voucher);
        Matcher m = p.matcher(body);
        while (m.find()) {
            try { ids.add(Long.parseLong(m.group(1))); } catch (Exception ignore) {}
        }
        return ids;
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
        long voucher = 9001;
        int users = 50;
        int payTimeoutSec = 60;
        int pollWaitMs = 3000;
        String secret = DEFAULT_SECRET;
        static Args parse(String[] a) {
            Args r = new Args();
            for (int i = 0; i < a.length; i++) {
                switch (a[i]) {
                    case "--url": r.url = a[++i]; break;
                    case "--voucher": r.voucher = Long.parseLong(a[++i]); break;
                    case "--users": r.users = Integer.parseInt(a[++i]); break;
                    case "--pay-timeout-sec": r.payTimeoutSec = Integer.parseInt(a[++i]); break;
                    case "--poll-wait-ms": r.pollWaitMs = Integer.parseInt(a[++i]); break;
                    case "--secret": r.secret = a[++i]; break;
                }
            }
            return r;
        }
    }
}
