import { describe, expect, it } from "vitest";
import {
    DIASPORA_MORTGAGE_PARTNERS,
    POA_CHECKLIST_STEPS,
    convertEATSlotToTimezone,
    generateSnaggingReportDocument,
    parseNairobiSlotToUTC,
} from "./diaspora";

describe("parseNairobiSlotToUTC", () => {
    it("parses Nairobi EAT (UTC+3) morning and afternoon slots to exact UTC timestamps", () => {
        const morning = parseNairobiSlotToUTC("2026-11-15", "11:00 AM");
        expect(morning.toISOString()).toBe("2026-11-15T08:00:00.000Z");

        const afternoon = parseNairobiSlotToUTC("2026-11-15", "02:30 PM");
        expect(afternoon.toISOString()).toBe("2026-11-15T11:30:00.000Z");

        const noon = parseNairobiSlotToUTC("2026-11-15", "12:00 PM");
        expect(noon.toISOString()).toBe("2026-11-15T09:00:00.000Z");
    });
});

describe("convertEATSlotToTimezone", () => {
    it("converts 11:00 AM EAT to 8:00 AM GMT in London (November standard time)", () => {
        const uk = convertEATSlotToTimezone("2026-11-15", "11:00 AM", "Europe/London");
        expect(uk.eatLabel).toBe("11:00 AM EAT");
        expect(uk.localTimeLabel).toMatch(/8:00\s*AM/i);
        expect(uk.localDayShift).toBe("");
        expect(uk.isFriendlyHour).toBe(true);
    });

    it("flags overnight US Eastern hours as unfriendly and detects previous-day shifts", () => {
        const nyEarly = convertEATSlotToTimezone("2026-11-15", "10:00 AM", "America/New_York");
        // 10:00 AM EAT = 07:00 UTC = 02:00 AM EST
        expect(nyEarly.localTimeLabel).toMatch(/2:00\s*AM/i);
        expect(nyEarly.isFriendlyHour).toBe(false);

        const nyPrevDay = convertEATSlotToTimezone("2026-11-15", "01:00 AM", "America/New_York");
        // 01:00 AM EAT (Nov 15) = 22:00 UTC (Nov 14) = 05:00 PM EST (Nov 14)
        expect(nyPrevDay.localDayShift).toBe("Prev Day");
    });
});

describe("Diaspora guides & snagging report", () => {
    it("exposes complete 5-step POA checklist and diaspora mortgage partners", () => {
        expect(POA_CHECKLIST_STEPS).toHaveLength(5);
        expect(DIASPORA_MORTGAGE_PARTNERS.length).toBeGreaterThanOrEqual(4);
    });

    it("generates a formatted BORAQS/ISK snagging report with property metadata", () => {
        const docText = generateSnaggingReportDocument({
            propertyTitle: "The Azure Sky Penthouse",
            location: "Westlands, Nairobi",
            priceFormatted: "KES 49,500,000",
        });

        expect(docText).toContain("The Azure Sky Penthouse");
        expect(docText).toContain("Westlands, Nairobi, Kenya");
        expect(docText).toContain("KES 49,500,000");
        expect(docText).toContain("BORAQS / ISK");
    });
});
