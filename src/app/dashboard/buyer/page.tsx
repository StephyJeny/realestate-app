"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getInquiriesByUser, Inquiry } from "@/lib/firestore";
import styles from "../dashboard.module.css";

export default function BuyerDashboard() {
    const router = useRouter();
    const { user, userProfile, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            loadInquiries();
        }
    }, [user]);

    const loadInquiries = async () => {
        if (!user) return;
        try {
            const data = await getInquiriesByUser(user.uid);
            setInquiries(data);
        } catch (err) {
            console.error("Failed to load inquiries:", err);
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

    const savedCount = userProfile?.savedProperties?.length || 0;

    return (
        <div className={styles.dashboardPage}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <span className={`${styles.sidebarRole} ${styles.roleBuyer}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                        Buyer
                    </span>
                    <span className={styles.sidebarUserName}>{userProfile?.displayName || "User"}</span>
                    <span className={styles.sidebarEmail}>{user.email}</span>
                </div>

                <nav className={styles.sidebarNav}>
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarSectionTitle}>Menu</div>
                        <button
                            className={`${styles.sidebarLink} ${activeTab === "overview" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Overview
                        </button>
                        <button
                            className={`${styles.sidebarLink} ${activeTab === "inquiries" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("inquiries"); setSidebarOpen(false); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            My Inquiries
                            {inquiries.length > 0 && <span className={styles.sidebarBadge}>{inquiries.length}</span>}
                        </button>
                        <button
                            className={`${styles.sidebarLink} ${activeTab === "saved" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("saved"); setSidebarOpen(false); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                            Saved Properties
                            {savedCount > 0 && <span className={styles.sidebarBadge}>{savedCount}</span>}
                        </button>
                    </div>

                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarSectionTitle}>Browse</div>
                        <Link href="/properties?type=sale" className={styles.sidebarLink}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            Buy
                        </Link>
                        <Link href="/properties?type=rent" className={styles.sidebarLink}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a4 4 0 0 0-8 0v2" /></svg>
                            Rent
                        </Link>
                        <Link href="/properties" className={styles.sidebarLink}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                            Properties
                        </Link>
                        <Link href="/agents" className={styles.sidebarLink}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            Agents
                        </Link>
                        <Link href="/about" className={styles.sidebarLink}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                            About
                        </Link>
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
                    <h1 className={styles.pageTitle}>
                        Welcome back, {userProfile?.displayName?.split(" ")[0] || "there"}! 👋
                    </h1>
                    <p className={styles.pageSubtitle}>
                        Browse properties, manage inquiries, and find your dream home.
                    </p>
                </div>

                {activeTab === "overview" && (
                    <>
                        {/* Stats */}
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{savedCount}</div>
                                <div className={styles.statLabel}>Saved Properties</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{inquiries.length}</div>
                                <div className={styles.statLabel}>Inquiries Sent</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconGold}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>2,500+</div>
                                <div className={styles.statLabel}>Available Properties</div>
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div className={styles.contentCard}>
                            <div className={styles.contentCardHeader}>
                                <h3 className={styles.contentCardTitle}>Quick Actions</h3>
                            </div>
                            <div className={styles.contentCardBody}>
                                <div className={styles.quickLinksGrid}>
                                    <Link href="/properties?type=sale" className={styles.quickLink}>
                                        <div className={`${styles.quickLinkIcon} ${styles.statIconBlue}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                                        </div>
                                        Browse Sales
                                    </Link>
                                    <Link href="/properties?type=rent" className={styles.quickLink}>
                                        <div className={`${styles.quickLinkIcon} ${styles.statIconGreen}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a4 4 0 0 0-8 0v2" /></svg>
                                        </div>
                                        Browse Rentals
                                    </Link>
                                    <Link href="/agents" className={styles.quickLink}>
                                        <div className={`${styles.quickLinkIcon} ${styles.statIconGold}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                                        </div>
                                        Find Agents
                                    </Link>
                                    <Link href="/about" className={styles.quickLink}>
                                        <div className={`${styles.quickLinkIcon} ${styles.statIconPurple}`}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                        </div>
                                        About EstateVue
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === "inquiries" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <h3 className={styles.contentCardTitle}>My Inquiries</h3>
                        </div>
                        {inquiries.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Property</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inquiries.map((inq) => (
                                        <tr key={inq.id as string}>
                                            <td>{inq.propertyTitle || "Property"}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles.statusActive}`}>
                                                    {inq.type || "inquiry"}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${styles.statusPending}`}>
                                                    {inq.status || "new"}
                                                </span>
                                            </td>
                                            <td>{inq.createdAt ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                </div>
                                <h3 className={styles.emptyTitle}>No Inquiries Yet</h3>
                                <p className={styles.emptyText}>
                                    You haven&apos;t sent any inquiries yet. Browse properties and reach out to agents!
                                </p>
                                <Link href="/properties" className={styles.emptyAction}>
                                    Browse Properties
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "saved" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <h3 className={styles.contentCardTitle}>Saved Properties</h3>
                        </div>
                        {savedCount > 0 ? (
                            <div className={styles.contentCardBody}>
                                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    You have {savedCount} saved properties. Visit the properties page to view them.
                                </p>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                </div>
                                <h3 className={styles.emptyTitle}>No Saved Properties</h3>
                                <p className={styles.emptyText}>
                                    Start saving properties you like by clicking the heart icon on any listing.
                                </p>
                                <Link href="/properties" className={styles.emptyAction}>
                                    Explore Properties
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Mobile Toggle */}
            <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
        </div>
    );
}
