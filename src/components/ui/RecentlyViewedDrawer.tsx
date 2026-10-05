"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getRecentlyViewed, clearRecentlyViewed, RecentlyViewedItem } from "@/lib/recentlyViewed";
import { useCurrency } from "@/context/CurrencyContext";

export default function RecentlyViewedDrawer() {
    const [items, setItems] = useState<RecentlyViewedItem[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const { formatCurrency } = useCurrency();

    const loadItems = () => {
        const data = getRecentlyViewed();
        setItems(data);
    };

    useEffect(() => {
        loadItems();

        // Listen for storage events (e.g. from other tabs)
        window.addEventListener("storage", loadItems);

        // Custom interval check to catch same-tab additions on navigation
        const interval = setInterval(loadItems, 2000);

        return () => {
            window.removeEventListener("storage", loadItems);
            clearInterval(interval);
        };
    }, []);

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        clearRecentlyViewed();
        setItems([]);
        setIsOpen(false);
    };

    if (items.length === 0) return null;

    return (
        <>
            {/* Floating Trigger Pill */}
            {!isOpen && (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: "fixed",
                        bottom: "24px",
                        left: "24px",
                        zIndex: 990,
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.55rem 1rem",
                        background: "var(--navy-800, #0f1629)",
                        color: "#ffffff",
                        border: "1px solid rgba(212, 160, 23, 0.4)",
                        borderRadius: "50px",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.22)",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                    }}
                    title="View your recently browsed properties"
                >
                    <span style={{ fontSize: "1rem" }}>🕑</span>
                    <span>Recently Viewed ({items.length})</span>
                </button>
            )}

            {/* Slide-Up Bottom Drawer / Tray */}
            {isOpen && (
                <div
                    style={{
                        position: "fixed",
                        bottom: "20px",
                        left: "20px",
                        right: "20px",
                        maxWidth: "680px",
                        margin: "0 auto",
                        zIndex: 1000,
                        background: "var(--bg-primary, #ffffff)",
                        border: "1px solid var(--border-color, #e2e6ee)",
                        borderRadius: "18px",
                        boxShadow: "0 16px 48px rgba(0, 0, 0, 0.2)",
                        padding: "1.25rem",
                        animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "1rem",
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <span style={{ fontSize: "1.1rem" }}>🕑</span>
                            <h4
                                style={{
                                    margin: 0,
                                    fontSize: "0.95rem",
                                    fontWeight: 700,
                                    color: "var(--text-heading, #0f1629)",
                                }}
                            >
                                Recently Viewed Properties ({items.length})
                            </h4>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                            <button
                                type="button"
                                onClick={handleClear}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "var(--text-tertiary, #64748b)",
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                }}
                            >
                                Clear All
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: "var(--bg-secondary, #f1f5f9)",
                                    border: "none",
                                    borderRadius: "50%",
                                    width: "28px",
                                    height: "28px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    fontSize: "0.85rem",
                                    color: "var(--text-secondary, #475569)",
                                }}
                                aria-label="Close recently viewed drawer"
                            >
                                ✕
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Item Row */}
                    <div
                        style={{
                            display: "flex",
                            gap: "0.85rem",
                            overflowX: "auto",
                            paddingBottom: "0.5rem",
                            scrollbarWidth: "thin",
                        }}
                    >
                        {items.map((item) => (
                            <Link
                                key={item.id}
                                href={`/properties/${item.id}`}
                                onClick={() => setIsOpen(false)}
                                style={{
                                    textDecoration: "none",
                                    flexShrink: 0,
                                    width: "160px",
                                    background: "var(--bg-secondary, #f8f9fb)",
                                    border: "1px solid var(--border-light, #eef2f6)",
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                    display: "flex",
                                    flexDirection: "column",
                                    transition: "transform 0.2s ease",
                                }}
                            >
                                <div style={{ position: "relative", width: "100%", height: "95px" }}>
                                    <Image
                                        src={item.image || "/images/property-1.png"}
                                        alt={item.title}
                                        fill
                                        style={{ objectFit: "cover" }}
                                        sizes="160px"
                                    />
                                </div>
                                <div style={{ padding: "0.6rem" }}>
                                    <div
                                        style={{
                                            fontSize: "0.85rem",
                                            fontWeight: 700,
                                            color: "var(--gold-600, #b8860b)",
                                            marginBottom: "2px",
                                        }}
                                    >
                                        {formatCurrency(item.price)}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            color: "var(--text-primary, #0f1629)",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                        }}
                                    >
                                        {item.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.7rem",
                                            color: "var(--text-tertiary, #64748b)",
                                            marginTop: "2px",
                                        }}
                                    >
                                        📍 {item.city}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}
