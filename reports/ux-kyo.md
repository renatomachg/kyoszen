# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-26
**Cambios analizados:** Commit `f7943ce` — Estratega, analytics tracking, Kyo logs y reportes PDF

**Archivos revisados:**
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/components/ui/AplicarModal.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/app/cursos/page.tsx`
- `src/app/contacto/page.tsx`
- `src/app/admin/(panel)/estratega/page.tsx`
- `src/app/admin/(panel)/kyo/page.tsx`

---

## Cambios Recientes Detectados

El commit `f7943ce` introduce cuatro areas de cambio:
1. **Persistencia de conversaciones de Kyo** — `chat/route.ts` ahora guarda chats en tabla `kyo_conversaciones` via `saveConversation()`. El hook `useChat.ts` genera y envia un `sessionId` por tab.
2. **Analytics en acciones de conversion** — Se agregaron `logEvent()` en `AplicarModal`, `_content.tsx`, `cursos/page.tsx` y `contacto/page.tsx` para rastrear vistas, clics y envios de formularios.
3. **Estratega IA en el admin** — Nueva pagina `/admin/estratega` con un chat AI persistente para el equipo de Kyoszen, con historial en Supabase.
4. **Cursos desde Supabase** — `cursos/page.tsx` ahora carga el catalogo desde Supabase con fallback al catalogo estatico.

---

## Sugerencias de UX

### Alta prioridad

- **[CRITICO - MEZCLA DE AUDIENCIAS] `src/app/contacto/page.tsx:91`** — El `<select>` de asunto incluye la opcion "Quiero aplicar a una vacante". Los candidatos que eligen esta opcion llegan a un formulario corporativo (empresa, asunto, mensaje libre) en lugar del `AplicarModal` estructurado. El equipo recibe datos de candidatos incompletos mezclados con leads de empresas. **Solucion:** Eliminar esa opcion del select y agregar un banner justo antes del formulario: `<div class="bg-blue-soft rounded-xl p-4 mb-6 flex items-center gap-3"><span>¿Buscas empleo?</span><a href="/vacantes" class="font-bold text-blue underline">Ver vacantes disponibles →</a></div>`. Las opciones que quedan en el select deben ser exclusivamente orientadas a empresas.

- **[CRITICO - KYO VE DATOS DESACTUALIZADOS] `src/lib/assistant/knowledge.ts:118,138`** — `listCourses()` lee del array estatico `COURSES` y `listJobs()` lee del array estatico `JOBS`. Ahora que el admin puede ver las conversaciones en la pestaña Conversaciones, notara que Kyo recomienda vacantes y cursos que pueden no coincidir con lo que esta activo en Supabase. Las nuevas vacantes creadas en el panel son invisibles para Kyo. **Solucion:** En `chat/route.ts`, donde ya existe `sbAdmin`, pasar el cliente a la llamada: `buildSystemPrompt(instrucciones, await getSupabaseJobs(sbAdmin), await getSupabaseCourses(sbAdmin))`. Crear `getSupabaseJobs` y `getSupabaseCourses` como funciones async que consulten Supabase con un cache de 60s (igual al de `instrucciones`).

- **[CRASH EN PRODUCCION] `src/app/api/assistant/chat/route.ts:36-39`** — `sbAdmin` se inicializa a nivel de modulo con `process.env.SUPABASE_SERVICE_ROLE_KEY!`. Si esa variable de entorno no existe en el VPS, el modulo entero falla al importarse y toda la ruta `/api/assistant/chat` devuelve 500 sin mensaje claro. El `!` supprime el error de TypeScript pero no el de runtime. **Solucion:** Mover la creacion dentro de `saveConversation()` con un guard: `const key = process.env.SUPABASE_SERVICE_ROLE_KEY; if (!key) return; const sb = createClient(url, key);`.

- **[LOCALE INCONSISTENTE EN SALARIO] `src/app/vacantes/[id]/_content.tsx:117,171`** — `job.salario.toLocaleString()` sin locale usa el idioma del navegador del visitante. En un navegador con locale `en-US` se muestra "10,500" y en `es-MX` se muestra "10,500" tambien, pero en algunos dispositivos Android puede mostrar espacios como separadores. **Solucion:** Cambiar ambas ocurrencias a `job.salario.toLocaleString('es-MX')` para garantizar formato consistente. La misma correccion aplica a `system-prompt.ts:131`.

### Media prioridad

- **[CURSOS SUPABASE - DATOS INCOMPLETOS EN MODAL] `src/app/cursos/page.tsx:282-299`** — La consulta a Supabase solo trae `slug,titulo,categoria,categoria_label,modalidad,nivel,horas,descripcion_corta,badge`. Si el `CourseModal` en el futuro necesita `aprenderas`, `modulos` o `dirigidoA`, esos campos seran `undefined` porque no se piden. La tool `get_course_details` en Kyo tampoco los obtendria de Supabase (lee el array estatico). **Solucion a mediano plazo:** Agregar una llamada `getCourse(slug)` dentro de `CourseModal` al montar para obtener el detalle completo desde la API o desde Supabase, no del objeto resumido.

- **[CONTACTO - PRIVACIDAD NO REGISTRADA EN BACKEND] `src/app/contacto/page.tsx:33-41`** — El campo `privacy: true` es validado en el cliente pero no se envia al backend en el POST. Si se requiere evidencia del consentimiento LFPDPPP, el registro en Supabase no lo tiene. **Solucion:** Agregar `acepto_privacidad: form.privacy` en el body del POST a `/api/contacto` y guardarlo en la tabla `contactos`.

- **[ANALYTICS - EVENTO FALTANTE EN CURSOS] `src/app/cursos/page.tsx:219`** — `logEvent("curso_informes_click", ...)` existe pero no hay evento cuando el usuario abre el detalle de un curso haciendo clic en la `CategoryCard`. Solo se registra el clic en "Pedir informes", no la exploracion del catalogo. **Solucion:** En `handleCategoryClick()` ya existe `logEvent("ver_categoria_curso", cat.label)` — lo que falta es registrar cuando el usuario cierra la categoria sin pedir informes: comparar `curso_informes_enviada` vs `ver_categoria_curso` en analytics para medir tasa de conversion por categoria.

- **[MODAL CV SIN ARIA-LABEL] `src/components/ui/AplicarModal.tsx:198-213`** — El boton de subir CV es un `<button>` que dice "PDF o Word — clic para seleccionar" y actua como input de archivo. No tiene `aria-label` descriptivo. Un lector de pantalla no puede distinguirlo del boton de enviar. **Solucion:** Agregar `aria-label="Subir CV en PDF o Word"` al button. Tambien agregar `aria-live="polite"` en un `<span>` que muestre el nombre del archivo seleccionado para que lectores de pantalla lo anuncien.

### Baja prioridad

- **[ESTRATEGA - SIN ESTADO DE CARGA INICIAL] `src/app/admin/(panel)/estratega/page.tsx:50-57`** — El componente usa `loadingChats: true` pero no muestra ningun skeleton o spinner mientras carga. El sidebar aparece vacio de forma abrupta. **Solucion:** Mientras `loadingChats === true`, mostrar 3 filas skeleton `<div className="h-10 bg-border/50 rounded-xl animate-pulse mx-3 mb-2" />` en el sidebar.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[CRITICO - CONTINUIDAD ENTRE SESIONES MAL RESUELTA] `src/components/assistant/useChat.ts:14,24-34`** — El historial persiste en `localStorage` indefinidamente. Un usuario que chatea hoy sobre una vacante puede abrir Kyo 3 semanas despues y ver el historial con vacantes que ya cerraron. Kyo podria responder basado en ese contexto obsoleto. **Solucion:** En `loadHistory()`, agregar validacion de edad: si el ultimo mensaje tiene mas de 24 horas, limpiar y volver al saludo inicial. Implementacion: `const lastTs = parsed[parsed.length - 1]?.timestamp ?? 0; if (Date.now() - lastTs > 86_400_000) return [INITIAL_GREETING];`.

- **[MEJORA DE CONVERSION] Paso 5 no menciona si la vacante tiene aplicaciones recientes** — El system prompt recomienda vacantes con base en perfil pero no indica urgencia. Las vacantes con badge "Urgente" o "Nuevo" deberian priorizarse y mencionarse en la recomendacion. **Solucion:** En `system-prompt.ts:132`, agregar el campo `badge` al formato de vacantes: `${j.badge ? `· [${j.badge}]` : ''}`. En el Paso 5, agregar la instruccion: "Si la vacante tiene badge 'Urgente', menciona que hay alta demanda y que aplicar pronto es recomendable."

- **[MEJORA] Kyo no confirma recepcion de la aplicacion** — Cuando Kyo navega al usuario a la pagina de vacante y este aplica via `AplicarModal`, Kyo no sabe que la aplicacion fue enviada. El flujo termina con la navegacion. **Solucion de mediano plazo:** Cuando `AplicarModal` sube a `status === "success"`, emitir `window.dispatchEvent(new CustomEvent('kyo-aplicacion-enviada', { detail: { vacante } }))`. En `useChat.ts`, escuchar ese evento e inyectar un mensaje proactivo de Kyo: "Excelente, tu solicitud fue enviada. Te contactaran en maximo 24 horas. ¿Tienes alguna otra duda?"

### Nuevas tools o capacidades recomendadas

- **Tool `check_application_status` (futura)** — Cuando el usuario pregunta "¿ya recibieron mi solicitud?" o "¿como va mi aplicacion?", Kyo no puede responder. Implementar una tool que reciba el correo del usuario y consulte `aplicaciones` en Supabase retornando el estado. Requiere que la tabla `aplicaciones` tenga un campo `estado` (recibida, en revision, contactado).

- **Sugerencia de cursos al candidato en Paso 6** — Si el candidato aplica a una vacante que requiere cierta habilidad que tambien esta en el catalogo de cursos, Kyo podria sugerirlo. Ejemplo: candidato aplica a "Coordinador RRHH" → Kyo dice "Mientras espera respuesta, notamos que tenemos un curso de Gestion de RRHH que podria fortalecer su candidatura. ¿Le interesa?" Implementacion: en Paso 6, comparar los `tags` de la vacante elegida contra `categoriaLabel` de los cursos y si hay match, sugerir uno.

### Problemas detectados

- **[BUG - MEMORY LEAK EN RATE LIMITER] `src/app/api/assistant/chat/route.ts:68-80`** — `rateLimitMap` agrega una entrada por IP pero nunca limpia las que ya expiraron. En el VPS con uptime largo entre deploys, el mapa puede acumular miles de IPs unicas. **Solucion:** Al inicio de `checkRateLimit()`, antes de buscar la entrada del IP actual, limpiar entradas expiradas: `if (rateLimitMap.size > 1000) { const now = Date.now(); for (const [k, v] of rateLimitMap) if (v.resetAt < now) rateLimitMap.delete(k); }`. El guard `size > 1000` evita limpiar en cada request.

- **[BUG - SESSION STORAGE POR TAB] `src/components/assistant/useChat.ts:45-53`** — `sessionStorage` es por pestaña del navegador. Si el usuario tiene el chat abierto en una tab y abre la misma pagina en otra tab, se generan dos `kyo_session_id` distintos. El admin vera dos conversaciones separadas cuando deberia ser una. La persistencia del historial en `localStorage` es compartida entre tabs pero el `sessionId` no. **Solucion para estandarizar:** Usar `localStorage` para el `session_id` tambien, pero regenerarlo cuando haya pasado mas de 24 horas (misma logica que para el historial de mensajes).

- **[BUG - TABLA kyo_conversaciones PUEDE NO EXISTIR] `src/app/api/assistant/chat/route.ts:52-63`** — `saveConversation()` hace `upsert` en `kyo_conversaciones` y silencia el error con `catch`. Si la tabla no existe, la nueva pestaña "Conversaciones" en `/admin/kyo` queda vacia sin indicacion de por que. **Accion:** Verificar que la migracion de la tabla `kyo_conversaciones` fue aplicada en Supabase. Si no existe, la estructura esperada es: `(id serial, session_id text unique, messages jsonb, ip text, created_at timestamptz, updated_at timestamptz)`.

- **[RIESGO LFPDPPP - IP EN CONVERSACIONES] `src/app/api/assistant/chat/route.ts:43-64`** — La tabla `kyo_conversaciones` guarda la IP del usuario junto con el historial completo de mensajes. El aviso de privacidad del sitio menciona tratamiento de datos conforme a LFPDPPP, pero el chat widget no tiene aviso explicito de que la conversacion es guardada. **Solucion minima:** Agregar una nota al pie del `ChatWidget.tsx` bajo el input: `<p class="text-[10px] text-muted text-center mt-1">Esta conversacion puede ser guardada para mejorar el servicio.</p>`.

---

## Oportunidades de mejora general

- **Analytics de Estratega no registra uso** — El nuevo `/admin/estratega` no tiene `logEvent()`. Si bien es una herramienta interna, saber cuantas consultas hace el equipo y sobre que temas ayuda a justificar el costo de la API. Agregar `logEvent("estratega_consulta", prompt.slice(0, 100))` al enviar un mensaje.

- **Dashboard de analytics con datos de Kyo** — Ahora que las conversaciones se guardan en `kyo_conversaciones`, el dashboard en `/admin/analytics` podria mostrar: total de conversaciones iniciadas, tasa de completacion del flujo de 6 pasos (estimado por numero de mensajes), y top vacantes recomendadas. Estos datos ya estan en Supabase, solo hay que agregar las queries al endpoint `/api/admin/resumen`.

- **Kyo como entrada al Estratega** — El Estratega tiene acceso a datos del negocio. Una mejora natural: un boton en la pestaña "Conversaciones" del admin que diga "Analizar con Estratega" y pre-cargue el chat con un resumen de las ultimas conversaciones de Kyo. Ejemplo: "Estratega, estas son las ultimas 20 consultas de candidatos. ¿Que vacantes debemos priorizar publicar?"

- **Timeout de respuesta en Kyo sigue sin implementarse** — Reportado en el analisis anterior (`2026-05-25`). Si el VPS tiene alta carga o Anthropic tiene latencia, el usuario ve los tres puntos indefinidamente. El fix es de una linea en `useChat.ts:sendMessage`: `const timeout = setTimeout(() => { setError("La respuesta esta tardando. Intenta de nuevo o contactanos por WhatsApp."); setIsLoading(false); }, 15000);` con su correspondiente `clearTimeout(timeout)` en el bloque `finally`.

- **CTA sticky mobile en detalle de vacante sigue pendiente** — Reportado el `2026-05-25`. El boton "Aplicar ahora" en `/vacantes/[id]` cae al final en mobile. Es el punto de conversion mas importante del sitio. Prioridad alta para implementar en la proxima sesion.
