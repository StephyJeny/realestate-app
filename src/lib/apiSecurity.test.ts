// @vitest-environment node
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { enforceRateLimit, escapeHtml, getClientIp, isValidEmail, sanitizeHeaderValue } from "./apiSecurity";

function requestFrom(ip?: string, header = "x-forwarded-for") {
    const headers = new Headers();
    if (ip) headers.set(header, ip);
    return new NextRequest("http://localhost/api/test", { headers });
}

describe("escapeHtml", () => {
    it("neutralises markup so user input can't inject HTML into emails", () => {
        expect(escapeHtml(`<script>alert("x")</script>`)).toBe(
            "&lt;script&gt;alert(&quot;x&quot;)&lt;&#x2F;script&gt;"
        );
    });

    it("escapes ampersands and single quotes", () => {
        expect(escapeHtml("Tom & Jerry's")).toBe("Tom &amp; Jerry&#39;s");
    });

    it("returns an empty string for null / undefined", () => {
        expect(escapeHtml(null)).toBe("");
        expect(escapeHtml(undefined)).toBe("");
    });
});

describe("sanitizeHeaderValue", () => {
    it("strips CR/LF to block email header injection", () => {
        expect(sanitizeHeaderValue("Hello\r\nBcc: victim@example.com")).toBe("Hello Bcc: victim@example.com");
    });

    it("truncates to the max length", () => {
        expect(sanitizeHeaderValue("a".repeat(500), 10)).toHaveLength(10);
    });
});

describe("isValidEmail", () => {
    it.each(["buyer@example.com", "  jane.doe+homes@mail.co.ke  "])("accepts %s", (email) => {
        expect(isValidEmail(email)).toBe(true);
    });

    it.each(["", "no-at-sign", "a@b", "bad <x>@evil.com", 42, null, `${"a".repeat(250)}@x.com`])(
        "rejects %s",
        (email) => {
            expect(isValidEmail(email)).toBe(false);
        }
    );
});

describe("getClientIp", () => {
    it("uses the first address in x-forwarded-for", () => {
        expect(getClientIp(requestFrom("203.0.113.5, 10.0.0.1"))).toBe("203.0.113.5");
    });

    it("falls back to x-real-ip", () => {
        expect(getClientIp(requestFrom("198.51.100.7", "x-real-ip"))).toBe("198.51.100.7");
    });

    it("falls back to localhost when no headers are present", () => {
        expect(getClientIp(requestFrom())).toBe("127.0.0.1");
    });
});

describe("enforceRateLimit", () => {
    it("allows requests up to the limit, then returns 429 with Retry-After", async () => {
        const req = requestFrom("192.0.2.10");
        const bucket = `test-limit-${Math.random()}`;

        for (let i = 0; i < 3; i++) {
            expect(enforceRateLimit(req, bucket, 3, 60_000)).toBeNull();
        }

        const blocked = enforceRateLimit(req, bucket, 3, 60_000);
        expect(blocked).not.toBeNull();
        expect(blocked!.status).toBe(429);
        expect(Number(blocked!.headers.get("Retry-After"))).toBeGreaterThan(0);
        const body = await blocked!.json();
        expect(body.success).toBe(false);
    });

    it("tracks each IP separately", () => {
        const bucket = `test-ip-${Math.random()}`;
        expect(enforceRateLimit(requestFrom("192.0.2.20"), bucket, 1, 60_000)).toBeNull();
        expect(enforceRateLimit(requestFrom("192.0.2.20"), bucket, 1, 60_000)).not.toBeNull();
        expect(enforceRateLimit(requestFrom("192.0.2.21"), bucket, 1, 60_000)).toBeNull();
    });

    it("resets after the window expires", async () => {
        const req = requestFrom("192.0.2.30");
        const bucket = `test-window-${Math.random()}`;
        expect(enforceRateLimit(req, bucket, 1, 20)).toBeNull();
        expect(enforceRateLimit(req, bucket, 1, 20)).not.toBeNull();
        await new Promise((r) => setTimeout(r, 30));
        expect(enforceRateLimit(req, bucket, 1, 20)).toBeNull();
    });
});
