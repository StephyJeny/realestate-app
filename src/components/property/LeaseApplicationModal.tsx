"use client";

import React, { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { sendInquiry } from "@/lib/firestore";
import { sendInquiryEmail } from "@/lib/email";
import { uploadLeaseDocument } from "@/lib/storage";
import {
    calculateMoveInCosts,
    evaluateTenantAffordability,
} from "@/lib/rentalWorkflow";

interface LeaseApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId: string;
    propertyTitle: string;
    propertyType?: string;
    monthlyRentKES: number;
    agentId: string;
    agentName: string;
    agentEmail?: string;
    onOpenHoldingDeposit?: (depositAmountKES: number) => void;
}

export default function LeaseApplicationModal({
    isOpen,
    onClose,
    propertyId,
    propertyTitle,
    propertyType = "apartment",
    monthlyRentKES,
    agentId,
    agentName,
    agentEmail,
    onOpenHoldingDeposit,
}: LeaseApplicationModalProps) {
    const dialogRef = useDialogA11y(isOpen, onClose);
    const { user, userProfile } = useAuth();
    const { formatCurrencyFull: formatDisplayPrice } = useCurrency();

    const defaultMoveIn = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 14);
        return d.toISOString().slice(0, 10);
    }, []);

    const [applicantName, setApplicantName] = useState(
        userProfile?.displayName || user?.displayName || ""
    );
    const [applicantEmail, setApplicantEmail] = useState(
        userProfile?.email || user?.email || ""
    );
    const [applicantPhone, setApplicantPhone] = useState(userProfile?.phone || "");
    const [employmentType, setEmploymentType] = useState("Employed (Permanent)");
    const [employerName, setEmployerName] = useState("");
    const [netMonthlyIncome, setNetMonthlyIncome] = useState<number>(monthlyRentKES * 3);
    const [leaseMonths, setLeaseMonths] = useState<6 | 12 | 24>(12);
    const [depositMonths, setDepositMonths] = useState<1 | 2>(2);
    const [moveInDate, setMoveInDate] = useState(defaultMoveIn);
    const [occupants, setOccupants] = useState(2);
    const [notes, setNotes] = useState("");

    const [idFile, setIdFile] = useState<File | null>(null);
    const [incomeFile, setIncomeFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const moveIn = useMemo(
        () =>
            calculateMoveInCosts({
                monthlyRentKES,
                securityDepositMonths: depositMonths,
                includeUtilityDeposit: true,
                propertyType,
            }),
        [monthlyRentKES, depositMonths, propertyType]
    );

    const affordability = useMemo(
        () => evaluateTenantAffordability(monthlyRentKES, netMonthlyIncome),
        [monthlyRentKES, netMonthlyIncome]
    );

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const finalName = (applicantName || userProfile?.displayName || "").trim();
        const finalEmail = (applicantEmail || user?.email || "").trim();
        const finalPhone = (applicantPhone || userProfile?.phone || "").trim();

        if (!finalName || !finalEmail || !finalPhone) {
            toast.error("Please fill in your name, email, and phone number.");
            return;
        }

        if ((idFile || incomeFile) && !user) {
            toast.error("Please sign in to upload KYC & income verification documents.");
            return;
        }

        setSubmitting(true);
        try {
            let idDocUrl = "";
            let incomeDocUrl = "";

            if (user && idFile) {
                setUploadProgress(15);
                idDocUrl = await uploadLeaseDocument(idFile, propertyId, user.uid, (p) =>
                    setUploadProgress(Math.round(p * 0.5))
                );
            }
            if (user && incomeFile) {
                setUploadProgress(55);
                incomeDocUrl = await uploadLeaseDocument(incomeFile, propertyId, user.uid, (p) =>
                    setUploadProgress(50 + Math.round(p * 0.5))
                );
            }

            const docLinks = [
                idDocUrl ? `• ID/Passport Verified Upload: ${idDocUrl}` : "• ID/Passport: To be presented at viewing",
                incomeDocUrl ? `• Income Proof Upload: ${incomeDocUrl}` : "• Income Proof: Self-declared",
            ].join("\n");

            const applicationSummary = [
                `📝 DIGITAL LEASE APPLICATION — ${propertyTitle}`,
                `• Lease Term: ${leaseMonths} Months | Target Move-In: ${moveInDate} | Occupants: ${occupants}`,
                `• Employment: ${employmentType}${employerName ? ` (${employerName.trim()})` : ""}`,
                `• Net Monthly Income: KES ${Math.round(netMonthlyIncome).toLocaleString()} (${affordability.rentToIncomeRatioPct}% Rent-to-Income — ${affordability.label})`,
                `• Proposed Move-In Package (${depositMonths} mo deposit + 1st month + utility): KES ${moveIn.totalMoveInKES.toLocaleString()}`,
                docLinks,
                notes.trim() ? `• Applicant Notes: ${notes.trim()}` : "",
            ]
                .filter(Boolean)
                .join("\n");

            await sendInquiry({
                propertyId,
                propertyTitle,
                senderId: user?.uid || "guest",
                senderName: finalName,
                senderEmail: finalEmail,
                senderPhone: finalPhone,
                agentId: agentId || "sample-agent",
                agentName,
                message: applicationSummary,
                type: "inquiry",
            });

            if (agentEmail) {
                sendInquiryEmail({
                    propertyId,
                    agentName,
                    agentEmail,
                    senderName: finalName,
                    senderEmail: finalEmail,
                    senderPhone: finalPhone,
                    propertyTitle,
                    message: applicationSummary,
                    inquiryType: "inquiry",
                }).catch(() => {});
            }

            setSubmitted(true);
            toast.success("Digital Lease Application submitted! 🎉");
        } catch (err) {
            console.error("Lease application error:", err);
            toast.error("Failed to submit lease application. Please try again.");
        } finally {
            setSubmitting(false);
            setUploadProgress(null);
        }
    };

    const tierColor =
        affordability.tier === "comfortable"
            ? "#16a34a"
            : affordability.tier === "moderate"
            ? "#d97706"
            : "#dc2626";

    return (
        <div
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 1200,
                background: "rgba(10, 14, 26, 0.72)",
                backdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "1rem",
            }}
        >
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="lease-modal-title"
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: "100%",
                    maxWidth: "620px",
                    maxHeight: "90vh",
                    overflowY: "auto",
                    background: "var(--bg-card)",
                    color: "var(--text-primary)",
                    borderRadius: "18px",
                    border: "1px solid rgba(212, 160, 23, 0.3)",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                }}
            >
                {/* Header */}
                <div
                    style={{
                        padding: "1.25rem 1.5rem",
                        background: "linear-gradient(135deg, #0a0e1a, #1a2340)",
                        color: "#ffffff",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <span
                            style={{
                                fontSize: "0.7rem",
                                fontWeight: 800,
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                color: "#eab308",
                            }}
                        >
                            Kenyan Digital Tenancy Workflow
                        </span>
                        <h3 id="lease-modal-title" style={{ margin: "2px 0 0", fontSize: "1.15rem" }}>
                            📝 Digital Lease Application
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close lease application modal"
                        style={{
                            background: "rgba(255,255,255,0.12)",
                            color: "#fff",
                            border: "none",
                            width: "34px",
                            height: "34px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            fontWeight: 700,
                        }}
                    >
                        ✕
                    </button>
                </div>

                <div style={{ padding: "1.4rem 1.5rem" }}>
                    {submitted ? (
                        <div style={{ textAlign: "center", padding: "1rem 0" }}>
                            <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                            <h4 style={{ margin: "0 0 0.5rem", fontSize: "1.15rem" }}>
                                Application Delivered to {agentName}
                            </h4>
                            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                                Your tenancy profile for <strong>{propertyTitle}</strong> has been recorded. Want to lock the unit off-market while your lease agreement is drafted?
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "0.75rem",
                                    justifyContent: "center",
                                    marginTop: "1.25rem",
                                }}
                            >
                                {onOpenHoldingDeposit && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            onClose();
                                            onOpenHoldingDeposit(monthlyRentKES);
                                        }}
                                        style={{
                                            padding: "0.75rem 1.25rem",
                                            borderRadius: "10px",
                                            border: "none",
                                            background: "linear-gradient(135deg, #eab308, #ca8a04)",
                                            color: "#0a0e1a",
                                            fontWeight: 800,
                                            fontSize: "0.88rem",
                                            cursor: "pointer",
                                        }}
                                    >
                                        💳 Pay 1-Month Holding Deposit ({formatDisplayPrice(monthlyRentKES)})
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={onClose}
                                    style={{
                                        padding: "0.75rem 1.25rem",
                                        borderRadius: "10px",
                                        border: "1px solid rgba(148,163,184,0.35)",
                                        background: "var(--bg-secondary)",
                                        color: "var(--text-primary)",
                                        fontWeight: 700,
                                        fontSize: "0.88rem",
                                        cursor: "pointer",
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {/* Contact Row */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: "0.75rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Full Legal Name *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={applicantName}
                                        onChange={(e) => setApplicantName(e.target.value)}
                                        placeholder="e.g. Wanjiku Mwangi"
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        value={applicantEmail}
                                        onChange={(e) => setApplicantEmail(e.target.value)}
                                        placeholder="you@example.com"
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Phone / WhatsApp *
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={applicantPhone}
                                        onChange={(e) => setApplicantPhone(e.target.value)}
                                        placeholder="+254 712 345 678"
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Employment & Income */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Employment / Lease Type
                                    </label>
                                    <select
                                        value={employmentType}
                                        onChange={(e) => setEmploymentType(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        <option>Employed (Permanent)</option>
                                        <option>Self-Employed / Business Director</option>
                                        <option>Diplomat / UN / NGO Contract</option>
                                        <option>Corporate / Company Lease</option>
                                        <option>Diaspora Returning Resident</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Employer / Organization
                                    </label>
                                    <input
                                        type="text"
                                        value={employerName}
                                        onChange={(e) => setEmployerName(e.target.value)}
                                        placeholder="e.g. Safaricom PLC / UNEP"
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Net Monthly Income (KES)
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step={5000}
                                        value={netMonthlyIncome}
                                        onChange={(e) => setNetMonthlyIncome(Number(e.target.value) || 0)}
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.75rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Live Affordability Pre-Check Pill */}
                            <div
                                style={{
                                    padding: "0.75rem 0.95rem",
                                    borderRadius: "10px",
                                    background: "var(--bg-secondary)",
                                    borderLeft: `4px solid ${tierColor}`,
                                    fontSize: "0.8rem",
                                }}
                            >
                                <div style={{ fontWeight: 800, color: tierColor }}>
                                    {affordability.label}
                                    {affordability.rentToIncomeRatioPct > 0
                                        ? ` (${affordability.rentToIncomeRatioPct}% RTI)`
                                        : ""}
                                </div>
                                <div style={{ color: "var(--text-secondary)", marginTop: "2px" }}>
                                    {affordability.guidance}
                                </div>
                            </div>

                            {/* Lease Terms */}
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Move-In Date
                                    </label>
                                    <input
                                        type="date"
                                        value={moveInDate}
                                        onChange={(e) => setMoveInDate(e.target.value)}
                                        style={{
                                            width: "100%",
                                            padding: "0.58rem 0.7rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Lease Duration
                                    </label>
                                    <select
                                        value={leaseMonths}
                                        onChange={(e) => setLeaseMonths(Number(e.target.value) as 6 | 12 | 24)}
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.7rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        <option value={6}>6 Months</option>
                                        <option value={12}>12 Months (Standard)</option>
                                        <option value={24}>24 Months</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Security Deposit
                                    </label>
                                    <select
                                        value={depositMonths}
                                        onChange={(e) => setDepositMonths(Number(e.target.value) as 1 | 2)}
                                        style={{
                                            width: "100%",
                                            padding: "0.6rem 0.7rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    >
                                        <option value={1}>1 Month Deposit</option>
                                        <option value={2}>2 Months Deposit</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                        Occupants
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        max={12}
                                        value={occupants}
                                        onChange={(e) => setOccupants(Math.max(1, Number(e.target.value) || 1))}
                                        style={{
                                            width: "100%",
                                            padding: "0.58rem 0.7rem",
                                            borderRadius: "8px",
                                            border: "1px solid rgba(148,163,184,0.35)",
                                            background: "var(--bg-secondary)",
                                            color: "var(--text-primary)",
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Document Uploads */}
                            <div
                                style={{
                                    padding: "0.85rem 1rem",
                                    borderRadius: "10px",
                                    border: "1px dashed rgba(212, 160, 23, 0.45)",
                                    background: "rgba(212, 160, 23, 0.04)",
                                }}
                            >
                                <div style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.5rem" }}>
                                    📎 Optional Fast-Track KYC Uploads (PDF / Image, max 20MB)
                                </div>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "0.65rem" }}>
                                    <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                        National ID / Passport
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                                            style={{ display: "block", marginTop: "4px", fontSize: "0.74rem", width: "100%" }}
                                        />
                                    </label>
                                    <label style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                                        Payslip / Bank or M-Pesa Statement
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={(e) => setIncomeFile(e.target.files?.[0] || null)}
                                            style={{ display: "block", marginTop: "4px", fontSize: "0.74rem", width: "100%" }}
                                        />
                                    </label>
                                </div>
                                {uploadProgress !== null && (
                                    <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--gold-500)" }}>
                                        Uploading encrypted tenant documents ({uploadProgress}%)...
                                    </div>
                                )}
                            </div>

                            {/* Notes */}
                            <div>
                                <label style={{ display: "block", fontSize: "0.76rem", fontWeight: 700, marginBottom: "4px" }}>
                                    Additional Requests (Pets, Parking, Furnishing)
                                </label>
                                <textarea
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="e.g. Requesting 2 parking bays and early key handover..."
                                    style={{
                                        width: "100%",
                                        padding: "0.6rem 0.75rem",
                                        borderRadius: "8px",
                                        border: "1px solid rgba(148,163,184,0.35)",
                                        background: "var(--bg-secondary)",
                                        color: "var(--text-primary)",
                                        resize: "vertical",
                                    }}
                                />
                            </div>

                            {/* Move-in Total Footer */}
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    flexWrap: "wrap",
                                    gap: "0.75rem",
                                    paddingTop: "0.6rem",
                                    borderTop: "1px solid rgba(148,163,184,0.2)",
                                }}
                            >
                                <div>
                                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary)" }}>
                                        Estimated Total Move-In ({depositMonths} mo deposit + 1st mo + utilities)
                                    </div>
                                    <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gold-500, #d4a017)" }}>
                                        {formatDisplayPrice(moveIn.totalMoveInKES)}
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    style={{
                                        padding: "0.75rem 1.4rem",
                                        borderRadius: "10px",
                                        border: "none",
                                        background: "linear-gradient(135deg, #eab308, #ca8a04)",
                                        color: "#0a0e1a",
                                        fontWeight: 800,
                                        fontSize: "0.9rem",
                                        cursor: submitting ? "wait" : "pointer",
                                    }}
                                >
                                    {submitting ? "Submitting Application..." : "Submit Lease Application →"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
