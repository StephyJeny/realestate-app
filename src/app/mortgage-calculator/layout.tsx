import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mortgage Calculator — EstateVue",
    description: "Calculate your monthly mortgage payments with our free tool. Estimate costs for properties in Kenya with customizable loan amount, interest rate, and term.",
    keywords: "mortgage calculator Kenya, home loan calculator, property payment estimator, KES mortgage",
    openGraph: {
        title: "Mortgage Calculator — EstateVue",
        description: "Calculate your monthly mortgage payments for properties in Kenya.",
        siteName: "EstateVue",
        type: "website",
    },
};

export default function MortgageCalculatorLayout({ children }: { children: React.ReactNode }) {
    return children;
}
