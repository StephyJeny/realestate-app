/**
 * Post-Offer Digital "Deal Room" (Kenyan Conveyancing Tracker)
 * Shared Buyer–Agent–Advocate workspace tracking:
 * 1. Reservation Paid -> 2. Sale Agreement -> 3. ArdhiSasa Search
 * -> 4. LCB / Transfer Consent -> 5. Stamp Duty -> 6. Handover
 *
 * Persists to Firestore `deal_rooms/{inquiryId}` with automatic local fallback
 * so sandbox/demo sessions remain 100% interactive.
 */

import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import type { Inquiry } from "./firestore";

export type ConveyancingStageId =
    | "reservation_paid"
    | "sale_agreement"
    | "ardhisasa_search"
    | "lcb_consent"
    | "stamp_duty"
    | "handover";

export type StageStatus = "pending" | "in_progress" | "completed";

export interface ConveyancingStageRecord {
    id: ConveyancingStageId;
    stepNumber: number;
    title: string;
    subtitle: string;
    responsibleParty: "Buyer" | "Vendor Advocate" | "Joint Advocates" | "KRA / Buyer" | "All Parties";
    typicalSLA: string;
    status: StageStatus;
    completedAt?: string;
    completedBy?: string;
    referenceNote?: string;
}

export interface AdvocateDetails {
    firmName: string;
    advocateName: string;
    lskNumber: string;
    email: string;
    phone: string;
}

export type DealDocCategory =
    | "loi"
    | "reservation_receipt"
    | "sale_agreement"
    | "ardhisasa_search"
    | "consent_clearance"
    | "stamp_duty"
    | "snagging_handover";

export interface DealRoomDocument {
    id: string;
    name: string;
    category: DealDocCategory;
    url: string;
    uploadedByRole: "buyer" | "agent" | "advocate";
    uploadedByName: string;
    uploadedAt: string;
    fileSizeLabel?: string;
}

export interface DealActivityItem {
    id: string;
    actorName: string;
    actorRole: "buyer" | "agent" | "system";
    message: string;
    timestamp: string;
}

export interface DealRoomData {
    id: string; // Matches inquiryId
    inquiryId: string;
    propertyId: string;
    propertyTitle: string;
    loiNumber: string;
    agreedOrOfferedPriceKES: number;
    financingType: string;
    downPaymentPercent: number;
    buyerId: string;
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    agentId: string;
    agentName: string;
    buyerAdvocate?: AdvocateDetails;
    vendorAdvocate?: AdvocateDetails;
    stages: ConveyancingStageRecord[];
    documents: DealRoomDocument[];
    activities: DealActivityItem[];
    updatedAtISO: string;
}

export const DEFAULT_CONVEYANCING_STAGES: Omit<ConveyancingStageRecord, "status">[] = [
    {
        id: "reservation_paid",
        stepNumber: 1,
        title: "Reservation & Earnest Deposit",
        subtitle: "LOI counter-signed & reservation deposit locked (M-Pesa / Escrow)",
        responsibleParty: "Buyer",
        typicalSLA: "Day 1–3",
    },
    {
        id: "sale_agreement",
        stepNumber: 2,
        title: "LSK Sale Agreement & 10% Deposit",
        subtitle: "Vendor's advocate issues Agreement for Sale; 10% held as stakeholder",
        responsibleParty: "Vendor Advocate",
        typicalSLA: "Day 7–14",
    },
    {
        id: "ardhisasa_search",
        stepNumber: 3,
        title: "ArdhiSasa Search & Rates Clearance",
        subtitle: "Official title search, County rates clearance & land rent certificate",
        responsibleParty: "Joint Advocates",
        typicalSLA: "Day 15–30",
    },
    {
        id: "lcb_consent",
        stepNumber: 4,
        title: "Consent to Transfer / LCB Approval",
        subtitle: "Commissioner of Lands leasehold consent or Land Control Board consent",
        responsibleParty: "Vendor Advocate",
        typicalSLA: "Day 30–45",
    },
    {
        id: "stamp_duty",
        stepNumber: 5,
        title: "Valuation & Stamp Duty (4% / 2%)",
        subtitle: "Government valuation assessment & KRA iTax / ArdhiSasa duty payment",
        responsibleParty: "KRA / Buyer",
        typicalSLA: "Day 45–60",
    },
    {
        id: "handover",
        stepNumber: 6,
        title: "Title Registration & Key Handover",
        subtitle: "Title registered in buyer's name, snagging signed off & escrow released",
        responsibleParty: "All Parties",
        typicalSLA: "Day 60–90",
    },
];

const LOCAL_CACHE_PREFIX = "estatevue_dealroom_";

function readLocalCache(id: string): DealRoomData | null {
    if (typeof window === "undefined") return null;
    try {
        const raw = localStorage.getItem(`${LOCAL_CACHE_PREFIX}${id}`);
        return raw ? (JSON.parse(raw) as DealRoomData) : null;
    } catch {
        return null;
    }
}

function writeLocalCache(data: DealRoomData) {
    if (typeof window === "undefined") return;
    try {
        localStorage.setItem(`${LOCAL_CACHE_PREFIX}${data.id}`, JSON.stringify(data));
    } catch {
        // Ignore storage quota errors
    }
}

export function buildInitialDealRoomFromInquiry(inquiry: Inquiry): DealRoomData {
    const id = inquiry.id || `deal-${Date.now()}`;
    const offer = inquiry.offerDetails;
    const isAccepted = offer?.offerStatus === "accepted" || inquiry.stage === "closed";
    const price = offer?.counterPrice && offer.offerStatus === "countered"
        ? offer.counterPrice
        : offer?.offeredPrice || 0;

    const nowISO = new Date().toISOString();

    const stages: ConveyancingStageRecord[] = DEFAULT_CONVEYANCING_STAGES.map((tpl, idx) => {
        if (idx === 0) {
            return {
                ...tpl,
                status: isAccepted ? "completed" : "in_progress",
                completedAt: isAccepted ? nowISO : undefined,
                completedBy: isAccepted ? "Offer Accepted" : undefined,
                referenceNote: offer?.loiNumber ? `LOI Ref: ${offer.loiNumber}` : undefined,
            };
        }
        if (idx === 1 && isAccepted) {
            return {
                ...tpl,
                status: "in_progress",
            };
        }
        return {
            ...tpl,
            status: "pending",
        };
    });

    return {
        id,
        inquiryId: id,
        propertyId: inquiry.propertyId,
        propertyTitle: inquiry.propertyTitle || "EstateVue Property",
        loiNumber: offer?.loiNumber || `EV-LOI-${new Date().getFullYear()}-1001`,
        agreedOrOfferedPriceKES: price,
        financingType: offer?.financingType || "cash",
        downPaymentPercent: offer?.downPaymentPercent || 10,
        buyerId: inquiry.senderId,
        buyerName: inquiry.senderName || "Purchaser",
        buyerEmail: inquiry.senderEmail || "",
        buyerPhone: inquiry.senderPhone || "",
        agentId: inquiry.agentId,
        agentName: "Listing Agent",
        stages,
        documents: [],
        activities: [
            {
                id: `act-init-${id}`,
                actorName: "EstateVue Conveyancing Desk",
                actorRole: "system",
                message: `Digital Deal Room initialized for ${inquiry.propertyTitle} (${offer?.loiNumber || "LOI"}).`,
                timestamp: nowISO,
            },
        ],
        updatedAtISO: nowISO,
    };
}

export function calculateDealProgressPct(stages: ConveyancingStageRecord[]): number {
    if (!stages.length) return 0;
    const score = stages.reduce((sum, s) => {
        if (s.status === "completed") return sum + 1;
        if (s.status === "in_progress") return sum + 0.35;
        return sum;
    }, 0);
    return Math.min(100, Math.round((score / stages.length) * 100));
}

export async function getOrInitDealRoom(inquiry: Inquiry): Promise<DealRoomData> {
    const id = inquiry.id || `deal-local`;
    try {
        const ref = doc(db, "deal_rooms", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const remote = snap.data() as DealRoomData;
            writeLocalCache(remote);
            return remote;
        }
    } catch {
        // Fallback to local cache or fresh initialization
    }

    const cached = readLocalCache(id);
    if (cached) return cached;

    const initial = buildInitialDealRoomFromInquiry(inquiry);
    await saveDealRoom(initial);
    return initial;
}

export async function saveDealRoom(dealRoom: DealRoomData): Promise<DealRoomData> {
    const updated: DealRoomData = {
        ...dealRoom,
        updatedAtISO: new Date().toISOString(),
    };
    writeLocalCache(updated);

    try {
        const ref = doc(db, "deal_rooms", updated.id);
        await setDoc(
            ref,
            {
                ...updated,
                updatedAt: serverTimestamp(),
            },
            { merge: true }
        );
    } catch {
        // Kept safely in local cache if rules/offline prevent remote write
    }

    return updated;
}
