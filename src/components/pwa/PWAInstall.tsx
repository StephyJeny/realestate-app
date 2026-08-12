"use client";
import { useEffect, useState, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker
                .register("/sw.js")
                .then((reg) => {
                    console.log("SW registered:", reg.scope);
                })
                .catch((err) => {
                    console.warn("SW registration failed:", err);
                });
        }

        // Check if already installed
        if (window.matchMedia("(display-mode: standalone)").matches) {
            setIsInstalled(true);
            return;
        }

        // Listen for install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Show banner after 30 seconds to avoid being intrusive
            const dismissed = localStorage.getItem("pwa-install-dismissed");
            if (!dismissed) {
                setTimeout(() => setShowBanner(true), 30000);
            }
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Listen for successful install
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowBanner(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsInstalled(true);
        }
        setShowBanner(false);
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem("pwa-install-dismissed", "true");
    };

    if (isInstalled || !showBanner) return null;

    return (
        <div
            style={{
                position: "fixed",
                bottom: "1.25rem",
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 9999,
                background: "var(--bg-card, #1a1f2e)",
                border: "1px solid var(--border-color, #2a3040)",
                borderRadius: "16px",
                padding: "1rem 1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                maxWidth: "420px",
                width: "calc(100vw - 2rem)",
                animation: "slideUp 0.4s ease",
            }}
        >
            <div style={{ fontSize: "2rem", flexShrink: 0 }}>🏠</div>
            <div style={{ flex: 1 }}>
                <div style={{
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "var(--text-heading, #fff)",
                    marginBottom: "0.15rem",
                }}>
                    Install EstateVue
                </div>
                <div style={{
                    fontSize: "0.72rem",
                    color: "var(--text-secondary, #9ca3af)",
                    lineHeight: 1.4,
                }}>
                    Add to home screen for a faster, app-like experience
                </div>
            </div>
            <button
                onClick={handleInstall}
                style={{
                    padding: "0.45rem 0.85rem",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#000",
                    background: "linear-gradient(135deg, #d4a017, #b8860b)",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                }}
            >
                Install
            </button>
            <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                style={{
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    color: "var(--text-tertiary, #6b7280)",
                    cursor: "pointer",
                    fontSize: "1rem",
                    flexShrink: 0,
                }}
            >
                ✕
            </button>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
