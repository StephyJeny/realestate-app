import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import { SITE_URL, absoluteUrl } from "./site";

describe("absoluteUrl", () => {
    it("prefixes site-relative paths with the site URL", () => {
        expect(absoluteUrl("/images/a.png")).toBe(`${SITE_URL}/images/a.png`);
        expect(absoluteUrl("images/a.png")).toBe(`${SITE_URL}/images/a.png`);
    });

    it("leaves absolute URLs untouched", () => {
        expect(absoluteUrl("https://cdn.example.com/a.png")).toBe("https://cdn.example.com/a.png");
    });

    it("has no trailing slash on the site URL", () => {
        expect(SITE_URL.endsWith("/")).toBe(false);
    });
});

describe("robots.txt", () => {
    const result = robots();
    const rule = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    const disallow = ([] as string[]).concat(rule.disallow ?? []);

    it("points crawlers at the sitemap", () => {
        expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    });

    it.each(["/api/", "/dashboard", "/profile", "/messages", "/auth/"])("blocks private area %s", (path) => {
        expect(disallow).toContain(path);
    });

    it("does not block public listing pages", () => {
        expect(disallow.some((p) => "/properties/123".startsWith(p))).toBe(false);
    });
});
