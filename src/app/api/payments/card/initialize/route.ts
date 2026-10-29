import { NextRequest, NextResponse } from "next/server";
import {
    enforceRateLimit,
    verifyFirebaseAuth,
    patchFirestoreDocServer,
} from "@/lib/apiSecurity";
import {
    PROMOTION_TIER_PRICES,
    VALID_CHECKOUT_PURPOSES,
    CheckoutPurpose,
} from "@/lib/mpesaServer";
import {
    detectConfiguredCardProvider,
    isCardSandboxAllowed,
    saveCardSession,
} from "@/lib/cardPaymentServer";

/**
 * PCI-DSS Safe Hosted Card Checkout Initialization (Paystack / Stripe / Hosted Sandbox).
 * Never accepts or processes raw card PAN/CVV numbers — initializes a hosted session on the gateway.
 * Endpoint: POST /api/payments/card/initialize
 */
export async function POST(req: NextRequest) {
    try {
        const rateLimitRes = enforceRateLimit(req, "card-init", 10, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const authUser = await verifyFirebaseAuth(req);
        if (!authUser) {
            return NextResponse.json(
                { error: "Please sign in to initiate card checkout." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            amount,
            purpose = "reservation",
            propertyId,
            propertyTitle = "EstateVue Property",
            promotionTier,
            currency = "KES",
            preferredProvider,
        } = body;

        if (!VALID_CHECKOUT_PURPOSES.includes(purpose as CheckoutPurpose)) {
            return NextResponse.json(
                { error: "Invalid payment purpose" },
                { status: 400 }
            );
        }

        let verifiedAmount = Math.round(Number(amount) || 0);
        const validTier: "featured_7" | "featured_14" | "featured_30" | undefined =
            promotionTier === "featured_30" ||
            promotionTier === "featured_14" ||
            promotionTier === "featured_7"
                ? promotionTier
                : purpose === "listing_promotion"
                ? "featured_7"
                : undefined;

        if (purpose === "listing_promotion" && validTier) {
            verifiedAmount = PROMOTION_TIER_PRICES[validTier];
        } else if (verifiedAmount < 1 || verifiedAmount > 25_000_000) {
            return NextResponse.json(
                { error: "Invalid payment amount" },
                { status: 400 }
            );
        }

        const cleanCurrency = ["KES", "USD", "EUR", "GBP"].includes(String(currency).toUpperCase())
            ? String(currency).toUpperCase()
            : "KES";
        const buyerEmail = authUser.email || "escrow@estatevue.co.ke";

        const detected = detectConfiguredCardProvider();
        const provider: "paystack" | "stripe" =
            preferredProvider === "stripe" && process.env.STRIPE_SECRET_KEY
                ? "stripe"
                : preferredProvider === "paystack" && process.env.PAYSTACK_SECRET_KEY
                ? "paystack"
                : preferredProvider === "stripe" && !process.env.PAYSTACK_SECRET_KEY
                ? "stripe"
                : detected.provider;

        let reference = `card_EV_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
        let authorizationUrl: string | undefined;
        let mode: "live" | "sandbox" = "sandbox";

        const returnOrigin = req.nextUrl.origin;
        const callbackUrl = propertyId
            ? `${returnOrigin}/properties/${encodeURIComponent(String(propertyId))}?cardRef=${encodeURIComponent(reference)}`
            : `${returnOrigin}/dashboard/buyer?cardRef=${encodeURIComponent(reference)}`;

        if (provider === "paystack" && process.env.PAYSTACK_SECRET_KEY) {
            const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: buyerEmail,
                    amount: verifiedAmount * 100, // Paystack expects subunits (cents / kobo)
                    currency: cleanCurrency === "KES" || cleanCurrency === "USD" ? cleanCurrency : "KES",
                    reference,
                    callback_url: callbackUrl,
                    channels: ["card", "bank_transfer", "apple_pay"],
                    metadata: {
                        userId: authUser.uid,
                        purpose,
                        propertyId: propertyId || "",
                        propertyTitle,
                    },
                }),
                cache: "no-store",
            });

            const psData = await psRes.json();
            if (!psRes.ok || !psData?.status || !psData?.data?.authorization_url) {
                return NextResponse.json(
                    { error: psData?.message || "Paystack failed to initialize card checkout" },
                    { status: 502 }
                );
            }

            reference = psData.data.reference || reference;
            authorizationUrl = psData.data.authorization_url;
            mode = process.env.PAYSTACK_SECRET_KEY.startsWith("sk_live_") ? "live" : "sandbox";
        } else if (provider === "stripe" && process.env.STRIPE_SECRET_KEY) {
            const params = new URLSearchParams();
            params.set("mode", "payment");
            params.set("customer_email", buyerEmail);
            params.set("success_url", `${callbackUrl}&session_id={CHECKOUT_SESSION_ID}`);
            params.set("cancel_url", returnOrigin);
            params.set("line_items[0][quantity]", "1");
            params.set("line_items[0][price_data][currency]", cleanCurrency.toLowerCase());
            params.set("line_items[0][price_data][unit_amount]", String(verifiedAmount * 100));
            params.set(
                "line_items[0][price_data][product_data][name]",
                `${propertyTitle} — EstateVue (${purpose.replace(/_/g, " ")})`
            );
            params.set("metadata[userId]", authUser.uid);
            params.set("metadata[purpose]", String(purpose));

            const stRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: params.toString(),
                cache: "no-store",
            });

            const stData = await stRes.json();
            if (!stRes.ok || !stData?.id || !stData?.url) {
                return NextResponse.json(
                    { error: stData?.error?.message || "Stripe failed to create Checkout Session" },
                    { status: 502 }
                );
            }

            reference = stData.id;
            authorizationUrl = stData.url;
            mode = process.env.STRIPE_SECRET_KEY.startsWith("sk_live_") ? "live" : "sandbox";
        } else if (!isCardSandboxAllowed()) {
            return NextResponse.json(
                { error: "Hosted card gateway is not configured." },
                { status: 503 }
            );
        }

        saveCardSession({
            reference,
            provider,
            userId: authUser.uid,
            email: buyerEmail,
            amount: verifiedAmount,
            currency: cleanCurrency,
            purpose: purpose as CheckoutPurpose,
            propertyId: propertyId ? String(propertyId) : undefined,
            propertyTitle: String(propertyTitle),
            promotionTier: validTier,
            mode,
            status: "pending",
            authorizationUrl,
            createdAtMs: Date.now(),
        });

        await patchFirestoreDocServer(
            `payments/${reference}`,
            {
                checkoutRequestId: reference,
                merchantRequestId: `card_${provider}_${Date.now()}`,
                userId: authUser.uid,
                propertyId: propertyId || "",
                propertyTitle: propertyTitle || "EstateVue Property",
                amount: verifiedAmount,
                currency: cleanCurrency,
                purpose,
                mpesaReceiptNumber: "",
                phoneNumber: buyerEmail,
                status: "pending",
                paymentMethod: "card",
                cardProvider: provider,
                promotionTier: validTier || "",
                serverVerified: false,
                mode,
                createdAt: new Date(),
            },
            authUser.idToken
        );

        return NextResponse.json({
            reference,
            provider,
            authorizationUrl: authorizationUrl || null,
            amount: verifiedAmount,
            currency: cleanCurrency,
            mode,
            status: "pending",
        });
    } catch (err: unknown) {
        console.error("Card checkout initialize error:", err);
        const msg = err instanceof Error ? err.message : "Failed to initialize card checkout";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
