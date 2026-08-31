# Corrección de Error "Invalid Date" y Ordenamiento al Guardar/Actualizar Post

**Fecha:** 2026-08-31 13:14:00 (GMT-6)  
**Archivos modificados:**
- `functions/api/admin/posts/[id].ts`
- `functions/api/public/posts/index.ts`
- `functions/[[path]].ts`
- `public/app.js`
- `public/admin/index.html`

---

## 1. Resumen de Causa y Cambios

1. **Pérdida de `published_at` en Base de Datos:**
   Al actualizar cualquier post previamente, el endpoint `PUT` establecía `published_at = null`, lo que:
   - Provocaba que `ORDER BY p.published_at DESC` enviara el post al final de la lista (último lugar).
   - Generaba `Invalid Date` en el frontend al intentar instanciar `new Date(undefined)`.

2. **Preservación inteligente en Backend (`functions/api/admin/posts/[id].ts`):**
   - Se consulta el registro existente antes de actualizar para preservar el valor de `published_at` cuando el post ya estaba publicado.

3. **Inclusión de columnas de respaldo (`functions/api/public/posts/index.ts`):**
   - Se añadieron `p.created_at` y `p.updated_at` y se ordenó por `COALESCE(p.published_at, p.created_at) DESC`.

4. **Formateo cross-browser seguro (`formatDisplayDate`):**
   - Convierte formatos SQLite (`YYYY-MM-DD HH:MM:SS`) a ISO para compatibilidad total con Safari/WebKit.

5. **Reparación de datos históricos y Despliegue:**
   - Se ejecutó la reparación en la base de datos Turso (`UPDATE posts SET published_at = created_at WHERE published_at IS NULL AND status = 'published'`), restaurando la fecha correcta para los posts afectados (incluyendo `nicagames-juegos-nicas`).
   - Se realizó `git push` a `origin main`, activando el despliegue en Cloudflare Pages para `https://www.devomatik.com`.

6. **Compatibilidad con Sitemap XML:**
   - La funcionalidad en `functions/sitemap.xml.ts` se mantiene 100% intacta, generando `<lastmod>2026-08-31</lastmod>` conforme a W3C Datetime.
