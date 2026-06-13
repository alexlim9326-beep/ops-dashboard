# Ops Dashboard — Deployment Guide

## What you're deploying
Next.js 14 app + Supabase (database + auth) + Vercel (hosting)
All free tier. Live URL in ~15 minutes.

---

## Step 1 — Supabase setup (5 min)

1. Go to https://supabase.com → Create account → New project
2. Choose a name (e.g. "ops-dashboard"), set a strong DB password, pick region: **Southeast Asia (Singapore)**
3. Wait ~2 min for project to provision
4. Go to **SQL Editor** → paste the full contents of `supabase-schema.sql` → Run
5. Go to **Project Settings → API**
   - Copy **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public key** → this is `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — GitHub (2 min)

Run these commands in Claude Code (or your terminal):

```bash
cd ops-dashboard
cp .env.local.example .env.local
# Edit .env.local with your Supabase keys

git init
git add .
git commit -m "Initial commit"
```

Then:
1. Go to https://github.com/new → Create a new repo (e.g. `ops-dashboard`)
2. Follow the "push existing repo" instructions GitHub shows you

---

## Step 3 — Vercel deploy (3 min)

1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New Project** → import your `ops-dashboard` repo
3. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy**

Your dashboard will be live at `https://ops-dashboard-xxxx.vercel.app`

---

## Step 4 — Configure Supabase auth redirect (1 min)

1. In Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://ops-dashboard-xxxx.vercel.app`)
3. Add to **Redirect URLs**: `https://ops-dashboard-xxxx.vercel.app/auth/callback`

---

## Step 5 — First login

1. Visit your Vercel URL
2. Click "Don't have an account? Sign up"
3. Enter email + password → you're in

---

## Optional: Custom domain

In Vercel → your project → **Domains** → add your domain.
Then update Supabase Site URL and Redirect URLs to match.

---

## Local development

```bash
cd ops-dashboard
npm install
cp .env.local.example .env.local
# Fill in your Supabase keys
npm run dev
# Open http://localhost:3000
```

---

## Adding team members

Team members sign up at your Vercel URL with their own email + password.
All data is shared across the team (deals, leads, tasks, meetings, deadlines are visible to all authenticated users).
The user who creates a record is tracked via `user_id` for future role-based filtering.
