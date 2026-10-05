import { NextRequest, NextResponse } from "next/server";
import { sampleProperties } from "@/lib/data";

interface ChatMessage {
    role: "user" | "assistant" | "model" | "system";
    content: string;
}

interface ChatRequestBody {
    message: string;
    history?: ChatMessage[];
    propertyContext?: any;
}

// System Prompt for EstateVue AI Real Estate Consultant
const SYSTEM_PROMPT = `You are "VueBot", the elite AI Real Estate Consultant for EstateVue — Kenya's premier luxury and modern real estate platform.
You assist buyers, investors, tenants, and sellers across Kenya (Nairobi, Mombasa, Kisumu, Nakuru, and beyond).

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
   - Commercial mortgage rates in Kenya currently hover around 12% - 15% (KCB, Stanbic, NCBA, Co-op).
   - Standard minimum down payment: 10% to 20%.
   - Typical loan tenure: 15 to 25 years.
4. TONE & FORMAT:
   - Professional, warm, insightful, concise, and distinctly knowledgeable about Kenya.
   - Use clear bullet points when explaining complex figures or listing options.
   - Quote figures clearly in KES (Kenyan Shillings) or USD when relevant.
   - Encourage viewing bookings and using EstateVue's EstateEstimate™ AI valuation tool.`;

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequestBody = await request.json();
        const userMessage = body.message?.trim();

        if (!userMessage) {
            return NextResponse.json(
                { success: false, message: "Message is required" },
                { status: 400 }
            );
        }

        const lower = userMessage.toLowerCase();

        // Find relevant properties to recommend
        const matchedProperties = sampleProperties.filter((p) => {
            const loc = typeof p.location === "object" ? `${p.location.neighborhood} ${p.location.city}` : "";
            const searchHaystack = `${p.title} ${p.type} ${loc} ${p.description} ${p.amenities.join(" ")}`.toLowerCase();
            const words = lower.split(/\s+/).filter(w => w.length > 3);
            return words.some(w => searchHaystack.includes(w));
        }).slice(0, 3);

        // 1. If GEMINI_API_KEY is available, call Google Gemini 1.5 Flash
        if (process.env.GEMINI_API_KEY) {
            try {
                // Build Gemini messages payload
                const contents = [
                    {
                        role: "user",
                        parts: [
                            {
                                text: `${SYSTEM_PROMPT}\n\nAvailable Live Featured Properties on EstateVue:\n${JSON.stringify(
                                    sampleProperties.map(p => ({
                                        id: p.id,
                                        title: p.title,
                                        type: p.type,
                                        price: `KES ${p.price.toLocaleString()}`,
                                        location: `${p.location.neighborhood}, ${p.location.city}`,
                                        beds: p.bedrooms,
                                        baths: p.bathrooms,
                                        amenities: p.amenities.slice(0, 4),
                                    })),
                                    null,
                                    2
                                )}\n\nUser Question: ${userMessage}`
                            }
                        ]
                    }
                ];

                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
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
                            properties: matchedProperties.length > 0 ? matchedProperties.map(formatPropertySummary) : undefined,
                            source: "gemini-llm",
                        });
                    }
                }
            } catch (llmErr) {
                console.warn("Gemini LLM call failed, falling back to smart heuristic advisor:", llmErr);
            }
        }

        // 2. Intelligent Built-in Fallback Knowledge Engine (Contextual synthesis)
        const fallbackReply = generateSmartAdvisorReply(userMessage, matchedProperties);

        return NextResponse.json({
            success: true,
            reply: fallbackReply.text,
            options: fallbackReply.options,
            properties: matchedProperties.length > 0 ? matchedProperties.map(formatPropertySummary) : undefined,
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

function formatPropertySummary(p: any) {
    return {
        id: p.id,
        title: p.title,
        price: p.price,
        currency: p.currency || "KES",
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        location: `${p.location?.neighborhood || ""}, ${p.location?.city || "Kenya"}`,
        type: p.type,
        listingType: p.listingType,
        image: p.images?.[0] || "/images/property-1.png",
    };
}

function generateSmartAdvisorReply(query: string, matched: any[]) {
    const lower = query.toLowerCase();

    // Legal / ArdhiSasa / Conveyance
    if (lower.includes("ardhisasa") || lower.includes("title") || lower.includes("stamp duty") || lower.includes("legal") || lower.includes("deed") || lower.includes("due diligence")) {
        return {
            text: `### ⚖️ Kenyan Property Legal & Due Diligence Guide

Here is the verified acquisition protocol for purchasing real estate in Kenya:

1. **Official Title Search (ArdhiSasa):**
   * Conduct an online official search via the Ministry of Lands portal (**ArdhiSasa**) to confirm registered ownership, encumbrances, bank charges, or court caveats.
2. **Rates & Land Rent Clearance:**
   * Ensure the vendor has paid up all county rates and national land rent, and holds valid clearance certificates.
3. **Stamp Duty Calculation:**
   * **4%** of market valuation for urban/municipality properties (Nairobi, Mombasa, Nakuru, Kisumu).
   * **2%** for agricultural/rural parcels.
4. **Independent Valuation:**
   * We also recommend checking our **EstateEstimate™** tool to ensure the asking price matches recent registered transaction benchmarks.

Would you like us to connect you with an accredited Conveyancing Advocate on our panel?`,
            options: [
                { label: "🤖 Run EstateEstimate Valuation", value: "go_valuation" },
                { label: "👤 Talk to an Agent", value: "I want to talk to an agent" },
                { label: "🔍 View Available Listings", value: "search_properties" },
            ],
        };
    }

    // Mortgage / Financing
    if (lower.includes("mortgage") || lower.includes("loan") || lower.includes("interest") || lower.includes("down payment") || lower.includes("monthly payment")) {
        return {
            text: `### 🏦 Mortgage & Financing Insights in Kenya

* **Interest Rates:** Prevailing Kenyan commercial bank mortgages (NCBA, Stanbic, KCB, Absa) typically range between **12% and 14.5% p.a.**
* **Down Payment:** Most lenders require a minimum deposit of **10% to 20%** of the property purchase price.
* **Repayment Rule of Thumb:**
  For a **KES 25,000,000** apartment with 20% down (KES 5M deposit) over 25 years at 13%:
  * Estimated Monthly Installment: **~KES 227,000 / month**.
* **Pre-Approval:** You will need 6 months bank statements, KRA PIN certificate, and an employment letter or audited business accounts.

You can also use our interactive **Mortgage Calculator** on any property listing to simulate different terms and interest rates!`,
            options: [
                { label: "📊 Open Mortgage Calculator", value: "go_mortgage" },
                { label: "💰 Value a Property", value: "go_valuation" },
                { label: "🏠 Browse Affordable Homes", value: "affordable_properties" },
            ],
        };
    }

    // Valuation / How much is my home worth?
    if (lower.includes("valuation") || lower.includes("worth") || lower.includes("price") || lower.includes("estimate") || lower.includes("appraisal")) {
        return {
            text: `### 🤖 Instant Property Valuation (EstateEstimate™)

You can value any property in Kenya in under 10 seconds using our proprietary **EstateEstimate™ AI engine**:

* **How it works:** It combines location benchmarks across Nairobi (Karen, Westlands, Kilimani, Runda), Mombasa, and Kisumu with finish quality, square footage, and amenities.
* **What you receive:**
  * Algorithmic market valuation range (Low, Mid, High).
  * Monthly rental income forecast & gross rental yield %.
  * Airbnb nightly potential.
  * 3-year historical appreciation trend and 2027 forecast.

Click below to run your instant valuation!`,
            options: [
                { label: "⚡ Run EstateEstimate™ Now", value: "go_valuation" },
                { label: "👤 Schedule In-Person Valuation", value: "I want to talk to an agent" },
            ],
        };
    }

    // Specific location inquiries
    if (lower.includes("karen") || lower.includes("westlands") || lower.includes("kilimani") || lower.includes("nyali") || lower.includes("runda") || lower.includes("diani")) {
        const areaName = lower.includes("karen") ? "Karen" : lower.includes("westlands") ? "Westlands" : lower.includes("kilimani") ? "Kilimani" : lower.includes("nyali") ? "Nyali" : lower.includes("diani") ? "Diani" : "Runda";
        return {
            text: `### 📍 Market Overview: ${areaName}

${areaName} is one of Kenya's most desirable real estate markets:
* **Market Character:** High liquidity and sustained capital growth.
* **Typical Yields:** Long-term rentals yield **7% – 9%**, while executive short-term serviced suites can achieve **11% – 14% gross ROI**.
* **Target Audience:** ${areaName === "Karen" || areaName === "Runda" ? "Diplomats, high-net-worth families, and multinational executives." : "Expatriates, digital nomads, and young urban professionals."}

${matched.length > 0 ? `I've pulled up active listings in ${areaName} below for you to explore!` : `Would you like me to filter all current ${areaName} listings?`}`,
            options: [
                { label: `🏠 View all ${areaName} listings`, value: `properties_in_${areaName.toLowerCase()}` },
                { label: "🤖 Value a property here", value: "go_valuation" },
                { label: "👤 Speak with local agent", value: "I want to talk to an agent" },
            ],
        };
    }

    // Default conversational response with listings
    return {
        text: `### 🏡 EstateVue Property Advisor

I understand you're inquiring about: **"${query}"**.

${matched.length > 0 ? `I found ${matched.length} hand-picked listings from our database that closely align with your criteria:` : `Here are the best ways I can help you today:`}

* **Live Property Search:** Filter thousands of verified homes by neighborhood, price, and amenities.
* **EstateEstimate™ AI Valuation:** Check market rates, rental yields, and historical growth for any address.
* **Tour Booking:** Schedule in-person or virtual 360° walkthroughs with verified agents.

What would you like to explore next?`,
        options: [
            { label: "🔍 Search All Listings", value: "search_properties" },
            { label: "🤖 AI Property Valuation", value: "go_valuation" },
            { label: "✨ 60-Sec Dream Home Quiz", value: "go_quiz" },
            { label: "👤 Connect with an Agent", value: "I want to talk to an agent" },
        ],
    };
}
