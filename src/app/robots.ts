import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * Keep crawlers on public marketing and listing pages. Signed-in areas, auth flows
 * and API routes are excluded (they're either private or useless in search results).
 */
export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: ["/api/", "/dashboard", "/profile", "/messages", "/auth/", "/offline", "/collections/"],
            },
        ],
        sitemap: `${SITE_URL}/sitemap.xml`,
        host: SITE_URL,
    };
}
