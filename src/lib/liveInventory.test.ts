import { describe, expect, it } from "vitest";
import type { FirestoreProperty } from "./firestore";
import {
    firestorePropertyToProperty,
    matchInventoryForChat,
    mergeLiveAndSampleProperties,
    rankPropertiesForQuiz,
} from "./liveInventory";
import { sampleProperties } from "./data";

describe("liveInventory", () => {
    const liveKilimaniApt: FirestoreProperty = {
        id: "live-kilimani-301",
        title: "Sunlit Sky Terrace 3BR Apartment",
        description: "Agent-uploaded executive apartment with heated pool, gym, and solar backup in Kilimani.",
        type: "apartment",
        listingType: "sale",
        price: 19_500_000,
        currency: "KES",
        bedrooms: 3,
        bathrooms: 3,
        area: 1750,
        yearBuilt: 2026,
        address: "Argwings Kodhek Rd, Kilimani",
        city: "Nairobi",
        neighborhood: "Kilimani",
        amenities: ["Swimming Pool", "Fitness Gym", "24/7 Gated Security", "Smart Home Tech"],
        images: ["/images/property-2.png"],
        agentId: "agent-99",
        agentName: "Amina Hassan",
        agentEmail: "amina@estatevue.com",
        agentPhone: "+254711000999",
        status: "active",
        isFeatured: true,
        views: 42,
        favorites: 7,
    };

    const soldListing: FirestoreProperty = {
        ...liveKilimaniApt,
        id: "live-sold-999",
        status: "sold",
    };

    it("normalizes FirestoreProperty into Property and excludes sold items by default", () => {
        const normalized = firestorePropertyToProperty(liveKilimaniApt);
        expect(normalized.location).toEqual({ city: "Nairobi", neighborhood: "Kilimani" });
        expect(normalized.slug).toBe("sunlit-sky-terrace-3br-apartment");

        const { inventory, liveIds } = mergeLiveAndSampleProperties(
            [liveKilimaniApt, soldListing],
            sampleProperties
        );

        expect(liveIds.has("live-kilimani-301")).toBe(true);
        expect(liveIds.has("live-sold-999")).toBe(false);
        expect(inventory[0].id).toBe("live-kilimani-301");
    });

    it("surfaces live agent-uploaded properties in conversational chat searches", () => {
        const { inventory } = mergeLiveAndSampleProperties([liveKilimaniApt], sampleProperties);
        const matches = matchInventoryForChat("3 bedroom apartment in Kilimani under 22m", inventory, 4);

        expect(matches.length).toBeGreaterThan(0);
        expect(matches[0].id).toBe("live-kilimani-301");
    });

    it("ranks live agent-uploaded properties in the Dream Home Quiz with isLiveListing metadata", () => {
        const { inventory, liveIds } = mergeLiveAndSampleProperties([liveKilimaniApt], sampleProperties);
        const ranked = rankPropertiesForQuiz(
            inventory,
            {
                goal: "investment",
                vibe: "cosmopolitan",
                bedrooms: "3-4",
                budget: "under_35m",
                amenities: ["pool", "gym", "security", "smart"],
            },
            liveIds,
            3
        );

        expect(ranked).toHaveLength(3);
        const top = ranked[0];
        expect(top.property.id).toBe("live-kilimani-301");
        expect(top.isLiveListing).toBe(true);
        expect(top.score).toBeGreaterThanOrEqual(90);
        expect(top.matchReasons.length).toBeGreaterThan(0);
    });
});
