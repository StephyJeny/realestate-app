"use client";
import styles from "./PropertySkeleton.module.css";

interface PropertySkeletonProps {
    count?: number;
}

export default function PropertySkeleton({ count = 6 }: PropertySkeletonProps) {
    return (
        <div className={styles.grid}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={styles.card} style={{ animationDelay: `${i * 100}ms` }}>
                    <div className={styles.image}>
                        <div className={styles.shimmer} />
                    </div>
                    <div className={styles.content}>
                        <div className={`${styles.line} ${styles.lineTitle}`}>
                            <div className={styles.shimmer} />
                        </div>
                        <div className={`${styles.line} ${styles.lineSubtitle}`}>
                            <div className={styles.shimmer} />
                        </div>
                        <div className={styles.features}>
                            <div className={`${styles.line} ${styles.lineFeat}`}>
                                <div className={styles.shimmer} />
                            </div>
                            <div className={`${styles.line} ${styles.lineFeat}`}>
                                <div className={styles.shimmer} />
                            </div>
                            <div className={`${styles.line} ${styles.lineFeat}`}>
                                <div className={styles.shimmer} />
                            </div>
                        </div>
                        <div className={styles.footer}>
                            <div className={`${styles.line} ${styles.lineTag}`}>
                                <div className={styles.shimmer} />
                            </div>
                            <div className={`${styles.line} ${styles.lineBtn}`}>
                                <div className={styles.shimmer} />
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
