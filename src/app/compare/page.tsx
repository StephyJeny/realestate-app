"use client";
import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { sampleProperties, Property, formatPrice } from "@/lib/data";
import { getPropertyById, FirestoreProperty } from "@/lib/firestore";
import { useCompare } from "@/context/CompareContext";
import styles from "./page.module.css";

type UnifiedProperty = {
    id: string;
    title: string;
    type: string;
    listingType: string;
    price: number;
    currency: string;
    bedrooms: number;
    bathrooms: number;
    area: number;
    yearBuilt: number;
    city: string;
    neighborhood: string;
    amenities: string[];
    images: string[];
    status: string;
    agentName: string;
};

function normalizeProperty(prop: Property | FirestoreProperty): UnifiedProperty {
    if ("location" in prop && typeof prop.location === "object" && "city" in prop.location) {
        const sp = prop as Property;
        return {
            id: sp.id,
            title: sp.title,
            type: sp.type,
            listingType: sp.listingType,
            price: sp.price,
            currency: sp.currency,
            bedrooms: sp.bedrooms,
            bathrooms: sp.bathrooms,
            area: sp.area,
            yearBuilt: sp.yearBuilt,
            city: sp.location.city,
            neighborhood: sp.location.neighborhood,
            amenities: sp.amenities,
            images: sp.images,
            status: sp.status,
            agentName: sp.agentName,
        };
    }
    const fp = prop as FirestoreProperty;
    return {
        id: fp.id || "",
        title: fp.title,
        type: fp.type,
        listingType: fp.listingType,
        price: fp.price,
        currency: fp.currency || "KES",
        bedrooms: fp.bedrooms,
        bathrooms: fp.bathrooms,
        area: fp.area,
        yearBuilt: fp.yearBuilt || 0,
        city: fp.city || "",
        neighborhood: fp.neighborhood || "",
        amenities: fp.amenities || [],
        images: fp.images?.length ? fp.images : ["/images/property-1.png"],
        status: fp.status,
        agentName: fp.agentName || "Agent",
    };
}

function CompareContent() {
    const searchParams = useSearchParams();
    const { compareIds, removeFromCompare } = useCompare();
    const [properties, setProperties] = useState<UnifiedProperty[]>([]);
    const [loading, setLoading] = useState(true);

    // Use URL ids or context ids
    const idsParam = searchParams.get("ids");
    const ids = useMemo(
        () => (idsParam ? idsParam.split(",").filter(Boolean) : compareIds),
        [idsParam, compareIds]
    );

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const loaded: UnifiedProperty[] = [];

            for (const id of ids) {
                // Check sample properties first
                const sample = sampleProperties.find((p) => p.id === id);
                if (sample) {
                    loaded.push(normalizeProperty(sample));
                    continue;
                }
                // Fetch from Firestore
                try {
                    const fp = await getPropertyById(id);
                    if (fp) loaded.push(normalizeProperty(fp));
                } catch { }
            }

            setProperties(loaded);
            setLoading(false);
        };
        if (ids.length > 0) load();
        else setLoading(false);
    }, [ids]);

    // Find best values for highlighting
    const bestPrice = useMemo(
        () => (properties.length > 0 ? Math.min(...properties.map((p) => p.price)) : 0),
        [properties]
    );
    const bestBeds = useMemo(
        () => (properties.length > 0 ? Math.max(...properties.map((p) => p.bedrooms)) : 0),
        [properties]
    );
    const bestBaths = useMemo(
        () => (properties.length > 0 ? Math.max(...properties.map((p) => p.bathrooms)) : 0),
        [properties]
    );
    const bestArea = useMemo(
        () => (properties.length > 0 ? Math.max(...properties.map((p) => p.area)) : 0),
        [properties]
    );

    const rows: { label: string; key: string; highlight?: "min" | "max" }[] = [
        { label: "Price", key: "price", highlight: "min" },
        { label: "Type", key: "type" },
        { label: "Listing", key: "listingType" },
        { label: "Bedrooms", key: "bedrooms", highlight: "max" },
        { label: "Bathrooms", key: "bathrooms", highlight: "max" },
        { label: "Area (sqft)", key: "area", highlight: "max" },
        { label: "Year Built", key: "yearBuilt" },
        { label: "City", key: "city" },
        { label: "Neighborhood", key: "neighborhood" },
        { label: "Status", key: "status" },
        { label: "Agent", key: "agentName" },
        { label: "Amenities", key: "amenities" },
    ];

    const getCellValue = (prop: UnifiedProperty, key: string): string | JSX.Element => {
        switch (key) {
            case "price":
                return formatPrice(prop.price, prop.currency);
            case "type":
                return prop.type.charAt(0).toUpperCase() + prop.type.slice(1);
            case "listingType":
                return prop.listingType === "sale" ? "For Sale" : "For Rent";
            case "area":
                return `${prop.area.toLocaleString()} sqft`;
            case "yearBuilt":
                return prop.yearBuilt ? String(prop.yearBuilt) : "—";
            case "status":
                const statusMap: Record<string, string> = {
                    active: "🟢 Active",
                    under_offer: "🟠 Under Offer",
                    sold: "🔴 Sold",
                    rented: "🟣 Rented",
                    price_reduced: "💰 Price Reduced",
                };
                return statusMap[prop.status] || prop.status;
            case "amenities":
                return (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.2rem", justifyContent: "center" }}>
                        {prop.amenities.slice(0, 6).map((a) => (
                            <span key={a} className={styles.amenityTag}>{a}</span>
                        ))}
                        {prop.amenities.length > 6 && (
                            <span className={styles.amenityTag}>+{prop.amenities.length - 6}</span>
                        )}
                    </div>
                );
            default:
                return String((prop as Record<string, unknown>)[key] || "—");
        }
    };

    const isBest = (prop: UnifiedProperty, key: string, highlight?: "min" | "max"): boolean => {
        if (!highlight || properties.length < 2) return false;
        const val = (prop as Record<string, unknown>)[key] as number;
        if (highlight === "min") return val === bestPrice && key === "price";
        if (key === "bedrooms") return val === bestBeds;
        if (key === "bathrooms") return val === bestBaths;
        if (key === "area") return val === bestArea;
        return false;
    };

    if (loading) {
        return (
            <div className={styles.page}>
                <div className={styles.hero}>
                    <h1 className={styles.heroTitle}>⚖️ Compare Properties</h1>
                    <p className={styles.heroSub}>Loading comparison...</p>
                </div>
                <div className={styles.container}>
                    <div style={{ textAlign: "center", padding: "4rem" }}>
                        <div style={{ width: 40, height: 40, border: "3px solid var(--border-color)", borderTopColor: "var(--navy-800)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <h1 className={styles.heroTitle}>⚖️ Compare Properties</h1>
                <p className={styles.heroSub}>
                    {properties.length > 0
                        ? `Comparing ${properties.length} ${properties.length === 1 ? "property" : "properties"} side by side`
                        : "Select properties to compare"}
                </p>
            </div>

            <div className={styles.container}>
                {properties.length > 0 ? (
                    <div className={styles.tableWrapper}>
                        <table className={styles.compareTable}>
                            {/* Header Row — Property Cards */}
                            <thead>
                                <tr>
                                    <td className={styles.labelCell} style={{ background: "transparent", border: "none" }} />
                                    {properties.map((prop) => (
                                        <td key={prop.id} className={styles.propertyHeaderCell}>
                                            <img
                                                src={prop.images[0]}
                                                alt={prop.title}
                                                className={styles.headerImage}
                                            />
                                            <div className={styles.headerTitle}>{prop.title}</div>
                                            <div className={styles.headerLocation}>
                                                {prop.neighborhood}{prop.neighborhood && prop.city ? ", " : ""}{prop.city}
                                            </div>
                                            <div className={styles.headerPrice}>
                                                {formatPrice(prop.price, prop.currency)}
                                            </div>
                                            <button
                                                className={styles.removeBtn}
                                                onClick={() => removeFromCompare(prop.id)}
                                            >
                                                ✕ Remove
                                            </button>
                                        </td>
                                    ))}
                                </tr>
                            </thead>
                            {/* Comparison Rows */}
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.key} className={row.highlight ? styles.highlightRow : ""}>
                                        <td className={styles.labelCell}>{row.label}</td>
                                        {properties.map((prop) => (
                                            <td
                                                key={prop.id}
                                                className={`${styles.valueCell} ${isBest(prop, row.key, row.highlight) ? styles.bestValue : ""}`}
                                            >
                                                {getCellValue(prop, row.key)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                                {/* Action Row */}
                                <tr>
                                    <td className={styles.labelCell}>Actions</td>
                                    {properties.map((prop) => (
                                        <td key={prop.id} className={styles.valueCell}>
                                            <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", flexWrap: "wrap" }}>
                                                <Link href={`/properties/${prop.id}`} className={styles.viewLink}>
                                                    View Details
                                                </Link>
                                                <Link
                                                    href={`/mortgage-calculator?price=${prop.price}`}
                                                    className={styles.viewLink}
                                                    style={{ background: "var(--navy-800)" }}
                                                >
                                                    Mortgage
                                                </Link>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                        </div>
                        <h3 className={styles.emptyTitle}>No Properties Selected</h3>
                        <p className={styles.emptyText}>
                            Browse our listings and click the compare icon on property cards to add them here.
                        </p>
                        <Link href="/properties" className={styles.emptyBtn}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            Browse Properties
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ComparePage() {
    return (
        <Suspense
            fallback={
                <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "var(--navbar-height)" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid var(--border-color)", borderTopColor: "var(--navy-800)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
            }
        >
            <CompareContent />
        </Suspense>
    );
}
