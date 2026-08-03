"use client";
import Image from "next/image";
import Link from "next/link";
import { sampleProperties, formatPrice } from "@/lib/data";
import PropertyCard from "@/components/property/PropertyCard";
import ScrollReveal from "@/components/ui/ScrollReveal";
import styles from "./page.module.css";

export default function Home() {
  const featuredProperties = sampleProperties.filter((p) => p.isFeatured);

  return (
    <>
      {/* ========== HERO ========== */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <Image
            src="/images/hero-bg.png"
            alt="Luxury modern villa"
            fill
            priority
            quality={90}
            className={styles.heroBgImage}
          />
          <div className={styles.heroOverlay} />
        </div>

        <div className={styles.heroContent}>
          <span className={styles.heroLabel}>Welcome to EstateVue</span>
          <h1 className={styles.heroTitle}>
            Find Your Dream<br />
            <span className={styles.heroAccent}>Luxury Home</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Discover exclusive properties in prime locations across Kenya.
            Your perfect home awaits.
          </p>

          {/* Search Bar */}
          <div className={styles.searchBar}>
            <div className={styles.searchField}>
              <label>Location</label>
              <select defaultValue="">
                <option value="" disabled>Select location</option>
                <option>Nairobi</option>
                <option>Mombasa</option>
                <option>Kisumu</option>
                <option>Nakuru</option>
              </select>
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchField}>
              <label>Property Type</label>
              <select defaultValue="">
                <option value="" disabled>All types</option>
                <option>Apartment</option>
                <option>House</option>
                <option>Villa</option>
                <option>Townhouse</option>
                <option>Land</option>
              </select>
            </div>
            <div className={styles.searchDivider} />
            <div className={styles.searchField}>
              <label>Price Range</label>
              <select defaultValue="">
                <option value="" disabled>Any price</option>
                <option>Under KES 10M</option>
                <option>KES 10M - 30M</option>
                <option>KES 30M - 60M</option>
                <option>KES 60M - 100M</option>
                <option>Over KES 100M</option>
              </select>
            </div>
            <Link href="/properties" className={styles.searchButton}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
              Search
            </Link>
          </div>

          <div className={styles.heroStats}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>2,500+</span>
              <span className={styles.heroStatLabel}>Properties</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>1,200+</span>
              <span className={styles.heroStatLabel}>Happy Clients</span>
            </div>
            <div className={styles.heroStatDivider} />
            <div className={styles.heroStat}>
              <span className={styles.heroStatNumber}>85+</span>
              <span className={styles.heroStatLabel}>Expert Agents</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========== FEATURED PROPERTIES ========== */}
      <section className={`section ${styles.featured}`}>
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-label">✦ Curated Selection</span>
              <h2 className="section-title">Featured Properties</h2>
              <p className="section-subtitle">
                Hand-picked premium listings, carefully selected for their exceptional value and prime locations
              </p>
            </div>
          </ScrollReveal>

          <div className={styles.propertyGrid}>
            {featuredProperties.map((property, i) => (
              <ScrollReveal key={property.id} delay={i * 100}>
                <PropertyCard property={property} />
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal>
            <div className={styles.viewAllWrapper}>
              <Link href="/properties" className="btn btn-outline btn-lg">
                View All Properties
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========== CATEGORIES ========== */}
      <section className={`section ${styles.categories}`}>
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-label">✦ Browse by Category</span>
              <h2 className="section-title">Explore Property Types</h2>
              <p className="section-subtitle">Find exactly what you&apos;re looking for from our diverse collection of property types</p>
            </div>
          </ScrollReveal>

          <div className={styles.categoryGrid}>
            {[
              { name: "Apartments", count: 430, icon: "🏢", color: "#3b82f6" },
              { name: "Houses", count: 280, icon: "🏠", color: "#10b981" },
              { name: "Villas", count: 150, icon: "🏛️", color: "#d4a017" },
              { name: "Land", count: 95, icon: "🌿", color: "#8b5cf6" },
              { name: "Commercial", count: 120, icon: "🏗️", color: "#ef4444" },
              { name: "Townhouses", count: 200, icon: "🏘️", color: "#06b6d4" },
            ].map((cat, i) => (
              <ScrollReveal key={cat.name} delay={i * 80} direction="up">
                <Link href={`/properties?propertyType=${cat.name.toLowerCase()}`} className={styles.categoryCard}>
                  <div className={styles.categoryIcon} style={{ background: `${cat.color}15` }}>
                    <span>{cat.icon}</span>
                  </div>
                  <h3>{cat.name}</h3>
                  <p>{cat.count} Properties</p>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section className={`section ${styles.howItWorks}`}>
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-label">✦ Simple Process</span>
              <h2 className="section-title">How It Works</h2>
              <p className="section-subtitle">Finding your dream property has never been easier</p>
            </div>
          </ScrollReveal>

          <div className={styles.stepsGrid}>
            {[
              {
                step: "01",
                title: "Search Properties",
                desc: "Browse thousands of listings with advanced filters to find properties that match your criteria.",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                ),
              },
              {
                step: "02",
                title: "Schedule a Viewing",
                desc: "Connect with our expert agents and schedule in-person or virtual tours of your favorite properties.",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                ),
              },
              {
                step: "03",
                title: "Close the Deal",
                desc: "Our team guides you through every step of the buying or renting process until you get your keys.",
                icon: (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                ),
              },
            ].map((item, i) => (
              <ScrollReveal key={item.step} delay={i * 150} direction="up">
                <div className={styles.stepCard}>
                  <div className={styles.stepNumber}>{item.step}</div>
                  <div className={styles.stepIcon}>{item.icon}</div>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ========== CTA ========== */}
      <section className={styles.cta}>
        <div className="container">
          <ScrollReveal>
            <div className={styles.ctaContent}>
              <span className="section-label" style={{ color: "var(--gold-300)" }}>✦ For Property Owners</span>
              <h2 className={styles.ctaTitle}>Ready to Sell or Rent Your Property?</h2>
              <p className={styles.ctaSubtitle}>
                Join thousands of property owners who trust EstateVue to connect them with qualified buyers and tenants.
              </p>
              <div className={styles.ctaActions}>
                <Link href="#" className="btn btn-primary btn-lg">
                  List Your Property
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </Link>
                <Link href="#" className={`btn ${styles.ctaOutlineBtn} btn-lg`}>
                  Learn More
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ========== TESTIMONIALS ========== */}
      <section className={`section ${styles.testimonials}`}>
        <div className="container">
          <ScrollReveal>
            <div className="section-header">
              <span className="section-label">✦ What Our Clients Say</span>
              <h2 className="section-title">Trusted by Thousands</h2>
            </div>
          </ScrollReveal>

          <div className={styles.testimonialGrid}>
            {[
              {
                name: "David Ochieng",
                role: "Homeowner",
                text: "EstateVue made finding our family home an absolute breeze. The agents were professional, and the whole process was transparent from start to finish.",
                rating: 5,
              },
              {
                name: "Amina Hassan",
                role: "Investor",
                text: "As a real estate investor, I rely on EstateVue for premium listings. Their platform is intuitive, and the property data provided is exceptional.",
                rating: 5,
              },
              {
                name: "James Mwangi",
                role: "First-time Buyer",
                text: "I was nervous about buying my first property, but the EstateVue team guided me every step of the way. Couldn&apos;t be happier with my new apartment!",
                rating: 5,
              },
            ].map((review, i) => (
              <ScrollReveal key={i} delay={i * 120} direction="up">
                <div className={styles.testimonialCard}>
                  <div className={styles.testimonialStars}>
                    {"★★★★★".split("").map((star, idx) => (
                      <span key={idx}>★</span>
                    ))}
                  </div>
                  <p className={styles.testimonialText}>&ldquo;{review.text}&rdquo;</p>
                  <div className={styles.testimonialAuthor}>
                    <div className={styles.testimonialAvatar}>
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <strong>{review.name}</strong>
                      <span>{review.role}</span>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
