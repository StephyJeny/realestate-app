import { describe, expect, it, vi } from "vitest";

// savedSearches imports the Firebase client; these tests only exercise pure helpers
vi.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

import { describeFilters, doesPropertyMatchSearch } from "./savedSearches";

const karenVilla = {
    title: "Modern Villa with Pool",
    description: "Spacious family home near the Karen shopping centre",
    type: "villa",
    listingType: "sale",
    bedrooms: 5,
    bathrooms: 4,
    city: "Nairobi",
    neighborhood: "Karen",
    status: "active",
    price: 85_000_000,
    area: 4200,
};

describe("doesPropertyMatchSearch", () => {
    it("matches when no filters are set", () => {
        expect(doesPropertyMatchSearch(karenVilla, {})).toBe(true);
    });

    it("treats the 'All' / 'Any' / 'all' sentinels as no filter", () => {
        expect(
            doesPropertyMatchSearch(karenVilla, {
                propertyType: "All",
                listingType: "all",
                bedrooms: "Any",
                bathrooms: "Any",
                city: "All",
                neighborhood: "All",
                status: "all",
            })
        ).toBe(true);
    });

    it("matches keyword search case-insensitively across title, description and location", () => {
        expect(doesPropertyMatchSearch(karenVilla, { searchQuery: "POOL" })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { searchQuery: "karen" })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { searchQuery: "beachfront" })).toBe(false);
    });

    it("compares property type case-insensitively", () => {
        expect(doesPropertyMatchSearch(karenVilla, { propertyType: "Villa" })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { propertyType: "Apartment" })).toBe(false);
    });

    it("filters by listing type", () => {
        expect(doesPropertyMatchSearch(karenVilla, { listingType: "sale" })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { listingType: "rent" })).toBe(false);
    });

    it("handles exact and '5+' bedroom filters", () => {
        expect(doesPropertyMatchSearch(karenVilla, { bedrooms: "5" })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { bedrooms: "5+" })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { bedrooms: "3" })).toBe(false);
        expect(doesPropertyMatchSearch({ ...karenVilla, bedrooms: 7 }, { bedrooms: "5+" })).toBe(true);
    });

    it("handles '4+' bathrooms", () => {
        expect(doesPropertyMatchSearch(karenVilla, { bathrooms: "4+" })).toBe(true);
        expect(doesPropertyMatchSearch({ ...karenVilla, bathrooms: 2 }, { bathrooms: "4+" })).toBe(false);
    });

    it("filters by city and neighbourhood", () => {
        expect(doesPropertyMatchSearch(karenVilla, { city: "Nairobi", neighborhood: "Karen" })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { city: "Mombasa" })).toBe(false);
        expect(doesPropertyMatchSearch(karenVilla, { neighborhood: "Westlands" })).toBe(false);
    });

    it("applies price bounds inclusively", () => {
        expect(doesPropertyMatchSearch(karenVilla, { priceMin: 85_000_000, priceMax: 85_000_000 })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { priceMin: 90_000_000 })).toBe(false);
        expect(doesPropertyMatchSearch(karenVilla, { priceMax: 50_000_000 })).toBe(false);
    });

    it("ignores the 200M slider ceiling as an upper bound", () => {
        expect(doesPropertyMatchSearch({ ...karenVilla, price: 350_000_000 }, { priceMax: 200_000_000 })).toBe(true);
    });

    it("applies area bounds", () => {
        expect(doesPropertyMatchSearch(karenVilla, { areaMin: 4000, areaMax: 5000 })).toBe(true);
        expect(doesPropertyMatchSearch(karenVilla, { areaMin: 5000 })).toBe(false);
    });
});

describe("describeFilters", () => {
    it("summarises active filters in a readable order", () => {
        expect(
            describeFilters({
                listingType: "sale",
                propertyType: "Villa",
                bedrooms: "3",
                city: "Nairobi",
                priceMin: 5_000_000,
                priceMax: 25_000_000,
                searchQuery: "pool",
            })
        ).toBe('For Sale · Villa · 3 beds · Nairobi · from KES 5.0M · up to KES 25.0M · "pool"');
    });

    it("uses singular for one bed / bath", () => {
        expect(describeFilters({ bedrooms: "1", bathrooms: "1" })).toBe("1 bed · 1 bath");
    });

    it("falls back to 'All properties' when nothing is filtered", () => {
        expect(describeFilters({ propertyType: "All", listingType: "all" })).toBe("All properties");
    });
});
