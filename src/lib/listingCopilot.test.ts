import { describe, expect, it } from "vitest";
import { generateListingCopilotDraft } from "./listingCopilot";

describe("listingCopilot", () => {
    it("generates luxury copy, verified Karen neighborhood highlights, and sale pricing", () => {
        const draft = generateListingCopilotDraft({
            propertyType: "villa",
            listingType: "sale",
            city: "Nairobi",
            neighborhood: "Karen",
            bedrooms: 5,
            bathrooms: 5,
            areaSqFt: 4200,
            yearBuilt: 2025,
            amenities: ["Private Swimming Pool"],
            tone: "luxury_editorial",
        });

        expect(draft.headlineOptions).toHaveLength(3);
        expect(draft.description).toContain("Karen");
        // Verified school from neighborhoods.ts (Brookhouse School)
        expect(draft.neighborhoodHighlights.some((h) => h.includes("Brookhouse"))).toBe(true);
        expect(draft.recommendedListingPriceKES).toBe(draft.valuation.estimatePrice);
        expect(draft.recommendedListingPriceKES).toBeGreaterThan(40_000_000);
        // Should not suggest an amenity already provided
        expect(
            draft.suggestedAmenities.some((a) => a.toLowerCase() === "private swimming pool")
        ).toBe(false);
    });

    it("recommends monthly rental pricing when listingType is rent", () => {
        const draft = generateListingCopilotDraft({
            propertyType: "apartment",
            listingType: "rent",
            city: "Nairobi",
            neighborhood: "Westlands",
            bedrooms: 2,
            bathrooms: 2,
            areaSqFt: 1350,
            tone: "investor_roi",
        });

        expect(draft.recommendedListingPriceKES).toBe(draft.valuation.estimatedMonthlyRent);
        expect(draft.recommendedListingPriceKES).toBeGreaterThan(50_000);
        expect(draft.recommendedListingPriceKES).toBeLessThan(1_000_000);
        expect(draft.headlineOptions.some((h) => h.includes("To Let"))).toBe(true);
    });
});
