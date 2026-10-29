"use client";

import React, { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import {
    computePriceDeltaSummary,
    derivePriceHistoryForListing,
    isWatchingPropertyPrice,
    PriceHistoryEntry,
    setPriceWatchSubscription,
} from "@/lib/priceAlerts";

interface PriceHistoryChartProps {
    propertyId: string;
    propertyTitle: string;
    price: number;
    area?: number;
    listingType: "sale" | "rent";
    status?: string;
    createdAt?: string;
    priceHistory?: PriceHistoryEntry[];
}

export default function PriceHistoryChart({
    propertyId,
    propertyTitle,
    price,
    area = 0,
    listingType,
    status,
    createdAt,
    priceHistory,
}: PriceHistoryChartProps) {
    const { user, userProfile } = useAuth();
    const { formatCurrencyFull: formatDisplayPrice } = useCurrency();
    const [activeIdx, setActiveIdx] = useState<number | null>(null);
    const [isWatching, setIsWatching] = useState(false);
    const [togglingWatch, setTogglingWatch] = useState(false);

    const history = useMemo(
        () =>
            derivePriceHistoryForListing({
                id: propertyId,
                price,
                status,
                createdAt,
                priceHistory,
            }),
        [propertyId, price, status, createdAt, priceHistory]
    );

    const summary = useMemo(() => computePriceDeltaSummary(history), [history]);

    useEffect(() => {
        let mounted = true;
        isWatchingPropertyPrice(user?.uid, propertyId).then((val) => {
            if (mounted) setIsWatching(val);
        });
        return () => {
            mounted = false;
        };
    }, [user?.uid, propertyId]);

    const handleToggleWatch = async () => {
        if (!user || !user.email) {
            toast.error("Please sign in to receive instant email & in-app price-drop alerts.");
            return;
        }
        if (userProfile?.notificationPreferences?.priceDropAlerts === false) {
            toast("Note: Price-drop alerts are muted in your Profile preferences.", { icon: "ℹ️" });
        }
        setTogglingWatch(true);
        const nextVal = !isWatching;
        try {
            await setPriceWatchSubscription({
                userId: user.uid,
                userEmail: user.email,
                userName: userProfile?.displayName || user.displayName || "Buyer",
                propertyId,
                propertyTitle,
                baselinePrice: price,
                active: nextVal,
            });
            setIsWatching(nextVal);
            toast.success(
                nextVal
                    ? "🔔 Price-drop alert activated! We'll email & notify you if the price drops."
                    : "Price-drop alert paused for this property."
            );
        } catch {
            toast.error("Could not update alert subscription.");
        } finally {
            setTogglingWatch(false);
        }
    };

    // SVG Geometry
    const svgWidth = 640;
    const svgHeight = 200;
    const padLeft = 24;
    const padRight = 24;
    const padTop = 28;
    const padBottom = 34;
    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;

    const minP = summary.lowestPrice * 0.96;
    const maxP = Math.max(summary.highestPrice * 1.04, minP + 1);

    const points = history.map((entry, idx) => {
        const x =
            history.length === 1
                ? padLeft + plotW / 2
                : padLeft + (idx / (history.length - 1)) * plotW;
        const normY = (entry.price - minP) / (maxP - minP);
        const y = padTop + plotH - normY * plotH;
        return { x, y, entry, idx };
    });

    const linePath = points
        .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
        .join(" ");
    const areaPath =
        points.length > 0
            ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
            : "";

    const selectedPoint =
        activeIdx !== null && points[activeIdx] ? points[activeIdx] : points[points.length - 1];

    const pricePerSqFt = area > 0 ? Math.round(price / area) : null;

    return (
        <section
            style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color, rgba(148,163,184,0.2))",
                borderRadius: "16px",
                padding: "1.5rem",
                marginTop: "1.75rem",
            }}
            aria-label="Listing Price History & Automated Alerts"
        >
            {/* Header Row */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: "1rem",
                    marginBottom: "1.1rem",
                }}
            >
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        <h3 style={{ margin: 0, fontSize: "1.18rem", fontWeight: 700, color: "var(--text-primary)" }}>
                            📈 Price History &amp; Alert Watch
                        </h3>
                        {summary.hasPriceDrop ? (
                            <span
                                style={{
                                    background: "rgba(22, 163, 74, 0.14)",
                                    color: "#16a34a",
                                    border: "1px solid rgba(22, 163, 74, 0.3)",
                                    padding: "0.2rem 0.65rem",
                                    borderRadius: "999px",
                                    fontSize: "0.75rem",
                                    fontWeight: 700,
                                }}
                            >
                                📉 Reduced {summary.latestDropPct}% (Save {formatDisplayPrice(summary.latestDropKES)})
                            </span>
                        ) : (
                            <span
                                style={{
                                    background: "rgba(212, 160, 23, 0.14)",
                                    color: "var(--gold-500, #d4a017)",
                                    padding: "0.2rem 0.65rem",
                                    borderRadius: "999px",
                                    fontSize: "0.74rem",
                                    fontWeight: 700,
                                }}
                            >
                                Verified Asking Trajectory
                            </span>
                        )}
                    </div>
                    <p style={{ margin: "0.3rem 0 0", fontSize: "0.83rem", color: "var(--text-secondary)" }}>
                        Track verified asking price changes{listingType === "rent" ? " (monthly rent)" : ""} and get instant alerts if the price drops.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleToggleWatch}
                    disabled={togglingWatch}
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.45rem",
                        padding: "0.55rem 1rem",
                        borderRadius: "999px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: togglingWatch ? "wait" : "pointer",
                        border: isWatching
                            ? "1px solid rgba(22, 163, 74, 0.45)"
                            : "1px solid var(--gold-500, #d4a017)",
                        background: isWatching
                            ? "rgba(22, 163, 74, 0.14)"
                            : "linear-gradient(135deg, var(--gold-400, #eab308), var(--gold-600, #ca8a04))",
                        color: isWatching ? "#16a34a" : "#0a0e1a",
                        transition: "all 0.2s ease",
                    }}
                >
                    <span>{isWatching ? "✅" : "🔔"}</span>
                    <span>
                        {togglingWatch
                            ? "Saving..."
                            : isWatching
                            ? "Watching Price Drops"
                            : "Alert Me on Price Drops"}
                    </span>
                </button>
            </div>

            {/* Summary KPI Strip */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "0.75rem",
                    marginBottom: "1rem",
                }}
            >
                <div
                    style={{
                        background: "var(--bg-secondary)",
                        padding: "0.75rem 0.9rem",
                        borderRadius: "10px",
                    }}
                >
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                        Initial Listed
                    </div>
                    <div style={{ fontSize: "0.96rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                        {formatDisplayPrice(summary.initialPrice)}
                    </div>
                </div>
                <div
                    style={{
                        background: "var(--bg-secondary)",
                        padding: "0.75rem 0.9rem",
                        borderRadius: "10px",
                    }}
                >
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                        Current Asking
                    </div>
                    <div style={{ fontSize: "0.96rem", fontWeight: 800, color: "var(--gold-500, #d4a017)", marginTop: "2px" }}>
                        {formatDisplayPrice(summary.currentPrice)}
                        {listingType === "rent" ? "/mo" : ""}
                    </div>
                </div>
                <div
                    style={{
                        background: "var(--bg-secondary)",
                        padding: "0.75rem 0.9rem",
                        borderRadius: "10px",
                    }}
                >
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                        Net Change
                    </div>
                    <div
                        style={{
                            fontSize: "0.96rem",
                            fontWeight: 700,
                            color:
                                summary.totalDeltaPct < 0
                                    ? "#16a34a"
                                    : summary.totalDeltaPct > 0
                                    ? "#d97706"
                                    : "var(--text-primary)",
                            marginTop: "2px",
                        }}
                    >
                        {summary.totalDeltaPct === 0
                            ? "0.0% (Steady)"
                            : `${summary.totalDeltaPct > 0 ? "+" : ""}${summary.totalDeltaPct}%`}
                    </div>
                </div>
                {pricePerSqFt !== null && (
                    <div
                        style={{
                            background: "var(--bg-secondary)",
                            padding: "0.75rem 0.9rem",
                            borderRadius: "10px",
                        }}
                    >
                        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                            Price / Sq Ft
                        </div>
                        <div style={{ fontSize: "0.96rem", fontWeight: 700, color: "var(--text-primary)", marginTop: "2px" }}>
                            {formatDisplayPrice(pricePerSqFt)}/sqft
                        </div>
                    </div>
                )}
            </div>

            {/* Interactive SVG Timeline Chart */}
            <div
                style={{
                    background: "var(--bg-secondary)",
                    borderRadius: "12px",
                    padding: "0.85rem 1rem",
                    position: "relative",
                }}
            >
                {selectedPoint && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            flexWrap: "wrap",
                            gap: "0.5rem",
                            fontSize: "0.8rem",
                            marginBottom: "0.4rem",
                            paddingBottom: "0.45rem",
                            borderBottom: "1px dashed rgba(148,163,184,0.25)",
                        }}
                    >
                        <span style={{ color: "var(--text-secondary)" }}>
                            📅{" "}
                            <strong>
                                {new Date(selectedPoint.entry.date).toLocaleDateString("en-KE", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </strong>{" "}
                            — {selectedPoint.entry.note || "Recorded listing event"}
                        </span>
                        <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                            {formatDisplayPrice(selectedPoint.entry.price)}
                        </span>
                    </div>
                )}

                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    style={{ width: "100%", height: "auto", display: "block", overflow: "visible" }}
                    role="img"
                    aria-label={`Price trajectory chart for ${propertyTitle}`}
                >
                    <defs>
                        <linearGradient id={`priceGrad-${propertyId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor={summary.hasPriceDrop ? "#16a34a" : "#d4a017"}
                                stopOpacity="0.28"
                            />
                            <stop
                                offset="100%"
                                stopColor={summary.hasPriceDrop ? "#16a34a" : "#d4a017"}
                                stopOpacity="0.01"
                            />
                        </linearGradient>
                    </defs>

                    {/* Horizontal guide lines */}
                    {[0, 0.5, 1].map((ratio, idx) => {
                        const gy = padTop + ratio * plotH;
                        return (
                            <line
                                key={idx}
                                x1={padLeft}
                                y1={gy}
                                x2={svgWidth - padRight}
                                y2={gy}
                                stroke="rgba(148,163,184,0.2)"
                                strokeDasharray="4 4"
                            />
                        );
                    })}

                    {/* Area Fill */}
                    {areaPath && <path d={areaPath} fill={`url(#priceGrad-${propertyId})`} />}

                    {/* Line Path */}
                    {linePath && (
                        <path
                            d={linePath}
                            fill="none"
                            stroke={summary.hasPriceDrop ? "#16a34a" : "#d4a017"}
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Data Nodes */}
                    {points.map((pt) => {
                        const isSelected = selectedPoint?.idx === pt.idx;
                        const dotColor =
                            pt.entry.event === "price_drop"
                                ? "#16a34a"
                                : pt.entry.event === "price_increase"
                                ? "#d97706"
                                : "#d4a017";
                        return (
                            <g
                                key={pt.idx}
                                style={{ cursor: "pointer" }}
                                onMouseEnter={() => setActiveIdx(pt.idx)}
                                onClick={() => setActiveIdx(pt.idx)}
                            >
                                <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r={isSelected ? 8 : 5.5}
                                    fill={dotColor}
                                    stroke="#ffffff"
                                    strokeWidth="2"
                                />
                                <text
                                    x={pt.x}
                                    y={svgHeight - 8}
                                    textAnchor={
                                        pt.idx === 0
                                            ? "start"
                                            : pt.idx === points.length - 1
                                            ? "end"
                                            : "middle"
                                    }
                                    fontSize="11"
                                    fill="currentColor"
                                    style={{ opacity: 0.7 }}
                                >
                                    {new Date(pt.entry.date).toLocaleDateString("en-KE", {
                                        month: "short",
                                        year: "2-digit",
                                    })}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Event Ledger */}
            <div style={{ marginTop: "0.9rem", display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {[...history].reverse().map((item, i) => (
                    <div
                        key={`${item.date}-${i}`}
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "0.82rem",
                            padding: "0.45rem 0.65rem",
                            borderRadius: "8px",
                            background:
                                item.event === "price_drop"
                                    ? "rgba(22, 163, 74, 0.08)"
                                    : "transparent",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.55rem", flexWrap: "wrap" }}>
                            <span>
                                {item.event === "price_drop"
                                    ? "📉"
                                    : item.event === "price_increase"
                                    ? "📈"
                                    : "🏷️"}
                            </span>
                            <span style={{ color: "var(--text-secondary)" }}>
                                {new Date(item.date).toLocaleDateString("en-KE", {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                            <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                                {item.note || (item.event === "price_drop" ? "Price Reduced" : "Listed")}
                            </span>
                        </div>
                        <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                            {formatDisplayPrice(item.price)}
                        </span>
                    </div>
                ))}
            </div>
        </section>
    );
}
