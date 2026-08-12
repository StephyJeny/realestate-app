"use client";
import { useEffect, useRef, useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import { UserProfile, FirestoreProperty, Inquiry } from "@/lib/firestore";
import styles from "./AnalyticsTab.module.css";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface AnalyticsTabProps {
    users: UserProfile[];
    properties: FirestoreProperty[];
    inquiries: Inquiry[];
    stats: {
        totalUsers: number;
        totalBuyers: number;
        totalAgents: number;
        pendingAgents: number;
        approvedAgents: number;
        totalProperties: number;
        totalInquiries: number;
    };
}

// helpers
function getMonthLabel(d: Date) {
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function getLast6Months(): string[] {
    const result: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        result.push(getMonthLabel(d));
    }
    return result;
}

function countByMonth(
    items: { createdAt?: { seconds: number } }[],
    months: string[]
): number[] {
    const counts: Record<string, number> = {};
    months.forEach((m) => (counts[m] = 0));
    items.forEach((item) => {
        if (item.createdAt?.seconds) {
            const label = getMonthLabel(new Date(item.createdAt.seconds * 1000));
            if (counts[label] !== undefined) counts[label]++;
        }
    });
    return months.map((m) => counts[m]);
}

const chartColors = {
    navy: "rgba(10, 14, 26, 0.85)",
    navyLight: "rgba(10, 14, 26, 0.15)",
    gold: "rgba(212, 160, 23, 0.9)",
    goldLight: "rgba(212, 160, 23, 0.12)",
    blue: "rgba(59, 130, 246, 0.85)",
    blueLight: "rgba(59, 130, 246, 0.12)",
    green: "rgba(16, 185, 129, 0.85)",
    greenLight: "rgba(16, 185, 129, 0.12)",
    purple: "rgba(139, 92, 246, 0.85)",
    purpleLight: "rgba(139, 92, 246, 0.12)",
    red: "rgba(239, 68, 68, 0.85)",
    redLight: "rgba(239, 68, 68, 0.12)",
    orange: "rgba(245, 158, 11, 0.85)",
    teal: "rgba(20, 184, 166, 0.85)",
    pink: "rgba(236, 72, 153, 0.85)",
};

export default function AnalyticsTab({ users, properties, inquiries, stats }: AnalyticsTabProps) {
    const months = useMemo(() => getLast6Months(), []);

    // ============================
    // COMPUTED ANALYTICS
    // ============================

    // User registrations over time
    const usersByMonth = useMemo(() => countByMonth(users, months), [users, months]);

    // Inquiries over time
    const inquiriesByMonth = useMemo(() => countByMonth(inquiries, months), [inquiries, months]);

    // Properties by type
    const propertyTypes = useMemo(() => {
        const counts: Record<string, number> = {};
        properties.forEach((p) => {
            const t = (p.type || "other").toLowerCase();
            counts[t] = (counts[t] || 0) + 1;
        });
        return counts;
    }, [properties]);

    // Properties by city
    const propertiesByCity = useMemo(() => {
        const counts: Record<string, number> = {};
        properties.forEach((p) => {
            const city = p.city || "Unknown";
            counts[city] = (counts[city] || 0) + 1;
        });
        // Sort by count, take top 6
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
    }, [properties]);

    // Inquiry types breakdown
    const inquiryTypes = useMemo(() => {
        const counts: Record<string, number> = { inquiry: 0, viewing: 0, offer: 0 };
        inquiries.forEach((i) => {
            const type = (i.type || "inquiry") as string;
            counts[type] = (counts[type] || 0) + 1;
        });
        return counts;
    }, [inquiries]);

    // Average property price
    const avgPrice = useMemo(() => {
        if (properties.length === 0) return 0;
        const total = properties.reduce((s, p) => s + (p.price || 0), 0);
        return Math.round(total / properties.length);
    }, [properties]);

    // Properties by price range
    const priceRanges = useMemo(() => {
        const ranges = [
            { label: "< 5M", min: 0, max: 5000000, count: 0 },
            { label: "5M–15M", min: 5000000, max: 15000000, count: 0 },
            { label: "15M–30M", min: 15000000, max: 30000000, count: 0 },
            { label: "30M–60M", min: 30000000, max: 60000000, count: 0 },
            { label: "60M–100M", min: 60000000, max: 100000000, count: 0 },
            { label: "> 100M", min: 100000000, max: Infinity, count: 0 },
        ];
        properties.forEach((p) => {
            const r = ranges.find((r) => p.price >= r.min && p.price < r.max);
            if (r) r.count++;
        });
        return ranges;
    }, [properties]);

    // Recent activity feed (last 10 combined events)
    const recentActivity = useMemo(() => {
        const events: { type: string; label: string; time: number; icon: string }[] = [];
        users.forEach((u) => {
            if (u.createdAt?.seconds) {
                events.push({
                    type: "user",
                    label: `${u.displayName} joined as ${u.role}`,
                    time: u.createdAt.seconds,
                    icon: u.role === "agent" ? "🏠" : "👤",
                });
            }
        });
        inquiries.forEach((i) => {
            if (i.createdAt?.seconds) {
                events.push({
                    type: "inquiry",
                    label: `${i.senderName || "User"} sent an ${i.type || "inquiry"}`,
                    time: i.createdAt.seconds,
                    icon: "💬",
                });
            }
        });
        return events.sort((a, b) => b.time - a.time).slice(0, 8);
    }, [users, inquiries]);

    // Conversion rate (inquiries / properties)
    const conversionRate = properties.length > 0
        ? ((inquiries.length / properties.length) * 100).toFixed(1)
        : "0.0";

    // ============================
    // CHART CONFIGS
    // ============================
    const baseOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
    };

    const userGrowthData = {
        labels: months,
        datasets: [
            {
                label: "New Users",
                data: usersByMonth,
                fill: true,
                borderColor: chartColors.blue,
                backgroundColor: chartColors.blueLight,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: chartColors.blue,
            },
        ],
    };

    const inquiryTrendData = {
        labels: months,
        datasets: [
            {
                label: "Inquiries",
                data: inquiriesByMonth,
                fill: true,
                borderColor: chartColors.gold,
                backgroundColor: chartColors.goldLight,
                tension: 0.4,
                pointRadius: 4,
                pointBackgroundColor: chartColors.gold,
            },
        ],
    };

    const propertyTypeLabels = Object.keys(propertyTypes).map(
        (t) => t.charAt(0).toUpperCase() + t.slice(1)
    );
    const propertyTypeData = {
        labels: propertyTypeLabels,
        datasets: [
            {
                data: Object.values(propertyTypes),
                backgroundColor: [
                    chartColors.navy,
                    chartColors.gold,
                    chartColors.blue,
                    chartColors.green,
                    chartColors.purple,
                    chartColors.orange,
                    chartColors.teal,
                    chartColors.pink,
                ],
                borderWidth: 2,
                borderColor: "#ffffff",
            },
        ],
    };

    const cityBarData = {
        labels: propertiesByCity.map(([city]) => city),
        datasets: [
            {
                label: "Properties",
                data: propertiesByCity.map(([, count]) => count),
                backgroundColor: [
                    chartColors.navy,
                    chartColors.gold,
                    chartColors.blue,
                    chartColors.green,
                    chartColors.purple,
                    chartColors.orange,
                ],
                borderRadius: 6,
                barPercentage: 0.6,
            },
        ],
    };

    const priceRangeData = {
        labels: priceRanges.map((r) => r.label),
        datasets: [
            {
                label: "Properties",
                data: priceRanges.map((r) => r.count),
                backgroundColor: chartColors.goldLight,
                borderColor: chartColors.gold,
                borderWidth: 2,
                borderRadius: 6,
                barPercentage: 0.6,
            },
        ],
    };

    const inquiryTypeData = {
        labels: ["General Inquiry", "Viewing Request", "Offer"],
        datasets: [
            {
                data: [inquiryTypes.inquiry, inquiryTypes.viewing, inquiryTypes.offer],
                backgroundColor: [chartColors.blue, chartColors.green, chartColors.gold],
                borderWidth: 2,
                borderColor: "#ffffff",
            },
        ],
    };

    return (
        <div className={styles.analyticsWrap}>
            {/* KPI Row */}
            <div className={styles.kpiGrid}>
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.kpiIconBlue}`}>📊</div>
                    <div className={styles.kpiContent}>
                        <div className={styles.kpiValue}>{stats.totalProperties}</div>
                        <div className={styles.kpiLabel}>Total Listings</div>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.kpiIconGold}`}>💰</div>
                    <div className={styles.kpiContent}>
                        <div className={styles.kpiValue}>
                            KES {avgPrice > 1000000 ? `${(avgPrice / 1000000).toFixed(1)}M` : avgPrice.toLocaleString()}
                        </div>
                        <div className={styles.kpiLabel}>Avg. Property Price</div>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.kpiIconGreen}`}>📈</div>
                    <div className={styles.kpiContent}>
                        <div className={styles.kpiValue}>{conversionRate}%</div>
                        <div className={styles.kpiLabel}>Inquiry Rate</div>
                    </div>
                </div>
                <div className={styles.kpiCard}>
                    <div className={`${styles.kpiIcon} ${styles.kpiIconPurple}`}>🏢</div>
                    <div className={styles.kpiContent}>
                        <div className={styles.kpiValue}>{stats.approvedAgents}</div>
                        <div className={styles.kpiLabel}>Active Agents</div>
                    </div>
                </div>
            </div>

            {/* Charts Row 1 — Trends */}
            <div className={styles.chartRow}>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>👥 User Growth</h3>
                        <span className={styles.chartSubtitle}>Last 6 months</span>
                    </div>
                    <div className={styles.chartBody}>
                        <Line data={userGrowthData} options={baseOptions} />
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>💬 Inquiry Trends</h3>
                        <span className={styles.chartSubtitle}>Last 6 months</span>
                    </div>
                    <div className={styles.chartBody}>
                        <Line data={inquiryTrendData} options={baseOptions} />
                    </div>
                </div>
            </div>

            {/* Charts Row 2 — Distribution */}
            <div className={styles.chartRow}>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>🏠 Property Types</h3>
                    </div>
                    <div className={styles.chartBodySmall}>
                        <Doughnut
                            data={propertyTypeData}
                            options={{
                                ...baseOptions,
                                cutout: "65%",
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: "bottom" as const,
                                        labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>📍 Properties by City</h3>
                    </div>
                    <div className={styles.chartBody}>
                        <Bar data={cityBarData} options={baseOptions} />
                    </div>
                </div>
            </div>

            {/* Charts Row 3 — Price & Inquiries */}
            <div className={styles.chartRow}>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>💎 Price Distribution (KES)</h3>
                    </div>
                    <div className={styles.chartBody}>
                        <Bar data={priceRangeData} options={baseOptions} />
                    </div>
                </div>
                <div className={styles.chartCard}>
                    <div className={styles.chartHeader}>
                        <h3 className={styles.chartTitle}>📋 Inquiry Types</h3>
                    </div>
                    <div className={styles.chartBodySmall}>
                        <Doughnut
                            data={inquiryTypeData}
                            options={{
                                ...baseOptions,
                                cutout: "65%",
                                plugins: {
                                    legend: {
                                        display: true,
                                        position: "bottom" as const,
                                        labels: { padding: 16, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className={styles.activityCard}>
                <div className={styles.chartHeader}>
                    <h3 className={styles.chartTitle}>⚡ Recent Activity</h3>
                </div>
                <div className={styles.activityList}>
                    {recentActivity.length > 0 ? (
                        recentActivity.map((event, i) => (
                            <div key={i} className={styles.activityItem}>
                                <span className={styles.activityIcon}>{event.icon}</span>
                                <div className={styles.activityContent}>
                                    <span className={styles.activityLabel}>{event.label}</span>
                                    <span className={styles.activityTime}>
                                        {new Date(event.time * 1000).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            hour: "numeric",
                                            minute: "2-digit",
                                        })}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-tertiary)", fontSize: "0.88rem" }}>
                            No recent activity to show.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
