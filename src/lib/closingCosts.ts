/**
 * Kenyan Conveyancing, Stamp Duty & Cash-to-Close Calculation Engine
 * Aligned with the Stamp Duty Act (Cap 480) & Advocates (Remuneration) Order (LSK Scale).
 */

export type LandZoneType = "urban" | "rural";
export type AcquisitionFinancing = "cash" | "mortgage";

export interface ClosingCostInputs {
    propertyPriceKES: number;
    zone?: LandZoneType; // "urban" = 4% stamp duty, "rural" = 2% agricultural/outside municipality
    financing?: AcquisitionFinancing;
    downPaymentPct?: number; // Default 20% when financing === "mortgage"
    bankArrangementFeePct?: number; // Default 1.5% of loan principal
    firstTimeAffordableExemption?: boolean; // Affordable Housing / First-time buyer exemption toggle
}

export interface ClosingCostLineItem {
    id: string;
    label: string;
    category: "statutory" | "legal" | "valuation" | "financing";
    amountKES: number;
    note: string;
}

export interface ClosingCostBreakdown {
    propertyPriceKES: number;
    downPaymentKES: number;
    loanPrincipalKES: number;
    stampDutyRatePct: number;
    stampDutyKES: number;
    legalFeeExVatKES: number;
    legalFeeVatKES: number;
    legalFeeTotalKES: number;
    valuationAndRegistryKES: number;
    mortgageSetupCostsKES: number;
    totalClosingCostsKES: number;
    totalCashToCloseKES: number; // Cash needed upfront = (Full Price OR Down Payment) + Total Closing Costs
    closingCostPctOfPrice: number;
    items: ClosingCostLineItem[];
}

/**
 * Calculates Purchaser's Advocate Conveyancing Scale Fee (before VAT)
 * based on Kenyan Advocates Remuneration Order tiered bands:
 * - First KES 1,000,000: 2.0%
 * - Next KES 4,000,000 (1M to 5M): 1.5%
 * - Next KES 95,000,000 (5M to 100M): 1.25%
 * - Remainder above KES 100,000,000: 1.0%
 * Subject to statutory minimum of KES 35,000.
 */
export function calculateLSKLegalFeeExVat(priceKES: number): number {
    if (!priceKES || priceKES <= 0) return 0;

    let remaining = priceKES;
    let fee = 0;

    const band1 = Math.min(remaining, 1_000_000);
    fee += band1 * 0.02;
    remaining -= band1;

    if (remaining > 0) {
        const band2 = Math.min(remaining, 4_000_000);
        fee += band2 * 0.015;
        remaining -= band2;
    }

    if (remaining > 0) {
        const band3 = Math.min(remaining, 95_000_000);
        fee += band3 * 0.0125;
        remaining -= band3;
    }

    if (remaining > 0) {
        fee += remaining * 0.01;
    }

    return Math.round(Math.max(35_000, fee));
}

/**
 * Estimates professional / government panel valuation fee in Kenya (~0.25% tiered, min 25k, max 250k).
 */
export function calculateValuationFeeKES(priceKES: number): number {
    if (!priceKES || priceKES <= 0) return 0;
    const raw = priceKES * 0.0025;
    return Math.round(Math.min(250_000, Math.max(25_000, raw)));
}

/**
 * Computes full Kenyan Cash-to-Close breakdown.
 */
export function calculateClosingCosts(inputs: ClosingCostInputs): ClosingCostBreakdown {
    const price = Math.max(0, Math.round(inputs.propertyPriceKES || 0));
    const zone: LandZoneType = inputs.zone || "urban";
    const financing: AcquisitionFinancing = inputs.financing || "cash";
    const clampedDownPct = Math.min(100, Math.max(0, inputs.downPaymentPct ?? 20));
    const arrangementPct = Math.max(0, inputs.bankArrangementFeePct ?? 1.5);

    if (price === 0) {
        return {
            propertyPriceKES: 0,
            downPaymentKES: 0,
            loanPrincipalKES: 0,
            stampDutyRatePct: 0,
            stampDutyKES: 0,
            legalFeeExVatKES: 0,
            legalFeeVatKES: 0,
            legalFeeTotalKES: 0,
            valuationAndRegistryKES: 0,
            mortgageSetupCostsKES: 0,
            totalClosingCostsKES: 0,
            totalCashToCloseKES: 0,
            closingCostPctOfPrice: 0,
            items: [],
        };
    }

    // 1. Stamp Duty (4% Urban Municipality / 2% Rural Agricultural / 0% Exempt)
    const stampDutyRatePct = inputs.firstTimeAffordableExemption ? 0 : zone === "urban" ? 4 : 2;
    const stampDutyKES = Math.round(price * (stampDutyRatePct / 100));

    // 2. Purchaser's Advocate Conveyancing Fees + 16% VAT
    const legalFeeExVatKES = calculateLSKLegalFeeExVat(price);
    const legalFeeVatKES = Math.round(legalFeeExVatKES * 0.16);
    const legalFeeTotalKES = legalFeeExVatKES + legalFeeVatKES;

    // 3. Valuation & ArdhiSasa / Registry Disbursements
    const valuationFeeKES = calculateValuationFeeKES(price);
    const ardhisasaSearchAndClearancesKES = 21_000; // Search (1K) + Rates/Rent Clearances (10K) + Consent/LCB (5K) + Transfer Registration (5K)
    const valuationAndRegistryKES = valuationFeeKES + ardhisasaSearchAndClearancesKES;

    const items: ClosingCostLineItem[] = [
        {
            id: "stamp_duty",
            label: inputs.firstTimeAffordableExemption
                ? "Stamp Duty (First-Time Exemption)"
                : `Stamp Duty (${stampDutyRatePct}% ${zone === "urban" ? "Urban / Municipality" : "Agricultural / Rural"})`,
            category: "statutory",
            amountKES: stampDutyKES,
            note: inputs.firstTimeAffordableExemption
                ? "Exempt under approved first-time affordable homeownership scheme"
                : zone === "urban"
                ? "4% payable via KRA iTax / ArdhiSasa upon government valuation"
                : "2% payable for freehold agricultural land outside gazetted municipalities",
        },
        {
            id: "legal_fees",
            label: "Advocate Conveyancing Fee (LSK Scale + 16% VAT)",
            category: "legal",
            amountKES: legalFeeTotalKES,
            note: `KES ${legalFeeExVatKES.toLocaleString()} LSK Remuneration Scale + KES ${legalFeeVatKES.toLocaleString()} VAT`,
        },
        {
            id: "valuation_fee",
            label: "Official & Chartered Valuation Report",
            category: "valuation",
            amountKES: valuationFeeKES,
            note: "Registered valuer inspection for stamp duty assessment & market verification",
        },
        {
            id: "registry_disbursements",
            label: "ArdhiSasa Search, Clearances & Title Registration",
            category: "statutory",
            amountKES: ardhisasaSearchAndClearancesKES,
            note: "Official search, County rates & rent clearance, LCB/Ministry consent & title registration",
        },
    ];

    // 4. Financing / Mortgage Charge Costs
    let downPaymentKES = price;
    let loanPrincipalKES = 0;
    let mortgageSetupCostsKES = 0;

    if (financing === "mortgage") {
        downPaymentKES = Math.round(price * (clampedDownPct / 100));
        loanPrincipalKES = Math.max(0, price - downPaymentKES);

        if (loanPrincipalKES > 0) {
            const arrangementFeeKES = Math.round(loanPrincipalKES * (arrangementPct / 100));
            const chargeStampDutyAndLegalKES = Math.round(loanPrincipalKES * 0.001) + 45_000; // 0.1% Stamp Duty on Charge + bank panel legal registration
            const insuranceEstimateKES = Math.round(loanPrincipalKES * 0.0035); // Indicative Year-1 MPI + Domestic Package Insurance

            mortgageSetupCostsKES = arrangementFeeKES + chargeStampDutyAndLegalKES + insuranceEstimateKES;

            items.push(
                {
                    id: "bank_arrangement",
                    label: `Bank Facility / Arrangement Fee (${arrangementPct}%)`,
                    category: "financing",
                    amountKES: arrangementFeeKES,
                    note: `Lender processing fee on KES ${loanPrincipalKES.toLocaleString()} loan principal`,
                },
                {
                    id: "charge_registration",
                    label: "Mortgage Charge Stamp Duty (0.1%) & Bank Legal",
                    category: "financing",
                    amountKES: chargeStampDutyAndLegalKES,
                    note: "Statutory 0.1% duty on bank charge instrument + charge registration",
                },
                {
                    id: "mortgage_insurance",
                    label: "Mortgage Protection & Property Insurance (Yr 1)",
                    category: "financing",
                    amountKES: insuranceEstimateKES,
                    note: "Indicative annual Credit Life (MPI) & structural fire insurance",
                }
            );
        }
    }

    const totalClosingCostsKES = stampDutyKES + legalFeeTotalKES + valuationAndRegistryKES + mortgageSetupCostsKES;
    const totalCashToCloseKES = downPaymentKES + totalClosingCostsKES;
    const closingCostPctOfPrice = Number(((totalClosingCostsKES / price) * 100).toFixed(2));

    return {
        propertyPriceKES: price,
        downPaymentKES,
        loanPrincipalKES,
        stampDutyRatePct,
        stampDutyKES,
        legalFeeExVatKES,
        legalFeeVatKES,
        legalFeeTotalKES,
        valuationAndRegistryKES,
        mortgageSetupCostsKES,
        totalClosingCostsKES,
        totalCashToCloseKES,
        closingCostPctOfPrice,
        items,
    };
}
