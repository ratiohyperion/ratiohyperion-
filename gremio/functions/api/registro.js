// POST /api/registro — alta de usuario; manda mail de validación.
import { json, clean, okEmail, okCuit, fmtCuit, hashPw, now, ip, limited, turnstileOk, makeToken, sendMail, mailHtml, syncSheet } from '../_lib.js';
export async function onRequestPost({ request, env, waitUntil }) {
  const b = await request.json().catch(() => ({}));
  if (b.web) return json({ ok: true }); // honeypot anti-bots
  const nombre = clean(b.nombre), empresa = clean(b.empresa), whatsapp = clean(b.whatsapp, 30), email = clean(b.email, 160).toLowerCase(), pw = String(b.password || '');
  if (!nombre || !whatsapp) return json({ error: 'Completá nombre y WhatsApp.' }, 400);
  if (!okEmail(email)) return json({ error: 'El mail no es válido.' }, 400);
  if (!okCuit(b.cuit)) return json({ error: 'El CUIT no es válido. Revisalo (11 dígitos).' }, 400);
  if (pw.length < 8 || pw.length > 100) return json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, 400);
  if (await limited(env, 'reg:' + ip(request), 8, 3600)) return json({ error: 'Demasiados intentos. Probá de nuevo en un rato.' }, 429);
  if (!(await turnstileOk(env, b.cf, request))) return json({ error: 'No pudimos verificar que sos una persona. Reintentá.' }, 400);

  const cuit = fmtCuit(b.cuit);
  const ex = await env.DB.prepare('SELECT id, verified FROM users WHERE email = ?').bind(email).first();
  let id;
  if (ex && ex.verified) return json({ error: 'Ese mail ya está registrado. Ingresá con tu contraseña o usá "Olvidé mi contraseña".' }, 409);
  const { hash, salt } = await hashPw(pw);
  if (ex) { // registrado pero sin validar: se actualizan los datos y se reenvía el mail
    id = ex.id;
    await env.DB.prepare('UPDATE users SET nombre=?, empresa=?, cuit=?, whatsapp=?, pass_hash=?, pass_salt=? WHERE id=?').bind(nombre, empresa, cuit, whatsapp, hash, salt, id).run();
  } else {
    const r = await env.DB.prepare('INSERT INTO users (email, nombre, empresa, cuit, whatsapp, pass_hash, pass_salt, created_at) VALUES (?,?,?,?,?,?,?,?)').bind(email, nombre, empresa, cuit, whatsapp, hash, salt, now()).run();
    id = r.meta.last_row_id;
    waitUntil(syncSheet(env, 'registro', { email, nombre, empresa, cuit, whatsapp }));
  }
  const tk = await makeToken(env, id, 'verify', 2 * 86400);
  const url = new URL('/api/verificar?t=' + tk, request.url).href;
  const sent = await sendMail(env, email, 'Confirmá tu registro en Gremio · Ratio Hyperion',
    mailHtml('Confirmá tu mail', `Hola ${nombre}, recibimos tu registro en el espacio de gremio de Ratio Hyperion. Para activar tu acceso confirmá tu mail (el enlace dura 48 horas).`, 'Confirmar mi mail', url));
  return json({ ok: true, sent });
}
