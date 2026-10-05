"use client";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { submitOffer, OfferDetails } from "@/lib/firestore";
import { generateLOINumber, LOIData } from "@/lib/loiGenerator";
import styles from "./MakeAnOfferModal.module.css";

interface MakeAnOfferModalProps {
    property: {
        id: string;
        title: string;
        price: number;
        currency?: string;
        city?: string;
        neighborhood?: string;
        agentId?: string;
        agentName?: string;
        agentEmail?: string;
        agentPhone?: string;
    };
    onClose: () => void;
    onOfferCreated?: (loiData: LOIData) => void;
}

export default function MakeAnOfferModal({ property, onClose, onOfferCreated }: MakeAnOfferModalProps) {
    const { user, userProfile } = useAuth();
    const askingPrice = property.price || 0;
    const currency = property.currency || "KES";

    // Form states
    const [offeredPrice, setOfferedPrice] = useState<number>(askingPrice);
    const [financingType, setFinancingType] = useState<"cash" | "mortgage" | "installments">("cash");
    const [downPaymentPercent, setDownPaymentPercent] = useState<number>(10);
    const [moveInDate, setMoveInDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() + 45); // default 45 days
        return d.toISOString().split("T")[0];
    });

    const [buyerName, setBuyerName] = useState(userProfile?.displayName || "");
    const [buyerEmail, setBuyerEmail] = useState(userProfile?.email || user?.email || "");
    const [buyerPhone, setBuyerPhone] = useState(userProfile?.phone || "");
    const [specialConditions, setSpecialConditions] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Conveyancing contingencies
    const [contingencies, setContingencies] = useState<{ id: string; label: string; checked: boolean }[]>([
        { id: "ardhisasa", label: "Official Ministry of Lands (Ardhisasa) clean title deed search with zero caveats", checked: true },
        { id: "beacons", label: "Physical beacon survey & boundary verification against cadastral deed plan", checked: true },
        { id: "rates", label: "County Government 2026 rates clearance and ground rent certificate", checked: true },
        { id: "vacant", label: "Vacant possession guaranteed on or before final disbursement", checked: true },
        { id: "mortgage_approval", label: "Subject to formal bank mortgage underwriting and letter of offer", checked: false },
    ]);

    const downPaymentAmount = Math.round((offeredPrice * downPaymentPercent) / 100);
    const balanceAmount = offeredPrice - downPaymentAmount;
    const priceDiffPercent = askingPrice > 0 ? Math.round(((offeredPrice - askingPrice) / askingPrice) * 100) : 0;

    const handleQuickPrice = (percentage: number) => {
        const newPrice = Math.round(askingPrice * (1 + percentage / 100));
        setOfferedPrice(newPrice);
    };

    const toggleContingency = (id: string) => {
        setContingencies((prev) =>
            prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c))
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!offeredPrice || offeredPrice <= 0) {
            toast.error("Please enter a valid offer price");
            return;
        }

        if (!buyerName.trim() || !buyerEmail.trim()) {
            toast.error("Please provide your name and email");
            return;
        }

        setIsSubmitting(true);
        const loiNumber = generateLOINumber();

        const offerDetails: OfferDetails = {
            offeredPrice,
            askingPrice,
            downPaymentPercent,
            downPaymentAmount,
            financingType,
            moveInDate,
            contingencies: contingencies.filter((c) => c.checked).map((c) => c.label),
            specialConditions: specialConditions.trim() || undefined,
            loiNumber,
            offerStatus: "pending",
            history: [
                {
                    action: "submitted",
                    actor: user?.uid || "buyer",
                    actorName: buyerName.trim(),
                    price: offeredPrice,
                    note: `Initial offer submitted: KES ${offeredPrice.toLocaleString()} (${financingType.toUpperCase()})`,
                    timestamp: new Date().toISOString(),
                },
            ],
        };

        const loiData: LOIData = {
            loiNumber,
            date: new Date().toLocaleDateString("en-KE", { day: "numeric", month: "long", year: "numeric" }),
            propertyTitle: property.title,
            lrNumber: `LR No. 209/${Math.floor(10000 + Math.random() * 89000)}`,
            city: property.city || "Nairobi",
            neighborhood: property.neighborhood || "Kenya",
            buyerName: buyerName.trim(),
            buyerEmail: buyerEmail.trim(),
            buyerPhone: buyerPhone.trim() || "N/A",
            agentName: property.agentName || "Listing Agent",
            agentEmail: property.agentEmail || "agent@estatevue.co.ke",
            agentPhone: property.agentPhone || "+254 700 000 000",
            offeredPrice,
            askingPrice,
            currency,
            downPaymentPercent,
            downPaymentAmount,
            financingType,
            moveInDate,
            validityDays: 14,
            contingencies: offerDetails.contingencies,
            specialConditions: specialConditions.trim() || undefined,
            status: "pending",
        };

        try {
            await submitOffer({
                propertyId: property.id,
                propertyTitle: property.title,
                senderId: user?.uid || "guest",
                senderName: buyerName.trim(),
                senderEmail: buyerEmail.trim(),
                senderPhone: buyerPhone.trim(),
                agentId: property.agentId || "agent",
                agentName: property.agentName || "Agent",
                offerDetails,
            });

            toast.success("Offer submitted! Letter of Intent (LOI) generated 📜");
            if (onOfferCreated) {
                onOfferCreated(loiData);
            }
            onClose();
        } catch (err) {
            console.error("Failed to submit offer:", err);
            toast.error("Failed to submit offer. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <div>
                        <h3 className={styles.headerTitle}>
                            <span>💼</span> Digital &ldquo;Make an Offer&rdquo; Workflow
                        </h3>
                        <p className={styles.headerSubtitle}>
                            Generates standard Kenyan Letter of Intent (LOI) for agent review
                        </p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
                        ✕
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: "contents" }}>
                    <div className={styles.body}>
                        {/* Property summary */}
                        <div className={styles.propBanner}>
                            <div className={styles.propInfo}>
                                <h4 className={styles.propTitle}>{property.title}</h4>
                                <span className={styles.propLocation}>📍 {property.neighborhood}, {property.city}</span>
                            </div>
                            <div className={styles.propAsking}>
                                <div className={styles.propAskingLabel}>Asking Price</div>
                                <div className={styles.propAskingPrice}>
                                    {currency} {askingPrice.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        {/* Section 1: Offer Financials */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <span>1️⃣</span> Proposed Purchase Consideration ({currency})
                            </div>
                            <div className={styles.inputGroup}>
                                <input
                                    type="number"
                                    min="100000"
                                    step="50000"
                                    className={styles.input}
                                    value={offeredPrice}
                                    onChange={(e) => setOfferedPrice(Number(e.target.value))}
                                    required
                                />
                                <div className={styles.quickPills}>
                                    <button type="button" className={`${styles.quickPill} ${priceDiffPercent === -10 ? styles.quickPillActive : ""}`} onClick={() => handleQuickPrice(-10)}>
                                        -10% ({currency} {Math.round(askingPrice * 0.9).toLocaleString()})
                                    </button>
                                    <button type="button" className={`${styles.quickPill} ${priceDiffPercent === -5 ? styles.quickPillActive : ""}`} onClick={() => handleQuickPrice(-5)}>
                                        -5% ({currency} {Math.round(askingPrice * 0.95).toLocaleString()})
                                    </button>
                                    <button type="button" className={`${styles.quickPill} ${priceDiffPercent === 0 ? styles.quickPillActive : ""}`} onClick={() => handleQuickPrice(0)}>
                                        Full Asking Price
                                    </button>
                                    <button type="button" className={`${styles.quickPill} ${priceDiffPercent === 5 ? styles.quickPillActive : ""}`} onClick={() => handleQuickPrice(5)}>
                                        +5% Competitive
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Financing Structure */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <span>2️⃣</span> Financing Method
                            </div>
                            <div className={styles.financingGrid}>
                                <div
                                    className={`${styles.financingCard} ${financingType === "cash" ? styles.financingCardActive : ""}`}
                                    onClick={() => setFinancingType("cash")}
                                >
                                    <span className={styles.financingIcon}>💵</span>
                                    <span className={styles.financingName}>Cash Purchase</span>
                                    <span className={styles.financingMeta}>Fastest Closing (14-30d)</span>
                                </div>
                                <div
                                    className={`${styles.financingCard} ${financingType === "mortgage" ? styles.financingCardActive : ""}`}
                                    onClick={() => {
                                        setFinancingType("mortgage");
                                        // Auto-enable mortgage contingency
                                        setContingencies((prev) =>
                                            prev.map((c) => (c.id === "mortgage_approval" ? { ...c, checked: true } : c))
                                        );
                                    }}
                                >
                                    <span className={styles.financingIcon}>🏦</span>
                                    <span className={styles.financingName}>Bank Mortgage</span>
                                    <span className={styles.financingMeta}>KCB / Stanbic / NCBA (60-90d)</span>
                                </div>
                                <div
                                    className={`${styles.financingCard} ${financingType === "installments" ? styles.financingCardActive : ""}`}
                                    onClick={() => setFinancingType("installments")}
                                >
                                    <span className={styles.financingIcon}>📑</span>
                                    <span className={styles.financingName}>Installments</span>
                                    <span className={styles.financingMeta}>Milestone Developer Plan</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Down payment & Move-in date */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <span>3️⃣</span> Down Payment & Target Completion Date
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Down Payment: {downPaymentPercent}%</label>
                                    <select
                                        className={styles.input}
                                        value={downPaymentPercent}
                                        onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                    >
                                        <option value={10}>10% Standard LSK Escrow ({currency} {Math.round(offeredPrice * 0.1).toLocaleString()})</option>
                                        <option value={20}>20% Strong Offer ({currency} {Math.round(offeredPrice * 0.2).toLocaleString()})</option>
                                        <option value={30}>30% High Commitment ({currency} {Math.round(offeredPrice * 0.3).toLocaleString()})</option>
                                        <option value={100}>100% Full Payment upon execution</option>
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Target Completion Date</label>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={moveInDate}
                                        onChange={(e) => setMoveInDate(e.target.value)}
                                        min={new Date().toISOString().split("T")[0]}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 4: Conveyancing Contingencies */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <span>4️⃣</span> Legal Due Diligence Conditions (Kenya Standards)
                            </div>
                            <div className={styles.contingencyList}>
                                {contingencies.map((c) => (
                                    <label key={c.id} className={styles.contingencyItem}>
                                        <input
                                            type="checkbox"
                                            checked={c.checked}
                                            onChange={() => toggleContingency(c.id)}
                                        />
                                        <span>{c.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Section 5: Buyer Details */}
                        <div className={styles.section}>
                            <div className={styles.sectionTitle}>
                                <span>5️⃣</span> Purchaser Contact Information
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Full Legal Name *</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={buyerName}
                                        onChange={(e) => setBuyerName(e.target.value)}
                                        placeholder="e.g., Joseph Kariuki Mwangi"
                                        required
                                    />
                                </div>
                                <div className={styles.inputGroup}>
                                    <label className={styles.label}>Phone Number (WhatsApp) *</label>
                                    <input
                                        type="tel"
                                        className={styles.input}
                                        value={buyerPhone}
                                        onChange={(e) => setBuyerPhone(e.target.value)}
                                        placeholder="e.g., +254 712 345 678"
                                        required
                                    />
                                </div>
                            </div>
                            <div className={styles.inputGroup} style={{ marginTop: "0.5rem" }}>
                                <label className={styles.label}>Email Address *</label>
                                <input
                                    type="email"
                                    className={styles.input}
                                    value={buyerEmail}
                                    onChange={(e) => setBuyerEmail(e.target.value)}
                                    placeholder="e.g., joseph@example.com"
                                    required
                                />
                            </div>
                            <div className={styles.inputGroup} style={{ marginTop: "0.5rem" }}>
                                <label className={styles.label}>Special Notes / Included Fixtures (Optional)</label>
                                <textarea
                                    className={styles.input}
                                    rows={2}
                                    value={specialConditions}
                                    onChange={(e) => setSpecialConditions(e.target.value)}
                                    placeholder="e.g., Includes built-in oven, backup inverter, and custom curtains..."
                                />
                            </div>
                        </div>

                        {/* Financial summary snapshot */}
                        <div className={styles.summaryCard}>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Offered Purchase Price</span>
                                <span className={styles.summaryVal}>{currency} {offeredPrice.toLocaleString()}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Initial Escrow Deposit ({downPaymentPercent}%)</span>
                                <span className={styles.summaryVal} style={{ color: "var(--gold-600)" }}>{currency} {downPaymentAmount.toLocaleString()}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Balance Upon Completion</span>
                                <span className={styles.summaryVal}>{currency} {balanceAmount.toLocaleString()}</span>
                            </div>
                            <div className={styles.summaryItem}>
                                <span className={styles.summaryLabel}>Variance to Asking Price</span>
                                <span className={styles.summaryVal} style={{ color: priceDiffPercent < 0 ? "var(--warning)" : priceDiffPercent === 0 ? "var(--text-heading)" : "var(--success)" }}>
                                    {priceDiffPercent > 0 ? `+${priceDiffPercent}%` : `${priceDiffPercent}%`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <button type="button" className={styles.btnCancel} onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.btnSubmit} disabled={isSubmitting}>
                            {isSubmitting ? "Generating LOI..." : "Submit Digital Offer 📝"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
