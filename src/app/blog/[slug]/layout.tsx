import type { Metadata } from "next";
import { getPostBySlug, blogCategories, formatDate } from "@/lib/blog";

const BASE_URL = "https://realestate-app-three-theta.vercel.app";

interface Props {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const post = getPostBySlug(slug);

    if (!post) {
        return {
            title: "Article Not Found — EstateVue Blog",
            description: "The article you're looking for could not be found.",
        };
    }

    const category = blogCategories.find((c) => c.id === post.category)?.label || post.category;
    const title = `${post.title} — EstateVue Blog`;
    const description = post.excerpt.slice(0, 200);
    const image = post.image.startsWith("http") ? post.image : `${BASE_URL}${post.image}`;
    const url = `${BASE_URL}/blog/${slug}`;

    return {
        title,
        description,
        keywords: [...post.tags, category, "Kenya", "real estate", "blog"].join(", "),
        authors: [{ name: post.author.name }],
        openGraph: {
            title: post.title,
            description,
            url,
            siteName: "EstateVue",
            type: "article",
            publishedTime: post.publishedAt,
            authors: [post.author.name],
            section: category,
            tags: post.tags,
            images: [
                {
                    url: image,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
            locale: "en_KE",
        },
        twitter: {
            card: "summary_large_image",
            title: post.title,
            description: description.slice(0, 140),
            images: [image],
        },
        alternates: {
            canonical: url,
        },
    };
}

export default function BlogPostLayout({ children }: { children: React.ReactNode }) {
    return children;
}
