"use client";
import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { blogPosts, blogCategories, formatDate } from "@/lib/blog";
import styles from "./page.module.css";

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState("all");

    const featured = useMemo(() => blogPosts.filter((p) => p.featured), []);
    const filtered = useMemo(() => {
        const list = activeCategory === "all"
            ? blogPosts
            : blogPosts.filter((p) => p.category === activeCategory);
        // Exclude featured posts from the main grid
        return list.filter((p) => !p.featured);
    }, [activeCategory]);

    const getCategoryLabel = (cat: string) => {
        const found = blogCategories.find((c) => c.id === cat);
        return found ? found.label : cat;
    };

    return (
        <div className={styles.page}>
            {/* Hero */}
            <section className={styles.hero}>
                <span className={styles.heroLabel}>📰 Blog</span>
                <h1 className={styles.heroTitle}>
                    Market{" "}
                    <span className={styles.heroAccent}>Insights & Guides</span>
                </h1>
                <p className={styles.heroSub}>
                    Expert analysis, investment tips, and neighborhood guides to help you make smarter property decisions.
                </p>
            </section>

            <div className={styles.container}>
                {/* Category Tabs */}
                <div className={styles.categoryBar}>
                    {blogCategories.map((cat) => (
                        <button
                            key={cat.id}
                            className={`${styles.categoryTab} ${activeCategory === cat.id ? styles.categoryTabActive : ""}`}
                            onClick={() => setActiveCategory(cat.id)}
                        >
                            {cat.icon} {cat.label}
                        </button>
                    ))}
                </div>

                {/* Featured Posts */}
                {activeCategory === "all" && featured.length > 0 && (
                    <>
                        <h2 className={styles.sectionTitle}>✦ Featured Articles</h2>
                        <div className={styles.featuredGrid}>
                            {featured.map((post) => (
                                <Link key={post.id} href={`/blog/${post.slug}`} className={styles.featuredCard}>
                                    <Image src={post.image} alt={post.title} fill className={styles.featuredImage} sizes="(max-width:768px) 100vw, 50vw" />
                                    <div className={styles.featuredOverlay}>
                                        <span className={styles.featuredBadge}>Featured</span>
                                        <span className={styles.featuredCategory}>{getCategoryLabel(post.category)}</span>
                                        <h3 className={styles.featuredTitle}>{post.title}</h3>
                                        <p className={styles.featuredExcerpt}>{post.excerpt}</p>
                                        <div className={styles.featuredMeta}>
                                            <span className={styles.featuredAuthor}>
                                                <Image src={post.author.avatar} alt={post.author.name} width={22} height={22} className={styles.authorAvatar} />
                                                {post.author.name}
                                            </span>
                                            <span>{formatDate(post.publishedAt)}</span>
                                            <span>📖 {post.readTime} min read</span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </>
                )}

                {/* All Posts Grid */}
                <h2 className={styles.sectionTitle}>
                    {activeCategory === "all" ? "📚 All Articles" : `${blogCategories.find((c) => c.id === activeCategory)?.icon} ${getCategoryLabel(activeCategory)}`}
                </h2>
                <div className={styles.postGrid}>
                    {(activeCategory === "all" ? filtered : blogPosts.filter((p) => p.category === activeCategory)).map((post) => (
                        <Link key={post.id} href={`/blog/${post.slug}`} className={styles.postCard}>
                            <div className={styles.postImageWrap}>
                                <Image src={post.image} alt={post.title} fill className={styles.postImage} sizes="(max-width:768px) 100vw, 33vw" />
                                <span className={styles.postCategoryBadge}>{getCategoryLabel(post.category)}</span>
                            </div>
                            <div className={styles.postBody}>
                                <h3 className={styles.postTitle}>{post.title}</h3>
                                <p className={styles.postExcerpt}>{post.excerpt}</p>
                                <div className={styles.tagRow}>
                                    {post.tags.slice(0, 3).map((t) => (
                                        <span key={t} className={styles.tag}>{t}</span>
                                    ))}
                                </div>
                                <div className={styles.postMeta}>
                                    <span className={styles.postAuthorRow}>
                                        <Image src={post.author.avatar} alt={post.author.name} width={18} height={18} className={styles.authorAvatar} />
                                        {post.author.name}
                                    </span>
                                    <span className={styles.readTime}>
                                        📖 {post.readTime} min
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
