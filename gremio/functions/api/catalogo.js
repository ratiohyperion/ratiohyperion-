// GET /api/catalogo — lee la "LISTA GREMIO - RATIO HYPERION" de Google Sheets (hoja compartida con enlace)
// y la devuelve como JSON. Cache de 10 min. Variable opcional: SHEET_ID.
import { json as _j, currentUser } from '../_lib.js';
const SHEET_ID = '16pnoHtlqJZe-z3TKIid5_30AWFDBLbU5cs_kswoKt90';
const TABS = ['Hikvision Cctv-IP', 'Hik Alarma/Portero/Acceso', 'DAHUA', 'EZVIZ', 'IMOU', 'Tp-Link', 'Intelbras', 'Accesorios / Varios', 'Commax', 'Celulares', 'Liq/Outlet'];
let memo = { t: 0, d: null };
const TAB_MARCA = { 'Hikvision Cctv-IP': 'Hikvision', 'Hik Alarma/Portero/Acceso': 'Hikvision', DAHUA: 'Dahua', EZVIZ: 'Ezviz', IMOU: 'Imou', 'Tp-Link': 'TP-Link', Intelbras: 'Intelbras', Commax: 'Commax' };
const MARCAS = ['HIKVISION', 'HILOOK', 'DAHUA', 'UNIVIEW', 'ANVIZ', 'IMODO', 'FICATTO', 'SINOVISION', 'FURUKAWA', 'NETQUALITY', 'GLC', 'COMMSCOPE', 'FULLVISION', 'EZVIZ', 'IMOU', 'TP-LINK', 'TAPO', 'MERCUSYS', 'REYEE', 'INTELBRAS', 'COMMAX', 'SAMSUNG', 'XIAOMI', 'MOTOROLA', 'KINGSTON', 'SEAGATE', 'WESTERN DIGITAL', 'LENOVO', 'APPLE'];
const bonita = (m) => (m === 'TP-LINK' ? 'TP-Link' : m.charAt(0) + m.slice(1).toLowerCase());
function marca(cat, g, c, d) {
  const t = (c + ' ' + d).toUpperCase();
  if (cat === 'Celulares') { const x = g.toUpperCase(); if (x === 'IPHONE') return 'Apple'; if (['XIAOMI', 'MOTOROLA', 'SAMSUNG'].includes(x)) return bonita(x); return MARCAS.find((m) => t.includes(m)) ? bonita(MARCAS.find((m) => t.includes(m))) : ''; }
  if (cat === 'Hikvision Cctv-IP') return /^(B\d|T\d|IPC-|NVR-|DVR-|\d+Q-)/i.test(c) ? 'Hilook' : 'Hikvision';
  if (cat === 'Tp-Link') { const m = ['REYEE', 'MERCUSYS', 'TAPO'].find((x) => t.includes(x)); return m ? bonita(m) : 'TP-Link'; }
  if (TAB_MARCA[cat]) return TAB_MARCA[cat];
  const f = MARCAS.find((m) => t.includes(m));
  return f ? bonita(f) : '';
}

function csv(b) {
  const rows = []; let r = [], f = '', q = false;
  for (let i = 0; i < b.length; i++) {
    const c = b[i];
    if (q) { if (c === '"') { if (b[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { r.push(f); f = ''; }
    else if (c === '\n') { r.push(f); rows.push(r); r = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f || r.length) { r.push(f); rows.push(r); }
  return rows;
}
const clean = (s) => String(s || '').replace(/\s+/g, ' ').trim();
const aNum = (s) => { const t = String(s || '').replace(/[$\s]/g, ''); return /^[\d.,]+$/.test(t) ? Number(t.replace(/[.,]/g, '')) : null; };

function parse(cat, rows, meta) {
  const out = []; let g = '';
  rows.forEach((row) => {
    const a = clean(row[0]), b = clean(row[1]), p = aNum(row[2]), e = clean(row[3]);
    const blob = row.join(' ');
    const m = blob.match(/Compra m[ií]nima \$\s*([\d.]+)/i); if (m && !meta.minimo) meta.minimo = Number(m[1].replace(/\./g, ''));
    const u = blob.match(/Actualizada\s+(\d{2}\/\d{2}\/\d{4})\s*·\s*(\d{2}:\d{2})/i); if (u && !meta.actualizado) meta.actualizado = u[1] + ' ' + u[2] + ' hs';
    if (!a || /^C[ÓO]DIGO$/i.test(a)) return;
    if (!b && p === null && !e) { if (a.length < 60 && !/^Precios sin IVA/i.test(a)) g = a.replace(/!+/g, '').trim(); return; }
    if (!b) return;
    const sin = /SIN STOCK/i.test(e), cons = /CONSULTAR/i.test(e);
    out.push({ cat, g, m: marca(cat, g, a, b), c: a, d: b, p: p && !sin ? p : null, e: sin ? 'sin_stock' : (cons || !p) ? 'consultar' : '' });
  });
  return out;
}

async function load(id) {
  const meta = {};
  try {
    const r0 = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=0&sheet=INICIO`);
    const m0 = (await r0.text()).match(/(\d{2}\/\d{2}\/\d{4})\s*·\s*(\d{2}:\d{2})/);
    if (m0) meta.actualizado = m0[1] + ' ' + m0[2] + ' hs';
  } catch (e) { /* la fecha es opcional */ }
  const parts = await Promise.all(TABS.map(async (t) => {
    const r = await fetch(`https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&headers=0&sheet=${encodeURIComponent(t)}`);
    if (!r.ok) throw new Error('hoja ' + t + ' ' + r.status);
    const txt = await r.text();
    if (txt.trimStart().startsWith('<')) throw new Error('la hoja no es accesible con el enlace');
    return parse(t, csv(txt), meta);
  }));
  // Cada ítem se identifica por HOJA + CÓDIGO + DESCRIPCIÓN (clave `k`), no por la posición de la fila:
  // el mismo código puede estar en la hoja de la marca y en Liq/Outlet (cada uno con su precio), y dentro
  // de una misma hoja puede repetirse (promo, variantes de celulares). Si aun así la clave se repite, se numera.
  const nk = (x) => String(x || '').toUpperCase().replace(/\s+/g, '');
  const cuenta = {};
  const items = parts.flat();
  items.forEach((i) => { const base = i.cat + '|' + nk(i.c) + '|' + nk(i.d); cuenta[base] = (cuenta[base] || 0) + 1; i.k = cuenta[base] > 1 ? base + '#' + cuenta[base] : base; });
  return { minimo: meta.minimo || 0, actualizado: meta.actualizado || null, items };
}

// Catálogo con cache de 10 min, para usar también desde otras funciones (ej. /api/pedido).
export async function getCatalogo(env) {
  if (!memo.d || Date.now() - memo.t > 10 * 60 * 1000) memo = { t: Date.now(), d: await load(env.SHEET_ID || SHEET_ID) };
  return memo.d;
}

export async function onRequestGet({ request, env }) {
  // Solo usuarios registrados y con sesión (si la base de datos no está conectada, queda abierto como antes)
  if (env.DB && !(await currentUser(request, env))) return _j({ error: 'auth' }, 401);
  const h = { 'content-type': 'application/json; charset=utf-8', 'cache-control': env.DB ? 'private, max-age=300' : 'public, max-age=300' };
  try {
    return new Response(JSON.stringify(await getCatalogo(env)), { headers: h });
  } catch (e) {
    if (memo.d) return new Response(JSON.stringify(memo.d), { headers: h });
    return new Response(JSON.stringify({ error: 'No se pudo leer la lista en este momento.' }), { status: 502, headers: { ...h, 'cache-control': 'no-store' } });
  }
}
