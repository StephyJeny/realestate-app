"use client";
import { use, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { sampleProperties, formatPriceFull, formatPrice } from "@/lib/data";
import { sendInquiry, getPropertyById, FirestoreProperty, submitReview, getReviewsByAgent, Review, markReviewHelpful } from "@/lib/firestore";
import { addToRecentlyViewed } from "@/lib/recentlyViewed";
import { sendInquiryEmail } from "@/lib/email";
import { useAuth } from "@/context/AuthContext";
import PropertyCard from "@/components/property/PropertyCard";
import PropertyMap from "@/components/property/PropertyMap";
import { getRecentlyViewed, RecentlyViewedItem } from "@/lib/recentlyViewed";
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
    const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedItem[]>([]);
    const [preferredDate, setPreferredDate] = useState("");
    const [preferredTime, setPreferredTime] = useState("10:00");

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

    // Review system state
    const [agentReviews, setAgentReviews] = useState<Review[]>([]);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewForm, setReviewForm] = useState({
        rating: 0,
        title: "",
        comment: "",
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

    // Track recently viewed
    useEffect(() => {
        if (sampleProp) {
            addToRecentlyViewed({
                id: sampleProp.id,
                title: sampleProp.title,
                image: sampleProp.images[0] || "/images/property-1.png",
                price: sampleProp.price,
                city: sampleProp.location?.city || "",
                type: sampleProp.type,
            });
        } else if (firestoreProp) {
            addToRecentlyViewed({
                id: firestoreProp.id || id,
                title: firestoreProp.title,
                image: firestoreProp.images?.[0] || "/images/property-1.png",
                price: firestoreProp.price,
                city: firestoreProp.city,
                type: firestoreProp.type,
            });
        }
    }, [sampleProp, firestoreProp, id]);

    // Load recently viewed (excluding current)
    useEffect(() => {
        const items = getRecentlyViewed().filter((item) => item.id !== id);
        setRecentlyViewed(items);
    }, [id]);

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

    // Load agent reviews
    useEffect(() => {
        if (property && firestoreProp?.agentId) {
            getReviewsByAgent(firestoreProp.agentId)
                .then(setAgentReviews)
                .catch(console.error);
        }
    }, [property, firestoreProp?.agentId]);

    const handleReviewSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !userProfile) {
            toast.error("Please sign in to leave a review");
            return;
        }
        if (reviewForm.rating === 0) {
            toast.error("Please select a star rating");
            return;
        }
        if (!reviewForm.comment.trim()) {
            toast.error("Please write a comment");
            return;
        }
        if (!firestoreProp?.agentId) {
            toast.error("Cannot submit review for this listing");
            return;
        }

        setReviewSubmitting(true);
        try {
            await submitReview({
                agentId: firestoreProp.agentId,
                agentName: firestoreProp.agentName,
                reviewerId: user.uid,
                reviewerName: userProfile.displayName || "Anonymous",
                reviewerAvatar: userProfile.avatar || "",
                propertyId: property?.id || id,
                propertyTitle: property?.title || "",
                rating: reviewForm.rating,
                title: reviewForm.title,
                comment: reviewForm.comment,
                isVerifiedPurchase: false,
            });
            toast.success("Review submitted! Thank you ⭐");
            setReviewForm({ rating: 0, title: "", comment: "" });
            setShowReviewForm(false);
            // Reload reviews
            const updated = await getReviewsByAgent(firestoreProp.agentId);
            setAgentReviews(updated);
        } catch (err: unknown) {
            if (err instanceof Error && err.message === "already_reviewed") {
                toast.error("You've already reviewed this agent");
            } else {
                console.error("Review submission failed:", err);
                toast.error("Failed to submit review");
            }
        } finally {
            setReviewSubmitting(false);
        }
    };

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

    // Virtual Tour URL helper — converts YouTube/Matterport URLs to embeddable format
    const getEmbedUrl = (url: string): string | null => {
        if (!url) return null;
        // YouTube
        const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
        if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
        // Matterport
        const mpMatch = url.match(/matterport\.com\/show\/\?m=([\w-]+)/);
        if (mpMatch) return `https://my.matterport.com/show/?m=${mpMatch[1]}&play=1`;
        // Already an embed or iframe-compatible URL
        if (url.includes("embed") || url.includes("player")) return url;
        return null;
    };

    const virtualTourUrl = sampleProp?.virtualTourUrl || firestoreProp?.virtualTourUrl || "";
    const embedUrl = getEmbedUrl(virtualTourUrl);

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

        if (inquiryForm.type === "viewing" && !preferredDate) {
            toast.error("Please select a preferred viewing date");
            return;
        }

        setIsSending(true);

        try {
            const agentId = firestoreProp?.agentId || "sample-agent";
            let message = inquiryForm.message;
            if (inquiryForm.type === "viewing" && preferredDate) {
                const dateStr = new Date(preferredDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
                message += `\n\n📅 Preferred Viewing: ${dateStr} at ${preferredTime}`;
            }

            await sendInquiry({
                propertyId: property.id,
                propertyTitle: property.title,
                senderId: user?.uid || "guest",
                senderName: inquiryForm.name,
                senderEmail: inquiryForm.email,
                senderPhone: inquiryForm.phone,
                agentId,
                agentName: property.agentName,
                message,
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
                                {property.status === "sold" && <span className="badge badge-sold">🔴 Sold</span>}
                                {property.status === "rented" && <span className="badge badge-rented">🟣 Rented</span>}
                                {property.status === "under_offer" && <span className="badge badge-under-offer">🟠 Under Offer</span>}
                                {property.status === "price_reduced" && <span className="badge badge-price-reduced">💰 Price Reduced</span>}
                                {virtualTourUrl && <span className="badge badge-featured" style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)", border: "none" }}>🎬 360° Tour</span>}
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
                                    {/* Property Status Badge */}
                                    {property.status && property.status !== "active" && property.status !== "pending" && (
                                        <div style={{ marginTop: "0.75rem" }}>
                                            <span className={`badge ${property.status === "sold" ? "badge-sold" :
                                                property.status === "rented" ? "badge-rented" :
                                                    property.status === "under_offer" ? "badge-under-offer" :
                                                        property.status === "price_reduced" ? "badge-price-reduced" : ""
                                                }`} style={{ fontSize: "0.82rem", padding: "0.35rem 1rem" }}>
                                                {property.status === "sold" && "🔴 Sold"}
                                                {property.status === "rented" && "🟣 Rented"}
                                                {property.status === "under_offer" && "🟠 Under Offer"}
                                                {property.status === "price_reduced" && "💰 Price Reduced"}
                                            </span>
                                        </div>
                                    )}
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

                            {/* Virtual Tour */}
                            {virtualTourUrl && (
                                <div className={styles.section}>
                                    <h2 className={styles.sectionTitle}>🎬 Virtual Tour</h2>
                                    <div className={styles.virtualTourWrap}>
                                        <div className={styles.virtualTourHeader}>
                                            <div className={styles.virtualTourBadge}>
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" /></svg>
                                                <span>360° Immersive Tour</span>
                                            </div>
                                            <a
                                                href={virtualTourUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.virtualTourExternal}
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                                                Open Full Screen
                                            </a>
                                        </div>
                                        {embedUrl ? (
                                            <div className={styles.virtualTourEmbed}>
                                                <iframe
                                                    src={embedUrl}
                                                    title="Virtual Tour"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; xr-spatial-tracking"
                                                    allowFullScreen
                                                    className={styles.virtualTourIframe}
                                                />
                                            </div>
                                        ) : (
                                            <div className={styles.virtualTourFallback}>
                                                <div className={styles.virtualTourFallbackIcon}>🎬</div>
                                                <p>This property has a virtual tour available.</p>
                                                <a
                                                    href={virtualTourUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-primary"
                                                >
                                                    Open Virtual Tour →
                                                </a>
                                            </div>
                                        )}
                                        <p className={styles.virtualTourNote}>
                                            💡 Use your mouse or touch to look around. Click the fullscreen button for the best experience.
                                        </p>
                                    </div>
                                </div>
                            )}

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

                            {/* Agent Reviews */}
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>⭐ Agent Reviews</h2>

                                {/* Rating Summary */}
                                {agentReviews.length > 0 ? (
                                    <div style={{ display: "flex", gap: "2rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
                                        {/* Average Score */}
                                        <div style={{ textAlign: "center", minWidth: "120px" }}>
                                            <div style={{ fontSize: "3rem", fontWeight: 800, color: "var(--navy-900)", lineHeight: 1 }}>
                                                {(agentReviews.reduce((s, r) => s + r.rating, 0) / agentReviews.length).toFixed(1)}
                                            </div>
                                            <div style={{ display: "flex", justifyContent: "center", gap: "2px", margin: "0.5rem 0" }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <svg key={star} width="16" height="16" viewBox="0 0 24 24"
                                                        fill={star <= Math.round(agentReviews.reduce((s, r) => s + r.rating, 0) / agentReviews.length) ? "var(--gold-500)" : "var(--gray-200)"}
                                                    ><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>
                                                {agentReviews.length} review{agentReviews.length !== 1 ? "s" : ""}
                                            </div>
                                        </div>

                                        {/* Rating Distribution */}
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem", justifyContent: "center" }}>
                                            {[5, 4, 3, 2, 1].map((star) => {
                                                const count = agentReviews.filter(r => r.rating === star).length;
                                                const pct = agentReviews.length > 0 ? (count / agentReviews.length) * 100 : 0;
                                                return (
                                                    <div key={star} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                        <span style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", width: "14px" }}>{star}</span>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--gold-500)"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                        <div style={{ flex: 1, height: "8px", background: "var(--gray-100)", borderRadius: "4px", overflow: "hidden" }}>
                                                            <div style={{ width: `${pct}%`, height: "100%", background: "linear-gradient(90deg, var(--gold-400), var(--gold-500))", borderRadius: "4px", transition: "width 0.5s ease" }} />
                                                        </div>
                                                        <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", width: "24px", textAlign: "right" }}>{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
                                        <p style={{ marginBottom: "0.5rem" }}>No reviews yet for this agent</p>
                                        <p style={{ fontSize: "0.8rem" }}>Be the first to share your experience!</p>
                                    </div>
                                )}

                                {/* Write Review Button */}
                                <button
                                    onClick={() => {
                                        if (!user) {
                                            toast.error("Please sign in to leave a review");
                                            return;
                                        }
                                        setShowReviewForm(!showReviewForm);
                                    }}
                                    style={{
                                        width: "100%",
                                        padding: "0.75rem",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px dashed var(--gold-400)",
                                        background: showReviewForm ? "rgba(212,160,23,0.08)" : "none",
                                        color: "var(--gold-600)",
                                        fontWeight: 600,
                                        fontSize: "0.88rem",
                                        cursor: "pointer",
                                        transition: "all 0.2s",
                                        marginBottom: showReviewForm ? "1rem" : "0",
                                    }}
                                >
                                    {showReviewForm ? "Cancel" : "✍️ Write a Review"}
                                </button>

                                {/* Review Form */}
                                {showReviewForm && (
                                    <form onSubmit={handleReviewSubmit} style={{ padding: "1.25rem", background: "var(--bg-tertiary)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "1rem", animation: "fadeInUp 0.3s ease-out" }}>
                                        {/* Star Rating Selector */}
                                        <div>
                                            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block" }}>Your Rating *</label>
                                            <div style={{ display: "flex", gap: "4px" }}>
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <button
                                                        key={star}
                                                        type="button"
                                                        onClick={() => setReviewForm({ ...reviewForm, rating: star })}
                                                        onMouseEnter={() => setHoverRating(star)}
                                                        onMouseLeave={() => setHoverRating(0)}
                                                        style={{ padding: "4px", cursor: "pointer", transition: "transform 0.15s" }}
                                                    >
                                                        <svg width="28" height="28" viewBox="0 0 24 24"
                                                            fill={star <= (hoverRating || reviewForm.rating) ? "var(--gold-500)" : "var(--gray-200)"}
                                                            style={{ transition: "fill 0.15s", transform: star <= (hoverRating || reviewForm.rating) ? "scale(1.1)" : "scale(1)" }}
                                                        ><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                    </button>
                                                ))}
                                                {reviewForm.rating > 0 && (
                                                    <span style={{ marginLeft: "0.5rem", fontSize: "0.85rem", color: "var(--gold-600)", fontWeight: 600, alignSelf: "center" }}>
                                                        {["", "Poor", "Fair", "Good", "Great", "Excellent"][reviewForm.rating]}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Title */}
                                        <div>
                                            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block" }}>Review Title</label>
                                            <input
                                                type="text"
                                                placeholder="Sum up your experience..."
                                                value={reviewForm.title}
                                                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                                                className={styles.formInput}
                                            />
                                        </div>
                                        {/* Comment */}
                                        <div>
                                            <label style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.4rem", display: "block" }}>Your Review *</label>
                                            <textarea
                                                placeholder="Share your experience with this agent..."
                                                value={reviewForm.comment}
                                                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                                                className={styles.formTextarea}
                                                rows={4}
                                                required
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={reviewSubmitting || reviewForm.rating === 0}
                                            className="btn btn-primary"
                                            style={{ width: "100%" }}
                                        >
                                            {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                        </button>
                                    </form>
                                )}

                                {/* Review List */}
                                {agentReviews.length > 0 && (
                                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1.5rem" }}>
                                        {agentReviews.map((review) => (
                                            <div key={review.id} style={{ padding: "1.25rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-light)" }}>
                                                {/* Review Header */}
                                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                                                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                                        <div style={{
                                                            width: "40px", height: "40px", borderRadius: "50%",
                                                            background: review.reviewerAvatar ? "none" : "linear-gradient(135deg, var(--navy-400), var(--navy-600))",
                                                            display: "flex", alignItems: "center", justifyContent: "center",
                                                            color: "#fff", fontWeight: 700, fontSize: "0.85rem",
                                                            overflow: "hidden", flexShrink: 0,
                                                        }}>
                                                            {review.reviewerAvatar ? (
                                                                <Image src={review.reviewerAvatar} alt="" width={40} height={40} style={{ objectFit: "cover" }} />
                                                            ) : (
                                                                review.reviewerName.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-primary)" }}>{review.reviewerName}</div>
                                                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                                                <div style={{ display: "flex", gap: "1px" }}>
                                                                    {[1, 2, 3, 4, 5].map((star) => (
                                                                        <svg key={star} width="13" height="13" viewBox="0 0 24 24"
                                                                            fill={star <= review.rating ? "var(--gold-500)" : "var(--gray-200)"}
                                                                        ><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                                                    ))}
                                                                </div>
                                                                <span style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                                                                    {review.createdAt ? new Date(review.createdAt.seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {review.isVerifiedPurchase && (
                                                        <span style={{ fontSize: "0.68rem", padding: "0.2rem 0.5rem", borderRadius: "50px", background: "rgba(16,185,129,0.1)", color: "var(--success)", fontWeight: 600 }}>
                                                            ✓ Verified
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Review Content */}
                                                {review.title && (
                                                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading)", marginBottom: "0.4rem" }}>{review.title}</h4>
                                                )}
                                                <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.7 }}>{review.comment}</p>

                                                {/* Agent Response */}
                                                {review.agentResponse && (
                                                    <div style={{ marginTop: "0.75rem", padding: "0.85rem", background: "rgba(212,160,23,0.06)", borderRadius: "var(--radius-md)", borderLeft: "3px solid var(--gold-500)" }}>
                                                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--gold-600)", marginBottom: "0.3rem" }}>
                                                            💬 Agent Response
                                                        </div>
                                                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>{review.agentResponse}</p>
                                                    </div>
                                                )}

                                                {/* Helpful Button */}
                                                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginTop: "0.75rem" }}>
                                                    <button
                                                        onClick={async () => {
                                                            if (!review.id) return;
                                                            try {
                                                                await markReviewHelpful(review.id);
                                                                setAgentReviews(prev => prev.map(r =>
                                                                    r.id === review.id ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r
                                                                ));
                                                            } catch { /* ignore */ }
                                                        }}
                                                        style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.75rem", color: "var(--text-tertiary)", cursor: "pointer", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", transition: "all 0.15s" }}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" /></svg>
                                                        Helpful {review.helpfulCount > 0 && `(${review.helpfulCount})`}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Location Map */}
                            <div className={styles.section}>
                                <h2 className={styles.sectionTitle}>📍 Location</h2>
                                <PropertyMap
                                    address={property.address || ""}
                                    city={typeof property.location === "object" ? property.location.city : (property as any).city || ""}
                                    neighborhood={typeof property.location === "object" ? property.location.neighborhood : (property as any).neighborhood || ""}
                                    latitude={firestoreProp?.latitude}
                                    longitude={firestoreProp?.longitude}
                                    height="350px"
                                />
                                <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary)", marginTop: "0.5rem" }}>
                                    {property.address || ""}{property.address ? ", " : ""}{typeof property.location === "object" ? `${property.location.neighborhood}, ${property.location.city}` : (property as any).city || ""}
                                </p>
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
                                        {inquiryForm.type === "viewing" && (
                                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                                                <div>
                                                    <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Preferred Date *</label>
                                                    <input
                                                        type="date"
                                                        className={styles.formInput}
                                                        value={preferredDate}
                                                        onChange={(e) => setPreferredDate(e.target.value)}
                                                        min={new Date().toISOString().split("T")[0]}
                                                        required
                                                        style={{ cursor: "pointer" }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginBottom: "0.25rem", display: "block" }}>Preferred Time</label>
                                                    <select
                                                        className={styles.formInput}
                                                        value={preferredTime}
                                                        onChange={(e) => setPreferredTime(e.target.value)}
                                                        style={{ cursor: "pointer" }}
                                                    >
                                                        <option value="09:00">9:00 AM</option>
                                                        <option value="10:00">10:00 AM</option>
                                                        <option value="11:00">11:00 AM</option>
                                                        <option value="12:00">12:00 PM</option>
                                                        <option value="13:00">1:00 PM</option>
                                                        <option value="14:00">2:00 PM</option>
                                                        <option value="15:00">3:00 PM</option>
                                                        <option value="16:00">4:00 PM</option>
                                                        <option value="17:00">5:00 PM</option>
                                                    </select>
                                                </div>
                                            </div>
                                        )}
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

            {/* Recently Viewed */}
            {recentlyViewed.length > 0 && (
                <section className={`section`} style={{ paddingTop: 0 }}>
                    <div className="container">
                        <h2 className="section-title" style={{ marginBottom: "var(--space-lg)" }}>🕑 Recently Viewed</h2>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                            {recentlyViewed.slice(0, 4).map((item) => (
                                <Link key={item.id} href={`/properties/${item.id}`} style={{ textDecoration: "none" }}>
                                    <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--border-light)", background: "var(--bg-primary)", transition: "transform 0.2s" }}>
                                        <div style={{ position: "relative", aspectRatio: "16/10", overflow: "hidden" }}>
                                            <Image src={item.image} alt={item.title} fill style={{ objectFit: "cover" }} sizes="220px" />
                                        </div>
                                        <div style={{ padding: "0.75rem" }}>
                                            <h4 style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.25rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</h4>
                                            <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary)" }}>📍 {item.city}</p>
                                            <p style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--gold-600)" }}>KES {item.price.toLocaleString()}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
