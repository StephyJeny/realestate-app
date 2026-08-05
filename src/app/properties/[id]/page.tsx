"use client";
import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { sampleProperties, formatPriceFull } from "@/lib/data";
import { sendInquiry, getPropertyById, FirestoreProperty } from "@/lib/firestore";
import { sendInquiryEmail } from "@/lib/email";
import { useAuth } from "@/context/AuthContext";
import PropertyCard from "@/components/property/PropertyCard";
import toast from "react-hot-toast";
import styles from "./page.module.css";

interface Props {
    params: Promise<{ id: string }>;
}

export default function PropertyDetailPage({ params }: Props) {
    const { id } = use(params);
    const { user, userProfile } = useAuth();

    // Try sample data first, then Firestore
    const sampleProp = sampleProperties.find((p) => p.id === id);
    const [firestoreProp, setFirestoreProp] = useState<FirestoreProperty | null>(null);
    const [activeImage, setActiveImage] = useState(0);
    const [showInquiry, setShowInquiry] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Inquiry form state
    const [inquiryForm, setInquiryForm] = useState({
        name: "",
        email: "",
        phone: "",
        message: "I'm interested in this property...",
        type: "inquiry" as "inquiry" | "viewing" | "offer",
    });

    // Load Firestore property if not found in samples
    useEffect(() => {
        if (!sampleProp) {
            getPropertyById(id).then(setFirestoreProp).catch(console.error);
        }
    }, [id, sampleProp]);

    // Auto-fill form with user info when user logs in or form opens
    useEffect(() => {
        if (user && userProfile) {
            setInquiryForm((prev) => ({
                ...prev,
                name: prev.name || userProfile.displayName || "",
                email: prev.email || userProfile.email || user.email || "",
                phone: prev.phone || userProfile.phone || "",
            }));
        }
    }, [user, userProfile]);

    // Determine which property data to use
    const property = sampleProp || (firestoreProp ? {
        ...firestoreProp,
        id: firestoreProp.id || id,
        slug: "",
        agentImage: "/images/agent-avatar.png",
        agentName: firestoreProp.agentName,
        agentEmail: firestoreProp.agentEmail,
        agentPhone: firestoreProp.agentPhone,
        location: { city: firestoreProp.city, neighborhood: firestoreProp.neighborhood },
        address: firestoreProp.address,
        images: firestoreProp.images?.length ? firestoreProp.images : ["/images/property-1.png"],
        createdAt: firestoreProp.createdAt ? new Date(firestoreProp.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
    } : null);

    if (!property) {
        return (
            <div className={styles.notFound}>
                <h1>Property Not Found</h1>
                <p>The property you&apos;re looking for doesn&apos;t exist.</p>
                <Link href="/properties" className="btn btn-primary">Browse Properties</Link>
            </div>
        );
    }

    const similarProperties = sampleProperties.filter((p) => p.id !== property.id).slice(0, 3);

    const amenityIcons: Record<string, string> = {
        "Swimming Pool": "🏊", "Garden": "🌿", "24/7 Security": "🔒", "Parking": "🅿️",
        "Gym": "💪", "Smart Home": "🏠", "Ocean View": "🌊", "Staff Quarters": "👥",
        "Concierge": "🛎️", "Elevator": "🛗", "Rooftop Access": "🌇", "Playground": "🎪",
        "CCTV": "📹", "Borehole": "💧", "Rooftop Terrace": "🌅", "Private Elevator": "🔑",
        "Wine Cellar": "🍷", "BBQ Area": "🔥", "Tennis Court": "🎾",
        "Solar Panels": "☀️", "Rainwater Harvesting": "🌧️", "EV Charging": "⚡",
    };

    const handleInquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSending(true);

        try {
            // Determine the agent ID — for Firestore properties use agentId, for samples use a placeholder
            const agentId = firestoreProp?.agentId || "sample-agent";

            // 1. Save inquiry to Firestore + auto-creates a dashboard notification
            await sendInquiry({
                propertyId: property.id,
                propertyTitle: property.title,
                senderId: user?.uid || "guest",
                senderName: inquiryForm.name,
                senderEmail: inquiryForm.email,
                senderPhone: inquiryForm.phone,
                agentId,
                agentName: property.agentName,
                message: inquiryForm.message,
                type: inquiryForm.type,
            });

            // 2. Send email notification to the agent
            await sendInquiryEmail({
                agentName: property.agentName,
                agentEmail: property.agentEmail,
                senderName: inquiryForm.name,
                senderEmail: inquiryForm.email,
                senderPhone: inquiryForm.phone,
                propertyTitle: property.title,
                message: inquiryForm.message,
                inquiryType: inquiryForm.type,
            });

            toast.success("Inquiry sent successfully! The agent will get back to you soon. ✉️");
            setShowInquiry(false);
            setInquiryForm((prev) => ({
                ...prev,
                message: "I'm interested in this property...",
                type: "inquiry",
            }));
        } catch (err) {
            console.error("Failed to send inquiry:", err);
            toast.error("Failed to send inquiry. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={styles.page}>
            {/* Breadcrumbs */}
            <div className={styles.breadcrumbs}>
                <div className="container">
                    <Link href="/">Home</Link>
                    <span>/</span>
                    <Link href="/properties">Properties</Link>
                    <span>/</span>
                    <span className={styles.breadcrumbCurrent}>{property.title}</span>
                </div>
            </div>

            {/* Image Gallery */}
            <section className={styles.gallery}>
                <div className="container">
                    <div className={styles.galleryGrid}>
                        <div className={styles.mainImage}>
                            <Image
                                src={property.images[activeImage]}
                                alt={property.title}
                                fill
                                quality={90}
                                className={styles.mainImg}
                            />
                            <div className={styles.imageBadges}>
                                <span className={`badge ${property.listingType === "sale" ? "badge-sale" : "badge-rent"}`}>
                                    For {property.listingType === "sale" ? "Sale" : "Rent"}
                                </span>
                                {property.isFeatured && <span className="badge badge-featured">Featured</span>}
                            </div>
                        </div>
                        <div className={styles.thumbnails}>
                            {property.images.map((img, i) => (
                                <button
                                    key={i}
                                    className={`${styles.thumbnail} ${activeImage === i ? styles.thumbActive : ""}`}
                                    onClick={() => setActiveImage(i)}
                                >
                                    <Image src={img} alt={`View ${i + 1}`} fill sizes="120px" className={styles.thumbImg} />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Property Content */}
            <section className={styles.content}>
                <div className="container">
                    <div className={styles.contentGrid}>
                        {/* Left Column */}
                        <div className={styles.leftCol}>
                            {/* Header */}
                            <div className={styles.propHeader}>
                                <div>
                                    <h1 className={styles.propTitle}>{property.title}</h1>
                                    <p className={styles.propLocation}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                        {property.address}, {property.location.neighborhood}, {property.location.city}
                                    </p>
                                </div>
                                <div className={styles.propPrice}>
                                    <span className={styles.priceValue}>{formatPriceFull(property.price, property.currency)}</span>
                                    {property.listingType === "rent" && <span className={styles.priceUnit}>/month</span>}
                                </div>
                            </div>

                            {/* Quick Info */}
                            <div className={styles.quickInfo}>
                                {[
                                    { label: "Bedrooms", value: property.bedrooms, icon: "🛏️" },
                                    { label: "Bathrooms", value: property.bathrooms, icon: "🚿" },
                                    { label: "Area", value: `${property.area.toLocaleString()} sqft`, icon: "📐" },
                                    { label: "Year Built", value: property.yearBuilt, icon: "📅" },
                                    { label: "Type", value: property.type.charAt(0).toUpperCase() + property.type.slice(1), icon: "🏠" },
                                ].map((item) => (
                                    <div key={item.label} className={styles.quickInfoItem}>
                                        <span className={styles.quickInfoIcon}>{item.icon}</span>
                                        <div>
                                            <span className={styles.quickInfoValue}>{item.value}</span>
                                            <span className={styles.quickInfoLabel}>{item.label}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Description */}
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>Description</h2>
                                <p className={styles.description}>{property.description}</p>
                            </div>

                            {/* Amenities */}
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>Amenities & Features</h2>
                                <div className={styles.amenitiesGrid}>
                                    {property.amenities.map((amenity) => (
                                        <div key={amenity} className={styles.amenityItem}>
                                            <span className={styles.amenityIcon}>{amenityIcons[amenity] || "✓"}</span>
                                            <span>{amenity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className={styles.rightCol}>
                            {/* Agent Card */}
                            <div className={styles.agentCard}>
                                <div className={styles.agentHeader}>
                                    <div className={styles.agentAvatar}>
                                        <Image
                                            src={property.agentImage}
                                            alt={property.agentName}
                                            fill
                                            sizes="60px"
                                            className={styles.agentImg}
                                        />
                                    </div>
                                    <div>
                                        <h3 className={styles.agentName}>{property.agentName}</h3>
                                        <p className={styles.agentRole}>Senior Real Estate Agent</p>
                                    </div>
                                </div>

                                <div className={styles.agentContact}>
                                    <a href={`tel:${property.agentPhone}`} className={styles.agentContactItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                                        {property.agentPhone}
                                    </a>
                                    <a href={`mailto:${property.agentEmail}`} className={styles.agentContactItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                                        {property.agentEmail}
                                    </a>
                                </div>

                                <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setShowInquiry(!showInquiry)}>
                                    {showInquiry ? "Close Inquiry Form" : "Send Inquiry"}
                                </button>

                                {showInquiry && (
                                    <form className={styles.inquiryForm} onSubmit={handleInquirySubmit}>
                                        <input
                                            type="text"
                                            placeholder="Your Name *"
                                            className={styles.formInput}
                                            value={inquiryForm.name}
                                            onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="email"
                                            placeholder="Your Email *"
                                            className={styles.formInput}
                                            value={inquiryForm.email}
                                            onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="tel"
                                            placeholder="Your Phone"
                                            className={styles.formInput}
                                            value={inquiryForm.phone}
                                            onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                                        />
                                        <select
                                            className={styles.formInput}
                                            value={inquiryForm.type}
                                            onChange={(e) => setInquiryForm({ ...inquiryForm, type: e.target.value as "inquiry" | "viewing" | "offer" })}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <option value="inquiry">General Inquiry</option>
                                            <option value="viewing">Request a Viewing</option>
                                            <option value="offer">Make an Offer</option>
                                        </select>
                                        <textarea
                                            placeholder="I'm interested in this property..."
                                            className={styles.formTextarea}
                                            rows={4}
                                            value={inquiryForm.message}
                                            onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-secondary"
                                            style={{ width: "100%" }}
                                            disabled={isSending}
                                        >
                                            {isSending ? "Sending..." : "Send Message"}
                                        </button>
                                    </form>
                                )}
                            </div>

                            {/* Property Stats */}
                            <div className={styles.statsCard}>
                                <h3>Property Stats</h3>
                                <div className={styles.statsList}>
                                    <div className={styles.statItem}>
                                        <span>Views</span>
                                        <strong>{property.views.toLocaleString()}</strong>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span>Favorites</span>
                                        <strong>{property.favorites}</strong>
                                    </div>
                                    <div className={styles.statItem}>
                                        <span>Listed</span>
                                        <strong>{new Date(property.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Similar Properties */}
            <section className={`section ${styles.similar}`}>
                <div className="container">
                    <h2 className="section-title" style={{ marginBottom: "var(--space-2xl)" }}>Similar Properties</h2>
                    <div className={styles.similarGrid}>
                        {similarProperties.map((p) => (
                            <PropertyCard key={p.id} property={p} />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
