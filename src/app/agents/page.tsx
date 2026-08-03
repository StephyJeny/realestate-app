import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
    title: "Our Agents — EstateVue",
    description: "Meet our team of expert real estate agents. Experienced professionals dedicated to finding your perfect property.",
};

interface Agent {
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
}

const agents: Agent[] = [
    {
        id: "1",
        name: "Sarah Kimani",
        role: "Senior Real Estate Agent",
        image: "/images/agent-avatar.png",
        phone: "+254 712 345 678",
        email: "sarah@estatevue.com",
        bio: "With over 8 years of experience in Kenya's luxury real estate market, Sarah has helped hundreds of families find their dream homes. She specializes in high-end properties in Nairobi's most sought-after neighborhoods.",
        specialization: ["Luxury Villas", "Penthouses", "Waterfront Properties"],
        areas: ["Karen", "Runda", "Muthaiga"],
        experience: 8,
        propertiesSold: 245,
        rating: 4.9,
        reviews: 127,
        languages: ["English", "Swahili"],
    },
    {
        id: "2",
        name: "James Ochieng",
        role: "Commercial Property Specialist",
        image: "/images/agent-1.png",
        phone: "+254 723 456 789",
        email: "james@estatevue.com",
        bio: "James brings a decade of expertise in commercial real estate. From office spaces to retail properties, he understands the business landscape and helps investors maximize their returns.",
        specialization: ["Commercial", "Office Spaces", "Retail Properties"],
        areas: ["Westlands", "Upper Hill", "CBD"],
        experience: 10,
        propertiesSold: 180,
        rating: 4.8,
        reviews: 98,
        languages: ["English", "Swahili", "Luo"],
    },
    {
        id: "3",
        name: "Grace Wanjiku",
        role: "Residential Sales Expert",
        image: "/images/agent-2.png",
        phone: "+254 734 567 890",
        email: "grace@estatevue.com",
        bio: "Grace is passionate about connecting families with their perfect homes. Her warm personality and deep knowledge of residential neighborhoods make her a top choice for first-time buyers and growing families.",
        specialization: ["Family Homes", "Apartments", "Townhouses"],
        areas: ["Kilimani", "Lavington", "Kileleshwa"],
        experience: 6,
        propertiesSold: 156,
        rating: 4.9,
        reviews: 112,
        languages: ["English", "Swahili", "Kikuyu"],
    },
    {
        id: "4",
        name: "Michael Mwenda",
        role: "Senior Property Consultant",
        image: "/images/agent-3.png",
        phone: "+254 745 678 901",
        email: "michael@estatevue.com",
        bio: "A seasoned professional with 15 years in real estate, Michael is known for his negotiation skills and market insight. He specializes in investment properties and has helped numerous international clients enter the Kenyan market.",
        specialization: ["Investment Properties", "Land", "Development Sites"],
        areas: ["Nairobi", "Mombasa", "Nakuru"],
        experience: 15,
        propertiesSold: 320,
        rating: 4.9,
        reviews: 189,
        languages: ["English", "Swahili", "French"],
    },
    {
        id: "5",
        name: "Amina Nyambura",
        role: "Luxury Property Specialist",
        image: "/images/agent-4.png",
        phone: "+254 756 789 012",
        email: "amina@estatevue.com",
        bio: "Amina specializes in luxury and ultra-premium properties. With an eye for design and architecture, she curates experiences for discerning clients seeking exceptional living spaces across East Africa.",
        specialization: ["Luxury Homes", "Smart Homes", "Eco Properties"],
        areas: ["Kitisuru", "Spring Valley", "Rosslyn"],
        experience: 7,
        propertiesSold: 130,
        rating: 5.0,
        reviews: 86,
        languages: ["English", "Swahili"],
    },
    {
        id: "6",
        name: "Daniel Kiprop",
        role: "Rental Market Analyst",
        image: "/images/agent-5.png",
        phone: "+254 767 890 123",
        email: "daniel@estatevue.com",
        bio: "Daniel is the go-to expert for rental properties. Whether you're a landlord looking to maximize occupancy or a tenant seeking the perfect apartment, Daniel's market knowledge ensures the best deals.",
        specialization: ["Rental Properties", "Apartments", "Serviced Units"],
        areas: ["Westlands", "Kilimani", "Riverside"],
        experience: 5,
        propertiesSold: 210,
        rating: 4.8,
        reviews: 145,
        languages: ["English", "Swahili", "Kalenjin"],
    },
    {
        id: "7",
        name: "Patricia Akinyi",
        role: "Head of Sales",
        image: "/images/agent-6.png",
        phone: "+254 778 901 234",
        email: "patricia@estatevue.com",
        bio: "As Head of Sales, Patricia leads our team with vision and dedication. Her strategic approach to property marketing and deep industry connections have earned her multiple awards in East African real estate.",
        specialization: ["Executive Homes", "Gated Communities", "New Developments"],
        areas: ["Karen", "Runda", "Nyali"],
        experience: 12,
        propertiesSold: 410,
        rating: 5.0,
        reviews: 234,
        languages: ["English", "Swahili", "Luo", "French"],
    },
];

export default function AgentsPage() {
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
                            <span className={styles.statNumber}>85+</span>
                            <span className={styles.statLabel}>Licensed Agents</span>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.stat}>
                            <span className={styles.statNumber}>1,600+</span>
                            <span className={styles.statLabel}>Properties Sold</span>
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
                    <div className={styles.agentGrid}>
                        {agents.map((agent, index) => (
                            <div key={agent.id} className={styles.agentCard} style={{ animationDelay: `${index * 0.1}s` }}>
                                {/* Image */}
                                <div className={styles.cardImageWrapper}>
                                    <Image
                                        src={agent.image}
                                        alt={agent.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        className={styles.cardImage}
                                    />
                                    <div className={styles.cardOverlay}>
                                        <div className={styles.socialLinks}>
                                            <a href={`tel:${agent.phone}`} className={styles.socialLink} aria-label="Call">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                            </a>
                                            <a href={`mailto:${agent.email}`} className={styles.socialLink} aria-label="Email">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                            </a>
                                            <a href={`https://wa.me/${agent.phone.replace(/\s+/g, "").replace("+", "")}`} className={styles.socialLink} aria-label="WhatsApp">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                            </a>
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
                                            <span className={styles.metaValue}>{agent.experience}</span>
                                            <span className={styles.metaLabel}>Yrs Exp</span>
                                        </div>
                                        <div className={styles.metaDivider} />
                                        <div className={styles.metaItem}>
                                            <span className={styles.metaValue}>{agent.propertiesSold}</span>
                                            <span className={styles.metaLabel}>Sold</span>
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

                                    <Link href={`/agents/${agent.id}`} className={styles.viewProfileBtn}>
                                        View Profile
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
                            <Link href="#" className="btn btn-primary btn-lg">
                                Apply as an Agent
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                            </Link>
                            <Link href="#" className={`btn ${styles.ctaOutline} btn-lg`}>
                                Learn More
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
