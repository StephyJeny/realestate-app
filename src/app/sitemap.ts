import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { sampleProperties } from "@/lib/data";
import { neighborhoods } from "@/lib/neighborhoods";
import { blogPosts } from "@/lib/blog";
import { offPlanProjects } from "@/lib/projects";
import { getPropertiesPage, getApprovedAgents } from "@/lib/firestore";

/** Rebuild the sitemap at most once an hour so new listings get picked up. */
export const revalidate = 3600;

/** Upper bound on live listings included, to keep the sitemap fast to generate. */
const MAX_LIVE_LISTINGS = 2000;

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
    { path: "", changeFrequency: "daily", priority: 1 },
    { path: "/properties", changeFrequency: "hourly", priority: 0.9 },
    { path: "/projects", changeFrequency: "weekly", priority: 0.85 },
    { path: "/neighborhoods", changeFrequency: "weekly", priority: 0.8 },
    { path: "/agents", changeFrequency: "daily", priority: 0.8 },
    { path: "/mortgage-calculator", changeFrequency: "monthly", priority: 0.7 },
    { path: "/estimate", changeFrequency: "monthly", priority: 0.7 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
    { path: "/compare", changeFrequency: "monthly", priority: 0.5 },
    { path: "/quiz", changeFrequency: "monthly", priority: 0.5 },
    { path: "/about", changeFrequency: "yearly", priority: 0.5 },
    { path: "/contact", changeFrequency: "yearly", priority: 0.5 },
    { path: "/faq", changeFrequency: "monthly", priority: 0.5 },
    { path: "/legal/privacy", changeFrequency: "yearly", priority: 0.3 },
    { path: "/legal/terms", changeFrequency: "yearly", priority: 0.3 },
];

type FirestoreTimestampLike = { seconds: number } | undefined | null;

function toDate(ts: FirestoreTimestampLike): Date | undefined {
    return ts && typeof ts.seconds === "number" ? new Date(ts.seconds * 1000) : undefined;
}

async function getLiveListingEntries(): Promise<MetadataRoute.Sitemap> {
    const entries: MetadataRoute.Sitemap = [];
    try {
        let cursor = null;
        do {
            const page: Awaited<ReturnType<typeof getPropertiesPage>> = await getPropertiesPage(500, cursor);
            for (const p of page.items) {
                if (!p.id) continue;
                entries.push({
                    url: `${SITE_URL}/properties/${p.id}`,
                    lastModified: toDate(p.updatedAt as FirestoreTimestampLike) || toDate(p.createdAt as FirestoreTimestampLike),
                    // Sold/rented listings rarely change; active ones do
                    changeFrequency: p.status === "sold" || p.status === "rented" ? "monthly" : "daily",
                    priority: p.status === "sold" || p.status === "rented" ? 0.4 : 0.8,
                });
            }
            cursor = page.hasMore ? page.cursor : null;
        } while (cursor && entries.length < MAX_LIVE_LISTINGS);
    } catch (err) {
        // Sitemap must still render if Firestore is unreachable at build time
        console.warn("sitemap: could not load live listings", err);
    }
    return entries;
}

async function getAgentEntries(): Promise<MetadataRoute.Sitemap> {
    try {
        const agents = await getApprovedAgents();
        return agents
            .filter((a) => a.uid)
            .map((a) => ({
                url: `${SITE_URL}/agents/${a.uid}`,
                lastModified: toDate(a.updatedAt as FirestoreTimestampLike),
                changeFrequency: "weekly" as const,
                priority: 0.6,
            }));
    } catch (err) {
        console.warn("sitemap: could not load agents", err);
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
        url: `${SITE_URL}${r.path}`,
        lastModified: now,
        changeFrequency: r.changeFrequency,
        priority: r.priority,
    }));

    const sampleListingEntries: MetadataRoute.Sitemap = sampleProperties.map((p) => ({
        url: `${SITE_URL}/properties/${p.id}`,
        lastModified: p.createdAt ? new Date(p.createdAt) : undefined,
        changeFrequency: "weekly",
        priority: 0.7,
    }));

    const neighborhoodEntries: MetadataRoute.Sitemap = neighborhoods.map((n) => ({
        url: `${SITE_URL}/neighborhoods/${n.id}`,
        changeFrequency: "monthly",
        priority: 0.6,
    }));

    const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
        url: `${SITE_URL}/blog/${post.slug}`,
        lastModified: new Date(post.publishedAt),
        changeFrequency: "monthly",
        priority: 0.6,
    }));

    const projectEntries: MetadataRoute.Sitemap = offPlanProjects.map((project) => ({
        url: `${SITE_URL}/projects/${project.slug}`,
        lastModified: new Date(project.launchDate),
        changeFrequency: "weekly",
        priority: 0.8,
    }));

    const [liveListingEntries, agentEntries] = await Promise.all([getLiveListingEntries(), getAgentEntries()]);

    // De-duplicate by URL (a live listing can share an id with sample data)
    const seen = new Set<string>();
    return [
        ...staticEntries,
        ...projectEntries,
        ...liveListingEntries,
        ...sampleListingEntries,
        ...neighborhoodEntries,
        ...blogEntries,
        ...agentEntries,
    ].filter((entry) => {
        if (seen.has(entry.url)) return false;
        seen.add(entry.url);
        return true;
    });
}
