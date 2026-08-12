"use client";
import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { getPostBySlug, blogPosts, blogCategories, formatDate } from "@/lib/blog";
import styles from "./page.module.css";

interface Props {
    params: Promise<{ slug: string }>;
}

export default function BlogPostPage({ params }: Props) {
    const { slug } = use(params);
    const post = getPostBySlug(slug);

    if (!post) {
        return (
            <div className={styles.page}>
                <div style={{ minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-heading)" }}>Article not found</h1>
                    <Link href="/blog" style={{ color: "var(--gold-600)", fontWeight: 600, textDecoration: "none" }}>
                        ← Back to all articles
                    </Link>
                </div>
            </div>
        );
    }

    const getCategoryLabel = (cat: string) =>
        blogCategories.find((c) => c.id === cat)?.label || cat;

    // Related posts: same category, different post
    const related = blogPosts
        .filter((p) => p.id !== post.id && p.category === post.category)
        .slice(0, 3);

    // If not enough, fill from other categories
    const moreRelated = related.length < 3
        ? [...related, ...blogPosts.filter((p) => p.id !== post.id && !related.includes(p)).slice(0, 3 - related.length)]
        : related;

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <Image src={post.image} alt={post.title} fill className={styles.heroImage} priority />
                <div className={styles.heroOverlay}>
                    <div className={styles.breadcrumb}>
                        <Link href="/">Home</Link>
                        <span>›</span>
                        <Link href="/blog">Blog</Link>
                        <span>›</span>
                        <span style={{ color: "rgba(255,255,255,0.7)" }}>{post.title.slice(0, 40)}…</span>
                    </div>
                    <span className={styles.categoryBadge}>{getCategoryLabel(post.category)}</span>
                    <h1 className={styles.heroTitle}>{post.title}</h1>
                    <div className={styles.heroMeta}>
                        <span className={styles.authorRow}>
                            <Image src={post.author.avatar} alt={post.author.name} width={28} height={28} className={styles.avatar} />
                            <span>
                                <span className={styles.authorName}>{post.author.name}</span>
                                <br />
                                <span className={styles.authorRole}>{post.author.role}</span>
                            </span>
                        </span>
                        <span>{formatDate(post.publishedAt)}</span>
                        <span>📖 {post.readTime} min read</span>
                    </div>
                </div>
            </div>

            {/* Layout */}
            <div className={styles.layout}>
                {/* Article */}
                <div>
                    <Link href="/blog" className={styles.backLink}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                        All Articles
                    </Link>

                    <article
                        className={styles.article}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                    {/* Tags */}
                    <div className={styles.tagSection}>
                        <div className={styles.tagTitle}>Tags</div>
                        <div className={styles.tagList}>
                            {post.tags.map((t) => (
                                <span key={t} className={styles.tag}>{t}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {/* Share */}
                    <div className={styles.sidebarCard}>
                        <div className={styles.sidebarTitle}>Share Article</div>
                        <div className={styles.shareRow}>
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://estatevue.vercel.app/blog/${post.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.shareBtn}
                                title="Share on X"
                            >
                                𝕏
                            </a>
                            <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://estatevue.vercel.app/blog/${post.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.shareBtn}
                                title="Share on Facebook"
                            >
                                f
                            </a>
                            <a
                                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} — https://estatevue.vercel.app/blog/${post.slug}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.shareBtn}
                                title="Share on WhatsApp"
                            >
                                💬
                            </a>
                            <button
                                className={styles.shareBtn}
                                title="Copy link"
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://estatevue.vercel.app/blog/${post.slug}`);
                                }}
                            >
                                🔗
                            </button>
                        </div>
                    </div>

                    {/* Related Posts */}
                    <div className={styles.sidebarCard}>
                        <div className={styles.sidebarTitle}>Related Articles</div>
                        {moreRelated.map((r) => (
                            <Link key={r.id} href={`/blog/${r.slug}`} className={styles.relatedPost}>
                                <Image src={r.image} alt={r.title} width={56} height={56} className={styles.relatedImage} />
                                <div>
                                    <div className={styles.relatedTitle}>{r.title}</div>
                                    <div className={styles.relatedDate}>{formatDate(r.publishedAt)}</div>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className={styles.ctaCard}>
                        <div className={styles.ctaTitle}>Find Your Dream Home</div>
                        <p className={styles.ctaText}>Browse our curated collection of premium properties across Kenya.</p>
                        <Link href="/properties" className={styles.ctaBtn}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
                            Browse Properties
                        </Link>
                    </div>
                </aside>
            </div>
        </div>
    );
}
