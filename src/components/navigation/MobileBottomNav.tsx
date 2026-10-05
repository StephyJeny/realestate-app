"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { 
    Compass, 
    Heart, 
    MapIcon, 
    MessageSquare, 
    User, 
    SlidersHorizontal,
    Sparkles,
    Calculator,
    Users,
    TrendingUp,
    Building2,
    ExternalLink
} from "@/components/icons/Icons";
import styles from "./MobileBottomNav.module.css";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";

function MobileBottomNavInner() {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { user, userProfile, getDashboardPath } = useAuth();
    const { currency, setCurrency } = useCurrency();
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    // On property detail page, hide bottom dock so MobileContactBar has full visibility
    if (pathname && pathname.startsWith("/properties/") && pathname !== "/properties") {
        return null;
    }

    const isMapActive = (pathname === "/properties" && searchParams.get("view") === "map") || pathname === "/neighborhoods";
    const isExploreActive = (pathname === "/properties" && searchParams.get("view") !== "map") || pathname === "/";
    const isSavedActive = (pathname === "/dashboard/buyer" && searchParams.get("tab") === "saved") || pathname === "/saved";
    const isMessagesActive = pathname === "/messages";
    const isProfileActive = pathname === "/profile" || (pathname.startsWith("/dashboard") && searchParams.get("tab") !== "saved");

    const savedCount = userProfile?.savedProperties?.length || 0;
    const profileHref = user ? (getDashboardPath ? getDashboardPath() : "/profile") : "/auth/signin";

    return (
        <div className={styles.dockContainer}>
            {/* Main App-Like Bottom Dock */}
            <nav className={styles.dock} aria-label="Mobile Navigation Dock">
                {/* 1. Explore */}
                <Link
                    href="/properties"
                    className={`${styles.dockItem} ${isExploreActive ? styles.dockItemActive : ""}`}
                >
                    <div className={styles.iconWrap}>
                        <Compass size={22} />
                    </div>
                    <span className={styles.dockLabel}>Explore</span>
                    {isExploreActive && <div className={styles.activeIndicator} />}
                </Link>

                {/* 2. Map */}
                <Link
                    href="/properties?view=map"
                    className={`${styles.dockItem} ${isMapActive ? styles.dockItemActive : ""}`}
                >
                    <div className={styles.iconWrap}>
                        <MapIcon size={22} />
                    </div>
                    <span className={styles.dockLabel}>Map</span>
                    {isMapActive && <div className={styles.activeIndicator} />}
                </Link>

                {/* Center Quick Sheet Drawer Toggle */}
                <button
                    type="button"
                    className={styles.toolsButton}
                    onClick={() => setIsSheetOpen(true)}
                    aria-label="Open Quick Tools and Drawers"
                >
                    <div className={styles.toolsPill}>
                        <SlidersHorizontal size={17} />
                    </div>
                    <span className={styles.dockLabel} style={{ marginTop: 2 }}>Tools</span>
                </button>

                {/* 3. Saved */}
                <Link
                    href={user ? "/dashboard/buyer?tab=saved" : "/auth/signin"}
                    className={`${styles.dockItem} ${isSavedActive ? styles.dockItemActive : ""}`}
                >
                    <div className={styles.iconWrap}>
                        <Heart size={22} />
                        {savedCount > 0 && <span className={styles.badge}>{savedCount}</span>}
                    </div>
                    <span className={styles.dockLabel}>Saved</span>
                    {isSavedActive && <div className={styles.activeIndicator} />}
                </Link>

                {/* 4. Messages */}
                <Link
                    href={user ? "/messages" : "/auth/signin"}
                    className={`${styles.dockItem} ${isMessagesActive ? styles.dockItemActive : ""}`}
                >
                    <div className={styles.iconWrap}>
                        <MessageSquare size={22} />
                    </div>
                    <span className={styles.dockLabel}>Inbox</span>
                    {isMessagesActive && <div className={styles.activeIndicator} />}
                </Link>

                {/* 5. Profile */}
                <Link
                    href={profileHref}
                    className={`${styles.dockItem} ${isProfileActive ? styles.dockItemActive : ""}`}
                >
                    <div className={styles.iconWrap}>
                        <User size={22} />
                    </div>
                    <span className={styles.dockLabel}>{user ? "Profile" : "Sign In"}</span>
                    {isProfileActive && <div className={styles.activeIndicator} />}
                </Link>
            </nav>

            {/* Quick Actions / Filters Slide-Up Sheet Drawer */}
            {isSheetOpen && (
                <>
                    <div 
                        className={styles.sheetBackdrop} 
                        onClick={() => setIsSheetOpen(false)}
                        aria-hidden="true"
                    />
                    <div className={styles.sheetDrawer} role="dialog" aria-modal="true" aria-label="Quick Actions Sheet">
                        {/* Drag Handle */}
                        <div className={styles.sheetHandleWrap} onClick={() => setIsSheetOpen(false)}>
                            <div className={styles.sheetHandle} />
                        </div>

                        {/* Sheet Header */}
                        <div className={styles.sheetHeader}>
                            <h3 className={styles.sheetTitle}>
                                <Sparkles size={18} color="var(--gold-600, #d97706)" />
                                EstateVision Quick Hub
                            </h3>
                            <button
                                className={styles.sheetCloseBtn}
                                onClick={() => setIsSheetOpen(false)}
                                aria-label="Close Sheet Drawer"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Sheet Body */}
                        <div className={styles.sheetBody}>
                            {/* Fast Action Tools Grid */}
                            <div className={styles.toolsGrid}>
                                <Link
                                    href="/estimate"
                                    className={styles.toolCard}
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    <div className={styles.toolCardIcon}>
                                        <TrendingUp size={20} color="var(--gold-600, #b8860b)" />
                                    </div>
                                    <h4 className={styles.toolCardTitle}>EstateEstimate</h4>
                                    <p className={styles.toolCardSub}>Instant AI property valuation & rental yield</p>
                                </Link>

                                <Link
                                    href={user ? "/dashboard/buyer?tab=collections" : "/auth/signin"}
                                    className={styles.toolCard}
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    <div className={styles.toolCardIcon}>
                                        <Users size={20} color="#2563eb" />
                                    </div>
                                    <h4 className={styles.toolCardTitle}>Shared Boards</h4>
                                    <p className={styles.toolCardSub}>Collaborative co-buying & chama wishlist</p>
                                </Link>

                                <Link
                                    href="/mortgage-calculator"
                                    className={styles.toolCard}
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    <div className={styles.toolCardIcon}>
                                        <Calculator size={20} color="#16a34a" />
                                    </div>
                                    <h4 className={styles.toolCardTitle}>Mortgage Calc</h4>
                                    <p className={styles.toolCardSub}>Monthly repayment & loan eligibility</p>
                                </Link>

                                <Link
                                    href="/compare"
                                    className={styles.toolCard}
                                    onClick={() => setIsSheetOpen(false)}
                                >
                                    <div className={styles.toolCardIcon}>
                                        <Building2 size={20} color="#7c3aed" />
                                    </div>
                                    <h4 className={styles.toolCardTitle}>Compare Homes</h4>
                                    <p className={styles.toolCardSub}>Side-by-side specs, price/sqft & scores</p>
                                </Link>
                            </div>

                            {/* Currency Preference Pill Bar */}
                            <div className={styles.currencyBar}>
                                <span className={styles.currencyLabel}>Currency Display</span>
                                <div className={styles.currencyPills}>
                                    {(["KES", "USD", "EUR", "GBP"] as const).map((code) => (
                                        <button
                                            key={code}
                                            type="button"
                                            className={`${styles.currencyPill} ${currency === code ? styles.currencyPillActive : ""}`}
                                            onClick={() => setCurrency(code)}
                                        >
                                            {code}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* WhatsApp Direct Support Banner */}
                            <a
                                href="https://wa.me/254700000000?text=Hi%20EstateVision%20Concierge%2C%20I%20need%20help%20finding%20a%20property%20in%20Kenya"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.supportBanner}
                                onClick={() => setIsSheetOpen(false)}
                            >
                                <div>
                                    <div className={styles.supportTitle}>💬 WhatsApp Concierge</div>
                                    <div className={styles.supportSub}>Connect instantly with a verified Nairobi agent</div>
                                </div>
                                <ExternalLink size={16} />
                            </a>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default function MobileBottomNav() {
    return (
        <Suspense fallback={null}>
            <MobileBottomNavInner />
        </Suspense>
    );
}
