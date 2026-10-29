/**
 * AI Agent Listing Co-Pilot Engine
 * Synthesizes luxury editorial copy, headline options, verified Kenyan neighborhood
 * highlights (schools, hospitals, shopping, walkability/safety), and EstateEstimate™
 * pricing recommendations for agents creating or editing listings.
 */

import { getNeighborhoodByName } from "./neighborhoods";
import { calculateEstateEstimate, getNeighborhoodBenchmark, ValuationResult } from "./valuation";

export type ListingCopyTone = "luxury_editorial" | "investor_roi" | "warm_family";

export interface ListingCopilotInputs {
    title?: string;
    propertyType: "apartment" | "house" | "villa" | "townhouse" | "land" | "commercial";
    listingType: "sale" | "rent";
    city: string;
    neighborhood: string;
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
    yearBuilt?: number;
    amenities?: string[];
    finishQuality?: "standard" | "modern" | "luxury" | "off_plan";
    tone?: ListingCopyTone;
}

export interface ListingCopilotOutput {
    headlineOptions: string[];
    description: string;
    neighborhoodHighlights: string[];
    neighborhoodNarrative: string;
    suggestedAmenities: string[];
    recommendedListingPriceKES: number; // Sale price for `sale`, monthly rent for `rent`
    valuation: ValuationResult;
    pricingRationale: string;
    source: "gemini-llm" | "copilot-engine";
}

const DEFAULT_AMENITY_SUGGESTIONS: Record<string, string[]> = {
    apartment: [
        "Backup Generator",
        "Borehole Water",
        "Heated Swimming Pool",
        "Fitness Gym",
        "High-Speed Lifts",
        "24/7 Biometric Security",
        "Rooftop Lounge",
        "Solar Water Heating",
    ],
    villa: [
        "Private Swimming Pool",
        "Landscaped Mature Garden",
        "Staff Quarters (DSQ)",
        "Solar Hybrid Power",
        "Borehole",
        "24/7 Gated Security",
        "Smart Home Automation",
        "Double Carport",
    ],
    townhouse: [
        "Private Garden",
        "Staff Quarters (DSQ)",
        "Gated Community Security",
        "Borehole & Backup Power",
        "Solar Water Heating",
        "Clubhouse & Pool",
    ],
    house: [
        "Private Compound",
        "Mature Garden",
        "Staff Quarters (DSQ)",
        "Borehole Water",
        "Perimeter Electric Fence",
        "Ample Parking",
    ],
    land: [
        "Ready Freehold / Leasehold Title",
        "Tarmac Road Access",
        "Mains Water & KPLC On-Site",
        "Beacons Clearly Marked",
        "Controlled Gated Zone",
    ],
    commercial: [
        "Full Standby Generator",
        "High-Speed Fiber Redundancy",
        "Dedicated Tenant Parking",
        "24/7 CCTV & Access Control",
        "High-Speed Elevators",
        "Borehole Water",
    ],
};

/**
 * Deterministic Kenyan luxury copywriter + valuation synthesizer.
 * Used directly and as the structured foundation when enhanced by Gemini LLM.
 */
export function generateListingCopilotDraft(inputs: ListingCopilotInputs): ListingCopilotOutput {
    const city = (inputs.city || "Nairobi").trim() || "Nairobi";
    const neighborhood = (inputs.neighborhood || "Westlands").trim() || "Westlands";
    const beds = Math.max(0, Math.round(Number(inputs.bedrooms) || 3));
    const baths = Math.max(0, Math.round(Number(inputs.bathrooms) || Math.max(2, beds)));
    const areaSqFt = Math.max(
        350,
        Math.round(
            Number(inputs.areaSqFt) ||
                (inputs.propertyType === "villa"
                    ? 3800
                    : inputs.propertyType === "townhouse" || inputs.propertyType === "house"
                    ? 2600
                    : 1650)
        )
    );
    const finishQuality = inputs.finishQuality || "luxury";
    const tone: ListingCopyTone = inputs.tone || "luxury_editorial";
    const existingAmenities = (inputs.amenities || []).map((a) => a.trim()).filter(Boolean);

    const yearBuilt = Number(inputs.yearBuilt) || 2025;
    const ageYears = Math.max(0, new Date().getFullYear() - yearBuilt);
    const yearBuiltTier =
        ageYears <= 2 ? "under_2" : ageYears <= 5 ? "2_to_5" : ageYears <= 10 ? "5_to_10" : "over_10";

    const valuation = calculateEstateEstimate({
        propertyType: inputs.propertyType,
        city,
        neighborhood,
        areaSqFt,
        bedrooms: beds,
        bathrooms: baths,
        finishQuality,
        yearBuiltTier,
        amenities: existingAmenities.length > 0 ? existingAmenities : DEFAULT_AMENITY_SUGGESTIONS[inputs.propertyType] || [],
    });

    const recommendedListingPriceKES =
        inputs.listingType === "rent" ? valuation.estimatedMonthlyRent : valuation.estimatePrice;

    // Lookup rich neighborhood profile from src/lib/neighborhoods.ts + valuation benchmark
    const hoodData = getNeighborhoodByName(neighborhood);
    const benchmark = getNeighborhoodBenchmark(neighborhood, city);

    const neighborhoodHighlights: string[] = [];
    if (hoodData) {
        if (hoodData.nearbySchools.length > 0) {
            neighborhoodHighlights.push(
                `🎓 Premier Schools: Minutes from ${hoodData.nearbySchools.map((s) => s.name).join(", ")}`
            );
        }
        if (hoodData.nearbyShopping.length > 0) {
            neighborhoodHighlights.push(
                `🛍️ Retail & Dining: Immediate access to ${hoodData.nearbyShopping
                    .slice(0, 2)
                    .map((s) => s.name)
                    .join(" & ")}${hoodData.nearbyDining[0] ? ` plus ${hoodData.nearbyDining[0].name}` : ""}`
            );
        }
        if (hoodData.nearbyHospitals.length > 0) {
            neighborhoodHighlights.push(
                `🏥 Healthcare Access: Served by ${hoodData.nearbyHospitals.map((h) => h.name).join(" & ")}`
            );
        }
        neighborhoodHighlights.push(
            `🛡️ Neighborhood Scores: Safety ${hoodData.safetyRating}/10 · Lifestyle ${hoodData.lifestyleScore}/10 (${hoodData.vibes.slice(0, 3).join(", ")})`
        );
    } else {
        neighborhoodHighlights.push(`📍 Prime ${neighborhood}, ${city} address (${benchmark.demandLevel} buyer demand)`);
        neighborhoodHighlights.push(`📈 Market Benchmark: ~${benchmark.annualGrowthRate}% annual capital appreciation`);
        neighborhoodHighlights.push(`💼 Rental Profile: ~${valuation.grossRentalYield}% gross annual rental yield potential`);
    }

    const typeLabel =
        inputs.propertyType.charAt(0).toUpperCase() + inputs.propertyType.slice(1);
    const bedPrefix =
        inputs.propertyType === "land" || inputs.propertyType === "commercial"
            ? `Prime ${areaSqFt.toLocaleString()} Sq.Ft`
            : `${beds}-Bedroom`;

    const headlineOptions = [
        `Signature ${bedPrefix} ${typeLabel} in Prime ${neighborhood}`,
        `Architectural ${bedPrefix} Luxury ${typeLabel} — ${neighborhood}, ${city}`,
        inputs.listingType === "rent"
            ? `Executive ${bedPrefix} ${typeLabel} To Let in ${neighborhood}`
            : `High-Yield ${bedPrefix} ${typeLabel} with Modern Finishes in ${neighborhood}`,
    ];

    const topAmenities =
        existingAmenities.length >= 3
            ? existingAmenities.slice(0, 5)
            : (DEFAULT_AMENITY_SUGGESTIONS[inputs.propertyType] || []).slice(0, 5);

    const hoodSentence = hoodData
        ? `Positioned in ${hoodData.name} — celebrated for its ${hoodData.tagline.toLowerCase()} — residents enjoy effortless proximity to ${hoodData.nearbyShopping[0]?.name || "premier shopping"}, ${hoodData.nearbySchools[0]?.name || "international schools"}, and ${hoodData.nearbyParks[0]?.name || "green recreational spaces"}.`
        : `Ideally positioned in sought-after ${neighborhood}, ${city}, ${benchmark.highlight.charAt(0).toLowerCase() + benchmark.highlight.slice(1)}`;

    let openingParagraph = "";
    let closingParagraph = "";

    if (tone === "investor_roi") {
        openingParagraph = `Commanding strong tenant absorption in ${neighborhood}, ${city}, this ${areaSqFt.toLocaleString()} sq.ft ${bedPrefix.toLowerCase()} ${inputs.propertyType} is engineered for resilient cashflow and long-term capital preservation. Projected to deliver ~${valuation.grossRentalYield}% gross annual yield (est. KES ${valuation.estimatedMonthlyRent.toLocaleString()}/month long-term or ~KES ${valuation.airbnbNightlyRate.toLocaleString()}/night executive short-stay), the residence pairs low-maintenance contemporary finishes with blue-chip location fundamentals.`;
        closingParagraph = `Backed by ${topAmenities.join(", ")}, and clean ArdhiSasa-ready documentation, this asset represents a turnkey addition to any local or diaspora real estate portfolio.`;
    } else if (tone === "warm_family") {
        openingParagraph = `Welcome to an inviting ${bedPrefix.toLowerCase()} family ${inputs.propertyType} spanning ${areaSqFt.toLocaleString()} sq.ft in the heart of ${neighborhood}, ${city}. Thoughtfully proportioned across ${beds} sunlit bedrooms and ${baths} modern bathrooms, the home balances generous living and dining spaces with tranquil privacy for everyday family life.`;
        closingParagraph = `Complete with ${topAmenities.join(", ")}, this secure residence offers peace of mind and lasting comfort — schedule a private in-person or live video walkthrough today.`;
    } else {
        openingParagraph = `Experience refined contemporary living in this ${areaSqFt.toLocaleString()} sq.ft ${bedPrefix.toLowerCase()} ${inputs.propertyType} set within one of ${neighborhood}'s most coveted enclaves. Flooded with natural light through expansive glazing, the residence showcases seamless indoor-outdoor reception spaces, bespoke joinery, and ${baths} spa-inspired bathrooms.`;
        closingParagraph = `Residents enjoy exclusive access to ${topAmenities.join(", ")}. Available for ${
            inputs.listingType === "rent" ? "immediate executive tenancy" : "private acquisition with verified title documentation"
        } — contact us for a private viewing.`;
    }

    const description = [openingParagraph, hoodSentence, closingParagraph].join("\n\n");

    const neighborhoodNarrative = [
        `📍 Why ${neighborhood}, ${city}:`,
        ...neighborhoodHighlights,
    ].join("\n");

    const suggestedAmenities = (DEFAULT_AMENITY_SUGGESTIONS[inputs.propertyType] || []).filter(
        (item) => !existingAmenities.some((ex) => ex.toLowerCase() === item.toLowerCase())
    );

    const pricingRationale =
        inputs.listingType === "rent"
            ? `EstateEstimate™ benchmarks ${neighborhood} ${inputs.propertyType}s at KES ${valuation.estimatedMonthlyRent.toLocaleString()}/mo (~${valuation.grossRentalYield}% gross yield on a KES ${valuation.estimatePrice.toLocaleString()} capital value, ${valuation.confidenceScore}% confidence).`
            : `EstateEstimate™ values this ${areaSqFt.toLocaleString()} sq.ft ${neighborhood} ${inputs.propertyType} at KES ${valuation.estimatePrice.toLocaleString()} (Range: KES ${valuation.lowPrice.toLocaleString()} – KES ${valuation.highPrice.toLocaleString()} · KES ${valuation.pricePerSqFt.toLocaleString()}/sqft · ${valuation.confidenceScore}% confidence).`;

    return {
        headlineOptions,
        description,
        neighborhoodHighlights,
        neighborhoodNarrative,
        suggestedAmenities,
        recommendedListingPriceKES,
        valuation,
        pricingRationale,
        source: "copilot-engine",
    };
}
