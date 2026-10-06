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

function salida_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
