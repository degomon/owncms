# Plan de Despliegue y Puesta en Producción — Devomatik CMS

- **Fecha/Hora (GMT-6):** 2026-08-14 13:18:00
- **Objetivo:** Despliegue de staging en Cloudflare Pages, migración de imágenes R2 y corte final a `devomatik.com`.

---

## Paso 1: Subida de Imágenes a Cloudflare R2
1. Subir las 13 imágenes descargadas en `temp/blogger_export/images/` a tu bucket `devomatik-media` en Cloudflare R2 (vía Cloudflare Dashboard > R2 > Upload).
2. Ejecutar la actualización de enlaces en la base de datos:
   ```bash
   node tools/sync-r2-images.js
   ```

## Paso 2: Control de Versiones con Git
1. Inicializar repositorio git local:
   ```bash
   git init
   git add .
   git commit -m "feat: complete devomatik cms with corporate, magazine and personal themes"
   ```
2. Crear un repositorio privado en GitHub (ej. `devomatik-cms`) y vincularlo:
   ```bash
   git remote add origin git@github.com:tu-usuario/devomatik-cms.git
   git branch -M main
   git push -u origin main
   ```

## Paso 3: Conectar Cloudflare Pages (Staging)
1. En el [Cloudflare Dashboard](https://dash.cloudflare.com/), ir a **Compute (Workers & Pages)** > **Create application** > pestaña **Pages** > **Connect to Git**.
2. Seleccionar el repositorio `devomatik-cms`.
3. Configuración de Build:
   - **Framework preset:** `None`
   - **Build command:** (dejar vacío)
   - **Build output directory:** `public`
4. En **Environment Variables**, añadir:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `JWT_SECRET`
   - `R2_PUBLIC_URL` (`https://devomatik-media.sh0.top`)
5. En **Settings > Functions > R2 bucket bindings**, vincular `R2_BUCKET` a `devomatik-media`.
6. Desplegar y probar en el subdominio temporal (ej. `https://devomatik-cms.pages.dev`).

## Paso 4: Corte a Dominio de Producción (`devomatik.com`)
1. En Cloudflare Pages > **Custom domains** > **Set up a custom domain**.
2. Ingresar `devomatik.com` (y `www.devomatik.com`).
3. Cloudflare gestionará el enrutamiento y certificados SSL automáticamente.
4. Desactivar o redirigir el blog antiguo de Blogger hacia el nuevo CMS.
