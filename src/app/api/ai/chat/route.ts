import { NextRequest, NextResponse } from "next/server";
import type { Property } from "@/lib/data";
import { enforceRateLimit } from "@/lib/apiSecurity";
import {
    getCombinedInventoryServer,
    matchInventoryForChat,
} from "@/lib/liveInventory";
import { offPlanProjects } from "@/lib/projects";

interface ChatMessage {
    role: "user" | "assistant" | "model" | "system";
    content: string;
}

interface PropertyContext {
    title?: string;
    price?: number | string;
    location?: unknown;
    bedrooms?: number;
}

interface ChatRequestBody {
    message: string;
    history?: ChatMessage[];
    propertyContext?: PropertyContext;
}

// System Prompt for EstateVue AI Real Estate Consultant
const SYSTEM_PROMPT = `You are "VueBot", the elite AI Real Estate Consultant for EstateVue — Kenya's premier luxury and modern real estate platform.
You assist buyers, investors, tenants, diaspora clients, and sellers across Kenya (Nairobi, Mombasa, Kisumu, Nakuru, and beyond).

YOUR EXPERTISE & KENYAN REAL ESTATE KNOWLEDGE:
1. LOCATIONS & VIBES:
   - Karen (Nairobi): Leafy, spacious, equestrian, international schools (Brookhouse, Banda), high capital preservation.
   - Westlands (Nairobi): Commercial epicenter, nightlife, high-yield expat rentals and Airbnbs (8-12% yields).
   - Kilimani & Kileleshwa: High rental velocity, modern apartments, popular with young professionals.
   - Runda: Diplomatic blue-zone, UN corridor, secure gated compounds.
   - Nyali & Diani (Coast): Prime holiday villas, oceanfront living, peak season vacation rentals (10-14% yield).
2. KENYAN LEGAL & CONVEYANCING:
   - Land Registry: All Nairobi titles are digitized via ArdhiSasa (ardhisasa.lands.go.ke).
   - Stamp Duty: 4% for urban/municipality land & property; 2% for rural/agricultural land.
   - Land Control Board (LCB) consent required for freehold agricultural parcels.
   - Capital Gains Tax (CGT): 15% on property transfer net gain.
   - Valuation: Official government valuer assesses stamp duty payable.
3. FINANCIAL & MORTGAGE RULES OF THUMB:
   - Commercial mortgage rates in Kenya currently hover around 12% - 15% (KCB, Stanbic, NCBA, Co-op, Absa).
   - Standard minimum down payment: 10% to 20%.
   - Typical loan tenure: 15 to 25 years.
4. TONE & FORMAT:
   - Professional, warm, insightful, concise, and distinctly knowledgeable about Kenya.
   - Use clear bullet points when explaining complex figures or listing options.
   - Quote figures clearly in KES (Kenyan Shillings) or USD when relevant.
   - Encourage viewing bookings, off-plan milestone exploration (/projects), and using EstateVue's EstateEstimate™ AI valuation tool.`;

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_MESSAGE_LENGTH = 1000;
const MAX_HISTORY_TURNS = 8;

export async function POST(request: NextRequest) {
    try {
        // Rate limit: max 20 chat requests per minute per IP
        const rateLimitRes = enforceRateLimit(request, "ai-chat", 20, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const body: ChatRequestBody = await request.json();
        const rawMessage = typeof body.message === "string" ? body.message.trim() : "";

        if (!rawMessage) {
            return NextResponse.json(
                { success: false, message: "Message is required" },
                { status: 400 }
            );
        }

        const userMessage = rawMessage.slice(0, MAX_MESSAGE_LENGTH);

        // Fetch unified Live Firestore + Sample Property Inventory
        const { inventory, liveIds, liveCount } = await getCombinedInventoryServer();

        // Find relevant properties across both agent-uploaded live listings and curated samples
        const matchedProperties = matchInventoryForChat(userMessage, inventory, 4);

        // Build compact context slice (matched first, then newest live + featured listings, max 25)
        const promptCatalogMap = new Map<string, Property>();
        for (const p of matchedProperties) promptCatalogMap.set(p.id, p);
        for (const p of inventory) {
            if (promptCatalogMap.size >= 25) break;
            promptCatalogMap.set(p.id, p);
        }
        const promptCatalog = Array.from(promptCatalogMap.values());

        // 1. If GEMINI_API_KEY is available, call Google Gemini
        if (process.env.GEMINI_API_KEY) {
            try {
                const recentHistory = Array.isArray(body.history)
                    ? body.history
                          .slice(-MAX_HISTORY_TURNS)
                          .map((m) => `${m.role === "user" ? "User" : "VueBot"}: ${String(m.content || "").slice(0, 500)}`)
                          .join("\n")
                    : "";

                const propertyContextText =
                    body.propertyContext && typeof body.propertyContext === "object"
                        ? `\nCurrently Viewed Property:\n${JSON.stringify({
                              title: body.propertyContext.title,
                              price: body.propertyContext.price,
                              location: body.propertyContext.location,
                              bedrooms: body.propertyContext.bedrooms,
                          })}`
                        : "";

                const contents = [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `${SYSTEM_PROMPT}\n\nAvailable Properties on EstateVue (${liveCount} live agent-uploaded + featured catalog):\n${JSON.stringify(
                                    promptCatalog.map((p) => ({
                                        id: p.id,
                                        title: p.title,
                                        type: p.type,
                                        listingType: p.listingType,
                                        price: `KES ${p.price.toLocaleString()}${p.listingType === "rent" ? "/mo" : ""}`,
                                        location: `${p.location.neighborhood}, ${p.location.city}`,
                                        beds: p.bedrooms,
                                        baths: p.bathrooms,
                                        amenities: p.amenities.slice(0, 4),
                                        liveAgentListing: liveIds.has(p.id),
                                    })),
                                    null,
                                    2
                                )}\n\nFlagship Off-Plan Developments (/projects):\n${JSON.stringify(
                                    offPlanProjects.map((proj) => ({
                                        slug: proj.slug,
                                        name: proj.name,
                                        location: `${proj.neighborhood}, ${proj.city}`,
                                        completion: proj.completionQuarter,
                                        yieldPct: proj.expectedRentalYieldPct,
                                    }))
                                )}${propertyContextText}${recentHistory ? `\n\nRecent Conversation:\n${recentHistory}` : ""}\n\nUser Question: ${userMessage}`,
                            },
                        ],
                    },
                ];

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": process.env.GEMINI_API_KEY,
                        },
                        body: JSON.stringify({ contents }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (text) {
                        return NextResponse.json({
                            success: true,
                            reply: text,
                            properties:
                                matchedProperties.length > 0
                                    ? matchedProperties.map((p) => formatPropertySummary(p, liveIds.has(p.id)))
                                    : undefined,
                            inventoryMeta: { totalCount: inventory.length, liveCount },
                            source: "gemini-llm",
                        });
                    }
                }
            } catch (llmErr) {
                console.warn("Gemini LLM call failed, falling back to smart heuristic advisor:", llmErr);
            }
        }

        // 2. Intelligent Built-in Fallback Knowledge Engine (Contextual synthesis with live inventory)
        const fallbackReply = generateSmartAdvisorReply(userMessage, matchedProperties, inventory.length, liveCount);

        return NextResponse.json({
            success: true,
            reply: fallbackReply.text,
            options: fallbackReply.options,
            properties:
                matchedProperties.length > 0
                    ? matchedProperties.map((p) => formatPropertySummary(p, liveIds.has(p.id)))
                    : undefined,
            inventoryMeta: { totalCount: inventory.length, liveCount },
            source: "knowledge-engine",
        });
    } catch (error) {
        console.error("AI Chat API error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}

function formatPropertySummary(p: Property, isLive = false) {
    return {
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency || "KES",
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        location: `${p.location?.neighborhood || ""}, ${p.location?.city || "Kenya"}`.replace(/^,\s*/, ""),
        type: p.type,
        listingType: p.listingType,
        image: p.images?.[0] || "/images/property-1.png",
        isLive,
    };
}

function generateSmartAdvisorReply(
    query: string,
    matched: Property[],
    totalInventoryCount: number,
    liveCount: number
) {
    const lower = query.toLowerCase();

    // Off-plan inquiries
    if (lower.includes("off-plan") || lower.includes("off plan") || lower.includes("milestone") || lower.includes("escrow")) {
        return {
            text: `### 🏗️ Verified Off-Plan Developments & Escrow Protection

EstateVue tracks flagship off-plan developments in **Westlands**, **Karen**, and **Nyali** with ring-fenced bank escrow accounts:

* **Staged Payment Plans:** Typically **20% reservation/agreement deposit**, **60% construction milestone tranches**, and **20% upon key handover**.
* **Sectional Titles:** All featured developments comply with the **Sectional Properties Act 2020** for direct apartment titles.
* **Milestone Transparency:** Inspect dated engineer cube-test sign-offs and construction progress timelines before committing.`,
            options: [
                { label: "🏗️ Explore Off-Plan Projects", value: "go_projects" },
                { label: "🤖 Run EstateEstimate Valuation", value: "go_valuation" },
                { label: "👤 Talk to an Agent", value: "I want to talk to an agent" },
            ],
        };
    }

    // Legal / ArdhiSasa / Conveyance
    if (
        lower.includes("ardhisasa") ||
        lower.includes("title") ||
        lower.includes("stamp duty") ||
        lower.includes("legal") ||
        lower.includes("deed") ||
        lower.includes("due diligence")
    ) {
        return {
            text: `### ⚖️ Kenyan Property Legal & Due Diligence Guide

Here is the verified acquisition protocol for purchasing real estate in Kenya:

1. **Official Title Search (ArdhiSasa):**
   * Conduct an online official search via the Ministry of Lands portal (**ArdhiSasa**) to confirm registered ownership, encumbrances, bank charges, or court caveats.
2. **Rates & Land Rent Clearance:**
   * Ensure the vendor has paid up all county rates and national land rent, and holds valid clearance certificates.
3. **Stamp Duty & LSK Legal Fees:**
   * **4%** of market valuation for urban/municipality properties (Nairobi, Mombasa, Nakuru, Kisumu) or **2%** for agricultural/rural parcels, plus tiered LSK conveyancing fees.
4. **Independent Valuation:**
   * Check our **EstateEstimate™** tool to verify the asking price against recent transaction benchmarks.

Would you like us to connect you with an accredited Conveyancing Advocate on our panel?`,
            options: [
                { label: "🤖 Run EstateEstimate Valuation", value: "go_valuation" },
                { label: "👤 Talk to an Agent", value: "I want to talk to an agent" },
                { label: "🔍 View Available Listings", value: "search_properties" },
            ],
        };
    }

    // Mortgage / Financing
    if (
        lower.includes("mortgage") ||
        lower.includes("loan") ||
        lower.includes("interest") ||
        lower.includes("down payment") ||
        lower.includes("monthly payment")
    ) {
        return {
            text: `### 🏦 Mortgage & Financing Insights in Kenya

* **Interest Rates:** Prevailing Kenyan commercial bank mortgages (NCBA, Stanbic, KCB, Absa) typically range between **12% and 14.5% p.a.** (or ~9.5%–10% FCY for Diaspora mortgages).
* **Down Payment:** Most lenders require a minimum deposit of **10% to 20%** of the property purchase price.
* **Repayment Rule of Thumb:**
  For a **KES 25,000,000** apartment with 20% down (KES 5M deposit) over 25 years at 13%:
  * Estimated Monthly Installment: **~KES 227,000 / month**.
* **Pre-Approval:** You will need 6 months bank statements, KRA PIN certificate, and an employment letter or audited business accounts.`,
            options: [
                { label: "📊 Open Mortgage Calculator", value: "go_mortgage" },
                { label: "💰 Value a Property", value: "go_valuation" },
                { label: "🏠 Browse Affordable Homes", value: "search affordable" },
            ],
        };
    }

    // Valuation / How much is my home worth?
    if (
        lower.includes("valuation") ||
        lower.includes("worth") ||
        lower.includes("estimate") ||
        lower.includes("appraisal")
    ) {
        return {
            text: `### 🤖 Instant Property Valuation (EstateEstimate™)

You can value any property in Kenya in under 10 seconds using our proprietary **EstateEstimate™ AI engine**:

* **How it works:** It combines location benchmarks across Nairobi (Karen, Westlands, Kilimani, Runda), Mombasa, and Kisumu with finish quality, square footage, and amenities.
* **What you receive:**
  * Algorithmic market valuation range (Low, Mid, High).
  * Monthly rental income forecast & gross rental yield %.
  * Airbnb nightly potential & 2027 appreciation forecast.`,
            options: [
                { label: "⚡ Run EstateEstimate™ Now", value: "go_valuation" },
                { label: "👤 Schedule In-Person Valuation", value: "I want to talk to an agent" },
            ],
        };
    }

    // Specific location inquiries
    if (
        lower.includes("karen") ||
        lower.includes("westlands") ||
        lower.includes("kilimani") ||
        lower.includes("nyali") ||
        lower.includes("runda") ||
        lower.includes("diani")
    ) {
        const areaName = lower.includes("karen")
            ? "Karen"
            : lower.includes("westlands")
            ? "Westlands"
            : lower.includes("kilimani")
            ? "Kilimani"
            : lower.includes("nyali")
            ? "Nyali"
            : lower.includes("diani")
            ? "Diani"
            : "Runda";
        return {
            text: `### 📍 Market Overview: ${areaName}

${areaName} is one of Kenya's most liquid real estate corridors:
* **Typical Yields:** Long-term rentals yield **7% – 9%**, while executive short-term serviced suites can achieve **11% – 14% gross ROI**.
* **Target Audience:** ${
                areaName === "Karen" || areaName === "Runda"
                    ? "Diplomats, high-net-worth families, and multinational executives."
                    : "Expatriates, diaspora investors, and young urban professionals."
            }

${
    matched.length > 0
        ? `I searched our live catalog (${totalInventoryCount} listings${liveCount > 0 ? `, including ${liveCount} live agent uploads` : ""}) and pulled up ${matched.length} matching ${areaName} homes below!`
        : `Would you like me to filter all current ${areaName} listings?`
}`,
            options: [
                { label: `🏠 View all ${areaName} listings`, value: `properties_in_${areaName.toLowerCase()}` },
                { label: "🤖 Value a property here", value: "go_valuation" },
                { label: "👤 Speak with local agent", value: "I want to talk to an agent" },
            ],
        };
    }

    // Default conversational response with live listings
    return {
        text: `### 🏡 EstateVue Live Property Advisor

I searched our catalog of **${totalInventoryCount} verified listings**${
            liveCount > 0 ? ` (including **${liveCount} live agent-uploaded properties**)` : ""
        } for **"${query}"**.

${
    matched.length > 0
        ? `I found **${matched.length} matching ${matched.length === 1 ? "property" : "properties"}** below aligned with your criteria:`
        : `Here are the fastest ways I can help you discover the right home:`
}

* **Live Property Search:** Filter verified homes by neighborhood, bedrooms, price, and amenities.
* **EstateEstimate™ AI Valuation:** Check market rates, rental yields, and appreciation for any address.
* **60-Second Matchmaker Quiz:** Get 3 personalized recommendations across all live listings.`,
        options: [
            { label: "🔍 Search All Listings", value: "search_properties" },
            { label: "✨ 60-Sec Dream Home Quiz", value: "go_quiz" },
            { label: "🤖 AI Property Valuation", value: "go_valuation" },
            { label: "👤 Connect with an Agent", value: "I want to talk to an agent" },
        ],
    };
}
