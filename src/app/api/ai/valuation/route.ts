import { NextRequest, NextResponse } from "next/server";
import { calculateEstateEstimate, ValuationInputs } from "@/lib/valuation";

export async function POST(request: NextRequest) {
    try {
        const body: ValuationInputs = await request.json();

        if (!body.neighborhood || !body.areaSqFt) {
            return NextResponse.json(
                { success: false, message: "Missing required fields: neighborhood and areaSqFt" },
                { status: 400 }
            );
        }

        const valuation = calculateEstateEstimate(body);

        // If GEMINI_API_KEY is available, we can request a live AI valuation narrative commentary
        let aiCommentary: string | null = null;
        if (process.env.GEMINI_API_KEY) {
            try {
                const prompt = `You are a premier Kenyan real estate economist. Provide a concise 2-sentence market appraisal summary for a ${body.bedrooms || 3}-bedroom ${body.propertyType} in ${body.neighborhood}, ${body.city || "Kenya"}. The algorithmic valuation is KES ${valuation.estimatePrice.toLocaleString()} with an estimated monthly rental yield of ${valuation.grossRentalYield}%. Mention buyer demand and investment outlook.`;

                const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                });

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
