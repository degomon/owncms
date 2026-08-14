import fs from 'fs';
import path from 'path';

async function downloadImage(url, destPath) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
}

async function backupImages() {
  console.log('Iniciando descarga y respaldo de imágenes de Blogger...');
  const postsFile = path.resolve('temp/blogger_export/posts.json');
  const pagesFile = path.resolve('temp/blogger_export/pages.json');
  const imagesDir = path.resolve('temp/blogger_export/images');

  if (!fs.existsSync(postsFile) || !fs.existsSync(pagesFile)) {
    console.error('Archivos JSON no encontrados.');
    process.exit(1);
  }

  const posts = JSON.parse(fs.readFileSync(postsFile, 'utf8'));
  const pages = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));
  const allItems = [...posts, ...pages];

  const imageUrls = new Set();

  for (const item of allItems) {
    if (item.featured_image) {
      imageUrls.add(item.featured_image);
    }
    const matches = item.content_html.matchAll(/src="([^">]+)"/g);
    for (const match of matches) {
      const src = match[1];
      if (src.startsWith('http')) {
        imageUrls.add(src);
      }
    }
  }

  console.log(`Se encontraron ${imageUrls.size} imágenes únicas.`);
  const mapping = {};
  let count = 1;

  for (const url of imageUrls) {
    let filename = `img_${count.toString().padStart(3, '0')}`;
    try {
      const urlObj = new URL(url);
      const ext = path.extname(urlObj.pathname) || '.jpg';
      filename += ext.split('?')[0];
    } catch {
      filename += '.jpg';
    }

    const destPath = path.join(imagesDir, filename);
    try {
      console.log(`[${count}/${imageUrls.size}] Descargando: ${url} -> ${filename}`);
      await downloadImage(url, destPath);
      mapping[url] = { local_file: `temp/blogger_export/images/${filename}`, filename };
    } catch (e) {
      console.error(`Error descargando ${url}:`, e.message);
    }
    count++;
  }

  fs.writeFileSync(
    path.join(imagesDir, 'images_manifest.json'),
    JSON.stringify(mapping, null, 2)
  );

  console.log(`\n ¡Respaldo completado! Todas las imágenes guardadas en temp/blogger_export/images/`);
  console.log(`Manifiesto de mapeo generado en temp/blogger_export/images/images_manifest.json`);
}

backupImages().catch(console.error);
