"use client";
import React, { useState } from "react";
import styles from "./FloatingWhatsAppChat.module.css";

interface FloatingWhatsAppChatProps {
    agentName?: string;
    agentPhone?: string;
    propertyTitle: string;
    propertyId: string;
}

export default function FloatingWhatsAppChat({
    agentName = "Sarah",
    agentPhone = "+254700000000",
    propertyTitle,
    propertyId,
}: FloatingWhatsAppChatProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Extract first name (e.g. "Sarah Jenkins" -> "Sarah")
    const agentFirstName = agentName ? agentName.trim().split(" ")[0] : "Sarah";

    // Clean and normalize Kenyan phone number
    const cleanPhone = (phone: string) => {
        const digits = phone.replace(/\D/g, "");
        if (digits.startsWith("0")) return "254" + digits.slice(1);
        if (digits.startsWith("254")) return digits;
        if (digits.length === 9) return "254" + digits;
        return digits || "254712345678";
    };

    const normalizedPhone = cleanPhone(agentPhone);

    // Dynamic message timeframe state
    const [timeframe, setTimeframe] = useState<string>("this Saturday");

    const getMessageText = (tf: string) => {
        return `Hi ${agentFirstName}, I'm interested in viewing '${propertyTitle}' (Ref: #${propertyId}). Is it available ${tf}?`;
    };

    const currentMessage = getMessageText(timeframe);

    const waLink = `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(currentMessage)}`;

    return (
        <div className={styles.container}>
            {/* Expanded WhatsApp Card */}
            {isOpen && (
                <div className={styles.chatCard}>
                    {/* Header */}
                    <div className={styles.cardHeader}>
                        <div className={styles.agentHeaderWrap}>
                            <div className={styles.agentAvatar}>
                                {agentFirstName.charAt(0).toUpperCase()}
                                <div className={styles.agentAvatarOnline} />
                            </div>
                            <div className={styles.agentInfo}>
                                <span className={styles.agentName}>{agentName}</span>
                                <span className={styles.agentStatus}>⚡ Typically replies in 5 min</span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className={styles.closeChatBtn}
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Chat Bubble Simulation */}
                    <div className={styles.cardBody}>
                        <div className={styles.chatBubble}>
                            <div className={styles.bubbleSender}>You (Ready to send)</div>
                            <p className={styles.bubbleText}>{currentMessage}</p>
                            <div className={styles.bubbleTime}>Just now</div>
                        </div>

                        {/* Preferred Timeframe Quick Chips */}
                        <div className={styles.chipsContainer}>
                            <span className={styles.chipsLabel}>Preferred Viewing Time:</span>
                            <div className={styles.chipsList}>
                                {[
                                    { label: "This Saturday", val: "this Saturday" },
                                    { label: "This Sunday", val: "this Sunday" },
                                    { label: "Tomorrow", val: "tomorrow" },
                                    { label: "This Weekend", val: "this weekend" },
                                ].map((chip) => (
                                    <button
                                        key={chip.val}
                                        type="button"
                                        className={`${styles.chip} ${timeframe === chip.val ? styles.chipActive : ""}`}
                                        onClick={() => setTimeframe(chip.val)}
                                    >
                                        📅 {chip.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer Launch Button */}
                    <div className={styles.cardFooter}>
                        <a
                            href={waLink}
                            target="_blank"
                            rel="noreferrer"
                            className={styles.startChatBtn}
                            onClick={() => setIsOpen(false)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            <span>Chat on WhatsApp</span>
                        </a>
                    </div>
                </div>
            )}

            {/* Floating Trigger Pill */}
            <button
                type="button"
                className={styles.triggerBtn}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Chat with Agent on WhatsApp"
            >
                <div className={styles.onlinePulse} />
                <div className={styles.whatsappIconWrap}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                </div>
                <span>WhatsApp {agentFirstName}</span>
            </button>
        </div>
    );
}
