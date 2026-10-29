import { describe, expect, it } from "vitest";
import {
    calculateMoveInCosts,
    calculateShortStayQuote,
    evaluateTenantAffordability,
} from "./rentalWorkflow";

describe("rentalWorkflow — Kenyan tenancy move-in & short-stay math", () => {
    it("computes 1st month rent + 2 months deposit + apartment utility deposit", () => {
        const res = calculateMoveInCosts({
            monthlyRentKES: 120_000,
            securityDepositMonths: 2,
            includeUtilityDeposit: true,
            includeLeaseStampPct: true,
            propertyType: "apartment",
        });

        expect(res.firstMonthRentKES).toBe(120_000);
        expect(res.securityDepositKES).toBe(240_000);
        expect(res.utilityDepositKES).toBe(7_500);
        expect(res.leaseStampAndLegalKES).toBe(14_400); // 1% of annual rent (1,440,000)
        expect(res.refundablePortionKES).toBe(247_500);
        expect(res.totalMoveInKES).toBe(381_900);
    });

    it("evaluates 3x net-income affordability tiers accurately", () => {
        const strong = evaluateTenantAffordability(100_000, 350_000);
        expect(strong.tier).toBe("comfortable");
        expect(strong.rentToIncomeRatioPct).toBeCloseTo(28.6, 1);

        const moderate = evaluateTenantAffordability(100_000, 250_000);
        expect(moderate.tier).toBe("moderate");
        expect(moderate.rentToIncomeRatioPct).toBe(40);

        const stretched = evaluateTenantAffordability(100_000, 180_000);
        expect(stretched.tier).toBe("stretched");
        expect(stretched.rentToIncomeRatioPct).toBeGreaterThan(50);
    });

    it("applies 10% weekly and 25% monthly discounts on short-stay bookings", () => {
        const shortTrip = calculateShortStayQuote({
            monthlyRentKES: 160_000, // baseNightly = 8,000
            checkInDate: "2026-11-01",
            checkOutDate: "2026-11-04",
            guests: 2,
        });
        expect(shortTrip.nights).toBe(3);
        expect(shortTrip.discountPct).toBe(0);
        expect(shortTrip.baseNightlyRateKES).toBe(8_000);

        const weeklyTrip = calculateShortStayQuote({
            monthlyRentKES: 160_000,
            checkInDate: "2026-11-01",
            checkOutDate: "2026-11-11",
            guests: 2,
        });
        expect(weeklyTrip.nights).toBe(10);
        expect(weeklyTrip.discountTier).toBe("weekly_10");
        expect(weeklyTrip.discountPct).toBe(10);
        expect(weeklyTrip.discountAmountKES).toBe(8_000);

        const monthlyTrip = calculateShortStayQuote({
            monthlyRentKES: 160_000,
            checkInDate: "2026-11-01",
            checkOutDate: "2026-12-01",
            guests: 2,
        });
        expect(monthlyTrip.nights).toBe(30);
        expect(monthlyTrip.discountTier).toBe("monthly_25");
        expect(monthlyTrip.discountPct).toBe(25);
    });
});
