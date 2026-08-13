import type { Metadata } from "next";
import { sampleProperties, formatPrice } from "@/lib/data";

const BASE_URL = "https://realestate-app-three-theta.vercel.app";

interface Props {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const property = sampleProperties.find((p) => p.id === id);

    if (!property) {
        return {
            title: "Property Not Found — EstateVue",
            description: "The property you're looking for could not be found.",
        };
    }

    const title = `${property.title} | ${property.location.neighborhood}, ${property.location.city} — EstateVue`;
    const description = `${property.type.charAt(0).toUpperCase() + property.type.slice(1)} for ${property.listingType === "sale" ? "sale" : "rent"} in ${property.location.neighborhood}, ${property.location.city}. ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, ${property.area.toLocaleString()} sq ft. Price: ${formatPrice(property.price)}. ${property.description.slice(0, 140)}...`;
    const image = property.images[0]?.startsWith("http") ? property.images[0] : `${BASE_URL}${property.images[0]}`;
    const url = `${BASE_URL}/properties/${id}`;

    return {
        title,
        description,
        keywords: `${property.type}, ${property.listingType}, ${property.location.neighborhood}, ${property.location.city}, Kenya, real estate, ${property.bedrooms} bedroom, property`,
        openGraph: {
            title,
            description: description.slice(0, 200),
            url,
            siteName: "EstateVue",
            type: "article",
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: property.title,
                },
            ],
            locale: "en_KE",
        },
        twitter: {
            card: "summary_large_image",
            title: property.title,
            description: description.slice(0, 140),
            images: [image],
        },
        alternates: {
            canonical: url,
        },
        robots: {
            index: true,
            follow: true,
        },
    };
}

export default function PropertyDetailLayout({ children }: { children: React.ReactNode }) {
    return children;
}
