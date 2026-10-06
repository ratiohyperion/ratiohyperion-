// Utilidades compartidas del login gremio (no es una ruta: no exporta onRequest*)
const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const now = () => Math.floor(Date.now() / 1000);
export const DAY = 86400;
export const COOKIE = 'gr_s';

export const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });

export async function sha256(s) { return hex(await crypto.subtle.digest('SHA-256', enc.encode(s))); }
export const newToken = () => hex(crypto.getRandomValues(new Uint8Array(32)));

export async function hashPw(pw, saltB64) {
  const salt = saltB64 ? unb64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100000 }, key, 256);
  return { hash: b64(bits), salt: b64(salt) };
}
export function safeEq(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

export const clean = (s, max = 120) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, max);
export const okEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 160;
export function okCuit(c) {
  const d = String(c || '').replace(/\D/g, '');
  if (d.length !== 11 || !['20', '23', '24', '27', '30', '33', '34'].includes(d.slice(0, 2))) return false;
  const w = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]; let s = 0;
  for (let i = 0; i < 10; i++) s += w[i] * Number(d[i]);
  let v = 11 - (s % 11); if (v === 11) v = 0; if (v === 10) v = 9;
  return v === Number(d[10]);
}
export const fmtCuit = (c) => { const d = String(c).replace(/\D/g, ''); return d.slice(0, 2) + '-' + d.slice(2, 10) + '-' + d.slice(10); };

export const ip = (request) => request.headers.get('cf-connecting-ip') || 'x';
// Límite de intentos: devuelve true si se superó. Registra el intento.
export async function limited(env, key, max, windowSec) {
  const t = now();
  await env.DB.prepare('DELETE FROM attempts WHERE ts < ?').bind(t - 86400).run();
  const r = await env.DB.prepare('SELECT COUNT(*) AS n FROM attempts WHERE k = ? AND ts > ?').bind(key, t - windowSec).first();
  if (r && r.n >= max) return true;
  await env.DB.prepare('INSERT INTO attempts (k, ts) VALUES (?, ?)').bind(key, t).run();
  return false;
}

export async function turnstileOk(env, token, request) {
  if (!env.TURNSTILE_SECRET) return true; // si no está configurado, no se exige
  if (!token) return false;
  const f = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip(request) });
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: f });
  const d = await r.json().catch(() => ({}));
  return !!d.success;
}

export function cookieOf(request, name = COOKIE) {
  const m = (request.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}
export const setCookie = (val, maxAge) => `${COOKIE}=${val}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export async function startSession(env, userId) {
  const tk = newToken();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(await sha256(tk), userId, now() + 90 * DAY).run();
  await env.DB.prepare('UPDATE users SET last_login = ? WHERE id = ?').bind(now(), userId).run();
  return setCookie(tk, 90 * DAY);
}
export async function currentUser(request, env) {
  const tk = cookieOf(request); if (!tk) return null;
  return env.DB.prepare('SELECT u.id, u.email, u.nombre, u.empresa, u.cuit, u.whatsapp FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ? AND u.verified = 1')
    .bind(await sha256(tk), now()).first();
}

export async function makeToken(env, userId, kind, ttlSec) {
  const tk = newToken();
  await env.DB.prepare('DELETE FROM tokens WHERE user_id = ? AND kind = ?').bind(userId, kind).run();
  await env.DB.prepare('INSERT INTO tokens (token_hash, user_id, kind, expires_at) VALUES (?, ?, ?, ?)').bind(await sha256(tk), userId, kind, now() + ttlSec).run();
  return tk;
}
export async function useToken(env, tk, kind) {
  const h = await sha256(String(tk || ''));
  const r = await env.DB.prepare('SELECT user_id FROM tokens WHERE token_hash = ? AND kind = ? AND expires_at > ?').bind(h, kind, now()).first();
  if (r) await env.DB.prepare('DELETE FROM tokens WHERE token_hash = ?').bind(h).run();
  return r ? r.user_id : null;
}

// Envío por Resend. Sin RESEND_API_KEY (desarrollo) solo registra en consola.
export async function sendMail(env, to, subject, html) {
  const from = env.MAIL_FROM || 'Ratio Hyperion Gremio <gremio@ratiohyperion.com.ar>';
  if (!env.RESEND_API_KEY) { console.log('[MAIL dev]', to, subject, html.replace(/<[^>]+>/g, ' ')); return true; }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { authorization: 'Bearer ' + env.RESEND_API_KEY, 'content-type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html, reply_to: 'gremio@ratiohyperion.com.ar' }),
  });
  if (!r.ok) console.log('[MAIL error]', r.status, await r.text());
  return r.ok;
}
export const mailHtml = (titulo, texto, boton, url) => `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#0b2a5c"><h2 style="margin:0 0 12px">${titulo}</h2><p style="font-size:15px;line-height:1.5">${texto}</p><p style="margin:22px 0"><a href="${url}" style="background:#1679f0;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">${boton}</a></p><p style="font-size:12px;color:#667">Si el botón no funciona, copiá este enlace en el navegador:<br>${url}</p><p style="font-size:12px;color:#667">Ratio Hyperion · Gremio e instaladores</p></div>`;

// Copia del registro a Google Sheets (Apps Script). Opcional: solo si REGISTROS_URL está configurada.
export async function syncSheet(env, evento, u) {
  if (!env.REGISTROS_URL) return;
  try {
    await fetch(env.REGISTROS_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow',
      body: JSON.stringify({ secret: env.REGISTROS_SECRET || '', evento, email: u.email, nombre: u.nombre, empresa: u.empresa || '', cuit: u.cuit, whatsapp: u.whatsapp, fecha: new Date().toISOString() }) });
  } catch (e) { console.log('[sheet]', String(e)); }
}
