"use client";
import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { sampleProperties, Property } from "@/lib/data";
import { getAllProperties, getPropertiesByAgent, getUserProfile, FirestoreProperty } from "@/lib/firestore";
import { useAuth } from "@/context/AuthContext";
import { createSavedSearch, SavedSearchFilters } from "@/lib/savedSearches";
import PropertyCard from "@/components/property/PropertyCard";
import CatalogMap, { MapBounds, getDeterministicCoords, isPointInPolygon } from "@/components/property/CatalogMap";
import PropertySkeleton from "@/components/ui/PropertySkeleton";
import SmartSearchBar from "@/components/property/SmartSearchBar";
import { filterPropertiesWithSmartQuery, ParsedSmartQuery } from "@/lib/smartSearch";
import toast from "react-hot-toast";
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
    const { user } = useAuth();
    const [selectedType, setSelectedType] = useState("All");
    const [selectedBedrooms, setSelectedBedrooms] = useState("Any");
    const [selectedBathrooms, setSelectedBathrooms] = useState("Any");
    const [selectedListing, setSelectedListing] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [selectedCity, setSelectedCity] = useState("All");
    const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list" | "map" | "split">("split");
    const [hoveredPropId, setHoveredPropId] = useState<string | null>(null);
    const [selectedPropId, setSelectedPropId] = useState<string | null>(null);
    const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
    const [mapPolygon, setMapPolygon] = useState<[number, number][] | null>(null);
    const [mobileSplitTab, setMobileSplitTab] = useState<"cards" | "map">("cards");
    const [searchQuery, setSearchQuery] = useState("");
    const [smartQuery, setSmartQuery] = useState("");
    const [smartParsed, setSmartParsed] = useState<ParsedSmartQuery | null>(null);
    const [searchMode, setSearchMode] = useState<"smart" | "standard">("smart");
    const [firestoreProperties, setFirestoreProperties] = useState<Property[]>([]);
    const [loadingFirestore, setLoadingFirestore] = useState(true);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveSearchName, setSaveSearchName] = useState("");
    const [savingSearch, setSavingSearch] = useState(false);

    // Hydration guard — prevents SSR/client mismatch for URL-driven state
    const [hasMounted, setHasMounted] = useState(false);
    useEffect(() => { setHasMounted(true); }, []);

    // Agent filter
    const router = useRouter();
    const [filterAgentId, setFilterAgentId] = useState<string | null>(null);
    const [filterAgentName, setFilterAgentName] = useState<string>("");

    // Price range slider
    const PRICE_MIN = 0;
    const PRICE_MAX = 200000000;
    const PRICE_STEP = 500000;
    const [priceRange, setPriceRange] = useState<[number, number]>([PRICE_MIN, PRICE_MAX]);

    // Area range
    const [minArea, setMinArea] = useState("");
    const [maxArea, setMaxArea] = useState("");

    // Read filters from URL params (only after mount to prevent hydration mismatch)
    useEffect(() => {
        if (!hasMounted) return;
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

        const smartParam = searchParams.get("smart");
        if (smartParam) {
            setSmartQuery(smartParam);
            setSearchMode("smart");
        }

        const cityParam = searchParams.get("city");
        if (cityParam) {
            setSelectedCity(cityParam);
        }
        const neighborhoodParam = searchParams.get("neighborhood");
        if (neighborhoodParam) {
            setSelectedNeighborhood(neighborhoodParam);
        }
        const minPriceParam = searchParams.get("minPrice");
        const maxPriceParam = searchParams.get("maxPrice");
        if (minPriceParam || maxPriceParam) {
            const minP = minPriceParam ? Math.max(PRICE_MIN, Number(minPriceParam)) : PRICE_MIN;
            const maxP = maxPriceParam ? Math.min(PRICE_MAX, Number(maxPriceParam)) : PRICE_MAX;
            setPriceRange([minP, maxP]);
        }
        const bedroomsParam = searchParams.get("bedrooms");
        if (bedroomsParam && bedroomOptions.includes(bedroomsParam)) {
            setSelectedBedrooms(bedroomsParam);
        }
        const bathroomsParam = searchParams.get("bathrooms");
        if (bathroomsParam && bathroomOptions.includes(bathroomsParam)) {
            setSelectedBathrooms(bathroomsParam);
        }
        const statusParam = searchParams.get("status");
        if (statusParam && statusOptions.some(s => s.value === statusParam)) {
            setSelectedStatus(statusParam);
        }

        // Agent filter
        const agentId = searchParams.get("agentId");
        if (agentId) {
            setFilterAgentId(agentId);
        } else {
            setFilterAgentId(null);
            setFilterAgentName("");
        }
    }, [searchParams, hasMounted]);

    // Fetch agent display name whenever filterAgentId changes
    useEffect(() => {
        if (filterAgentId) {
            getUserProfile(filterAgentId).then((profile) => {
                if (profile) setFilterAgentName(profile.displayName || "Agent");
                else setFilterAgentName("Agent");
            }).catch(() => {
                setFilterAgentName("Agent");
            });
        }
    }, [filterAgentId]);

    // Fetch Firestore properties (filtered by agent if agentId is set)
    useEffect(() => {
        const fetchProperties = async () => {
            setLoadingFirestore(true);
            try {
                let data: FirestoreProperty[];
                if (filterAgentId) {
                    data = await getPropertiesByAgent(filterAgentId);
                } else {
                    data = await getAllProperties();
                }
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
    }, [filterAgentId]);

    // Merge sample + Firestore, deduplicating by ID
    // When filtering by agent, only show their properties (no sample data)
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
        // Only add sample data if NOT filtering by agent
        if (!filterAgentId) {
            for (const p of sampleProperties) {
                if (!seenIds.has(p.id)) {
                    seenIds.add(p.id);
                    merged.push(p);
                }
            }
        }
        return merged;
    }, [firestoreProperties, filterAgentId]);

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

    const baseFiltered = useMemo(() => {
        let result = [...allProperties];

        // Natural language AI smart search query filter
        if (searchMode === "smart" && smartParsed && (smartParsed.chips.length > 0 || smartParsed.rawQuery)) {
            result = filterPropertiesWithSmartQuery(result, smartParsed);
        }

        // Standard Search query
        if (searchMode === "standard" && searchQuery.trim()) {
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
    }, [allProperties, selectedType, selectedBedrooms, selectedBathrooms, selectedListing, selectedStatus, selectedCity, selectedNeighborhood, sortBy, priceRange, minArea, maxArea, searchQuery, searchMode, smartParsed]);

    // Spatially filtered properties (takes Polygon boundary or Map Viewport into account)
    const filtered = useMemo(() => {
        let result = [...baseFiltered];

        // 1. Custom drawn polygon has highest priority
        if (mapPolygon && mapPolygon.length > 2) {
            result = result.filter((p) => {
                const coords = getDeterministicCoords(p);
                return isPointInPolygon(coords, mapPolygon);
            });
        } else if ((viewMode === "split" || viewMode === "map") && mapBounds) {
            // 2. Viewport boundary filter when panning / zooming map
            result = result.filter((p) => {
                const [lat, lng] = getDeterministicCoords(p);
                return (
                    lat >= mapBounds.minLat &&
                    lat <= mapBounds.maxLat &&
                    lng >= mapBounds.minLng &&
                    lng <= mapBounds.maxLng
                );
            });
        }

        return result;
    }, [baseFiltered, mapPolygon, mapBounds, viewMode]);

    // Count active filters
    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (searchMode === "smart" && smartParsed?.chips?.length) count += smartParsed.chips.length;
        if (selectedType !== "All") count++;
        if (selectedBedrooms !== "Any") count++;
        if (selectedBathrooms !== "Any") count++;
        if (selectedListing !== "all") count++;
        if (selectedStatus !== "all") count++;
        if (selectedCity !== "All") count++;
        if (selectedNeighborhood !== "All") count++;
        if (priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) count++;
        if (minArea || maxArea) count++;
        if (searchMode === "standard" && searchQuery.trim()) count++;
        if (mapPolygon) count++;
        if (mapBounds && (viewMode === "split" || viewMode === "map")) count++;
        return count;
    }, [selectedType, selectedBedrooms, selectedBathrooms, selectedListing, selectedStatus, selectedCity, selectedNeighborhood, priceRange, minArea, maxArea, searchQuery, searchMode, smartParsed, mapPolygon, mapBounds, viewMode]);

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
        setSmartQuery("");
        setSmartParsed(null);
        setMapPolygon(null);
        setMapBounds(null);
    }, []);

    const handleMapSelectProperty = useCallback((id: string) => {
        setSelectedPropId(id);
        const el = document.getElementById(`property-card-${id}`);
        if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, []);

    // Current filters object for saving
    const currentFilters: SavedSearchFilters = useMemo(() => ({
        searchQuery: searchQuery.trim() || undefined,
        propertyType: selectedType !== "All" ? selectedType : undefined,
        listingType: selectedListing !== "all" ? selectedListing : undefined,
        bedrooms: selectedBedrooms !== "Any" ? selectedBedrooms : undefined,
        bathrooms: selectedBathrooms !== "Any" ? selectedBathrooms : undefined,
        city: selectedCity !== "All" ? selectedCity : undefined,
        neighborhood: selectedNeighborhood !== "All" ? selectedNeighborhood : undefined,
        status: selectedStatus !== "all" ? selectedStatus : undefined,
        priceMin: priceRange[0] > PRICE_MIN ? priceRange[0] : undefined,
        priceMax: priceRange[1] < PRICE_MAX ? priceRange[1] : undefined,
        areaMin: minArea ? parseInt(minArea) : undefined,
        areaMax: maxArea ? parseInt(maxArea) : undefined,
    }), [selectedType, selectedBedrooms, selectedBathrooms, selectedListing, selectedStatus, selectedCity, selectedNeighborhood, priceRange, minArea, maxArea, searchQuery]);

    const handleSaveSearch = useCallback(async () => {
        if (!user) {
            toast.error("Please sign in to save searches");
            return;
        }
        if (!saveSearchName.trim()) {
            toast.error("Please enter a name for this search");
            return;
        }
        setSavingSearch(true);
        try {
            await createSavedSearch(user.uid, saveSearchName.trim(), currentFilters);
            toast.success("Search saved! You'll be notified of new matches.");
            setShowSaveModal(false);
            setSaveSearchName("");
        } catch (err) {
            console.error("Failed to save search:", err);
            toast.error("Failed to save search");
        } finally {
            setSavingSearch(false);
        }
    }, [user, saveSearchName, currentFilters]);

    return (
        <div className={styles.page}>
            {/* Agent Filter Banner */}
            {hasMounted && filterAgentId && (
                <div style={{
                    background: "linear-gradient(135deg, var(--navy-900), var(--navy-800))",
                    padding: "0.85rem 0",
                    borderBottom: "2px solid var(--gold-500)",
                    position: "relative",
                    zIndex: 10,
                }}>
                    <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-400)" strokeWidth="2">
                            <circle cx="12" cy="8" r="4" /><path d="M5 20c0-4 3-7 7-7s7 3 7 7" />
                        </svg>
                        <span style={{ color: "rgba(255,255,255,0.85)", fontSize: "0.9rem", fontWeight: 500 }}>
                            Showing listings by <strong style={{ color: "var(--gold-400)" }}>{filterAgentName || "Agent"}</strong>
                        </span>
                        <Link
                            href={`/agents/${filterAgentId}`}
                            style={{
                                padding: "0.3rem 0.85rem", borderRadius: "var(--radius-full)",
                                background: "rgba(255,255,255,0.1)", color: "#fff",
                                fontSize: "0.78rem", fontWeight: 600, textDecoration: "none",
                                border: "1px solid rgba(255,255,255,0.15)",
                                transition: "all 0.15s",
                            }}
                        >
                            View Profile
                        </Link>
                        <button
                            onClick={() => router.push("/properties")}
                            style={{
                                padding: "0.3rem 0.85rem", borderRadius: "var(--radius-full)",
                                background: "rgba(239,68,68,0.15)", color: "#fca5a5",
                                fontSize: "0.78rem", fontWeight: 600,
                                border: "1px solid rgba(239,68,68,0.2)",
                                cursor: "pointer", transition: "all 0.15s",
                            }}
                        >
                            ✕ Clear Filter
                        </button>
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className="container">
                    <h1 className={styles.pageTitle}>
                        {filterAgentId ? `${filterAgentName || "Agent"}'s Listings` : "Explore Properties"}
                    </h1>
                    <p className={styles.pageSubtitle}>
                        {filterAgentId
                            ? `Browse all properties listed by ${filterAgentName || "this agent"}`
                            : "Discover your perfect property from our curated collection of premium listings"
                        }
                    </p>
                    {/* Search Mode Switcher Tabs */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                        <button
                            type="button"
                            onClick={() => setSearchMode("smart")}
                            style={{
                                padding: "0.45rem 1.1rem",
                                borderRadius: "var(--radius-full)",
                                border: searchMode === "smart" ? "1px solid var(--gold-500)" : "1px solid var(--border-color)",
                                background: searchMode === "smart" ? "linear-gradient(135deg, var(--gold-500), #e8b930)" : "rgba(255,255,255,0.06)",
                                color: searchMode === "smart" ? "#0a0e1a" : "var(--text-secondary)",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                            }}
                        >
                            <span>✨ AI Smart Search</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setSearchMode("standard")}
                            style={{
                                padding: "0.45rem 1.1rem",
                                borderRadius: "var(--radius-full)",
                                border: searchMode === "standard" ? "1px solid var(--gold-500)" : "1px solid var(--border-color)",
                                background: searchMode === "standard" ? "linear-gradient(135deg, var(--gold-500), #e8b930)" : "rgba(255,255,255,0.06)",
                                color: searchMode === "standard" ? "#0a0e1a" : "var(--text-secondary)",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                display: "flex",
                                alignItems: "center",
                                gap: "0.4rem",
                            }}
                        >
                            <span>🔍 Keyword Search</span>
                        </button>
                    </div>

                    {searchMode === "smart" ? (
                        <div style={{ maxWidth: "780px", margin: "0 auto" }}>
                            <SmartSearchBar
                                initialQuery={smartQuery}
                                onParsedQueryChange={setSmartParsed}
                                placeholder="Describe what you want (e.g. '3BR villa in Karen with pool under 50M')..."
                                showSuggestions={true}
                            />
                        </div>
                    ) : (
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
                    )}
                </div>
            </div>

            <div className={`container ${styles.layout} ${viewMode === "split" ? styles.layoutSplit : ""}`}>
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
                            {/* Save Search Button */}
                            {activeFilterCount > 0 && (
                                <button
                                    className={styles.saveSearchBtn}
                                    onClick={() => {
                                        if (!user) {
                                            toast.error("Please sign in to save searches");
                                            return;
                                        }
                                        setShowSaveModal(true);
                                    }}
                                    title="Save this search"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
                                    Save Search
                                </button>
                            )}
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
                                    className={`${styles.viewBtn} ${viewMode === "split" ? styles.viewActive : ""}`}
                                    onClick={() => setViewMode("split")}
                                    aria-label="Split-screen view"
                                    title="Split-Screen View (Cards + Map)"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <rect x="3" y="3" width="8" height="18" rx="2" />
                                        <rect x="13" y="3" width="8" height="18" rx="2" />
                                    </svg>
                                </button>
                                <button
                                    className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewActive : ""}`}
                                    onClick={() => setViewMode("grid")}
                                    aria-label="Grid view"
                                    title="Grid View"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
                                </button>
                                <button
                                    className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewActive : ""}`}
                                    onClick={() => setViewMode("list")}
                                    aria-label="List view"
                                    title="List View"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="4" width="18" height="4" rx="1" /><rect x="3" y="10" width="18" height="4" rx="1" /><rect x="3" y="16" width="18" height="4" rx="1" /></svg>
                                </button>
                                <button
                                    className={`${styles.viewBtn} ${viewMode === "map" ? styles.viewActive : ""}`}
                                    onClick={() => setViewMode("map")}
                                    aria-label="Map view"
                                    title="Full Map View"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" /><line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Dismissable Pills */}
                    {activeFilterCount > 0 && (
                        <div className={styles.filterPills}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Active:</span>
                            {mapPolygon && (
                                <span className={styles.filterPill} style={{ background: "rgba(212, 160, 23, 0.15)", borderColor: "var(--gold-500)", color: "var(--gold-400)", fontWeight: 700 }}>
                                    ✏️ Custom Boundary ({filtered.length} homes)
                                    <button onClick={() => setMapPolygon(null)} aria-label="Clear boundary filter">✕</button>
                                </span>
                            )}
                            {mapBounds && !mapPolygon && (viewMode === "split" || viewMode === "map") && (
                                <span className={styles.filterPill} style={{ background: "rgba(59, 130, 246, 0.12)", borderColor: "rgba(59, 130, 246, 0.4)", color: "#93c5fd" }}>
                                    🗺️ Map Area ({filtered.length} homes)
                                    <button onClick={() => setMapBounds(null)} aria-label="Clear map bounds filter">✕</button>
                                </span>
                            )}
                            {selectedListing !== "all" && (
                                <span className={styles.filterPill}>
                                    {selectedListing === "sale" ? "For Sale" : "For Rent"}
                                    <button onClick={() => setSelectedListing("all")} aria-label="Clear listing filter">✕</button>
                                </span>
                            )}
                            {selectedType !== "All" && (
                                <span className={styles.filterPill}>
                                    {selectedType}
                                    <button onClick={() => setSelectedType("All")} aria-label="Clear type filter">✕</button>
                                </span>
                            )}
                            {selectedCity !== "All" && (
                                <span className={styles.filterPill}>
                                    📍 {selectedCity}
                                    <button onClick={() => setSelectedCity("All")} aria-label="Clear city filter">✕</button>
                                </span>
                            )}
                            {selectedNeighborhood !== "All" && (
                                <span className={styles.filterPill}>
                                    🏘️ {selectedNeighborhood}
                                    <button onClick={() => setSelectedNeighborhood("All")} aria-label="Clear neighborhood filter">✕</button>
                                </span>
                            )}
                            {(priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) && (
                                <span className={styles.filterPill}>
                                    KES {formatSliderPrice(priceRange[0])} – {formatSliderPrice(priceRange[1])}
                                    <button onClick={() => setPriceRange([PRICE_MIN, PRICE_MAX])} aria-label="Clear price filter">✕</button>
                                </span>
                            )}
                            {selectedBedrooms !== "Any" && (
                                <span className={styles.filterPill}>
                                    🛏️ {selectedBedrooms} Beds
                                    <button onClick={() => setSelectedBedrooms("Any")} aria-label="Clear bedrooms filter">✕</button>
                                </span>
                            )}
                            {selectedBathrooms !== "Any" && (
                                <span className={styles.filterPill}>
                                    🚿 {selectedBathrooms} Baths
                                    <button onClick={() => setSelectedBathrooms("Any")} aria-label="Clear bathrooms filter">✕</button>
                                </span>
                            )}
                            {selectedStatus !== "all" && (
                                <span className={styles.filterPill}>
                                    {selectedStatus.replace("_", " ")}
                                    <button onClick={() => setSelectedStatus("all")} aria-label="Clear status filter">✕</button>
                                </span>
                            )}
                            {searchQuery.trim() && (
                                <span className={styles.filterPill}>
                                    🔍 &ldquo;{searchQuery}&rdquo;
                                    <button onClick={() => setSearchQuery("")} aria-label="Clear search text">✕</button>
                                </span>
                            )}
                            <button
                                onClick={resetAll}
                                style={{
                                    fontSize: "0.74rem",
                                    color: "var(--error)",
                                    background: "none",
                                    border: "none",
                                    cursor: "pointer",
                                    fontWeight: 600,
                                    marginLeft: "auto",
                                    padding: "0.2rem 0.4rem",
                                }}
                            >
                                Reset All
                            </button>
                        </div>
                    )}

                    {loadingFirestore && filtered.length === 0 ? (
                        <PropertySkeleton count={6} />
                    ) : filtered.length > 0 ? (
                        viewMode === "split" ? (
                            <div className={styles.splitViewContainer}>
                                {/* Mobile Segmented Toggle (Cards vs Map) */}
                                <div className={styles.mobileSplitSegmented}>
                                    <button
                                        type="button"
                                        className={`${styles.mobileSplitSegmentBtn} ${mobileSplitTab === "cards" ? styles.mobileSplitSegmentBtnActive : ""}`}
                                        onClick={() => setMobileSplitTab("cards")}
                                    >
                                        🏠 Listings ({filtered.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`${styles.mobileSplitSegmentBtn} ${mobileSplitTab === "map" ? styles.mobileSplitSegmentBtnActive : ""}`}
                                        onClick={() => setMobileSplitTab("map")}
                                    >
                                        🗺️ Interactive Map
                                    </button>
                                </div>

                                {/* Left Column: Property Cards */}
                                <div className={`${styles.splitCardsCol} ${mobileSplitTab === "map" ? styles.hideOnMobileMap : ""}`}>
                                    <div className={styles.splitCardsGrid}>
                                        {filtered.map((property) => (
                                            <div
                                                key={property.id}
                                                id={`property-card-${property.id}`}
                                                onMouseEnter={() => setHoveredPropId(property.id)}
                                                onMouseLeave={() => setHoveredPropId(null)}
                                                className={`${styles.cardWrapper} ${hoveredPropId === property.id ? styles.cardHovered : ""}`}
                                            >
                                                <PropertyCard property={property} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right Column: Sticky Leaflet Map */}
                                <div className={`${styles.splitMapCol} ${mobileSplitTab === "cards" ? styles.hideOnMobileCards : ""}`}>
                                    <CatalogMap
                                        properties={baseFiltered}
                                        selectedPropertyId={selectedPropId}
                                        hoveredPropertyId={hoveredPropId}
                                        onSelectProperty={handleMapSelectProperty}
                                        onHoverProperty={setHoveredPropId}
                                        onBoundsChange={setMapBounds}
                                        onPolygonFilter={setMapPolygon}
                                        height="100%"
                                        showSearchAsMoveToggle={true}
                                    />
                                </div>
                            </div>
                        ) : viewMode === "map" ? (
                            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                                <CatalogMap
                                    properties={baseFiltered}
                                    selectedPropertyId={selectedPropId}
                                    hoveredPropertyId={hoveredPropId}
                                    onSelectProperty={handleMapSelectProperty}
                                    onHoverProperty={setHoveredPropId}
                                    onBoundsChange={setMapBounds}
                                    onPolygonFilter={setMapPolygon}
                                    height="520px"
                                    showSearchAsMoveToggle={true}
                                />
                                <div>
                                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: "1rem" }}>
                                        Matching Listings ({filtered.length})
                                    </h3>
                                    <div className={styles.propertyGrid}>
                                        {filtered.map((property) => (
                                            <div
                                                key={property.id}
                                                id={`property-card-${property.id}`}
                                                onMouseEnter={() => setHoveredPropId(property.id)}
                                                onMouseLeave={() => setHoveredPropId(null)}
                                                className={`${styles.cardWrapper} ${hoveredPropId === property.id ? styles.cardHovered : ""}`}
                                            >
                                                <PropertyCard property={property} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className={`${styles.propertyGrid} ${viewMode === "list" ? styles.listView : ""}`}>
                                {filtered.map((property) => (
                                    <div
                                        key={property.id}
                                        id={`property-card-${property.id}`}
                                        onMouseEnter={() => setHoveredPropId(property.id)}
                                        onMouseLeave={() => setHoveredPropId(null)}
                                        className={`${styles.cardWrapper} ${hoveredPropId === property.id ? styles.cardHovered : ""}`}
                                    >
                                        <PropertyCard property={property} />
                                    </div>
                                ))}
                            </div>
                        )
                    ) : (
                        <div className={styles.emptyState}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                            <h3>No properties found</h3>
                            <p>Try adjusting your filters or clearing map boundaries to see more results</p>
                            {activeFilterCount > 0 && (
                                <button onClick={resetAll} className={styles.emptyResetBtn}>
                                    Reset All Filters
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Save Search Modal */}
            {showSaveModal && (
                <div className={styles.saveModalOverlay} onClick={() => setShowSaveModal(false)}>
                    <div className={styles.saveModalCard} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.saveModalHeader}>
                            <h3>🔔 Save This Search</h3>
                            <button className={styles.saveModalClose} onClick={() => setShowSaveModal(false)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>
                        <div className={styles.saveModalBody}>
                            <p className={styles.saveModalDesc}>
                                Get notified when new properties match your current filters:
                            </p>
                            <div className={styles.saveModalFilters}>
                                {selectedType !== "All" && <span className={styles.saveModalTag}>{selectedType}</span>}
                                {selectedListing !== "all" && <span className={styles.saveModalTag}>{selectedListing === "sale" ? "For Sale" : "For Rent"}</span>}
                                {selectedBedrooms !== "Any" && <span className={styles.saveModalTag}>{selectedBedrooms} Beds</span>}
                                {selectedBathrooms !== "Any" && <span className={styles.saveModalTag}>{selectedBathrooms} Baths</span>}
                                {selectedCity !== "All" && <span className={styles.saveModalTag}>{selectedCity}</span>}
                                {selectedNeighborhood !== "All" && <span className={styles.saveModalTag}>{selectedNeighborhood}</span>}
                                {selectedStatus !== "all" && <span className={styles.saveModalTag}>{selectedStatus}</span>}
                                {(priceRange[0] > PRICE_MIN || priceRange[1] < PRICE_MAX) && (
                                    <span className={styles.saveModalTag}>
                                        KES {formatSliderPrice(priceRange[0])} – {formatSliderPrice(priceRange[1])}
                                    </span>
                                )}
                                {searchQuery.trim() && <span className={styles.saveModalTag}>&quot;{searchQuery}&quot;</span>}
                            </div>
                            <label className={styles.saveModalLabel}>Search Name</label>
                            <input
                                type="text"
                                className={styles.saveModalInput}
                                placeholder="e.g. 3BR Villa in Kilimani under 20M"
                                value={saveSearchName}
                                onChange={(e) => setSaveSearchName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
                                autoFocus
                            />
                        </div>
                        <div className={styles.saveModalFooter}>
                            <button className={styles.saveModalCancel} onClick={() => setShowSaveModal(false)}>Cancel</button>
                            <button
                                className={styles.saveModalSave}
                                onClick={handleSaveSearch}
                                disabled={savingSearch || !saveSearchName.trim()}
                            >
                                {savingSearch ? "Saving..." : "Save Search"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
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
