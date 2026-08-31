# Análisis de Causa Raíz: "Invalid Date" al actualizar una entrada

**Fecha:** 2026-08-31 13:10:00 (GMT-6)  
**Autor:** Antigravity  
**Archivos involucrados:** `functions/api/admin/posts/[id].ts`, `functions/api/public/posts/index.ts`, `functions/[[path]].ts`, `public/app.js`, `public/admin/index.html`

---

## 1. Causa Raíz Identificada

El error de `"Invalid Date"` que se producía al actualizar una entrada se originó por la combinación de tres factores:

### A. Pérdida del valor `published_at` en el endpoint PUT de actualización
En [`functions/api/admin/posts/[id].ts`](functions/api/admin/posts/[id].ts), al procesar `onRequestPut`:
- El formulario de edición del panel de administración (`public/admin/index.html`) enviaba únicamente los campos editables (`title`, `slug`, `excerpt`, `featured_image`, `content`, `status`, `type`), sin incluir `published_at`.
- En el backend, `published_at` se desestructuraba con valor por defecto `null`:
  ```typescript
  const { ..., published_at = null } = data;
  ```
- La consulta SQL `UPDATE posts SET ..., published_at = ?` sobrescribía el valor de `published_at` en la base de datos con `NULL`.
- Esto causaba que cualquier artículo publicado perdiera su fecha original de publicación al ser editado.

### B. Ausencia de `created_at` en el SELECT de la API pública
En [`functions/api/public/posts/index.ts`](functions/api/public/posts/index.ts), la consulta `SELECT` solo seleccionaba:
```sql
SELECT p.id, p.title, p.slug, p.excerpt, p.featured_image, p.type, p.is_featured, p.published_at, c.name as category_name...
```
Al quedar `published_at` en `NULL` tras la actualización y no existir la columna `created_at` en la respuesta, la expresión en frontend `new Date(p.published_at || p.created_at)` evaluaba a `new Date(undefined)`, lo cual devuelve estrictamente `Invalid Date`.

### C. Incompatibilidad de formato SQLite con WebKit / Safari
En SQLite / libSQL, `CURRENT_TIMESTAMP` genera fechas en formato `"YYYY-MM-DD HH:MM:SS"` (con espacio). En navegadores basados en WebKit (Safari en iOS / macOS) o entornos estrictos, `new Date("YYYY-MM-DD HH:MM:SS")` falla y devuelve `Invalid Date` a menos que se normalice a formato ISO 8601 (`"YYYY-MM-DDTHH:MM:SSZ"`).

---

## 2. Compatibilidad con Sitemap XML

La corrección preserva y complementa al 100% la solución de [`functions/sitemap.xml.ts`](functions/sitemap.xml.ts):
- Al actualizar un post, `updated_at` se actualiza con `CURRENT_TIMESTAMP` y `published_at` se preserva.
- La función `formatLastmod(row.updated_at || row.published_at)` del sitemap continúa extrayendo el formato `YYYY-MM-DD` exigido por W3C Datetime / Google Search Console sin ninguna alteración ni conflicto.
