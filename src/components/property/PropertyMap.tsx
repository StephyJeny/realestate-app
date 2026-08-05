"use client";
import { useEffect, useRef, useState } from "react";

interface PropertyMapProps {
    address: string;
    city: string;
    neighborhood?: string;
    height?: string;
}

export default function PropertyMap({ address, city, neighborhood, height = "300px" }: PropertyMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

    // Geocode the address using Nominatim (free OpenStreetMap geocoder)
    useEffect(() => {
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
                    // Fallback: try just city
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
    }, [address, city, neighborhood]);

    // Load Leaflet dynamically (client-side only)
    useEffect(() => {
        if (!coords || !mapRef.current || mapLoaded) return;

        // Add Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        // Load Leaflet JS
        const loadLeaflet = () => {
            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = () => initMap();
            document.head.appendChild(script);
        };

        const initMap = () => {
            if (!mapRef.current || !coords) return;
            // @ts-expect-error: Leaflet loaded via CDN
            const L = window.L;
            if (!L) return;

            const map = L.map(mapRef.current).setView([coords.lat, coords.lng], 15);
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map);

            // Custom marker
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
            loadLeaflet();
        }
    }, [coords, mapLoaded, address, city, neighborhood]);

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
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: "0.5rem" }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                Loading map...
            </div>
        );
    }

    return (
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
    );
}
