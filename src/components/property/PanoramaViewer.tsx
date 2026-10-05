"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import styles from "./PanoramaViewer.module.css";

interface RoomScene {
    id: string;
    name: string;
    icon: string;
    imageUrl: string;
    description: string;
}

interface PanoramaViewerProps {
    propertyTitle?: string;
    rooms?: RoomScene[];
}

const DEFAULT_ROOMS: RoomScene[] = [
    {
        id: "living",
        name: "Grand Living & Sea Terrace",
        icon: "🛋️",
        imageUrl: "/images/hero-bg.png",
        description: "Panoramic floor-to-ceiling glass framing panoramic coastal views.",
    },
    {
        id: "master",
        name: "Master Penthouse Suite",
        icon: "🛏️",
        imageUrl: "/images/property-1.png",
        description: "Expansive master suite with private wrap-around terrace.",
    },
    {
        id: "pool",
        name: "Infinity Pool & Sunken Deck",
        icon: "🏊",
        imageUrl: "/images/property-4.png",
        description: "Outdoor resort-grade pool overlooking landscaped grounds.",
    },
    {
        id: "kitchen",
        name: "Gourmet Chef Kitchen",
        icon: "🍳",
        imageUrl: "/images/property-2.png",
        description: "Italian marble island with concealed premium appliances.",
    },
];

export default function PanoramaViewer({
    propertyTitle = "Luxury Property",
    rooms = DEFAULT_ROOMS,
}: PanoramaViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [activeRoomIdx, setActiveRoomIdx] = useState(0);
    const [autoRotate, setAutoRotate] = useState(true);
    const [hasInteracted, setHasInteracted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Camera angles and zoom
    const yawRef = useRef(0); // Horizontal angle in radians
    const pitchRef = useRef(0); // Vertical angle in radians
    const fovRef = useRef(75); // Field of view in degrees

    const isDraggingRef = useRef(false);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const currentImgRef = useRef<HTMLImageElement | null>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    const activeRoom = rooms[activeRoomIdx] || rooms[0];

    // Load active room image
    useEffect(() => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = activeRoom.imageUrl;
        img.onload = () => {
            currentImgRef.current = img;
        };
    }, [activeRoom]);

    // Canvas render loop with cylindrical/spherical projection
    const renderScene = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const width = canvas.width;
        const height = canvas.height;
        const img = currentImgRef.current;

        // Auto-rotation when enabled and user not dragging
        if (autoRotate && !isDraggingRef.current) {
            yawRef.current += 0.0018;
        }

        // Clamp pitch (-55 deg to +55 deg)
        const maxPitch = (55 * Math.PI) / 180;
        pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));

        ctx.clearRect(0, 0, width, height);

        if (img && img.complete && img.naturalWidth > 0) {
            // Render 360 cylindrical wrap
            // Map yaw (-pi to +pi) to image horizontal offset
            const normalizedYaw = ((yawRef.current % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
            const imgW = img.width;
            const imgH = img.height;

            const fovScale = fovRef.current / 75;
            const renderH = height * 1.5 * fovScale;
            const renderW = (renderH * imgW) / imgH;

            const offsetX = -((normalizedYaw / (2 * Math.PI)) * renderW);
            const offsetY = (height - renderH) / 2 + pitchRef.current * (height * 0.7);

            // Draw image tiled horizontally for continuous 360 rotation
            ctx.save();
            ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
            ctx.drawImage(img, offsetX + renderW, offsetY, renderW, renderH);
            ctx.drawImage(img, offsetX - renderW, offsetY, renderW, renderH);
            ctx.restore();

            // Atmospheric vignette and lighting overlay
            const gradient = ctx.createRadialGradient(
                width / 2,
                height / 2,
                width * 0.25,
                width / 2,
                height / 2,
                width * 0.75
            );
            gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
            gradient.addColorStop(1, "rgba(0, 0, 0, 0.45)");
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);
        } else {
            // Loading placeholder
            ctx.fillStyle = "#0a0e1a";
            ctx.fillRect(0, 0, width, height);
            ctx.fillStyle = "rgba(212, 160, 23, 0.7)";
            ctx.font = "14px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("Loading 360° Scene...", width / 2, height / 2);
        }

        animationFrameIdRef.current = requestAnimationFrame(renderScene);
    }, [autoRotate]);

    // Handle Resize & Canvas Initialization
    useEffect(() => {
        const updateDimensions = () => {
            const canvas = canvasRef.current;
            const container = containerRef.current;
            if (!canvas || !container) return;
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * (window.devicePixelRatio || 1);
            canvas.height = rect.height * (window.devicePixelRatio || 1);
        };

        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        animationFrameIdRef.current = requestAnimationFrame(renderScene);

        return () => {
            window.removeEventListener("resize", updateDimensions);
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [renderScene]);

    // Mouse / Touch Drag Handlers
    const handleStartDrag = (clientX: number, clientY: number) => {
        isDraggingRef.current = true;
        setHasInteracted(true);
        lastMousePosRef.current = { x: clientX, y: clientY };
    };

    const handleMoveDrag = (clientX: number, clientY: number) => {
        if (!isDraggingRef.current) return;
        const deltaX = clientX - lastMousePosRef.current.x;
        const deltaY = clientY - lastMousePosRef.current.y;

        const sensitivity = 0.004;
        yawRef.current -= deltaX * sensitivity;
        pitchRef.current += deltaY * sensitivity;

        lastMousePosRef.current = { x: clientX, y: clientY };
    };

    const handleEndDrag = () => {
        isDraggingRef.current = false;
    };

    // Zoom Handlers (Wheel / Buttons)
    const handleZoom = (delta: number) => {
        fovRef.current = Math.max(50, Math.min(105, fovRef.current + delta));
    };

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        handleZoom(e.deltaY > 0 ? 4 : -4);
    };

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(console.error);
            setIsFullscreen(true);
        } else {
            document.exitFullscreen().catch(console.error);
            setIsFullscreen(false);
        }
    };

    return (
        <div ref={containerRef} className={styles.panoramaContainer} onWheel={handleWheel}>
            <canvas
                ref={canvasRef}
                className={styles.canvas}
                onMouseDown={(e) => handleStartDrag(e.clientX, e.clientY)}
                onMouseMove={(e) => handleMoveDrag(e.clientX, e.clientY)}
                onMouseUp={handleEndDrag}
                onMouseLeave={handleEndDrag}
                onTouchStart={(e) => {
                    const t = e.touches[0];
                    if (t) handleStartDrag(t.clientX, t.clientY);
                }}
                onTouchMove={(e) => {
                    const t = e.touches[0];
                    if (t) handleMoveDrag(t.clientX, t.clientY);
                }}
                onTouchEnd={handleEndDrag}
            />

            {/* Top Overlay Controls */}
            <div className={styles.topOverlay}>
                <div className={styles.badgeWrap}>
                    <div className={styles.badge}>
                        <span className={styles.badgePulse} />
                        <span>360° Virtual Walkthrough</span>
                    </div>
                </div>

                <div className={styles.controlsWrap}>
                    {/* Auto Rotate Toggle */}
                    <button
                        type="button"
                        className={`${styles.controlBtn} ${autoRotate ? styles.controlBtnActive : ""}`}
                        onClick={() => setAutoRotate(!autoRotate)}
                        title={autoRotate ? "Pause Auto-Rotation" : "Play Auto-Rotation"}
                        aria-label="Toggle auto rotation"
                    >
                        {autoRotate ? "⏸" : "▶"}
                    </button>

                    {/* Zoom In */}
                    <button
                        type="button"
                        className={styles.controlBtn}
                        onClick={() => handleZoom(-8)}
                        title="Zoom In"
                        aria-label="Zoom in"
                    >
                        +
                    </button>

                    {/* Zoom Out */}
                    <button
                        type="button"
                        className={styles.controlBtn}
                        onClick={() => handleZoom(8)}
                        title="Zoom Out"
                        aria-label="Zoom out"
                    >
                        −
                    </button>

                    {/* Fullscreen */}
                    <button
                        type="button"
                        className={styles.controlBtn}
                        onClick={toggleFullscreen}
                        title="Toggle Fullscreen"
                        aria-label="Toggle fullscreen"
                    >
                        ⛶
                    </button>
                </div>
            </div>

            {/* Drag Hint (fades out after first interaction) */}
            {!hasInteracted && (
                <div className={styles.hintOverlay}>
                    <span>👆</span>
                    <span>Click & drag in any direction to look around 360°</span>
                </div>
            )}

            {/* Bottom Room Switcher Bar */}
            <div className={styles.bottomOverlay}>
                <div className={styles.roomSelector}>
                    {rooms.map((room, idx) => (
                        <button
                            key={room.id}
                            type="button"
                            className={`${styles.roomPill} ${activeRoomIdx === idx ? styles.roomPillActive : ""}`}
                            onClick={() => {
                                setActiveRoomIdx(idx);
                                setHasInteracted(true);
                            }}
                        >
                            <span>{room.icon}</span>
                            <span>{room.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
