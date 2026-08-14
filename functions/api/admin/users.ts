import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';
import { hashPassword } from '../../_lib/auth';
import { authenticate } from './posts/index';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const db = getDb(env);
    const result = await db.execute('SELECT id, username, email, display_name, bio, avatar_url, created_at FROM users');
    return jsonResponse({ success: true, users: result.rows });
  } catch (err: any) {
    return errorResponse(err.message || 'Error fetching users', 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const currentUser = await authenticate(request, env);
  if (!currentUser) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json() as any;
    const { username, email, password, display_name = null, bio = null, avatar_url = null } = data;

    if (!username || !email || !password) {
      return errorResponse('Username, email and password are required', 400);
    }

    const passwordHash = await hashPassword(password);
    const db = getDb(env);

    await db.execute({
      sql: `INSERT INTO users (username, email, password_hash, display_name, bio, avatar_url)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [username, email, passwordHash, display_name, bio, avatar_url],
    });

    return jsonResponse({ success: true, message: 'User created successfully' }, 201);
  } catch (err: any) {
    return errorResponse(err.message || 'Error creating user', 500);
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ request, env }) => {
  const currentUser = await authenticate(request, env);
  if (!currentUser) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json() as any;
    const {
      id = null,
      username = null,
      email = null,
      password = null,
      display_name = null,
      bio = null,
      avatar_url = null
    } = data;
    const targetId = id !== null && id !== undefined ? Number(id) : Number(currentUser.id);

    const db = getDb(env);

    if (password && typeof password === 'string' && password.trim() !== '') {
      const passwordHash = await hashPassword(password);
      await db.execute({
        sql: `UPDATE users SET
                username = COALESCE(?, username),
                email = COALESCE(?, email),
                password_hash = ?,
                display_name = COALESCE(?, display_name),
                bio = COALESCE(?, bio),
                avatar_url = COALESCE(?, avatar_url)
              WHERE id = ?`,
        args: [
          username !== undefined ? username : null,
          email !== undefined ? email : null,
          passwordHash,
          display_name !== undefined ? display_name : null,
          bio !== undefined ? bio : null,
          avatar_url !== undefined ? avatar_url : null,
          targetId
        ],
      });
    } else {
      await db.execute({
        sql: `UPDATE users SET
                username = COALESCE(?, username),
                email = COALESCE(?, email),
                display_name = COALESCE(?, display_name),
                bio = COALESCE(?, bio),
                avatar_url = COALESCE(?, avatar_url)
              WHERE id = ?`,
        args: [
          username !== undefined ? username : null,
          email !== undefined ? email : null,
          display_name !== undefined ? display_name : null,
          bio !== undefined ? bio : null,
          avatar_url !== undefined ? avatar_url : null,
          targetId
        ],
      });
    }

    return jsonResponse({ success: true, message: 'Profile updated successfully' });
  } catch (err: any) {
    return errorResponse(err.message || 'Error updating user', 500);
  }
};
