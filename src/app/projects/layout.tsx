import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Off-Plan Developments & Milestone Tracker — EstateVue",
    description:
        "Invest in verified Kenyan off-plan luxury apartments and gated villa developments across Nairobi and Mombasa. Escrow-protected staged payment plans, NCA credentials, and dated construction photo timelines.",
    keywords:
        "off-plan Kenya, Westlands apartments off-plan, Nyali villas off-plan, Karen gated developments, staged payment plan Kenya, diaspora real estate Kenya",
    openGraph: {
        title: "Off-Plan Developments & Milestone Tracker — EstateVue",
        description:
            "Verified off-plan developments in Nairobi & Mombasa with bank escrow protection, staged payment schedules, and live construction milestone tracking.",
        siteName: "EstateVue",
        type: "website",
        locale: "en_KE",
    },
};

export default function OffPlanProjectsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
