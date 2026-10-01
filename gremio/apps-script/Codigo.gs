/**
 * Ratio Hyperion · Gremio — origen de datos del catálogo con login.
 * Se pega en el archivo FUENTE de costos (Extensiones > Apps Script).
 * Devuelve costos + usuarios SOLO al servidor de la web (con un token secreto);
 * los costos nunca llegan al navegador: el servidor calcula el precio de cada perfil.
 */
const HOJAS = ['Hikvision Cctv-IP','Hik Alarma/Portero/Acceso','DAHUA','EZVIZ','IMOU','Tp-Link','Intelbras','Accesorios / Varios','Commax','Liq/Outlet'];
const MINIMO_COMPRA = 250000;

// Ejecutar UNA vez desde el editor: crea las hojas PERFILES y USUARIOS y el token.
function preparar() {
  const ss = SpreadsheetApp.getActive();
  if (!ss.getSheetByName('PERFILES')) {
    const h = ss.insertSheet('PERFILES');
    h.getRange(1,1,4,3).setValues([['perfil','etiqueta','markup %'],['gremio','Gremio',40],['integrador','Integrador',30],['distribuidor','Distribuidor / Proyecto',20]]);
  }
  if (!ss.getSheetByName('USUARIOS')) {
    const h = ss.insertSheet('USUARIOS');
    h.getRange(1,1,2,5).setValues([['email','código','perfil','nombre','activo'],['ejemplo@correo.com','1234','gremio','Cliente de ejemplo','NO']]);
  }
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('TOKEN')) p.setProperty('TOKEN', Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,''));
  Logger.log('TOKEN (copiarlo a Cloudflare como DATA_TOKEN): ' + p.getProperty('TOKEN'));
}

function doGet(e) {
  const tok = PropertiesService.getScriptProperties().getProperty('TOKEN');
  if (!tok || !e || !e.parameter || e.parameter.token !== tok) return salida({ error: 'no autorizado' });
  const ss = SpreadsheetApp.getActive();
  const items = [];
  HOJAS.forEach(function (n) {
    const h = ss.getSheetByName(n);
    if (h) parsearHoja(n, h.getDataRange().getValues()).forEach(function (i) { items.push(i); });
  });
  return salida({ items: items, perfiles: leerPerfiles(ss), usuarios: leerUsuarios(ss), minimo: MINIMO_COMPRA, actualizado: new Date().toISOString() });
}

function salida(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

function leerPerfiles(ss) {
  const h = ss.getSheetByName('PERFILES'), r = {};
  if (!h) return { gremio: { etiqueta: 'Gremio', markup: 0.4 }, integrador: { etiqueta: 'Integrador', markup: 0.3 }, distribuidor: { etiqueta: 'Distribuidor / Proyecto', markup: 0.2 } };
  h.getDataRange().getValues().slice(1).forEach(function (f) {
    const k = String(f[0]).trim().toLowerCase(); if (!k) return;
    let m = typeof f[2] === 'number' ? f[2] : parseFloat(String(f[2]).replace('%', '').replace(',', '.'));
    if (m > 1) m = m / 100;
    r[k] = { etiqueta: String(f[1] || k), markup: m };
  });
  return r;
}

function leerUsuarios(ss) {
  const h = ss.getSheetByName('USUARIOS'); if (!h) return [];
  return h.getDataRange().getValues().slice(1).filter(function (f) { return f[0] && String(f[4]).trim().toUpperCase() !== 'NO'; })
    .map(function (f) { return { email: String(f[0]).trim().toLowerCase(), codigo: String(f[1]).trim(), perfil: String(f[2]).trim().toLowerCase(), nombre: String(f[3] || '').trim() }; });
}

function aNum(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const s = v.replace(/[$\s]/g, '');
  if (!/^[\d.,]+$/.test(s)) return null;
  return Number(s.replace(/[.,]/g, ''));
}

/** values: matriz de la hoja. Devuelve [{cat, g, c, d, costo, e}] */
function parsearHoja(cat, values) {
  const out = []; let grupo = '';
  values.forEach(function (row) {
    const cells = row.map(function (v) { return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v; });
    const code = String(cells[1] == null ? '' : cells[1]).trim();
    let costo = null, ci = -1;
    for (let i = cells.length - 1; i >= 2; i--) { const n = aNum(cells[i]); if (n !== null) { costo = n; ci = i; break; } }
    let estado = '';
    for (let i = 2; i < cells.length; i++) { const t = String(cells[i]); if (/SIN STOCK|CONSULTAR/i.test(t) && t.length < 25) estado = /SIN STOCK/i.test(t) ? 'sin_stock' : 'consultar'; }
    if (code && code !== '#REF!' && (costo !== null || estado)) {
      let det = '';
      for (let i = 2; i < cells.length; i++) { if (i === ci) continue; const t = String(cells[i] == null ? '' : cells[i]); if (t.length > det.length && !/SIN STOCK|CONSULTAR/i.test(t.slice(0, 25))) det = t; }
      out.push({ cat: cat, g: grupo, c: code, d: det, costo: costo || 0, e: costo ? estado : (estado || 'sin_stock') });
      return;
    }
    if (!code || code === '#REF!') {
      const t = cells.slice(1).map(String).filter(function (x) { return x; })[0];
      if (t && costo === null && !/^COMPRA MINIMA/i.test(t) && t.length < 60) grupo = t.replace(/!+/g, '').trim();
    }
  });
  return out;
}
