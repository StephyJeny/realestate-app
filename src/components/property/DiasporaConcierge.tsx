"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useCurrency } from "@/context/CurrencyContext";
import {
    DIASPORA_TIMEZONES,
    POA_CHECKLIST_STEPS,
    DIASPORA_MORTGAGE_PARTNERS,
    DEFAULT_SNAGGING_CATEGORIES,
    generateSnaggingReportDocument,
} from "@/lib/diaspora";

interface DiasporaConciergeProps {
    propertyTitle: string;
    city: string;
    neighborhood: string;
    priceKES: number;
    onBookLiveWalkthrough?: () => void;
    onOpenInquiry?: () => void;
}

export default function DiasporaConcierge({
    propertyTitle,
    city,
    neighborhood,
    priceKES,
    onBookLiveWalkthrough,
    onOpenInquiry,
}: DiasporaConciergeProps) {
    const {
        currency,
        setCurrency,
        formatCurrencyFull,
        diasporaMode,
        setDiasporaMode,
        buyerTimezone,
        setBuyerTimezone,
    } = useCurrency();

    const [activeTab, setActiveTab] = useState<"poa" | "snagging" | "financing">("poa");
    const [checkedSteps, setCheckedSteps] = useState<Record<string, boolean>>({
        poa_draft: true,
    });

    const toggleStep = (id: string) => {
        setCheckedSteps((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const handleDownloadSnaggingReport = () => {
        const text = generateSnaggingReportDocument({
            propertyTitle,
            location: `${neighborhood}, ${city}`,
            priceFormatted: formatCurrencyFull(priceKES),
        });
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const safeSlug = propertyTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        link.setAttribute("download", `snagging-inspection-${safeSlug}.txt`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success("Certified Snagging & Inspection Summary downloaded!");
    };

    const completedCount = POA_CHECKLIST_STEPS.filter((s) => checkedSteps[s.id]).length;

    return (
        <div
            style={{
                background: "var(--bg-secondary, #f8f9fb)",
                border: diasporaMode
                    ? "1.5px solid rgba(212, 160, 23, 0.45)"
                    : "1px solid var(--border-color, #e2e6ee)",
                borderRadius: "var(--radius-lg, 16px)",
                padding: "1.5rem",
                boxShadow: "var(--shadow-sm)",
            }}
        >
            {/* Top Banner */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "1rem",
                    paddingBottom: "1rem",
                    marginBottom: "1.15rem",
                    borderBottom: "1px solid var(--border-light, #eef2fb)",
                }}
            >
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, var(--navy-900, #0f1629), var(--navy-700, #243056))",
                            color: "var(--gold-400, #e8b930)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "1.25rem",
                            flexShrink: 0,
                        }}
                    >
                        🌍
                    </div>
                    <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                            <h3 style={{ fontSize: "1.12rem", fontWeight: 800, color: "var(--text-heading, #0f1629)", margin: 0 }}>
                                Diaspora Buyer Concierge Hub
                            </h3>
                            <span
                                style={{
                                    fontSize: "0.68rem",
                                    fontWeight: 700,
                                    padding: "2px 8px",
                                    borderRadius: "999px",
                                    background: "rgba(212, 160, 23, 0.14)",
                                    color: "var(--gold-600, #b8860b)",
                                }}
                            >
                                UK · US · UAE · EU · CA
                            </span>
                        </div>
                        <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "3px 0 0" }}>
                            Invest remotely in Kenya with timezone-synced live video tours, Power of Attorney (POA) guidance, and independent snagging audits.
                        </p>
                    </div>
                </div>

                {/* Diaspora Mode Switch + Quick Currency/Timezone */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <select
                        value={buyerTimezone}
                        onChange={(e) => {
                            setBuyerTimezone(e.target.value);
                            setDiasporaMode(e.target.value !== "Africa/Nairobi");
                        }}
                        aria-label="Select diaspora timezone"
                        style={{
                            padding: "0.45rem 0.65rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-primary, #fff)",
                            color: "var(--text-primary)",
                            fontSize: "0.76rem",
                            fontWeight: 600,
                        }}
                    >
                        {DIASPORA_TIMEZONES.map((tz) => (
                            <option key={tz.id} value={tz.timeZone}>
                                {tz.flag} {tz.label}
                            </option>
                        ))}
                    </select>

                    {currency === "KES" && (
                        <button
                            type="button"
                            onClick={() => setCurrency("USD")}
                            style={{
                                padding: "0.45rem 0.7rem",
                                borderRadius: "8px",
                                border: "1px solid var(--gold-400, #e8b930)",
                                background: "rgba(212, 160, 23, 0.1)",
                                color: "var(--gold-600, #b8860b)",
                                fontSize: "0.75rem",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            Switch to USD ($)
                        </button>
                    )}

                    {onBookLiveWalkthrough && (
                        <button
                            type="button"
                            onClick={() => {
                                setDiasporaMode(true);
                                onBookLiveWalkthrough();
                            }}
                            style={{
                                padding: "0.48rem 0.85rem",
                                borderRadius: "8px",
                                border: "none",
                                background: "var(--navy-800, #1a2340)",
                                color: "#fff",
                                fontSize: "0.76rem",
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.35rem",
                            }}
                        >
                            🎥 Book Live Video Tour
                        </button>
                    )}
                </div>
            </div>

            {/* Sub-navigation Tabs */}
            <div
                style={{
                    display: "flex",
                    gap: "0.5rem",
                    flexWrap: "wrap",
                    marginBottom: "1.1rem",
                }}
            >
                {[
                    { id: "poa" as const, label: "⚖️ Power of Attorney Checklist" },
                    { id: "snagging" as const, label: "🔍 3rd-Party Snagging & Inspection" },
                    { id: "financing" as const, label: "🏦 Diaspora Mortgage Partners" },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: "0.5rem 0.9rem",
                            borderRadius: "9px",
                            border:
                                activeTab === tab.id
                                    ? "1px solid var(--gold-500, #d4a017)"
                                    : "1px solid var(--border-color, #e2e6ee)",
                            background:
                                activeTab === tab.id
                                    ? "rgba(212, 160, 23, 0.14)"
                                    : "var(--bg-primary, #fff)",
                            color:
                                activeTab === tab.id
                                    ? "var(--gold-600, #b8860b)"
                                    : "var(--text-secondary)",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* TAB 1: POA Checklist */}
            {activeTab === "poa" && (
                <div>
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "0.75rem",
                            fontSize: "0.78rem",
                            color: "var(--text-secondary)",
                        }}
                    >
                        <span>
                            Track your remote execution readiness ({completedCount}/{POA_CHECKLIST_STEPS.length} steps ready)
                        </span>
                        <span style={{ fontWeight: 700, color: "var(--success, #10b981)" }}>
                            {Math.round((completedCount / POA_CHECKLIST_STEPS.length) * 100)}% Ready
                        </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                        {POA_CHECKLIST_STEPS.map((item) => {
                            const done = !!checkedSteps[item.id];
                            return (
                                <label
                                    key={item.id}
                                    style={{
                                        display: "flex",
                                        alignItems: "flex-start",
                                        gap: "0.75rem",
                                        padding: "0.8rem 1rem",
                                        borderRadius: "10px",
                                        background: "var(--bg-primary, #fff)",
                                        border: done
                                            ? "1px solid rgba(16, 185, 129, 0.35)"
                                            : "1px solid var(--border-light, #eef2fb)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={done}
                                        onChange={() => toggleStep(item.id)}
                                        style={{ marginTop: "4px", accentColor: "var(--success, #10b981)", width: "16px", height: "16px" }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", flexWrap: "wrap" }}>
                                            <strong
                                                style={{
                                                    fontSize: "0.86rem",
                                                    color: "var(--text-heading)",
                                                    textDecoration: done ? "line-through" : "none",
                                                    opacity: done ? 0.78 : 1,
                                                }}
                                            >
                                                Step {item.step}: {item.title}
                                            </strong>
                                            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--gold-600, #b8860b)" }}>
                                                {item.timeline} • {item.authority}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: "0.77rem", color: "var(--text-secondary)", margin: "3px 0 0", lineHeight: 1.45 }}>
                                            {item.description}
                                        </p>
                                    </div>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 2: Third-Party Snagging & Technical Inspection */}
            {activeTab === "snagging" && (
                <div>
                    <div
                        style={{
                            padding: "0.85rem 1rem",
                            borderRadius: "10px",
                            background: "rgba(16, 185, 129, 0.08)",
                            border: "1px solid rgba(16, 185, 129, 0.25)",
                            marginBottom: "0.9rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.75rem",
                        }}
                    >
                        <div>
                            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "var(--text-heading)" }}>
                                BORAQS / ISK Independent Pre-Handover Audit — 96.0% Readiness Score
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                Never release final escrow funds from abroad without an independent chartered building surveyor report.
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDownloadSnaggingReport}
                            style={{
                                padding: "0.5rem 0.9rem",
                                borderRadius: "8px",
                                border: "none",
                                background: "var(--success, #10b981)",
                                color: "#fff",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            ⬇ Download Sample Snagging Report
                        </button>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                        {DEFAULT_SNAGGING_CATEGORIES.map((cat) => (
                            <div
                                key={cat.category}
                                style={{
                                    padding: "0.75rem 0.95rem",
                                    borderRadius: "10px",
                                    background: "var(--bg-primary, #fff)",
                                    border: "1px solid var(--border-light, #eef2fb)",
                                }}
                            >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                                    <strong style={{ fontSize: "0.84rem", color: "var(--text-heading)" }}>{cat.category}</strong>
                                    <span
                                        style={{
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            padding: "2px 8px",
                                            borderRadius: "999px",
                                            background:
                                                cat.status === "Minor Snags Noted"
                                                    ? "rgba(245, 158, 11, 0.14)"
                                                    : "rgba(16, 185, 129, 0.12)",
                                            color:
                                                cat.status === "Minor Snags Noted"
                                                    ? "#d97706"
                                                    : "var(--success, #10b981)",
                                        }}
                                    >
                                        {cat.score} • {cat.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "4px 0 0" }}>
                                    {cat.findings}
                                </p>
                            </div>
                        ))}
                    </div>

                    {onOpenInquiry && (
                        <div style={{ marginTop: "0.85rem", textAlign: "right" }}>
                            <button
                                type="button"
                                onClick={onOpenInquiry}
                                style={{
                                    padding: "0.48rem 0.9rem",
                                    borderRadius: "8px",
                                    border: "1px solid var(--border-color)",
                                    background: "var(--bg-primary, #fff)",
                                    color: "var(--text-primary)",
                                    fontSize: "0.78rem",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                }}
                            >
                                Request Bespoke Surveyor Snagging Quote →
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: Diaspora Mortgage Partners */}
            {activeTab === "financing" && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "0.75rem" }}>
                    {DIASPORA_MORTGAGE_PARTNERS.map((partner) => (
                        <div
                            key={partner.bank}
                            style={{
                                padding: "0.95rem 1rem",
                                borderRadius: "10px",
                                background: "var(--bg-primary, #fff)",
                                border: "1px solid var(--border-light, #eef2fb)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.35rem",
                            }}
                        >
                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-heading)" }}>
                                {partner.bank}
                            </div>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", fontSize: "0.72rem", fontWeight: 700 }}>
                                <span style={{ padding: "2px 6px", borderRadius: "4px", background: "rgba(59,130,246,0.1)", color: "#2563eb" }}>
                                    Up to {partner.maxLtvPct}% LTV
                                </span>
                                <span style={{ padding: "2px 6px", borderRadius: "4px", background: "rgba(212,160,23,0.12)", color: "var(--gold-600, #b8860b)" }}>
                                    {partner.maxTenureYears} Yrs
                                </span>
                                <span style={{ padding: "2px 6px", borderRadius: "4px", background: "var(--bg-secondary)", color: "var(--text-secondary)" }}>
                                    {partner.acceptedCurrencies.join(" / ")}
                                </span>
                            </div>
                            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "var(--success, #10b981)", marginTop: "2px" }}>
                                {partner.rateNote}
                            </div>
                            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0, lineHeight: 1.45 }}>
                                {partner.highlight}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
