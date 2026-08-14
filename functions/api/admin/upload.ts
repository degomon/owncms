import { getDb, jsonResponse, errorResponse, type Env } from '../../_lib/db';
import { authenticate } from './posts/index';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const user = await authenticate(request, env);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return errorResponse('No file uploaded', 400);
    }

    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    let publicUrl = '';

    // Si Cloudflare R2 Binding está disponible
    if (env.R2_BUCKET) {
      await env.R2_BUCKET.put(filename, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
      });
      const baseUrl = env.R2_PUBLIC_URL || 'https://media.devomatik.com';
      publicUrl = `${baseUrl.replace(/\/$/, '')}/${filename}`;
    } else {
      // Fallback a Base64 Data URL para entornos de prueba / dev local
      const buffer = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
      publicUrl = `data:${file.type};base64,${base64}`;
    }

    return jsonResponse({
      success: true,
      url: publicUrl,
      filename,
    });
  } catch (err: any) {
    return errorResponse(err.message || 'Error uploading file', 500);
  }
};
