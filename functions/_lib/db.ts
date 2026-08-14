import { createClient, type Client } from '@libsql/client/web';

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
  R2_BUCKET?: R2Bucket;
  R2_PUBLIC_URL?: string;
}

export function getDb(env: Env): Client {
  const url = env.TURSO_DATABASE_URL || 'file:local.db';
  const authToken = env.TURSO_AUTH_TOKEN || '';
  
  return createClient({
    url,
    authToken,
  });
}

export function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...headers,
    },
  });
}

export function errorResponse(message: string, status = 400): Response {
  return jsonResponse({ success: false, error: message }, status);
}
