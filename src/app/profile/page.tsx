"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile, NotificationPreferences } from "@/lib/firestore";
import {
    updateProfile,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser,
} from "firebase/auth";
import { doc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import toast from "react-hot-toast";
import styles from "./profile.module.css";

const DEFAULT_PREFERENCES: NotificationPreferences = {
    savedSearchAlerts: true,
    priceDropAlerts: true,
    offerUpdates: true,
    viewingReminders: true,
    marketNewsletter: false,
};

export default function ProfilePage() {
    const router = useRouter();
    const {
        user,
        userProfile,
        loading,
        refreshProfile,
        getDashboardPath,
        resetPassword,
        sendVerificationEmail,
    } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Form state
    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");

    // Notification preferences state (with fallback to userProfile.notificationPreferences)
    const [prefsOverride, setPrefsOverride] = useState<NotificationPreferences | null>(null);
    const [savingPrefs, setSavingPrefs] = useState(false);
    const prefs: NotificationPreferences = {
        ...DEFAULT_PREFERENCES,
        ...(userProfile?.notificationPreferences || {}),
        ...(prefsOverride || {}),
    };

    // Security & Password state
    const [sendingVerification, setSendingVerification] = useState(false);
    const [refreshingVerification, setRefreshingVerification] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [changingPassword, setChangingPassword] = useState(false);
    const [sendingResetLink, setSendingResetLink] = useState(false);

    // Delete account state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteCurrentPassword, setDeleteCurrentPassword] = useState("");
    const [deletingAccount, setDeletingAccount] = useState(false);

    const startEditing = () => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || "");
            setPhone(userProfile.phone || "");
            setBio(userProfile.bio || "");
            setLocation(userProfile.location || "");
        }
        setEditing(true);
    };

    // Redirect if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user, loading, router]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setErrorMsg("");
        setSuccessMsg("");

        try {
            // Update Firebase Auth display name
            if (auth.currentUser && displayName !== user.displayName) {
                await updateProfile(auth.currentUser, { displayName });
            }

            // Update Firestore profile
            await updateUserProfile(user.uid, {
                displayName,
                phone,
                bio,
                location,
            });

            await refreshProfile();
            setEditing(false);
            setSuccessMsg("Profile updated successfully!");
            setTimeout(() => setSuccessMsg(""), 4000);
        } catch (err) {
            console.error("Failed to update profile:", err);
            setErrorMsg("Failed to update profile. Please try again.");
            setTimeout(() => setErrorMsg(""), 4000);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || "");
            setPhone(userProfile.phone || "");
            setBio(userProfile.bio || "");
            setLocation(userProfile.location || "");
        }
        setEditing(false);
        setErrorMsg("");
    };

    const handleTogglePreference = async (key: keyof NotificationPreferences) => {
        if (!user) return;
        const updated: NotificationPreferences = {
            ...prefs,
            [key]: !prefs[key],
        };
        setPrefsOverride(updated);
        setSavingPrefs(true);
        try {
            await updateUserProfile(user.uid, {
                notificationPreferences: updated,
            });
            await refreshProfile();
            toast.success("Notification preferences saved");
        } catch (err) {
            console.error("Failed to update notification preferences:", err);
            setPrefsOverride(null);
            toast.error("Could not save notification preferences");
        } finally {
            setSavingPrefs(false);
        }
    };

    const handleSendVerification = async () => {
        setSendingVerification(true);
        try {
            await sendVerificationEmail();
            toast.success("Verification email sent! Please check your inbox.");
        } catch (err: unknown) {
            console.error("Verification email error:", err);
            const fbErr = err as { message?: string };
            toast.error(fbErr?.message || "Failed to send verification email. Try again in a moment.");
        } finally {
            setSendingVerification(false);
        }
    };

    const handleRefreshVerification = async () => {
        setRefreshingVerification(true);
        try {
            await refreshProfile();
            if (auth.currentUser?.emailVerified) {
                toast.success("Your email address is now verified!");
            } else {
                toast("Not verified yet — click the link in your email first.", { icon: "📬" });
            }
        } finally {
            setRefreshingVerification(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.email || !auth.currentUser) return;

        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New passwords do not match.");
            return;
        }

        setChangingPassword(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            toast.success("Password updated successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setShowPasswordForm(false);
        } catch (err: unknown) {
            console.error("Password change error:", err);
            const fbErr = err as { code?: string };
            if (fbErr?.code === "auth/wrong-password" || fbErr?.code === "auth/invalid-credential") {
                toast.error("Current password is incorrect.");
            } else if (fbErr?.code === "auth/weak-password") {
                toast.error("New password is too weak. Choose at least 6 characters.");
            } else {
                toast.error("Could not update password. You can also send a password reset email.");
            }
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSendResetEmail = async () => {
        if (!user?.email) return;
        setSendingResetLink(true);
        try {
            await resetPassword(user.email);
            toast.success(`Password reset link sent to ${user.email}`);
        } catch (err) {
            console.error("Password reset error:", err);
            toast.error("Could not send password reset email.");
        } finally {
            setSendingResetLink(false);
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !auth.currentUser) return;
        if (deleteConfirmText.trim().toUpperCase() !== "DELETE") {
            toast.error("Please type DELETE to confirm account deletion.");
            return;
        }

        setDeletingAccount(true);
        try {
            // Re-authenticate if a password was supplied (for email/password accounts)
            if (deleteCurrentPassword.trim() && user.email) {
                const credential = EmailAuthProvider.credential(user.email, deleteCurrentPassword);
                await reauthenticateWithCredential(auth.currentUser, credential);
            }

            // Delete Firestore profile first while authenticated
            await deleteDoc(doc(db, "users", user.uid));
            // Delete Firebase Auth user
            await deleteUser(auth.currentUser);
            toast.success("Your account has been permanently deleted.");
            router.push("/");
        } catch (err: unknown) {
            console.error("Delete account error:", err);
            const fbErr = err as { code?: string };
            if (fbErr?.code === "auth/requires-recent-login") {
                toast.error("For security, please enter your current password or sign out and sign back in before deleting your account.");
            } else if (fbErr?.code === "auth/wrong-password" || fbErr?.code === "auth/invalid-credential") {
                toast.error("Incorrect password. Please enter your current password to confirm.");
            } else {
                toast.error("Failed to delete account. Please try signing in again first.");
            }
        } finally {
            setDeletingAccount(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.profilePage}>
                <div className={styles.loadingWrap}>
                    <div className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    if (!user || !userProfile) return null;

    const initials = (userProfile.displayName || user.email || "U")
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const roleLabel =
        userProfile.role === "admin"
            ? "⭐ Administrator"
            : userProfile.role === "agent"
                ? "🏠 Agent"
                : "👤 Buyer";

    const memberSince = userProfile.createdAt
        ? new Date(userProfile.createdAt.seconds * 1000).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        : "N/A";

    const savedCount = userProfile.savedProperties?.length || 0;
    const isPasswordProvider = user.providerData?.some((p) => p.providerId === "password");

    return (
        <div className={styles.profilePage}>
            <div className={styles.container}>
                {/* Back Link */}
                <Link href={getDashboardPath()} className={styles.backLink}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>

                {/* Success/Error Messages */}
                {successMsg && (
                    <div className={styles.successMsg}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                        </svg>
                        {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className={styles.errorMsg}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="15" y1="9" x2="9" y2="15" />
                            <line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        {errorMsg}
                    </div>
                )}

                {/* Profile Header */}
                <div className={styles.profileHeader}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>{initials}</div>
                    </div>
                    <div className={styles.headerInfo}>
                        <h1 className={styles.userName}>{userProfile.displayName || "User"}</h1>
                        <p className={styles.userEmail}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            {user.email}
                            {user.emailVerified ? (
                                <span className={styles.verifiedBadge} style={{ marginLeft: "0.4rem" }}>
                                    ✓ Verified
                                </span>
                            ) : (
                                <span className={styles.pendingBadge} style={{ marginLeft: "0.4rem" }}>
                                    Unverified
                                </span>
                            )}
                        </p>
                        <span className={styles.roleBadge}>{roleLabel}</span>
                        <p className={styles.memberSince}>Member since {memberSince}</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionBody}>
                        <div className={styles.statsBar}>
                            <div className={styles.statItem}>
                                <div className={`${styles.statItemIcon} ${styles.statIconBlue}`}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className={styles.statItemValue}>{savedCount}</div>
                                    <div className={styles.statItemLabel}>Saved Properties</div>
                                </div>
                            </div>
                            {userProfile.role === "agent" && (
                                <>
                                    <div className={styles.statItem}>
                                        <div className={`${styles.statItemIcon} ${styles.statIconGreen}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                                                <polyline points="9 22 9 12 15 12 15 22" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className={styles.statItemValue}>{userProfile.propertiesCount || 0}</div>
                                            <div className={styles.statItemLabel}>Listings</div>
                                        </div>
                                    </div>
                                    <div className={styles.statItem}>
                                        <div className={`${styles.statItemIcon} ${styles.statIconGold}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                            </svg>
                                        </div>
                                        <div>
                                            <div className={styles.statItemValue}>{userProfile.rating?.toFixed(1) || "N/A"}</div>
                                            <div className={styles.statItemLabel}>Rating</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            Personal Information
                        </h2>
                        {!editing ? (
                            <button className={styles.editBtn} onClick={startEditing}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                Edit
                            </button>
                        ) : (
                            <div>
                                <button className={styles.cancelBtn} onClick={handleCancel}>Cancel</button>
                                <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className={styles.sectionBody}>
                        {!editing ? (
                            <div className={styles.infoGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Full Name</span>
                                    <span className={styles.infoValue}>{userProfile.displayName || "—"}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Email Address</span>
                                    <span className={styles.infoValue}>{user.email}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Phone</span>
                                    <span className={userProfile.phone ? styles.infoValue : styles.infoValueMuted}>
                                        {userProfile.phone || "Not provided"}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Location</span>
                                    <span className={userProfile.location ? styles.infoValue : styles.infoValueMuted}>
                                        {userProfile.location || "Not provided"}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.infoGrid}>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Full Name</label>
                                    <input
                                        className={styles.formInput}
                                        type="text"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        placeholder="Your full name"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Email Address</label>
                                    <input
                                        className={styles.formInput}
                                        type="email"
                                        value={user.email || ""}
                                        disabled
                                        style={{ opacity: 0.6, cursor: "not-allowed" }}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Phone</label>
                                    <input
                                        className={styles.formInput}
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="+254 712 345 678"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Location</label>
                                    <input
                                        className={styles.formInput}
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="Nairobi, Kenya"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bio */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                                <line x1="16" y1="13" x2="8" y2="13" />
                                <line x1="16" y1="17" x2="8" y2="17" />
                                <polyline points="10 9 9 9 8 9" />
                            </svg>
                            Bio
                        </h2>
                    </div>
                    <div className={styles.sectionBody}>
                        {!editing ? (
                            <p className={userProfile.bio ? styles.infoValue : styles.infoValueMuted}>
                                {userProfile.bio || "No bio added yet. Click Edit above to add one."}
                            </p>
                        ) : (
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>About You</label>
                                <textarea
                                    className={styles.formTextarea}
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    rows={4}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Agent Details (only for agents) */}
                {userProfile.role === "agent" && (
                    <div className={styles.sectionCard}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="2" y="7" width="20" height="14" rx="2" />
                                    <path d="M16 7V5a4 4 0 0 0-8 0v2" />
                                </svg>
                                Agent Details
                            </h2>
                            {userProfile.agentStatus === "approved" && userProfile.agentCodeVerified ? (
                                <span className={styles.verifiedBadge}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    Verified Agent
                                </span>
                            ) : (
                                <span className={styles.pendingBadge}>
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    {userProfile.agentStatus === "pending" ? "Pending Approval" : userProfile.agentStatus || "Pending"}
                                </span>
                            )}
                        </div>
                        <div className={styles.sectionBody}>
                            <div className={styles.agentGrid}>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Agency</span>
                                    <span className={userProfile.agency ? styles.infoValue : styles.infoValueMuted}>
                                        {userProfile.agency || "Independent"}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Specialization</span>
                                    <span className={userProfile.specialization ? styles.infoValue : styles.infoValueMuted}>
                                        {userProfile.specialization || "Not specified"}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>Experience</span>
                                    <span className={userProfile.experience ? styles.infoValue : styles.infoValueMuted}>
                                        {userProfile.experience || "Not specified"}
                                    </span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span className={styles.infoLabel}>License Number</span>
                                    <span className={userProfile.license ? styles.infoValue : styles.infoValueMuted}>
                                        {userProfile.license || "Not provided"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Notification Preferences */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            Notification Preferences
                        </h2>
                        {savingPrefs && (
                            <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>Saving...</span>
                        )}
                    </div>
                    <div className={styles.sectionBody}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {[
                                {
                                    key: "savedSearchAlerts" as const,
                                    title: "Saved Search & New Listing Alerts",
                                    desc: "Get notified when new properties match your saved search filters.",
                                },
                                {
                                    key: "priceDropAlerts" as const,
                                    title: "Price Drop & Under-Offer Alerts",
                                    desc: "Receive updates when properties on your wishlist change price or status.",
                                },
                                {
                                    key: "offerUpdates" as const,
                                    title: "Offer & Negotiation Updates",
                                    desc: "Instant alerts when an agent or buyer responds to an offer.",
                                },
                                {
                                    key: "viewingReminders" as const,
                                    title: "Viewing & Virtual Tour Reminders",
                                    desc: "Reminders and calendar updates for scheduled site visits and video tours.",
                                },
                                {
                                    key: "marketNewsletter" as const,
                                    title: "Monthly Kenyan Property Market Digest",
                                    desc: "Curated insights on Nairobi, Mombasa, and satellite town price trends.",
                                },
                            ].map((item) => (
                                <div
                                    key={item.key}
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        gap: "1rem",
                                        paddingBottom: "0.85rem",
                                        borderBottom: "1px solid var(--border-light)",
                                    }}
                                >
                                    <div>
                                        <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--text-heading)" }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                                            {item.desc}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={prefs[item.key]}
                                        disabled={savingPrefs}
                                        onClick={() => handleTogglePreference(item.key)}
                                        style={{
                                            width: "46px",
                                            height: "26px",
                                            borderRadius: "999px",
                                            border: "none",
                                            background: prefs[item.key] ? "var(--gold-500, #d4a017)" : "var(--border-color, #cbd5e1)",
                                            position: "relative",
                                            cursor: "pointer",
                                            transition: "background 0.2s ease",
                                            flexShrink: 0,
                                        }}
                                    >
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "3px",
                                                left: prefs[item.key] ? "23px" : "3px",
                                                width: "20px",
                                                height: "20px",
                                                borderRadius: "50%",
                                                background: "#fff",
                                                transition: "left 0.2s ease",
                                                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                            }}
                                        />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Account Security & Verification */}
                <div className={styles.sectionCard}>
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                            Account Security & Verification
                        </h2>
                    </div>
                    <div className={styles.sectionBody}>
                        {/* Email verification row */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: "1rem",
                                paddingBottom: "1.25rem",
                                marginBottom: "1.25rem",
                                borderBottom: "1px solid var(--border-light)",
                            }}
                        >
                            <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-heading)" }}>
                                        Email Verification
                                    </span>
                                    {user.emailVerified ? (
                                        <span className={styles.verifiedBadge}>✓ Verified</span>
                                    ) : (
                                        <span className={styles.pendingBadge}>⚠️ Unverified</span>
                                    )}
                                </div>
                                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
                                    {user.emailVerified
                                        ? "Your email is verified. You have full access to collaborative co-buying boards and notifications."
                                        : "Verify your email to collaborate on shared property boards and protect your account."}
                                </p>
                            </div>
                            {!user.emailVerified && (
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <button
                                        type="button"
                                        className={styles.editBtn}
                                        onClick={handleSendVerification}
                                        disabled={sendingVerification}
                                    >
                                        {sendingVerification ? "Sending..." : "Send Verification Email"}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.cancelBtn}
                                        onClick={handleRefreshVerification}
                                        disabled={refreshingVerification}
                                    >
                                        {refreshingVerification ? "Checking..." : "I've Verified — Refresh"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Password Management */}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "1rem",
                                paddingBottom: "1.25rem",
                                marginBottom: "1.25rem",
                                borderBottom: "1px solid var(--border-light)",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--text-heading)" }}>
                                        Password & Sign-In Credentials
                                    </div>
                                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
                                        {isPasswordProvider
                                            ? "Update your password directly or send yourself a password reset link."
                                            : "You signed in with Google. You can also set or reset an email password below."}
                                    </p>
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                                    {isPasswordProvider && (
                                        <button
                                            type="button"
                                            className={styles.editBtn}
                                            onClick={() => setShowPasswordForm(!showPasswordForm)}
                                        >
                                            {showPasswordForm ? "Cancel" : "Change Password"}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        className={styles.cancelBtn}
                                        onClick={handleSendResetEmail}
                                        disabled={sendingResetLink}
                                    >
                                        {sendingResetLink ? "Sending..." : "Send Reset Link to Email"}
                                    </button>
                                </div>
                            </div>

                            {showPasswordForm && (
                                <form
                                    onSubmit={handleChangePassword}
                                    style={{
                                        background: "var(--bg-secondary)",
                                        padding: "1.25rem",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid var(--border-light)",
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                                        gap: "1rem",
                                    }}
                                >
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Current Password</label>
                                        <input
                                            type="password"
                                            className={styles.formInput}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="Enter current password"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>New Password</label>
                                        <input
                                            type="password"
                                            className={styles.formInput}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Confirm New Password</label>
                                        <input
                                            type="password"
                                            className={styles.formInput}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat new password"
                                            minLength={6}
                                            required
                                        />
                                    </div>
                                    <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end" }}>
                                        <button type="submit" className={styles.saveBtn} disabled={changingPassword}>
                                            {changingPassword ? "Updating..." : "Update Password"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>

                        {/* Danger Zone: Delete Account */}
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    flexWrap: "wrap",
                                    gap: "1rem",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "0.95rem", fontWeight: 600, color: "var(--error, #ef4444)" }}>
                                        Delete Account
                                    </div>
                                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0.25rem 0 0" }}>
                                        Permanently remove your EstateVue profile, saved searches, and personal data.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                                    style={{
                                        padding: "0.45rem 1rem",
                                        fontSize: "0.82rem",
                                        fontWeight: 600,
                                        color: "var(--error, #ef4444)",
                                        background: "rgba(239, 68, 68, 0.08)",
                                        border: "1px solid rgba(239, 68, 68, 0.35)",
                                        borderRadius: "var(--radius-md)",
                                        cursor: "pointer",
                                    }}
                                >
                                    {showDeleteConfirm ? "Cancel" : "Delete My Account"}
                                </button>
                            </div>

                            {showDeleteConfirm && (
                                <form
                                    onSubmit={handleDeleteAccount}
                                    style={{
                                        marginTop: "1rem",
                                        padding: "1.25rem",
                                        borderRadius: "var(--radius-md)",
                                        background: "rgba(239, 68, 68, 0.05)",
                                        border: "1px solid rgba(239, 68, 68, 0.3)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.85rem",
                                    }}
                                >
                                    <p style={{ fontSize: "0.84rem", color: "var(--text-primary)", margin: 0 }}>
                                        This action cannot be undone. Type <strong>DELETE</strong> below to permanently delete your account.
                                    </p>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.85rem" }}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Type DELETE to confirm</label>
                                            <input
                                                type="text"
                                                className={styles.formInput}
                                                value={deleteConfirmText}
                                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                                placeholder="DELETE"
                                                required
                                            />
                                        </div>
                                        {isPasswordProvider && (
                                            <div className={styles.formGroup}>
                                                <label className={styles.formLabel}>Current Password</label>
                                                <input
                                                    type="password"
                                                    className={styles.formInput}
                                                    value={deleteCurrentPassword}
                                                    onChange={(e) => setDeleteCurrentPassword(e.target.value)}
                                                    placeholder="Confirm your password"
                                                    required
                                                />
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                                        <button
                                            type="submit"
                                            disabled={deletingAccount || deleteConfirmText.trim().toUpperCase() !== "DELETE"}
                                            style={{
                                                padding: "0.55rem 1.25rem",
                                                fontSize: "0.84rem",
                                                fontWeight: 700,
                                                color: "#fff",
                                                background: "var(--error, #ef4444)",
                                                border: "none",
                                                borderRadius: "var(--radius-md)",
                                                cursor: deletingAccount ? "not-allowed" : "pointer",
                                                opacity: deleteConfirmText.trim().toUpperCase() !== "DELETE" ? 0.5 : 1,
                                            }}
                                        >
                                            {deletingAccount ? "Deleting Account..." : "Permanently Delete Account"}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

