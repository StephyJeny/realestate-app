"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./Navbar.module.css";

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className={`${styles.navbar} ${isScrolled ? styles.scrolled : ""}`}>
            <div className={styles.container}>
                <Link href="/" className={styles.logo}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>Estate<span className={styles.logoAccent}>Vue</span></span>
                </Link>

                <nav className={`${styles.nav} ${isMobileOpen ? styles.navOpen : ""}`}>
                    <Link href="/properties?type=sale" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Buy</Link>
                    <Link href="/properties?type=rent" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Rent</Link>
                    <Link href="/properties" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Properties</Link>
                    <Link href="/agents" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>Agents</Link>
                    <Link href="#about" className={styles.navLink} onClick={() => setIsMobileOpen(false)}>About</Link>
                </nav>

                <div className={styles.actions}>
                    <Link href="#" className={styles.favBtn} aria-label="Saved properties">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>
                    </Link>
                    <Link href="/auth/signin" className="btn btn-primary btn-sm">
                        Sign In
                    </Link>
                </div>

                <button
                    className={`${styles.hamburger} ${isMobileOpen ? styles.hamburgerActive : ""}`}
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>

            {isMobileOpen && <div className={styles.overlay} onClick={() => setIsMobileOpen(false)} />}
        </header>
    );
}
