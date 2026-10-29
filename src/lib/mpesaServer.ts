// Server-side M-Pesa Daraja state & helper functions

export const PROMOTION_TIER_PRICES: Record<"featured_7" | "featured_14" | "featured_30", number> = {
    featured_7: 2500,
    featured_14: 4500,
    featured_30: 8000,
};

export type CheckoutPurpose =
    | "reservation"
    | "viewing_fee"
    | "listing_promotion"
    | "rent_deposit"
    | "short_stay_booking";

export const VALID_CHECKOUT_PURPOSES: CheckoutPurpose[] = [
    "reservation",
    "viewing_fee",
    "listing_promotion",
    "rent_deposit",
    "short_stay_booking",
];

export interface PendingCheckoutSession {
    checkoutRequestId: string;
    merchantRequestId: string;
    userId: string;
    phone: string;
    amount: number;
    currency: string;
    purpose: CheckoutPurpose;
    propertyId?: string;
    propertyTitle?: string;
    promotionTier?: "featured_7" | "featured_14" | "featured_30";
    mode: "live" | "sandbox";
    status: "pending" | "completed" | "failed";
    mpesaReceiptNumber?: string;
    resultDesc?: string;
    createdAtMs: number;
    darajaTimestamp?: string;
}

const checkoutStore = new Map<string, PendingCheckoutSession>();

export function saveCheckoutSession(session: PendingCheckoutSession) {
    // Cleanup sessions older than 1 hour
    const cutoff = Date.now() - 60 * 60 * 1000;
    for (const [k, v] of checkoutStore.entries()) {
        if (v.createdAtMs < cutoff) checkoutStore.delete(k);
    }
    checkoutStore.set(session.checkoutRequestId, session);
}

export function getCheckoutSession(checkoutRequestId: string): PendingCheckoutSession | undefined {
    return checkoutStore.get(checkoutRequestId);
}

export function updateCheckoutFromCallback(
    checkoutRequestId: string,
    update: {
        status: "completed" | "failed";
        mpesaReceiptNumber?: string;
        resultDesc?: string;
    }
) {
    const existing = checkoutStore.get(checkoutRequestId);
    if (existing) {
        existing.status = update.status;
        if (update.mpesaReceiptNumber) existing.mpesaReceiptNumber = update.mpesaReceiptNumber;
        if (update.resultDesc) existing.resultDesc = update.resultDesc;
        checkoutStore.set(checkoutRequestId, existing);
    }
}

export function getDarajaBaseUrl(): string {
    return process.env.MPESA_ENV === "production"
        ? "https://api.safaricom.co.ke"
        : "https://sandbox.safaricom.co.ke";
}

export function hasDarajaCredentials(): boolean {
    return Boolean(
        process.env.MPESA_CONSUMER_KEY &&
        process.env.MPESA_CONSUMER_SECRET &&
        process.env.MPESA_PASSKEY
    );
}

export function isSandboxSimulationAllowed(): boolean {
    return process.env.NODE_ENV !== "production" || process.env.MPESA_SANDBOX_SIMULATION === "true";
}

export async function getDarajaAccessToken(): Promise<string | null> {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    if (!consumerKey || !consumerSecret) return null;

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
    const res = await fetch(
        `${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
        {
            headers: { Authorization: `Basic ${auth}` },
            cache: "no-store",
        }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data?.access_token || null;
}

export function generateServerReceipt(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let receipt = "TK";
    for (let i = 0; i < 8; i++) {
        receipt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return receipt;
}
