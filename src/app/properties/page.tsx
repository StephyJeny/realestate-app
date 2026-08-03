"use client";
import { useState, useMemo } from "react";
import { sampleProperties } from "@/lib/data";
import PropertyCard from "@/components/property/PropertyCard";
import styles from "./page.module.css";

const propertyTypes = ["All", "Apartment", "House", "Villa", "Townhouse", "Land", "Commercial"];
const bedroomOptions = ["Any", "1", "2", "3", "4", "5+"];

export default function PropertiesPage() {
    const [selectedType, setSelectedType] = useState("All");
    const [selectedBedrooms, setSelectedBedrooms] = useState("Any");
    const [selectedListing, setSelectedListing] = useState("all");
    const [sortBy, setSortBy] = useState("newest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    const filtered = useMemo(() => {
        let result = [...sampleProperties];

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

        switch (sortBy) {
            case "price-low": result.sort((a, b) => a.price - b.price); break;
            case "price-high": result.sort((a, b) => b.price - a.price); break;
            case "newest": result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
            case "popular": result.sort((a, b) => b.views - a.views); break;
        }

        return result;
    }, [selectedType, selectedBedrooms, selectedListing, sortBy]);

    return (
        <div className={styles.page}>
            {/* Page Header */}
            <div className={styles.pageHeader}>
                <div className="container">
                    <h1 className={styles.pageTitle}>Explore Properties</h1>
                    <p className={styles.pageSubtitle}>
                        Discover your perfect property from our curated collection of premium listings
                    </p>
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
                            <input type="text" placeholder="Min (KES)" className={styles.priceInput} />
                            <span className={styles.priceSep}>—</span>
                            <input type="text" placeholder="Max (KES)" className={styles.priceInput} />
                        </div>
                    </div>

                    <button
                        className={styles.resetBtn}
                        onClick={() => {
                            setSelectedType("All");
                            setSelectedBedrooms("Any");
                            setSelectedListing("all");
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
