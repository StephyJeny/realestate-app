"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "@/lib/data";
import { useCurrency } from "@/context/CurrencyContext";

interface CatalogMapProps {
    properties: Property[];
    selectedPropertyId?: string | null;
    onSelectProperty?: (id: string) => void;
    height?: string;
}

// Coordinate database for Kenyan cities & neighborhoods
const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
    // Nairobi
    karen: [-1.3197, 36.7065],
    westlands: [-1.2673, 36.811],
    kilimani: [-1.2921, 36.7876],
    runda: [-1.2185, 36.8202],
    kitisuru: [-1.2384, 36.7766],
    lavington: [-1.2783, 36.7686],
    muthaiga: [-1.2587, 36.8322],
    kileleshwa: [-1.2825, 36.7915],
    upperhill: [-1.2995, 36.8172],
    southb: [-1.3135, 36.8344],
    southc: [-1.3217, 36.8277],
    parklands: [-1.2612, 36.8197],
    gigiri: [-1.2327, 36.8126],
    springvalley: [-1.2523, 36.7891],
    nairobi: [-1.2921, 36.8219],
    // Coast
    nyali: [-4.0326, 39.7042],
    bamburi: [-4.0048, 39.7153],
    mombasa: [-4.0435, 39.6682],
    diani: [-4.2797, 39.5937],
    shanzu: [-3.9782, 39.7391],
    // Upcountry
    nakuru: [-0.3031, 36.08],
    kisumu: [-0.0917, 34.768],
    nanyuki: [0.0167, 37.0728],
    naivasha: [-0.7172, 36.431],
    eldoret: [0.5143, 35.2698],
};

function getDeterministicCoords(p: Property, index: number): [number, number] {
    const rawNeighborhood = (
        typeof p.location === "object" ? p.location.neighborhood : (p as any).neighborhood || ""
    ).toLowerCase().replace(/[^a-z]/g, "");

    const rawCity = (
        typeof p.location === "object" ? p.location.city : (p as any).city || ""
    ).toLowerCase().replace(/[^a-z]/g, "");

    const base =
        NEIGHBORHOOD_COORDS[rawNeighborhood] ||
        NEIGHBORHOOD_COORDS[rawCity] ||
        NEIGHBORHOOD_COORDS.nairobi;

    // Apply slight deterministic spread using ID or index so cards in same area don't overlap completely
    const hash = (p.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 17;
    const latOffset = ((hash % 100) - 50) * 0.00018;
    const lngOffset = (((hash * 13) % 100) - 50) * 0.00018;

    return [base[0] + latOffset, base[1] + lngOffset];
}

export default function CatalogMap({
    properties,
    selectedPropertyId,
    onSelectProperty,
    height = "100%",
}: CatalogMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<Record<string, any>>({});
    const [activeProperty, setActiveProperty] = useState<Property | null>(null);
    const [isLeafletReady, setIsLeafletReady] = useState(false);
    const { formatCurrency } = useCurrency();

    // Load Leaflet CSS & JS
    useEffect(() => {
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        // @ts-expect-error: Leaflet on window
        if (window.L) {
            setIsLeafletReady(true);
        } else {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => setIsLeafletReady(true);
            document.head.appendChild(script);
        }
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!isLeafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

        // @ts-expect-error: Leaflet on window
        const L = window.L;
        if (!L) return;

        const defaultCenter: [number, number] = [-1.2921, 36.8219]; // Nairobi center
        const map = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 12,
            zoomControl: false,
        });

        // Add Zoom control at bottom-right
        L.control.zoom({ position: "bottomright" }).addTo(map);

        // OpenStreetMap Carto tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
            maxZoom: 19,
        }).addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [isLeafletReady]);

    // Update Markers when properties, currency, or selection changes
    useEffect(() => {
        const map = mapInstanceRef.current;
        // @ts-expect-error: Leaflet on window
        const L = window.L;
        if (!map || !L || !isLeafletReady) return;

        // Clear existing markers
        Object.values(markersRef.current).forEach((m: any) => m.remove());
        markersRef.current = {};

        if (properties.length === 0) return;

        const bounds = L.latLngBounds([]);

        properties.forEach((prop, idx) => {
            const coords = getDeterministicCoords(prop, idx);
            bounds.extend(coords);

            const isSelected = prop.id === (selectedPropertyId || activeProperty?.id);
            const priceLabel = formatCurrency(prop.price, true);

            const html = `
                <div class="estatevue-price-pin ${isSelected ? "selected" : ""}" style="
                    background: ${isSelected ? "var(--gold-500, #d4a017)" : "var(--navy-900, #0a0e1a)"};
                    color: ${isSelected ? "#000" : "#fff"};
                    padding: 4px 9px;
                    border-radius: 9999px;
                    font-size: 11px;
                    font-weight: 700;
                    box-shadow: 0 3px 12px rgba(0,0,0,0.35);
                    border: 2px solid ${isSelected ? "#fff" : "rgba(212,160,23,0.7)"};
                    white-space: nowrap;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 3px;
                    transition: transform 0.15s ease, background 0.15s ease;
                ">
                    <span>${prop.type === "villa" ? "🏛️" : prop.type === "apartment" ? "🏢" : "🏠"}</span>
                    <span>${priceLabel}</span>
                </div>
            `;

            const icon = L.divIcon({
                className: "custom-catalog-pin",
                html,
                iconSize: [80, 28],
                iconAnchor: [40, 14],
            });

            const marker = L.marker(coords, { icon }).addTo(map);

            marker.on("click", () => {
                setActiveProperty(prop);
                if (onSelectProperty) onSelectProperty(prop.id);
                map.panTo(coords, { animate: true, duration: 0.5 });
            });

            markersRef.current[prop.id] = marker;
        });

        if (bounds.isValid() && bounds.getNorthEast().lat !== bounds.getSouthWest().lat) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
    }, [properties, isLeafletReady, formatCurrency, selectedPropertyId, activeProperty?.id, onSelectProperty]);

    return (
        <div style={{ position: "relative", width: "100%", height, minHeight: "450px" }}>
            <div
                ref={mapContainerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    border: "1px solid var(--border-color)",
                }}
            />

            {/* Map Legend & Count Badge */}
            <div
                style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    zIndex: 1000,
                    background: "rgba(10, 14, 26, 0.85)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    padding: "0.45rem 0.85rem",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                    border: "1px solid rgba(255,255,255,0.15)",
                }}
            >
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-500)" }} />
                <span>{properties.length} Properties on Map</span>
            </div>

            {/* Selected Property Quick Preview Card */}
            {activeProperty && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "16px",
                        left: "16px",
                        right: "16px",
                        maxWidth: "380px",
                        zIndex: 1000,
                        background: "var(--bg-card, #ffffff)",
                        borderRadius: "var(--radius-lg, 16px)",
                        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
                        border: "1px solid var(--border-color, #e2e6ee)",
                        overflow: "hidden",
                        display: "flex",
                        gap: "0.75rem",
                        padding: "0.75rem",
                        animation: "slideUpCard 0.2s ease-out",
                    }}
                >
                    <div style={{ position: "relative", width: "95px", height: "95px", borderRadius: "var(--radius-md)", overflow: "hidden", flexShrink: 0 }}>
                        <Image
                            src={activeProperty.images?.[0] || "/images/property-1.png"}
                            alt={activeProperty.title}
                            fill
                            style={{ objectFit: "cover" }}
                            sizes="95px"
                        />
                        <span
                            style={{
                                position: "absolute",
                                top: "4px",
                                left: "4px",
                                fontSize: "0.65rem",
                                fontWeight: 700,
                                background: "rgba(0,0,0,0.65)",
                                color: "#fff",
                                padding: "2px 5px",
                                borderRadius: "4px",
                            }}
                        >
                            {activeProperty.listingType === "sale" ? "Sale" : "Rent"}
                        </span>
                    </div>

                    <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.25rem" }}>
                            <h4
                                style={{
                                    fontSize: "0.88rem",
                                    fontWeight: 700,
                                    color: "var(--text-heading, #0f1629)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    margin: 0,
                                }}
                            >
                                {activeProperty.title}
                            </h4>
                            <button
                                onClick={() => setActiveProperty(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-tertiary)",
                                    cursor: "pointer",
                                    padding: "2px",
                                    fontSize: "0.9rem",
                                    lineHeight: 1,
                                }}
                                aria-label="Close preview"
                            >
                                ✕
                            </button>
                        </div>

                        <p style={{ fontSize: "0.76rem", color: "var(--text-tertiary)", margin: "2px 0 4px" }}>
                            📍 {activeProperty.location?.neighborhood || activeProperty.location?.city || "Kenya"}
                        </p>

                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <strong style={{ fontSize: "0.92rem", color: "var(--gold-600, #b8860b)" }}>
                                {formatCurrency(activeProperty.price, true)}
                                {activeProperty.listingType === "rent" && <span style={{ fontSize: "0.72rem", fontWeight: 400 }}>/mo</span>}
                            </strong>
                            <Link
                                href={`/properties/${activeProperty.id}`}
                                style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "#fff",
                                    background: "var(--navy-800, #0a0e1a)",
                                    padding: "0.3rem 0.65rem",
                                    borderRadius: "var(--radius-sm)",
                                    textDecoration: "none",
                                }}
                            >
                                View →
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-catalog-pin:hover .estatevue-price-pin {
                    transform: scale(1.12);
                    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.45);
                    z-index: 1000;
                }
                @keyframes slideUpCard {
                    from { transform: translateY(12px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
