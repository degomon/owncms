# Especificación Técnica — CMS de Blog Devomatik (OwnCMS)

- **Fecha/Hora (GMT-6):** 2026-08-14 11:53:00
- **Versión:** 1.0.0
- **Estado:** Aprobado para Implementación

---

## 1. Resumen Ejecutivo y Arquitectura Objetivo

Devomatik CMS (OwnCMS) es un CMS de blog ultraligero y desacoplado, diseñado para costo operativo cercano a cero, alto rendimiento y fácil mantenimiento.

### Stack Tecnológico
* **Frontend & Hosting:** Cloudflare Pages (HTML semántico, JS modular, CSS Vanilla moderno por tema).
* **Backend & API:** Cloudflare Pages Functions / Workers runtime.
* **Base de Datos:** Turso (libSQL) sobre `@libsql/client`.
* **Almacenamiento Multimedia:** Cloudflare R2 (vía API S3 compatible o binding directo de Workers).
* **Autenticación:** JWT/Session cookies firmadas seguras (HMAC-SHA256 / Web Crypto API) para el panel de administración.
* **Control de versiones y despliegue:** Git / GitHub sincronizado con Cloudflare Pages.

---

## 2. Modelo de Datos (Esquema SQL Turso / libSQL)

```sql
-- Configuración global del sitio y tema activo
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Usuarios administradores
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categorías
CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tags / Etiquetas
CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Publicaciones (Posts) y Páginas Estáticas
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    excerpt TEXT,
    content_markdown TEXT NOT NULL,
    content_html TEXT NOT NULL,
    featured_image TEXT,
    type TEXT DEFAULT 'post' CHECK(type IN ('post', 'page')),
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'archived')),
    author_id INTEGER REFERENCES users(id),
    category_id INTEGER REFERENCES categories(id),
    is_featured INTEGER DEFAULT 0,
    meta_title TEXT,
    meta_description TEXT,
    published_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Relación Many-to-Many Posts <-> Tags
CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

-- Mensajes del formulario de contacto
CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    ip_address TEXT,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Endpoints de la API Backend (`/api/*`)

### Autenticación y Administración
* `POST /api/auth/login` — Autenticación con usuario/contraseña, emisión de sesión cookie HttpOnly.
* `POST /api/auth/logout` — Revocación de sesión.
* `GET /api/auth/me` — Validación de sesión actual.

### Gestión de Contenidos (Admin)
* `GET /api/admin/posts` — Lista de posts (borradores y publicados).
* `POST /api/admin/posts` — Crear post o página.
* `GET /api/admin/posts/:id` — Detalle para edición.
* `PUT /api/admin/posts/:id` — Actualizar post.
* `DELETE /api/admin/posts/:id` — Eliminar post.
* `POST /api/admin/upload` — Subida de imágenes a R2 con generación de URL pública.
* `GET|PUT /api/admin/settings` — Obtener y actualizar opciones del sitio (tema activo, título, logo, colores, etc.).
* `GET /api/admin/messages` — Mensajes de contacto recibidos.

### Endpoints Públicos / Rendering
* `GET /api/public/posts` — Lista de posts publicados (con paginación, filtro por tag/categoría).
* `GET /api/public/posts/:slug` — Post individual por slug.
* `GET /api/public/categories` — Listado de categorías activas.
* `POST /api/public/contact` — Envío de mensaje de contacto.
* `GET /api/public/settings` — Configuración pública (tema, metadata, redes sociales).

---

## 4. Arquitectura Multitema

Los temas residen desacoplados en el frontend:
* `corporate/` (Enfocado en servicios, identidad corporativa, hero banner y artículos recientes — **Default de Devomatik**).
* `magazine/` (Enfocado en cards, grids, categorías y bloques destacados).
* `personal/` (Enfocado en perfil del autor, avatar, bio y flujo de lectura minimalista).

Cada tema comparte la estructura estándar:
1. `header` & `navigation`
2. `home` (Portada temática específica)
3. `post` (Detalle de artículo)
4. `page` (Página estática corporativa/personal)
5. `archive` / `category` (Listado y filtrado)
6. `contact` (Formulario)
7. `footer`

El tema activo es determinado por `settings.theme` y aplicado dinámicamente.

---

## 5. Estrategia de Migración Blogger
1. Herramienta CLI de importación (`tools/blogger-import.js`).
2. Parser de exportaciones Blogger (XML Atom feed).
3. Transformación de contenido a Markdown + HTML limpio.
4. Mapeo de slugs y categorías originales.
5. Inserción en lote en Turso.
