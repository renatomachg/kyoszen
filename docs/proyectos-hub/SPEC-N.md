# Proyectos Hub — ENTREGA N: rediseño corporativo de la vista de Espacios (cliente)

Sube el nivel visual del hub de Proyectos en `/revisor` para que se vea **empresarial/consultoría**, no lúdico. El problema principal: los emojis grandes (🎬🎨🧩) se ven infantiles. Los reemplazamos por **íconos de línea monocromáticos** en la paleta de marca y refinamos las tarjetas. Solo frontend, sin tocar APIs/BD/lógica.

Leer: `src/components/revisor/ProyectosCliente.tsx` (vista general de Espacios y encabezados de la vista particular).

Paleta de marca (ya en el proyecto): navy `#042E7B`, blue `#1883FF`, blue-dark `#0A4ECC`, bg `#F8FAFC`. Neutros con sesgo navy: borde `#E6EBF5`, texto muted `#64748B`, eyebrow `#6B7A99`.

## 1. Íconos por tipo (reemplazar emojis)
Crea un helper que devuelva un **SVG de línea** (stroke `currentColor`, `strokeWidth=1.7`, 24×24, `viewBox="0 0 24 24"`) según `espacio.tipo`. **Ignora el campo `icono` (emoji) en el cliente.** Paths sugeridos (estilo Heroicons outline):
- `aprobacion` (Videos de inducción) — cámara de video: `M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z`
- `archivos` (Artes) — carpeta: `M2.25 12.75V12a2.25 2.25 0 012.25-2.25h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.06-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z`
- `tablero` (Plataforma) — columnas kanban: `M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z`
- Fallback (otro tipo) — un ícono neutro tipo cuadrícula.

El ícono va dentro de un **mosaico** de 46×46px, `border-radius: 12px`, fondo `#EAF2FF` (blue-wash), ícono en color navy `#042E7B` a 24px. Nada de emojis.

## 2. Tarjeta de Espacio (vista general) — refinar
- Quitar la **barra azul gruesa superior**. Look limpio: fondo blanco, `border: 1px solid #E6EBF5`, `border-radius: 16px`, `padding: 22px`, sombra sutil `0 1px 2px rgba(4,46,123,.05)`.
- **Hover**: `translateY(-2px)`, borde `#BFD5FF`, sombra `0 14px 30px -16px rgba(4,46,123,.22)`, transición ~160ms. Cursor pointer.
- Estructura interna:
  - Arriba: el mosaico del ícono (izq) y, en la esquina superior derecha, la flecha → dentro de un **botón circular** de 32px (`border: 1px solid #E6EBF5`, ícono muted; en hover del card se tiñe: fondo `#1883FF`, flecha blanca).
  - **Eyebrow**: el tipo en mayúsculas ("APROBACIÓN"/"ARCHIVOS"/"TABLERO") 11px, `letter-spacing:.08em`, weight 700, color `#6B7A99`.
  - **Título** (nombre del espacio): 19px, weight 800, navy, `letter-spacing:-.01em`.
  - **Meta** (conteo): 13px, color `#64748B`, con un puntito o ícono chico opcional. Mantén el texto actual ("N proyectos"/"N archivos"/"N tarjetas").
- Grid responsivo `repeat(auto-fill, minmax(280px, 1fr))`, gap 18px.

## 3. Encabezado de la vista particular — igualar
Cuando entras a un espacio, el encabezado que hoy muestra el emoji + "ARCHIVOS / Artes": usa el **mismo mosaico con ícono SVG** (un poco más grande, ~40px) + eyebrow del tipo + título. El botón "← Espacios" queda igual pero alineado y con buen espaciado.

## 4. Tono general
Sobrio, aire, jerarquía clara. Sin emojis decorativos en esta pantalla. Consistente con una herramienta de consultoría. No cambies la lógica de navegación ni el contenido interno (archivos/tablero/aprobación) más allá del encabezado.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado. Solo frontend del cliente; no toques APIs, BD, admin, ni el flujo de aprobación.
