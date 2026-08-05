import Link from "next/link";
import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
    title: "Privacy Policy — EstateVue",
    description:
        "Learn how EstateVue collects, uses, and protects your personal information. Read our comprehensive privacy policy.",
};

export default function PrivacyPolicyPage() {
    return (
        <div className={styles.legalPage}>
            {/* Hero Section */}
            <section className={styles.heroSection}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroIcon}>
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <h1 className={styles.heroTitle}>Privacy Policy</h1>
                    <p className={styles.heroSubtitle}>
                        Your privacy matters to us. This policy explains how EstateVue collects, uses, stores, and protects your personal information when you use our platform.
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
                            ~7 min read
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
                        <a href="#info-collect" className={styles.tocLink}>Information We Collect</a>
                        <a href="#how-use" className={styles.tocLink}>How We Use Your Information</a>
                        <a href="#info-sharing" className={styles.tocLink}>Information Sharing</a>
                        <a href="#data-storage" className={styles.tocLink}>Data Storage &amp; Security</a>
                        <a href="#cookies" className={styles.tocLink}>Cookies &amp; Tracking</a>
                        <a href="#your-rights" className={styles.tocLink}>Your Rights</a>
                        <a href="#third-party" className={styles.tocLink}>Third-Party Services</a>
                        <a href="#children" className={styles.tocLink}>Children&apos;s Privacy</a>
                        <a href="#changes" className={styles.tocLink}>Policy Changes</a>
                        <a href="#contact" className={styles.tocLink}>Contact Us</a>
                    </div>
                </nav>

                {/* Section 1 */}
                <section id="info-collect" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>1</span>
                        <h2 className={styles.sectionTitle}>Information We Collect</h2>
                    </div>
                    <p className={styles.paragraph}>
                        We collect different types of information to provide and improve our services to you. The information we collect falls into the following categories:
                    </p>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-800)', margin: '1.25rem 0 0.75rem' }}>
                        Personal Information You Provide
                    </h3>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Account Information:</span> Full name, email address, phone number, and password when you create an account.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Agent Information:</span> Agency name, license number, specialization, experience level, and location for agent registrations.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Property Inquiries:</span> Messages, preferences, and inquiry details you submit when contacting agents or property owners.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Profile Data:</span> Any additional information you voluntarily add to your profile, such as a profile photo or bio.</li>
                    </ul>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--navy-800)', margin: '1.25rem 0 0.75rem' }}>
                        Information Collected Automatically
                    </h3>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Usage Data:</span> Pages visited, search queries, properties viewed, time spent on pages, and click patterns.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Device Information:</span> Browser type, operating system, device type, screen resolution, and language preferences.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Location Data:</span> Approximate geographic location based on IP address to provide location-relevant property results.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Log Data:</span> IP address, access times, referring URLs, and other standard web log information.</li>
                    </ul>
                </section>

                {/* Section 2 */}
                <section id="how-use" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>2</span>
                        <h2 className={styles.sectionTitle}>How We Use Your Information</h2>
                    </div>
                    <p className={styles.paragraph}>
                        We use the information we collect for the following purposes:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Platform Operation:</span> To create and manage your account, authenticate your identity, and provide access to platform features.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Property Matching:</span> To show you relevant property listings based on your search history, preferences, and saved properties.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Communication:</span> To send you account-related notifications, agent approval updates, verification codes, and important service announcements.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Agent Verification:</span> To verify agent credentials, license numbers, and professional standing before granting agent access.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Platform Improvement:</span> To analyze usage patterns, fix bugs, improve features, and enhance the overall user experience.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Safety &amp; Security:</span> To detect and prevent fraud, abuse, security incidents, and other harmful activity on the platform.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Legal Compliance:</span> To comply with applicable laws, regulations, legal processes, or enforceable governmental requests.</li>
                    </ul>
                    <div className={styles.infoCard}>
                        <span className={styles.infoCardIcon}>📧</span>
                        <p className={styles.infoCardText}>
                            <strong>Email Communication:</strong> We will never sell or rent your email address. You will only receive emails related to your account activity, agent status updates, or essential platform announcements. You can manage your email preferences at any time.
                        </p>
                    </div>
                </section>

                {/* Section 3 */}
                <section id="info-sharing" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>3</span>
                        <h2 className={styles.sectionTitle}>Information Sharing &amp; Disclosure</h2>
                    </div>
                    <p className={styles.paragraph}>
                        We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following limited circumstances:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>With Agents &amp; Buyers:</span> When you submit an inquiry on a property, your contact information is shared with the listing agent so they can respond to your request.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Service Providers:</span> With trusted third-party service providers who assist us in operating the platform (e.g., email delivery, cloud hosting, analytics), bound by confidentiality agreements.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Legal Requirements:</span> When required by law, legal proceedings, or government authorities, or to protect the rights, property, or safety of EstateVue, its users, or the public.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Business Transfers:</span> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the transaction, with notice provided to you.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>With Your Consent:</span> For any other purpose with your explicit prior consent.</li>
                    </ul>
                </section>

                {/* Section 4 */}
                <section id="data-storage" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>4</span>
                        <h2 className={styles.sectionTitle}>Data Storage &amp; Security</h2>
                    </div>
                    <p className={styles.paragraph}>
                        EstateVue takes the security of your personal information seriously. We implement a variety of security measures to maintain the safety of your data:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Encryption:</span> All data transmitted between your browser and our servers is encrypted using industry-standard SSL/TLS protocols.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Secure Storage:</span> Your data is stored on secure cloud infrastructure provided by Google Firebase, which maintains SOC 1, SOC 2, and SOC 3 compliance.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Password Hashing:</span> Your passwords are cryptographically hashed and never stored in plain text. Even our team cannot access your password.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Access Controls:</span> Access to personal information is strictly limited to authorized personnel who require it for legitimate business purposes.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Data Retention:</span> We retain your personal data only for as long as necessary to fulfill the purposes outlined in this policy or as required by law. You may request deletion of your data at any time.</li>
                    </ul>
                    <div className={`${styles.infoCard} ${styles.warning}`}>
                        <span className={styles.infoCardIcon}>⚠️</span>
                        <p className={styles.infoCardText}>
                            <strong>Important:</strong> While we implement robust security measures, no method of transmission over the internet or electronic storage is 100% secure. We cannot guarantee absolute security but are committed to protecting your data to the best of our ability.
                        </p>
                    </div>
                </section>

                {/* Section 5 */}
                <section id="cookies" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>5</span>
                        <h2 className={styles.sectionTitle}>Cookies &amp; Tracking Technologies</h2>
                    </div>
                    <p className={styles.paragraph}>
                        EstateVue uses cookies and similar tracking technologies to enhance your browsing experience. Here&apos;s how we use them:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Essential Cookies:</span> Required for the platform to function properly, including authentication, session management, and security features. These cannot be disabled.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Preference Cookies:</span> Store your preferences such as theme selection (dark/light mode), language, and recently viewed properties.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Analytics Cookies:</span> Help us understand how users interact with our platform so we can improve features and user experience. These collect anonymized, aggregate data only.</li>
                    </ul>
                    <p className={styles.paragraph}>
                        You can control cookie settings through your browser preferences. However, disabling essential cookies may limit your ability to use certain platform features.
                    </p>
                </section>

                {/* Section 6 */}
                <section id="your-rights" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>6</span>
                        <h2 className={styles.sectionTitle}>Your Rights</h2>
                    </div>
                    <p className={styles.paragraph}>
                        You have the following rights regarding your personal information:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Right to Access:</span> You can request a copy of the personal data we hold about you at any time.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Right to Rectification:</span> You can update or correct your personal information through your account settings or by contacting us.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Right to Deletion:</span> You can request that we delete your personal data. We will comply unless retention is required for legal obligations or legitimate business purposes.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Right to Object:</span> You can object to the processing of your personal data for certain purposes, including direct marketing.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Right to Data Portability:</span> You can request your data in a structured, commonly used, and machine-readable format.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Right to Withdraw Consent:</span> Where we rely on your consent to process personal data, you may withdraw that consent at any time.</li>
                    </ul>
                    <p className={styles.paragraph}>
                        To exercise any of these rights, please contact us at <span className={styles.highlight}>hello@estatevue.com</span>. We will respond to your request within 30 days.
                    </p>
                </section>

                {/* Section 7 */}
                <section id="third-party" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>7</span>
                        <h2 className={styles.sectionTitle}>Third-Party Services</h2>
                    </div>
                    <p className={styles.paragraph}>
                        Our platform integrates with the following third-party services. Each has its own privacy policy governing the use of your data:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}><span className={styles.highlight}>Google Firebase:</span> Used for authentication, database storage, and cloud functions. Data is stored in compliance with Google&apos;s security standards.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>EmailJS:</span> Used for transactional email delivery (e.g., verification codes, approval notifications). Only necessary email data is shared.</li>
                        <li className={styles.listItem}><span className={styles.highlight}>Google Authentication:</span> If you sign in with Google, we receive basic profile information (name, email, profile picture) from your Google account.</li>
                    </ul>
                    <p className={styles.paragraph}>
                        We encourage you to review the privacy policies of these third-party services. EstateVue is not responsible for the privacy practices of external websites or services linked from our platform.
                    </p>
                </section>

                {/* Section 8 */}
                <section id="children" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>8</span>
                        <h2 className={styles.sectionTitle}>Children&apos;s Privacy</h2>
                    </div>
                    <p className={styles.paragraph}>
                        EstateVue is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child without verifiable parental consent, we will take immediate steps to delete that information from our servers.
                    </p>
                    <p className={styles.paragraph}>
                        If you are a parent or guardian and believe that your child has provided us with personal information, please contact us immediately at <span className={styles.highlight}>hello@estatevue.com</span>.
                    </p>
                </section>

                {/* Section 9 */}
                <section id="changes" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>9</span>
                        <h2 className={styles.sectionTitle}>Changes to This Privacy Policy</h2>
                    </div>
                    <p className={styles.paragraph}>
                        We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. When we make significant changes, we will:
                    </p>
                    <ul className={styles.list}>
                        <li className={styles.listItem}>Update the &quot;Effective Date&quot; at the top of this policy.</li>
                        <li className={styles.listItem}>Notify you via email or a prominent notice on the Platform at least <span className={styles.highlight}>30 days before</span> the changes take effect.</li>
                        <li className={styles.listItem}>Provide a summary of the key changes for your convenience.</li>
                    </ul>
                    <p className={styles.paragraph}>
                        We encourage you to review this Privacy Policy periodically. Your continued use of EstateVue after the effective date of any changes constitutes your acceptance of the updated policy.
                    </p>
                </section>

                {/* Section 10 */}
                <section id="contact" className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <span className={styles.sectionNumber}>10</span>
                        <h2 className={styles.sectionTitle}>Contact Us</h2>
                    </div>
                    <p className={styles.paragraph}>
                        If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your data, please contact us. We welcome your feedback and are committed to resolving any privacy-related concerns.
                    </p>
                </section>

                {/* Contact Card */}
                <div className={styles.contactBox}>
                    <div className={styles.contactBoxContent}>
                        <h3 className={styles.contactBoxTitle}>Privacy Concerns?</h3>
                        <p className={styles.contactBoxText}>
                            We take your privacy seriously. If you have any questions or wish to exercise your data rights, reach out to us.
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
                    <Link href="/legal/terms" className={styles.crossNavLink}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                        </svg>
                        Read Terms of Service
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    );
}
