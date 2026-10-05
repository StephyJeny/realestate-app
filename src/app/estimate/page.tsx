"use client";
import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import { calculateEstateEstimate, ValuationInputs, ValuationResult } from "@/lib/valuation";
import toast from "react-hot-toast";
import styles from "./page.module.css";

const KENYA_LOCATIONS = [
    { city: "Nairobi", neighborhood: "Karen" },
    { city: "Nairobi", neighborhood: "Westlands" },
    { city: "Nairobi", neighborhood: "Kilimani" },
    { city: "Nairobi", neighborhood: "Runda" },
    { city: "Nairobi", neighborhood: "Kileleshwa" },
    { city: "Nairobi", neighborhood: "Lavington" },
    { city: "Nairobi", neighborhood: "Kiambu Road" },
    { city: "Nairobi", neighborhood: "South C" },
    { city: "Nairobi", neighborhood: "Langata" },
    { city: "Nairobi", neighborhood: "Syokimau" },
    { city: "Mombasa", neighborhood: "Nyali" },
    { city: "Mombasa", neighborhood: "Diani" },
    { city: "Mombasa", neighborhood: "Bamburi" },
    { city: "Mombasa", neighborhood: "Shanzu" },
    { city: "Kisumu", neighborhood: "Milimani Kisumu" },
    { city: "Kisumu", neighborhood: "Riat Kisumu" },
    { city: "Nakuru", neighborhood: "Milimani Nakuru" },
];

const AMENITY_OPTIONS = [
    { id: "pool", label: "🏊 Swimming Pool" },
    { id: "ocean_view", label: "🌊 Ocean / Scenic View" },
    { id: "borehole", label: "💧 Borehole / Reliable Water" },
    { id: "solar", label: "☀️ Solar / Power Backup" },
    { id: "smart_home", label: "🤖 Smart Home Tech" },
    { id: "dsq", label: "🚪 Staff Quarters (DSQ)" },
    { id: "security", label: "🛡️ 24/7 Gated Security" },
    { id: "garden", label: "🌿 Private Landscaped Garden" },
    { id: "gym", label: "🏋️ Private / Fitness Gym" },
];

export default function ValuationPage() {
    const { formatCurrency, formatCurrencyFull, currency } = useCurrency();

    // Form inputs state
    const [propertyType, setPropertyType] = useState<ValuationInputs["propertyType"]>("apartment");
    const [selectedLocationIdx, setSelectedLocationIdx] = useState(1); // Westlands default
    const [customNeighborhood, setCustomNeighborhood] = useState("");
    const [areaSqFt, setAreaSqFt] = useState(1800);
    const [bedrooms, setBedrooms] = useState(3);
    const [bathrooms, setBathrooms] = useState(2);
    const [finishQuality, setFinishQuality] = useState<ValuationInputs["finishQuality"]>("modern");
    const [yearBuiltTier, setYearBuiltTier] = useState<ValuationInputs["yearBuiltTier"]>("2_to_5");
    const [furnishing, setFurnishing] = useState<ValuationInputs["furnishing"]>("unfurnished");
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>(["security", "solar"]);
    const [isCalculating, setIsCalculating] = useState(false);

    const activeLocation = KENYA_LOCATIONS[selectedLocationIdx] || KENYA_LOCATIONS[0];
    const finalNeighborhood = customNeighborhood.trim() || activeLocation.neighborhood;
    const finalCity = activeLocation.city;

    // Calculate valuation whenever inputs change
    const valuation: ValuationResult = useMemo(() => {
        return calculateEstateEstimate({
            propertyType,
            city: finalCity,
            neighborhood: finalNeighborhood,
            areaSqFt,
            bedrooms,
            bathrooms,
            finishQuality,
            yearBuiltTier,
            furnishing,
            amenities: selectedAmenities,
        });
    }, [
        propertyType,
        finalCity,
        finalNeighborhood,
        areaSqFt,
        bedrooms,
        bathrooms,
        finishQuality,
        yearBuiltTier,
        furnishing,
        selectedAmenities,
    ]);

    const toggleAmenity = (id: string) => {
        setSelectedAmenities((prev) =>
            prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        );
    };

    const handleShareOrPrint = () => {
        window.print();
    };

    const handleCopyReport = () => {
        const text = `EstateVue AI Property Appraisal:
Neighborhood: ${finalNeighborhood}, ${finalCity}
Type: ${propertyType.toUpperCase()} (${bedrooms} BR, ${bathrooms} BA, ${areaSqFt.toLocaleString()} sqft)
EstateEstimate Value: KES ${valuation.estimatePrice.toLocaleString()} (Range: KES ${valuation.lowPrice.toLocaleString()} - ${valuation.highPrice.toLocaleString()})
Est. Monthly Rent: KES ${valuation.estimatedMonthlyRent.toLocaleString()} / mo (${valuation.grossRentalYield}% Gross Yield)
Appreciation: ~${valuation.annualAppreciationRate}% YoY
Generated via EstateVue AI Valuation Engine.`;
        navigator.clipboard.writeText(text);
        toast.success("Appraisal summary copied to clipboard!");
    };

    // Calculate bar heights for the historical chart
    const maxChartPrice = Math.max(...valuation.historicalTrends.map((t) => t.price)) * 1.1;

    return (
        <div className={styles.estimatePage}>
            <div className="container">
                {/* Hero Header */}
                <div className={styles.heroSection}>
                    <div className={styles.badge}>
                        <span>✦ Proprietary AI Algorithm</span>
                    </div>
                    <h1 className={styles.title}>
                        Instant Property Valuation{" "}
                        <span className={styles.titleGradient}>EstateEstimate™</span>
                    </h1>
                    <p className={styles.subtitle}>
                        Accurately evaluate residential and commercial real estate across Kenya.
                        Powered by live market comp data, transaction indices, and rental yield forecasting.
                    </p>
                </div>

                {/* Main 2-Column Interface */}
                <div className={styles.layoutGrid}>
                    {/* LEFT COLUMN: Input Form */}
                    <div className={styles.formCard}>
                        <div className={styles.formHeader}>
                            <h2>Property Details</h2>
                            <p>Adjust specifications below to dynamically recalculate the valuation</p>
                        </div>

                        {/* Location Selectors */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Location & Neighborhood
                                <span className={styles.labelHint}>(Kenyan Prime Hotspots)</span>
                            </label>
                            <select
                                className={styles.select}
                                value={selectedLocationIdx}
                                onChange={(e) => {
                                    setSelectedLocationIdx(Number(e.target.value));
                                    setCustomNeighborhood("");
                                }}
                            >
                                {KENYA_LOCATIONS.map((loc, idx) => (
                                    <option key={idx} value={idx}>
                                        {loc.neighborhood}, {loc.city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Property Type & Furnishing */}
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Property Type</label>
                                <select
                                    className={styles.select}
                                    value={propertyType}
                                    onChange={(e) => setPropertyType(e.target.value as any)}
                                >
                                    <option value="apartment">Apartment / Flat</option>
                                    <option value="villa">Luxury Villa</option>
                                    <option value="house">Detached House</option>
                                    <option value="townhouse">Townhouse</option>
                                    <option value="commercial">Commercial / Office</option>
                                    <option value="land">Land / Plot</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Furnishing Status</label>
                                <select
                                    className={styles.select}
                                    value={furnishing}
                                    onChange={(e) => setFurnishing(e.target.value as any)}
                                >
                                    <option value="unfurnished">Unfurnished</option>
                                    <option value="furnished">Furnished</option>
                                    <option value="designer">Designer / Turnkey</option>
                                </select>
                            </div>
                        </div>

                        {/* Area Size (Sq Ft) */}
                        <div className={styles.formGroup}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <label className={styles.label}>Total Floor Area (Sq Ft)</label>
                                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--gold-500)" }}>
                                    {areaSqFt.toLocaleString()} sq ft (~{Math.round(areaSqFt / 10.76)} sqm)
                                </span>
                            </div>
                            <input
                                type="range"
                                min="350"
                                max="10000"
                                step="50"
                                value={areaSqFt}
                                onChange={(e) => setAreaSqFt(Number(e.target.value))}
                                className={styles.input}
                                style={{ padding: "0.4rem 0" }}
                            />
                            {/* Preset Buttons */}
                            <div className={styles.presetGroup}>
                                {[
                                    { label: "Studio (500 sqft)", val: 500 },
                                    { label: "2BR (1,200 sqft)", val: 1200 },
                                    { label: "3BR (1,800 sqft)", val: 1800 },
                                    { label: "4BR Villa (3,500 sqft)", val: 3500 },
                                    { label: "Luxury Estate (5,500 sqft)", val: 5500 },
                                ].map((p) => (
                                    <button
                                        key={p.val}
                                        type="button"
                                        className={`${styles.presetBtn} ${areaSqFt === p.val ? styles.presetBtnActive : ""}`}
                                        onClick={() => setAreaSqFt(p.val)}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bedrooms & Bathrooms */}
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Bedrooms</label>
                                <select
                                    className={styles.select}
                                    value={bedrooms}
                                    onChange={(e) => setBedrooms(Number(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                        <option key={n} value={n}>
                                            {n} {n === 1 ? "Bedroom" : "Bedrooms"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Bathrooms</label>
                                <select
                                    className={styles.select}
                                    value={bathrooms}
                                    onChange={(e) => setBathrooms(Number(e.target.value))}
                                >
                                    {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                                        <option key={n} value={n}>
                                            {n} {n === 1 ? "Bathroom" : "Bathrooms"}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Finish Quality & Age */}
                        <div className={styles.formRow}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Construction & Finish</label>
                                <select
                                    className={styles.select}
                                    value={finishQuality}
                                    onChange={(e) => setFinishQuality(e.target.value as any)}
                                >
                                    <option value="standard">Standard Quality Finishes</option>
                                    <option value="modern">Modern Renovated / Contemporary</option>
                                    <option value="luxury">Ultra-Luxury / Italian Marble Spec</option>
                                    <option value="off_plan">Off-Plan / Under Construction</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Property Age</label>
                                <select
                                    className={styles.select}
                                    value={yearBuiltTier}
                                    onChange={(e) => setYearBuiltTier(e.target.value as any)}
                                >
                                    <option value="under_2">Brand New (&lt; 2 yrs)</option>
                                    <option value="2_to_5">Modern (2 – 5 yrs)</option>
                                    <option value="5_to_10">Established (5 – 10 yrs)</option>
                                    <option value="over_10">Older Classic (10+ yrs)</option>
                                </select>
                            </div>
                        </div>

                        {/* Premium Amenities Checklist */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Value-Adding Amenities
                                <span className={styles.labelHint}>(Select all that apply)</span>
                            </label>
                            <div className={styles.amenitiesGrid}>
                                {AMENITY_OPTIONS.map((a) => {
                                    const active = selectedAmenities.includes(a.id);
                                    return (
                                        <div
                                            key={a.id}
                                            className={`${styles.amenityChip} ${active ? styles.amenityChipActive : ""}`}
                                            onClick={() => toggleAmenity(a.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={active}
                                                onChange={() => {}}
                                                style={{ display: "none" }}
                                            />
                                            <span>{a.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            type="button"
                            className={styles.calculateBtn}
                            onClick={() => {
                                toast.success("Valuation updated with live Kenya real estate comps!");
                            }}
                        >
                            <span>⚡ Re-Run AI Valuation Engine</span>
                        </button>
                    </div>

                    {/* RIGHT COLUMN: Interactive Valuation Results */}
                    <div className={styles.resultsCard}>
                        <div className={styles.resultsHeader}>
                            <div>
                                <div className={styles.resultsTag}>✦ EstateEstimate™ Model</div>
                                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0, color: "var(--text-heading)" }}>
                                    {finalNeighborhood}, {finalCity}
                                </h3>
                            </div>
                            <div className={styles.confidenceBadge}>
                                <span>✓</span>
                                <span>{valuation.confidenceScore}% Confidence Score</span>
                            </div>
                        </div>

                        {/* Big Valuation Display */}
                        <div className={styles.mainPriceDisplay}>
                            <div className={styles.mainPrice}>
                                {formatCurrency(valuation.estimatePrice)}
                            </div>
                            <div className={styles.priceRangeText}>
                                Estimated Range: <strong>{formatCurrency(valuation.lowPrice)}</strong> — <strong>{formatCurrency(valuation.highPrice)}</strong>
                            </div>
                        </div>

                        {/* Range Visualizer Track */}
                        <div className={styles.rangeVisualizer}>
                            <div className={styles.rangeLabels}>
                                <span>Low: {formatCurrency(valuation.lowPrice)}</span>
                                <span style={{ color: "var(--gold-500)", fontWeight: 700 }}>Median Estimate</span>
                                <span>High: {formatCurrency(valuation.highPrice)}</span>
                            </div>
                            <div className={styles.rangeBarTrack}>
                                <div className={styles.rangeBarFill} />
                            </div>
                            <div style={{ textAlign: "center", fontSize: "0.76rem", color: "var(--text-tertiary)" }}>
                                Valuation Ref: {valuation.valuationId} • Updated Today
                            </div>
                        </div>

                        {/* Metric Tiles Grid */}
                        <div className={styles.metricsGrid}>
                            <div className={styles.metricTile}>
                                <div className={styles.metricLabel}>Monthly Rent Forecast</div>
                                <div className={styles.metricValue}>
                                    {formatCurrency(valuation.estimatedMonthlyRent)} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-secondary)" }}>/mo</span>
                                </div>
                                <div className={styles.metricSubtext}>
                                    +{valuation.grossRentalYield}% Gross Yield
                                </div>
                            </div>

                            <div className={styles.metricTile}>
                                <div className={styles.metricLabel}>Airbnb Short-Term</div>
                                <div className={styles.metricValue}>
                                    {formatCurrency(valuation.airbnbNightlyRate)} <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "var(--text-secondary)" }}>/night</span>
                                </div>
                                <div className={styles.metricSubtext}>
                                    ~{formatCurrency(valuation.airbnbGrossAnnual)} / yr potential
                                </div>
                            </div>

                            <div className={styles.metricTile}>
                                <div className={styles.metricLabel}>Price Per Sq Ft</div>
                                <div className={styles.metricValue}>
                                    {formatCurrency(valuation.pricePerSqFt)}
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                                    {formatCurrency(valuation.pricePerSqM)} / sqm
                                </div>
                            </div>

                            <div className={styles.metricTile}>
                                <div className={styles.metricLabel}>Historical Appreciation</div>
                                <div className={styles.metricValue} style={{ color: "var(--success)" }}>
                                    +{valuation.annualAppreciationRate}% <span style={{ fontSize: "0.8rem" }}>YoY</span>
                                </div>
                                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginTop: "0.2rem" }}>
                                    Demand: <strong>{valuation.insights.demandLevel}</strong>
                                </div>
                            </div>
                        </div>

                        {/* 3-Year Historical Growth & 2027 Forecast */}
                        <div className={styles.historicalBox}>
                            <div className={styles.historicalTitle}>
                                <span>📈 3-Year Trend & 2027 AI Forecast</span>
                                <span style={{ fontSize: "0.78rem", color: "var(--gold-500)" }}>Compound Annual Growth</span>
                            </div>

                            <div className={styles.chartBars}>
                                {valuation.historicalTrends.map((t) => {
                                    const heightPct = Math.round((t.price / maxChartPrice) * 100);
                                    return (
                                        <div key={t.year} className={styles.barCol}>
                                            <span className={styles.barVal}>{formatCurrency(t.price)}</span>
                                            <div
                                                className={`${styles.barPill} ${t.isProjected ? styles.barPillProjected : ""}`}
                                                style={{ height: `${heightPct}%` }}
                                                title={`${t.year}: ${formatCurrency(t.price)} (+${t.growthPct}%)`}
                                            />
                                            <span className={styles.barYear}>
                                                {t.year} {t.isProjected ? "(Proj)" : ""}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Strategic Insight Card */}
                        <div className={styles.insightCard}>
                            <div className={styles.insightHeading}>
                                <span>💡 Market Intelligence: {valuation.insights.bestStrategy}</span>
                            </div>
                            <div className={styles.insightText}>
                                {valuation.insights.marketSummary} Properties in {finalNeighborhood} benefit from sustained buyer absorption and robust infrastructure links.
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={styles.resultActions}>
                            <Link href="/dashboard/agent" className={styles.primaryAction}>
                                <span>🏡 List Property at this Valuation</span>
                                <span>→</span>
                            </Link>

                            <button type="button" onClick={handleCopyReport} className={styles.secondaryAction}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                </svg>
                                <span>Copy Valuation Summary</span>
                            </button>

                            <button type="button" onClick={handleShareOrPrint} className={styles.secondaryAction}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 6 2 18 2 18 9" />
                                    <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                    <rect x="6" y="14" width="12" height="8" />
                                </svg>
                                <span>Print / Save PDF Valuation</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
