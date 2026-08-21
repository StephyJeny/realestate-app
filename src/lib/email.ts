// ============================================================
// Email Service — Resend (primary) with EmailJS fallback
// ============================================================
//
// How it works:
//   1. Emails are sent server-side via /api/send-email (Resend).
//   2. If Resend is not configured (no RESEND_API_KEY), the API
//      route returns { success: false } gracefully.
//   3. If the API call fails entirely, falls back to EmailJS
//      (client-side) for backward compatibility.
//
// Environment variables for Resend (server-side, in .env.local):
//   RESEND_API_KEY=re_xxxxxxxxx
//   RESEND_FROM_EMAIL=EstateVue <onboarding@resend.dev>
//
// Legacy EmailJS env vars (still supported as fallback):
//   NEXT_PUBLIC_EMAILJS_SERVICE_ID
//   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
//   NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID
//   NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID
//   NEXT_PUBLIC_EMAILJS_REPLY_EMAIL
// ============================================================

import emailjs from "@emailjs/browser";

// Legacy EmailJS configuration (fallback)
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const APPROVAL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID || "";
const INQUIRY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID || "";
const REPLY_EMAIL = process.env.NEXT_PUBLIC_EMAILJS_REPLY_EMAIL || "";

const isEmailJSConfigured = !!(SERVICE_ID && PUBLIC_KEY && APPROVAL_TEMPLATE_ID);
const isInquiryEmailJSConfigured = !!(SERVICE_ID && PUBLIC_KEY && INQUIRY_TEMPLATE_ID);

// Expose for backward compat
const isEmailConfigured = true; // Always "configured" — Resend route handles gracefully
const isInquiryEmailConfigured = true;

if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
}

// ========================
// DATA INTERFACES
// ========================

export interface ApprovalEmailData {
    agentName: string;
    agentEmail: string;
    agentCode: string;
}

export interface RejectionEmailData {
    agentName: string;
    agentEmail: string;
    reason?: string;
}

export interface InquiryEmailData {
    agentName: string;
    agentEmail: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    propertyTitle: string;
    message: string;
    inquiryType: "inquiry" | "viewing" | "offer";
}

// ========================
// RESEND API CALLER
// ========================

async function sendViaResend(payload: Record<string, unknown>): Promise<boolean> {
    try {
        const res = await fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.success) {
            console.info(`✅ Email sent via Resend (type: ${payload.type})`);
            return true;
        }

        // Resend not configured or failed — not a hard error
        console.warn(`Resend returned: ${data.message || "not configured"}`);
        return false;
    } catch (err) {
        console.warn("Resend API call failed:", err);
        return false;
    }
}

// ========================
// EMAILJS FALLBACK
// ========================

async function sendApprovalViaEmailJS(data: ApprovalEmailData): Promise<boolean> {
    if (!isEmailJSConfigured) {
        console.warn("EmailJS not configured. Skipping approval email fallback.");
        console.info(`Would send approval email to ${data.agentEmail} with code: ${data.agentCode}`);
        return false;
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            APPROVAL_TEMPLATE_ID,
            {
                from_name: "EstateVue",
                to_name: data.agentName,
                to_email: data.agentEmail,
                subject: "Your Agent Application Has Been Approved",
                reply_to: REPLY_EMAIL || data.agentEmail,
                message: `Hello ${data.agentName},\n\nGreat news! Your application to join EstateVue as an agent has been approved.\n\nYou can now access the agent dashboard and begin listing properties.\n\nYour Verification Code: ${data.agentCode}\n\nPlease log in to your dashboard and enter this code to activate your agent account.\n\nWelcome aboard!\n\nBest regards,\nThe EstateVue Team`,
            },
            PUBLIC_KEY
        );
        console.info(`Approval email sent via EmailJS to ${data.agentEmail}`);
        return true;
    } catch (error: unknown) {
        console.error("EmailJS approval email failed:", error);
        return false;
    }
}

async function sendRejectionViaEmailJS(data: RejectionEmailData): Promise<boolean> {
    if (!isEmailJSConfigured) {
        console.warn("EmailJS not configured. Skipping rejection email fallback.");
        return false;
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            APPROVAL_TEMPLATE_ID,
            {
                from_name: "EstateVue",
                to_name: data.agentName,
                to_email: data.agentEmail,
                subject: "Update on Your Agent Application",
                reply_to: REPLY_EMAIL || data.agentEmail,
                message: `Hello ${data.agentName},\n\nThank you for your interest in joining EstateVue as an agent.\n\nAfter reviewing your application, we are unable to approve it at this time.${data.reason ? `\n\nReason: ${data.reason}` : ""}\n\nIf you have any questions or would like to reapply in the future, please feel free to reach out to our support team.\n\nBest regards,\nThe EstateVue Team`,
            },
            PUBLIC_KEY
        );
        console.info(`Rejection email sent via EmailJS to ${data.agentEmail}`);
        return true;
    } catch (error: unknown) {
        console.error("EmailJS rejection email failed:", error);
        return false;
    }
}

async function sendInquiryViaEmailJS(data: InquiryEmailData): Promise<boolean> {
    if (!isInquiryEmailJSConfigured) {
        console.warn("EmailJS inquiry template not configured. Skipping inquiry fallback.");
        return false;
    }

    const typeLabel = data.inquiryType === "viewing" ? "Viewing Request" : data.inquiryType === "offer" ? "Offer" : "Inquiry";

    try {
        await emailjs.send(
            SERVICE_ID,
            INQUIRY_TEMPLATE_ID,
            {
                from_name: `${data.senderName} via EstateVue`,
                to_name: data.agentName,
                to_email: data.agentEmail,
                reply_to: data.senderEmail,
                subject: `New ${typeLabel} for ${data.propertyTitle}`,
                message: `Hello ${data.agentName},\n\nYou have received a new ${typeLabel.toLowerCase()} for your property "${data.propertyTitle}" on EstateVue.\n\nSender Details:\nName: ${data.senderName}\nEmail: ${data.senderEmail}\nPhone: ${data.senderPhone || "Not provided"}\n\nMessage:\n${data.message}\n\nYou can reply directly to this email to respond to ${data.senderName}.\n\nBest regards,\nEstateVue`,
            },
            PUBLIC_KEY
        );
        console.info(`Inquiry email sent via EmailJS to ${data.agentEmail}`);
        return true;
    } catch (error: unknown) {
        console.error("EmailJS inquiry email failed:", error);
        return false;
    }
}

// ========================
// PUBLIC API (Resend → EmailJS fallback)
// ========================

/**
 * Send an approval email to the agent with their verification code.
 * Tries Resend first, falls back to EmailJS.
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
    // Try Resend first
    const sent = await sendViaResend({
        type: "approval",
        toName: data.agentName,
        toEmail: data.agentEmail,
        agentCode: data.agentCode,
    });

    if (sent) return true;

    // Fallback to EmailJS
    return sendApprovalViaEmailJS(data);
}

/**
 * Send a rejection email to the agent.
 * Tries Resend first, falls back to EmailJS.
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<boolean> {
    const sent = await sendViaResend({
        type: "rejection",
        toName: data.agentName,
        toEmail: data.agentEmail,
        reason: data.reason,
    });

    if (sent) return true;

    return sendRejectionViaEmailJS(data);
}

/**
 * Send an inquiry notification email to the agent.
 * Tries Resend first, falls back to EmailJS.
 */
export async function sendInquiryEmail(data: InquiryEmailData): Promise<boolean> {
    const sent = await sendViaResend({
        type: "inquiry",
        toName: data.agentName,
        toEmail: data.agentEmail,
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone,
        propertyTitle: data.propertyTitle,
        message: data.message,
        inquiryType: data.inquiryType,
    });

    if (sent) return true;

    return sendInquiryViaEmailJS(data);
}

export { isEmailConfigured, isInquiryEmailConfigured };
