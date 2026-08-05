"use client";
import { useEffect, useRef, useState } from "react";

interface PropertyMapProps {
    address: string;
    city: string;
    neighborhood?: string;
    latitude?: number;
    longitude?: number;
    height?: string;
}

export default function PropertyMap({ address, city, neighborhood, latitude, longitude, height = "300px" }: PropertyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const [showDirections, setShowDirections] = useState(false);

    // Use agent-provided coordinates, or fallback to geocoding
    useEffect(() => {
        if (latitude && longitude && latitude !== 0 && longitude !== 0) {
            setCoords({ lat: latitude, lng: longitude });
            return;
        }

        // Fallback: geocode the address
        const query = encodeURIComponent(`${address || ""} ${neighborhood || ""} ${city}`.trim());
        if (!query) return;

        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`, {
            headers: { "Accept-Language": "en" },
        })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.length > 0) {
                    setCoords({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
                } else {
                    return fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`, {
                        headers: { "Accept-Language": "en" },
                    })
                        .then((r) => r.json())
                        .then((fallback) => {
                            if (fallback && fallback.length > 0) {
                                setCoords({ lat: parseFloat(fallback[0].lat), lng: parseFloat(fallback[0].lon) });
                            }
                        });
                }
            })
            .catch(console.error);
    }, [address, city, neighborhood, latitude, longitude]);

    // Load Leaflet dynamically
    useEffect(() => {
        if (!coords || !mapRef.current || mapLoaded) return;

        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        const initMap = () => {
            if (!mapRef.current || !coords) return;
            // @ts-expect-error: Leaflet loaded via CDN
            const L = window.L;
            if (!L) return;

            const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 16);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            const icon = L.divIcon({
                className: "custom-map-marker",
                html: `<div style="width:36px;height:36px;background:var(--navy-800,#0a0e1a);border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);border:3px solid #d4a017"><span style="transform:rotate(45deg);font-size:16px">🏠</span></div>`,
                iconSize: [36, 36],
                iconAnchor: [18, 36],
            });

            L.marker([coords.lat, coords.lng], { icon }).addTo(map)
                .bindPopup(`<strong>${neighborhood || city}</strong><br/>${address || city}`);

            setMapLoaded(true);
        };

        // @ts-expect-error: Leaflet loaded via CDN
        if (window.L) {
            initMap();
        } else {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => initMap();
            document.head.appendChild(script);
        }
    }, [coords, mapLoaded, address, city, neighborhood]);

    const openDirections = (app: "google" | "waze" | "apple") => {
        if (!coords) return;
        const { lat, lng } = coords;
        const destination = `${lat},${lng}`;
        const label = encodeURIComponent(`${address || neighborhood || city}`);

        const urls: Record<string, string> = {
            google: `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`,
            waze: `https://waze.com/ul?ll=${lat},${lng}&navigate=yes&z=10`,
            apple: `https://maps.apple.com/?daddr=${destination}&dirflg=d&t=m`,
        };

        window.open(urls[app], "_blank");
        setShowDirections(false);
    };

    if (!coords) {
        return (
            <div style={{
                height,
                borderRadius: "var(--radius-lg)",
                background: "var(--bg-tertiary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-tertiary)",
                fontSize: "0.85rem",
            }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.5rem", animation: "spin 1s linear infinite" }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                Loading map...
            </div>
        );
    }

    return (
        <div style={{ position: "relative" }}>
            <div
                ref={mapRef}
                style={{
                    height,
                    borderRadius: "var(--radius-lg)",
                    overflow: "hidden",
                    border: "1px solid var(--border-light)",
                    zIndex: 0,
                }}
            />

            {/* Get Directions Button */}
            <button
                onClick={() => setShowDirections(!showDirections)}
                style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    zIndex: 1000,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.55rem 1rem",
                    borderRadius: "var(--radius-full, 50px)",
                    border: "none",
                    background: "var(--navy-800, #0a0e1a)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                    transition: "transform 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="3 11 22 2 13 21 11 13 3 11" />
                </svg>
                Get Directions
            </button>

            {/* App Chooser Modal */}
            {showDirections && (
                <div
                    onClick={() => setShowDirections(false)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 9999,
                        background: "rgba(0,0,0,0.5)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        padding: "1rem",
                        animation: "fadeIn 0.2s ease",
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: "var(--bg-primary, #fff)",
                            borderRadius: "16px 16px 12px 12px",
                            width: "100%",
                            maxWidth: "400px",
                            padding: "1.25rem",
                            boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
                            animation: "slideUp 0.25s ease",
                        }}
                    >
                        <h3 style={{
                            fontSize: "1rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginBottom: "0.25rem",
                            textAlign: "center",
                        }}>Get Directions</h3>
                        <p style={{
                            fontSize: "0.78rem",
                            color: "var(--text-tertiary)",
                            textAlign: "center",
                            marginBottom: "1rem",
                        }}>Choose your preferred navigation app</p>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                            <button
                                onClick={() => openDirections("google")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.85rem 1rem",
                                    borderRadius: "var(--radius-md, 10px)",
                                    border: "1px solid var(--border-light, #e5e7eb)",
                                    background: "var(--bg-secondary, #f9fafb)",
                                    cursor: "pointer",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(66,133,244,0.08)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary, #f9fafb)")}
                            >
                                <span style={{ fontSize: "1.5rem" }}>🗺️</span>
                                <div style={{ textAlign: "left" }}>
                                    <div>Google Maps</div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 400 }}>Navigate with turn-by-turn directions</div>
                                </div>
                            </button>

                            <button
                                onClick={() => openDirections("waze")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.85rem 1rem",
                                    borderRadius: "var(--radius-md, 10px)",
                                    border: "1px solid var(--border-light, #e5e7eb)",
                                    background: "var(--bg-secondary, #f9fafb)",
                                    cursor: "pointer",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(51,191,255,0.08)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary, #f9fafb)")}
                            >
                                <span style={{ fontSize: "1.5rem" }}>🚗</span>
                                <div style={{ textAlign: "left" }}>
                                    <div>Waze</div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 400 }}>Real-time traffic & fastest route</div>
                                </div>
                            </button>

                            <button
                                onClick={() => openDirections("apple")}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.75rem",
                                    padding: "0.85rem 1rem",
                                    borderRadius: "var(--radius-md, 10px)",
                                    border: "1px solid var(--border-light, #e5e7eb)",
                                    background: "var(--bg-secondary, #f9fafb)",
                                    cursor: "pointer",
                                    fontSize: "0.88rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(0,0,0,0.04)")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-secondary, #f9fafb)")}
                            >
                                <span style={{ fontSize: "1.5rem" }}>🍎</span>
                                <div style={{ textAlign: "left" }}>
                                    <div>Apple Maps</div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", fontWeight: 400 }}>Built-in navigation for iPhone</div>
                                </div>
                            </button>
                        </div>

                        <button
                            onClick={() => setShowDirections(false)}
                            style={{
                                width: "100%",
                                marginTop: "0.75rem",
                                padding: "0.7rem",
                                borderRadius: "var(--radius-md, 10px)",
                                border: "none",
                                background: "var(--bg-tertiary, #f3f4f6)",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: "var(--text-secondary)",
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes slideUp {
                    from { transform: translateY(100%); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
