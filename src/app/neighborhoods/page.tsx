"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

interface NearbyPlace {
    name: string;
    icon: string;
    type: string;
}

interface NeighborhoodData {
    id: string;
    name: string;
    city: string;
    tagline: string;
    description: string;
    image: string;
    badge?: "popular" | "trending" | "upcoming";
    avgPrice: string;
    priceRange: string;
    propertyCount: number;
    safetyRating: number; // 1-10
    walkabilityScore: number; // 1-10
    transitScore: number; // 1-10
    vibes: string[];
    nearbySchools: NearbyPlace[];
    nearbyHospitals: NearbyPlace[];
    nearbyShopping: NearbyPlace[];
    nearbyDining: NearbyPlace[];
    nearbyParks: NearbyPlace[];
}

const neighborhoods: NeighborhoodData[] = [
    {
        id: "karen",
        name: "Karen",
        city: "Nairobi",
        tagline: "Leafy suburbia with a village charm",
        description: "Karen is one of Nairobi's most prestigious and spacious suburbs, named after Karen Blixen of 'Out of Africa' fame. Known for its lush green landscapes, large compound homes, and equestrian culture, it offers a serene escape from the city buzz while remaining well-connected to the CBD. The area attracts families seeking top-notch international schools, nature lovers, and those who appreciate sprawling gardens and mature trees. Karen's property market features grand villas, gated communities, and contemporary townhouses set amid beautifully landscaped grounds.",
        image: "/images/property-3.png",
        badge: "popular",
        avgPrice: "KES 42M",
        priceRange: "KES 15M – 120M",
        propertyCount: 48,
        safetyRating: 9,
        walkabilityScore: 4,
        transitScore: 5,
        vibes: ["Family-Friendly", "Suburban", "Nature", "Equestrian", "Quiet", "Premium"],
        nearbySchools: [
            { name: "Brookhouse School", icon: "🎓", type: "International" },
            { name: "Banda School", icon: "🎓", type: "Primary" },
            { name: "Karen C Daycare", icon: "👶", type: "Early Childhood" },
        ],
        nearbyHospitals: [
            { name: "Karen Hospital", icon: "🏥", type: "Private Hospital" },
            { name: "Coptic Hospital Karen", icon: "🏥", type: "Specialist" },
        ],
        nearbyShopping: [
            { name: "Karen Hub", icon: "🛒", type: "Mall" },
            { name: "The Karen Hardy", icon: "🛍️", type: "Shopping Center" },
            { name: "Karen Crossroads", icon: "🏪", type: "Shops" },
        ],
        nearbyDining: [
            { name: "Talisman", icon: "🍽️", type: "Fine Dining" },
            { name: "Karen Blixen Coffee Garden", icon: "☕", type: "Café" },
            { name: "Harvest Restaurant", icon: "🍕", type: "International" },
        ],
        nearbyParks: [
            { name: "Nairobi National Park", icon: "🦁", type: "Wildlife" },
            { name: "Giraffe Centre", icon: "🦒", type: "Attraction" },
            { name: "Karen Country Club", icon: "⛳", type: "Recreation" },
        ],
    },
    {
        id: "westlands",
        name: "Westlands",
        city: "Nairobi",
        tagline: "The heartbeat of urban Nairobi",
        description: "Westlands is Nairobi's premier commercial and lifestyle hub. Home to gleaming skyscrapers, world-class restaurants, vibrant nightlife, and major corporate headquarters, it's the neighborhood of choice for young professionals and cosmopolitan residents. The area has undergone massive transformation with modern high-rise apartments, serviced offices, and mixed-use developments. Excellent public transport links, proximity to the Westgate and Sarit Centre malls, and a thriving food scene make Westlands one of the most sought-after urban addresses in Kenya.",
        image: "/images/property-2.png",
        badge: "trending",
        avgPrice: "KES 25M",
        priceRange: "KES 8M – 65M",
        propertyCount: 72,
        safetyRating: 7,
        walkabilityScore: 8,
        transitScore: 9,
        vibes: ["Urban", "Cosmopolitan", "Nightlife", "Business Hub", "Walkable", "Modern"],
        nearbySchools: [
            { name: "Aga Khan Academy", icon: "🎓", type: "International" },
            { name: "Hospital Hill School", icon: "🎓", type: "Public" },
        ],
        nearbyHospitals: [
            { name: "Aga Khan University Hospital", icon: "🏥", type: "University Hospital" },
            { name: "MP Shah Hospital", icon: "🏥", type: "Private" },
        ],
        nearbyShopping: [
            { name: "Sarit Centre", icon: "🛒", type: "Mall" },
            { name: "Westgate Mall", icon: "🛍️", type: "Premium Mall" },
            { name: "The Mall Westlands", icon: "🏪", type: "Shopping" },
        ],
        nearbyDining: [
            { name: "Artcaffe Westlands", icon: "☕", type: "Café & Bistro" },
            { name: "Mama Rocks", icon: "🍔", type: "Burgers & Grill" },
            { name: "Ocean Basket", icon: "🐟", type: "Seafood" },
        ],
        nearbyParks: [
            { name: "Karura Forest", icon: "🌿", type: "Nature Reserve" },
            { name: "City Park", icon: "🌳", type: "Public Park" },
        ],
    },
    {
        id: "kilimani",
        name: "Kilimani",
        city: "Nairobi",
        tagline: "Where convenience meets modern living",
        description: "Kilimani has rapidly evolved into one of Nairobi's most desirable residential neighborhoods. Centrally located between the CBD and Westlands, it offers the perfect balance of urban convenience and residential calm. The area is characterized by tree-lined streets, modern apartment complexes, and proximity to Yaya Centre and Prestige Plaza. Popular with diplomats, expats, and young families, Kilimani boasts excellent restaurants, boutique shops, and cultural venues. Its central location means quick access to everything the city has to offer.",
        image: "/images/property-4.png",
        badge: "popular",
        avgPrice: "KES 18M",
        priceRange: "KES 6M – 55M",
        propertyCount: 85,
        safetyRating: 8,
        walkabilityScore: 7,
        transitScore: 8,
        vibes: ["Central", "Diplomatic", "Modern", "Restaurants", "Convenient", "Diverse"],
        nearbySchools: [
            { name: "Kilimani Junior Academy", icon: "🎓", type: "Primary" },
            { name: "Rusinga School", icon: "🎓", type: "International" },
        ],
        nearbyHospitals: [
            { name: "Nairobi Hospital", icon: "🏥", type: "Premier Hospital" },
            { name: "Avenue Healthcare", icon: "🏥", type: "Multi-branch" },
        ],
        nearbyShopping: [
            { name: "Yaya Centre", icon: "🛒", type: "Mall" },
            { name: "Prestige Plaza", icon: "🛍️", type: "Shopping" },
            { name: "AdLife Plaza", icon: "🏪", type: "Shopping" },
        ],
        nearbyDining: [
            { name: "About Thyme", icon: "🍽️", type: "Fine Dining" },
            { name: "Java House Kilimani", icon: "☕", type: "Café" },
            { name: "Zen Garden", icon: "🍜", type: "Asian Fusion" },
        ],
        nearbyParks: [
            { name: "Uhuru Gardens", icon: "🌿", type: "Memorial Park" },
        ],
    },
    {
        id: "runda",
        name: "Runda",
        city: "Nairobi",
        tagline: "The ambassador's choice — elite living",
        description: "Runda is Nairobi's most exclusive residential enclave, home to ambassadorial residences, CEO mansions, and ultra-high-net-worth individuals. Known for its tree-lined avenues, expansive compounds, and impeccable security, Runda offers unmatched privacy and prestige. Properties here feature sprawling gardens, swimming pools, tennis courts, and staff quarters as standard. The neighborhood is served by top-tier international schools and is conveniently close to Village Market and UN headquarters. If luxury without compromise is your priority, Runda is the definitive address.",
        image: "/images/property-5.png",
        avgPrice: "KES 120M",
        priceRange: "KES 50M – 500M+",
        propertyCount: 24,
        safetyRating: 10,
        walkabilityScore: 3,
        transitScore: 4,
        vibes: ["Ultra-Premium", "Diplomatic", "Exclusive", "Private", "Secure", "Prestigious"],
        nearbySchools: [
            { name: "ISK (International School of Kenya)", icon: "🎓", type: "International" },
            { name: "Rosslyn Academy", icon: "🎓", type: "International" },
        ],
        nearbyHospitals: [
            { name: "Gertrude's Hospital Muthaiga", icon: "🏥", type: "Children's" },
            { name: "Aga Khan Hospital", icon: "🏥", type: "University Hospital" },
        ],
        nearbyShopping: [
            { name: "Village Market", icon: "🛒", type: "Premium Mall" },
            { name: "Rosslyn Riviera", icon: "🛍️", type: "Mall" },
        ],
        nearbyDining: [
            { name: "Osteria del Chianti", icon: "🍝", type: "Italian" },
            { name: "Pampa Churrascos", icon: "🥩", type: "Steakhouse" },
        ],
        nearbyParks: [
            { name: "Karura Forest", icon: "🌿", type: "Nature Reserve" },
            { name: "UN Complex Grounds", icon: "🌳", type: "Green Space" },
        ],
    },
    {
        id: "nyali",
        name: "Nyali",
        city: "Mombasa",
        tagline: "Coastal luxury with ocean breezes",
        description: "Nyali is Mombasa's most prestigious residential area, stretching along the stunning Indian Ocean coastline. This upscale neighborhood is famous for its beautiful beaches, luxury resorts, and vibrant nightlife. Properties range from beachfront villas with private pools to modern apartments with ocean views. The area offers excellent international schools, world-class hospitals, and the popular Nyali Centre for shopping. With its tropical climate, swaying palm trees, and laid-back coastal lifestyle, Nyali represents the best of Kenya's beach living. It's increasingly popular with investors and retirees seeking a premium coastal lifestyle.",
        image: "/images/property-1.png",
        badge: "trending",
        avgPrice: "KES 85M",
        priceRange: "KES 20M – 200M",
        propertyCount: 35,
        safetyRating: 8,
        walkabilityScore: 6,
        transitScore: 5,
        vibes: ["Beachfront", "Tropical", "Resort-Style", "Investment", "Ocean Views", "Relaxed"],
        nearbySchools: [
            { name: "Aga Khan Academy Mombasa", icon: "🎓", type: "International" },
            { name: "Light Academy", icon: "🎓", type: "Private" },
        ],
        nearbyHospitals: [
            { name: "Aga Khan Hospital Mombasa", icon: "🏥", type: "University Hospital" },
            { name: "Pandya Memorial Hospital", icon: "🏥", type: "Private" },
        ],
        nearbyShopping: [
            { name: "Nyali Centre", icon: "🛒", type: "Mall" },
            { name: "City Mall Nyali", icon: "🛍️", type: "Mall" },
        ],
        nearbyDining: [
            { name: "Tamarind Restaurant", icon: "🍽️", type: "Seafood Fine Dining" },
            { name: "Moorings", icon: "🌊", type: "Waterfront Dining" },
            { name: "Café Mocha", icon: "☕", type: "Café" },
        ],
        nearbyParks: [
            { name: "Nyali Beach", icon: "🏖️", type: "Beach" },
            { name: "Haller Park", icon: "🦋", type: "Nature & Wildlife" },
            { name: "Mombasa Marine Park", icon: "🐠", type: "Marine Reserve" },
        ],
    },
    {
        id: "kitisuru",
        name: "Kitisuru",
        city: "Nairobi",
        tagline: "Eco-conscious living in green serenity",
        description: "Kitisuru is a serene, upscale suburb nestled in Nairobi's lush northern corridor. Known for its quiet streets, abundant greenery, and proximity to Karura Forest, it attracts nature lovers and environmentally conscious residents. The neighborhood has seen a surge in modern, eco-friendly developments featuring solar panels, rainwater harvesting, and sustainable architecture. Kitisuru offers a perfect blend of suburban tranquility and convenient access to Westlands and the UN area. Its growing reputation as a green living haven makes it increasingly popular with young families and expatriates.",
        image: "/images/property-6.png",
        badge: "upcoming",
        avgPrice: "KES 55M",
        priceRange: "KES 25M – 100M",
        propertyCount: 31,
        safetyRating: 9,
        walkabilityScore: 4,
        transitScore: 5,
        vibes: ["Eco-Friendly", "Green Living", "Suburban", "Family", "Quiet", "Sustainable"],
        nearbySchools: [
            { name: "Peponi School", icon: "🎓", type: "Private" },
            { name: "Brookhouse Runda", icon: "🎓", type: "International" },
        ],
        nearbyHospitals: [
            { name: "Gertrude's Hospital", icon: "🏥", type: "Children's Hospital" },
            { name: "AAR Hospital", icon: "🏥", type: "Private" },
        ],
        nearbyShopping: [
            { name: "Village Market", icon: "🛒", type: "Mall" },
            { name: "Two Rivers Mall", icon: "🛍️", type: "Mega Mall" },
        ],
        nearbyDining: [
            { name: "Lord Erroll", icon: "🍽️", type: "Fine Dining" },
            { name: "Zen Garden", icon: "🍜", type: "Japanese" },
        ],
        nearbyParks: [
            { name: "Karura Forest", icon: "🌿", type: "Nature Reserve" },
            { name: "Kitisuru Forest", icon: "🌳", type: "Green Space" },
        ],
    },
];

export default function NeighborhoodsPage() {
    const [selectedCity, setSelectedCity] = useState<string>("All");
    const [selectedNeighborhood, setSelectedNeighborhood] = useState<NeighborhoodData | null>(null);

    const cities = ["All", ...Array.from(new Set(neighborhoods.map((n) => n.city)))];

    const filteredNeighborhoods = useMemo(() => {
        if (selectedCity === "All") return neighborhoods;
        return neighborhoods.filter((n) => n.city === selectedCity);
    }, [selectedCity]);

    const getSafetyColor = (score: number) => {
        if (score >= 8) return "linear-gradient(90deg, #10b981, #34d399)";
        if (score >= 6) return "linear-gradient(90deg, #f59e0b, #fbbf24)";
        return "linear-gradient(90deg, #ef4444, #f87171)";
    };

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <span className={styles.heroLabel}>✦ Neighborhood Guides</span>
                    <h1 className={styles.heroTitle}>Explore Kenya&apos;s Best Neighborhoods</h1>
                    <p className={styles.heroSubtitle}>
                        Discover the perfect neighborhood for your lifestyle. From bustling urban hubs to serene coastal retreats — find where you belong.
                    </p>
                </div>
            </section>

            {/* Grid */}
            <section className={styles.gridSection}>
                <div className="container">
                    <div className={styles.sectionHeader}>
                        <h2 className={styles.sectionTitle}>
                            📍 {selectedCity === "All" ? "All Neighborhoods" : selectedCity}
                            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-tertiary)", marginLeft: "0.25rem" }}>
                                ({filteredNeighborhoods.length})
                            </span>
                        </h2>
                        <div className={styles.cityFilter}>
                            {cities.map((city) => (
                                <button
                                    key={city}
                                    className={`${styles.cityBtn} ${selectedCity === city ? styles.cityBtnActive : ""}`}
                                    onClick={() => setSelectedCity(city)}
                                >
                                    {city}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={styles.grid}>
                        {filteredNeighborhoods.map((n) => (
                            <div
                                key={n.id}
                                className={styles.card}
                                onClick={() => setSelectedNeighborhood(n)}
                            >
                                <Image
                                    src={n.image}
                                    alt={n.name}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                    className={styles.cardImage}
                                />

                                {/* Badge */}
                                {n.badge && (
                                    <div className={`${styles.cardBadge} ${n.badge === "popular" ? styles.cardBadgePopular : n.badge === "trending" ? styles.cardBadgeTrending : styles.cardBadgeUpcoming}`}>
                                        {n.badge === "popular" ? "🔥 Popular" : n.badge === "trending" ? "📈 Trending" : "🚀 Upcoming"}
                                    </div>
                                )}

                                <div className={styles.cardOverlay}>
                                    <span className={styles.cardCity}>{n.city}</span>
                                    <h3 className={styles.cardName}>{n.name}</h3>
                                    <p className={styles.cardTagline}>{n.tagline}</p>
                                    <div className={styles.cardStats}>
                                        <div className={styles.cardStat}>
                                            <strong>{n.propertyCount}</strong> listings
                                        </div>
                                        <div className={styles.cardStat}>
                                            From <strong>{n.avgPrice}</strong>
                                        </div>
                                        <div className={styles.cardStat}>
                                            ⭐ <strong>{n.safetyRating}/10</strong> safety
                                        </div>
                                    </div>
                                    <div className={styles.cardExplore}>
                                        Explore neighborhood
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.ctaSection}>
                <div className="container">
                    <div className={styles.ctaCard}>
                        <span className={styles.heroLabel} style={{ marginBottom: "0.5rem" }}>✦ Find Your Perfect Area</span>
                        <h2 className={styles.ctaTitle}>Not Sure Where to Live?</h2>
                        <p className={styles.ctaSubtitle}>
                            Browse our curated property collection and find the perfect home in these amazing neighborhoods.
                        </p>
                        <Link href="/properties" className="btn btn-primary btn-lg" style={{ position: "relative" }}>
                            Browse All Properties
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* Detail Modal */}
            {selectedNeighborhood && (
                <div className={styles.modalOverlay} onClick={() => setSelectedNeighborhood(null)}>
                    <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                        {/* Modal Hero Image */}
                        <div className={styles.modalImage}>
                            <Image
                                src={selectedNeighborhood.image}
                                alt={selectedNeighborhood.name}
                                fill
                                sizes="720px"
                                style={{ objectFit: "cover" }}
                            />
                            <div className={styles.modalImageOverlay}>
                                <span className={styles.modalCityLabel}>{selectedNeighborhood.city}</span>
                                <h2 className={styles.modalTitle}>{selectedNeighborhood.name}</h2>
                            </div>
                            <button className={styles.modalClose} onClick={() => setSelectedNeighborhood(null)}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </button>
                        </div>

                        <div className={styles.modalBody}>
                            {/* Description */}
                            <p className={styles.modalDescription}>{selectedNeighborhood.description}</p>

                            {/* Vibe Tags */}
                            <div className={styles.vibeTags}>
                                {selectedNeighborhood.vibes.map((v) => (
                                    <span key={v} className={styles.vibeTag}>{v}</span>
                                ))}
                            </div>

                            {/* Stats Grid */}
                            <div className={styles.modalStatsGrid}>
                                <div className={styles.modalStat}>
                                    <span className={styles.modalStatValue}>{selectedNeighborhood.avgPrice}</span>
                                    <span className={styles.modalStatLabel}>Avg. Price</span>
                                </div>
                                <div className={styles.modalStat}>
                                    <span className={styles.modalStatValue}>{selectedNeighborhood.propertyCount}</span>
                                    <span className={styles.modalStatLabel}>Listings</span>
                                </div>
                                <div className={styles.modalStat}>
                                    <span className={styles.modalStatValue}>{selectedNeighborhood.walkabilityScore}/10</span>
                                    <span className={styles.modalStatLabel}>Walkability</span>
                                </div>
                                <div className={styles.modalStat}>
                                    <span className={styles.modalStatValue}>{selectedNeighborhood.transitScore}/10</span>
                                    <span className={styles.modalStatLabel}>Transit</span>
                                </div>
                            </div>

                            {/* Safety Rating */}
                            <div style={{ marginBottom: "1.5rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)" }}>🛡️ Safety Rating</span>
                                    <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-heading)" }}>{selectedNeighborhood.safetyRating}/10</span>
                                </div>
                                <div className={styles.safetyBar}>
                                    <div className={styles.safetyFill} style={{ width: `${selectedNeighborhood.safetyRating * 10}%`, background: getSafetyColor(selectedNeighborhood.safetyRating) }} />
                                </div>
                            </div>

                            {/* Price Range */}
                            <div style={{ padding: "0.85rem", background: "rgba(212, 160, 23, 0.06)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--gold-500)", marginBottom: "1.5rem" }}>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold-600)", marginBottom: "0.2rem" }}>💰 Price Range</div>
                                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--text-heading)" }}>{selectedNeighborhood.priceRange}</div>
                            </div>

                            {/* Nearby Places */}
                            {[
                                { title: "🎓 Schools & Education", data: selectedNeighborhood.nearbySchools },
                                { title: "🏥 Healthcare", data: selectedNeighborhood.nearbyHospitals },
                                { title: "🛒 Shopping", data: selectedNeighborhood.nearbyShopping },
                                { title: "🍽️ Dining & Cafés", data: selectedNeighborhood.nearbyDining },
                                { title: "🌿 Parks & Recreation", data: selectedNeighborhood.nearbyParks },
                            ].map(({ title, data }) => (
                                <div key={title} className={styles.nearbySection}>
                                    <h4 className={styles.nearbySectionTitle}>{title}</h4>
                                    <div className={styles.nearbyGrid}>
                                        {data.map((place) => (
                                            <div key={place.name} className={styles.nearbyItem}>
                                                <div className={styles.nearbyIcon}>{place.icon}</div>
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: "0.82rem", color: "var(--text-primary)" }}>{place.name}</div>
                                                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>{place.type}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            {/* CTA */}
                            <div className={styles.modalCTA}>
                                <Link href={`/properties?city=${selectedNeighborhood.city}&neighborhood=${selectedNeighborhood.name}`} className="btn btn-primary btn-lg">
                                    View Properties in {selectedNeighborhood.name}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
