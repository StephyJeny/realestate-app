import type { Metadata } from "next";
import { cache } from "react";
import { sampleProperties, formatPrice, Property } from "@/lib/data";
import { getPropertyById } from "@/lib/firestore";
import { SITE_URL, absoluteUrl } from "@/lib/site";

interface Props {
    params: Promise<{ id: string }>;
}

/**
 * Resolve a property from sample data or Firestore. Wrapped in React `cache` so
 * `generateMetadata` and the layout share one lookup per request.
 */
const loadProperty = cache(async (id: string): Promise<Property | undefined> => {
    const sample = sampleProperties.find((p) => p.id === id);
    if (sample) return sample;

    try {
        const fp = await getPropertyById(id);
        if (!fp) return undefined;
        return {
            id: fp.id || id,
            title: fp.title,
            slug: fp.title.toLowerCase().replace(/\s+/g, "-"),
            description: fp.description,
            type: fp.type,
            listingType: fp.listingType,
            price: fp.price,
            currency: fp.currency || "KES",
            bedrooms: fp.bedrooms,
            bathrooms: fp.bathrooms,
            area: fp.area,
            yearBuilt: fp.yearBuilt || 2024,
            address: fp.address || "",
            location: {
                city: fp.city || "Kenya",
                neighborhood: fp.neighborhood || "",
            },
            amenities: fp.amenities || [],
            images: fp.images?.length ? fp.images : ["/images/property-1.png"],
            agentName: fp.agentName || "Agent",
            agentImage: "/images/agent-avatar.png",
            agentPhone: fp.agentPhone || "",
            agentEmail: fp.agentEmail || "",
            status: fp.status,
            isFeatured: fp.isFeatured,
            views: fp.views || 0,
            favorites: fp.favorites || 0,
            createdAt: fp.createdAt ? new Date(fp.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        };
    } catch (e) {
        console.warn("Failed to fetch property metadata from Firestore:", e);
        return undefined;
    }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const property = await loadProperty(id);

    if (!property) {
        return {
            title: "Property Not Found — EstateVue",
            description: "The property you're looking for could not be found.",
            robots: { index: false, follow: true },
        };
    }

    const title = `${property.title} | ${property.location.neighborhood}, ${property.location.city} — EstateVue`;
    const description = `${property.type.charAt(0).toUpperCase() + property.type.slice(1)} for ${property.listingType === "sale" ? "sale" : "rent"} in ${property.location.neighborhood}, ${property.location.city}. ${property.bedrooms} bedrooms, ${property.bathrooms} bathrooms, ${property.area.toLocaleString()} sq ft. Price: ${formatPrice(property.price)}. ${property.description.slice(0, 140)}...`;
    const image = absoluteUrl(property.images[0]);
    const url = `${SITE_URL}/properties/${id}`;

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

/** schema.org structured data so search engines can show price, location and photos. */
function buildListingJsonLd(property: Property, id: string) {
    const url = `${SITE_URL}/properties/${id}`;
    const available = !["sold", "rented"].includes(property.status || "");
    return {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: property.title,
        description: property.description.slice(0, 500),
        url,
        image: property.images.slice(0, 6).map(absoluteUrl),
        datePosted: property.createdAt,
        offers: {
            "@type": "Offer",
            price: property.price,
            priceCurrency: property.currency || "KES",
            availability: available ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
            businessFunction:
                property.listingType === "rent" ? "https://schema.org/LeaseOut" : "https://schema.org/Sell",
        },
        about: {
            "@type": property.type === "apartment" ? "Apartment" : property.type === "land" ? "Landform" : "House",
            numberOfRooms: property.bedrooms,
            numberOfBathroomsTotal: property.bathrooms,
            floorSize: { "@type": "QuantitativeValue", value: property.area, unitCode: "FTK" },
            address: {
                "@type": "PostalAddress",
                streetAddress: property.address || undefined,
                addressLocality: property.location.neighborhood || property.location.city,
                addressRegion: property.location.city,
                addressCountry: "KE",
            },
        },
    };
}

export default async function PropertyDetailLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const property = await loadProperty(id);

    return (
        <>
            {property && (
                <script
                    type="application/ld+json"
                    // JSON.stringify output is escaped for `<` to prevent breaking out of the script tag
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(buildListingJsonLd(property, id)).replace(/</g, "\\u003c"),
                    }}
                />
            )}
            {children}
        </>
    );
}
