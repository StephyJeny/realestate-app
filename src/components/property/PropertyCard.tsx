"use client";
import Image from "next/image";
import Link from "next/link";
import { Property, formatPrice } from "@/lib/data";
import styles from "./PropertyCard.module.css";

interface PropertyCardProps {
    property: Property;
}

export default function PropertyCard({ property }: PropertyCardProps) {
    return (
        <Link href={`/properties/${property.id}`} className={styles.card}>
            <div className={styles.imageWrapper}>
                <Image
                    src={property.images[0]}
                    alt={property.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className={styles.image}
                />
                <div className={styles.overlay}>
                    <span className={`badge ${property.listingType === "sale" ? "badge-sale" : "badge-rent"}`}>
                        For {property.listingType === "sale" ? "Sale" : "Rent"}
                    </span>
                    {property.isFeatured && (
                        <span className="badge badge-featured">Featured</span>
                    )}
                </div>
                <button className={styles.favButton} aria-label="Save property" onClick={(e) => { e.preventDefault(); }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                </button>
                <div className={styles.priceTag}>
                    {formatPrice(property.price, property.currency)}
                    {property.listingType === "rent" && <span className={styles.perMonth}>/mo</span>}
                </div>
            </div>

            <div className={styles.content}>
                <h3 className={styles.title}>{property.title}</h3>
                <p className={styles.location}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {property.location.neighborhood}, {property.location.city}
                </p>

                <div className={styles.features}>
                    <div className={styles.feature}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 7v11m0-4h18m0-7v11M7 7h10a1 1 0 0 1 1 1v3H6V8a1 1 0 0 1 1-1z" /></svg>
                        <span>{property.bedrooms} Beds</span>
                    </div>
                    <div className={styles.feature}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1zM6 12V5a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v7" /></svg>
                        <span>{property.bathrooms} Baths</span>
                    </div>
                    <div className={styles.feature}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 12h18M12 3v18" /></svg>
                        <span>{property.area.toLocaleString()} sqft</span>
                    </div>
                </div>

                <div className={styles.cardFooter}>
                    <div className={styles.propertyType}>
                        {property.type.charAt(0).toUpperCase() + property.type.slice(1)}
                    </div>
                    <span className={styles.viewDetails}>View Details →</span>
                </div>
            </div>
        </Link>
    );
}
