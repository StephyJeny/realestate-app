import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firebase";

/**
 * Compresses an image file before upload using canvas.
 * Target: max 1200px wide, quality 0.8 JPEG.
 */
export function compressImage(file: File, maxWidth = 1200, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
        // If file is already small (<200KB) or not an image, skip compression
        if (file.size < 200 * 1024 || !file.type.startsWith("image/")) {
            resolve(file);
            return;
        }

        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
            let { width, height } = img;

            // Scale down if wider than maxWidth
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const compressed = new File([blob], file.name, {
                            type: "image/jpeg",
                            lastModified: Date.now(),
                        });
                        resolve(compressed);
                    } else {
                        resolve(file); // Fallback to original
                    }
                },
                "image/jpeg",
                quality
            );
        };

        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Upload a single property image to Firebase Storage.
 * Returns the download URL.
 */
export async function uploadPropertyImage(
    file: File,
    agentId: string,
    propertyId: string,
    onProgress?: (percent: number) => void
): Promise<string> {
    // Compress before upload
    const compressed = await compressImage(file);

    // Create a unique path: properties/{agentId}/{propertyId}/{timestamp}_{filename}
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `properties/${agentId}/${propertyId}/${timestamp}_${safeName}`;
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
        const uploadTask = uploadBytesResumable(storageRef, compressed);

        uploadTask.on(
            "state_changed",
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                onProgress?.(Math.round(progress));
            },
            (error) => {
                console.error("Upload error:", error);
                reject(error);
            },
            async () => {
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(url);
                } catch (err) {
                    reject(err);
                }
            }
        );
    });
}

/**
 * Upload multiple property images.
 * Returns array of download URLs.
 */
export async function uploadPropertyImages(
    files: File[],
    agentId: string,
    propertyId: string,
    onProgress?: (fileIndex: number, percent: number) => void
): Promise<string[]> {
    const urls: string[] = [];
    for (let i = 0; i < files.length; i++) {
        const url = await uploadPropertyImage(
            files[i],
            agentId,
            propertyId,
            (percent) => onProgress?.(i, percent)
        );
        urls.push(url);
    }
    return urls;
}

/**
 * Delete a property image from Firebase Storage by URL.
 */
export async function deletePropertyImage(imageUrl: string): Promise<void> {
    try {
        // Extract the storage path from a Firebase Storage URL
        const storageRef = ref(storage, imageUrl);
        await deleteObject(storageRef);
    } catch (error) {
        // If the URL is not a Firebase Storage URL (e.g., a local sample image), silently skip
        console.warn("Could not delete image:", error);
    }
}
