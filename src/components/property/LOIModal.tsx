"use client";
import React from "react";
import toast from "react-hot-toast";
import { LOIData, getLOITextDocument } from "@/lib/loiGenerator";
import styles from "./LOIModal.module.css";
import { useDialogA11y } from "@/hooks/useDialogA11y";

interface LOIModalProps {
    loiData: LOIData;
    onClose: () => void;
    onOpenDealRoom?: () => void;
}

export default function LOIModal({ loiData, onClose, onOpenDealRoom }: LOIModalProps) {
    const dialogRef = useDialogA11y(true, onClose);
    const documentText = getLOITextDocument(loiData);

    const handleCopy = () => {
        navigator.clipboard.writeText(documentText);
        toast.success("Letter of Intent copied to clipboard!");
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={dialogRef}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="loi-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleWrap}>
                        <div className={styles.iconBadge}>📜</div>
                        <div>
                            <h3 id="loi-modal-title" className={styles.title}>Official Letter of Intent (LOI)</h3>
                            <div className={styles.subtitle}>REF: {loiData.loiNumber} • KENYA CONVEYANCING</div>
                        </div>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    <div className={styles.documentPaper}>
                        {documentText}
                    </div>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-tertiary)" }}>
                        Status: <strong style={{ color: loiData.status === "accepted" ? "var(--success)" : loiData.status === "countered" ? "var(--gold-500)" : "var(--info)" }}>{loiData.status.toUpperCase()}</strong>
                    </div>
                    <div className={styles.actionBtns}>
                        {onOpenDealRoom && (
                            <button
                                type="button"
                                className={styles.btnSecondary}
                                onClick={onOpenDealRoom}
                                style={{
                                    borderColor: "var(--gold-500, #d4a017)",
                                    color: "var(--gold-600, #b8860b)",
                                    fontWeight: 700,
                                }}
                            >
                                <span>🏛️</span> Open Deal Room
                            </button>
                        )}
                        <button type="button" className={styles.btnSecondary} onClick={handleCopy}>
                            <span>📋</span> Copy Text
                        </button>
                        <button type="button" className={styles.btnPrint} onClick={handlePrint}>
                            <span>🖨️</span> Print / Save PDF
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
