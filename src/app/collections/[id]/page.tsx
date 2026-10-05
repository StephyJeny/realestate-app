"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CollaborativeBoard from "@/components/collections/CollaborativeBoard";
import { useAuth } from "@/context/AuthContext";
import { getSharedCollectionById, SharedCollection } from "@/lib/firestore";
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from "@/components/icons/Icons";

interface Props {
    params: Promise<{ id: string }>;
}

export default function CollectionDetailPage({ params }: Props) {
    const { id } = use(params);
    const { user, userProfile, loading: authLoading } = useAuth();
    const [collection, setCollection] = useState<SharedCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCollection = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getSharedCollectionById(id);
            if (data) {
                setCollection(data);
                setError(null);
            } else {
                setError("Collection not found or has been removed.");
            }
        } catch (err: any) {
            console.error("Failed to load collection:", err);
            setError("Could not load this shared collection.");
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadCollection();
    }, [loadCollection]);

    const effectiveUserId = user?.uid || "guest-" + Math.random().toString(36).slice(2, 7);
    const effectiveUserName = userProfile?.displayName || user?.displayName || "Prospective Buyer";
    const effectiveUserEmail = user?.email || undefined;

    return (
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f8fafc" }}>
            <Navbar />

            <main style={{ flex: 1, maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>
                {/* Breadcrumbs & Navigation */}
                <div style={{ marginBottom: "1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Link
                        href="/dashboard/buyer"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            fontSize: "0.85rem",
                            fontWeight: 700,
                            color: "var(--navy-800, #0f1629)",
                            textDecoration: "none",
                        }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </Link>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", color: "#64748b" }}>
                        <Sparkles size={14} color="var(--gold-600, #d97706)" />
                        EstateVision Co-Buying Room
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: "center", padding: "5rem 1rem", color: "#64748b" }}>
                        <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 1rem auto" }} />
                        <p style={{ fontWeight: 600 }}>Loading collaborative board...</p>
                    </div>
                ) : error || !collection ? (
                    <div style={{
                        textAlign: "center",
                        padding: "4rem 2rem",
                        background: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        maxWidth: "500px",
                        margin: "2rem auto",
                    }}>
                        <AlertCircle size={40} color="#ef4444" style={{ margin: "0 auto 1rem auto" }} />
                        <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
                            Collection Not Found
                        </h3>
                        <p style={{ fontSize: "0.88rem", color: "#64748b", marginBottom: "1.5rem" }}>
                            {error || "We couldn't find the requested collection. It may be private or deleted."}
                        </p>
                        <Link
                            href="/properties"
                            style={{
                                display: "inline-block",
                                background: "var(--navy-800, #0f1629)",
                                color: "#ffffff",
                                padding: "0.6rem 1.25rem",
                                borderRadius: "8px",
                                textDecoration: "none",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                            }}
                        >
                            Explore Available Listings
                        </Link>
                    </div>
                ) : (
                    <CollaborativeBoard
                        collection={collection}
                        currentUserId={effectiveUserId}
                        currentUserName={effectiveUserName}
                        currentUserEmail={effectiveUserEmail}
                        onUpdate={loadCollection}
                    />
                )}
            </main>

            <Footer />
        </div>
    );
}
