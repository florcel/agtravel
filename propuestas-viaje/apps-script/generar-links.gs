/**
 * Pegar en el Sheet: Extensiones → Apps Script. Guardar y recargar el Sheet.
 * Aparece el menú "Propuestas" con dos opciones:
 *  - Generar ID y link: completa id y link en las filas nuevas de la pestaña "propuestas".
 *  - Copiar mensaje para WhatsApp: muestra el texto listo para mandar al cliente.
 */
const BASE_URL = 'https://TU-PROYECTO.vercel.app'; // ← cambiar por tu dominio

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Propuestas')
    .addItem('Generar ID y link', 'generarLinks')
    .addItem('Mensaje para WhatsApp (fila seleccionada)', 'mensajeWhatsapp')
    .addToUi();
}

function generarLinks() {
  const hoja = SpreadsheetApp.getActive().getSheetByName('propuestas');
  const datos = hoja.getDataRange().getValues();
  const enc = datos[0].map(String);
  const cId = enc.indexOf('id'), cLink = enc.indexOf('link'), cDest = enc.indexOf('destino');
  let n = 0;
  for (let f = 1; f < datos.length; f++) {
    if (!datos[f][cDest]) continue;           // fila vacía
    let id = datos[f][cId];
    if (!id) {
      id = idAleatorio(12);
      hoja.getRange(f + 1, cId + 1).setValue(id);
      n++;
    }
    hoja.getRange(f + 1, cLink + 1).setValue(`${BASE_URL}/p/${id}`);
  }
  SpreadsheetApp.getActive().toast(`${n} propuesta(s) nuevas con link`);
}

function mensajeWhatsapp() {
  const hoja = SpreadsheetApp.getActiveSheet();
  const fila = hoja.getActiveRange().getRow();
  const enc = hoja.getRange(1, 1, 1, hoja.getLastColumn()).getValues()[0].map(String);
  const val = hoja.getRange(fila, 1, 1, hoja.getLastColumn()).getValues()[0];
  const get = k => val[enc.indexOf(k)];
  const texto = `¡Hola ${get('cliente')}! Te paso la propuesta para ${get('destino')} 🌴\n${get('link')}\nCualquier duda me escribís.`;
  SpreadsheetApp.getUi().alert('Copiá este mensaje', texto, SpreadsheetApp.getUi().ButtonSet.OK);
}

function idAleatorio(largo) {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < largo; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}
