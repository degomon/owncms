import { getDb, jsonResponse, errorResponse, type Env } from '../../../_lib/db';

export const onRequestGet: PagesFunction<Env, 'slug'> = async ({ params, env }) => {
  try {
    const db = getDb(env);
    const result = await db.execute({
      sql: `SELECT p.*, c.name as category_name, c.slug as category_slug, u.display_name as author_name, u.avatar_url as author_avatar
            FROM posts p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.author_id = u.id
            WHERE p.slug = ? AND p.status = 'published'
            LIMIT 1`,
      args: [params.slug as string],
    });

    if (result.rows.length === 0) {
      return errorResponse('Post not found', 404);
    }

    return jsonResponse({
      success: true,
      post: result.rows[0],
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Error fetching post', 500);
  }
};
