# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-23
**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/components/assistant/ChatWidget.tsx`

---

## Cambios Recientes Detectados

**Sin cambios de producto desde 2026-08-13 (10 días).** Los últimos 5 commits en trunk son solo reportes automatizados (`ux-kyo`, `dependencias`). El último bloque de código real fue el módulo de Proyectos. Todos los hallazgos previos siguen sin corregir — verificado esta sesión con lectura directa de archivos.

---

## Rastreador de sugerencias — estado actualizado al 2026-08-23

| # | Sugerencia | Prioridad | Estado | Días abierto |
|---|---|---|---|---|
| 1 | Kyo lee `jobs.ts` estático, no Supabase | **Alta** | ⏳ Pendiente | 11 días |
| 2 | Memory leak en `rateLimitMap` sin limpieza | **Alta** | ⏳ Pendiente | 11 días |
| 3 | `navigate_to` acepta cualquier ruta (riesgo seguridad) | **Alta** | ⏳ Pendiente | 11 días |
| 4 | `route.ts` trunca contexto a últimos 20 mensajes | Media | ⏳ Pendiente | 11 días |
| 5 | `localStorage` del chat sin TTL — flujo roto al volver | Media | ⏳ Pendiente | 11 días |
| 6 | `max_tokens: 1024` puede truncar el Paso 5 | Media | ⏳ Pendiente | 11 días |
| 7 | Panel de Kyo inutilizable en mobile con teclado virtual (`vh` → `dvh`) | Media | ⏳ Pendiente | 11 días |
| 8 | Markdown de Kyo no se renderiza (asteriscos literales) | Media | ⏳ Pendiente | 11 días |
| 9 | "Nueva conversacion" sin tilde en `ChatWidget.tsx:161` | Baja | ⏳ Pendiente | 11 días |
| 10 | Campaña finalizada sin CTA de upsell en `/revisor` | Baja | ⏳ Pendiente | 8 días |
| 11 | Comentarios de escena no notifican al colaborador por correo | Baja | ⏳ Pendiente | 8 días |
| 12 | `sessionStorage` vs `localStorage` inconsistente en Kyo | **Alta** | ⏳ Pendiente | 4 días |
| 13 | Navegación de Kyo sin transición visible al cerrar | Media | ⏳ Pendiente | 4 días |
| 14 | Filtro `?marca=` del system-prompt con valores placeholder | Media | ⏳ Pendiente | 4 días |
| 15 | `reset()` no borra el session_id — ensucia el log del admin | Media | ⏳ Pendiente | 4 días |
| 16 | `saveConversation` fire-and-forget sin log de errores | Media | ⏳ Pendiente | 4 días |
| 17 | Dos textareas yuxtapuestos en Proyectos confunden al admin | Media | ⏳ Pendiente | 4 días |
| 18 | Desglose de etapa no cabe en mobile (texto corrido, overflow) | Baja | ⏳ Pendiente | 4 días |
| 19 | `logEvent` graba el nombre y zona del candidato en `site_eventos` (PII) | **Alta** | ⏳ Pendiente | 1 día |
| 20 | `setTimeout` de navegación sin cleanup — dispara aunque Kyo esté cerrado | Media | ⏳ Pendiente | 1 día |
| 21 | Filtro de categoría en `search_jobs` falla con tildes ("Atención al cliente") | Media | ⏳ Pendiente | 1 día |
| 22 | Error 429 no se distingue del error 500 — UX idéntica para dos causas distintas | Baja | ⏳ Pendiente | 1 día |
| 23 | Saludo inicial de Kyo tiene "aqui" sin tilde en `useChat.ts:20` | Baja | 🆕 Nuevo | 0 días |
| 24 | `logEvent("kyo_mensaje")` se dispara antes de confirmar que el API respondió | Media | 🆕 Nuevo | 0 días |
| 25 | Mensajes de Kyo sin `aria-live` — invisibles para lectores de pantalla | Media | 🆕 Nuevo | 0 días |
| 26 | Div de error sin `role="alert"` — no anunciado por lectores de pantalla | Baja | 🆕 Nuevo | 0 días |

---

## Nuevos hallazgos de esta sesión

### #23 — Saludo inicial de Kyo tiene "aqui" sin tilde
**Archivo:** `src/components/assistant/useChat.ts:20`
**Prioridad:** Baja

```ts
content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte. ¿Me permite saber su nombre?",
```

La palabra "aqui" carece de acento. Es el primer mensaje que ve cada visitante y Kyoszen cuida la ortografía del español de México. Fix de una línea:

```ts
content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?",
```

---

### #24 — `logEvent("kyo_mensaje")` se dispara antes de saber si el API respondió
**Archivo:** `src/components/assistant/useChat.ts:81`
**Prioridad:** Media

```ts
// Línea 81 — ANTES del fetch
logEvent("kyo_mensaje", trimmed.slice(0, 300));

setError(null);
// ...
const res = await fetch("/api/assistant/chat", { ... });
```

El evento se registra antes de la llamada al API. Si el server responde 429 (rate limit), 500, o hay un error de red, el evento se registra de todas formas. Esto infla el contador de `kyo_mensaje` en Analytics con intentos fallidos. El dashboard muestra N mensajes "enviados" cuando solo N-k llegaron al modelo.

Además combina con el problema #19 (graba PII): aunque se corrija #19 y se deje de guardar el texto, el evento en sí se graba aunque el mensaje nunca llegó a Claude.

**Fix:** mover la llamada a `logEvent` a después de `res.ok`:

```ts
const res = await fetch("/api/assistant/chat", { ... });
if (!res.ok) {
  // ...manejo de error
  return;
}
// Solo aquí el mensaje llegó al servidor con éxito
logEvent("kyo_mensaje"); // Sin PII — solo contar el turno
const data = await res.json();
```

---

### #25 — Mensajes de Kyo sin `aria-live` — invisibles para lectores de pantalla
**Archivo:** `src/components/assistant/ChatWidget.tsx:143`
**Prioridad:** Media

```tsx
<div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
  {messages.map((m) => (
    <MessageBubble key={m.id} message={m} />
  ))}
```

El contenedor de mensajes no tiene `aria-live`. Cuando Kyo responde, el contenido nuevo no se anuncia a usuarios con lectores de pantalla (VoiceOver / TalkBack). Para un asistente conversacional esto es un bloqueo de accesibilidad básico.

**Fix:**

```tsx
<div
  ref={scrollRef}
  className="flex-1 overflow-y-auto px-5 pb-3 space-y-4"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Conversación con Kyo"
>
```

`aria-polite` anuncia cada mensaje nuevo al terminar el audio actual (sin interrumpir). `aria-atomic="false"` lee solo el bloque nuevo, no toda la conversación.

---

### #26 — Div de error sin `role="alert"` — no anunciado por lectores de pantalla
**Archivo:** `src/components/assistant/ChatWidget.tsx:149`
**Prioridad:** Baja

```tsx
{error && (
  <div className="bg-red-50 text-red-700 text-[12px] p-3 rounded-lg border border-red-200">
    {error}
  </div>
)}
```

El error aparece visualmente pero no se anuncia con ningún rol semántico. Un usuario con lector de pantalla no se enteraría del error y seguiría intentando enviar mensajes sin saber por qué no responde Kyo.

**Fix:** agregar `role="alert"` (se anuncia automáticamente cuando aparece en el DOM):

```tsx
{error && (
  <div role="alert" className="bg-red-50 text-red-700 text-[12px] p-3 rounded-lg border border-red-200">
    {error}
  </div>
)}
```

---

## Sugerencias de UX (anteriores no implementadas)

### Alta prioridad

- **#1 — Kyo lee `jobs.ts` estático, no Supabase.** `knowledge.ts:1-2`. El array `JOBS` importado de `@/lib/jobs` es fallback legacy. Las vacantes creadas desde `/admin/vacantes` (en Supabase) no aparecen en el chat. Fix: implementar `SupabaseKnowledgeProvider` que llame `supabase.from("vacantes").select("*").eq("activa", true)` y asignarlo al singleton `knowledge` en producción.

- **#2 — `rateLimitMap` crece sin límite.** `route.ts:68`. En producción con tráfico sostenido, el Map acumula una entrada por IP visitante y nunca se limpia. Fix: al inicio de `checkRateLimit`, con 1% de probabilidad barrer entradas cuyo `resetAt < Date.now()`.

- **#3 — `navigate_to` sin lista blanca.** `tools.ts:105`. Kyo podría ser inducido (prompt injection) a navegar a rutas arbitrarias. Fix: validar `input.path` contra `RUTAS_PERMITIDAS` antes de aceptar la navegación. Rechazar cualquier ruta fuera de `["/" , "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"]` y las formas con query (`/vacantes?*`, `/cursos/*`).

- **#12 — `sessionStorage` para session ID vs `localStorage` para mensajes.** `useChat.ts:47-52`. El `session_id` se borra al cerrar la pestaña pero el historial persiste en localStorage. El admin ve conversaciones huérfanas en el log. Fix: mover el session_id a `localStorage` y borrarlo en `reset()`.

- **#19 — `logEvent` registra PII del candidato.** `useChat.ts:81`. El texto del candidato (nombre, zona, experiencia) llega a `site_eventos.valor` visible en el dashboard. Fix: `logEvent("kyo_mensaje")` sin el contenido. Los datos reales ya van a `kyo_conversaciones` (tabla con acceso más restringido).

### Media prioridad

- **#6 — `max_tokens: 1024` puede truncar el Paso 5.** `route.ts:150`. La recomendación de 2-3 vacantes con "por qué aplica" puede superar el límite. Subir a `2048`.

- **#7 — Kyo con teclado virtual en mobile.** `ChatWidget.tsx:120`. Cambiar `h-[min(60vh,560px)]` → `h-[min(60dvh,560px)]`. Con el teclado abierto en Android, `vh` incluye el espacio del teclado y el panel queda cortado.

- **#8 — Asteriscos de markdown literales.** `ChatWidget.tsx:228` renderiza `{message.content}` como texto plano. Las respuestas de Kyo con `**negrita**` o listas numeradas muestran el markdown crudo. Fix: parser inline básico (regex `**texto**` → `<strong>`) en `MessageBubble` para mensajes del asistente.

- **#14 — `?marca=` del system-prompt con valores placeholder.** `system-prompt.ts:86`. Los valores "Grupo Corpora, Logistica Norte, Sigma Retail..." no corresponden a las empresas reales en la tabla `vacantes`. Reemplazar por las empresas reales activas, o cambiar el filtro a `?q=texto_libre`.

- **#15 — `reset()` no borra el session_id.** `useChat.ts:139-145`. Al dar "Nueva conversación", el historial de localStorage se limpia pero `sessionStorage.kyo_session_id` conserva el valor anterior. La "nueva" conversación sigue ligada a la sesión vieja en `kyo_conversaciones`. Fix: agregar `sessionStorage.removeItem("kyo_session_id")` en `reset()`.

- **#16 — `saveConversation` fire-and-forget sin log.** `route.ts:206`. Si el guardado falla silenciosamente, el admin ve un log incompleto sin saber que hay registros faltantes. Fix: `await saveConversation(...)` con `catch(err => console.error("[kyo] saveConversation failed:", err))`.

- **#20 — `setTimeout` sin cleanup.** `useChat.ts:127`. Si el usuario cierra Kyo en los 700ms de delay, el `router.push` se ejecuta de todas formas. Fix: guardar la referencia en `useRef` y limpiarla en `reset()`.

- **#21 — Filtro de categoría con tildes.** `knowledge.ts:140`. `"Atencion al cliente"` no coincide con `"Atención al cliente"`. Fix: normalizar acentos antes de comparar con `normalize("NFD")`.

- **#24 — `logEvent` antes de confirmar respuesta.** `useChat.ts:81`. Ver hallazgo nuevo arriba.

- **#25 — Sin `aria-live` en conversación.** `ChatWidget.tsx:143`. Ver hallazgo nuevo arriba.

### Baja prioridad

- **#9 — "Nueva conversacion" sin tilde.** `ChatWidget.tsx:161`. Cambiar a "Nueva conversación".
- **#22 — Error 429 vs 500 idénticos.** `useChat.ts:129`. El 429 tiene solución inmediata (esperar); el 500 debería ofrecer WhatsApp como escape. Diferenciar en el `catch`.
- **#23 — "aqui" sin tilde en saludo.** `useChat.ts:20`. Ver hallazgo nuevo arriba.
- **#26 — Error sin `role="alert"`.** `ChatWidget.tsx:149`. Ver hallazgo nuevo arriba.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 3 (ubicación) demasiado rígido.** El filtro de `/vacantes?ubicacion=` solo acepta 4 valores exactos. Kyo recibe "Iztapalapa", "Neza", "Ecatepec", "Tlalnepantla" y no sabe a qué filtro mapearlos. Fix: función `normalizarUbicacion(texto)` en `tools.ts` que mapee municipios/colonias CDMX a los 4 valores del filtro (CDMX, Estado de Mexico, Hibrido, Remoto).

- **Flujo empresa infradesarrollado.** Cuando el usuario es una empresa interesada en contratar, Kyo navega a `/contacto` sin capturar nada. Fix: agregar 2 preguntas antes del cierre: (a) "¿Cuántas personas necesita incorporar?" (b) "¿Para cuándo lo necesita?". Guardar con `save_to_talent_bank` marcado como `tipo: 'empresa'`.

- **Cierre voluntario sin rama propia.** Cuando el usuario escribe "gracias", "adiós" o "ya terminé", Kyo puede insistir con más vacantes. Agregar rama explícita en el paso 6: si detecta despedida, responder con calidez y NO navegar ni ofrecer más opciones.

- **Recontacto sin memoria.** Un candidato que volvió recibe nuevamente "¿Me permite saber su nombre?". Con el historial en localStorage disponible, cuando `messages.length > 6` el prompt puede arrancar: *"Hola de nuevo. ¿Sigue buscando trabajo de [puesto] o cambió lo que necesita?"*

### Nuevas tools o capacidades recomendadas

- **Tool `start_application`** — Con los 4 datos recopilados en el flujo (nombre, puesto, zona, jornada), llamar `POST /api/aplicar` directamente desde Kyo. El candidato no tendría que rellenar el formulario a mano. Esto elimina el mayor punto de abandono del funnel.

- **Tool `save_to_talent_bank`** — Cuando ninguna vacante encaja, insertar en `aplicaciones` con `estado: 'banco_talentos'` y los datos del perfil ya recopilados. Hoy el banco queda vacío porque el candidato raramente llena el formulario por su cuenta al ser redirigido a `/contacto`.

- **Tool `agendar_llamada`** — Para candidatos que responden "prefiero que me llamen". Insertar en `contactos` con `tipo: 'llamada_agendada'` y franja horaria preferida. Convierte una despedida pasiva en un lead accionable.

### Problemas detectados (bugs)

- **BUG #1 — Kyo muestra vacantes viejas.** `knowledge.ts:1-2` lee `JOBS` estático. Las vacantes de Supabase son invisibles para el asistente.
- **BUG #2 — `saveHistory` corre con `messages = []` en el primer render.** `useChat.ts:70-73`. El segundo `useEffect` se ejecuta antes de que `setMessages(loadHistory())` actualize el estado, guardando brevemente un array vacío sobre el localStorage. Fix: flag `historyCargado` en `useRef` que se levanta después de cargar el historial.
- **BUG #3 — `saveConversation` fire-and-forget sin log.** `route.ts:206`. Fallos silenciosos.
- **BUG #4 — `sessionStorage` / `localStorage` desincronizados.** `useChat.ts:47-52`. Ver #12/#15.
- **BUG #5 — `setTimeout` navega aunque el widget esté cerrado.** `useChat.ts:127`. Ver #20.
- **BUG #6 — Filtro de categoría con tildes.** `knowledge.ts:140`. Ver #21.
- **BUG #7 — `logEvent` dispara en mensajes fallidos.** `useChat.ts:81`. Ver #24.

---

## Oportunidades de mejora general

- **Error 503 debe ofrecer WhatsApp como escape hatch.** `useChat.ts:129`. Cuando Anthropic está caído o la API key no está configurada, el candidato ve texto seco. En ese momento crítico, mostrar el link de WhatsApp (`https://wa.link/5zv0ba`) impide perder el lead.

- **Informe mensual sin métricas de campañas pagadas.** `src/lib/social-informe.ts` no consulta `campanas` ni `campana_anuncios`. Con la campaña GPG activa, vale agregar una sección "Campañas" con conteo de anuncios y estado de aprobación.

- **Actualizar valores de `?marca=` en system-prompt.** `system-prompt.ts:86`. Los valores "Grupo Corpora, Logistica Norte, Sigma Retail..." son placeholder. Reemplazar por las empresas reales activas en la tabla `vacantes`.

- **Accesibilidad del widget completa.** Esta sesión detectó que el widget carece de `aria-live` en el área de mensajes y `role="alert"` en los errores (#25, #26). Para completar la accesibilidad básica, también agregar `aria-describedby` al input referenciando el último mensaje de Kyo, para que el lector de pantalla sugiera el contexto de respuesta.

---

## Resumen de patrones verificados esta sesión

| Patrón buscado | Archivo | Línea | Issue |
|---|---|---|---|
| `JOBS` estático | `knowledge.ts` | 2 | #1 ✅ presente |
| `rateLimitMap` sin cleanup | `route.ts` | 68 | #2 ✅ presente |
| `navigate_to` sin lista blanca | `tools.ts` | 105 | #3 ✅ presente |
| `max_tokens: 1024` | `route.ts` | 150 | #6 ✅ presente |
| `60vh` en ChatWidget | `ChatWidget.tsx` | 120 | #7 ✅ presente |
| `{message.content}` sin parser | `ChatWidget.tsx` | 228 | #8 ✅ presente |
| `"Nueva conversacion"` sin tilde | `ChatWidget.tsx` | 161 | #9 ✅ presente |
| `sessionStorage.getItem("kyo_session_id")` | `useChat.ts` | 47 | #12 ✅ presente |
| `?marca=Sigma Retail` placeholder | `system-prompt.ts` | 86 | #14 ✅ presente |
| `reset()` sin borrar session_id | `useChat.ts` | 139 | #15 ✅ presente |
| `saveConversation` sin `await` | `route.ts` | 206 | #16 ✅ presente |
| `logEvent("kyo_mensaje", trimmed)` | `useChat.ts` | 81 | #19 ✅ presente |
| `setTimeout(router.push, 700)` sin cleanup | `useChat.ts` | 127 | #20 ✅ presente |
| Categoría exact match sin normalizar | `knowledge.ts` | 140 | #21 ✅ presente |
| `"aqui"` sin tilde | `useChat.ts` | 20 | #23 🆕 nuevo |
| Sin `aria-live` en mensajes | `ChatWidget.tsx` | 143 | #25 🆕 nuevo |
| Sin `role="alert"` en error | `ChatWidget.tsx` | 149 | #26 🆕 nuevo |
