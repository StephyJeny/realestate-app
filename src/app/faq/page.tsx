"use client";
import { useState } from "react";
import styles from "./page.module.css";

const faqCategories = [
    {
        name: "Buying",
        icon: "🏠",
        faqs: [
            {
                q: "How do I search for properties on EstateVue?",
                a: "Use our Properties page to browse all listings. You can filter by property type, bedrooms, price range, and listing type (sale/rent). Use the search bar to find properties by location, name, or type."
            },
            {
                q: "How do I make an offer on a property?",
                a: "Navigate to the property you're interested in and click \"Send Inquiry\". Select \"Make an Offer\" from the inquiry type dropdown, enter your details and message, and submit. The listing agent will receive your offer via email and dashboard notification."
            },
            {
                q: "What is the typical buying process in Kenya?",
                a: "The process typically involves: (1) Property search and viewing, (2) Making an offer, (3) Due diligence and property valuation, (4) Signing the sale agreement, (5) Payment and title transfer, (6) Stamp duty and registration. Our agents guide you through every step."
            },
            {
                q: "Are there any hidden fees when buying property?",
                a: "Common costs include: stamp duty (2-4% of property value), legal fees (1-2%), valuation fees, and agency fees. Our agents are transparent about all costs upfront so there are no surprises."
            },
        ],
    },
    {
        name: "Selling",
        icon: "💰",
        faqs: [
            {
                q: "How do I list my property on EstateVue?",
                a: "Sign up as an agent on our platform. Once your application is approved and verified, you can add properties from your Agent Dashboard with photos, descriptions, pricing, and amenities."
            },
            {
                q: "How long does it take to sell a property?",
                a: "This varies depending on the property type, location, pricing, and market conditions. Well-priced properties in popular areas can sell within weeks, while others may take a few months. Our agents provide pricing guidance to help you sell faster."
            },
            {
                q: "What commission do agents charge?",
                a: "Agent commissions typically range from 2-5% of the sale price in Kenya. The specific rate is agreed upon between you and your agent before listing."
            },
        ],
    },
    {
        name: "Renting",
        icon: "🔑",
        faqs: [
            {
                q: "How do I request a property viewing?",
                a: "On any property listing page, click \"Send Inquiry\" and select \"Request a Viewing\". Provide your preferred date and time in the message, and the agent will confirm the viewing."
            },
            {
                q: "What documents do I need to rent a property?",
                a: "Typically you'll need: a valid ID/passport, proof of income (pay slips or bank statements), references from previous landlords, and a deposit (usually 1-3 months' rent)."
            },
            {
                q: "Can I negotiate the rental price?",
                a: "Yes! Many landlords are open to negotiation, especially for long-term tenancies. Your agent can help negotiate favorable terms on your behalf."
            },
        ],
    },
    {
        name: "For Agents",
        icon: "👔",
        faqs: [
            {
                q: "How do I become a verified agent on EstateVue?",
                a: "Sign up and select \"Real Estate Agent\" as your role. Provide your license number, agency details, and specialization. After admin review, you'll receive a verification code via email to activate your account."
            },
            {
                q: "How do I manage my listings?",
                a: "Once verified, access your Agent Dashboard to add, edit, and manage properties. You'll also receive inquiries and viewing requests directly in your dashboard with email notifications."
            },
            {
                q: "Is there a limit to how many properties I can list?",
                a: "Currently, there's no limit on the number of properties you can list. We encourage agents to keep their listings up-to-date and remove sold/rented properties promptly."
            },
        ],
    },
    {
        name: "Account",
        icon: "⚙️",
        faqs: [
            {
                q: "How do I reset my password?",
                a: "Go to the Sign In page and click \"Forgot Password\". Enter your email address and you'll receive a password reset link. You can also access it directly at /auth/reset."
            },
            {
                q: "How do I save properties to view later?",
                a: "Click the heart icon on any property card to save it to your favorites. Access your saved properties from the heart icon in the navigation bar or from your Buyer Dashboard under \"Saved Properties\"."
            },
            {
                q: "Is my personal information secure?",
                a: "Yes. We use Firebase Authentication for secure login and data encryption. We never share your personal information with third parties without your consent. Read our Privacy Policy for more details."
            },
        ],
    },
];

export default function FAQPage() {
    const [activeCategory, setActiveCategory] = useState(0);
    const [openItems, setOpenItems] = useState<Set<string>>(new Set());

    const toggleItem = (key: string) => {
        const next = new Set(openItems);
        if (next.has(key)) {
            next.delete(key);
        } else {
            next.add(key);
        }
        setOpenItems(next);
    };

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Frequently Asked Questions</h1>
                    <p className={styles.heroSubtitle}>
                        Find answers to common questions about buying, selling, and renting properties on EstateVue.
                    </p>
                </div>
            </div>

            <div className={`container ${styles.content}`}>
                {/* Category Tabs */}
                <div className={styles.tabs}>
                    {faqCategories.map((cat, i) => (
                        <button
                            key={cat.name}
                            className={`${styles.tab} ${activeCategory === i ? styles.tabActive : ""}`}
                            onClick={() => setActiveCategory(i)}
                        >
                            <span className={styles.tabIcon}>{cat.icon}</span>
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* FAQ Items */}
                <div className={styles.faqList}>
                    {faqCategories[activeCategory].faqs.map((faq, j) => {
                        const key = `${activeCategory}-${j}`;
                        const isOpen = openItems.has(key);
                        return (
                            <div key={key} className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ""}`}>
                                <button className={styles.faqQuestion} onClick={() => toggleItem(key)}>
                                    <span>{faq.q}</span>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.faqChevron}>
                                        <polyline points="6 9 12 15 18 9" />
                                    </svg>
                                </button>
                                {isOpen && (
                                    <div className={styles.faqAnswer}>
                                        <p>{faq.a}</p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Still need help */}
                <div className={styles.helpCard}>
                    <div className={styles.helpIcon}>🤔</div>
                    <h3>Still have questions?</h3>
                    <p>Our team is ready to help you find the answers you need.</p>
                    <div className={styles.helpActions}>
                        <a href="/contact" className={styles.helpBtn}>Contact Us</a>
                        <span className={styles.helpOr}>or</span>
                        <span className={styles.helpChat}>Use the chat widget in the bottom-right corner 💬</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
