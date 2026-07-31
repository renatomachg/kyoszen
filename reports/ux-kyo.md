# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-31
**Cambios analizados:** Sin commits de código en las últimas 48 h (solo los dos reportes anteriores). Los 5 bloqueadores críticos siguen sin corregirse. Se agregan 4 hallazgos nuevos no reportados antes.

---

## Cambios Recientes Detectados

Últimos commits relevantes de código:
- `b21cdcf` — feat(proyectos): switch 'requiere aprobación' por archivo en Artes (`src/lib/proyectos.ts`, `ProyectosCliente.tsx`, APIs de archivos)
- `79eecc8` — feat(proyectos): botón 'Vista cliente' en Centro de Proyectos + deep-link `?tab=` en el revisor (`src/app/admin/(panel)/proyectos/page.tsx`, `src/app/revisor/page.tsx`)

---

## Sugerencias de UX

### Alta prioridad

- **[REITERO — Crítico] [src/lib/assistant/knowledge.ts:1] Kyo recomienda vacantes del array estático `JOBS`, no de Supabase.**
  `knowledge.ts` importa `{ JOBS }` de `@/lib/jobs`. Supabase tiene el inventario real de vacantes activas; `jobs.ts` tiene datos de demo que ya no reflejan producción. Un candidato que sigue la recomendación de Kyo y llega a una vacante inexistente es una conversión perdida. **Fix:** crear endpoint `GET /api/assistant/jobs` con service_role que lea `SELECT id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion FROM vacantes WHERE activa=true`. Actualizar `executeTool` en `tools.ts` para hacer `fetch('/api/assistant/jobs')` en `search_jobs` y `get_job_details`. Cache 5 min en memoria (mismo patrón de `getStoredInstrucciones` en `route.ts:8-31`).

- **[REITERO — Crítico] [src/app/api/assistant/chat/route.ts:151] `max_tokens: 1024` trunca la respuesta del Paso 5.**
  El Paso 5 muestra 2-3 vacantes con nombre, empresa, razón de compatibilidad y pregunta de cierre. Con el tool_result de `search_jobs` en el contexto, la respuesta útil puede ocupar 700-900 tokens — el límite actual la corta. **Fix:** cambiar línea 151 a `max_tokens: 2048`. Costo adicional con Haiku: ~$0.00015 por conversación completa, despreciable.

- **[REITERO] [src/components/assistant/useChat.ts:127] El chat de Kyo se cierra al navegar — el candidato pierde el contexto.**
  `router.push(target.path)` en `useChat.ts:127` causa re-montaje de `ChatWidget`. El estado `open` vuelve a `false` y el candidato llega a `/vacantes` sin el chat. **Fix:** guardar `open=true` en `localStorage('kyoszen_kyo_open')` antes de la navegación y restaurarlo en el `useEffect` de montaje de `ChatWidget.tsx`.

- **[REITERO] [src/app/revisor/page.tsx:975-980] Deep-link `?tab=proyectos` se pierde cuando la revisora no tiene sesión activa.**
  El `useEffect` (líneas 975-980) lee el `?tab=` una sola vez al montar. Si la sesión ha expirado, el guard de auth redirige a `/revisor` (sin el param) y el tab se pierde. **Fix:** en el `useEffect` de auth, ANTES de redirigir al login, guardar `window.location.href` completo en `sessionStorage('revisor_pending_url')`. Al completar el login, leer ese valor y hacer `router.replace(pendingUrl)`.

### Media prioridad

- **[NUEVO] [src/lib/assistant/knowledge.ts:141] El filtro de ubicación usa igualdad exacta (`===`) — "Estado de Mexico" falla si el modelo escribe "Mexico" o "Edo. Mex.".**
  Línea 141: `.filter((j) => !filters?.location || j.ubicacion.toLowerCase() === filters.location.toLowerCase())`. Si el modelo pasa `"mexico"` o `"estado de méxico"` (con tilde), el filtro devuelve 0 resultados silenciosamente. El filtro de `query` ya usa `.includes()` (línea 110). **Fix:** cambiar la línea 141 a:
  ```ts
  .filter((j) => !filters?.location || j.ubicacion.toLowerCase().includes(filters.location.toLowerCase()))
  ```
  Misma corrección para `listCourses` línea 121 (modalidad usa `===`).

- **[NUEVO] [src/components/assistant/useChat.ts:15 vs route.ts:131] Se almacenan 30 mensajes en localStorage pero el API solo envía los últimos 20.**
  `MAX_STORED = 30` en `useChat.ts:15` guarda hasta 30 mensajes. El API los recorta a 20 (`history = body.messages.slice(-20)` en `route.ts:131`). Los mensajes 21-30 del storage nunca se envían al modelo, pero sí se muestran en pantalla al usuario — generan la impresión de que Kyo "recuerda" más de lo que realmente recuerda. **Fix:** alinear los dos valores: cambiar `MAX_STORED` a `20`, o documentar el límite con un comentario junto al slice del API para que futuras ediciones no los desincronicen.

- **[src/lib/assistant/system-prompt.ts:85-88] Filtros `?marca=` referencian empresas del mock — producen 0 resultados en Supabase.**
  Las líneas 85-88 documentan `/vacantes?marca=Sigma Retail`, `Grupo Corpora`, etc. En Supabase, los nombres de empresa son los de las vacantes reales. Kyo puede generar URLs con esos valores que muestran lista vacía al candidato. **Fix temporal:** eliminar las 6 líneas de ejemplos `?marca=` del system prompt hasta que se confirmen los valores reales en Supabase.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[NUEVO] [src/lib/assistant/system-prompt.ts:22-23] El Paso 0 no maneja el caso de que el candidato salude sin dar su nombre.**
  Línea 22: "Cuando el usuario responda, agradece y continua al paso 1." Si el usuario responde "hola" o "¿cómo estás?", el modelo puede interpretar que ya dio su nombre e ir al Paso 1. **Fix:** añadir al Paso 0: "Si la respuesta no incluye un nombre claro, vuelve a preguntar de forma natural: '¿Me podría dar su nombre para atenderle mejor?'"

- **[src/lib/assistant/system-prompt.ts:43-50] El Paso 5 no indica cuántas vacantes hay en total — el candidato no sabe si le ofrecen lo mejor de 2 o de 20.**
  **Fix:** cambiar el template a: `"De las [N] vacantes activas, estas se ajustan mejor a su perfil, [nombre]:"`. El conteo viene de `jobsSummary.length` que ya está en el system prompt (línea 137 del archivo compilado).

- **[src/lib/assistant/system-prompt.ts:55-58] Cuando no hay vacante compatible, Kyo dirige a `/contacto` sin preparar al candidato para el formulario.**
  El formulario de `/contacto` es genérico. El candidato llega sin saber qué escribir. **Fix (system prompt):** añadir antes del `navigate_to`: "Cuando llegues al formulario, en el campo 'Mensaje' escribe 'Banco de talentos' — así el equipo sabe que quieres que te avisemos cuando surja una vacante compatible."

### Nuevas tools o capacidades recomendadas

- **Tool: `register_candidate_interest`** — Cuando no hay vacante compatible (Paso 5 fallido), en vez de redirigir a `/contacto` genérico, una tool que reciba nombre, puesto buscado y contacto podría insertar directamente en la tabla `aplicaciones` o `crm_candidatos` con `origen='kyo'`. Esto convierte el "no hay vacante" en un lead calificado sin fricción de formulario.

- **Tool: `list_active_vacancies_summary` (lazy)** — El system prompt incluye todas las vacantes en cada mensaje (línea 137-138 del prompt compilado), lo cual gasta tokens en los Pasos 0-4 donde aún no se necesitan. Mover la lista a una tool que Kyo llame solo en el Paso 5 reduciría el costo por conversación en ~25-30% y permitiría incluir más vacantes sin truncar el contexto.

### Problemas detectados

- **[REITERO] [src/lib/assistant/knowledge.ts:2] Kyo lee vacantes estáticas — puede recomendar puestos inexistentes en producción.**
  Ver "Alta prioridad" arriba. Es el bug más urgente del asistente.

- **[NUEVO] [src/components/assistant/useChat.ts:14] El historial de chat persiste indefinidamente — un candidato que regresa semanas después ve una conversación obsoleta.**
  `loadHistory()` no verifica timestamps de expiración. Si los mensajes guardados tienen más de 7 días, el contexto es irrelevante (vacantes ya cerradas, nombre ya no recordado). **Fix:** en `loadHistory()`, después de parsear, verificar: `if (parsed[0]?.timestamp && Date.now() - parsed[0].timestamp > 7 * 86400000)` → limpiar storage y retornar `[INITIAL_GREETING]`.

- **[src/app/api/assistant/chat/route.ts:68-80] Rate limiter en memoria — inefectivo si hay múltiples instancias del proceso.**
  El comentario en línea 68 lo documenta. Con PM2 en el VPS corriendo 1 instancia es suficiente hoy. Si se escala a 2 instancias (p.ej. para reducir downtime en deploy), el límite sería 30 msg/min por instancia = 60 efectivos. Bajo riesgo actual; documentado aquí para cuando se escale.

---

## Oportunidades de mejora general

- **[NUEVO] `executeTool` en `tools.ts:85` se declara `async` pero no usa `await` en ningún caso.** Todos los casos del `switch` son síncronos (leen arrays en memoria). La infraestructura async está lista para cuando se migre a `SupabaseKnowledgeProvider` — bien diseñado. Solo asegurarse de que el migration de knowledge a Supabase también sea `await`-ed correctamente en cada case.

- **El widget de Kyo no reabre el foco al volver de una navegación.** Cuando Kyo navega al candidato a `/vacantes` y el chat sobrevive (una vez aplicado el fix de `open` en localStorage), el foco del teclado queda en el `<body>`. **Fix:** en el `useEffect` de restauración de `open`, llamar `setTimeout(() => inputRef.current?.focus(), 300)`.

- **Las pestañas del revisor no tienen atributos ARIA.** El nav de secciones (`publicaciones` / `proyectos` / `resultados`) usa `<button>` sin `role="tab"` ni `aria-selected`. Lectores de pantalla no anuncian la sección activa. **Fix:** en `src/app/revisor/page.tsx`, añadir `role="tablist"` al contenedor y `role="tab" aria-selected={seccion === k}` a cada botón. El patrón correcto ya existe en `ProyectosCliente.tsx:631`.

- **El visor de PDF en ProyectosCliente usa `src={archivo.url}` directo en el iframe grande, mostrando la barra de herramientas del navegador.** La miniatura ya usa `urlMiniaturaPdf(archivo.url)` que añade `#toolbar=0`. **Fix:** en `ProyectosCliente.tsx` (visor grande), cambiar `src={archivo.url}` a `src={urlMiniaturaPdf(archivo.url)}` para eliminar los botones de impresión/descarga del iframe durante la revisión.
