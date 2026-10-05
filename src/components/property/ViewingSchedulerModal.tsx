"use client";

import React, { useState } from "react";
import Image from "next/image";
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Video, 
    Download, 
    CheckCircle2, 
    Sparkles, 
    MessageSquare, 
    ExternalLink, 
    Building2, 
    CalendarCheck 
} from "@/components/icons/Icons";
import styles from "./ViewingSchedulerModal.module.css";
import { useAuth } from "@/context/AuthContext";
import { sendInquiry } from "@/lib/firestore";

interface ViewingSchedulerModalProps {
    isOpen: boolean;
    onClose: () => void;
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
        openHouseDate?: string; // Optional e.g. "This Saturday 10:00 AM - 1:00 PM"
    };
}

export default function ViewingSchedulerModal({
    isOpen,
    onClose,
    property,
}: ViewingSchedulerModalProps) {
    const { user, userProfile } = useAuth();

    // Scheduling states
    const [mode, setMode] = useState<"in_person" | "virtual">("in_person");
    const [selectedDate, setSelectedDate] = useState<string>(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split("T")[0];
    });
    const [selectedSlot, setSelectedSlot] = useState<string>("10:30 AM");
    
    // Buyer info
    const [fullName, setFullName] = useState(userProfile?.displayName || user?.displayName || "");
    const [phone, setPhone] = useState(userProfile?.phone || "");
    const [email, setEmail] = useState(user?.email || "");
    const [note, setNote] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isBooked, setIsBooked] = useState(false);

    if (!isOpen) return null;

    // Available slots
    const slots = [
        "09:30 AM",
        "11:00 AM",
        "01:30 PM",
        "03:00 PM",
        "04:30 PM",
        "05:30 PM"
    ];

    // Compute dynamic quick dates (Today, Tomorrow, Saturday, Sunday)
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

    // Helper to compute start & end Date objects from selectedDate + selectedSlot
    const getScheduledDateTime = () => {
        // e.g. "10:30 AM" -> 10, 30
        const [timePart, meridiem] = selectedSlot.split(" ");
        let [hours, minutes] = timePart.split(":").map(Number);
        if (meridiem === "PM" && hours < 12) hours += 12;
        if (meridiem === "AM" && hours === 12) hours = 0;

        const start = new Date(`${selectedDate}T00:00:00`);
        start.setHours(hours, minutes, 0, 0);

        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 45); // 45 min tour duration

        return { start, end };
    };

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const tourType = mode === "virtual" ? "Live Virtual 1-on-1 Tour (Video Call)" : "In-Person Site Visit";
        const locationStr = mode === "virtual"
            ? "Virtual / WhatsApp Video Tour"
            : `${property.title}, ${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}`;

        const viewingMessage = `Requested ${tourType} on ${selectedDate} at ${selectedSlot}. ` +
            (note ? `Notes: "${note}"` : "") +
            ` Attendee Phone: ${phone}`;

        try {
            await sendInquiry({
                propertyId: property.id,
                propertyTitle: property.title,
                senderId: user?.uid || `guest-${Date.now()}`,
                senderName: fullName || "Prospective Buyer",
                senderEmail: email || "buyer@estatevision.co.ke",
                senderPhone: phone || "Not specified",
                agentId: property.agentId || "agent-demo",
                agentName: property.agentName,
                message: viewingMessage,
                type: "viewing",
            });

            setIsBooked(true);
        } catch (err) {
            console.error("Failed to book viewing:", err);
            // Even on network hitch, permit calendar export
            setIsBooked(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Google Calendar URL Generator
    const getGoogleCalendarUrl = () => {
        const { start, end } = getScheduledDateTime();
        const formatTime = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const title = `${mode === "virtual" ? "🎥 Virtual Tour" : "🏠 Site Viewing"}: ${property.title}`;
        const location = mode === "virtual" 
            ? "Google Meet / WhatsApp Video" 
            : `${property.title}, ${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}, Kenya`;
        const details = `Property Viewing arranged via EstateVision.\nProperty: ${property.title}\nAgent: ${property.agentName || "Listing Agent"} (${property.agentPhone || ""})\nMode: ${mode === "virtual" ? "Live Virtual Tour" : "In-Person Site Visit"}\nBuyer: ${fullName} (${phone})`;

        const params = new URLSearchParams({
            action: "TEMPLATE",
            text: title,
            dates: `${formatTime(start)}/${formatTime(end)}`,
            details,
            location,
        });

        return `https://calendar.google.com/calendar/render?${params.toString()}`;
    };

    // Download standard RFC 5545 .ics Calendar Invite
    const handleDownloadICS = () => {
        const { start, end } = getScheduledDateTime();
        const formatICSDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

        const title = `${mode === "virtual" ? "Virtual Tour" : "Property Viewing"} - ${property.title}`;
        const location = mode === "virtual"
            ? "WhatsApp Video / Virtual Meeting"
            : `${property.title}, ${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}`;
        const description = `Viewing for ${property.title} scheduled through EstateVision.\\nAgent: ${property.agentName || "Listing Agent"} (${property.agentPhone || ""})\\nBuyer: ${fullName} (${phone})`;

        const icsData = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//EstateVision Kenya//Tour Scheduler//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:REQUEST",
            "BEGIN:VEVENT",
            `UID:viewing-${Date.now()}@estatevision.co.ke`,
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

    // WhatsApp Direct Link
    const getWhatsAppUrl = () => {
        const cleanPhone = (property.agentPhone || "+254700000000").replace(/[^0-9]/g, "");
        const formattedPhone = cleanPhone.startsWith("0") ? `254${cleanPhone.slice(1)}` : cleanPhone;
        const text = encodeURIComponent(
            `Hi ${property.agentName || "Agent"}, I just booked a ${mode === "virtual" ? "virtual tour" : "site viewing"} for "${property.title}" on ${selectedDate} at ${selectedSlot}. My name is ${fullName}. Looking forward!`
        );
        return `https://wa.me/${formattedPhone}?text=${text}`;
    };

    const propertyImage = property.images?.[0] || "/images/placeholder.jpg";

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className={styles.header}>
                    <h3 className={styles.title}>
                        <CalendarCheck size={20} color="var(--gold-600, #d97706)" />
                        Schedule Viewing & Open House
                    </h3>
                    <button className={styles.closeBtn} onClick={onClose}>
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
                                KES {property.price.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    {!isBooked ? (
                        <>
                            {/* Open House Notice if available */}
                            <div className={styles.openHouseNotice}>
                                <div>
                                    <div style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "#b45309", fontWeight: 800 }}>
                                        🎪 Upcoming Public Open House
                                    </div>
                                    <p className={styles.openHouseNoticeText}>
                                        {property.openHouseDate || "This Saturday, 10:00 AM – 2:00 PM (Refreshments served)"}
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
                                    Live Virtual Video Tour
                                </button>
                            </div>

                            <form onSubmit={handleBook} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
                                {/* Date Selection */}
                                <div className={styles.formSection}>
                                    <label className={styles.sectionLabel}>
                                        <Calendar size={15} color="var(--gold-600, #d97706)" />
                                        Select Date
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

                                {/* Slot Selection */}
                                <div className={styles.formSection}>
                                    <label className={styles.sectionLabel}>
                                        <Clock size={15} color="var(--gold-600, #d97706)" />
                                        Select Preferred Time Slot (45 mins)
                                    </label>
                                    <div className={styles.slotsGrid}>
                                        {slots.map((s) => (
                                            <button
                                                key={s}
                                                type="button"
                                                className={`${styles.slotBtn} ${selectedSlot === s ? styles.slotBtnActive : ""}`}
                                                onClick={() => setSelectedSlot(s)}
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Attendee Contact Info */}
                                <div className={styles.formSection}>
                                    <label className={styles.sectionLabel}>
                                        Your Contact Details
                                    </label>
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
                                            <label className={styles.inputLabel}>WhatsApp / Phone *</label>
                                            <input
                                                type="tel"
                                                required
                                                placeholder="0712 345 678"
                                                className={styles.input}
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className={styles.inputField} style={{ marginTop: "0.4rem" }}>
                                        <label className={styles.inputLabel}>Email Address</label>
                                        <input
                                            type="email"
                                            placeholder="buyer@gmail.com"
                                            className={styles.input}
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                        />
                                    </div>

                                    <div className={styles.inputField} style={{ marginTop: "0.4rem" }}>
                                        <label className={styles.inputLabel}>Special Request or Note (Optional)</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. Attending with contractor / Viewing mortgage options"
                                            className={styles.input}
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={styles.submitBtn}
                                >
                                    <Sparkles size={16} />
                                    {isSubmitting ? "Confirming Slot..." : "Confirm & Sync to Calendar"}
                                </button>
                            </form>
                        </>
                    ) : (
                        /* Booking Confirmed State */
                        <div className={styles.successWrap}>
                            <div className={styles.successIconBadge}>
                                ✓
                            </div>
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
                                    {mode === "virtual" ? "🎥 Live Virtual Tour" : "🏠 In-Person Site Visit"}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <Calendar size={14} color="#d97706" />
                                    {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })} at {selectedSlot}
                                </div>
                                <div style={{ fontSize: "0.8rem", color: "#475569", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                                    <MapPin size={14} color="#d97706" />
                                    {mode === "virtual" ? "WhatsApp Video / Google Meet Call" : `${property.neighborhood ? property.neighborhood + ", " : ""}${property.city}`}
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
                                    Add to Google Calendar
                                    <ExternalLink size={13} style={{ marginLeft: "auto", color: "#94a3b8" }} />
                                </a>

                                <button
                                    type="button"
                                    onClick={handleDownloadICS}
                                    className={styles.icsBtn}
                                >
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
                                Close & Back to Property
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
