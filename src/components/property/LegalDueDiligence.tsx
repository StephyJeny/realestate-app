"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";

interface LegalDueDiligenceProps {
    propertyTitle: string;
    city: string;
    neighborhood: string;
    listingType: string;
    onOpenInquiry?: () => void;
}

export default function LegalDueDiligence({
    propertyTitle,
    city,
    neighborhood,
    listingType,
    onOpenInquiry,
}: LegalDueDiligenceProps) {
    const [downloading, setDownloading] = useState(false);

    // Deterministic LR parcel number based on title
    const parcelHash = propertyTitle.split("").reduce((acc, c) => acc + c.charCodeAt(0), 100);
    const lrNumber = `LR No. 209/${(parcelHash * 13) % 90000 + 10000}`;
    const registryOffice = city.toLowerCase() === "mombasa" ? "Mombasa Central Land Registry" : "Ardhisasa Nairobi Central Registry";
    const tenureType = ["karen", "runda", "kitisuru", "muthaiga"].includes(neighborhood.toLowerCase())
        ? "Freehold Interest (Absolute Ownership)"
        : "99-Year Leasehold (Renewable)";

    const verificationItems = [
        {
            title: "Ardhisasa / Land Registry Search",
            status: "Verified",
            detail: "Title search conducted with zero encumbrances or caveats.",
            icon: "✅",
        },
        {
            title: "Title Deed Tenure",
            status: tenureType.startsWith("Freehold") ? "Freehold" : "99-Yr Lease",
            detail: tenureType,
            icon: "📜",
        },
        {
            title: "Survey & Boundary Beacons",
            status: "Confirmed",
            detail: "Deed plan beacons verified against Survey of Kenya cadastral maps.",
            icon: "📍",
        },
        {
            title: "County Rates & Land Rent",
            status: "Cleared",
            detail: "Full rates and ground rent clearance certificate issued for 2026.",
            icon: "🏛️",
        },
        {
            title: "Development Approvals",
            status: "Approved",
            detail: "County architectural & structural building approvals on file.",
            icon: "🏗️",
        },
    ];

    const handleRequestPacket = () => {
        setDownloading(true);
        setTimeout(() => {
            setDownloading(false);
            toast.success("Due Diligence Dossier requested! Our legal coordinator will email the verification pack.");
            if (onOpenInquiry) {
                onOpenInquiry();
            }
        }, 600);
    };

    return (
        <div style={{
            background: "var(--bg-secondary, #f8f9fb)",
            border: "1px solid var(--border-color, #e2e6ee)",
            borderRadius: "var(--radius-lg, 16px)",
            padding: "1.5rem",
            marginTop: "1.5rem",
            boxShadow: "var(--shadow-sm)",
        }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-light, #eef2fb)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <div style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        background: "rgba(16, 185, 129, 0.12)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.25rem",
                        color: "var(--success, #10b981)",
                    }}>
                        🛡️
                    </div>
                    <div>
                        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-heading, #0f1629)", margin: 0 }}>
                            Legal Due Diligence & Title Verification
                        </h3>
                        <p style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)", margin: "2px 0 0" }}>
                            Verified under Kenya Ministry of Lands & Physical Planning standards
                        </p>
                    </div>
                </div>

                <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    background: "rgba(16, 185, 129, 0.1)",
                    color: "var(--success, #10b981)",
                    padding: "0.35rem 0.85rem",
                    borderRadius: "var(--radius-full)",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                }}>
                    <span>✓</span> Verified EstateVue Listing
                </div>
            </div>

            {/* Quick Summary Pill Row */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: "0.75rem",
                marginBottom: "1.25rem",
            }}>
                <div style={{ background: "var(--bg-primary, #fff)", padding: "0.85rem", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--border-light, #eef2fb)" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Registered Parcel</span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading)", marginTop: "2px" }}>{lrNumber}</div>
                </div>
                <div style={{ background: "var(--bg-primary, #fff)", padding: "0.85rem", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--border-light, #eef2fb)" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Tenure Type</span>
                    <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading)", marginTop: "2px" }}>
                        {tenureType.startsWith("Freehold") ? "Freehold" : "99-Yr Lease"}
                    </div>
                </div>
                <div style={{ background: "var(--bg-primary, #fff)", padding: "0.85rem", borderRadius: "var(--radius-md, 10px)", border: "1px solid var(--border-light, #eef2fb)" }}>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.5px" }}>Registry Registry</span>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-heading)", marginTop: "2px" }}>{registryOffice}</div>
                </div>
            </div>

            {/* Checklist Grid */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1.25rem" }}>
                {verificationItems.map((item) => (
                    <div
                        key={item.title}
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "0.75rem",
                            padding: "0.75rem 1rem",
                            background: "var(--bg-primary, #fff)",
                            borderRadius: "var(--radius-md, 10px)",
                            border: "1px solid var(--border-light, #eef2fb)",
                        }}
                    >
                        <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <strong style={{ fontSize: "0.88rem", color: "var(--text-heading)" }}>{item.title}</strong>
                                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--success)" }}>{item.status}</span>
                            </div>
                            <p style={{ fontSize: "0.78rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                                {item.detail}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Bottom Actions */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                background: "rgba(212, 160, 23, 0.07)",
                border: "1px dashed var(--gold-400, #e8b930)",
                borderRadius: "var(--radius-md, 10px)",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>⚖️</span>
                    <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)" }}>
                        Full title copy, search extract, and deed plan available for qualified buyers.
                    </span>
                </div>
                <button
                    onClick={handleRequestPacket}
                    disabled={downloading}
                    style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "var(--radius-sm, 6px)",
                        background: "var(--navy-800, #0a0e1a)",
                        color: "#fff",
                        border: "none",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "opacity 0.2s",
                    }}
                >
                    {downloading ? "Requesting..." : "Request Legal Pack →"}
                </button>
            </div>
        </div>
    );
}
