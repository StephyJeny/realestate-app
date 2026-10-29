import { describe, expect, it } from "vitest";
import {
    DEFAULT_CONVEYANCING_STAGES,
    buildInitialDealRoomFromInquiry,
    calculateDealProgressPct,
} from "./dealRoom";
import type { Inquiry } from "./firestore";

describe("Deal Room conveyancing tracker", () => {
    const baseInquiry: Inquiry = {
        id: "inq-test-101",
        propertyId: "prop-1",
        propertyTitle: "Luxury Villa in Karen",
        senderId: "buyer-1",
        senderName: "Wanjiku Mwangi",
        senderEmail: "wanjiku@example.com",
        senderPhone: "+254700000001",
        agentId: "agent-1",
        message: "Submitting formal offer",
        type: "offer",
        status: "pending",
        stage: "offer_made",
        offerDetails: {
            offeredPrice: 45_000_000,
            askingPrice: 48_000_000,
            financingType: "mortgage",
            downPaymentPercent: 20,
            downPaymentAmount: 9_000_000,
            moveInDate: "2026-12-15",
            contingencies: ["Subject to ArdhiSasa Official Search"],
            loiNumber: "EV-LOI-2026-9901",
            offerStatus: "pending",
        },
    };

    it("initializes 6 Kenyan conveyancing stages with Reservation in progress for pending offers", () => {
        const room = buildInitialDealRoomFromInquiry(baseInquiry);
        expect(room.stages).toHaveLength(6);
        expect(room.stages[0].id).toBe("reservation_paid");
        expect(room.stages[0].status).toBe("in_progress");
        expect(room.stages[1].status).toBe("pending");
        expect(room.agreedOrOfferedPriceKES).toBe(45_000_000);
        expect(room.loiNumber).toBe("EV-LOI-2026-9901");
    });

    it("marks Reservation completed and Sale Agreement in progress when offer is accepted", () => {
        const acceptedInquiry: Inquiry = {
            ...baseInquiry,
            offerDetails: {
                ...baseInquiry.offerDetails!,
                offerStatus: "accepted",
            },
        };
        const room = buildInitialDealRoomFromInquiry(acceptedInquiry);
        expect(room.stages[0].status).toBe("completed");
        expect(room.stages[1].id).toBe("sale_agreement");
        expect(room.stages[1].status).toBe("in_progress");
    });

    it("uses counterPrice when offerStatus is countered", () => {
        const counteredInquiry: Inquiry = {
            ...baseInquiry,
            offerDetails: {
                ...baseInquiry.offerDetails!,
                offerStatus: "countered",
                counterPrice: 47_500_000,
            },
        };
        const room = buildInitialDealRoomFromInquiry(counteredInquiry);
        expect(room.agreedOrOfferedPriceKES).toBe(47_500_000);
    });

    it("calculates progress percentage monotonically from 0% to 100%", () => {
        const allPending = DEFAULT_CONVEYANCING_STAGES.map((s) => ({ ...s, status: "pending" as const }));
        const allCompleted = DEFAULT_CONVEYANCING_STAGES.map((s) => ({ ...s, status: "completed" as const }));

        expect(calculateDealProgressPct(allPending)).toBe(0);
        expect(calculateDealProgressPct(allCompleted)).toBe(100);
    });
});
