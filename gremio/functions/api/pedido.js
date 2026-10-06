// POST /api/pedido — recibe el carrito de un cliente logueado y lo manda al cotizador (Apps Script).
// Los datos del cliente (nombre, CUIT, WhatsApp) salen de la sesión, nunca del body.
// Responde enseguida; el llamado al cotizador se hace en segundo plano (waitUntil) y nunca bloquea al cliente.
import { json, currentUser } from '../_lib.js';
import { getCatalogo } from './catalogo.js';

export async function onRequestPost({ request, env, waitUntil }) {
  const u = await currentUser(request, env);
  if (!u) return json({ error: 'auth' }, 401);

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items)
    ? body.items.filter((i) => i && typeof i.cod === 'string' && i.cod && Number.isFinite(i.qty) && i.qty > 0).map((i) => ({ cod: i.cod, qty: Math.floor(i.qty) }))
    : [];
  if (!items.length) return json({ ok: false, error: 'Carrito vacío.' }, 400);

  let minimo = 0;
  try {
    const cat = await getCatalogo(env);
    minimo = cat.minimo || 0;
    const byCod = {}; cat.items.forEach((p) => { byCod[p.c] = p; });
    let subtotal = 0, all = true;
    items.forEach((i) => { const p = byCod[i.cod]; if (p && p.p != null) subtotal += p.p * i.qty; else all = false; });
    if (all && minimo && subtotal < minimo) return json({ ok: false, error: 'No llega a la compra mínima.' }, 400);
  } catch (e) {
    console.log('[pedido] catalogo', String(e)); // si falla la lectura del catálogo, no bloqueamos el pedido
  }

  const pedido = { cuit: u.cuit, nombre: u.nombre, contacto: u.empresa || '', whatsapp: u.whatsapp, items };
  if (env.COTIZADOR_URL && env.COTIZADOR_SECRET) {
    waitUntil(
      fetch(env.COTIZADOR_URL, {
        method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow',
        body: JSON.stringify({ secret: env.COTIZADOR_SECRET, pedido, devolverPdf: false }),
      }).then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!d.ok) console.log('[cotizador] error', d.error || r.status);
      }).catch((e) => console.log('[cotizador] fetch', String(e)))
    );
  }
  return json({ ok: true });
}
