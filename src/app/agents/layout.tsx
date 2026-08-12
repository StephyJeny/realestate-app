import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Expert Agents — EstateVue",
    description: "Meet our network of trusted, professional real estate agents across Kenya. Verified experts helping you buy, sell, or rent your perfect property.",
    keywords: "real estate agents Kenya, property agents Nairobi, estate agents Mombasa, verified agents",
    openGraph: {
        title: "Expert Agents — EstateVue",
        description: "Connect with trusted, professional real estate agents across Kenya.",
        siteName: "EstateVue",
        type: "website",
    },
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
