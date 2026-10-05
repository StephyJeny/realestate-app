"use client";
import React from "react";
import toast from "react-hot-toast";
import { LOIData, getLOITextDocument } from "@/lib/loiGenerator";
import styles from "./LOIModal.module.css";

interface LOIModalProps {
    loiData: LOIData;
    onClose: () => void;
}

export default function LOIModal({ loiData, onClose }: LOIModalProps) {
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
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div className={styles.titleWrap}>
                        <div className={styles.iconBadge}>📜</div>
                        <div>
                            <h3 className={styles.title}>Official Letter of Intent (LOI)</h3>
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
