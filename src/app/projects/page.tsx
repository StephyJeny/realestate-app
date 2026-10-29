"use client";
import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import {
    offPlanProjects,
    getStartingPriceKES,
    getTotalAvailableUnits,
    ProjectConstructionStatus,
} from "@/lib/projects";
import styles from "./page.module.css";

const STATUS_LABELS: Record<ProjectConstructionStatus, string> = {
    launching: "🚀 Early-Bird Launch",
    under_construction: "🏗️ Active Superstructure",
    topping_out: "🏢 Topped Out — Fit-Out Stage",
    nearing_handover: "🔑 Nearing Handover",
};

export default function OffPlanProjectsPage() {
    const { formatCurrency } = useCurrency();
    const [selectedCity, setSelectedCity] = useState<"all" | "Nairobi" | "Mombasa">("all");
    const [selectedStatus, setSelectedStatus] = useState<"all" | ProjectConstructionStatus>("all");

    const filteredProjects = useMemo(() => {
        return offPlanProjects.filter((proj) => {
            if (selectedCity !== "all" && proj.city !== selectedCity) return false;
            if (selectedStatus !== "all" && proj.status !== selectedStatus) return false;
            return true;
        });
    }, [selectedCity, selectedStatus]);

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div className={styles.eyebrow}>
                        <span>🏗️</span> KENYA OFF-PLAN DEVELOPMENTS &amp; MILESTONE VAULT
                    </div>
                    <h1 className={styles.heroTitle}>
                        Escrow-Protected Off-Plan Developments with Verified Site Progress
                    </h1>
                    <p className={styles.heroSubtitle}>
                        Compare flagship residential towers and gated villa communities in Nairobi and Mombasa. Track dated structural engineer sign-offs, inspect unit mix availability, and model staged construction payment plans in KES, USD, GBP, or EUR.
                    </p>

                    <div className={styles.trustStrip}>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>🔐</span>
                            <div>
                                <div className={styles.trustLabel}>Ring-Fenced Bank Escrow</div>
                                <div className={styles.trustSub}>Milestone tranches released on QS certificate</div>
                            </div>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>🏛️</span>
                            <div>
                                <div className={styles.trustLabel}>NCA-1 &amp; NEMA Verified</div>
                                <div className={styles.trustSub}>Audited statutory &amp; structural approvals</div>
                            </div>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>📜</span>
                            <div>
                                <div className={styles.trustLabel}>Sectional Properties Act 2020</div>
                                <div className={styles.trustSub}>Direct ArdhiSasa sub-titles on handover</div>
                            </div>
                        </div>
                        <div className={styles.trustItem}>
                            <span className={styles.trustIcon}>🌍</span>
                            <div>
                                <div className={styles.trustLabel}>Diaspora Remote Execution</div>
                                <div className={styles.trustSub}>POA conveyancing &amp; 3rd-party snagging</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Filter & Listings */}
            <div className={styles.container}>
                <div className={styles.filterBar}>
                    <div className={styles.pillGroup} role="group" aria-label="Filter by city">
                        {(["all", "Nairobi", "Mombasa"] as const).map((city) => (
                            <button
                                key={city}
                                type="button"
                                className={`${styles.pill} ${selectedCity === city ? styles.pillActive : ""}`}
                                onClick={() => setSelectedCity(city)}
                            >
                                {city === "all" ? "All Cities" : `📍 ${city}`}
                            </button>
                        ))}
                    </div>

                    <div className={styles.pillGroup} role="group" aria-label="Filter by stage">
                        {(["all", "launching", "under_construction", "topping_out"] as const).map((st) => (
                            <button
                                key={st}
                                type="button"
                                className={`${styles.pill} ${selectedStatus === st ? styles.pillActive : ""}`}
                                onClick={() => setSelectedStatus(st)}
                            >
                                {st === "all" ? "All Milestones" : STATUS_LABELS[st]}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles.grid}>
                    {filteredProjects.map((project) => {
                        const startingKES = getStartingPriceKES(project);
                        const { available, total } = getTotalAvailableUnits(project);
                        const firstDepositPct = project.paymentPlan[0]?.percent || 20;

                        return (
                            <article key={project.id} className={styles.card}>
                                <div className={styles.imageWrap}>
                                    <Image
                                        src={project.heroImage}
                                        alt={project.name}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 420px"
                                        style={{ objectFit: "cover" }}
                                    />
                                    <div className={styles.topBadges}>
                                        {project.escrowProtected && (
                                            <span className={styles.escrowBadge}>
                                                ✓ {project.developer.escrowBank.split("—")[0].trim()} Escrow
                                            </span>
                                        )}
                                        <span className={styles.handoverBadge}>
                                            Handover {project.completionQuarter}
                                        </span>
                                    </div>
                                </div>

                                <div className={styles.cardBody}>
                                    <div>
                                        <div className={styles.locationRow}>
                                            {project.neighborhood}, {project.city} • {STATUS_LABELS[project.status]}
                                        </div>
                                        <h2 className={styles.cardTitle}>{project.name}</h2>
                                        <p className={styles.cardTagline}>{project.tagline}</p>
                                    </div>

                                    {/* Construction Progress */}
                                    <div className={styles.progressBox}>
                                        <div className={styles.progressHeader}>
                                            <span>Verified Site Progress</span>
                                            <span style={{ color: "var(--success)" }}>
                                                {project.overallProgressPct}% Complete
                                            </span>
                                        </div>
                                        <div className={styles.progressTrack}>
                                            <div
                                                className={styles.progressFill}
                                                style={{ width: `${project.overallProgressPct}%` }}
                                            />
                                        </div>
                                        <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)", marginTop: "5px" }}>
                                            Developer: <strong>{project.developer.name}</strong> ({project.developer.ncaRegNumber})
                                        </div>
                                    </div>

                                    {/* KPI Strip */}
                                    <div className={styles.metricsRow}>
                                        <div className={styles.metricCell}>
                                            <div className={styles.metricLabel}>Entry Deposit</div>
                                            <div className={styles.metricVal}>{firstDepositPct}% Down</div>
                                        </div>
                                        <div className={styles.metricCell}>
                                            <div className={styles.metricLabel}>Est. Yield</div>
                                            <div className={styles.metricVal} style={{ color: "var(--success)" }}>
                                                {project.expectedRentalYieldPct}% p.a.
                                            </div>
                                        </div>
                                        <div className={styles.metricCell}>
                                            <div className={styles.metricLabel}>Inventory</div>
                                            <div className={styles.metricVal}>
                                                {available}/{total} Left
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className={styles.cardFooter}>
                                        <div>
                                            <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase" }}>
                                                Starting From
                                            </div>
                                            <div style={{ fontSize: "1.18rem", fontWeight: 800, color: "var(--gold-600, #b8860b)" }}>
                                                {formatCurrency(startingKES)}
                                            </div>
                                        </div>

                                        <Link href={`/projects/${project.slug}`} className={styles.ctaBtn}>
                                            View Milestones &amp; Units →
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
