"use client";
import Link from "next/link";
import styles from "./page.module.css";

export default function AboutPage() {
    return (
        <div className={styles.page}>
            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <span className={styles.heroTag}>ABOUT US</span>
                    <h1 className={styles.heroTitle}>
                        Redefining Real Estate<br />
                        <span className={styles.heroAccent}>in East Africa</span>
                    </h1>
                    <p className={styles.heroSub}>
                        EstateVue connects buyers, renters, and agents with premium properties
                        across Kenya. Our platform combines cutting-edge technology with local
                        expertise to make your property journey seamless.
                    </p>
                </div>
            </section>

            {/* Mission Section */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.missionGrid}>
                        <div className={styles.missionCard}>
                            <div className={styles.missionIcon}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4M12 8h.01" />
                                </svg>
                            </div>
                            <h3 className={styles.missionTitle}>Our Mission</h3>
                            <p className={styles.missionText}>
                                To democratize access to quality real estate by providing a
                                transparent, efficient, and user-friendly platform that empowers
                                buyers, sellers, and agents alike.
                            </p>
                        </div>
                        <div className={styles.missionCard}>
                            <div className={styles.missionIcon}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                            </div>
                            <h3 className={styles.missionTitle}>Our Vision</h3>
                            <p className={styles.missionText}>
                                To be East Africa&apos;s most trusted real estate platform, known
                                for innovation, integrity, and exceptional service in every
                                property transaction.
                            </p>
                        </div>
                        <div className={styles.missionCard}>
                            <div className={styles.missionIcon}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                </svg>
                            </div>
                            <h3 className={styles.missionTitle}>Our Values</h3>
                            <p className={styles.missionText}>
                                Transparency, trust, and technology drive everything we do.
                                We believe every person deserves access to their dream home with
                                honest guidance along the way.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.statsSection}>
                <div className={styles.container}>
                    <div className={styles.statsGrid}>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>2,500+</div>
                            <div className={styles.statLabel}>Premium Listings</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>150+</div>
                            <div className={styles.statLabel}>Verified Agents</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>10K+</div>
                            <div className={styles.statLabel}>Happy Clients</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statNumber}>6</div>
                            <div className={styles.statLabel}>Cities Covered</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Why Choose Us */}
            <section className={styles.section}>
                <div className={styles.container}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionTag}>WHY ESTATEVUE</span>
                        <h2 className={styles.sectionTitle}>Why Thousands Trust Us</h2>
                        <p className={styles.sectionSub}>
                            We combine local market expertise with modern technology to deliver
                            an unmatched property experience.
                        </p>
                    </div>

                    <div className={styles.featureGrid}>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h4 className={styles.featureTitle}>Verified Agents</h4>
                            <p className={styles.featureText}>
                                Every agent on our platform is verified and vetted to ensure
                                you work with trusted professionals.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" />
                                    <path d="M3 9h18M9 21V9" />
                                </svg>
                            </div>
                            <h4 className={styles.featureTitle}>Premium Listings</h4>
                            <p className={styles.featureText}>
                                Curated selection of high-quality properties with detailed
                                descriptions, professional photos, and virtual tours.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h4 className={styles.featureTitle}>Direct Communication</h4>
                            <p className={styles.featureText}>
                                Connect directly with property agents through our integrated
                                messaging and inquiry system.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" />
                                    <polyline points="12 6 12 12 16 14" />
                                </svg>
                            </div>
                            <h4 className={styles.featureTitle}>24/7 Availability</h4>
                            <p className={styles.featureText}>
                                Browse properties anytime, anywhere. Our platform is always
                                available for your property search.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                    <circle cx="12" cy="10" r="3" />
                                </svg>
                            </div>
                            <h4 className={styles.featureTitle}>Local Expertise</h4>
                            <p className={styles.featureText}>
                                Deep knowledge of Kenyan neighborhoods, pricing trends, and
                                market dynamics to guide your decisions.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <div className={styles.featureIconWrap}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4" />
                                    <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                                </svg>
                            </div>
                            <h4 className={styles.featureTitle}>Transparent Process</h4>
                            <p className={styles.featureText}>
                                Clear pricing, honest listings, and guided processes from
                                search to closing — no hidden surprises.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.ctaSection}>
                <div className={styles.container}>
                    <div className={styles.ctaContent}>
                        <h2 className={styles.ctaTitle}>Ready to Find Your Dream Home?</h2>
                        <p className={styles.ctaSub}>
                            Join thousands of satisfied clients who found their perfect property
                            through EstateVue.
                        </p>
                        <div className={styles.ctaButtons}>
                            <Link href="/properties" className={styles.ctaBtnPrimary}>
                                Browse Properties
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </Link>
                            <Link href="/agents" className={styles.ctaBtnSecondary}>
                                Find an Agent
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
