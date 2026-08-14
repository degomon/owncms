# OwnCMS 🚀

A modern, ultra-lightweight, decoupled Content Management System designed for low-cost, serverless edge hosting. Powered by **Cloudflare Pages**, **Pages Functions**, **Turso (libSQL)**, and **Cloudflare R2**.

---

## 🌟 Highlights & Features

- **🚀 Ultra-Fast Serverless Edge**: Zero server management. Deploys on Cloudflare Pages and executes at the global edge.
- **🎨 3 Built-in Instant Themes**:
  - `corporate`: Modern corporate portfolio & agency design (Hero, Service cards, Featured projects, Blog).
  - `magazine`: Content-first editorial layout with primary featured stories and category grids.
  - `personal`: Minimalist, distraction-free blog for developers and writers.
- **⚡ Native Clean URLs (History API)**: Full SEO-friendly paths (`/post/:slug`, `/page/:slug`, `/contact`).
- **🔍 Dynamic SEO & Sitemap**: Live meta tag injection (`document.title`, `meta[description]`, OpenGraph) and dynamic XML sitemap generation at `/sitemap.xml`.
- **🧩 Interactive Slider Puzzle Captcha**: Built-in, 100% free HTML5 Canvas human verification with server-side validation (zero third-party dependencies).
- **📊 Provider-Agnostic Analytics**: Paste your tracking snippet from Matomo, StatCounter, Plausible, or Google Analytics directly from `/admin/`.
- **🛡️ Multi-User Administration**: Custom admin credentials, Web Crypto API authentication (HMAC SHA-256 JWT), and password hashing.
- **❤️ Optional "Show CMS Love"**: Optional footer badge to support the open-source project.

---

## 🛠️ Architecture & Tech Stack

```
OwnCMS
├── public/                 # Static frontend assets & themes
│   ├── admin/index.html    # Single-file Admin Dashboard
│   ├── themes/             # Corporate, Magazine, and Personal CSS themes
│   ├── app.js              # SPA router, dynamic SEO, Captcha & theme engine
│   └── index.html          # Public entrypoint
├── functions/              # Cloudflare Pages Functions (Edge API)
│   ├── _lib/db.ts          # Zero-dependency Turso libSQL v2 HTTP client
│   ├── _lib/auth.ts        # Web Crypto HMAC SHA-256 JWT auth
│   ├── api/auth/login.ts   # Authentication endpoint
│   ├── api/admin/          # Posts, Users, Settings, Messages, Media upload
│   ├── api/public/         # Posts reader, settings, contact submission
│   └── sitemap.xml.ts      # Real-time dynamic XML Sitemap generator
└── db/schema.sql           # Turso / SQLite relational schema
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- Node.js 18+
- [Turso CLI](https://docs.turso.tech/cli/introduction) or a Turso Cloud Database
- Wrangler CLI (`npm install -g wrangler` or via `npx`)

### 2. Clone and Setup
```bash
git clone https://github.com/degomon/owncms.git
cd owncms
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env`:
```env
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your-turso-jwt-auth-token
JWT_SECRET=your-random-secret-key-32-chars-min
R2_PUBLIC_URL=https://your-media-cdn.yourdomain.com
```

### 4. Database Setup
Initialize the database schema:
```bash
node tools/db-init.js
```
*(Default admin user: `admin` / `admin123`)*

### 5. Run Local Dev Server
```bash
npm run dev
```
Open [http://localhost:8788](http://localhost:8788) for the public site or [http://localhost:8788/admin/](http://localhost:8788/admin/) for the admin dashboard.

---

## ☁️ Cloudflare Pages Deployment Guide

Deploying OwnCMS to Cloudflare Pages is completely free and takes less than 2 minutes.

### Step 1: Push to GitHub
Make sure your repository is pushed to your GitHub account:
```bash
git remote add origin https://github.com/your-username/owncms.git
git branch -M main
git push -u origin main
```

### Step 2: Create Cloudflare Pages Project
1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Go to **Compute (Workers & Pages)** > **Create application** > **Pages** tab.
3. Click **Connect to Git** and select your `owncms` repository.
4. Set the Build Configuration:
   - **Framework preset**: `None`
   - **Build command**: *(leave blank)*
   - **Build output directory**: `public`
5. In **Environment variables**, add:
   - `TURSO_DATABASE_URL` = `libsql://your-database.turso.io`
   - `TURSO_AUTH_TOKEN` = `your-turso-auth-token`
   - `JWT_SECRET` = `your-jwt-secret`
   - `R2_PUBLIC_URL` = `https://your-media-domain.com` *(optional)*
6. Click **Save and Deploy**.

### Step 3: Configure Custom Domain & SSL
1. Go to your Pages project > **Custom domains** tab.
2. Click **Set up a custom domain** and type your domain (e.g., `yourdomain.com`).
3. Cloudflare will automatically route DNS and provision free SSL certificates.

---

## 📄 License

MIT License. Feel free to use, modify, and distribute for personal or commercial projects.
