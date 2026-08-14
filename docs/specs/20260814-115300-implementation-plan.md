# Plan de Implementación — Devomatik CMS

- **Fecha/Hora (GMT-6):** 2026-08-14 11:53:00
- **Objetivo:** Construcción y despliegue del CMS ligero para Devomatik sobre Cloudflare Pages + Functions + Turso + R2 con 3 temas.

---

## Fase 1: Fundaciones y Configuración del Proyecto
- [ ] Inicializar estructura del proyecto (`package.json`, wrangler config, scripts).
- [ ] Configurar TypeScript / JavaScript modular y cliente `@libsql/client` para Turso.
- [ ] Implementar script de inicialización y migración de esquemas SQL en Turso (`db/schema.sql`).
- [ ] Configurar bindings y entorno local con Wrangler (`wrangler pages dev`).

## Fase 2: Backend y API (Cloudflare Pages Functions)
- [ ] Implementar capa de acceso a base de datos (DB Service / DAOs).
- [ ] Implementar autenticación segura basada en Web Crypto API (HMAC SHA-256 JWT / session token).
- [ ] Implementar middleware de autenticación para rutas protegidas `/api/admin/*`.
- [ ] Implementar CRUD de Posts, Categorías, Tags y Settings.
- [ ] Implementar endpoint de subida multimedia para Cloudflare R2 (`/api/admin/upload`).
- [ ] Implementar endpoints públicos (`/api/public/*`) para consulta de contenidos y recepción de formulario de contacto.

## Fase 3: Motor Multitema y Frontend Público
- [ ] Diseñar el renderizador de vistas y sistema de temas desacoplado.
- [ ] Implementar Tema 1: **Corporate** (Diseño para Devomatik: Hero corporativo, servicios, proyectos seleccionados, blog y contacto).
- [ ] Implementar Tema 2: **Magazine** (Grids densos, post destacado, categorías múltiples y layout periodístico).
- [ ] Implementar Tema 3: **Personal Blog** (Perfil del autor, biografía, avatar, tipografía optimizada para lectura).
- [ ] Implementar routing público y URLs amigables (`/:slug`, `/category/:slug`, `/archive`, `/contact`).
- [ ] Implementar tags SEO automáticos (OpenGraph, Twitter Cards, Canonical, Meta Descriptions, Sitemap XML y RSS Feed).

## Fase 4: Panel de Administración (Admin Dashboard)
- [ ] Diseñar UI limpia y funcional para el panel de administración.
- [ ] Vistas de Login y Gestión de Sesión.
- [ ] Editor de contenido con soporte Markdown, preview en vivo y selector de imágenes destacadas.
- [ ] Gestor de categorías, tags y estados (Borrador / Publicado).
- [ ] Selector y previsualizador de temas (Corporate, Magazine, Personal).
- [ ] Bandeja de mensajes de contacto y ajustes generales del sitio.

## Fase 5: Migración de Blogger y Testing
- [ ] Desarrollar script CLI de importación de Blogger (`tools/blogger-import.js`).
- [ ] Testear portabilidad del contenido entre los 3 temas (Corporate -> Magazine -> Personal).
- [ ] Pruebas en entorno de Staging (Cloudflare Pages preview).
- [ ] Verificación de criterios de aceptación y preparación para corte a producción (`devomatik.com`).
