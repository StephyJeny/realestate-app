"use client";
import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { sampleProperties, Property } from "@/lib/data";
import { getAllProperties, FirestoreProperty } from "@/lib/firestore";
import PropertyCard from "@/components/property/PropertyCard";
import styles from "./page.module.css";

const propertyTypes = ["All", "Apartment", "House", "Villa", "Townhouse", "Land", "Commercial"];
const bedroomOptions = ["Any", "1", "2", "3", "4", "5+"];
const bathroomOptions = ["Any", "1", "2", "3", "4+"];
const statusOptions = [
    { value: "all", label: "All Listings" },
    { value: "active", label: "🟢 Active" },
    { value: "under_offer", label: "🟠 Under Offer" },
    { value: "price_reduced", label: "💰 Price Reduced" },
    { value: "sold", label: "🔴 Sold" },
    { value: "rented", label: "🟣 Rented" },
];

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

function formatSliderPrice(val: number): string {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toLocaleString();
}

function PropertiesContent() {
    const searchParams = useSearchParams();
    const [selectedType, setSelectedType] = useState("All");
    const [selectedBedrooms, setSelectedBedrooms] = useState("Any");
    const [selectedBathrooms, setSelectedBathrooms] = useState("Any");
    const [selectedListing, setSelectedListing] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedCity, setSelectedCity] = useState("All");
    const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [firestoreProperties, setFirestoreProperties] = useState<Property[]>([]);
    const [loadingFirestore, setLoadingFirestore] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Price range slider
    const PRICE_MIN = 0;
    const PRICE_MAX = 200000000;
    const PRICE_STEP = 500000;
    const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

    // Area range
    const [minArea, setMinArea] = useState("");
    const [maxArea, setMaxArea] = useState("");

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
                    .filter((p) => p.status === "active" || p.status === "under_offer" || p.status === "price_reduced" || p.status === "sold" || p.status === "rented")
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

    // Extract unique cities and neighborhoods for dropdown filters
    const { cities, neighborhoods } = useMemo(() => {
        const citySet = new Set<string>();
        const neighborhoodSet = new Set<string>();
        for (const p of allProperties) {
            if (p.location.city) citySet.add(p.location.city);
            if (p.location.neighborhood) neighborhoodSet.add(p.location.neighborhood);
        }
        return {
            cities: ["All", ...Array.from(citySet).sort()],
            neighborhoods: ["All", ...Array.from(neighborhoodSet).sort()],
        };
    }, [allProperties]);

    // Filter neighborhoods based on selected city
    const filteredNeighborhoods = useMemo(() => {
        if (selectedCity === "All") return neighborhoods;
        const neighborhoodSet = new Set<string>();
        for (const p of allProperties) {
            if (p.location.city === selectedCity && p.location.neighborhood) {
                neighborhoodSet.add(p.location.neighborhood);
            }
        }
        return ["All", ...Array.from(neighborhoodSet).sort()];
    }, [selectedCity, allProperties, neighborhoods]);

    // Reset neighborhood when city changes
    useEffect(() => {
        setSelectedNeighborhood("All");
    }, [selectedCity]);

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
        if (selectedBathrooms !== "Any") {
            const baths = parseInt(selectedBathrooms);
            result = result.filter((p) => (selectedBathrooms === "4+" ? p.bathrooms >= 4 : p.bathrooms === baths));
        }

        // City filter
        if (selectedCity !== "All") {
            result = result.filter((p) => p.location.city === selectedCity);
        }
        // Neighborhood filter
        if (selectedNeighborhood !== "All") {
            result = result.filter((p) => p.location.neighborhood === selectedNeighborhood);
        }

        // Status filter
        if (selectedStatus !== "all") {
            result = result.filter((p) => p.status === selectedStatus);
        }

        // Price range (slider)
        if (priceRange[0] > PRICE_MIN) {
            result = result.filter((p) => p.price >= priceRange[0]);
        }
        if (priceRange[1] < PRICE_MAX) {
            result = result.filter((p) => p.price <= priceRange[1]);
        }

        // Area range
        if (minArea) {
            const min = parseInt(minArea);
            if (!isNaN(min)) result = result.filter((p) => p.area >= min);
        }
        if (maxArea) {
            const max = parseInt(maxArea);
            if (!isNaN(max)) result = result.filter((p) => p.area <= max);
        }

        switch (sortBy) {
            case "price-low": result.sort((a, b) => a.price - b.price); break;
            case "price-high": result.sort((a, b) => b.price - a.price); break;
            case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
            case "popular": result.sort((a, b) => b.views - a.views); break;
        }

        return result;
    }, [allProperties, selectedType, selectedBedrooms, selectedBathrooms, selectedListing, selectedStatus, selectedCity, selectedNeighborhood, sortBy, priceRange, minArea, maxArea, searchQuery]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedType !== "All") count++;
        if (selectedBedrooms !== "Any") count++;
        if (selectedBathrooms !== "Any") count++;
        if (selectedListing !== "all") count++;
        if (selectedStatus !== "all") count++;
        if (selectedCity !== "All") count++;
        if (selectedNeighborhood !== "All") count++;
        if (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) count++;
        if (minArea || maxArea) count++;
        if (searchQuery.trim()) count++;
        return count;
    }, [selectedType, selectedBedrooms, selectedBathrooms, selectedListing, selectedStatus, selectedCity, selectedNeighborhood, priceRange, minArea, maxArea, searchQuery]);

    const resetAll = useCallback(() => {
        setSelectedType("All");
        setSelectedBedrooms("Any");
        setSelectedBathrooms("Any");
        setSelectedListing("all");
        setSelectedStatus("all");
        setSelectedCity("All");
        setSelectedNeighborhood("All");
        setPriceRange([PRICE_MIN, PRICE_MAX]);
        setMinArea("");
        setMaxArea("");
        setSearchQuery("");
    }, []);

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
                {/* Mobile Filter Toggle */}
                <button
                    className={styles.mobileFilterBtn}
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                        <circle cx="8" cy="6" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="10" cy="18" r="2" fill="currentColor" />
                    </svg>
                    Filters {activeFilterCount > 0 && <span className={styles.filterBadge}>{activeFilterCount}</span>}
                </button>

                {/* Sidebar Filters */}
                <aside className={`${styles.sidebar} ${showMobileFilters ? styles.sidebarOpen : ""}`}>
                    <div className={styles.sidebarHeader}>
                        <h3 className={styles.sidebarTitle}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="18" x2="20" y2="18" />
                            </svg>
                            Filters
                            {activeFilterCount > 0 && (
                                <span className={styles.filterCountBadge}>{activeFilterCount}</span>
                            )}
                        </h3>
                        <button className={styles.mobileClose} onClick={() => setShowMobileFilters(false)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    {/* Listing Type */}
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

                    {/* Property Type */}
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

                    {/* Price Range Slider */}
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Price Range</h3>
                        <div className={styles.priceSliderLabels}>
                            <span>KES {formatSliderPrice(priceRange[0])}</span>
                            <span>KES {formatSliderPrice(priceRange[1])}{priceRange[1] >= PRICE_MAX ? "+" : ""}</span>
                        </div>
                        <div className={styles.dualSlider}>
                            <div className={styles.sliderTrack}>
                                <div
                                    className={styles.sliderFill}
                                    style={{
                                        left: `${(priceRange[0] / PRICE_MAX) * 100}%`,
                                        right: `${100 - (priceRange[1] / PRICE_MAX) * 100}%`,
                                    }}
                                />
                            </div>
                            <input
                                type="range"
                                min={PRICE_MIN}
                                max={PRICE_MAX}
                                step={PRICE_STEP}
                                value={priceRange[0]}
                                onChange={(e) => {
                                    const val = Math.min(Number(e.target.value), priceRange[1] - PRICE_STEP);
                                    setPriceRange([val, priceRange[1]]);
                                }}
                                className={styles.sliderInput}
                            />
                            <input
                                type="range"
                                min={PRICE_MIN}
                                max={PRICE_MAX}
                                step={PRICE_STEP}
                                value={priceRange[1]}
                                onChange={(e) => {
                                    const val = Math.max(Number(e.target.value), priceRange[0] + PRICE_STEP);
                                    setPriceRange([priceRange[0], val]);
                                }}
                                className={styles.sliderInput}
                            />
                        </div>
                        {/* Quick price presets */}
                        <div className={styles.pricePresets}>
                            <button onClick={() => setPriceRange([0, 10000000])} className={priceRange[1] === 10000000 ? styles.presetActive : ""}>Under 10M</button>
                            <button onClick={() => setPriceRange([10000000, 50000000])} className={priceRange[0] === 10000000 && priceRange[1] === 50000000 ? styles.presetActive : ""}>10M - 50M</button>
                            <button onClick={() => setPriceRange([50000000, PRICE_MAX])} className={priceRange[0] === 50000000 ? styles.presetActive : ""}>50M+</button>
                        </div>
                    </div>

                    {/* Bedrooms */}
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

                    {/* Bathrooms */}
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Bathrooms</h3>
                        <div className={styles.bedroomGrid}>
                            {bathroomOptions.map((opt) => (
                                <button
                                    key={`bath-${opt}`}
                                    className={`${styles.bedroomBtn} ${selectedBathrooms === opt ? styles.bedroomActive : ""}`}
                                    onClick={() => setSelectedBathrooms(opt)}
                                >
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* City */}
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>City</h3>
                        <select
                            className={styles.filterSelect}
                            value={selectedCity}
                            onChange={(e) => setSelectedCity(e.target.value)}
                        >
                            {cities.map((c) => (
                                <option key={c} value={c}>{c === "All" ? "All Cities" : c}</option>
                            ))}
                        </select>
                    </div>

                    {/* Neighborhood */}
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Neighborhood</h3>
                        <select
                            className={styles.filterSelect}
                            value={selectedNeighborhood}
                            onChange={(e) => setSelectedNeighborhood(e.target.value)}
                        >
                            {filteredNeighborhoods.map((n) => (
                                <option key={n} value={n}>{n === "All" ? "All Neighborhoods" : n}</option>
                            ))}
                        </select>
                    </div>

                    {/* Area Range */}
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Area (sqft)</h3>
                        <div className={styles.priceInputs}>
                            <input
                                type="number"
                                placeholder="Min"
                                className={styles.priceInput}
                                value={minArea}
                                onChange={(e) => setMinArea(e.target.value)}
                            />
                            <span className={styles.priceSep}>—</span>
                            <input
                                type="number"
                                placeholder="Max"
                                className={styles.priceInput}
                                value={maxArea}
                                onChange={(e) => setMaxArea(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className={styles.filterSection}>
                        <h3 className={styles.filterTitle}>Status</h3>
                        <select
                            className={styles.filterSelect}
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                        >
                            {statusOptions.map((s) => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className={styles.resetBtn}
                        onClick={resetAll}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
                        </svg>
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
                            {activeFilterCount > 0 && (
                                <button
                                    onClick={resetAll}
                                    style={{
                                        marginLeft: "0.75rem",
                                        fontSize: "0.75rem",
                                        padding: "0.2rem 0.6rem",
                                        borderRadius: "var(--radius-full)",
                                        background: "rgba(239,68,68,0.08)",
                                        color: "var(--error)",
                                        border: "1px solid rgba(239,68,68,0.15)",
                                        cursor: "pointer",
                                        fontWeight: 600,
                                    }}
                                >
                                    Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
                                </button>
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
                            {activeFilterCount > 0 && (
                                <button onClick={resetAll} className={styles.emptyResetBtn}>
                                    Reset All Filters
                                </button>
                            )}
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
