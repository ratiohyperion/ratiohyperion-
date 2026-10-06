// GET /api/me — datos del usuario con sesión (o 401). Sirve también para precargar el pedido.
import { json, currentUser } from '../_lib.js';
export async function onRequestGet({ request, env }) {
  const u = await currentUser(request, env);
  return u ? json({ ok: true, user: u }) : json({ error: 'auth' }, 401);
}
