# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-30
**Cambios analizados:** Sin commits nuevos desde 2026-07-29. Análisis más profundo de `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/api/assistant/chat/route.ts`, `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/knowledge.ts`, `src/lib/assistant/tools.ts`, `src/app/revisor/page.tsx`, `src/components/revisor/ProyectosCliente.tsx`, `src/lib/proyectos.ts`.

---

## Cambios Recientes Detectados

No hay commits nuevos en las últimas 24 h. Los issues reportados ayer (2026-07-29) permanecen abiertos. Este reporte profundiza en áreas no cubiertas en la iteración anterior y reitera los dos bloqueadores críticos que siguen sin corregirse.

---

## Sugerencias de UX

### Alta prioridad

- **[src/components/assistant/ChatWidget.tsx:120] El widget de Kyo se cierra al navegar — el candidato pierde el contexto del chat.**
  Cuando Kyo llama `navigate_to` y `useChat.ts:127` hace `router.push(target.path)`, Next.js navega a la nueva página. Como `ChatWidget` vive en el layout (`PublicShell`), el componente se RE-MONTA y el estado `open` vuelve a `false` — el chat se cierra. El candidato llega a `/vacantes` sin saber qué hacer. **Fix:** elevar el estado `open` a `localStorage` con clave `kyoszen_kyo_open` y restaurarlo en el `useEffect` de montaje. Alternativa más simple: no cerrar el chat al navegar — ya existe el estado persistido en `useChat`; solo falta que `open` también sobreviva la navegación.

- **[src/components/assistant/useChat.ts:20-22] El saludo inicial está duplicado — existe en el código y en el system prompt.**
  `INITIAL_GREETING` (línea 20) muestra el texto del saludo hardcodeado en el frontend. El `system-prompt.ts` (línea 16) también lo tiene como contexto para el modelo: `"Ya salude al usuario con: 'Bienvenido a Kyoszen...'`. Si el admin cambia el saludo en el panel Kyo (instrucciones en Supabase), el system prompt puede cambiar pero el mensaje inicial en pantalla queda desincronizado. **Fix:** mover el texto del `INITIAL_GREETING` a una constante compartida en `system-prompt.ts` que sea importada por `useChat.ts`, así el saludo en pantalla y el que el modelo "recuerda" siempre son idénticos.

- **[src/lib/assistant/knowledge.ts:2] [REITERACIÓN CRÍTICA] Kyo lee vacantes del array estático `JOBS` — puede recomendar vacantes cerradas.**
  Este es el bug más urgente, reportado ayer. `knowledge.ts` importa `{ JOBS }` de `@/lib/jobs`, pero el sitio público y el admin leen de Supabase. Kyo puede mencionar vacantes que ya no existen o ignorar vacantes nuevas. Un candidato que sigue la recomendación de Kyo y llega a una vacante cerrada es una pérdida directa de conversión. **Fix:** crear endpoint `GET /api/assistant/jobs` que lea `SELECT id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion FROM vacantes WHERE activa=true` de Supabase con `service_role`, y actualizar `executeTool` en `tools.ts` para llamarlo en `search_jobs`/`get_job_details`. Cache en memoria de 5 min (mismo patrón que `getStoredInstrucciones`).

- **[src/app/revisor/page.tsx] [REITERACIÓN] Deep-link `?tab=` se pierde tras el login.**
  Reportado ayer. El botón "Vista cliente" abre `/revisor?tab=proyectos`. Si la revisora no tiene sesión activa, la autenticación redirige a `/revisor` sin el parámetro. **Fix:** guardar el tab en `sessionStorage('revisor_pending_tab')` antes del redirect al login; restaurarlo en el `useEffect` de auth al detectar sesión.

### Media prioridad

- **[src/components/assistant/ChatWidget.tsx:169] El campo de texto de Kyo no muestra cuántos caracteres quedan — puede sorprender al usuario con un corte.**
  El sistema limita el historial a 20 mensajes (route.ts:131) pero no hay límite de caracteres por mensaje visible. Mensajes muy largos (>500 caracteres) pueden causar latencias altas con Haiku. No hay indicador. **Fix de bajo impacto:** añadir `maxLength={800}` al `<input>` del formulario (línea 170) y mostrar un contador `${input.length}/800` en texto pequeño debajo cuando el usuario supere los 600 caracteres.

- **[src/components/assistant/useChat.ts:122] El mensaje de Kyo con `content: ""` se renderiza como burbuja vacía.**
  Cuando el modelo solo llama tools sin generar texto, `route.ts:202` devuelve `"Entendido, ¿en que mas te puedo ayudar?"`. Si eso se corrige a `""` (como se recomienda ayer), el `assistantMsg` en `useChat.ts:115` se agrega con `content: ""` y `MessageBubble` renderiza una burbuja vacía. **Fix:** en `useChat.ts:114-121`, si `data.content.trim() === ""` y `data.navigations.length > 0`, no agregar el `assistantMsg` al array. La navegación ya da feedback visual suficiente.

- **[src/app/revisor/page.tsx:860-868] Tour de novedad usa emojis decorativos — inconsistente con el barrido corporativo.**
  `NOVEDAD_PASOS` usa `emoji: "✨ ✅ 🕐 🔴 📘 🎵"` que se renderizan a `fontSize: 20` en la tarjeta. El barrido corporativo del commit `c2e039b` limpió el admin, pero este tour (visible para el cliente) quedó con emojis. **Fix:** reemplazar los 6 valores de `emoji` por íconos SVG inline usando el componente `IconoRevisor` ya existente en `src/app/revisor/page.tsx:116` (que ya tiene los paths para `check`, `cambios`, `publicaciones`, etc.).

- **[src/components/revisor/ProyectosCliente.tsx:1066] Tarjetas de carpeta en el modo archivos tienen altura mínima fija — se ven raras con nombres cortos.**
  Las tarjetas de carpeta tienen `minHeight: 132` (línea 1066) pero el contenido es solo un emoji 📁 de `fontSize: 46` y el nombre. Con nombres de 2-3 palabras la tarjeta queda con demasiado espacio vertical. **Fix:** quitar `minHeight: 132` y usar `padding: 20` uniforme; añadir `aspectRatio: "1"` si se quiere grid cuadrado. El `minHeight` en las tarjetas de archivo es correcto (tienen miniatura), pero no en las carpetas.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[src/lib/assistant/system-prompt.ts:43-50] El Paso 5 no indica cuántas vacantes hay en total — el candidato no sabe si le están dando todas.**
  El formato actual muestra "estas vacantes se ajustan a su perfil" sin contexto de cuántas existen. Si hay 12 vacantes de cajera y Kyo muestra 2, el candidato puede pensar que solo hay 2. **Fix:** modificar el template del Paso 5:
  ```
  "De las [N] vacantes disponibles, estas se ajustan mejor a su perfil, [nombre]:"
  ```
  El conteo viene de `jobsSummary.length` que ya está en el system prompt (línea 137).

- **[src/lib/assistant/system-prompt.ts:57-58] Cuando no hay vacante compatible, Kyo dice "banco de talentos" pero navega a `/contacto` — el formulario no tiene ese contexto.**
  Línea 57: "puedo registrar sus datos para contactarle cuando surja una oportunidad" → luego `navigate_to('/contacto')`. El formulario de `/contacto` es genérico (empresa/candidato/otro). El candidato llega sin contexto, llena el formulario sin saber que es para "banco de talentos", y el asunto del correo llega genérico. **Fix (system prompt):** antes de navegar a `/contacto`, Kyo debe decir: "Voy a llevarte al formulario — en el campo 'Mensaje' escribe 'Banco de talentos' para que te avisemos primero". **Fix ideal (tool):** implementar la tool `register_candidate` propuesta ayer.

- **[src/lib/assistant/tools.ts:43] `search_jobs` filtra por `category` pero el sistema prompt no documenta los valores válidos.**
  El input schema de `search_jobs` (línea 43) lista las categorías: `Administrativo, Ventas, Operaciones, Atencion al cliente, RRHH`. Pero el system prompt (líneas 84-97) solo documenta los filtros de URL, no las categorías que puede usar la tool. Si Kyo intenta `category: "Logistica"` (una categoría real en los datos pero no en la lista), el filtro falla silenciosamente. **Fix:** añadir al description de `search_jobs` en `tools.ts` las categorías exactas: `"Valores válidos: Administrativo, Ventas, Operaciones, Atencion al cliente, RRHH"`. Pero esto debe sincronizarse con los valores reales en Supabase cuando se migre a `SupabaseKnowledgeProvider`.

- **[src/lib/assistant/system-prompt.ts:85-88] Filtros de URL para `?marca=` referencian empresas ficticias del array estático.**
  Reportado ayer. Sigue sin corregirse. Los valores `Sigma Retail`, `Grupo Corpora`, `Clinica Vitalis` son del mock de `jobs.ts`, no de Supabase. Cualquier navegación con `?marca=` produce 0 resultados en producción. **Fix temporal urgente:** eliminar las 6 líneas de ejemplos `?marca=` del system prompt. Solo conservar los filtros seguros que sí funcionan.

### Nuevas tools o capacidades recomendadas

- **Tool: `get_application_status`** — Candidatos que ya aplicaron regresan a Kyo preguntando "¿cuándo me llaman?". Kyo no puede responder porque no tiene acceso a `aplicaciones`. Una tool que reciba el email o teléfono del candidato y busque en `aplicaciones` podría dar un estado aproximado ("Recibimos tu aplicación el [fecha], el equipo te contactará en 24 h hábiles"). Requiere validación de privacidad: solo devolver si el candidato confirma su nombre.

- **Tool: `list_active_vacancies_summary`** — Actualmente el system prompt incluye TODAS las vacantes en cada mensaje (línea 138), lo cual ocupa tokens innecesariamente en los primeros pasos (nombre, experiencia) antes de que se necesiten. Mover la lista de vacantes a una tool lazy `list_active_vacancies_summary` que Kyo llame solo en el Paso 5. Esto reduciría el costo de cada llamada a Haiku en ~30% y permitiría que el context incluya más vacantes sin truncar.

### Problemas detectados

- **[src/components/assistant/useChat.ts:14] La clave de localStorage `kyoszen_chat_history_v1` no se rota cuando el sistema prompt cambia.**
  Si el admin actualiza las instrucciones de Kyo en Supabase, el historial antiguo en localStorage del usuario puede contener mensajes con el flujo anterior (p. ej., referencias a vacantes ya cerradas). El modelo recibirá el historial viejo + el system prompt nuevo, lo que puede causar incoherencias. **Fix simple:** añadir la versión de instrucciones (hash corto de las instrucciones de Supabase) como sufijo de la clave: `kyoszen_chat_${instrHash}`. Si el hash cambia, el hook carga `[INITIAL_GREETING]` sin historial previo.

- **[src/app/api/assistant/chat/route.ts:8-31] Las instrucciones de Kyo se cachean 60 s en memoria del proceso — en el VPS con 1 CPU esto podría ser hasta 60 s de delay para que el admin vea sus cambios reflejados.**
  `_cacheExpiry = Date.now() + 60_000`. El admin guarda en Supabase y espera ver el cambio en el test en vivo del panel Kyo. El panel pasa `previewPrompt` (línea 136) que bypasea la caché — correcto. Pero si el admin usa el botón "Test" del panel y simultáneamente el widget del sitio también está activo (misma sesión de prueba), la caché podría devolver la versión vieja en el widget. No es un bug crítico, pero puede confundir. **Nota:** documentar este comportamiento en el panel Kyo admin como tooltip: "Los cambios se reflejan en el chat del sitio en menos de 60 segundos."

- **[src/app/api/assistant/chat/route.ts:152] `max_tokens: 1024` puede truncar el Paso 5 — reiteración urgente.**
  El Paso 5 presenta 2-3 vacantes con nombre, empresa, razón de compatibilidad, y pregunta final. Con el tool_result previo de `search_jobs` y el historial de 4 pasos, el output disponible puede quedar bajo 400 tokens → respuesta cortada. **Fix:** cambiar a `max_tokens: 2048` en línea 152. Costo adicional con Haiku: `~$0.00015` por conversación completa — despreciable.

---

## Oportunidades de mejora general

- **El widget de Kyo no es accesible desde teclado después de navegar.** Al llegar a `/vacantes` tras la recomendación del Paso 5, el widget está cerrado y el foco va al `<body>`. El candidato con teclado/lector de pantalla no recibe señal de que llegó a la página correcta. **Fix:** al re-montar el widget tras navegación (si `open` era `true`), hacer `setTimeout(() => inputRef.current?.focus(), 300)` para devolver el foco al input del chat.

- **El historial de chat persiste indefinidamente en localStorage — no hay expiración.** Un candidato que visitó el sitio hace 3 meses y regresa ve la conversación antigua. La función `loadHistory` (useChat.ts:24) lee el storage sin verificar `timestamp`. Si los mensajes son de hace >7 días, el contexto es obsoleto. **Fix:** en `loadHistory`, si `parsed[0].timestamp` existe y es anterior a 7 días (`Date.now() - 7 * 86400000`), retornar `[INITIAL_GREETING]` y limpiar el storage.

- **El visor de PDF en DetalleArchivo (ProyectosCliente.tsx:883) no usa los parámetros de limpieza** que sí usa la miniatura (`urlMiniaturaPdf`). El iframe grande muestra el toolbar del navegador con botones de descarga/print que interrumpen la experiencia de revisión. **Fix:** cambiar línea 883 de `src={archivo.url}` a `src={urlMiniaturaPdf(archivo.url)}` (la función ya existe en el mismo archivo, línea 748).

- **Las pestañas del revisor no tienen `role="tablist"` / `role="tab"` accesibles.** El nav principal del revisor usa `<button>` con `onClick` para cambiar secciones, pero sin roles ARIA. Los lectores de pantalla no anuncian "ficha seleccionada". **Fix:** en `src/app/revisor/page.tsx`, añadir `role="tablist"` al contenedor de los botones de sección y `role="tab" aria-selected={seccion === k}` a cada botón. Ya existe este patrón en `ProyectosCliente.tsx:631` para las etapas del proyecto — replicarlo al nivel superior.
