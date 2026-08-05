"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getApprovedAgents, UserProfile, getPropertiesByAgent, FirestoreProperty } from "@/lib/firestore";
import styles from "./page.module.css";

interface DisplayAgent {
    id: string;
    name: string;
    role: string;
    image: string;
    phone: string;
    email: string;
    bio: string;
    specialization: string[];
    areas: string[];
    experience: number;
    propertiesSold: number;
    rating: number;
    reviews: number;
    languages: string[];
    isReal: boolean;
    properties?: FirestoreProperty[];
}

const sampleAgents: DisplayAgent[] = [
    {
        id: "sample-1",
        name: "Sarah Kimani",
        role: "Senior Real Estate Agent",
        image: "/images/agent-avatar.png",
        phone: "+254 712 345 678",
        email: "sarah@estatevue.com",
        bio: "With over 8 years of experience in Kenya's luxury real estate market, Sarah has helped hundreds of families find their dream homes.",
        specialization: ["Luxury Villas", "Penthouses", "Waterfront Properties"],
        areas: ["Karen", "Runda", "Muthaiga"],
        experience: 8,
        propertiesSold: 245,
        rating: 4.9,
        reviews: 127,
        languages: ["English", "Swahili"],
        isReal: false,
    },
    {
        id: "sample-2",
        name: "James Ochieng",
        role: "Commercial Property Specialist",
        image: "/images/agent-1.png",
        phone: "+254 723 456 789",
        email: "james@estatevue.com",
        bio: "James brings a decade of expertise in commercial real estate. From office spaces to retail properties, he understands businesses.",
        specialization: ["Commercial", "Office Spaces", "Retail Properties"],
        areas: ["Westlands", "Upper Hill", "CBD"],
        experience: 10,
        propertiesSold: 180,
        rating: 4.8,
        reviews: 98,
        languages: ["English", "Swahili", "Luo"],
        isReal: false,
    },
    {
        id: "sample-3",
        name: "Grace Wanjiku",
        role: "Residential Sales Expert",
        image: "/images/agent-2.png",
        phone: "+254 734 567 890",
        email: "grace@estatevue.com",
        bio: "Grace is passionate about connecting families with their perfect homes. Her warm personality makes her a top choice for first-time buyers.",
        specialization: ["Family Homes", "Apartments", "Townhouses"],
        areas: ["Kilimani", "Lavington", "Kileleshwa"],
        experience: 6,
        propertiesSold: 156,
        rating: 4.9,
        reviews: 112,
        languages: ["English", "Swahili", "Kikuyu"],
        isReal: false,
    },
];

export default function AgentsPage() {
    const [agents, setAgents] = useState<DisplayAgent[]>(sampleAgents);
    const [loading, setLoading] = useState(true);
    const [agentProperties, setAgentProperties] = useState<Record<string, FirestoreProperty[]>>({});

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const firestoreAgents = await getApprovedAgents();

                // Convert Firestore agents to DisplayAgent format
                const realAgents: DisplayAgent[] = firestoreAgents.map((agent: UserProfile) => ({
                    id: agent.uid,
                    name: agent.displayName || "Agent",
                    role: agent.specialization || "Real Estate Agent",
                    image: agent.avatar || "/images/agent-avatar.png",
                    phone: agent.phone || "",
                    email: agent.email || "",
                    bio: agent.bio || "Experienced real estate professional ready to help you find your dream property.",
                    specialization: agent.specialization ? [agent.specialization] : ["Real Estate"],
                    areas: agent.location ? [agent.location] : ["Nairobi"],
                    experience: agent.experience ? parseInt(agent.experience) || 0 : 0,
                    propertiesSold: agent.propertiesCount || 0,
                    rating: agent.rating || 4.5,
                    reviews: agent.totalReviews || 0,
                    languages: ["English", "Swahili"],
                    isReal: true,
                }));

                // Fetch properties for each real agent
                const propMap: Record<string, FirestoreProperty[]> = {};
                for (const agent of firestoreAgents) {
                    try {
                        const props = await getPropertiesByAgent(agent.uid);
                        propMap[agent.uid] = props.filter(p => p.status === "active");
                    } catch {
                        propMap[agent.uid] = [];
                    }
                }
                setAgentProperties(propMap);

                // Real agents first, then sample agents
                setAgents([...realAgents, ...sampleAgents]);
            } catch (err) {
                console.error("Failed to fetch agents:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAgents();
    }, []);

    // Count total real agents and properties
    const realAgentCount = agents.filter(a => a.isReal).length;
    const totalProperties = Object.values(agentProperties).reduce((sum, props) => sum + props.length, 0);

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className="container">
                    <span className={styles.heroLabel}>✦ Our Team</span>
                    <h1 className={styles.heroTitle}>Meet Our Expert Agents</h1>
                    <p className={styles.heroSubtitle}>
                        Our dedicated team of licensed professionals is here to guide you through
                        every step of your real estate journey
                    </p>
                    <div className={styles.heroStats}>
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{realAgentCount > 0 ? `${realAgentCount + 80}+` : "85+"}</span>
                            <span className={styles.statLabel}>Licensed Agents</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>{totalProperties > 0 ? `${totalProperties + 1500}+` : "1,600+"}</span>
                            <span className={styles.statLabel}>Properties Listed</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>4.9</span>
                            <span className={styles.statLabel}>Average Rating</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>98%</span>
                            <span className={styles.statLabel}>Client Satisfaction</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agent Grid */}
            <section className={styles.agentsSection}>
                <div className="container">
                    {loading && (
                        <div style={{ textAlign: "center", padding: "2rem 0", color: "var(--text-tertiary)", fontSize: "0.85rem" }}>
                            <div style={{ width: 36, height: 36, border: "3px solid var(--border-color)", borderTopColor: "var(--gold-500)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 0.5rem" }} />
                            Loading agents...
                        </div>
                    )}
                    <div className={styles.agentGrid}>
                        {agents.map((agent, index) => (
                            <div key={agent.id} className={styles.agentCard} style={{ animationDelay: `${index * 0.1}s` }}>
                                {/* Real agent badge */}
                                {agent.isReal && (
                                    <div style={{
                                        position: "absolute", top: "12px", left: "12px", zIndex: 5,
                                        padding: "0.25rem 0.6rem", borderRadius: "50px",
                                        background: "rgba(16,185,129,0.9)", color: "#fff",
                                        fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.5px",
                                        backdropFilter: "blur(8px)",
                                    }}>
                                        ✓ VERIFIED
                                    </div>
                                )}

                                {/* Image */}
                                <div className={styles.cardImageWrapper}>
                                    <Image
                                        src={agent.image}
                                        alt={agent.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className={styles.cardImage}
                                        style={{ objectFit: agent.isReal && agent.image !== "/images/agent-avatar.png" ? "cover" : "cover" }}
                                    />
                                    <div className={styles.cardOverlay}>
                                        <div className={styles.socialLinks}>
                                            {agent.phone && (
                                                <a href={`tel:${agent.phone}`} className={styles.socialLink} aria-label="Call">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                                </a>
                                            )}
                                            {agent.email && (
                                                <a href={`mailto:${agent.email}`} className={styles.socialLink} aria-label="Email">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                                </a>
                                            )}
                                            {agent.phone && (
                                                <a href={`https://wa.me/${agent.phone.replace(/\s+/g, "").replace("+", "")}`} className={styles.socialLink} aria-label="WhatsApp">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.ratingBadge}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                        {agent.rating}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={styles.cardContent}>
                                    <h3 className={styles.cardName}>{agent.name}</h3>
                                    <p className={styles.cardRole}>{agent.role}</p>

                                    <div className={styles.cardMeta}>
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaValue}>{agent.experience || "New"}</span>
                                            <span className={styles.metaLabel}>Yrs Exp</span>
                                        </div>
                                        <div className={styles.metaDivider} />
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaValue}>{agent.isReal ? (agentProperties[agent.id]?.length || 0) : agent.propertiesSold}</span>
                                            <span className={styles.metaLabel}>{agent.isReal ? "Listings" : "Sold"}</span>
                                        </div>
                                        <div className={styles.metaDivider} />
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaValue}>{agent.reviews}</span>
                                            <span className={styles.metaLabel}>Reviews</span>
                                        </div>
                                    </div>

                                    <div className={styles.cardSpecializations}>
                                        {agent.specialization.map((spec) => (
                                            <span key={spec} className={styles.specBadge}>{spec}</span>
                                        ))}
                                    </div>

                                    <div className={styles.cardAreas}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        <span>{agent.areas.join(" · ")}</span>
                                    </div>

                                    {/* Show agent's active properties */}
                                    {agent.isReal && agentProperties[agent.id]?.length > 0 && (
                                        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid var(--border-light, #e5e7eb)" }}>
                                            <p style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.4rem" }}>
                                                Active Listings ({agentProperties[agent.id].length})
                                            </p>
                                            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                                                {agentProperties[agent.id].slice(0, 3).map((prop) => (
                                                    <Link
                                                        key={prop.id}
                                                        href={`/properties/${prop.id}`}
                                                        style={{
                                                            display: "flex", alignItems: "center", gap: "0.5rem",
                                                            padding: "0.4rem 0.5rem", borderRadius: "var(--radius-sm, 6px)",
                                                            background: "var(--bg-tertiary, #f9fafb)", textDecoration: "none",
                                                            transition: "background 0.15s", fontSize: "0.78rem",
                                                        }}
                                                    >
                                                        {prop.images?.[0] && (
                                                            <Image src={prop.images[0]} alt="" width={36} height={36}
                                                                style={{ borderRadius: "4px", objectFit: "cover" }} />
                                                        )}
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                                {prop.title}
                                                            </div>
                                                            <div style={{ fontSize: "0.7rem", color: "var(--gold-600)" }}>
                                                                KES {prop.price?.toLocaleString()}
                                                            </div>
                                                        </div>
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                                                    </Link>
                                                ))}
                                                {agentProperties[agent.id].length > 3 && (
                                                    <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textAlign: "center", paddingTop: "0.2rem" }}>
                                                        +{agentProperties[agent.id].length - 3} more listings
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <Link href={agent.isReal ? `/properties?agentId=${agent.id}` : `/agents/${agent.id}`} className={styles.viewProfileBtn}>
                                        {agent.isReal ? "View Listings" : "View Profile"}
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.cta}>
                <div className="container">
                    <div className={styles.ctaContent}>
                        <span className={styles.ctaLabel}>✦ Join Our Team</span>
                        <h2 className={styles.ctaTitle}>Are You a Real Estate Professional?</h2>
                        <p className={styles.ctaSubtitle}>
                            Join EstateVue&apos;s growing network of top agents. Access premium listings,
                            powerful tools, and connect with qualified buyers and sellers.
                        </p>
                        <div className={styles.ctaActions}>
                            <Link href="/auth/signup" className="btn btn-primary btn-lg">
                                Apply as an Agent
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                            <Link href="/about" className={`btn ${styles.ctaOutline} btn-lg`}>
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
