# Admin — ENTREGA P: rediseño corporativo del admin de Proyectos

Aplica el look corporativo (Entregas N/O) al **admin de Proyectos**, para que combine con el cliente. Mantén la **identidad del panel admin**: sidebar navy + acento **amarillo `#FFCC00`** para botones primarios (eso NO es infantil, es la marca). Lo que quitamos son los **emojis decorativos** y estandarizamos íconos/tarjetas/píldoras. **Solo visual: preserva toda la lógica, handlers, estados, endpoints.**

Archivos: `src/app/admin/(panel)/proyectos/page.tsx` y `src/components/admin/TableroAdmin.tsx`.

Paleta/íconos: igual que Entrega N. SVG de línea `stroke=currentColor`, `strokeWidth=1.7`, `viewBox="0 0 24 24"`. Crea/uso un helper `IconoEspacio({tipo})` con los mismos paths que en el cliente:
- `aprobacion` (cámara video): `M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z`
- `archivos` (carpeta): `M2.25 12.75V12a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z`
- `tablero` (columnas): `M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z`
Además: carpeta chica (folder), documento, subir (upload cloud) para otros usos.

## Cambios
1. **Pestañas "Proyectos / Espacios"**: quita los emojis; usa ícono de línea + texto. Refina el subrayado activo.
2. **Tarjetas de espacio** (lista): reemplaza el emoji del campo `icono` por el **mosaico con SVG por tipo** (blue-wash `#EAF2FF`, ícono navy), como en el cliente. Eyebrow del tipo, título navy, meta ("N proyectos · N archivos · N tarjetas") en muted. Badge "Publicado" limpio (chip verde suave). Quita el borde azul grueso superior; usa borde `#E6EBF5` + sombra sutil.
3. **Formulario "Nuevo espacio"**: **elimina el campo "Ícono" (emoji)** — el ícono ahora se deriva del tipo automáticamente (muestra un preview del ícono del tipo elegido, de solo lectura). Conserva Nombre, Tipo, Color y "Publicar al crear". Botón primario "+ Crear espacio" en amarillo (marca). (Nota: el campo Color hoy no lo usa el cliente; puedes dejarlo por ahora.)
4. **Modal de espacio Artes** (~línea 799): título con el ícono de tipo (no 🎨). Botón "Nueva carpeta" sin el emoji 🗂 (amarillo, con un ícono de carpeta+ de línea). Tarjetas de carpeta con **ícono de carpeta de línea** (no emoji 📁), acciones Renombrar/Eliminar limpias. Zona de subir igual (drag-and-drop) sin emoji decorativo.
5. **Bandeja "Por corregir" / estados** (íconos 🔴🟢🎬📁 en ~1023, 1091, 1253-1258): reemplaza por **puntos de color** (rojo/verde) y **íconos de línea** (video/carpeta/documento). Botones con emojis (📤 publicar, 🔄, ✏️, 📎): quita el emoji, deja texto claro + ícono de línea opcional. Primarios en amarillo.
6. **TableroAdmin.tsx** (🧩 ~453 y demás): quita emojis; columnas/tarjetas con estilo limpio, íconos de línea, botones consistentes.

## Reglas
- No toques la lógica de importar guion, aprobación por escena, subir/mover archivos, carpetas, tablero, ni los endpoints.
- Mantén el acento amarillo para CTAs primarios (identidad del panel). Semánticos: verde `#16A34A`, ámbar `#D97706`, rojo `#DC2626`.
- Responsivo y funcional igual que antes.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado.
