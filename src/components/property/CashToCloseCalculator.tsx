"use client";
import React, { useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useCurrency } from "@/context/CurrencyContext";
import {
    calculateClosingCosts,
    LandZoneType,
    AcquisitionFinancing,
} from "@/lib/closingCosts";

interface CashToCloseCalculatorProps {
    propertyPrice: number;
    defaultZone?: LandZoneType;
    compact?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
    statutory: "#d4a017",
    legal: "#3b82f6",
    valuation: "#10b981",
    financing: "#8b5cf6",
};

export default function CashToCloseCalculator({
    propertyPrice,
    defaultZone = "urban",
    compact = false,
}: CashToCloseCalculatorProps) {
    const { formatCurrency, formatCurrencyFull } = useCurrency();

    const [price, setPrice] = useState<number>(propertyPrice || 25_000_000);
    const [zone, setZone] = useState<LandZoneType>(defaultZone);
    const [financing, setFinancing] = useState<AcquisitionFinancing>("cash");
    const [downPaymentPct, setDownPaymentPct] = useState<number>(20);
    const [arrangementFeePct, setArrangementFeePct] = useState<number>(1.5);
    const [firstTimeExemption, setFirstTimeExemption] = useState<boolean>(false);

    // Sync price if parent property changes
    React.useEffect(() => {
        if (propertyPrice && propertyPrice > 0) {
            setPrice(propertyPrice);
        }
    }, [propertyPrice]);

    const breakdown = useMemo(
        () =>
            calculateClosingCosts({
                propertyPriceKES: price,
                zone,
                financing,
                downPaymentPct,
                bankArrangementFeePct: arrangementFeePct,
                firstTimeAffordableExemption: firstTimeExemption,
            }),
        [price, zone, financing, downPaymentPct, arrangementFeePct, firstTimeExemption]
    );

    const handleCopySummary = () => {
        const lines = [
            `EstateVue — Kenyan Cash-to-Close Breakdown`,
            `Purchase Price: ${formatCurrencyFull(breakdown.propertyPriceKES)}`,
            `Mode: ${financing === "cash" ? "Cash Purchase" : `Mortgage (${downPaymentPct}% Deposit)`} | Zone: ${zone === "urban" ? "Urban (4% Duty)" : "Agricultural/Rural (2% Duty)"}`,
            `----------------------------------------`,
            ...breakdown.items.map((i) => `• ${i.label}: ${formatCurrencyFull(i.amountKES)}`),
            `----------------------------------------`,
            `Total Closing Costs: ${formatCurrencyFull(breakdown.totalClosingCostsKES)} (${breakdown.closingCostPctOfPrice}% of price)`,
            `Total Upfront Cash-to-Close: ${formatCurrencyFull(breakdown.totalCashToCloseKES)}`,
        ];
        navigator.clipboard.writeText(lines.join("\n"));
        toast.success("Cash-to-Close estimate copied to clipboard!");
    };

    return (
        <div
            style={{
                background: compact ? "var(--bg-primary, #fff)" : "var(--bg-secondary, #f8f9fb)",
                border: "1px solid var(--border-color, #e2e6ee)",
                borderRadius: "var(--radius-lg, 16px)",
                padding: compact ? "1.25rem" : "1.5rem",
            }}
        >
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.75rem",
                    marginBottom: "1.25rem",
                }}
            >
                <div>
                    <h4
                        style={{
                            fontSize: compact ? "1rem" : "1.12rem",
                            fontWeight: 700,
                            color: "var(--text-heading, #0f1629)",
                            margin: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: "0.45rem",
                        }}
                    >
                        <span>🧾</span> Kenyan Cash-to-Close &amp; Stamp Duty Calculator
                    </h4>
                    <p
                        style={{
                            fontSize: "0.78rem",
                            color: "var(--text-tertiary, #64748b)",
                            margin: "3px 0 0",
                        }}
                    >
                        Statutory Stamp Duty (4% Urban / 2% Agricultural), LSK Advocate Scale + 16% VAT, Valuation &amp; Bank Charge costs.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleCopySummary}
                    style={{
                        padding: "0.4rem 0.8rem",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color, #e2e6ee)",
                        background: "var(--bg-primary, #fff)",
                        color: "var(--text-primary, #0f1629)",
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        cursor: "pointer",
                    }}
                >
                    📋 Copy Breakdown
                </button>
            </div>

            {/* Controls Bar */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                    gap: "1rem",
                    marginBottom: "1.25rem",
                    padding: "1rem",
                    background: compact ? "var(--bg-secondary, #f8f9fb)" : "var(--bg-primary, #fff)",
                    borderRadius: "12px",
                    border: "1px solid var(--border-light, #eef2fb)",
                }}
            >
                {/* Land Registry Zone */}
                <div>
                    <label
                        style={{
                            display: "block",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            marginBottom: "0.4rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                        }}
                    >
                        Land Registry Zone (Stamp Duty)
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                        <button
                            type="button"
                            onClick={() => setZone("urban")}
                            style={{
                                padding: "0.5rem 0.6rem",
                                borderRadius: "8px",
                                border: zone === "urban" ? "1px solid var(--gold-500, #d4a017)" : "1px solid var(--border-color)",
                                background: zone === "urban" ? "rgba(212,160,23,0.12)" : "var(--bg-primary)",
                                color: zone === "urban" ? "var(--gold-600, #b8860b)" : "var(--text-secondary)",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            🏙️ Urban (4%)
                        </button>
                        <button
                            type="button"
                            onClick={() => setZone("rural")}
                            style={{
                                padding: "0.5rem 0.6rem",
                                borderRadius: "8px",
                                border: zone === "rural" ? "1px solid var(--gold-500, #d4a017)" : "1px solid var(--border-color)",
                                background: zone === "rural" ? "rgba(212,160,23,0.12)" : "var(--bg-primary)",
                                color: zone === "rural" ? "var(--gold-600, #b8860b)" : "var(--text-secondary)",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            🌾 Rural / Agri (2%)
                        </button>
                    </div>
                </div>

                {/* Acquisition Mode */}
                <div>
                    <label
                        style={{
                            display: "block",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            marginBottom: "0.4rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                        }}
                    >
                        Acquisition Financing
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem" }}>
                        <button
                            type="button"
                            onClick={() => setFinancing("cash")}
                            style={{
                                padding: "0.5rem 0.6rem",
                                borderRadius: "8px",
                                border: financing === "cash" ? "1px solid var(--navy-700, #243056)" : "1px solid var(--border-color)",
                                background: financing === "cash" ? "var(--navy-800, #1a2340)" : "var(--bg-primary)",
                                color: financing === "cash" ? "#fff" : "var(--text-secondary)",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            💵 Cash Buyer
                        </button>
                        <button
                            type="button"
                            onClick={() => setFinancing("mortgage")}
                            style={{
                                padding: "0.5rem 0.6rem",
                                borderRadius: "8px",
                                border: financing === "mortgage" ? "1px solid var(--navy-700, #243056)" : "1px solid var(--border-color)",
                                background: financing === "mortgage" ? "var(--navy-800, #1a2340)" : "var(--bg-primary)",
                                color: financing === "mortgage" ? "#fff" : "var(--text-secondary)",
                                fontSize: "0.78rem",
                                fontWeight: 700,
                                cursor: "pointer",
                            }}
                        >
                            🏦 Bank Mortgage
                        </button>
                    </div>
                </div>

                {/* Purchase Price Input */}
                <div>
                    <label
                        style={{
                            display: "block",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            color: "var(--text-secondary)",
                            marginBottom: "0.4rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px",
                        }}
                    >
                        Agreed Purchase Price (KES)
                    </label>
                    <input
                        type="number"
                        min={500_000}
                        step={250_000}
                        value={price}
                        onChange={(e) => setPrice(Math.max(0, Number(e.target.value)))}
                        style={{
                            width: "100%",
                            padding: "0.5rem 0.75rem",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color)",
                            background: "var(--bg-input, #fff)",
                            color: "var(--text-primary)",
                            fontSize: "0.85rem",
                            fontWeight: 600,
                        }}
                    />
                </div>
            </div>

            {/* Mortgage-specific sliders */}
            {financing === "mortgage" && (
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                        gap: "1rem",
                        padding: "0.85rem 1rem",
                        marginBottom: "1.25rem",
                        borderRadius: "10px",
                        background: "rgba(139, 92, 246, 0.06)",
                        border: "1px solid rgba(139, 92, 246, 0.2)",
                    }}
                >
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                            <span style={{ color: "var(--text-secondary)" }}>Down Payment Deposit</span>
                            <span style={{ color: "var(--text-heading)" }}>
                                {downPaymentPct}% ({formatCurrency(breakdown.downPaymentKES)})
                            </span>
                        </div>
                        <input
                            type="range"
                            min={10}
                            max={60}
                            step={5}
                            value={downPaymentPct}
                            onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "#8b5cf6" }}
                        />
                    </div>
                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                            <span style={{ color: "var(--text-secondary)" }}>Bank Facility / Arrangement Fee</span>
                            <span style={{ color: "var(--text-heading)" }}>{arrangementFeePct}% of Loan</span>
                        </div>
                        <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.25}
                            value={arrangementFeePct}
                            onChange={(e) => setArrangementFeePct(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "#8b5cf6" }}
                        />
                    </div>
                </div>
            )}

            {/* First-time affordable housing exemption toggle */}
            <label
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.78rem",
                    color: "var(--text-secondary)",
                    marginBottom: "1.25rem",
                    cursor: "pointer",
                }}
            >
                <input
                    type="checkbox"
                    checked={firstTimeExemption}
                    onChange={(e) => setFirstTimeExemption(e.target.checked)}
                    style={{ accentColor: "var(--gold-500, #d4a017)" }}
                />
                Apply First-Time Affordable Homeownership Stamp Duty Exemption (0% Duty)
            </label>

            {/* Summary KPI Banner */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))",
                    gap: "0.85rem",
                    marginBottom: "1.25rem",
                }}
            >
                <div
                    style={{
                        padding: "0.95rem 1rem",
                        borderRadius: "12px",
                        background: "var(--bg-primary, #fff)",
                        border: "1px solid var(--border-light, #eef2fb)",
                    }}
                >
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                        {financing === "cash" ? "Purchase Principal" : `Deposit (${downPaymentPct}%)`}
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-heading)", marginTop: "3px" }}>
                        {formatCurrencyFull(breakdown.downPaymentKES)}
                    </div>
                </div>

                <div
                    style={{
                        padding: "0.95rem 1rem",
                        borderRadius: "12px",
                        background: "var(--bg-primary, #fff)",
                        border: "1px solid var(--border-light, #eef2fb)",
                    }}
                >
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                        Statutory &amp; Closing Fees
                    </div>
                    <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--gold-600, #b8860b)", marginTop: "3px" }}>
                        {formatCurrencyFull(breakdown.totalClosingCostsKES)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                        +{breakdown.closingCostPctOfPrice}% of property value
                    </div>
                </div>

                <div
                    style={{
                        padding: "0.95rem 1rem",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, var(--navy-900, #0f1629), var(--navy-700, #243056))",
                        color: "#fff",
                    }}
                >
                    <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--gold-300, #f0cc5b)", textTransform: "uppercase" }}>
                        Total Upfront Cash-to-Close
                    </div>
                    <div style={{ fontSize: "1.22rem", fontWeight: 800, color: "#fff", marginTop: "3px" }}>
                        {formatCurrencyFull(breakdown.totalCashToCloseKES)}
                    </div>
                    <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.75)" }}>
                        {financing === "cash" ? "100% Landed Acquisition Cost" : "Deposit + All Legal & Bank Fees"}
                    </div>
                </div>
            </div>

            {/* Stacked Visual Proportion Bar */}
            {breakdown.totalClosingCostsKES > 0 && (
                <div style={{ marginBottom: "1.15rem" }}>
                    <div
                        style={{
                            display: "flex",
                            height: "10px",
                            borderRadius: "999px",
                            overflow: "hidden",
                            background: "var(--gray-200)",
                        }}
                    >
                        {breakdown.items.map((item) => {
                            const widthPct = Math.max(
                                2,
                                (item.amountKES / breakdown.totalClosingCostsKES) * 100
                            );
                            return (
                                <div
                                    key={item.id}
                                    title={`${item.label}: ${formatCurrencyFull(item.amountKES)}`}
                                    style={{
                                        width: `${widthPct}%`,
                                        background: CATEGORY_COLORS[item.category] || "#64748b",
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Itemized Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {breakdown.items.map((item) => (
                    <div
                        key={item.id}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "0.75rem",
                            padding: "0.7rem 0.9rem",
                            borderRadius: "10px",
                            background: compact ? "var(--bg-secondary, #f8f9fb)" : "var(--bg-primary, #fff)",
                            border: "1px solid var(--border-light, #eef2fb)",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", minWidth: 0 }}>
                            <span
                                style={{
                                    width: "9px",
                                    height: "9px",
                                    borderRadius: "50%",
                                    background: CATEGORY_COLORS[item.category] || "#64748b",
                                    marginTop: "6px",
                                    flexShrink: 0,
                                }}
                            />
                            <div>
                                <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "var(--text-heading)" }}>
                                    {item.label}
                                </div>
                                <div style={{ fontSize: "0.74rem", color: "var(--text-tertiary)" }}>{item.note}</div>
                            </div>
                        </div>
                        <div
                            style={{
                                fontSize: "0.88rem",
                                fontWeight: 800,
                                color: "var(--text-primary)",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {formatCurrencyFull(item.amountKES)}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
