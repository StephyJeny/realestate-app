"use client";
import { useState, useEffect } from "react";
import styles from "./CookieConsent.module.css";

export default function CookieConsent() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem("estatevue-cookie-consent");
        if (!consent) {
            // Small delay so it doesn't flash immediately on load
            const timer = setTimeout(() => setShow(true), 2000);
            return () => clearTimeout(timer);
        }
    }, []);

    const accept = () => {
        localStorage.setItem("estatevue-cookie-consent", "accepted");
        setShow(false);
    };

    const decline = () => {
        localStorage.setItem("estatevue-cookie-consent", "declined");
        setShow(false);
    };

    if (!show) return null;

    return (
        <div className={styles.banner}>
            <div className={styles.content}>
                <div className={styles.icon}>🍪</div>
                <div className={styles.text}>
                    <p className={styles.title}>We value your privacy</p>
                    <p className={styles.description}>
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                        By clicking &ldquo;Accept&rdquo;, you consent to our use of cookies.
                    </p>
                </div>
                <div className={styles.actions}>
                    <button onClick={decline} className={styles.btnDecline}>Decline</button>
                    <button onClick={accept} className={styles.btnAccept}>Accept All</button>
                </div>
            </div>
        </div>
    );
}
