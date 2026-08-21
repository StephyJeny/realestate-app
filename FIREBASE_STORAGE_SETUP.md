# Firebase Storage Setup Guide

This document explains how to configure Firebase Storage for the EstateVue real estate app.

---

## 1. Enable Firebase Storage

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your EstateVue project
3. Navigate to **Build → Storage**
4. Click **Get Started**
5. Select a storage location (e.g., `us-central1` or your preferred region)
6. Start in **production mode** (the rules are already defined in `storage.rules`)

## 2. Deploy Storage Rules

The storage security rules are defined in `storage.rules` at the project root.

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy only storage rules
firebase deploy --only storage
```

## 3. Storage Structure

```
📁 Firebase Storage Bucket
├── 📁 properties/
│   └── 📁 {agentId}/
│       └── 📁 {propertyId}/
│           ├── 1234567890_front_view.jpg
│           ├── 1234567891_kitchen.jpg
│           └── 1234567892_bedroom.jpg
├── 📁 avatars/
│   └── 📁 {userId}/
│       └── 1234567890_profile.jpg
├── 📁 documents/
│   └── 📁 {userId}/
│       ├── 1234567890_real_estate_license.pdf
│       └── 1234567891_certificate.jpg
└── 📁 blog/
    ├── 1234567890_market_report.jpg
    └── 1234567891_neighborhood_guide.jpg
```

## 4. Security Rules Summary

| Path | Read | Write | Constraints |
|------|------|-------|-------------|
| `properties/{agentId}/{propertyId}/{file}` | Public | Agent (owner) | ≤10MB, images only |
| `avatars/{userId}/{file}` | Public | User (owner) | ≤5MB, images only |
| `documents/{userId}/{file}` | User (owner) | User (owner) | ≤20MB, images or PDFs |
| `blog/{file}` | Public | Authenticated | ≤5MB, images only |
| Everything else | ❌ Denied | ❌ Denied | — |

## 5. Client-side Utilities

All upload/delete functions are in `src/lib/storage.ts`:

```typescript
// Property Images
import { uploadPropertyImage, uploadPropertyImages, deletePropertyImage } from "@/lib/storage";

// User Avatars
import { uploadAvatar, deleteAvatar } from "@/lib/storage";

// Documents (licenses, certificates)
import { uploadDocument } from "@/lib/storage";
```

### Image Compression
All image uploads are **automatically compressed** before uploading:
- Max width: 1200px (properties) or 512px (avatars)
- Quality: 80-85% JPEG
- Files under 200KB are skipped (already small enough)
- Non-image files are passed through untouched

### Progress Tracking
All upload functions support an `onProgress` callback:

```typescript
const url = await uploadPropertyImage(file, agentId, propertyId, (percent) => {
    console.log(`Upload: ${percent}%`);
});
```

## 6. Environment Variables

Ensure your `.env.local` includes the storage bucket:

```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
```

## 7. CORS Configuration (Optional)

If you encounter CORS issues when loading images from Firebase Storage in the browser:

1. Create `cors.json`:
```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

2. Apply it:
```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

## 8. Deploying All Rules

To deploy both Firestore and Storage rules together:

```bash
firebase deploy --only firestore:rules,storage
```
