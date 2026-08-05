"use client";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { sampleProperties, Property } from "@/lib/data";
import { getAllProperties, FirestoreProperty } from "@/lib/firestore";
import PropertyCard from "@/components/property/PropertyCard";
import styles from "./page.module.css";

const propertyTypes = ["All", "Apartment", "House", "Villa", "Townhouse", "Land", "Commercial"];
const bedroomOptions = ["Any", "1", "2", "3", "4", "5+"];

function firestoreToProperty(fp: FirestoreProperty): Property {
    return {
        id: fp.id || "",
        title: fp.title,
        slug: fp.title.toLowerCase().replace(/\s+/g, "-"),
        description: fp.description,
        type: fp.type,
        listingType: fp.listingType,
        price: fp.price,
        currency: fp.currency || "KES",
        bedrooms: fp.bedrooms,
        bathrooms: fp.bathrooms,
        area: fp.area,
        yearBuilt: fp.yearBuilt || 2024,
        address: fp.address || "",
        location: {
            city: fp.city || "",
            neighborhood: fp.neighborhood || "",
        },
        amenities: fp.amenities || [],
        images: fp.images?.length ? fp.images : ["/images/property-1.png"],
        agentName: fp.agentName || "Agent",
        agentImage: "/images/agent-avatar.png",
        agentPhone: fp.agentPhone || "",
        agentEmail: fp.agentEmail || "",
        status: fp.status,
        isFeatured: fp.isFeatured,
        views: fp.views || 0,
        favorites: fp.favorites || 0,
        createdAt: fp.createdAt
            ? new Date(fp.createdAt.seconds * 1000).toISOString()
            : new Date().toISOString(),
    };
}

function PropertiesContent() {
    const searchParams = useSearchParams();
    const [selectedType, setSelectedType] = useState("All");
    const [selectedBedrooms, setSelectedBedrooms] = useState("Any");
    const [selectedListing, setSelectedListing] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [firestoreProperties, setFirestoreProperties] = useState<Property[]>([]);
    const [loadingFirestore, setLoadingFirestore] = useState(true);

    // Read filters from URL params
    useEffect(() => {
        const type = searchParams.get("type");
        if (type === "sale" || type === "rent") {
            setSelectedListing(type);
        }
        const propertyType = searchParams.get("propertyType");
        if (propertyType) {
            const matched = propertyTypes.find(
                (t) => t.toLowerCase() === propertyType.toLowerCase()
            );
            if (matched) setSelectedType(matched);
        }
        const q = searchParams.get("q");
        if (q) setSearchQuery(q);
    }, [searchParams]);

    // Fetch Firestore properties
    useEffect(() => {
        const fetchProperties = async () => {
            try {
                const data = await getAllProperties();
                const converted = data
                    .filter((p) => p.status === "active")
                    .map(firestoreToProperty);
                setFirestoreProperties(converted);
            } catch (err) {
                console.error("Failed to fetch Firestore properties:", err);
            } finally {
                setLoadingFirestore(false);
            }
        };
        fetchProperties();
    }, []);

    // Merge sample + Firestore, deduplicating by ID
    const allProperties = useMemo(() => {
        const seenIds = new Set<string>();
        const merged: Property[] = [];

        // Firestore properties first (they're real)
        for (const p of firestoreProperties) {
            if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                merged.push(p);
            }
        }
        // Then sample data
        for (const p of sampleProperties) {
            if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                merged.push(p);
            }
        }
        return merged;
    }, [firestoreProperties]);

    const filtered = useMemo(() => {
        let result = [...allProperties];

        // Search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (p) =>
                    p.title.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.location.city.toLowerCase().includes(q) ||
                    p.location.neighborhood.toLowerCase().includes(q) ||
                    p.address.toLowerCase().includes(q) ||
                    p.type.toLowerCase().includes(q)
            );
        }

        if (selectedType !== "All") {
            result = result.filter((p) => p.type.toLowerCase() === selectedType.toLowerCase());
        }
        if (selectedListing !== "all") {
            result = result.filter((p) => p.listingType === selectedListing);
        }
        if (selectedBedrooms !== "Any") {
            const beds = parseInt(selectedBedrooms);
            result = result.filter((p) => (selectedBedrooms === "5+" ? p.bedrooms >= 5 : p.bedrooms === beds));
        }

        // Price range
        if (minPrice) {
            const min = parseInt(minPrice.replace(/\D/g, ""));
            if (!isNaN(min)) result = result.filter((p) => p.price >= min);
        }
        if (maxPrice) {
            const max = parseInt(maxPrice.replace(/\D/g, ""));
            if (!isNaN(max)) result = result.filter((p) => p.price <= max);
        }

        switch (sortBy) {
            case "price-low": result.sort((a, b) => a.price - b.price); break;
            case "price-high": result.sort((a, b) => b.price - a.price); break;
            case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
            case "popular": result.sort((a, b) => b.views - a.views); break;
        }

        return result;
    }, [allProperties, selectedType, selectedBedrooms, selectedListing, sortBy, minPrice, maxPrice, searchQuery]);

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className="container">
                    <h1 className={styles.pageTitle}>Explore Properties</h1>
                    <p className={styles.pageSubtitle}>
                        Discover your perfect property from our curated collection of premium listings
                    </p>
                    {/* Search Bar */}
                    <div className={styles.searchBar}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by location, name, or type..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={styles.searchInput}
                        />
                        {searchQuery && (
                            <button className={styles.searchClear} onClick={() => setSearchQuery("")}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className={`container ${styles.layout}`}>
                {/* Sidebar Filters */}
                <aside className={styles.sidebar}>
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Listing Type</h3>
                        <div className={styles.listingToggle}>
                            {[
                                { value: "all", label: "All" },
                                { value: "sale", label: "For Sale" },
                                { value: "rent", label: "For Rent" },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    className={`${styles.toggleBtn} ${selectedListing === opt.value ? styles.toggleActive : ""}`}
                                    onClick={() => setSelectedListing(opt.value)}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Property Type</h3>
                        <div className={styles.typeList}>
                            {propertyTypes.map((type) => (
                                <button
                                    key={type}
                                    className={`${styles.typeBtn} ${selectedType === type ? styles.typeActive : ""}`}
                                    onClick={() => setSelectedType(type)}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Bedrooms</h3>
                        <div className={styles.bedroomGrid}>
                            {bedroomOptions.map((opt) => (
                                <button
                                    key={opt}
                                    className={`${styles.bedroomBtn} ${selectedBedrooms === opt ? styles.bedroomActive : ""}`}
                                    onClick={() => setSelectedBedrooms(opt)}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Price Range</h3>
                        <div className={styles.priceInputs}>
                            <input
                                type="text"
                                placeholder="Min (KES)"
                                className={styles.priceInput}
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                            />
                            <span className={styles.priceSep}>—</span>
                            <input
                                type="text"
                                placeholder="Max (KES)"
                                className={styles.priceInput}
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        className={styles.resetBtn}
                        onClick={() => {
                            setSelectedType("All");
                            setSelectedBedrooms("Any");
                            setSelectedListing("all");
                            setMinPrice("");
                            setMaxPrice("");
                            setSearchQuery("");
                        }}
                    >
                        Reset All Filters
                    </button>
                </aside>

                {/* Main Content */}
                <div className={styles.main}>
                    <div className={styles.toolbar}>
                        <span className={styles.resultCount}>
                            <strong>{filtered.length}</strong> Properties Found
                            {loadingFirestore && (
                                <span style={{ fontSize: "0.8rem", color: "var(--text-tertiary)", marginLeft: "0.5rem" }}>
                                    (loading more...)
                                </span>
                            )}
                        </span>

                        <div className={styles.toolbarRight}>
                            <select
                                className={styles.sortSelect}
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="newest">Newest First</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                                <option value="popular">Most Popular</option>
                            </select>

                            <div className={styles.viewToggle}>
                                <button
                                    className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewActive : ""}`}
                                    onClick={() => setViewMode("grid")}
                                    aria-label="Grid view"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                                </button>
                                <button
                                    className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewActive : ""}`}
                                    onClick={() => setViewMode("list")}
                                    aria-label="List view"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {filtered.length > 0 ? (
                        <div className={`${styles.propertyGrid} ${viewMode === "list" ? styles.listView : ""}`}>
                            {filtered.map((property) => (
                                <PropertyCard key={property.id} property={property} />
                            ))}
                        </div>
                    ) : (
                        <div className={styles.emptyState}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            <h3>No properties found</h3>
                            <p>Try adjusting your filters to see more results</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function PropertiesPage() {
    return (
        <Suspense fallback={
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "var(--navbar-height)" }}>
                <div style={{ width: 40, height: 40, border: "3px solid var(--border-color)", borderTopColor: "var(--navy-800)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
            </div>
        }>
            <PropertiesContent />
        </Suspense>
    );
}
