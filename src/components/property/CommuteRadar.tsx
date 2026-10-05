"use client";
import { useState } from "react";

interface CommuteRadarProps {
    neighborhood: string;
    city: string;
}

export default function CommuteRadar({ neighborhood, city }: CommuteRadarProps) {
    const [travelMode, setTravelMode] = useState<"drive" | "rush" | "transit">("drive");

    const nLower = neighborhood.toLowerCase();

    // Contextual commute destinations for Kenyan cities
    const destinations = [
        {
            name: city.toLowerCase() === "mombasa" ? "Mombasa Old Town & CBD" : "Nairobi CBD (City Center)",
            icon: "🏛️",
            distKm: nLower.includes("karen") ? 18 : nLower.includes("westlands") ? 4 : nLower.includes("kilimani") ? 6 : nLower.includes("runda") ? 15 : 12,
            driveMins: nLower.includes("karen") ? 25 : nLower.includes("westlands") ? 10 : nLower.includes("kilimani") ? 14 : nLower.includes("runda") ? 22 : 18,
            rushMins: nLower.includes("karen") ? 45 : nLower.includes("westlands") ? 22 : nLower.includes("kilimani") ? 28 : nLower.includes("runda") ? 40 : 35,
            transitMins: nLower.includes("karen") ? 40 : nLower.includes("westlands") ? 15 : nLower.includes("kilimani") ? 20 : nLower.includes("runda") ? 35 : 30,
            routeNote: nLower.includes("karen") ? "Via Southern Bypass or Ngong Rd" : nLower.includes("westlands") ? "Direct via Waiyaki Way" : "Via Argwings Kodhek",
        },
        {
            name: city.toLowerCase() === "mombasa" ? "Moi International Airport (MBA)" : "JKIA International Airport (NBO)",
            icon: "✈️",
            distKm: nLower.includes("karen") ? 28 : nLower.includes("westlands") ? 20 : nLower.includes("kilimani") ? 18 : nLower.includes("runda") ? 26 : 22,
            driveMins: nLower.includes("karen") ? 28 : nLower.includes("westlands") ? 20 : nLower.includes("kilimani") ? 22 : nLower.includes("runda") ? 25 : 24,
            rushMins: nLower.includes("karen") ? 38 : nLower.includes("westlands") ? 30 : nLower.includes("kilimani") ? 32 : nLower.includes("runda") ? 35 : 32,
            transitMins: nLower.includes("karen") ? 55 : nLower.includes("westlands") ? 45 : nLower.includes("kilimani") ? 40 : nLower.includes("runda") ? 50 : 45,
            routeNote: "Direct highway access via Nairobi Expressway",
        },
        {
            name: "Westlands / Commercial & Dining Hub",
            icon: "🛍️",
            distKm: nLower.includes("westlands") ? 1 : nLower.includes("kilimani") ? 5 : nLower.includes("karen") ? 19 : 8,
            driveMins: nLower.includes("westlands") ? 3 : nLower.includes("kilimani") ? 12 : nLower.includes("karen") ? 24 : 15,
            rushMins: nLower.includes("westlands") ? 6 : nLower.includes("kilimani") ? 22 : nLower.includes("karen") ? 42 : 26,
            transitMins: nLower.includes("westlands") ? 5 : nLower.includes("kilimani") ? 18 : nLower.includes("karen") ? 38 : 22,
            routeNote: "Sarit Expo Centre, Westgate Mall, GTC Tower",
        },
        {
            name: "Premier Hospital (Aga Khan / Nairobi Hospital)",
            icon: "🏥",
            distKm: nLower.includes("karen") ? 5 : nLower.includes("kilimani") ? 3 : 6,
            driveMins: nLower.includes("karen") ? 8 : nLower.includes("kilimani") ? 6 : 10,
            rushMins: nLower.includes("karen") ? 12 : nLower.includes("kilimani") ? 14 : 18,
            transitMins: nLower.includes("karen") ? 15 : nLower.includes("kilimani") ? 12 : 20,
            routeNote: "Karen Hospital / Nairobi Hospital Outpatient / Aga Khan",
        },
        {
            name: "International Schools Corridor",
            icon: "🎓",
            distKm: nLower.includes("karen") ? 4 : nLower.includes("runda") ? 5 : 7,
            driveMins: nLower.includes("karen") ? 6 : nLower.includes("runda") ? 8 : 12,
            rushMins: nLower.includes("karen") ? 10 : nLower.includes("runda") ? 14 : 20,
            transitMins: nLower.includes("karen") ? 12 : nLower.includes("runda") ? 16 : 22,
            routeNote: "Brookhouse, ISK, Banda School, Braeburn",
        },
    ];

    return (
        <div style={{
            background: "var(--bg-secondary, #f8f9fb)",
            border: "1px solid var(--border-color, #e2e6ee)",
            borderRadius: "var(--radius-lg, 16px)",
            padding: "1.5rem",
            marginTop: "1.5rem",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", marginBottom: "1.25rem" }}>
                <div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-heading, #0f1629)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>🚗</span> Commute Time & Proximity Radar
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)", margin: "3px 0 0" }}>
                        Estimated travel times from {neighborhood || city} to key destinations
                    </p>
                </div>

                {/* Mode Selector */}
                <div style={{
                    display: "flex",
                    background: "var(--bg-tertiary, #eef2fb)",
                    padding: "3px",
                    borderRadius: "var(--radius-md, 10px)",
                    gap: "4px",
                }}>
                    <button
                        onClick={() => setTravelMode("drive")}
                        style={{
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-sm, 6px)",
                            border: "none",
                            background: travelMode === "drive" ? "var(--bg-primary, #fff)" : "transparent",
                            color: travelMode === "drive" ? "var(--navy-900, #0a0e1a)" : "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            boxShadow: travelMode === "drive" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s",
                        }}
                    >
                        🚗 Drive (Normal)
                    </button>
                    <button
                        onClick={() => setTravelMode("rush")}
                        style={{
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-sm, 6px)",
                            border: "none",
                            background: travelMode === "rush" ? "var(--bg-primary, #fff)" : "transparent",
                            color: travelMode === "rush" ? "var(--navy-900, #0a0e1a)" : "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            boxShadow: travelMode === "rush" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s",
                        }}
                    >
                        🚙 Rush Hour
                    </button>
                    <button
                        onClick={() => setTravelMode("transit")}
                        style={{
                            padding: "0.45rem 0.85rem",
                            borderRadius: "var(--radius-sm, 6px)",
                            border: "none",
                            background: travelMode === "transit" ? "var(--bg-primary, #fff)" : "transparent",
                            color: travelMode === "transit" ? "var(--navy-900, #0a0e1a)" : "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            boxShadow: travelMode === "transit" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s",
                        }}
                    >
                        🚌 Transit
                    </button>
                </div>
            </div>

            {/* Commute Cards Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                {destinations.map((dest) => {
                    const minutes =
                        travelMode === "drive"
                            ? dest.driveMins
                            : travelMode === "rush"
                            ? dest.rushMins
                            : dest.transitMins;

                    const color =
                        minutes <= 15
                            ? "var(--success, #10b981)"
                            : minutes <= 30
                            ? "var(--gold-500, #d4a017)"
                            : "var(--warning, #f59e0b)";

                    return (
                        <div
                            key={dest.name}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "0.85rem 1rem",
                                background: "var(--bg-primary, #fff)",
                                borderRadius: "var(--radius-md, 10px)",
                                border: "1px solid var(--border-light, #eef2fb)",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                                <span style={{ fontSize: "1.3rem" }}>{dest.icon}</span>
                                <div>
                                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--text-heading)" }}>
                                        {dest.name}
                                    </div>
                                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary)", marginTop: "2px" }}>
                                        {dest.distKm} km · {dest.routeNote}
                                    </div>
                                </div>
                            </div>

                            <div style={{ textAlign: "right", flexShrink: 0 }}>
                                <div style={{ fontSize: "1.1rem", fontWeight: 800, color }}>
                                    {minutes} mins
                                </div>
                                <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                                    {travelMode === "rush" ? "peak traffic" : travelMode === "transit" ? "public transit" : "typical drive"}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
