import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
    enforceRateLimit,
    escapeHtml,
    sanitizeHeaderValue,
    isValidEmail,
    verifyFirebaseAuth,
    getFirestoreDocServer,
} from "@/lib/apiSecurity";
import { sampleProperties } from "@/lib/data";

let _resend: Resend | null = null;
function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

interface EmailRequestBody {
    type: "approval" | "rejection" | "inquiry" | "contact";
    toName?: string;
    toEmail?: string;
    propertyId?: string;
    // Approval-specific
    agentCode?: string;
    // Rejection-specific
    reason?: string;
    // Inquiry / Contact-specific
    senderName?: string;
    senderEmail?: string;
    senderPhone?: string;
    propertyTitle?: string;
    subject?: string;
    message?: string;
    inquiryType?: "inquiry" | "viewing" | "offer";
}

function buildApprovalEmail(data: EmailRequestBody) {
    const safeName = escapeHtml(data.toName || "Agent");
    const safeCode = escapeHtml(data.agentCode || "N/A");

    return {
        subject: "Your Agent Application Has Been Approved — EstateVue",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #d4a017; margin: 0; font-size: 28px;">🎉 Congratulations!</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">EstateVue Agent Approval</p>
                </div>
                <div style="padding: 32px 24px; background: #ffffff;">
                    <p style="color: #333; font-size: 15px; line-height: 1.7;">Hello <strong>${safeName}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">Great news! Your application to join EstateVue as an agent has been <strong style="color: #16a34a;">approved</strong>.</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">You can now access the agent dashboard and begin listing properties.</p>
                    <div style="background: linear-gradient(135deg, #f0f7ff, #fffbeb); border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
                        <p style="color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px;">Your Verification Code</p>
                        <p style="color: #0a0e1a; font-size: 32px; font-weight: 800; letter-spacing: 4px; margin: 0;">${safeCode}</p>
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
    const safeName = escapeHtml(data.toName || "Applicant");
    const safeReason = data.reason ? escapeHtml(data.reason.slice(0, 1000)) : "";

    return {
        subject: "Update on Your Agent Application — EstateVue",
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #e2e8f0; margin: 0; font-size: 24px;">Application Update</h1>
                    <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">EstateVue Agent Application</p>
                </div>
                <div style="padding: 32px 24px; background: #ffffff;">
                    <p style="color: #333; font-size: 15px; line-height: 1.7;">Hello <strong>${safeName}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">Thank you for your interest in joining EstateVue as an agent.</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">After reviewing your application, we are unable to approve it at this time.</p>
                    ${safeReason ? `
                    <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 6px; margin: 16px 0;">
                        <p style="color: #7f1d1d; font-size: 14px; margin: 0;"><strong>Reason:</strong> ${safeReason}</p>
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
    const typeLabel =
        data.inquiryType === "viewing"
            ? "Viewing Request"
            : data.inquiryType === "offer"
            ? "Offer"
            : "Inquiry";

    const safeToName = escapeHtml(data.toName || "Agent");
    const safePropTitle = escapeHtml(data.propertyTitle || "Property");
    const safeSenderName = escapeHtml(data.senderName || "N/A");
    const safeSenderEmail = escapeHtml(data.senderEmail || "N/A");
    const safeSenderPhone = escapeHtml(data.senderPhone || "Not provided");
    const safeMessage = escapeHtml((data.message || "No message provided.").slice(0, 3000));
    const subjectTitle = sanitizeHeaderValue(data.propertyTitle || "a Property", 80);

    return {
        subject: `New ${typeLabel} for ${subjectTitle} — EstateVue`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 32px 24px; text-align: center;">
                    <h1 style="color: #d4a017; margin: 0; font-size: 22px;">📬 New ${typeLabel}</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">for "${safePropTitle}"</p>
                </div>
                <div style="padding: 32px 24px; background: #ffffff;">
                    <p style="color: #333; font-size: 15px; line-height: 1.7;">Hello <strong>${safeToName}</strong>,</p>
                    <p style="color: #555; font-size: 15px; line-height: 1.7;">You have received a new <strong>${typeLabel.toLowerCase()}</strong> for your property listing on EstateVue.</p>
                    
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin: 20px 0;">
                        <h3 style="color: #0a0e1a; font-size: 14px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 0.5px;">Sender Details</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <tr>
                                <td style="color: #64748b; font-size: 13px; padding: 6px 0; width: 80px;">Name:</td>
                                <td style="color: #1e293b; font-size: 14px; font-weight: 600; padding: 6px 0;">${safeSenderName}</td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; padding: 6px 0;">Email:</td>
                                <td style="color: #1e293b; font-size: 14px; padding: 6px 0;"><a href="mailto:${safeSenderEmail}" style="color: #d4a017;">${safeSenderEmail}</a></td>
                            </tr>
                            <tr>
                                <td style="color: #64748b; font-size: 13px; padding: 6px 0;">Phone:</td>
                                <td style="color: #1e293b; font-size: 14px; padding: 6px 0;">${safeSenderPhone}</td>
                            </tr>
                        </table>
                    </div>

                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 16px 20px; margin: 16px 0;">
                        <h3 style="color: #92400e; font-size: 13px; margin: 0 0 8px; text-transform: uppercase; letter-spacing: 0.5px;">Message</h3>
                        <p style="color: #78350f; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
                    </div>

                    <p style="color: #555; font-size: 13px; line-height: 1.6;">You can reply directly to <strong>${safeSenderName}</strong> at <a href="mailto:${safeSenderEmail}" style="color: #d4a017;">${safeSenderEmail}</a>.</p>
                </div>
                <div style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">EstateVue — Find Your Dream Home</p>
                </div>
            </div>
        `,
    };
}

function buildContactEmail(data: EmailRequestBody) {
    const safeSenderName = escapeHtml(data.senderName || "Website Visitor");
    const safeSenderEmail = escapeHtml(data.senderEmail || "N/A");
    const safeSenderPhone = escapeHtml(data.senderPhone || "Not provided");
    const safeSubject = escapeHtml(data.subject || "General Contact Inquiry");
    const safeMessage = escapeHtml((data.message || "").slice(0, 4000));
    const headerSubject = sanitizeHeaderValue(data.subject || "General Contact Inquiry", 80);

    return {
        subject: `[EstateVue Contact] ${headerSubject}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 28px 24px; text-align: center;">
                    <h1 style="color: #d4a017; margin: 0; font-size: 22px;">📩 New Contact Form Message</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0; font-size: 14px;">${safeSubject}</p>
                </div>
                <div style="padding: 28px 24px; background: #ffffff;">
                    <p style="color: #1e293b; font-size: 14px;"><strong>From:</strong> ${safeSenderName} (${safeSenderEmail})</p>
                    <p style="color: #1e293b; font-size: 14px;"><strong>Phone:</strong> ${safeSenderPhone}</p>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; margin: 16px 0;">
                        <p style="color: #334155; font-size: 14px; line-height: 1.7; margin: 0; white-space: pre-wrap;">${safeMessage}</p>
                    </div>
                </div>
            </div>
        `,
    };
}

export async function POST(request: NextRequest) {
    try {
        // 1. Rate-limit email requests (max 6 per minute per IP)
        const rateLimitRes = enforceRateLimit(request, "send-email", 6, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const body: EmailRequestBody = await request.json();

        if (!body.type || !["approval", "rejection", "inquiry", "contact"].includes(body.type)) {
            return NextResponse.json(
                { success: false, message: "Invalid or missing email type" },
                { status: 400 }
            );
        }

        // 2. Authorization & recipient verification (prevents open-relay abuse)
        let recipientEmail = (body.toEmail || "").trim().toLowerCase();

        if (body.type === "approval" || body.type === "rejection") {
            const authUser = await verifyFirebaseAuth(request);
            if (!authUser) {
                return NextResponse.json(
                    { success: false, message: "Authentication required for admin emails" },
                    { status: 401 }
                );
            }

            const callerProfile = await getFirestoreDocServer(
                `users/${authUser.uid}`,
                authUser.idToken
            );
            if (callerProfile?.role !== "admin") {
                return NextResponse.json(
                    { success: false, message: "Only admins can send approval or rejection emails" },
                    { status: 403 }
                );
            }

            if (!isValidEmail(recipientEmail) || !body.toName) {
                return NextResponse.json(
                    { success: false, message: "Valid recipient email and name are required" },
                    { status: 400 }
                );
            }
        } else if (body.type === "inquiry") {
            const authUser = await verifyFirebaseAuth(request);
            if (!authUser) {
                return NextResponse.json(
                    { success: false, message: "Authentication required to send property inquiry emails" },
                    { status: 401 }
                );
            }

            if (!isValidEmail(recipientEmail)) {
                return NextResponse.json(
                    { success: false, message: "Invalid agent email" },
                    { status: 400 }
                );
            }

            // Ensure recipientEmail belongs to a known sample listing or a real Firestore property
            const isSampleAgentEmail = sampleProperties.some(
                (p) => p.agentEmail?.toLowerCase() === recipientEmail
            );
            let isVerifiedPropertyAgent = isSampleAgentEmail;

            if (!isVerifiedPropertyAgent && body.propertyId) {
                const propDoc = await getFirestoreDocServer(
                    `properties/${body.propertyId}`,
                    authUser.idToken
                );
                const propAgentEmail =
                    typeof propDoc?.agentEmail === "string"
                        ? propDoc.agentEmail.toLowerCase()
                        : "";
                if (propAgentEmail === recipientEmail) {
                    isVerifiedPropertyAgent = true;
                }
            }

            if (!isVerifiedPropertyAgent) {
                return NextResponse.json(
                    { success: false, message: "Recipient is not a registered listing agent for this property" },
                    { status: 403 }
                );
            }
        } else if (body.type === "contact") {
            // Contact messages ALWAYS go to the platform owner, never an arbitrary caller-supplied address
            recipientEmail = (
                process.env.CONTACT_RECEIVER_EMAIL ||
                process.env.NEXT_PUBLIC_EMAILJS_REPLY_EMAIL ||
                ""
            )
                .trim()
                .toLowerCase();

            if (!body.senderName || !isValidEmail(body.senderEmail) || !body.message) {
                return NextResponse.json(
                    { success: false, message: "Name, valid email, and message are required" },
                    { status: 400 }
                );
            }
        }

        if (!process.env.RESEND_API_KEY || !isValidEmail(recipientEmail)) {
            return NextResponse.json(
                { success: false, message: "Email service not configured" },
                { status: 200 }
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
                replyTo = isValidEmail(body.senderEmail) ? body.senderEmail.trim() : undefined;
                break;
            case "contact":
                emailContent = buildContactEmail(body);
                replyTo = isValidEmail(body.senderEmail) ? body.senderEmail.trim() : undefined;
                break;
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
            to: [recipientEmail],
            replyTo,
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

        return NextResponse.json({ success: true, id: data?.id });
    } catch (err) {
        console.error("Email API error:", err);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
