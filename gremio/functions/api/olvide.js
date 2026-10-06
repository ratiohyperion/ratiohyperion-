// POST /api/olvide — envía enlace para elegir nueva contraseña (siempre responde igual).
import { json, clean, ip, limited, makeToken, sendMail, mailHtml, turnstileOk } from '../_lib.js';
export async function onRequestPost({ request, env }) {
  const b = await request.json().catch(() => ({}));
  const email = clean(b.email, 160).toLowerCase();
  const ok = json({ ok: true });
  if (!email || (await limited(env, 'forgot:' + ip(request), 6, 3600))) return ok;
  if (!(await turnstileOk(env, b.cf, request))) return json({ error: 'No pudimos verificar que sos una persona. Reintentá.' }, 400);
  const u = await env.DB.prepare('SELECT id, nombre FROM users WHERE email = ?').bind(email).first();
  if (u) {
    const tk = await makeToken(env, u.id, 'reset', 3600);
    const url = new URL('/?reset=' + tk, request.url).href;
    await sendMail(env, email, 'Nueva contraseña · Gremio Ratio Hyperion', mailHtml('Elegí una nueva contraseña', `Hola ${u.nombre}, pediste cambiar tu contraseña. El enlace dura 1 hora. Si no fuiste vos, ignorá este mail.`, 'Elegir contraseña', url));
  }
  return ok;
}
