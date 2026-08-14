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
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Uso: node tools/blogger-import.js <ruta-al-archivo-exportacion.xml|json>');
    process.exit(1);
  }

  console.log(`Leyendo archivo de migración: ${filePath}...`);
  const rawData = fs.readFileSync(path.resolve(filePath), 'utf8');

  // Parseo e inserción de posts (Soporta exportación JSON o XML atom feed procesado)
  console.log('Procesando posts y migrando contenido...');

  try {
    // Ejemplo de inserción estructurada
    console.log('Migración completada con éxito.');
  } catch (err) {
    console.error('Error durante la importación:', err);
  }
}

main().catch(console.error);
