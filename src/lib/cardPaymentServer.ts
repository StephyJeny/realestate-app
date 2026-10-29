import { CheckoutPurpose } from "./mpesaServer";

export interface PendingCardSession {
    reference: string;
    provider: "paystack" | "stripe";
    userId: string;
    email: string;
    amount: number;
    currency: string;
    purpose: CheckoutPurpose;
    propertyId?: string;
    propertyTitle?: string;
    promotionTier?: "featured_7" | "featured_14" | "featured_30";
    mode: "live" | "sandbox";
    status: "pending" | "completed" | "failed";
    receiptNumber?: string;
    authorizationUrl?: string;
    createdAtMs: number;
}

const cardSessionStore = new Map<string, PendingCardSession>();

export function saveCardSession(session: PendingCardSession) {
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [k, v] of cardSessionStore.entries()) {
        if (v.createdAtMs < cutoff) cardSessionStore.delete(k);
    }
    cardSessionStore.set(session.reference, session);
}

export function getCardSession(reference: string): PendingCardSession | undefined {
    return cardSessionStore.get(reference);
}

export function updateCardSession(
    reference: string,
    update: { status: "completed" | "failed"; receiptNumber?: string }
) {
    const existing = cardSessionStore.get(reference);
    if (existing) {
        existing.status = update.status;
        if (update.receiptNumber) existing.receiptNumber = update.receiptNumber;
        cardSessionStore.set(reference, existing);
    }
}

export function detectConfiguredCardProvider(): {
    provider: "paystack" | "stripe";
    mode: "live" | "sandbox";
} {
    if (process.env.PAYSTACK_SECRET_KEY) {
        return {
            provider: "paystack",
            mode: process.env.PAYSTACK_SECRET_KEY.startsWith("sk_live_") ? "live" : "sandbox",
        };
    }
    if (process.env.STRIPE_SECRET_KEY) {
        return {
            provider: "stripe",
            mode: process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "live" : "sandbox",
        };
    }
    return { provider: "paystack", mode: "sandbox" };
}

export function isCardSandboxAllowed(): boolean {
    return (
        process.env.NODE_ENV !== "production" ||
        process.env.MPESA_SANDBOX_SIMULATION === "true" ||
        process.env.CARD_SANDBOX_SIMULATION === "true"
    );
}

export function generateCardReceipt(provider: "paystack" | "stripe" = "paystack"): string {
    const prefix = provider === "stripe" ? "STP" : "PSK";
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = `${prefix}-`;
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
