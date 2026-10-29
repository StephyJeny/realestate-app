"use client";
import React, { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { Inquiry } from "@/lib/firestore";
import { uploadDealRoomDocument } from "@/lib/storage";
import {
    DealRoomData,
    ConveyancingStageId,
    StageStatus,
    DealDocCategory,
    AdvocateDetails,
    getOrInitDealRoom,
    saveDealRoom,
    calculateDealProgressPct,
} from "@/lib/dealRoom";
import styles from "./DealRoomModal.module.css";

interface DealRoomModalProps {
    inquiry: Inquiry | null;
    onClose: () => void;
}

const DOC_CATEGORY_LABELS: Record<DealDocCategory, string> = {
    loi: "📜 Signed Letter of Intent (LOI)",
    reservation_receipt: "🔐 Earnest / M-Pesa Reservation Receipt",
    sale_agreement: "⚖️ LSK Agreement for Sale",
    ardhisasa_search: "🏛️ Official ArdhiSasa Search & Clearances",
    consent_clearance: "✅ LCB / Ministry Consent & CGT",
    stamp_duty: "🧾 Valuation & Stamp Duty iTax Receipt",
    snagging_handover: "🔑 Snagging Audit & Handover Certificate",
};

export default function DealRoomModal({ inquiry, onClose }: DealRoomModalProps) {
    const isOpen = !!inquiry;
    const dialogRef = useDialogA11y(isOpen, onClose);
    const { user, userProfile } = useAuth();
    const { formatCurrencyFull } = useCurrency();

    const [dealRoom, setDealRoom] = useState<DealRoomData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<"tracker" | "documents" | "advocates" | "activity">("tracker");

    // Upload state
    const [docCategory, setDocCategory] = useState<DealDocCategory>("sale_agreement");
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadPct, setUploadPct] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Note input per stage
    const [editingNoteStage, setEditingNoteStage] = useState<ConveyancingStageId | null>(null);
    const [stageNoteDraft, setStageNoteDraft] = useState<string>("");

    // Activity comment
    const [commentText, setCommentText] = useState<string>("");

    // Advocate forms
    const [buyerAdvForm, setBuyerAdvForm] = useState<AdvocateDetails>({
        firmName: "",
        advocateName: "",
        lskNumber: "",
        email: "",
        phone: "",
    });
    const [vendorAdvForm, setVendorAdvForm] = useState<AdvocateDetails>({
        firmName: "",
        advocateName: "",
        lskNumber: "",
        email: "",
        phone: "",
    });

    useEffect(() => {
        if (!inquiry) return;
        let cancelled = false;
        setLoading(true);
        getOrInitDealRoom(inquiry)
            .then((room) => {
                if (cancelled) return;
                setDealRoom(room);
                if (room.buyerAdvocate) setBuyerAdvForm(room.buyerAdvocate);
                if (room.vendorAdvocate) setVendorAdvForm(room.vendorAdvocate);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [inquiry]);

    if (!inquiry) return null;

    const actorName = userProfile?.displayName || user?.displayName || user?.email || "Participant";
    const actorRole: "buyer" | "agent" = userProfile?.role === "agent" || user?.uid === inquiry.agentId ? "agent" : "buyer";

    const handleUpdateStageStatus = async (stageId: ConveyancingStageId, nextStatus: StageStatus, customNote?: string) => {
        if (!dealRoom) return;
        const nowISO = new Date().toISOString();
        const targetStage = dealRoom.stages.find((s) => s.id === stageId);

        const nextStages = dealRoom.stages.map((s) => {
            if (s.id !== stageId) return s;
            return {
                ...s,
                status: nextStatus,
                completedAt: nextStatus === "completed" ? nowISO : undefined,
                completedBy: nextStatus === "completed" ? actorName : undefined,
                referenceNote: customNote !== undefined ? customNote : s.referenceNote,
            };
        });

        const updated = await saveDealRoom({
            ...dealRoom,
            stages: nextStages,
            activities: [
                {
                    id: `act-${Date.now()}`,
                    actorName,
                    actorRole,
                    message: `Updated "${targetStage?.title || stageId}" to ${nextStatus.replace("_", " ").toUpperCase()}${customNote ? ` — Ref: ${customNote}` : ""}`,
                    timestamp: nowISO,
                },
                ...dealRoom.activities,
            ],
        });

        setDealRoom(updated);
        setEditingNoteStage(null);
        setStageNoteDraft("");
        toast.success(`Milestone updated to ${nextStatus.replace("_", " ")}`);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !dealRoom) return;

        if (file.size > 20 * 1024 * 1024) {
            toast.error("Maximum conveyancing document size is 20MB.");
            return;
        }

        setUploading(true);
        setUploadPct(10);

        let fileUrl = "";
        try {
            if (user?.uid) {
                fileUrl = await uploadDealRoomDocument(file, dealRoom.id, user.uid, (pct) => setUploadPct(pct));
            } else {
                fileUrl = URL.createObjectURL(file);
            }
        } catch {
            // Graceful local blob URL fallback when Firebase Storage rules/plan aren't active in dev
            fileUrl = URL.createObjectURL(file);
        }

        const nowISO = new Date().toISOString();
        const sizeKB = Math.max(1, Math.round(file.size / 1024));
        const newDoc = {
            id: `doc-${Date.now()}`,
            name: file.name,
            category: docCategory,
            url: fileUrl,
            uploadedByRole: actorRole,
            uploadedByName: actorName,
            uploadedAt: nowISO,
            fileSizeLabel: sizeKB >= 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`,
        };

        const updated = await saveDealRoom({
            ...dealRoom,
            documents: [newDoc, ...dealRoom.documents],
            activities: [
                {
                    id: `act-doc-${Date.now()}`,
                    actorName,
                    actorRole,
                    message: `Uploaded ${DOC_CATEGORY_LABELS[docCategory]}: "${file.name}"`,
                    timestamp: nowISO,
                },
                ...dealRoom.activities,
            ],
        });

        setDealRoom(updated);
        setUploading(false);
        setUploadPct(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
        toast.success("Conveyancing document added to Deal Room vault!");
    };

    const handleSaveAdvocates = async (side: "buyer" | "vendor") => {
        if (!dealRoom) return;
        const nowISO = new Date().toISOString();
        const form = side === "buyer" ? buyerAdvForm : vendorAdvForm;
        if (!form.firmName.trim() && !form.advocateName.trim()) {
            toast.error("Please enter the Law Firm or Advocate name.");
            return;
        }

        const updated = await saveDealRoom({
            ...dealRoom,
            buyerAdvocate: side === "buyer" ? buyerAdvForm : dealRoom.buyerAdvocate,
            vendorAdvocate: side === "vendor" ? vendorAdvForm : dealRoom.vendorAdvocate,
            activities: [
                {
                    id: `act-adv-${Date.now()}`,
                    actorName,
                    actorRole,
                    message: `Registered ${side === "buyer" ? "Purchaser's" : "Vendor's"} Conveyancing Advocate: ${form.firmName || form.advocateName}`,
                    timestamp: nowISO,
                },
                ...dealRoom.activities,
            ],
        });

        setDealRoom(updated);
        toast.success(`${side === "buyer" ? "Buyer" : "Vendor"} Advocate details saved!`);
    };

    const handlePostComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dealRoom || !commentText.trim()) return;
        const nowISO = new Date().toISOString();
        const updated = await saveDealRoom({
            ...dealRoom,
            activities: [
                {
                    id: `act-msg-${Date.now()}`,
                    actorName,
                    actorRole,
                    message: commentText.trim(),
                    timestamp: nowISO,
                },
                ...dealRoom.activities,
            ],
        });
        setDealRoom(updated);
        setCommentText("");
        toast.success("Conveyancing note logged");
    };

    const progressPct = dealRoom ? calculateDealProgressPct(dealRoom.stages) : 0;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={dialogRef}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="deal-room-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.headerMeta}>
                        <div className={styles.badgeRow}>
                            <span className={styles.loiBadge}>
                                🏛️ DEAL ROOM • {dealRoom?.loiNumber || inquiry.offerDetails?.loiNumber || "CONVEYANCING"}
                            </span>
                            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#34d399" }}>
                                {dealRoom ? formatCurrencyFull(dealRoom.agreedOrOfferedPriceKES) : ""}
                            </span>
                        </div>
                        <h3 id="deal-room-title" className={styles.title}>
                            {inquiry.propertyTitle}
                        </h3>
                        <div className={styles.subtitle}>
                            Buyer: <strong>{inquiry.senderName}</strong> • Financing:{" "}
                            <strong style={{ textTransform: "uppercase" }}>
                                {inquiry.offerDetails?.financingType || "Cash"}
                            </strong>{" "}
                            • Stakeholder Conveyancing Workspace
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close Deal Room">
                        ✕
                    </button>
                </div>

                {/* Progress Bar */}
                <div className={styles.progressStrip}>
                    <div className={styles.progressTop}>
                        <span>Kenyan Conveyancing Completion Progress</span>
                        <span style={{ color: "var(--success, #10b981)" }}>{progressPct}% Complete</span>
                    </div>
                    <div className={styles.progressBarTrack}>
                        <div className={styles.progressBarFill} style={{ width: `${progressPct}%` }} />
                    </div>
                </div>

                {/* Tabs */}
                <div className={styles.tabsBar}>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === "tracker" ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab("tracker")}
                    >
                        📋 6-Stage Tracker
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === "documents" ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab("documents")}
                    >
                        📂 Document Vault ({dealRoom?.documents.length || 0})
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === "advocates" ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab("advocates")}
                    >
                        ⚖️ Legal Counsel (LSK)
                    </button>
                    <button
                        type="button"
                        className={`${styles.tabBtn} ${activeTab === "activity" ? styles.tabBtnActive : ""}`}
                        onClick={() => setActiveTab("activity")}
                    >
                        🕒 Audit Trail ({dealRoom?.activities.length || 0})
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {loading || !dealRoom ? (
                        <div style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-secondary)" }}>
                            Loading encrypted Deal Room workspace...
                        </div>
                    ) : activeTab === "tracker" ? (
                        dealRoom.stages.map((stage) => {
                            const isDone = stage.status === "completed";
                            const isInProg = stage.status === "in_progress";
                            return (
                                <div
                                    key={stage.id}
                                    className={`${styles.stageCard} ${
                                        isDone ? styles.stageCardCompleted : isInProg ? styles.stageCardActive : ""
                                    }`}
                                >
                                    <div
                                        className={styles.stepCircle}
                                        style={{
                                            background: isDone
                                                ? "var(--success, #10b981)"
                                                : isInProg
                                                ? "var(--gold-500, #d4a017)"
                                                : "var(--gray-200, #e2e6ee)",
                                            color: isDone || isInProg ? "#ffffff" : "var(--text-secondary)",
                                        }}
                                    >
                                        {isDone ? "✓" : stage.stepNumber}
                                    </div>

                                    <div className={styles.stageContent}>
                                        <div className={styles.stageHeader}>
                                            <span className={styles.stageTitle}>{stage.title}</span>
                                            <span
                                                style={{
                                                    fontSize: "0.7rem",
                                                    fontWeight: 700,
                                                    padding: "2px 8px",
                                                    borderRadius: "999px",
                                                    background: "var(--bg-card)",
                                                    border: "1px solid var(--border-color)",
                                                    color: "var(--text-secondary)",
                                                }}
                                            >
                                                Lead: {stage.responsibleParty} • {stage.typicalSLA}
                                            </span>
                                        </div>
                                        <p className={styles.stageSub}>{stage.subtitle}</p>

                                        {stage.referenceNote && (
                                            <div
                                                style={{
                                                    fontSize: "0.75rem",
                                                    padding: "0.35rem 0.65rem",
                                                    borderRadius: "6px",
                                                    background: "var(--bg-card)",
                                                    border: "1px solid var(--border-color)",
                                                    marginBottom: "0.5rem",
                                                    fontFamily: "monospace",
                                                }}
                                            >
                                                📌 {stage.referenceNote}
                                            </div>
                                        )}

                                        <div className={styles.stageActions}>
                                            {stage.status !== "in_progress" && (
                                                <button
                                                    type="button"
                                                    className={styles.smallBtn}
                                                    onClick={() => handleUpdateStageStatus(stage.id, "in_progress")}
                                                >
                                                    ⏳ Mark In Progress
                                                </button>
                                            )}
                                            {stage.status !== "completed" ? (
                                                <button
                                                    type="button"
                                                    className={`${styles.smallBtn} ${styles.smallBtnPrimary}`}
                                                    onClick={() => handleUpdateStageStatus(stage.id, "completed")}
                                                >
                                                    ✓ Sign Off Stage
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className={styles.smallBtn}
                                                    onClick={() => handleUpdateStageStatus(stage.id, "in_progress")}
                                                >
                                                    ↺ Reopen
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className={styles.smallBtn}
                                                onClick={() => {
                                                    setEditingNoteStage(editingNoteStage === stage.id ? null : stage.id);
                                                    setStageNoteDraft(stage.referenceNote || "");
                                                }}
                                            >
                                                📝 {stage.referenceNote ? "Edit Ref / Receipt #" : "Add Ref / Receipt #"}
                                            </button>
                                        </div>

                                        {editingNoteStage === stage.id && (
                                            <div style={{ display: "flex", gap: "0.45rem", marginTop: "0.55rem" }}>
                                                <input
                                                    type="text"
                                                    className={styles.input}
                                                    placeholder="e.g. M-Pesa QKJ8192L / ArdhiSasa Search #AS-99812"
                                                    value={stageNoteDraft}
                                                    onChange={(e) => setStageNoteDraft(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    className={`${styles.smallBtn} ${styles.smallBtnPrimary}`}
                                                    onClick={() =>
                                                        handleUpdateStageStatus(stage.id, stage.status, stageNoteDraft.trim())
                                                    }
                                                >
                                                    Save
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : activeTab === "documents" ? (
                        <>
                            {/* Upload Box */}
                            <div className={styles.cardBox}>
                                <strong style={{ fontSize: "0.9rem", color: "var(--text-heading)" }}>
                                    Upload Conveyancing Instrument or Receipt (PDF / Image, max 20MB)
                                </strong>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.65rem", alignItems: "center" }}>
                                    <select
                                        value={docCategory}
                                        onChange={(e) => setDocCategory(e.target.value as DealDocCategory)}
                                        className={styles.input}
                                    >
                                        {(Object.keys(DOC_CATEGORY_LABELS) as DealDocCategory[]).map((cat) => (
                                            <option key={cat} value={cat}>
                                                {DOC_CATEGORY_LABELS[cat]}
                                            </option>
                                        ))}
                                    </select>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf,image/*"
                                        onChange={handleFileUpload}
                                        disabled={uploading}
                                        className={styles.input}
                                    />
                                </div>
                                {uploading && (
                                    <div style={{ fontSize: "0.78rem", color: "var(--gold-600)", fontWeight: 700 }}>
                                        Uploading to Deal Room Storage... {uploadPct}%
                                    </div>
                                )}
                            </div>

                            {/* Documents List */}
                            {dealRoom.documents.length === 0 ? (
                                <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-tertiary)", fontSize: "0.86rem" }}>
                                    No conveyancing files uploaded yet. Upload executed Sale Agreements, ArdhiSasa searches, or Stamp Duty receipts above.
                                </div>
                            ) : (
                                dealRoom.documents.map((d) => (
                                    <div
                                        key={d.id}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            padding: "0.85rem 1rem",
                                            borderRadius: "10px",
                                            background: "var(--bg-secondary)",
                                            border: "1px solid var(--border-color)",
                                        }}
                                    >
                                        <div>
                                            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--text-heading)" }}>
                                                {d.name}
                                            </div>
                                            <div style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                                                {DOC_CATEGORY_LABELS[d.category]} • Uploaded by {d.uploadedByName} ({d.fileSizeLabel})
                                            </div>
                                        </div>
                                        <a
                                            href={d.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.smallBtn}
                                            style={{ textDecoration: "none" }}
                                        >
                                            View / Download ↗
                                        </a>
                                    </div>
                                ))
                            )}
                        </>
                    ) : activeTab === "advocates" ? (
                        <div className={styles.gridTwo}>
                            {/* Buyer Advocate */}
                            <div className={styles.cardBox}>
                                <strong style={{ fontSize: "0.9rem", color: "var(--text-heading)" }}>
                                    ⚖️ Purchaser&apos;s Advocate (Buyer Side)
                                </strong>
                                <input
                                    className={styles.input}
                                    placeholder="Law Firm Name (e.g. Oraro & Co Advocates)"
                                    value={buyerAdvForm.firmName}
                                    onChange={(e) => setBuyerAdvForm({ ...buyerAdvForm, firmName: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="Lead Conveyancing Advocate"
                                    value={buyerAdvForm.advocateName}
                                    onChange={(e) => setBuyerAdvForm({ ...buyerAdvForm, advocateName: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="LSK Practising Number (e.g. LSK/2026/04192)"
                                    value={buyerAdvForm.lskNumber}
                                    onChange={(e) => setBuyerAdvForm({ ...buyerAdvForm, lskNumber: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="Advocate Email"
                                    value={buyerAdvForm.email}
                                    onChange={(e) => setBuyerAdvForm({ ...buyerAdvForm, email: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="Advocate Phone"
                                    value={buyerAdvForm.phone}
                                    onChange={(e) => setBuyerAdvForm({ ...buyerAdvForm, phone: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className={`${styles.smallBtn} ${styles.smallBtnPrimary}`}
                                    onClick={() => handleSaveAdvocates("buyer")}
                                >
                                    Save Purchaser&apos;s Advocate
                                </button>
                            </div>

                            {/* Vendor Advocate */}
                            <div className={styles.cardBox}>
                                <strong style={{ fontSize: "0.9rem", color: "var(--text-heading)" }}>
                                    🏛️ Vendor&apos;s Advocate (Seller / Escrow Stakeholder)
                                </strong>
                                <input
                                    className={styles.input}
                                    placeholder="Law Firm Name (e.g. Anjarwalla & Khanna)"
                                    value={vendorAdvForm.firmName}
                                    onChange={(e) => setVendorAdvForm({ ...vendorAdvForm, firmName: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="Lead Conveyancing Partner"
                                    value={vendorAdvForm.advocateName}
                                    onChange={(e) => setVendorAdvForm({ ...vendorAdvForm, advocateName: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="LSK Practising Number"
                                    value={vendorAdvForm.lskNumber}
                                    onChange={(e) => setVendorAdvForm({ ...vendorAdvForm, lskNumber: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="Escrow / Conveyancing Email"
                                    value={vendorAdvForm.email}
                                    onChange={(e) => setVendorAdvForm({ ...vendorAdvForm, email: e.target.value })}
                                />
                                <input
                                    className={styles.input}
                                    placeholder="Office Phone"
                                    value={vendorAdvForm.phone}
                                    onChange={(e) => setVendorAdvForm({ ...vendorAdvForm, phone: e.target.value })}
                                />
                                <button
                                    type="button"
                                    className={`${styles.smallBtn} ${styles.smallBtnPrimary}`}
                                    onClick={() => handleSaveAdvocates("vendor")}
                                >
                                    Save Vendor&apos;s Advocate
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Activity & Notes Log */
                        <>
                            <form onSubmit={handlePostComment} style={{ display: "flex", gap: "0.5rem" }}>
                                <input
                                    className={styles.input}
                                    placeholder="Post a conveyancing update for buyer, agent & advocates..."
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                />
                                <button type="submit" className={`${styles.smallBtn} ${styles.smallBtnPrimary}`}>
                                    Post Update
                                </button>
                            </form>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                                {dealRoom.activities.map((act) => (
                                    <div
                                        key={act.id}
                                        style={{
                                            padding: "0.75rem 0.95rem",
                                            borderRadius: "10px",
                                            background: "var(--bg-secondary)",
                                            border: "1px solid var(--border-color)",
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-tertiary)" }}>
                                            <strong style={{ color: "var(--text-heading)" }}>
                                                {act.actorName} ({act.actorRole.toUpperCase()})
                                            </strong>
                                            <span>{new Date(act.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontSize: "0.82rem", color: "var(--text-primary)", marginTop: "3px" }}>
                                            {act.message}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
