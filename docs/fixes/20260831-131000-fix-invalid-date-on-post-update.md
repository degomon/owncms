# Corrección de Error "Invalid Date" al Guardar/Actualizar Post

**Fecha:** 2026-08-31 13:10:00 (GMT-6)  
**Archivos modificados:**
- `functions/api/admin/posts/[id].ts`
- `functions/api/public/posts/index.ts`
- `functions/[[path]].ts`
- `public/app.js`
- `public/admin/index.html`

---

## 1. Resumen de Cambios

1. **Preservación inteligente de `published_at` en la actualización de entradas (`functions/api/admin/posts/[id].ts`):**
   - Se consulta el registro existente antes de actualizar.
   - Si no se suministra un nuevo `published_at` y el estado es `'published'`, se preserva el `published_at` existente o se asigna la marca de tiempo actual si el post era previamente un borrador.
   - Se evita que `published_at` se sobreescriba con `NULL` inadvertidamente.

2. **Inclusión de `created_at` y `updated_at` en la API pública de posts (`functions/api/public/posts/index.ts`):**
   - Se añadieron `p.created_at` y `p.updated_at` a la lista de columnas seleccionadas.
   - Se ordenó por `COALESCE(p.published_at, p.created_at) DESC` para garantizar consistencia.

3. **Función de formateo de fechas seguro y compatible entre navegadores (`formatDisplayDate`):**
   - Se implementó en `functions/[[path]].ts`, `public/app.js` y `public/admin/index.html`.
   - Normaliza cadenas de fecha SQLite (`"YYYY-MM-DD HH:MM:SS"`) convirtiéndolas a ISO (`"YYYY-MM-DDTHH:MM:SSZ"`), resolviendo la incompatibilidad con Safari/WebKit.
   - Cuenta con respaldo seguro en caso de valores nulos o indefinidos, previniendo la aparición de `"Invalid Date"`.

4. **Compatibilidad con Sitemap XML:**
   - La funcionalidad de `functions/sitemap.xml.ts` se mantiene 100% intacta y conforme con la especificación W3C Datetime (`YYYY-MM-DD`).
