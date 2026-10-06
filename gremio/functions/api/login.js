// POST /api/login — mail + contraseña.
import { json, clean, hashPw, safeEq, ip, limited, startSession, turnstileOk } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const email = clean(b.email, 160).toLowerCase(), pw = String(b.password || '');
  if (!email || !pw) return json({ error: 'Ingresá tu mail y contraseña.' }, 400);
  if (await limited(env, 'login:' + ip(request) + ':' + email, 10, 900)) return json({ error: 'Demasiados intentos. Esperá unos minutos.' }, 429);
  if (!(await turnstileOk(env, b.cf, request))) return json({ error: 'No pudimos verificar que sos una persona. Reintentá.' }, 400);
  const u = await env.DB.prepare('SELECT id, pass_hash, pass_salt, verified FROM users WHERE email = ?').bind(email).first();
  const calc = await hashPw(pw, u ? u.pass_salt : 'AAAAAAAAAAAAAAAAAAAAAA=='); // tiempo parejo exista o no el usuario
  if (!u || !safeEq(calc.hash, u.pass_hash)) return json({ error: 'Mail o contraseña incorrectos.' }, 401);
  if (!u.verified) return json({ error: 'Falta confirmar tu mail. Revisá tu casilla (y spam) o registrate de nuevo para reenviar el enlace.' }, 403);
  return json({ ok: true }, 200, { 'set-cookie': await startSession(env, u.id) });
}
