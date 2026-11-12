# Propuestas de viaje interactivas

Cada presupuesto es un link único (`tusitio.com/p/Xk3mP9aQ2rTz`) que se abre como una presentación de pantallas: portada → vuelos → qué incluye → asistencia → hotel → precio con botón de WhatsApp. Tiene botón PDF, funciona con swipe en el celular y muestra la vista previa con foto cuando se manda por WhatsApp.

Los datos se cargan en un **Google Sheet**. Una fila nueva equivale a una propuesta nueva y no hace falta volver a subir nada.

## Estructura

```
api/p.js              → arma la página de cada propuesta (/p/:id)
lib/render.js         → plantilla visual (HTML + CSS + navegación)
lib/data.js           → lee el Google Sheet (o data/demo.json si no hay Sheet)
config.js             → nombre, colores, WhatsApp de la agencia
data/demo.json        → 2 propuestas de ejemplo
plantilla-sheets/     → CSV para armar las 5 pestañas del Sheet
apps-script/          → menú del Sheet para generar IDs y links
scripts/dev.js        → servidor local de prueba
```

## 1. Probarlo en tu compu

```bash
node scripts/dev.js
# abrir http://localhost:3000/p/demo-margarita-7Kq2
```
Necesitás Node 18 o más nuevo. No hay dependencias que instalar.

## 2. Armar el Google Sheet

1. Creá un Sheet nuevo con **5 pestañas** que se llamen exactamente: `propuestas`, `vuelos`, `incluye`, `coberturas`, `hoteles`.
2. En cada pestaña importá el CSV correspondiente de `plantilla-sheets/` (Archivo → Importar → Reemplazar hoja actual).
3. Compartir → "Cualquier persona con el enlace" → **Lector**. (Ver la nota de privacidad más abajo.)
4. Copiá el ID del Sheet: es lo que va entre `/d/` y `/edit` en la URL.
5. Extensiones → Apps Script → pegá `apps-script/generar-links.gs`, cambiá `BASE_URL` y guardá. Recargá el Sheet y vas a ver el menú **Propuestas**.

### Columnas
- **propuestas**: una fila por presupuesto. Con `activa = no` el link se apaga. `foto` es la URL de una imagen horizontal (ideal 1200×630; es la que aparece en WhatsApp). Completá `sena` + `saldo` para mostrar los dos montos, o solo `total` para mostrar un precio único. `whatsapp` es opcional y sirve si un vendedor usa otro número.
- **vuelos / incluye / coberturas / hoteles**: varias filas por propuesta, vinculadas por `propuesta_id`. Las pantallas sin datos no se muestran.
- Íconos disponibles en `incluye`: `avion`, `escudo`, `bus`, `hotel`, `comida`, `excursion`, `auto`, `barco`, `check`.
- Fechas: `2027-03-04` o `04/03/2027`. Duración, noches y "4 al 11 de marzo" se calculan solos.
- En `coberturas` las primeras 6 se ven directo y el resto queda en "Ver todas las coberturas".

### Flujo diario
1. Cargás la fila en `propuestas` → menú **Propuestas → Generar ID y link**.
2. Copiás el ID en las filas de vuelos, incluye, coberturas y hoteles.
3. **Propuestas → Mensaje para WhatsApp** y se lo mandás al cliente.
Los cambios en el Sheet tardan hasta 1 minuto en verse (caché).

## 3. Publicarlo en Vercel

1. Subí esta carpeta a un repo de GitHub e importalo en vercel.com (no hace falta configurar nada de build).
2. En Settings → Environment Variables cargá:

| Variable | Ejemplo |
|---|---|
| `SHEET_ID` | `1AbC...xyz` |
| `AGENCIA_NOMBRE` | `Viajes Serranos` |
| `WHATSAPP` | `5493511234567` |
| `BASE_URL` | `https://propuestas.viajesserranos.com` |
| `COLOR_FONDO` / `COLOR_FONDO2` / `COLOR_ACENTO` | `#1F4E5F` / `#2E6E73` / `#F28C38` |
| `LOGO_URL` (opcional) | URL de un PNG blanco con fondo transparente |

3. Opcional: en Settings → Domains agregás un subdominio propio (`propuestas.tuagencia.com`).

## Notas
- **Privacidad:** con el Sheet público "con enlace", cualquiera que tenga su ID puede leerlo. El ID nunca aparece en las páginas, pero si querés más resguardo podés pasar a la API de Google Sheets con cuenta de servicio, o mover los datos a Supabase o Airtable. Lo único que habría que cambiar es `lib/data.js`.
- Las páginas llevan `noindex`, así que no aparecen en Google.
- El ID de 12 caracteres aleatorios evita que alguien adivine otras propuestas.
- PDF: el botón usa la impresión del navegador ("Guardar como PDF"), que pone cada pantalla en una hoja horizontal.
- Para medir aperturas se puede sumar Google Analytics o Plausible en `lib/render.js`, o hacer que `api/p.js` registre cada visita en una pestaña del Sheet vía n8n o un webhook.
