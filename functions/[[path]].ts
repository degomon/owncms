import { getDb, type Env } from './_lib/db';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Si es un archivo estático conocido o endpoint de API o Admin, pasar al handler normal
  if (
    pathname.startsWith('/api/') ||
    pathname.startsWith('/admin') ||
    pathname.includes('.') ||
    pathname === '/sitemap.xml'
  ) {
    return next();
  }

  try {
    const db = getDb(env);

    // 1. Obtener configuraciones del sitio
    const settingsRes = await db.execute({
      sql: `SELECT key, value FROM settings WHERE key IN (
        'theme', 'site_title', 'site_tagline', 'site_description',
        'contact_email', 'logo_url', 'favicon_url', 'analytics_code', 'show_cms_love'
      )`,
      args: [],
    });

    const settings: Record<string, string> = {};
    for (const row of settingsRes.rows) {
      settings[String(row.key)] = String(row.value);
    }

    const theme = settings.theme || 'corporate';
    const siteTitle = settings.site_title || 'Devomatik';
    const siteTagline = settings.site_tagline || 'Modern & Scalable Digital Experiences';
    const siteDesc = settings.site_description || 'Software Consulting, App Development & Cloud Architecture';
    const logoUrl = settings.logo_url || '';
    const faviconUrl = settings.favicon_url || '';
    const showCmsLove = settings.show_cms_love === 'true' || settings.show_cms_love === '1';

    let pageTitle = siteTitle;
    let pageDesc = siteDesc;
    let pageImage = logoUrl;
    let mainContentHtml = '';

    const logoHtml = logoUrl
      ? `<img src="${logoUrl}" alt="${siteTitle}" style="max-height: 40px; vertical-align: middle;">`
      : siteTitle;

    const cmsLoveHtml = showCmsLove
      ? `<p style="margin-top: 0.5rem; font-size: 0.8rem; opacity: 0.85;">Powered with love by <a href="https://github.com/degomon/owncms" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: underline;">OwnCMS</a></p>`
      : '';

    // HEADER Y FOOTER SSR
    const headerHtml = `
      <header class="corporate-header">
        <div class="corporate-nav">
          <a href="/" class="corporate-logo" style="display: flex; align-items: center; gap: 0.5rem;">${logoHtml}</a>
          <ul class="corporate-menu">
            <li><a href="/">Home</a></li>
            <li><a href="/page/hire-our-team">Services</a></li>
            <li><a href="/page/own-projects">Projects</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
      </header>
    `;

    const footerHtml = `
      <footer class="corporate-footer">
        <div style="max-width: 1200px; margin: 0 auto 1.5rem auto; display: flex; justify-content: center; gap: 2rem; font-size: 0.95rem; font-weight: 500;">
          <a href="/page/about" style="color: var(--text-secondary); text-decoration: none;">About</a>
          <a href="/page/privacy" style="color: var(--text-secondary); text-decoration: none;">Privacy Policy</a>
          <a href="/page/hire-our-team" style="color: var(--text-secondary); text-decoration: none;">Services</a>
          <a href="/contact" style="color: var(--text-secondary); text-decoration: none;">Contact</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} ${siteTitle}. All rights reserved.</p>
        ${cmsLoveHtml}
      </footer>
    `;

    // 2. Determinar si es Home, Post o Page
    if (pathname === '/' || pathname === '') {
      // HOME SSR
      const postsRes = await db.execute(`
        SELECT p.*, c.name as category_name
        FROM posts p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.type = 'post' AND p.status = 'published'
        ORDER BY p.published_at DESC
        LIMIT 10
      `);

      const postsCards = postsRes.rows.map((p) => `
        <article class="post-card">
          ${p.featured_image ? `<img src="${p.featured_image}" alt="${p.title}">` : ''}
          <div class="post-card-body">
            <div class="post-card-tag">${p.category_name || 'Blog'}</div>
            <h3 class="post-card-title"><a href="/post/${p.slug}">${p.title}</a></h3>
            <p class="post-card-excerpt">${p.excerpt || ''}</p>
            <div class="post-card-meta">${new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          </div>
        </article>
      `).join('');

      mainContentHtml = `
        <section class="corporate-hero">
          <div class="corporate-hero-inner">
            <h1>${siteTitle}</h1>
            <p>${siteTagline}</p>
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <a href="/page/hire-our-team" class="btn">Explore Services</a>
              <a href="/page/own-projects" class="btn" style="background: transparent; color: var(--text-primary); border: 1px solid var(--border);">Featured Projects</a>
            </div>
          </div>
        </section>

        <section class="corporate-section" style="padding-top: 3rem; padding-bottom: 1rem;">
          <div class="grid-3">
            <div class="corporate-card">
              <h3>App & Web Development</h3>
              <p>High-performance applications built with modern frameworks and robust backend systems.</p>
            </div>
            <div class="corporate-card">
              <h3>Process Optimization</h3>
              <p>Streamline workflows, automate repetitive operations, and maximize business efficiency.</p>
            </div>
            <div class="corporate-card">
              <h3>Strategic Consulting</h3>
              <p>Expert advisory and architecture design tailored to scale your digital presence.</p>
            </div>
          </div>
        </section>

        <main class="corporate-section">
          <h2 class="section-title">Latest Articles</h2>
          <div class="grid-3">
            ${postsCards || '<p>No blog posts available.</p>'}
          </div>
        </main>
      `;
    } else if (pathname.startsWith('/post/') || pathname.startsWith('/page/')) {
      // POST O PAGE SSR
      const isPost = pathname.startsWith('/post/');
      const slug = pathname.replace('/post/', '').replace('/page/', '').replace(/\/$/, '');

      const postRes = await db.execute({
        sql: `SELECT * FROM posts WHERE slug = ? AND status = 'published' LIMIT 1`,
        args: [slug],
      });

      if (postRes.rows.length > 0) {
        const p = postRes.rows[0];
        pageTitle = `${p.title} — ${siteTitle}`;
        pageDesc = p.excerpt || p.meta_description || siteDesc;
        pageImage = p.featured_image || logoUrl;

        const isPage = p.type === 'page';
        const contentHasImages = /<img[^>]+src=/i.test(p.content_html || '');
        const showHeaderImage = !isPage && p.featured_image && !contentHasImages;

        mainContentHtml = `
          <div style="max-width: 860px; margin: 3rem auto; padding: 0 1.5rem; min-height: 50vh;">
            ${!isPage ? `<p style="margin-bottom: 1.5rem;"><a href="/" style="color: var(--accent); text-decoration: none; font-weight: 600;">&larr; Back to Blog</a></p>` : ''}
            <h1 style="font-size: 2.5rem; margin-bottom: ${isPage ? '2rem' : '0.5rem'}; line-height: 1.2; font-weight: 800;">${p.title}</h1>
            ${!isPage ? `<p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem;">Published on ${new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>` : ''}
            ${showHeaderImage ? `<img src="${p.featured_image}" style="width: 100%; max-height: 460px; object-fit: cover; border-radius: 8px; margin-bottom: 2rem;">` : ''}
            <div class="article-content" style="font-size: 1.15rem; line-height: 1.8;">
              ${p.content_html || p.content_markdown}
            </div>
          </div>
        `;
      }
    } else if (pathname === '/contact') {
      pageTitle = `Contact Us — ${siteTitle}`;
      pageDesc = `Get in touch with ${siteTitle} for software consulting, app development, and ERP implementation.`;
    }

    // GENERAR DOCUMENTO HTML COMPLETO SSR
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageTitle}</title>
  <meta name="description" content="${pageDesc}">
  
  <!-- OpenGraph / Social Media Meta -->
  <meta property="og:title" content="${pageTitle}">
  <meta property="og:description" content="${pageDesc}">
  ${pageImage ? `<meta property="og:image" content="${pageImage}">` : ''}
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url.href}">

  ${faviconUrl ? `<link rel="shortcut icon" href="${faviconUrl}">` : ''}
  <!-- Dynamic Theme CSS -->
  <link id="theme-style" rel="stylesheet" href="/themes/${theme}/theme.css">
</head>
<body>
  <div id="app">
    ${mainContentHtml ? `${headerHtml}${mainContentHtml}${footerHtml}` : ''}
  </div>
  <script src="/app.js"></script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60, s-maxage=3600',
      },
    });
  } catch (err) {
    return next();
  }
};
