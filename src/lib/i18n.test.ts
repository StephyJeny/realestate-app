import { describe, expect, it } from "vitest";
import {
    EN_DICTIONARY,
    SW_DICTIONARY,
    isValidLocale,
    translate,
    TranslationKey,
} from "./i18n";

describe("i18n — English & Kiswahili localization dictionary", () => {
    it("maintains 100% non-empty key parity between English and Kiswahili", () => {
        const enKeys = Object.keys(EN_DICTIONARY) as TranslationKey[];
        const swKeys = Object.keys(SW_DICTIONARY) as TranslationKey[];

        expect(swKeys.sort()).toEqual(enKeys.sort());
        for (const key of enKeys) {
            expect(EN_DICTIONARY[key].trim().length).toBeGreaterThan(0);
            expect(SW_DICTIONARY[key].trim().length).toBeGreaterThan(0);
        }
    });

    it("translates navigation and detail labels in English and Kiswahili", () => {
        expect(translate("en", "nav.buy")).toBe("Buy");
        expect(translate("sw", "nav.buy")).toBe("Nunua");
        expect(translate("sw", "nav.rent")).toBe("Kodi");
        expect(translate("sw", "detail.applyDigitalLease")).toContain("Omba Mkataba");
    });

    it("validates supported locale codes strictly", () => {
        expect(isValidLocale("en")).toBe(true);
        expect(isValidLocale("sw")).toBe(true);
        expect(isValidLocale("fr")).toBe(false);
        expect(isValidLocale(null)).toBe(false);
    });
});
