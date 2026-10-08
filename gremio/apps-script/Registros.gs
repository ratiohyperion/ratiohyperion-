/**
 * RH Gremio - Registros web
 * Recibe los registros del sitio gremio (Cloudflare) y los guarda en la hoja REGISTROS.
 * Pasos: 1) pegar este código  2) ejecutar instalar() una vez  3) Implementar > Aplicación web.
 */
var HOJA = 'REGISTROS';
var COLS = ['Fecha alta', 'Nombre', 'Empresa', 'CUIT', 'WhatsApp', 'Mail', 'Mail confirmado', 'Fecha confirmación'];

function instalar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA);
  if (!sh) { sh = ss.getSheets()[0]; sh.setName(HOJA); }
  sh.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold').setBackground('#0b2a5c').setFontColor('#ffffff');
  sh.setFrozenRows(1);
  sh.getRange('D:E').setNumberFormat('@');               // CUIT y WhatsApp como texto
  sh.getRange('A:A').setNumberFormat('dd/mm/yyyy hh:mm');
  sh.getRange('H:H').setNumberFormat('dd/mm/yyyy hh:mm');
  if (!sh.getFilter()) sh.getRange(1, 1, Math.max(sh.getLastRow(), 2), COLS.length).createFilter();
  sh.setColumnWidths(1, COLS.length, 150); sh.setColumnWidth(6, 230);

  var m = ss.getSheetByName('METRICAS') || ss.insertSheet('METRICAS');
  m.clear();
  var R = HOJA + '!';
  var filas = [
    ['Métricas de registros del sitio gremio', ''],
    ['Total de registros', '=COUNTA(' + R + 'F2:F)'],
    ['Con mail confirmado', '=COUNTIF(' + R + 'G2:G,"Sí")'],
    ['Pendientes de confirmar', '=B2-B3'],
    ['Altas hoy', '=COUNTIFS(' + R + 'A2:A,">="&TODAY())'],
    ['Altas últimos 7 días', '=COUNTIFS(' + R + 'A2:A,">="&(TODAY()-6))'],
    ['Altas este mes', '=COUNTIFS(' + R + 'A2:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY()),1))'],
    ['Altas mes anterior', '=COUNTIFS(' + R + 'A2:A,">="&DATE(YEAR(TODAY()),MONTH(TODAY())-1,1),' + R + 'A2:A,"<"&DATE(YEAR(TODAY()),MONTH(TODAY()),1))'],
    ['', ''],
    ['Altas por día (últimos 14 días)', 'Altas']
  ];
  m.getRange(1, 1, filas.length, 2).setValues(filas); // setValues: los textos quedan como texto y los '=...' como fórmula
  for (var i = 0; i < 14; i++) {
    var r = 11 + i;
    m.getRange(r, 1).setFormula('=TODAY()-' + i).setNumberFormat('ddd dd/mm');
    m.getRange(r, 2).setFormula('=COUNTIFS(' + R + 'A2:A,">="&A' + r + ',' + R + 'A2:A,"<"&(A' + r + '+1))');
  }
  m.getRange('A1').setFontWeight('bold').setFontSize(13);
  m.getRange('A10:B10').setFontWeight('bold').setBackground('#eaf3ff');
  m.getRange('B2:B8').setFontWeight('bold');
  m.setColumnWidth(1, 260); m.setColumnWidth(2, 90);

  var props = PropertiesService.getScriptProperties();
  var secreto = props.getProperty('SECRET');
  if (!secreto) { secreto = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); props.setProperty('SECRET', secreto); }
  SpreadsheetApp.getUi().alert('Instalado.\n\nCLAVE para Cloudflare (REGISTROS_SECRET). Copiala ahora:\n\n' + secreto);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var d = JSON.parse(e.postData.contents);
    var secreto = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secreto || d.secret !== secreto) return salida_({ ok: false, error: 'no autorizado' });
    var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA);
    var mail = String(d.email || '').toLowerCase().trim();
    if (!mail) return salida_({ ok: false, error: 'sin mail' });
    if (d.evento === 'descuento') return salida_(descuentoDe_(mail));
    if (d.evento === 'pago') return salida_(pagoDe_(mail));
    var fecha = d.fecha ? new Date(d.fecha) : new Date();
    var n = sh.getLastRow() - 1, fila = -1;
    if (n > 0) {
      var mails = sh.getRange(2, 6, n, 1).getValues();
      for (var i = 0; i < mails.length; i++) { if (String(mails[i][0]).toLowerCase() === mail) { fila = i + 2; break; } }
    }
    if (d.evento === 'verificado') {
      if (fila === -1) { sh.appendRow([fecha, d.nombre || '', d.empresa || '', d.cuit || '', d.whatsapp || '', mail, 'Sí', fecha]); }
      else { sh.getRange(fila, 7, 1, 2).setValues([['Sí', fecha]]); }
    } else if (fila === -1) {
      sh.appendRow([fecha, d.nombre || '', d.empresa || '', d.cuit || '', d.whatsapp || '', mail, 'No', '']);
    }
    return salida_({ ok: true });
  } finally { lock.releaseLock(); }
}

// Descuento del cliente por mail: el individual (col. J) manda sobre el nivel (col. I -> pestaña NIVELES). Sin nada = 0.
function descuentoDe_(mail) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA);
  var n = sh.getLastRow() - 1;
  if (n < 1) return { ok: true, descuento: 0 };
  var v = sh.getRange(2, 6, n, 5).getValues();            // columnas F..J
  for (var i = 0; i < v.length; i++) {
    if (String(v[i][0]).toLowerCase().trim() !== mail) continue;
    var nivel = String(v[i][3] || '').trim(), indiv = v[i][4];
    if (typeof indiv === 'number' && indiv > 0 && indiv <= 1) return { ok: true, descuento: indiv, origen: 'individual' };
    if (nivel) {
      var ns = ss.getSheetByName('NIVELES');
      if (ns && ns.getLastRow() > 1) {
        var t = ns.getRange(2, 1, ns.getLastRow() - 1, 2).getValues();
        for (var k = 0; k < t.length; k++) {
          if (String(t[k][0]).trim() === nivel) {
            var p = Number(t[k][1]);
            return { ok: true, descuento: p > 0 && p <= 1 ? p : 0, origen: 'nivel' };
          }
        }
      }
    }
    return { ok: true, descuento: 0 };
  }
  return { ok: true, descuento: 0 };
}

function salida_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }


// ---- Datos de pago por condición del cliente (agregado 08/10/2026) ----
// Columna K de REGISTROS = "Condición IVA" (lista desplegable, la completa él a mano).
// Pestaña PAGOS: A Condición | B Titular | C CUIT/CUIL | D Banco | E CBU | F Alias | G Factura (A o C).
// Si la condición está vacía o la fila de PAGOS está incompleta, devuelve sin datos y la web avisa que se envían al confirmar.
function PAGOS_instalar() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA);
  sh.getRange('K1').setValue('Condición IVA').setFontWeight('bold').setBackground('#0b2a5c').setFontColor('#ffffff');
  sh.getRange('K2:K1000').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInList(['Responsable inscripto', 'Monotributo', 'Consumidor final'], true).setAllowInvalid(false).build());
  sh.setColumnWidth(11, 170);
  var p = ss.getSheetByName('PAGOS') || ss.insertSheet('PAGOS');
  if (p.getLastRow() === 0) {
    p.getRange(1, 1, 1, 7).setValues([['Condición', 'Titular', 'CUIT/CUIL', 'Banco', 'CBU', 'Alias', 'Factura (A o C)']])
      .setFontWeight('bold').setBackground('#0b2a5c').setFontColor('#ffffff');
    p.getRange(2, 1, 3, 7).setValues([
      ['Responsable inscripto', '', '', '', '', '', 'A'],
      ['Monotributo', '', '', '', '', '', 'C'],
      ['Consumidor final', '', '', '', '', '', 'C']
    ]);
    p.getRange('C:C').setNumberFormat('@'); p.getRange('E:E').setNumberFormat('@');
    p.setColumnWidths(1, 7, 170);
  }
  SpreadsheetApp.getUi().alert('Listo. Completá la pestaña PAGOS (titular, CUIT/CUIL, banco, CBU y alias de cada cuenta) y cargá la Condición IVA de cada cliente en la columna K de REGISTROS.');
}

function pagoDe_(mail) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(HOJA), p = ss.getSheetByName('PAGOS');
  var n = sh.getLastRow() - 1;
  if (n < 1 || !p || p.getLastRow() < 2) return { ok: true };
  var v = sh.getRange(2, 6, n, 6).getValues();            // columnas F..K
  var cond = '';
  for (var i = 0; i < v.length; i++) { if (String(v[i][0]).toLowerCase().trim() === mail) { cond = String(v[i][5] || '').trim(); break; } }
  if (!cond) return { ok: true };
  var t = p.getRange(2, 1, p.getLastRow() - 1, 7).getValues();
  for (var k = 0; k < t.length; k++) {
    if (String(t[k][0]).trim() !== cond) continue;
    var cbu = String(t[k][4]).replace(/\D/g, '');
    if (!t[k][1] || !t[k][2] || !t[k][3] || cbu.length !== 22) return { ok: true };   // fila incompleta o CBU inválido
    return { ok: true, condicion: cond, titular: String(t[k][1]).trim(), cuit: String(t[k][2]).trim(), banco: String(t[k][3]).trim(), cbu: cbu, alias: String(t[k][5] || '').trim(), factura: String(t[k][6]).trim().toUpperCase() === 'A' ? 'A' : 'C' };
  }
  return { ok: true };
}
