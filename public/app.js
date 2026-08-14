// Motor de renderizado dinámico de temas, SEO, Analytics y enrutamiento SPA

class CMSApp {
  constructor() {
    this.settings = {};
    this.currentTheme = 'corporate';
    this.posts = [];
    this.appEl = document.getElementById('app');
    this.captchaSolved = false;
    this.captchaToken = null;
  }

  async init() {
    await this.loadSettings();
    this.applyTheme(this.settings.theme || 'corporate');
    this.setupRouting();
    this.setupLinkInterception();
  }

  async loadSettings() {
    try {
      const res = await fetch('/api/public/settings');
      const data = await res.json();
      if (data.success) {
        this.settings = data.settings;
        this.updateFavicon(this.settings.favicon_url);
        this.updateMetaTags(
          this.settings.site_title || 'Devomatik',
          this.settings.site_description || 'Software Consulting, App Development & Cloud Architecture'
        );
        this.injectAnalytics(this.settings.analytics_code);
      }
    } catch (e) {
      console.error('Error loading settings', e);
    }
  }

  injectAnalytics(code) {
    if (!code || !code.trim()) return;

    // Evitar duplicación
    const existing = document.getElementById('custom-analytics-script');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.id = 'custom-analytics-script';
    container.innerHTML = code;

    // Ejecutar scripts incrustados
    const scripts = container.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      newScript.textContent = oldScript.textContent;
      document.head.appendChild(newScript);
      oldScript.remove();
    });

    document.body.appendChild(container);
  }

  updateFavicon(url) {
    if (!url) return;
    let link = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'shortcut icon';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  updateMetaTags(title, description = '', imageUrl = '') {
    const siteTitle = this.settings.site_title || 'Devomatik';
    const fullTitle = title === siteTitle ? title : `${title} — ${siteTitle}`;
    document.title = fullTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description || this.settings.site_description || '';

    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.content = fullTitle;

    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.content = metaDesc.content;

    if (imageUrl) {
      let ogImg = document.querySelector('meta[property="og:image"]');
      if (!ogImg) {
        ogImg = document.createElement('meta');
        ogImg.setAttribute('property', 'og:image');
        document.head.appendChild(ogImg);
      }
      ogImg.content = imageUrl;
    }
  }

  applyTheme(themeName) {
    this.currentTheme = themeName;
    const themeLink = document.getElementById('theme-style');
    if (themeLink) {
      themeLink.href = `/themes/${themeName}/theme.css`;
    }
  }

  getLogoHtml() {
    const siteTitle = this.settings.site_title || 'Devomatik';
    if (this.settings.logo_url) {
      return `<img src="${this.settings.logo_url}" alt="${siteTitle}" style="max-height: 40px; vertical-align: middle;">`;
    }
    return siteTitle;
  }

  getHeaderHtml() {
    const siteTitle = this.settings.site_title || 'Devomatik';
    const logoHtml = this.getLogoHtml();

    if (this.currentTheme === 'magazine') {
      return `
        <header class="magazine-header">
          <div class="magazine-header-inner">
            <a href="/" class="magazine-logo">${logoHtml}</a>
            <ul class="magazine-nav">
              <li><a href="/">Home</a></li>
              <li><a href="/page/hire-our-team">Services</a></li>
              <li><a href="/page/own-projects">Projects</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </div>
        </header>
      `;
    }

    if (this.currentTheme === 'personal') {
      return `
        <header class="personal-author" style="margin-bottom: 2rem; padding: 1.5rem 0;">
          <div class="personal-bio">
            <h1 style="font-size: 1.5rem;"><a href="/" style="color: var(--text-primary); text-decoration: none;">${logoHtml}</a></h1>
            <nav style="margin-top: 0.5rem; display: flex; gap: 1rem; font-size: 0.9rem;">
              <a href="/" style="color: var(--text-secondary); text-decoration: none;">Blog</a>
              <a href="/page/about" style="color: var(--text-secondary); text-decoration: none;">About</a>
              <a href="/page/own-projects" style="color: var(--text-secondary); text-decoration: none;">Projects</a>
              <a href="/contact" style="color: var(--text-secondary); text-decoration: none;">Contact</a>
            </nav>
          </div>
        </header>
      `;
    }

    // Default: Corporate Theme
    return `
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
  }

  getFooterHtml() {
    const siteTitle = this.settings.site_title || 'Devomatik';
    if (this.currentTheme === 'magazine') {
      return `
        <footer class="magazine-footer">
          <div style="margin-bottom: 1rem; display: flex; justify-content: center; gap: 1.5rem; font-size: 0.85rem;">
            <a href="/page/about" style="color: var(--text-secondary); text-decoration: none;">About</a>
            <a href="/page/privacy" style="color: var(--text-secondary); text-decoration: none;">Privacy Policy</a>
            <a href="/page/hire-our-team" style="color: var(--text-secondary); text-decoration: none;">Services</a>
            <a href="/contact" style="color: var(--text-secondary); text-decoration: none;">Contact</a>
          </div>
          <p>&copy; ${new Date().getFullYear()} ${siteTitle}. All rights reserved.</p>
        </footer>
      `;
    }

    if (this.currentTheme === 'personal') {
      return `
        <footer class="personal-footer">
          <div style="margin-bottom: 0.75rem; display: flex; justify-content: center; gap: 1.5rem; font-size: 0.85rem;">
            <a href="/page/about" style="color: var(--text-muted); text-decoration: none;">About</a>
            <a href="/page/privacy" style="color: var(--text-muted); text-decoration: none;">Privacy Policy</a>
            <a href="/contact" style="color: var(--text-muted); text-decoration: none;">Contact</a>
          </div>
          <p>&copy; ${new Date().getFullYear()} ${siteTitle}.</p>
        </footer>
      `;
    }

    // Corporate Footer
    return `
      <footer class="corporate-footer">
        <div style="max-width: 1200px; margin: 0 auto 1.5rem auto; display: flex; justify-content: center; gap: 2rem; font-size: 0.95rem; font-weight: 500;">
          <a href="/page/about" style="color: var(--text-secondary); text-decoration: none;">About</a>
          <a href="/page/privacy" style="color: var(--text-secondary); text-decoration: none;">Privacy Policy</a>
          <a href="/page/hire-our-team" style="color: var(--text-secondary); text-decoration: none;">Hire Our Team</a>
          <a href="/contact" style="color: var(--text-secondary); text-decoration: none;">Contact</a>
        </div>
        <p>&copy; ${new Date().getFullYear()} ${siteTitle}. All rights reserved.</p>
      </footer>
    `;
  }

  setupLinkInterception() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (href && href.startsWith('/') && !href.startsWith('/admin') && !href.startsWith('/api')) {
        e.preventDefault();
        window.history.pushState({}, '', href);
        this.handleRoute();
      }
    });
  }

  setupRouting() {
    window.addEventListener('popstate', () => this.handleRoute());
    this.handleRoute();
  }

  async handleRoute() {
    const path = window.location.pathname;
    window.scrollTo(0, 0);

    if (path.startsWith('/post/')) {
      const slug = path.replace('/post/', '').replace(/\/$/, '');
      await this.renderSingle(slug, 'post');
    } else if (path.startsWith('/page/')) {
      const slug = path.replace('/page/', '').replace(/\/$/, '');
      await this.renderSingle(slug, 'page');
    } else if (path === '/contact') {
      this.renderContact();
    } else {
      await this.renderHome();
    }
  }

  async renderHome() {
    this.updateMetaTags(
      this.settings.site_title || 'Devomatik',
      this.settings.site_description || 'Software Consulting, App Development & Cloud Architecture'
    );

    try {
      const res = await fetch('/api/public/posts?type=post');
      const data = await res.json();
      this.posts = data.posts || [];

      if (this.currentTheme === 'corporate') {
        this.renderCorporateHome();
      } else if (this.currentTheme === 'magazine') {
        this.renderMagazineHome();
      } else {
        this.renderPersonalHome();
      }
    } catch (e) {
      this.appEl.innerHTML = `${this.getHeaderHtml()}<div class="corporate-section"><p>Error loading posts.</p></div>${this.getFooterHtml()}`;
    }
  }

  renderCorporateHome() {
    const siteTitle = this.settings.site_title || 'Devomatik';
    const siteTagline = this.settings.site_tagline || 'App Development, Web Applications & Automation';

    const postsHtml = this.posts.map(p => `
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

    this.appEl.innerHTML = `
      ${this.getHeaderHtml()}

      <section class="corporate-hero">
        <div class="corporate-hero-inner">
          <h1>${siteTitle}</h1>
          <p>${siteTagline}</p>
          <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
            <a href="/page/hire-our-team" class="btn">Hire Our Team</a>
            <a href="/page/own-projects" class="btn" style="background: transparent; color: var(--text-primary); border: 1px solid var(--border);">Our Projects</a>
          </div>
        </div>
      </section>

      <section class="corporate-section" style="padding-top: 3rem; padding-bottom: 1rem;">
        <div class="grid-3">
          <div class="corporate-card">
            <h3>App & Web Development</h3>
            <p>Specialists in Flutter, Java, PostgreSQL, and scalable high-performance cloud architectures.</p>
          </div>
          <div class="corporate-card">
            <h3>ERP Implementation</h3>
            <p>Streamline business processes, improve operational efficiency, and automate workflows.</p>
          </div>
          <div class="corporate-card">
            <h3>Software Consulting</h3>
            <p>Tailored digital solutions with a client-centric approach to drive growth and results.</p>
          </div>
        </div>
      </section>

      <main class="corporate-section">
        <h2 class="section-title">Latest Articles</h2>
        <div class="grid-3">
          ${postsHtml || '<p>No blog posts available.</p>'}
        </div>
      </main>

      ${this.getFooterHtml()}
    `;
  }

  renderMagazineHome() {
    const siteTitle = this.settings.site_title || 'Devomatik Magazine';
    const featured = this.posts[0];
    const rest = this.posts.slice(1);

    const restHtml = rest.map(p => `
      <article class="magazine-card">
        ${p.featured_image ? `<img src="${p.featured_image}" alt="${p.title}">` : ''}
        <div class="magazine-card-body">
          <span class="badge">${p.category_name || 'Blog'}</span>
          <h3 class="magazine-card-title"><a href="/post/${p.slug}">${p.title}</a></h3>
          <p style="font-size: 0.85rem; color: var(--text-muted);">${new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
        </div>
      </article>
    `).join('');

    this.appEl.innerHTML = `
      ${this.getHeaderHtml()}

      <main class="magazine-container">
        ${featured ? `
          <div class="featured-main">
            ${featured.featured_image ? `<img src="${featured.featured_image}">` : ''}
            <div class="featured-content">
              <span class="badge">${featured.category_name || 'Featured'}</span>
              <h2><a href="/post/${featured.slug}">${featured.title}</a></h2>
              <p style="color: #cbd5e1; font-size: 1.1rem;">${featured.excerpt || ''}</p>
            </div>
          </div>
        ` : ''}

        <h2 style="margin-bottom: 1.5rem; font-weight: 800; text-transform: uppercase; font-size: 1.2rem;">Recent Articles</h2>
        <div class="magazine-grid">
          ${restHtml}
        </div>
      </main>

      ${this.getFooterHtml()}
    `;
  }

  renderPersonalHome() {
    const siteTitle = this.settings.site_title || 'Devomatik';
    const siteDesc = this.settings.site_description || 'Software Consulting, App Development & Cloud Architecture.';

    const postsHtml = this.posts.map(p => `
      <article class="personal-post-item">
        <div class="personal-post-date">${new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
        <h2 class="personal-post-title"><a href="/post/${p.slug}">${p.title}</a></h2>
        <p class="personal-post-excerpt">${p.excerpt || ''}</p>
      </article>
    `).join('');

    this.appEl.innerHTML = `
      <main class="personal-layout">
        ${this.getHeaderHtml()}

        <section>
          ${postsHtml || '<p>No published articles yet.</p>'}
        </section>

        ${this.getFooterHtml()}
      </main>
    `;
  }

  async renderSingle(slug, expectedType = 'post') {
    try {
      const res = await fetch(`/api/public/posts/${slug}`);
      const data = await res.json();
      if (!data.success) {
        this.updateMetaTags('Page not found');
        this.appEl.innerHTML = `
          ${this.getHeaderHtml()}
          <div style="padding: 5rem 1.5rem; text-align: center;">
            <h2>Page not found</h2>
            <p style="margin-top: 1rem;"><a href="/" class="btn">Back to Home</a></p>
          </div>
          ${this.getFooterHtml()}
        `;
        return;
      }

      const p = data.post;
      const isPage = p.type === 'page';

      this.updateMetaTags(p.title, p.excerpt || p.meta_description, p.featured_image);

      const contentHasImages = /<img[^>]+src=/i.test(p.content_html || '');
      const showHeaderImage = !isPage && p.featured_image && !contentHasImages;

      this.appEl.innerHTML = `
        ${this.getHeaderHtml()}
        <div style="max-width: 860px; margin: 3rem auto; padding: 0 1.5rem; min-height: 50vh;">
          ${!isPage ? `<p style="margin-bottom: 1.5rem;"><a href="/" style="color: var(--accent); text-decoration: none; font-weight: 600;">&larr; Back to Blog</a></p>` : ''}
          <h1 style="font-size: 2.5rem; margin-bottom: ${isPage ? '2rem' : '0.5rem'}; line-height: 1.2; font-weight: 800;">${p.title}</h1>
          ${!isPage ? `<p style="color: var(--text-muted); margin-bottom: 2rem; font-size: 0.95rem;">Published on ${new Date(p.published_at || p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>` : ''}
          ${showHeaderImage ? `<img src="${p.featured_image}" style="width: 100%; max-height: 460px; object-fit: cover; border-radius: 8px; margin-bottom: 2rem;">` : ''}
          <div class="article-content" style="font-size: 1.15rem; line-height: 1.8;">
            ${p.content_html || p.content_markdown}
          </div>
        </div>
        ${this.getFooterHtml()}
      `;
    } catch (e) {
      this.appEl.innerHTML = `
        ${this.getHeaderHtml()}
        <div style="padding: 5rem 1.5rem; text-align: center;">Error loading content.</div>
        ${this.getFooterHtml()}
      `;
    }
  }

  renderContact() {
    this.updateMetaTags('Contact Us', 'Get in touch with Devomatik for software consulting, app development, and ERP implementation.');
    this.captchaSolved = false;
    this.captchaToken = null;

    this.appEl.innerHTML = `
      ${this.getHeaderHtml()}
      <div style="max-width: 600px; margin: 4rem auto; padding: 0 1.5rem; min-height: 50vh;">
        <h1 style="font-size: 2rem; margin-bottom: 1.5rem; font-weight: 800;">Contact Us</h1>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Have a project in mind or need software consulting? Send us a message.</p>
        <form id="contact-form" style="display: flex; flex-direction: column; gap: 1.25rem;">
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 0.35rem;">Name</label>
            <input type="text" id="c-name" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px;">
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 0.35rem;">Email Address</label>
            <input type="email" id="c-email" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px;">
          </div>
          <div>
            <label style="display: block; font-weight: 600; margin-bottom: 0.35rem;">Message</label>
            <textarea id="c-message" rows="5" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px;"></textarea>
          </div>

          <!-- Human Verification Slider Puzzle -->
          <div style="border: 1px solid var(--border); border-radius: 8px; padding: 1rem; background: var(--bg-secondary);">
            <div style="font-weight: 600; font-size: 0.9rem; margin-bottom: 0.75rem; display: flex; justify-content: space-between;">
              <span>Security Check: Slide to complete the puzzle</span>
              <button type="button" id="refresh-captcha-btn" style="background: none; border: none; color: var(--accent); cursor: pointer; font-size: 0.8rem;">↻ Refresh</button>
            </div>
            
            <div id="captcha-canvas-container" style="position: relative; width: 280px; height: 140px; margin: 0 auto 0.75rem auto; border-radius: 6px; overflow: hidden; border: 1px solid var(--border);">
              <canvas id="captcha-bg" width="280" height="140" style="display: block;"></canvas>
              <canvas id="captcha-piece" width="280" height="140" style="position: absolute; top: 0; left: 0; pointer-events: none;"></canvas>
            </div>

            <div style="width: 280px; margin: 0 auto;">
              <input type="range" id="captcha-slider" min="0" max="235" value="0" style="width: 100%; cursor: pointer;">
            </div>
            <div id="captcha-status-text" style="text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-top: 0.35rem;">Drag the slider right to fit the puzzle piece</div>
          </div>

          <button type="submit" id="submit-btn" class="btn" style="align-self: flex-start;">Send Message</button>
          <div id="contact-status" style="margin-top: 0.5rem; font-weight: 600;"></div>
        </form>
      </div>
      ${this.getFooterHtml()}
    `;

    this.initSliderCaptcha();

    document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const statusEl = document.getElementById('contact-status');

      if (!this.captchaSolved || !this.captchaToken) {
        statusEl.style.color = '#ef4444';
        statusEl.textContent = 'Please solve the slider puzzle to verify you are human.';
        return;
      }

      statusEl.textContent = 'Sending...';

      const payload = {
        name: document.getElementById('c-name').value,
        email: document.getElementById('c-email').value,
        message: document.getElementById('c-message').value,
        captcha_token: this.captchaToken,
      };

      try {
        const res = await fetch('/api/public/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          statusEl.style.color = '#10b981';
          statusEl.textContent = 'Message sent successfully!';
          e.target.reset();
          this.initSliderCaptcha();
        } else {
          statusEl.style.color = '#ef4444';
          statusEl.textContent = data.error || 'Error sending message';
        }
      } catch {
        statusEl.style.color = '#ef4444';
        statusEl.textContent = 'Network error';
      }
    });
  }

  initSliderCaptcha() {
    this.captchaSolved = false;
    this.captchaToken = null;

    const bgCanvas = document.getElementById('captcha-bg');
    const pieceCanvas = document.getElementById('captcha-piece');
    const slider = document.getElementById('captcha-slider');
    const statusText = document.getElementById('captcha-status-text');
    const refreshBtn = document.getElementById('refresh-captcha-btn');

    if (!bgCanvas || !pieceCanvas || !slider) return;

    slider.value = 0;
    slider.disabled = false;
    if (statusText) {
      statusText.style.color = 'var(--text-muted)';
      statusText.textContent = 'Drag the slider right to fit the puzzle piece';
    }

    const bgCtx = bgCanvas.getContext('2d');
    const pieceCtx = pieceCanvas.getContext('2d');

    const width = 280;
    const height = 140;
    const pieceSize = 44;

    const targetX = Math.floor(Math.random() * (width - pieceSize - 80)) + 60;
    const targetY = Math.floor(Math.random() * (height - pieceSize - 30)) + 15;

    const hue1 = Math.floor(Math.random() * 360);
    const hue2 = (hue1 + 60) % 360;
    const grad = bgCtx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, `hsl(${hue1}, 70%, 55%)`);
    grad.addColorStop(1, `hsl(${hue2}, 80%, 35%)`);
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, width, height);

    bgCtx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 6; i++) {
      bgCtx.beginPath();
      bgCtx.arc(Math.random() * width, Math.random() * height, Math.random() * 40 + 10, 0, Math.PI * 2);
      bgCtx.fill();
    }

    bgCtx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    bgCtx.fillRect(targetX, targetY, pieceSize, pieceSize);
    bgCtx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    bgCtx.lineWidth = 2;
    bgCtx.strokeRect(targetX, targetY, pieceSize, pieceSize);

    const pieceImgData = bgCtx.getImageData(targetX, targetY, pieceSize, pieceSize);

    const drawPiece = (xPos) => {
      pieceCtx.clearRect(0, 0, width, height);
      pieceCtx.putImageData(pieceImgData, xPos, targetY);
      pieceCtx.strokeStyle = '#2563eb';
      pieceCtx.lineWidth = 2.5;
      pieceCtx.strokeRect(xPos, targetY, pieceSize, pieceSize);
    };

    drawPiece(0);

    slider.oninput = (e) => {
      const currentX = parseInt(e.target.value, 10);
      drawPiece(currentX);
    };

    slider.onchange = (e) => {
      const currentX = parseInt(e.target.value, 10);
      if (Math.abs(currentX - targetX) <= 6) {
        this.captchaSolved = true;
        this.captchaToken = `${targetX}:${currentX}:${Date.now()}`;
        slider.disabled = true;
        drawPiece(targetX);
        if (statusText) {
          statusText.style.color = '#10b981';
          statusText.textContent = '✓ Verification successful!';
        }
      } else {
        slider.value = 0;
        drawPiece(0);
        if (statusText) {
          statusText.style.color = '#ef4444';
          statusText.textContent = 'Incorrect alignment. Try again!';
        }
      }
    };

    if (refreshBtn) {
      refreshBtn.onclick = () => this.initSliderCaptcha();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new CMSApp();
  app.init();
});
