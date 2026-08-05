"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import styles from "../auth.module.css";

export default function ResetPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) {
            toast.error("Please enter your email address");
            return;
        }
        setLoading(true);
        try {
            await resetPassword(email.trim());
            setSent(true);
            toast.success("Password reset email sent! Check your inbox.");
        } catch (err: unknown) {
            console.error("Reset failed:", err);
            const firebaseErr = err as { code?: string; message?: string };
            const code = firebaseErr.code || firebaseErr.message || "";
            if (code.includes("user-not-found")) {
                toast.error("No account found with this email");
            } else if (code.includes("invalid-email")) {
                toast.error("Please enter a valid email address");
            } else {
                toast.error("Failed to send reset email. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            {/* Left Side - Branding */}
            <div className={styles.brandSide}>
                <div className={styles.brandOverlay} />
                <Image
                    src="/images/hero-bg.png"
                    alt="Luxury property"
                    fill
                    className={styles.brandImage}
                    priority
                />
                <div className={styles.brandContent}>
                    <Link href="/" className={styles.brandLogo}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                            <polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                        <span>Estate<span className={styles.brandAccent}>Vue</span></span>
                    </Link>
                    <h1 className={styles.brandTitle}>Reset Your Password</h1>
                    <p className={styles.brandSubtitle}>
                        {"Don't worry — it happens to everyone! Enter your email and we'll send you instructions to get back into your account."}
                    </p>
                    <div className={styles.brandStats}>
                        <div className={styles.brandStat}>
                            <span className={styles.brandStatNum}>{"🔒"}</span>
                            <span className={styles.brandStatLabel}>Secure</span>
                        </div>
                        <div className={styles.brandStatDivider} />
                        <div className={styles.brandStat}>
                            <span className={styles.brandStatNum}>{"⚡"}</span>
                            <span className={styles.brandStatLabel}>Instant</span>
                        </div>
                        <div className={styles.brandStatDivider} />
                        <div className={styles.brandStat}>
                            <span className={styles.brandStatNum}>{"📧"}</span>
                            <span className={styles.brandStatLabel}>Via Email</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className={styles.formSide}>
                <div className={styles.formContainer}>
                    {sent ? (
                        <>
                            <div className={styles.formHeader}>
                                <div style={{ fontSize: "3.5rem", marginBottom: "1rem", textAlign: "center" }}>{"📬"}</div>
                                <h2 className={styles.formTitle} style={{ textAlign: "center" }}>Check Your Email</h2>
                                <p className={styles.formSubtitle} style={{ textAlign: "center" }}>
                                    {"We've sent a password reset link to "}
                                    <strong>{email}</strong>
                                    {". Click the link in the email to create a new password."}
                                </p>
                            </div>

                            <div style={{
                                background: "rgba(234,179,8,0.08)",
                                border: "1px solid rgba(234,179,8,0.2)",
                                borderRadius: "var(--radius-md)",
                                padding: "1rem",
                                marginBottom: "1.5rem"
                            }}>
                                <p style={{ fontSize: "0.85rem", color: "var(--text-primary)", lineHeight: "1.6", marginBottom: "0.5rem" }}>
                                    {"⚠️ "}
                                    <strong>Important:</strong>
                                    {" The email may land in your "}
                                    <strong>Spam or Junk folder</strong>
                                    {". Please check there if you don't see it in your inbox."}
                                </p>
                                <p style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", lineHeight: "1.5" }}>
                                    {"The email comes from "}
                                    <em>noreply@realestate-app-d8497.firebaseapp.com</em>
                                    {". If it's in spam, click \"Report not spam\" to fix this for future emails. The link expires in 1 hour."}
                                </p>
                            </div>

                            <button
                                className={styles.submitBtn}
                                onClick={() => { setSent(false); setEmail(""); }}
                                style={{ width: "100%", marginBottom: "1rem" }}
                            >
                                Try Different Email
                            </button>

                            <p style={{ textAlign: "center" }}>
                                <Link href="/auth/signin" className={styles.formLink}>
                                    {"← Back to Sign In"}
                                </Link>
                            </p>
                        </>
                    ) : (
                        <>
                            <div className={styles.formHeader}>
                                <h2 className={styles.formTitle}>Reset Password</h2>
                                <p className={styles.formSubtitle}>
                                    {"Enter the email associated with your account and we'll send you a reset link."}
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.inputGroup}>
                                    <label htmlFor="reset-email" className={styles.label}>Email Address</label>
                                    <div className={styles.inputWrapper}>
                                        <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <input
                                            id="reset-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={styles.input}
                                            autoComplete="email"
                                            autoFocus
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className={styles.spinner} />
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 2L11 13" />
                                                <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className={styles.terms}>
                                {"Remember your password? "}
                                <Link href="/auth/signin">Sign In</Link>
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
