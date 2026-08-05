"use client";
import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { sampleProperties, formatPriceFull, formatPrice } from "@/lib/data";
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
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showMortgage, setShowMortgage] = useState(false);

    // Mortgage calculator state
    const [mortgagePrice, setMortgagePrice] = useState(0);
    const [downPayment, setDownPayment] = useState(20);
    const [interestRate, setInterestRate] = useState(14);
    const [loanTerm, setLoanTerm] = useState(25);

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

    // Set mortgage price when property loads
    useEffect(() => {
        if (property && property.listingType === "sale") {
            setMortgagePrice(property.price);
        }
    }, [property?.price, property?.listingType]);

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

    // Mortgage calculation
    const loanAmount = mortgagePrice * (1 - downPayment / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    const monthlyPayment = monthlyRate > 0
        ? (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1)
        : loanAmount / numPayments;

    // Share handlers
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareText = `Check out this property: ${property.title} - ${formatPriceFull(property.price, property.currency)}`;

    const handleShare = (platform: string) => {
        const urls: Record<string, string> = {
            whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            email: `mailto:?subject=${encodeURIComponent(property.title)}&body=${encodeURIComponent(shareText + "\n\n" + shareUrl)}`,
        };
        if (platform === "copy") {
            navigator.clipboard.writeText(shareUrl).then(() => {
                toast.success("Link copied to clipboard! 📋");
            });
        } else {
            window.open(urls[platform], "_blank");
        }
        setShowShareMenu(false);
    };

    const handleInquirySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!inquiryForm.name || !inquiryForm.email || !inquiryForm.message) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSending(true);

        try {
            const agentId = firestoreProp?.agentId || "sample-agent";

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
                            {/* Share Button */}
                            <div className={styles.shareWrap}>
                                <button
                                    className={styles.shareBtn}
                                    onClick={() => setShowShareMenu(!showShareMenu)}
                                    aria-label="Share property"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                                        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                                    </svg>
                                </button>
                                {showShareMenu && (
                                    <div className={styles.shareMenu}>
                                        <button onClick={() => handleShare("whatsapp")} className={styles.shareMenuItem}>
                                            <span style={{ fontSize: "1.1rem" }}>💬</span> WhatsApp
                                        </button>
                                        <button onClick={() => handleShare("facebook")} className={styles.shareMenuItem}>
                                            <span style={{ fontSize: "1.1rem" }}>📘</span> Facebook
                                        </button>
                                        <button onClick={() => handleShare("twitter")} className={styles.shareMenuItem}>
                                            <span style={{ fontSize: "1.1rem" }}>🐦</span> Twitter/X
                                        </button>
                                        <button onClick={() => handleShare("email")} className={styles.shareMenuItem}>
                                            <span style={{ fontSize: "1.1rem" }}>📧</span> Email
                                        </button>
                                        <button onClick={() => handleShare("copy")} className={styles.shareMenuItem}>
                                            <span style={{ fontSize: "1.1rem" }}>🔗</span> Copy Link
                                        </button>
                                    </div>
                                )}
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

                            {/* Mortgage Calculator */}
                            {property.listingType === "sale" && (
                                <div className={styles.section}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => setShowMortgage(!showMortgage)}>
                                        <h2 className={styles.sectionTitle} style={{ marginBottom: 0, borderBottom: "none", paddingBottom: 0 }}>
                                            🧮 Mortgage Calculator
                                        </h2>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: showMortgage ? "rotate(180deg)" : "none", transition: "transform 0.3s ease", color: "var(--gray-500)" }}>
                                            <polyline points="6 9 12 15 18 9" />
                                        </svg>
                                    </div>
                                    {showMortgage && (
                                        <div className={styles.mortgageCalc}>
                                            <div className={styles.mortgageGrid}>
                                                <div className={styles.mortgageField}>
                                                    <label>Property Price (KES)</label>
                                                    <input
                                                        type="number"
                                                        value={mortgagePrice}
                                                        onChange={(e) => setMortgagePrice(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className={styles.mortgageField}>
                                                    <label>Down Payment (%)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={downPayment}
                                                        onChange={(e) => setDownPayment(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className={styles.mortgageField}>
                                                    <label>Interest Rate (% p.a.)</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        value={interestRate}
                                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                                    />
                                                </div>
                                                <div className={styles.mortgageField}>
                                                    <label>Loan Term (years)</label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="30"
                                                        value={loanTerm}
                                                        onChange={(e) => setLoanTerm(Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                            <div className={styles.mortgageResult}>
                                                <div className={styles.mortgageResultItem}>
                                                    <span>Down Payment</span>
                                                    <strong>{formatPrice(mortgagePrice * downPayment / 100, "KES")}</strong>
                                                </div>
                                                <div className={styles.mortgageResultItem}>
                                                    <span>Loan Amount</span>
                                                    <strong>{formatPrice(loanAmount, "KES")}</strong>
                                                </div>
                                                <div className={styles.mortgageResultMain}>
                                                    <span>Estimated Monthly Payment</span>
                                                    <strong>KES {Math.round(monthlyPayment).toLocaleString()}/mo</strong>
                                                </div>
                                                <p className={styles.mortgageDisclaimer}>
                                                    * This is an estimate. Actual payment may vary based on lender terms, insurance, and taxes.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    <a href={`https://wa.me/${property.agentPhone?.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi, I'm interested in: ${property.title}`)}`} target="_blank" rel="noreferrer" className={styles.agentContactItem} style={{ background: "rgba(37,211,102,0.08)", color: "#25D366" }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                        WhatsApp
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
