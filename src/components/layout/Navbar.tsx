"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { subscribeToConversations, Conversation } from "@/lib/chat";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { user, userProfile, logout, loading, getDashboardPath } = useAuth();
    const [unreadMessages, setUnreadMessages] = useState(0);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        document.body.style.overflow = isMobileOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMobileOpen]);

    // Real-time unread message count
    useEffect(() => {
        if (!user) { setUnreadMessages(0); return; }
        const unsub = subscribeToConversations(user.uid, (convos: Conversation[]) => {
            const total = convos.reduce(
                (sum, c) => sum + (c.unreadCount?.[user.uid] || 0),
                0
            );
            setUnreadMessages(total);
        });
        return () => unsub();
    }, [user]);

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Logout failed", err);
        }
    };

    return (
        <header className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Estate<span className={styles.logoAccent}>Vue</span></span>
                </Link>

                <nav className={`${styles.nav} ${isMobileOpen ? styles.navOpen : ""}`}>
                    <Link href="/properties?type=sale" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Buy</Link>
                    <Link href="/properties?type=rent" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Rent</Link>
                    <Link href="/properties" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Properties</Link>
                    <Link href="/agents" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Agents</Link>
                    <Link href="/neighborhoods" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Neighborhoods</Link>
                    <Link href="/about" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>About</Link>
                </nav>

                <div className={styles.actions}>
                    {/* Dark Mode Toggle */}
                    <button
                        className={styles.themeBtn}
                        onClick={toggleTheme}
                        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                    >
                        {theme === "light" ? (
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        )}
                    </button>

                    {/* Favorites */}
                    <Link href="/dashboard/buyer?tab=saved" className={styles.favBtn} aria-label="Saved properties">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                        {user && userProfile?.savedProperties && userProfile.savedProperties.length > 0 && (
                            <span className={styles.favBadge}>{userProfile.savedProperties.length}</span>
                        )}
                    </Link>

                    {/* Messages */}
                    {user && (
                        <Link href="/messages" className={styles.favBtn} aria-label="Messages" style={{ position: "relative" }}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                            {unreadMessages > 0 && (
                                <span className={styles.favBadge}>{unreadMessages > 9 ? "9+" : unreadMessages}</span>
                            )}
                        </Link>
                    )}

                    {/* Auth Button */}
                    {!loading && (
                        user ? (
                            <div className={styles.userMenu}>
                                <div className={styles.userAvatar}>
                                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <div className={styles.userDropdown}>
                                    <div className={styles.userInfo}>
                                        <strong>{user.displayName || "User"}</strong>
                                        <span>{user.email}</span>
                                        {userProfile?.role && (
                                            <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--gold-500)", letterSpacing: "0.5px", marginTop: "2px" }}>
                                                {userProfile.role === "admin" ? "⭐ Admin" : userProfile.role === "agent" ? "🏠 Agent" : "👤 Buyer"}
                                            </span>
                                        )}
                                    </div>
                                    <div className={styles.dropdownDivider} />
                                    <Link href={getDashboardPath()} className={styles.dropdownItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
                                        Dashboard
                                    </Link>
                                    <Link href="/profile" className={styles.dropdownItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        Profile
                                    </Link>
                                    <button onClick={handleLogout} className={styles.dropdownItem}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <Link href="/auth/signin" className="btn btn-primary btn-sm">
                                Sign In
                            </Link>
                        )
                    )}
                </div>

                <button
                    className={`${styles.hamburger} ${isMobileOpen ? styles.hamburgerActive : ""}`}
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {isMobileOpen && <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} />}
        </header>
    );
}
