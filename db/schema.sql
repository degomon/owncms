-- Esquema de Base de Datos para Devomatik CMS (Turso / libSQL)

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS post_tags (
    post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

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

-- Inserción inicial de configuración por defecto
INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'corporate');
INSERT OR IGNORE INTO settings (key, value) VALUES ('site_title', 'Devomatik');
INSERT OR IGNORE INTO settings (key, value) VALUES ('site_tagline', 'Soluciones y Desarrollo de Software');
INSERT OR IGNORE INTO settings (key, value) VALUES ('site_description', 'Blog y sitio oficial de Devomatik.');
INSERT OR IGNORE INTO settings (key, value) VALUES ('contact_email', 'contacto@devomatik.com');
