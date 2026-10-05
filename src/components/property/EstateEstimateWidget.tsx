"use client";
import React, { useMemo } from "react";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import { calculateEstateEstimate } from "@/lib/valuation";
import styles from "./EstateEstimateWidget.module.css";

interface EstateEstimateWidgetProps {
    propertyPrice: number;
    area: number;
    bedrooms: number;
    bathrooms: number;
    city: string;
    neighborhood: string;
    propertyType: string;
    amenities: string[];
    listingType?: string;
}

export default function EstateEstimateWidget({
    propertyPrice,
    area,
    bedrooms,
    bathrooms,
    city,
    neighborhood,
    propertyType,
    amenities,
    listingType = "sale",
}: EstateEstimateWidgetProps) {
    const { formatCurrency } = useCurrency();

    const valuation = useMemo(() => {
        // Map propertyType to valid type
        const validTypes = ["apartment", "villa", "house", "townhouse", "commercial", "land"] as const;
        const normalizedType = validTypes.find(t => t === propertyType.toLowerCase()) || "apartment";

        return calculateEstateEstimate({
            propertyType: normalizedType,
            city: city || "Nairobi",
            neighborhood: neighborhood || "Kilimani",
            areaSqFt: area || 1800,
            bedrooms: bedrooms || 3,
            bathrooms: bathrooms || 2,
            finishQuality: amenities.some(a => a.toLowerCase().includes("pool") || a.toLowerCase().includes("smart")) ? "luxury" : "modern",
            yearBuiltTier: "2_to_5",
            amenities: amenities || [],
        });
    }, [propertyPrice, area, bedrooms, bathrooms, city, neighborhood, propertyType, amenities]);

    // Difference percentage vs listed asking price
    const diffPct = Math.round(((propertyPrice - valuation.estimatePrice) / valuation.estimatePrice) * 100);

    let comparisonLabel = "⚖️ Fair Market Value (Listed at benchmark)";
    let pillClass = styles.pillFair;

    if (diffPct <= -4) {
        comparisonLabel = `🟢 Great Deal: ${Math.abs(diffPct)}% Below Market Benchmark`;
        pillClass = styles.pillUnder;
    } else if (diffPct >= 5) {
        comparisonLabel = `💎 Premium Finish: ${diffPct}% Above Standard Suburb Baseline`;
        pillClass = styles.pillPremium;
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.badge}>
                    <span>✦ EstateEstimate™ AI Appraisal</span>
                </div>
                <div className={styles.confidence}>
                    <span>✓ {valuation.confidenceScore}% Confidence</span>
                </div>
            </div>

            <div className={styles.mainGrid}>
                <div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginBottom: "0.2rem" }}>
                        Estimated Algorithmic Value
                    </div>
                    <div className={styles.estimatePrice}>
                        {formatCurrency(valuation.estimatePrice)}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-tertiary)" }}>
                        Range: {formatCurrency(valuation.lowPrice)} – {formatCurrency(valuation.highPrice)}
                    </div>
                    <div>
                        <span className={`${styles.comparisonPill} ${pillClass}`}>
                            {comparisonLabel}
                        </span>
                    </div>
                </div>

                <div className={styles.metricsList}>
                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Rental Yield</span>
                        <span className={styles.metricVal}>+{valuation.grossRentalYield}% Gross</span>
                    </div>
                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Est. Monthly Rent</span>
                        <span className={styles.metricVal}>{formatCurrency(valuation.estimatedMonthlyRent)}</span>
                    </div>
                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Airbnb Potential</span>
                        <span className={styles.metricVal}>{formatCurrency(valuation.airbnbNightlyRate)}/nt</span>
                    </div>
                    <div className={styles.metricItem}>
                        <span className={styles.metricLabel}>Appreciation</span>
                        <span className={styles.metricVal}>+{valuation.annualAppreciationRate}% YoY</span>
                    </div>
                </div>
            </div>

            <div className={styles.footer}>
                <span className={styles.footerNote}>
                    Based on recent neighborhood transactions, floor area, and amenities in {neighborhood}.
                </span>
                <Link href="/estimate" className={styles.customValuationLink}>
                    <span>Customize Valuation in EstateEstimate</span>
                    <span>→</span>
                </Link>
            </div>
        </div>
    );
}
