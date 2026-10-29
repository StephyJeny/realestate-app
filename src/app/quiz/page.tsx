"use client";
import React, { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { sampleProperties } from "@/lib/data";
import { getPropertiesPage, FirestoreProperty } from "@/lib/firestore";
import {
    mergeLiveAndSampleProperties,
    QuizAnswersInput,
    QuizMatchResult,
    rankPropertiesForQuiz,
} from "@/lib/liveInventory";
import { useCurrency } from "@/context/CurrencyContext";
import styles from "./page.module.css";

export default function DreamHomeQuizPage() {
    const { formatCurrencyFull } = useCurrency();
    const [currentStep, setCurrentStep] = useState<number>(1);
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [liveFirestoreItems, setLiveFirestoreItems] = useState<FirestoreProperty[]>([]);
    const [loadingLive, setLoadingLive] = useState<boolean>(true);

    const [answers, setAnswers] = useState<QuizAnswersInput>({
        goal: "",
        vibe: "",
        bedrooms: "",
        budget: "",
        amenities: [],
    });

    // Subscribe / fetch live agent-uploaded Firestore listings on mount
    useEffect(() => {
        let active = true;
        getPropertiesPage(100)
            .then(({ items }) => {
                if (active) setLiveFirestoreItems(items);
            })
            .catch(() => {
                // Gracefully retain sampleProperties fallback when offline or unconfigured
            })
            .finally(() => {
                if (active) setLoadingLive(false);
            });
        return () => {
            active = false;
        };
    }, []);

    const { inventory, liveIds } = useMemo(
        () => mergeLiveAndSampleProperties(liveFirestoreItems, sampleProperties),
        [liveFirestoreItems]
    );

    const totalSteps = 5;

    const goals = [
        {
            id: "family",
            title: "Forever Family Sanctuary",
            desc: "Spacious compound, tranquil gardens, top private schools nearby.",
            icon: "🏡",
        },
        {
            id: "investment",
            title: "High-Yield Investment / Airbnb",
            desc: "Maximum rental yield, prime location, business traveler & expat demand.",
            icon: "📈",
        },
        {
            id: "vacation",
            title: "Coastal or Nature Retreat",
            desc: "Ocean breeze or highland serenity for weekend escapes & holidays.",
            icon: "🌴",
        },
        {
            id: "executive",
            title: "Urban Executive Penthouse",
            desc: "Walkable to Westlands/CBD, skyline terraces, luxury concierge amenities.",
            icon: "🏙️",
        },
    ];

    const vibes = [
        {
            id: "leafy",
            title: "Leafy, Private & Expansive",
            desc: "Tree-lined avenues, large acreages (Karen, Runda, Muthaiga).",
            icon: "🌳",
        },
        {
            id: "cosmopolitan",
            title: "Vibrant & Cosmopolitan",
            desc: "Art galleries, fine dining, commercial hub (Westlands, Kilimani).",
            icon: "🍸",
        },
        {
            id: "coastal",
            title: "Coastal Breeze & Oceanfront",
            desc: "Sandy beaches, tropical sunsets, ocean views (Nyali, Mombasa).",
            icon: "🌊",
        },
        {
            id: "hills",
            title: "Elevated Hillside & Nature",
            desc: "Quiet ridge panoramas, lush valley greenery (Kitisuru, Tigoni).",
            icon: "⛰️",
        },
    ];

    const bedroomOptions = [
        { id: "1-2", label: "1 - 2 Bedrooms", sub: "Compact, easy upkeep or luxury pied-à-terre", icon: "🔑" },
        { id: "3-4", label: "3 - 4 Bedrooms", sub: "Ideal family balance with guest suite", icon: "🛏️" },
        { id: "5+", label: "5+ Bedrooms / Estate", sub: "Palatial residence with staff quarters", icon: "👑" },
    ];

    const budgetRanges = [
        { id: "under_35m", label: "Under KES 35M", sub: "Great starter or high-yield investment unit" },
        { id: "35m_80m", label: "KES 35M - 80M", sub: "Premium suburban villas and luxury penthouses" },
        { id: "80m_150m", label: "KES 80M - 150M", sub: "High-end ambassadorial homes and oceanfront villas" },
        { id: "above_150m", label: "KES 150M+ (Ultra Luxury)", sub: "Trophy estates with bespoke architecture" },
    ];

    const amenityOptions = [
        { id: "pool", label: "Swimming Pool", icon: "🏊" },
        { id: "garden", label: "Private Garden", icon: "🌿" },
        { id: "security", label: "24/7 Gated Security", icon: "🔒" },
        { id: "smart", label: "Smart Home Tech", icon: "⚡" },
        { id: "staff", label: "Staff Quarters (DSQ)", icon: "👥" },
        { id: "gym", label: "Fitness Gym", icon: "💪" },
        { id: "views", label: "Scenic / Ocean Views", icon: "🌅" },
    ];

    const toggleAmenity = (id: string) => {
        setAnswers((prev) => {
            const exists = prev.amenities.includes(id);
            return {
                ...prev,
                amenities: exists
                    ? prev.amenities.filter((a) => a !== id)
                    : [...prev.amenities, id],
            };
        });
    };

    const isStepValid = () => {
        if (currentStep === 1) return !!answers.goal;
        if (currentStep === 2) return !!answers.vibe;
        if (currentStep === 3) return !!answers.bedrooms;
        if (currentStep === 4) return !!answers.budget;
        if (currentStep === 5) return true; // Amenities optional
        return false;
    };

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        } else {
            setIsCompleted(true);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleRetake = () => {
        setAnswers({
            goal: "",
            vibe: "",
            bedrooms: "",
            budget: "",
            amenities: [],
        });
        setCurrentStep(1);
        setIsCompleted(false);
    };

    // Rank across unified live Firestore + featured sample inventory
    const matches: QuizMatchResult[] = useMemo(() => {
        if (!isCompleted) return [];
        return rankPropertiesForQuiz(inventory, answers, liveIds, 3);
    }, [isCompleted, inventory, answers, liveIds]);

    return (
        <div className={styles.page}>
            <div className="container">
                {/* Hero Header */}
                <div className={styles.hero}>
                    <span className={styles.heroBadge}>✨ 60-Second Property Matchmaker</span>
                    <h1 className={styles.heroTitle}>Find Your Ideal Kenyan Home</h1>
                    <p className={styles.heroSub}>
                        Answer 5 quick lifestyle questions and our AI matchmaker will curate the top 3 residences across our live agent inventory.
                    </p>
                    <div
                        style={{
                            marginTop: "0.75rem",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.45rem",
                            padding: "0.3rem 0.85rem",
                            borderRadius: "999px",
                            background: "rgba(16, 185, 129, 0.12)",
                            border: "1px solid rgba(16, 185, 129, 0.35)",
                            color: "#10b981",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                        }}
                    >
                        <span>🟢</span>
                        <span>
                            {loadingLive
                                ? "Syncing live Firestore listings..."
                                : `Matching across ${inventory.length} verified listings${
                                      liveIds.size > 0 ? ` (${liveIds.size} live agent uploads)` : ""
                                  }`}
                        </span>
                    </div>
                </div>

                {!isCompleted ? (
                    <div className={styles.quizCard}>
                        {/* Progress Bar */}
                        <div className={styles.progressWrap}>
                            <div className={styles.progressMeta}>
                                <span>Step {currentStep} of {totalSteps}</span>
                                <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
                            </div>
                            <div className={styles.progressBarBg}>
                                <div
                                    className={styles.progressBarFill}
                                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Step 1: Goal */}
                        {currentStep === 1 && (
                            <div>
                                <div className={styles.stepHeader}>
                                    <h2 className={styles.stepTitle}>What is your primary ownership goal?</h2>
                                    <p className={styles.stepSubtitle}>This shapes whether we prioritize tranquil privacy, short-let yields, or urban convenience.</p>
                                </div>
                                <div className={styles.optionsGrid}>
                                    {goals.map((g) => (
                                        <div
                                            key={g.id}
                                            className={`${styles.optionCard} ${answers.goal === g.id ? styles.optionCardSelected : ""}`}
                                            onClick={() => setAnswers({ ...answers, goal: g.id })}
                                        >
                                            <span className={styles.optionIcon}>{g.icon}</span>
                                            <div className={styles.optionContent}>
                                                <h4>{g.title}</h4>
                                                <p>{g.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2: Vibe */}
                        {currentStep === 2 && (
                            <div>
                                <div className={styles.stepHeader}>
                                    <h2 className={styles.stepTitle}>What neighborhood vibe speaks to you?</h2>
                                    <p className={styles.stepSubtitle}>Choose the atmosphere that complements your daily life.</p>
                                </div>
                                <div className={styles.optionsGrid}>
                                    {vibes.map((v) => (
                                        <div
                                            key={v.id}
                                            className={`${styles.optionCard} ${answers.vibe === v.id ? styles.optionCardSelected : ""}`}
                                            onClick={() => setAnswers({ ...answers, vibe: v.id })}
                                        >
                                            <span className={styles.optionIcon}>{v.icon}</span>
                                            <div className={styles.optionContent}>
                                                <h4>{v.title}</h4>
                                                <p>{v.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Bedrooms */}
                        {currentStep === 3 && (
                            <div>
                                <div className={styles.stepHeader}>
                                    <h2 className={styles.stepTitle}>How many bedrooms do you need?</h2>
                                    <p className={styles.stepSubtitle}>Select your ideal space and room distribution.</p>
                                </div>
                                <div className={styles.optionsGrid}>
                                    {bedroomOptions.map((b) => (
                                        <div
                                            key={b.id}
                                            className={`${styles.optionCard} ${answers.bedrooms === b.id ? styles.optionCardSelected : ""}`}
                                            onClick={() => setAnswers({ ...answers, bedrooms: b.id })}
                                        >
                                            <span className={styles.optionIcon}>{b.icon}</span>
                                            <div className={styles.optionContent}>
                                                <h4>{b.label}</h4>
                                                <p>{b.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 4: Budget */}
                        {currentStep === 4 && (
                            <div>
                                <div className={styles.stepHeader}>
                                    <h2 className={styles.stepTitle}>What is your target budget range?</h2>
                                    <p className={styles.stepSubtitle}>We will identify properties within your optimal price zone.</p>
                                </div>
                                <div className={styles.optionsGrid}>
                                    {budgetRanges.map((b) => (
                                        <div
                                            key={b.id}
                                            className={`${styles.optionCard} ${answers.budget === b.id ? styles.optionCardSelected : ""}`}
                                            onClick={() => setAnswers({ ...answers, budget: b.id })}
                                        >
                                            <span className={styles.optionIcon}>💰</span>
                                            <div className={styles.optionContent}>
                                                <h4>{b.label}</h4>
                                                <p>{b.sub}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 5: Amenities */}
                        {currentStep === 5 && (
                            <div>
                                <div className={styles.stepHeader}>
                                    <h2 className={styles.stepTitle}>Select your must-have amenities</h2>
                                    <p className={styles.stepSubtitle}>Choose any key features you cannot live without (optional).</p>
                                </div>
                                <div className={styles.amenitiesGrid}>
                                    {amenityOptions.map((a) => {
                                        const selected = answers.amenities.includes(a.id);
                                        return (
                                            <button
                                                key={a.id}
                                                type="button"
                                                className={`${styles.amenityPill} ${selected ? styles.amenityPillSelected : ""}`}
                                                onClick={() => toggleAmenity(a.id)}
                                            >
                                                <span>{a.icon}</span>
                                                <span>{a.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Controls */}
                        <div className={styles.quizControls}>
                            {currentStep > 1 ? (
                                <button type="button" className={styles.backBtn} onClick={handleBack}>
                                    ← Back
                                </button>
                            ) : (
                                <div />
                            )}

                            <button
                                type="button"
                                className={styles.nextBtn}
                                onClick={handleNext}
                                disabled={!isStepValid()}
                            >
                                {currentStep === totalSteps ? "✨ Reveal My Matches" : "Continue →"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Results Screen */
                    <div>
                        <div className={styles.resultHeader}>
                            <span className={styles.resultBadge}>🎉 Matchmaker Results Ready</span>
                            <h2 className={styles.resultTitle}>Your Top 3 Curated Properties</h2>
                            <p className={styles.resultSubtitle}>
                                Ranked across {inventory.length} verified & live agent-uploaded residences based on your lifestyle profile.
                            </p>
                        </div>

                        <div className={styles.matchesGrid}>
                            {matches.map((m) => (
                                <div key={m.property.id} className={styles.matchCard}>
                                    <div className={styles.matchImageWrap}>
                                        <Image
                                            src={m.property.images[0] || "/images/property-1.png"}
                                            alt={m.property.title}
                                            fill
                                            style={{ objectFit: "cover" }}
                                            sizes="(max-width: 768px) 100vw, 360px"
                                        />
                                        <span className={styles.matchScoreBadge}>
                                            ⭐ {m.score}% Match
                                        </span>
                                        {m.isLiveListing && (
                                            <span
                                                style={{
                                                    position: "absolute",
                                                    bottom: "10px",
                                                    left: "10px",
                                                    padding: "0.22rem 0.6rem",
                                                    borderRadius: "999px",
                                                    background: "rgba(15, 23, 42, 0.85)",
                                                    color: "#34d399",
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    backdropFilter: "blur(6px)",
                                                }}
                                            >
                                                🟢 Live Agent Listing
                                            </span>
                                        )}
                                    </div>

                                    <div className={styles.matchBody}>
                                        <div className={styles.matchPrice}>
                                            {formatCurrencyFull(m.property.price)}
                                            {m.property.listingType === "rent" ? " /mo" : ""}
                                        </div>
                                        <h3 className={styles.matchTitle}>{m.property.title}</h3>
                                        <div className={styles.matchLocation}>
                                            📍 {m.property.location.neighborhood}, {m.property.location.city} · {m.property.bedrooms} Beds · {m.property.area.toLocaleString()} sqft
                                        </div>

                                        {m.matchReasons.length > 0 && (
                                            <div className={styles.matchWhyBox}>
                                                <strong>Why this matches:</strong>
                                                <ul style={{ margin: "4px 0 0", paddingLeft: "1.2rem" }}>
                                                    {m.matchReasons.map((r, i) => (
                                                        <li key={i}>{r}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className={styles.matchActions}>
                                            <Link href={`/properties/${m.property.id}`} className={styles.viewBtn}>
                                                View Property Details →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className={styles.retakeWrap}>
                            <button type="button" onClick={handleRetake} className={styles.backBtn}>
                                🔄 Retake Dream Home Quiz
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
