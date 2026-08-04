"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import styles from "../auth.module.css";

export default function SignInPage() {
    const router = useRouter();
    const { signIn, signInWithGoogle } = useAuth();
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
        setError("");
    };

    const getRedirectPath = (role?: string): string => {
        switch (role) {
            case "admin":
                return "/dashboard/admin";
            case "agent":
                return "/dashboard/agent";
            case "buyer":
            default:
                return "/dashboard/buyer";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            setError("Please fill in all fields");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const profile = await signIn(form.email, form.password);
            toast.success("Welcome back! 🏠");
            router.push(getRedirectPath(profile?.role));
        } catch (err: unknown) {
            console.error("Sign in error:", err);
            // Firebase Auth errors have a 'code' property like "auth/invalid-credential"
            const firebaseError = err as { code?: string; message?: string };
            const code = firebaseError.code || "";
            const message = firebaseError.message || "Sign in failed";

            if (code === "auth/user-not-found" || code === "auth/user-disabled") {
                setError("No account found with this email.");
            } else if (
                code === "auth/wrong-password" ||
                code === "auth/invalid-credential" ||
                code === "auth/invalid-login-credentials"
            ) {
                setError("Incorrect email or password. Please try again.");
            } else if (code === "auth/too-many-requests") {
                setError("Too many attempts. Please try again later.");
            } else if (code === "auth/network-request-failed") {
                setError("Network error. Please check your connection.");
            } else if (code === "auth/invalid-email") {
                setError("Invalid email address format.");
            } else if (message.includes("not configured")) {
                setError("Service temporarily unavailable. Please try again later.");
            } else {
                setError(`Sign in failed: ${code || message}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        setError("");
        try {
            await signInWithGoogle();
            toast.success("Welcome back! 🏠");
            router.push("/dashboard/buyer");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Google sign in failed";
            if (message.includes("popup-closed")) {
                setError("Sign in was cancelled");
            } else {
                setError("Google sign in failed. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className={styles.brandTitle}>Welcome Back</h1>
                    <p className={styles.brandSubtitle}>
                        Sign in to access your dashboard, manage properties, and continue your journey with EstateVue.
                    </p>
                    <div className={styles.brandStats}>
                        <div className={styles.brandStat}>
                            <span className={styles.brandStatNum}>2,500+</span>
                            <span className={styles.brandStatLabel}>Properties</span>
                        </div>
                        <div className={styles.brandStatDivider} />
                        <div className={styles.brandStat}>
                            <span className={styles.brandStatNum}>85+</span>
                            <span className={styles.brandStatLabel}>Agents</span>
                        </div>
                        <div className={styles.brandStatDivider} />
                        <div className={styles.brandStat}>
                            <span className={styles.brandStatNum}>4.9★</span>
                            <span className={styles.brandStatLabel}>Rating</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side — Form */}
            <div className={styles.formSide}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>Sign In</h2>
                        <p className={styles.formSubtitle}>
                            Don&apos;t have an account?{" "}
                            <Link href="/auth/signup" className={styles.formLink}>Create one</Link>
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
                        <button type="button" className={styles.socialBtn} onClick={handleGoogleSignIn} disabled={isLoading}>
                            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                            Continue with Google
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span>or sign in with email</span>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="email" className={styles.label}>Email Address</label>
                            <div className={styles.inputWrapper}>
                                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                <input
                                    id="email"
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
                            <div className={styles.labelRow}>
                                <label htmlFor="password" className={styles.label}>Password</label>
                                <Link href="#" className={styles.forgotLink}>Forgot password?</Link>
                            </div>
                            <div className={styles.inputWrapper}>
                                <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={form.password}
                                    onChange={handleChange}
                                    className={styles.input}
                                    autoComplete="current-password"
                                />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(!showPassword)}>
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className={styles.rememberRow}>
                            <label className={styles.checkbox}>
                                <input type="checkbox" />
                                <span className={styles.checkboxMark} />
                                Remember me
                            </label>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? (
                                <span className={styles.spinner} />
                            ) : (
                                <>
                                    Sign In
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </>
                            )}
                        </button>
                    </form>

                    <p className={styles.terms}>
                        By signing in, you agree to our{" "}
                        <Link href="#">Terms of Service</Link> and{" "}
                        <Link href="#">Privacy Policy</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
