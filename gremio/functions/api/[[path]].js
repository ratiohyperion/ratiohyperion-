// API del sitio de gremio (Cloudflare Pages Functions).
// Variables de entorno: DATA_URL, DATA_TOKEN (Apps Script), SESSION_SECRET.
// Sin DATA_URL funciona en MODO DEMO con datos inventados (nunca costos reales).
import { DEMO } from '../_demo.js';

const enc = new TextEncoder();
const COOKIE = 'rhg';
const TTL = 60 * 60 * 12;
let memo = { t: 0, d: null };

const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'private, no-store', ...h } });
const b64 = (u8) => btoa(String.fromCharCode(...u8)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64 = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

async function sign(secret, data) {
  const k = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return b64(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(data))));
}
function same(a, b) { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }

async function getData(env) {
  if (!env.DATA_URL || !env.DATA_TOKEN) return { ...DEMO, demo: true };
  if (memo.d && Date.now() - memo.t < 10 * 60 * 1000) return memo.d;
  try {
    const r = await fetch(env.DATA_URL + (env.DATA_URL.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(env.DATA_TOKEN), { redirect: 'follow' });
    const d = await r.json();
    if (d.error || !d.items) throw new Error(d.error || 'sin datos');
    memo = { t: Date.now(), d };
    return d;
  } catch (e) {
    if (memo.d) return memo.d; // si Google falla, se sirve la última copia
    throw e;
  }
}

function secretOf(env) { return env.SESSION_SECRET || (env.DATA_URL ? null : 'demo-secret'); }

async function sesion(req, env, data) {
  const sec = secretOf(env); if (!sec) return null;
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|; )' + COOKIE + '=([^;]+)'));
  if (!m) return null;
  const [p, s] = m[1].split('.'); if (!p || !s) return null;
  if (!same(await sign(sec, p), s)) return null;
  let o; try { o = JSON.parse(new TextDecoder().decode(unb64(p))); } catch { return null; }
  if (!o.exp || o.exp < Date.now() / 1000) return null;
  const u = (data.usuarios || []).find((x) => x.email === o.e); // si lo dan de baja en la planilla, se cae la sesión
  if (!u) return null;
  const pf = (data.perfiles || {})[u.perfil]; if (!pf) return null;
  return { email: u.email, nombre: u.nombre, perfil: u.perfil, etiqueta: pf.etiqueta, markup: pf.markup };
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const ruta = url.pathname.replace(/^\/api\//, '').replace(/\/$/, '');
  let data;
  try { data = await getData(env); } catch (e) { return json({ error: 'No se pudo cargar el catálogo. Probá en unos minutos.' }, 502); }
  if (!secretOf(env)) return json({ error: 'Falta configurar SESSION_SECRET.' }, 500);

  if (ruta === 'catalogo' && request.method === 'GET') {
    const s = await sesion(request, env, data);
    const items = data.items.map((i) => {
      const o = { c: i.c, d: i.d, cat: i.cat, g: i.g || '', e: i.e || '' };
      if (s && i.costo > 0 && i.e !== 'sin_stock') o.p = Math.round(i.costo * (1 + s.markup));
      return o;
    });
    return json({ demo: !!data.demo, minimo: data.minimo || 0, actualizado: data.actualizado || null, sesion: s ? { nombre: s.nombre, perfil: s.perfil, etiqueta: s.etiqueta, email: s.email } : null, items });
  }

  if (ruta === 'login' && request.method === 'POST') {
    let b; try { b = await request.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }
    const email = String(b.email || '').trim().toLowerCase(), cod = String(b.codigo || '').trim();
    await new Promise((r) => setTimeout(r, 350));
    const u = (data.usuarios || []).find((x) => x.email === email && same(x.codigo, cod));
    if (!u || !(data.perfiles || {})[u.perfil]) return json({ error: 'Mail o código incorrectos.' }, 401);
    const sec = secretOf(env);
    const p = b64(enc.encode(JSON.stringify({ e: u.email, exp: Math.floor(Date.now() / 1000) + TTL })));
    const ck = `${COOKIE}=${p}.${await sign(sec, p)}; Path=/; Max-Age=${TTL}; HttpOnly; Secure; SameSite=Lax`;
    return json({ ok: true }, 200, { 'set-cookie': ck });
  }

  if (ruta === 'logout' && request.method === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax` });
  }
  return json({ error: 'No encontrado' }, 404);
}
