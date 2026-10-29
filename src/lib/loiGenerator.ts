/**
 * EstateVue Letter of Intent (LOI) Generator
 * Conforms to standard Kenyan conveyancing practice and Law Society of Kenya (LSK) guidelines.
 */

export interface LOIData {
    loiNumber: string;
    date: string;
    // Property
    propertyTitle: string;
    lrNumber: string;
    city: string;
    neighborhood: string;
    // Parties
    buyerName: string;
    buyerEmail: string;
    buyerPhone: string;
    agentName: string;
    agentEmail: string;
    agentPhone: string;
    // Financial terms
    offeredPrice: number;
    askingPrice: number;
    currency: string;
    downPaymentPercent: number;
    downPaymentAmount: number;
    financingType: "cash" | "mortgage" | "installments";
    moveInDate: string;
    validityDays: number;
    contingencies: string[];
    specialConditions?: string;
    // Status
    status: "pending" | "accepted" | "countered" | "rejected";
    counterPrice?: number;
    counterTerms?: string;
}

export function generateLOINumber(): string {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `EV-LOI-${year}-${rand}`;
}

export function formatLOICurrency(amount: number, currency: string = "KES"): string {
    return `${currency} ${amount.toLocaleString()}`;
}

export function getLOITextDocument(data: LOIData): string {
    const balanceAmount = data.offeredPrice - data.downPaymentAmount;
    const formattedPrice = formatLOICurrency(data.offeredPrice, data.currency);
    const formattedDeposit = formatLOICurrency(data.downPaymentAmount, data.currency);
    const formattedBalance = formatLOICurrency(balanceAmount, data.currency);

    const contingenciesList = data.contingencies.length > 0
        ? data.contingencies.map((c, i) => `   ${i + 1}. ${c}`).join("\n")
        : "   1. Standard Ardhisasa / Ministry of Lands official registry search.\n   2. County rates and land rent clearance certificate for the current year.";

    return `
================================================================================
                    REPUBLIC OF KENYA — CONVEYANCING DRAFT
             FORMAL LETTER OF INTENT (LOI) TO PURCHASE REAL PROPERTY
================================================================================
Reference No:   ${data.loiNumber}
Date of Offer:  ${data.date}
Offer Validity: ${data.validityDays} Calendar Days from date hereof

1. PARTIES
----------
PURCHASER:      ${data.buyerName}
Email:          ${data.buyerEmail}
Telephone:      ${data.buyerPhone}

VENDOR / AGENT: ${data.agentName} (EstateVue Verified Agent)
Email:          ${data.agentEmail}
Telephone:      ${data.agentPhone}

2. SUBJECT PROPERTY
-------------------
Property:       ${data.propertyTitle}
Cadastral Reg:  ${data.lrNumber}
Location:       ${data.neighborhood}, ${data.city}, Kenya
Jurisdiction:   Ministry of Lands & Physical Planning / County Government

3. FINANCIAL TERMS & PURCHASE CONSIDERATION
--------------------------------------------
Offered Purchase Price:     ${formattedPrice}
Earnest Down Payment (${data.downPaymentPercent}%):   ${formattedDeposit}
Balance Upon Completion:    ${formattedBalance}
Financing Structure:        ${data.financingType.toUpperCase()}
Intended Completion Date:   ${data.moveInDate}

Earnest Deposit Terms:
The earnest deposit shall be held in a designated Stakeholder Escrow Account 
under the Law Society of Kenya (LSK) Conditions of Sale pending execution 
of the formal Agreement for Sale.

4. CONDITIONS PRECEDENT & CONTINGENCIES
---------------------------------------
This Letter of Intent is subject to and conditional upon the following:
${contingenciesList}
${data.specialConditions ? `\nSpecial Purchaser Conditions:\n   * ${data.specialConditions}` : ""}

5. LEGAL NATURE OF THIS LETTER
------------------------------
This document establishes the commercial framework agreed upon by the Purchaser 
and Vendor. Upon formal acceptance by the Vendor, both parties' Advocates 
shall prepare and engross the definitive Agreement for Sale in accordance with 
the Advocates (Remuneration and Conveyancing) Practice Rules of Kenya.

================================================================================
STATUS: ${data.status.toUpperCase()}
${data.counterPrice ? `Counter-Offer Price: ${formatLOICurrency(data.counterPrice, data.currency)}\nCounter Terms: ${data.counterTerms || "Revised price and closing timeline."}` : ""}
================================================================================

SIGNATURE OF PURCHASER:                            DATE:
___________________________                        ___________________
${data.buyerName}

SIGNATURE OF VENDOR / AGENT:                       DATE:
___________________________                        ___________________
${data.agentName}
`.trim();
}
