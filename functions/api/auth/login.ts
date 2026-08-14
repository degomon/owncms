import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';
import { hashPassword, createToken, verifyToken } from '../../_lib/auth';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const { username, password } = await request.json() as { username?: string; password?: string };

    if (!username || !password) {
      return errorResponse('Username and password are required', 400);
    }

    const db = getDb(env);
    const result = await db.execute({
      sql: 'SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1',
      args: [username, username],
    });

    if (result.rows.length === 0) {
      return errorResponse('Invalid credentials', 401);
    }

    const user = result.rows[0];
    const passwordHash = await hashPassword(password);

    if (user.password_hash !== passwordHash) {
      return errorResponse('Invalid credentials', 401);
    }

    const token = await createToken(
      {
        id: Number(user.id),
        username: String(user.username),
        email: String(user.email),
      },
      env.JWT_SECRET || 'dev-secret-key-change-in-production-min-32-chars'
    );

    return jsonResponse({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Internal server error', 500);
  }
};
