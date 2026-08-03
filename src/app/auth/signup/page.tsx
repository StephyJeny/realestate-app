"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import styles from "../auth.module.css";

export default function SignUpPage() {
    const router = useRouter();
    const { signUp, signInWithGoogle } = useAuth();
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const getPasswordStrength = () => {
        const p = form.password;
        if (!p) return { level: 0, label: "", color: "" };
        let score = 0;
        if (p.length >= 8) score++;
        if (/[A-Z]/.test(p)) score++;
        if (/[0-9]/.test(p)) score++;
        if (/[^A-Za-z0-9]/.test(p)) score++;
        if (score <= 1) return { level: 1, label: "Weak", color: "var(--error)" };
        if (score === 2) return { level: 2, label: "Fair", color: "#f59e0b" };
        if (score === 3) return { level: 3, label: "Good", color: "#3b82f6" };
        return { level: 4, label: "Strong", color: "var(--success)" };
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.fullName || !form.email || !form.password || !form.confirmPassword) {
            setError("Please fill in all required fields");
            return;
        }
        if (form.password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }
        if (form.password !== form.confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        if (!agreeTerms) {
            setError("Please agree to the Terms of Service");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            await signUp(form.email, form.password, form.fullName, form.phone);
            toast.success("Account created successfully! 🎉");
            router.push("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Sign up failed";
            if (message.includes("email-already-in-use")) {
                setError("An account with this email already exists");
            } else if (message.includes("weak-password")) {
                setError("Password is too weak. Use at least 8 characters.");
            } else if (message.includes("invalid-email")) {
                setError("Please enter a valid email address");
            } else {
                setError("Failed to create account. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        setIsLoading(true);
        setError("");
        try {
            await signInWithGoogle();
            toast.success("Account created successfully! 🎉");
            router.push("/");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Google sign up failed";
            if (message.includes("popup-closed")) {
                setError("Sign up was cancelled");
            } else {
                setError("Google sign up failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const strength = getPasswordStrength();

    return (
        <div className={styles.authPage}>
            {/* Left Side — Branding */}
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
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        <span>Estate<span className={styles.brandAccent}>Vue</span></span>
                    </Link>
                    <h1 className={styles.brandTitle}>Join EstateVue</h1>
                    <p className={styles.brandSubtitle}>
                        Create your free account and unlock access to thousands of premium properties, personalized recommendations, and expert agent support.
                    </p>
                    <div className={styles.features}>
                        <div className={styles.feature}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            <span>Save your favourite properties</span>
                        </div>
                        <div className={styles.feature}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            <span>Get personalised recommendations</span>
                        </div>
                        <div className={styles.feature}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            <span>Connect directly with agents</span>
                        </div>
                        <div className={styles.feature}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            <span>Track property market trends</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side — Form */}
            <div className={styles.formSide}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>Create Account</h2>
                        <p className={styles.formSubtitle}>
                            Already have an account?{" "}
                            <Link href="/auth/signin" className={styles.formLink}>Sign in</Link>
                        </p>
                    </div>

                    {error && (
                        <div className={styles.errorMsg}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            {error}
                        </div>
                    )}

                    {/* Social Buttons */}
                    <div className={styles.socialBtns}>
                        <button type="button" className={styles.socialBtn} onClick={handleGoogleSignUp} disabled={isLoading}>
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Sign up with Google
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span>or register with email</span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputRow}>
                            <div className={styles.inputGroup}>
                                <label htmlFor="fullName" className={styles.label}>Full Name *</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    <input
                                        id="fullName"
                                        name="fullName"
                                        type="text"
                                        placeholder="John Doe"
                                        value={form.fullName}
                                        onChange={handleChange}
                                        className={styles.input}
                                        autoComplete="name"
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup}>
                                <label htmlFor="phone" className={styles.label}>Phone (Optional)</label>
                                <div className={styles.inputWrapper}>
                                    <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="+254 7XX XXX XXX"
                                        value={form.phone}
                                        onChange={handleChange}
                                        className={styles.input}
                                        autoComplete="tel"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="signup-email" className={styles.label}>Email Address *</label>
                            <div className={styles.inputWrapper}>
                                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                <input
                                    id="signup-email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={form.email}
                                    onChange={handleChange}
                                    className={styles.input}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="signup-password" className={styles.label}>Password *</label>
                            <div className={styles.inputWrapper}>
                                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                <input
                                    id="signup-password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Min. 8 characters"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={styles.input}
                                    autoComplete="new-password"
                                />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                            {form.password && (
                                <div className={styles.strengthBar}>
                                    <div className={styles.strengthTrack}>
                                        {[1, 2, 3, 4].map((i) => (
                                            <div
                                                key={i}
                                                className={styles.strengthSegment}
                                                style={{ background: i <= strength.level ? strength.color : "var(--gray-200)" }}
                                            />
                                        ))}
                                    </div>
                                    <span className={styles.strengthLabel} style={{ color: strength.color }}>{strength.label}</span>
                                </div>
                            )}
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password *</label>
                            <div className={styles.inputWrapper}>
                                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Re-enter password"
                                    value={form.confirmPassword}
                                    onChange={handleChange}
                                    className={styles.input}
                                    autoComplete="new-password"
                                />
                                {form.confirmPassword && form.password === form.confirmPassword && (
                                    <svg className={styles.matchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                )}
                            </div>
                        </div>

                        <div className={styles.rememberRow}>
                            <label className={styles.checkbox}>
                                <input type="checkbox" checked={agreeTerms} onChange={() => setAgreeTerms(!agreeTerms)} required />
                                <span className={styles.checkboxMark} />
                                I agree to the <Link href="#">Terms of Service</Link> and <Link href="#">Privacy Policy</Link>
                            </label>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? (
                                <span className={styles.spinner} />
                            ) : (
                                <>
                                    Create Account
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
