# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-01
**Cambios analizados:** src/app/revisor/page.tsx, src/components/RedLogo.tsx, src/lib/redes-sociales.ts, src/app/api/admin/social/importar/route.ts, src/app/api/admin/social/posts/route.ts, src/components/layout/PublicShell.tsx, src/components/assistant/ChatWidget.tsx, src/components/assistant/useChat.ts, src/lib/assistant/system-prompt.ts, src/lib/assistant/tools.ts, src/lib/assistant/knowledge.ts, src/app/api/assistant/chat/route.ts, src/lib/jobs.ts

---

## Cambios Recientes Detectados

- **Revisor de contenido (`/revisor`):** Portal completo para que los clientes (Rosy, Monse) aprueben o pidan cambios en publicaciones. Incluye login con Supabase Auth, grid de tarjetas por semana/mes, modal con mockup de Facebook, historial de comentarios y tour interactivo con coach marks.
- **Multi-red (Facebook/TikTok):** `RedLogo.tsx` y `redes-sociales.ts` introducen soporte para múltiples redes con fallback a chip de texto cuando no hay logo SVG.
- **Importador de planes:** API `/api/admin/social/importar` usa Claude Haiku para parsear HTML de planes de contenido en paralelo por semana, con detección de duplicados por día+red.
- **PublicShell:** Se extendió para ocultar Navbar/Footer/Kyo también en rutas `/revisor`.

---

## Sugerencias de UX

### Alta prioridad

- **[REVISOR] Modal PostModal no es responsive en móvil.**
  Archivo: `src/app/revisor/page.tsx:170`
  El grid del modal usa `gridTemplateColumns: "1fr 1fr"` fijo, sin media query. En un iPhone 13 (390px) el mockup de Facebook y el panel de acciones quedan apachurrados e ilegibles. Solución: detectar el ancho de ventana con un hook `useWindowSize` o con una verificación inline de `window.innerWidth < 640` y cambiar a `gridTemplateColumns: "1fr"` bajo 640px, apilando mockup arriba y acciones abajo.

- **[REVISOR] Sin soporte de teclado para cerrar el modal.**
  Archivo: `src/app/revisor/page.tsx:140-311`
  El modal no escucha `Escape`. Para revisores en desktop que usan teclado, es un punto de fricción notable. Agregar en el `useEffect` del PostModal:
  ```js
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  ```

- **[REVISOR] No hay "Recuperar contraseña" en la pantalla de login.**
  Archivo: `src/app/revisor/page.tsx:388-420` (componente `LoginView`)
  Las revisoras reciben contraseña temporal `Kyoszen2025!`. Si la olvidan, no hay camino visible para recuperarla; deben contactar a Kyoszen por WhatsApp. Agregar un enlace `¿Olvidaste tu contraseña?` que llame a `supabase.auth.resetPasswordForEmail(email)` y muestre un mensaje de confirmación. Esto elimina fricción en un escenario frecuente con usuarios no técnicos.

- **[REVISOR] La guía (tour) pierde el estado si el usuario cierra el modal durante los pasos que lo requieren.**
  Archivo: `src/app/revisor/page.tsx:496-513`
  Cuando el tour llega a los pasos `requiereModal: true` (pasos 4 y 5), abre automáticamente `posts[0]`. Si el usuario cierra ese modal haciendo clic en el overlay, `selectedPost` queda en `null` pero el tour sigue buscando `[data-tour="preview"]` y `[data-tour="acciones"]` que ya no están en el DOM. El spotlight desaparece y el usuario queda confundido.
  Solución: en el handler de cierre del `PostModal`, verificar si `showGuia` está activo y, si es así, no cerrar el modal (o avanzar el tour al siguiente paso automáticamente).

### Media prioridad

- **[REVISOR] Las estadísticas del mes no tienen etiqueta de período clara.**
  Archivo: `src/app/revisor/page.tsx:795-813`
  Las pills de stats (Total del mes, Aprobados, Pendientes, Con cambios) siempre muestran el mes actual aunque el usuario esté viendo una semana pasada. El label "junio 2026" aparece pequeño a la derecha pero no es obvio que las pills corresponden al mes completo. Agregar un encabezado de sección explícito sobre las pills: `"Resumen de junio 2026"` o agregar `"(mes completo)"` dentro de cada pill label.

- **[REVISOR] No hay contador de publicaciones pendientes en el header de período.**
  Archivo: `src/app/revisor/page.tsx:817-844`
  Cuando el usuario ve "Esta semana", no hay número visible de cuántos posts están pendientes en esa semana. Agregar un badge `(N pendientes)` junto al título `tituloPeriodo()` ayuda al usuario a saber qué le falta sin tener que contar tarjetas.

- **[CHAT KYO] El chat navega automáticamente sin confirmación del usuario.**
  Archivo: `src/components/assistant/useChat.ts:124-128`
  `setTimeout(() => router.push(target.path), 700)` cambia la página mientras el candidato aún lee la respuesta de Kyo. Esto es especialmente abrupto en el paso 5, cuando Kyo muestra la lista de vacantes y simultáneamente navega. Mejor UX: mostrar en el chat un chip/botón `→ Ver vacantes en detalle` que el usuario activa voluntariamente, en lugar de redirigir automáticamente.

- **[REVISOR] PostCard sin imagen muestra emoji `📝` como placeholder.**
  Archivo: `src/app/revisor/page.tsx:331-335`
  Cuando una publicación aún no tiene imagen diseñada, la tarjeta muestra un emoji plano. Mejor reemplazar con un contenedor con el ícono de la red social centrado y fondo `colorSuave` de la red (`r.colorSuave` de `redes-sociales.ts`), que es más on-brand y comunica mejor el estado "imagen pendiente".

- **[ADMIN] `getRedSocial` fallback silencioso a Facebook.**
  Archivo: `src/lib/redes-sociales.ts:33`
  `return REDES_SOCIALES[id] ?? REDES_SOCIALES.facebook` — si se inserta un post con `red_social: "instagram"` en Supabase, todo el UI lo mostrará erróneamente como "Facebook" sin ningún aviso. Agregar al menos un `console.warn("Red social no reconocida:", id)` para detectar el caso durante desarrollo, y considerar un fallback genérico con color gris en lugar de Facebook.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **El Paso 6 dirige al candidato a `/contacto` en lugar de a la vacante específica.**
  Archivo: `src/lib/assistant/system-prompt.ts:61`
  El paso 6 dice `"Navega a /contacto si acepta"`. Pero las vacantes activas en `/vacantes/[id]` tienen su propio modal "Aplicar ahora" con formulario completo (nombre, archivo, etc.). Kyo debería navegar a `/vacantes/[id]` con el ID de la vacante que el candidato eligió. Cambiar a: `"Navega a /vacantes/[id] con el id concreto de la vacante que le interesó. El candidato puede aplicar desde ahí con el botón 'Aplicar ahora'."`.

- **El sistema de navegación automática interrumpe la lectura en paso 5.**
  Archivo: `src/lib/assistant/system-prompt.ts:58` y `src/components/assistant/useChat.ts:124`
  El prompt dice `"Usa navigate_to con /vacantes y los filtros"` al momento de mostrar las vacantes, lo cual hace que la página cambie mientras el candidato lee la lista. Mejor instrucción: en el Paso 5, Kyo NO navega hasta que el candidato confirme qué vacante le interesa. Solo navegar en el Paso 6. Cambiar en system-prompt: `"No llames navigate_to en el Paso 5. Espera confirmación del candidato y navega en el Paso 6."`.

- **El nombre del usuario se antepone mecánicamente en cada respuesta.**
  Archivo: `src/lib/assistant/system-prompt.ts:18`
  Con Haiku, el modelo frecuentemente inicia cada respuesta con `"Muy bien, Juan..."` o `"Juan, con base..."` incluso en respuestas cortas de seguimiento, lo que suena repetitivo. Mejorar la instrucción a: `"Usa el nombre del candidato con naturalidad — máximo 1 vez cada 3-4 mensajes. No lo uses en respuestas de 1-2 líneas."`.

### Nuevas tools o capacidades recomendadas

- **Tool `register_interest` — registrar el interés del candidato antes de navegar.**
  Agregar en `src/lib/assistant/tools.ts` una nueva tool que guarde un registro en Supabase (tabla `aplicaciones` con campo `fuente: "kyo"`) cuando el candidato confirma interés en una vacante, antes de navegar. Esto daría a Kyoszen métricas de interés pre-aplicación ("cuántos candidatos llegaron al paso 6 por Kyo vs. cuántos completaron el formulario").

- **Tool `check_salary_range` — orientar expectativas salariales en el paso 2.**
  Cuando un candidato menciona su puesto en el paso 1, frecuentemente pregunta "¿cuánto pagan?" antes de que Kyo llegue al paso 5. Agregar una tool `get_salary_range(titulo)` que devuelva el rango salarial de las vacantes activas para ese título. Los datos están disponibles en `JOBS.salario` y en Supabase. Esto reduce el abandono por expectativas sin anclar.

- **Quick replies / chips de respuesta rápida para los pasos 1-4.**
  En los pasos de perfil (tipo de trabajo, jornada, ubicación), los candidatos en mobile tienen que escribir respuestas cortas repetitivas. Agregar un campo `suggestions` en la respuesta del API (ej. `["Tiempo completo", "Medio tiempo"]`) y renderizar chips en `ChatWidget.tsx` que el usuario puede tocar. Requiere señalizar el paso actual en la respuesta del API.

### Problemas detectados

- **BUG CRÍTICO: Kyo recomienda vacantes desactualizadas (fuente estática, no Supabase).**
  Archivos: `src/lib/assistant/knowledge.ts:1,167` y `src/lib/jobs.ts:18`
  `StaticKnowledgeProvider.listJobs()` lee del array `JOBS` en `jobs.ts` — el archivo hardcodeado que CLAUDE.md describe como "fallback". El sitio público `/vacantes` lee de Supabase (donde el admin crea/cierra vacantes), pero Kyo usa el array estático. Esto significa que Kyo puede recomendar vacantes ya cerradas o desconocer nuevas vacantes abiertas en el admin.
  **Fix:** Crear `SupabaseKnowledgeProvider` que implemente la interfaz `KnowledgeProvider` (ya definida en `knowledge.ts:42-58`) y lea de Supabase con `SUPABASE_SERVICE_ROLE_KEY`. La estructura ya está diseñada para esta migración; el comentario en `knowledge.ts:167` incluso la menciona como "phase 2".

- **BUG: Las FAQs editadas en `/admin/kyo` no llegan al system prompt de Kyo.**
  Archivos: `src/lib/assistant/knowledge.ts:99-105` y `src/app/api/assistant/chat/route.ts:11-32`
  El `chat/route.ts` solo carga el campo `instrucciones` de `kyo_config`. Las FAQs en el system prompt vienen de `COMPANY.faqs` hardcodeadas en `knowledge.ts`. La tabla `kyo_faqs` existe en Supabase y el admin puede editarlas desde el panel — pero esas ediciones nunca llegan al `buildSystemPrompt()`.
  **Fix:** En `getStoredInstrucciones()` (o en una función hermana), cargar también las FAQs de `kyo_faqs` y pasarlas como parámetro override a `buildSystemPrompt()`.

- **El analytics registra el contenido de los mensajes del usuario (riesgo de privacidad).**
  Archivo: `src/components/assistant/useChat.ts:81`
  `logEvent("kyo_mensaje", trimmed.slice(0, 300))` almacena los primeros 300 caracteres del mensaje en `site_eventos`. Si un candidato escribe su nombre completo, teléfono o datos personales en el chat (ocurre en el paso 0 con el nombre), esos datos quedan en la tabla de analytics. Cambiar a registrar solo la longitud del mensaje o una categoría de paso, no el texto: `logEvent("kyo_mensaje", String(trimmed.length))`.

- **El rate limit de Kyo se reinicia en cada deploy/restart de PM2.**
  Archivo: `src/app/api/assistant/chat/route.ts:68`
  El `rateLimitMap` es un `Map` in-memory de Node.js que se borra con cada restart del proceso. Si un deploy ocurre durante un período de abuso, los contadores se pierden. El propio comentario en el código anticipa esto (`"replace with Upstash Redis"`). Cuando el tráfico del sitio crezca, considerar migrar a un rate limiter basado en Redis o en la propia tabla `site_eventos` de Supabase.

---

## Oportunidades de mejora general

- **Añadir TikTok mockup al modal del revisor.**
  El modal siempre muestra el mockup de Facebook (header con avatar, caption, imagen cuadrada, botones de reacción). Para posts de TikTok, el mockup debería ser vertical (9:16), fondo negro, con overlay de usuario y hashtags al pie. Implementar un componente `TikTokMockup` alternativo al actual bloque de Facebook en `PostModal` (línea 172) y seleccionar con `post.red_social === "tiktok"`. Esto da al cliente una vista previa real de cómo lucirá su contenido de TikTok.

- **El importador trunca HTML a 60,000 caracteres sin avisar.**
  Archivo: `src/app/api/admin/social/importar/route.ts:121`
  `textoLimpio.slice(0, 60_000)` — si el plan HTML es largo (>60k chars), las publicaciones de las últimas semanas no se extraen. No hay ningún aviso al usuario. Agregar en la respuesta un campo `{ advertencia: "Plan truncado — semanas finales pueden estar incompletas." }` cuando la longitud supera ese límite.

- **El dedup del importador impide 2 publicaciones legítimas en el mismo día y red.**
  Archivo: `src/app/api/admin/social/importar/route.ts:132-139`
  El criterio de deduplicación usa `fecha|red_social` como clave única. Pero un día puede tener 2 posts de Facebook legítimos (mañana y tarde). El segundo post simplemente se descarta. Mejorar el criterio de dedup a `fecha|red_social|titulo_interno` o `fecha|red_social|hora` para permitir múltiples publicaciones por día.

- **Agregar confirmación de cierre de sesión en el revisor.**
  Archivo: `src/app/revisor/page.tsx:717`
  El botón "Salir" ejecuta `logout()` directamente sin confirmación. Si la revisora hace clic por accidente, pierde su sesión activa y tiene que hacer login de nuevo. Agregar un `confirm("¿Deseas cerrar sesión?")` o un toast de 2 segundos con opción "Cancelar" antes de ejecutar `signOut()`.

- **Mostrar aviso de horario de atención cuando Kyo recomienda hablar con el equipo.**
  Archivo: `src/lib/assistant/system-prompt.ts:65-67`
  Cuando Kyo responde `"Con gusto te conecto con nuestro equipo"` y navega a `/contacto`, no considera el horario. Si el candidato usa Kyo a las 11pm, no hay ningún mensaje de que el equipo responderá hasta el siguiente día hábil (9am-6pm). Agregar en el system prompt: `"Si el candidato pide hablar con alguien fuera del horario Lunes-Viernes 9am-6pm, menciona que el equipo estará disponible al siguiente día hábil y que puede dejar su mensaje igualmente."`.
