// GET /api/descuento — descuento del cliente con sesión, leído en vivo de la planilla "RH Gremio - Registros web".
// Si algo falla (planilla caída, sin configurar, sin sesión) devuelve 0%: el pedido sigue funcionando a precio de lista.
import { json, currentUser } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  const u = await currentUser(request, env);
  if (!u) return json({ error: 'auth' }, 401);
  if (!env.REGISTROS_URL) return json({ ok: true, descuento: 0 });
  try {
    const r = await fetch(env.REGISTROS_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow',
      body: JSON.stringify({ secret: env.REGISTROS_SECRET || '', evento: 'descuento', email: u.email }),
    });
    const d = await r.json().catch(() => ({}));
    const p = Number(d && d.descuento);
    return json({ ok: true, descuento: d && d.ok && p > 0 && p <= 1 ? p : 0 });
  } catch (e) {
    console.log('[descuento]', String(e));
    return json({ ok: true, descuento: 0 });
  }
}
