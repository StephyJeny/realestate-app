import { describe, expect, it } from "vitest";
import {
    calculateStagingBudget,
    generateStagingBOQDocument,
    getStagingStyleById,
    STAGING_STYLES,
} from "./virtualStaging";

describe("virtualStaging", () => {
    it("includes Afro-Minimalist, Swahili Coastal, and Executive Modern styles with spatial hotspots", () => {
        const ids = STAGING_STYLES.map((s) => s.id);
        expect(ids).toContain("afro_minimalist");
        expect(ids).toContain("swahili_coastal");
        expect(ids).toContain("executive_modern");

        for (const style of STAGING_STYLES) {
            expect(style.hotspots.length).toBeGreaterThanOrEqual(3);
            expect(style.palette.length).toBeGreaterThanOrEqual(4);
        }
    });

    it("scales fit-out estimates monotonically across scope and renovation tiers", () => {
        const loungeFurnish = calculateStagingBudget({
            styleId: "afro_minimalist",
            roomScope: "living_dining",
            fitOutTier: "furnishing_only",
            propertyAreaSqFt: 1_800,
            bedrooms: 3,
            propertyPriceKES: 25_000_000,
        });

        const loungeReno = calculateStagingBudget({
            styleId: "afro_minimalist",
            roomScope: "living_dining",
            fitOutTier: "full_renovation",
            propertyAreaSqFt: 1_800,
            bedrooms: 3,
            propertyPriceKES: 25_000_000,
        });

        const fullHomeReno = calculateStagingBudget({
            styleId: "executive_modern",
            roomScope: "full_home",
            fitOutTier: "full_renovation",
            propertyAreaSqFt: 1_800,
            bedrooms: 3,
            propertyPriceKES: 25_000_000,
        });

        expect(loungeReno.totalEstimateKES).toBeGreaterThan(loungeFurnish.totalEstimateKES);
        expect(fullHomeReno.totalEstimateKES).toBeGreaterThan(loungeReno.totalEstimateKES);
        expect(loungeFurnish.estimatedMonthlyRentUpliftKES).toBeGreaterThan(0);
        expect(loungeFurnish.lineItems).toHaveLength(5);

        const sumLineItems = loungeFurnish.lineItems.reduce((acc, i) => acc + i.amountKES, 0);
        expect(sumLineItems).toBeGreaterThanOrEqual(loungeFurnish.totalEstimateKES);
    });

    it("exports a structured BOQ summary document", () => {
        const style = getStagingStyleById("swahili_coastal");
        const budget = calculateStagingBudget({
            styleId: style.id,
            roomScope: "master_suite",
            fitOutTier: "light_refresh",
            propertyAreaSqFt: 2_400,
            bedrooms: 4,
            propertyPriceKES: 38_000_000,
        });

        const doc = generateStagingBOQDocument({
            propertyTitle: "Nyali Coral Villa",
            location: "Nyali, Mombasa",
            style,
            budget,
            aiConceptNotes: style.curatorNotes.master_suite,
        });

        expect(doc).toContain("Nyali Coral Villa");
        expect(doc).toContain("Swahili Coastal");
        expect(doc).toContain("ITEMIZED BILL OF QUANTITIES");
    });
});
