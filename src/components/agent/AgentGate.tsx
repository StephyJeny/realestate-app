"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { verifyAgentCode, getUserNotifications, Notification } from "@/lib/firestore";
import toast from "react-hot-toast";
import styles from "./AgentGate.module.css";

interface AgentGateProps {
    children: React.ReactNode;
}

export default function AgentGate({ children }: AgentGateProps) {
    const router = useRouter();
    const { user, userProfile, loading, logout, refreshProfile } = useAuth();
    const [verifyCode, setVerifyCode] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [showCodeInput, setShowCodeInput] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pulseStep, setPulseStep] = useState(0);
    const [countdown, setCountdown] = useState(10);

    // Animate the step indicators
    useEffect(() => {
        const interval = setInterval(() => {
            setPulseStep((prev) => (prev + 1) % 3);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Poll for status changes (check every 30 seconds)
    const checkStatus = useCallback(async () => {
        if (user && userProfile?.agentStatus === "pending") {
            await refreshProfile();
        }
    }, [user, userProfile, refreshProfile]);

    useEffect(() => {
        if (userProfile?.agentStatus === "pending") {
            const interval = setInterval(checkStatus, 30000);
            return () => clearInterval(interval);
        }
    }, [userProfile?.agentStatus, checkStatus]);

    // Load notifications when approved
    useEffect(() => {
        if (user && userProfile?.agentStatus === "approved" && !userProfile?.agentCodeVerified) {
            getUserNotifications(user.uid).then(setNotifications).catch(console.error);
        }
    }, [user, userProfile]);

    const handleVerifyCode = async () => {
        if (!user || !verifyCode.trim()) {
            toast.error("Please enter your verification code");
            return;
        }
        setIsVerifying(true);
        try {
            const success = await verifyAgentCode(user.uid, verifyCode.trim());
            if (success) {
                setShowSuccess(true);
            } else {
                toast.error("Invalid verification code. Please check and try again.");
            }
        } catch {
            toast.error("Verification failed. Please try again.");
        } finally {
            setIsVerifying(false);
        }
    };

    // Countdown timer for auto-redirect after success
    useEffect(() => {
        if (showSuccess && countdown > 0) {
            const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
            return () => clearTimeout(timer);
        }
        if (showSuccess && countdown === 0) {
            handleSignInRedirect();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [showSuccess, countdown]);

    const handleSignInRedirect = async () => {
        await logout();
        router.push("/auth/signin");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleVerifyCode();
    };

    // Loading state
    if (loading) {
        return (
            <div className={styles.gateOverlay}>
                <div className={styles.loadingPulse}>
                    <div className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    // Not logged in
    if (!user) {
        router.push("/auth/signin");
        return null;
    }

    // Not an agent or already verified — pass through
    if (!userProfile || userProfile.role !== "agent") {
        return <>{children}</>;
    }

    if (userProfile.agentCodeVerified) {
        return <>{children}</>;
    }

    const isPending = userProfile.agentStatus === "pending";
    const isApproved = userProfile.agentStatus === "approved";
    const isRejected = userProfile.agentStatus === "rejected";

    // No longer displaying the code locally, only sent via email
    return (
        <div className={styles.gateOverlay}>
            {/* Animated Background */}
            <div className={styles.bgPattern}>
                <div className={styles.bgOrb1} />
                <div className={styles.bgOrb2} />
                <div className={styles.bgOrb3} />
            </div>

            <div className={styles.gateContainer}>
                {/* Logo */}
                <div className={styles.logo}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Estate<span className={styles.logoAccent}>Vue</span></span>
                </div>

                {/* Step Indicator */}
                <div className={styles.steps}>
                    <div className={`${styles.step} ${styles.stepComplete}`}>
                        <div className={styles.stepDot}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        </div>
                        <span>Applied</span>
                    </div>
                    <div className={`${styles.stepLine} ${isApproved || isRejected ? styles.stepLineComplete : ""}`} />
                    <div className={`${styles.step} ${isApproved ? styles.stepActive : isRejected ? styles.stepError : ""} ${isPending ? styles.stepPulse : ""}`}>
                        <div className={styles.stepDot}>
                            {isPending ? (
                                <div className={styles.miniSpinner} />
                            ) : isApproved ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            )}
                        </div>
                        <span>Review</span>
                    </div>
                    <div className={`${styles.stepLine} ${isApproved && showCodeInput ? styles.stepLineComplete : ""}`} />
                    <div className={`${styles.step} ${showCodeInput ? styles.stepActive : ""}`}>
                        <div className={styles.stepDot}>
                            {showCodeInput ? "3" : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            )}
                        </div>
                        <span>Verify</span>
                    </div>
                </div>

                {/* PENDING STATE */}
                {isPending && (
                    <div className={styles.stateCard}>
                        <div className={styles.stateIconWrap}>
                            <div className={`${styles.stateIcon} ${styles.stateIconPending}`}>
                                <div className={styles.hourglassAnim}>⏳</div>
                            </div>
                            <div className={styles.statePulseRing} />
                        </div>
                        <h2 className={styles.stateTitle}>Application Under Review</h2>
                        <p className={styles.stateText}>
                            Your agent application has been submitted successfully. Our admin team is currently reviewing your credentials and will get back to you shortly.
                        </p>
                        <div className={styles.infoCards}>
                            <div className={styles.infoCard}>
                                <div className={styles.infoCardIcon}>📧</div>
                                <div>
                                    <strong>Email Notification</strong>
                                    <p>You&apos;ll receive an email at <span className={styles.highlight}>{user.email}</span> once your application is reviewed.</p>
                                </div>
                            </div>
                            <div className={styles.infoCard}>
                                <div className={styles.infoCardIcon}>🔑</div>
                                <div>
                                    <strong>Verification Code</strong>
                                    <p>If approved, you&apos;ll get a unique code to activate your agent dashboard.</p>
                                </div>
                            </div>
                            <div className={styles.infoCard}>
                                <div className={styles.infoCardIcon}>⏱️</div>
                                <div>
                                    <strong>Review Time</strong>
                                    <p>Applications are typically reviewed within 24-48 hours.</p>
                                </div>
                            </div>
                        </div>
                        <div className={styles.stateActions}>
                            <button className={styles.refreshBtn} onClick={async () => {
                                toast.loading("Checking status...", { id: "refresh" });
                                await refreshProfile();
                                toast.dismiss("refresh");
                                if (userProfile?.agentStatus === "pending") {
                                    toast("Still under review", { icon: "⏳" });
                                }
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                </svg>
                                Check Status
                            </button>
                            <button className={styles.logoutBtn} onClick={logout}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* APPROVED STATE — Show code entry or prompt */}
                {isApproved && !showCodeInput && (
                    <div className={styles.stateCard}>
                        <div className={styles.stateIconWrap}>
                            <div className={`${styles.stateIcon} ${styles.stateIconApproved}`}>
                                🎉
                            </div>
                            <div className={styles.confettiWrap}>
                                {[...Array(12)].map((_, i) => (
                                    <div key={i} className={styles.confettiPiece} style={{
                                        left: `${10 + Math.random() * 80}%`,
                                        animationDelay: `${Math.random() * 2}s`,
                                        background: ['#D4A017', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'][i % 5],
                                    }} />
                                ))}
                            </div>
                        </div>
                        <h2 className={styles.stateTitle}>You&apos;ve Been Approved! 🎉</h2>
                        <p className={styles.stateText}>
                            Congratulations! Your agent application has been reviewed and approved by our admin team.
                            Check your email for your unique verification code, then enter it to activate your dashboard.
                        </p>

                        {/* The code has been removed from UI display, users must check their email */}
                        <button className={styles.activateBtn} onClick={() => setShowCodeInput(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Enter Verification Code
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* CODE VERIFICATION STATE */}
                {isApproved && showCodeInput && (
                    <div className={styles.stateCard}>
                        <div className={styles.stateIconWrap}>
                            <div className={`${styles.stateIcon} ${styles.stateIconVerify}`}>
                                🔐
                            </div>
                        </div>
                        <h2 className={styles.stateTitle}>Verify Your Account</h2>
                        <p className={styles.stateText}>
                            Enter the verification code you received in your email to unlock your agent dashboard.
                        </p>

                        <div className={styles.codeInputSection}>
                            <label className={styles.codeLabel}>Verification Code</label>
                            <div className={styles.codeInputWrap}>
                                <input
                                    type="text"
                                    className={styles.codeInput}
                                    placeholder="EV-XXXXXX"
                                    value={verifyCode}
                                    onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
                                    onKeyDown={handleKeyDown}
                                    maxLength={9}
                                    autoFocus
                                />
                                <div className={styles.codeInputIcon}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                            </div>
                            <button
                                className={styles.verifyBtn}
                                onClick={handleVerifyCode}
                                disabled={isVerifying || !verifyCode.trim()}
                            >
                                {isVerifying ? (
                                    <div className={styles.btnSpinner} />
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        Verify & Activate Dashboard
                                    </>
                                )}
                            </button>
                            <button className={styles.backBtn} onClick={() => setShowCodeInput(false)}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H5M12 19l-7-7 7-7" />
                                </svg>
                                Go Back
                            </button>
                        </div>
                    </div>
                )}

                {/* REJECTED STATE */}
                {isRejected && (
                    <div className={styles.stateCard}>
                        <div className={styles.stateIconWrap}>
                            <div className={`${styles.stateIcon} ${styles.stateIconRejected}`}>
                                😔
                            </div>
                        </div>
                        <h2 className={styles.stateTitle}>Application Not Approved</h2>
                        <p className={styles.stateText}>
                            We&apos;re sorry, but your agent application was not approved at this time.
                            An email has been sent to <span className={styles.highlight}>{user.email}</span> with more details.
                        </p>
                        <div className={styles.rejectionInfo}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                            </svg>
                            <p>If you believe this was an error, please contact our support team at <strong>support@estatevue.com</strong> and we&apos;ll be happy to review your application again.</p>
                        </div>
                        <div className={styles.stateActions}>
                            <button className={styles.refreshBtn} onClick={async () => {
                                toast.loading("Checking status...", { id: "refresh" });
                                await refreshProfile();
                                toast.dismiss("refresh");
                            }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                                </svg>
                                Re-check Status
                            </button>
                            <button className={styles.logoutBtn} onClick={logout}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </div>
                )}

                {/* SUCCESS CELEBRATION STATE */}
                {showSuccess && (
                    <div className={styles.stateCard}>
                        {/* Confetti Burst */}
                        <div className={styles.confettiBurst}>
                            {[...Array(30)].map((_, i) => (
                                <div
                                    key={i}
                                    className={styles.confettiBurstPiece}
                                    style={{
                                        left: `${50 + (Math.random() - 0.5) * 80}%`,
                                        top: `${50 + (Math.random() - 0.5) * 60}%`,
                                        animationDelay: `${Math.random() * 0.5}s`,
                                        animationDuration: `${1.5 + Math.random() * 2}s`,
                                        background: ['#D4A017', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#F59E0B', '#EC4899'][i % 7],
                                        width: `${4 + Math.random() * 6}px`,
                                        height: `${4 + Math.random() * 6}px`,
                                        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                                        transform: `rotate(${Math.random() * 360}deg)`,
                                    }}
                                />
                            ))}
                        </div>

                        {/* Animated Checkmark */}
                        <div className={styles.successCheckWrap}>
                            <div className={styles.successCheckCircle}>
                                <svg className={styles.successCheckSvg} width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <polyline className={styles.successCheckmark} points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <div className={styles.successRing1} />
                            <div className={styles.successRing2} />
                            <div className={styles.successRing3} />
                        </div>

                        <h2 className={styles.successTitle}>You&apos;re All Set! 🚀</h2>
                        <p className={styles.successSubtitle}>Your agent account has been successfully verified</p>

                        <div className={styles.successFeatures}>
                            <div className={styles.successFeature}>
                                <div className={styles.successFeatureIcon}>🏠</div>
                                <span>List Properties</span>
                            </div>
                            <div className={styles.successFeatureDivider} />
                            <div className={styles.successFeature}>
                                <div className={styles.successFeatureIcon}>📊</div>
                                <span>Track Analytics</span>
                            </div>
                            <div className={styles.successFeatureDivider} />
                            <div className={styles.successFeature}>
                                <div className={styles.successFeatureIcon}>💬</div>
                                <span>Manage Inquiries</span>
                            </div>
                        </div>

                        <p className={styles.successNote}>
                            Sign in with your credentials to access your new agent dashboard.
                        </p>

                        <button className={styles.signInBtn} onClick={handleSignInRedirect}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                <polyline points="10 17 15 12 10 7" />
                                <line x1="15" y1="12" x2="3" y2="12" />
                            </svg>
                            Sign In to Dashboard
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                        </button>

                        <div className={styles.autoRedirect}>
                            <div className={styles.countdownRing}>
                                <svg width="28" height="28" viewBox="0 0 28 28">
                                    <circle className={styles.countdownTrack} cx="14" cy="14" r="12" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                                    <circle
                                        className={styles.countdownProgress}
                                        cx="14" cy="14" r="12"
                                        fill="none"
                                        stroke="#d4a017"
                                        strokeWidth="2"
                                        strokeDasharray={`${(2 * Math.PI * 12)}`}
                                        strokeDashoffset={`${(2 * Math.PI * 12) * (1 - countdown / 10)}`}
                                        strokeLinecap="round"
                                        transform="rotate(-90 14 14)"
                                    />
                                </svg>
                                <span className={styles.countdownNum}>{countdown}</span>
                            </div>
                            <span>Auto-redirecting to sign in...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
