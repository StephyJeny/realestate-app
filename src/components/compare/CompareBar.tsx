"use client";
import Link from "next/link";
import { useCompare } from "@/context/CompareContext";
import styles from "./CompareBar.module.css";

export default function CompareBar() {
    const { compareIds, compareCount, clearCompare, maxCompare } = useCompare();

    if (compareCount === 0) return null;

    return (
        <div className={styles.bar}>
            <div className={styles.content}>
                <div className={styles.info}>
                    <div className={styles.badge}>{compareCount}</div>
                    <span className={styles.text}>
                        {compareCount === 1 ? "1 property" : `${compareCount} properties`} selected
                        <span className={styles.subtext}>(max {maxCompare})</span>
                    </span>
                </div>
                <div className={styles.actions}>
                    <button className={styles.clearBtn} onClick={clearCompare}>
                        Clear
                    </button>
                    <Link
                        href={`/compare?ids=${compareIds.join(",")}`}
                        className={styles.compareBtn}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>
                        Compare Now
                    </Link>
                </div>
            </div>
        </div>
    );
}
