import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken,
});

async function main() {
  console.log(`Inicializando esquema en ${url}...`);
  const schemaPath = path.resolve(process.cwd(), 'db/schema.sql');
  const sqlContent = fs.readFileSync(schemaPath, 'utf8');

  const statements = sqlContent
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (err) {
      console.error(`Error ejecutando sentencia: ${statement.slice(0, 40)}...`, err.message);
    }
  }

  console.log('¡Base de datos y esquemas inicializados correctamente!');
}

main().catch((err) => {
  console.error('Error inicializando base de datos:', err);
  process.exit(1);
});
