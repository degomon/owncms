import { getDb, jsonResponse, errorResponse, type Env } from '../../../_lib/db';
import { authenticate } from './index';

export const onRequestGet: PagesFunction<Env, 'id'> = async ({ request, params, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const db = getDb(env);
    const result = await db.execute({
      sql: 'SELECT * FROM posts WHERE id = ? LIMIT 1',
      args: [params.id as string],
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

export const onRequestPut: PagesFunction<Env, 'id'> = async ({ request, params, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json() as any;
    const {
      title,
      slug,
      excerpt = '',
      content_markdown = '',
      content_html = '',
      featured_image = '',
      type = 'post',
      status = 'draft',
      category_id = null,
      is_featured = 0,
      meta_title = '',
      meta_description = '',
      published_at = null,
    } = data;

    const db = getDb(env);
    await db.execute({
      sql: `UPDATE posts SET
        title = ?, slug = ?, excerpt = ?, content_markdown = ?, content_html = ?,
        featured_image = ?, type = ?, status = ?, category_id = ?, is_featured = ?,
        meta_title = ?, meta_description = ?, published_at = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      args: [
        title, slug, excerpt, content_markdown, content_html, featured_image,
        type, status, category_id, is_featured ? 1 : 0, meta_title, meta_description,
        published_at, params.id as string
      ],
    });

    return jsonResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message || 'Error updating post', 500);
  }
};

export const onRequestDelete: PagesFunction<Env, 'id'> = async ({ request, params, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const db = getDb(env);
    await db.execute({
      sql: 'DELETE FROM posts WHERE id = ?',
      args: [params.id as string],
    });

    return jsonResponse({ success: true });
  } catch (err: any) {
    return errorResponse(err.message || 'Error deleting post', 500);
  }
};
