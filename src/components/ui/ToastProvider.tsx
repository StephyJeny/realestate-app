"use client";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
    return (
        <Toaster
            position="top-right"
            gutter={12}
            toastOptions={{
                duration: 4000,
                style: {
                    background: "var(--navy-800)",
                    color: "var(--white)",
                    fontSize: "0.92rem",
                    borderRadius: "12px",
                    padding: "14px 20px",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
                    border: "1px solid rgba(255,255,255,0.08)",
                },
                success: {
                    iconTheme: {
                        primary: "#10b981",
                        secondary: "#fff",
                    },
                },
                error: {
                    iconTheme: {
                        primary: "#ef4444",
                        secondary: "#fff",
                    },
                },
            }}
        />
    );
}
