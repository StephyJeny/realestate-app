"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
    ThumbsUp, 
    ThumbsDown, 
    MessageSquare, 
    UserPlus, 
    Share2, 
    Trash2, 
    ExternalLink, 
    Check, 
    Copy,
    Building2,
    Users
} from "@/components/icons/Icons";
import styles from "./CollaborativeBoard.module.css";
import { 
    SharedCollection, 
    CollectionItem, 
    voteOnCollectionProperty, 
    addCommentToCollectionProperty, 
    removePropertyFromSharedCollection,
    inviteMemberToSharedCollection
} from "@/lib/firestore";

interface CollaborativeBoardProps {
    collection: SharedCollection;
    currentUserId: string;
    currentUserName: string;
    currentUserEmail?: string;
    onUpdate?: () => void;
}

export default function CollaborativeBoard({
    collection: initialCollection,
    currentUserId,
    currentUserName,
    currentUserEmail,
    onUpdate,
}: CollaborativeBoardProps) {
    const [collection, setCollection] = useState<SharedCollection>(initialCollection);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteName, setInviteName] = useState("");
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [copied, setCopied] = useState(false);
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

    // Update if prop changes
    React.useEffect(() => {
        setCollection(initialCollection);
    }, [initialCollection]);

    // Calculate score for an item: upvotes - downvotes
    const getItemScore = (item: CollectionItem) => {
        const votes = Object.values(item.votes || {});
        const ups = votes.filter((v) => v === "up").length;
        const downs = votes.filter((v) => v === "down").length;
        return { ups, downs, net: ups - downs };
    };

    const handleVote = async (propertyId: string, currentVote: "up" | "down" | undefined, desiredVote: "up" | "down") => {
        const newVote = currentVote === desiredVote ? "remove" : desiredVote;

        // Optimistic UI update
        setCollection((prev) => ({
            ...prev,
            items: prev.items.map((item) => {
                if (item.propertyId !== propertyId) return item;
                const updatedVotes = { ...(item.votes || {}) };
                if (newVote === "remove") {
                    delete updatedVotes[currentUserId];
                } else {
                    updatedVotes[currentUserId] = newVote;
                }
                return { ...item, votes: updatedVotes };
            }),
        }));

        if (collection.id) {
            await voteOnCollectionProperty(collection.id, propertyId, currentUserId, newVote);
            onUpdate?.();
        }
    };

    const handleAddComment = async (propertyId: string, e: React.FormEvent) => {
        e.preventDefault();
        const text = (commentInputs[propertyId] || "").trim();
        if (!text || !collection.id) return;

        setSubmittingComment((prev) => ({ ...prev, [propertyId]: true }));

        const newComment = {
            userId: currentUserId,
            userName: currentUserName || "Co-Buyer",
            text,
        };

        try {
            const added = await addCommentToCollectionProperty(collection.id, propertyId, newComment);
            
            // Clear input
            setCommentInputs((prev) => ({ ...prev, [propertyId]: "" }));

            // Update local state
            setCollection((prev) => ({
                ...prev,
                items: prev.items.map((item) => {
                    if (item.propertyId !== propertyId) return item;
                    return {
                        ...item,
                        comments: [...(item.comments || []), added],
                    };
                }),
            }));

            onUpdate?.();
        } catch (err) {
            console.error("Failed to add comment:", err);
        } finally {
            setSubmittingComment((prev) => ({ ...prev, [propertyId]: false }));
        }
    };

    const handleRemoveProperty = async (propertyId: string) => {
        if (!collection.id) return;
        if (!confirm("Are you sure you want to remove this property from the shared board?")) return;

        setCollection((prev) => ({
            ...prev,
            items: prev.items.filter((i) => i.propertyId !== propertyId),
        }));

        await removePropertyFromSharedCollection(collection.id, propertyId);
        onUpdate?.();
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !collection.id) return;

        const email = inviteEmail.trim().toLowerCase();
        await inviteMemberToSharedCollection(collection.id, email, inviteName.trim() || undefined);

        setCollection((prev) => ({
            ...prev,
            members: Array.from(new Set([...(prev.members || []), email])),
            memberNames: {
                ...(prev.memberNames || {}),
                ...(inviteName ? { [email]: inviteName.trim() } : {}),
            },
        }));

        setInviteEmail("");
        setInviteName("");
        setShowInviteModal(false);
        onUpdate?.();
    };

    const copyShareLink = () => {
        const shareUrl = typeof window !== "undefined"
            ? `${window.location.origin}/collections/${collection.id}`
            : `/collections/${collection.id}`;
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const allMembers = [
        { name: collection.createdByName || "Organizer", email: collection.createdByEmail },
        ...(collection.members || []).map((m) => ({
            name: collection.memberNames?.[m] || m.split("@")[0] || "Member",
            email: m,
        })),
    ];

    return (
        <div className={styles.container}>
            {/* Header / Board Overview */}
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <h2>
                        <Users size={22} style={{ color: "var(--gold-600, #d97706)" }} />
                        {collection.title}
                    </h2>
                    <p>
                        {collection.description || "Shared board for collaborative house hunting & co-investment."}
                    </p>
                </div>

                <div className={styles.headerActions}>
                    {/* Avatars */}
                    <div className={styles.membersList} title={`${allMembers.length} Collaborator(s)`}>
                        {allMembers.slice(0, 5).map((m, idx) => (
                            <div 
                                key={idx} 
                                className={styles.memberAvatar} 
                                title={`${m.name} (${m.email})`}
                            >
                                {m.name.charAt(0).toUpperCase()}
                            </div>
                        ))}
                        {allMembers.length > 5 && (
                            <div className={styles.memberAvatar} title="More members">
                                +{allMembers.length - 5}
                            </div>
                        )}
                    </div>

                    {/* Invite Button */}
                    <button 
                        className={styles.inviteBtn}
                        onClick={() => setShowInviteModal(true)}
                    >
                        <UserPlus size={15} />
                        Invite Partner / Chama
                    </button>

                    {/* Copy Link */}
                    <button 
                        className={styles.inviteBtn}
                        onClick={copyShareLink}
                        title="Copy direct board link"
                    >
                        {copied ? <Check size={15} color="#16a34a" /> : <Share2 size={15} />}
                        {copied ? "Link Copied!" : "Share Link"}
                    </button>
                </div>
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(15, 23, 42, 0.6)",
                    backdropFilter: "blur(4px)",
                    zIndex: 9999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "1rem",
                }}>
                    <div style={{
                        background: "#ffffff",
                        borderRadius: "16px",
                        maxWidth: "460px",
                        width: "100%",
                        padding: "1.75rem",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
                        position: "relative",
                    }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, margin: 0, color: "#0f172a" }}>
                                👥 Invite Co-Buyer to Board
                            </h3>
                            <button
                                onClick={() => setShowInviteModal(false)}
                                style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "#64748b" }}
                            >
                                ✕
                            </button>
                        </div>
                        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0 0 1.25rem 0", lineHeight: 1.4 }}>
                            Collaborate on shortlist, vote thumbs up/down on listings, and discuss properties together.
                        </p>

                        <form onSubmit={handleInvite} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                            <div>
                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                                    Member Email Address *
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. partner@gmail.com, chama@investment.co.ke"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.6rem 0.85rem",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "0.85rem",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.3rem", color: "#334155" }}>
                                    Display Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Jane, David, Chama Treasurer"
                                    value={inviteName}
                                    onChange={(e) => setInviteName(e.target.value)}
                                    style={{
                                        width: "100%",
                                        padding: "0.6rem 0.85rem",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "0.85rem",
                                        boxSizing: "border-box",
                                    }}
                                />
                            </div>

                            <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
                                <button
                                    type="button"
                                    onClick={() => setShowInviteModal(false)}
                                    style={{
                                        flex: 1,
                                        padding: "0.6rem",
                                        borderRadius: "8px",
                                        border: "1px solid #cbd5e1",
                                        background: "#f8fafc",
                                        fontSize: "0.85rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1.5,
                                        padding: "0.6rem",
                                        borderRadius: "8px",
                                        border: "none",
                                        background: "var(--navy-800, #0f1629)",
                                        color: "#ffffff",
                                        fontSize: "0.85rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    Add Member
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Properties Grid */}
            {collection.items && collection.items.length > 0 ? (
                <div className={styles.itemsGrid}>
                    {collection.items.map((item) => {
                        const { ups, downs, net } = getItemScore(item);
                        const userVote = item.votes?.[currentUserId];

                        return (
                            <div key={item.propertyId} className={styles.itemCard}>
                                {/* Thumbnail Image */}
                                <div className={styles.imageWrap}>
                                    <Image
                                        src={item.propertyImage || "/images/placeholder.jpg"}
                                        alt={item.propertyTitle}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 360px"
                                        className={styles.image}
                                    />
                                    <div className={styles.scorePill}>
                                        <ThumbsUp size={12} /> {ups} | <ThumbsDown size={12} /> {downs}
                                    </div>
                                    <div className={styles.addedByBadge}>
                                        By {item.addedByName || "Co-Buyer"}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className={styles.cardContent}>
                                    <Link href={`/properties/${item.propertyId}`} className={styles.cardTitle}>
                                        {item.propertyTitle}
                                    </Link>
                                    <div className={styles.cardLocation}>
                                        📍 {item.neighborhood ? `${item.neighborhood}, ` : ""}{item.city}
                                    </div>
                                    <div className={styles.cardPrice}>
                                        KES {item.propertyPrice?.toLocaleString()}
                                    </div>

                                    {/* Voting Actions */}
                                    <div className={styles.voteBar}>
                                        <div className={styles.voteButtons}>
                                            <button
                                                className={`${styles.voteBtn} ${userVote === "up" ? styles.voteBtnUpActive : ""}`}
                                                onClick={() => handleVote(item.propertyId, userVote, "up")}
                                                title="Vote Yes / Like this property"
                                            >
                                                <ThumbsUp size={14} />
                                                <span>{ups}</span>
                                            </button>
                                            <button
                                                className={`${styles.voteBtn} ${userVote === "down" ? styles.voteBtnDownActive : ""}`}
                                                onClick={() => handleVote(item.propertyId, userVote, "down")}
                                                title="Vote No / Dislike this property"
                                            >
                                                <ThumbsDown size={14} />
                                                <span>{downs}</span>
                                            </button>
                                        </div>

                                        <div className={styles.commentCount}>
                                            <MessageSquare size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                                            {(item.comments || []).length} remarks
                                        </div>
                                    </div>

                                    {/* Discussion / Comments */}
                                    <div className={styles.commentsArea}>
                                        {item.comments && item.comments.length > 0 && (
                                            <div className={styles.commentList}>
                                                {item.comments.map((c) => (
                                                    <div key={c.id} className={styles.commentBubble}>
                                                        <div className={styles.commentAuthor}>
                                                            <span>{c.userName}</span>
                                                            <span className={styles.commentTime}>
                                                                {new Date(c.createdAt).toLocaleDateString([], {
                                                                    month: "short",
                                                                    day: "numeric",
                                                                })}
                                                            </span>
                                                        </div>
                                                        <p className={styles.commentText}>{c.text}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Comment input form */}
                                        <form 
                                            onSubmit={(e) => handleAddComment(item.propertyId, e)}
                                            className={styles.addCommentForm}
                                        >
                                            <input
                                                type="text"
                                                placeholder="Add a remark (e.g. Good yard, but high price)..."
                                                className={styles.commentInput}
                                                value={commentInputs[item.propertyId] || ""}
                                                onChange={(e) =>
                                                    setCommentInputs((prev) => ({
                                                        ...prev,
                                                        [item.propertyId]: e.target.value,
                                                    }))
                                                }
                                            />
                                            <button 
                                                type="submit" 
                                                disabled={submittingComment[item.propertyId]}
                                                className={styles.commentPostBtn}
                                            >
                                                Post
                                            </button>
                                        </form>
                                    </div>

                                    {/* Remove button */}
                                    {(collection.createdBy === currentUserId || item.addedBy === currentUserId) && (
                                        <button
                                            className={styles.removeBtn}
                                            onClick={() => handleRemoveProperty(item.propertyId)}
                                        >
                                            Remove from board
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIcon}>🏡</div>
                    <h3 className={styles.emptyTitle}>No properties in this collection yet</h3>
                    <p className={styles.emptyText}>
                        Browse properties and click <strong>&quot;Save to Shared Collection&quot;</strong> to start collaborating with your partner, family, or chama co-investors.
                    </p>
                    <Link
                        href="/properties"
                        style={{
                            marginTop: "0.5rem",
                            background: "var(--navy-800, #0f1629)",
                            color: "#ffffff",
                            padding: "0.55rem 1.2rem",
                            borderRadius: "8px",
                            textDecoration: "none",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                        }}
                    >
                        Explore Properties
                    </Link>
                </div>
            )}
        </div>
    );
}
