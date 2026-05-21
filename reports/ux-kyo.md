# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-21
**Cambios analizados:** commits del 2026-05-19 al 2026-05-21

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Testimonials.tsx`
- `src/components/sections/Services.tsx` (dentro de `src/app/servicios/page.tsx`)
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/app/servicios/page.tsx`
- `src/app/contacto/page.tsx`
- `src/app/admin/(panel)/vacantes/_form.tsx`
- `src/app/admin/(panel)/correos/page.tsx`
- `src/lib/analytics.ts`

---

## Cambios Recientes Detectados

- **`b239982`** — `src/app/servicios/page.tsx`: se elimino el bloque `phone` de servicios para resolver error TypeScript en build. Archivo revisado en busca de regresiones de contenido.
- **`f9808f8`** — Correccion ortografica masiva con acentos en ~15 archivos de componentes y lib. Ninguna regresion logica detectada, solo texto.
- **`c63795f`** — 6 nuevas features del panel admin: actividad, contenido, correos (SMTP), cursos form, seo, servidor, testimonios. La correccion mas impactante para candidatos: `src/components/sections/Testimonials.tsx` ahora lee de Supabase en lugar de datos hardcoded, con fallback apropiado.
- **`fa10855`** — SMTP configurable desde el panel admin: `src/lib/smtp-config.ts` + `src/app/api/admin/smtp/route.ts` + las rutas de aplicar y contacto ahora usan config dinamica.

---

## Sugerencias de UX

### Alta prioridad

- **`src/app/admin/(panel)/vacantes/_form.tsx` lineas 42-45 — Taxonomia de jornada/contrato ROTA respecto al sitio publico.**
  El formulario admin define `JORNADAS = ["Tiempo completo", "Medio tiempo", "Por proyecto"]` y `CONTRATOS = ["Indefinido", "Temporal", "Por honorarios"]`. El sitio publico (`src/app/vacantes/page.tsx` lineas 31-32) tiene `CONTRATOS = ["Tiempo completo", "Medio tiempo", "Por proyecto"]` y `JORNADAS = ["Matutina", "Vespertina", "Mixta", "Flexible"]`. Un admin que crea una vacante con `jornada: "Tiempo completo"` genera un registro que el filtro publico "Contrato: Tiempo completo" NO encuentra (el filtro mira `j.contrato`, no `j.jornada`). Resultado: vacantes activas invisibles en los filtros del candidato. Soluciones: sincronizar los arrays del admin con los del sitio publico, o al menos asegurar que cada campo use el mismo vocabulario:
  - En `_form.tsx`, cambiar `CONTRATOS` a `["Tiempo completo", "Medio tiempo", "Por proyecto"]`.
  - Cambiar `JORNADAS` a `["Matutina", "Vespertina", "Mixta", "Flexible"]`.
  - Verificar vacantes existentes en Supabase que tengan valores del vocabulario antiguo y actualizarlas.

- **`src/components/sections/Hero.tsx` lineas 122, 132 — `next/image` en las fotos del hero.**
  Las imagenes `Hero.jpg` y `Hero2.jpg` usan `<Image ... fill ...>` de `next/image`. CLAUDE.md indica explicitamente no usar `next/image` en el VPS. En produccion esto puede romper las fotos silenciosamente. Reemplazar ambos bloques con `<img>` nativo:
  ```tsx
  <img
    src="/images/Hero.jpg"
    alt="Equipo profesional Kyoszen"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
  />
  ```

- **`src/lib/assistant/knowledge.ts` — Kyo recomienda vacantes desactualizadas.**
  `StaticKnowledgeProvider` lee de `src/lib/jobs.ts` (hardcoded), pero toda la gestion de vacantes ya ocurre en Supabase via el panel admin. Si el admin agrega vacante "Auxiliar de ventas" o desactiva "Cajero", Kyo no lo sabe y puede recomendar vacantes inexistentes o ignorar las nuevas. La solucion inmediata sin refactor completo: en `knowledge.ts`, cargar los jobs de Supabase en `listJobs()` igual a como lo hace `src/app/vacantes/page.tsx` linea 69. La arquitectura ya prevé `SupabaseKnowledgeProvider` en el comentario de la linea 166. Impacto critico para la confianza del candidato.

### Media prioridad

- **`src/components/sections/Hero.tsx` linea 63 vs `src/lib/assistant/knowledge.ts` linea 76 — Inconsistencia de estadisticas.**
  El hero dice `+7000 candidatos colocados` (linea 63 del hero, y también en el float card linea 175). El `knowledge.ts` dice `"Candidatos colocados": "687+"`. Kyo responde con 687+ pero la web dice 7000+. Un candidato que le pregunte a Kyo "¿cuantos candidatos han colocado?" recibe 687+, mientras que en la misma pagina ve 7000+. Decidir el numero real y sincronizarlo en ambos archivos. Actualmente 687 en knowledge.ts parece mas cercano a lo real segun el CLAUDE.md ("Candidatos colocados: 687+").

- **`src/app/admin/(panel)/vacantes/_form.tsx` linea 28 — Default de ubicacion incorrecto.**
  El formulario admin usa `ubicacion: "Presencial"` como default, pero el sitio publico no tiene "Presencial" en sus filtros. Los valores publicos son: "CDMX", "Estado de Mexico", "Hibrido", "Remoto". Cambiar el default del form a `ubicacion: "CDMX"` para garantizar que el filtro funcione desde el primer guardado.

- **`src/app/servicios/page.tsx` linea 18 — Copy incorrecto en la seccion de reclutamiento.**
  El segundo split-section de reclutamiento tiene el titulo: `"Recopilamos reseñas de tus mejores candidatos"`. Este copy es incorrecto para una seccion de reclutamiento — parece texto de una seccion de reviews. Reemplazar con algo coherente al servicio, como: `"Presentamos candidatos verificados para tu empresa"`.

- **`src/components/sections/Testimonials.tsx` lineas 26-35 — Carga sin skeleton visible.**
  El componente inicia con `useState(FALLBACK)` y reemplaza los datos cuando llegan de Supabase. Esto es correcto, pero si los datos de Supabase son diferentes a los fallback, el candidato ve un "flash" de contenido (los fallback se renderizan y luego se reemplazan). Cambiar el estado inicial a `useState<Testimonio[] | null>(null)` y mostrar un skeleton de 3 cards mientras `items === null`, luego mostrar los datos reales (o el fallback) una vez que llegue la respuesta.

- **`src/components/sections/Hero.tsx` lineas 97-103 — Avatares de i.pravatar.cc.**
  Los 4 avatares del bloque social proof vienen de un CDN externo. Si cae, el hero muestra imagenes rotas. Reemplazar con 4 `<div>` de colores solidos (p.ej. `bg-blue-400`, `bg-navy`, `bg-yellow`, `bg-blue`) con iniciales en blanco, o usar fotos reales del equipo en `/public/images/`.

### Baja prioridad

- **`src/components/assistant/ChatWidget.tsx` linea 170 — Input sin limite de caracteres.**
  (Pendiente del reporte anterior.) Agregar `maxLength={500}` al input del chat. Sin esto, un usuario puede pegar un texto largo y generar una llamada costosa al modelo.

- **`src/components/assistant/ChatWidget.tsx` lineas 154-163 — Reset sin confirmacion.**
  (Pendiente del reporte anterior.) Agregar confirmacion antes de `reset()`:
  ```tsx
  onClick={() => window.confirm("¿Iniciar nueva conversacion? Se borrara el historial.") && reset()}
  ```

- **`src/app/vacantes/page.tsx` lineas 84-99 — Mutacion de estado durante el render.**
  El bloque `if (prevParams !== params) { setPrevParams(params); setSearch(q); ... }` llama setters de estado durante la fase de render (fuera de un efecto). React puede ejecutar este bloque multiples veces en Strict Mode. Mover toda esa logica a un `useEffect(() => { ... }, [params])` para sincronizar los filtros cuando cambia la URL.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **`src/lib/assistant/system-prompt.ts` linea 56-58 — Cierre (Paso 6) navega a `/contacto` pero deberia navegar a la vacante especifica.**
  El Paso 6 dice: "Invitalo a llenar el formulario de aplicacion. Navega a `/contacto` si acepta." Pero cada vacante ya tiene su propio boton "Aplicar ahora" en `/vacantes/[id]`. Cambiar la instruccion para que Kyo navegue a `/vacantes/[id]` de la vacante que el candidato eligio en el Paso 5, no a `/contacto`. El candidato llega directo al modal de aplicacion de esa vacante especifica. Impacto directo en tasa de conversion.
  Instruccion corregida:
  ```
  ## Paso 6 — CIERRE
  Cuando el candidato elija una vacante, usa navigate_to con la ruta /vacantes/[id]
  de esa vacante. El candidato encontrara el boton "Aplicar ahora" directamente.
  Si no hay vacante compatible, navega a /contacto para el banco de talentos.
  ```

- **`src/lib/assistant/system-prompt.ts` lineas 31-46 — Flujo no maneja respuestas multiples en un solo mensaje.**
  (Pendiente del reporte anterior.) Si el candidato escribe todo de golpe ("busco trabajo de ventas en CDMX, tiempo completo, tengo 2 años"), Kyo hace preguntas redundantes. Agregar instruccion despues del Paso 0:
  ```
  IMPORTANTE: Si el candidato proporciona voluntariamente datos de varios pasos
  en un solo mensaje, absorbe esa informacion sin repetir preguntas ya respondidas.
  Avanza directamente al primer dato faltante o al Paso 5 si ya tienes todo.
  ```

- **`src/lib/assistant/system-prompt.ts` linea 52 — Formato del Paso 5 sin salario.**
  (Pendiente del reporte anterior.) El formato de recomendacion no incluye el salario, que es el dato #1 que evalua un candidato. El system-prompt ya tiene el salario disponible en la lista de vacantes. Cambiar el formato de:
  ```
  1. [Nombre del puesto] — [Empresa] — [Por que le aplica]
  ```
  A:
  ```
  1. [Nombre del puesto] — [Empresa] — $[salario]/mes — [Por que le aplica]
  ```

- **`src/lib/assistant/knowledge.ts` linea 99 — FAQs incompletas comparado con el sitio publico.**
  (Pendiente del reporte anterior.) La FAQ "¿Que documentos necesito para aplicar?" existe en el sitio pero no en `knowledge.ts`. Kyo no sabe como responderla. Agregar a `COMPANY.faqs`:
  ```typescript
  { q: "¿Que documentos necesito para aplicar?", a: "Acta de nacimiento, comprobante de domicilio (max 3 meses), ID oficial, CURP, numero de seguridad social y constancia de situacion fiscal." }
  ```

### Nuevas tools o capacidades recomendadas

- **`src/lib/assistant/tools.ts` — Tool `search_jobs` sin filtros de contrato ni jornada.**
  (Pendiente del reporte anterior.) En el Paso 4, Kyo pregunta disponibilidad pero `search_jobs` no tiene `contract` ni `schedule`. Agregar a la definicion:
  ```typescript
  contract: { type: "string", description: "Filtra por contrato: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" },
  schedule: { type: "string", description: "Filtra por jornada: 'Matutina', 'Vespertina', 'Mixta', 'Flexible'" },
  ```
  Y en `knowledge.ts > listJobs`, agregar los filtros correspondientes.

- **Quick replies / chips de respuesta rapida.**
  (Pendiente del reporte anterior.) En los pasos donde las respuestas son predecibles (Paso 3: ubicacion, Paso 4: disponibilidad), agregar `suggestions?: string[]` a `ChatMessage` y renderizarlos en `ChatWidget.tsx` como botones clicables. Reduce friccion especialmente en mobile.

### Problemas detectados

- **`src/app/api/assistant/chat/route.ts` linea 122 — `max_tokens: 1024` puede truncar el Paso 5.**
  (Pendiente del reporte anterior.) Con 2-3 vacantes mas salario mas razon de match, el mensaje del Paso 5 puede acercarse al limite. Cambiar a `max_tokens: 2048`. Costo marginal con Haiku minimo.

- **`src/components/assistant/useChat.ts` lineas 109-112 — Navegacion forzada sobreescribe estado de filtros.**
  (Pendiente del reporte anterior.) Si el candidato ya esta en `/vacantes` y Kyo navega a `/vacantes?ubicacion=CDMX`, `router.push` lo trata como nueva ruta y reinicia el estado local de filtros. Cambiar a `router.replace(target.path)` para navegaciones dentro de la misma ruta base.

- **`src/components/assistant/useChat.ts` lineas 24-33 — Historial persiste indefinidamente.**
  (Pendiente del reporte anterior.) El historial en `localStorage` no tiene TTL. Un candidato que regresa despues de semanas ve vacantes que ya no existen. Agregar expiracion de 7 dias en `loadHistory()`:
  ```typescript
  const last = parsed[parsed.length - 1];
  if (last && Date.now() - last.timestamp > 7 * 24 * 60 * 60 * 1000) return [INITIAL_GREETING];
  ```

---

## Oportunidades de mejora general

- **Conectar Kyo a Supabase para vacantes en tiempo real.**
  Este es el cambio de mayor impacto posible para Kyo. El `StaticKnowledgeProvider` en `knowledge.ts` lee de `JOBS` hardcoded. La arquitectura ya previo esto: el comentario en linea 166 dice "In phase 2, a SupabaseKnowledgeProvider will replace this". Implementar una version simple que en `listJobs()` haga un `supabase.from("vacantes").select(...).eq("activa", true)`. Referencia de query: identica a `src/app/vacantes/page.tsx` linea 69. Sin este cambio, cualquier vacante creada por el admin es invisible para Kyo.

- **Badge de notificacion en el boton de Kyo cuando esta cerrado.**
  (Pendiente del reporte anterior.) Agregar un punto rojo (`w-3 h-3 bg-red-500 rounded-full absolute -top-0.5 -right-0.5`) visible cuando `messages.length > 0 && !open`. Aumentaria significativamente la tasa de apertura del chat.

- **Auto-abrir Kyo en `/vacantes` para primeras visitas.**
  (Pendiente del reporte anterior.) En `ChatWidget.tsx`, verificar con `sessionStorage` si el usuario ya abrio el chat. Si esta en `/vacantes` y no lo ha hecho, hacer `setOpen(true)` automaticamente despues de 4 segundos. Usar `usePathname()` para detectar la ruta.

- **`src/lib/assistant/knowledge.ts` linea 60-67 — El blog no esta en `SITE_PAGES`.**
  (Pendiente del reporte anterior.) La ruta `/blog` existe pero no esta listada en `SITE_PAGES`. Kyo no sabe que el blog existe ni puede navegar a el. Agregar:
  ```typescript
  { path: "/blog", title: "Blog", purpose: "Articulos y recursos de RRHH", summary: "Contenido sobre reclutamiento, liderazgo y tendencias del mercado laboral mexicano." },
  ```

- **Validacion de telefono en el modal de aplicacion.**
  (Pendiente del reporte anterior.) `AplicarModal.tsx` acepta cualquier valor en el campo tel. Agregar `pattern="[0-9\s\-\+]{10,15}"` para validar antes de enviar. Sin numero valido, el reclutador no puede contactar al candidato.

---

## Resumen de pendientes del reporte anterior (2026-05-20)

Los siguientes puntos del reporte anterior siguen sin implementarse:
- `next/image` → `<img>` nativo en Hero (alta prioridad)
- `max_tokens: 1024` → 2048 en el route de chat
- Historial con TTL de 7 dias en `useChat.ts`
- `router.push` → `router.replace` en navegaciones de Kyo
- Salario en formato de recomendacion del Paso 5
- Quick replies / chips en el chat
- Tool `search_jobs` con filtros de contrato/jornada
- Blog en `SITE_PAGES`
- Badge de notificacion en boton del chat
- Validacion de telefono en AplicarModal
