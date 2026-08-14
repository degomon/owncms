// Cliente HTTP nativo y ligero para Turso (libSQL HTTP API) optimizado para Cloudflare Workers y Pages Functions sin dependencias externas

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  JWT_SECRET: string;
  R2_BUCKET?: R2Bucket;
  R2_PUBLIC_URL?: string;
}

export interface QueryStatement {
  sql: string;
  args?: (string | number | boolean | null)[];
}

export interface QueryResult {
  rows: Record<string, any>[];
  rowsAffected?: number;
}

export class TursoClient {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    let httpUrl = url;
    if (httpUrl.startsWith('libsql://')) {
      httpUrl = httpUrl.replace('libsql://', 'https://');
    }
    this.url = httpUrl.replace(/\/$/, '');
    this.token = token;
  }

  async execute(stmtOrSql: string | QueryStatement): Promise<QueryResult> {
    const stmt: QueryStatement = typeof stmtOrSql === 'string' ? { sql: stmtOrSql, args: [] } : stmtOrSql;
    const sql = stmt.sql;
    const args = (stmt.args || []).map((arg) => {
      if (arg === null || arg === undefined) return { type: 'null' };
      if (typeof arg === 'number') return { type: 'integer', value: String(arg) };
      if (typeof arg === 'boolean') return { type: 'integer', value: arg ? '1' : '0' };
      return { type: 'text', value: String(arg) };
    });

    const pipelinePayload = {
      requests: [
        {
          type: 'execute',
          stmt: {
            sql,
            args,
          },
        },
        { type: 'close' },
      ],
    };

    const endpoint = `${this.url}/v2/pipeline`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pipelinePayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Turso HTTP Error (${res.status}): ${errText}`);
    }

    const data = await res.json() as any;
    const resultItem = data.results?.[0]?.response?.result;

    if (!resultItem) {
      return { rows: [] };
    }

    const cols = (resultItem.cols || []).map((c: any) => c.name);
    const rows = (resultItem.rows || []).map((r: any[]) => {
      const rowObj: Record<string, any> = {};
      r.forEach((cell: any, idx: number) => {
        const colName = cols[idx];
        rowObj[colName] = cell.value !== undefined ? cell.value : null;
      });
      return rowObj;
    });

    return {
      rows,
      rowsAffected: resultItem.affected_row_count || 0,
    };
  }
}

export function getDb(env: Env): TursoClient {
  return new TursoClient(env.TURSO_DATABASE_URL || '', env.TURSO_AUTH_TOKEN || '');
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
