"use client";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

function formatKES(n: number): string {
    return n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

function MortgageCalculatorContent() {
    const searchParams = useSearchParams();
    const initialPrice = Number(searchParams.get("price")) || 15000000;

    const [propertyPrice, setPropertyPrice] = useState(initialPrice);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [interestRate, setInterestRate] = useState(12.5);
    const [loanTerm, setLoanTerm] = useState(25);
    const [showAmortization, setShowAmortization] = useState(false);

    // Derived values
    const downPaymentAmount = Math.round(propertyPrice * (downPaymentPercent / 100));
    const loanAmount = propertyPrice - downPaymentAmount;
    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = loanTerm * 12;

    // Monthly payment calculation (PMT formula)
    const monthlyPayment = useMemo(() => {
        if (loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) return 0;
        if (monthlyRate === 0) return loanAmount / totalMonths;
        const factor = Math.pow(1 + monthlyRate, totalMonths);
        return (loanAmount * monthlyRate * factor) / (factor - 1);
    }, [loanAmount, monthlyRate, totalMonths, interestRate, loanTerm]);

    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - loanAmount;
    const principalPercent = totalPayment > 0 ? (loanAmount / totalPayment) * 100 : 50;

    // Amortization schedule (annual summary)
    const amortizationSchedule = useMemo(() => {
        if (loanAmount <= 0 || monthlyPayment <= 0) return [];

        const schedule: {
            year: number;
            principalPaid: number;
            interestPaid: number;
            balance: number;
        }[] = [];

        let balance = loanAmount;
        let yearPrincipal = 0;
        let yearInterest = 0;

        for (let m = 1; m <= totalMonths; m++) {
            const interestPortion = balance * monthlyRate;
            const principalPortion = monthlyPayment - interestPortion;
            balance = Math.max(0, balance - principalPortion);
            yearPrincipal += principalPortion;
            yearInterest += interestPortion;

            if (m % 12 === 0 || m === totalMonths) {
                schedule.push({
                    year: Math.ceil(m / 12),
                    principalPaid: Math.round(yearPrincipal),
                    interestPaid: Math.round(yearInterest),
                    balance: Math.round(balance),
                });
                yearPrincipal = 0;
                yearInterest = 0;
            }
        }

        return schedule;
    }, [loanAmount, monthlyPayment, monthlyRate, totalMonths]);

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <h1 className={styles.heroTitle}>🏠 Mortgage Calculator</h1>
                <p className={styles.heroSub}>
                    Calculate your estimated monthly payments and see a full breakdown of your mortgage.
                </p>
            </div>

            <div className={styles.layout}>
                {/* Left — Inputs */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                        <h2 className={styles.cardTitle}>Loan Details</h2>
                    </div>
                    <div className={styles.cardBody}>
                        {/* Property Price */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Property Price
                                <span className={styles.labelValue}>KES {formatKES(propertyPrice)}</span>
                            </label>
                            <div className={styles.inputWrap}>
                                <span className={styles.inputPrefix}>KES</span>
                                <input
                                    type="number"
                                    className={`${styles.input} ${styles.inputWithPrefix}`}
                                    value={propertyPrice || ""}
                                    onChange={(e) => setPropertyPrice(Number(e.target.value) || 0)}
                                />
                            </div>
                            <div className={styles.rangeWrap}>
                                <input
                                    type="range"
                                    className={styles.rangeInput}
                                    min={500000}
                                    max={500000000}
                                    step={500000}
                                    value={propertyPrice}
                                    onChange={(e) => setPropertyPrice(Number(e.target.value))}
                                />
                                <div className={styles.rangeLabels}>
                                    <span>500K</span>
                                    <span>500M</span>
                                </div>
                            </div>
                        </div>

                        {/* Down Payment */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Down Payment
                                <span className={styles.labelValue}>KES {formatKES(downPaymentAmount)} ({downPaymentPercent}%)</span>
                            </label>
                            <div className={styles.dpRow}>
                                <div className={styles.inputWrap}>
                                    <span className={styles.inputPrefix}>KES</span>
                                    <input
                                        type="number"
                                        className={`${styles.input} ${styles.inputWithPrefix}`}
                                        value={downPaymentAmount || ""}
                                        onChange={(e) => {
                                            const val = Number(e.target.value) || 0;
                                            const pct = propertyPrice > 0 ? Math.round((val / propertyPrice) * 100) : 0;
                                            setDownPaymentPercent(Math.min(pct, 90));
                                        }}
                                    />
                                </div>
                                <span className={styles.dpSep}>or</span>
                                <div className={styles.inputWrap}>
                                    <input
                                        type="number"
                                        className={`${styles.input} ${styles.inputWithSuffix}`}
                                        value={downPaymentPercent}
                                        onChange={(e) => setDownPaymentPercent(Math.min(Number(e.target.value) || 0, 90))}
                                        min={0}
                                        max={90}
                                    />
                                    <span className={styles.inputSuffix}>%</span>
                                </div>
                            </div>
                            <div className={styles.rangeWrap}>
                                <input
                                    type="range"
                                    className={styles.rangeInput}
                                    min={0}
                                    max={90}
                                    step={1}
                                    value={downPaymentPercent}
                                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                                />
                                <div className={styles.rangeLabels}>
                                    <span>0%</span>
                                    <span>90%</span>
                                </div>
                            </div>
                        </div>

                        {/* Interest Rate */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Interest Rate (Annual)
                                <span className={styles.labelValue}>{interestRate}%</span>
                            </label>
                            <div className={styles.inputWrap}>
                                <input
                                    type="number"
                                    className={`${styles.input} ${styles.inputWithSuffix}`}
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                                    step={0.1}
                                    min={0.1}
                                    max={30}
                                />
                                <span className={styles.inputSuffix}>%</span>
                            </div>
                            <div className={styles.rangeWrap}>
                                <input
                                    type="range"
                                    className={styles.rangeInput}
                                    min={1}
                                    max={30}
                                    step={0.1}
                                    value={interestRate}
                                    onChange={(e) => setInterestRate(Number(e.target.value))}
                                />
                                <div className={styles.rangeLabels}>
                                    <span>1%</span>
                                    <span>30%</span>
                                </div>
                            </div>
                        </div>

                        {/* Loan Term */}
                        <div className={styles.formGroup}>
                            <label className={styles.label}>
                                Loan Term
                                <span className={styles.labelValue}>{loanTerm} years ({loanTerm * 12} months)</span>
                            </label>
                            <div className={styles.inputWrap}>
                                <input
                                    type="number"
                                    className={`${styles.input} ${styles.inputWithSuffix}`}
                                    value={loanTerm}
                                    onChange={(e) => setLoanTerm(Math.min(Number(e.target.value) || 1, 35))}
                                    min={1}
                                    max={35}
                                />
                                <span className={styles.inputSuffix}>yrs</span>
                            </div>
                            <div className={styles.rangeWrap}>
                                <input
                                    type="range"
                                    className={styles.rangeInput}
                                    min={1}
                                    max={35}
                                    step={1}
                                    value={loanTerm}
                                    onChange={(e) => setLoanTerm(Number(e.target.value))}
                                />
                                <div className={styles.rangeLabels}>
                                    <span>1 yr</span>
                                    <span>35 yrs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right — Results */}
                <div className={`${styles.card} ${styles.resultsCard}`}>
                    <div className={styles.cardHeader}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                        <h2 className={styles.cardTitle}>Payment Summary</h2>
                    </div>

                    {/* Monthly Payment */}
                    <div className={styles.resultMain}>
                        <div className={styles.resultLabel}>Monthly Payment</div>
                        <div className={styles.resultAmount}>
                            <span className={styles.resultCurrency}>KES</span>
                            {formatKES(Math.round(monthlyPayment))}
                            <span className={styles.resultPeriod}> / month</span>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className={styles.summaryGrid}>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryItemLabel}>Loan Amount</div>
                            <div className={styles.summaryItemValue}>KES {formatKES(loanAmount)}</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryItemLabel}>Total Interest</div>
                            <div className={styles.summaryItemValue}>KES {formatKES(Math.round(totalInterest))}</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryItemLabel}>Total Payment</div>
                            <div className={styles.summaryItemValue}>KES {formatKES(Math.round(totalPayment))}</div>
                        </div>
                        <div className={styles.summaryItem}>
                            <div className={styles.summaryItemLabel}>Down Payment</div>
                            <div className={styles.summaryItemValue}>KES {formatKES(downPaymentAmount)}</div>
                        </div>
                    </div>

                    {/* Breakdown Bar */}
                    <div className={styles.breakdownSection}>
                        <div className={styles.breakdownTitle}>Payment Breakdown</div>
                        <div className={styles.breakdownBar}>
                            <div
                                className={styles.breakdownPrincipal}
                                style={{ width: `${principalPercent}%` }}
                            />
                            <div
                                className={styles.breakdownInterest}
                                style={{ width: `${100 - principalPercent}%` }}
                            />
                        </div>
                        <div className={styles.breakdownLegend}>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendDot} ${styles.legendDotPrincipal}`} />
                                Principal
                                <span className={styles.legendValue}>
                                    ({principalPercent.toFixed(0)}%)
                                </span>
                            </div>
                            <div className={styles.legendItem}>
                                <div className={`${styles.legendDot} ${styles.legendDotInterest}`} />
                                Interest
                                <span className={styles.legendValue}>
                                    ({(100 - principalPercent).toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className={styles.ctaRow}>
                        <Link href="/properties" className={styles.ctaBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            Browse Properties
                        </Link>
                        <Link href="/agents" className={`${styles.ctaBtn} ${styles.ctaBtnOutline}`}>
                            Find an Agent
                        </Link>
                    </div>
                </div>

                {/* Amortization Schedule */}
                <div className={styles.amortSection}>
                    <button
                        className={styles.amortToggle}
                        onClick={() => setShowAmortization(!showAmortization)}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
                        {showAmortization ? "Hide" : "Show"} Amortization Schedule
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            style={{
                                transition: "transform 0.2s",
                                transform: showAmortization ? "rotate(180deg)" : "rotate(0deg)",
                            }}
                        >
                            <polyline points="6 9 12 15 18 9" />
                        </svg>
                    </button>

                    {showAmortization && amortizationSchedule.length > 0 && (
                        <div className={styles.tableWrap}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Principal Paid</th>
                                        <th>Interest Paid</th>
                                        <th>Remaining Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {amortizationSchedule.map((row) => (
                                        <tr key={row.year}>
                                            <td>Year {row.year}</td>
                                            <td>KES {formatKES(row.principalPaid)}</td>
                                            <td>KES {formatKES(row.interestPaid)}</td>
                                            <td>KES {formatKES(row.balance)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function MortgageCalculatorPage() {
    return (
        <Suspense
            fallback={
                <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", paddingTop: "var(--navbar-height)" }}>
                    <div style={{ width: 40, height: 40, border: "3px solid var(--border-color)", borderTopColor: "var(--navy-800)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
            }
        >
            <MortgageCalculatorContent />
        </Suspense>
    );
}
