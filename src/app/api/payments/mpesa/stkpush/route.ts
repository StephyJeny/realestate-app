import { NextRequest, NextResponse } from "next/server";
import {
    enforceRateLimit,
    verifyFirebaseAuth,
    patchFirestoreDocServer,
} from "@/lib/apiSecurity";
import {
    PROMOTION_TIER_PRICES,
    saveCheckoutSession,
    getDarajaBaseUrl,
    hasDarajaCredentials,
    isSandboxSimulationAllowed,
    getDarajaAccessToken,
} from "@/lib/mpesaServer";

export async function POST(req: NextRequest) {
    try {
        const rateLimitRes = enforceRateLimit(req, "mpesa-stkpush", 8, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const authUser = await verifyFirebaseAuth(req);
        if (!authUser) {
            return NextResponse.json(
                { error: "Please sign in to initiate an M-Pesa payment." },
                { status: 401 }
            );
        }

        const body = await req.json();
        const {
            phone,
            amount,
            reference,
            description,
            purpose = "reservation",
            propertyId,
            propertyTitle,
            promotionTier,
            currency = "KES",
        } = body;

        if (!phone) {
            return NextResponse.json(
                { error: "Safaricom phone number is required" },
                { status: 400 }
            );
        }

        if (!["reservation", "viewing_fee", "listing_promotion"].includes(purpose)) {
            return NextResponse.json(
                { error: "Invalid payment purpose" },
                { status: 400 }
            );
        }

        // Enforce server-side amount for promotions; validate bounds for other purposes
        let verifiedAmount = Math.round(Number(amount) || 0);
        const validTier: "featured_7" | "featured_14" | "featured_30" | undefined =
            promotionTier === "featured_30" || promotionTier === "featured_14" || promotionTier === "featured_7"
                ? promotionTier
                : purpose === "listing_promotion"
                ? "featured_7"
                : undefined;

        if (purpose === "listing_promotion" && validTier) {
            verifiedAmount = PROMOTION_TIER_PRICES[validTier];
        } else if (verifiedAmount < 1 || verifiedAmount > 10_000_000) {
            return NextResponse.json(
                { error: "Invalid payment amount" },
                { status: 400 }
            );
        }

        // Format Kenyan phone number to 254XXXXXXXXX
        let cleanPhone = phone.toString().replace(/\D/g, "");
        if (cleanPhone.startsWith("0")) {
            cleanPhone = "254" + cleanPhone.slice(1);
        } else if (cleanPhone.startsWith("+254")) {
            cleanPhone = cleanPhone.slice(1);
        } else if (!cleanPhone.startsWith("254") && cleanPhone.length === 9) {
            cleanPhone = "254" + cleanPhone;
        }

        if (!/^254[17]\d{8}$/.test(cleanPhone)) {
            return NextResponse.json(
                { error: "Please enter a valid Safaricom phone number (e.g. 0712345678 or 0112345678)" },
                { status: 400 }
            );
        }

        const passkey = process.env.MPESA_PASSKEY;
        const shortcode = process.env.MPESA_SHORTCODE || "174379";

        let checkoutRequestId = `ws_CO_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
        let merchantRequestId = `mr_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        let mode: "live" | "sandbox" = "sandbox";
        let darajaTimestamp: string | undefined;

        if (hasDarajaCredentials() && passkey) {
            const accessToken = await getDarajaAccessToken();
            if (!accessToken) {
                return NextResponse.json(
                    { error: "Could not authenticate with Safaricom Daraja API" },
                    { status: 502 }
                );
            }

            darajaTimestamp = new Date()
                .toISOString()
                .replace(/[^0-9]/g, "")
                .slice(0, 14);
            const password = Buffer.from(`${shortcode}${passkey}${darajaTimestamp}`).toString("base64");
            const callbackUrl =
                process.env.MPESA_CALLBACK_URL ||
                `${req.nextUrl.origin}/api/payments/mpesa/callback`;

            const stkRes = await fetch(
                `${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        BusinessShortCode: shortcode,
                        Password: password,
                        Timestamp: darajaTimestamp,
                        TransactionType: "CustomerPayBillOnline",
                        Amount: verifiedAmount,
                        PartyA: cleanPhone,
                        PartyB: shortcode,
                        PhoneNumber: cleanPhone,
                        CallBackURL: callbackUrl,
                        AccountReference: String(reference || "EstateVue").slice(0, 12),
                        TransactionDesc: String(description || "EstateVue Property Payment").slice(0, 30),
                    }),
                }
            );

            const stkData = await stkRes.json();
            if (!stkRes.ok || stkData.ResponseCode !== "0") {
                return NextResponse.json(
                    {
                        error:
                            stkData.errorMessage ||
                            stkData.ResponseDescription ||
                            "Safaricom Daraja rejected the STK push request",
                    },
                    { status: 400 }
                );
            }

            checkoutRequestId = stkData.CheckoutRequestID || checkoutRequestId;
            merchantRequestId = stkData.MerchantRequestID || merchantRequestId;
            mode = process.env.MPESA_ENV === "production" ? "live" : "sandbox";
        } else if (!isSandboxSimulationAllowed()) {
            return NextResponse.json(
                { error: "M-Pesa payment gateway is not configured." },
                { status: 503 }
            );
        }

        // Save pending checkout session on the server
        saveCheckoutSession({
            checkoutRequestId,
            merchantRequestId,
            userId: authUser.uid,
            phone: cleanPhone,
            amount: verifiedAmount,
            currency: String(currency || "KES"),
            purpose,
            propertyId: propertyId ? String(propertyId) : undefined,
            propertyTitle: propertyTitle ? String(propertyTitle) : undefined,
            promotionTier: validTier,
            mode,
            status: "pending",
            createdAtMs: Date.now(),
            darajaTimestamp,
        });

        // Create pending payment record in Firestore (status: "pending", serverVerified: false)
        await patchFirestoreDocServer(
            `payments/${checkoutRequestId}`,
            {
                checkoutRequestId,
                merchantRequestId,
                userId: authUser.uid,
                propertyId: propertyId || "",
                propertyTitle: propertyTitle || "EstateVue Property",
                amount: verifiedAmount,
                currency: String(currency || "KES"),
                purpose,
                mpesaReceiptNumber: "",
                phoneNumber: cleanPhone,
                status: "pending",
                paymentMethod: "mpesa",
                promotionTier: validTier || "",
                serverVerified: false,
                mode,
                createdAt: new Date(),
            },
            authUser.idToken
        );

        return NextResponse.json({
            ResponseCode: "0",
            ResponseDescription: "Success. Request accepted for processing",
            MerchantRequestID: merchantRequestId,
            CheckoutRequestID: checkoutRequestId,
            CustomerMessage: "Success. Check your phone for the M-Pesa PIN prompt.",
            phone: cleanPhone,
            amount: verifiedAmount,
            mode,
            status: "pending",
        });
    } catch (err: unknown) {
        console.error("M-Pesa STK Push error:", err);
        const message = err instanceof Error ? err.message : "Failed to process STK push";
        return NextResponse.json(
            { error: message },
            { status: 500 }
        );
    }
}
