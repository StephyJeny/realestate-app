"use client";
import React, { useState, useMemo } from "react";
import { useCurrency } from "@/context/CurrencyContext";

interface InvestmentCalculatorProps {
    propertyPrice: number;
    listingType?: string;
    propertyTitle?: string;
}

export default function InvestmentCalculator({
    propertyPrice,
    listingType = "sale",
    propertyTitle,
}: InvestmentCalculatorProps) {
    const { formatCurrency, formatCurrencyFull, currency } = useCurrency();

    // Mode: "long_term" (monthly tenant) vs "short_term" (Airbnb / serviced)
    const [strategy, setStrategy] = useState<"long_term" | "short_term">("long_term");

    // Financial parameters
    const [price, setPrice] = useState<number>(propertyPrice || 15000000);
    const [downPaymentPct, setDownPaymentPct] = useState<number>(25);
    const [interestRate, setInterestRate] = useState<number>(12.5);
    const [loanYears, setLoanYears] = useState<number>(20);
    const [isCashPurchase, setIsCashPurchase] = useState<boolean>(false);

    // Rental revenue inputs (seeded with realistic Kenyan market defaults)
    // Long-term: approx 0.6% - 0.9% of value per month
    const defaultMonthlyRent = Math.round(propertyPrice * 0.007);
    const [monthlyRent, setMonthlyRent] = useState<number>(defaultMonthlyRent);

    // Short-term (Airbnb): nightly rate + occupancy
    const defaultNightlyRate = Math.max(4500, Math.round(propertyPrice * 0.00045));
    const [nightlyRate, setNightlyRate] = useState<number>(defaultNightlyRate);
    const [occupancyRate, setOccupancyRate] = useState<number>(65); // 65% occupancy

    // Operating expenses
    const [monthlyServiceCharge, setMonthlyServiceCharge] = useState<number>(12000);
    const [managementFeePct, setManagementFeePct] = useState<number>(strategy === "short_term" ? 18 : 8);
    const [annualInsuranceAndRates, setAnnualInsuranceAndRates] = useState<number>(35000);
    const [annualMaintenanceBudget, setAnnualMaintenanceBudget] = useState<number>(Math.round(propertyPrice * 0.005));

    // Update management fee default when strategy switches
    const handleStrategyChange = (newStrategy: "long_term" | "short_term") => {
        setStrategy(newStrategy);
        setManagementFeePct(newStrategy === "short_term" ? 18 : 8);
    };

    // Calculate revenue
    const annualGrossRevenue = useMemo(() => {
        if (strategy === "long_term") {
            return monthlyRent * 12;
        } else {
            const bookedNights = Math.round(365 * (occupancyRate / 100));
            return bookedNights * nightlyRate;
        }
    }, [strategy, monthlyRent, nightlyRate, occupancyRate]);

    const monthlyGrossRevenue = annualGrossRevenue / 12;

    // Operating expenses
    const annualServiceCharge = monthlyServiceCharge * 12;
    const annualManagementFee = annualGrossRevenue * (managementFeePct / 100);
    const totalAnnualOperatingExpenses =
        annualServiceCharge +
        annualManagementFee +
        annualInsuranceAndRates +
        annualMaintenanceBudget;

    // Net Operating Income (NOI) before debt service
    const annualNOI = Math.max(0, annualGrossRevenue - totalAnnualOperatingExpenses);

    // Debt service / Mortgage calculation
    const downPaymentAmount = isCashPurchase ? price : price * (downPaymentPct / 100);
    const loanAmount = isCashPurchase ? 0 : price - downPaymentAmount;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanYears * 12;

    const monthlyDebtService = useMemo(() => {
        if (isCashPurchase || loanAmount <= 0) return 0;
        if (monthlyRate === 0) return loanAmount / totalMonths;
        const factor = Math.pow(1 + monthlyRate, totalMonths);
        return (loanAmount * monthlyRate * factor) / (factor - 1);
    }, [isCashPurchase, loanAmount, monthlyRate, totalMonths]);

    const annualDebtService = monthlyDebtService * 12;

    // Net Annual Cash Flow after mortgage
    const annualNetCashFlow = annualNOI - annualDebtService;
    const monthlyNetCashFlow = annualNetCashFlow / 12;

    // ROI Metrics
    const grossRentalYield = price > 0 ? (annualGrossRevenue / price) * 100 : 0;
    const netCapRate = price > 0 ? (annualNOI / price) * 100 : 0;
    const cashOnCashReturn =
        downPaymentAmount > 0 ? (annualNetCashFlow / downPaymentAmount) * 100 : 0;

    // 5-Year Capital Appreciation estimate (historical Kenya prime residential ~7% p.a.)
    const appreciationRate = 0.07;
    const projectedValue5Yr = price * Math.pow(1 + appreciationRate, 5);
    const projectedCapitalGain5Yr = projectedValue5Yr - price;
    const projectedTotalReturn5Yr = projectedCapitalGain5Yr + annualNetCashFlow * 5;

    return (
        <div style={{
            background: "var(--bg-secondary, #f8f9fb)",
            border: "1px solid var(--border-color, #e2e6ee)",
            borderRadius: "var(--radius-lg, 16px)",
            padding: "1.75rem",
            marginTop: "1.75rem",
        }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-heading, #0f1629)", margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <span>📈</span> Investor ROI & Rental Yield Calculator
                    </h3>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-tertiary, #64748b)", margin: "4px 0 0" }}>
                        Analyze cash-on-cash return, net yield, and short-term Airbnb vs. long-term tenant performance.
                    </p>
                </div>

                {/* Strategy Toggle */}
                <div style={{
                    display: "inline-flex",
                    background: "var(--bg-primary, #ffffff)",
                    padding: "3px",
                    borderRadius: "10px",
                    border: "1px solid var(--border-color, #e2e6ee)",
                }}>
                    <button
                        type="button"
                        onClick={() => handleStrategyChange("long_term")}
                        style={{
                            padding: "0.45rem 0.9rem",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: strategy === "long_term" ? "var(--gold-500, #d4a017)" : "transparent",
                            color: strategy === "long_term" ? "#ffffff" : "var(--text-secondary, #475569)",
                        }}
                    >
                        🏢 Long-Term Lease
                    </button>
                    <button
                        type="button"
                        onClick={() => handleStrategyChange("short_term")}
                        style={{
                            padding: "0.45rem 0.9rem",
                            borderRadius: "8px",
                            border: "none",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: strategy === "short_term" ? "var(--gold-500, #d4a017)" : "transparent",
                            color: strategy === "short_term" ? "#ffffff" : "var(--text-secondary, #475569)",
                        }}
                    >
                        🏖️ Short-Term / Airbnb
                    </button>
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: "1rem",
                marginBottom: "1.75rem",
            }}>
                <div style={{
                    background: "var(--bg-primary, #ffffff)",
                    borderRadius: "12px",
                    padding: "1rem",
                    border: "1px solid var(--border-light, #eef2f6)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary, #64748b)", fontWeight: 600 }}>GROSS YIELD</div>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--gold-600, #b8860b)", marginTop: "2px" }}>
                        {grossRentalYield.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #64748b)", marginTop: "2px" }}>
                        Gross Rev / Value
                    </div>
                </div>

                <div style={{
                    background: "var(--bg-primary, #ffffff)",
                    borderRadius: "12px",
                    padding: "1rem",
                    border: "1px solid var(--border-light, #eef2f6)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary, #64748b)", fontWeight: 600 }}>NET CAP RATE</div>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--success, #10b981)", marginTop: "2px" }}>
                        {netCapRate.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #64748b)", marginTop: "2px" }}>
                        NOI / Purchase Price
                    </div>
                </div>

                <div style={{
                    background: "var(--bg-primary, #ffffff)",
                    borderRadius: "12px",
                    padding: "1rem",
                    border: "1px solid var(--border-light, #eef2f6)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary, #64748b)", fontWeight: 600 }}>CASH-ON-CASH</div>
                    <div style={{ fontSize: "1.45rem", fontWeight: 800, color: cashOnCashReturn >= 0 ? "var(--primary, #0f1629)" : "var(--error, #ef4444)", marginTop: "2px" }}>
                        {cashOnCashReturn.toFixed(1)}%
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #64748b)", marginTop: "2px" }}>
                        Annual Cash Flow / Equity
                    </div>
                </div>

                <div style={{
                    background: "var(--bg-primary, #ffffff)",
                    borderRadius: "12px",
                    padding: "1rem",
                    border: "1px solid var(--border-light, #eef2f6)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-tertiary, #64748b)", fontWeight: 600 }}>NET MONTHLY FLOW</div>
                    <div style={{ fontSize: "1.3rem", fontWeight: 800, color: monthlyNetCashFlow >= 0 ? "var(--success, #10b981)" : "var(--error, #ef4444)", marginTop: "4px" }}>
                        {monthlyNetCashFlow >= 0 ? "+" : ""}{formatCurrency(Math.round(monthlyNetCashFlow))}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #64748b)", marginTop: "2px" }}>
                        After mortgage & expenses
                    </div>
                </div>
            </div>

            {/* Interactive Sliders & Inputs */}
            <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1.5rem",
                background: "var(--bg-primary, #ffffff)",
                padding: "1.25rem",
                borderRadius: "12px",
                border: "1px solid var(--border-light, #eef2f6)",
                marginBottom: "1.5rem",
            }}>
                {/* Column 1: Revenue Parameters */}
                <div>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #1e293b)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>💰</span> Revenue Parameters ({strategy === "long_term" ? "Long-Term" : "Airbnb"})
                    </h4>

                    {strategy === "long_term" ? (
                        <div style={{ marginBottom: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                <span style={{ color: "var(--text-secondary, #475569)" }}>Expected Monthly Rent</span>
                                <span style={{ color: "var(--gold-600, #b8860b)" }}>{formatCurrencyFull(monthlyRent)}</span>
                            </div>
                            <input
                                type="range"
                                min={Math.round(price * 0.003)}
                                max={Math.round(price * 0.015)}
                                step={5000}
                                value={monthlyRent}
                                onChange={(e) => setMonthlyRent(Number(e.target.value))}
                                style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                            />
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: "0.85rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                    <span style={{ color: "var(--text-secondary, #475569)" }}>Nightly Rate</span>
                                    <span style={{ color: "var(--gold-600, #b8860b)" }}>{formatCurrencyFull(nightlyRate)}/night</span>
                                </div>
                                <input
                                    type="range"
                                    min={3000}
                                    max={60000}
                                    step={500}
                                    value={nightlyRate}
                                    onChange={(e) => setNightlyRate(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                                />
                            </div>

                            <div style={{ marginBottom: "0.85rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                    <span style={{ color: "var(--text-secondary, #475569)" }}>Occupancy Rate</span>
                                    <span style={{ color: "var(--primary, #0f1629)" }}>{occupancyRate}% (~{Math.round(30 * (occupancyRate / 100))} nights/mo)</span>
                                </div>
                                <input
                                    type="range"
                                    min={20}
                                    max={95}
                                    step={5}
                                    value={occupancyRate}
                                    onChange={(e) => setOccupancyRate(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                                />
                            </div>
                        </>
                    )}

                    <div style={{ marginBottom: "0.85rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                            <span style={{ color: "var(--text-secondary, #475569)" }}>Management Fee</span>
                            <span style={{ color: "var(--text-primary, #0f1629)" }}>{managementFeePct}%</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={30}
                            step={1}
                            value={managementFeePct}
                            onChange={(e) => setManagementFeePct(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                        />
                    </div>

                    <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                            <span style={{ color: "var(--text-secondary, #475569)" }}>Monthly Service Charge (HOA)</span>
                            <span style={{ color: "var(--text-primary, #0f1629)" }}>{formatCurrencyFull(monthlyServiceCharge)}</span>
                        </div>
                        <input
                            type="range"
                            min={0}
                            max={50000}
                            step={2000}
                            value={monthlyServiceCharge}
                            onChange={(e) => setMonthlyServiceCharge(Number(e.target.value))}
                            style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                        />
                    </div>
                </div>

                {/* Column 2: Purchase & Financing */}
                <div>
                    <h4 style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary, #1e293b)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>🏦</span> Purchase & Financing
                    </h4>

                    {/* Cash vs Mortgage checkbox */}
                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary, #475569)", marginBottom: "0.85rem", cursor: "pointer" }}>
                        <input
                            type="checkbox"
                            checked={isCashPurchase}
                            onChange={(e) => setIsCashPurchase(e.target.checked)}
                            style={{ accentColor: "var(--gold-500, #d4a017)", width: "16px", height: "16px" }}
                        />
                        100% All-Cash Purchase (No Mortgage Debt)
                    </label>

                    {!isCashPurchase && (
                        <>
                            <div style={{ marginBottom: "0.85rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                    <span style={{ color: "var(--text-secondary, #475569)" }}>Down Payment (%)</span>
                                    <span style={{ color: "var(--gold-600, #b8860b)" }}>{downPaymentPct}% ({formatCurrency(downPaymentAmount)})</span>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={60}
                                    step={5}
                                    value={downPaymentPct}
                                    onChange={(e) => setDownPaymentPct(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                                />
                            </div>

                            <div style={{ marginBottom: "0.85rem" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                    <span style={{ color: "var(--text-secondary, #475569)" }}>Mortgage Interest Rate</span>
                                    <span style={{ color: "var(--primary, #0f1629)" }}>{interestRate}% p.a.</span>
                                </div>
                                <input
                                    type="range"
                                    min={8}
                                    max={20}
                                    step={0.5}
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                                />
                            </div>

                            <div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", fontWeight: 600, marginBottom: "0.3rem" }}>
                                    <span style={{ color: "var(--text-secondary, #475569)" }}>Loan Tenure</span>
                                    <span style={{ color: "var(--primary, #0f1629)" }}>{loanYears} Years</span>
                                </div>
                                <input
                                    type="range"
                                    min={5}
                                    max={30}
                                    step={5}
                                    value={loanYears}
                                    onChange={(e) => setLoanYears(Number(e.target.value))}
                                    style={{ width: "100%", accentColor: "var(--gold-500, #d4a017)" }}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* 5-Year Wealth Projections Box */}
            <div style={{
                background: "linear-gradient(135deg, rgba(212,160,23,0.08), rgba(15,22,41,0.04))",
                borderRadius: "12px",
                padding: "1.25rem",
                border: "1px solid rgba(212,160,23,0.25)",
            }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
                    <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading, #0f1629)", margin: 0, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <span>🔮</span> 5-Year Capital Appreciation & Total Return Projection
                    </h4>
                    <span style={{ fontSize: "0.75rem", background: "rgba(212,160,23,0.15)", color: "var(--gold-600, #b8860b)", padding: "3px 8px", borderRadius: "50px", fontWeight: 600 }}>
                        Estimated @ 7.0% p.a. Growth
                    </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
                    <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)" }}>Current Property Value</div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-primary, #0f1629)" }}>{formatCurrencyFull(price)}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)" }}>Projected Value in 5 Yrs</div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--gold-600, #b8860b)" }}>{formatCurrencyFull(Math.round(projectedValue5Yr))}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)" }}>5-Yr Capital Gain</div>
                        <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--success, #10b981)" }}>+{formatCurrencyFull(Math.round(projectedCapitalGain5Yr))}</div>
                    </div>

                    <div>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-tertiary, #64748b)" }}>Total Projected Gain (Equity + Yield)</div>
                        <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--gold-600, #b8860b)" }}>+{formatCurrencyFull(Math.round(projectedTotalReturn5Yr))}</div>
                    </div>
                </div>

                <p style={{ fontSize: "0.72rem", color: "var(--text-tertiary, #64748b)", margin: "0.75rem 0 0", lineHeight: 1.5 }}>
                    * Projections are indicative based on historical Nairobi metropolitan property appreciation indices. Actual market returns may vary according to inflation, currency movements, and infrastructure completion.
                </p>
            </div>
        </div>
    );
}
