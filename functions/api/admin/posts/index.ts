import { getDb, jsonResponse, errorResponse, type Env } from '../../../_lib/db';
import { verifyToken, type UserPayload } from '../../../_lib/auth';

export async function authenticate(request: Request, env: Env): Promise<UserPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  return await verifyToken(token, env.JWT_SECRET || 'dev-secret-key-change-in-production-min-32-chars');
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const db = getDb(env);
    const result = await db.execute({
      sql: 'SELECT id, title, slug, excerpt, type, status, is_featured, published_at, created_at, updated_at FROM posts ORDER BY created_at DESC',
      args: [],
    });

    return jsonResponse({
      success: true,
      posts: result.rows,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Error fetching posts', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) {
    return errorResponse('Unauthorized', 401);
  }

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
      published_at = status === 'published' ? new Date().toISOString() : null,
    } = data;

    if (!title || !slug) {
      return errorResponse('Title and slug are required', 400);
    }

    const db = getDb(env);
    const result = await db.execute({
      sql: `INSERT INTO posts (
        title, slug, excerpt, content_markdown, content_html, featured_image,
        type, status, author_id, category_id, is_featured, meta_title, meta_description, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
      args: [
        title, slug, excerpt, content_markdown, content_html, featured_image,
        type, status, user.id, category_id, is_featured ? 1 : 0, meta_title, meta_description, published_at
      ],
    });

    return jsonResponse({
      success: true,
      id: result.rows[0]?.id,
    }, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Error creating post', 500);
  }
};
