"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    getAllUsers,
    getPendingAgents,
    approveAgent,
    rejectAgent,
    deleteUser,
    getAllProperties,
    deleteProperty,
    getAllInquiries,
    getAdminStats,
    getUserProfile,
    UserProfile,
    FirestoreProperty,
    Inquiry,
} from "@/lib/firestore";
import { sendApprovalEmail, sendRejectionEmail } from "@/lib/email";
import toast from "react-hot-toast";
import styles from "../dashboard.module.css";

export default function AdminDashboard() {
    const router = useRouter();
    const { user, userProfile, loading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState("overview");
    const [stats, setStats] = useState({
        totalUsers: 0, totalBuyers: 0, totalAgents: 0,
        pendingAgents: 0, approvedAgents: 0, totalProperties: 0, totalInquiries: 0,
    });
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [pendingAgentsList, setPendingAgentsList] = useState<UserProfile[]>([]);
    const [properties, setProperties] = useState<FirestoreProperty[]>([]);
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userFilter, setUserFilter] = useState("all");
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/auth/signin");
        }
        if (!loading && userProfile && userProfile.role !== "admin") {
            router.push("/dashboard/buyer");
        }
    }, [user, userProfile, loading, router]);

    useEffect(() => {
        if (user && userProfile?.role === "admin") {
            loadData();
        }
    }, [user, userProfile]);

    const loadData = async () => {
        try {
            const [statsData, allUsers, pending, allProperties, allInquiries] = await Promise.all([
                getAdminStats(),
                getAllUsers(),
                getPendingAgents(),
                getAllProperties(),
                getAllInquiries(),
            ]);
            setStats(statsData);
            setUsers(allUsers);
            setPendingAgentsList(pending);
            setProperties(allProperties);
            setInquiries(allInquiries);
        } catch (err) {
            console.error("Failed to load admin data:", err);
        }
    };

    const handleApprove = async (agentUid: string, agentName: string) => {
        setIsProcessing(agentUid);
        try {
            const code = await approveAgent(agentUid);

            // Send email notification
            const agentProfile = await getUserProfile(agentUid);
            if (agentProfile?.email) {
                const emailSent = await sendApprovalEmail({
                    agentName: agentProfile.displayName,
                    agentEmail: agentProfile.email,
                    agentCode: code,
                });
                if (emailSent) {
                    toast.success(`${agentName} approved! Code: ${code} — Email sent ✉️`);
                } else {
                    toast.success(`${agentName} approved! Code: ${code} — (Email not configured)`);
                }
            } else {
                toast.success(`${agentName} approved! Code: ${code}`);
            }
            loadData();
        } catch (err) {
            console.error("Approval failed:", err);
            toast.error("Failed to approve agent");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleReject = async (agentUid: string, agentName: string) => {
        const reason = prompt(`Reason for rejecting ${agentName}? (optional)`);
        setIsProcessing(agentUid);
        try {
            await rejectAgent(agentUid, reason || undefined);

            // Send email notification
            const agentProfile = await getUserProfile(agentUid);
            if (agentProfile?.email) {
                const emailSent = await sendRejectionEmail({
                    agentName: agentProfile.displayName,
                    agentEmail: agentProfile.email,
                    reason: reason || undefined,
                });
                if (emailSent) {
                    toast.success(`${agentName} rejected — Email sent ✉️`);
                } else {
                    toast.success(`${agentName} rejected — (Email not configured)`);
                }
            } else {
                toast.success(`${agentName} rejected`);
            }
            loadData();
        } catch (err) {
            console.error("Rejection failed:", err);
            toast.error("Failed to reject agent");
        } finally {
            setIsProcessing(null);
        }
    };

    const handleDeleteUser = async (uid: string, name: string) => {
        if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
        try {
            await deleteUser(uid);
            toast.success(`User "${name}" deleted`);
            loadData();
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete user");
        }
    };

    const handleDeleteProperty = async (propId: string, agentId: string) => {
        if (!confirm("Delete this property?")) return;
        try {
            await deleteProperty(propId, agentId);
            toast.success("Property deleted");
            loadData();
        } catch (err) {
            console.error("Delete failed:", err);
            toast.error("Failed to delete property");
        }
    };

    if (loading) {
        return (
            <div className={styles.dashboardPage}>
                <div className={styles.loadingWrap}>
                    <div className={styles.loadingSpinner} />
                </div>
            </div>
        );
    }

    if (!user || userProfile?.role !== "admin") return null;

    const filteredUsers = userFilter === "all" ? users
        : userFilter === "buyers" ? users.filter(u => u.role === "buyer")
            : userFilter === "agents" ? users.filter(u => u.role === "agent")
                : userFilter === "pending" ? users.filter(u => u.role === "agent" && u.agentStatus === "pending")
                    : users;

    return (
        <div className={styles.dashboardPage}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
                <div className={styles.sidebarHeader}>
                    <span className={`${styles.sidebarRole} ${styles.roleAdmin}`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                        Admin
                    </span>
                    <span className={styles.sidebarUserName}>{userProfile?.displayName || "Admin"}</span>
                    <span className={styles.sidebarEmail}>{user.email}</span>
                </div>

                <nav className={styles.sidebarNav}>
                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarSectionTitle}>Dashboard</div>
                        <button className={`${styles.sidebarLink} ${activeTab === "overview" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("overview"); setSidebarOpen(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                            Overview
                        </button>
                        <button className={`${styles.sidebarLink} ${activeTab === "approvals" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("approvals"); setSidebarOpen(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                            Agent Approvals
                            {pendingAgentsList.length > 0 && <span className={styles.sidebarBadge}>{pendingAgentsList.length}</span>}
                        </button>
                    </div>

                    <div className={styles.sidebarSection}>
                        <div className={styles.sidebarSectionTitle}>Management</div>
                        <button className={`${styles.sidebarLink} ${activeTab === "users" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("users"); setSidebarOpen(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            All Users
                            <span className={styles.sidebarBadge}>{users.length}</span>
                        </button>
                        <button className={`${styles.sidebarLink} ${activeTab === "properties" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("properties"); setSidebarOpen(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                            All Properties
                            <span className={styles.sidebarBadge}>{properties.length}</span>
                        </button>
                        <button className={`${styles.sidebarLink} ${activeTab === "inquiries" ? styles.sidebarLinkActive : ""}`}
                            onClick={() => { setActiveTab("inquiries"); setSidebarOpen(false); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            All Inquiries
                            <span className={styles.sidebarBadge}>{inquiries.length}</span>
                        </button>
                    </div>
                </nav>

                <div className={styles.sidebarFooter}>
                    <button className={styles.logoutBtn} onClick={logout}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.pageHeader}>
                    <h1 className={styles.pageTitle}>Admin Control Panel ⚡</h1>
                    <p className={styles.pageSubtitle}>
                        Full platform oversight — manage users, approve agents, monitor properties and inquiries.
                    </p>
                </div>

                {activeTab === "overview" && (
                    <>
                        <div className={styles.statsGrid}>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconBlue}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{stats.totalUsers}</div>
                                <div className={styles.statLabel}>Total Users</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{stats.totalBuyers}</div>
                                <div className={styles.statLabel}>Buyers</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconGold}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
                                    </div>
                                    <span className={`${styles.statTrend} ${styles.statTrendUp}`}>+{stats.pendingAgents} pending</span>
                                </div>
                                <div className={styles.statValue}>{stats.totalAgents}</div>
                                <div className={styles.statLabel}>Total Agents</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{stats.totalProperties}</div>
                                <div className={styles.statLabel}>Properties</div>
                            </div>
                            <div className={styles.statCard}>
                                <div className={styles.statCardHeader}>
                                    <div className={`${styles.statIcon} ${styles.statIconRed}`}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                                    </div>
                                </div>
                                <div className={styles.statValue}>{stats.totalInquiries}</div>
                                <div className={styles.statLabel}>Inquiries</div>
                            </div>
                        </div>

                        {/* Pending Agents Quick View */}
                        {pendingAgentsList.length > 0 && (
                            <div className={styles.contentCard}>
                                <div className={styles.contentCardHeader}>
                                    <h3 className={styles.contentCardTitle}>🔔 Pending Agent Approvals</h3>
                                    <button className={styles.contentCardAction} onClick={() => setActiveTab("approvals")}>
                                        View All
                                    </button>
                                </div>
                                <table className={styles.table}>
                                    <thead>
                                        <tr>
                                            <th>Agent</th>
                                            <th>License</th>
                                            <th>Specialization</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingAgentsList.slice(0, 3).map((agent) => (
                                            <tr key={agent.uid}>
                                                <td>
                                                    <div className={styles.tableUserCell}>
                                                        <div className={styles.tableAvatar}>{agent.displayName.charAt(0)}</div>
                                                        <div className={styles.tableUserInfo}>
                                                            <span className={styles.tableUserName}>{agent.displayName}</span>
                                                            <span className={styles.tableUserEmail}>{agent.email}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{agent.license || "N/A"}</td>
                                                <td>{agent.specialization || "N/A"}</td>
                                                <td>
                                                    <div className={styles.actionBtns}>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                            onClick={() => handleApprove(agent.uid, agent.displayName)}
                                                            disabled={isProcessing === agent.uid}
                                                            title="Approve"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                                        </button>
                                                        <button
                                                            className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                            onClick={() => handleReject(agent.uid, agent.displayName)}
                                                            disabled={isProcessing === agent.uid}
                                                            title="Reject"
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {activeTab === "approvals" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <h3 className={styles.contentCardTitle}>Agent Approval Queue</h3>
                        </div>
                        {pendingAgentsList.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Agent</th>
                                        <th>Agency</th>
                                        <th>License</th>
                                        <th>Specialization</th>
                                        <th>Experience</th>
                                        <th>Location</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingAgentsList.map((agent) => (
                                        <tr key={agent.uid}>
                                            <td>
                                                <div className={styles.tableUserCell}>
                                                    <div className={styles.tableAvatar}>{agent.displayName.charAt(0)}</div>
                                                    <div className={styles.tableUserInfo}>
                                                        <span className={styles.tableUserName}>{agent.displayName}</span>
                                                        <span className={styles.tableUserEmail}>{agent.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{agent.agency || "—"}</td>
                                            <td>{agent.license || "—"}</td>
                                            <td style={{ textTransform: "capitalize" }}>{agent.specialization || "—"}</td>
                                            <td>{agent.experience || "—"}</td>
                                            <td>{agent.location || "—"}</td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                        onClick={() => handleApprove(agent.uid, agent.displayName)}
                                                        disabled={isProcessing === agent.uid}
                                                        title="Approve agent"
                                                    >
                                                        {isProcessing === agent.uid ? "..." : (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                                        )}
                                                    </button>
                                                    <button
                                                        className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                                        onClick={() => handleReject(agent.uid, agent.displayName)}
                                                        disabled={isProcessing === agent.uid}
                                                        title="Reject agent"
                                                    >
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>✅</div>
                                <h3 className={styles.emptyTitle}>All Caught Up!</h3>
                                <p className={styles.emptyText}>
                                    No pending agent applications at the moment. New applications will appear here.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "users" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <h3 className={styles.contentCardTitle}>All Users ({filteredUsers.length})</h3>
                        </div>
                        <div style={{ padding: "1rem 1.5rem 0" }}>
                            <div className={styles.tabs}>
                                {["all", "buyers", "agents", "pending"].map((f) => (
                                    <button key={f} className={`${styles.tab} ${userFilter === f ? styles.tabActive : ""}`}
                                        onClick={() => setUserFilter(f)} style={{ textTransform: "capitalize" }}>
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {filteredUsers.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((u) => (
                                        <tr key={u.uid}>
                                            <td>
                                                <div className={styles.tableUserCell}>
                                                    <div className={styles.tableAvatar}>{u.displayName?.charAt(0) || "U"}</div>
                                                    <div className={styles.tableUserInfo}>
                                                        <span className={styles.tableUserName}>{u.displayName}</span>
                                                        <span className={styles.tableUserEmail}>{u.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${u.role === "admin" ? styles.statusApproved : u.role === "agent" ? styles.statusActive : styles.statusPending}`}
                                                    style={u.role === "buyer" ? { background: "rgba(59,130,246,0.1)", color: "var(--info)" } : {}}>
                                                    {u.role}
                                                </span>
                                            </td>
                                            <td>
                                                {u.role === "agent" ? (
                                                    <span className={`${styles.statusBadge} ${u.agentStatus === "approved" ? styles.statusApproved : u.agentStatus === "rejected" ? styles.statusRejected : styles.statusPending}`}>
                                                        {u.agentCodeVerified ? "Verified" : u.agentStatus || "N/A"}
                                                    </span>
                                                ) : (
                                                    <span className={`${styles.statusBadge} ${styles.statusApproved}`}>Active</span>
                                                )}
                                            </td>
                                            <td>{u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    {u.role === "agent" && u.agentStatus === "pending" && (
                                                        <button className={`${styles.actionBtn} ${styles.approveBtn}`}
                                                            onClick={() => handleApprove(u.uid, u.displayName)} title="Approve">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                                                        </button>
                                                    )}
                                                    {u.role !== "admin" && (
                                                        <button className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                            onClick={() => handleDeleteUser(u.uid, u.displayName)} title="Delete user">
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>👤</div>
                                <h3 className={styles.emptyTitle}>No Users Found</h3>
                                <p className={styles.emptyText}>No users match the current filter.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "properties" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <h3 className={styles.contentCardTitle}>All Properties ({properties.length})</h3>
                        </div>
                        {properties.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Type</th>
                                        <th>Price</th>
                                        <th>Agent</th>
                                        <th>Location</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {properties.map((prop) => (
                                        <tr key={prop.id}>
                                            <td>
                                                <span style={{ fontWeight: 600 }}>{prop.title}</span>
                                            </td>
                                            <td style={{ textTransform: "capitalize" }}>{prop.type}</td>
                                            <td style={{ fontWeight: 600, color: "var(--gold-600)" }}>
                                                KES {prop.price.toLocaleString()}
                                            </td>
                                            <td>{prop.agentName}</td>
                                            <td>{prop.city}</td>
                                            <td>
                                                <span className={`${styles.statusBadge} ${prop.status === "active" ? styles.statusApproved : styles.statusPending}`}>
                                                    {prop.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.actionBtns}>
                                                    <button className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                                        onClick={() => handleDeleteProperty(prop.id!, prop.agentId)} title="Delete property">
                                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>🏠</div>
                                <h3 className={styles.emptyTitle}>No Properties Yet</h3>
                                <p className={styles.emptyText}>Properties listed by agents will appear here.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "inquiries" && (
                    <div className={styles.contentCard}>
                        <div className={styles.contentCardHeader}>
                            <h3 className={styles.contentCardTitle}>All Inquiries ({inquiries.length})</h3>
                        </div>
                        {inquiries.length > 0 ? (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>From</th>
                                        <th>Property</th>
                                        <th>Agent</th>
                                        <th>Type</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inquiries.map((inq) => (
                                        <tr key={inq.id as string}>
                                            <td>
                                                <div className={styles.tableUserCell}>
                                                    <div className={styles.tableAvatar}>{inq.senderName?.charAt(0) || "U"}</div>
                                                    <div className={styles.tableUserInfo}>
                                                        <span className={styles.tableUserName}>{inq.senderName || "User"}</span>
                                                        <span className={styles.tableUserEmail}>{inq.senderEmail || ""}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{inq.propertyTitle || "—"}</td>
                                            <td>{inq.agentId?.substring(0, 8) || "—"}</td>
                                            <td><span className={`${styles.statusBadge} ${styles.statusActive}`}>{inq.type || "inquiry"}</span></td>
                                            <td>{inq.createdAt ? new Date(inq.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={styles.emptyState}>
                                <div className={styles.emptyIcon}>💬</div>
                                <h3 className={styles.emptyTitle}>No Inquiries Yet</h3>
                                <p className={styles.emptyText}>Inquiries from buyers will appear here.</p>
                            </div>
                        )}
                    </div>
                )}
            </main>

            <button className={styles.sidebarToggle} onClick={() => setSidebarOpen(!sidebarOpen)}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
        </div>
    );
}
