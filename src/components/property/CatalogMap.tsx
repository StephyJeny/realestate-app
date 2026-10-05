"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Property } from "@/lib/data";
import { useCurrency } from "@/context/CurrencyContext";

export interface MapBounds {
    minLat: number;
    maxLat: number;
    minLng: number;
    maxLng: number;
}

interface CatalogMapProps {
    properties: Property[];
    selectedPropertyId?: string | null;
    hoveredPropertyId?: string | null;
    onSelectProperty?: (id: string) => void;
    onHoverProperty?: (id: string | null) => void;
    onBoundsChange?: (bounds: MapBounds) => void;
    onPolygonFilter?: (polygon: [number, number][] | null) => void;
    height?: string;
    showSearchAsMoveToggle?: boolean;
}

// Coordinate database for Kenyan cities & neighborhoods
export const NEIGHBORHOOD_COORDS: Record<string, [number, number]> = {
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

export function getDeterministicCoords(p: Property, index: number = 0): [number, number] {
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

    const hash = (p.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) + index * 17;
    const latOffset = ((hash % 100) - 50) * 0.00022;
    const lngOffset = (((hash * 13) % 100) - 50) * 0.00022;

    return [base[0] + latOffset, base[1] + lngOffset];
}

// Ray-casting algorithm to test if a point is within a polygon
export function isPointInPolygon(point: [number, number], vs: [number, number][]): boolean {
    const x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0], yi = vs[i][1];
        const xj = vs[j][0], yj = vs[j][1];
        const intersect = ((yi > y) !== (yj > y)) && (x < ((xj - x) * (y - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export default function CatalogMap({
    properties,
    selectedPropertyId,
    hoveredPropertyId,
    onSelectProperty,
    onHoverProperty,
    onBoundsChange,
    onPolygonFilter,
    height = "100%",
    showSearchAsMoveToggle = true,
}: CatalogMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const tileLayerRef = useRef<any>(null);
    const markersRef = useRef<Record<string, any>>({});
    const activePolygonLayerRef = useRef<any>(null);

    const [activeProperty, setActiveProperty] = useState<Property | null>(null);
    const [isLeafletReady, setIsLeafletReady] = useState(false);
    const [searchAsMove, setSearchAsMove] = useState(false);
    const [mapStyle, setMapStyle] = useState<"standard" | "satellite">("standard");

    // Draw on Map state
    const [isDrawMode, setIsDrawMode] = useState(false);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawnPolygon, setDrawnPolygon] = useState<[number, number][] | null>(null);

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

        const defaultCenter: [number, number] = [-1.2921, 36.8219];
        const map = L.map(mapContainerRef.current, {
            center: defaultCenter,
            zoom: 12,
            zoomControl: false,
        });

        L.control.zoom({ position: "bottomright" }).addTo(map);

        const standardLayer = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
            maxZoom: 19,
        }).addTo(map);

        tileLayerRef.current = standardLayer;
        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [isLeafletReady]);

    // Handle Map Tile Switching (Standard vs Satellite)
    useEffect(() => {
        const map = mapInstanceRef.current;
        // @ts-expect-error: Leaflet on window
        const L = window.L;
        if (!map || !L) return;

        if (tileLayerRef.current) {
            map.removeLayer(tileLayerRef.current);
        }

        if (mapStyle === "satellite") {
            tileLayerRef.current = L.tileLayer(
                "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                {
                    attribution: '&copy; Esri &mdash; Earthstar Geographics',
                    maxZoom: 18,
                }
            ).addTo(map);
        } else {
            tileLayerRef.current = L.tileLayer(
                "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
                {
                    attribution: '&copy; CARTO',
                    maxZoom: 19,
                }
            ).addTo(map);
        }
    }, [mapStyle]);

    // Handle "Search as I move the map" viewport bounding listener
    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        const handleMoveEnd = () => {
            if (!searchAsMove || isDrawMode) return;
            const b = map.getBounds();
            if (onBoundsChange) {
                onBoundsChange({
                    minLat: b.getSouth(),
                    maxLat: b.getNorth(),
                    minLng: b.getWest(),
                    maxLng: b.getEast(),
                });
            }
        };

        map.on("moveend", handleMoveEnd);
        return () => {
            map.off("moveend", handleMoveEnd);
        };
    }, [searchAsMove, isDrawMode, onBoundsChange]);

    // Draw on Map (Polygon / Lasso Drawing)
    useEffect(() => {
        const map = mapInstanceRef.current;
        // @ts-expect-error: Leaflet on window
        const L = window.L;
        if (!map || !L) return;

        if (isDrawMode) {
            map.dragging.disable();
            mapContainerRef.current?.style.setProperty("cursor", "crosshair");
        } else {
            map.dragging.enable();
            mapContainerRef.current?.style.removeProperty("cursor");
        }
    }, [isDrawMode]);

    const handleMapMouseDown = useCallback((e: any) => {
        if (!isDrawMode) return;
        const map = mapInstanceRef.current;
        // @ts-expect-error: Leaflet on window
        const L = window.L;
        if (!map || !L) return;

        setIsDrawing(true);
        const startPoint: [number, number] = [e.latlng.lat, e.latlng.lng];
        const points: [number, number][] = [startPoint];

        if (activePolygonLayerRef.current) {
            map.removeLayer(activePolygonLayerRef.current);
        }

        const polyline = L.polyline(points, {
            color: "#d4a017",
            weight: 3,
            dashArray: "4, 6",
        }).addTo(map);

        const handleMouseMove = (moveEvent: any) => {
            points.push([moveEvent.latlng.lat, moveEvent.latlng.lng]);
            polyline.setLatLngs(points);
        };

        const handleMouseUp = () => {
            map.off("mousemove", handleMouseMove);
            map.off("mouseup", handleMouseUp);
            setIsDrawing(false);

            if (points.length > 2) {
                map.removeLayer(polyline);
                const finalPolygon = L.polygon(points, {
                    color: "#d4a017",
                    weight: 3,
                    fillColor: "rgba(212, 160, 23, 0.22)",
                    fillOpacity: 1,
                }).addTo(map);

                activePolygonLayerRef.current = finalPolygon;
                setDrawnPolygon(points);
                setIsDrawMode(false);
                if (onPolygonFilter) {
                    onPolygonFilter(points);
                }
            } else {
                map.removeLayer(polyline);
            }
        };

        map.on("mousemove", handleMouseMove);
        map.on("mouseup", handleMouseUp);
    }, [isDrawMode, onPolygonFilter]);

    useEffect(() => {
        const map = mapInstanceRef.current;
        if (!map) return;

        map.on("mousedown", handleMapMouseDown);
        return () => {
            map.off("mousedown", handleMapMouseDown);
        };
    }, [handleMapMouseDown]);

    const handleClearPolygon = () => {
        const map = mapInstanceRef.current;
        if (map && activePolygonLayerRef.current) {
            map.removeLayer(activePolygonLayerRef.current);
            activePolygonLayerRef.current = null;
        }
        setDrawnPolygon(null);
        if (onPolygonFilter) {
            onPolygonFilter(null);
        }
    };

    // Update Markers when properties, selection, or hover changes
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

        properties.forEach((prop) => {
            const coords = getDeterministicCoords(prop);
            bounds.extend(coords);

            const isSelected = prop.id === (selectedPropertyId || activeProperty?.id);
            const isHovered = prop.id === hoveredPropertyId;
            const priceLabel = formatCurrency(prop.price, true);

            const bg = isSelected
                ? "var(--gold-500, #d4a017)"
                : isHovered
                ? "#e8b930"
                : "var(--navy-950, #0a0e1a)";

            const textColor = isSelected || isHovered ? "#000000" : "#ffffff";
            const scale = isHovered || isSelected ? "scale(1.15)" : "scale(1)";
            const zOffset = isSelected ? 1200 : isHovered ? 1000 : 0;

            const html = `
                <div class="estatevue-price-pin" style="
                    background: ${bg};
                    color: ${textColor};
                    padding: 5px 10px;
                    border-radius: 9999px;
                    font-size: 11px;
                    font-weight: 700;
                    box-shadow: 0 4px 14px rgba(0,0,0,0.38);
                    border: 2px solid ${isSelected || isHovered ? "#ffffff" : "rgba(212,160,23,0.7)"};
                    white-space: nowrap;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    transform: ${scale};
                    transition: transform 0.15s ease, background 0.15s ease;
                ">
                    <span>${prop.type === "villa" ? "🏛️" : prop.type === "apartment" ? "🏢" : "🏠"}</span>
                    <span>${priceLabel}</span>
                </div>
            `;

            const icon = L.divIcon({
                className: "custom-catalog-pin",
                html,
                iconSize: [85, 28],
                iconAnchor: [42, 14],
            });

            const marker = L.marker(coords, { icon, zIndexOffset: zOffset }).addTo(map);

            marker.on("click", () => {
                setActiveProperty(prop);
                if (onSelectProperty) onSelectProperty(prop.id);
                map.panTo(coords, { animate: true, duration: 0.4 });
            });

            marker.on("mouseover", () => {
                if (onHoverProperty) onHoverProperty(prop.id);
            });

            marker.on("mouseout", () => {
                if (onHoverProperty) onHoverProperty(null);
            });

            markersRef.current[prop.id] = marker;
        });

        // Only auto-fit bounds on initial load if not in search-as-move or draw mode
        if (!searchAsMove && !drawnPolygon && bounds.isValid() && bounds.getNorthEast().lat !== bounds.getSouthWest().lat) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
    }, [
        properties,
        isLeafletReady,
        formatCurrency,
        selectedPropertyId,
        hoveredPropertyId,
        activeProperty?.id,
        onSelectProperty,
        onHoverProperty,
        searchAsMove,
        drawnPolygon,
    ]);

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

            {/* Top Floating Controls Bar */}
            <div
                style={{
                    position: "absolute",
                    top: "14px",
                    left: "14px",
                    right: "14px",
                    zIndex: 1000,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    pointerEvents: "none",
                }}
            >
                {/* Left badges: Count & Draw on Map */}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", pointerEvents: "auto" }}>
                    <div
                        style={{
                            background: "rgba(10, 14, 26, 0.88)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                            border: "1px solid rgba(255,255,255,0.18)",
                        }}
                    >
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--gold-500)" }} />
                        <span>{properties.length} Properties</span>
                    </div>

                    {/* Draw on Map button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (drawnPolygon) {
                                handleClearPolygon();
                            } else {
                                setIsDrawMode(!isDrawMode);
                            }
                        }}
                        style={{
                            background: isDrawMode
                                ? "linear-gradient(135deg, var(--gold-500), #e8b930)"
                                : drawnPolygon
                                ? "rgba(239, 68, 68, 0.9)"
                                : "rgba(10, 14, 26, 0.88)",
                            backdropFilter: "blur(10px)",
                            color: isDrawMode ? "#0a0e1a" : "#ffffff",
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            border: "1px solid rgba(255,255,255,0.2)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                            transition: "all 0.15s ease",
                        }}
                    >
                        {drawnPolygon ? (
                            <span>✕ Clear Boundary</span>
                        ) : isDrawMode ? (
                            <span>✏️ Click & Drag to Draw</span>
                        ) : (
                            <span>✏️ Draw on Map</span>
                        )}
                    </button>
                </div>

                {/* Right controls: Search as Move & Tile switch */}
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", pointerEvents: "auto" }}>
                    {showSearchAsMoveToggle && (
                        <label
                            style={{
                                background: "rgba(10, 14, 26, 0.88)",
                                backdropFilter: "blur(10px)",
                                color: "#fff",
                                padding: "0.42rem 0.85rem",
                                borderRadius: "var(--radius-full)",
                                fontSize: "0.78rem",
                                fontWeight: 600,
                                display: "flex",
                                alignItems: "center",
                                gap: "0.45rem",
                                cursor: "pointer",
                                boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
                                border: "1px solid rgba(255,255,255,0.18)",
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={searchAsMove}
                                onChange={(e) => setSearchAsMove(e.target.checked)}
                                style={{ accentColor: "var(--gold-500)" }}
                            />
                            <span>Search as map moves</span>
                        </label>
                    )}

                    {/* Satellite switch */}
                    <button
                        type="button"
                        onClick={() => setMapStyle(mapStyle === "standard" ? "satellite" : "standard")}
                        style={{
                            background: "rgba(10, 14, 26, 0.88)",
                            backdropFilter: "blur(10px)",
                            color: "#fff",
                            padding: "0.42rem 0.75rem",
                            borderRadius: "var(--radius-full)",
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            border: "1px solid rgba(255,255,255,0.18)",
                            cursor: "pointer",
                        }}
                    >
                        {mapStyle === "standard" ? "🛰️ Satellite" : "🗺️ Map"}
                    </button>
                </div>
            </div>

            {/* Drawing instructions banner */}
            {isDrawMode && (
                <div
                    style={{
                        position: "absolute",
                        top: "62px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 1000,
                        background: "rgba(212, 160, 23, 0.95)",
                        color: "#0a0e1a",
                        padding: "0.5rem 1.25rem",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                        pointerEvents: "none",
                    }}
                >
                    Press & drag your mouse to outline your desired area
                </div>
            )}

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
                        boxShadow: "0 8px 30px rgba(0,0,0,0.25)",
                        border: "1px solid var(--border-color)",
                        overflow: "hidden",
                    }}
                >
                    <div style={{ position: "relative", height: "130px", width: "100%" }}>
                        <Image
                            src={activeProperty.images?.[0] || "/images/property-1.png"}
                            alt={activeProperty.title}
                            fill
                            style={{ objectFit: "cover" }}
                        />
                        <button
                            onClick={() => setActiveProperty(null)}
                            style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                background: "rgba(0,0,0,0.6)",
                                border: "none",
                                color: "#fff",
                                width: "24px",
                                height: "24px",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                fontSize: "12px",
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    <div style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary)", textTransform: "capitalize" }}>
                            {activeProperty.type} • {typeof activeProperty.location === "object" ? activeProperty.location.neighborhood : ""}
                        </div>
                        <h4
                            style={{
                                fontSize: "0.95rem",
                                fontWeight: 700,
                                margin: "2px 0 6px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                color: "var(--text-heading)",
                            }}
                        >
                            {activeProperty.title}
                        </h4>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gold-500)" }}>
                                {formatCurrency(activeProperty.price)}
                                {activeProperty.listingType === "rent" && <span style={{ fontSize: "0.75rem" }}>/mo</span>}
                            </span>
                            <Link
                                href={`/properties/${activeProperty.id}`}
                                className="btn btn-primary"
                                style={{ padding: "0.35rem 0.85rem", fontSize: "0.8rem", borderRadius: "var(--radius-full)" }}
                            >
                                View Details →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
