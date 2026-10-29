"use client";
import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { PaymentRecord } from "@/lib/firestore";
import styles from "./PaymentModal.module.css";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    purpose: "reservation" | "viewing_fee" | "listing_promotion";
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

    if (!isOpen) return null;

    const purposeTitle =
        purpose === "reservation"
            ? "Property Reservation Deposit"
            : purpose === "viewing_fee"
            ? "Private VIP Viewing Fee"
            : "Agent Listing Promotion";

    const purposeDesc =
        purpose === "reservation"
            ? "Locks property off-market for 48 hours under stakeholder escrow"
            : purpose === "viewing_fee"
            ? "Guarantees dedicated agent escort & keys for private showing"
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
                            <div className={styles.headerSubtitle}>M-Pesa Daraja STK Push & Hosted Checkout</div>
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
                                <span>✅</span> Payment Successful & Verified!
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
                                        {currency} {completedReceipt.amount.toLocaleString()}
                                    </span>
                                </div>
                                <div className={styles.receiptItem}>
                                    <span className={styles.receiptLabel}>Method</span>
                                    <span className={styles.receiptVal}>
                                        Lipa na M-Pesa
                                    </span>
                                </div>
                                <div className={styles.receiptItem}>
                                    <span className={styles.receiptLabel}>Date & Time</span>
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

                            {/* PCI-Safe Card / Bank Transfer Info (never collects raw PAN or CVV) */}
                            {method === "card" && (
                                <div className={styles.mpesaCard} style={{ gap: "0.75rem" }}>
                                    <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                        <strong>🔒 PCI-DSS Protected Checkout</strong>
                                        <p style={{ margin: "0.4rem 0 0" }}>
                                            For your security, EstateVue never collects raw card numbers or CVV codes directly on our site.
                                            Please complete instant checkout using <strong>M-Pesa Express (STK Push)</strong>, or contact our escrow desk for RTGS / Pesalink bank transfers.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        className={styles.btnMpesa}
                                        onClick={() => setMethod("mpesa")}
                                    >
                                        Switch to M-Pesa Express 📲
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
