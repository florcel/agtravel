// Carga de propuestas: desde Google Sheets (si hay SHEET_ID) o desde data/demo.json.
import { readFile } from 'node:fs/promises';
import { config } from '../config.js';

let cache = { at: 0, data: null };

export async function getPropuesta(id) {
  if (!id) return null;
  const todas = await getTodas();
  return todas.find(p => p.id === id) || null;
}

async function getTodas() {
  const ahora = Date.now();
  if (cache.data && ahora - cache.at < config.cacheSegundos * 1000) return cache.data;
  const data = config.sheetId ? await desdeSheets(config.sheetId) : await desdeJson();
  cache = { at: ahora, data };
  return data;
}

async function desdeJson() {
  const url = new URL('../data/demo.json', import.meta.url);
  return JSON.parse(await readFile(url, 'utf8'));
}

// ---------- Google Sheets ----------
// El Sheet tiene 5 pestañas: propuestas, vuelos, incluye, coberturas, hoteles.
// Cada pestaña (salvo "propuestas") se vincula por la columna propuesta_id.

async function pestaña(sheetId, nombre) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(nombre)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`No pude leer la pestaña "${nombre}" (${r.status})`);
  return csvAObjetos(await r.text());
}

async function desdeSheets(sheetId) {
  const [props, vuelos, incluye, coberturas, hoteles] = await Promise.all(
    ['propuestas', 'vuelos', 'incluye', 'coberturas', 'hoteles'].map(n => pestaña(sheetId, n))
  );
  const de = (filas, id) => filas.filter(f => f.propuesta_id === id);

  return props
    .filter(p => p.id && (p.activa || 'si').toLowerCase() !== 'no')
    .map(p => {
      const cob = de(coberturas, p.id);
      return {
        id: p.id,
        cliente: p.cliente,
        destino: p.destino,
        fechaDesde: p.fecha_desde,
        fechaHasta: p.fecha_hasta,
        salida: p.salida,
        salidaCodigo: p.salida_codigo,
        foto: p.foto,
        etapa: p.etapa,
        whatsapp: p.whatsapp,
        vuelos: de(vuelos, p.id).map(v => ({
          tramo: v.tramo, origen: v.origen, destino: v.destino,
          salida: v.salida, llegada: v.llegada,
          escalas: num(v.escalas) ?? 0, detalle: v.detalle
        })),
        incluye: de(incluye, p.id).map(i => ({ icono: i.icono, texto: i.texto })),
        asistencia: cob.length ? {
          nombre: p.asistencia_nombre,
          coberturas: cob.map(c => ({ etiqueta: c.etiqueta, valor: c.valor }))
        } : null,
        hoteles: de(hoteles, p.id).map(h => ({
          ciudad: h.ciudad, nombre: h.nombre, habitacion: h.habitacion,
          regimen: h.regimen, desde: h.desde, hasta: h.hasta
        })),
        precio: {
          moneda: p.moneda || 'USD',
          sena: num(p.sena), saldo: num(p.saldo), total: num(p.total),
          unidad: p.unidad, nota: p.nota
        }
      };
    });
}

function num(v) {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  // acepta "2.400", "2400", "2,400.50", "2400,50"
  let s = String(v).replace(/[^\d.,-]/g, '');
  if (/,\d{1,2}$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else s = s.replace(/[.,](?=\d{3}(\D|$))/g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

// CSV simple con soporte de comillas y saltos de línea dentro de celdas
export function csvAObjetos(texto) {
  const filas = [];
  let fila = [], celda = '', comillas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (comillas) {
      if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
      else if (c === '"') comillas = false;
      else celda += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') { fila.push(celda); celda = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && texto[i + 1] === '\n') i++;
      fila.push(celda); filas.push(fila); fila = []; celda = '';
    } else celda += c;
  }
  if (celda !== '' || fila.length) { fila.push(celda); filas.push(fila); }
  const [enc, ...resto] = filas.filter(f => f.some(x => x.trim() !== ''));
  if (!enc) return [];
  const claves = enc.map(h => h.trim().toLowerCase());
  return resto.map(f => Object.fromEntries(claves.map((k, i) => [k, (f[i] ?? '').trim()])));
}
