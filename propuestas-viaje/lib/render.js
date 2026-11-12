// Arma el HTML completo de una propuesta (todo del lado del servidor, con las etiquetas
// de vista previa para WhatsApp/redes ya resueltas).
import { config } from '../config.js';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Acepta 2027-03-04 o 04/03/2027
function fecha(s) {
  if (!s) return null;
  let m = String(s).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  m = String(s).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
  return null;
}
const noches = (a, b) => (a && b) ? Math.round((b - a) / 86400000) : null;
const mesCorto = d => MESES[d.getUTCMonth()].slice(0, 3);

function rangoFechas(a, b) {
  if (!a || !b) return { grande: '', chico: '' };
  if (a.getUTCMonth() === b.getUTCMonth())
    return { grande: `${a.getUTCDate()} al ${b.getUTCDate()}`, chico: `de ${MESES[a.getUTCMonth()]}` };
  return { grande: `${a.getUTCDate()} ${mesCorto(a)} al ${b.getUTCDate()} ${mesCorto(b)}`, chico: '' };
}

function dinero(moneda, n) {
  if (n === null || n === undefined) return '';
  const tieneDecimales = Math.round(n) !== n;
  return `${moneda} ${n.toLocaleString('es-AR', { minimumFractionDigits: tieneDecimales ? 2 : 0, maximumFractionDigits: 2 })}`;
}

const ICONOS = {
  avion: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
  escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v8M8 12h8"/>',
  bus: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M3 11h18M7 17v3M17 17v3"/><circle cx="7.5" cy="14" r=".8"/><circle cx="16.5" cy="14" r=".8"/>',
  hotel: '<path d="M3 21V7l9-4 9 4v14"/><path d="M9 21v-5h6v5M8 10h.01M12 10h.01M16 10h.01M8 13h.01M16 13h.01"/>',
  comida: '<path d="M4 3v8a3 3 0 0 0 3 3v7M7 3v6M10 3v8a3 3 0 0 1-3 3"/><path d="M18 21V3c-2 1-3 4-3 7v4h3"/>',
  excursion: '<path d="m3 20 6-11 4 7 3-4 5 8z"/><circle cx="17" cy="6" r="2"/>',
  auto: '<path d="M5 17h14v-5l-2-5H7l-2 5z"/><circle cx="8" cy="17" r="2"/><circle cx="16" cy="17" r="2"/>',
  barco: '<path d="M3 17l2 3h14l2-3H3zM12 3v11M12 4l6 9H12"/>',
  check: '<path d="m5 12 5 5L20 7"/>'
};
const icono = (n, size = 26) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONOS[n] || ICONOS.check}</svg>`;

export function renderPropuesta(p, { baseUrl = config.baseUrl } = {}) {
  const c = config.colores;
  const desde = fecha(p.fechaDesde), hasta = fecha(p.fechaHasta);
  const n = noches(desde, hasta);
  const rango = rangoFechas(desde, hasta);
  const mesAnio = desde ? `${MESES[desde.getUTCMonth()]} ${desde.getUTCFullYear()}` : '';
  const pr = p.precio || {};
  const moneda = pr.moneda || 'USD';
  const total = pr.total ?? ((pr.sena ?? 0) + (pr.saldo ?? 0) || null);
  const fechasTexto = desde && hasta ? `Del ${rango.grande} ${rango.chico}`.trim() + ` de ${hasta.getUTCFullYear()}` : '';

  const titulo = `${p.destino} · Propuesta para ${p.cliente} · ${config.agencia}`;
  const descripcion = [fechasTexto, `De ${config.agencia}.`, pr.nota].filter(Boolean).join('. ').replace(/\.\./g, '.');
  const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/p/${p.id}` : '';

  const wa = (p.whatsapp || config.whatsapp || '').replace(/\D/g, '');
  const waTexto = `¡Hola! Quiero reservar ${p.destino}${fechasTexto ? ' (' + fechasTexto.toLowerCase() + ')' : ''}. Propuesta: ${p.id}`;
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(waTexto)}`;

  const logo = config.logoUrl
    ? `<img class="logo-img" src="${esc(config.logoUrl)}" alt="${esc(config.agencia)}">`
    : `<span class="logo-txt">${esc(config.agencia)}</span>`;

  const slides = [];

  // 1. Portada
  slides.push(`
  <section class="slide portada">
    <div class="portada-txt">
      <div class="logo">${logo}</div>
      <div class="kicker">Tu viaje${mesAnio ? ' · ' + esc(mesAnio) : ''}</div>
      <h1>${esc(p.destino)}</h1>
      <hr>
      <dl class="datos">
        ${n !== null ? `<dt>Duración</dt><dd><b>${n + 1} días</b> ${n} noches</dd>` : ''}
        ${rango.grande ? `<dt>Fechas</dt><dd><b>${esc(rango.grande)}</b> ${esc(rango.chico)}</dd>` : ''}
        ${p.salida ? `<dt>Salida</dt><dd><b>${esc(p.salida)}</b> ${esc(p.salidaCodigo || '')}</dd>` : ''}
      </dl>
      <p class="pista">Deslizá o tocá → para ver el viaje</p>
    </div>
    <div class="portada-foto" ${p.foto ? `style="background-image:url('${esc(p.foto)}')"` : ''}></div>
  </section>`);

  // 2. Vuelos
  if (p.vuelos?.length) slides.push(`
  <section class="slide dos-col">
    <header><div class="kicker">Cómo llegás</div><h2>Tus vuelos</h2></header>
    <div class="lista">
      ${p.vuelos.map(v => `
      <article class="card vuelo">
        <div class="tramo">${esc(v.tramo)}</div>
        <div class="ruta">
          <div><b>${esc(v.origen)}</b><small>${esc(v.salida)}</small></div>
          <div class="avion">${icono('avion', 22)}<small>${v.escalas ? `${v.escalas} escala${v.escalas > 1 ? 's' : ''}` : 'Directo'}</small></div>
          <div class="der"><b>${esc(v.destino)}</b><small>${esc(v.llegada)}</small></div>
        </div>
        ${v.detalle ? `<div class="detalle">◷ ${esc(v.detalle)}</div>` : ''}
      </article>`).join('')}
    </div>
  </section>`);

  // 3. Incluye
  if (p.incluye?.length) slides.push(`
  <section class="slide">
    <header><div class="kicker">Tu paquete</div><h2>El servicio incluye</h2></header>
    <ul class="incluye">
      ${p.incluye.map(i => `<li>${icono(i.icono)}<span>${esc(i.texto)}</span></li>`).join('')}
    </ul>
  </section>`);

  // 4. Asistencia
  const cob = p.asistencia?.coberturas || [];
  if (cob.length) slides.push(`
  <section class="slide">
    <header><div class="kicker">Asistencia al viajero</div><h2>${esc(p.asistencia.nombre || 'Coberturas')}</h2></header>
    <dl class="grilla">${cob.slice(0, 6).map(x => `<div><dt>${esc(x.etiqueta)}</dt><dd>${esc(x.valor)}</dd></div>`).join('')}</dl>
    ${cob.length > 6 ? `<details><summary>Ver todas las coberturas</summary>
      <dl class="grilla">${cob.slice(6).map(x => `<div><dt>${esc(x.etiqueta)}</dt><dd>${esc(x.valor)}</dd></div>`).join('')}</dl></details>` : ''}
  </section>`);

  // 5. Hoteles
  if (p.hoteles?.length) slides.push(`
  <section class="slide dos-col">
    <header><div class="kicker">Hospedaje</div><h2>Dónde te quedás</h2><p class="sub">Previsto, o similar de la misma categoría.</p></header>
    <div class="lista">
      ${p.hoteles.map(h => {
        const a = fecha(h.desde), b = fecha(h.hasta), nh = noches(a, b);
        return `
      <article class="card hotel">
        <div>
          <div class="tramo">${esc(h.ciudad)}</div>
          <h3>${esc(h.nombre)}</h3>
          <div class="hab">${esc(h.habitacion)}</div>
          ${h.regimen ? `<span class="chip">${esc(h.regimen)}</span>` : ''}
        </div>
        ${nh !== null ? `<div class="noches"><b>${nh}</b><span>noches</span><small>${a.getUTCDate()} ${mesCorto(a)} a ${b.getUTCDate()} ${mesCorto(b)}</small></div>` : ''}
      </article>`;
      }).join('')}
    </div>
  </section>`);

  // 6. Cierre y precio
  const conSena = pr.sena !== null && pr.sena !== undefined && pr.saldo !== null && pr.saldo !== undefined;
  slides.push(`
  <section class="slide cierre">
    <div class="logo top">${logo}</div>
    <div class="cierre-txt">
      ${p.etapa ? `<div class="kicker">${esc(p.etapa)}</div>` : ''}
      <h2>¿Nos vamos a ${esc(p.destino)}?</h2>
      ${pr.nota ? `<p class="sub">${esc(pr.nota)}</p>` : ''}
      <a class="cta" href="${esc(waLink)}" target="_blank" rel="noopener">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>
        Quiero reservar
      </a>
      ${wa ? `<p class="wa-num">o escribinos al +${esc(wa)}</p>` : ''}
    </div>
    <div class="precios">
      ${conSena ? `
        <div class="precio acento"><span>Seña ${esc(pr.unidad || '')}</span><b>${dinero(moneda, pr.sena)}</b></div>
        <div class="precio claro"><span>Y el saldo de</span><b>${dinero(moneda, pr.saldo)}</b></div>
        <p class="total">Tarifa final ${esc(pr.unidad || '')}: <b>${dinero(moneda, total)}</b>.</p>`
      : total ? `
        <div class="precio acento"><span>Precio final ${esc(pr.unidad || '')}</span><b>${dinero(moneda, total)}</b></div>` : ''}
    </div>
  </section>`);

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<meta name="robots" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="${esc(c.fondo)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
${url ? `<meta property="og:url" content="${esc(url)}">` : ''}
${p.foto ? `<meta property="og:image" content="${esc(p.foto)}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root{--fondo:${c.fondo};--fondo2:${c.fondo2};--acento:${c.acento};--tarjeta:${c.tarjeta};--txt:#fff;--suave:rgba(255,255,255,.72)}
*{box-sizing:border-box;margin:0;padding:0}
html,body{height:100%}
body{font-family:Montserrat,system-ui,sans-serif;color:var(--txt);background:linear-gradient(135deg,var(--fondo2),var(--fondo));overflow:hidden;-webkit-font-smoothing:antialiased}
.progreso{position:fixed;top:0;left:0;height:4px;background:var(--acento);transition:width .4s;z-index:5}
.deck{position:relative;height:100%;width:100%}
.slide{position:absolute;inset:0;padding:6vh 6vw 110px;display:flex;flex-direction:column;justify-content:center;gap:28px;opacity:0;visibility:hidden;transform:translateX(30px);transition:opacity .45s,transform .45s,visibility .45s;overflow-y:auto}
.slide.activa{opacity:1;visibility:visible;transform:none}
.slide.antes{transform:translateX(-30px)}
.kicker{font-size:12px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--suave);margin-bottom:6px}
h1{font-size:clamp(40px,6vw,64px);font-weight:800;line-height:1.05}
h2{font-size:clamp(28px,3.6vw,40px);font-weight:800;line-height:1.1}
h3{font-size:20px;font-weight:700}
.sub{color:var(--suave);font-size:14px;margin-top:10px}
.logo-txt{font-weight:800;font-size:28px;letter-spacing:-.02em}
.logo-img{height:40px;width:auto}
/* portada */
.portada{flex-direction:row;padding:0;gap:0;align-items:stretch}
.portada-txt{flex:1;padding:8vh 6vw 110px;display:flex;flex-direction:column;justify-content:center}
.portada .logo{margin-bottom:22px}
.portada hr{border:0;border-top:1px solid rgba(255,255,255,.3);margin:22px 0;max-width:440px}
.datos{display:grid;grid-template-columns:auto 1fr;gap:12px 22px;align-items:baseline}
.datos dt{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--suave)}
.datos dd{font-size:15px}.datos dd b{font-size:22px;margin-right:4px}
.pista{margin-top:34px;font-size:14px;color:var(--suave)}
.portada-foto{flex:0 0 44%;background:radial-gradient(circle at 70% 30%,rgba(255,255,255,.35),transparent 45%),linear-gradient(160deg,var(--acento),var(--fondo2) 60%,var(--fondo));background-size:cover;background-position:center;-webkit-mask-image:linear-gradient(90deg,transparent,#000 22%);mask-image:linear-gradient(90deg,transparent,#000 22%)}
/* dos columnas */
.dos-col{flex-direction:row;align-items:center;gap:6vw}
.dos-col>header{flex:0 0 32%}
.dos-col>.lista{flex:1;display:flex;flex-direction:column;gap:14px}
.card{background:var(--tarjeta);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:16px 20px;backdrop-filter:blur(4px)}
.tramo{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--suave);margin-bottom:6px}
.ruta{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px}
.ruta b{display:block;font-size:17px}.ruta small{font-size:12px;color:var(--suave)}
.ruta .der{text-align:right}
.avion{display:flex;flex-direction:column;align-items:center;gap:2px;padding:0 14px;background:linear-gradient(90deg,transparent 0 6px,rgba(255,255,255,.35) 6px 10px,transparent 10px) repeat-x center 11px/12px 1px}
.avion svg{background:transparent}.avion small{font-size:10px}
.detalle{margin-top:12px;font-size:13px;color:var(--suave)}
/* incluye */
.incluye{list-style:none;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:22px 34px;max-width:1100px}
.incluye li{display:flex;gap:14px;align-items:flex-start;font-size:15px;line-height:1.4}
.incluye svg{flex:none;opacity:.9}
/* asistencia */
.grilla{display:grid;grid-template-columns:repeat(3,1fr);gap:20px 40px;max-width:1100px}
.grilla dt{font-size:14px;color:var(--suave)}.grilla dd{font-size:15px;font-weight:700;margin-top:2px}
details summary{cursor:pointer;font-weight:700;font-size:14px;list-style:none}
details summary::before{content:'▸ '}details[open] summary::before{content:'▾ '}
details .grilla{margin-top:18px}
/* hotel */
.hotel{display:flex;justify-content:space-between;align-items:center;gap:16px}
.hab{font-size:14px;color:var(--suave);margin:2px 0 8px}
.chip{display:inline-block;font-size:12px;font-weight:600;padding:3px 10px;border-radius:99px;background:rgba(255,255,255,.16)}
.noches{text-align:center;border-left:1px solid rgba(255,255,255,.2);padding-left:20px;min-width:110px}
.noches b{display:block;font-size:30px;line-height:1}.noches span{display:block;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.noches small{font-size:11px;color:var(--suave)}
/* cierre */
.cierre{flex-direction:row;align-items:center;gap:6vw}
.cierre .logo.top{position:absolute;top:6vh;left:6vw}
.cierre-txt{flex:1}
.cta{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;padding:16px 24px;border-radius:12px;background:var(--acento);color:#1a1a1a;font-weight:700;font-size:17px;text-decoration:none;box-shadow:0 10px 24px rgba(0,0,0,.2);transition:transform .15s}
.cta:hover{transform:translateY(-2px)}
.wa-num{font-size:12px;color:var(--suave);margin-top:10px;text-align:center}
.precios{flex:0 0 38%;display:flex;flex-direction:column;gap:12px}
.precio{border-radius:14px;padding:16px 20px}.precio span{display:block;font-size:14px;font-weight:600}
.precio b{display:block;font-size:clamp(30px,3.4vw,42px);font-weight:800;line-height:1.1}
.precio.acento{background:var(--acento);color:#1a1a1a}.precio.claro{background:#fff;color:#1a1a1a}
.total{font-size:14px}
/* barra inferior */
.nav{position:fixed;bottom:18px;left:50%;transform:translateX(-50%);display:flex;gap:8px;z-index:5}
.nav button{white-space:nowrap;font:600 13px Montserrat,sans-serif;border:0;border-radius:8px;padding:11px 18px;cursor:pointer;display:flex;align-items:center;gap:6px}
.btn-sec{background:rgba(255,255,255,.14);color:#fff}
.btn-pri{background:#fff;color:#1a1a1a;min-width:150px;justify-content:center}
.nav button:disabled{opacity:.35;cursor:default}
/* celular */
@media (max-width:760px){
  .slide{padding:7vh 22px 100px;justify-content:flex-start}
  .portada{flex-direction:column-reverse}
  .portada-foto{flex:0 0 32vh;-webkit-mask-image:linear-gradient(0deg,transparent,#000 30%);mask-image:linear-gradient(0deg,transparent,#000 30%)}
  .portada-txt{padding:0 22px 100px;justify-content:flex-start}
  .dos-col,.cierre{flex-direction:column;align-items:stretch;gap:22px}
  .cierre .logo.top{position:static}
  .grilla{grid-template-columns:1fr 1fr}
  .incluye{grid-template-columns:1fr}
  .btn-pri{min-width:120px}
}
/* PDF: todas las pantallas una debajo de la otra */
@media print{
  @page{size:A4 landscape;margin:0}
  body{overflow:visible;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .nav,.progreso,.pista{display:none}
  .slide{position:relative;opacity:1;visibility:visible;transform:none;height:100vh;page-break-after:always;break-after:page;background:linear-gradient(135deg,var(--fondo2),var(--fondo))}
  details{display:block}details>*{display:block}
}
</style>
</head>
<body>
<div class="progreso" id="progreso"></div>
<main class="deck" id="deck">${slides.join('')}</main>
<nav class="nav">
  <button class="btn-sec" id="pdf" type="button">⤓ PDF</button>
  <button class="btn-sec" id="ant" type="button" aria-label="Anterior">‹</button>
  <button class="btn-pri" id="sig" type="button">Siguiente ›</button>
</nav>
<script>
(function(){
  var s=[].slice.call(document.querySelectorAll('.slide')),i=0,
      bar=document.getElementById('progreso'),ant=document.getElementById('ant'),sig=document.getElementById('sig');
  function ir(n){
    i=Math.max(0,Math.min(s.length-1,n));
    s.forEach(function(el,k){el.classList.toggle('activa',k===i);el.classList.toggle('antes',k<i)});
    bar.style.width=((i+1)/s.length*100)+'%';
    ant.disabled=i===0;sig.disabled=i===s.length-1;
    try{history.replaceState(null,'','#'+(i+1))}catch(e){}
  }
  ant.onclick=function(){ir(i-1)};sig.onclick=function(){ir(i+1)};
  document.getElementById('pdf').onclick=function(){try{window.print()}catch(e){}};
  document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key===' ')ir(i+1);if(e.key==='ArrowLeft')ir(i-1)});
  var x0=null,y0=null;
  document.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
  document.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0,dy=e.changedTouches[0].clientY-y0;
    if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))ir(dx<0?i+1:i-1);x0=null},{passive:true});
  document.querySelector('.portada').addEventListener('click',function(e){if(!e.target.closest('a,button'))ir(1)});
  var h=parseInt((location.hash||'').slice(1),10);ir(h>0?h-1:0);
})();
</script>
</body>
</html>`;
}

export function render404() {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Propuesta no encontrada · ${esc(config.agencia)}</title>
<style>body{font-family:system-ui,sans-serif;background:${config.colores.fondo};color:#fff;display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:20px}</style></head>
<body><div><h1>No encontramos esta propuesta</h1><p>Puede que haya vencido. Escribinos y te armamos una nueva.</p></div></body></html>`;
}
