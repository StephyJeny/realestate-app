import { NextRequest, NextResponse } from "next/server";
import { updateCheckoutFromCallback } from "@/lib/mpesaServer";

/**
 * Safaricom Daraja M-Pesa STK Push Callback Webhook
 * Endpoint: POST /api/payments/mpesa/callback
 */
export async function POST(req: NextRequest) {
    try {
        // Optional webhook token check when MPESA_CALLBACK_SECRET is configured
        const expectedSecret = process.env.MPESA_CALLBACK_SECRET;
        if (expectedSecret) {
            const provided = req.nextUrl.searchParams.get("token");
            if (provided !== expectedSecret) {
                return NextResponse.json(
                    { ResultCode: 1, ResultDesc: "Unauthorized callback" },
                    { status: 401 }
                );
            }
        }

        const body = await req.json();
        const stkCallback = body?.Body?.stkCallback;

        if (!stkCallback || !stkCallback.CheckoutRequestID) {
            return NextResponse.json(
                { ResultCode: 1, ResultDesc: "Invalid callback payload" },
                { status: 400 }
            );
        }

        const {
            CheckoutRequestID,
            ResultCode,
            ResultDesc,
            CallbackMetadata,
        } = stkCallback;

        let amount: number | null = null;
        let mpesaReceiptNumber: string | null = null;
        let phoneNumber: string | null = null;
        let transactionDate: string | null = null;

        if (CallbackMetadata?.Item && Array.isArray(CallbackMetadata.Item)) {
            for (const item of CallbackMetadata.Item) {
                if (item.Name === "Amount") amount = Number(item.Value);
                if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = String(item.Value);
                if (item.Name === "PhoneNumber") phoneNumber = item.Value?.toString();
                if (item.Name === "TransactionDate") transactionDate = item.Value?.toString();
            }
        }

        if (Number(ResultCode) === 0) {
            updateCheckoutFromCallback(CheckoutRequestID, {
                status: "completed",
                mpesaReceiptNumber: mpesaReceiptNumber || undefined,
                resultDesc: ResultDesc,
            });
            console.info("M-Pesa STK Push Payment Confirmed:", {
                checkoutRequestId: CheckoutRequestID,
                receipt: mpesaReceiptNumber,
                amount,
                phone: phoneNumber,
                date: transactionDate,
            });
        } else {
            updateCheckoutFromCallback(CheckoutRequestID, {
                status: "failed",
                resultDesc: ResultDesc || "Payment cancelled or timed out",
            });
            console.warn("M-Pesa STK Push Payment Unsuccessful:", {
                checkoutRequestId: CheckoutRequestID,
                resultCode: ResultCode,
                resultDesc: ResultDesc,
            });
        }

        return NextResponse.json({
            ResultCode: 0,
            ResultDesc: "Callback accepted and processed",
        });
    } catch (err: unknown) {
        console.error("M-Pesa Callback Error:", err);
        return NextResponse.json(
            { ResultCode: 1, ResultDesc: "Error processing callback" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: "active",
        service: "EstateVue Daraja M-Pesa Webhook Callback Handler",
        timestamp: new Date().toISOString(),
    });
}
