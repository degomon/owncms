import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const db = getDb(env);
    const result = await db.execute({
      sql: `SELECT key, value FROM settings WHERE key IN (
        'theme', 'site_title', 'site_tagline', 'site_description',
        'contact_email', 'logo_url', 'favicon_url', 'analytics_code', 'show_cms_love'
      )`,
      args: [],
    });

    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[String(row.key)] = String(row.value);
    }

    return jsonResponse({ success: true, settings });
  } catch (err: any) {
    return errorResponse(err.message || 'Error fetching public settings', 500);
  }
};
