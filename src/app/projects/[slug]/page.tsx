"use client";
import React, { use, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCurrency } from "@/context/CurrencyContext";
import {
    getOffPlanProjectBySlug,
    calculateStagedPaymentSchedule,
} from "@/lib/projects";
import CashToCloseCalculator from "@/components/property/CashToCloseCalculator";
import DiasporaConcierge from "@/components/property/DiasporaConcierge";
import styles from "./page.module.css";

const PaymentModal = dynamic(() => import("@/components/payment/PaymentModal"));
const ViewingSchedulerModal = dynamic(() => import("@/components/property/ViewingSchedulerModal"));

interface Props {
    params: Promise<{ slug: string }>;
}

export default function OffPlanProjectDetailPage({ params }: Props) {
    const { slug } = use(params);
    const project = getOffPlanProjectBySlug(slug);
    const { formatCurrency, formatCurrencyFull } = useCurrency();

    const [selectedUnitId, setSelectedUnitId] = useState<string>(
        project?.unitMix[0]?.id || ""
    );
    const [activeGalleryIdx, setActiveGalleryIdx] = useState<number>(0);
    const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
    const [schedulerMode, setSchedulerMode] = useState<"in_person" | "virtual" | null>(null);

    const selectedUnit = useMemo(() => {
        if (!project) return null;
        return project.unitMix.find((u) => u.id === selectedUnitId) || project.unitMix[0];
    }, [project, selectedUnitId]);

    const schedule = useMemo(() => {
        if (!project || !selectedUnit) return [];
        return calculateStagedPaymentSchedule(selectedUnit.priceKES, project.paymentPlan);
    }, [project, selectedUnit]);

    if (!project || !selectedUnit) {
        return (
            <div style={{ padding: "8rem 1.5rem", textAlign: "center" }}>
                <h2>Off-Plan Development Not Found</h2>
                <p style={{ color: "var(--text-secondary)", margin: "0.75rem 0 1.5rem" }}>
                    The project you requested could not be located.
                </p>
                <Link href="/projects" className="btn btn-primary">
                    ← Back to Off-Plan Developments
                </Link>
            </div>
        );
    }

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <div className={styles.heroInner}>
                    <div>
                        <div className={styles.breadcrumb}>
                            <Link href="/projects" style={{ color: "var(--gold-300)" }}>
                                Off-Plan Developments
                            </Link>
                            <span>/</span>
                            <span>{project.city}</span>
                            <span>/</span>
                            <span>{project.name}</span>
                        </div>

                        <div className={styles.badgeStrip}>
                            <span className={styles.badgeGreen}>
                                🔐 {project.developer.escrowBank}
                            </span>
                            <span className={styles.badgeGold}>
                                🏛️ {project.developer.ncaRegNumber}
                            </span>
                            {project.sectionalTitleCompliant && (
                                <span className={styles.badgeGold}>
                                    📜 Sectional Properties Act 2020
                                </span>
                            )}
                        </div>

                        <h1 className={styles.title}>{project.name}</h1>
                        <p className={styles.tagline}>{project.description}</p>

                        <div className={styles.heroStats}>
                            <div className={styles.heroStat}>
                                <div className={styles.heroStatLabel}>Site Progress</div>
                                <div className={styles.heroStatVal} style={{ color: "#34d399" }}>
                                    {project.overallProgressPct}% Verified
                                </div>
                            </div>
                            <div className={styles.heroStat}>
                                <div className={styles.heroStatLabel}>Target Handover</div>
                                <div className={styles.heroStatVal}>{project.completionQuarter}</div>
                            </div>
                            <div className={styles.heroStat}>
                                <div className={styles.heroStatLabel}>Proj. Rental Yield</div>
                                <div className={styles.heroStatVal} style={{ color: "var(--gold-300)" }}>
                                    {project.expectedRentalYieldPct}% p.a.
                                </div>
                            </div>
                            <div className={styles.heroStat}>
                                <div className={styles.heroStatLabel}>Capital Uplift</div>
                                <div className={styles.heroStatVal}>
                                    +{project.projectedAppreciationPct}% Est.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className={styles.heroGalleryCard}>
                            <Image
                                src={project.galleryImages[activeGalleryIdx] || project.heroImage}
                                alt={project.name}
                                fill
                                sizes="(max-width: 980px) 100vw, 480px"
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                        {project.galleryImages.length > 1 && (
                            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.65rem" }}>
                                {project.galleryImages.map((img, i) => (
                                    <button
                                        key={`${img}-${i}`}
                                        type="button"
                                        onClick={() => setActiveGalleryIdx(i)}
                                        style={{
                                            padding: "0.3rem 0.7rem",
                                            borderRadius: "8px",
                                            border: i === activeGalleryIdx ? "1px solid var(--gold-400)" : "1px solid rgba(255,255,255,0.2)",
                                            background: i === activeGalleryIdx ? "var(--gold-500)" : "rgba(255,255,255,0.08)",
                                            color: i === activeGalleryIdx ? "#0a0e1a" : "#ffffff",
                                            fontSize: "0.74rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        Render {i + 1}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Main Grid */}
            <div className={styles.mainLayout}>
                <div className={styles.leftCol}>
                    {/* 1. Unit Mix & Availability Table */}
                    <section className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>📐 Unit Mix &amp; Live Inventory Table</h2>
                        <p className={styles.sectionSub}>
                            Click any unit typology below to preview its exact milestone payment plan and closing costs.
                        </p>

                        <div className={styles.unitTableWrap}>
                            <table className={styles.unitTable}>
                                <thead>
                                    <tr>
                                        <th>Typology</th>
                                        <th>Size</th>
                                        <th>Off-Plan Price</th>
                                        <th>Est. Rent / Mo</th>
                                        <th>Availability</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.unitMix.map((unit) => {
                                        const isSelected = unit.id === selectedUnit.id;
                                        return (
                                            <tr
                                                key={unit.id}
                                                className={isSelected ? styles.unitRowSelected : ""}
                                                onClick={() => setSelectedUnitId(unit.id)}
                                                style={{ cursor: "pointer" }}
                                            >
                                                <td>
                                                    <strong style={{ color: "var(--text-heading)" }}>{unit.label}</strong>
                                                    <div style={{ fontSize: "0.73rem", color: "var(--text-tertiary)" }}>
                                                        {unit.bedrooms} Bed • {unit.bathrooms} Bath
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong>{unit.sizeSqm} m²</strong>
                                                    <div style={{ fontSize: "0.73rem", color: "var(--text-tertiary)" }}>
                                                        ({unit.sizeSqft.toLocaleString()} sq ft)
                                                    </div>
                                                </td>
                                                <td>
                                                    <strong style={{ color: "var(--gold-600, #b8860b)" }}>
                                                        {formatCurrencyFull(unit.priceKES)}
                                                    </strong>
                                                </td>
                                                <td>{formatCurrency(unit.estimatedMonthlyRentKES)}/mo</td>
                                                <td>
                                                    <span
                                                        style={{
                                                            fontSize: "0.74rem",
                                                            fontWeight: 700,
                                                            padding: "2px 8px",
                                                            borderRadius: "999px",
                                                            background:
                                                                unit.availableUnits <= 4
                                                                    ? "rgba(245, 158, 11, 0.15)"
                                                                    : "rgba(16, 185, 129, 0.12)",
                                                            color:
                                                                unit.availableUnits <= 4 ? "#d97706" : "var(--success)",
                                                        }}
                                                    >
                                                        {unit.availableUnits} of {unit.totalUnits} left
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedUnitId(unit.id);
                                                        }}
                                                        style={{
                                                            padding: "0.38rem 0.75rem",
                                                            borderRadius: "7px",
                                                            border: isSelected ? "none" : "1px solid var(--border-color)",
                                                            background: isSelected ? "var(--gold-500, #d4a017)" : "var(--bg-primary)",
                                                            color: isSelected ? "#0a0e1a" : "var(--text-primary)",
                                                            fontSize: "0.75rem",
                                                            fontWeight: 700,
                                                            cursor: "pointer",
                                                        }}
                                                    >
                                                        {isSelected ? "✓ Selected" : "Model Plan"}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* 2. Staged Construction Payment Plan Schedule */}
                    <section className={styles.sectionCard}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
                            <div>
                                <h2 className={styles.sectionTitle} style={{ marginBottom: "0.2rem" }}>
                                    💳 Staged Escrow Payment Plan — {selectedUnit.label}
                                </h2>
                                <p className={styles.sectionSub} style={{ marginBottom: 0 }}>
                                    Milestone-linked tranches payable into <strong>{project.developer.escrowBank}</strong> upon Quantity Surveyor certification.
                                </p>
                            </div>
                            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--gold-600, #b8860b)" }}>
                                Unit Price: {formatCurrencyFull(selectedUnit.priceKES)}
                            </span>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
                            {schedule.map((tranche, index) => (
                                <div
                                    key={tranche.id}
                                    style={{
                                        padding: "0.95rem 1.1rem",
                                        borderRadius: "12px",
                                        background: "var(--bg-secondary)",
                                        border: "1px solid var(--border-light)",
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                                        <div
                                            style={{
                                                width: "36px",
                                                height: "36px",
                                                borderRadius: "10px",
                                                background: index === 0 ? "var(--gold-500, #d4a017)" : "var(--navy-800, #1a2340)",
                                                color: index === 0 ? "#0a0e1a" : "#ffffff",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                fontSize: "0.8rem",
                                                fontWeight: 800,
                                                flexShrink: 0,
                                            }}
                                        >
                                            {tranche.percent}%
                                        </div>
                                        <div>
                                            <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "var(--text-heading)" }}>
                                                {tranche.stageLabel}
                                            </div>
                                            <div style={{ fontSize: "0.76rem", color: "var(--text-secondary)" }}>
                                                ⏱ {tranche.timing} • Trigger: {tranche.milestoneTrigger}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ textAlign: "right" }}>
                                        <div style={{ fontSize: "0.98rem", fontWeight: 800, color: "var(--text-heading)" }}>
                                            {formatCurrencyFull(tranche.amountKES)}
                                        </div>
                                        <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                                            Cumulative: {tranche.cumulativePct}% ({formatCurrency(tranche.cumulativeKES)})
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 3. Dated Construction Progress Photo Timeline */}
                    <section className={styles.sectionCard}>
                        <h2 className={styles.sectionTitle}>🏗️ Dated Construction Progress &amp; Engineer Sign-Offs</h2>
                        <p className={styles.sectionSub}>
                            Transparent site photo logs audited by EBK &amp; BORAQS registered consultants.
                        </p>

                        <div className={styles.timeline}>
                            {project.milestones.map((ms) => {
                                const stateClass =
                                    ms.status === "completed"
                                        ? styles.milestoneCompleted
                                        : ms.status === "in_progress"
                                        ? styles.milestoneInProgress
                                        : styles.milestoneUpcoming;

                                return (
                                    <div key={ms.id} className={`${styles.milestoneCard} ${stateClass}`}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                                            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-heading)" }}>
                                                Phase {ms.phaseNumber}: {ms.title}
                                            </div>
                                            <span
                                                style={{
                                                    fontSize: "0.72rem",
                                                    fontWeight: 700,
                                                    padding: "2px 9px",
                                                    borderRadius: "999px",
                                                    background:
                                                        ms.status === "completed"
                                                            ? "rgba(16,185,129,0.14)"
                                                            : ms.status === "in_progress"
                                                            ? "rgba(212,160,23,0.18)"
                                                            : "var(--bg-card)",
                                                    color:
                                                        ms.status === "completed"
                                                            ? "var(--success)"
                                                            : ms.status === "in_progress"
                                                            ? "var(--gold-600, #b8860b)"
                                                            : "var(--text-tertiary)",
                                                }}
                                            >
                                                {ms.status === "completed"
                                                    ? `✓ Completed ${ms.completedDate || ms.targetDate}`
                                                    : ms.status === "in_progress"
                                                    ? `⚙️ In Progress (${ms.progressPct}%) • Target ${ms.targetDate}`
                                                    : `📅 Target ${ms.targetDate}`}
                                            </span>
                                        </div>

                                        <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", margin: "0.45rem 0" }}>
                                            {ms.summary}
                                        </p>

                                        <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--navy-500, #3d5291)" }}>
                                            📋 {ms.engineerSignOff}
                                        </div>

                                        {ms.photos.length > 0 && (
                                            <div className={styles.photoStrip}>
                                                {ms.photos.map((photo, idx) => (
                                                    <div key={`${ms.id}-p-${idx}`} className={styles.photoThumb}>
                                                        <Image
                                                            src={photo}
                                                            alt={`${ms.title} site photo ${idx + 1}`}
                                                            fill
                                                            sizes="140px"
                                                            style={{ objectFit: "cover" }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* 4. Cash-to-Close Calculator for Selected Unit */}
                    <CashToCloseCalculator propertyPrice={selectedUnit.priceKES} />

                    {/* 5. Diaspora Concierge Hub */}
                    <DiasporaConcierge
                        propertyTitle={`${project.name} — ${selectedUnit.label}`}
                        city={project.city}
                        neighborhood={project.neighborhood}
                        priceKES={selectedUnit.priceKES}
                        onBookLiveWalkthrough={() => setSchedulerMode("virtual")}
                    />
                </div>

                {/* Sticky Right Sidebar */}
                <aside className={styles.stickySidebar}>
                    <div className={styles.sectionCard}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "var(--gold-600, #b8860b)" }}>
                            Selected Off-Plan Unit
                        </div>
                        <h3 style={{ fontSize: "1.08rem", fontWeight: 800, color: "var(--text-heading)", margin: "0.2rem 0" }}>
                            {selectedUnit.label}
                        </h3>
                        <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "var(--gold-600, #b8860b)", marginBottom: "0.85rem" }}>
                            {formatCurrencyFull(selectedUnit.priceKES)}
                        </div>

                        <div style={{ padding: "0.75rem", borderRadius: "10px", background: "var(--bg-secondary)", fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "1rem" }}>
                            <div>• Reservation Lock Fee: <strong>{formatCurrencyFull(project.reservationFeeKES)}</strong></div>
                            <div>• Early-Bird Discount: <strong>Up to {project.earlyBirdDiscountPct}% Cash/Fast-Track</strong></div>
                            <div>• Escrow Bank: <strong>{project.developer.escrowBank.split("—")[0]}</strong></div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                            <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                style={{
                                    width: "100%",
                                    padding: "0.8rem 1rem",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "linear-gradient(135deg, var(--gold-500, #d4a017), var(--gold-600, #b8860b))",
                                    color: "#0a0e1a",
                                    fontWeight: 800,
                                    fontSize: "0.88rem",
                                    cursor: "pointer",
                                }}
                            >
                                🔐 Reserve Unit ({formatCurrency(project.reservationFeeKES)})
                            </button>

                            <button
                                type="button"
                                onClick={() => setSchedulerMode("virtual")}
                                style={{
                                    width: "100%",
                                    padding: "0.72rem 1rem",
                                    borderRadius: "10px",
                                    border: "none",
                                    background: "var(--navy-800, #1a2340)",
                                    color: "#ffffff",
                                    fontWeight: 700,
                                    fontSize: "0.84rem",
                                    cursor: "pointer",
                                }}
                            >
                                🎥 Live Site / Show-House Video Tour
                            </button>

                            <button
                                type="button"
                                onClick={() => setSchedulerMode("in_person")}
                                style={{
                                    width: "100%",
                                    padding: "0.68rem 1rem",
                                    borderRadius: "10px",
                                    border: "1px solid var(--border-color)",
                                    background: "var(--bg-primary)",
                                    color: "var(--text-primary)",
                                    fontWeight: 700,
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                }}
                            >
                                📍 Book In-Person Show-House Visit
                            </button>
                        </div>

                        {/* Developer Track Record */}
                        <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid var(--border-light)" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase" }}>
                                Verified Developer Profile
                            </div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 800, color: "var(--text-heading)", marginTop: "3px" }}>
                                {project.developer.name}
                            </div>
                            <p style={{ fontSize: "0.76rem", color: "var(--text-secondary)", margin: "4px 0 0.5rem" }}>
                                {project.developer.trackRecordSummary}
                            </p>
                            <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--success)" }}>
                                ✓ {project.developer.deliveredProjects} Delivered Developments • {project.developer.yearsActive} Yrs Active
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* M-Pesa Reservation Modal */}
            {showPaymentModal && (
                <PaymentModal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    purpose="reservation"
                    amount={project.reservationFeeKES}
                    currency="KES"
                    propertyId={project.id}
                    propertyTitle={`${project.name} (${selectedUnit.label})`}
                />
            )}

            {/* Viewing & Diaspora Live Site Walkthrough Modal */}
            {schedulerMode && (
                <ViewingSchedulerModal
                    isOpen={!!schedulerMode}
                    defaultMode={schedulerMode}
                    onClose={() => setSchedulerMode(null)}
                    property={{
                        id: project.id,
                        title: `${project.name} — ${selectedUnit.label}`,
                        price: selectedUnit.priceKES,
                        currency: "KES",
                        city: project.city,
                        neighborhood: project.neighborhood,
                        images: [project.heroImage],
                        agentName: project.leadAgent.name,
                        agentPhone: project.leadAgent.phone,
                        openHouseDate: "Show-House Open Daily 9:00 AM – 5:00 PM EAT",
                    }}
                />
            )}
        </div>
    );
}
