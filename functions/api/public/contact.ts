import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data = await request.json() as { name?: string; email?: string; subject?: string; message?: string };
    const { name, email, subject = '', message } = data;

    if (!name || !email || !message) {
      return errorResponse('Name, email and message are required', 400);
    }

    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || '';
    const db = getDb(env);

    await db.execute({
      sql: 'INSERT INTO contact_messages (name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?)',
      args: [name, email, subject, message, ip],
    });

    return jsonResponse({ success: true, message: 'Message sent successfully' });
  } catch (err: any) {
    return errorResponse(err.message || 'Error saving contact message', 500);
  }
};
