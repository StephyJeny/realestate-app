"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { neighborhoods, NeighborhoodData } from "@/lib/neighborhoods";
import styles from "./page.module.css";

/* =====================================================
   PAGE COMPONENT
   ===================================================== */

export default function NeighborhoodsPage() {
    const [selectedCity, setSelectedCity] = useState<string>("All");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [selectedNeighborhood, setSelectedNeighborhood] =
        useState<NeighborhoodData | null>(null);

    const cities = ["All", ...Array.from(new Set(neighborhoods.map((n) => n.city)))];
    const totalListings = neighborhoods.reduce((sum, n) => sum + n.propertyCount, 0);

    const filtered = useMemo(() => {
        if (selectedCity === "All") return neighborhoods;
        return neighborhoods.filter((n) => n.city === selectedCity);
    }, [selectedCity]);

    return (
        <div className={styles.page}>
            {/* ============ HERO ============ */}
            <section className={styles.hero}>
                <div className="container">
                    <div className={styles.heroInner}>
                        <span className={styles.heroLabel}>📍 Neighborhood Guides</span>
                        <h1 className={styles.heroTitle}>
                            Discover Kenya&apos;s{" "}
                            <span className={styles.heroTitleAccent}>Best Neighborhoods</span>
                        </h1>
                        <p className={styles.heroSubtitle}>
                            Explore in-depth neighborhood profiles — safety scores, local
                            amenities, lifestyle vibes, and property insights to help you find
                            where you truly belong.
                        </p>
                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNumber}>
                                    {neighborhoods.length}
                                </span>
                                <span className={styles.heroStatLabel}>Neighborhoods</span>
                            </div>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNumber}>
                                    {cities.length - 1}
                                </span>
                                <span className={styles.heroStatLabel}>Cities</span>
                            </div>
                            <div className={styles.heroStat}>
                                <span className={styles.heroStatNumber}>
                                    {totalListings}+
                                </span>
                                <span className={styles.heroStatLabel}>Listings</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============ FILTER + GRID ============ */}
            <section className={styles.filterSection}>
                <div className="container">
                    <div className={styles.filterBar}>
                        <div className={styles.filterLeft}>
                            <div>
                                <span className={styles.filterTitle}>All Areas</span>{" "}
                                <span className={styles.filterCount}>
                                    ({filtered.length} neighborhoods)
                                </span>
                            </div>
                            <div className={styles.cityTabs}>
                                {cities.map((city) => (
                                    <button
                                        key={city}
                                        className={`${styles.cityTab} ${selectedCity === city ? styles.cityTabActive : ""
                                            }`}
                                        onClick={() => setSelectedCity(city)}
                                    >
                                        {city}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* View Toggle */}
                        <div className={styles.viewToggle}>
                            <button
                                className={`${styles.viewBtn} ${viewMode === "grid" ? styles.viewBtnActive : ""
                                    }`}
                                onClick={() => setViewMode("grid")}
                                aria-label="Grid view"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <rect x="3" y="3" width="7" height="7" />
                                    <rect x="14" y="3" width="7" height="7" />
                                    <rect x="3" y="14" width="7" height="7" />
                                    <rect x="14" y="14" width="7" height="7" />
                                </svg>
                            </button>
                            <button
                                className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""
                                    }`}
                                onClick={() => setViewMode("list")}
                                aria-label="List view"
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="8" y1="6" x2="21" y2="6" />
                                    <line x1="8" y1="12" x2="21" y2="12" />
                                    <line x1="8" y1="18" x2="21" y2="18" />
                                    <line x1="3" y1="6" x2="3.01" y2="6" />
                                    <line x1="3" y1="12" x2="3.01" y2="12" />
                                    <line x1="3" y1="18" x2="3.01" y2="18" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* ===== GRID VIEW ===== */}
                    {viewMode === "grid" && (
                        <div className={styles.gridView}>
                            {filtered.map((n) => (
                                <Link
                                    key={n.id}
                                    href={`/neighborhoods/${n.id}`}
                                    className={styles.card}
                                >
                                    <Image
                                        src={n.image}
                                        alt={n.name}
                                        fill
                                        sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                                        className={styles.cardImage}
                                    />
                                    <div className={styles.cardGradient} />

                                    {/* Badge */}
                                    {n.badge && (
                                        <div
                                            className={`${styles.badge} ${n.badge === "popular"
                                                ? styles.badgePopular
                                                : n.badge === "trending"
                                                    ? styles.badgeTrending
                                                    : styles.badgeUpcoming
                                                }`}
                                        >
                                            {n.badge === "popular"
                                                ? "🔥 Popular"
                                                : n.badge === "trending"
                                                    ? "📈 Trending"
                                                    : "🚀 Upcoming"}
                                        </div>
                                    )}

                                    {/* Safety Score */}
                                    <div className={styles.scorePill}>
                                        🛡️ {n.safetyRating}/10
                                    </div>

                                    <div className={styles.cardContent}>
                                        <span className={styles.cardCity}>{n.city}</span>
                                        <h3 className={styles.cardName}>{n.name}</h3>
                                        <p className={styles.cardTagline}>{n.tagline}</p>

                                        <div className={styles.cardMeta}>
                                            <span className={styles.cardChip}>
                                                🏠 {n.propertyCount} listings
                                            </span>
                                            <span className={styles.cardChip}>
                                                💰 From {n.avgPrice}
                                            </span>
                                        </div>

                                        <div className={styles.cardExplore}>
                                            View Full Guide →
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ===== LIST VIEW ===== */}
                    {viewMode === "list" && (
                        <div className={styles.listView}>
                            {filtered.map((n) => (
                                <Link
                                    key={n.id}
                                    href={`/neighborhoods/${n.id}`}
                                    className={styles.listCard}
                                >
                                    <div className={styles.listCardImage}>
                                        <Image
                                            src={n.image}
                                            alt={n.name}
                                            fill
                                            sizes="280px"
                                            style={{ objectFit: "cover" }}
                                        />
                                        {n.badge && (
                                            <div
                                                className={`${styles.badge} ${n.badge === "popular"
                                                    ? styles.badgePopular
                                                    : n.badge === "trending"
                                                        ? styles.badgeTrending
                                                        : styles.badgeUpcoming
                                                    }`}
                                                style={{ top: "0.75rem", left: "0.75rem" }}
                                            >
                                                {n.badge === "popular"
                                                    ? "🔥 Popular"
                                                    : n.badge === "trending"
                                                        ? "📈 Trending"
                                                        : "🚀 Upcoming"}
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.listCardBody}>
                                        <span className={styles.listCardCity}>{n.city}</span>
                                        <h3 className={styles.listCardName}>{n.name}</h3>
                                        <p className={styles.listCardTagline}>{n.tagline}</p>
                                        <div className={styles.listCardVibes}>
                                            {n.vibes.slice(0, 4).map((v) => (
                                                <span key={v} className={styles.listVibeTag}>
                                                    {v}
                                                </span>
                                            ))}
                                        </div>
                                        <div className={styles.listCardStats}>
                                            <div className={styles.listCardStat}>
                                                <span className={styles.listCardStatValue}>
                                                    {n.propertyCount}
                                                </span>
                                                <span className={styles.listCardStatLabel}>
                                                    Listings
                                                </span>
                                            </div>
                                            <div className={styles.listCardStat}>
                                                <span className={styles.listCardStatValue}>
                                                    {n.avgPrice}
                                                </span>
                                                <span className={styles.listCardStatLabel}>
                                                    Avg. Price
                                                </span>
                                            </div>
                                            <div className={styles.listCardStat}>
                                                <span className={styles.listCardStatValue}>
                                                    {n.safetyRating}/10
                                                </span>
                                                <span className={styles.listCardStatLabel}>
                                                    Safety
                                                </span>
                                            </div>
                                            <div className={styles.listCardStat}>
                                                <span className={styles.listCardStatValue}>
                                                    {n.lifestyleScore}/10
                                                </span>
                                                <span className={styles.listCardStatLabel}>
                                                    Lifestyle
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </section>

            {/* ============ CTA ============ */}
            <section className={styles.ctaSection}>
                <div className="container">
                    <div className={styles.ctaCard}>
                        <span
                            className={styles.heroLabel}
                            style={{ marginBottom: "0.75rem" }}
                        >
                            ✦ Find Your Perfect Area
                        </span>
                        <h2 className={styles.ctaTitle}>Not Sure Where to Live?</h2>
                        <p className={styles.ctaSubtitle}>
                            Browse our curated property collection and find the perfect home
                            in these amazing neighborhoods.
                        </p>
                        <Link
                            href="/properties"
                            className="btn btn-primary btn-lg"
                            style={{ position: "relative" }}
                        >
                            Browse All Properties →
                        </Link>
                    </div>
                </div>
            </section>

            {/* ============ DETAIL MODAL (kept for quick preview) ============ */}
            {selectedNeighborhood && (
                <div
                    className={styles.modalOverlay}
                    onClick={() => setSelectedNeighborhood(null)}
                >
                    <div
                        className={styles.modal}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Hero Image */}
                        <div className={styles.modalHero}>
                            <Image
                                src={selectedNeighborhood.image}
                                alt={selectedNeighborhood.name}
                                fill
                                sizes="760px"
                                style={{ objectFit: "cover" }}
                            />
                            <div className={styles.modalHeroOverlay}>
                                <span className={styles.modalHeroCity}>
                                    {selectedNeighborhood.city}
                                </span>
                                <h2 className={styles.modalHeroTitle}>
                                    {selectedNeighborhood.name}
                                </h2>
                            </div>
                            <button
                                className={styles.modalClose}
                                onClick={() => setSelectedNeighborhood(null)}
                            >
                                <svg
                                    width="18"
                                    height="18"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Description */}
                            <p className={styles.modalDesc}>
                                {selectedNeighborhood.description}
                            </p>

                            {/* Vibes */}
                            <div className={styles.vibeRow}>
                                {selectedNeighborhood.vibes.map((v) => (
                                    <span key={v} className={styles.vibeTag}>
                                        {v}
                                    </span>
                                ))}
                            </div>

                            {/* Score Grid */}
                            <div className={styles.scoreGrid}>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🚶</span>
                                    <span className={styles.scoreValue}>
                                        {selectedNeighborhood.walkabilityScore}/10
                                    </span>
                                    <span className={styles.scoreLabel}>Walkability</span>
                                </div>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🚌</span>
                                    <span className={styles.scoreValue}>
                                        {selectedNeighborhood.transitScore}/10
                                    </span>
                                    <span className={styles.scoreLabel}>Transit</span>
                                </div>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🎯</span>
                                    <span className={styles.scoreValue}>
                                        {selectedNeighborhood.lifestyleScore}/10
                                    </span>
                                    <span className={styles.scoreLabel}>Lifestyle</span>
                                </div>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🏠</span>
                                    <span className={styles.scoreValue}>
                                        {selectedNeighborhood.propertyCount}
                                    </span>
                                    <span className={styles.scoreLabel}>Listings</span>
                                </div>
                            </div>

                            {/* Safety Panel */}
                            <div
                                className={`${styles.infoPanel} ${styles.safetyPanel}`}
                            >
                                <div className={styles.infoPanelLeft}>
                                    <div
                                        className={`${styles.infoPanelIcon} ${styles.safetyIcon}`}
                                    >
                                        🛡️
                                    </div>
                                    <div>
                                        <div className={styles.infoPanelLabel}>
                                            Safety Rating
                                        </div>
                                        <span className={styles.infoPanelValue}>
                                            {selectedNeighborhood.safetyRating >= 9
                                                ? "Excellent"
                                                : selectedNeighborhood.safetyRating >= 7
                                                    ? "Very Good"
                                                    : "Good"}
                                        </span>
                                    </div>
                                </div>
                                <div className={styles.safetyBarWrapper}>
                                    <span className={styles.safetyScore}>
                                        {selectedNeighborhood.safetyRating}/10
                                    </span>
                                    <div className={styles.safetyBarTrack}>
                                        <div
                                            className={styles.safetyBarFill}
                                            style={{
                                                width: `${selectedNeighborhood.safetyRating * 10}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Price Panel */}
                            <div
                                className={`${styles.infoPanel} ${styles.pricePanel}`}
                                style={{ marginBottom: "1.75rem" }}
                            >
                                <div className={styles.infoPanelLeft}>
                                    <div
                                        className={`${styles.infoPanelIcon} ${styles.priceIcon}`}
                                    >
                                        💰
                                    </div>
                                    <div>
                                        <div className={styles.infoPanelLabel}>Price Range</div>
                                        <span className={styles.infoPanelValue}>
                                            {selectedNeighborhood.priceRange}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <div className={styles.infoPanelLabel}>Average</div>
                                    <span
                                        className={styles.infoPanelValue}
                                        style={{ color: "var(--gold-600)" }}
                                    >
                                        {selectedNeighborhood.avgPrice}
                                    </span>
                                </div>
                            </div>

                            {/* Nearby Places */}
                            {[
                                {
                                    title: "🎓 Schools & Education",
                                    data: selectedNeighborhood.nearbySchools,
                                },
                                {
                                    title: "🏥 Healthcare",
                                    data: selectedNeighborhood.nearbyHospitals,
                                },
                                {
                                    title: "🛒 Shopping",
                                    data: selectedNeighborhood.nearbyShopping,
                                },
                                {
                                    title: "🍽️ Dining & Cafés",
                                    data: selectedNeighborhood.nearbyDining,
                                },
                                {
                                    title: "🌿 Parks & Recreation",
                                    data: selectedNeighborhood.nearbyParks,
                                },
                            ].map(({ title, data }) => (
                                <div key={title} className={styles.nearbyBlock}>
                                    <h4 className={styles.nearbyTitle}>{title}</h4>
                                    <div className={styles.nearbyGrid}>
                                        {data.map((place) => (
                                            <div key={place.name} className={styles.nearbyItem}>
                                                <div className={styles.nearbyItemIcon}>
                                                    {place.icon}
                                                </div>
                                                <div>
                                                    <div className={styles.nearbyItemName}>
                                                        {place.name}
                                                    </div>
                                                    <div className={styles.nearbyItemType}>
                                                        {place.type}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* CTA */}
                            <div className={styles.modalCTA}>
                                <Link
                                    href={`/neighborhoods/${selectedNeighborhood.id}`}
                                    className="btn btn-primary btn-lg"
                                    style={{ marginRight: "0.5rem" }}
                                >
                                    View Full Guide →
                                </Link>
                                <Link
                                    href={`/properties?city=${selectedNeighborhood.city}&neighborhood=${selectedNeighborhood.name}`}
                                    className="btn btn-lg"
                                    style={{ border: "1px solid var(--border-color)" }}
                                >
                                    View Properties →
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
