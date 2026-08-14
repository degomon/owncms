import fs from 'fs';
import path from 'path';

async function fetchFeed(url) {
  console.log(`Descargando feed: ${url}...`);
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}: ${res.statusText}`);
  }
  return await res.json();
}

async function extractBlogger() {
  const outputDir = path.resolve('temp/blogger_export');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 1. Extraer Posts
  console.log('1. Obteniendo publicaciones (posts)...');
  let posts = [];
  let startIndex = 1;
  const maxResults = 150;
  let hasMore = true;

  while (hasMore) {
    const feedUrl = `https://www.devomatik.com/feeds/posts/default?alt=json&start-index=${startIndex}&max-results=${maxResults}`;
    try {
      const data = await fetchFeed(feedUrl);
      const entries = data.feed.entry || [];
      posts = posts.concat(entries);
      console.log(`Recuperados ${entries.length} posts (Total acumulado: ${posts.length})...`);
      
      if (entries.length < maxResults) {
        hasMore = false;
      } else {
        startIndex += maxResults;
      }
    } catch (e) {
      console.error('Error obteniendo posts:', e.message);
      hasMore = false;
    }
  }

  // 2. Extraer Páginas Estáticas
  console.log('2. Obteniendo páginas estáticas...');
  let pages = [];
  try {
    const pagesUrl = `https://www.devomatik.com/feeds/pages/default?alt=json&max-results=100`;
    const data = await fetchFeed(pagesUrl);
    pages = data.feed.entry || [];
    console.log(`Recuperadas ${pages.length} páginas estáticas.`);
  } catch (e) {
    console.error('Error obteniendo páginas:', e.message);
  }

  // Normalizar y formatear datos
  const normalizeEntry = (entry, type = 'post') => {
    const title = entry.title?.$t || 'Sin título';
    const content = entry.content?.$t || '';
    const published = entry.published?.$t || new Date().toISOString();
    const updated = entry.updated?.$t || published;
    
    // Obtener slug desde el enlace canonical o alternate
    let url = '';
    const alternateLink = (entry.link || []).find(l => l.rel === 'alternate');
    if (alternateLink) {
      url = alternateLink.href;
    }

    let slug = '';
    if (url) {
      const match = url.match(/\/([^/]+)\.html/);
      slug = match ? match[1] : url.split('/').filter(Boolean).pop();
    } else {
      slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }

    // Categorías / Etiquetas
    const categories = (entry.category || []).map(c => c.term);

    // Extraer primera imagen si existe
    let featuredImage = '';
    if (entry.media$thumbnail) {
      featuredImage = entry.media$thumbnail.url.replace('/s72-c/', '/s1600/');
    } else {
      const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) {
        featuredImage = imgMatch[1];
      }
    }

    return {
      title,
      slug,
      original_url: url,
      type,
      published_at: published,
      updated_at: updated,
      categories,
      featured_image: featuredImage,
      content_html: content,
    };
  };

  const parsedPosts = posts.map(p => normalizeEntry(p, 'post'));
  const parsedPages = pages.map(p => normalizeEntry(p, 'page'));

  // Guardar en archivos JSON
  fs.writeFileSync(path.join(outputDir, 'raw_posts.json'), JSON.stringify(posts, null, 2));
  fs.writeFileSync(path.join(outputDir, 'raw_pages.json'), JSON.stringify(pages, null, 2));
  fs.writeFileSync(path.join(outputDir, 'posts.json'), JSON.stringify(parsedPosts, null, 2));
  fs.writeFileSync(path.join(outputDir, 'pages.json'), JSON.stringify(parsedPages, null, 2));

  console.log(`\n Extracción completada.`);
  console.log(`- ${parsedPosts.length} posts guardados en temp/blogger_export/posts.json`);
  console.log(`- ${parsedPages.length} páginas guardadas en temp/blogger_export/pages.json`);
}

extractBlogger().catch(console.error);
