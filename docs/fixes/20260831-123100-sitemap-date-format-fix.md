# Corrección de Formato de Fechas en Sitemap XML

**Fecha:** 2026-08-31 12:31:00 (GMT-6)  
**Archivo modificado:** `functions/sitemap.xml.ts`

---

## Descripción del Problema
Google Search Console reportaba errores de validación de fecha en `/sitemap.xml` debido a que las fechas generadas por `CURRENT_TIMESTAMP` en SQLite se guardan como `"YYYY-MM-DD HH:MM:SS"`. Al usar `.split('T')[0]`, el separador de espacio no se eliminaba, resultando en etiquetas XML no estándar como `<lastmod>2026-08-31 18:29:40</lastmod>`.

## Cambios Realizados
1. Se añadió la función utilitaria `formatLastmod(dateVal: any): string` en [`functions/sitemap.xml.ts`](functions/sitemap.xml.ts).
2. La función divide tanto por espacio como por `'T'` (`str.split(/[\sT]/)[0]`), asegurando que siempre devuelva el formato estándar `YYYY-MM-DD` exigido por W3C Datetime / ISO 8601.
3. Se incluye validación por regex (`/^\d{4}-\d{2}-\d{2}$/`) y respaldo a `new Date()` / fecha actual en caso de valores nulos o inválidos.

## Verificación
Se probó con:
- Formato SQLite (`"2026-08-31 18:29:40"`) -> `"2026-08-31"`
- Formato ISO con timezone (`"2026-01-16T01:44:03.071-08:00"`) -> `"2026-01-16"`
- Formato ISO UTC (`"2026-08-31T18:29:40.123Z"`) -> `"2026-08-31"`
- Formato solo fecha (`"2026-08-31"`) -> `"2026-08-31"`
- Valores nulos/indefinidos -> fecha actual (`YYYY-MM-DD`)
