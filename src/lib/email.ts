import emailjs from "@emailjs/browser";

// EmailJS Configuration (2-template setup)
// ==========================================
// Template 1 (APPROVAL_TEMPLATE_ID): Handles BOTH agent approval AND rejection emails
// Template 2 (INQUIRY_TEMPLATE_ID):  Handles property inquiry emails from buyers
//
// Both templates should use these variables in the EmailJS template editor:
//   {{from_name}}, {{to_name}}, {{to_email}}, {{subject}}, {{message}}, {{reply_to}}
//
// Add these env vars to .env.local:
//   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
//   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
//   NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID=your_template_for_approval_and_rejection
//   NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID=your_template_for_inquiries

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const APPROVAL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID || "";
const INQUIRY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID || "";

const isEmailConfigured = !!(SERVICE_ID && PUBLIC_KEY && APPROVAL_TEMPLATE_ID);
const isInquiryEmailConfigured = !!(SERVICE_ID && PUBLIC_KEY && INQUIRY_TEMPLATE_ID);

if (PUBLIC_KEY) {
    emailjs.init(PUBLIC_KEY);
}

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

/**
 * Send an approval email to the agent with their verification code.
 * Uses the shared approval/rejection template (Template 1).
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
    if (!isEmailConfigured) {
        console.warn("EmailJS not configured. Skipping approval email.");
        console.info(`Would send approval email to ${data.agentEmail} with code: ${data.agentCode}`);
        return false;
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            APPROVAL_TEMPLATE_ID,
            {
                from_name: "EstateVue Support",
                to_name: data.agentName,
                to_email: data.agentEmail,
                agent_code: data.agentCode,
                app_name: "EstateVue",
                subject: `EstateVue - Agent Application Update for ${data.agentName}`,
                reply_to: "noreply@estatevue.com",
                message: `Hello ${data.agentName},\n\nThank you for applying to become an agent on EstateVue. We are pleased to inform you that your application has been reviewed and approved.\n\nYou can now access the agent dashboard and begin listing properties.\n\nYour Verification Code: ${data.agentCode}\n\nPlease log in to your dashboard and enter this code to activate your agent account.\n\nBest regards,\nThe EstateVue Team`,
            },
            PUBLIC_KEY
        );
        console.info(`Approval email sent to ${data.agentEmail}`);
        return true;
    } catch (error: any) {
        console.error("Failed to send approval email. Error status:", error?.status, "Text:", error?.text);
        console.error("Full error:", error);
        return false;
    }
}

/**
 * Send a rejection email to the agent.
 * Uses the SAME template as approval (Template 1) — only the message content differs.
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<boolean> {
    if (!isEmailConfigured) {
        console.warn("EmailJS not configured. Skipping rejection email.");
        console.info(`Would send rejection email to ${data.agentEmail}`);
        return false;
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            APPROVAL_TEMPLATE_ID,
            {
                from_name: "EstateVue Support",
                to_name: data.agentName,
                to_email: data.agentEmail,
                agent_code: "",
                app_name: "EstateVue",
                subject: `EstateVue - Agent Application Update for ${data.agentName}`,
                reply_to: "noreply@estatevue.com",
                message: `Hello ${data.agentName},\n\nThank you for your interest in joining EstateVue as an agent.\n\nAfter reviewing your application, we regret to inform you that we are unable to approve it at this time.${data.reason ? `\n\nReason: ${data.reason}` : ""}\n\nIf you have any questions or would like to reapply in the future, please reach out to our support team.\n\nBest regards,\nThe EstateVue Team`,
            },
            PUBLIC_KEY
        );
        console.info(`Rejection email sent to ${data.agentEmail}`);
        return true;
    } catch (error: any) {
        console.error("Failed to send rejection email. Error status:", error?.status, "Text:", error?.text);
        console.error("Full error:", error);
        return false;
    }
}

/**
 * Send an inquiry notification email to the agent (Template 2).
 * Uses best practices to avoid spam filters:
 * - Personal reply_to address (the sender's email) so the agent can reply directly
 * - Professional, non-spammy subject line
 * - Clean plain-text message body
 * - Proper from_name identifying the platform
 */
export async function sendInquiryEmail(data: InquiryEmailData): Promise<boolean> {
    if (!isInquiryEmailConfigured) {
        console.warn("EmailJS inquiry template not configured. Skipping inquiry email.");
        console.info(`Would send inquiry email to ${data.agentEmail} from ${data.senderName}`);
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
                app_name: "EstateVue",
                subject: `New ${typeLabel} — ${data.propertyTitle}`,
                message: `Hello ${data.agentName},\n\nYou have received a new ${typeLabel.toLowerCase()} on EstateVue for your property "${data.propertyTitle}".\n\n--- Sender Details ---\nName: ${data.senderName}\nEmail: ${data.senderEmail}\nPhone: ${data.senderPhone || "Not provided"}\n\n--- Message ---\n${data.message}\n\nYou can reply directly to this email to respond to ${data.senderName}.\n\nBest regards,\nEstateVue`,
            },
            PUBLIC_KEY
        );
        console.info(`Inquiry email sent to ${data.agentEmail} from ${data.senderName}`);
        return true;
    } catch (error: any) {
        console.error("Failed to send inquiry email. Error status:", error?.status, "Text:", error?.text);
        console.error("Full error:", error);
        return false;
    }
}

export { isEmailConfigured, isInquiryEmailConfigured };
