import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Compare Properties — EstateVue",
    description: "Compare properties side by side. Analyze price, bedrooms, bathrooms, area, amenities, and more to find your best match across Kenya.",
    keywords: "compare properties, property comparison, side by side comparison, Kenya real estate",
    openGraph: {
        title: "Compare Properties — EstateVue",
        description: "Compare properties side by side to find your best match.",
        siteName: "EstateVue",
        type: "website",
    },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
    return children;
}
