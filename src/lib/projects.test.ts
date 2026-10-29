import { describe, expect, it } from "vitest";
import {
    calculateStagedPaymentSchedule,
    getOffPlanProjectBySlug,
    getStartingPriceKES,
    getTotalAvailableUnits,
    offPlanProjects,
} from "./projects";

describe("offPlanProjects catalog & helpers", () => {
    it("ensures every project payment plan sums to 100%", () => {
        for (const project of offPlanProjects) {
            const totalPct = project.paymentPlan.reduce((sum, t) => sum + t.percent, 0);
            expect(totalPct).toBe(100);
            expect(project.milestones.length).toBeGreaterThan(0);
            expect(project.unitMix.length).toBeGreaterThan(0);
        }
    });

    it("computes staged payment tranches and cumulative balances accurately", () => {
        const azure = offPlanProjects[0];
        const schedule = calculateStagedPaymentSchedule(20_000_000, azure.paymentPlan);

        expect(schedule).toHaveLength(azure.paymentPlan.length);
        expect(schedule[0].amountKES).toBe(4_000_000);
        expect(schedule[0].cumulativePct).toBe(20);
        expect(schedule[schedule.length - 1].cumulativePct).toBe(100);
        expect(schedule[schedule.length - 1].cumulativeKES).toBe(20_000_000);
    });

    it("resolves starting price, unit availability, and slug lookup", () => {
        const azure = getOffPlanProjectBySlug("the-azure-sky-residences-westlands");
        expect(azure).toBeDefined();
        expect(getStartingPriceKES(azure!)).toBe(11_800_000);

        const units = getTotalAvailableUnits(azure!);
        expect(units.available).toBeGreaterThan(0);
        expect(units.total).toBeGreaterThanOrEqual(units.available);
    });
});
