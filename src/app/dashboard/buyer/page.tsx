"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getInquiriesByUser, Inquiry, getPropertyById, FirestoreProperty, removeFromFavorites } from "@/lib/firestore";
import { sampleProperties, Property, formatPrice } from "@/lib/data";
import styles from "../dashboard.module.css";

function BuyerDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile, loading, logout, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [savedPropertyDetails, setSavedPropertyDetails] = useState<(Property | FirestoreProperty)[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);

    // Read tab from URL query params
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "saved" || tab === "inquiries" || tab === "overview") {
            setActiveTab(tab);
        }
    }, [searchParams]);

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

    // Load saved property details when the tab or savedProperties change
    useEffect(() => {
        if (activeTab === "saved" || activeTab === "overview") {
            loadSavedProperties();
        }
    }, [activeTab, userProfile?.savedProperties]);

    const loadInquiries = async () => {
        if (!user) return;
        try {
            const data = await getInquiriesByUser(user.uid);
            setInquiries(data);
        } catch (err) {
            console.error("Failed to load inquiries:", err);
        }
    };

    const loadSavedProperties = async () => {
        const savedIds = userProfile?.savedProperties || [];
        if (savedIds.length === 0) {
            setSavedPropertyDetails([]);
            return;
        }

        setLoadingSaved(true);
        try {
            const details: (Property | FirestoreProperty)[] = [];

            for (const id of savedIds) {
                // First check if it's a sample property
                const sampleProp = sampleProperties.find(p => p.id === id);
                if (sampleProp) {
                    details.push(sampleProp);
                    continue;
                }

                // Otherwise fetch from Firestore
                try {
                    const firestoreProp = await getPropertyById(id);
                    if (firestoreProp) {
                        details.push(firestoreProp);
                    }
                } catch (err) {
                    console.error(`Failed to load property ${id}:`, err);
                }
            }

            setSavedPropertyDetails(details);
        } catch (err) {
            console.error("Failed to load saved properties:", err);
        } finally {
            setLoadingSaved(false);
        }
    };

    const handleRemoveSaved = async (propertyId: string) => {
        if (!user) return;
        try {
            await removeFromFavorites(user.uid, propertyId);
            await refreshProfile();
        } catch (err) {
            console.error("Failed to remove property:", err);
        }
    };

    const getPropertyPrice = (prop: Property | FirestoreProperty): string => {
        if ("location" in prop && typeof prop.location === "object" && "city" in prop.location) {
            // It's a sample Property
            return formatPrice((prop as Property).price, (prop as Property).currency);
        }
        // It's a FirestoreProperty
        const fp = prop as FirestoreProperty;
        return formatPrice(fp.price, fp.currency);
    };

    const getPropertyLocation = (prop: Property | FirestoreProperty): string => {
        if ("location" in prop && typeof prop.location === "object" && "city" in prop.location) {
            const sp = prop as Property;
            return `${sp.location.neighborhood}, ${sp.location.city}`;
        }
        const fp = prop as FirestoreProperty;
        return `${fp.neighborhood || ""}, ${fp.city || ""}`;
    };

    const getPropertyImage = (prop: Property | FirestoreProperty): string => {
        if ("images" in prop && prop.images && prop.images.length > 0) {
            return prop.images[0];
        }
        return "/images/property-1.png";
    };

    const getPropertyId = (prop: Property | FirestoreProperty): string => {
        return prop.id || "";
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
                            <div className={styles.statCard} onClick={() => setActiveTab("saved")} style={{ cursor: "pointer" }}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{savedCount}</div>
                                <div className={styles.statLabel}>Saved Properties</div>
                            </div>
                            <div className={styles.statCard} onClick={() => setActiveTab("inquiries")} style={{ cursor: "pointer" }}>
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

                        {/* Saved Properties Preview in Overview */}
                        {savedCount > 0 && (
                            <div className={styles.contentCard}>
                                <div className={styles.contentCardHeader}>
                                    <h3 className={styles.contentCardTitle}>
                                        ❤️ Recently Saved Properties
                                    </h3>
                                    <button
                                        onClick={() => setActiveTab("saved")}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "var(--gold-500)",
                                            fontWeight: 600,
                                            fontSize: "0.85rem",
                                            cursor: "pointer",
                                        }}
                                    >
                                        View All →
                                    </button>
                                </div>
                                <div className={styles.contentCardBody}>
                                    {loadingSaved ? (
                                        <div style={{ textAlign: "center", padding: "2rem" }}>
                                            <div className={styles.loadingSpinner} />
                                        </div>
                                    ) : (
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                                            {savedPropertyDetails.slice(0, 3).map((prop) => (
                                                <Link
                                                    key={getPropertyId(prop)}
                                                    href={`/properties/${getPropertyId(prop)}`}
                                                    style={{
                                                        display: "flex",
                                                        gap: "0.75rem",
                                                        padding: "0.75rem",
                                                        background: "var(--bg-secondary, #f8f9fc)",
                                                        borderRadius: "var(--radius-md)",
                                                        transition: "all 0.2s ease",
                                                        textDecoration: "none",
                                                        border: "1px solid var(--border-color, #e2e6ee)",
                                                    }}
                                                >
                                                    <div style={{
                                                        width: "70px",
                                                        height: "70px",
                                                        borderRadius: "var(--radius-sm)",
                                                        overflow: "hidden",
                                                        flexShrink: 0,
                                                        background: "#e2e6ee",
                                                    }}>
                                                        <img
                                                            src={getPropertyImage(prop)}
                                                            alt={prop.title}
                                                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                        />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{
                                                            fontSize: "0.88rem",
                                                            fontWeight: 600,
                                                            color: "var(--text-heading, #0f1629)",
                                                            whiteSpace: "nowrap",
                                                            overflow: "hidden",
                                                            textOverflow: "ellipsis",
                                                        }}>
                                                            {prop.title}
                                                        </div>
                                                        <div style={{
                                                            fontSize: "0.78rem",
                                                            color: "var(--text-secondary, #6b7280)",
                                                            marginTop: "2px",
                                                        }}>
                                                            {getPropertyLocation(prop)}
                                                        </div>
                                                        <div style={{
                                                            fontSize: "0.85rem",
                                                            fontWeight: 700,
                                                            color: "var(--gold-600, #b8860b)",
                                                            marginTop: "4px",
                                                        }}>
                                                            {getPropertyPrice(prop)}
                                                        </div>
                                                    </div>
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

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
                            {savedCount > 0 && (
                                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    {savedCount} {savedCount === 1 ? "property" : "properties"} saved
                                </span>
                            )}
                        </div>
                        {loadingSaved ? (
                            <div style={{ textAlign: "center", padding: "3rem" }}>
                                <div className={styles.loadingSpinner} />
                                <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Loading your saved properties...</p>
                            </div>
                        ) : savedCount > 0 && savedPropertyDetails.length > 0 ? (
                            <div className={styles.contentCardBody}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {savedPropertyDetails.map((prop) => (
                                        <div
                                            key={getPropertyId(prop)}
                                            style={{
                                                display: "flex",
                                                gap: "1rem",
                                                padding: "1rem",
                                                background: "var(--bg-secondary, #f8f9fc)",
                                                borderRadius: "var(--radius-lg)",
                                                border: "1px solid var(--border-color, #e2e6ee)",
                                                transition: "all 0.2s ease",
                                                alignItems: "center",
                                            }}
                                        >
                                            <Link
                                                href={`/properties/${getPropertyId(prop)}`}
                                                style={{
                                                    width: "100px",
                                                    height: "80px",
                                                    borderRadius: "var(--radius-md)",
                                                    overflow: "hidden",
                                                    flexShrink: 0,
                                                    display: "block",
                                                }}
                                            >
                                                <img
                                                    src={getPropertyImage(prop)}
                                                    alt={prop.title}
                                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                                />
                                            </Link>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <Link
                                                    href={`/properties/${getPropertyId(prop)}`}
                                                    style={{
                                                        fontSize: "0.95rem",
                                                        fontWeight: 600,
                                                        color: "var(--text-heading, #0f1629)",
                                                        textDecoration: "none",
                                                        display: "block",
                                                    }}
                                                >
                                                    {prop.title}
                                                </Link>
                                                <div style={{
                                                    fontSize: "0.82rem",
                                                    color: "var(--text-secondary, #6b7280)",
                                                    marginTop: "2px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "0.25rem",
                                                }}>
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                    {getPropertyLocation(prop)}
                                                </div>
                                                <div style={{
                                                    fontSize: "0.95rem",
                                                    fontWeight: 700,
                                                    color: "var(--gold-600, #b8860b)",
                                                    marginTop: "4px",
                                                }}>
                                                    {getPropertyPrice(prop)}
                                                </div>
                                            </div>
                                            <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                                                <Link
                                                    href={`/properties/${getPropertyId(prop)}`}
                                                    style={{
                                                        padding: "0.5rem 1rem",
                                                        background: "var(--gold-500)",
                                                        color: "#fff",
                                                        borderRadius: "var(--radius-md)",
                                                        fontSize: "0.82rem",
                                                        fontWeight: 600,
                                                        textDecoration: "none",
                                                        whiteSpace: "nowrap",
                                                    }}
                                                >
                                                    View Details
                                                </Link>
                                                <button
                                                    onClick={() => handleRemoveSaved(getPropertyId(prop))}
                                                    style={{
                                                        padding: "0.5rem",
                                                        background: "transparent",
                                                        border: "1px solid var(--border-color, #e2e6ee)",
                                                        borderRadius: "var(--radius-md)",
                                                        color: "var(--error, #ef4444)",
                                                        cursor: "pointer",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                    }}
                                                    title="Remove from saved"
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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

export default function BuyerDashboard() {
    return (
        <Suspense fallback={<div className={styles.dashboardPage}><div className={styles.loadingWrap}><div className={styles.loadingSpinner} /></div></div>}>
            <BuyerDashboardContent />
        </Suspense>
    );
}
