# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-12
**Cambios analizados:** `src/lib/admin-auth.ts`, `src/lib/admin-fetch.ts`, `src/components/revisor/ProyectosCliente.tsx`, `src/app/admin/(panel)/campanas/page.tsx`, `src/lib/campanas.ts`, `src/lib/meta-insights.ts`, `src/components/revisor/CampanasCliente.tsx`, `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`

---

## Cambios Recientes Detectados

1. **Seguridad admin (fix/seguridad):** Todas las rutas `/api/admin/*` ahora validan sesión real de Supabase mediante `admin-auth.ts`. Se creó `identificar()` / `soloAdmin()` / `conPermiso()`. Antes cualquier cliente con la URL podía llamar a los endpoints sin autenticación.

2. **Proyectos – arte lo aprueba Kyoszen (feat/proyectos):** El bloque de tipo "arte" en el flujo de aprobación por escena ya no se manda al cliente. `ProyectosCliente.tsx` y el endpoint de status del revisor ahora restringen ese tipo de bloque.

3. **Campañas – resultados de Meta (feat/campanas):** Integración con Graph API de Meta para traer alcance, impresiones, clics y gasto reales. Botón "Traer de Meta" en el admin de campañas. Nuevo `src/lib/meta-insights.ts` con manejo de token vencido y fallback a MXN.

---

## Sugerencias de UX

### Alta prioridad

- **Kyo recomienda vacantes del archivo estático, no de Supabase.**
  `src/lib/assistant/knowledge.ts` importa `JOBS` de `@/lib/jobs` (archivo hardcodeado). El sitio público ya lee de Supabase (`/vacantes` consulta la BD), pero Kyo sigue leyendo la lista estática que se sale de sincronía cada vez que hay alta/baja en el admin. Un candidato puede recibir recomendaciones de vacantes que ya no existen, o Kyo ignora vacantes nuevas reales.
  **Cómo arreglarlo:** En `src/app/api/assistant/chat/route.ts` (antes de `buildSystemPrompt`), hacer un `SELECT id, titulo, empresa, ubicacion, contrato, jornada, salario FROM vacantes WHERE activa=true` con `sbAdmin`, y pasarlo a un `buildSystemPrompt(instrucciones, vacantesVivas)`. Alternativamente, crear `SupabaseKnowledgeProvider` que el endpoint instancie con el cliente service_role.

- **Memory leak en el rate limiter de Kyo.**
  `rateLimitMap` en `src/app/api/assistant/chat/route.ts` línea 68 nunca limpia entradas vencidas. En un VPS que lleva semanas arriba, cada IP única que alguna vez mandó un mensaje queda en memoria para siempre.
  **Cómo arreglarlo:** Dentro de `checkRateLimit()` (línea 72), al inicio agregar:
  ```ts
  // Limpiar entradas vencidas cada ~500 llamadas para no explotar RAM
  if (rateLimitMap.size > 500) {
    for (const [ip, e] of rateLimitMap) {
      if (e.resetAt < now) rateLimitMap.delete(ip);
    }
  }
  ```

### Media prioridad

- **Los filtros de URL en el system-prompt usan nombres de empresas ficticias.**
  `src/lib/assistant/system-prompt.ts` líneas 86-93 documentan filtros como `?marca=Sigma Retail`, `?marca=Grupo Corpora`, `?marca=Logistica Norte`. Esos son nombres del `JOBS` estático. Las vacantes reales de Supabase tienen empresas distintas (ej. GPG). Kyo navega a `/vacantes?marca=Sigma Retail` y el filtro no encuentra nada.
  **Cómo arreglarlo:** Quitar los ejemplos de nombre de empresa de los filtros del prompt, o reemplazarlos con las empresas reales que existan en Supabase. El filtro `?q=` (búsqueda libre) es más robusto — promoverlo como el default.

- **`max_tokens: 1024` puede cortar las recomendaciones de Kyo (Paso 5).**
  `src/app/api/assistant/chat/route.ts` línea 150. Una respuesta de Paso 5 con 3 vacantes detalladas (nombre, empresa, motivo de compatibilidad + pregunta de cierre) fácilmente roza los 300-400 tokens. Con tool-use overhead y contexto, 1024 puede quedar corto en conversaciones largas, generando respuestas truncadas sin aviso al usuario.
  **Cómo arreglarlo:** Subir a `max_tokens: 1536`. El modelo haiku cobra por tokens de salida, no es caro.

- **Arte bloqueado sin explicación para el cliente en Proyectos.**
  Desde el commit `feat(proyectos): el arte lo aprueba Kyoszen`, el cliente ve la etapa de Arte como bloqueada pero no hay mensaje que explique el por qué. En `src/components/revisor/ProyectosCliente.tsx`, cuando un bloque de tipo `arte` está bloqueado para el revisor, el componente muestra el ícono de candado sin texto de acompañamiento.
  **Cómo arreglarlo:** Agregar un label o tooltip junto al candado que diga: `"Esta etapa es revisada internamente por el equipo Kyoszen antes de avanzar."` (alrededor de donde se renderiza el estado `bloqueada` en el componente de cliente).

- **Botón "Nueva conversación" se pierde visualmente en el chat.**
  `src/components/assistant/ChatWidget.tsx` líneas 153-165. El texto es gris claro (`text-muted`) y está sin separador. Un candidato que quiere reiniciar el flujo puede no encontrarlo.
  **Cómo arreglarlo:** Agregar un `<hr className="border-border" />` arriba del botón, cambiar color a `text-blue-btn` y agregar un ícono de refresh pequeño SVG (10px). Se ve en móvil, que es donde más se usa el widget.

- **Error de Meta sin CTA accionable en el admin de campañas.**
  `src/lib/meta-insights.ts` lanza `MetaSinConfigurar` con un mensaje de texto plano. El admin que lo ve en pantalla no sabe dónde poner el token. En `src/app/admin/(panel)/campanas/page.tsx`, el error se muestra en un banner pero sin instrucciones.
  **Cómo arreglarlo:** En el handler del botón "Traer de Meta", detectar si el error es instancia de `MetaSinConfigurar` y mostrar: `"Para conectar Meta, agrega META_ACCESS_TOKEN en el .env.local del VPS y reinicia PM2."` en un bloque resaltado (distinto color al error genérico).

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Error de redacción en Paso 5 del system-prompt.**
  `src/lib/assistant/system-prompt.ts` línea 42: dice `"Con esas 4 respuestas (nombre, puesto, experiencia, ubicacion, jornada)"` — pero lista 5 datos. El modelo puede ignorarlo, pero la inconsistencia puede generar confusión.
  **Cómo arreglarlo:** Cambiar a `"Con esas 5 respuestas"` o eliminar el paréntesis aclaratorio.

- **Kyo no menciona el salario al recomendar vacantes (Paso 5).**
  El `JobSummary` en `knowledge.ts` incluye el campo `salario`, y el system-prompt lo muestra en el listado del prompt. Sin embargo, la instrucción de Paso 5 no le dice a Kyo que incluya el salario en su respuesta al candidato. El salario es el primer filtro real que usa un candidato para decidir si aplica.
  **Cómo arreglarlo:** En `system-prompt.ts` línea 44-50, actualizar el formato de respuesta de Paso 5:
  ```
  1. [Nombre del puesto] — [Empresa] — $[salario]/mes — [Por qué le aplica]
  ```
  Dos palabras extra que triplican la utilidad de la recomendación.

- **El flujo para empresas interesadas en cursos es un callejón sin salida.**
  `system-prompt.ts` líneas 65-68: si alguien pregunta por cursos como empresa, Kyo responde `"Con gusto te conecto con nuestro equipo"` y dirige a WhatsApp/contacto. Pero no hace ningún `search_courses` primero. Una empresa que pregunta por "capacitación en liderazgo para 20 personas" merecería ver opciones antes de enviarla a WhatsApp.
  **Cómo arreglarlo:** Agregar en la sección "Manejo de otros temas" que, antes de navegar a `/contacto`, Kyo use `search_courses` con la categoría más relevante y muestre 2 opciones, luego ofrezca conectar si quiere más detalle.

- **No hay manejo del caso "candidato desanimado" (respuesta negativa al Paso 6).**
  El flujo termina en Paso 6 con una invitación a aplicar. Pero si el candidato dice `"No, no me convence"` o `"El salario es muy bajo"`, no hay instrucción. Kyo podría quedar en silencio o repetir la misma respuesta.
  **Cómo arreglarlo:** Agregar un "## Caso — candidato que no está convencido" en el system-prompt: si rechaza las vacantes por salario/ubicación/etc., ofrecer registrar sus expectativas (`/contacto`) y mencionar que actualizan vacantes semanalmente.

### Nuevas tools o capacidades recomendadas

- **Tool `register_candidate_interest`** — cuando Kyo llega al Paso 5 y no hay vacante compatible, actualmente navega a `/contacto` y el candidato tiene que repetir toda su información en el formulario. Una tool que haga `POST` a la tabla `contactos` (o una nueva `banco_talentos`) con `{nombre, tipo_puesto, experiencia, ubicacion, jornada}` recolectados durante el flujo sería el paso más impactante para conversión.
  - Implementar en: `src/lib/assistant/tools.ts` (nueva entry `register_candidate_interest`) + handler en `executeTool()` + POST a Supabase con `sbAdmin`.

- **Tool `get_faq` con búsqueda semántica básica** — la base actual tiene 5 FAQs en `knowledge.ts`, pero si un candidato pregunta `"¿cuánto tardan en contactarme?"` o `"¿tiene garantía?"`, Kyo tiene que inferir de su contexto que eso está en las FAQs. Una tool `get_faq(query)` que busque por palabras clave en `kyo_faqs` de Supabase (tabla existente) daría respuestas más rápidas y precisas sin consumir tokens del contexto del modelo.
  - Implementar en: `src/lib/assistant/tools.ts` + consulta a `kyo_faqs` de Supabase.

### Problemas detectados

- **`listJobs()` en `knowledge.ts` filtra por `location` con `.toLowerCase()` pero las vacantes de Supabase pueden tener capitalización distinta.**
  `knowledge.ts` línea 139: `j.ubicacion.toLowerCase() === filters.location.toLowerCase()`. Funciona en el archivo estático, pero si mañana se conecta a Supabase, una vacante con `"CDMX"` y un filtro `"cdmx"` sí matchearía, pero una con `"Ciudad de México"` fallaría silenciosamente. Anticipar este caso usando `includes()` en lugar de `===`.

- **Kyo puede llamar `navigate_to` con paths no listados si el modelo "alucina".**
  `system-prompt.ts` línea 76 dice `"Solo usa rutas listadas abajo"`, pero no hay validación en el lado del servidor. `executeTool()` en `tools.ts` línea 106 acepta cualquier `path` sin validar contra `SITE_PAGES`. Un path fabricado (`/admin`, `/revisor`) podría mandarse al frontend y causar una redirección no deseada.
  **Cómo arreglarlo:** En `executeTool()`, antes de hacer `return JSON.stringify({ navigated: true, ... })`, validar que `input.path` empiece con alguno de los paths de `SITE_PAGES` o sea una ruta de vacante/curso conocida. Si no matchea, devolver `{ error: "Ruta no permitida" }`.

---

## Oportunidades de mejora general

- **Sincronizar `kyo_faqs` de Supabase en el system-prompt dinámicamente.**
  Actualmente `buildSystemPrompt()` incluye `company.faqs` que vienen del objeto estático `COMPANY` en `knowledge.ts`, no de `kyo_faqs` de Supabase (que sí es editable desde el admin en `/admin/kyo`). Si el admin agrega una FAQ nueva desde el panel, Kyo no la usa hasta que alguien edite `knowledge.ts` a mano.
  **Cómo arreglarlo:** En `route.ts`, junto al fetch de instrucciones de `kyo_config`, hacer un segundo fetch de `kyo_faqs` y pasarlas a `buildSystemPrompt`. Son consultas pequeñas y se pueden cachear junto a las instrucciones.

- **El widget de chat no tiene estado persistente entre páginas.**
  Cuando un candidato está en medio del flujo (Paso 3, preguntó por ubicación) y navega a `/vacantes` (porque Kyo llamó `navigate_to`), el widget se cierra (animación de exit) y cuando el candidato lo vuelve a abrir en la nueva página, el historial de mensajes sigue ahí (gracias a `useChat`) pero el widget empieza cerrado. El candidato no recibe ninguna señal de que debe reabrirlo.
  **Cómo arreglarlo:** Cuando el backend devuelve `navigations.length > 0`, en `useChat` guardar un flag en `sessionStorage` (`kyo_auto_open: true`). Al montar `ChatWidget` en la nueva página, detectar ese flag y abrir el widget automáticamente.

- **No hay métricas de abandono del flujo de Kyo.**
  El sistema de analytics (`site_eventos`) rastrea `kyo_mensaje` pero no distingue en qué paso del flujo de 6 pasos abandona el candidato. Sería útil para saber si el cuello de botella es en "¿cuántos años de experiencia?" vs "¿le gustaría aplicar?".
  **Cómo arreglarlo:** En el backend `route.ts`, detectar el paso actual del flujo (analizando el historial de mensajes con un heurístico simple) y loguear `logEvent("kyo_paso", { paso: 3 })` a `site_eventos`. Requiere 10 líneas extra y produce datos accionables.

- **El campo `placeholder` del input de Kyo es genérico.**
  `ChatWidget.tsx` línea 175: `placeholder="Escribe tu mensaje..."`. Es funcional pero no orienta al candidato que acaba de abrir el chat por primera vez y no sabe qué decir. Cambiar a `"Escribe tu nombre o tipo de trabajo..."` para el primer mensaje, y luego `"Escribe tu respuesta..."` en mensajes posteriores.
  **Cómo arreglarlo:** En `ChatWidget.tsx`, calcular `const esInicio = messages.length <= 1` y usar `placeholder={esInicio ? "Escribe tu nombre o tipo de trabajo..." : "Escribe tu respuesta..."}`.
