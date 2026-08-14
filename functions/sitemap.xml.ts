import { getDb, type Env } from './_lib/db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;

  try {
    const db = getDb(env);
    const result = await db.execute(`
      SELECT slug, type, updated_at, published_at
      FROM posts
      WHERE status = 'published'
      ORDER BY updated_at DESC
    `);

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;

    for (const row of result.rows) {
      const prefix = row.type === 'page' ? 'page' : 'post';
      const loc = `${baseUrl}/${prefix}/${row.slug}`;
      const lastmod = (row.updated_at || row.published_at || new Date().toISOString()).split('T')[0];
      const priority = row.type === 'page' ? '0.8' : '0.7';

      xml += `
  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <priority>${priority}</priority>
  </url>`;
    }

    xml += `\n</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: any) {
    return new Response('Error generating sitemap', { status: 500 });
  }
};
