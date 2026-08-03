"use client";
import { useEffect, useRef, ReactNode, CSSProperties } from "react";

interface ScrollRevealProps {
    children: ReactNode;
    direction?: "up" | "down" | "left" | "right" | "none";
    delay?: number;
    duration?: number;
    distance?: number;
    once?: boolean;
    className?: string;
    style?: CSSProperties;
}

export default function ScrollReveal({
    children,
    direction = "up",
    delay = 0,
    duration = 600,
    distance = 40,
    once = true,
    className = "",
    style = {},
}: ScrollRevealProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const getTransform = () => {
            switch (direction) {
                case "up": return `translateY(${distance}px)`;
                case "down": return `translateY(-${distance}px)`;
                case "left": return `translateX(${distance}px)`;
                case "right": return `translateX(-${distance}px)`;
                case "none": return "none";
                default: return `translateY(${distance}px)`;
            }
        };

        // Set initial state
        el.style.opacity = "0";
        el.style.transform = getTransform();
        el.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    el.style.opacity = "1";
                    el.style.transform = "translate(0, 0)";
                    if (once) observer.unobserve(el);
                } else if (!once) {
                    el.style.opacity = "0";
                    el.style.transform = getTransform();
                }
            },
            { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [direction, delay, duration, distance, once]);

    return (
        <div ref={ref} className={className} style={style}>
            {children}
        </div>
    );
}
