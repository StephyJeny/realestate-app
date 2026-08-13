"use client";
import { useEffect, useState, useCallback, createContext, useContext } from "react";
import { usePathname } from "next/navigation";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAContextType {
    canInstall: boolean;
    isInstalled: boolean;
    triggerInstall: () => void;
}

const PWAContext = createContext<PWAContextType>({
    canInstall: false,
    isInstalled: false,
    triggerInstall: () => { },
});

export const usePWA = () => useContext(PWAContext);

export function PWAProvider({ children }: { children: React.ReactNode }) {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showBanner, setShowBanner] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [canInstall, setCanInstall] = useState(false);
    const pathname = usePathname();

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
            setCanInstall(true);
            setShowBanner(true);
        };

        window.addEventListener("beforeinstallprompt", handler);

        // Listen for successful install
        window.addEventListener("appinstalled", () => {
            setIsInstalled(true);
            setShowBanner(false);
            setCanInstall(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    // Re-show banner on every page navigation
    useEffect(() => {
        if (canInstall && !isInstalled) {
            setShowBanner(true);
        }
    }, [pathname, canInstall, isInstalled]);

    const triggerInstall = useCallback(async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setIsInstalled(true);
            setCanInstall(false);
        }
        setShowBanner(false);
        setDeferredPrompt(null);
    }, [deferredPrompt]);

    // Dismiss banner — just hides it until next navigation
    const handleDismiss = () => {
        setShowBanner(false);
    };

    return (
        <PWAContext.Provider value={{ canInstall, isInstalled, triggerInstall }}>
            {children}

            {/* Floating Install Banner — reappears on every page */}
            {!isInstalled && showBanner && (
                <>
                    {/* Tap-anywhere overlay to dismiss */}
                    <div
                        onClick={handleDismiss}
                        style={{
                            position: "fixed",
                            inset: 0,
                            zIndex: 9998,
                            background: "transparent",
                        }}
                    />

                    {/* Banner */}
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
                            animation: "pwaSlideUp 0.4s ease",
                        }}
                    >
                        <div style={{ fontSize: "2rem", flexShrink: 0 }}>📲</div>
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
                                Add to home screen for faster access
                            </div>
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); triggerInstall(); }}
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
                    </div>

                    <style>{`
                        @keyframes pwaSlideUp {
                            from { transform: translateX(-50%) translateY(100px); opacity: 0; }
                            to { transform: translateX(-50%) translateY(0); opacity: 1; }
                        }
                    `}</style>
                </>
            )}
        </PWAContext.Provider>
    );
}
