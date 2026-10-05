"use client";
import { useState } from "react";

interface FloorPlanViewerProps {
    propertyTitle: string;
    totalArea: number;
    bedrooms: number;
    bathrooms: number;
}

export default function FloorPlanViewer({
    propertyTitle,
    totalArea,
    bedrooms,
    bathrooms,
}: FloorPlanViewerProps) {
    const [selectedLevel, setSelectedLevel] = useState<"ground" | "upper">("ground");

    // Proportional dimensions based on totalArea
    const groundArea = Math.round(totalArea * 0.55);
    const upperArea = totalArea - groundArea;

    const groundRooms = [
        { name: "Grand Living Room", dims: "7.5m × 5.2m", sqm: 39, sqft: 420, icon: "🛋️", feature: "Floor-to-ceiling glass, garden terrace access" },
        { name: "Chef's Kitchen", dims: "4.8m × 3.8m", sqm: 18, sqft: 196, icon: "🍳", feature: "Island counter, pantry, breakfast nook" },
        { name: "Formal Dining Hall", dims: "4.5m × 4.2m", sqm: 19, sqft: 204, icon: "🍽️", feature: "Seats 10, recessed ambient lighting" },
        { name: "Guest Bedroom Suite", dims: "4.2m × 3.6m", sqm: 15, sqft: 163, icon: "🛏️", feature: "En-suite bathroom, built-in wardrobes" },
        { name: "Covered Verandah", dims: "5.5m × 3.0m", sqm: 16.5, sqft: 178, icon: "🌿", feature: "Outdoor lounge, BBQ connection" },
    ];

    const upperRooms = [
        { name: "Primary Master Suite", dims: "6.2m × 5.0m", sqm: 31, sqft: 334, icon: "👑", feature: "Walk-in dressing room, private balcony" },
        { name: "Master Spa Bathroom", dims: "3.8m × 3.2m", sqm: 12, sqft: 131, icon: "🛁", feature: "Soaking tub, rainfall shower, double vanity" },
        { name: "Bedroom 2 (En-Suite)", dims: "4.4m × 3.8m", sqm: 16.7, sqft: 180, icon: "🛏️", feature: "Garden views, acoustic insulation" },
        { name: "Bedroom 3", dims: "4.0m × 3.6m", sqm: 14.4, sqft: 155, icon: "🛏️", feature: "Built-in study desk, corner windows" },
        { name: "Family Media Lounge", dims: "5.0m × 4.0m", sqm: 20, sqft: 215, icon: "📺", feature: "Entertainment hub, terrace access" },
    ];

    const activeRooms = selectedLevel === "ground" ? groundRooms : upperRooms;

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
                        <span>📐</span> Architectural Floor Plans & Layout
                    </h3>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)", margin: "3px 0 0" }}>
                        Total Gross Internal Area: <strong>{totalArea.toLocaleString()} sqft</strong> · {bedrooms} Beds · {bathrooms} Baths
                    </p>
                </div>

                {/* Level Switcher */}
                <div style={{
                    display: "flex",
                    background: "var(--bg-tertiary, #eef2fb)",
                    padding: "3px",
                    borderRadius: "var(--radius-md, 10px)",
                    gap: "4px",
                }}>
                    <button
                        onClick={() => setSelectedLevel("ground")}
                        style={{
                            padding: "0.45rem 0.9rem",
                            borderRadius: "var(--radius-sm, 6px)",
                            border: "none",
                            background: selectedLevel === "ground" ? "var(--bg-primary, #fff)" : "transparent",
                            color: selectedLevel === "ground" ? "var(--navy-900, #0a0e1a)" : "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            boxShadow: selectedLevel === "ground" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s",
                        }}
                    >
                        Level 1: Ground Floor ({groundArea.toLocaleString()} sqft)
                    </button>
                    <button
                        onClick={() => setSelectedLevel("upper")}
                        style={{
                            padding: "0.45rem 0.9rem",
                            borderRadius: "var(--radius-sm, 6px)",
                            border: "none",
                            background: selectedLevel === "upper" ? "var(--bg-primary, #fff)" : "transparent",
                            color: selectedLevel === "upper" ? "var(--navy-900, #0a0e1a)" : "var(--text-secondary)",
                            fontWeight: 700,
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            boxShadow: selectedLevel === "upper" ? "var(--shadow-sm)" : "none",
                            transition: "all 0.15s",
                        }}
                    >
                        Level 2: Upper Floor ({upperArea.toLocaleString()} sqft)
                    </button>
                </div>
            </div>

            {/* SVG Architectural Blueprint Diagram */}
            <div style={{
                background: "var(--bg-primary, #ffffff)",
                border: "1px solid var(--border-light, #eef2fb)",
                borderRadius: "var(--radius-md, 10px)",
                padding: "1.25rem",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                overflowX: "auto",
                marginBottom: "1.25rem",
            }}>
                <svg
                    viewBox="0 0 800 420"
                    style={{ width: "100%", maxWidth: "760px", height: "auto", minHeight: "260px" }}
                >
                    {/* Background Grid Lines */}
                    <defs>
                        <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(212,160,23,0.08)" strokeWidth="1" />
                        </pattern>
                    </defs>
                    <rect width="800" height="420" fill="url(#blueprintGrid)" rx="8" />

                    {selectedLevel === "ground" ? (
                        /* Ground Floor Blueprint */
                        <g>
                            {/* Living Room */}
                            <rect x="50" y="50" width="340" height="200" fill="rgba(61,82,145,0.06)" stroke="var(--navy-600)" strokeWidth="2.5" rx="4" />
                            <text x="70" y="85" fill="var(--navy-800)" fontWeight="700" fontSize="15">Grand Living Room</text>
                            <text x="70" y="105" fill="var(--text-tertiary)" fontSize="12">7.5m × 5.2m (39 m²)</text>
                            <circle cx="220" cy="150" r="28" fill="rgba(212,160,23,0.15)" stroke="var(--gold-500)" strokeDasharray="3,3" />
                            <text x="220" y="154" fill="var(--gold-600)" fontSize="11" textAnchor="middle" fontWeight="600">Lounge Area</text>

                            {/* Kitchen */}
                            <rect x="410" y="50" width="220" height="150" fill="rgba(16,185,129,0.06)" stroke="var(--success)" strokeWidth="2" rx="4" />
                            <text x="425" y="80" fill="var(--navy-800)" fontWeight="700" fontSize="14">Chef's Kitchen</text>
                            <text x="425" y="98" fill="var(--text-tertiary)" fontSize="11">4.8m × 3.8m (18 m²)</text>
                            <rect x="440" y="120" width="90" height="45" fill="#e2e8f0" rx="3" stroke="#94a3b8" />
                            <text x="485" y="146" fill="#475569" fontSize="10" textAnchor="middle">Island</text>

                            {/* Dining */}
                            <rect x="410" y="220" width="220" height="150" fill="rgba(212,160,23,0.06)" stroke="var(--gold-500)" strokeWidth="2" rx="4" />
                            <text x="425" y="250" fill="var(--navy-800)" fontWeight="700" fontSize="14">Dining Hall</text>
                            <text x="425" y="268" fill="var(--text-tertiary)" fontSize="11">4.5m × 4.2m (19 m²)</text>
                            <rect x="460" y="285" width="110" height="50" rx="20" fill="rgba(212,160,23,0.12)" stroke="var(--gold-500)" />
                            <text x="515" y="314" fill="var(--gold-600)" fontSize="11" textAnchor="middle">Table (10 Seats)</text>

                            {/* Guest Suite */}
                            <rect x="50" y="270" width="220" height="100" fill="rgba(139,92,246,0.06)" stroke="#8b5cf6" strokeWidth="2" rx="4" />
                            <text x="65" y="300" fill="var(--navy-800)" fontWeight="700" fontSize="13">Guest Bedroom Suite</text>
                            <text x="65" y="318" fill="var(--text-tertiary)" fontSize="11">4.2m × 3.6m (15 m²)</text>

                            {/* Verandah / Patio */}
                            <rect x="290" y="270" width="100" height="100" fill="rgba(16,185,129,0.04)" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4,3" rx="4" />
                            <text x="340" y="315" fill="#10b981" fontSize="12" textAnchor="middle" fontWeight="600">Verandah</text>
                            <text x="340" y="332" fill="var(--text-tertiary)" fontSize="10" textAnchor="middle">16.5 m²</text>

                            {/* Entry & Foyer */}
                            <rect x="650" y="110" width="100" height="200" fill="rgba(100,116,139,0.06)" stroke="#64748b" strokeWidth="1.5" rx="4" />
                            <text x="700" y="200" fill="#475569" fontSize="12" textAnchor="middle" fontWeight="700">Foyer & Entry</text>
                            <path d="M 700 240 L 700 280 M 690 270 L 700 280 L 710 270" fill="none" stroke="var(--gold-500)" strokeWidth="2" />
                        </g>
                    ) : (
                        /* Upper Floor Blueprint */
                        <g>
                            {/* Master Suite */}
                            <rect x="50" y="50" width="360" height="210" fill="rgba(212,160,23,0.08)" stroke="var(--gold-500)" strokeWidth="2.5" rx="4" />
                            <text x="70" y="85" fill="var(--navy-800)" fontWeight="700" fontSize="15">Primary Master Suite</text>
                            <text x="70" y="105" fill="var(--text-tertiary)" fontSize="12">6.2m × 5.0m (31 m²)</text>
                            {/* Bed graphic */}
                            <rect x="180" y="115" width="100" height="95" rx="4" fill="#e2e8f0" stroke="var(--gold-500)" />
                            <text x="230" y="165" fill="#64748b" fontSize="11" textAnchor="middle">King Bed</text>

                            {/* Spa Bath */}
                            <rect x="430" y="50" width="200" height="150" fill="rgba(59,130,246,0.06)" stroke="#3b82f6" strokeWidth="2" rx="4" />
                            <text x="445" y="80" fill="var(--navy-800)" fontWeight="700" fontSize="14">Master Spa Bath</text>
                            <text x="445" y="98" fill="var(--text-tertiary)" fontSize="11">3.8m × 3.2m (12 m²)</text>
                            <ellipse cx="530" cy="140" rx="35" ry="20" fill="#dbeafe" stroke="#3b82f6" />
                            <text x="530" y="144" fill="#1e40af" fontSize="10" textAnchor="middle">Tub</text>

                            {/* Bedroom 2 */}
                            <rect x="50" y="280" width="230" height="100" fill="rgba(16,185,129,0.06)" stroke="#10b981" strokeWidth="2" rx="4" />
                            <text x="65" y="310" fill="var(--navy-800)" fontWeight="700" fontSize="13">Bedroom 2 (En-Suite)</text>
                            <text x="65" y="328" fill="var(--text-tertiary)" fontSize="11">4.4m × 3.8m (16.7 m²)</text>

                            {/* Bedroom 3 */}
                            <rect x="300" y="280" width="200" height="100" fill="rgba(139,92,246,0.06)" stroke="#8b5cf6" strokeWidth="2" rx="4" />
                            <text x="315" y="310" fill="var(--navy-800)" fontWeight="700" fontSize="13">Bedroom 3</text>
                            <text x="315" y="328" fill="var(--text-tertiary)" fontSize="11">4.0m × 3.6m (14.4 m²)</text>

                            {/* Family Lounge */}
                            <rect x="520" y="220" width="230" height="160" fill="rgba(61,82,145,0.06)" stroke="var(--navy-600)" strokeWidth="2" rx="4" />
                            <text x="535" y="250" fill="var(--navy-800)" fontWeight="700" fontSize="14">Family Media Lounge</text>
                            <text x="535" y="268" fill="var(--text-tertiary)" fontSize="11">5.0m × 4.0m (20 m²)</text>
                        </g>
                    )}
                </svg>
            </div>

            {/* Room Dimensions Breakdown Table */}
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                    <thead>
                        <tr style={{ borderBottom: "2px solid var(--border-color, #e2e6ee)", textAlign: "left" }}>
                            <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-tertiary)", fontWeight: 700 }}>Room</th>
                            <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-tertiary)", fontWeight: 700 }}>Dimensions</th>
                            <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-tertiary)", fontWeight: 700 }}>Area</th>
                            <th style={{ padding: "0.6rem 0.75rem", color: "var(--text-tertiary)", fontWeight: 700 }}>Key Highlights</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeRooms.map((room) => (
                            <tr key={room.name} style={{ borderBottom: "1px solid var(--border-light, #eef2fb)" }}>
                                <td style={{ padding: "0.6rem 0.75rem", fontWeight: 600, color: "var(--text-heading)" }}>
                                    <span style={{ marginRight: "0.4rem" }}>{room.icon}</span> {room.name}
                                </td>
                                <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-secondary)" }}>{room.dims}</td>
                                <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: "var(--gold-600)" }}>
                                    {room.sqft} sqft <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-tertiary)" }}>({room.sqm} m²)</span>
                                </td>
                                <td style={{ padding: "0.6rem 0.75rem", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
                                    {room.feature}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
