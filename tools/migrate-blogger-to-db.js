import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

async function migrate() {
  console.log(`Iniciando migración a base de datos (${url})...`);

  const postsFile = path.resolve('temp/blogger_export/posts.json');
  const pagesFile = path.resolve('temp/blogger_export/pages.json');

  if (!fs.existsSync(postsFile) || !fs.existsSync(pagesFile)) {
    console.error('No se encontraron los archivos extraídos en temp/blogger_export/');
    process.exit(1);
  }

  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
  const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));

  // Asegurar usuario administrador inicial
  await client.execute({
    sql: `INSERT OR IGNORE INTO users (id, username, email, password_hash, display_name, bio)
          VALUES (1, 'admin', 'admin@devomatik.com', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', 'Devomatik Team', 'Software consulting & app development.')`,
    args: []
  });

  const allItems = [...posts, ...pages];

  for (const item of allItems) {
    console.log(`Migrando [${item.type}] ${item.title} (slug: ${item.slug})...`);

    // Procesar o crear categorías si existen
    let categoryId = null;
    if (item.categories && item.categories.length > 0) {
      const catName = item.categories[0];
      const catSlug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      
      await client.execute({
        sql: `INSERT OR IGNORE INTO categories (name, slug) VALUES (?, ?)`,
        args: [catName, catSlug]
      });

      const catRes = await client.execute({
        sql: `SELECT id FROM categories WHERE slug = ? LIMIT 1`,
        args: [catSlug]
      });
      if (catRes.rows.length > 0) {
        categoryId = catRes.rows[0].id;
      }
    }

    // Insertar o actualizar post/página
    const excerpt = item.content_html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200) + '...';

    await client.execute({
      sql: `INSERT INTO posts (
        title, slug, excerpt, content_markdown, content_html,
        featured_image, type, status, author_id, category_id,
        published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'published', 1, ?, ?, ?, ?)
      ON CONFLICT(slug) DO UPDATE SET
        title = excluded.title,
        content_html = excluded.content_html,
        excerpt = excluded.excerpt,
        featured_image = excluded.featured_image,
        category_id = excluded.category_id,
        updated_at = excluded.updated_at`,
      args: [
        item.title,
        item.slug,
        excerpt,
        item.content_html, // Markdown fallback to HTML
        item.content_html,
        item.featured_image || '',
        item.type,
        categoryId,
        item.published_at,
        item.published_at,
        item.updated_at
      ]
    });
  }

  console.log(`\n ¡Migración completada exitosamente! ${allItems.length} registros insertados/actualizados.`);
}

migrate().catch(console.error);
