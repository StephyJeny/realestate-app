import emailjs from "@emailjs/browser";

// EmailJS Configuration
// To set up:
// 1. Create account at https://www.emailjs.com/
// 2. Create an email service (Gmail, Outlook, etc.)
// 3. Create email templates for approval & rejection
// 4. Add these env vars to .env.local:
//    NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_service_id
//    NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_public_key
//    NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID=your_approval_template_id
//    NEXT_PUBLIC_EMAILJS_REJECTION_TEMPLATE_ID=your_rejection_template_id

const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "";
const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "";
const APPROVAL_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_APPROVAL_TEMPLATE_ID || "";
const REJECTION_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_REJECTION_TEMPLATE_ID || "";

const isEmailConfigured = !!(SERVICE_ID && PUBLIC_KEY && APPROVAL_TEMPLATE_ID);

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

/**
 * Send an approval email to the agent with their verification code.
 */
export async function sendApprovalEmail(data: ApprovalEmailData): Promise<boolean> {
    if (!isEmailConfigured) {
        console.warn("📧 EmailJS not configured. Skipping approval email.");
        console.info(`📧 Would send approval email to ${data.agentEmail} with code: ${data.agentCode}`);
        return false;
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            APPROVAL_TEMPLATE_ID,
            {
                to_name: data.agentName,
                to_email: data.agentEmail,
                agent_code: data.agentCode,
                app_name: "EstateVue",
                message: `Congratulations ${data.agentName}! 🎉\n\nYour agent application on EstateVue has been approved! You can now access your agent dashboard and start listing properties.\n\nYour verification code is: ${data.agentCode}\n\nUse this code to verify your account and unlock full agent features.\n\nWelcome aboard!\n— The EstateVue Team`,
            },
            PUBLIC_KEY
        );
        console.info(`✅ Approval email sent to ${data.agentEmail}`);
        return true;
    } catch (error: any) {
        console.error("❌ Failed to send approval email. Error status:", error?.status, "Text:", error?.text);
        console.error("Full error:", error);
        return false;
    }
}

/**
 * Send a rejection email to the agent.
 */
export async function sendRejectionEmail(data: RejectionEmailData): Promise<boolean> {
    const templateId = REJECTION_TEMPLATE_ID || APPROVAL_TEMPLATE_ID;

    if (!isEmailConfigured) {
        console.warn("📧 EmailJS not configured. Skipping rejection email.");
        console.info(`📧 Would send rejection email to ${data.agentEmail}`);
        return false;
    }

    try {
        await emailjs.send(
            SERVICE_ID,
            templateId,
            {
                to_name: data.agentName,
                to_email: data.agentEmail,
                agent_code: "",
                app_name: "EstateVue",
                message: `Dear ${data.agentName},\n\nThank you for your interest in becoming an agent on EstateVue.\n\nAfter careful review, we are unable to approve your application at this time.${data.reason ? `\n\nReason: ${data.reason}` : ""}\n\nIf you believe this was a mistake or would like to reapply, please contact our support team.\n\nBest regards,\n— The EstateVue Team`,
            },
            PUBLIC_KEY
        );
        console.info(`✅ Rejection email sent to ${data.agentEmail}`);
        return true;
    } catch (error: any) {
        console.error("❌ Failed to send rejection email. Error status:", error?.status, "Text:", error?.text);
        console.error("Full error:", error);
        return false;
    }
}

export { isEmailConfigured };
