# Revisor — ENTREGA O: rediseño corporativo consistente de todo el portal

El cliente aprobó el look corporativo de la pestaña Proyectos (Entrega N). Ahora aplica el MISMO lenguaje al resto del `/revisor`, sobre todo la pestaña **Publicaciones**, para quitar el aire lúdico (emojis en pestañas y píldoras). **Solo cambios visuales: preserva TODA la lógica, handlers, estados, filtros y los atributos `data-*` que usa el tour** (`data-fpill`, `data-fred`, `data-novedad`, etc.).

Archivos: `src/app/revisor/page.tsx` (principal) y, si tiene emojis lúdicos, `src/components/revisor/InformeCliente.tsx` (pestaña Análisis — NO rehagas su diseño editorial, solo alinéalo).

Paleta: navy `#042E7B`, blue `#1883FF`, blue-dark `#0A4ECC`, bg `#F8FAFC`. Neutros: borde `#E6EBF5`, muted `#64748B`, eyebrow `#6B7A99`. Semánticos (estado): verde `#16A34A`, ámbar `#D97706`, rojo `#DC2626`, slate `#64748B`.

Convención de íconos: SVG de línea, `stroke="currentColor"`, `strokeWidth=1.7`, `viewBox="0 0 24 24"`. Crea un pequeño helper local `IconoRevisor({name})` con los paths necesarios.

## 1. Pestañas (Publicaciones / Proyectos / Análisis) — línea ~1077
Quita los emojis del label. Cada pestaña = **ícono de línea + texto**. Paths:
- Publicaciones (documento): `M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z`
- Proyectos (film): `M3.75 3v18M20.25 3v18M3.75 7.5h16.5M3.75 12h16.5M3.75 16.5h16.5M7.5 3v18M16.5 3v18`
- Análisis (barras): `M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z`
Refina el control segmentado: fondo `#F1F5F9`, pestaña activa navy con texto blanco (como está), inactivas texto muted; radios y padding consistentes.

## 2. Píldoras de stats (Total/Aprobados/Pendientes/Con cambios) — líneas ~1096-1100
Quita los emojis (📅✅⏱️🔴). Cada píldora: un **punto de color** (círculo 8px) + número (bold) + label. Colores del punto: Total = slate `#64748B`, Aprobados = verde `#16A34A`, Pendientes = ámbar `#D97706`, Con cambios = rojo `#DC2626`. Píldora blanca con `border:1px solid #E6EBF5`, redondeada; la activa (filtro seleccionado) con borde/fondo tenue del color semántico. **Conserva los `data-fpill` y el onClick de filtrado.**

## 3. Filtros de red (Todas / Facebook / TikTok)
Deja los logos de marca de Facebook/TikTok (son legítimos). Solo unifica el estilo de píldora (borde, radios, estado activo) con el resto. Conserva `data-fred` y handlers.

## 4. Tarjetas de Publicación y detalle
- El ícono fallback de red (🎬 TikTok / 📝 Facebook, ~línea 1237): reemplázalo por un ícono de línea (video para TikTok, documento para Facebook) o el logo de marca chico. Nada de emoji.
- Botones de acción en el detalle "✅ Aprobar" / "🔴 Necesito cambios" (~líneas 292-298): quita los emojis; usa botones limpios — Aprobar en verde sólido con un check de línea, "Necesito cambios" en botón neutro/outline. Conserva el texto de estado y los handlers.
- El badge "● Aprobado/Pendiente" de la tarjeta ya usa punto de color: mantenlo, solo asegúrate que sea consistente (punto + texto, sin emoji).
- "✨ Nueva propuesta"/"✨ NUEVA": puedes conservar el destacado pero cámbialo a un chip limpio sin la estrella emoji (texto "NUEVA PROPUESTA" en chip azul), o un pequeño ícono de línea. Opcional pero preferible.

## 5. Encabezado
"❔ Guía de uso" (~línea 1066): reemplaza el emoji por un ícono de línea de interrogación en círculo. Conserva el onClick que abre la guía.

## 6. Tour / coach-marks (líneas ~600-638, ~819-822)
La lógica del tour NO se toca. Los emojis dentro de los pasos del tour son secundarios (popovers): puedes dejarlos o cambiarlos a íconos chiquitos; **no es prioritario y no debe romper el tour**.

## Reglas
- No elimines emojis que sean **contenido real** del cliente (captions/textos de las publicaciones). Esos se quedan.
- No cambies lógica, nombres de estado, endpoints ni los `data-*`. Es una capa visual.
- Mantén responsivo y el comportamiento de Semana/Mes, flechas, filtros y modales.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado.
