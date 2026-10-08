// POST /api/pedido — recibe el carrito de un cliente logueado, lo manda al cotizador (Apps Script)
// y espera la respuesta (hasta ~28s) para poder mandarle el PDF por mail y devolver el número al front.
// Los datos del cliente (nombre, CUIT, WhatsApp, mail) salen de la sesión, nunca del body.
// El pedido por WhatsApp sale siempre, con o sin número: esta función nunca debe romper ese flujo.
import { json, currentUser, sendMail } from '../_lib.js';
import { getCatalogo } from './catalogo.js';

const JAVIER = 'javier@ratiohyperion.com.ar';

async function avisoInterno(env, texto, u) {
  try { await sendMail(env, JAVIER, 'Cotizador web: aviso', `<p>${texto}</p><p>Cliente: ${u.nombre} · ${u.email} · CUIT ${u.cuit}</p>`); }
  catch (e) { console.log('[pedido] aviso interno', String(e)); }
}


const esc = (t) => String(t == null ? '' : t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// Datos para transferir según la condición del cliente (hoja PAGOS de "Registros web", editable por él).
// Si falta cualquier dato o falla la consulta, no se muestran cuentas: se avisa que se envían al confirmar el pedido.
const SIN_DATOS = '<p>Los datos para realizar la transferencia te los enviamos al confirmar el pedido.</p>';
const ars = (n) => '$ ' + Math.round(n).toLocaleString('es-AR');
async function datosPago(env, u, total) {
  try {
    if (!env.REGISTROS_URL) return SIN_DATOS;
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(env.REGISTROS_URL, {
      method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow', signal: ctrl.signal,
      body: JSON.stringify({ secret: env.REGISTROS_SECRET || '', evento: 'pago', email: u.email }),
    });
    clearTimeout(to);
    const d = await r.json().catch(() => ({}));
    if (!d || !d.ok || !d.titular || !d.cbu) return SIN_DATOS;
    // total = total neto de la cotización (con el descuento del cliente), devuelto por el cotizador; si no llega, no se muestra monto.
    const t = Number(total);
    let importe = '';
    if (Number.isFinite(t) && t > 0) {
      if (d.factura === 'A') { const iva = t * 0.21; importe = `<br>Total: ${ars(t)}<br>IVA 21%: ${ars(iva)}<br><b>Total a transferir (con IVA): ${ars(t + iva)}</b>`; }
      else importe = `<br><b>Total a transferir: ${ars(t)}</b>`;
    }
    return `<p><b>Para confirmar tu pedido, transferí a:</b><br>Titular: ${esc(d.titular)}<br>CUIT/CUIL: ${esc(d.cuit)}<br>Banco: ${esc(d.banco)}<br>CBU: ${esc(d.cbu)}${d.alias ? '<br>Alias: ' + esc(d.alias) : ''}${importe}</p><p>Una vez hecha la transferencia, enviá el comprobante respondiendo este mail o por WhatsApp. El pedido se procesa una vez acreditado el pago.</p>`;
  } catch (e) {
    console.log('[pedido] datos de pago', String(e));
    return SIN_DATOS;
  }
}

export async function onRequestPost({ request, env, waitUntil }) {
  const u = await currentUser(request, env);
  if (!u) return json({ error: 'auth' }, 401);

  const body = await request.json().catch(() => ({}));
  const items = Array.isArray(body.items)
    ? body.items.filter((i) => i && typeof i.cod === 'string' && i.cod && Number.isFinite(i.qty) && i.qty > 0).map((i) => ({ k: String(i.k || ''), cod: i.cod, hoja: String(i.hoja || ''), desc: String(i.desc || ''), qty: Math.floor(i.qty) }))
    : [];
  if (!items.length) return json({ ok: false, error: 'Carrito vacío.' }, 400);

  let minimo = 0;
  try {
    const cat = await getCatalogo(env);
    minimo = cat.minimo || 0;
    // Cada ítem se busca por su clave (hoja + código + descripción); si el carrito trae otra cosa, por hoja + código.
    // El precio que vio el cliente (pv) y la hoja/descripción salen del catálogo del servidor, no del navegador.
    const byK = {}, byHC = {}, nk = (x) => String(x || '').toUpperCase().replace(/\s+/g, '');
    cat.items.forEach((p) => { byK[p.k] = p; const h = p.cat + '|' + nk(p.c); if (!byHC[h]) byHC[h] = p; });
    let subtotal = 0, all = true;
    items.forEach((i) => {
      const p = byK[i.k] || byHC[i.hoja + '|' + nk(i.cod)];
      if (p) { i.hoja = p.cat; i.desc = p.d; i.pv = p.p != null ? p.p : 0; }
      if (p && p.p != null) subtotal += p.p * i.qty; else all = false;
    });
    if (all && minimo && subtotal < minimo) return json({ ok: false, error: 'No llega a la compra mínima.' }, 400);
  } catch (e) {
    console.log('[pedido] catalogo', String(e)); // si falla la lectura del catálogo, no bloqueamos el pedido
  }

  if (!env.COTIZADOR_URL || !env.COTIZADOR_SECRET) return json({ ok: true, numero: null });

  items.forEach((i) => { delete i.k; });
  const pedido = { cuit: u.cuit, nombre: u.nombre, contacto: u.empresa || '', whatsapp: u.whatsapp, items };
  // Todo el trabajo (cotizador + mail al cliente) corre bajo waitUntil: si el navegador corta la conexión
  // (timeout, celular que pasa a WhatsApp), el mail con el PDF igual sale. La respuesta al front no cambia.
  const trabajo = (async () => {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 55000);
    const start = Date.now();
    try {
      const r = await fetch(env.COTIZADOR_URL, {
        method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow', signal: ctrl.signal,
        body: JSON.stringify({ secret: env.COTIZADOR_SECRET, pedido, devolverPdf: true }),
      });
      const raw = await r.text().catch(() => '');
      clearTimeout(to);
      let d = {};
      try { d = JSON.parse(raw); } catch (e) { d = { _raw: raw.slice(0, 300), _status: r.status }; } // respuesta no JSON: se informa en el aviso

      if (!d.ok) {
        if (d.error === 'limite diario') { waitUntil(avisoInterno(env, 'Cliente alcanzó el límite diario de cotizaciones automáticas.', u)); return json({ ok: true, numero: null, aviso: 'limite' }); }
        waitUntil(avisoInterno(env, 'El cotizador devolvió un error: ' + (d.error || 'desconocido') + (d._raw !== undefined ? ' [HTTP ' + d._status + ', respuesta no JSON: ' + esc(d._raw) + ']' : '') + '.', u));
        return json({ ok: true, numero: null });
      }

      if (d.pdfBase64) {
        const pago = await datosPago(env, u, d.total);
        const html = `<p>Hola ${esc(u.nombre)},</p><p>Adjuntamos tu cotización <b>${esc(d.numero)}</b> de Ratio Hyperion · Gremio e instaladores.</p><p>Los precios no incluyen IVA. La validez de la cotización figura en el PDF adjunto.</p>${pago}<p>Cualquier consulta, respondé este mail o escribinos por WhatsApp.</p>`;
        const mailOk = await sendMail(env, u.email, 'Tu cotización ' + d.numero, html, [{ filename: d.numero + '.pdf', content: d.pdfBase64 }]).catch((e) => { console.log('[pedido] mail cliente', String(e)); return false; });
        if (!mailOk) waitUntil(avisoInterno(env, 'Se generó la cotización ' + d.numero + ' pero no se pudo enviar el mail con el PDF.', u));
      }
      return json({ ok: true, numero: d.numero || null });
    } catch (e) {
      clearTimeout(to);
      const segs = Math.round((Date.now() - start) / 1000);
      waitUntil(avisoInterno(env, 'Timeout o error llamando al cotizador (' + segs + 's): ' + String(e) + '.', u));
      return json({ ok: true, numero: null });
    }
  })();
  waitUntil(trabajo.catch(() => {}));
  return await trabajo;
}
