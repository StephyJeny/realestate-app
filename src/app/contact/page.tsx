"use client";
import { useState } from "react";
import styles from "./page.module.css";
import toast from "react-hot-toast";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
    });
    const [sending, setSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            toast.error("Please fill in all required fields");
            return;
        }
        setSending(true);
        // Simulate sending
        await new Promise((r) => setTimeout(r, 1500));
        toast.success("Message sent successfully! We'll get back to you soon. 📬");
        setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
        setSending(false);
    };

    return (
        <div className={styles.page}>
            {/* Hero */}
            <div className={styles.hero}>
                <div className="container">
                    <h1 className={styles.heroTitle}>Get in Touch</h1>
                    <p className={styles.heroSubtitle}>
                        Have questions about a property or need expert guidance? We&apos;re here to help.
                    </p>
                </div>
            </div>

            <div className={`container ${styles.content}`}>
                <div className={styles.grid}>
                    {/* Contact Info */}
                    <div className={styles.infoCol}>
                        <div className={styles.infoCard}>
                            <div className={styles.infoIcon}>📍</div>
                            <h3>Visit Us</h3>
                            <p>Westlands Business Park, 4th Floor</p>
                            <p>Waiyaki Way, Nairobi, Kenya</p>
                        </div>
                        <div className={styles.infoCard}>
                            <div className={styles.infoIcon}>📞</div>
                            <h3>Call Us</h3>
                            <p>+254 700 123 456</p>
                            <p>Mon-Fri: 8am - 6pm EAT</p>
                        </div>
                        <div className={styles.infoCard}>
                            <div className={styles.infoIcon}>✉️</div>
                            <h3>Email Us</h3>
                            <p>hello@estatevue.com</p>
                            <p>We respond within 24 hours</p>
                        </div>
                        <div className={styles.infoCard}>
                            <div className={styles.infoIcon}>💬</div>
                            <h3>Live Chat</h3>
                            <p>Chat with our AI assistant</p>
                            <p>Available 24/7 on every page</p>
                        </div>
                    </div>

                    {/* Contact Form */}
                    <div className={styles.formCol}>
                        <div className={styles.formCard}>
                            <h2 className={styles.formTitle}>Send Us a Message</h2>
                            <p className={styles.formSubtitle}>Fill out the form below and our team will reach out to you promptly.</p>
                            <form onSubmit={handleSubmit} className={styles.form}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Full Name *</label>
                                        <input
                                            type="text"
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Email Address *</label>
                                        <input
                                            type="email"
                                            placeholder="john@example.com"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label>Phone Number</label>
                                        <input
                                            type="tel"
                                            placeholder="+254 7XX XXX XXX"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label>Subject</label>
                                        <select
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        >
                                            <option value="">Select a topic</option>
                                            <option value="buying">Buying a Property</option>
                                            <option value="selling">Selling a Property</option>
                                            <option value="renting">Renting</option>
                                            <option value="agent">Becoming an Agent</option>
                                            <option value="support">Technical Support</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Message *</label>
                                    <textarea
                                        placeholder="Tell us how we can help you..."
                                        rows={5}
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={styles.submitBtn}
                                    disabled={sending}
                                >
                                    {sending ? "Sending..." : "Send Message"}
                                    {!sending && (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
