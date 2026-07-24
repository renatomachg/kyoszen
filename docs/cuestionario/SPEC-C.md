# ENTREGA C — Admin: leer respuestas + generar invitaciones

Construye la pantalla de administración para el módulo cuestionario. Reusa Entrega A (`src/lib/cuestionario`) y NO toques el portal público ni sus APIs (Entrega B) salvo lo indicado. NO modifiques `preguntas.json`.

Leer primero: `CLAUDE.md`, y para copiar el patrón del admin mira `src/app/admin/(panel)/layout.tsx` (array `NAV` + sidebar) y `src/app/admin/(panel)/contactos/page.tsx` (página client que lee con el cliente `supabase` de `@/lib/supabase`, estilos Tailwind con tokens `navy`, `yellow`, `bg`, `border`, `muted`, `blue`, `blue-soft`, `rounded-2xl`, etc.).

Convención del proyecto: en el admin las LECTURAS se hacen directo con el cliente `supabase` (RLS permisivo). Las ESCRITURAS sensibles van por API con service_role. Español de México. `<img>` nativo. TypeScript estricto.

## 1. Helpers reutilizables (agregar a `src/lib/cuestionario/index.ts`, SOLO agregar, no romper lo existente)
- `etiquetaRespuesta(pregunta: Pregunta, valor: string | string[] | undefined): string` — mapea value→label usando `pregunta.opciones`; multi unido por " · "; text devuelve el texto; vacío devuelve "".
- `resumenPorSeccion(resp: Respuestas): { seccion: string; items: { pregunta: Pregunta; etiqueta: string }[] }[]` — agrupa las `preguntasVisibles(resp)` por `seccion`, con su etiqueta ya resuelta.
- `contarRespondidas(resp: Respuestas): { respondidas: number; total: number }` — de las preguntas visibles, cuántas tienen respuesta real (usa una versión de "respondida" que para text considere respondida solo si hay texto no vacío; NO uses `estaRespondida` que da true a todo text/opcional). Llama a esta lógica local `tieneValor(pregunta, resp)`.

## 2. API admin: `src/app/api/admin/cuestionario/route.ts` (service_role, runtime nodejs)
- `GET` → lista todas las filas de `cuestionario_respuestas` (`token, invitado_nombre, respuestas, paso_actual, completado, enviado_en, created_at, updated_at`) ordenadas por `updated_at` desc. Devuelve `{ invitaciones: [...] }`.
- `POST` (crear invitación) → body `{ invitado_nombre: string, token?: string }`.
  - Si no viene `token`, genera un slug del nombre (minúsculas, sin acentos, espacios→guiones, solo `[a-z0-9-]`). Si el slug ya existe, agrega sufijo `-2`, `-3`, etc. hasta que sea único.
  - Inserta la fila `{ token, invitado_nombre }`. Devuelve `{ token, invitado_nombre }`. Valida `invitado_nombre` no vacío (400 si falta).
- `DELETE` → body `{ token: string }` → borra esa invitación. Devuelve `{ ok: true }`.
- Maneja errores con status correctos y try/catch.

## 3. NAV en `src/app/admin/(panel)/layout.tsx`
Agrega UNA entrada al array `NAV`, en el grupo de abajo (después del `divider`, cerca de "Redes Sociales"):
`{ href: "/admin/cuestionario", label: "Cuestionarios", icon: "<un path de heroicons tipo clipboard/lista>" }`.
Usa un `icon` (path SVG) coherente con los demás (clipboard-list o similar). No rompas el array ni los badges.

## 4. Página `src/app/admin/(panel)/cuestionario/page.tsx` ("use client")
Diseño estilo panel Kyoszen (mismos tokens Tailwind que contactos). Contenido:

**Encabezado**: título "Cuestionarios", subtítulo con conteo (ej. "2 invitaciones · 1 completada").

**Botón "＋ Nueva invitación"**: abre un formulario chico (input nombre + opcional token) → POST a la API → refresca la lista. Al crearse, muestra el link listo para copiar.

**Lista de invitaciones** (una tarjeta/fila por fila):
- Nombre del invitado + su `token`.
- Pill de estado: `Completado` (verde) si `completado`; `En progreso` (azul) si tiene respuestas pero no completado; `Sin empezar` (gris) si `respuestas` vacío.
- Progreso "X de Y respondidas" usando `contarRespondidas(respuestas)`.
- Fecha (updated_at o enviado_en) formateada en español.
- Botón "Copiar link" → copia `${origin}/cuestionario/${token}` al portapapeles (usa `window.location.origin`), con feedback "¡Copiado!".
- Botón "Ver respuestas" → abre detalle (panel lateral o modal).
- Botón borrar (con confirm) → DELETE.

**Detalle de respuestas** (al seleccionar una invitación):
- Encabezado con nombre + estado + fecha de envío si existe.
- Usa `resumenPorSeccion(respuestas)` para mostrar cada sección con sus preguntas y la respuesta legible; las sin responder en gris con "Sin responder".
- Debe leerse bien y ordenado (como un reporte para Renato).

Lectura de la lista: puedes usar el cliente `supabase` directo (`supabase.from("cuestionario_respuestas").select(...)`) como en contactos, o llamar al `GET` de la API. Elige uno y sé consistente. Las escrituras (crear/borrar) SIEMPRE por la API.

## Cierre
- Corre `npm run build -- --webpack` (Turbopack no resuelve node_modules en este worktree para build) o `npx tsc --noEmit`, y arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. No toques nada fuera de lo listado.
