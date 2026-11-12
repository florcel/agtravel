// Ruta /p/:id  →  devuelve la propuesta armada (vercel.json redirige acá)
import { getPropuesta } from '../lib/data.js';
import { renderPropuesta, render404 } from '../lib/render.js';
import { config } from '../config.js';

export default async function handler(req, res) {
  const id = String(req.query?.id || '').trim();
  try {
    const p = await getPropuesta(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    if (!p) { res.statusCode = 404; return res.end(render404()); }
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const baseUrl = config.baseUrl || `${proto}://${req.headers.host}`;
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    res.end(renderPropuesta(p, { baseUrl }));
  } catch (e) {
    console.error(e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.end('Error al cargar la propuesta: ' + e.message);
  }
}
