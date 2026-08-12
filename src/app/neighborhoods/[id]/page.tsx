"use client";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { getNeighborhoodById, neighborhoods } from "@/lib/neighborhoods";
import styles from "./page.module.css";

interface Props {
    params: Promise<{ id: string }>;
}

export default function NeighborhoodDetailPage({ params }: Props) {
    const { id } = use(params);
    const neighborhood = getNeighborhoodById(id);

    if (!neighborhood) {
        return (
            <div className={styles.page}>
                <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-heading)" }}>Neighborhood not found</h1>
                    <Link href="/neighborhoods" style={{ color: "var(--gold-600)", fontWeight: 600, textDecoration: "none" }}>
                        ← Back to all neighborhoods
                    </Link>
                </div>
            </div>
        );
    }

    const n = neighborhood;

    const amenitySections = [
        { title: "🎓 Schools & Education", data: n.nearbySchools },
        { title: "🏥 Healthcare", data: n.nearbyHospitals },
        { title: "🛒 Shopping", data: n.nearbyShopping },
        { title: "🍽️ Dining & Cafés", data: n.nearbyDining },
        { title: "🌿 Parks & Recreation", data: n.nearbyParks },
    ];

    // Suggest other neighborhoods from the same city
    const similar = neighborhoods.filter((x) => x.id !== n.id && x.city === n.city).slice(0, 3);

    return (
        <div className={styles.page}>
            {/* Hero Banner */}
            <div className={styles.hero}>
                <Image src={n.image} alt={n.name} fill className={styles.heroImage} />
                <div className={styles.heroOverlay}>
                    <div className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span>›</span>
                        <Link href="/neighborhoods">Neighborhoods</Link>
                        <span>›</span>
                        <span style={{ color: "rgba(255,255,255,0.8)" }}>{n.name}</span>
                    </div>
                    <span className={styles.heroCity}>📍 {n.city}</span>
                    <h1 className={styles.heroTitle}>{n.name}</h1>
                    <p className={styles.heroTagline}>{n.tagline}</p>
                </div>
                {n.badge && (
                    <div className={`${styles.heroBadge} ${n.badge === "popular" ? styles.badgePopular : n.badge === "trending" ? styles.badgeTrending : styles.badgeUpcoming}`}>
                        {n.badge === "popular" ? "🔥 Popular" : n.badge === "trending" ? "📈 Trending" : "🚀 Upcoming"}
                    </div>
                )}
            </div>

            {/* Main Layout */}
            <div className={styles.layout}>
                {/* Left Column — Main Content */}
                <div>
                    <Link href="/neighborhoods" className={styles.backLink}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        All Neighborhoods
                    </Link>

                    {/* About */}
                    <div className={styles.card}>
                        <div className={styles.cardHeader}>About {n.name}</div>
                        <div className={styles.cardBody}>
                            <p className={styles.description}>{n.description}</p>

                            {/* Vibes */}
                            <div className={styles.vibeRow}>
                                {n.vibes.map((v) => (
                                    <span key={v} className={styles.vibeTag}>{v}</span>
                                ))}
                            </div>

                            {/* Score Cards */}
                            <div className={styles.scoreGrid}>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🛡️</span>
                                    <span className={styles.scoreValue}>{n.safetyRating}/10</span>
                                    <span className={styles.scoreLabel}>Safety</span>
                                </div>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🚶</span>
                                    <span className={styles.scoreValue}>{n.walkabilityScore}/10</span>
                                    <span className={styles.scoreLabel}>Walkability</span>
                                </div>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🚌</span>
                                    <span className={styles.scoreValue}>{n.transitScore}/10</span>
                                    <span className={styles.scoreLabel}>Transit</span>
                                </div>
                                <div className={styles.scoreCard}>
                                    <span className={styles.scoreIcon}>🎯</span>
                                    <span className={styles.scoreValue}>{n.lifestyleScore}/10</span>
                                    <span className={styles.scoreLabel}>Lifestyle</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Score Bars */}
                    <div className={styles.card} style={{ marginTop: "1.25rem" }}>
                        <div className={styles.cardHeader}>Livability Scores</div>
                        <div className={styles.cardBody}>
                            <div className={styles.scoreBar}>
                                <div className={styles.scoreBarHeader}>
                                    <span className={styles.scoreBarLabel}>🛡️ Safety</span>
                                    <span className={styles.scoreBarValue}>{n.safetyRating}/10</span>
                                </div>
                                <div className={styles.scoreBarTrack}>
                                    <div className={`${styles.scoreBarFill} ${styles.scoreBarSafety}`} style={{ width: `${n.safetyRating * 10}%` }} />
                                </div>
                            </div>
                            <div className={styles.scoreBar}>
                                <div className={styles.scoreBarHeader}>
                                    <span className={styles.scoreBarLabel}>🚶 Walkability</span>
                                    <span className={styles.scoreBarValue}>{n.walkabilityScore}/10</span>
                                </div>
                                <div className={styles.scoreBarTrack}>
                                    <div className={`${styles.scoreBarFill} ${styles.scoreBarWalk}`} style={{ width: `${n.walkabilityScore * 10}%` }} />
                                </div>
                            </div>
                            <div className={styles.scoreBar}>
                                <div className={styles.scoreBarHeader}>
                                    <span className={styles.scoreBarLabel}>🚌 Transit Access</span>
                                    <span className={styles.scoreBarValue}>{n.transitScore}/10</span>
                                </div>
                                <div className={styles.scoreBarTrack}>
                                    <div className={`${styles.scoreBarFill} ${styles.scoreBarTransit}`} style={{ width: `${n.transitScore * 10}%` }} />
                                </div>
                            </div>
                            <div className={styles.scoreBar}>
                                <div className={styles.scoreBarHeader}>
                                    <span className={styles.scoreBarLabel}>🎯 Lifestyle</span>
                                    <span className={styles.scoreBarValue}>{n.lifestyleScore}/10</span>
                                </div>
                                <div className={styles.scoreBarTrack}>
                                    <div className={`${styles.scoreBarFill} ${styles.scoreBarLifestyle}`} style={{ width: `${n.lifestyleScore * 10}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Nearby Amenities */}
                    <div className={styles.card} style={{ marginTop: "1.25rem" }}>
                        <div className={styles.cardHeader}>What&apos;s Nearby</div>
                        <div className={styles.cardBody}>
                            {amenitySections.map(({ title, data }) => (
                                <div key={title} className={styles.nearbySection}>
                                    <h4 className={styles.nearbyTitle}>{title}</h4>
                                    <div className={styles.nearbyGrid}>
                                        {data.map((place) => (
                                            <div key={place.name} className={styles.nearbyItem}>
                                                <div className={styles.nearbyItemIcon}>{place.icon}</div>
                                                <div>
                                                    <div className={styles.nearbyItemName}>{place.name}</div>
                                                    <div className={styles.nearbyItemType}>{place.type}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Similar Neighborhoods */}
                    {similar.length > 0 && (
                        <div className={styles.card} style={{ marginTop: "1.25rem" }}>
                            <div className={styles.cardHeader}>Other Neighborhoods in {n.city}</div>
                            <div className={styles.cardBody}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "0.75rem" }}>
                                    {similar.map((s) => (
                                        <Link key={s.id} href={`/neighborhoods/${s.id}`} style={{ textDecoration: "none", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.75rem", transition: "border-color 0.15s" }}>
                                            <div style={{ width: 48, height: 48, borderRadius: "var(--radius-sm)", overflow: "hidden", position: "relative", flexShrink: 0 }}>
                                                <Image src={s.image} alt={s.name} fill style={{ objectFit: "cover" }} sizes="48px" />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)" }}>{s.name}</div>
                                                <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>{s.propertyCount} listings · {s.avgPrice}</div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column — Sidebar */}
                <div>
                    <div className={`${styles.card} ${styles.sidebarCard}`}>
                        {/* Average Price */}
                        <div className={styles.priceBlock}>
                            <div className={styles.priceLabel}>Average Price</div>
                            <div className={styles.priceValue}>{n.avgPrice}</div>
                            <div className={styles.priceRange}>{n.priceRange}</div>
                        </div>

                        {/* Quick Stats */}
                        <div className={styles.quickStats}>
                            <div className={styles.quickStat}>
                                <span className={styles.quickStatLabel}>🏠 Listings</span>
                                <span className={styles.quickStatValue}>{n.propertyCount}</span>
                            </div>
                            <div className={styles.quickStat}>
                                <span className={styles.quickStatLabel}>🛡️ Safety</span>
                                <span className={styles.quickStatValue}>{n.safetyRating}/10</span>
                            </div>
                            <div className={styles.quickStat}>
                                <span className={styles.quickStatLabel}>🚶 Walkability</span>
                                <span className={styles.quickStatValue}>{n.walkabilityScore}/10</span>
                            </div>
                            <div className={styles.quickStat}>
                                <span className={styles.quickStatLabel}>🚌 Transit</span>
                                <span className={styles.quickStatValue}>{n.transitScore}/10</span>
                            </div>
                            <div className={styles.quickStat}>
                                <span className={styles.quickStatLabel}>🎯 Lifestyle</span>
                                <span className={styles.quickStatValue}>{n.lifestyleScore}/10</span>
                            </div>
                            <div className={styles.quickStat}>
                                <span className={styles.quickStatLabel}>📍 City</span>
                                <span className={styles.quickStatValue}>{n.city}</span>
                            </div>
                        </div>

                        {/* CTAs */}
                        <div className={styles.ctaBlock}>
                            <Link
                                href={`/properties?city=${n.city}&neighborhood=${n.name}`}
                                className={`${styles.ctaBtn} ${styles.ctaPrimary}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                                View Properties in {n.name}
                            </Link>
                            <Link
                                href="/mortgage-calculator"
                                className={`${styles.ctaBtn} ${styles.ctaOutline}`}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                                Mortgage Calculator
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
