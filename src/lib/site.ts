/**
 * Canonical public URL of the site, used for sitemap, robots, canonical links and
 * structured data. Override per environment with `NEXT_PUBLIC_SITE_URL`.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://realestate-app-three-theta.vercel.app").replace(/\/+$/, "");

/** Turn a site-relative path (e.g. `/images/x.png`) into an absolute URL. Absolute URLs pass through. */
export function absoluteUrl(pathOrUrl: string): string {
    if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
    return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}
