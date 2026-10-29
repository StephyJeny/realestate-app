"use client";

import React, { useMemo, useState } from "react";
import { useCurrency } from "@/context/CurrencyContext";
import {
    calculateMoveInCosts,
    calculateShortStayQuote,
} from "@/lib/rentalWorkflow";

interface RentalExperiencePanelProps {
    propertyTitle: string;
    propertyType: string;
    monthlyRentKES: number;
    onOpenLeaseModal: () => void;
    onBookShortStay: (params: {
        totalKES: number;
        nights: number;
        checkIn: string;
        checkOut: string;
        guests: number;
    }) => void;
    onPayMoveInDeposit: (depositKES: number) => void;
}

export default function RentalExperiencePanel({
    propertyTitle,
    propertyType,
    monthlyRentKES,
    onOpenLeaseModal,
    onBookShortStay,
    onPayMoveInDeposit,
}: RentalExperiencePanelProps) {
    const { formatCurrencyFull: formatDisplayPrice } = useCurrency();
    const [mode, setMode] = useState<"long_term" | "short_stay">("long_term");

    // Long-Term Move-In state
    const [depositMonths, setDepositMonths] = useState<1 | 2>(2);
    const [includeUtility, setIncludeUtility] = useState(true);
    const [includeStamp, setIncludeStamp] = useState(false);

    // Short-Stay Calendar state
    const defaultDates = useMemo(() => {
        const start = new Date();
        start.setDate(start.getDate() + 5);
        const end = new Date(start);
        end.setDate(end.getDate() + 5);
        return {
            checkIn: start.toISOString().slice(0, 10),
            checkOut: end.toISOString().slice(0, 10),
        };
    }, []);

    const [checkIn, setCheckIn] = useState(defaultDates.checkIn);
    const [checkOut, setCheckOut] = useState(defaultDates.checkOut);
    const [guests, setGuests] = useState(2);

    const moveIn = useMemo(
        () =>
            calculateMoveInCosts({
                monthlyRentKES,
                securityDepositMonths: depositMonths,
                includeUtilityDeposit: includeUtility,
                includeLeaseStampPct: includeStamp,
                propertyType,
            }),
        [monthlyRentKES, depositMonths, includeUtility, includeStamp, propertyType]
    );

    const shortStay = useMemo(
        () =>
            calculateShortStayQuote({
                monthlyRentKES,
                checkInDate: checkIn,
                checkOutDate: checkOut,
                guests,
            }),
        [monthlyRentKES, checkIn, checkOut, guests]
    );

    return (
        <section
            style={{
                background: "var(--bg-card)",
                border: "1px solid rgba(212, 160, 23, 0.28)",
                borderRadius: "16px",
                padding: "1.5rem",
                marginTop: "1.75rem",
            }}
            aria-label="Rental & Short-Stay Booking Hub"
        >
            {/* Header & Mode Switcher */}
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.85rem",
                    marginBottom: "1.2rem",
                }}
            >
                <div>
                    <span
                        style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            color: "var(--gold-500, #d4a017)",
                        }}
                    >
                        Tenant &amp; Executive Stay Suite
                    </span>
                    <h3 style={{ margin: "2px 0 0", fontSize: "1.18rem", fontWeight: 700, color: "var(--text-primary)" }}>
                        🔑 Lease Move-In &amp; Short-Stay Booking
                    </h3>
                </div>

                <div
                    style={{
                        display: "inline-flex",
                        background: "var(--bg-secondary)",
                        padding: "4px",
                        borderRadius: "999px",
                        border: "1px solid rgba(148,163,184,0.25)",
                    }}
                >
                    <button
                        type="button"
                        onClick={() => setMode("long_term")}
                        style={{
                            padding: "0.45rem 0.95rem",
                            borderRadius: "999px",
                            border: "none",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            background: mode === "long_term" ? "var(--gold-500, #d4a017)" : "transparent",
                            color: mode === "long_term" ? "#0a0e1a" : "var(--text-secondary)",
                        }}
                    >
                        🏠 Long-Term Lease
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode("short_stay")}
                        style={{
                            padding: "0.45rem 0.95rem",
                            borderRadius: "999px",
                            border: "none",
                            fontSize: "0.8rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            background: mode === "short_stay" ? "var(--gold-500, #d4a017)" : "transparent",
                            color: mode === "short_stay" ? "#0a0e1a" : "var(--text-secondary)",
                        }}
                    >
                        🗓️ Short-Stay Calendar
                    </button>
                </div>
            </div>

            {mode === "long_term" ? (
                <div>
                    <p style={{ margin: "0 0 1rem", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                        Transparent Kenyan tenancy move-in cost breakdown for <strong>{propertyTitle}</strong>. Customize security deposit months and utility meter deposits below.
                    </p>

                    {/* Controls */}
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "0.85rem",
                            alignItems: "center",
                            marginBottom: "1rem",
                        }}
                    >
                        <div style={{ display: "inline-flex", gap: "0.4rem", alignItems: "center" }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>Security Deposit:</span>
                            {([1, 2] as const).map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setDepositMonths(m)}
                                    style={{
                                        padding: "0.35rem 0.75rem",
                                        borderRadius: "8px",
                                        border:
                                            depositMonths === m
                                                ? "1.5px solid var(--gold-500, #d4a017)"
                                                : "1px solid rgba(148,163,184,0.3)",
                                        background:
                                            depositMonths === m
                                                ? "rgba(212, 160, 23, 0.14)"
                                                : "var(--bg-secondary)",
                                        color: "var(--text-primary)",
                                        fontSize: "0.78rem",
                                        fontWeight: 700,
                                        cursor: "pointer",
                                    }}
                                >
                                    {m} {m === 1 ? "Month" : "Months"}
                                </button>
                            ))}
                        </div>

                        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={includeUtility}
                                onChange={(e) => setIncludeUtility(e.target.checked)}
                            />
                            KPLC &amp; Water Deposit
                        </label>

                        <label style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", cursor: "pointer" }}>
                            <input
                                type="checkbox"
                                checked={includeStamp}
                                onChange={(e) => setIncludeStamp(e.target.checked)}
                            />
                            Lease Stamp Duty (1% p.a.)
                        </label>
                    </div>

                    {/* Breakdown Rows */}
                    <div
                        style={{
                            background: "var(--bg-secondary)",
                            borderRadius: "12px",
                            padding: "1rem 1.1rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.55rem",
                            fontSize: "0.85rem",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-secondary)" }}>1st Month Rent (Advance)</span>
                            <strong>{formatDisplayPrice(moveIn.firstMonthRentKES)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-secondary)" }}>
                                Refundable Security Deposit ({moveIn.securityDepositMonths} mo)
                            </span>
                            <strong>{formatDisplayPrice(moveIn.securityDepositKES)}</strong>
                        </div>
                        {moveIn.utilityDepositKES > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>
                                    KPLC Electricity &amp; Water Meter Deposit (Refundable)
                                </span>
                                <strong>{formatDisplayPrice(moveIn.utilityDepositKES)}</strong>
                            </div>
                        )}
                        {moveIn.leaseStampAndLegalKES > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ color: "var(--text-secondary)" }}>
                                    Lease Registration / Stamp Allowance
                                </span>
                                <strong>{formatDisplayPrice(moveIn.leaseStampAndLegalKES)}</strong>
                            </div>
                        )}
                        <div
                            style={{
                                borderTop: "1px solid rgba(148,163,184,0.25)",
                                paddingTop: "0.65rem",
                                marginTop: "0.2rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>Total Cash to Move In</div>
                                <div style={{ fontSize: "0.73rem", color: "#16a34a", fontWeight: 600 }}>
                                    Includes {formatDisplayPrice(moveIn.refundablePortionKES)} refundable at lease end
                                </div>
                            </div>
                            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--gold-500, #d4a017)" }}>
                                {formatDisplayPrice(moveIn.totalMoveInKES)}
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1.1rem" }}>
                        <button
                            type="button"
                            onClick={onOpenLeaseModal}
                            style={{
                                flex: "1 1 220px",
                                padding: "0.8rem 1.2rem",
                                borderRadius: "10px",
                                border: "none",
                                background: "linear-gradient(135deg, #eab308, #ca8a04)",
                                color: "#0a0e1a",
                                fontWeight: 800,
                                fontSize: "0.88rem",
                                cursor: "pointer",
                            }}
                        >
                            📝 Apply for Digital Lease (ID &amp; Income Upload)
                        </button>
                        <button
                            type="button"
                            onClick={() => onPayMoveInDeposit(monthlyRentKES)}
                            style={{
                                flex: "1 1 200px",
                                padding: "0.8rem 1.2rem",
                                borderRadius: "10px",
                                border: "1px solid rgba(212, 160, 23, 0.45)",
                                background: "transparent",
                                color: "var(--text-primary)",
                                fontWeight: 700,
                                fontSize: "0.86rem",
                                cursor: "pointer",
                            }}
                        >
                            💳 Pay Holding Deposit ({formatDisplayPrice(monthlyRentKES)})
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <p style={{ margin: "0 0 1rem", fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                        Need a furnished executive stay, diaspora visit, or relocation bridge? Select your check-in and check-out dates for instant M-Pesa or Card checkout.
                    </p>

                    <div
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                            gap: "0.75rem",
                            marginBottom: "1rem",
                        }}
                    >
                        <div>
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, marginBottom: "4px" }}>
                                Check-In Date
                            </label>
                            <input
                                type="date"
                                value={checkIn}
                                onChange={(e) => setCheckIn(e.target.value)}
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
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, marginBottom: "4px" }}>
                                Check-Out Date
                            </label>
                            <input
                                type="date"
                                value={checkOut}
                                min={checkIn}
                                onChange={(e) => setCheckOut(e.target.value)}
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
                            <label style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, marginBottom: "4px" }}>
                                Guests
                            </label>
                            <select
                                value={guests}
                                onChange={(e) => setGuests(Number(e.target.value))}
                                style={{
                                    width: "100%",
                                    padding: "0.6rem 0.7rem",
                                    borderRadius: "8px",
                                    border: "1px solid rgba(148,163,184,0.35)",
                                    background: "var(--bg-secondary)",
                                    color: "var(--text-primary)",
                                }}
                            >
                                {[1, 2, 3, 4, 5, 6, 8].map((g) => (
                                    <option key={g} value={g}>
                                        {g} {g === 1 ? "Guest" : "Guests"}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Short-Stay Quote Breakdown */}
                    <div
                        style={{
                            background: "var(--bg-secondary)",
                            borderRadius: "12px",
                            padding: "1rem 1.1rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.5rem",
                            fontSize: "0.85rem",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-secondary)" }}>
                                {formatDisplayPrice(shortStay.baseNightlyRateKES)} × {shortStay.nights}{" "}
                                {shortStay.nights === 1 ? "night" : "nights"}
                            </span>
                            <strong>{formatDisplayPrice(shortStay.grossAccommodationKES)}</strong>
                        </div>
                        {shortStay.discountAmountKES > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a" }}>
                                <span>
                                    ✨ {shortStay.discountPct}%{" "}
                                    {shortStay.discountTier === "monthly_25" ? "Monthly Executive" : "Weekly"} Stay Discount
                                </span>
                                <strong>-{formatDisplayPrice(shortStay.discountAmountKES)}</strong>
                            </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-secondary)" }}>Housekeeping &amp; Linen Turnaround</span>
                            <strong>{formatDisplayPrice(shortStay.cleaningFeeKES)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-secondary)" }}>EstateVue Escrow Protection (5%)</span>
                            <strong>{formatDisplayPrice(shortStay.serviceFeeKES)}</strong>
                        </div>
                        <div
                            style={{
                                borderTop: "1px solid rgba(148,163,184,0.25)",
                                paddingTop: "0.65rem",
                                marginTop: "0.2rem",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div>
                                <div style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                                    Total Short-Stay ({shortStay.nights} {shortStay.nights === 1 ? "night" : "nights"})
                                </div>
                                <div style={{ fontSize: "0.73rem", color: "var(--text-tertiary)" }}>
                                    Effective {formatDisplayPrice(shortStay.effectiveNightlyKES)}/night · Free 7+ night 10% &amp; 28+ night 25% discounts
                                </div>
                            </div>
                            <span style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--gold-500, #d4a017)" }}>
                                {formatDisplayPrice(shortStay.totalStayKES)}
                            </span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            onBookShortStay({
                                totalKES: shortStay.totalStayKES,
                                nights: shortStay.nights,
                                checkIn,
                                checkOut,
                                guests,
                            })
                        }
                        style={{
                            width: "100%",
                            marginTop: "1rem",
                            padding: "0.85rem 1.2rem",
                            borderRadius: "10px",
                            border: "none",
                            background: "linear-gradient(135deg, #eab308, #ca8a04)",
                            color: "#0a0e1a",
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                        }}
                    >
                        💳 Book &amp; Pay {shortStay.nights}-Night Stay ({formatDisplayPrice(shortStay.totalStayKES)})
                    </button>
                </div>
            )}
        </section>
    );
}
