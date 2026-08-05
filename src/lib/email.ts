import emailjs from "@emailjs/browser";

// EmailJS Configuration (2-template setup)
// ==========================================
// Template 1 (APPROVAL_TEMPLATE_ID): Handles BOTH agent approval AND rejection emails
// Template 2 (INQUIRY_TEMPLATE_ID):  Handles property inquiry emails from buyers
//
// Both templates should use these variables in the EmailJS template editor:
//   {{from_name}}, {{to_name}}, {{to_email}}, {{subject}}, {{message}}, {{reply_to}}
//
// IMPORTANT - To avoid spam filters:
//   - Do NOT use a reply_to domain you don't own (e.g., noreply@yourdomain.com)
//   - Keep subject lines simple and professional
//   - Use the same email address linked to your EmailJS service as reply_to
//   - In the EmailJS template, ensure "To Email" is set to {{to_email}}
//   - In your EmailJS Email Service settings, make sure the connected Gmail
//     account has "Less secure app access" or is using an App Password
//
// Add these env vars to .env.local:
//   NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
//   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
//   NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID=your_template_for_approval_and_rejection
//   NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID=your_template_for_inquiries
//   NEXT_PUBLIC_EMAILJS_REPLY_EMAIL=your_gmail_address (the one connected to EmailJS)

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const APPROVAL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID || "";
const INQUIRY_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_INQUIRY_TEMPLATE_ID || "";
// Use the actual Gmail address connected to your EmailJS service
// This prevents spam — Gmail trusts emails where reply_to matches a real, verified address
const REPLY_EMAIL = process.env.NEXT_PUBLIC_EMAILJS_REPLY_EMAIL || "";

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
                from_name: "EstateVue",
                to_name: data.agentName,
                to_email: data.agentEmail,
                subject: "Your Agent Application Has Been Approved",
                reply_to: REPLY_EMAIL || data.agentEmail,
                message: `Hello ${data.agentName},\n\nGreat news! Your application to join EstateVue as an agent has been approved.\n\nYou can now access the agent dashboard and begin listing properties.\n\nYour Verification Code: ${data.agentCode}\n\nPlease log in to your dashboard and enter this code to activate your agent account.\n\nWelcome aboard!\n\nBest regards,\nThe EstateVue Team`,
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
                from_name: "EstateVue",
                to_name: data.agentName,
                to_email: data.agentEmail,
                subject: "Update on Your Agent Application",
                reply_to: REPLY_EMAIL || data.agentEmail,
                message: `Hello ${data.agentName},\n\nThank you for your interest in joining EstateVue as an agent.\n\nAfter reviewing your application, we are unable to approve it at this time.${data.reason ? `\n\nReason: ${data.reason}` : ""}\n\nIf you have any questions or would like to reapply in the future, please feel free to reach out to our support team.\n\nBest regards,\nThe EstateVue Team`,
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
                subject: `New ${typeLabel} for ${data.propertyTitle}`,
                message: `Hello ${data.agentName},\n\nYou have received a new ${typeLabel.toLowerCase()} for your property "${data.propertyTitle}" on EstateVue.\n\nSender Details:\nName: ${data.senderName}\nEmail: ${data.senderEmail}\nPhone: ${data.senderPhone || "Not provided"}\n\nMessage:\n${data.message}\n\nYou can reply directly to this email to respond to ${data.senderName}.\n\nBest regards,\nEstateVue`,
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

