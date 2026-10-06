// POST /api/reset — {token, password}: guarda la nueva contraseña, valida el mail e inicia sesión.
import { json, hashPw, useToken, startSession, now } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const pw = String(b.password || '');
  if (pw.length < 8 || pw.length > 100) return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  const id = await useToken(env, b.token, 'reset');
  if (!id) return json({ error: 'El enlace venció. Pedí uno nuevo desde "Olvidé mi contraseña".' }, 400);
  const { hash, salt } = await hashPw(pw);
  await env.DB.prepare('UPDATE users SET pass_hash=?, pass_salt=?, verified=1, verified_at=COALESCE(verified_at, ?) WHERE id=?').bind(hash, salt, now(), id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
  return json({ ok: true }, 200, { 'set-cookie': await startSession(env, id) });
}
