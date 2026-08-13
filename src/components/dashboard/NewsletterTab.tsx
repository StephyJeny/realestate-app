"use client";
import { useEffect, useState, useMemo } from "react";
import {
    getNewsletterSubscribers,
    toggleSubscriberActive,
    deleteSubscriber,
    NewsletterSubscriber,
} from "@/lib/firestore";
import toast from "react-hot-toast";
import styles from "./NewsletterTab.module.css";

const PAGE_SIZE = 15;

export default function NewsletterTab() {
    const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);

    const loadSubscribers = async () => {
        setLoading(true);
        try {
            const data = await getNewsletterSubscribers();
            setSubscribers(data);
        } catch (err) {
            console.error("Failed to load subscribers:", err);
            toast.error("Failed to load subscribers");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSubscribers();
    }, []);

    // Filtered list
    const filtered = useMemo(() => {
        let list = subscribers;
        if (search) {
            const q = search.toLowerCase();
            list = list.filter((s) => s.email.toLowerCase().includes(q));
        }
        if (statusFilter === "active") list = list.filter((s) => s.active);
        if (statusFilter === "inactive") list = list.filter((s) => !s.active);
        return list;
    }, [subscribers, search, statusFilter]);

    // Pagination
    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    // Stats
    const totalActive = subscribers.filter((s) => s.active).length;
    const totalInactive = subscribers.filter((s) => !s.active).length;

    // Handlers
    const handleToggle = async (sub: NewsletterSubscriber) => {
        try {
            await toggleSubscriberActive(sub.id, !sub.active);
            toast.success(sub.active ? "Subscriber deactivated" : "Subscriber reactivated");
            loadSubscribers();
        } catch {
            toast.error("Failed to update subscriber");
        }
    };

    const handleDelete = async (sub: NewsletterSubscriber) => {
        if (!confirm(`Delete subscriber ${sub.email}? This cannot be undone.`)) return;
        try {
            await deleteSubscriber(sub.id);
            toast.success("Subscriber removed");
            setSelected((prev) => { const n = new Set(prev); n.delete(sub.id); return n; });
            loadSubscribers();
        } catch {
            toast.error("Failed to delete subscriber");
        }
    };

    const handleBulkDelete = async () => {
        if (selected.size === 0) return;
        if (!confirm(`Delete ${selected.size} selected subscriber(s)?`)) return;
        try {
            await Promise.all(Array.from(selected).map((id) => deleteSubscriber(id)));
            toast.success(`${selected.size} subscriber(s) deleted`);
            setSelected(new Set());
            loadSubscribers();
        } catch {
            toast.error("Some deletions failed");
        }
    };

    const handleExportCSV = () => {
        const rows = [
            ["Email", "Status", "Subscribed Date"],
            ...filtered.map((s) => [
                s.email,
                s.active ? "Active" : "Inactive",
                s.subscribedAt ? s.subscribedAt.toLocaleDateString("en-KE") : "N/A",
            ]),
        ];
        const csv = rows.map((r) => r.join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("CSV exported!");
    };

    const toggleSelectAll = () => {
        if (selected.size === paged.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(paged.map((s) => s.id)));
        }
    };

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const n = new Set(prev);
            if (n.has(id)) n.delete(id);
            else n.add(id);
            return n;
        });
    };

    if (loading) {
        return (
            <div style={{ textAlign: "center", padding: "3rem" }}>
                <div style={{ width: 32, height: 32, border: "3px solid var(--border-color)", borderTopColor: "var(--gold-500)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
                <p style={{ marginTop: "0.75rem", fontSize: "0.85rem", color: "var(--text-tertiary)" }}>Loading subscribers...</p>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Stats */}
            <div className={styles.statsBar}>
                <div className={styles.miniStat}>
                    <span className={styles.miniStatValue}>{subscribers.length}</span>
                    <span className={styles.miniStatLabel}>Total Subscribers</span>
                </div>
                <div className={styles.miniStat}>
                    <span className={styles.miniStatValue} style={{ color: "var(--success)" }}>{totalActive}</span>
                    <span className={styles.miniStatLabel}>Active</span>
                </div>
                <div className={styles.miniStat}>
                    <span className={styles.miniStatValue} style={{ color: "var(--error)" }}>{totalInactive}</span>
                    <span className={styles.miniStatLabel}>Inactive</span>
                </div>
            </div>

            {/* Toolbar */}
            <div className={styles.toolbar}>
                <input
                    type="text"
                    placeholder="🔍 Search by email..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className={styles.searchInput}
                />
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value as "all" | "active" | "inactive"); setPage(1); }}
                    className={styles.filterSelect}
                >
                    <option value="all">All ({subscribers.length})</option>
                    <option value="active">Active ({totalActive})</option>
                    <option value="inactive">Inactive ({totalInactive})</option>
                </select>
                <button className={`${styles.actionBtn} ${styles.exportBtn}`} onClick={handleExportCSV}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                    Export CSV
                </button>
                {selected.size > 0 && (
                    <button
                        className={styles.actionBtn}
                        style={{ background: "var(--error)", color: "#fff" }}
                        onClick={handleBulkDelete}
                    >
                        🗑️ Delete selected ({selected.size})
                    </button>
                )}
            </div>

            {/* Table */}
            {filtered.length > 0 ? (
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th style={{ width: 36 }}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={selected.size === paged.length && paged.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Subscribed</th>
                                <th style={{ textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paged.map((sub) => (
                                <tr key={sub.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className={styles.checkbox}
                                            checked={selected.has(sub.id)}
                                            onChange={() => toggleSelect(sub.id)}
                                        />
                                    </td>
                                    <td className={styles.emailCell}>{sub.email}</td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${sub.active ? styles.statusActive : styles.statusInactive}`}>
                                            {sub.active ? "● Active" : "○ Inactive"}
                                        </span>
                                    </td>
                                    <td>
                                        {sub.subscribedAt
                                            ? sub.subscribedAt.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" })
                                            : "—"}
                                    </td>
                                    <td>
                                        <div className={styles.rowActions} style={{ justifyContent: "flex-end" }}>
                                            <button
                                                className={styles.rowBtn}
                                                onClick={() => handleToggle(sub)}
                                                title={sub.active ? "Deactivate" : "Reactivate"}
                                            >
                                                {sub.active ? "Deactivate" : "Reactivate"}
                                            </button>
                                            <button
                                                className={`${styles.rowBtn} ${styles.rowBtnDanger}`}
                                                onClick={() => handleDelete(sub)}
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <span>
                                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                            </span>
                            <div className={styles.paginationBtns}>
                                <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(page - 1)}>← Prev</button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
                                    <button key={p} className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ""}`} onClick={() => setPage(p)}>
                                        {p}
                                    </button>
                                ))}
                                <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next →</button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.tableWrap}>
                    <div className={styles.empty}>
                        <div className={styles.emptyIcon}>📧</div>
                        <div className={styles.emptyTitle}>No subscribers found</div>
                        <div className={styles.emptyText}>
                            {search ? "No subscribers match your search." : "Newsletter subscribers will appear here once users sign up."}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
