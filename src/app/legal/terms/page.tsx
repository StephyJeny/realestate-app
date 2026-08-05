import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
    title: "Terms of Service — EstateVue",
    description:
        "Read the EstateVue Terms of Service. Learn about the rules, responsibilities, and conditions for using our real estate platform.",
};

export default function TermsOfServicePage() {
    return (
        <div className={styles.legalPage}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                            <line x1="16" y1="13" x2="8" y2="13" />
                            <line x1="16" y1="17" x2="8" y2="17" />
                            <polyline points="10 9 9 9 8 9" />
                        </svg>
                    </div>
                    <h1 className={styles.heroTitle}>Terms of Service</h1>
                    <p className={styles.heroSubtitle}>
                        Please read these terms carefully before using EstateVue. By accessing our platform, you agree to be bound by these terms and conditions.
                    </p>
                    <div className={styles.metaInfo}>
                        <span className={styles.metaBadge}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                            Effective: August 5, 2026
                        </span>
                        <span className={styles.metaBadge}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                            </svg>
                            ~8 min read
                        </span>
                    </div>
                </div>
            </section>

            {/* Content */}
            <div className={styles.contentContainer}>
                {/* Table of Contents */}
                <nav className={styles.tableOfContents}>
                    <h2 className={styles.tocTitle}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                        </svg>
                        Table of Contents
                    </h2>
                    <div className={styles.tocGrid}>
                        <a href="#acceptance" className={styles.tocLink}>Acceptance of Terms</a>
                        <a href="#eligibility" className={styles.tocLink}>Eligibility</a>
                        <a href="#accounts" className={styles.tocLink}>User Accounts</a>
                        <a href="#buyer-terms" className={styles.tocLink}>Buyer Terms</a>
                        <a href="#agent-terms" className={styles.tocLink}>Agent Terms</a>
                        <a href="#listings" className={styles.tocLink}>Property Listings</a>
                        <a href="#prohibited" className={styles.tocLink}>Prohibited Activities</a>
                        <a href="#ip" className={styles.tocLink}>Intellectual Property</a>
                        <a href="#liability" className={styles.tocLink}>Limitation of Liability</a>
                        <a href="#termination" className={styles.tocLink}>Termination</a>
                        <a href="#changes" className={styles.tocLink}>Changes to Terms</a>
                        <a href="#contact" className={styles.tocLink}>Contact Us</a>
                    </div>
                </nav>

                {/* Section 1 */}
                <section id="acceptance" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>1</span>
                        <h2 className={styles.sectionTitle}>Acceptance of Terms</h2>
                    </div>
                    <p className={styles.paragraph}>
                        By accessing, browsing, or using <span className={styles.highlight}>EstateVue</span> (the &quot;Platform&quot;), including all associated websites, mobile applications, and services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service (&quot;Terms&quot;).
                    </p>
                    <p className={styles.paragraph}>
                        If you do not agree with any part of these Terms, you must discontinue use of the Platform immediately. These Terms constitute a legally binding agreement between you and EstateVue.
                    </p>
                </section>

                {/* Section 2 */}
                <section id="eligibility" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>2</span>
                        <h2 className={styles.sectionTitle}>Eligibility</h2>
                    </div>
                    <p className={styles.paragraph}>
                        To use EstateVue, you must meet the following eligibility requirements:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>You must be at least <span className={styles.highlight}>18 years of age</span> or the legal age of majority in your jurisdiction.</li>
                        <li className={styles.listItem}>You must have the legal capacity to enter into binding contracts.</li>
                        <li className={styles.listItem}>You must not have been previously banned or suspended from using the Platform.</li>
                        <li className={styles.listItem}>If registering as an agent, you must hold a valid real estate license or certification recognized in Kenya.</li>
                    </ul>
                </section>

                {/* Section 3 */}
                <section id="accounts" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>3</span>
                        <h2 className={styles.sectionTitle}>User Accounts</h2>
                    </div>
                    <p className={styles.paragraph}>
                        When you create an account on EstateVue, you agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Account Security:</span> You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>One Account Per Person:</span> Each individual may only maintain one account. Creating multiple accounts may result in suspension or termination.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Notification of Breach:</span> You must notify us immediately of any unauthorized use of your account or any other breach of security.</li>
                    </ul>
                    <div className={styles.infoCard}>
                        <span className={styles.infoCardIcon}>🔐</span>
                        <p className={styles.infoCardText}>
                            <strong>Security Tip:</strong> We recommend using a strong, unique password and enabling additional security measures when available. EstateVue will never ask for your password via email or phone.
                        </p>
                    </div>
                </section>

                {/* Section 4 */}
                <section id="buyer-terms" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>4</span>
                        <h2 className={styles.sectionTitle}>Buyer Terms</h2>
                    </div>
                    <p className={styles.paragraph}>
                        As a buyer on EstateVue, you understand and agree that:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Property listings are provided for <span className={styles.highlight}>informational purposes only</span>. EstateVue does not guarantee the accuracy, completeness, or availability of any listing.</li>
                        <li className={styles.listItem}>You are responsible for conducting your own due diligence before entering into any real estate transaction, including property inspections, title searches, and legal consultations.</li>
                        <li className={styles.listItem}>EstateVue is a <span className={styles.highlight}>marketplace platform</span> and is not a party to any transaction between buyers and sellers or agents.</li>
                        <li className={styles.listItem}>Any disputes arising from a transaction must be resolved directly between the involved parties. EstateVue may facilitate communication but bears no liability for transaction outcomes.</li>
                        <li className={styles.listItem}>Property prices displayed on the platform are subject to change without notice and may not include taxes, fees, or other costs.</li>
                    </ul>
                </section>

                {/* Section 5 */}
                <section id="agent-terms" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>5</span>
                        <h2 className={styles.sectionTitle}>Agent Terms</h2>
                    </div>
                    <p className={styles.paragraph}>
                        If you register as a real estate agent on EstateVue, the following additional terms apply:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Verification Required:</span> Agent accounts require admin approval. You must provide a valid license number in the required format and accurate professional credentials.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Listing Accuracy:</span> You are solely responsible for the accuracy of all property listings you submit, including descriptions, pricing, images, and availability status.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Professional Conduct:</span> You agree to conduct all interactions with buyers and other users in a professional, truthful, and ethical manner consistent with applicable real estate laws and regulations.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>License Validity:</span> You must maintain an active and valid real estate license throughout your use of the Platform. If your license is revoked or suspended, you must notify EstateVue immediately.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>No Misleading Information:</span> Posting fraudulent, misleading, or deceptive listings is strictly prohibited and may result in immediate account termination and potential legal action.</li>
                    </ul>
                    <div className={`${styles.infoCard} ${styles.warning}`}>
                        <span className={styles.infoCardIcon}>⚠️</span>
                        <p className={styles.infoCardText}>
                            <strong>Important:</strong> EstateVue reserves the right to remove any listing, reject any agent application, or suspend agent accounts at its sole discretion if any terms are violated.
                        </p>
                    </div>
                </section>

                {/* Section 6 */}
                <section id="listings" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>6</span>
                        <h2 className={styles.sectionTitle}>Property Listings</h2>
                    </div>
                    <p className={styles.paragraph}>
                        EstateVue serves as a platform for connecting property seekers with agents and property owners. Regarding property listings:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>All listings are posted by registered agents or property owners and <span className={styles.highlight}>do not represent offers</span> from EstateVue.</li>
                        <li className={styles.listItem}>EstateVue makes reasonable efforts to ensure listing quality but does not independently verify all listing details.</li>
                        <li className={styles.listItem}>Images and virtual tours are representative and may differ from the actual property condition.</li>
                        <li className={styles.listItem}>Listing availability is subject to change. A property shown as available may have been sold or rented since the last update.</li>
                    </ul>
                </section>

                {/* Section 7 */}
                <section id="prohibited" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>7</span>
                        <h2 className={styles.sectionTitle}>Prohibited Activities</h2>
                    </div>
                    <p className={styles.paragraph}>
                        You agree not to engage in any of the following activities while using EstateVue:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Posting false, misleading, or fraudulent property listings or personal information.</li>
                        <li className={styles.listItem}>Impersonating any person or entity, or falsely claiming an affiliation with any person or entity.</li>
                        <li className={styles.listItem}>Attempting to gain unauthorized access to other users&apos; accounts, the Platform&apos;s systems, or related networks.</li>
                        <li className={styles.listItem}>Using the Platform for any illegal purpose or in violation of any local, national, or international law.</li>
                        <li className={styles.listItem}>Scraping, data mining, or using automated tools to collect information from the Platform without prior written consent.</li>
                        <li className={styles.listItem}>Distributing spam, unsolicited advertisements, or any form of harassment to other users.</li>
                        <li className={styles.listItem}>Interfering with or disrupting the Platform&apos;s infrastructure, servers, or networks.</li>
                    </ul>
                </section>

                {/* Section 8 */}
                <section id="ip" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>8</span>
                        <h2 className={styles.sectionTitle}>Intellectual Property</h2>
                    </div>
                    <p className={styles.paragraph}>
                        All content, features, and functionality on EstateVue — including but not limited to text, graphics, logos, icons, images, audio clips, software, and the compilation thereof — are the exclusive property of EstateVue or its content suppliers and are protected by Kenyan and international copyright, trademark, and other intellectual property laws.
                    </p>
                    <p className={styles.paragraph}>
                        You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any content from the Platform without the prior written permission of EstateVue, except for personal, non-commercial use related to property browsing.
                    </p>
                </section>

                {/* Section 9 */}
                <section id="liability" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>9</span>
                        <h2 className={styles.sectionTitle}>Limitation of Liability</h2>
                    </div>
                    <p className={styles.paragraph}>
                        To the fullest extent permitted by law, <span className={styles.highlight}>EstateVue shall not be liable</span> for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Loss of profits, data, or business opportunities arising from the use or inability to use the Platform.</li>
                        <li className={styles.listItem}>Any errors, inaccuracies, or omissions in property listings or other content.</li>
                        <li className={styles.listItem}>Property transactions conducted through or facilitated by the Platform.</li>
                        <li className={styles.listItem}>Unauthorized access to or alteration of your transmissions or data.</li>
                        <li className={styles.listItem}>Any conduct of any third party on the Platform.</li>
                    </ul>
                    <p className={styles.paragraph}>
                        EstateVue provides the platform <span className={styles.highlight}>&quot;as is&quot;</span> and <span className={styles.highlight}>&quot;as available&quot;</span> without warranties of any kind, whether express or implied, including fitness for a particular purpose or non-infringement.
                    </p>
                </section>

                {/* Section 10 */}
                <section id="termination" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>10</span>
                        <h2 className={styles.sectionTitle}>Termination</h2>
                    </div>
                    <p className={styles.paragraph}>
                        EstateVue may terminate or suspend your access to the Platform immediately, without prior notice or liability, for any reason, including without limitation if you breach these Terms.
                    </p>
                    <p className={styles.paragraph}>
                        Upon termination, your right to use the Platform will cease immediately. If you wish to terminate your account, you may do so by contacting our support team. Termination does not relieve you of any obligations incurred before the termination date.
                    </p>
                </section>

                {/* Section 11 */}
                <section id="changes" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>11</span>
                        <h2 className={styles.sectionTitle}>Changes to Terms</h2>
                    </div>
                    <p className={styles.paragraph}>
                        EstateVue reserves the right to modify or replace these Terms at any time at our sole discretion. If a revision is material, we will provide at least <span className={styles.highlight}>30 days&apos; notice</span> before any new terms take effect via email notification or prominent notice on the Platform.
                    </p>
                    <p className={styles.paragraph}>
                        Your continued use of the Platform after any changes constitutes acceptance of the new Terms. We encourage you to review these Terms periodically to stay informed of updates.
                    </p>
                </section>

                {/* Section 12 */}
                <section id="contact" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>12</span>
                        <h2 className={styles.sectionTitle}>Contact Us</h2>
                    </div>
                    <p className={styles.paragraph}>
                        If you have any questions about these Terms of Service, please do not hesitate to contact us. We are committed to addressing your concerns promptly.
                    </p>
                </section>

                {/* Contact Card */}
                <div className={styles.contactBox}>
                    <div className={styles.contactBoxContent}>
                        <h3 className={styles.contactBoxTitle}>Have Questions?</h3>
                        <p className={styles.contactBoxText}>
                            Our team is here to help clarify anything about our terms. Reach out to us anytime.
                        </p>
                        <Link href="mailto:hello@estatevue.com" className={styles.contactBoxLink}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                <polyline points="22,6 12,13 2,6" />
                            </svg>
                            hello@estatevue.com
                        </Link>
                    </div>
                </div>

                {/* Cross Nav */}
                <div className={styles.crossNav}>
                    <Link href="/legal/privacy" className={styles.crossNavLink}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Read Privacy Policy
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
