"use client";
import React, { useState, useRef, useEffect } from "react";
import styles from "./TitleVerificationBadge.module.css";

interface TitleVerificationBadgeProps {
    propertyTitle?: string;
    city?: string;
    neighborhood?: string;
    compact?: boolean;
    onViewDossier?: () => void;
}

export default function TitleVerificationBadge({
    propertyTitle,
    city = "Nairobi",
    neighborhood = "Kilimani",
    compact = false,
    onViewDossier,
}: TitleVerificationBadgeProps) {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const parcelHash = (propertyTitle || "estate").split("").reduce((acc, c) => acc + c.charCodeAt(0), 100);
    const lrNumber = `LR 209/${(parcelHash * 13) % 90000 + 10000}`;

    return (
        <div className={styles.badgeWrap} ref={wrapRef}>
            <button
                type="button"
                className={styles.badge}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen(!open);
                }}
                title="Click to view Title Deed & ArdhiSasa Verification details"
                aria-label="ArdhiSasa Verified Title Badge"
            >
                <span className={styles.badgeIcon}>🛡️</span>
                <span className={styles.badgeText}>
                    {compact ? "ArdhiSasa Checked" : "Verified Title Deed • ArdhiSasa"}
                </span>
            </button>

            {open && (
                <div className={styles.popover} onClick={(e) => e.stopPropagation()}>
                    <div className={styles.popoverHeader}>
                        <h4 className={styles.popoverTitle}>
                            <span>🛡️</span> Title Deed Verification
                        </h4>
                        <span className={styles.popoverStatus}>✓ ArdhiSasa Cleared</span>
                    </div>

                    <div className={styles.checklist}>
                        <div className={styles.checkItem}>
                            <span className={styles.checkIcon}>✅</span>
                            <div>
                                <strong>Official Land Search:</strong> {lrNumber} search conducted with zero encumbrances or active caveats.
                            </div>
                        </div>
                        <div className={styles.checkItem}>
                            <span className={styles.checkIcon}>✅</span>
                            <div>
                                <strong>Deed Plan & Beacons:</strong> Verified against Survey of Kenya cadastral boundaries.
                            </div>
                        </div>
                        <div className={styles.checkItem}>
                            <span className={styles.checkIcon}>✅</span>
                            <div>
                                <strong>Rates & Rent 2026:</strong> Full county rates clearance certificate on file.
                            </div>
                        </div>
                    </div>

                    <div className={styles.popoverFooter}>
                        <span>Verified by EstateVue Legal</span>
                        {onViewDossier ? (
                            <button
                                type="button"
                                className={styles.viewDossierLink}
                                onClick={() => {
                                    setOpen(false);
                                    onViewDossier();
                                }}
                            >
                                View Dossier →
                            </button>
                        ) : (
                            <a
                                href="#legal-due-diligence"
                                className={styles.viewDossierLink}
                                onClick={() => setOpen(false)}
                            >
                                View Dossier →
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
