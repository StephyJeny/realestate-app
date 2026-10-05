"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Inquiry } from "@/lib/firestore";
import styles from "./LeadKanbanBoard.module.css";

export type PipelineStage = "new" | "contacted" | "viewing_scheduled" | "offer_made" | "closed";

interface StageConfig {
    id: PipelineStage;
    label: string;
    icon: string;
    color: string;
    bgColor: string;
}

const STAGES: StageConfig[] = [
    { id: "new", label: "New Lead", icon: "🆕", color: "#3b82f6", bgColor: "rgba(59, 130, 246, 0.08)" },
    { id: "contacted", label: "Contacted", icon: "📞", color: "#f59e0b", bgColor: "rgba(245, 158, 11, 0.08)" },
    { id: "viewing_scheduled", label: "Viewing Scheduled", icon: "📅", color: "#8b5cf6", bgColor: "rgba(139, 92, 246, 0.08)" },
    { id: "offer_made", label: "Offer Made", icon: "💼", color: "#10b981", bgColor: "rgba(16, 185, 129, 0.08)" },
    { id: "closed", label: "Closed / Won", icon: "🎉", color: "#059669", bgColor: "rgba(5, 150, 105, 0.08)" },
];

export function getInquiryStage(inq: Inquiry): PipelineStage {
    if (inq.stage) return inq.stage;
    if (inq.status === "closed" || inq.status === "sold" || inq.status === "rented") return "closed";
    if (inq.type === "offer" || !!inq.offerDetails) return "offer_made";
    if (inq.status === "viewing_scheduled" || (inq.type === "viewing" && inq.status !== "new")) return "viewing_scheduled";
    if (inq.status === "replied" || inq.status === "contacted") return "contacted";
    return "new";
}

interface LeadKanbanBoardProps {
    inquiries: Inquiry[];
    onStageChange: (inquiryId: string, newStage: PipelineStage) => Promise<void>;
    onReplyClick: (inquiry: Inquiry) => void;
    onViewOfferClick?: (inquiry: Inquiry) => void;
}

export default function LeadKanbanBoard({
    inquiries,
    onStageChange,
    onReplyClick,
    onViewOfferClick,
}: LeadKanbanBoardProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [dragOverStage, setDragOverStage] = useState<PipelineStage | null>(null);

    // Filter inquiries by search query
    const filteredInquiries = inquiries.filter((inq) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            inq.senderName?.toLowerCase().includes(q) ||
            inq.senderEmail?.toLowerCase().includes(q) ||
            inq.senderPhone?.toLowerCase().includes(q) ||
            inq.propertyTitle?.toLowerCase().includes(q)
        );
    });

    // Group by stage
    const grouped = STAGES.reduce<Record<PipelineStage, Inquiry[]>>((acc, stage) => {
        acc[stage.id] = filteredInquiries.filter((inq) => getInquiryStage(inq) === stage.id);
        return acc;
    }, {} as Record<PipelineStage, Inquiry[]>);

    // Metrics calculations
    const totalLeads = inquiries.length;
    const activeViewings = inquiries.filter((i) => getInquiryStage(i) === "viewing_scheduled").length;
    const activeOffers = inquiries.filter((i) => getInquiryStage(i) === "offer_made");
    const totalPipelineValue = activeOffers.reduce(
        (sum, o) => sum + (o.offerDetails?.offeredPrice || 0),
        0
    );
    const closedWon = inquiries.filter((i) => getInquiryStage(i) === "closed").length;
    const conversionRate = totalLeads > 0 ? Math.round((closedWon / totalLeads) * 100) : 0;

    // Drag handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("text/plain", id);
        e.dataTransfer.effectAllowed = "move";
        setDraggingId(id);
    };

    const handleDragEnd = () => {
        setDraggingId(null);
        setDragOverStage(null);
    };

    const handleDragOver = (e: React.DragEvent, stageId: PipelineStage) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragOverStage !== stageId) {
            setDragOverStage(stageId);
        }
    };

    const handleDrop = async (e: React.DragEvent, stageId: PipelineStage) => {
        e.preventDefault();
        setDragOverStage(null);
        const inquiryId = e.dataTransfer.getData("text/plain") || draggingId;
        setDraggingId(null);

        if (!inquiryId) return;

        const targetInq = inquiries.find((i) => i.id === inquiryId);
        if (targetInq && getInquiryStage(targetInq) !== stageId) {
            await onStageChange(inquiryId, stageId);
        }
    };

    const formatWhatsAppUrl = (phone: string, name: string, property: string) => {
        const cleanPhone = phone.replace(/\D/g, "");
        const formatted = cleanPhone.startsWith("0") ? "254" + cleanPhone.slice(1) : cleanPhone;
        const text = `Hi ${name}, this is regarding your inquiry on "${property}". When would be a good time to connect?`;
        return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
    };

    return (
        <div className={styles.container}>
            {/* Top Metrics Row */}
            <div className={styles.pipelineMetrics}>
                <div className={styles.metricCard}>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Total Leads</span>
                        <span className={styles.metricValue}>{totalLeads}</span>
                    </div>
                    <div className={styles.metricIcon} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                        👥
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Tours Scheduled</span>
                        <span className={styles.metricValue}>{activeViewings}</span>
                    </div>
                    <div className={styles.metricIcon} style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6" }}>
                        📅
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Offers Pipeline</span>
                        <span className={styles.metricValue}>
                            {totalPipelineValue > 0 ? `KES ${(totalPipelineValue / 1000000).toFixed(1)}M` : "KES 0"}
                        </span>
                    </div>
                    <div className={styles.metricIcon} style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
                        💼
                    </div>
                </div>

                <div className={styles.metricCard}>
                    <div className={styles.metricInfo}>
                        <span className={styles.metricLabel}>Closed Rate</span>
                        <span className={styles.metricValue}>{conversionRate}%</span>
                    </div>
                    <div className={styles.metricIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                        🏆
                    </div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className={styles.controlsBar}>
                <div className={styles.searchWrap}>
                    <span className={styles.searchIcon}>🔍</span>
                    <input
                        type="text"
                        className={styles.searchInput}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search lead by name, phone, email, or property..."
                    />
                </div>
            </div>

            {/* Kanban Columns */}
            <div className={styles.board}>
                {STAGES.map((stage) => {
                    const stageCards = grouped[stage.id] || [];
                    const isOver = dragOverStage === stage.id;

                    return (
                        <div
                            key={stage.id}
                            className={`${styles.column} ${isOver ? styles.columnDragOver : ""}`}
                            onDragOver={(e) => handleDragOver(e, stage.id)}
                            onDrop={(e) => handleDrop(e, stage.id)}
                        >
                            {/* Column Header */}
                            <div className={styles.columnHeader}>
                                <div className={styles.columnTitleWrap}>
                                    <span className={styles.columnIcon}>{stage.icon}</span>
                                    <h4 className={styles.columnTitle}>{stage.label}</h4>
                                </div>
                                <span className={styles.columnBadge}>{stageCards.length}</span>
                            </div>

                            {/* Column Cards */}
                            <div className={styles.cardList}>
                                {stageCards.length > 0 ? (
                                    stageCards.map((inq) => {
                                        const isDragging = draggingId === inq.id;
                                        const typeClass =
                                            inq.type === "offer"
                                                ? styles.typeOffer
                                                : inq.type === "viewing"
                                                ? styles.typeViewing
                                                : styles.typeInquiry;

                                        return (
                                            <div
                                                key={inq.id as string}
                                                className={`${styles.card} ${isDragging ? styles.cardDragging : ""}`}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, inq.id!)}
                                                onDragEnd={handleDragEnd}
                                            >
                                                {/* Card Header */}
                                                <div className={styles.cardHeader}>
                                                    <span className={`${styles.cardTypeBadge} ${typeClass}`}>
                                                        {inq.type === "offer" ? "💼 Offer" : inq.type === "viewing" ? "📅 Viewing" : "💬 Inquiry"}
                                                    </span>
                                                    <span className={styles.cardDate}>
                                                        {inq.createdAt
                                                            ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString([], {
                                                                  month: "short",
                                                                  day: "numeric",
                                                              })
                                                            : "Recently"}
                                                    </span>
                                                </div>

                                                {/* Buyer Profile */}
                                                <div className={styles.buyerInfo}>
                                                    <div className={styles.buyerAvatar}>
                                                        {inq.senderName?.charAt(0).toUpperCase() || "U"}
                                                    </div>
                                                    <div style={{ minWidth: 0, flex: 1 }}>
                                                        <div className={styles.buyerName}>{inq.senderName || "Prospective Buyer"}</div>
                                                        <div style={{ fontSize: "0.7rem", color: "var(--text-tertiary)" }}>
                                                            {inq.senderEmail}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Property Title */}
                                                <Link
                                                    href={`/properties/${inq.propertyId}`}
                                                    className={styles.propertyTitle}
                                                    title={inq.propertyTitle}
                                                >
                                                    🏠 {inq.propertyTitle}
                                                </Link>

                                                {/* Offer details if present */}
                                                {inq.offerDetails?.offeredPrice && (
                                                    <div className={styles.offerPriceTag}>
                                                        <span>KES {inq.offerDetails.offeredPrice.toLocaleString()}</span>
                                                        <span style={{ fontSize: "0.68rem", textTransform: "capitalize" }}>
                                                            {inq.offerDetails.financingType}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Message snippet */}
                                                {inq.message && (
                                                    <div className={styles.messageSnippet} title={inq.message}>
                                                        {inq.message}
                                                    </div>
                                                )}

                                                {/* Card Footer with Quick Contact & Stage Selector */}
                                                <div className={styles.cardFooter}>
                                                    <div className={styles.cardActions}>
                                                        {inq.senderPhone && (
                                                            <a
                                                                href={formatWhatsAppUrl(
                                                                    inq.senderPhone,
                                                                    inq.senderName,
                                                                    inq.propertyTitle
                                                                )}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className={`${styles.actionIconBtn} ${styles.whatsappBtn}`}
                                                                title="WhatsApp Lead"
                                                            >
                                                                💬
                                                            </a>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => onReplyClick(inq)}
                                                            className={styles.actionIconBtn}
                                                            title="Reply to Inquiry"
                                                        >
                                                            ✉️
                                                        </button>
                                                        {inq.offerDetails && onViewOfferClick && (
                                                            <button
                                                                type="button"
                                                                onClick={() => onViewOfferClick(inq)}
                                                                className={styles.actionIconBtn}
                                                                title="View Letter of Intent"
                                                            >
                                                                📜
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Move to stage selector for touch / quick switch */}
                                                    <select
                                                        className={styles.stageSelector}
                                                        value={stage.id}
                                                        onChange={(e) => onStageChange(inq.id!, e.target.value as PipelineStage)}
                                                    >
                                                        {STAGES.map((s) => (
                                                            <option key={s.id} value={s.id}>
                                                                ➔ {s.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className={styles.emptyColumn}>
                                        <span style={{ fontSize: "1.5rem", opacity: 0.5 }}>{stage.icon}</span>
                                        <span>No leads in {stage.label.toLowerCase()}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
