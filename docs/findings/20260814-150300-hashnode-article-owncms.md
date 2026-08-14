# Why and How I Built OwnCMS: A Modern, Zero-Cost, Edge-First Personal CMS

If you have spent any time running a blog or personal portfolio, you have likely faced the classic dilemma: **WordPress is too heavy and prone to maintenance fatigue, static site generators (SSGs) like Astro or Hugo require git pushes and full rebuilds for simple edits, and SaaS CMS platforms quickly become expensive.**

For years, my agency website and blog at [Devomatik](https://www.devomatik.com) ran on Blogger. It worked, but it felt outdated, lacked custom layout flexibility, had awkward URLs, and provided zero integration with modern edge databases and clean design systems.

I wanted something different:
- **Instant publishing**: An admin panel where I can write and publish from any device without triggering a 3-minute static build.
- **Zero or near-zero operating cost**: Running on serverless free tiers without virtual machines or always-on databases.
- **Full SEO & Social Sharing**: Server-Side Rendered (SSR) HTML for search engine crawlers and rich OpenGraph social cards.
- **Instant multi-theming**: The ability to switch between Corporate, Magazine, and Minimalist blog layouts with a single click without data migrations.
- **Privacy & Lightweight Footprint**: Zero heavy npm bloat on the edge, built-in interactive Captchas, and provider-agnostic analytics.

This is the story of how and why I built **[OwnCMS](https://github.com/degomon/owncms)**.

---

## 1. The Architecture: Edge-First and Truly Serverless

To achieve maximum performance and virtually $0/month in hosting costs, OwnCMS is built on three modern infrastructure pillars:

```
┌─────────────────────────────────────────────────────────────┐
│                      Cloudflare Network                     │
│                                                             │
│  ┌───────────────────────┐       ┌───────────────────────┐  │
│  │   Cloudflare Pages    │       │ Cloudflare Functions  │  │
│  │   (Static Assets/UI)  │       │     (Edge SSR API)    │  │
│  └───────────────────────┘       └───────────┬───────────┘  │
└──────────────────────────────────────────────┼──────────────┘
                                               │ HTTP v2 Pipeline
                                               ▼
                                    ┌───────────────────────┐
                                    │      Turso libSQL     │
                                    │    (Serverless DB)    │
                                    └───────────────────────┘
```

1. **Cloudflare Pages & Pages Functions**: Delivers global CDN distribution, automatic SSL, and serverless TypeScript functions executing in under 10ms worldwide.
2. **Turso (libSQL / SQLite on the Edge)**: A fast, serverless database with a generous free tier (billions of row reads and 9GB storage included).
3. **Cloudflare R2**: S3-compatible object storage with zero egress fees for uploaded media and featured images.

---

## 2. Overcoming Key Technical Challenges

### A. Zero-Dependency Database Connector at the Edge
Standard ORMs and even official client bundles can introduce unnecessary overhead or packaging complications during edge builds. 

Instead of relying on heavy drivers, we implemented a custom, lightweight HTTP client that communicates directly with Turso's `/v2/pipeline` endpoint using native Web API `fetch`:

```typescript
export class TursoClient {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace('libsql://', 'https://').replace(/\/$/, '');
    this.token = token;
  }

  async execute(stmt: { sql: string; args?: any[] }) {
    const payload = {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql: stmt.sql,
            args: (stmt.args || []).map((arg) => {
              if (arg === null || arg === undefined) return { type: 'null' };
              if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
              if (typeof arg === 'boolean') return { type: 'integer', value: arg ? '1' : '0' };
              return { type: 'text', value: String(arg) };
            }),
          },
        },
        { type: 'close' },
      ],
    };

    const res = await fetch(`${this.url}/v2/pipeline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return this.formatRows(data);
  }
}
```

### B. Solving the SPA SEO Paradox with Edge SSR
Single Page Applications (SPAs) offer smooth client-side transitions, but raw client-side rendering often delivers empty HTML (`<div id="app"></div>`) to web crawlers and social media preview bots.

We solved this by implementing **Edge Server-Side Rendering (SSR)** directly in `functions/[[path]].ts`. When a crawler or browser visits `/`, `/post/:slug`, or `/page/:slug`:
1. The Edge Function fetches post data and site configurations in parallel from Turso.
2. It injects full semantic HTML, `<title>`, meta descriptions, and `<meta property="og:image">` tags into the initial response.
3. The browser hydrates the UI seamlessly, allowing the client-side router (`History API`) to handle instant transitions for human visitors.

### C. A 100% Free, Canvas-Based Slider Puzzle Captcha
Spam bots targeting contact forms are a constant annoyance. Third-party CAPTCHA services either charge money, introduce privacy concerns, or slow down page loads.

We built an interactive, zero-dependency **HTML5 Canvas Slider Puzzle**:
- Generates procedural background textures and cutout puzzle shapes in real-time.
- Requires the user to drag a slider to fit the piece with pixel accuracy.
- Issues a cryptographically validated, timestamped token verified on the server before storing any contact submission.

```
[ Security Check: Slide to complete the puzzle ]
┌───────────────────────────────┐
│ ▒▒▒▒▒▒▒▒▒▒▒  [█]  ▒▒▒▒▒▒▒▒▒▒▒ │
└───────────────────────────────┘
  ───●──────────────────────────
```

---

## 3. Core Features Built-in

- **3 Out-of-the-Box Themes**:
  - **Corporate**: Includes hero presentation, service highlights, project showcases, and blog previews.
  - **Magazine**: Editorial layout with featured hero articles and structured topic grids.
  - **Personal**: Minimalist, distraction-free blog for developers and thinkers.
- **Provider-Agnostic Analytics**: Paste your tracking script (Matomo, StatCounter, Plausible, or Google Analytics) directly into the settings dashboard.
- **Multi-Admin Management**: Secure account management, display names, and password resets using Web Crypto API HMAC SHA-256 JWT tokens.
- **Real-Time Sitemap**: Dynamically generated `/sitemap.xml` listing all published posts and static pages with accurate `lastmod` timestamps.

---

## 4. How to Deploy Your Own in 2 Minutes

OwnCMS is fully open source. You can spin up your own instance for free:

1. **Clone the Repo**:
   ```bash
   git clone https://github.com/degomon/owncms.git
   cd owncms
   npm install
   ```

2. **Initialize Database**:
   Create a free database on [Turso](https://turso.tech) and run:
   ```bash
   node tools/db-init.js
   ```

3. **Deploy to Cloudflare Pages**:
   - Push your repo to GitHub.
   - Link the repo in the [Cloudflare Dashboard](https://dash.cloudflare.com/) under **Pages**.
   - Set Build Output Directory to `public`.
   - Add your `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `JWT_SECRET` environment variables.

---

## Conclusion

You don't need a heavy virtual machine, an expensive hosting tier, or complicated deployment pipelines to run a high-performance, beautiful website. By combining modern edge functions with serverless SQLite, OwnCMS provides complete autonomy over your content with instantaneous publishing and enterprise-grade performance.

- **GitHub Repository**: [https://github.com/degomon/owncms](https://github.com/degomon/owncms)
- **Live Implementation**: [Devomatik](https://www.devomatik.com)

Feel free to fork, experiment, and contribute!
