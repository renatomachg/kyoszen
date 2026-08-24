# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-24
**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/components/assistant/ChatWidget.tsx`

---

## Cambios Recientes Detectados

**Sin cambios de producto desde 2026-08-13 (11 días).** Los últimos commits en trunk son solo reportes automatizados (`ux-kyo`, `dependencias`). El último bloque de código real fue el módulo de Proyectos y Campañas. Todos los hallazgos previos siguen sin corregir — verificado esta sesión con lectura directa de archivos.

---

## Rastreador de sugerencias — estado actualizado al 2026-08-24

| # | Sugerencia | Prioridad | Estado | Días abierto |
|---|---|---|---|---|
| 1 | Kyo lee `jobs.ts` estático, no Supabase | **Alta** | ⏳ Pendiente | 12 días |
| 2 | Memory leak en `rateLimitMap` sin limpieza | **Alta** | ⏳ Pendiente | 12 días |
| 3 | `navigate_to` acepta cualquier ruta (riesgo seguridad) | **Alta** | ⏳ Pendiente | 12 días |
| 4 | `route.ts` trunca contexto a últimos 20 mensajes | Media | ⏳ Pendiente | 12 días |
| 5 | `localStorage` del chat sin TTL — flujo roto al volver | Media | ⏳ Pendiente | 12 días |
| 6 | `max_tokens: 1024` puede truncar el Paso 5 | Media | ⏳ Pendiente | 12 días |
| 7 | Panel de Kyo inutilizable en mobile con teclado virtual (`vh` → `dvh`) | Media | ⏳ Pendiente | 12 días |
| 8 | Markdown de Kyo no se renderiza (asteriscos literales) | Media | ⏳ Pendiente | 12 días |
| 9 | "Nueva conversacion" sin tilde en `ChatWidget.tsx:161` | Baja | ⏳ Pendiente | 12 días |
| 10 | Campaña finalizada sin CTA de upsell en `/revisor` | Baja | ⏳ Pendiente | 9 días |
| 11 | Comentarios de escena no notifican al colaborador por correo | Baja | ⏳ Pendiente | 9 días |
| 12 | `sessionStorage` vs `localStorage` inconsistente en Kyo | **Alta** | ⏳ Pendiente | 5 días |
| 13 | Navegación de Kyo sin transición visible al cerrar | Media | ⏳ Pendiente | 5 días |
| 14 | Filtro `?marca=` del system-prompt con valores placeholder | Media | ⏳ Pendiente | 5 días |
| 15 | `reset()` no borra el session_id — ensucia el log del admin | Media | ⏳ Pendiente | 5 días |
| 16 | `saveConversation` fire-and-forget sin log de errores | Media | ⏳ Pendiente | 5 días |
| 17 | Dos textareas yuxtapuestos en Proyectos confunden al admin | Media | ⏳ Pendiente | 5 días |
| 18 | Desglose de etapa no cabe en mobile (texto corrido, overflow) | Baja | ⏳ Pendiente | 5 días |
| 19 | `logEvent` graba el nombre y zona del candidato en `site_eventos` (PII) | **Alta** | ⏳ Pendiente | 2 días |
| 20 | `setTimeout` de navegación sin cleanup — dispara aunque Kyo esté cerrado | Media | ⏳ Pendiente | 2 días |
| 21 | Filtro de categoría en `search_jobs` falla con tildes ("Atención al cliente") | Media | ⏳ Pendiente | 2 días |
| 22 | Error 429 no se distingue del error 500 — UX idéntica para dos causas distintas | Baja | ⏳ Pendiente | 2 días |
| 23 | Saludo inicial de Kyo tiene "aqui" sin tilde en `useChat.ts:20` | Baja | ⏳ Pendiente | 1 día |
| 24 | `logEvent("kyo_mensaje")` se dispara antes de confirmar que el API respondió | Media | ⏳ Pendiente | 1 día |
| 25 | Mensajes de Kyo sin `aria-live` — invisibles para lectores de pantalla | Media | ⏳ Pendiente | 1 día |
| 26 | Div de error sin `role="alert"` — no anunciado por lectores de pantalla | Baja | ⏳ Pendiente | 1 día |
| 27 | Fallback de Kyo con tildes faltantes en `route.ts:202` | Baja | 🆕 Nuevo | 0 días |
| 28 | `kyo_faqs` de Supabase ignorada — ediciones en admin no llegan a Kyo | **Alta** | 🆕 Nuevo | 0 días |

---

## Nuevos hallazgos de esta sesión

### #27 — Fallback de Kyo tiene tildes faltantes
**Archivo:** `src/app/api/assistant/chat/route.ts:202`
**Prioridad:** Baja

```ts
const replyContent = finalText || "Entendido, ¿en que mas te puedo ayudar?";
```

El texto de respaldo que aparece cuando Claude no genera texto (solo llamadas a tools que no producen respuesta textual) carece de tildes en "qué" y "más". Este mensaje llega al candidato y rompe la consistencia ortográfica del sitio.

**Fix de una línea:**

```ts
const replyContent = finalText || "Entendido, ¿en qué más te puedo ayudar?";
```

---

### #28 — La tabla `kyo_faqs` de Supabase es invisible para Kyo
**Archivo:** `src/lib/assistant/knowledge.ts:99-105`
**Prioridad:** Alta

El admin tiene un panel para editar FAQs (tabla `kyo_faqs` en Supabase), pero `knowledge.ts` carga las FAQs desde un array estático `COMPANY.faqs` hardcoded. El singleton `StaticKnowledgeProvider` nunca consulta `kyo_faqs`. Resultado: cualquier FAQ añadida o editada en el panel **no llega a las respuestas de Kyo**.

```ts
// knowledge.ts:99-105 — FAQs hardcoded, ignorando kyo_faqs en Supabase
faqs: [
  { q: "¿En cuanto tiempo presentan candidatos?", a: "En menos de 72 horas..." },
  ...
],
```

Este es el mismo patrón del problema #1 (vacantes estáticas), pero aplicado a FAQs. La solución correcta es parte del `SupabaseKnowledgeProvider` pendiente, pero mientras tanto el admin debe saber que editar FAQs desde el panel no tiene efecto.

**Fix inmediato (sin SupabaseKnowledgeProvider):** En `route.ts`, al construir el system prompt, leer también `kyo_faqs` de Supabase y concatenarlos al bloque `# FAQs` del prompt. Similar a cómo ya se lee `kyo_config.instrucciones`.

**Fix completo:** Implementar `SupabaseKnowledgeProvider.getFAQs()` que llame a:
```ts
supabase.from("kyo_faqs").select("pregunta, respuesta").order("orden")
```
y reemplazar `company.faqs` en `buildSystemPrompt()`.

---

## Sugerencias de UX (anteriores no implementadas)

### Alta prioridad

- **#1 — Kyo lee `jobs.ts` estático, no Supabase.** `knowledge.ts:1-2`. El array `JOBS` importado de `@/lib/jobs` es fallback legacy. Las vacantes creadas desde `/admin/vacantes` (en Supabase) no aparecen en el chat. Fix: implementar `SupabaseKnowledgeProvider` que llame `supabase.from("vacantes").select("*").eq("activa", true)` y asignarlo al singleton `knowledge` en producción.

- **#2 — `rateLimitMap` crece sin límite.** `route.ts:68`. En producción con tráfico sostenido, el Map acumula una entrada por IP visitante y nunca se limpia. Fix: al inicio de `checkRateLimit`, con 1% de probabilidad barrer entradas cuyo `resetAt < Date.now()`.

- **#3 — `navigate_to` sin lista blanca.** `tools.ts:105`. Kyo podría ser inducido (prompt injection) a navegar a rutas arbitrarias. Fix: validar `input.path` contra `RUTAS_PERMITIDAS` antes de aceptar la navegación. Rechazar cualquier ruta fuera de `["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"]` y las formas con query (`/vacantes?*`, `/cursos/*`).

- **#12 — `sessionStorage` para session ID vs `localStorage` para mensajes.** `useChat.ts:47-52`. El `session_id` se borra al cerrar la pestaña pero el historial persiste en localStorage. El admin ve conversaciones huérfanas en el log. Fix: mover el session_id a `localStorage` y borrarlo en `reset()`.

- **#19 — `logEvent` registra PII del candidato.** `useChat.ts:81`. El texto del candidato (nombre, zona, experiencia) llega a `site_eventos.valor` visible en el dashboard. Fix: `logEvent("kyo_mensaje")` sin el contenido. Los datos reales ya van a `kyo_conversaciones` (tabla con acceso más restringido).

- **#28 — `kyo_faqs` ignorada.** `knowledge.ts:99-105`. Ver hallazgo nuevo arriba.

### Media prioridad

- **#6 — `max_tokens: 1024` puede truncar el Paso 5.** `route.ts:150`. La recomendación de 2-3 vacantes con "por qué aplica" puede superar el límite. Subir a `2048`.

- **#7 — Kyo con teclado virtual en mobile.** `ChatWidget.tsx:120`. Cambiar `h-[min(60vh,560px)]` → `h-[min(60dvh,560px)]`. Con el teclado abierto en Android, `vh` incluye el espacio del teclado y el panel queda cortado.

- **#8 — Asteriscos de markdown literales.** `ChatWidget.tsx:228` renderiza `{message.content}` como texto plano. Las respuestas de Kyo con `**negrita**` o listas numeradas muestran el markdown crudo. Fix: parser inline básico (regex `**texto**` → `<strong>`) en `MessageBubble` para mensajes del asistente.

- **#14 — `?marca=` del system-prompt con valores placeholder.** `system-prompt.ts:86`. Los valores "Grupo Corpora, Logistica Norte, Sigma Retail..." no corresponden a las empresas reales en la tabla `vacantes`. Reemplazar por las empresas reales activas, o cambiar el filtro a `?q=texto_libre`.

- **#15 — `reset()` no borra el session_id.** `useChat.ts:139-145`. Al dar "Nueva conversación", el historial de localStorage se limpia pero `sessionStorage.kyo_session_id` conserva el valor anterior. La "nueva" conversación sigue ligada a la sesión vieja en `kyo_conversaciones`. Fix: agregar `sessionStorage.removeItem("kyo_session_id")` en `reset()`.

- **#16 — `saveConversation` fire-and-forget sin log.** `route.ts:206`. Si el guardado falla silenciosamente, el admin ve un log incompleto sin saber que hay registros faltantes. Fix: `await saveConversation(...)` con `catch(err => console.error("[kyo] saveConversation failed:", err))`.

- **#20 — `setTimeout` sin cleanup.** `useChat.ts:127`. Si el usuario cierra Kyo en los 700ms de delay, el `router.push` se ejecuta de todas formas. Fix: guardar la referencia en `useRef` y limpiarla en `reset()`.

- **#21 — Filtro de categoría con tildes.** `knowledge.ts:140`. `"Atencion al cliente"` no coincide con `"Atención al cliente"`. Fix: normalizar acentos antes de comparar con `normalize("NFD")`.

- **#24 — `logEvent` antes de confirmar respuesta.** `useChat.ts:81`. El evento `kyo_mensaje` se registra antes del `await fetch(...)`. Si la API devuelve error, el evento ya está anotado. Fix: mover `logEvent("kyo_mensaje")` a después de `res.ok` (solo contar los mensajes que realmente llegaron al modelo).

- **#25 — Sin `aria-live` en conversación.** `ChatWidget.tsx:143`. El contenedor de mensajes no anuncia a lectores de pantalla cuando Kyo responde. Fix: `aria-live="polite" aria-atomic="false" aria-label="Conversación con Kyo"` en el div `ref={scrollRef}`.

### Baja prioridad

- **#9 — "Nueva conversacion" sin tilde.** `ChatWidget.tsx:161`. Cambiar a "Nueva conversación".
- **#22 — Error 429 vs 500 idénticos.** `useChat.ts:129`. El 429 tiene solución inmediata (esperar); el 500 debería ofrecer WhatsApp como escape. Diferenciar en el `catch`.
- **#23 — "aqui" sin tilde en saludo.** `useChat.ts:20`. Cambiar a "aquí".
- **#26 — Error sin `role="alert"`.** `ChatWidget.tsx:149`. Agregar `role="alert"` al div de error.
- **#27 — Fallback sin tildes.** `route.ts:202`. Ver hallazgo nuevo arriba.

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
- **BUG #2 — `saveHistory` corre con `messages = []` en el primer render.** `useChat.ts:70-73`. El segundo `useEffect` se ejecuta antes de que `setMessages(loadHistory())` actualice el estado, guardando brevemente un array vacío sobre el localStorage.
- **BUG #3 — `saveConversation` fire-and-forget sin log.** `route.ts:206`. Fallos silenciosos.
- **BUG #4 — `sessionStorage` / `localStorage` desincronizados.** `useChat.ts:47-52`. Ver #12/#15.
- **BUG #5 — `setTimeout` navega aunque el widget esté cerrado.** `useChat.ts:127`. Ver #20.
- **BUG #6 — Filtro de categoría con tildes.** `knowledge.ts:140`. Ver #21.
- **BUG #7 — `logEvent` dispara en mensajes fallidos.** `useChat.ts:81`. Ver #24.
- **BUG #8 — `kyo_faqs` nunca se consulta.** `knowledge.ts:99`. Ver #28.

---

## Oportunidades de mejora general

- **Error 503 debe ofrecer WhatsApp como escape hatch.** `useChat.ts:129`. Cuando Anthropic está caído o la API key no está configurada, el candidato ve texto seco. En ese momento crítico, mostrar el link de WhatsApp (`https://wa.link/5zv0ba`) impide perder el lead.

- **Informe mensual sin métricas de campañas pagadas.** `src/lib/social-informe.ts` no consulta `campanas` ni `campana_anuncios`. Con la campaña GPG activa, vale agregar una sección "Campañas" con conteo de anuncios y estado de aprobación.

- **Actualizar valores de `?marca=` en system-prompt.** `system-prompt.ts:86`. Los valores "Grupo Corpora, Logistica Norte, Sigma Retail..." son placeholder. Reemplazar por las empresas reales activas en la tabla `vacantes`.

- **Accesibilidad del widget completa.** El widget carece de `aria-live` en el área de mensajes y `role="alert"` en los errores (#25, #26). Para completar la accesibilidad básica, también agregar `aria-describedby` al input referenciando el último mensaje de Kyo, para que el lector de pantalla sugiera el contexto de respuesta.

- **FAQs editables deben ser efectivas.** Si el admin edita FAQs en el panel (`kyo_faqs`), espera que Kyo las use. Hoy no es así (#28). Comunicar esta limitación o resolverla.

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
| `"aqui"` sin tilde | `useChat.ts` | 20 | #23 ✅ presente |
| Sin `aria-live` en mensajes | `ChatWidget.tsx` | 143 | #25 ✅ presente |
| Sin `role="alert"` en error | `ChatWidget.tsx` | 149 | #26 ✅ presente |
| Fallback con tildes faltantes | `route.ts` | 202 | #27 🆕 nuevo |
| FAQs hardcoded, ignorando `kyo_faqs` | `knowledge.ts` | 99 | #28 🆕 nuevo |
