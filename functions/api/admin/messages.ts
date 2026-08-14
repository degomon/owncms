import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';
import { authenticate } from './posts/index';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const db = getDb(env);
    const result = await db.execute(`
      SELECT id, name, email, subject, message, ip_address, is_read, created_at
      FROM contact_messages
      ORDER BY created_at DESC
    `);

    return jsonResponse({ success: true, messages: result.rows });
  } catch (err: any) {
    return errorResponse(err.message || 'Error fetching messages', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const { id, is_read } = await request.json() as { id?: number; is_read?: number };
    if (!id) return errorResponse('Message ID is required', 400);

    const db = getDb(env);
    await db.execute({
      sql: 'UPDATE contact_messages SET is_read = ? WHERE id = ?',
      args: [is_read ? 1 : 0, id],
    });

    return jsonResponse({ success: true, message: 'Message updated' });
  } catch (err: any) {
    return errorResponse(err.message || 'Error updating message', 500);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return errorResponse('Message ID is required', 400);

    const db = getDb(env);
    await db.execute({
      sql: 'DELETE FROM contact_messages WHERE id = ?',
      args: [Number(id)],
    });

    return jsonResponse({ success: true, message: 'Message deleted' });
  } catch (err: any) {
    return errorResponse(err.message || 'Error deleting message', 500);
  }
};
