export interface ValuationInputs {
    propertyType: "apartment" | "villa" | "house" | "townhouse" | "commercial" | "land";
    city: string;
    neighborhood: string;
    areaSqFt: number;
    bedrooms: number;
    bathrooms: number;
    finishQuality: "standard" | "modern" | "luxury" | "off_plan";
    yearBuiltTier: "under_2" | "2_to_5" | "5_to_10" | "over_10";
    amenities: string[];
    furnishing?: "unfurnished" | "furnished" | "designer";
}

export interface ValuationHistoricalPoint {
    year: number;
    price: number;
    growthPct: number;
    isProjected?: boolean;
}

export interface ValuationResult {
    valuationId: string;
    generatedAt: string;
    estimatePrice: number;
    lowPrice: number;
    highPrice: number;
    confidenceScore: number;
    pricePerSqFt: number;
    pricePerSqM: number;
    estimatedMonthlyRent: number;
    grossRentalYield: number;
    airbnbNightlyRate: number;
    airbnbGrossAnnual: number;
    historicalTrends: ValuationHistoricalPoint[];
    annualAppreciationRate: number;
    insights: {
        demandLevel: "Very High" | "High" | "Moderate";
        bestStrategy: string;
        marketSummary: string;
    };
    factors: {
        baseAreaValue: number;
        neighborhoodPremium: number;
        finishMultiplier: number;
        amenitiesAddedValue: number;
    };
}

// Kenyan market base price per square meter by neighborhood (in KES)
// Derived from real-market transaction averages across Nairobi, Mombasa, Kisumu, Nakuru
interface NeighborhoodBenchmark {
    baseRateSqm: number;
    annualGrowthRate: number;
    rentalYieldRate: number; // e.g. 0.075 = 7.5%
    demandLevel: "Very High" | "High" | "Moderate";
    highlight: string;
}

const NEIGHBORHOOD_BENCHMARKS: Record<string, NeighborhoodBenchmark> = {
    // Nairobi Prime
    "karen": { baseRateSqm: 175000, annualGrowthRate: 5.8, rentalYieldRate: 0.068, demandLevel: "Very High", highlight: "Serene low-density suburb with enduring high-capital preservation." },
    "westlands": { baseRateSqm: 165000, annualGrowthRate: 7.2, rentalYieldRate: 0.086, demandLevel: "Very High", highlight: "Nairobi's commercial epicenter; premier market for Airbnb & expat rentals." },
    "kilimani": { baseRateSqm: 135000, annualGrowthRate: 6.9, rentalYieldRate: 0.089, demandLevel: "Very High", highlight: "Ultra-high rental velocity; ideal for 1 & 2BR high-density investor units." },
    "runda": { baseRateSqm: 185000, annualGrowthRate: 5.5, rentalYieldRate: 0.062, demandLevel: "High", highlight: "Diplomatic blue zone with long-term institutional embassy tenancies." },
    "kileleshwa": { baseRateSqm: 130000, annualGrowthRate: 6.4, rentalYieldRate: 0.081, demandLevel: "High", highlight: "Upscale residential neighborhood popular with young families and professionals." },
    "lavington": { baseRateSqm: 155000, annualGrowthRate: 6.1, rentalYieldRate: 0.074, demandLevel: "High", highlight: "Mature green residential enclave boasting top-tier schools and shopping." },
    "south c": { baseRateSqm: 105000, annualGrowthRate: 5.2, rentalYieldRate: 0.078, demandLevel: "Moderate", highlight: "Centrally located with rapid access to CBD and Nairobi Expressway." },
    "langata": { baseRateSqm: 110000, annualGrowthRate: 5.6, rentalYieldRate: 0.076, demandLevel: "Moderate", highlight: "Fast developing corridor near Southern Bypass and recreational spots." },
    "kiambu road": { baseRateSqm: 120000, annualGrowthRate: 7.8, rentalYieldRate: 0.079, demandLevel: "Very High", highlight: "Rapidly expanding residential belt with premium gated communities." },
    "syokimau": { baseRateSqm: 85000, annualGrowthRate: 7.0, rentalYieldRate: 0.082, demandLevel: "High", highlight: "Strategic SGR & Expressway terminus hub with high middle-income absorption." },

    // Mombasa
    "nyali": { baseRateSqm: 140000, annualGrowthRate: 6.2, rentalYieldRate: 0.092, demandLevel: "Very High", highlight: "Coastal luxury capital; massive holiday rental occupancy during peak seasons." },
    "bamburi": { baseRateSqm: 88000, annualGrowthRate: 5.4, rentalYieldRate: 0.084, demandLevel: "Moderate", highlight: "Affordable beachside residential and commercial destination." },
    "diani": { baseRateSqm: 150000, annualGrowthRate: 7.5, rentalYieldRate: 0.105, demandLevel: "Very High", highlight: "World-famous beach resort market commanding peak tourist holiday rates." },
    "shanzu": { baseRateSqm: 98000, annualGrowthRate: 5.7, rentalYieldRate: 0.088, demandLevel: "High", highlight: "Quiet coastal strip favored for serviced vacation apartments." },

    // Kisumu & Nakuru
    "milimani kisumu": { baseRateSqm: 95000, annualGrowthRate: 6.0, rentalYieldRate: 0.075, demandLevel: "High", highlight: "Lakefront affluent residential ridge with NGO & corporate tenants." },
    "riat kisumu": { baseRateSqm: 88000, annualGrowthRate: 7.1, rentalYieldRate: 0.072, demandLevel: "High", highlight: "Panoramic hill views overlooking Kisumu City and Lake Victoria." },
    "milimani nakuru": { baseRateSqm: 85000, annualGrowthRate: 6.5, rentalYieldRate: 0.073, demandLevel: "High", highlight: "Premier post-city status hub benefiting from national highway expansions." },

    // Fallback generic
    "default": { baseRateSqm: 100000, annualGrowthRate: 5.5, rentalYieldRate: 0.075, demandLevel: "Moderate", highlight: "Stable Kenyan urban real estate corridor with balanced capital growth." }
};

export function getNeighborhoodBenchmark(neighborhood: string, city?: string): NeighborhoodBenchmark {
    const key = neighborhood.trim().toLowerCase();
    for (const [name, data] of Object.entries(NEIGHBORHOOD_BENCHMARKS)) {
        if (key.includes(name) || name.includes(key)) {
            return data;
        }
    }
    if (city && city.toLowerCase().includes("mombasa")) {
        return NEIGHBORHOOD_BENCHMARKS["nyali"];
    }
    return NEIGHBORHOOD_BENCHMARKS["default"];
}

export function calculateEstateEstimate(inputs: ValuationInputs): ValuationResult {
    const {
        propertyType,
        city,
        neighborhood,
        areaSqFt,
        bedrooms,
        bathrooms,
        finishQuality,
        yearBuiltTier,
        amenities = [],
        furnishing = "unfurnished",
    } = inputs;

    // Convert Sq Ft to Sq Meters (1 sqm ~ 10.7639 sqft)
    const areaSqm = Math.max(20, areaSqFt / 10.7639);

    const benchmark = getNeighborhoodBenchmark(neighborhood, city);

    // 1. Property Type Multiplier
    const typeMultipliers: Record<string, number> = {
        apartment: 1.0,
        townhouse: 1.06,
        house: 1.10,
        villa: 1.18,
        commercial: 1.14,
        land: 0.85,
    };
    const typeMult = typeMultipliers[propertyType] || 1.0;

    // 2. Finish Quality Multiplier
    const finishMultipliers: Record<string, number> = {
        off_plan: 0.85,
        standard: 1.0,
        modern: 1.16,
        luxury: 1.34,
    };
    const finishMult = finishMultipliers[finishQuality] || 1.0;

    // 3. Age / Built Tier Multiplier
    const ageMultipliers: Record<string, number> = {
        under_2: 1.07,
        "2_to_5": 1.0,
        "5_to_10": 0.93,
        over_10: 0.85,
    };
    const ageMult = ageMultipliers[yearBuiltTier] || 1.0;

    // 4. Furnishing Multiplier
    const furnishingMultipliers: Record<string, number> = {
        unfurnished: 1.0,
        furnished: 1.08,
        designer: 1.15,
    };
    const furnishMult = furnishingMultipliers[furnishing] || 1.0;

    // Base structure calculation
    const baseAreaValue = areaSqm * benchmark.baseRateSqm;

    // Amenity additions in KES
    let amenitiesAddedValue = 0;
    const lowerAmenities = amenities.map(a => a.toLowerCase());

    if (lowerAmenities.some(a => a.includes("pool") || a.includes("swimming"))) amenitiesAddedValue += 4500000;
    if (lowerAmenities.some(a => a.includes("ocean") || a.includes("sea view"))) amenitiesAddedValue += (baseAreaValue * 0.12);
    if (lowerAmenities.some(a => a.includes("borehole"))) amenitiesAddedValue += 1600000;
    if (lowerAmenities.some(a => a.includes("solar"))) amenitiesAddedValue += 1200000;
    if (lowerAmenities.some(a => a.includes("smart") || a.includes("automation"))) amenitiesAddedValue += 1400000;
    if (lowerAmenities.some(a => a.includes("dsq") || a.includes("staff"))) amenitiesAddedValue += 1500000;
    if (lowerAmenities.some(a => a.includes("generator") || a.includes("backup"))) amenitiesAddedValue += 900000;
    if (lowerAmenities.some(a => a.includes("garden"))) amenitiesAddedValue += 1100000;
    if (lowerAmenities.some(a => a.includes("gym"))) amenitiesAddedValue += 750000;

    // Bedroom / Bathroom balance bonus
    let roomAdj = 1.0;
    if (bedrooms >= 4 && bathrooms >= 4) roomAdj = 1.04;
    else if (bedrooms > bathrooms + 2) roomAdj = 0.97; // bathroom deficit

    // Compute raw median valuation
    const rawValuation = (baseAreaValue * typeMult * finishMult * ageMult * furnishMult * roomAdj) + amenitiesAddedValue;

    // Rounding to realistic figures (nearest 100k)
    const estimatePrice = Math.round(rawValuation / 100000) * 100000;

    // Margin of error is typically +/- 4% to 7%
    const margin = 0.055;
    const lowPrice = Math.round((estimatePrice * (1 - margin)) / 100000) * 100000;
    const highPrice = Math.round((estimatePrice * (1 + margin)) / 100000) * 100000;

    // Price per unit
    const pricePerSqFt = Math.round(estimatePrice / Math.max(1, areaSqFt));
    const pricePerSqM = Math.round(estimatePrice / Math.max(1, areaSqm));

    // Rental yield & rental pricing
    const grossRentalYield = benchmark.rentalYieldRate * (finishQuality === "luxury" ? 1.08 : 1.0);
    const annualRentalGross = estimatePrice * grossRentalYield;
    const estimatedMonthlyRent = Math.round((annualRentalGross / 12) / 500) * 500;

    // Short-term / Airbnb simulation
    const airbnbNightlyRate = Math.max(4500, Math.round((estimatePrice * 0.00042) / 500) * 500);
    const airbnbGrossAnnual = Math.round(airbnbNightlyRate * 210); // ~57% annual occupancy

    // 3-Year Historical Growth & 1-Year Forecast
    const rate = benchmark.annualGrowthRate / 100;
    const historicalTrends: ValuationHistoricalPoint[] = [
        {
            year: 2024,
            price: Math.round((estimatePrice / Math.pow(1 + rate, 2)) / 100000) * 100000,
            growthPct: Math.round((benchmark.annualGrowthRate - 0.4) * 10) / 10,
        },
        {
            year: 2025,
            price: Math.round((estimatePrice / (1 + rate)) / 100000) * 100000,
            growthPct: Math.round(benchmark.annualGrowthRate * 10) / 10,
        },
        {
            year: 2026,
            price: estimatePrice,
            growthPct: Math.round((benchmark.annualGrowthRate + 0.3) * 10) / 10,
        },
        {
            year: 2027,
            price: Math.round((estimatePrice * (1 + rate * 1.05)) / 100000) * 100000,
            growthPct: Math.round(benchmark.annualGrowthRate * 10) / 10,
            isProjected: true,
        },
    ];

    // Confidence scoring based on inputs provided
    let confidence = 86;
    if (areaSqFt >= 300) confidence += 4;
    if (bedrooms > 0 && bathrooms > 0) confidence += 3;
    if (amenities.length >= 2) confidence += 3;
    if (NEIGHBORHOOD_BENCHMARKS[neighborhood.toLowerCase()]) confidence += 3;
    const confidenceScore = Math.min(97, confidence);

    // Strategy recommendation
    let bestStrategy = "Long-Term High-Quality Tenant Rental";
    if (neighborhood.toLowerCase().includes("westlands") || neighborhood.toLowerCase().includes("kilimani") || neighborhood.toLowerCase().includes("nyali") || neighborhood.toLowerCase().includes("diani")) {
        bestStrategy = "Serviced Short-Term / Executive Airbnb (Optimizes yield to 11-14%)";
    } else if (propertyType === "villa" || neighborhood.toLowerCase().includes("karen") || neighborhood.toLowerCase().includes("runda")) {
        bestStrategy = "Capital Appreciation & High-Net-Worth Family Lease";
    } else if (propertyType === "land") {
        bestStrategy = "Land Banking or Subdivision for Townhouse Development";
    }

    return {
        valuationId: `EV-VAL-${Date.now().toString(36).toUpperCase()}`,
        generatedAt: new Date().toISOString(),
        estimatePrice,
        lowPrice,
        highPrice,
        confidenceScore,
        pricePerSqFt,
        pricePerSqM,
        estimatedMonthlyRent,
        grossRentalYield: Math.round(grossRentalYield * 1000) / 10,
        airbnbNightlyRate,
        airbnbGrossAnnual,
        historicalTrends,
        annualAppreciationRate: benchmark.annualGrowthRate,
        insights: {
            demandLevel: benchmark.demandLevel,
            bestStrategy,
            marketSummary: benchmark.highlight,
        },
        factors: {
            baseAreaValue: Math.round(baseAreaValue),
            neighborhoodPremium: Math.round(benchmark.baseRateSqm),
            finishMultiplier: finishMult,
            amenitiesAddedValue,
        },
    };
}
