"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    getPropertiesByAgent,
    addProperty,
    deleteProperty,
    getInquiriesByAgent,
    getUserNotifications,
    updateUserProfile,
    FirestoreProperty,
    Notification,
    Inquiry,
} from "@/lib/firestore";
import toast from "react-hot-toast";
import styles from "../dashboard.module.css";
import AgentGate from "@/components/agent/AgentGate";

export default function AgentDashboard() {
    const router = useRouter();
    const { user, userProfile, loading, logout, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [properties, setProperties] = useState<FirestoreProperty[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);

    const [newProperty, setNewProperty] = useState({
        title: "", description: "", type: "apartment" as FirestoreProperty["type"],
        listingType: "sale" as FirestoreProperty["listingType"], price: 0, currency: "KES",
        bedrooms: 0, bathrooms: 0, area: 0, yearBuilt: 2024, address: "",
        city: "", neighborhood: "", amenities: "",
    });

    const [editProfile, setEditProfile] = useState({
        displayName: "", phone: "", bio: "", agency: "", location: "", specialization: "",
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user && userProfile) {
            loadData();
            setEditProfile({
                displayName: userProfile.displayName || "",
                phone: userProfile.phone || "",
                bio: userProfile.bio || "",
                agency: userProfile.agency || "",
                location: userProfile.location || "",
                specialization: userProfile.specialization || "",
            });
        }
    }, [user, userProfile]);

    const loadData = async () => {
        if (!user) return;
        try {
            const [props, inqs, notifs] = await Promise.all([
                getPropertiesByAgent(user.uid),
                getInquiriesByAgent(user.uid),
                getUserNotifications(user.uid),
            ]);
            setProperties(props);
            setInquiries(inqs);
            setNotifications(notifs);
        } catch (err) {
            console.error("Failed to load data:", err);
        }
    };

    const handleAddProperty = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) return;
        if (!newProperty.title || !newProperty.price || !newProperty.city) {
            toast.error("Please fill in required fields");
            return;
        }
        setIsSubmitting(true);
        try {
            await addProperty({
                ...newProperty,
                amenities: newProperty.amenities.split(",").map((a) => a.trim()).filter(Boolean),
                images: ["/images/property-1.png"],
                agentId: user.uid,
                agentName: userProfile.displayName,
                agentEmail: userProfile.email,
                agentPhone: userProfile.phone,
                status: "active",
                isFeatured: false,
                views: 0,
                favorites: 0,
            });
            toast.success("Property listed successfully! 🏠");
            setShowAddModal(false);
            setNewProperty({
                title: "", description: "", type: "apartment", listingType: "sale",
                price: 0, currency: "KES", bedrooms: 0, bathrooms: 0, area: 0,
                yearBuilt: 2024, address: "", city: "", neighborhood: "", amenities: "",
            });
            loadData();
        } catch (err) {
            console.error("Failed to add property:", err);
            toast.error("Failed to add property");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProperty = async (propertyId: string) => {
        if (!user || !confirm("Are you sure you want to delete this property?")) return;
        try {
            await deleteProperty(propertyId, user.uid);
            toast.success("Property deleted");
            loadData();
        } catch (err) {
            console.error("Failed to delete:", err);
            toast.error("Failed to delete property");
        }
    };



    const handleSaveProfile = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await updateUserProfile(user.uid, editProfile);
            toast.success("Profile updated! ✨");
            await refreshProfile();
            setShowEditProfile(false);
        } catch (err) {
            console.error("Failed to update profile:", err);
            toast.error("Failed to update profile");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
        try {
            const { deleteUser: deleteUserDoc } = await import("@/lib/firestore");
            await deleteUserDoc(user!.uid);
            await logout();
            toast.success("Account deleted");
            router.push("/");
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete account");
        }
    };

    if (loading) {
        return (
            <div className={styles.dashboardPage}>
                <div className={styles.loadingWrap}>
                    <div className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    if (!user) return null;

    const isVerified = userProfile?.agentCodeVerified;

    return (
        <AgentGate>
            <div className={styles.dashboardPage}>
                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <span className={`${styles.sidebarRole} ${styles.roleAgent}`}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                            Agent ✅
                        </span>
                        <span className={styles.sidebarUserName}>{userProfile?.displayName || "Agent"}</span>
                        <span className={styles.sidebarEmail}>{user.email}</span>
                    </div>

                    <nav className={styles.sidebarNav}>
                        <div className={styles.sidebarSection}>
                            <div className={styles.sidebarSectionTitle}>Dashboard</div>
                            <button className={`${styles.sidebarLink} ${activeTab === "overview" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                Overview
                            </button>
                            <button className={`${styles.sidebarLink} ${activeTab === "properties" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("properties"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                My Properties
                                {properties.length > 0 && <span className={styles.sidebarBadge}>{properties.length}</span>}
                            </button>
                            <button className={`${styles.sidebarLink} ${activeTab === "inquiries" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("inquiries"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                Inquiries
                                {inquiries.length > 0 && <span className={styles.sidebarBadge}>{inquiries.length}</span>}
                            </button>
                            <button className={`${styles.sidebarLink} ${activeTab === "notifications" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("notifications"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                Notifications
                                {notifications.filter(n => !n.read).length > 0 && (
                                    <span className={styles.sidebarBadge}>{notifications.filter(n => !n.read).length}</span>
                                )}
                            </button>
                        </div>

                        <div className={styles.sidebarSection}>
                            <div className={styles.sidebarSectionTitle}>Account</div>
                            <button className={`${styles.sidebarLink} ${activeTab === "profile" ? styles.sidebarLinkActive : ""}`}
                                onClick={() => { setActiveTab("profile"); setSidebarOpen(false); }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                My Profile
                            </button>
                        </div>
                    </nav>

                    <div className={styles.sidebarFooter}>
                        <button className={styles.logoutBtn} onClick={logout}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            Sign Out
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    <div className={styles.pageHeader}>
                        <h1 className={styles.pageTitle}>Agent Dashboard</h1>
                        <p className={styles.pageSubtitle}>
                            Manage your properties, respond to inquiries, and grow your business.
                        </p>
                    </div>


                    {activeTab === "overview" && (
                        <>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconBlue}`}>🏠</div>
                                        <span className={`${styles.statTrend} ${styles.statTrendUp}`}>Active</span>
                                    </div>
                                    <div className={styles.statValue}>{properties.length}</div>
                                    <div className={styles.statLabel}>Listed Properties</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconGreen}`}>💬</div>
                                    </div>
                                    <div className={styles.statValue}>{inquiries.length}</div>
                                    <div className={styles.statLabel}>Inquiries Received</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconGold}`}>⭐</div>
                                    </div>
                                    <div className={styles.statValue}>{userProfile?.rating || 0}</div>
                                    <div className={styles.statLabel}>Average Rating</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statCardHeader}>
                                        <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                                            ✅
                                        </div>
                                    </div>
                                    <div className={styles.statValue}>Verified</div>
                                    <div className={styles.statLabel}>Account Status</div>
                                </div>
                            </div>

                            {(
                                <div className={styles.contentCard}>
                                    <div className={styles.contentCardHeader}>
                                        <h3 className={styles.contentCardTitle}>Quick Actions</h3>
                                    </div>
                                    <div className={styles.contentCardBody}>
                                        <div className={styles.quickLinksGrid}>
                                            <button className={styles.quickLink} onClick={() => setShowAddModal(true)}>
                                                <div className={`${styles.quickLinkIcon} ${styles.statIconGreen}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                                </div>
                                                Add New Property
                                            </button>
                                            <button className={styles.quickLink} onClick={() => setActiveTab("properties")}>
                                                <div className={`${styles.quickLinkIcon} ${styles.statIconBlue}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                                                </div>
                                                Manage Properties
                                            </button>
                                            <button className={styles.quickLink} onClick={() => setActiveTab("inquiries")}>
                                                <div className={`${styles.quickLinkIcon} ${styles.statIconGold}`}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                                </div>
                                                View Inquiries
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === "properties" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>My Properties</h3>
                                {isVerified && (
                                    <button className={styles.contentCardAction} onClick={() => setShowAddModal(true)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                                        Add Property
                                    </button>
                                )}
                            </div>
                            {properties.length > 0 ? (
                                <div className={styles.contentCardBody}>
                                    <div className={styles.propertyGrid}>
                                        {properties.map((prop) => (
                                            <div key={prop.id} className={styles.propertyCard}>
                                                <div className={styles.propertyImageWrap}>
                                                    <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, var(--navy-300), var(--navy-500))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "2rem" }}>🏠</div>
                                                    <span className={styles.propertyCardBadge} style={{ background: prop.listingType === "sale" ? "rgba(239,68,68,0.9)" : "rgba(59,130,246,0.9)", color: "#fff" }}>
                                                        {prop.listingType === "sale" ? "For Sale" : "For Rent"}
                                                    </span>
                                                </div>
                                                <div className={styles.propertyCardBody}>
                                                    <h4 className={styles.propertyCardTitle}>{prop.title}</h4>
                                                    <div className={styles.propertyCardLocation}>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                        {prop.city}, {prop.neighborhood}
                                                    </div>
                                                    <div className={styles.propertyCardPrice}>
                                                        KES {prop.price.toLocaleString()}{prop.listingType === "rent" ? "/mo" : ""}
                                                    </div>
                                                    <div className={styles.propertyCardMeta}>
                                                        <span>🛏 {prop.bedrooms} Beds</span>
                                                        <span>🚿 {prop.bathrooms} Baths</span>
                                                        <span>📐 {prop.area} sqft</span>
                                                    </div>
                                                    <div className={styles.propertyCardActions}>
                                                        <button onClick={() => handleDeleteProperty(prop.id!)}>
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>🏠</div>
                                    <h3 className={styles.emptyTitle}>No Properties Yet</h3>
                                    <p className={styles.emptyText}>
                                        {isVerified ? "Start listing properties to attract buyers and renters." : "Get verified first to start listing properties."}
                                    </p>
                                    {isVerified && (
                                        <button className={styles.emptyAction} onClick={() => setShowAddModal(true)}>
                                            Add Your First Property
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "inquiries" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>Inquiries Received</h3>
                            </div>
                            {inquiries.length > 0 ? (
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>From</th>
                                            <th>Property</th>
                                            <th>Type</th>
                                            <th>Message</th>
                                            <th>Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inquiries.map((inq) => (
                                            <tr key={inq.id as string}>
                                                <td>
                                                    <div className={styles.tableUserCell}>
                                                        <div className={styles.tableAvatar}>
                                                            {inq.senderName?.charAt(0) || "U"}
                                                        </div>
                                                        <div className={styles.tableUserInfo}>
                                                            <span className={styles.tableUserName}>{inq.senderName || "User"}</span>
                                                            <span className={styles.tableUserEmail}>{inq.senderEmail || ""}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{inq.propertyTitle || "Property"}</td>
                                                <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>{inq.type || "inquiry"}</span></td>
                                                <td style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                    {inq.message || ""}
                                                </td>
                                                <td>{inq.createdAt ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className={styles.emptyState}>
                                    <div className={styles.emptyIcon}>💬</div>
                                    <h3 className={styles.emptyTitle}>No Inquiries Yet</h3>
                                    <p className={styles.emptyText}>
                                        Once buyers start reaching out about your properties, their inquiries will appear here.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "notifications" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>Notifications</h3>
                            </div>
                            <div className={styles.contentCardBody}>
                                {notifications.length > 0 ? (
                                    notifications.map((notif) => (
                                        <div key={notif.id} className={`${styles.notificationItem} ${!notif.read ? styles.notificationUnread : ""}`}>
                                            <div className={styles.notificationIcon} style={{
                                                background: notif.type === "agent_approved" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                                color: notif.type === "agent_approved" ? "var(--success)" : "var(--error)"
                                            }}>
                                                {notif.type === "agent_approved" ? "🎉" : "📋"}
                                            </div>
                                            <div>
                                                <div className={styles.notificationTitle}>{notif.title}</div>
                                                <div className={styles.notificationMsg}>{notif.message}</div>
                                                {notif.agentCode && (
                                                    <div style={{ marginTop: "0.5rem", padding: "0.4rem 0.75rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-sm)", fontFamily: "monospace", fontWeight: 700, fontSize: "1rem", letterSpacing: "2px", display: "inline-block" }}>
                                                        {notif.agentCode}
                                                    </div>
                                                )}
                                                <div className={styles.notificationTime}>
                                                    {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : ""}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.emptyState}>
                                        <div className={styles.emptyIcon}>🔔</div>
                                        <h3 className={styles.emptyTitle}>No Notifications</h3>
                                        <p className={styles.emptyText}>You&apos;ll receive notifications here when there are updates about your account.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === "profile" && (
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>My Profile</h3>
                                <button className={styles.contentCardAction} onClick={() => setShowEditProfile(!showEditProfile)}>
                                    {showEditProfile ? "Cancel" : "Edit Profile"}
                                </button>
                            </div>
                            <div className={styles.contentCardBody}>
                                {showEditProfile ? (
                                    <div className={styles.formGrid}>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Full Name</label>
                                            <input className={styles.formInput} value={editProfile.displayName}
                                                onChange={(e) => setEditProfile({ ...editProfile, displayName: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Phone</label>
                                            <input className={styles.formInput} value={editProfile.phone}
                                                onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Agency</label>
                                            <input className={styles.formInput} value={editProfile.agency}
                                                onChange={(e) => setEditProfile({ ...editProfile, agency: e.target.value })} />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label className={styles.formLabel}>Location</label>
                                            <input className={styles.formInput} value={editProfile.location}
                                                onChange={(e) => setEditProfile({ ...editProfile, location: e.target.value })} />
                                        </div>
                                        <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                            <label className={styles.formLabel}>Bio</label>
                                            <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={editProfile.bio}
                                                onChange={(e) => setEditProfile({ ...editProfile, bio: e.target.value })}
                                                placeholder="Tell buyers about yourself..." />
                                        </div>
                                        <div className={styles.formActions}>
                                            <button className={styles.formBtnSecondary} onClick={() => setShowEditProfile(false)}>Cancel</button>
                                            <button className={styles.formBtnPrimary} onClick={handleSaveProfile} disabled={isSubmitting}>
                                                {isSubmitting ? "Saving..." : "Save Changes"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Name</strong>{userProfile?.displayName}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Email</strong>{userProfile?.email}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Phone</strong>{userProfile?.phone || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Agency</strong>{userProfile?.agency || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Location</strong>{userProfile?.location || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Specialization</strong>{userProfile?.specialization || "Not set"}</div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>Status</strong>
                                            <span className={`${styles.statusBadge} ${styles.statusApproved}`}>
                                                Verified
                                            </span>
                                        </div>
                                        <div><strong style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", display: "block" }}>License</strong>{userProfile?.license || "Not set"}</div>
                                    </div>
                                )}

                                <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid var(--border-light)" }}>
                                    <h4 style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--error)", marginBottom: "0.5rem" }}>Danger Zone</h4>
                                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.75rem" }}>
                                        Once you delete your account, there is no going back. Please be certain.
                                    </p>
                                    <button
                                        className={styles.formBtnSecondary}
                                        style={{ borderColor: "var(--error)", color: "var(--error)" }}
                                        onClick={handleDeleteAccount}
                                    >
                                        Delete My Account
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Add Property Modal */}
                {showAddModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
                        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h3 className={styles.modalTitle}>Add New Property</h3>
                                <button className={styles.modalClose} onClick={() => setShowAddModal(false)}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </button>
                            </div>
                            <div className={styles.modalBody}>
                                <form onSubmit={handleAddProperty} className={styles.formGrid}>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Property Title *</label>
                                        <input className={styles.formInput} value={newProperty.title}
                                            onChange={(e) => setNewProperty({ ...newProperty, title: e.target.value })}
                                            placeholder="e.g., Modern 3-Bedroom Apartment" required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Property Type</label>
                                        <select className={`${styles.formInput} ${styles.formSelect}`} value={newProperty.type}
                                            onChange={(e) => setNewProperty({ ...newProperty, type: e.target.value as FirestoreProperty["type"] })}>
                                            <option value="apartment">Apartment</option>
                                            <option value="house">House</option>
                                            <option value="villa">Villa</option>
                                            <option value="townhouse">Townhouse</option>
                                            <option value="land">Land</option>
                                            <option value="commercial">Commercial</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Listing Type</label>
                                        <select className={`${styles.formInput} ${styles.formSelect}`} value={newProperty.listingType}
                                            onChange={(e) => setNewProperty({ ...newProperty, listingType: e.target.value as "sale" | "rent" })}>
                                            <option value="sale">For Sale</option>
                                            <option value="rent">For Rent</option>
                                        </select>
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Price (KES) *</label>
                                        <input type="number" className={styles.formInput} value={newProperty.price || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, price: Number(e.target.value) })}
                                            placeholder="25000000" required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Bedrooms</label>
                                        <input type="number" className={styles.formInput} value={newProperty.bedrooms || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, bedrooms: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Bathrooms</label>
                                        <input type="number" className={styles.formInput} value={newProperty.bathrooms || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, bathrooms: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Area (sqft)</label>
                                        <input type="number" className={styles.formInput} value={newProperty.area || ""}
                                            onChange={(e) => setNewProperty({ ...newProperty, area: Number(e.target.value) })} />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>City *</label>
                                        <input className={styles.formInput} value={newProperty.city}
                                            onChange={(e) => setNewProperty({ ...newProperty, city: e.target.value })}
                                            placeholder="Nairobi" required />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label className={styles.formLabel}>Neighborhood</label>
                                        <input className={styles.formInput} value={newProperty.neighborhood}
                                            onChange={(e) => setNewProperty({ ...newProperty, neighborhood: e.target.value })}
                                            placeholder="Westlands" />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Address</label>
                                        <input className={styles.formInput} value={newProperty.address}
                                            onChange={(e) => setNewProperty({ ...newProperty, address: e.target.value })}
                                            placeholder="Full property address" />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Description</label>
                                        <textarea className={`${styles.formInput} ${styles.formTextarea}`} value={newProperty.description}
                                            onChange={(e) => setNewProperty({ ...newProperty, description: e.target.value })}
                                            placeholder="Describe your property..." />
                                    </div>
                                    <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                                        <label className={styles.formLabel}>Amenities (comma-separated)</label>
                                        <input className={styles.formInput} value={newProperty.amenities}
                                            onChange={(e) => setNewProperty({ ...newProperty, amenities: e.target.value })}
                                            placeholder="Swimming Pool, Gym, Parking, Security" />
                                    </div>
                                    <div className={styles.formActions}>
                                        <button type="button" className={styles.formBtnSecondary} onClick={() => setShowAddModal(false)}>Cancel</button>
                                        <button type="submit" className={styles.formBtnPrimary} disabled={isSubmitting}>
                                            {isSubmitting ? "Publishing..." : "Publish Property"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                </button>
            </div>
        </AgentGate>
    );
}
