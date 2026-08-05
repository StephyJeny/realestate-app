"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { updateUserProfile } from "@/lib/firestore";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import styles from "./profile.module.css";

export default function ProfilePage() {
    const router = useRouter();
    const { user, userProfile, loading, refreshProfile, getDashboardPath } = useAuth();
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");
    const [errorMsg, setErrorMsg] = useState("");

    // Form state
    const [displayName, setDisplayName] = useState("");
    const [phone, setPhone] = useState("");
    const [bio, setBio] = useState("");
    const [location, setLocation] = useState("");

    // Populate form when profile loads
    useEffect(() => {
        if (userProfile) {
            setDisplayName(userProfile.displayName || "");
            setPhone(userProfile.phone || "");
            setBio(userProfile.bio || "");
            setLocation(userProfile.location || "");
        }
    }, [userProfile]);

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
        // Reset form values
        if (userProfile) {
            setDisplayName(userProfile.displayName || "");
            setPhone(userProfile.phone || "");
            setBio(userProfile.bio || "");
            setLocation(userProfile.location || "");
        }
        setEditing(false);
        setErrorMsg("");
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
                            <button className={styles.editBtn} onClick={() => setEditing(true)}>
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
                                        placeholder="+1 (555) 000-0000"
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.formLabel}>Location</label>
                                    <input
                                        className={styles.formInput}
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        placeholder="City, State"
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
            </div>
        </div>
    );
}
