"use client";

import React, { useState, useMemo, useEffect } from "react";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { useCurrency } from "@/context/CurrencyContext";
import {
    calculateStagingBudget,
    FIT_OUT_TIER_OPTIONS,
    FitOutTierId,
    generateStagingBOQDocument,
    getStagingStyleById,
    ROOM_SCOPE_OPTIONS,
    RoomScopeId,
    SpatialHotspot,
    STAGING_STYLES,
    StagingStyleId,
} from "@/lib/virtualStaging";
import toast from "react-hot-toast";
import styles from "./VirtualStagingStudio.module.css";

interface VirtualStagingStudioProps {
    propertyTitle: string;
    propertyType: string;
    neighborhood: string;
    city: string;
    bedrooms: number;
    areaSqFt: number;
    propertyPriceKES: number;
    images: string[];
    selectedGalleryIndex?: number;
    onRequestQuote?: (summaryMessage: string) => void;
}

export default function VirtualStagingStudio({
    propertyTitle,
    propertyType,
    neighborhood,
    city,
    bedrooms,
    areaSqFt,
    propertyPriceKES,
    images,
    selectedGalleryIndex = 0,
    onRequestQuote,
}: VirtualStagingStudioProps) {
    const { formatCurrencyFull } = useCurrency();
    const safeImages = images.length > 0 ? images : ["/images/property-1.png"];

    const [photoIndex, setPhotoIndex] = useState<number>(0);
    const [styleId, setStyleId] = useState<StagingStyleId>("afro_minimalist");
    const [roomScope, setRoomScope] = useState<RoomScopeId>("living_dining");
    const [fitOutTier, setFitOutTier] = useState<FitOutTierId>("furnishing_only");
    const [splitPct, setSplitPct] = useState<number>(68); // % of "Reimagined" visible from left
    const [showHotspots, setShowHotspots] = useState<boolean>(true);
    const [selectedHotspot, setSelectedHotspot] = useState<SpatialHotspot | null>(null);
    const [customAiNotes, setCustomAiNotes] = useState<string[] | null>(null);
    const [aiSource, setAiSource] = useState<"gemini-llm" | "staging-engine">("staging-engine");
    const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false);
    const [showBoqItems, setShowBoqItems] = useState<boolean>(false);

    useEffect(() => {
        if (selectedGalleryIndex >= 0 && selectedGalleryIndex < safeImages.length) {
            setPhotoIndex(selectedGalleryIndex);
        }
    }, [selectedGalleryIndex, safeImages.length]);

    const currentStyle = useMemo(() => getStagingStyleById(styleId), [styleId]);

    // Reset hotspot & custom AI notes when changing style or room scope
    useEffect(() => {
        setSelectedHotspot(currentStyle.hotspots[0] || null);
        setCustomAiNotes(null);
        setAiSource("staging-engine");
    }, [currentStyle, roomScope]);

    const budget = useMemo(
        () =>
            calculateStagingBudget({
                styleId,
                roomScope,
                fitOutTier,
                propertyAreaSqFt: areaSqFt,
                bedrooms,
                propertyPriceKES,
            }),
        [styleId, roomScope, fitOutTier, areaSqFt, bedrooms, propertyPriceKES]
    );

    const activeNotes = customAiNotes || currentStyle.curatorNotes[roomScope] || currentStyle.curatorNotes.living_dining;

    const handleGenerateAiBrief = async () => {
        setIsGeneratingAi(true);
        try {
            const res = await fetch("/api/ai/staging", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    propertyTitle,
                    propertyType,
                    neighborhood,
                    city,
                    bedrooms,
                    areaSqFt,
                    propertyPriceKES,
                    styleId,
                    roomScope,
                    fitOutTier,
                }),
            });
            const json = await res.json();
            if (json.success && Array.isArray(json.data?.aiConceptNotes)) {
                setCustomAiNotes(json.data.aiConceptNotes);
                setAiSource(json.data.source || "staging-engine");
                toast.success(`✨ ${currentStyle.name} design brief tailored for ${neighborhood}!`);
            } else {
                toast.error("Could not refresh AI design brief");
            }
        } catch {
            toast.error("Network error generating design brief");
        } finally {
            setIsGeneratingAi(false);
        }
    };

    const handleDownloadBOQ = () => {
        const text = generateStagingBOQDocument({
            propertyTitle,
            location: `${neighborhood}, ${city}`,
            style: currentStyle,
            budget,
            aiConceptNotes: activeNotes,
        });
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `EstateVue-Staging-BOQ-${styleId}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Downloaded Interior Design Brief & Fit-Out BOQ!");
    };

    const activePhoto = safeImages[photoIndex] || safeImages[0];

    return (
        <div className={styles.studioCard}>
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <span className={styles.badge}>✨ AI Virtual Staging Studio</span>
                    <h3 className={styles.title}>Reimagine This Room & Fit-Out Estimator</h3>
                    <p className={styles.subtitle}>
                        Preview curated Kenyan & diplomatic interior aesthetics on this listing&apos;s photos and estimate turnkey furnishing or renovation costs.
                    </p>
                </div>
                <button
                    type="button"
                    className={styles.aiBriefBtn}
                    onClick={handleGenerateAiBrief}
                    disabled={isGeneratingAi}
                >
                    <span>{isGeneratingAi ? "⏳" : "🤖"}</span>
                    <span>{isGeneratingAi ? "Styling Room..." : "Tailor AI Design Brief"}</span>
                </button>
            </div>

            <div className={styles.body}>
                {/* 1. Aesthetic Style Selector */}
                <div className={styles.styleTabs} role="tablist" aria-label="Interior Design Aesthetics">
                    {STAGING_STYLES.map((st) => {
                        const isActive = st.id === styleId;
                        return (
                            <button
                                key={st.id}
                                type="button"
                                role="tab"
                                aria-selected={isActive}
                                className={`${styles.styleCard} ${isActive ? styles.styleCardActive : ""}`}
                                onClick={() => setStyleId(st.id)}
                            >
                                <div className={styles.styleCardTop}>
                                    <span className={styles.styleName}>
                                        {st.emoji} {st.name}
                                    </span>
                                    <div className={styles.swatches}>
                                        {st.palette.map((hex) => (
                                            <span
                                                key={hex}
                                                className={styles.swatch}
                                                style={{ background: hex }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <span className={styles.styleYield}>+{st.rentalYieldBoostPct}% Furnished Yield</span>
                            </button>
                        );
                    })}
                </div>

                {/* 2. Interactive Before / After Split Viewport */}
                <div className={styles.stageViewport}>
                    {/* Base Layer: Original Listing Photo (Right side revealed) */}
                    <div className={styles.photoLayer}>
                        <OptimizedImage
                            src={activePhoto}
                            alt={`Original ${propertyTitle}`}
                            fill
                            sizes="(max-width: 768px) 100vw, 800px"
                        />
                    </div>

                    {/* Clipped Layer: Reimagined Styled Photo (Left side up to splitPct%) */}
                    <div
                        className={styles.afterLayer}
                        style={{
                            clipPath: `inset(0 ${100 - splitPct}% 0 0)`,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                filter: currentStyle.cssFilter,
                                transition: "filter 0.35s ease",
                            }}
                        >
                            <OptimizedImage
                                src={activePhoto}
                                alt={`${currentStyle.name} Reimagined ${propertyTitle}`}
                                fill
                                sizes="(max-width: 768px) 100vw, 800px"
                            />
                        </div>
                        <div
                            className={styles.ambientTint}
                            style={{
                                background: currentStyle.overlayGradient,
                                mixBlendMode: currentStyle.blendMode,
                                opacity: currentStyle.overlayOpacity,
                            }}
                        />
                        <div className={styles.lightingVignette} />
                    </div>

                    {/* Corner Labels */}
                    <span className={styles.cornerLabelLeft}>
                        {currentStyle.emoji} Reimagined: {currentStyle.name}
                    </span>
                    <span className={styles.cornerLabelRight}>Original Photo</span>

                    {/* Split Divider Line + Handle */}
                    <div className={styles.dividerLine} style={{ left: `${splitPct}%` }}>
                        <div className={styles.dividerHandle}>⇄</div>
                    </div>

                    {/* Accessible Drag Range Input */}
                    <input
                        type="range"
                        min={5}
                        max={95}
                        value={splitPct}
                        onChange={(e) => setSplitPct(Number(e.target.value))}
                        aria-label="Slide to compare restyled room and original listing photo"
                        className={styles.sliderInput}
                    />

                    {/* Interactive Spatial Design Hotspots */}
                    {showHotspots &&
                        currentStyle.hotspots.map((hs, idx) => {
                            if (hs.xPct > splitPct) return null; // Only show hotspots on the reimagined side
                            return (
                                <button
                                    key={hs.id}
                                    type="button"
                                    className={styles.hotspotPin}
                                    style={{ left: `${hs.xPct}%`, top: `${hs.yPct}%` }}
                                    onClick={() => setSelectedHotspot(hs)}
                                    title={hs.item}
                                    aria-label={`Inspect ${hs.item}`}
                                >
                                    {idx + 1}
                                </button>
                            );
                        })}

                    {showHotspots && selectedHotspot && (
                        <div className={styles.hotspotCard}>
                            <div>
                                <div style={{ fontSize: "0.8rem", fontWeight: 800, color: "var(--gold-400, #e8b930)" }}>
                                    📌 {selectedHotspot.item}
                                </div>
                                <div style={{ fontSize: "0.73rem", color: "rgba(255,255,255,0.82)", marginTop: "2px" }}>
                                    {selectedHotspot.materialNote}
                                </div>
                                <div style={{ fontSize: "0.75rem", fontWeight: 700, marginTop: "4px", color: "#34d399" }}>
                                    Indicative Piece Cost: {formatCurrencyFull(selectedHotspot.estCostKES)}
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedHotspot(null)}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "rgba(255,255,255,0.65)",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                    padding: "2px",
                                }}
                                aria-label="Dismiss hotspot card"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </div>

                {/* Photo Selector Strip + Hotspot Toggle */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
                    {safeImages.length > 1 ? (
                        <div className={styles.photoStrip}>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-tertiary)", marginRight: "0.25rem" }}>
                                Room Photo:
                            </span>
                            {safeImages.map((img, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`${styles.photoThumb} ${photoIndex === idx ? styles.photoThumbActive : ""}`}
                                    onClick={() => setPhotoIndex(idx)}
                                    aria-label={`Restyle photo ${idx + 1}`}
                                >
                                    <OptimizedImage src={img} alt={`Room ${idx + 1}`} fill sizes="72px" />
                                </button>
                            ))}
                        </div>
                    ) : (
                        <span style={{ fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                            Drag the ⇄ slider across the photo to compare original vs. restyled ambiance.
                        </span>
                    )}

                    <button
                        type="button"
                        className={styles.pillBtn}
                        onClick={() => setShowHotspots((v) => !v)}
                    >
                        {showHotspots ? "📌 Hide Spec Pins" : "📌 Show Spec Pins"}
                    </button>
                </div>

                {/* 3. Target Room & Fit-Out Tier Controls */}
                <div className={styles.controlsRow}>
                    <div>
                        <span className={styles.controlGroupLabel}>Target Space</span>
                        <div className={styles.pillGroup}>
                            {ROOM_SCOPE_OPTIONS.map((rm) => (
                                <button
                                    key={rm.id}
                                    type="button"
                                    className={`${styles.pillBtn} ${roomScope === rm.id ? styles.pillBtnActive : ""}`}
                                    onClick={() => setRoomScope(rm.id)}
                                >
                                    {rm.icon} {rm.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <span className={styles.controlGroupLabel}>Fit-Out / Renovation Scope</span>
                        <div className={styles.pillGroup}>
                            {FIT_OUT_TIER_OPTIONS.map((tier) => (
                                <button
                                    key={tier.id}
                                    type="button"
                                    className={`${styles.pillBtn} ${fitOutTier === tier.id ? styles.pillBtnActive : ""}`}
                                    onClick={() => setFitOutTier(tier.id)}
                                    title={tier.subtitle}
                                >
                                    {tier.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 4. Architectural Concept & Materials Brief */}
                <div className={styles.conceptBox}>
                    <div className={styles.conceptHeader}>
                        <h4 className={styles.conceptTitle}>
                            {currentStyle.emoji} {currentStyle.name} Spatial Concept
                        </h4>
                        <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "var(--gold-600, #b8860b)" }}>
                            {aiSource === "gemini-llm" ? "✨ Gemini Interior Architect" : "📐 Kenyan Interior Spec"}
                        </span>
                    </div>
                    <ul className={styles.conceptList}>
                        {activeNotes.map((note, idx) => (
                            <li key={idx}>{note}</li>
                        ))}
                    </ul>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.7rem" }}>
                        {currentStyle.materialsSummary.map((mat) => (
                            <span
                                key={mat}
                                style={{
                                    fontSize: "0.7rem",
                                    padding: "0.2rem 0.55rem",
                                    borderRadius: "999px",
                                    background: "var(--bg-secondary, #ffffff)",
                                    border: "1px solid var(--border-color, #e2e8f0)",
                                    color: "var(--text-secondary)",
                                    fontWeight: 600,
                                }}
                            >
                                {mat}
                            </span>
                        ))}
                    </div>
                </div>

                {/* 5. Cost & Investment Uplift KPIs */}
                <div className={styles.kpiGrid}>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Estimated Fit-Out Cost</span>
                        <div className={styles.kpiValue}>{formatCurrencyFull(budget.totalEstimateKES)}</div>
                        <div className={styles.kpiSub}>
                            ~{budget.targetAreaSqFt.toLocaleString()} sqft · {budget.estimatedTimelineWeeks} wks
                        </div>
                    </div>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Furnished Rent Uplift</span>
                        <div className={styles.kpiValue} style={{ color: "#10b981" }}>
                            +{formatCurrencyFull(budget.estimatedMonthlyRentUpliftKES)}/mo
                        </div>
                        <div className={styles.kpiSub}>Est. payback ~{budget.paybackMonthsEstimate} mos</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Resale Value Uplift</span>
                        <div className={styles.kpiValue} style={{ color: "var(--gold-600, #b8860b)" }}>
                            +{formatCurrencyFull(budget.estimatedResaleValueUpliftKES)}
                        </div>
                        <div className={styles.kpiSub}>Turnkey buyer premium</div>
                    </div>
                    <div className={styles.kpiCard}>
                        <span className={styles.kpiLabel}>Market Range</span>
                        <div className={styles.kpiValue} style={{ fontSize: "0.86rem" }}>
                            {formatCurrencyFull(budget.lowEstimateKES)} – {formatCurrencyFull(budget.highEstimateKES)}
                        </div>
                        <div className={styles.kpiSub}>Nairobi / Coast contractor rates</div>
                    </div>
                </div>

                {/* 6. Expandable Itemized BOQ */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowBoqItems((v) => !v)}
                        style={{
                            width: "100%",
                            padding: "0.6rem 0.9rem",
                            borderRadius: "10px",
                            border: "1px dashed var(--border-color, #cbd5e1)",
                            background: "transparent",
                            color: "var(--text-primary)",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <span>📋 {showBoqItems ? "Hide" : "View"} Itemized Bill of Quantities (5 Categories)</span>
                        <span>{showBoqItems ? "▲" : "▼"}</span>
                    </button>

                    {showBoqItems && (
                        <div className={styles.boqList} style={{ marginTop: "0.65rem" }}>
                            {budget.lineItems.map((item) => (
                                <div key={item.id} className={styles.boqRow}>
                                    <div>
                                        <div className={styles.boqItemTitle}>{item.label}</div>
                                        <div className={styles.boqItemNote}>{item.note}</div>
                                    </div>
                                    <div className={styles.boqItemAmount}>
                                        {formatCurrencyFull(item.amountKES)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 7. Actions */}
                <div className={styles.footerActions}>
                    <button
                        type="button"
                        onClick={handleDownloadBOQ}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: "0.8rem", fontWeight: 700 }}
                    >
                        📥 Download Design Brief & BOQ (.txt)
                    </button>

                    {onRequestQuote && (
                        <button
                            type="button"
                            onClick={() => {
                                const msg = `Hi! I'm interested in "${propertyTitle}" and would also like a turnkey ${currentStyle.name} interior fit-out quote (~KES ${budget.totalEstimateKES.toLocaleString()} est. for ${roomScope.replace("_", " ")}).`;
                                onRequestQuote(msg);
                            }}
                            className="btn btn-gold btn-sm"
                            style={{ fontSize: "0.8rem", fontWeight: 700 }}
                        >
                            🛋️ Request Turnkey Fit-Out With Agent →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
