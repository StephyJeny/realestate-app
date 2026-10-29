/**
 * Shared Live + Sample Property Inventory & AI Matching Engine
 * Connects VueBot (/api/ai/chat) and DreamHomeQuiz (/quiz) to live agent-uploaded
 * Firestore properties while gracefully falling back to sampleProperties.
 */

import { sampleProperties, Property } from "./data";
import type { FirestoreProperty } from "./firestore";
import { decodeFirestoreFields } from "./apiSecurity";

export interface QuizAnswersInput {
    goal: string;
    vibe: string;
    bedrooms: string;
    budget: string;
    amenities: string[];
}

export interface QuizMatchResult {
    property: Property;
    score: number;
    matchReasons: string[];
    isLiveListing: boolean;
}

const DISCOVERABLE_STATUSES = new Set([
    "active",
    "price_reduced",
    "under_offer",
]);

/**
 * Converts a FirestoreProperty document into the unified `Property` shape.
 */
export function firestorePropertyToProperty(fp: FirestoreProperty): Property {
    const id = fp.id || "";
    const title = fp.title || "Untitled Property";
    const createdAtSeconds =
        fp.createdAt && typeof (fp.createdAt as { seconds?: number }).seconds === "number"
            ? (fp.createdAt as { seconds: number }).seconds
            : null;

    return {
        id,
        title,
        slug: title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, ""),
        description: fp.description || "",
        type: fp.type || "apartment",
        listingType: fp.listingType || "sale",
        price: Number(fp.price) || 0,
        currency: fp.currency || "KES",
        bedrooms: Number(fp.bedrooms) || 0,
        bathrooms: Number(fp.bathrooms) || 0,
        area: Number(fp.area) || 0,
        yearBuilt: Number(fp.yearBuilt) || 2024,
        address: fp.address || "",
        location: {
            city: fp.city || "Nairobi",
            neighborhood: fp.neighborhood || "",
        },
        amenities: Array.isArray(fp.amenities) ? fp.amenities : [],
        images:
            Array.isArray(fp.images) && fp.images.length > 0
                ? fp.images
                : ["/images/property-1.png"],
        agentName: fp.agentName || "EstateVue Verified Agent",
        agentImage: "/images/agent-avatar.png",
        agentPhone: fp.agentPhone || "",
        agentEmail: fp.agentEmail || "",
        status: fp.status || "active",
        isFeatured: Boolean(fp.isFeatured),
        virtualTourUrl: fp.virtualTourUrl,
        views: Number(fp.views) || 0,
        favorites: Number(fp.favorites) || 0,
        createdAt: createdAtSeconds
            ? new Date(createdAtSeconds * 1000).toISOString()
            : new Date().toISOString(),
    };
}

/**
 * Merges live Firestore properties ahead of static sampleProperties,
 * deduplicating by `id` and excluding sold/rented/pending listings by default.
 */
export function mergeLiveAndSampleProperties(
    liveFirestoreProps: FirestoreProperty[],
    samples: Property[] = sampleProperties,
    includeSoldOrRented = false
): { inventory: Property[]; liveIds: Set<string> } {
    const seen = new Set<string>();
    const liveIds = new Set<string>();
    const merged: Property[] = [];

    for (const fp of liveFirestoreProps) {
        if (!fp.id) continue;
        const status = fp.status || "active";
        if (!includeSoldOrRented && !DISCOVERABLE_STATUSES.has(status)) continue;
        const normalized = firestorePropertyToProperty(fp);
        if (!seen.has(normalized.id)) {
            seen.add(normalized.id);
            liveIds.add(normalized.id);
            merged.push(normalized);
        }
    }

    for (const sp of samples) {
        if (!sp.id || seen.has(sp.id)) continue;
        if (!includeSoldOrRented && !DISCOVERABLE_STATUSES.has(sp.status)) continue;
        seen.add(sp.id);
        merged.push(sp);
    }

    return { inventory: merged, liveIds };
}

// Short server-side memory cache (60s) so rapid chat messages don't hammer Firestore REST
let cachedServerLiveProps: { ts: number; items: FirestoreProperty[] } | null = null;
const SERVER_CACHE_TTL_MS = 60_000;

/**
 * Fetches live public listings via the Firestore REST API on the server
 * (safe in Route Handlers even without Firebase Admin credentials).
 */
export async function fetchLiveFirestorePropertiesServer(
    maxItems = 80
): Promise<FirestoreProperty[]> {
    const now = Date.now();
    if (cachedServerLiveProps && now - cachedServerLiveProps.ts < SERVER_CACHE_TTL_MS) {
        return cachedServerLiveProps.items;
    }

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId || projectId === "your_project_id_here") {
        return [];
    }

    try {
        const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(
            projectId
        )}/databases/(default)/documents/properties?pageSize=${Math.min(100, maxItems)}`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(url, {
            cache: "no-store",
            signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!res.ok) return [];
        const data = await res.json();
        const rawDocs: Array<{ name?: string; fields?: Record<string, unknown> }> =
            Array.isArray(data?.documents) ? data.documents : [];

        const parsed: FirestoreProperty[] = [];
        for (const docItem of rawDocs) {
            if (!docItem?.fields) continue;
            const decoded = decodeFirestoreFields(
                docItem.fields as Parameters<typeof decodeFirestoreFields>[0]
            );
            const docId = docItem.name ? docItem.name.split("/").pop() || "" : "";
            if (!docId || !decoded.title) continue;

            parsed.push({
                id: docId,
                title: String(decoded.title || ""),
                description: String(decoded.description || ""),
                type: (decoded.type as FirestoreProperty["type"]) || "apartment",
                listingType: (decoded.listingType as FirestoreProperty["listingType"]) || "sale",
                price: Number(decoded.price) || 0,
                currency: String(decoded.currency || "KES"),
                bedrooms: Number(decoded.bedrooms) || 0,
                bathrooms: Number(decoded.bathrooms) || 0,
                area: Number(decoded.area) || 0,
                yearBuilt: Number(decoded.yearBuilt) || 2024,
                address: String(decoded.address || ""),
                city: String(decoded.city || "Nairobi"),
                neighborhood: String(decoded.neighborhood || ""),
                amenities: Array.isArray(decoded.amenities)
                    ? decoded.amenities.map(String)
                    : [],
                images: Array.isArray(decoded.images)
                    ? decoded.images.map(String)
                    : [],
                virtualTourUrl: decoded.virtualTourUrl ? String(decoded.virtualTourUrl) : undefined,
                agentId: String(decoded.agentId || ""),
                agentName: String(decoded.agentName || "Agent"),
                agentEmail: String(decoded.agentEmail || ""),
                agentPhone: String(decoded.agentPhone || ""),
                status: (decoded.status as FirestoreProperty["status"]) || "active",
                isFeatured: Boolean(decoded.isFeatured),
                views: Number(decoded.views) || 0,
                favorites: Number(decoded.favorites) || 0,
            });
        }

        cachedServerLiveProps = { ts: now, items: parsed };
        return parsed;
    } catch {
        return [];
    }
}

export async function getCombinedInventoryServer(): Promise<{
    inventory: Property[];
    liveIds: Set<string>;
    liveCount: number;
}> {
    const liveItems = await fetchLiveFirestorePropertiesServer(80);
    const { inventory, liveIds } = mergeLiveAndSampleProperties(liveItems, sampleProperties);
    return {
        inventory,
        liveIds,
        liveCount: liveIds.size,
    };
}

const STOP_WORDS = new Set([
    "want",
    "looking",
    "find",
    "show",
    "need",
    "with",
    "that",
    "this",
    "from",
    "have",
    "what",
    "where",
    "which",
    "property",
    "properties",
    "home",
    "homes",
    "kenya",
    "please",
    "under",
    "below",
    "around",
    "about",
]);

/**
 * Smart multi-criteria property matcher for conversational AI queries.
 */
export function matchInventoryForChat(
    query: string,
    inventory: Property[],
    maxResults = 4
): Property[] {
    const lower = query.toLowerCase().trim();
    if (!lower) return [];

    // Parse structured hints from natural language
    const wantsRent = /\b(rent|rental|lease|letting|monthly)\b/.test(lower);
    const wantsSale = /\b(buy|sale|purchase|invest|own)\b/.test(lower);

    const bedMatch = lower.match(/(\d+)\s*(?:\+?\s*)?(?:bed|beds|bedroom|bedrooms|br|bd)\b/);
    const targetBeds = bedMatch ? parseInt(bedMatch[1], 10) : null;

    const maxPriceMatch = lower.match(
        /(?:under|below|max|less than|up to)\s*(?:kes|ksh)?\s*(\d+(?:\.\d+)?)\s*(m|million|k|thousand)?/i
    );
    let maxPriceKES: number | null = null;
    if (maxPriceMatch) {
        let val = parseFloat(maxPriceMatch[1]);
        const unit = (maxPriceMatch[2] || "").toLowerCase();
        if (unit.startsWith("m")) val *= 1_000_000;
        else if (unit.startsWith("k") || unit.startsWith("thousand")) val *= 1_000;
        else if (val < 1000) val *= 1_000_000;
        maxPriceKES = val;
    }

    const typeAliases: Array<{ pattern: RegExp; type: Property["type"] }> = [
        { pattern: /\b(apartment|apartments|flat|penthouse|studio|condo)\b/, type: "apartment" },
        { pattern: /\b(villa|villas|mansion)\b/, type: "villa" },
        { pattern: /\b(townhouse|townhouses|maisonette)\b/, type: "townhouse" },
        { pattern: /\b(house|houses|bungalow)\b/, type: "house" },
        { pattern: /\b(land|plot|plots|acre|shamba)\b/, type: "land" },
        { pattern: /\b(commercial|office|retail)\b/, type: "commercial" },
    ];
    const matchedType = typeAliases.find((t) => t.pattern.test(lower))?.type || null;

    const keywords = lower
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !/^\d+$/.test(w));

    const scored = inventory
        .map((p) => {
            let score = 0;
            const neighborhood = (p.location?.neighborhood || "").toLowerCase();
            const city = (p.location?.city || "").toLowerCase();
            const haystack = `${p.title} ${p.type} ${neighborhood} ${city} ${p.address} ${p.description} ${p.amenities.join(" ")}`.toLowerCase();

            if (wantsRent) {
                if (p.listingType === "rent") score += 25;
                else score -= 15;
            } else if (wantsSale) {
                if (p.listingType === "sale") score += 15;
                else score -= 10;
            }

            if (matchedType) {
                if (p.type === matchedType) score += 30;
                else score -= 10;
            }

            if (targetBeds !== null) {
                if (p.bedrooms === targetBeds) score += 28;
                else if (Math.abs(p.bedrooms - targetBeds) === 1) score += 8;
                else score -= 10;
            }

            if (maxPriceKES !== null) {
                if (p.price <= maxPriceKES) score += 25;
                else score -= 20;
            }

            if (neighborhood && lower.includes(neighborhood)) {
                score += 40;
            } else if (city && lower.includes(city)) {
                score += 22;
            }

            for (const kw of keywords) {
                if (haystack.includes(kw)) {
                    score += 8;
                }
            }

            if (/\b(affordable|budget|cheap|starter)\b/.test(lower) && p.price <= 25_000_000) {
                score += 20;
            }

            return { property: p, score };
        })
        .filter((item) => item.score >= 12)
        .sort((a, b) => b.score - a.score || Number(b.property.isFeatured) - Number(a.property.isFeatured));

    return scored.slice(0, maxResults).map((s) => s.property);
}

const QUIZ_VIBE_NEIGHBORHOODS: Record<string, { label: string; areas: string[] }> = {
    leafy: { label: "Leafy, Private & Expansive", areas: ["karen", "runda", "muthaiga", "loresho"] },
    cosmopolitan: { label: "Vibrant & Cosmopolitan", areas: ["westlands", "kilimani", "lavington", "kileleshwa", "riverside"] },
    coastal: { label: "Coastal Breeze & Oceanfront", areas: ["nyali", "diani", "mombasa", "shanzu", "bamburi", "malindi"] },
    hills: { label: "Elevated Hillside & Nature", areas: ["kitisuru", "tigoni", "nanyuki", "riat", "rosslyn"] },
};

const QUIZ_BEDROOMS: Record<string, { min: number; max: number }> = {
    "1-2": { min: 1, max: 2 },
    "3-4": { min: 3, max: 4 },
    "5+": { min: 5, max: 20 },
};

const QUIZ_BUDGETS: Record<string, { min?: number; max?: number }> = {
    under_35m: { max: 35_000_000 },
    "35m_80m": { min: 35_000_000, max: 80_000_000 },
    "80m_150m": { min: 80_000_000, max: 150_000_000 },
    above_150m: { min: 150_000_000 },
};

/**
 * Scores and ranks the combined live + sample property catalog for the 60-Second Dream Home Quiz.
 */
export function rankPropertiesForQuiz(
    inventory: Property[],
    answers: QuizAnswersInput,
    liveIds: Set<string> = new Set(),
    topN = 3
): QuizMatchResult[] {
    const vibeCfg = QUIZ_VIBE_NEIGHBORHOODS[answers.vibe];
    const bedCfg = QUIZ_BEDROOMS[answers.bedrooms];
    const budgetCfg = QUIZ_BUDGETS[answers.budget];

    // Prefer sale properties for ownership quiz, while keeping rentals eligible if inventory is small
    const candidates = inventory.filter((p) => p.listingType === "sale").length >= 3
        ? inventory.filter((p) => p.listingType === "sale")
        : inventory;

    const scored = candidates.map((p) => {
        let score = 50;
        const matchReasons: string[] = [];
        const locStr = `${p.location?.neighborhood || ""} ${p.location?.city || ""}`.toLowerCase();
        const amenitiesLower = (p.amenities || []).map((a) => a.toLowerCase());

        // 1. Ownership Goal alignment (+12)
        if (answers.goal === "family" && (p.bedrooms >= 3 || p.type === "townhouse" || p.type === "house" || p.type === "villa")) {
            score += 12;
            matchReasons.push(`Spacious ${p.type} layout tailored for family living`);
        } else if (answers.goal === "investment" && (p.type === "apartment" || locStr.includes("westlands") || locStr.includes("kilimani") || locStr.includes("nyali"))) {
            score += 12;
            matchReasons.push("High-velocity rental & executive Airbnb corridor");
        } else if (answers.goal === "vacation" && (locStr.includes("nyali") || locStr.includes("mombasa") || locStr.includes("diani") || amenitiesLower.some((a) => a.includes("ocean") || a.includes("pool")))) {
            score += 12;
            matchReasons.push("Resort-grade retreat ambiance & leisure appeal");
        } else if (answers.goal === "executive" && (p.type === "apartment" || p.type === "villa" || amenitiesLower.some((a) => a.includes("concierge") || a.includes("smart") || a.includes("gym")))) {
            score += 12;
            matchReasons.push("Executive finishes & lock-up-and-go convenience");
        }

        // 2. Neighborhood / Vibe match (+24)
        if (vibeCfg && vibeCfg.areas.some((area) => locStr.includes(area))) {
            score += 24;
            matchReasons.push(
                `Matches your ${vibeCfg.label} vibe in ${p.location.neighborhood || p.location.city}`
            );
        }

        // 3. Bedroom match (+15)
        if (bedCfg && p.bedrooms >= bedCfg.min && p.bedrooms <= bedCfg.max) {
            score += 15;
            matchReasons.push(`Optimal ${p.bedrooms}-bedroom spatial configuration`);
        }

        // 4. Budget match (+15)
        if (budgetCfg) {
            const withinBudget =
                (budgetCfg.min === undefined || p.price >= budgetCfg.min) &&
                (budgetCfg.max === undefined || p.price <= budgetCfg.max);
            if (withinBudget) {
                score += 15;
                matchReasons.push("Fits squarely within your target capital budget");
            }
        }

        // 5. Amenities match (up to +15)
        if (answers.amenities.length > 0) {
            const matchedCount = (p.amenities || []).filter((a) =>
                answers.amenities.some((chosen) => a.toLowerCase().includes(chosen.toLowerCase()))
            ).length;
            if (matchedCount > 0) {
                score += Math.min(15, matchedCount * 5);
                matchReasons.push(`Includes ${matchedCount} of your must-have lifestyle amenities`);
            }
        }

        const isLiveListing = liveIds.has(p.id);
        const clampedScore = Math.min(99, Math.max(68, score));

        return {
            property: p,
            score: clampedScore,
            matchReasons: matchReasons.slice(0, 4),
            isLiveListing,
        };
    });

    return scored
        .sort((a, b) => b.score - a.score || Number(b.isLiveListing) - Number(a.isLiveListing))
        .slice(0, topN);
}
