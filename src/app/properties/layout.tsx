import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Browse Properties — EstateVue",
    description: "Search and browse thousands of premium properties across Kenya. Filter by location, price, bedrooms, and more. Find apartments, houses, villas, and land for sale or rent.",
    keywords: "Kenya properties, homes for sale, apartments for rent, luxury real estate, Nairobi houses, Mombasa villas, land for sale",
    openGraph: {
        title: "Browse Properties — EstateVue",
        description: "Search premium properties across Kenya. Apartments, houses, villas, and land for sale or rent.",
        siteName: "EstateVue",
        type: "website",
        locale: "en_KE",
    },
    twitter: {
        card: "summary",
        title: "Browse Properties — EstateVue",
        description: "Search premium properties across Kenya.",
    },
};

export default function PropertiesLayout({ children }: { children: React.ReactNode }) {
    return children;
}
