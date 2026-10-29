import { NextRequest, NextResponse } from "next/server";
import {
    enforceRateLimit,
    verifyFirebaseAuth,
    getFirestoreDocServer,
    patchFirestoreDocServer,
} from "@/lib/apiSecurity";
import {
    generateCardReceipt,
    getCardSession,
    isCardSandboxAllowed,
    updateCardSession,
} from "@/lib/cardPaymentServer";

/**
 * Server-side Card Checkout Verification (Paystack / Stripe / Hosted Sandbox).
 * Endpoint: POST /api/payments/card/verify
 */
export async function POST(req: NextRequest) {
    try {
        const rateLimitRes = enforceRateLimit(req, "card-verify", 30, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const authUser = await verifyFirebaseAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        const body = await req.json();
        const reference = String(body?.reference || "").trim();
        if (!reference) {
            return NextResponse.json({ error: "Card reference is required" }, { status: 400 });
        }

        const session = getCardSession(reference);
        const firestoreDoc = await getFirestoreDocServer(
            `payments/${reference}`,
            authUser.idToken
        );

        const ownerUid = session?.userId || firestoreDoc?.userId;
        if (!ownerUid || ownerUid !== authUser.uid) {
            return NextResponse.json(
                { error: "Card payment session not found for this user" },
                { status: 403 }
            );
        }

        if (firestoreDoc?.status === "completed" && firestoreDoc?.serverVerified) {
            return NextResponse.json({
                status: "completed",
                payment: firestoreDoc,
            });
        }

        const provider: "paystack" | "stripe" =
            session?.provider ||
            (firestoreDoc?.cardProvider === "stripe" ? "stripe" : "paystack");

        let currentStatus: "pending" | "completed" | "failed" = session?.status || "pending";
        let receiptNumber =
            session?.receiptNumber ||
            (typeof firestoreDoc?.mpesaReceiptNumber === "string"
                ? firestoreDoc.mpesaReceiptNumber
                : "");

        // 1. Live gateway verification
        if (currentStatus === "pending" && provider === "paystack" && process.env.PAYSTACK_SECRET_KEY) {
            const psRes = await fetch(
                `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
                {
                    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
                    cache: "no-store",
                }
            );
            if (psRes.ok) {
                const psData = await psRes.json();
                const gatewayStatus = psData?.data?.status;
                if (gatewayStatus === "success") {
                    currentStatus = "completed";
                    receiptNumber =
                        String(psData?.data?.reference || "") || generateCardReceipt("paystack");
                    updateCardSession(reference, { status: "completed", receiptNumber });
                } else if (gatewayStatus === "failed" || gatewayStatus === "abandoned") {
                    currentStatus = "failed";
                    updateCardSession(reference, { status: "failed" });
                }
            }
        } else if (
            currentStatus === "pending" &&
            provider === "stripe" &&
            process.env.STRIPE_SECRET_KEY
        ) {
            const stRes = await fetch(
                `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(reference)}`,
                {
                    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
                    cache: "no-store",
                }
            );
            if (stRes.ok) {
                const stData = await stRes.json();
                if (stData?.payment_status === "paid") {
                    currentStatus = "completed";
                    receiptNumber =
                        String(stData?.payment_intent || "") || generateCardReceipt("stripe");
                    updateCardSession(reference, { status: "completed", receiptNumber });
                } else if (stData?.status === "expired") {
                    currentStatus = "failed";
                    updateCardSession(reference, { status: "failed" });
                }
            }
        } else if (
            currentStatus === "pending" &&
            !process.env.PAYSTACK_SECRET_KEY &&
            !process.env.STRIPE_SECRET_KEY &&
            isCardSandboxAllowed()
        ) {
            // PCI-safe sandbox hosted gateway completion (simulates 3D-Secure bank approval)
            const createdMs = session?.createdAtMs || 0;
            if (!createdMs || Date.now() - createdMs >= 1800) {
                currentStatus = "completed";
                receiptNumber = receiptNumber || generateCardReceipt(provider);
                updateCardSession(reference, { status: "completed", receiptNumber });
            }
        }

        if (currentStatus === "pending") {
            return NextResponse.json({ status: "pending", reference });
        }

        if (currentStatus === "failed") {
            await patchFirestoreDocServer(
                `payments/${reference}`,
                {
                    status: "failed",
                    serverVerified: true,
                    completedAt: new Date(),
                },
                authUser.idToken
            );
            return NextResponse.json({
                status: "failed",
                error: "Card authorization was declined or cancelled.",
            });
        }

        const finalReceipt = receiptNumber || generateCardReceipt(provider);
        const purpose = session?.purpose || String(firestoreDoc?.purpose || "reservation");
        const propertyId = session?.propertyId || String(firestoreDoc?.propertyId || "");
        const propertyTitle =
            session?.propertyTitle || String(firestoreDoc?.propertyTitle || "EstateVue Property");
        const amount = session?.amount || Number(firestoreDoc?.amount || 0);
        const currency = session?.currency || String(firestoreDoc?.currency || "KES");
        const promotionTier =
            session?.promotionTier || String(firestoreDoc?.promotionTier || "featured_7");
        const mode = session?.mode || String(firestoreDoc?.mode || "sandbox");

        await patchFirestoreDocServer(
            `payments/${reference}`,
            {
                status: "completed",
                mpesaReceiptNumber: finalReceipt,
                serverVerified: true,
                completedAt: new Date(),
            },
            authUser.idToken
        );

        if (purpose === "listing_promotion" && propertyId) {
            const days =
                promotionTier === "featured_30" ? 30 : promotionTier === "featured_14" ? 14 : 7;
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + days);

            await patchFirestoreDocServer(
                `properties/${propertyId}`,
                {
                    isFeatured: true,
                    promotedUntil: expiry.toISOString(),
                    promotionTier,
                    promotedByPaymentId: reference,
                    updatedAt: new Date(),
                },
                authUser.idToken
            );
        }

        return NextResponse.json({
            status: "completed",
            payment: {
                checkoutRequestId: reference,
                userId: authUser.uid,
                propertyId,
                propertyTitle,
                amount,
                currency,
                purpose,
                mpesaReceiptNumber: finalReceipt,
                phoneNumber: authUser.email || "",
                status: "completed",
                paymentMethod: "card",
                cardProvider: provider,
                promotionTier,
                serverVerified: true,
                mode,
            },
        });
    } catch (err: unknown) {
        console.error("Card verify error:", err);
        const msg = err instanceof Error ? err.message : "Failed to verify card payment";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
