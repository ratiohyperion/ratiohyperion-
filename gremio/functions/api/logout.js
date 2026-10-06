// POST /api/logout
import { json, cookieOf, sha256, setCookie } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  const tk = cookieOf(request);
  if (tk) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(tk)).run();
  return json({ ok: true }, 200, { 'set-cookie': setCookie('', 0) });
}
