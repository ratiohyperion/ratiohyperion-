// GET /api/verificar?t=TOKEN — confirma el mail, inicia sesión y vuelve al sitio.
import { useToken, startSession, syncSheet, now } from '../_lib.js';
export async function onRequestGet({ request, env, waitUntil }) {
  const t = new URL(request.url).searchParams.get('t');
  const id = await useToken(env, t, 'verify');
  if (!id) return Response.redirect(new URL('/?aviso=enlace', request.url).href, 302);
  await env.DB.prepare('UPDATE users SET verified = 1, verified_at = ? WHERE id = ?').bind(now(), id).run();
  const u = await env.DB.prepare('SELECT email, nombre, empresa, cuit, whatsapp FROM users WHERE id = ?').bind(id).first();
  waitUntil(syncSheet(env, 'verificado', u));
  const cookie = await startSession(env, id);
  return new Response(null, { status: 302, headers: { location: new URL('/?aviso=verificado', request.url).href, 'set-cookie': cookie, 'cache-control': 'no-store' } });
}
