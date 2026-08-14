import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const r2PublicUrl = process.env.R2_PUBLIC_URL || 'https://devomatik-media.sh0.top';

const client = createClient({ url, authToken });

async function syncImagesToR2() {
  console.log('Iniciando sincronización de imágenes hacia Cloudflare R2...');
  const manifestFile = path.resolve('temp/blogger_export/images/images_manifest.json');
  
  if (!fs.existsSync(manifestFile)) {
    console.error('No se encontró images_manifest.json');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));

  // 1. Actualizar URLs en posts y páginas
  console.log(`Reemplazando URLs de Blogger por URLs de R2 (${r2PublicUrl})...`);
  const postsRes = await client.execute('SELECT id, featured_image, content_html FROM posts');

  for (const row of postsRes.rows) {
    let featured = String(row.featured_image || '');
    let content = String(row.content_html || '');

    for (const [bloggerUrl, info] of Object.entries(manifest)) {
      const newMediaUrl = `${r2PublicUrl.replace(/\/$/, '')}/${info.filename}`;
      
      if (featured.includes(bloggerUrl) || bloggerUrl.includes(featured)) {
        featured = newMediaUrl;
      }
      content = content.replaceAll(bloggerUrl, newMediaUrl);
    }

    await client.execute({
      sql: 'UPDATE posts SET featured_image = ?, content_html = ?, content_markdown = ? WHERE id = ?',
      args: [featured, content, content, row.id]
    });
  }

  console.log('¡Base de datos actualizada con las URLs de tu CDN en R2!');
  console.log(`\nPara subir los archivos locales a Cloudflare R2:`);
  console.log(`- Sube los archivos de temp/blogger_export/images/ a tu bucket "devomatik-media" mediante el Dashboard de Cloudflare R2 o wrangler.`);
}

syncImagesToR2().catch(console.error);
