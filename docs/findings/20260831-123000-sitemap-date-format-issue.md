# Análisis de Error de Fechas en Sitemap XML (`/sitemap.xml`)

**Fecha:** 2026-08-31 12:30:00 (GMT-6)  
**Autor:** Antigravity  
**Archivo afectado:** `functions/sitemap.xml.ts`

---

## 1. Causa Raíz Identificada

En el archivo [`functions/sitemap.xml.ts`](functions/sitemap.xml.ts), la fecha `<lastmod>` se extrae de la siguiente manera:

```typescript
const lastmod = (row.updated_at || row.published_at || new Date().toISOString()).split('T')[0];
```

### Problema:
1. **Formato SQL DateTime vs ISO 8601:**
   En SQLite / libSQL / Turso, cuando un registro se crea o actualiza mediante consultas SQL que utilizan `CURRENT_TIMESTAMP` (como en `functions/api/admin/posts/[id].ts` o el valor por defecto de la tabla), el valor guardado en `updated_at` tiene el formato estándar de SQL:
   `"YYYY-MM-DD HH:MM:SS"` (por ejemplo: `"2026-08-31 18:29:40"` con un espacio separando la fecha y la hora).

2. **Fallo en `.split('T')[0]`:**
   Al no existir el separador `'T'`, el método `.split('T')[0]` no divide la cadena y devuelve el texto completo con el espacio y la hora: `"2026-08-31 18:29:40"`.

3. **Rechazo en Google Search Console:**
   El estándar de Sitemaps XML (sitemaps.org) y la especificación W3C Datetime (ISO 8601) exigen que `<lastmod>` tenga uno de los siguientes formatos:
   - Solo fecha: `YYYY-MM-DD`
   - Fecha y hora completa: `YYYY-MM-DDThh:mm:ss+00:00` o `YYYY-MM-DDThh:mm:ssZ`

   Al recibir un valor con espacio como `<lastmod>2026-08-31 18:29:40</lastmod>`, Google Search Console lo marca inmediatamente con error de **"Fecha no válida"** / **"Invalid date format"**.

---

## 2. Solución Propuesta

Normalizar cualquier formato de fecha convirtiéndolo de forma segura mediante `new Date(...)` o dividiendo por espacio/`T` y generando el formato `YYYY-MM-DD` válido para W3C Datetime:

```typescript
function formatLastmod(dateVal: any): string {
  if (!dateVal) return new Date().toISOString().split('T')[0];
  try {
    const str = String(dateVal).trim();
    // Manejar formato SQLite "YYYY-MM-DD HH:MM:SS"
    const d = new Date(str.includes(' ') && !str.includes('T') ? str.replace(' ', 'T') + 'Z' : str);
    if (isNaN(d.getTime())) {
      return str.split(/[\sT]/)[0];
    }
    return d.toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}
```
