/**
 * Rental Move-In, Tenant Affordability & Short-Stay Booking Calculations
 * Tailored for Kenyan residential & furnished executive rentals (KES base).
 */

export interface MoveInCostInput {
    monthlyRentKES: number;
    securityDepositMonths?: 1 | 2;
    includeUtilityDeposit?: boolean;
    includeLeaseStampPct?: boolean;
    propertyType?: string;
}

export interface MoveInCostBreakdown {
    monthlyRentKES: number;
    securityDepositMonths: 1 | 2;
    firstMonthRentKES: number;
    securityDepositKES: number;
    utilityDepositKES: number;
    leaseStampAndLegalKES: number;
    totalMoveInKES: number;
    refundablePortionKES: number;
}

export type AffordabilityTier = "comfortable" | "moderate" | "stretched";

export interface TenantAffordabilityResult {
    monthlyRentKES: number;
    netMonthlyIncomeKES: number;
    recommendedMinIncomeKES: number;
    rentToIncomeRatioPct: number;
    tier: AffordabilityTier;
    label: string;
    guidance: string;
}

export interface ShortStayQuoteInput {
    monthlyRentKES: number;
    checkInDate: string; // YYYY-MM-DD
    checkOutDate: string; // YYYY-MM-DD
    guests?: number;
}

export interface ShortStayQuote {
    nights: number;
    guests: number;
    baseNightlyRateKES: number;
    grossAccommodationKES: number;
    discountTier: "none" | "weekly_10" | "monthly_25";
    discountPct: number;
    discountAmountKES: number;
    cleaningFeeKES: number;
    serviceFeeKES: number;
    totalStayKES: number;
    effectiveNightlyKES: number;
}

/**
 * Calculates itemized Kenyan move-in deposit & first-month cash requirements.
 */
export function calculateMoveInCosts(input: MoveInCostInput): MoveInCostBreakdown {
    const monthlyRentKES = Math.max(0, Math.round(Number(input.monthlyRentKES) || 0));
    const securityDepositMonths: 1 | 2 = input.securityDepositMonths === 1 ? 1 : 2;
    const includeUtilityDeposit = input.includeUtilityDeposit !== false;
    const includeLeaseStampPct = Boolean(input.includeLeaseStampPct);

    const firstMonthRentKES = monthlyRentKES;
    const securityDepositKES = monthlyRentKES * securityDepositMonths;

    let utilityDepositKES = 0;
    if (includeUtilityDeposit && monthlyRentKES > 0) {
        const pType = (input.propertyType || "apartment").toLowerCase();
        if (pType === "commercial") {
            utilityDepositKES = 25_000;
        } else if (pType === "villa" || pType === "house" || pType === "townhouse") {
            utilityDepositKES = 15_000;
        } else {
            utilityDepositKES = 7_500;
        }
    }

    // Standard nominal tenancy registration / stamp duty allowance (1% of annual rent when applicable)
    const leaseStampAndLegalKES =
        includeLeaseStampPct && monthlyRentKES > 0 ? Math.round(monthlyRentKES * 12 * 0.01) : 0;

    const totalMoveInKES =
        firstMonthRentKES + securityDepositKES + utilityDepositKES + leaseStampAndLegalKES;
    const refundablePortionKES = securityDepositKES + utilityDepositKES;

    return {
        monthlyRentKES,
        securityDepositMonths,
        firstMonthRentKES,
        securityDepositKES,
        utilityDepositKES,
        leaseStampAndLegalKES,
        totalMoveInKES,
        refundablePortionKES,
    };
}

/**
 * Evaluates tenant net monthly income against the 3x rent (<= 33.3% RTI) standard.
 */
export function evaluateTenantAffordability(
    monthlyRentKES: number,
    netMonthlyIncomeKES: number
): TenantAffordabilityResult {
    const cleanRent = Math.max(0, Math.round(Number(monthlyRentKES) || 0));
    const cleanIncome = Math.max(0, Math.round(Number(netMonthlyIncomeKES) || 0));
    const recommendedMinIncomeKES = cleanRent * 3;

    if (cleanIncome <= 0 || cleanRent <= 0) {
        return {
            monthlyRentKES: cleanRent,
            netMonthlyIncomeKES: cleanIncome,
            recommendedMinIncomeKES,
            rentToIncomeRatioPct: 0,
            tier: "moderate",
            label: "Enter Net Monthly Income",
            guidance: `Landlords typically look for net monthly income of at least KES ${recommendedMinIncomeKES.toLocaleString()} (3x monthly rent).`,
        };
    }

    const rentToIncomeRatioPct = Number(((cleanRent / cleanIncome) * 100).toFixed(1));

    if (rentToIncomeRatioPct <= 33.4) {
        return {
            monthlyRentKES: cleanRent,
            netMonthlyIncomeKES: cleanIncome,
            recommendedMinIncomeKES,
            rentToIncomeRatioPct,
            tier: "comfortable",
            label: "Strong Match — Passes 3x Income Standard",
            guidance: `Rent is ${rentToIncomeRatioPct}% of your net monthly income, well within preferred Kenyan landlord underwriting thresholds.`,
        };
    }

    if (rentToIncomeRatioPct <= 45) {
        return {
            monthlyRentKES: cleanRent,
            netMonthlyIncomeKES: cleanIncome,
            recommendedMinIncomeKES,
            rentToIncomeRatioPct,
            tier: "moderate",
            label: "Moderate Ratio — Supporting Proof Recommended",
            guidance: `Rent is ${rentToIncomeRatioPct}% of net income. Attaching 3 months of M-Pesa/bank statements or an employer letter strengthens approval.`,
        };
    }

    return {
        monthlyRentKES: cleanRent,
        netMonthlyIncomeKES: cleanIncome,
        recommendedMinIncomeKES,
        rentToIncomeRatioPct,
        tier: "stretched",
        label: "High Rent-to-Income — Co-Applicant Suggested",
        guidance: `Rent is ${rentToIncomeRatioPct}% of net income (above 45%). Consider adding a co-applicant/guarantor or offering an extra deposit month.`,
    };
}

/**
 * Computes a furnished / short-stay booking quote from check-in & check-out dates.
 */
export function calculateShortStayQuote(input: ShortStayQuoteInput): ShortStayQuote {
    const monthlyRent = Math.max(0, Math.round(Number(input.monthlyRentKES) || 0));
    const guests = Math.min(12, Math.max(1, Math.round(Number(input.guests) || 1)));

    // Derive furnished nightly rate (~monthlyRent / 20 rounded to nearest 500 KES, min KES 3,500)
    const rawNightly = monthlyRent > 0 ? Math.round(monthlyRent / 20 / 500) * 500 : 6_500;
    const baseNightlyRateKES = Math.max(3_500, rawNightly);

    const startMs = Date.parse(input.checkInDate);
    const endMs = Date.parse(input.checkOutDate);
    const diffDays =
        Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
            ? Math.round((endMs - startMs) / 86_400_000)
            : 3;
    const nights = Math.min(180, Math.max(1, diffDays));

    const grossAccommodationKES = baseNightlyRateKES * nights;

    let discountTier: ShortStayQuote["discountTier"] = "none";
    let discountPct = 0;
    if (nights >= 28) {
        discountTier = "monthly_25";
        discountPct = 25;
    } else if (nights >= 7) {
        discountTier = "weekly_10";
        discountPct = 10;
    }

    const discountAmountKES = Math.round((grossAccommodationKES * discountPct) / 100);
    const netAccommodationKES = grossAccommodationKES - discountAmountKES;

    const cleaningFeeKES = baseNightlyRateKES >= 15_000 ? 4_500 : 2_500;
    const serviceFeeKES = Math.round(netAccommodationKES * 0.05);
    const totalStayKES = netAccommodationKES + cleaningFeeKES + serviceFeeKES;
    const effectiveNightlyKES = Math.round(totalStayKES / nights);

    return {
        nights,
        guests,
        baseNightlyRateKES,
        grossAccommodationKES,
        discountTier,
        discountPct,
        discountAmountKES,
        cleaningFeeKES,
        serviceFeeKES,
        totalStayKES,
        effectiveNightlyKES,
    };
}
