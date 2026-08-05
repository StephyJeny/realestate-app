import Link from "next/link";

export default function NotFound() {
    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-primary)",
                padding: "2rem",
                textAlign: "center",
            }}
        >
            <div
                style={{
                    fontSize: "6rem",
                    fontWeight: 800,
                    lineHeight: 1,
                    background: "linear-gradient(135deg, var(--gold-500), var(--gold-600))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    marginBottom: "0.5rem",
                }}
            >
                404
            </div>
            <h2
                style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color: "var(--text-heading)",
                    marginBottom: "0.75rem",
                    fontFamily: "var(--font-display)",
                }}
            >
                Page Not Found
            </h2>
            <p
                style={{
                    fontSize: "1rem",
                    color: "var(--text-secondary)",
                    maxWidth: "420px",
                    marginBottom: "2rem",
                    lineHeight: 1.6,
                }}
            >
                The page you&apos;re looking for doesn&apos;t exist or has been moved.
                Let&apos;s get you back on track.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
                <Link
                    href="/"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.75rem",
                        background: "linear-gradient(135deg, var(--gold-500), var(--gold-600))",
                        color: "#fff",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        textDecoration: "none",
                        boxShadow: "0 4px 20px rgba(212, 160, 23, 0.25)",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Go Home
                </Link>
                <Link
                    href="/properties"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.75rem 1.75rem",
                        background: "transparent",
                        color: "var(--text-primary)",
                        border: "2px solid var(--border-color)",
                        borderRadius: "var(--radius-md)",
                        fontWeight: 600,
                        fontSize: "0.95rem",
                        textDecoration: "none",
                        transition: "border-color 0.2s ease, color 0.2s ease",
                    }}
                >
                    Browse Properties
                </Link>
            </div>
        </div>
    );
}
