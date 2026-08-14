import 'dotenv/config';
import { createClient } from '@libsql/client';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function main() {
  console.log('Actualizando tipos de publicación en Turso...');
  await client.execute("UPDATE posts SET type = 'page' WHERE slug IN ('hire-our-team', 'own-projects', 'privacy', 'about')");
  await client.execute("UPDATE posts SET type = 'post' WHERE slug NOT IN ('hire-our-team', 'own-projects', 'privacy', 'about')");
  console.log('¡Actualización completada con éxito!');
}

main().catch(console.error);
