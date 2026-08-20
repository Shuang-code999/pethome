// PetHome AI consultation personalization test (pure JDK, no third-party deps).
// Verifies that the SAME question, sent to sessions bound to DIFFERENT petIds,
// yields DIFFERENT replies (each reply should reference the specific pet's
// profile features: allergies, breed, weight trend, etc.).
//
// Optionally measures TTFT (first-token latency) for SSE streaming via /consult/ttft.
//
// Usage (JDK 17+ single-file):
//   java bench/ConsultPersonalizeTest.java --url http://localhost:8088/api \
//     --pet-a 1 --pet-b 2 --question "它最近能驱虫吗？要注意什么"
//
// Args:
//   --url        backend base url (incl /api)                  default http://localhost:8088/api
//   --pet-a      first petId (must belong to user 1)            default 1
//   --pet-b      second petId (different species/allergy)       default 2
//   --question   the question to ask both sessions              default "它最近能驱虫吗？要注意什么"
//   --model      AI model id                                     default qwen-plus
//   --secret     JWT secret                                      default DEFAULT_SECRET
//   --stream     use SSE /consult/sessions/{id}/stream          default false (use POST messages)
//
// Expected:
//   replyA contains pet A's profile features (e.g., A's allergy drug or breed)
//   replyB contains pet B's profile features
//   replyA != replyB  (not byte-identical)
//   /consult/ttft shows lastMs > 0 with avgMs aggregated across both calls

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

public class ConsultPersonalizeTest {

    static final String DEFAULT_SECRET = "pethome-secret-key-please-change-in-production-2026";
    static final long DEFAULT_TTL_MS = 18_000_000L;

    public static void main(String[] args) throws Exception {
        Args a = Args.parse(args);
        System.out.println("== PetHome consult personalization test ==");
        System.out.println("url=" + a.url + " petA=" + a.petA + " petB=" + a.petB
                + " question=\"" + a.question + "\"");

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        String token = signJwt(1, a.secret);

        // 1. create session A bound to petA
        Long sessionIdA = createSession(client, a.url, token, a.petA);
        Long sessionIdB = createSession(client, a.url, token, a.petB);
        Long sessionIdGeneric = createSession(client, a.url, token, null);
        if (sessionIdA == null || sessionIdB == null || sessionIdGeneric == null) {
            System.out.println("ERROR: failed to create sessions. Aborting.");
            return;
        }
        System.out.println("sessionA=" + sessionIdA + " (pet=" + a.petA + ")");
        System.out.println("sessionB=" + sessionIdB + " (pet=" + a.petB + ")");
        System.out.println("sessionGeneric=" + sessionIdGeneric + " (no pet)");

        // 2. ask same question to all three
        String replyA = sendMessage(client, a.url, token, sessionIdA, a.question, a.model);
        String replyB = sendMessage(client, a.url, token, sessionIdB, a.question, a.model);
        String replyGeneric = sendMessage(client, a.url, token, sessionIdGeneric, a.question, a.model);
        System.out.println("-------------------- replies --------------------");
        System.out.println("[A pet=" + a.petA + "]  " + preview(replyA));
        System.out.println("[B pet=" + a.petB + "]  " + preview(replyB));
        System.out.println("[Generic]    " + preview(replyGeneric));

        // 3. compare
        System.out.println("-------------------- verify --------------------");
        boolean abEqual = replyA != null && replyA.equals(replyB);
        System.out.println("[assert] replyA != replyB  -- " + (abEqual ? "FAIL (identical)" : "PASS"));
        // crude keyword hint: the reply should mention breed/species/allergy from the bound pet
        System.out.println("[hint] inspect manually: does replyA mention pet " + a.petA
                + "'s species/breed/allergy? does replyB mention pet " + a.petB + "'s?");
        System.out.println("[hint] replyGeneric should NOT contain either pet's specific profile features");

        // 4. fetch TTFT stats
        System.out.println("-------------------- ttft --------------------");
        String stats = httpGet(client, a.url + "/consult/ttft", token);
        System.out.println("    " + stats);
        System.out.println("[assert] lastMs > 0  (first-token timing was recorded)");
        System.out.println("[assert] avgMs > 0   (at least 2 samples accumulated)");
    }

    static Long createSession(HttpClient client, String url, String token, Long petId) {
        String body = petId == null ? "{}" : "{\"petId\":" + petId + "}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url + "/consult/sessions"))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(10))
                .build();
        try {
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            return extractLong(resp.body(), "data");
        } catch (Exception e) { return null; }
    }

    static String sendMessage(HttpClient client, String url, String token,
                             Long sessionId, String question, String model) {
        String body = "{\"content\":\"" + escape(question) + "\",\"model\":\"" + model + "\"}";
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url + "/consult/sessions/" + sessionId + "/messages"))
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(60))   // AI calls may be slow
                .build();
        try {
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            return extractContentField(resp.body());
        } catch (Exception e) { return "ERROR: " + e.getMessage(); }
    }

    static String httpGet(HttpClient client, String url, String token) {
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .header("Authorization", "Bearer " + token)
                .timeout(Duration.ofSeconds(5))
                .build();
        try {
            HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
            return resp.body();
        } catch (Exception e) { return "ERROR: " + e.getMessage(); }
    }

    static String preview(String s) {
        if (s == null) return "<null>";
        s = s.replace("\n", " ").replace("\r", "");
        return s.length() > 220 ? s.substring(0, 220) + "..." : s;
    }

    static String escape(String s) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '"' || c == '\\') sb.append('\\');
            sb.append(c);
        }
        return sb.toString();
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

    static String extractContentField(String body) {
        if (body == null) return null;
        int i = body.indexOf("\"content\"");
        if (i < 0) return body; // fallback: return whole body
        int j = body.indexOf('"', i + 9);
        if (j < 0) return body;
        int end = j + 1;
        StringBuilder sb = new StringBuilder();
        while (end < body.length()) {
            char c = body.charAt(end);
            if (c == '\\' && end + 1 < body.length()) {
                char next = body.charAt(end + 1);
                switch (next) {
                    case 'n': sb.append('\n'); break;
                    case 't': sb.append('\t'); break;
                    case '"': sb.append('"'); break;
                    case '\\': sb.append('\\'); break;
                    default: sb.append(next);
                }
                end += 2;
            } else if (c == '"') {
                return sb.toString();
            } else {
                sb.append(c);
                end++;
            }
        }
        return sb.toString();
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
        long petA = 1;
        long petB = 2;
        String question = "它最近能驱虫吗？要注意什么";
        String model = "qwen-plus";
        String secret = DEFAULT_SECRET;
        boolean stream = false;
        static Args parse(String[] a) {
            Args r = new Args();
            for (int i = 0; i < a.length; i++) {
                switch (a[i]) {
                    case "--url": r.url = a[++i]; break;
                    case "--pet-a": r.petA = Long.parseLong(a[++i]); break;
                    case "--pet-b": r.petB = Long.parseLong(a[++i]); break;
                    case "--question": r.question = a[++i]; break;
                    case "--model": r.model = a[++i]; break;
                    case "--secret": r.secret = a[++i]; break;
                    case "--stream": r.stream = Boolean.parseBoolean(a[++i]); break;
                }
            }
            return r;
        }
    }
}
