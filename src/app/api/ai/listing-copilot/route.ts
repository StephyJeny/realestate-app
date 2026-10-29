import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/apiSecurity";
import {
    generateListingCopilotDraft,
    ListingCopilotInputs,
    ListingCopyTone,
} from "@/lib/listingCopilot";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function POST(request: NextRequest) {
    try {
        // Rate limit: max 15 co-pilot generations per minute per IP
        const rateLimitRes = enforceRateLimit(request, "ai-listing-copilot", 15, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const body = await request.json();

        const validTypes = ["apartment", "house", "villa", "townhouse", "land", "commercial"] as const;
        const propertyType = validTypes.includes(body.propertyType) ? body.propertyType : "apartment";
        const listingType = body.listingType === "rent" ? "rent" : "sale";
        const city = typeof body.city === "string" && body.city.trim() ? body.city.trim().slice(0, 80) : "Nairobi";
        const neighborhood =
            typeof body.neighborhood === "string" && body.neighborhood.trim()
                ? body.neighborhood.trim().slice(0, 80)
                : "Westlands";

        const validTones: ListingCopyTone[] = ["luxury_editorial", "investor_roi", "warm_family"];
        const tone: ListingCopyTone = validTones.includes(body.tone) ? body.tone : "luxury_editorial";

        const inputs: ListingCopilotInputs = {
            title: typeof body.title === "string" ? body.title.trim().slice(0, 140) : "",
            propertyType,
            listingType,
            city,
            neighborhood,
            bedrooms: Math.min(20, Math.max(0, Number(body.bedrooms) || 3)),
            bathrooms: Math.min(20, Math.max(0, Number(body.bathrooms) || 2)),
            areaSqFt: Math.min(500_000, Math.max(200, Number(body.areaSqFt) || 1_650)),
            yearBuilt: Number(body.yearBuilt) || 2025,
            amenities: Array.isArray(body.amenities)
                ? body.amenities.map((a: unknown) => String(a).trim()).filter(Boolean)
                : [],
            finishQuality: body.finishQuality || "luxury",
            tone,
        };

        const draft = generateListingCopilotDraft(inputs);

        // Optional Gemini LLM polish for bespoke luxury listing copy & headlines
        if (process.env.GEMINI_API_KEY) {
            try {
                const toneInstruction =
                    tone === "investor_roi"
                        ? "investment-focused (emphasizing rental yield, occupancy velocity, and capital appreciation)"
                        : tone === "warm_family"
                        ? "warm, family-oriented (emphasizing compound serenity, schools, safety, and space)"
                        : "architectural luxury editorial (Knight Frank / Architectural Digest sophistication)";

                const prompt = `You are Kenya's top luxury real estate copywriter at EstateVue.
Generate a JSON object with keys "headlines" (array of 3 compelling property titles, max 75 chars each) and "description" (3 crisp paragraphs separated by \\n\\n, 130-190 words total) for:
- Type: ${inputs.bedrooms}-bedroom, ${inputs.bathrooms}-bathroom ${inputs.propertyType} for ${inputs.listingType}
- Size: ${inputs.areaSqFt} sq.ft
- Location: ${inputs.neighborhood}, ${inputs.city}, Kenya
- EstateEstimate Valuation: KES ${draft.recommendedListingPriceKES.toLocaleString()}${inputs.listingType === "rent" ? "/month" : ""}
- Verified Neighborhood Context: ${draft.neighborhoodHighlights.join(" | ")}
- Amenities: ${(inputs.amenities?.length ? inputs.amenities : draft.suggestedAmenities).join(", ")}
- Tone: ${toneInstruction}
Respond ONLY with valid JSON.`;

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
                        GEMINI_MODEL
                    )}:generateContent`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-goog-api-key": process.env.GEMINI_API_KEY,
                        },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: { responseMimeType: "application/json" },
                        }),
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    const rawText: string =
                        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                    const cleaned = rawText.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
                    const parsed = JSON.parse(cleaned);
                    if (
                        parsed &&
                        typeof parsed.description === "string" &&
                        parsed.description.length > 60
                    ) {
                        draft.description = parsed.description.trim();
                        if (Array.isArray(parsed.headlines) && parsed.headlines.length > 0) {
                            draft.headlineOptions = parsed.headlines
                                .map((h: unknown) => String(h).trim())
                                .filter(Boolean)
                                .slice(0, 3);
                        }
                        draft.source = "gemini-llm";
                    }
                }
            } catch (err) {
                console.warn("Gemini listing co-pilot polish skipped, using deterministic draft:", err);
            }
        }

        return NextResponse.json({
            success: true,
            data: draft,
        });
    } catch (error) {
        console.error("Listing Co-Pilot API error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to generate listing co-pilot suggestions" },
            { status: 500 }
        );
    }
}
