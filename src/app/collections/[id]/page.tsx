"use client";

import { use, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import CollaborativeBoard from "@/components/collections/CollaborativeBoard";
import { useAuth } from "@/context/AuthContext";
import { getSharedCollectionById, SharedCollection } from "@/lib/firestore";
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from "@/components/icons/Icons";

interface Props {
    params: Promise<{ id: string }>;
}

import toast from "react-hot-toast";

export default function CollectionDetailPage({ params }: Props) {
    const { id } = use(params);
    const { user, userProfile, sendVerificationEmail, refreshProfile } = useAuth();
    const [collection, setCollection] = useState<SharedCollection | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [sendingVerify, setSendingVerify] = useState(false);

    // Stable guest ID across re-renders and page visits
    const [guestId] = useState(() => {
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("estatevue_guest_id");
            if (stored) return stored;
            const newId = "guest-" + Math.random().toString(36).slice(2, 9);
            try { localStorage.setItem("estatevue_guest_id", newId); } catch {}
            return newId;
        }
        return "guest-user";
    });

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

    const effectiveUserId = user?.uid || guestId;
    const effectiveUserName = userProfile?.displayName || user?.displayName || "Prospective Buyer";
    const effectiveUserEmail = user?.email || undefined;
    const isUnverifiedInvitedMember = Boolean(
        user &&
        !user.emailVerified &&
        collection &&
        collection.createdBy !== user.uid &&
        user.email &&
        collection.members?.includes(user.email.toLowerCase())
    );

    const handleSendVerification = async () => {
        setSendingVerify(true);
        try {
            await sendVerificationEmail();
            toast.success("Verification email sent! Check your inbox.");
        } catch (err: any) {
            toast.error(err?.message || "Could not send verification email.");
        } finally {
            setSendingVerify(false);
        }
    };

    const handleRefreshVerification = async () => {
        await refreshProfile();
        await loadCollection();
        toast.success("Verification status refreshed.");
    };

    return (
        <div style={{ minHeight: "calc(100vh - var(--navbar-height, 80px))", display: "flex", flexDirection: "column", background: "#f8fafc", paddingTop: "var(--navbar-height, 80px)" }}>
            <div style={{ flex: 1, maxWidth: "1280px", width: "100%", margin: "0 auto", padding: "2rem 1.5rem" }}>
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
                        EstateVue Co-Buying Room
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
                    <>
                        {isUnverifiedInvitedMember && (
                            <div
                                style={{
                                    background: "#fffbeb",
                                    border: "1px solid #fde68a",
                                    borderRadius: "12px",
                                    padding: "1rem 1.25rem",
                                    marginBottom: "1.25rem",
                                    display: "flex",
                                    flexWrap: "wrap",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    gap: "0.75rem",
                                }}
                            >
                                <div style={{ fontSize: "0.86rem", color: "#92400e" }}>
                                    <strong>Verify your email ({user?.email})</strong> to vote, comment, or edit this shared board.
                                </div>
                                <div style={{ display: "flex", gap: "0.5rem" }}>
                                    <button
                                        type="button"
                                        onClick={handleSendVerification}
                                        disabled={sendingVerify}
                                        style={{
                                            background: "#d97706",
                                            color: "#fff",
                                            border: "none",
                                            borderRadius: "8px",
                                            padding: "0.45rem 0.9rem",
                                            fontSize: "0.8rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        {sendingVerify ? "Sending..." : "Send Verification Link"}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleRefreshVerification}
                                        style={{
                                            background: "#ffffff",
                                            color: "#92400e",
                                            border: "1px solid #f59e0b",
                                            borderRadius: "8px",
                                            padding: "0.45rem 0.9rem",
                                            fontSize: "0.8rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                        }}
                                    >
                                        I&apos;ve Verified
                                    </button>
                                </div>
                            </div>
                        )}
                        <CollaborativeBoard
                            collection={collection}
                            currentUserId={effectiveUserId}
                            currentUserName={effectiveUserName}
                            currentUserEmail={effectiveUserEmail}
                            onUpdate={loadCollection}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
