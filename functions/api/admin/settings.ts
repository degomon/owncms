import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';
import { authenticate } from './posts/index';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const db = getDb(env);
    const result = await db.execute({
      sql: 'SELECT key, value FROM settings',
      args: [],
    });

    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[String(row.key)] = String(row.value);
    }

    return jsonResponse({ success: true, settings });
  } catch (err: any) {
    return errorResponse(err.message || 'Error fetching settings', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const settings = await request.json() as Record<string, string>;
    const db = getDb(env);

    for (const [key, value] of Object.entries(settings)) {
      await db.execute({
        sql: `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
              ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        args: [key, value],
      });
    }

    return jsonResponse({ success: true, message: 'Settings updated' });
  } catch (err: any) {
    return errorResponse(err.message || 'Error updating settings', 500);
  }
};
