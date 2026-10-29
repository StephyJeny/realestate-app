"use client";

import React, { useState } from "react";
import type { ListingCopilotOutput, ListingCopyTone } from "@/lib/listingCopilot";
import type { ValuationResult } from "@/lib/valuation";
import toast from "react-hot-toast";
import styles from "./ListingCopilotPanel.module.css";

interface ListingCopilotPanelProps {
    propertyType: "apartment" | "house" | "villa" | "townhouse" | "land" | "commercial";
    listingType: "sale" | "rent";
    city: string;
    neighborhood: string;
    bedrooms: number;
    bathrooms: number;
    areaSqFt: number;
    yearBuilt?: number;
    currentTitle: string;
    currentDescription: string;
    currentAmenities: string[];
    onApplyFields: (updates: {
        title?: string;
        description?: string;
        price?: number;
        amenities?: string[];
    }) => void;
}

export default function ListingCopilotPanel({
    propertyType,
    listingType,
    city,
    neighborhood,
    bedrooms,
    bathrooms,
    areaSqFt,
    yearBuilt = 2025,
    currentTitle,
    currentDescription,
    currentAmenities,
    onApplyFields,
}: ListingCopilotPanelProps) {
    const [tone, setTone] = useState<ListingCopyTone>("luxury_editorial");
    const [finishQuality, setFinishQuality] = useState<"luxury" | "modern" | "standard" | "off_plan">("luxury");
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<ListingCopilotOutput | null>(null);
    const [valuationCommentary, setValuationCommentary] = useState<string | null>(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleGenerate = async () => {
        const safeCity = city.trim() || "Nairobi";
        const safeHood = neighborhood.trim() || "Westlands";
        const safeArea = areaSqFt > 0 ? areaSqFt : propertyType === "villa" ? 3800 : 1650;

        setIsGenerating(true);
        setIsCollapsed(false);

        try {
            const ageYears = Math.max(0, new Date().getFullYear() - (yearBuilt || 2025));
            const yearBuiltTier =
                ageYears <= 2 ? "under_2" : ageYears <= 5 ? "2_to_5" : ageYears <= 10 ? "5_to_10" : "over_10";

            // Run /api/ai/valuation (official EstateEstimate™ pricing endpoint) and /api/ai/listing-copilot in parallel
            const [copilotRes, valuationRes] = await Promise.all([
                fetch("/api/ai/listing-copilot", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: currentTitle,
                        propertyType,
                        listingType,
                        city: safeCity,
                        neighborhood: safeHood,
                        bedrooms: bedrooms || 3,
                        bathrooms: bathrooms || 2,
                        areaSqFt: safeArea,
                        yearBuilt,
                        amenities: currentAmenities,
                        finishQuality,
                        tone,
                    }),
                }),
                fetch("/api/ai/valuation", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        propertyType,
                        city: safeCity,
                        neighborhood: safeHood,
                        areaSqFt: safeArea,
                        bedrooms: bedrooms || 3,
                        bathrooms: bathrooms || 2,
                        finishQuality,
                        yearBuiltTier,
                        amenities: currentAmenities,
                    }),
                }),
            ]);

            const copilotJson = await copilotRes.json();
            const valuationJson = valuationRes.ok ? await valuationRes.json() : null;

            if (!copilotJson.success || !copilotJson.data) {
                toast.error(copilotJson.message || "Could not generate listing suggestions");
                return;
            }

            const draft: ListingCopilotOutput = copilotJson.data;

            // Synchronize pricing with official /api/ai/valuation response if returned
            if (valuationJson?.success && valuationJson.data) {
                const liveVal: ValuationResult & { aiCommentary?: string | null } = valuationJson.data;
                draft.valuation = liveVal;
                draft.recommendedListingPriceKES =
                    listingType === "rent" ? liveVal.estimatedMonthlyRent : liveVal.estimatePrice;
                setValuationCommentary(liveVal.aiCommentary || null);
            } else {
                setValuationCommentary(null);
            }

            setResult(draft);
            toast.success("✨ Co-Pilot generated copy, highlights & EstateEstimate™ pricing!");
        } catch (err) {
            console.error("Listing Co-Pilot error:", err);
            toast.error("Failed to run AI Listing Co-Pilot");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddAmenity = (amenity: string) => {
        if (currentAmenities.some((a) => a.toLowerCase() === amenity.toLowerCase())) return;
        onApplyFields({ amenities: [...currentAmenities, amenity] });
        toast.success(`Added "${amenity}"`);
    };

    const handleApplyAll = () => {
        if (!result) return;
        const mergedAmenities = Array.from(
            new Set([...currentAmenities, ...result.suggestedAmenities.slice(0, 6)])
        );
        const fullCopy = `${result.description}\n\n${result.neighborhoodNarrative}`;
        onApplyFields({
            title: currentTitle.trim() ? currentTitle : result.headlineOptions[0],
            description: fullCopy,
            price: result.recommendedListingPriceKES,
            amenities: mergedAmenities,
        });
        toast.success("⚡ Applied recommended title, copy, highlights, amenities & pricing!");
    };

    return (
        <div className={styles.copilotWrap}>
            <div className={styles.topBar}>
                <div className={styles.brandRow}>
                    <div className={styles.sparkBadge}>✨</div>
                    <div>
                        <h4 className={styles.title}>AI Agent Listing Co-Pilot</h4>
                        <p className={styles.subtitle}>
                            Auto-generate luxury copy, {neighborhood || "neighborhood"} highlights & EstateEstimate™ pricing
                        </p>
                    </div>
                </div>

                <div className={styles.controlsBar}>
                    <select
                        className={styles.selectSmall}
                        value={tone}
                        onChange={(e) => setTone(e.target.value as ListingCopyTone)}
                        aria-label="Listing copy tone"
                    >
                        <option value="luxury_editorial">🏛️ Luxury Editorial</option>
                        <option value="investor_roi">📈 Investor & ROI</option>
                        <option value="warm_family">🏡 Family Sanctuary</option>
                    </select>

                    <select
                        className={styles.selectSmall}
                        value={finishQuality}
                        onChange={(e) =>
                            setFinishQuality(e.target.value as "luxury" | "modern" | "standard" | "off_plan")
                        }
                        aria-label="Finish specification"
                    >
                        <option value="luxury">💎 Luxury Finish</option>
                        <option value="modern">✨ Modern Finish</option>
                        <option value="standard">🏠 Standard Finish</option>
                        <option value="off_plan">🏗️ Off-Plan</option>
                    </select>

                    <button
                        type="button"
                        className={styles.generateBtn}
                        onClick={handleGenerate}
                        disabled={isGenerating}
                    >
                        <span>{isGenerating ? "⏳" : "🤖"}</span>
                        <span>{isGenerating ? "Generating..." : result ? "Regenerate" : "Generate Copy & Price"}</span>
                    </button>
                </div>
            </div>

            {result && !isCollapsed && (
                <div className={styles.resultsBox}>
                    {/* 1. Recommended Pricing via /api/ai/valuation */}
                    <div className={styles.pricingBanner}>
                        <div>
                            <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
                                🤖 EstateEstimate™ Recommended {listingType === "rent" ? "Monthly Rent" : "Asking Price"} ({result.valuation.confidenceScore}% Confidence)
                            </div>
                            <div className={styles.priceMain}>
                                KES {result.recommendedListingPriceKES.toLocaleString()}
                                {listingType === "rent" ? " / month" : ""}
                            </div>
                            <div className={styles.priceSub}>
                                {listingType === "rent"
                                    ? `Est. Gross Yield: ${result.valuation.grossRentalYield}% · Short-Stay Potential: KES ${result.valuation.airbnbNightlyRate.toLocaleString()}/night`
                                    : `Market Range: KES ${result.valuation.lowPrice.toLocaleString()} – KES ${result.valuation.highPrice.toLocaleString()} · KES ${result.valuation.pricePerSqFt.toLocaleString()}/sqft`}
                            </div>
                            {valuationCommentary && (
                                <div style={{ fontSize: "0.72rem", color: "#fde68a", marginTop: "4px", fontStyle: "italic" }}>
                                    &ldquo;{valuationCommentary}&rdquo;
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            className={styles.applyGoldBtn}
                            onClick={() => {
                                onApplyFields({ price: result.recommendedListingPriceKES });
                                toast.success(`Applied recommended price: KES ${result.recommendedListingPriceKES.toLocaleString()}`);
                            }}
                        >
                            Apply Price →
                        </button>
                    </div>

                    {/* 2. Headline Suggestions */}
                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionLabel}>✍️ Suggested Listing Titles</span>
                        </div>
                        <div className={styles.headlineList}>
                            {result.headlineOptions.map((hl, i) => (
                                <div key={i} className={styles.headlineOption}>
                                    <span>{hl}</span>
                                    <button
                                        type="button"
                                        className={styles.miniBtn}
                                        onClick={() => {
                                            onApplyFields({ title: hl });
                                            toast.success("Listing title updated!");
                                        }}
                                    >
                                        Use Title
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Luxury Description */}
                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionLabel}>
                                📜 Luxury Description ({result.source === "gemini-llm" ? "Gemini LLM" : "EstateVue Copy Engine"})
                            </span>
                            <button
                                type="button"
                                className={styles.miniBtn}
                                onClick={() => {
                                    onApplyFields({ description: result.description });
                                    toast.success("Luxury description applied!");
                                }}
                            >
                                Replace Description
                            </button>
                        </div>
                        <div className={styles.copyPreview}>{result.description}</div>
                    </div>

                    {/* 4. Verified Neighborhood Highlights */}
                    <div className={styles.sectionBlock}>
                        <div className={styles.sectionHeader}>
                            <span className={styles.sectionLabel}>📍 Neighborhood Highlights</span>
                            <button
                                type="button"
                                className={styles.miniBtn}
                                onClick={() => {
                                    const base = currentDescription.trim();
                                    const next = base
                                        ? `${base}\n\n${result.neighborhoodNarrative}`
                                        : `${result.description}\n\n${result.neighborhoodNarrative}`;
                                    onApplyFields({ description: next });
                                    toast.success("Appended neighborhood highlights to description!");
                                }}
                            >
                                + Append to Description
                            </button>
                        </div>
                        <ul className={styles.highlightsList}>
                            {result.neighborhoodHighlights.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    {/* 5. High-Value Amenity Suggestions */}
                    {result.suggestedAmenities.length > 0 && (
                        <div className={styles.sectionBlock}>
                            <div className={styles.sectionHeader}>
                                <span className={styles.sectionLabel}>🏷️ High-Demand Amenities (Click to Add)</span>
                                <button
                                    type="button"
                                    className={styles.miniBtn}
                                    onClick={() => {
                                        const merged = Array.from(
                                            new Set([...currentAmenities, ...result.suggestedAmenities.slice(0, 6)])
                                        );
                                        onApplyFields({ amenities: merged });
                                        toast.success("Added recommended amenities!");
                                    }}
                                >
                                    + Add Top 6
                                </button>
                            </div>
                            <div className={styles.amenityChips}>
                                {result.suggestedAmenities.map((am) => (
                                    <button
                                        key={am}
                                        type="button"
                                        className={styles.amenityChip}
                                        onClick={() => handleAddAmenity(am)}
                                    >
                                        + {am}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer: One-Click Apply Everything + Collapse */}
                    <div className={styles.applyAllRow}>
                        <button
                            type="button"
                            onClick={() => setIsCollapsed(true)}
                            style={{
                                background: "none",
                                border: "none",
                                fontSize: "0.75rem",
                                color: "var(--text-tertiary)",
                                cursor: "pointer",
                                fontWeight: 600,
                            }}
                        >
                            Hide Co-Pilot Preview ▲
                        </button>
                        <button
                            type="button"
                            className={styles.generateBtn}
                            onClick={handleApplyAll}
                        >
                            ⚡ Apply All to Listing Form
                        </button>
                    </div>
                </div>
            )}

            {result && isCollapsed && (
                <button
                    type="button"
                    onClick={() => setIsCollapsed(false)}
                    style={{
                        background: "none",
                        border: "none",
                        textAlign: "left",
                        fontSize: "0.76rem",
                        color: "var(--gold-600, #b8860b)",
                        fontWeight: 700,
                        cursor: "pointer",
                        padding: 0,
                    }}
                >
                    ▼ Show Co-Pilot Suggestions (KES {result.recommendedListingPriceKES.toLocaleString()} recommended)
                </button>
            )}
        </div>
    );
}
