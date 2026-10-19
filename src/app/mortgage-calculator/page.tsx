"use client";
import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import InvestmentCalculator from "@/components/property/InvestmentCalculator";
import { useAuth } from "@/context/AuthContext";
import { submitMortgagePreApproval } from "@/lib/firestore";
import toast from "react-hot-toast";
import styles from "./page.module.css";

function formatKES(n: number): string {
    return n.toLocaleString("en-KE", { maximumFractionDigits: 0 });
}

const KENYAN_LENDERS = [
    { name: "KCB Bank Kenya", rate: 12.5 },
    { name: "Stanbic Bank Kenya", rate: 12.2 },
    { name: "Absa Bank Kenya", rate: 12.4 },
    { name: "NCBA Bank", rate: 12.8 },
    { name: "Co-operative Bank", rate: 12.6 },
    { name: "KMRC Affordable Housing Scheme", rate: 9.5 },
];

function MortgageCalculatorContent() {
    const searchParams = useSearchParams();
    const { user, userProfile } = useAuth();
    const initialPrice = Number(searchParams.get("price")) || 15000000;
    const initialPropertyTitle = searchParams.get("propertyTitle") || "";
    const initialPropertyId = searchParams.get("propertyId") || "";

    const [calculatorMode, setCalculatorMode] = useState<"mortgage" | "roi">("mortgage");
    const [propertyPrice, setPropertyPrice] = useState(initialPrice);
    const [downPaymentPercent, setDownPaymentPercent] = useState(20);
    const [interestRate, setInterestRate] = useState(12.5);
    const [loanTerm, setLoanTerm] = useState(25);
    const [showAmortization, setShowAmortization] = useState(false);

    // Pre-Approval Application state
    const [showPreApprovalForm, setShowPreApprovalForm] = useState(false);
    const [applicantName, setApplicantName] = useState("");
    const [applicantEmail, setApplicantEmail] = useState("");
    const [applicantPhone, setApplicantPhone] = useState("");
    const [employmentType, setEmploymentType] = useState("Salaried Employment");
    const [monthlyNetIncome, setMonthlyNetIncome] = useState(350000);
    const [preferredBank, setPreferredBank] = useState(KENYAN_LENDERS[0].name);
    const [submittingPreApproval, setSubmittingPreApproval] = useState(false);
    const [preApprovalSubmitted, setPreApprovalSubmitted] = useState(false);

    const handleTogglePreApprovalForm = () => {
        if (!showPreApprovalForm && user) {
            setApplicantName((prev) => prev || userProfile?.displayName || user.displayName || "");
            setApplicantEmail((prev) => prev || user.email || "");
            setApplicantPhone((prev) => prev || userProfile?.phone || "");
        }
        setShowPreApprovalForm(!showPreApprovalForm);
    };

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
                <h1 className={styles.heroTitle}>
                    {calculatorMode === "mortgage" ? "🏠 Mortgage Calculator" : "📈 Investor Rental Yield & ROI"}
                </h1>
                <p className={styles.heroSub}>
                    {calculatorMode === "mortgage"
                        ? "Calculate your estimated monthly payments, amortization, and financing breakdown."
                        : "Analyze gross yield, net cap rate, cash-on-cash return, and short-term Airbnb vs long-term tenant performance."}
                </p>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
                <div style={{
                    display: "inline-flex",
                    background: "var(--bg-secondary, #f1f5f9)",
                    padding: "4px",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color, #e2e6ee)",
                }}>
                    <button
                        type="button"
                        onClick={() => setCalculatorMode("mortgage")}
                        style={{
                            padding: "0.6rem 1.25rem",
                            borderRadius: "9px",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: calculatorMode === "mortgage" ? "var(--primary, #0f1629)" : "transparent",
                            color: calculatorMode === "mortgage" ? "#ffffff" : "var(--text-secondary, #475569)",
                        }}
                    >
                        🏠 Homebuyer Mortgage
                    </button>
                    <button
                        type="button"
                        onClick={() => setCalculatorMode("roi")}
                        style={{
                            padding: "0.6rem 1.25rem",
                            borderRadius: "9px",
                            border: "none",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            background: calculatorMode === "roi" ? "var(--gold-500, #d4a017)" : "transparent",
                            color: calculatorMode === "roi" ? "#ffffff" : "var(--text-secondary, #475569)",
                        }}
                    >
                        📈 Investor Rental Yield & ROI
                    </button>
                </div>
            </div>

            {calculatorMode === "roi" ? (
                <div style={{ maxWidth: "960px", margin: "0 auto" }}>
                    <InvestmentCalculator propertyPrice={propertyPrice} />
                </div>
            ) : (
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

                    {/* Kenyan Partner Banks Quick Rate Selector */}
                    <div style={{ padding: "0 1.5rem 1.25rem" }}>
                        <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "0.5rem" }}>
                            Compare Kenyan Partner Bank Rates
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                            {KENYAN_LENDERS.map((bank) => {
                                const isSelected = preferredBank === bank.name;
                                return (
                                    <button
                                        key={bank.name}
                                        type="button"
                                        onClick={() => {
                                            setPreferredBank(bank.name);
                                            setInterestRate(bank.rate);
                                        }}
                                        style={{
                                            padding: "0.35rem 0.7rem",
                                            fontSize: "0.76rem",
                                            fontWeight: 600,
                                            borderRadius: "999px",
                                            border: isSelected ? "1.5px solid var(--gold-500, #d4a017)" : "1px solid var(--border-color, #e2e6ee)",
                                            background: isSelected ? "rgba(212, 160, 23, 0.12)" : "var(--bg-secondary, #f8fafc)",
                                            color: isSelected ? "var(--gold-600, #b45309)" : "var(--text-secondary)",
                                            cursor: "pointer",
                                            transition: "all 0.15s",
                                        }}
                                    >
                                        {bank.name} ({bank.rate}%)
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* CTAs */}
                    <div className={styles.ctaRow} style={{ flexWrap: "wrap" }}>
                        <button
                            type="button"
                            onClick={handleTogglePreApprovalForm}
                            className={styles.ctaBtn}
                            style={{
                                width: "100%",
                                justifyContent: "center",
                                background: preApprovalSubmitted
                                    ? "var(--success, #10b981)"
                                    : "linear-gradient(135deg, var(--gold-500, #d4a017), var(--gold-600, #b8860b))",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                            }}
                        >
                            {preApprovalSubmitted
                                ? "✓ Pre-Approval Application Submitted"
                                : showPreApprovalForm
                                    ? "Close Pre-Approval Application"
                                    : `🏦 Apply for Pre-Approval (${preferredBank})`}
                        </button>
                        <Link href="/properties" className={`${styles.ctaBtn} ${styles.ctaBtnOutline}`}>
                            Browse Properties
                        </Link>
                        <Link href="/agents" className={`${styles.ctaBtn} ${styles.ctaBtnOutline}`}>
                            Find an Agent
                        </Link>
                    </div>

                    {/* Inline Mortgage Pre-Approval Lead Form */}
                    {showPreApprovalForm && (
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                if (!applicantName.trim() || !applicantEmail.trim() || !applicantPhone.trim()) {
                                    toast.error("Please fill in your name, email, and phone number.");
                                    return;
                                }
                                setSubmittingPreApproval(true);
                                try {
                                    await submitMortgagePreApproval({
                                        applicantName: applicantName.trim(),
                                        applicantEmail: applicantEmail.trim(),
                                        applicantPhone: applicantPhone.trim(),
                                        senderId: user?.uid,
                                        propertyId: initialPropertyId || undefined,
                                        propertyTitle: initialPropertyTitle || undefined,
                                        propertyPrice,
                                        downPaymentPercent,
                                        loanAmount,
                                        interestRate,
                                        loanTermYears: loanTerm,
                                        estimatedMonthlyPayment: Math.round(monthlyPayment),
                                        monthlyIncome: monthlyNetIncome,
                                        employmentType,
                                        preferredBank,
                                    });
                                    setPreApprovalSubmitted(true);
                                    setShowPreApprovalForm(false);
                                    toast.success(`Pre-approval application submitted for ${preferredBank}! A mortgage specialist will contact you within 24 hours.`);
                                } catch (err) {
                                    console.error("Failed to submit pre-approval:", err);
                                    toast.error("Could not submit pre-approval application. Please try again.");
                                } finally {
                                    setSubmittingPreApproval(false);
                                }
                            }}
                            style={{
                                margin: "0 1.5rem 1.5rem",
                                padding: "1.25rem",
                                background: "var(--bg-secondary, #f8fafc)",
                                borderRadius: "12px",
                                border: "1px solid var(--border-color, #e2e6ee)",
                                display: "flex",
                                flexDirection: "column",
                                gap: "0.85rem",
                            }}
                        >
                            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--text-heading)" }}>
                                🏦 Mortgage Pre-Approval Request
                            </div>
                            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>
                                Get a non-binding pre-qualification assessment for a <strong>KES {formatKES(loanAmount)}</strong> mortgage over <strong>{loanTerm} years</strong> (~KES {formatKES(Math.round(monthlyPayment))}/mo).
                            </p>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        value={applicantName}
                                        onChange={(e) => setApplicantName(e.target.value)}
                                        placeholder="Jane Wanjiku"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                        Email Address *
                                    </label>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        value={applicantEmail}
                                        onChange={(e) => setApplicantEmail(e.target.value)}
                                        placeholder="jane@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                        Phone (M-Pesa / WhatsApp) *
                                    </label>
                                    <input
                                        type="tel"
                                        className={styles.input}
                                        value={applicantPhone}
                                        onChange={(e) => setApplicantPhone(e.target.value)}
                                        placeholder="+254 712 345 678"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                        Preferred Bank
                                    </label>
                                    <select
                                        className={styles.input}
                                        value={preferredBank}
                                        onChange={(e) => {
                                            setPreferredBank(e.target.value);
                                            const found = KENYAN_LENDERS.find((b) => b.name === e.target.value);
                                            if (found) setInterestRate(found.rate);
                                        }}
                                    >
                                        {KENYAN_LENDERS.map((b) => (
                                            <option key={b.name} value={b.name}>
                                                {b.name} ({b.rate}% p.a.)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                        Income Source
                                    </label>
                                    <select
                                        className={styles.input}
                                        value={employmentType}
                                        onChange={(e) => setEmploymentType(e.target.value)}
                                    >
                                        <option value="Salaried Employment">Salaried Employment</option>
                                        <option value="Business / Self-Employed">Business / Self-Employed</option>
                                        <option value="Diaspora Income">Diaspora Remittance / Foreign Income</option>
                                        <option value="Rental / Investment Income">Rental / Investment Income</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "0.25rem" }}>
                                        Monthly Net Income (KES)
                                    </label>
                                    <input
                                        type="number"
                                        className={styles.input}
                                        value={monthlyNetIncome || ""}
                                        onChange={(e) => setMonthlyNetIncome(Number(e.target.value) || 0)}
                                        min={20000}
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={submittingPreApproval}
                                className={styles.ctaBtn}
                                style={{
                                    width: "100%",
                                    justifyContent: "center",
                                    background: "var(--navy-800, #0f1629)",
                                    color: "#fff",
                                    border: "none",
                                    cursor: "pointer",
                                    marginTop: "0.25rem",
                                }}
                            >
                                {submittingPreApproval ? "Submitting Application..." : "Submit Pre-Approval Application →"}
                            </button>
                        </form>
                    )}
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
            )}
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
