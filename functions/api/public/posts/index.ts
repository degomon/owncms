import { getDb, jsonResponse, errorResponse, type Env } from '../../../_lib/db';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'post'; // Default to 'post'
    const category = url.searchParams.get('category');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const db = getDb(env);
    let sql = `SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.type, p.is_featured, p.published_at,
                      c.name as category_name, c.slug as category_slug
               FROM posts p
               LEFT JOIN categories c ON p.category_id = c.id
               WHERE p.status = 'published'`;
    const args: (string | number)[] = [];

    if (type !== 'all') {
      sql += ` AND p.type = ?`;
      args.push(type);
    }

    if (category) {
      sql += ` AND c.slug = ?`;
      args.push(category);
    }

    sql += ` ORDER BY p.is_featured DESC, p.published_at DESC LIMIT ? OFFSET ?`;
    args.push(limit, offset);

    const result = await db.execute({ sql, args });

    return jsonResponse({
      success: true,
      posts: result.rows,
      page,
      limit,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Error fetching public posts', 500);
  }
};
