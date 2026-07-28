# Admin barrido — TANDA 1: Redes Sociales (corporativo)

Aplica el look corporativo (Entregas N/O/P) al admin de **Redes Sociales**. Es un módulo grande y en uso (calendario, importadores, informe, storyboard, archivado). **CAMBIO QUIRÚRGICO Y SOLO VISUAL:** reemplaza emojis decorativos por íconos de línea / puntos de color; **NO toques NADA de lógica, estado, handlers, drag-and-drop, navegación de calendario, importadores, publicar/archivar, ni atributos `data-*`.** Si dudas si algo es lógica, no lo toques.

Archivos: `src/app/admin/(panel)/redes-sociales/page.tsx` (principal, ~2011 líneas), `src/components/admin/InformeAdmin.tsx`, `src/components/social/StoryboardView.tsx`.

Identidad: se conserva sidebar navy + **amarillo `#FFCC00`** para CTAs primarios. Semánticos: verde `#16A34A`, ámbar `#D97706`, rojo `#DC2626`, slate `#64748B`. Íconos: SVG de línea `stroke=currentColor`, `strokeWidth=1.7`, `viewBox="0 0 24 24"`. Crea un helper local `IconUI({name, size})` con los íconos que necesites (Heroicons-style) y úsalo en lugar de los emojis.

## Mapeo emoji → reemplazo (aplica en los 3 archivos)
- 🎬 / 📹 (TikTok/video) → ícono **video**; 📘 / 📝 (Facebook/post) → ícono **documento**. (En chips de red, si ya se usa el logo de marca, déjalo.)
- ✅ / ✓ / 👍 (aprobado/ok) → ícono **check**; para estados usa **punto de color** + texto (verde aprobado, ámbar pendiente, rojo cambios).
- ✏️ (editar) → **lápiz**; 🗄️ (archivar) → **caja de archivo**; 🛠️ (guía técnica) → **llave/herramienta**; 📋 (propuesta/clipboard) → **clipboard**; 📊 (análisis) → **barras**; 🎯 → **diana**; 🌐 → **globo**; 👁️ → **ojo**; 💬 (comentarios) → **burbuja**; 📎 (adjuntos) → **clip**; 📅 (fecha) → **calendario**; 📥/📤 (importar/publicar) → **flecha abajo/arriba** o **nube**; 📨 → **sobre**; 🖼️/🎨 → **imagen**.
- ✨ "Nueva propuesta"/"NUEVA" → chip limpio **"NUEVA"** (azul suave, sin estrella) o un ícono chico; nada de ✨.
- ✕ (cerrar) → deja una **×** tipográfica limpia o un ícono x-mark; es control, mantén su onClick.
- Cualquier emoji **puramente decorativo** en títulos/tabs → quítalo o cámbialo por el ícono que corresponda.

## Objetivos por zona (todo dentro de page.tsx salvo lo indicado)
- **Tabs** (Calendario / Importar / Informe / Configuración): ícono de línea + texto, subrayado/relleno activo consistente.
- **Botones** (crear publicación, publicar al cliente, editar, importar, archivar video, subir): sin emoji; texto claro + ícono de línea; primarios en amarillo, secundarios outline.
- **Píldoras/badges de estado** (borrador, pendiente/aprobado/cambios, "NUEVA"): punto de color + texto, chips limpios.
- **Calendario** (vista semana/mes): los chips de evento y sus indicadores de red/estado con punto de color + ícono de red de línea; conserva el drag-and-drop, las flechas ‹ › como drop-targets y toda la lógica de mover/seguir fecha.
- **InformeAdmin.tsx** y **StoryboardView.tsx**: mismo criterio; en Storyboard, los cuadros por tipo (hook/normal/cta) conservan sus colores, solo cambia cualquier emoji por ícono/etiqueta.

## Reglas duras
- No renombres funciones/variables/estados, no muevas lógica, no cambies fetch/endpoints, no toques `useEffect`/handlers.
- No elimines emojis que sean **contenido real** (captions/textos de publicaciones del cliente).
- Mantén responsivo y todo el comportamiento (semana/mes, importadores, modales, archivado).

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado. Verifica que NO quede emoji decorativo en los 3 archivos (los de contenido real del cliente sí pueden quedar).
