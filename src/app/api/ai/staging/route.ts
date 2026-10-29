import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/apiSecurity";
import {
    calculateStagingBudget,
    FitOutTierId,
    getStagingStyleById,
    RoomScopeId,
    StagingStyleId,
} from "@/lib/virtualStaging";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

interface StagingRequestBody {
    propertyTitle?: string;
    propertyType?: string;
    neighborhood?: string;
    city?: string;
    bedrooms?: number;
    areaSqFt?: number;
    propertyPriceKES?: number;
    styleId: StagingStyleId;
    roomScope: RoomScopeId;
    fitOutTier: FitOutTierId;
}

export async function POST(request: NextRequest) {
    try {
        const rateLimitRes = enforceRateLimit(request, "ai-staging", 15, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const body: StagingRequestBody = await request.json();

        const style = getStagingStyleById(body.styleId || "afro_minimalist");
        const roomScope: RoomScopeId = body.roomScope || "living_dining";
        const fitOutTier: FitOutTierId = body.fitOutTier || "furnishing_only";

        const budget = calculateStagingBudget({
            styleId: style.id,
            roomScope,
            fitOutTier,
            propertyAreaSqFt: Number(body.areaSqFt) || 1_800,
            bedrooms: Number(body.bedrooms) || 3,
            propertyPriceKES: Number(body.propertyPriceKES) || 0,
        });

        let aiConceptNotes: string[] = style.curatorNotes[roomScope] || style.curatorNotes.living_dining;
        let source: "gemini-llm" | "staging-engine" = "staging-engine";

        if (process.env.GEMINI_API_KEY) {
            try {
                const propDesc = `${body.bedrooms || 3}-bedroom ${body.propertyType || "residence"} (${
                    body.areaSqFt || 1800
                } sqft) in ${body.neighborhood || "Nairobi"}, ${body.city || "Kenya"}`;
                const prompt = `You are a leading Nairobi & Mombasa luxury interior architect. Write exactly 3 concise, practical bullet points (no markdown headers, each bullet 1 sentence, max 28 words each) describing how to restyle the ${roomScope.replace(
                    "_",
                    " "
                )} of "${body.propertyTitle || propDesc}" (${propDesc}) in the "${style.name}" aesthetic (${
                    style.tagline
                }) within an estimated budget of KES ${budget.totalEstimateKES.toLocaleString()}. Reference authentic Kenyan materials, lighting, or rental/resale appeal.`;

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
                        }),
                    }
                );

                if (res.ok) {
                    const data = await res.json();
                    const rawText: string =
                        data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
                    const parsedBullets = rawText
                        .split("\n")
                        .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
                        .filter((line) => line.length > 15)
                        .slice(0, 3);

                    if (parsedBullets.length >= 2) {
                        aiConceptNotes = parsedBullets;
                        source = "gemini-llm";
                    }
                }
            } catch (err) {
                console.warn("Gemini virtual staging enhancement skipped:", err);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                styleId: style.id,
                styleName: style.name,
                aiConceptNotes,
                budget,
                source,
            },
        });
    } catch (error) {
        console.error("Virtual Staging API error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to generate staging concept" },
            { status: 500 }
        );
    }
}
