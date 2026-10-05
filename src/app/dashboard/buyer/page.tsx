"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getInquiriesByUser, Inquiry, getPropertyById, FirestoreProperty, removeFromFavorites, getSharedCollectionsByUser, SharedCollection } from "@/lib/firestore";
import { sampleProperties, Property, formatPrice } from "@/lib/data";
import { getSavedSearches, deleteSavedSearch, toggleSavedSearchActive, describeFilters, SavedSearch } from "@/lib/savedSearches";
import LOIModal from "@/components/property/LOIModal";
import CollaborativeBoard from "@/components/collections/CollaborativeBoard";
import { LOIData } from "@/lib/loiGenerator";
import toast from "react-hot-toast";
import styles from "../dashboard.module.css";

function BuyerDashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, userProfile, loading, logout, refreshProfile } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [viewingLOI, setViewingLOI] = useState<LOIData | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [savedPropertyDetails, setSavedPropertyDetails] = useState<(Property | FirestoreProperty)[]>([]);
    const [loadingSaved, setLoadingSaved] = useState(false);
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
    const [loadingSavedSearches, setLoadingSavedSearches] = useState(false);
    const [sharedCollections, setSharedCollections] = useState<SharedCollection[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

    // Read tab from URL query params
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab === "saved" || tab === "inquiries" || tab === "overview" || tab === "searches" || tab === "offers" || tab === "collections") {
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
            loadSharedCollections();
        }
    }, [user]);

    const loadSharedCollections = async () => {
        if (!user) return;
        setLoadingCollections(true);
        try {
            const list = await getSharedCollectionsByUser(user.uid, user.email || undefined);
            setSharedCollections(list);
            if (list.length > 0 && !selectedCollectionId) {
                setSelectedCollectionId(list[0].id || null);
            }
        } catch (err) {
            console.error("Failed to load shared collections:", err);
        } finally {
            setLoadingCollections(false);
        }
    };

    // Load saved property details when the tab or savedProperties change
    useEffect(() => {
        if (activeTab === "saved" || activeTab === "overview") {
            loadSavedProperties();
        }
        if (activeTab === "searches" || activeTab === "overview") {
            loadSavedSearchesList();
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

    const handleViewOfferLOI = (inquiry: Inquiry) => {
        const details = inquiry.offerDetails;
        if (!details) {
            toast.error("Offer details not available");
            return;
        }
        const loi: LOIData = {
            loiNumber: details.loiNumber || `EV-LOI-${new Date().getFullYear()}-0000`,
            date: inquiry.createdAt ? new Date((inquiry.createdAt as any).seconds * 1000).toLocaleDateString() : new Date().toLocaleDateString(),
            propertyTitle: inquiry.propertyTitle,
            lrNumber: `LR No. 209/${Math.floor(10000 + Math.random() * 89000)}`,
            city: "Nairobi",
            neighborhood: "Kenya",
            buyerName: inquiry.senderName,
            buyerEmail: inquiry.senderEmail,
            buyerPhone: inquiry.senderPhone,
            agentName: "Listing Agent",
            agentEmail: "",
            agentPhone: "",
            offeredPrice: details.offeredPrice,
            askingPrice: details.askingPrice || details.offeredPrice,
            currency: "KES",
            downPaymentPercent: details.downPaymentPercent || 10,
            downPaymentAmount: details.downPaymentAmount || Math.round(details.offeredPrice * 0.1),
            financingType: details.financingType || "cash",
            moveInDate: details.moveInDate || "To be agreed",
            validityDays: 14,
            contingencies: details.contingencies || [],
            specialConditions: details.specialConditions,
            status: details.offerStatus || "pending",
            counterPrice: details.counterPrice,
            counterTerms: details.counterTerms,
        };
        setViewingLOI(loi);
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

    const loadSavedSearchesList = async () => {
        if (!user) return;
        setLoadingSavedSearches(true);
        try {
            const data = await getSavedSearches(user.uid);
            setSavedSearches(data);
        } catch (err) {
            console.error("Failed to load saved searches:", err);
        } finally {
            setLoadingSavedSearches(false);
        }
    };

    const handleDeleteSearch = async (searchId: string) => {
        try {
            await deleteSavedSearch(searchId);
            setSavedSearches((prev) => prev.filter((s) => s.id !== searchId));
            toast.success("Saved search deleted");
        } catch (err) {
            console.error("Failed to delete saved search:", err);
            toast.error("Failed to delete");
        }
    };

    const handleToggleSearch = async (searchId: string, isActive: boolean) => {
        try {
            await toggleSavedSearchActive(searchId, !isActive);
            setSavedSearches((prev) =>
                prev.map((s) => (s.id === searchId ? { ...s, isActive: !isActive } : s))
            );
            toast.success(isActive ? "Alerts paused" : "Alerts resumed");
        } catch (err) {
            console.error("Failed to toggle search:", err);
        }
    };

    const buildSearchUrl = (search: SavedSearch): string => {
        const params = new URLSearchParams();
        if (search.filters.propertyType) params.set("propertyType", search.filters.propertyType);
        if (search.filters.listingType) params.set("type", search.filters.listingType);
        if (search.filters.searchQuery) params.set("q", search.filters.searchQuery);
        const qs = params.toString();
        return `/properties${qs ? `?${qs}` : ""}`;
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
    const searchCount = savedSearches.length;
    const myOffers = inquiries.filter((inq) => inq.type === "offer" || !!inq.offerDetails);

    return (
        <div className={styles.dashboardPage}>
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className={`${styles.sidebarBackdrop} ${styles.sidebarBackdropVisible}`}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

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
                            className={`${styles.sidebarLink} ${activeTab === "offers" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("offers"); setSidebarOpen(false); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                            My Offers & LOI
                            {myOffers.length > 0 && <span className={styles.sidebarBadge} style={{ background: "var(--gold-500)", color: "#000" }}>{myOffers.length}</span>}
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
                        <button
                            className={`${styles.sidebarLink} ${activeTab === "collections" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("collections"); setSidebarOpen(false); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                            Shared Collections
                            {sharedCollections.length > 0 && <span className={styles.sidebarBadge} style={{ background: "var(--navy-800, #0f1629)", color: "#fff" }}>{sharedCollections.length}</span>}
                        </button>
                        <button
                            className={`${styles.sidebarLink} ${activeTab === "searches" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("searches"); setSidebarOpen(false); }}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                            Saved Searches
                            {savedSearches.length > 0 && <span className={styles.sidebarBadge}>{savedSearches.length}</span>}
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
                            <div className={styles.statCard} onClick={() => setActiveTab("offers")} style={{ cursor: "pointer" }}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{myOffers.length}</div>
                                <div className={styles.statLabel}>Active Offers & LOIs</div>
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
                            <div className={styles.statCard} onClick={() => setActiveTab("collections")} style={{ cursor: "pointer" }}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconGold}`} style={{ background: "rgba(15, 22, 41, 0.08)", color: "var(--navy-800, #0f1629)" }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{sharedCollections.length}</div>
                                <div className={styles.statLabel}>Co-Buying Boards</div>
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

                {activeTab === "offers" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <div>
                                <h3 className={styles.contentCardTitle}>My Purchase Offers & Letters of Intent</h3>
                                <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                    Track your submitted formal conveyancing offers, counter-offer proposals, and download official LOIs.
                                </p>
                            </div>
                            <Link href="/properties?type=sale" style={{ textDecoration: "none", fontSize: "0.8rem", padding: "0.45rem 0.85rem", background: "var(--navy-800)", color: "#fff", borderRadius: "6px", fontWeight: 600 }}>
                                + Browse Listings
                            </Link>
                        </div>
                        {myOffers.length > 0 ? (
                            <div style={{ overflowX: "auto" }}>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Property</th>
                                            <th>Offered Amount</th>
                                            <th>Financing / Deposit</th>
                                            <th>Move-In / Completion</th>
                                            <th>Status & Response</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {myOffers.map((inq) => {
                                            const details = inq.offerDetails;
                                            const status = details?.offerStatus || "pending";
                                            return (
                                                <tr key={inq.id as string}>
                                                    <td>
                                                        <Link
                                                            href={`/properties/${inq.propertyId}`}
                                                            style={{ fontWeight: 600, color: "var(--text-heading)", textDecoration: "none" }}
                                                        >
                                                            {inq.propertyTitle}
                                                        </Link>
                                                        {details?.loiNumber && (
                                                            <div style={{ fontSize: "0.7rem", fontFamily: "monospace", color: "var(--text-tertiary)", marginTop: "2px" }}>
                                                                {details.loiNumber}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
                                                            KES {(details?.offeredPrice || 0).toLocaleString()}
                                                        </div>
                                                        {details?.askingPrice && details.askingPrice > 0 && (
                                                            <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                                                                Asking: KES {details.askingPrice.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            fontSize: "0.72rem",
                                                            padding: "0.2rem 0.5rem",
                                                            borderRadius: "4px",
                                                            background: details?.financingType === "cash" ? "rgba(16,185,129,0.12)" : "rgba(59,130,246,0.12)",
                                                            color: details?.financingType === "cash" ? "#059669" : "#2563eb",
                                                            fontWeight: 600,
                                                            textTransform: "capitalize",
                                                            display: "inline-block",
                                                            marginBottom: "3px"
                                                        }}>
                                                            {details?.financingType || "Cash"}
                                                        </span>
                                                        <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                                                            Deposit: {details?.downPaymentPercent || 10}% (KES {(details?.downPaymentAmount || 0).toLocaleString()})
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                                                            {details?.moveInDate || "30-60 days conveyancing"}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`${styles.statusBadge} ${
                                                            status === "accepted" ? styles.statusApproved :
                                                            status === "countered" ? styles.statusPending :
                                                            status === "rejected" ? styles.statusRejected :
                                                            styles.statusActive
                                                        }`}>
                                                            {status === "accepted" ? "✅ Accepted" :
                                                             status === "countered" ? "⚖️ Counter-Offer Received" :
                                                             status === "rejected" ? "❌ Declined" : "⏳ Under Review"}
                                                        </span>
                                                        {status === "countered" && details?.counterPrice && (
                                                            <div style={{
                                                                marginTop: "0.4rem",
                                                                padding: "0.4rem 0.6rem",
                                                                background: "rgba(245, 158, 11, 0.08)",
                                                                border: "1px solid rgba(245, 158, 11, 0.25)",
                                                                borderRadius: "6px",
                                                                fontSize: "0.75rem",
                                                                color: "#d97706"
                                                            }}>
                                                                <strong>Vendor asks: KES {details.counterPrice.toLocaleString()}</strong>
                                                                {details.counterTerms && (
                                                                    <div style={{ fontSize: "0.7rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                                                                        &quot;{details.counterTerms}&quot;
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {status === "accepted" && (
                                                            <div style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 600, marginTop: "2px" }}>
                                                                🎉 Under Contract! Vendor has accepted your terms.
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <button
                                                            onClick={() => handleViewOfferLOI(inq)}
                                                            style={{
                                                                fontSize: "0.74rem",
                                                                padding: "0.3rem 0.6rem",
                                                                borderRadius: "6px",
                                                                background: "var(--navy-800)",
                                                                color: "#fff",
                                                                border: "none",
                                                                cursor: "pointer",
                                                                fontWeight: 600,
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "0.25rem"
                                                            }}
                                                        >
                                                            📜 View / Print LOI
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>💼</div>
                                <h3 className={styles.emptyTitle}>No Offers Submitted Yet</h3>
                                <p className={styles.emptyText}>
                                    Find a property you love and use the &quot;Make an Offer&quot; tool to generate a legally-aligned Kenyan Letter of Intent.
                                </p>
                                <Link href="/properties?type=sale" className={styles.emptyAction}>
                                    Explore Properties for Sale
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </Link>
                            </div>
                        )}
                    </div>
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

                {activeTab === "searches" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <h3 className={styles.contentCardTitle}>🔔 Saved Searches</h3>
                            {savedSearches.length > 0 && (
                                <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                                    {savedSearches.length} search{savedSearches.length !== 1 ? "es" : ""} saved
                                </span>
                            )}
                        </div>
                        {loadingSavedSearches ? (
                            <div style={{ textAlign: "center", padding: "3rem" }}>
                                <div className={styles.loadingSpinner} />
                                <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>Loading saved searches...</p>
                            </div>
                        ) : savedSearches.length > 0 ? (
                            <div className={styles.contentCardBody}>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                    {savedSearches.map((search) => (
                                        <div
                                            key={search.id}
                                            style={{
                                                padding: "1rem 1.25rem",
                                                background: "var(--bg-secondary, #f8f9fc)",
                                                borderRadius: "var(--radius-lg)",
                                                border: `1px solid ${search.isActive ? "rgba(212, 160, 23, 0.2)" : "var(--border-color, #e2e6ee)"}`,
                                                transition: "all 0.2s ease",
                                                opacity: search.isActive ? 1 : 0.65,
                                            }}
                                        >
                                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "1rem" }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
                                                        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading, #0f1629)" }}>
                                                            {search.name}
                                                        </span>
                                                        {search.isActive ? (
                                                            <span style={{
                                                                fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                                                                borderRadius: "50px", background: "rgba(16,185,129,0.1)", color: "var(--success, #10b981)",
                                                            }}>ACTIVE</span>
                                                        ) : (
                                                            <span style={{
                                                                fontSize: "0.65rem", fontWeight: 700, padding: "0.15rem 0.5rem",
                                                                borderRadius: "50px", background: "rgba(107,114,128,0.1)", color: "var(--text-tertiary)",
                                                            }}>PAUSED</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary, #6b7280)", lineHeight: 1.4, marginBottom: "0.5rem" }}>
                                                        {describeFilters(search.filters)}
                                                    </div>
                                                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #9ca3af)" }}>
                                                        Saved {search.createdAt ? new Date(search.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                                                    </div>
                                                </div>
                                                <div style={{ display: "flex", gap: "0.4rem", flexShrink: 0 }}>
                                                    <Link
                                                        href={buildSearchUrl(search)}
                                                        style={{
                                                            padding: "0.45rem 0.85rem", fontSize: "0.78rem", fontWeight: 600,
                                                            background: "var(--gold-500)", color: "#fff", borderRadius: "var(--radius-md)",
                                                            textDecoration: "none", whiteSpace: "nowrap",
                                                        }}
                                                    >
                                                        View
                                                    </Link>
                                                    <button
                                                        onClick={() => handleToggleSearch(search.id!, search.isActive)}
                                                        title={search.isActive ? "Pause alerts" : "Resume alerts"}
                                                        style={{
                                                            padding: "0.45rem", background: "transparent",
                                                            border: "1px solid var(--border-color, #e2e6ee)", borderRadius: "var(--radius-md)",
                                                            color: search.isActive ? "var(--warning, #f59e0b)" : "var(--success, #10b981)",
                                                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                                        }}
                                                    >
                                                        {search.isActive ? (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                                                        ) : (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteSearch(search.id!)}
                                                        title="Delete saved search"
                                                        style={{
                                                            padding: "0.45rem", background: "transparent",
                                                            border: "1px solid var(--border-color, #e2e6ee)", borderRadius: "var(--radius-md)",
                                                            color: "var(--error, #ef4444)", cursor: "pointer",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                        }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                </div>
                                <h3 className={styles.emptyTitle}>No Saved Searches</h3>
                                <p className={styles.emptyText}>
                                    Save your search filters on the Properties page to get notified about new matching listings.
                                </p>
                                <Link href="/properties" className={styles.emptyAction}>
                                    Browse Properties
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "collections" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            background: "#ffffff",
                            padding: "1.25rem 1.5rem",
                            borderRadius: "var(--radius-lg, 12px)",
                            border: "1px solid var(--border-color, #e2e8f0)",
                            flexWrap: "wrap",
                            gap: "1rem",
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "var(--text-heading, #0f1629)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    👥 Collaborative Wishlists & Co-Buying Boards
                                </h3>
                                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.85rem", color: "var(--text-secondary, #64748b)" }}>
                                    Collaborate with your partner, family, or chama investment group to upvote, downvote, and comment on properties together.
                                </p>
                            </div>

                            {/* Collection selector dropdown if multiple */}
                            {sharedCollections.length > 1 && (
                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Select Board:</span>
                                    <select
                                        value={selectedCollectionId || ""}
                                        onChange={(e) => setSelectedCollectionId(e.target.value)}
                                        style={{
                                            padding: "0.45rem 0.85rem",
                                            borderRadius: "8px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "0.85rem",
                                            fontWeight: 600,
                                            background: "#f8fafc",
                                            cursor: "pointer",
                                        }}
                                    >
                                        {sharedCollections.map((col) => (
                                            <option key={col.id} value={col.id}>
                                                {col.title} ({col.items?.length || 0} listings)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        {loadingCollections ? (
                            <div style={{ textAlign: "center", padding: "4rem" }}>
                                <div className={styles.loadingSpinner} />
                                <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                                    Loading your collaborative boards...
                                </p>
                            </div>
                        ) : sharedCollections.length > 0 ? (
                            (() => {
                                const currentCol = sharedCollections.find((c) => c.id === selectedCollectionId) || sharedCollections[0];
                                return (
                                    <CollaborativeBoard
                                        collection={currentCol}
                                        currentUserId={user.uid}
                                        currentUserName={userProfile?.displayName || user.displayName || "Buyer"}
                                        currentUserEmail={user.email || undefined}
                                        onUpdate={loadSharedCollections}
                                    />
                                );
                            })()
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon} style={{ fontSize: "2.5rem" }}>
                                    👥
                                </div>
                                <h3 className={styles.emptyTitle}>No Shared Boards Yet</h3>
                                <p className={styles.emptyText}>
                                    Invite a co-buyer or chama partner to view shortlisted houses together. To start, browse any property and click <strong>&quot;Save to Board&quot;</strong>.
                                </p>
                                <Link href="/properties" className={styles.emptyAction}>
                                    Browse Properties
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* LOI Modal */}
                {viewingLOI && (
                    <LOIModal loiData={viewingLOI} onClose={() => setViewingLOI(null)} />
                )}
            </main>

            {/* Mobile Toggle */}
            <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="Toggle sidebar">
                {sidebarOpen ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
                )}
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
