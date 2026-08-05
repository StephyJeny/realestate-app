"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import styles from "../auth.module.css";
import gateStyles from "@/components/agent/AgentGate.module.css";

export default function SignUpPage() {
    const router = useRouter();
    const { signUp, signInWithGoogle } = useAuth();
    const [selectedRole, setSelectedRole] = useState<"buyer" | "agent">("buyer");
    const [form, setForm] = useState({
        fullName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        // Agent fields
        agency: "",
        specialization: "",
        experience: "",
        license: "",
        location: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [agreeTerms, setAgreeTerms] = useState(false);
    const [licenseWarning, setLicenseWarning] = useState("");
    const [showPendingModal, setShowPendingModal] = useState(false);

    // License format: 2-4 uppercase letters / 1-6 digits / 4-digit year
    // Example: EAB/1234/2025 or NCA/567/2024
    const LICENSE_REGEX = /^[A-Z]{2,4}\/\d{1,6}\/\d{4}$/;

    const validateLicense = (value: string) => {
        if (!value) {
            setLicenseWarning("");
            return;
        }

        const upper = value.toUpperCase();

        // Check for invalid characters (only allow letters, digits, slashes)
        if (/[^A-Z0-9/]/.test(upper)) {
            setLicenseWarning("Only letters, numbers, and slashes (/) are allowed.");
            return;
        }

        // Count slashes to guide format
        const slashCount = (upper.match(/\//g) || []).length;

        // Check basic structure progressively
        if (slashCount === 0 && upper.length > 0) {
            if (!/^[A-Z]+$/.test(upper)) {
                setLicenseWarning("Start with 2-4 letters (e.g. EAB), then add a slash.");
                return;
            }
            if (upper.length > 4) {
                setLicenseWarning("Prefix too long — use 2-4 letters, then a slash (/).");
                return;
            }
            setLicenseWarning("");
            return;
        }

        if (slashCount > 2) {
            setLicenseWarning("Too many slashes — format is: PREFIX/NUMBER/YEAR");
            return;
        }

        // If fully typed, test against the full regex
        if (slashCount === 2) {
            if (LICENSE_REGEX.test(upper)) {
                setLicenseWarning(""); // Valid!
                return;
            }
            // Break down the parts to give specific feedback
            const parts = upper.split("/");
            if (!/^[A-Z]{2,4}$/.test(parts[0])) {
                setLicenseWarning("Prefix must be 2-4 uppercase letters (e.g. EAB or NCA).");
                return;
            }
            if (!/^\d{1,6}$/.test(parts[1])) {
                setLicenseWarning("Middle section must be 1-6 digits (e.g. 1234).");
                return;
            }
            if (!/^\d{4}$/.test(parts[2])) {
                if (parts[2].length < 4) {
                    setLicenseWarning("Year is too short — enter a 4-digit year (e.g. 2025).");
                } else if (parts[2].length > 4) {
                    setLicenseWarning("Year is too long — enter a 4-digit year (e.g. 2025).");
                } else {
                    setLicenseWarning("Year must be 4 digits (e.g. 2025).");
                }
                return;
            }
        }

        setLicenseWarning("");
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const newValue = name === "license" ? value.toUpperCase() : value;
        setForm({ ...form, [name]: newValue });
        setError("");

        if (name === "license") {
            validateLicense(newValue);
        }
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
        if (selectedRole === "agent" && !form.license) {
            setError("Please provide your license/certification number");
            return;
        }
        if (selectedRole === "agent" && form.license && !LICENSE_REGEX.test(form.license)) {
            setError("License number format is invalid. Use format: EAB/1234/2025");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            const agentData = selectedRole === "agent" ? {
                agency: form.agency,
                specialization: form.specialization,
                experience: form.experience,
                license: form.license,
                location: form.location,
            } : undefined;

            await signUp(form.email, form.password, form.fullName, form.phone, selectedRole, agentData);

            if (selectedRole === "agent") {
                toast.success("Application submitted successfully! 📋");
                setShowPendingModal(true);
            } else {
                toast.success("Account created successfully! 🎉");
                router.push("/dashboard/buyer");
            }
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
            router.push("/dashboard/buyer");
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
                    <h1 className={styles.brandTitle}>
                        {selectedRole === "agent" ? "Join as an Agent" : "Join EstateVue"}
                    </h1>
                    <p className={styles.brandSubtitle}>
                        {selectedRole === "agent"
                            ? "Apply to become a verified agent on EstateVue. List properties, connect with buyers, and grow your real estate business."
                            : "Create your free account and unlock access to thousands of premium properties, personalized recommendations, and expert agent support."
                        }
                    </p>
                    <div className={styles.features}>
                        {selectedRole === "agent" ? (
                            <>
                                <div className={styles.feature}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    <span>List unlimited properties</span>
                                </div>
                                <div className={styles.feature}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    <span>Get verified agent badge</span>
                                </div>
                                <div className={styles.feature}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    <span>Receive buyer inquiries directly</span>
                                </div>
                                <div className={styles.feature}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                    <span>Manage your portfolio dashboard</span>
                                </div>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
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

                    {/* Role Selector */}
                    <div className={styles.roleSelector}>
                        <button
                            type="button"
                            className={`${styles.roleBtn} ${selectedRole === "buyer" ? styles.roleBtnActive : ""}`}
                            onClick={() => setSelectedRole("buyer")}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            <span>Buyer</span>
                            <small>Browse & buy properties</small>
                        </button>
                        <button
                            type="button"
                            className={`${styles.roleBtn} ${selectedRole === "agent" ? styles.roleBtnActive : ""}`}
                            onClick={() => setSelectedRole("agent")}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            <span>Agent</span>
                            <small>List & manage properties</small>
                        </button>
                    </div>

                    {error && (
                        <div className={styles.errorMsg}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                            {error}
                        </div>
                    )}

                    {selectedRole === "buyer" && (
                        <div className={styles.socialBtns}>
                            <button type="button" className={styles.socialBtn} onClick={handleGoogleSignUp} disabled={isLoading}>
                                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                                Sign up with Google
                            </button>
                        </div>
                    )}

                    {selectedRole === "buyer" && (
                        <div className={styles.divider}>
                            <span>or register with email</span>
                        </div>
                    )}

                    {selectedRole === "agent" && (
                        <div className={styles.agentNotice}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            <p>Agent accounts require admin approval. You&apos;ll receive an email with a verification code once approved.</p>
                        </div>
                    )}

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
                                <label htmlFor="phone" className={styles.label}>Phone {selectedRole === "agent" ? "*" : "(Optional)"}</label>
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

                        {/* Agent-specific fields */}
                        {selectedRole === "agent" && (
                            <>
                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="agency" className={styles.label}>Agency Name</label>
                                        <div className={styles.inputWrapper}>
                                            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 7V5a4 4 0 0 0-8 0v2" /></svg>
                                            <input
                                                id="agency"
                                                name="agency"
                                                type="text"
                                                placeholder="Your agency name"
                                                value={form.agency}
                                                onChange={handleChange}
                                                className={styles.input}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="license" className={styles.label}>License Number *</label>
                                        {licenseWarning && (
                                            <div className={styles.licenseWarning}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                                                {licenseWarning}
                                            </div>
                                        )}
                                        <div className={styles.inputWrapper}>
                                            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="7" y1="8" x2="17" y2="8" /><line x1="7" y1="12" x2="13" y2="12" /></svg>
                                            <input
                                                id="license"
                                                name="license"
                                                type="text"
                                                placeholder="e.g. EAB/1234/2025"
                                                value={form.license}
                                                onChange={handleChange}
                                                className={`${styles.input} ${licenseWarning ? styles.inputWarning : ''} ${form.license && !licenseWarning ? styles.inputValid : ''}`}
                                            />
                                            {form.license && !licenseWarning && LICENSE_REGEX.test(form.license) && (
                                                <svg className={styles.matchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                                            )}
                                        </div>
                                        <span className={styles.licenseHint}>Format: PREFIX/NUMBER/YEAR — e.g. <strong>EAB/1234/2025</strong> or <strong>NCA/567/2024</strong></span>
                                    </div>
                                </div>

                                <div className={styles.inputRow}>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="specialization" className={styles.label}>Specialization</label>
                                        <div className={styles.inputWrapper}>
                                            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                            <select
                                                id="specialization"
                                                name="specialization"
                                                value={form.specialization}
                                                onChange={handleChange}
                                                className={styles.input}
                                            >
                                                <option value="">Select specialization</option>
                                                <option value="residential">Residential</option>
                                                <option value="commercial">Commercial</option>
                                                <option value="luxury">Luxury</option>
                                                <option value="land">Land</option>
                                                <option value="rental">Rental</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label htmlFor="experience" className={styles.label}>Experience</label>
                                        <div className={styles.inputWrapper}>
                                            <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                            <select
                                                id="experience"
                                                name="experience"
                                                value={form.experience}
                                                onChange={handleChange}
                                                className={styles.input}
                                            >
                                                <option value="">Select experience</option>
                                                <option value="0-1">Less than 1 year</option>
                                                <option value="1-3">1-3 years</option>
                                                <option value="3-5">3-5 years</option>
                                                <option value="5-10">5-10 years</option>
                                                <option value="10+">10+ years</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className={styles.inputGroup}>
                                    <label htmlFor="agentLocation" className={styles.label}>Location</label>
                                    <div className={styles.inputWrapper}>
                                        <svg className={styles.inputIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        <input
                                            id="agentLocation"
                                            name="location"
                                            type="text"
                                            placeholder="e.g., Nairobi, Mombasa"
                                            value={form.location}
                                            onChange={handleChange}
                                            className={styles.input}
                                        />
                                    </div>
                                </div>
                            </>
                        )}

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
                                I agree to the <Link href="/legal/terms">Terms of Service</Link> and <Link href="/legal/privacy">Privacy Policy</Link>
                            </label>
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                            {isLoading ? (
                                <span className={styles.spinner} />
                            ) : (
                                <>
                                    {selectedRole === "agent" ? "Submit Application" : "Create Account"}
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Agent Pending Approval Modal */}
            {showPendingModal && (
                <div className={gateStyles.gateOverlay}>
                    <div className={gateStyles.bgPattern}>
                        <div className={gateStyles.bgOrb1} />
                        <div className={gateStyles.bgOrb2} />
                        <div className={gateStyles.bgOrb3} />
                    </div>
                    <div className={gateStyles.gateContainer}>
                        <div className={gateStyles.logo}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                <polyline points="9 22 9 12 15 12 15 22" />
                            </svg>
                            <span>Estate<span className={gateStyles.logoAccent}>Vue</span></span>
                        </div>

                        <div className={gateStyles.steps}>
                            <div className={`${gateStyles.step} ${gateStyles.stepComplete}`}>
                                <div className={gateStyles.stepDot}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                        <polyline points="20 6 9 17 4 12" />
                                    </svg>
                                </div>
                                <span>Applied</span>
                            </div>
                            <div className={gateStyles.stepLine} />
                            <div className={`${gateStyles.step} ${gateStyles.stepPulse}`}>
                                <div className={gateStyles.stepDot}>
                                    <div className={gateStyles.miniSpinner} />
                                </div>
                                <span>Review</span>
                            </div>
                            <div className={gateStyles.stepLine} />
                            <div className={gateStyles.step}>
                                <div className={gateStyles.stepDot}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                                <span>Verify</span>
                            </div>
                        </div>

                        <div className={gateStyles.stateCard}>
                            <div className={gateStyles.stateIconWrap}>
                                <div className={`${gateStyles.stateIcon} ${gateStyles.stateIconApproved}`}>
                                    ✅
                                </div>
                            </div>
                            <h2 className={gateStyles.stateTitle}>Application Submitted!</h2>
                            <p className={gateStyles.stateText}>
                                Thank you, <span className={gateStyles.highlight}>{form.fullName}</span>! Your agent application has been submitted successfully and is now being reviewed by our admin team.
                            </p>

                            <div className={gateStyles.infoCards}>
                                <div className={gateStyles.infoCard}>
                                    <div className={gateStyles.infoCardIcon}>📧</div>
                                    <div>
                                        <strong>Email Notification</strong>
                                        <p>You&apos;ll receive an email at <span className={gateStyles.highlight}>{form.email}</span> when your application is reviewed.</p>
                                    </div>
                                </div>
                                <div className={gateStyles.infoCard}>
                                    <div className={gateStyles.infoCardIcon}>🔑</div>
                                    <div>
                                        <strong>Verification Code</strong>
                                        <p>If approved, you&apos;ll receive a unique code to activate your agent dashboard.</p>
                                    </div>
                                </div>
                                <div className={gateStyles.infoCard}>
                                    <div className={gateStyles.infoCardIcon}>⏱️</div>
                                    <div>
                                        <strong>Review Timeline</strong>
                                        <p>Applications are typically reviewed within 24-48 hours.</p>
                                    </div>
                                </div>
                            </div>

                            <div className={gateStyles.stateActions}>
                                <button className={gateStyles.activateBtn} onClick={() => router.push("/dashboard/agent")}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                    Go to Dashboard
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
