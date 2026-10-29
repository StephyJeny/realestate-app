// ============================================================
// Email Service — Resend (primary) with EmailJS fallback
// ============================================================

import emailjs from "@emailjs/browser";
import { auth } from "./firebase";

// Legacy EmailJS configuration (fallback)
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const APPROVAL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID || "";
const INQUIRY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID || "";
const REPLY_EMAIL = process.env.NEXT_PUBLIC_EMAILJS_REPLY_EMAIL || "";

const isEmailJSConfigured = !!(SERVICE_ID && PUBLIC_KEY && APPROVAL_TEMPLATE_ID);
const isInquiryEmailJSConfigured = !!(SERVICE_ID && PUBLIC_KEY && INQUIRY_TEMPLATE_ID);

// Expose for backward compat
const isEmailConfigured = true;
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
    propertyId?: string;
    agentName: string;
    agentEmail: string;
    senderName: string;
    senderEmail: string;
    senderPhone: string;
    propertyTitle: string;
    message: string;
    inquiryType: "inquiry" | "viewing" | "offer";
}

export interface ContactEmailData {
    senderName: string;
    senderEmail: string;
    senderPhone?: string;
    subject?: string;
    message: string;
}

// ========================
// RESEND API CALLER
// ========================

async function sendViaResend(payload: Record<string, unknown>): Promise<boolean> {
    try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (auth.currentUser) {
            try {
                const token = await auth.currentUser.getIdToken();
                headers.Authorization = `Bearer ${token}`;
            } catch {
                // Proceed without token for public contact form
            }
        }

        const res = await fetch("/api/send-email", {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.success) {
            return true;
        }

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
    if (!isEmailJSConfigured) return false;

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
        return true;
    } catch (error: unknown) {
        console.error("EmailJS approval email failed:", error);
        return false;
    }
}

async function sendRejectionViaEmailJS(data: RejectionEmailData): Promise<boolean> {
    if (!isEmailJSConfigured) return false;

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
        return true;
    } catch (error: unknown) {
        console.error("EmailJS rejection email failed:", error);
        return false;
    }
}

async function sendInquiryViaEmailJS(data: InquiryEmailData): Promise<boolean> {
    if (!isInquiryEmailJSConfigured) return false;

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
        return true;
    } catch (error: unknown) {
        console.error("EmailJS inquiry email failed:", error);
        return false;
    }
}

// ========================
// PUBLIC API (Resend → EmailJS fallback)
// ========================

export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
    const sent = await sendViaResend({
        type: "approval",
        toName: data.agentName,
        toEmail: data.agentEmail,
        agentCode: data.agentCode,
    });

    if (sent) return true;
    return sendApprovalViaEmailJS(data);
}

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

export async function sendInquiryEmail(data: InquiryEmailData): Promise<boolean> {
    const sent = await sendViaResend({
        type: "inquiry",
        propertyId: data.propertyId,
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

export async function sendContactEmail(data: ContactEmailData): Promise<boolean> {
    return sendViaResend({
        type: "contact",
        senderName: data.senderName,
        senderEmail: data.senderEmail,
        senderPhone: data.senderPhone,
        subject: data.subject,
        message: data.message,
    });
}

export { isEmailConfigured, isInquiryEmailConfigured };
