import { describe, expect, it } from "vitest";
import {
    calculateClosingCosts,
    calculateLSKLegalFeeExVat,
    calculateValuationFeeKES,
} from "./closingCosts";

describe("calculateLSKLegalFeeExVat", () => {
    it("returns 0 for zero or negative prices", () => {
        expect(calculateLSKLegalFeeExVat(0)).toBe(0);
        expect(calculateLSKLegalFeeExVat(-500_000)).toBe(0);
    });

    it("enforces the KES 35,000 statutory minimum on small transactions", () => {
        expect(calculateLSKLegalFeeExVat(1_000_000)).toBe(35_000);
    });

    it("applies tiered LSK bands accurately for a KES 20,000,000 property", () => {
        // First 1M @ 2.0% = 20,000
        // Next 4M (1M..5M) @ 1.5% = 60,000
        // Remaining 15M (5M..20M) @ 1.25% = 187,500
        // Total ex-VAT = 267,500
        expect(calculateLSKLegalFeeExVat(20_000_000)).toBe(267_500);
    });

    it("applies the 1.0% top tier above KES 100,000,000", () => {
        // First 1M = 20,000; Next 4M = 60,000; Next 95M = 1,187,500; Next 20M @ 1% = 200,000 => 1,467,500
        expect(calculateLSKLegalFeeExVat(120_000_000)).toBe(1_467_500);
    });
});

describe("calculateValuationFeeKES", () => {
    it("clamps valuation fees between KES 25,000 and KES 250,000", () => {
        expect(calculateValuationFeeKES(4_000_000)).toBe(25_000);
        expect(calculateValuationFeeKES(20_000_000)).toBe(50_000);
        expect(calculateValuationFeeKES(200_000_000)).toBe(250_000);
    });
});

describe("calculateClosingCosts", () => {
    it("computes 4% urban Stamp Duty, LSK + 16% VAT, and full cash-to-close for cash buyers", () => {
        const res = calculateClosingCosts({
            propertyPriceKES: 20_000_000,
            zone: "urban",
            financing: "cash",
        });

        expect(res.stampDutyRatePct).toBe(4);
        expect(res.stampDutyKES).toBe(800_000);
        expect(res.legalFeeExVatKES).toBe(267_500);
        expect(res.legalFeeVatKES).toBe(42_800);
        expect(res.legalFeeTotalKES).toBe(310_300);
        expect(res.valuationAndRegistryKES).toBe(71_000); // 50k valuation + 21k ArdhiSasa/clearances
        expect(res.mortgageSetupCostsKES).toBe(0);
        expect(res.totalClosingCostsKES).toBe(1_181_300);
        expect(res.totalCashToCloseKES).toBe(21_181_300);
    });

    it("computes 2% Stamp Duty for rural / agricultural land", () => {
        const res = calculateClosingCosts({
            propertyPriceKES: 20_000_000,
            zone: "rural",
            financing: "cash",
        });

        expect(res.stampDutyRatePct).toBe(2);
        expect(res.stampDutyKES).toBe(400_000);
    });

    it("supports first-time homebuyer 0% Stamp Duty exemption", () => {
        const res = calculateClosingCosts({
            propertyPriceKES: 10_000_000,
            zone: "urban",
            firstTimeAffordableExemption: true,
        });

        expect(res.stampDutyRatePct).toBe(0);
        expect(res.stampDutyKES).toBe(0);
    });

    it("calculates down payment, loan principal, and mortgage setup charges for financed purchases", () => {
        const res = calculateClosingCosts({
            propertyPriceKES: 20_000_000,
            zone: "urban",
            financing: "mortgage",
            downPaymentPct: 20,
            bankArrangementFeePct: 1.5,
        });

        expect(res.downPaymentKES).toBe(4_000_000);
        expect(res.loanPrincipalKES).toBe(16_000_000);
        expect(res.mortgageSetupCostsKES).toBeGreaterThan(0);
        expect(res.totalCashToCloseKES).toBe(res.downPaymentKES + res.totalClosingCostsKES);
        expect(res.items.some((i) => i.id === "bank_arrangement")).toBe(true);
        expect(res.items.some((i) => i.id === "charge_registration")).toBe(true);
    });
});
