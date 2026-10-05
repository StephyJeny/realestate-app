"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Users, Plus, Check, ExternalLink, Sparkles, FolderPlus } from "@/components/icons/Icons";
import styles from "./AddToCollectionModal.module.css";
import { useAuth } from "@/context/AuthContext";
import { 
    SharedCollection, 
    getSharedCollectionsByUser, 
    createSharedCollection, 
    addPropertyToSharedCollection 
} from "@/lib/firestore";

interface AddToCollectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    property: {
        id: string;
        title: string;
        price: number;
        currency?: string;
        images?: string[];
        city: string;
        neighborhood?: string;
    };
}

export default function AddToCollectionModal({
    isOpen,
    onClose,
    property,
}: AddToCollectionModalProps) {
    const { user, userProfile } = useAuth();
    const [collections, setCollections] = useState<SharedCollection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDescription, setNewDescription] = useState("");
    const [partnerEmail, setPartnerEmail] = useState("");
    const [justAddedToId, setJustAddedToId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const effectiveUserId = user?.uid || "guest-buyer";
    const effectiveUserName = userProfile?.displayName || user?.displayName || "Prospective Buyer";
    const effectiveUserEmail = user?.email || "buyer@estatevision.co.ke";

    useEffect(() => {
        if (!isOpen) return;

        async function fetchCollections() {
            setLoading(true);
            try {
                const list = await getSharedCollectionsByUser(effectiveUserId, effectiveUserEmail);
                setCollections(list);
                if (list.length === 0) {
                    setIsCreatingNew(true);
                }
            } catch (err) {
                console.error("Failed to load collections:", err);
            } finally {
                setLoading(false);
            }
        }

        fetchCollections();
    }, [isOpen, effectiveUserId, effectiveUserEmail]);

    if (!isOpen) return null;

    const propertyImage = property.images?.[0] || "/images/placeholder.jpg";

    const handleAddToExisting = async (collection: SharedCollection) => {
        if (!collection.id) return;
        setSaving(true);

        try {
            await addPropertyToSharedCollection(collection.id, {
                propertyId: property.id,
                propertyTitle: property.title,
                propertyPrice: property.price,
                propertyCurrency: property.currency || "KES",
                propertyImage,
                city: property.city,
                neighborhood: property.neighborhood,
                addedBy: effectiveUserId,
                addedByName: effectiveUserName,
                addedAt: new Date().toISOString(),
            });

            setJustAddedToId(collection.id);

            // Update local state
            setCollections((prev) =>
                prev.map((c) => {
                    if (c.id !== collection.id) return c;
                    return {
                        ...c,
                        items: [
                            ...(c.items || []),
                            {
                                propertyId: property.id,
                                propertyTitle: property.title,
                                propertyPrice: property.price,
                                propertyCurrency: property.currency || "KES",
                                propertyImage,
                                city: property.city,
                                neighborhood: property.neighborhood,
                                addedBy: effectiveUserId,
                                addedByName: effectiveUserName,
                                addedAt: new Date().toISOString(),
                                votes: {},
                                comments: [],
                            },
                        ],
                    };
                })
            );
        } catch (err) {
            console.error("Failed to add property to collection:", err);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateAndAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim()) return;

        setSaving(true);
        try {
            const initialMembers = partnerEmail.trim() ? [partnerEmail.trim().toLowerCase()] : [];

            const newCollectionData = {
                title: newTitle.trim(),
                description: newDescription.trim() || undefined,
                createdBy: effectiveUserId,
                createdByName: effectiveUserName,
                createdByEmail: effectiveUserEmail,
                members: initialMembers,
                items: [
                    {
                        propertyId: property.id,
                        propertyTitle: property.title,
                        propertyPrice: property.price,
                        propertyCurrency: property.currency || "KES",
                        propertyImage,
                        city: property.city,
                        neighborhood: property.neighborhood,
                        addedBy: effectiveUserId,
                        addedByName: effectiveUserName,
                        addedAt: new Date().toISOString(),
                        votes: {},
                        comments: [],
                    },
                ],
            };

            const createdId = await createSharedCollection(newCollectionData);
            setJustAddedToId(createdId);

            setCollections((prev) => [{ ...newCollectionData, id: createdId }, ...prev]);
            setIsCreatingNew(false);
            setNewTitle("");
            setNewDescription("");
            setPartnerEmail("");
        } catch (err) {
            console.error("Failed to create collection:", err);
        } finally {
            setSaving(false);
        }
    };

    const targetCollection = collections.find((c) => c.id === justAddedToId);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        <Users size={20} color="var(--gold-600, #d97706)" />
                        Save to Shared Collection
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Property preview */}
                    <div className={styles.propertySnippet}>
                        <div className={styles.snippetImage}>
                            <Image
                                src={propertyImage}
                                alt={property.title}
                                fill
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                        <div className={styles.snippetInfo}>
                            <div className={styles.snippetTitle}>{property.title}</div>
                            <div className={styles.snippetMeta}>
                                📍 {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}
                            </div>
                            <div className={styles.snippetPrice}>
                                KES {property.price.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {/* Success notification if just added */}
                    {justAddedToId && targetCollection && (
                        <div className={styles.successBanner}>
                            <h4 className={styles.successTitle}>
                                ✓ Added to &quot;{targetCollection.title}&quot;!
                            </h4>
                            <p style={{ margin: 0, fontSize: "0.8rem", color: "#166534" }}>
                                Your co-buyers can now vote and leave comments on this property.
                            </p>
                            <Link 
                                href={`/collections/${justAddedToId}`}
                                className={styles.successAction}
                                onClick={onClose}
                            >
                                Open Shared Board <ExternalLink size={14} />
                            </Link>
                        </div>
                    )}

                    {/* Existing Collections List */}
                    {!isCreatingNew && collections.length > 0 && (
                        <>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className={styles.sectionTitle}>Your Shared Boards</span>
                                <button
                                    onClick={() => setIsCreatingNew(true)}
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--gold-600, #d97706)",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "0.25rem",
                                    }}
                                >
                                    <Plus size={14} /> New Board
                                </button>
                            </div>

                            <div className={styles.collectionsList}>
                                {collections.map((col) => {
                                    const isAlreadyIn = (col.items || []).some(
                                        (i) => i.propertyId === property.id
                                    );
                                    return (
                                        <div
                                            key={col.id}
                                            className={styles.collectionCard}
                                            onClick={() => !isAlreadyIn && !saving && handleAddToExisting(col)}
                                        >
                                            <div className={styles.collectionCardInfo}>
                                                <div className={styles.collectionCardTitle}>{col.title}</div>
                                                <div className={styles.collectionCardMeta}>
                                                    {col.items?.length || 0} listings • {(col.members?.length || 0) + 1} collaborators
                                                </div>
                                            </div>

                                            {isAlreadyIn ? (
                                                <div className={styles.alreadyAddedBadge}>
                                                    <Check size={14} /> Saved
                                                </div>
                                            ) : (
                                                <button className={styles.addBtnPill} disabled={saving}>
                                                    Add Here
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Create New Collection Form */}
                    {(isCreatingNew || collections.length === 0) && (
                        <div className={styles.createNewBox}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 800, fontSize: "0.9rem", color: "#0f172a" }}>
                                    <FolderPlus size={16} color="var(--gold-600, #d97706)" />
                                    Create New Co-Buying Board
                                </div>
                                {collections.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingNew(false)}
                                        style={{ background: "transparent", border: "none", fontSize: "0.78rem", color: "#64748b", cursor: "pointer" }}
                                    >
                                        Cancel
                                    </button>
                                )}
                            </div>

                            <form onSubmit={handleCreateAndAdd} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Board Name *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Karen Family Home, Chama Westlands Shortlist"
                                        className={styles.input}
                                        value={newTitle}
                                        onChange={(e) => setNewTitle(e.target.value)}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Description / Criteria (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 3-4 bedroom houses under 65M with big yard"
                                        className={styles.input}
                                        value={newDescription}
                                        onChange={(e) => setNewDescription(e.target.value)}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Invite Partner / Co-Buyer (Email)</label>
                                    <input
                                        type="email"
                                        placeholder="e.g. spouse@gmail.com, investor@chama.co.ke"
                                        className={styles.input}
                                        value={partnerEmail}
                                        onChange={(e) => setPartnerEmail(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={saving || !newTitle.trim()}
                                    className={styles.createBtn}
                                >
                                    <Sparkles size={16} />
                                    {saving ? "Creating Board..." : "Create Board & Add Property"}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
