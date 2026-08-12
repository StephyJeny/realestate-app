"use client";
import Link from "next/link";

export default function OfflinePage() {
    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            background: "var(--bg-primary)",
            textAlign: "center",
        }}>
            <div style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "var(--radius-xl)",
                padding: "3rem 2.5rem",
                maxWidth: "480px",
                width: "100%",
            }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem" }}>📡</div>
                <h1 style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "var(--text-heading)",
                    marginBottom: "0.5rem",
                }}>
                    You&apos;re Offline
                </h1>
                <p style={{
                    fontSize: "0.95rem",
                    color: "var(--text-secondary)",
                    lineHeight: 1.6,
                    marginBottom: "1.5rem",
                }}>
                    It looks like you&apos;ve lost your internet connection. Some features may not be available until you&apos;re back online.
                </p>

                <div style={{
                    padding: "1rem",
                    background: "rgba(212, 160, 23, 0.06)",
                    border: "1px solid rgba(212, 160, 23, 0.15)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "1.5rem",
                }}>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                        💡 <strong style={{ color: "var(--gold-600)" }}>Tip:</strong> Previously visited pages may still be available from your browser cache. Try navigating to a page you&apos;ve recently viewed.
                    </p>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
                    <button
                        onClick={() => typeof window !== "undefined" && window.location.reload()}
                        style={{
                            padding: "0.65rem 1.5rem",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "#000",
                            background: "linear-gradient(135deg, #d4a017, #b8860b)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                        }}
                    >
                        🔄 Try Again
                    </button>
                    <Link
                        href="/"
                        style={{
                            padding: "0.65rem 1.5rem",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            background: "none",
                            border: "1px solid var(--border-color)",
                            borderRadius: "var(--radius-md)",
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                        }}
                    >
                        🏠 Go Home
                    </Link>
                </div>
            </div>

            <p style={{
                marginTop: "2rem",
                fontSize: "0.75rem",
                color: "var(--text-tertiary)",
            }}>
                EstateVue works best with an active internet connection.
            </p>
        </div>
    );
}
