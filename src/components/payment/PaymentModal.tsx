"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { PaymentPurpose, PaymentRecord } from "@/lib/firestore";
import styles from "./PaymentModal.module.css";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    purpose: PaymentPurpose;
    amount: number;
    currency?: string;
    propertyId?: string;
    propertyTitle?: string;
    promotionTier?: "featured_7" | "featured_14" | "featured_30";
    onSuccess?: (payment: PaymentRecord) => void;
}

export default function PaymentModal({
    isOpen,
    onClose,
    purpose,
    amount,
    currency = "KES",
    propertyId,
    propertyTitle = "EstateVue Property",
    promotionTier,
    onSuccess,
}: PaymentModalProps) {
    const dialogRef = useDialogA11y(isOpen, onClose);
    const { user, userProfile } = useAuth();
    const [method, setMethod] = useState<"mpesa" | "card">("mpesa");

    // M-Pesa state
    const [phone, setPhone] = useState(userProfile?.phone || "");
    const [isPushing, setIsPushing] = useState(false);
    const [isWaitingPrompt, setIsWaitingPrompt] = useState(false);
    const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(45);

    // Hosted Card Checkout state (PCI-DSS safe — never collects raw PAN/CVV)
    const [cardProvider, setCardProvider] = useState<"paystack" | "stripe">("paystack");
    const [isCardInitializing, setIsCardInitializing] = useState(false);
    const [isWaitingCardGateway, setIsWaitingCardGateway] = useState(false);
    const [cardReference, setCardReference] = useState<string | null>(null);
    const [hostedAuthUrl, setHostedAuthUrl] = useState<string | null>(null);

    // Server-verified receipt state
    const [completedReceipt, setCompletedReceipt] = useState<PaymentRecord | null>(null);

    const verifyPaymentStatus = useCallback(async (checkoutId: string) => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/payments/mpesa/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ checkoutRequestId: checkoutId }),
            });

            if (!res.ok) return;
            const data = await res.json();

            if (data.status === "completed" && data.payment) {
                setIsWaitingPrompt(false);
                setCheckoutRequestId(null);
                setCompletedReceipt(data.payment as PaymentRecord);
                toast.success(`Payment Confirmed! Ref: ${data.payment.mpesaReceiptNumber} 🎉`);
                if (onSuccess) {
                    onSuccess(data.payment as PaymentRecord);
                }
            } else if (data.status === "failed") {
                setIsWaitingPrompt(false);
                setCheckoutRequestId(null);
                toast.error(data.error || "M-Pesa payment was cancelled or failed.");
            }
        } catch (err) {
            console.warn("Payment verification poll error:", err);
        }
    }, [user, onSuccess]);

    const verifyCardStatus = useCallback(async (ref: string) => {
        if (!user) return;
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/payments/card/verify", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ reference: ref }),
            });

            if (!res.ok) return;
            const data = await res.json();

            if (data.status === "completed" && data.payment) {
                setIsWaitingCardGateway(false);
                setCardReference(null);
                setHostedAuthUrl(null);
                setCompletedReceipt(data.payment as PaymentRecord);
                toast.success(`Card Payment Verified! Ref: ${data.payment.mpesaReceiptNumber} 💳`);
                if (onSuccess) {
                    onSuccess(data.payment as PaymentRecord);
                }
            } else if (data.status === "failed") {
                setIsWaitingCardGateway(false);
                setCardReference(null);
                toast.error(data.error || "Card authorization was declined or cancelled.");
            }
        } catch (err) {
            console.warn("Card verification poll error:", err);
        }
    }, [user, onSuccess]);

    // Poll server for verified M-Pesa completion while waiting for PIN
    useEffect(() => {
        if (!isWaitingPrompt || !checkoutRequestId) return;

        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    setIsWaitingPrompt(false);
                    setCheckoutRequestId(null);
                    toast.error("M-Pesa prompt timed out. Please try again.");
                    return 0;
                }
                if (c % 2 === 0) {
                    verifyPaymentStatus(checkoutRequestId);
                }
                return c - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isWaitingPrompt, checkoutRequestId, verifyPaymentStatus]);

    // Poll server for Hosted Card Gateway completion (3D-Secure / Paystack / Stripe)
    useEffect(() => {
        if (!isWaitingCardGateway || !cardReference) return;

        const timer = setInterval(() => {
            setCountdown((c) => {
                if (c <= 1) {
                    setIsWaitingCardGateway(false);
                    setCardReference(null);
                    toast.error("Hosted card session timed out. Please try again.");
                    return 0;
                }
                if (c % 2 === 0) {
                    verifyCardStatus(cardReference);
                }
                return c - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isWaitingCardGateway, cardReference, verifyCardStatus]);

    if (!isOpen) return null;

    const purposeTitle =
        purpose === "reservation"
            ? "Property Reservation Deposit"
            : purpose === "viewing_fee"
            ? "Private VIP Viewing Fee"
            : purpose === "rent_deposit"
            ? "Digital Lease Move-In / Holding Deposit"
            : purpose === "short_stay_booking"
            ? "Furnished Short-Stay Booking"
            : "Agent Listing Promotion";

    const purposeDesc =
        purpose === "reservation"
            ? "Locks property off-market for 48 hours under stakeholder escrow"
            : purpose === "viewing_fee"
            ? "Guarantees dedicated agent escort & keys for private showing"
            : purpose === "rent_deposit"
            ? "Refundable tenancy holding & security deposit held in EstateVue stakeholder escrow"
            : purpose === "short_stay_booking"
            ? "Instant check-in confirmation with host protection & flexible cancellation"
            : `Boosts visibility to Featured Listing across catalog (${promotionTier === "featured_30" ? "30 Days" : promotionTier === "featured_14" ? "14 Days" : "7 Days"})`;

    const handleMpesaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast.error("Please sign in to make a payment");
            return;
        }
        if (!phone.trim()) {
            toast.error("Please enter your M-Pesa phone number");
            return;
        }

        setIsPushing(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/payments/mpesa/stkpush", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    phone: phone.trim(),
                    amount,
                    currency,
                    reference: propertyTitle.slice(0, 12),
                    description: purposeTitle,
                    purpose,
                    propertyId,
                    propertyTitle,
                    promotionTier,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.CheckoutRequestID) {
                toast.error(data.error || "STK Push failed");
                setIsPushing(false);
                return;
            }

            setIsPushing(false);
            setCheckoutRequestId(data.CheckoutRequestID);
            setIsWaitingPrompt(true);
            setCountdown(45);
            toast.success("M-Pesa STK Push sent! Check your phone 📱");
        } catch (err: unknown) {
            console.error("STK Push error:", err);
            toast.error("Failed to initiate M-Pesa payment");
            setIsPushing(false);
        }
    };

    const handleCardCheckout = async () => {
        if (!user) {
            toast.error("Please sign in to make a card payment");
            return;
        }

        setIsCardInitializing(true);
        try {
            const idToken = await user.getIdToken();
            const res = await fetch("/api/payments/card/initialize", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    amount,
                    currency,
                    purpose,
                    propertyId,
                    propertyTitle,
                    promotionTier,
                    preferredProvider: cardProvider,
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.reference) {
                toast.error(data.error || "Failed to initialize card checkout");
                setIsCardInitializing(false);
                return;
            }

            setIsCardInitializing(false);
            setCardReference(data.reference);
            setHostedAuthUrl(data.authorizationUrl || null);
            setIsWaitingCardGateway(true);
            setCountdown(60);

            if (data.authorizationUrl) {
                window.open(data.authorizationUrl, "_blank", "noopener,noreferrer");
                toast.success("Secure gateway opened! Complete 3D-Secure verification in the new tab.");
            } else {
                toast.success("Authorizing via PCI-DSS Hosted Sandbox Gateway...");
            }
        } catch (err) {
            console.error("Card checkout error:", err);
            toast.error("Failed to connect to card gateway");
            setIsCardInitializing(false);
        }
    };

    const receiptMethodLabel =
        completedReceipt?.paymentMethod === "card"
            ? completedReceipt.cardProvider === "stripe"
                ? "Card Checkout (Stripe)"
                : "Card Checkout (Paystack)"
            : "Lipa na M-Pesa";

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={dialogRef}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="payment-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerTitleWrap}>
                        <span style={{ fontSize: "1.25rem" }} aria-hidden="true">💳</span>
                        <div>
                            <h3 id="payment-modal-title" className={styles.headerTitle}>Secure Payment &amp; Checkout</h3>
                            <div className={styles.headerSubtitle}>M-Pesa Daraja STK Push &amp; Paystack / Stripe Card</div>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    {/* Purpose Card */}
                    <div className={styles.purposeCard}>
                        <div className={styles.purposeInfo}>
                            <span className={styles.purposeBadge}>{purposeTitle}</span>
                            <h4 className={styles.purposeTitle}>{propertyTitle}</h4>
                            <span style={{ fontSize: "0.74rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                                {purposeDesc}
                            </span>
                        </div>
                        <div className={styles.purposeAmount}>
                            {currency} {amount.toLocaleString()}
                        </div>
                    </div>

                    {!user ? (
                        <div className={styles.waitingBox}>
                            <h4 className={styles.waitingTitle}>Sign In Required</h4>
                            <p className={styles.waitingDesc}>
                                Please sign in to your EstateVue account so your official payment receipt and reservation can be verified and linked to your profile.
                            </p>
                            <Link href="/auth/signin" className={styles.btnDone} style={{ textDecoration: "none", textAlign: "center", display: "inline-block" }}>
                                Sign In to Continue
                            </Link>
                        </div>
                    ) : completedReceipt ? (
                        /* Receipt confirmation state */
                        <div className={styles.receiptBox}>
                            <div className={styles.receiptHeader}>
                                <span>✅</span> Payment Successful &amp; Verified!
                            </div>
                            <div className={styles.receiptGrid}>
                                <div className={styles.receiptItem}>
                                    <span className={styles.receiptLabel}>Transaction Receipt</span>
                                    <span className={styles.receiptVal} style={{ color: "#00a859", fontFamily: "monospace" }}>
                                        {completedReceipt.mpesaReceiptNumber}
                                    </span>
                                </div>
                                <div className={styles.receiptItem}>
                                    <span className={styles.receiptLabel}>Amount Paid</span>
                                    <span className={styles.receiptVal}>
                                        {completedReceipt.currency || currency} {completedReceipt.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className={styles.receiptItem}>
                                    <span className={styles.receiptLabel}>Method</span>
                                    <span className={styles.receiptVal}>
                                        {receiptMethodLabel}
                                    </span>
                                </div>
                                <div className={styles.receiptItem}>
                                    <span className={styles.receiptLabel}>Date &amp; Time</span>
                                    <span className={styles.receiptVal}>
                                        {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })},{" "}
                                        {new Date().toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                                An official server-verified receipt has been saved to your account.
                                {purpose === "listing_promotion" && " Your property is now boosted as a Featured Listing!"}
                            </p>
                            <button
                                type="button"
                                className={styles.btnDone}
                                onClick={onClose}
                            >
                                Done
                            </button>
                        </div>
                    ) : isWaitingPrompt ? (
                        /* Phone Prompt Waiting Animation */
                        <div className={styles.waitingBox}>
                            <div className={styles.phoneIconPulse}>📱</div>
                            <h4 className={styles.waitingTitle}>Prompt Sent to Your Phone!</h4>
                            <p className={styles.waitingDesc}>
                                Safaricom M-Pesa has prompted <strong>{phone}</strong> for{" "}
                                <strong>{currency} {amount.toLocaleString()}</strong>. Please enter your M-Pesa PIN on your phone.
                            </p>
                            <div className={styles.countdownRing}>
                                Verifying with Safaricom Daraja ({countdown}s)...
                            </div>
                        </div>
                    ) : isWaitingCardGateway ? (
                        /* Hosted Card Gateway Waiting State */
                        <div className={styles.waitingBox}>
                            <div className={styles.phoneIconPulse}>🔐</div>
                            <h4 className={styles.waitingTitle}>Verifying 3D-Secure Card Authorization...</h4>
                            <p className={styles.waitingDesc}>
                                Confirming <strong>{currency} {amount.toLocaleString()}</strong> via{" "}
                                <strong>{cardProvider === "stripe" ? "Stripe Checkout" : "Paystack Hosted Checkout"}</strong>.
                            </p>
                            {hostedAuthUrl && (
                                <a
                                    href={hostedAuthUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        fontSize: "0.82rem",
                                        fontWeight: 700,
                                        color: "var(--gold-500, #d4a017)",
                                        textDecoration: "underline",
                                    }}
                                >
                                    Re-open Secure Payment Window ↗
                                </a>
                            )}
                            <div className={styles.countdownRing}>
                                Waiting for gateway confirmation ({countdown}s)...
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Method Switcher */}
                            <div className={styles.methodTabs}>
                                <button
                                    type="button"
                                    className={`${styles.methodTab} ${method === "mpesa" ? styles.methodTabActive : ""}`}
                                    onClick={() => setMethod("mpesa")}
                                >
                                    <span>🟢</span> M-Pesa Express (STK Push)
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.methodTab} ${method === "card" ? styles.methodTabActive : ""}`}
                                    onClick={() => setMethod("card")}
                                >
                                    <span>💳</span> Card / Bank Transfer
                                </button>
                            </div>

                            {/* M-Pesa Form */}
                            {method === "mpesa" && (
                                <form onSubmit={handleMpesaSubmit} className={styles.mpesaCard}>
                                    <div className={styles.mpesaHeader}>
                                        <div className={styles.mpesaBrand}>
                                            <span className={styles.mpesaBrandLogo}>M-PESA</span>
                                            <span>Lipa na M-Pesa Online</span>
                                        </div>
                                        <span className={styles.mpesaSecurityTag}>🔒 Safaricom Daraja</span>
                                    </div>

                                    <div className={styles.inputGroup}>
                                        <label className={styles.label}>Safaricom Phone Number *</label>
                                        <input
                                            type="tel"
                                            className={styles.input}
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="e.g. 0712 345 678 or 0112 345 678"
                                            required
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        className={styles.btnMpesa}
                                        disabled={isPushing}
                                    >
                                        {isPushing ? "Sending STK Push..." : `Pay ${currency} ${amount.toLocaleString()} via M-Pesa 📲`}
                                    </button>
                                </form>
                            )}

                            {/* PCI-Safe Hosted Card / Pesalink Checkout (Paystack & Stripe — zero raw PAN/CVV fields) */}
                            {method === "card" && (
                                <div className={styles.mpesaCard} style={{ gap: "0.85rem" }}>
                                    <div className={styles.mpesaHeader}>
                                        <div className={styles.mpesaBrand}>
                                            <span
                                                style={{
                                                    background: "#0f172a",
                                                    color: "#38bdf8",
                                                    fontWeight: 800,
                                                    fontSize: "0.72rem",
                                                    padding: "0.2rem 0.55rem",
                                                    borderRadius: "6px",
                                                }}
                                            >
                                                VISA · MASTERCARD · PESALINK
                                            </span>
                                        </div>
                                        <span className={styles.mpesaSecurityTag}>🔒 PCI-DSS Level 1</span>
                                    </div>

                                    {/* Gateway Selector */}
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                        <button
                                            type="button"
                                            onClick={() => setCardProvider("paystack")}
                                            style={{
                                                padding: "0.6rem 0.75rem",
                                                borderRadius: "10px",
                                                border:
                                                    cardProvider === "paystack"
                                                        ? "2px solid #0ea5e9"
                                                        : "1px solid rgba(148,163,184,0.3)",
                                                background:
                                                    cardProvider === "paystack"
                                                        ? "rgba(14, 165, 233, 0.1)"
                                                        : "var(--bg-secondary)",
                                                color: "var(--text-primary)",
                                                fontSize: "0.8rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                textAlign: "left",
                                            }}
                                        >
                                            <div>🇰🇪 Paystack</div>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 500, opacity: 0.75 }}>
                                                KES/USD Cards &amp; Pesalink
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCardProvider("stripe")}
                                            style={{
                                                padding: "0.6rem 0.75rem",
                                                borderRadius: "10px",
                                                border:
                                                    cardProvider === "stripe"
                                                        ? "2px solid #6366f1"
                                                        : "1px solid rgba(148,163,184,0.3)",
                                                background:
                                                    cardProvider === "stripe"
                                                        ? "rgba(99, 102, 241, 0.1)"
                                                        : "var(--bg-secondary)",
                                                color: "var(--text-primary)",
                                                fontSize: "0.8rem",
                                                fontWeight: 700,
                                                cursor: "pointer",
                                                textAlign: "left",
                                            }}
                                        >
                                            <div>🌍 Stripe</div>
                                            <div style={{ fontSize: "0.7rem", fontWeight: 500, opacity: 0.75 }}>
                                                Global Diaspora Cards
                                            </div>
                                        </button>
                                    </div>

                                    <div
                                        style={{
                                            fontSize: "0.78rem",
                                            color: "var(--text-secondary)",
                                            lineHeight: 1.5,
                                            background: "var(--bg-secondary)",
                                            padding: "0.65rem 0.8rem",
                                            borderRadius: "8px",
                                        }}
                                    >
                                        Receipt &amp; 3D-Secure confirmation will be sent to{" "}
                                        <strong>{user.email || "your verified account email"}</strong>. Card details are tokenized directly on{" "}
                                        {cardProvider === "stripe" ? "Stripe" : "Paystack"} — never stored on EstateVue.
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleCardCheckout}
                                        disabled={isCardInitializing}
                                        style={{
                                            width: "100%",
                                            padding: "0.85rem 1.2rem",
                                            borderRadius: "10px",
                                            border: "none",
                                            background:
                                                cardProvider === "stripe"
                                                    ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                                                    : "linear-gradient(135deg, #0284c7, #0ea5e9)",
                                            color: "#ffffff",
                                            fontWeight: 700,
                                            fontSize: "0.9rem",
                                            cursor: isCardInitializing ? "wait" : "pointer",
                                        }}
                                    >
                                        {isCardInitializing
                                            ? "Connecting to Secure Gateway..."
                                            : `Pay ${currency} ${amount.toLocaleString()} via ${cardProvider === "stripe" ? "Stripe" : "Paystack"} 💳`}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
