# GA Coach Finder — Deployment Guide

## What's in this project
- `/src` — Full React app (Coach Directory, Travel Teams, Player Board)
- `schema.sql` — Paste this into Supabase to create all your tables
- `coaches_import.csv` — Open in Google Sheets; add coaches here before importing

---

## Step 1 — Set up Supabase database

1. Go to https://supabase.com and log in
2. Open your `ga-coach-directory` project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open `schema.sql` from this folder, copy ALL the contents
6. Paste into the SQL editor and click **Run**
7. You should see "Success" — your tables are created

---

## Step 2 — Upload coach data (Google Sheets → Supabase)

1. Open `coaches_import.csv` in Google Sheets
2. Add any new coaches you've collected to new rows
3. When ready to import, go to Supabase > **Table Editor** > **coaches**
4. Click **Insert** > **Import data from CSV**
5. Upload the CSV — Supabase will map columns automatically

---

## Step 3 — Deploy to GitHub + Vercel

### First time only:
1. Go to https://github.com and create a new repository named `ga-coach-directory`
2. Upload all files from this folder to that repo (drag and drop on GitHub works)
3. Go to https://vercel.com and click **New Project**
4. Connect your GitHub account and select the `ga-coach-directory` repo
5. Vercel will auto-detect Vite — click **Deploy**
6. Your site will be live at a `vercel.app` URL in ~2 minutes

### Connect your custom domain:
1. In Vercel, go to your project > **Settings** > **Domains**
2. Add your domain from Namecheap
3. Vercel will give you DNS records to add in Namecheap
4. In Namecheap > **Domain List** > **Manage** > **Advanced DNS** — add the records
5. Live on your domain within 24 hours (usually under 1 hour)

---

## Step 4 — Future updates

Any time you push changes to GitHub, Vercel auto-redeploys. No manual steps needed.

---

## Supabase Keys (already wired into the app)
- **Project URL:** https://uphwnxgfutbmbjwjfkgu.supabase.co
- **Anon Key:** sb_publishable_jfx5xgse3xv8KvYvsRDgQQ_BVMphtzW

---

## Tech Stack
| Tool | Purpose | Cost |
|------|---------|------|
| React + Vite | Frontend app | Free |
| Leaflet + OpenStreetMap | Map layer | Free |
| Supabase | Database + API | Free |
| Vercel | Hosting + deploys | Free |
| Resend | Expiry emails | Free |
| Namecheap | Custom domain | ~$12/yr |
