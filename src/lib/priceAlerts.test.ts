import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/firebase", () => ({ db: {}, auth: {} }));

import {
    AlertSubscription,
    computePriceDeltaSummary,
    createInitialPriceHistory,
    derivePriceHistoryForListing,
    findMatchingAlertSubscriptions,
    recordPriceChange,
} from "./priceAlerts";

describe("priceAlerts — price history & automated alert matching", () => {
    it("creates an initial listed entry", () => {
        const history = createInitialPriceHistory(45_000_000, "2026-08-01T10:00:00.000Z");
        expect(history).toHaveLength(1);
        expect(history[0]).toEqual({
            date: "2026-08-01T10:00:00.000Z",
            price: 45_000_000,
            event: "listed",
            note: "Initial asking price",
        });
    });

    it("records a price_drop event and computes delta percentage", () => {
        const initial = createInitialPriceHistory(50_000_000, "2026-07-01T00:00:00.000Z");
        const updated = recordPriceChange(
            initial,
            50_000_000,
            45_000_000,
            undefined,
            "2026-09-15T00:00:00.000Z"
        );
        expect(updated).toHaveLength(2);
        expect(updated[1].event).toBe("price_drop");
        expect(updated[1].price).toBe(45_000_000);
        expect(updated[1].note).toContain("10.0%");

        const summary = computePriceDeltaSummary(updated);
        expect(summary.hasPriceDrop).toBe(true);
        expect(summary.latestDropKES).toBe(5_000_000);
        expect(summary.latestDropPct).toBe(10);
        expect(summary.totalDeltaPct).toBe(-10);
    });

    it("synthesizes a realistic drop timeline for price_reduced legacy listings", () => {
        const derived = derivePriceHistoryForListing({
            id: "legacy-1",
            price: 36_000_000,
            status: "price_reduced",
            createdAt: "2026-06-01",
        });
        expect(derived.length).toBeGreaterThanOrEqual(2);
        const summary = computePriceDeltaSummary(derived);
        expect(summary.initialPrice).toBeGreaterThan(36_000_000);
        expect(summary.currentPrice).toBe(36_000_000);
        expect(summary.hasPriceDrop).toBe(true);
    });

    it("matches active saved searches on new_listing and excludes listing agent", () => {
        const subs: AlertSubscription[] = [
            {
                id: "ss_1",
                userId: "buyer-1",
                userEmail: "buyer1@example.com",
                type: "saved_search",
                searchName: "Kilimani 3BR",
                filters: { city: "Nairobi", neighborhood: "Kilimani", bedrooms: "3", priceMax: 30_000_000 },
                active: true,
                createdAtISO: "2026-09-01T00:00:00.000Z",
            },
            {
                id: "ss_agent",
                userId: "agent-99",
                userEmail: "agent@example.com",
                type: "saved_search",
                filters: { city: "Nairobi" },
                active: true,
                createdAtISO: "2026-09-01T00:00:00.000Z",
            },
            {
                id: "ss_inactive",
                userId: "buyer-2",
                userEmail: "buyer2@example.com",
                type: "saved_search",
                filters: { city: "Nairobi" },
                active: false,
                createdAtISO: "2026-09-01T00:00:00.000Z",
            },
        ];

        const matched = findMatchingAlertSubscriptions({
            eventType: "new_listing",
            property: {
                id: "prop-101",
                title: "Luxury 3BR Kilimani Apartment",
                city: "Nairobi",
                neighborhood: "Kilimani",
                bedrooms: 3,
                price: 24_000_000,
                agentId: "agent-99",
            },
            subscriptions: subs,
        });

        expect(matched).toHaveLength(1);
        expect(matched[0].userId).toBe("buyer-1");
    });

    it("prioritizes direct price_watch and deduplicates per user on price_drop", () => {
        const subs: AlertSubscription[] = [
            {
                id: "ss_buyer1",
                userId: "buyer-1",
                userEmail: "buyer1@example.com",
                type: "saved_search",
                searchName: "Nyali Villas",
                filters: { city: "Mombasa", neighborhood: "Nyali" },
                active: true,
                createdAtISO: "2026-09-01T00:00:00.000Z",
            },
            {
                id: "pw_buyer1_prop1",
                userId: "buyer-1",
                userEmail: "buyer1@example.com",
                type: "price_watch",
                propertyId: "prop-1",
                propertyTitle: "Nyali Ocean Villa",
                baselinePrice: 85_000_000,
                active: true,
                createdAtISO: "2026-09-02T00:00:00.000Z",
            },
        ];

        const matched = findMatchingAlertSubscriptions({
            eventType: "price_drop",
            oldPrice: 85_000_000,
            property: {
                id: "prop-1",
                title: "Nyali Ocean Villa",
                city: "Mombasa",
                neighborhood: "Nyali",
                price: 78_000_000,
                agentId: "agent-1",
            },
            subscriptions: subs,
        });

        expect(matched).toHaveLength(1);
        expect(matched[0].type).toBe("price_watch");
    });
});
