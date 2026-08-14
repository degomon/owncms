import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

function getCleanHighResImage(url) {
  if (!url) return '';
  // Convertir thumbnails de Blogger a resolución nativa limpia
  return url
    .replace(/\/s72-w\d+-h\d+-c\//, '/s1600/')
    .replace(/\/s72-c\//, '/s1600/')
    .replace(/=s72-w\d+-h\d+-c/, '=w1280')
    .replace(/=w\d+-h\d+/, '=w1280');
}

async function main() {
  console.log('Optimizando imágenes destacadas y limpiando duplicados en Turso...');
  const res = await client.execute('SELECT id, title, featured_image, content_html FROM posts');

  for (const row of res.rows) {
    const originalFeatured = String(row.featured_image || '');
    let highResFeatured = getCleanHighResImage(originalFeatured);

    // Si no tiene featured_image o era baja resolución, buscar la primera del contenido
    if (!highResFeatured) {
      const match = String(row.content_html).match(/src="([^">]+)"/);
      if (match) {
        highResFeatured = getCleanHighResImage(match[1]);
      }
    }

    await client.execute({
      sql: 'UPDATE posts SET featured_image = ? WHERE id = ?',
      args: [highResFeatured, row.id]
    });

    console.log(`Post ID ${row.id} ("${row.title}") actualizado a HD.`);
  }

  console.log('¡Imágenes destacadas actualizadas a alta resolución!');
}

main().catch(console.error);
