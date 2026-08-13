"use client";
import { useState, useCallback } from "react";
import Image, { ImageProps } from "next/image";

// Tiny inline SVG blur placeholder generator (10x10 px blurred)
const SHIMMER_SVG = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1a1f2e" />
      <stop offset="50%" stop-color="#2a3040" />
      <stop offset="100%" stop-color="#1a1f2e" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)" />
</svg>`;

const toBase64 = (str: string) =>
    typeof window === "undefined"
        ? Buffer.from(str).toString("base64")
        : window.btoa(str);

function shimmerPlaceholder(w = 700, h = 400): `data:image/${string}` {
    return `data:image/svg+xml;base64,${toBase64(SHIMMER_SVG(w, h))}`;
}

// Pre-computed blur data URLs for local static images
const BLUR_MAP: Record<string, string> = {
    "/images/property-1.png": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0iIzJhM2Y1YSIvPjwvc3ZnPg==",
    "/images/property-2.png": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0iIzM1NDk2YSIvPjwvc3ZnPg==",
    "/images/property-3.png": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0iIzJkNDE1NCIvPjwvc3ZnPg==",
    "/images/property-4.png": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0iIzNhNDg1YiIvPjwvc3ZnPg==",
    "/images/property-5.png": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0iIzJjM2Q1MCIvPjwvc3ZnPg==",
    "/images/property-6.png": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0iIzJlNDI1OCIvPjwvc3ZnPg==",
    "/images/hero-bg.png": "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iNyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAiIGhlaWdodD0iNyIgZmlsbD0iIzFhMjIzNiIvPjwvc3ZnPg==",
};

interface OptimizedImageProps extends Omit<ImageProps, "placeholder" | "blurDataURL"> {
    /** Set false to disable blur placeholder */
    enableBlur?: boolean;
}

export default function OptimizedImage({
    enableBlur = true,
    src,
    alt,
    onLoad,
    className,
    style,
    ...rest
}: OptimizedImageProps) {
    const [loaded, setLoaded] = useState(false);

    const handleLoad = useCallback(
        (e: React.SyntheticEvent<HTMLImageElement>) => {
            setLoaded(true);
            if (onLoad) (onLoad as (e: React.SyntheticEvent<HTMLImageElement>) => void)(e);
        },
        [onLoad]
    );

    const srcStr = typeof src === "string" ? src : "";
    const blurData = BLUR_MAP[srcStr] || shimmerPlaceholder();
    const isStatic = srcStr.startsWith("/images/");

    return (
        <Image
            src={src}
            alt={alt}
            placeholder={enableBlur ? "blur" : "empty"}
            blurDataURL={enableBlur ? blurData : undefined}
            loading={rest.priority ? undefined : "lazy"}
            quality={isStatic ? 85 : 75}
            onLoad={handleLoad}
            className={className}
            style={{
                ...style,
                transition: "opacity 0.4s ease, filter 0.4s ease",
                opacity: loaded || rest.priority ? 1 : 0.9,
                filter: loaded || rest.priority ? "none" : "blur(2px)",
            }}
            {...rest}
        />
    );
}
