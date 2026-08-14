# Registro de Extracción y Migración Blogger — Devomatik CMS

- **Fecha/Hora (GMT-6):** 2026-08-14 12:23:00
- **Fuente:** https://www.devomatik.com (Blogger Feed)
- **Destino Temporal:** `temp/blogger_export/`
- **Estado:** Extracción y Migración a Base de Datos Completadas

---

## 1. Publicaciones Extraídas (Posts)
1. **Nicas.net - our new project (service to nicaraguan community)** (`/nicasnet-our-new-project-service-to`)
2. **Radiomatik.com - new features coming this year** (`/radiomatikcom-new-features-coming-this`)
3. **We have created and app for Feels like Temperature** (`/we-have-created-and-app-for-feels-like`)
4. **Devomatik.com - app development** (`/blog-post`)

## 2. Páginas Estáticas Extraídas (Pages)
1. **Hire our team** (`/hire-our-team`)
2. **Own Projects** (`/own-projects`)
3. **Privacy** (`/privacy`)
4. **About** (`/about`)

## 3. Archivos Generados
- `temp/blogger_export/posts.json` (Publicaciones estructuradas con imágenes y HTML limpio).
- `temp/blogger_export/pages.json` (Páginas estáticas).
- `temp/blogger_export/raw_posts.json` (Payload original de Blogger).
- `temp/blogger_export/raw_pages.json` (Payload original de Blogger).
- `tools/extract-blogger.js` (Script de extracción).
- `tools/migrate-blogger-to-db.js` (Script de inserción en base de datos).
