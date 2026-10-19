import { NextRequest, NextResponse } from "next/server";
import { calculateEstateEstimate, ValuationInputs } from "@/lib/valuation";
import { enforceRateLimit } from "@/lib/apiSecurity";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export async function POST(request: NextRequest) {
    try {
        // Rate limit: max 15 valuations per minute per IP
        const rateLimitRes = enforceRateLimit(request, "ai-valuation", 15, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const body: ValuationInputs = await request.json();

        const neighborhood = typeof body.neighborhood === "string" ? body.neighborhood.trim().slice(0, 80) : "";
        const areaSqFt = Number(body.areaSqFt) || 0;

        if (!neighborhood || areaSqFt <= 0 || areaSqFt > 1_000_000) {
            return NextResponse.json(
                { success: false, message: "Missing or invalid required fields: neighborhood and areaSqFt" },
                { status: 400 }
            );
        }

        const sanitizedInputs: ValuationInputs = {
            ...body,
            neighborhood,
            city: typeof body.city === "string" ? body.city.trim().slice(0, 80) : "Nairobi",
            areaSqFt,
            bedrooms: Math.min(20, Math.max(0, Math.round(Number(body.bedrooms) || 3))),
            bathrooms: Math.min(20, Math.max(0, Math.round(Number(body.bathrooms) || 2))),
        };

        const valuation = calculateEstateEstimate(sanitizedInputs);

        // If GEMINI_API_KEY is available, request a live AI valuation narrative commentary
        let aiCommentary: string | null = null;
        if (process.env.GEMINI_API_KEY) {
            try {
                const prompt = `You are a premier Kenyan real estate economist. Provide a concise 2-sentence market appraisal summary for a ${sanitizedInputs.bedrooms || 3}-bedroom ${sanitizedInputs.propertyType} in ${sanitizedInputs.neighborhood}, ${sanitizedInputs.city || "Kenya"}. The algorithmic valuation is KES ${valuation.estimatePrice.toLocaleString()} with an estimated monthly rental yield of ${valuation.grossRentalYield}%. Mention buyer demand and investment outlook.`;

                const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent`,
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
                    aiCommentary = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
                }
            } catch (err) {
                console.warn("Gemini API call optional enhancement failed:", err);
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...valuation,
                aiCommentary,
            },
        });
    } catch (error) {
        console.error("Valuation API error:", error);
        return NextResponse.json(
            { success: false, message: "Failed to generate valuation" },
            { status: 500 }
        );
    }
}
