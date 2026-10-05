"use client";
import React from "react";
import toast from "react-hot-toast";
import { formatPriceFull } from "@/lib/data";
import styles from "./LuxuryBrochureModal.module.css";

interface LuxuryBrochureModalProps {
    property: {
        id: string;
        title: string;
        description: string;
        price: number;
        currency: string;
        bedrooms?: number;
        bathrooms?: number;
        area?: number;
        yearBuilt?: number;
        city?: string;
        neighborhood?: string;
        type?: string;
        listingType?: string;
        amenities?: string[];
        images?: string[];
        agentName?: string;
        agentEmail?: string;
        agentPhone?: string;
    };
    onClose: () => void;
}

export default function LuxuryBrochureModal({ property, onClose }: LuxuryBrochureModalProps) {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://estatevue.co.ke";
    const propertyUrl = `${origin}/properties/${property.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&format=svg&data=${encodeURIComponent(propertyUrl)}`;

    const handlePrint = () => {
        window.print();
    };

    const handleWhatsAppShare = () => {
        const text = `🏰 *EstateVue Luxury Dossier*\n\n*${property.title}*\n📍 ${property.neighborhood ? `${property.neighborhood}, ` : ""}${property.city || "Kenya"}\n💰 Price: ${formatPriceFull(property.price, property.currency)}\n\nExplore full details, 360° tour & legal deed verification here:\n${propertyUrl}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(propertyUrl);
        toast.success("Brochure link copied to clipboard! 📋");
    };

    const images = property.images && property.images.length > 0
        ? property.images
        : ["/images/property-1.png", "/images/property-2.png", "/images/property-3.png"];

    const mainPhoto = images[0];
    const subPhoto1 = images[1] || images[0];
    const subPhoto2 = images[2] || images[0];

    const amenityIcons: Record<string, string> = {
        "Swimming Pool": "🏊",
        "Garden": "🌿",
        "24/7 Security": "🔒",
        "Parking": "🅿️",
        "Gym": "💪",
        "Smart Home": "🏠",
        "Ocean View": "🌊",
        "Staff Quarters": "👥",
        "Concierge": "🛎️",
        "Borehole": "💧",
        "Solar Panels": "☀️",
        "CCTV": "📹",
    };

    const amenitiesList = (property.amenities && property.amenities.length > 0)
        ? property.amenities.slice(0, 9)
        : ["Swimming Pool", "24/7 Security", "Borehole", "Solar Panels", "Gym", "Smart Home"];

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* On-Screen Action Bar */}
                <div className={styles.toolbar}>
                    <div className={styles.toolbarTitle}>
                        <span className={styles.toolbarIcon}>🏰</span>
                        <div className={styles.toolbarText}>
                            <h3>Luxury PDF Brochure & Presentation Flyer</h3>
                            <p>Export branded portfolio flyer with QR code & agent specs</p>
                        </div>
                    </div>

                    <div className={styles.toolbarActions}>
                        <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.printBtn}`}
                            onClick={handlePrint}
                            title="Save as PDF or Print on A4"
                        >
                            <span>📥</span> Save as PDF / Print
                        </button>
                        <button
                            type="button"
                            className={`${styles.actionBtn} ${styles.whatsappBtn}`}
                            onClick={handleWhatsAppShare}
                            title="Share directly to WhatsApp"
                        >
                            <span>💬</span> WhatsApp
                        </button>
                        <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={handleCopyLink}
                            style={{ background: "rgba(255, 255, 255, 0.15)", color: "#fff" }}
                            title="Copy link"
                        >
                            <span>🔗</span>
                        </button>
                        <button
                            type="button"
                            className={styles.closeBtn}
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Printable Flyer Paper */}
                <div className={styles.documentScroll}>
                    <div className={styles.flyerPaper}>
                        {/* Document Header */}
                        <div className={styles.docHeader}>
                            <div className={styles.docBrand}>
                                <span className={styles.docLogo}>🏰</span>
                                <div>
                                    <h2 className={styles.docBrandName}>ESTATEVUE</h2>
                                    <div className={styles.docSubBrand}>Private Client Real Estate Portfolio • Kenya</div>
                                </div>
                            </div>
                            <div className={styles.docMeta}>
                                <div className={styles.docRefBadge}>REF: EV-{property.id.toUpperCase()}</div>
                                <div><strong>Date:</strong> {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}</div>
                                <div style={{ color: "#059669", fontWeight: 700, marginTop: "2px" }}>
                                    🛡️ ArdhiSasa Title Deed Verified
                                </div>
                            </div>
                        </div>

                        {/* Title and Price Banner */}
                        <div className={styles.heroBanner}>
                            <div style={{ flex: 1, minWidth: 260 }}>
                                <h1 className={styles.heroTitle}>{property.title}</h1>
                                <div className={styles.heroLocation}>
                                    <span>📍</span>
                                    <span>
                                        {property.neighborhood ? `${property.neighborhood}, ` : ""}
                                        {property.city || "Nairobi, Kenya"}
                                    </span>
                                </div>
                            </div>
                            <div className={styles.heroPriceWrap}>
                                <div className={styles.heroPriceLabel}>
                                    {property.listingType === "rent" ? "Monthly Rental" : "Guide Price"}
                                </div>
                                <div className={styles.heroPrice}>
                                    {formatPriceFull(property.price, property.currency)}
                                </div>
                            </div>
                        </div>

                        {/* Photography Collage */}
                        <div className={styles.photoGrid}>
                            <img
                                src={mainPhoto}
                                alt={property.title}
                                className={styles.mainPhoto}
                            />
                            <img
                                src={subPhoto1}
                                alt={`${property.title} interior`}
                                className={styles.subPhoto}
                            />
                            <img
                                src={subPhoto2}
                                alt={`${property.title} architecture`}
                                className={styles.subPhoto}
                            />
                        </div>

                        {/* Specifications Bar */}
                        <div className={styles.specsBar}>
                            <div className={styles.specItem}>
                                <span className={styles.specLabel}>Bedrooms</span>
                                <span className={styles.specVal}>{property.bedrooms || 3} Beds</span>
                            </div>
                            <div className={styles.specItem}>
                                <span className={styles.specLabel}>Bathrooms</span>
                                <span className={styles.specVal}>{property.bathrooms || 2} Baths</span>
                            </div>
                            <div className={styles.specItem}>
                                <span className={styles.specLabel}>Floor Area</span>
                                <span className={styles.specVal}>
                                    {property.area ? `${property.area.toLocaleString()} sq ft` : "3,200 sq ft"}
                                </span>
                            </div>
                            <div className={styles.specItem}>
                                <span className={styles.specLabel}>Property Type</span>
                                <span className={styles.specVal} style={{ textTransform: "capitalize" }}>
                                    {property.type || "Apartment"}
                                </span>
                            </div>
                        </div>

                        {/* Amenities and Features */}
                        <div>
                            <div className={styles.sectionTitle}>Key Amenities & Finishes</div>
                            <div className={styles.featuresGrid}>
                                {amenitiesList.map((amenity, idx) => (
                                    <div key={idx} className={styles.featureItem}>
                                        <span className={styles.featureDot}>{amenityIcons[amenity] || "✨"}</span>
                                        <span>{amenity}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Description Narrative */}
                        <div>
                            <div className={styles.sectionTitle}>Property Overview</div>
                            <div className={styles.descriptionBox}>
                                {property.description ||
                                    "A masterclass in modern architectural luxury, offering seamless indoor-outdoor living, generous ceiling heights, custom European finishes, and breathtaking panoramic views in one of Kenya's most coveted enclaves."}
                            </div>
                        </div>

                        {/* Footer with Agent Concierge & Dynamic QR Code */}
                        <div className={styles.docFooter}>
                            <div className={styles.agentInfo}>
                                <div className={styles.agentAvatar}>
                                    {property.agentName?.charAt(0).toUpperCase() || "A"}
                                </div>
                                <div className={styles.agentDetails}>
                                    <div className={styles.agentName}>{property.agentName || "EstateVue Premier Agent"}</div>
                                    <div className={styles.agentAgency}>Licensed Real Estate Partner • EstateVue Kenya</div>
                                    <div className={styles.agentContact}>
                                        📞 {property.agentPhone || "+254 700 000 000"} • ✉️ {property.agentEmail || "concierge@estatevue.co.ke"}
                                    </div>
                                </div>
                            </div>

                            <div className={styles.qrBox}>
                                <img
                                    src={qrCodeUrl}
                                    alt="Property QR Code"
                                    className={styles.qrImage}
                                />
                                <div className={styles.qrText}>
                                    <strong>Scan with Phone</strong>
                                    <span>Instant access to 360° tour, title deeds & direct inquiry</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
