# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-14
**Cambios analizados:** `src/app/admin/(panel)/proyectos/page.tsx`, `src/app/api/admin/proyectos/[id]/bloques/[bloqueId]/comments/route.ts`, `src/app/api/admin/proyectos/[id]/bloques/[bloqueId]/status/route.ts`, `src/lib/proyectos.ts`, `src/app/api/admin/social/extract-pdf/route.ts`, `src/app/api/admin/social/upload/route.ts`, `src/app/admin/(panel)/campanas/page.tsx`, `src/lib/campanas.ts`, `src/lib/campanas-notify.ts`, `src/lib/meta-insights.ts`, `src/components/admin/ImportarCampana.tsx`, `src/components/revisor/CampanasCliente.tsx`, múltiples rutas de API admin con el fix de seguridad, `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`

---

## Cambios Recientes Detectados (últimas 48 h)

1. **`feat(proyectos)` — el contador de etapa dice cuánto material ya llegó, no solo cuánto se aprobó.** Se agrega el campo `conMaterial` a `Progreso` en `proyectos/page.tsx`. El encabezado de etapa en el tablero del admin ahora muestra dos cifras: material recibido y material aprobado, en vez de solo aprobaciones.

2. **`fix(proyectos)` — pedir cambios ya no obliga a repetir el motivo.** Antes, al cambiar estado a "cambios", el modal exigía escribir nuevamente el comentario aunque ya existía uno reciente en el hilo. Ahora el campo de texto es opcional.

3. **`feat(proyectos)` — conversación admin ↔ colaborador por escena.** Nuevo endpoint `POST /api/admin/proyectos/[id]/bloques/[bloqueId]/comments` y UI en `proyectos/page.tsx` para que admin y colaborador comenten dentro de cada escena, con autoría por rol (Kyoszen / colaborador). Los comentarios del revisor viven en otra tabla (`proyecto_comentarios`).

4. **`fix(seguridad)` — el subidor de archivos ya no está ligado a la sección de Redes.** `extract-pdf` y `upload` en `/api/admin/social/` se movieron para ser de propósito general (se pueden llamar desde Campañas, Proyectos, etc.). No rompe flujos existentes.

5. **`feat(campanas)` — campaña que ya terminó se muestra como finalizada automáticamente.** `faseDeCampana()` en `campanas.ts` detecta si `modo === "en_curso"` y `fecha_fin` ya pasó, y devuelve `"finalizada"` sin que el admin mueva nada. El cliente ve el estado correcto sin intervención manual.

6. **`fix(seguridad)` — todas las rutas `/api/admin/*` ahora exigen sesión real.** Aplicado a 20+ endpoints usando `soloAdmin()` / `conPermiso()` / `exigirProyecto()` de `admin-auth.ts`. Antes, la mayoría eran accesibles sin autenticación con solo conocer la URL.

---

## Sugerencias de UX

### Alta prioridad

- **Kyo recomienda vacantes del archivo estático, no de Supabase.**
  `src/lib/assistant/knowledge.ts` importa `JOBS` de `@/lib/jobs` (hardcodeado). El sitio público lee vacantes activas de Supabase, pero Kyo puede mostrar vacantes cerradas o ignorar vacantes nuevas. Un candidato recibe una recomendación de algo inexistente.
  **Cómo arreglarlo:** En `src/app/api/assistant/chat/route.ts`, antes de llamar a `buildSystemPrompt`, agregar:
  ```ts
  const { data: vacantesVivas } = await sbAdmin
    .from("vacantes")
    .select("id, titulo, empresa, ubicacion, contrato, jornada, salario")
    .eq("activa", true);
  ```
  Y pasar esa lista a `buildSystemPrompt(instrucciones, vacantesVivas ?? [])`. Sin esto, la recomendación de Kyo es un snapshot desactualizado cada vez que el admin da de baja una vacante.

- **Memory leak en el rate limiter del chat de Kyo.**
  `src/app/api/assistant/chat/route.ts` línea 68: `rateLimitMap` es un `Map` de IP → contador que nunca elimina entradas vencidas. En un VPS que lleva semanas arriba con IPs únicas acumulándose, la RAM crece de forma indefinida.
  **Cómo arreglarlo:** Al inicio de `checkRateLimit()` (línea 72), agregar:
  ```ts
  if (rateLimitMap.size > 500) {
    for (const [ip, e] of rateLimitMap) {
      if (e.resetAt < now) rateLimitMap.delete(ip);
    }
  }
  ```
  Esto corta el crecimiento sin afectar el rate limiting activo.

- **Las conversaciones admin ↔ colaborador en escenas de Proyectos no generan ninguna notificación.**
  El nuevo endpoint `POST /api/admin/proyectos/[id]/bloques/[bloqueId]/comments` (`comments/route.ts`) guarda el comentario en `proyecto_comentarios` pero no llama a ningún helper de notificación SMTP. Si un colaborador deja un comentario en una escena, el admin nunca se entera por correo.
  **Cómo arreglarlo:** En `comments/route.ts`, después del `insert` exitoso (línea 65), agregar un envío de correo similar al que hace `campanas-notify.ts` o `social-notify.ts`, usando `social_reviewers` activos como destinatarios del equipo Kyoszen (`renatomachg@gmail.com` al menos). Mensaje mínimo: `"[Colaborador] comentó en la escena N del proyecto [Título]: [extracto]"`.

### Media prioridad

- **La auto-transición a "Finalizada" en campañas no avisa al cliente por correo.**
  `faseDeCampana()` en `campanas.ts` detecta el fin de una campaña de forma automática (lógica en el cliente sin llamada al backend). Pero si Kyoszen marca una campaña como `en_curso` y la fecha pasa, el cliente no recibe ningún correo de "tu campaña ya terminó, revisa los resultados".
  **Cómo arreglarlo:** Al cargar el listado de campañas en `GET /api/revisor/campanas`, detectar campañas que pasan a `finalizada` por la fecha (servidor tiene la lógica, no el cliente) y si cambia el estado efectivo, disparar un correo a `social_reviewers` activos. Una alternativa más simple: un cron o el endpoint del admin que haga el `UPDATE modo = 'finalizada'` real cuando la fecha ya pasó, como parte de `sync-meta`.

- **Los filtros de URL del system-prompt de Kyo usan empresas ficticias del archivo estático.**
  `system-prompt.ts` líneas 86-89 documenta `?marca=Sigma Retail`, `?marca=Grupo Corpora`, etc. Esas empresas son del archivo `jobs.ts` estático. Las vacantes reales de Supabase tienen empresas distintas (ej. GPG). Si Kyo navega a `/vacantes?marca=Sigma Retail`, el filtro devuelve vacío.
  **Cómo arreglarlo:** Reemplazar los ejemplos de `?marca=` con empresas reales de Supabase, o eliminar ese parámetro del prompt y promover `?q=` (búsqueda libre) como el filtro principal, que sí es robusto ante cambios de empresa.

- **`max_tokens: 1024` puede truncar la respuesta del Paso 5 de Kyo en conversaciones largas.**
  `route.ts` línea 150. El Paso 5 tiene texto introductorio + 3 vacantes con descripción + pregunta de cierre. En una conversación de 8 mensajes (con tool-use overhead), el modelo puede quedarse sin tokens y el candidato recibe respuesta cortada sin ningún aviso.
  **Cómo arreglarlo:** Subir a `max_tokens: 1536` (haiku cobra por salida, no es costoso). La diferencia en costo por mensaje es < $0.001.

- **El contador de "material recibido" en etapas de Proyectos no tiene label explicativo.**
  En `proyectos/page.tsx`, el nuevo campo `conMaterial` del tipo `Progreso` agrega un conteo extra visible en el encabezado de etapa. Sin un label claro (ej. "recibidas" vs "aprobadas"), un admin nuevo puede confundir las dos cifras.
  **Cómo arreglarlo:** En el componente que renderiza el encabezado de la etapa, asegurarse de que el número de `conMaterial` lleve un sufijo como `"recibidas"` y el de `aprobado` lleve `"aprobadas"`, aunque sea en tooltip o en texto pequeño debajo de los números.

- **Botón "Nueva conversación" de Kyo no tiene contraste suficiente en mobile.**
  `ChatWidget.tsx` líneas 153-165: el texto `"Nueva conversacion"` es `text-muted` (gris) sin ícono ni separador. En pantallas pequeñas o luz directa, el candidato no lo ve.
  **Cómo arreglarlo:** Agregar `<hr className="border-border mb-2" />` antes del botón, cambiar el color a `text-blue-btn`, y agregar un ícono SVG de refresh de 10px a la izquierda del texto. Cambio de 5 líneas.

- **Error de Meta en campañas no tiene CTA accionable para el admin.**
  `meta-insights.ts` lanza `MetaSinConfigurar` como texto plano. El admin que lo ve en el banner del panel de campañas no sabe qué hacer.
  **Cómo arreglarlo:** En el handler del botón "Traer de Meta" en `campanas/page.tsx`, detectar `instanceof MetaSinConfigurar` y mostrar: `"Para conectar Meta, agrega META_ACCESS_TOKEN al .env.local del VPS y reinicia PM2 (pm2 restart kyoszen)."` en un bloque con color diferente al error genérico (ej. fondo amarillo pálido `#FFFBEB`).

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Error de redacción en Paso 5: dice "4 respuestas" pero lista 5 datos.**
  `system-prompt.ts` línea 42: `"Con esas 4 respuestas (nombre, puesto, experiencia, ubicacion, jornada)"` — son 5 datos. El modelo puede ignorarlo pero es una inconsistencia en las instrucciones.
  **Cómo arreglarlo:** Cambiar a `"Con esas 5 respuestas"` o eliminar el paréntesis. Cambio de 1 palabra.

- **Kyo no incluye el salario al presentar vacantes en el Paso 5.**
  El `JobSummary` en `knowledge.ts` tiene el campo `salario` y aparece en el listado del prompt. Pero el formato de respuesta del Paso 5 no lo incluye. El salario es el primer filtro real que usa un candidato.
  **Cómo arreglarlo:** En `system-prompt.ts` líneas 45-50, actualizar el formato:
  ```
  1. [Nombre del puesto] — [Empresa] — $[salario]/mes — [Por qué le aplica]
  ```
  Son 5 caracteres extra que triplican la utilidad de la recomendación.

- **Cuando una empresa pregunta por cursos, Kyo no los muestra antes de derivar a contacto.**
  `system-prompt.ts` líneas 65-68: si alguien pregunta como empresa por capacitación, Kyo responde `"Con gusto te conecto con nuestro equipo"` sin usar `search_courses`. Una empresa que pregunta `"¿tienen cursos de liderazgo para 20 personas?"` merece ver las opciones primero.
  **Cómo arreglarlo:** Agregar una instrucción en "Manejo de otros temas" indicando que, antes de navegar a `/contacto`, Kyo use `search_courses` con la categoría relevante y muestre 2 opciones del catálogo, luego ofrezca contacto para más detalle o cotización.

- **No hay manejo del candidato que rechaza las vacantes del Paso 5.**
  Si el candidato responde `"No me convence el salario"` o `"La ubicación está muy lejos"`, no hay instrucción en el prompt. Kyo puede repetir las mismas vacantes o quedar confundido.
  **Cómo arreglarlo:** Agregar en `system-prompt.ts` una sección `## Caso — candidato que no está convencido`:
  ```
  Si el candidato rechaza las vacantes por salario o ubicación:
  - Pregunta: "¿Cuál es su expectativa salarial o zona preferida?"
  - Si no hay vacante compatible, ofrece quedar en banco de talentos y navega a /contacto.
  - Menciona: "Actualizamos vacantes cada semana."
  ```

- **El placeholder del input de Kyo es genérico y no orienta al primer usuario.**
  `ChatWidget.tsx` línea 175: `placeholder="Escribe tu mensaje..."`. El candidato que acaba de abrir el chat por primera vez no sabe qué escribir (el saludo ya se envió automáticamente preguntando el nombre).
  **Cómo arreglarlo:** Calcular `const esPrimerMensaje = messages.length <= 1` y usar:
  ```tsx
  placeholder={esPrimerMensaje ? "Escribe tu nombre aquí..." : "Escribe tu respuesta..."}
  ```
  Reduce la fricción de apertura del chat, especialmente en mobile.

### Nuevas tools o capacidades recomendadas

- **Tool `register_candidate_interest`** — cuando Kyo llega al Paso 5 y no hay vacante compatible, navega a `/contacto` y el candidato tiene que repetir todo su perfil en el formulario. Una tool que haga POST directo a Supabase con los datos ya recopilados en el flujo elimina esta fricción y aumenta la conversión.
  **Cómo implementar:** En `src/lib/assistant/tools.ts`, agregar tool `register_candidate_interest` con parámetros `{nombre, tipo_puesto, experiencia_años, ubicacion, jornada}`. En `executeTool()`, hacer insert a `contactos` (o una nueva tabla `banco_talentos`) con `sbAdmin`. El system-prompt le dice a Kyo que use esta tool antes de navegar a `/contacto` cuando no hay match.

- **Tool `get_faq` con búsqueda en `kyo_faqs` de Supabase** — la tabla `kyo_faqs` ya existe y es editable desde el admin. El system-prompt incluye solo 5 FAQs hardcodeadas. Si el admin agrega una FAQ nueva desde `/admin/kyo`, Kyo nunca la ve.
  **Cómo implementar:** En `tools.ts`, agregar `get_faq(query: string)` que haga `SELECT * FROM kyo_faqs WHERE contenido ILIKE '%{query}%' LIMIT 3`. En `route.ts`, cachear el resultado junto a las instrucciones (60s TTL).

### Problemas detectados

- **`navigate_to` acepta cualquier path sin validación en el servidor.**
  `executeTool()` en `tools.ts` línea 106 devuelve `{ navigated: true, path: input.path }` sin validar que el path esté en `SITE_PAGES`. Si el modelo alucina una URL como `/admin` o `/revisor`, el frontend la ejecuta con `router.push()`.
  **Cómo arreglarlo:** En `executeTool()`, antes de retornar la navegación, validar:
  ```ts
  const ALLOWED = ["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"];
  const allowed = ALLOWED.some(p => (input.path as string).startsWith(p));
  if (!allowed) return JSON.stringify({ error: "Ruta no permitida" });
  ```

- **El historial de Kyo persiste en localStorage indefinidamente.**
  `useChat.ts` línea 14: `MAX_STORED = 30` mensajes en `localStorage`. No hay expiración por tiempo. Un candidato que regresa 3 meses después ve un historial de conversación anterior como si fuera la sesión activa, y el contexto enviado al modelo puede ser irrelevante o confuso.
  **Cómo arreglarlo:** Al cargar el historial en `loadHistory()`, verificar el `timestamp` del primer mensaje del array. Si es mayor a 7 días (`Date.now() - 7 * 24 * 3600 * 1000 > parsed[0].timestamp`), descartar el historial y empezar desde el saludo. Son 5 líneas extra en la función existente.

- **La Tool `search_jobs` filtra por `location` con igualdad exacta, pero el dato de Supabase puede variar.**
  `knowledge.ts` línea 139: `j.ubicacion.toLowerCase() === filters.location.toLowerCase()`. Si una vacante en Supabase tiene `"Ciudad de México"` en lugar de `"CDMX"`, el filtro no la encuentra y Kyo dice que no hay vacantes en CDMX.
  **Cómo arreglarlo:** Cambiar el filtro a `j.ubicacion.toLowerCase().includes(filters.location.toLowerCase())` para ser más permisivo, o normalizar los valores al insertar en Supabase desde el admin.

---

## Oportunidades de mejora general

- **Las FAQs editables desde `/admin/kyo` no llegan al system-prompt dinámicamente.**
  `buildSystemPrompt()` incluye `company.faqs` del objeto estático `COMPANY` en `knowledge.ts`. La tabla `kyo_faqs` de Supabase (editable desde el panel) nunca se usa en producción. Un admin que agrega una FAQ nueva no ve ningún efecto en Kyo.
  **Cómo arreglarlo:** En `route.ts`, junto al fetch de `kyo_config`, hacer `SELECT * FROM kyo_faqs WHERE activa = true` y pasar el resultado a `buildSystemPrompt`. Cachear ambas consultas juntas con el mismo TTL de 60s. Son ~10 líneas en el endpoint existente.

- **El widget de Kyo no se reabre automáticamente tras la navegación proactiva.**
  Cuando Kyo llama `navigate_to`, el router navega en 700ms (`useChat.ts` línea 127) y el widget se cierra porque el componente se desmonta y remonta en la nueva página. El candidato pierde el contexto visual de qué sigue.
  **Cómo arreglarlo:** En `useChat.ts`, cuando `data.navigations.length > 0`, guardar `sessionStorage.setItem("kyo_auto_open", "1")`. En `ChatWidget.tsx`, en el `useEffect` de mount, leer ese flag y abrir el widget:
  ```ts
  useEffect(() => {
    if (sessionStorage.getItem("kyo_auto_open")) {
      setOpen(true);
      sessionStorage.removeItem("kyo_auto_open");
    }
  }, []);
  ```

- **No hay métricas de abandono del flujo de 6 pasos de Kyo.**
  `site_eventos` rastrea `kyo_mensaje` (volumen total) pero no en qué paso del flujo abandona el candidato. Sin esto, no se sabe si el cuello de botella es "¿cuánta experiencia tiene?" (Paso 2) o "¿le gustaría aplicar?" (Paso 6).
  **Cómo arreglarlo:** En `route.ts`, detectar el paso actual con un heurístico basado en el conteo de mensajes del `history` (ej. 1 mensaje = Paso 0, 3 mensajes = Paso 2, etc.) y hacer `logEvent("kyo_paso", { paso: X })`. El número exacto no importa tanto como la distribución relativa de abandono.

- **El panel de campañas en el revisor no tiene un CTA claro para campañas finalizadas.**
  En `CampanasCliente.tsx`, cuando una campaña está en estado `finalizada`, el cliente ve los resultados pero no hay un mensaje de cierre ni un CTA explícito (ej. `"¿Quieres contratar otra campaña? Escríbenos."` con link a WhatsApp). Es una oportunidad de upsell natural al final del ciclo de campaña.
  **Cómo arreglarlo:** En el bloque `esFinalizada` de `CampanasCliente.tsx`, agregar debajo de los resultados un banner navy con el texto: `"Esta campaña ya finalizó. ¿Listo para la siguiente?"` y el botón de WhatsApp (`https://wa.link/5zv0ba`). Son unas 8 líneas JSX.
