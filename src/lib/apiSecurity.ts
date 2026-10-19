import { NextRequest, NextResponse } from "next/server";

// ========================
// RATE LIMITING
// ========================

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_STORE_SIZE = 5000;

function cleanupExpired(now: number) {
    if (rateLimitStore.size < MAX_STORE_SIZE) return;
    for (const [key, entry] of rateLimitStore.entries()) {
        if (entry.resetAt <= now) {
            rateLimitStore.delete(key);
        }
    }
}

export function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        const first = forwarded.split(",")[0]?.trim();
        if (first) return first;
    }
    const realIp = req.headers.get("x-real-ip")?.trim();
    if (realIp) return realIp;
    return "127.0.0.1";
}

/**
 * Enforces a fixed-window rate limit per IP + bucket.
 * Returns a 429 NextResponse when the limit is exceeded, or null if allowed.
 */
export function enforceRateLimit(
    req: NextRequest,
    bucket: string,
    maxRequests: number,
    windowMs: number
): NextResponse | null {
    const now = Date.now();
    cleanupExpired(now);

    const ip = getClientIp(req);
    const key = `${bucket}:${ip}`;
    const existing = rateLimitStore.get(key);

    if (!existing || existing.resetAt <= now) {
        rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
        return null;
    }

    if (existing.count >= maxRequests) {
        const retryAfterSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
        return NextResponse.json(
            {
                success: false,
                error: "Too many requests. Please wait a moment and try again.",
                message: "Too many requests. Please wait a moment and try again.",
            },
            {
                status: 429,
                headers: { "Retry-After": String(retryAfterSec) },
            }
        );
    }

    existing.count += 1;
    return null;
}

// ========================
// SANITIZATION & VALIDATION
// ========================

const HTML_ESCAPE_MAP: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
    "/": "&#x2F;",
};

/**
 * Escapes user-provided strings so they can be safely interpolated into HTML templates.
 */
export function escapeHtml(value: unknown): string {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[&<>"'/]/g, (ch) => HTML_ESCAPE_MAP[ch] || ch);
}

/**
 * Strips CR/LF characters to prevent header or subject line injection.
 */
export function sanitizeHeaderValue(value: unknown, maxLen = 200): string {
    if (value === null || value === undefined) return "";
    return String(value).replace(/[\r\n]+/g, " ").trim().slice(0, maxLen);
}

export function isValidEmail(value: unknown): value is string {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed.length < 3 || trimmed.length > 254) return false;
    return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(trimmed);
}

// ========================
// FIREBASE AUTH & FIRESTORE SERVER HELPERS
// ========================

export interface VerifiedFirebaseUser {
    uid: string;
    email: string;
    emailVerified: boolean;
    displayName: string;
    idToken: string;
}

/**
 * Verifies a Firebase Auth ID token from the `Authorization: Bearer <token>` header
 * using Google Identity Toolkit's official `accounts:lookup` endpoint.
 */
export async function verifyFirebaseAuth(req: NextRequest): Promise<VerifiedFirebaseUser | null> {
    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return null;
    }

    const idToken = authHeader.slice("Bearer ".length).trim();
    if (!idToken) return null;

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey || apiKey === "your_api_key_here") {
        return null;
    }

    try {
        const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(apiKey)}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
                cache: "no-store",
            }
        );

        if (!res.ok) return null;
        const data = await res.json();
        const user = data?.users?.[0];
        if (!user?.localId) return null;

        return {
            uid: user.localId,
            email: (user.email || "").toLowerCase(),
            emailVerified: Boolean(user.emailVerified),
            displayName: user.displayName || "",
            idToken,
        };
    } catch (err) {
        console.error("Failed to verify Firebase ID token:", err);
        return null;
    }
}

interface FirestoreRawValue {
    stringValue?: string;
    booleanValue?: boolean;
    integerValue?: string | number;
    doubleValue?: number;
    nullValue?: null;
    timestampValue?: string;
    arrayValue?: { values?: FirestoreRawValue[] };
    mapValue?: { fields?: Record<string, FirestoreRawValue> };
}

function decodeFirestoreValue(val: FirestoreRawValue | undefined): unknown {
    if (!val || typeof val !== "object") return undefined;
    if ("stringValue" in val) return val.stringValue;
    if ("booleanValue" in val) return Boolean(val.booleanValue);
    if ("integerValue" in val) return Number(val.integerValue);
    if ("doubleValue" in val) return Number(val.doubleValue);
    if ("nullValue" in val) return null;
    if ("timestampValue" in val) return val.timestampValue;
    if ("arrayValue" in val) {
        return (val.arrayValue?.values || []).map(decodeFirestoreValue);
    }
    if ("mapValue" in val) {
        return decodeFirestoreFields(val.mapValue?.fields || {});
    }
    return undefined;
}

export function decodeFirestoreFields(fields: Record<string, FirestoreRawValue>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(fields || {})) {
        result[k] = decodeFirestoreValue(v);
    }
    return result;
}

export function encodeFirestoreValue(val: unknown): FirestoreRawValue {
    if (val === null || val === undefined) return { nullValue: null };
    if (typeof val === "boolean") return { booleanValue: val };
    if (typeof val === "number") {
        return Number.isInteger(val) ? { integerValue: String(val) } : { doubleValue: val };
    }
    if (typeof val === "string") return { stringValue: val };
    if (val instanceof Date) return { timestampValue: val.toISOString() };
    if (Array.isArray(val)) {
        return { arrayValue: { values: val.map(encodeFirestoreValue) } };
    }
    if (typeof val === "object") {
        const fields: Record<string, FirestoreRawValue> = {};
        for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
            if (v !== undefined) {
                fields[k] = encodeFirestoreValue(v);
            }
        }
        return { mapValue: { fields } };
    }
    return { stringValue: String(val) };
}

/**
 * Fetches a single Firestore document via the Firestore REST API.
 */
export async function getFirestoreDocServer(
    docPath: string,
    idToken?: string
): Promise<Record<string, unknown> | null> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return null;

    const cleanPath = docPath.replace(/^\/+/, "");
    const headers: Record<string, string> = {};
    if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
    }

    try {
        const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${cleanPath}`,
            { headers, cache: "no-store" }
        );
        if (!res.ok) return null;
        const data = await res.json();
        if (!data?.fields) return null;
        return decodeFirestoreFields(data.fields);
    } catch {
        return null;
    }
}

/**
 * Patches specific fields on a Firestore document via the REST API.
 */
export async function patchFirestoreDocServer(
    docPath: string,
    fieldsToUpdate: Record<string, unknown>,
    idToken?: string
): Promise<boolean> {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (!projectId) return false;

    const cleanPath = docPath.replace(/^\/+/, "");
    const keys = Object.keys(fieldsToUpdate).filter((k) => fieldsToUpdate[k] !== undefined);
    const maskParams = keys.map((k) => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");

    const encodedFields: Record<string, FirestoreRawValue> = {};
    for (const k of keys) {
        encodedFields[k] = encodeFirestoreValue(fieldsToUpdate[k]);
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
    }

    try {
        const res = await fetch(
            `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${cleanPath}?${maskParams}`,
            {
                method: "PATCH",
                headers,
                body: JSON.stringify({ fields: encodedFields }),
                cache: "no-store",
            }
        );
        return res.ok;
    } catch (err) {
        console.error("Failed to patch Firestore doc on server:", err);
        return false;
    }
}
