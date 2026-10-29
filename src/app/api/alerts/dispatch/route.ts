import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import {
    enforceRateLimit,
    verifyFirebaseAuth,
    getFirestoreDocServer,
    decodeFirestoreFields,
    encodeFirestoreValue,
    escapeHtml,
    sanitizeHeaderValue,
    isValidEmail,
} from "@/lib/apiSecurity";
import {
    AlertMatchableProperty,
    AlertSubscription,
    findMatchingAlertSubscriptions,
} from "@/lib/priceAlerts";

let _resend: Resend | null = null;
function getResend(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!_resend) {
        _resend = new Resend(process.env.RESEND_API_KEY);
    }
    return _resend;
}

async function fetchActiveAlertSubscriptionsServer(idToken: string): Promise<AlertSubscription[]> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return [];

    try {
        const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents:runQuery`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    structuredQuery: {
                        from: [{ collectionId: "alert_subscriptions" }],
                        where: {
                            fieldFilter: {
                                field: { fieldPath: "active" },
                                op: "EQUAL",
                                value: { booleanValue: true },
                            },
                        },
                        limit: 200,
                    },
                }),
                cache: "no-store",
            }
        );

        if (!res.ok) return [];
        const rows = await res.json();
        if (!Array.isArray(rows)) return [];

        const results: AlertSubscription[] = [];
        for (const row of rows) {
            const doc = row?.document;
            if (!doc?.fields) continue;
            const decoded = decodeFirestoreFields(doc.fields);
            const docId = String(doc.name || "").split("/").pop() || String(decoded.id || "");
            if (!decoded.userId || (decoded.type !== "price_watch" && decoded.type !== "saved_search")) {
                continue;
            }
            results.push({
                id: docId,
                userId: String(decoded.userId),
                userEmail: String(decoded.userEmail || "").toLowerCase(),
                userName: typeof decoded.userName === "string" ? decoded.userName : "Buyer",
                type: decoded.type,
                propertyId: typeof decoded.propertyId === "string" ? decoded.propertyId : undefined,
                propertyTitle: typeof decoded.propertyTitle === "string" ? decoded.propertyTitle : undefined,
                baselinePrice: typeof decoded.baselinePrice === "number" ? decoded.baselinePrice : undefined,
                savedSearchId: typeof decoded.savedSearchId === "string" ? decoded.savedSearchId : undefined,
                searchName: typeof decoded.searchName === "string" ? decoded.searchName : undefined,
                filters:
                    decoded.filters && typeof decoded.filters === "object"
                        ? (decoded.filters as AlertSubscription["filters"])
                        : undefined,
                active: Boolean(decoded.active),
                createdAtISO: String(decoded.createdAtISO || new Date().toISOString()),
            });
        }
        return results;
    } catch (err) {
        console.warn("Failed to query alert_subscriptions on server:", err);
        return [];
    }
}

async function createFirestoreNotificationServer(
    idToken: string,
    payload: {
        userId: string;
        createdBy: string;
        type: "price_drop_alert" | "saved_search_alert";
        title: string;
        message: string;
        propertyId: string;
    }
): Promise<boolean> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return false;

    const fields = {
        userId: encodeFirestoreValue(payload.userId),
        createdBy: encodeFirestoreValue(payload.createdBy),
        type: encodeFirestoreValue(payload.type),
        title: encodeFirestoreValue(payload.title),
        message: encodeFirestoreValue(payload.message),
        propertyId: encodeFirestoreValue(payload.propertyId),
        read: encodeFirestoreValue(false),
        createdAt: encodeFirestoreValue(new Date()),
    };

    try {
        const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/notifications`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ fields }),
                cache: "no-store",
            }
        );
        return res.ok;
    } catch {
        return false;
    }
}

function buildAlertEmailHtml(params: {
    eventType: "new_listing" | "price_drop";
    subscriberName: string;
    searchName?: string;
    property: AlertMatchableProperty;
    oldPrice?: number;
    origin: string;
}) {
    const { eventType, subscriberName, searchName, property, oldPrice, origin } = params;
    const safeName = escapeHtml(subscriberName || "Buyer");
    const safeTitle = escapeHtml(property.title || "Property");
    const safeLocation = escapeHtml(
        [property.neighborhood, property.city].filter(Boolean).join(", ") || "Kenya"
    );
    const currency = escapeHtml(property.currency || "KES");
    const newPriceFmt = `${currency} ${Math.round(property.price || 0).toLocaleString()}`;
    const listingUrl = `${origin}/properties/${encodeURIComponent(property.id)}`;

    if (eventType === "price_drop" && oldPrice && oldPrice > property.price) {
        const savings = Math.round(oldPrice - property.price);
        const dropPct = (((oldPrice - property.price) / oldPrice) * 100).toFixed(1);
        const oldPriceFmt = `${currency} ${Math.round(oldPrice).toLocaleString()}`;
        const savingsFmt = `${currency} ${savings.toLocaleString()}`;
        const subjectTitle = sanitizeHeaderValue(property.title, 65);

        return {
            subject: `📉 Price Drop (-${dropPct}%): ${subjectTitle} — EstateVue`,
            html: `
                <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                    <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 28px 24px; text-align: center;">
                        <span style="display: inline-block; background: #16a34a; color: #fff; font-size: 12px; font-weight: 700; padding: 4px 12px; border-radius: 99px; margin-bottom: 10px;">PRICE REDUCED BY ${dropPct}%</span>
                        <h1 style="color: #d4a017; margin: 0; font-size: 22px;">${safeTitle}</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">📍 ${safeLocation}</p>
                    </div>
                    <div style="padding: 28px 24px; background: #ffffff;">
                        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
                        <p style="color: #475569; font-size: 14px; line-height: 1.6;">Good news! A listing you are watching on EstateVue just dropped in price:</p>
                        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 18px 20px; margin: 18px 0;">
                            <div style="font-size: 13px; color: #64748b; text-decoration: line-through;">Previous: ${oldPriceFmt}</div>
                            <div style="font-size: 24px; font-weight: 800; color: #15803d; margin: 4px 0;">Now: ${newPriceFmt}</div>
                            <div style="font-size: 13px; font-weight: 700; color: #166534;">Instant Savings: ${savingsFmt} (-${dropPct}%)</div>
                        </div>
                        <div style="text-align: center; margin-top: 22px;">
                            <a href="${listingUrl}" style="display: inline-block; background: #d4a017; color: #0a0e1a; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">View Listing &amp; Price Chart →</a>
                        </div>
                    </div>
                </div>
            `,
        };
    }

    const safeSearch = escapeHtml(searchName || "Saved Search");
    const subjectTitle = sanitizeHeaderValue(property.title, 65);
    return {
        subject: `🔔 New Match for "${sanitizeHeaderValue(searchName || "Saved Search", 40)}": ${subjectTitle}`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #0a0e1a, #1a2340); padding: 28px 24px; text-align: center;">
                    <span style="display: inline-block; background: #d4a017; color: #0a0e1a; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 99px; margin-bottom: 10px;">NEW SAVED SEARCH MATCH</span>
                    <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${safeTitle}</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 13px;">📍 ${safeLocation}</p>
                </div>
                <div style="padding: 28px 24px; background: #ffffff;">
                    <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello <strong>${safeName}</strong>,</p>
                    <p style="color: #475569; font-size: 14px; line-height: 1.6;">A newly listed property matches your saved alert <strong>"${safeSearch}"</strong>:</p>
                    <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 18px 20px; margin: 18px 0;">
                        <div style="font-size: 22px; font-weight: 800; color: #0a0e1a;">${newPriceFmt}</div>
                        <div style="font-size: 13px; color: #475569; margin-top: 6px;">
                            ${property.bedrooms ? `${Number(property.bedrooms)} Beds · ` : ""}
                            ${property.bathrooms ? `${Number(property.bathrooms)} Baths · ` : ""}
                            ${property.area ? `${Number(property.area).toLocaleString()} sq ft` : ""}
                        </div>
                    </div>
                    <div style="text-align: center; margin-top: 22px;">
                        <a href="${listingUrl}" style="display: inline-block; background: #d4a017; color: #0a0e1a; font-weight: 700; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 14px;">Inspect Listing on EstateVue →</a>
                    </div>
                </div>
            </div>
        `,
    };
}

export async function POST(req: NextRequest) {
    try {
        const rateLimitRes = enforceRateLimit(req, "alerts-dispatch", 15, 60_000);
        if (rateLimitRes) return rateLimitRes;

        const authUser = await verifyFirebaseAuth(req);
        if (!authUser) {
            return NextResponse.json({ error: "Authentication required" }, { status: 401 });
        }

        // Verify caller is an approved agent or admin
        const callerDoc = await getFirestoreDocServer(`users/${authUser.uid}`, authUser.idToken);
        const isAdmin = callerDoc?.role === "admin";
        const isApprovedAgent =
            callerDoc?.role === "agent" && callerDoc?.agentStatus === "approved";

        if (!isAdmin && !isApprovedAgent) {
            return NextResponse.json(
                { error: "Only approved agents or admins can trigger listing alerts" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const eventType = body?.eventType === "price_drop" ? "price_drop" : "new_listing";
        const property = body?.property as AlertMatchableProperty | undefined;
        const oldPrice = body?.oldPrice !== undefined ? Number(body.oldPrice) : undefined;

        if (!property?.id || !property?.title || !Number.isFinite(Number(property.price))) {
            return NextResponse.json({ error: "Invalid property payload" }, { status: 400 });
        }

        // Verify ownership of the property (unless admin)
        if (!isAdmin) {
            const propDoc = await getFirestoreDocServer(
                `properties/${property.id}`,
                authUser.idToken
            );
            if (propDoc && propDoc.agentId && propDoc.agentId !== authUser.uid) {
                return NextResponse.json(
                    { error: "Cannot dispatch alerts for another agent's listing" },
                    { status: 403 }
                );
            }
        }

        const subscriptions = await fetchActiveAlertSubscriptionsServer(authUser.idToken);
        const matched = findMatchingAlertSubscriptions({
            eventType,
            property: { ...property, agentId: property.agentId || authUser.uid },
            oldPrice,
            subscriptions,
        }).slice(0, 50);

        const resend = getResend();
        const fromEmail = process.env.RESEND_FROM_EMAIL || "EstateVue Alerts <onboarding@resend.dev>";
        const origin = req.nextUrl.origin;

        let notifiedCount = 0;
        let emailedCount = 0;

        for (const sub of matched) {
            const currency = property.currency || "KES";
            const dropPct =
                eventType === "price_drop" && oldPrice && oldPrice > property.price
                    ? (((oldPrice - property.price) / oldPrice) * 100).toFixed(1)
                    : null;

            const notifTitle =
                eventType === "price_drop"
                    ? `Price Drop${dropPct ? ` (-${dropPct}%)` : ""}: ${property.title} 📉`
                    : `New Match: ${property.title} 🔔`;

            const notifMsg =
                eventType === "price_drop" && oldPrice
                    ? `"${property.title}" dropped from ${currency} ${Math.round(oldPrice).toLocaleString()} to ${currency} ${Math.round(property.price).toLocaleString()}.`
                    : `"${property.title}" in ${property.neighborhood || property.city || "Kenya"} (${currency} ${Math.round(property.price).toLocaleString()}) matches your alert "${sub.searchName || "Saved Search"}".`;

            const notifCreated = await createFirestoreNotificationServer(authUser.idToken, {
                userId: sub.userId,
                createdBy: authUser.uid,
                type: eventType === "price_drop" ? "price_drop_alert" : "saved_search_alert",
                title: notifTitle,
                message: notifMsg,
                propertyId: property.id,
            });
            if (notifCreated) notifiedCount += 1;

            if (resend && isValidEmail(sub.userEmail)) {
                try {
                    const emailPayload = buildAlertEmailHtml({
                        eventType,
                        subscriberName: sub.userName || "Buyer",
                        searchName: sub.searchName,
                        property,
                        oldPrice,
                        origin,
                    });
                    const { error } = await resend.emails.send({
                        from: fromEmail,
                        to: [sub.userEmail],
                        subject: emailPayload.subject,
                        html: emailPayload.html,
                    });
                    if (!error) emailedCount += 1;
                } catch (emailErr) {
                    console.warn("Alert email send skipped:", emailErr);
                }
            }
        }

        return NextResponse.json({
            success: true,
            matchedCount: matched.length,
            notifiedCount,
            emailedCount,
        });
    } catch (err) {
        console.error("Alert dispatch error:", err);
        return NextResponse.json({ error: "Failed to dispatch listing alerts" }, { status: 500 });
    }
}
