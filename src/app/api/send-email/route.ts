import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

// ============================================================
// Server-side email API route using Resend
// ============================================================
// Environment variables (set in .env.local or Vercel dashboard):
//   RESEND_API_KEY=re_xxxxxxxxx
//   RESEND_FROM_EMAIL=EstateVue <onboarding@resend.dev>
//     (or your verified domain: EstateVue <noreply@yourdomain.com>)
//
// For development/testing, Resend's free tier allows sending
// from "onboarding@resend.dev" to your own email only.
// For production, verify your domain in Resend dashboard.
// ============================================================

// Resend is lazily initialized inside POST to avoid build-time crash
// when RESEND_API_KEY is not available during `next build` page collection.
let _resend: Resend | null = null;
function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

interface EmailRequestBody {
    type: "approval" | "rejection" | "inquiry";
    // Common fields
    toName: string;
    toEmail: string;
    // Approval-specific
    agentCode?: string;
    // Rejection-specific
    reason?: string;
    // Inquiry-specific
    senderName?: string;
    senderEmail?: string;
    senderPhone?: string;
    propertyTitle?: string;
    message?: string;
    inquiryType?: "inquiry" | "viewing" | "offer";
}

function buildApprovalEmail(data: EmailRequestBody) {
    return {
        subject: "Your Agent Application Has Been Approved — EstateVue",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #d4a017; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">EstateVue Agent Approval</p>
                </div>
                <div style="padding: 32px 24px; background: #ffffff;">
                    <p style="color: #333; font-size: 15px; line-height: 1.7;">Hello <strong>${data.toName}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">Great news! Your application to join EstateVue as an agent has been <strong style="color: #16a34a;">approved</strong>.</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">You can now access the agent dashboard and begin listing properties.</p>
                    <div style="background: linear-gradient(135deg, #f0f7ff, #fffbeb); border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Verification Code</p>
                        <p style="color: #0a0e1a; font-size: 32px; font-weight: 800; letter-spacing: 4px; margin: 0;">${data.agentCode || "N/A"}</p>
                    </div>
                    <p style="color: #555; font-size: 14px; line-height: 1.7;">Please log in to your dashboard and enter this code to activate your agent account.</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">Welcome aboard! 🏡</p>
                </div>
                <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">The EstateVue Team</p>
                </div>
            </div>
        `,
    };
}

function buildRejectionEmail(data: EmailRequestBody) {
    return {
        subject: "Update on Your Agent Application — EstateVue",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #e2e8f0; margin: 0; font-size: 24px;">Application Update</h1>
                    <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">EstateVue Agent Application</p>
                </div>
                <div style="padding: 32px 24px; background: #ffffff;">
                    <p style="color: #333; font-size: 15px; line-height: 1.7;">Hello <strong>${data.toName}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">Thank you for your interest in joining EstateVue as an agent.</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">After reviewing your application, we are unable to approve it at this time.</p>
                    ${data.reason ? `
                    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
                        <p style="color: #7f1d1d; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${data.reason}</p>
                    </div>` : ""}
                    <p style="color: #555; font-size: 14px; line-height: 1.7;">If you have any questions or would like to reapply in the future, please feel free to reach out to our support team.</p>
                </div>
                <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">The EstateVue Team</p>
                </div>
            </div>
        `,
    };
}

function buildInquiryEmail(data: EmailRequestBody) {
    const typeLabel = data.inquiryType === "viewing" ? "Viewing Request" : data.inquiryType === "offer" ? "Offer" : "Inquiry";

    return {
        subject: `New ${typeLabel} for ${data.propertyTitle || "a Property"} — EstateVue`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #d4a017; margin: 0; font-size: 22px;">📬 New ${typeLabel}</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">for "${data.propertyTitle || "Property"}"</p>
                </div>
                <div style="padding: 32px 24px; background: #ffffff;">
                    <p style="color: #333; font-size: 15px; line-height: 1.7;">Hello <strong>${data.toName}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">You have received a new <strong>${typeLabel.toLowerCase()}</strong> for your property listing on EstateVue.</p>
                    
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #0a0e1a; font-size: 14px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Sender Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="color: #64748b; font-size: 13px; padding: 6px 0; width: 80px;">Name:</td>
                                <td style="color: #1e293b; font-size: 14px; font-weight: 600; padding: 6px 0;">${data.senderName || "N/A"}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; padding: 6px 0;">Email:</td>
                                <td style="color: #1e293b; font-size: 14px; padding: 6px 0;"><a href="mailto:${data.senderEmail}" style="color: #d4a017;">${data.senderEmail || "N/A"}</a></td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; padding: 6px 0;">Phone:</td>
                                <td style="color: #1e293b; font-size: 14px; padding: 6px 0;">${data.senderPhone || "Not provided"}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin: 16px 0;">
                        <h3 style="color: #92400e; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Message</h3>
                        <p style="color: #78350f; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${data.message || "No message provided."}</p>
                    </div>

                    <p style="color: #555; font-size: 13px; line-height: 1.6;">You can reply directly to <strong>${data.senderName}</strong> at <a href="mailto:${data.senderEmail}" style="color: #d4a017;">${data.senderEmail}</a>.</p>
                </div>
                <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">EstateVue — Find Your Dream Home</p>
                </div>
            </div>
        `,
    };
}

export async function POST(request: NextRequest) {
    try {
        // Validate API key
        if (!process.env.RESEND_API_KEY) {
            console.warn("RESEND_API_KEY not configured. Email not sent.");
            return NextResponse.json(
                { success: false, message: "Email service not configured" },
                { status: 200 } // Return 200 so the app doesn't break
            );
        }

        const body: EmailRequestBody = await request.json();

        if (!body.type || !body.toEmail || !body.toName) {
            return NextResponse.json(
                { success: false, message: "Missing required fields: type, toEmail, toName" },
                { status: 400 }
            );
        }

        const fromEmail = process.env.RESEND_FROM_EMAIL || "EstateVue <onboarding@resend.dev>";
        let emailContent: { subject: string; html: string };
        let replyTo: string | undefined;

        switch (body.type) {
            case "approval":
                emailContent = buildApprovalEmail(body);
                break;
            case "rejection":
                emailContent = buildRejectionEmail(body);
                break;
            case "inquiry":
                emailContent = buildInquiryEmail(body);
                replyTo = body.senderEmail;
                break;
            default:
                return NextResponse.json(
                    { success: false, message: `Unknown email type: ${body.type}` },
                    { status: 400 }
                );
        }

        const resend = getResend();
        if (!resend) {
            return NextResponse.json(
                { success: false, message: "Email service not configured" },
                { status: 200 }
            );
        }

        const { data, error } = await resend.emails.send({
            from: fromEmail,
            to: [body.toEmail],
            replyTo: replyTo || undefined,
            subject: emailContent.subject,
            html: emailContent.html,
        });

        if (error) {
            console.error("Resend error:", error);
            return NextResponse.json(
                { success: false, message: error.message },
                { status: 500 }
            );
        }

        console.info(`Email (${body.type}) sent to ${body.toEmail}. ID: ${data?.id}`);
        return NextResponse.json({ success: true, id: data?.id });
    } catch (err) {
        console.error("Email API error:", err);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
