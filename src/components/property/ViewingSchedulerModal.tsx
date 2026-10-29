"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
    Calendar,
    Clock,
    MapPin,
    Video,
    Download,
    Sparkles,
    MessageSquare,
    ExternalLink,
    CalendarCheck,
} from "@/components/icons/Icons";
import styles from "./ViewingSchedulerModal.module.css";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { useDialogA11y } from "@/hooks/useDialogA11y";
import { sendInquiry } from "@/lib/firestore";
import {
    DIASPORA_TIMEZONES,
    convertEATSlotToTimezone,
    parseNairobiSlotToUTC,
} from "@/lib/diaspora";

interface ViewingSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: "in_person" | "virtual";
    property: {
        id: string;
        title: string;
        price: number;
        currency?: string;
        city: string;
        neighborhood?: string;
        images?: string[];
        agentId?: string;
        agentName?: string;
        agentPhone?: string;
        openHouseDate?: string;
    };
}

export default function ViewingSchedulerModal({
    isOpen,
    onClose,
    defaultMode,
    property,
}: ViewingSchedulerModalProps) {
    const { user, userProfile } = useAuth();
    const {
        formatCurrencyFull,
        diasporaMode,
        buyerTimezone,
        setBuyerTimezone,
    } = useCurrency();
    const dialogRef = useDialogA11y(isOpen, onClose);

    // Scheduling states
    const [mode, setMode] = useState<"in_person" | "virtual">(
        defaultMode || (diasporaMode ? "virtual" : "in_person")
    );
    const [videoPlatform, setVideoPlatform] = useState<"WhatsApp Video" | "Google Meet" | "Zoom">("Google Meet");
    const [requestOfflineRecording, setRequestOfflineRecording] = useState<boolean>(true);
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    });
    const [selectedSlot, setSelectedSlot] = useState<string>("11:00 AM");

    // Buyer info
    const [fullName, setFullName] = useState(userProfile?.displayName || user?.displayName || "");
    const [phone, setPhone] = useState(userProfile?.phone || "");
    const [email, setEmail] = useState(user?.email || "");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBooked, setIsBooked] = useState(false);
    const [bookingError, setBookingError] = useState("");

    if (!isOpen) return null;

    // Available Nairobi / Mombasa EAT slots
    const slots = [
        "09:30 AM",
        "11:00 AM",
        "01:30 PM",
        "03:00 PM",
        "04:30 PM",
        "05:30 PM",
    ];

    const getQuickDates = () => {
        const today = new Date();
        const tomorrow = new Date();
        tomorrow.setDate(today.getDate() + 1);

        const saturday = new Date();
        const daysToSat = (6 - today.getDay() + 7) % 7 || 7;
        saturday.setDate(today.getDate() + daysToSat);

        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);

        const fmt = (d: Date) => d.toISOString().split("T")[0];

        return [
            { label: "Today", date: fmt(today) },
            { label: "Tomorrow", date: fmt(tomorrow) },
            { label: "This Sat", date: fmt(saturday) },
            { label: "This Sun", date: fmt(sunday) },
        ];
    };

    const quickDates = getQuickDates();

    // True UTC start & end anchored to East Africa Time (UTC+3)
    const getScheduledDateTime = () => {
        const start = parseNairobiSlotToUTC(selectedDate, selectedSlot);
        const end = new Date(start.getTime() + 45 * 60 * 1000);
        return { start, end };
    };

    const selectedConverted = convertEATSlotToTimezone(selectedDate, selectedSlot, buyerTimezone);
    const showConvertedTz = mode === "virtual" && buyerTimezone !== "Africa/Nairobi";

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const tourType =
            mode === "virtual"
                ? `Live Virtual Walkthrough (${videoPlatform})`
                : "In-Person Site Visit";
        const tzSuffix = showConvertedTz
            ? ` [Buyer Local: ${selectedConverted.localTimeLabel} — ${buyerTimezone}]`
            : "";
        const recSuffix =
            mode === "virtual" && requestOfflineRecording
                ? " • Requested 4K Walkthrough & Street Drive-By Recording."
                : "";
        const locationStr =
            mode === "virtual"
                ? `${videoPlatform} Live Stream`
                : `${property.title}, ${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}`;

        const viewingMessage =
            `Requested ${tourType} on ${selectedDate} at ${selectedSlot} EAT${tzSuffix} (${locationStr}).` +
            recSuffix +
            (note ? ` Notes: "${note}"` : "") +
            ` Attendee Phone: ${phone}`;

        try {
            await sendInquiry({
                propertyId: property.id,
                propertyTitle: property.title,
                senderId: user?.uid || "guest",
                senderName: fullName.trim() || "Prospective Buyer",
                senderEmail: email.trim(),
                senderPhone: phone.trim() || "Not specified",
                agentId: property.agentId || "agent-demo",
                agentName: property.agentName,
                message: viewingMessage,
                type: "viewing",
            });

            setBookingError("");
            setIsBooked(true);
        } catch (err) {
            console.error("Failed to book viewing:", err);
            setBookingError(
                "We couldn't save your viewing request. Please check your connection and try again, or contact the agent on WhatsApp."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const getGoogleCalendarUrl = () => {
        const { start, end } = getScheduledDateTime();
        const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const title = `${mode === "virtual" ? `🎥 ${videoPlatform} Tour` : "🏠 Site Viewing"}: ${property.title}`;
        const location =
            mode === "virtual"
                ? `${videoPlatform} Live Video Walkthrough`
                : `${property.title}, ${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}, Kenya`;
        const details = `Property Viewing arranged via EstateVue.\nProperty: ${property.title}\nAgent: ${property.agentName || "Listing Agent"} (${property.agentPhone || ""})\nMode: ${mode === "virtual" ? `Live Virtual Tour (${videoPlatform})` : "In-Person Site Visit"}\nNairobi Time: ${selectedSlot} EAT${showConvertedTz ? `\nYour Local Time: ${selectedConverted.localTimeLabel} (${buyerTimezone})` : ""}\nBuyer: ${fullName} (${phone})`;

        const params = new URLSearchParams({
            action: "TEMPLATE",
            text: title,
            dates: `${formatTime(start)}/${formatTime(end)}`,
            details,
            location,
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    const handleDownloadICS = () => {
        const { start, end } = getScheduledDateTime();
        const formatICSDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const title = `${mode === "virtual" ? `${videoPlatform} Virtual Tour` : "Property Viewing"} - ${property.title}`;
        const location =
            mode === "virtual"
                ? `${videoPlatform} Live Walkthrough`
                : `${property.title}, ${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}`;
        const description = `Viewing for ${property.title} scheduled through EstateVue.\\nAgent: ${property.agentName || "Listing Agent"} (${property.agentPhone || ""})\\nNairobi Time: ${selectedSlot} EAT${showConvertedTz ? ` (${selectedConverted.localTimeLabel} ${buyerTimezone})` : ""}\\nBuyer: ${fullName} (${phone})`;

        const icsData = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//EstateVue Kenya//Tour Scheduler//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            `UID:viewing-${Date.now()}@estatevue.co.ke`,
            `DTSTAMP:${formatICSDate(new Date())}`,
            `DTSTART:${formatICSDate(start)}`,
            `DTEND:${formatICSDate(end)}`,
            `SUMMARY:${title}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            "STATUS:CONFIRMED",
            "END:VEVENT",
            "END:VCALENDAR",
        ].join("\r\n");

        const blob = new Blob([icsData], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `viewing-${property.id}-${selectedDate}.ics`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const getWhatsAppUrl = () => {
        const cleanPhone = (property.agentPhone || "+254700123456").replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.startsWith("0") ? `254${cleanPhone.slice(1)}` : cleanPhone;
        const text = encodeURIComponent(
            `Hi ${property.agentName || "Agent"}, I just booked a ${mode === "virtual" ? `${videoPlatform} live walkthrough` : "site viewing"} for "${property.title}" on ${selectedDate} at ${selectedSlot} EAT${showConvertedTz ? ` (${selectedConverted.localTimeLabel} my time)` : ""}. My name is ${fullName}. Looking forward!`
        );
        return `https://wa.me/${formattedPhone}?text=${text}`;
    };

    const propertyImage = property.images?.[0] || "/images/property-1.png";

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div
                ref={dialogRef}
                className={styles.modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="viewing-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={styles.header}>
                    <h3 id="viewing-modal-title" className={styles.title}>
                        <CalendarCheck size={20} color="var(--gold-600, #d97706)" />
                        Schedule Viewing &amp; Diaspora Live Tour
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
                        ✕
                    </button>
                </div>

                {/* Body */}
                <div className={styles.body}>
                    {/* Property info bar */}
                    <div className={styles.propBanner}>
                        <div className={styles.propThumb}>
                            <Image
                                src={propertyImage}
                                alt={property.title}
                                fill
                                style={{ objectFit: "cover" }}
                            />
                        </div>
                        <div className={styles.propDetails}>
                            <div className={styles.propTitle}>{property.title}</div>
                            <div className={styles.propLoc}>
                                📍 {property.neighborhood ? `${property.neighborhood}, ` : ""}{property.city}
                            </div>
                            <div className={styles.propPrice}>
                                {formatCurrencyFull(property.price)}
                            </div>
                        </div>
                    </div>

                    {!isBooked ? (
                        <>
                            {/* Open House Notice */}
                            <div className={styles.openHouseNotice}>
                                <div>
                                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#b45309", fontWeight: 800 }}>
                                        🎪 Upcoming Public Open House
                                    </div>
                                    <p className={styles.openHouseNoticeText}>
                                        {property.openHouseDate || "This Saturday, 10:00 AM – 2:00 PM EAT (Refreshments served)"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    className={styles.rsvpBtn}
                                    onClick={() => {
                                        setSelectedDate(quickDates[2].date);
                                        setSelectedSlot("11:00 AM");
                                        setMode("in_person");
                                    }}
                                >
                                    Select Slot
                                </button>
                            </div>

                            {/* Mode Tabs */}
                            <div className={styles.modeTabs}>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${mode === "in_person" ? styles.modeTabActive : ""}`}
                                    onClick={() => setMode("in_person")}
                                >
                                    <MapPin size={16} />
                                    In-Person Site Visit
                                </button>
                                <button
                                    type="button"
                                    className={`${styles.modeTab} ${mode === "virtual" ? styles.modeTabActive : ""}`}
                                    onClick={() => setMode("virtual")}
                                >
                                    <Video size={16} />
                                    🌍 Diaspora Live Video Tour
                                </button>
                            </div>

                            {/* Diaspora Timezone & Video Platform Bar */}
                            {mode === "virtual" && (
                                <div
                                    style={{
                                        padding: "0.9rem 1rem",
                                        borderRadius: "10px",
                                        background: "linear-gradient(135deg, rgba(59,130,246,0.07), rgba(212,160,23,0.08))",
                                        border: "1px solid rgba(59,130,246,0.22)",
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "0.75rem",
                                    }}
                                >
                                    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "0.65rem" }}>
                                        <div>
                                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#1e3a8a", marginBottom: "0.25rem" }}>
                                                🌐 Your Local Timezone
                                            </label>
                                            <select
                                                value={buyerTimezone}
                                                onChange={(e) => setBuyerTimezone(e.target.value)}
                                                className={styles.input}
                                                style={{ background: "#fff", fontWeight: 600 }}
                                            >
                                                {DIASPORA_TIMEZONES.map((tz) => (
                                                    <option key={tz.id} value={tz.timeZone}>
                                                        {tz.flag} {tz.label}
                                                    </option>
                                                ))}
                                                {!DIASPORA_TIMEZONES.some((t) => t.timeZone === buyerTimezone) && (
                                                    <option value={buyerTimezone}>🌐 {buyerTimezone}</option>
                                                )}
                                            </select>
                                        </div>

                                        <div>
                                            <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#1e3a8a", marginBottom: "0.25rem" }}>
                                                📹 Walkthrough App
                                            </label>
                                            <select
                                                value={videoPlatform}
                                                onChange={(e) => setVideoPlatform(e.target.value as "WhatsApp Video" | "Google Meet" | "Zoom")}
                                                className={styles.input}
                                                style={{ background: "#fff", fontWeight: 600 }}
                                            >
                                                <option value="Google Meet">Google Meet (HD)</option>
                                                <option value="WhatsApp Video">WhatsApp Video</option>
                                                <option value="Zoom">Zoom Meeting</option>
                                            </select>
                                        </div>
                                    </div>

                                    <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.76rem", fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                                        <input
                                            type="checkbox"
                                            checked={requestOfflineRecording}
                                            onChange={(e) => setRequestOfflineRecording(e.target.checked)}
                                            style={{ accentColor: "#2563eb" }}
                                        />
                                        Also send 4K recorded room-by-room &amp; access-road video for family review
                                    </label>
                                </div>
                            )}

                            <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                                {/* Date Selection */}
                                <div className={styles.formSection}>
                                    <label className={styles.sectionLabel}>
                                        <Calendar size={15} color="var(--gold-600, #d97706)" />
                                        Select Date (Kenya EAT)
                                    </label>
                                    <div className={styles.quickDates}>
                                        {quickDates.map((item) => (
                                            <button
                                                key={item.date}
                                                type="button"
                                                className={`${styles.quickDateBtn} ${selectedDate === item.date ? styles.quickDateBtnActive : ""}`}
                                                onClick={() => setSelectedDate(item.date)}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="date"
                                        className={styles.input}
                                        value={selectedDate}
                                        min={new Date().toISOString().split("T")[0]}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        style={{ marginTop: "0.25rem" }}
                                    />
                                </div>

                                {/* Slot Selection with Timezone Conversion */}
                                <div className={styles.formSection}>
                                    <label className={styles.sectionLabel}>
                                        <Clock size={15} color="var(--gold-600, #d97706)" />
                                        Select Time Slot (45 mins{showConvertedTz ? ` • Converted to ${buyerTimezone}` : " • EAT"})
                                    </label>
                                    <div className={styles.slotsGrid}>
                                        {slots.map((s) => {
                                            const conv = convertEATSlotToTimezone(selectedDate, s, buyerTimezone);
                                            const isSelected = selectedSlot === s;
                                            return (
                                                <button
                                                    key={s}
                                                    type="button"
                                                    className={`${styles.slotBtn} ${isSelected ? styles.slotBtnActive : ""}`}
                                                    onClick={() => setSelectedSlot(s)}
                                                    style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}
                                                >
                                                    <span>{s} EAT</span>
                                                    {showConvertedTz && (
                                                        <span
                                                            style={{
                                                                fontSize: "0.68rem",
                                                                fontWeight: 600,
                                                                color: isSelected
                                                                    ? "#fde68a"
                                                                    : conv.isFriendlyHour
                                                                    ? "#059669"
                                                                    : "#94a3b8",
                                                            }}
                                                        >
                                                            {conv.isFriendlyHour ? "● " : ""}
                                                            {conv.localTimeLabel}
                                                            {conv.localDayShift ? ` (${conv.localDayShift})` : ""}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Attendee Contact Info */}
                                <div className={styles.formSection}>
                                    <label className={styles.sectionLabel}>Your Contact Details</label>
                                    <div className={styles.inputGrid}>
                                        <div className={styles.inputField}>
                                            <label className={styles.inputLabel}>Full Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Sarah Nduta"
                                                className={styles.input}
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                            />
                                        </div>
                                        <div className={styles.inputField}>
                                            <label className={styles.inputLabel}>WhatsApp / International Phone *</label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="+44 7700 900077 / 0712 345 678"
                                                className={styles.input}
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.inputField} style={{ marginTop: "0.4rem" }}>
                                        <label className={styles.inputLabel}>Email Address *</label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="buyer@gmail.com"
                                            className={styles.input}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputField} style={{ marginTop: "0.4rem" }}>
                                        <label className={styles.inputLabel}>Areas to Focus On (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Show water pressure, natural light, compound security & access road"
                                            className={styles.input}
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {bookingError && (
                                    <div
                                        role="alert"
                                        style={{
                                            padding: "0.7rem 0.9rem",
                                            borderRadius: "10px",
                                            background: "rgba(239, 68, 68, 0.08)",
                                            border: "1px solid rgba(239, 68, 68, 0.3)",
                                            color: "#b91c1c",
                                            fontSize: "0.82rem",
                                        }}
                                    >
                                        {bookingError}
                                    </div>
                                )}

                                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                                    <Sparkles size={16} />
                                    {isSubmitting ? "Confirming Slot..." : "Confirm & Sync Timezone Calendar"}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Booking Confirmed State */
                        <div className={styles.successWrap}>
                            <div className={styles.successIconBadge}>✓</div>
                            <div>
                                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.3rem 0" }}>
                                    Viewing Scheduled! 🎉
                                </h3>
                                <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>
                                    Your request has been dispatched to <strong>{property.agentName || "the listing agent"}</strong>.
                                </p>
                            </div>

                            <div className={styles.bookedDetailsCard}>
                                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: "#0f172a" }}>
                                    {mode === "virtual" ? `🎥 Live ${videoPlatform} Walkthrough` : "🏠 In-Person Site Visit"}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Calendar size={14} color="#d97706" />
                                    {selectedDate} at {selectedSlot} EAT
                                    {showConvertedTz ? ` (${selectedConverted.localTimeLabel} your time)` : ""}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <MapPin size={14} color="#d97706" />
                                    {mode === "virtual"
                                        ? `${videoPlatform}${requestOfflineRecording ? " + 4K Offline Recording" : ""}`
                                        : `${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}`}
                                </div>
                            </div>

                            {/* Calendar Sync & Social Actions */}
                            <div className={styles.calendarActions}>
                                <a
                                    href={getGoogleCalendarUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.googleCalBtn}
                                >
                                    <Calendar size={16} color="#4285F4" />
                                    Add to Google Calendar (Auto-Timezone)
                                    <ExternalLink size={13} style={{ marginLeft: "auto", color: "#94a3b8" }} />
                                </a>

                                <button type="button" onClick={handleDownloadICS} className={styles.icsBtn}>
                                    <Download size={16} />
                                    Download .ICS Calendar Invite (Apple / Outlook)
                                </button>

                                <a
                                    href={getWhatsAppUrl()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={styles.whatsappDirectBtn}
                                >
                                    <MessageSquare size={16} />
                                    Notify Agent on WhatsApp
                                </a>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#64748b",
                                    fontSize: "0.82rem",
                                    cursor: "pointer",
                                    marginTop: "0.5rem",
                                }}
                            >
                                Close &amp; Back to Property
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
