import { NextRequest, NextResponse } from "next/server";
import {
    enforceRateLimit,
    verifyFirebaseAuth,
    getFirestoreDocServer,
    patchFirestoreDocServer,
} from "@/lib/apiSecurity";
import {
    getCheckoutSession,
    updateCheckoutFromCallback,
    hasDarajaCredentials,
    isSandboxSimulationAllowed,
    getDarajaBaseUrl,
    getDarajaAccessToken,
    generateServerReceipt,
} from "@/lib/mpesaServer";

/**
 * Server-side M-Pesa payment verification & completion endpoint.
 * Endpoint: POST /api/payments/mpesa/verify
 */
export async function POST(req: NextRequest) {
    try {
        const rateLimitRes = enforceRateLimit(req, "mpesa-verify", 30, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const authUser = await verifyFirebaseAuth(req);
        if (!authUser) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const checkoutRequestId = String(body?.checkoutRequestId || "").trim();
        if (!checkoutRequestId) {
            return NextResponse.json(
                { error: "checkoutRequestId is required" },
                { status: 400 }
            );
        }

        const session = getCheckoutSession(checkoutRequestId);
        const firestoreDoc = await getFirestoreDocServer(
            `payments/${checkoutRequestId}`,
            authUser.idToken
        );

        const ownerUid = session?.userId || firestoreDoc?.userId;
        if (!ownerUid || ownerUid !== authUser.uid) {
            return NextResponse.json(
                { error: "Payment session not found for this user" },
                { status: 403 }
            );
        }

        // If already finalized in Firestore, return it immediately
        if (firestoreDoc?.status === "completed" && firestoreDoc?.serverVerified) {
            return NextResponse.json({
                status: "completed",
                payment: firestoreDoc,
            });
        }

        const docStatus = firestoreDoc?.status;
        const parsedDocStatus: "pending" | "completed" | "failed" | undefined =
            docStatus === "pending" || docStatus === "completed" || docStatus === "failed"
                ? docStatus
                : undefined;

        let currentStatus: "pending" | "completed" | "failed" =
            session?.status || parsedDocStatus || "pending";
        let receiptNumber =
            session?.mpesaReceiptNumber ||
            (typeof firestoreDoc?.mpesaReceiptNumber === "string" ? firestoreDoc.mpesaReceiptNumber : "");
        let resultDesc = session?.resultDesc || "";

        // 1. If live/sandbox Daraja credentials exist and still pending, query Daraja STK status API
        if (currentStatus === "pending" && hasDarajaCredentials() && process.env.MPESA_PASSKEY) {
            try {
                const accessToken = await getDarajaAccessToken();
                if (accessToken) {
                    const shortcode = process.env.MPESA_SHORTCODE || "174379";
                    const timestamp = new Date()
                        .toISOString()
                        .replace(/[^0-9]/g, "")
                        .slice(0, 14);
                    const password = Buffer.from(
                        `${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`
                    ).toString("base64");

                    const queryRes = await fetch(
                        `${getDarajaBaseUrl()}/mpesa/stkpushquery/v1/query`,
                        {
                            method: "POST",
                            headers: {
                                Authorization: `Bearer ${accessToken}`,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                BusinessShortCode: shortcode,
                                Password: password,
                                Timestamp: timestamp,
                                CheckoutRequestID: checkoutRequestId,
                            }),
                            cache: "no-store",
                        }
                    );

                    if (queryRes.ok) {
                        const queryData = await queryRes.json();
                        if (String(queryData.ResultCode) === "0") {
                            currentStatus = "completed";
                            receiptNumber = receiptNumber || generateServerReceipt();
                            updateCheckoutFromCallback(checkoutRequestId, {
                                status: "completed",
                                mpesaReceiptNumber: receiptNumber,
                                resultDesc: queryData.ResultDesc,
                            });
                        } else if (queryData.ResultCode !== undefined) {
                            currentStatus = "failed";
                            resultDesc = queryData.ResultDesc || "Payment cancelled or failed";
                            updateCheckoutFromCallback(checkoutRequestId, {
                                status: "failed",
                                resultDesc,
                            });
                        }
                    }
                }
            } catch (queryErr) {
                console.warn("Daraja STK query still pending:", queryErr);
            }
        }

        // 2. If running in local/dev sandbox simulation without Daraja credentials
        if (
            currentStatus === "pending" &&
            !hasDarajaCredentials() &&
            isSandboxSimulationAllowed()
        ) {
            const rawCreatedAt = firestoreDoc?.createdAt;
            const createdMs =
                session?.createdAtMs ||
                (typeof rawCreatedAt === "string" || typeof rawCreatedAt === "number"
                    ? new Date(rawCreatedAt).getTime()
                    : 0);
            if (!createdMs || Date.now() - createdMs >= 4000) {
                currentStatus = "completed";
                receiptNumber = receiptNumber || generateServerReceipt();
                updateCheckoutFromCallback(checkoutRequestId, {
                    status: "completed",
                    mpesaReceiptNumber: receiptNumber,
                    resultDesc: "Sandbox STK push confirmed by server",
                });
            }
        }

        if (currentStatus === "pending") {
            return NextResponse.json({
                status: "pending",
                checkoutRequestId,
            });
        }

        if (currentStatus === "failed") {
            await patchFirestoreDocServer(
                `payments/${checkoutRequestId}`,
                {
                    status: "failed",
                    serverVerified: true,
                    completedAt: new Date(),
                },
                authUser.idToken
            );

            return NextResponse.json({
                status: "failed",
                error: resultDesc || "Payment was cancelled or timed out.",
            });
        }

        // 3. Finalize completed payment on the server
        const finalReceipt = receiptNumber || generateServerReceipt();
        const purpose = session?.purpose || String(firestoreDoc?.purpose || "reservation");
        const propertyId = session?.propertyId || String(firestoreDoc?.propertyId || "");
        const propertyTitle = session?.propertyTitle || String(firestoreDoc?.propertyTitle || "EstateVue Property");
        const amount = session?.amount || Number(firestoreDoc?.amount || 0);
        const currency = session?.currency || String(firestoreDoc?.currency || "KES");
        const phone = session?.phone || String(firestoreDoc?.phoneNumber || "");
        const promotionTier = session?.promotionTier || String(firestoreDoc?.promotionTier || "featured_7");
        const mode = session?.mode || String(firestoreDoc?.mode || "sandbox");

        await patchFirestoreDocServer(
            `payments/${checkoutRequestId}`,
            {
                status: "completed",
                mpesaReceiptNumber: finalReceipt,
                serverVerified: true,
                completedAt: new Date(),
            },
            authUser.idToken
        );

        // If listing promotion, activate promotion on the property (verified by Firestore rules via promotedByPaymentId)
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
                    promotedByPaymentId: checkoutRequestId,
                    updatedAt: new Date(),
                },
                authUser.idToken
            );
        }

        return NextResponse.json({
            status: "completed",
            payment: {
                checkoutRequestId,
                userId: authUser.uid,
                propertyId,
                propertyTitle,
                amount,
                currency,
                purpose,
                mpesaReceiptNumber: finalReceipt,
                phoneNumber: phone,
                status: "completed",
                paymentMethod: "mpesa",
                promotionTier,
                serverVerified: true,
                mode,
            },
        });
    } catch (err: unknown) {
        console.error("M-Pesa Verify Error:", err);
        const message = err instanceof Error ? err.message : "Failed to verify payment";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
