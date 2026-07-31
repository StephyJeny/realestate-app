# 🚀 Deployment Setup Guide — Vercel

## How It Works

```
Push to `main` branch  →  Vercel auto-builds  →  Live URL updated
Push to `steph` branch →  Vercel creates a Preview URL (for testing)
```

## Setup Steps (One-Time, ~2 minutes)

### Step 1: Go to Vercel
1. Open [vercel.com](https://vercel.com)
2. Click **"Sign Up"** → Choose **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub account

### Step 2: Import Your Repository
1. Click **"Add New Project"**
2. Find and select **`StephyJeny/realestate-app`**
3. Click **"Import"**

### Step 3: Configure & Deploy
1. **Framework Preset:** Should auto-detect as **Next.js** ✅
2. **Root Directory:** Leave as `./ ` ✅
3. **Build Command:** `next build` (auto-filled) ✅
4. **Output Directory:** Leave default ✅
5. Click **"Deploy"** 🚀

### Step 4: Get Your Live URL
After ~1 minute, Vercel will give you a URL like:
- `https://realestate-app.vercel.app`
- Or `https://realestate-app-stephyjeny.vercel.app`

This is your **production URL** — it auto-updates every time you push to `main`!

## How Auto-Deploy Works

| Branch | What Happens |
|--------|-------------|
| `main` | **Production deploy** → Updates your live URL |
| `steph` | **Preview deploy** → Creates a temporary preview URL for testing |
| Pull Request | **Preview deploy** → Unique URL for each PR |

## Custom Domain (Optional)
1. Go to your project on Vercel dashboard
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `myrealestate.co.ke`)
4. Update DNS records as instructed

## Environment Variables
When you add Firebase/Mapbox keys later:
1. Go to Vercel dashboard → Your project → **"Settings"** → **"Environment Variables"**
2. Add each variable (same as your `.env.local` file)
