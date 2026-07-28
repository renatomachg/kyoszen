# Proyectos Hub — ENTREGA M: miniaturas de archivo en formato vertical

Ajuste visual a las miniaturas de archivo del espacio Artes (cliente y admin). Hoy el área de preview de la tarjeta es horizontal, así que un PDF vertical solo muestra su parte superior. Queremos que la miniatura se vea en **formato vertical (tipo hoja)** mostrando la página completa. Solo frontend, sin tocar APIs/BD/lógica.

Leer: la UI de tarjetas de archivo que quedó en Entrega L en `src/components/revisor/ProyectosCliente.tsx` (vista cliente Artes) y `src/app/admin/(panel)/proyectos/page.tsx` (gestor admin de archivos).

## Cambios
1. **Área de miniatura en vertical**: cambia el contenedor de preview de cada tarjeta a proporción **vertical de documento**, `aspect-ratio: 1 / 1.294` (tamaño carta/A4 vertical) — o el más cercano que ya uses. Fondo neutro claro (gris muy suave), esquinas redondeadas, `overflow: hidden`.
2. **PDF**: en el `<iframe>` de miniatura, usa el fragmento `#toolbar=0&navpanes=0&scrollbar=0&view=Fit` (que la **página completa** entre en el marco, no `FitH` que la recorta). Mantén `pointer-events: none` y `loading="lazy"`.
3. **Imágenes**: `object-fit: contain` (no `cover`) centrada sobre el fondo neutro, para que una imagen vertical se vea completa sin recorte.
4. **Grid**: como las tarjetas ahora son más angostas/altas, ajusta el grid para que quepan bien (p. ej. columnas de ~200–240px con `repeat(auto-fill, minmax(...))`), manteniéndose responsivo. El nombre + pill de estado quedan **debajo** de la miniatura, como ahora.
5. El **visor grande** (modal al hacer clic) NO cambia — ahí el PDF se ve completo con su visor nativo. Este ajuste es solo la miniatura de la tarjeta.

Aplica el mismo criterio en el cliente y en el admin para que se vean igual.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado. No toques APIs, BD, Tablero, aprobación ni cuestionario.
