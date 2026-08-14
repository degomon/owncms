import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const data = await request.json() as {
      name?: string;
      email?: string;
      subject?: string;
      message?: string;
      captcha_token?: string;
    };
    const { name, email, subject = '', message, captcha_token } = data;

    if (!name || !email || !message) {
      return errorResponse('Name, email and message are required', 400);
    }

    // Validación del Puzzle Slider Captcha
    if (!captcha_token) {
      return errorResponse('Please complete the human verification slider puzzle.', 400);
    }

    try {
      const parts = captcha_token.split(':');
      if (parts.length !== 3) {
        return errorResponse('Invalid captcha verification.', 400);
      }
      const [targetStr, actualStr, timeStr] = parts;
      const target = parseInt(targetStr, 10);
      const actual = parseInt(actualStr, 10);
      const timestamp = parseInt(timeStr, 10);

      // 1. Validar expiración (máximo 5 minutos)
      if (Date.now() - timestamp > 5 * 60 * 1000) {
        return errorResponse('Captcha expired. Please solve the puzzle again.', 400);
      }

      // 2. Validar precisión del encaje de la pieza (tolerancia de +-6px)
      if (Math.abs(target - actual) > 6) {
        return errorResponse('Puzzle piece not aligned correctly. Please try again.', 400);
      }
    } catch {
      return errorResponse('Captcha verification failed.', 400);
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
