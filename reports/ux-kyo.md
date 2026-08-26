# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-26
**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/app/vacantes/page.tsx`
- `src/components/sections/Vacancies.tsx`

---

## Cambios Recientes Detectados

**Sin cambios de producto desde 2026-08-13 (13 días).** Los únicos commits desde entonces son reportes automatizados (`ux-kyo`, `dependencias`). El último bloque de código real fue el módulo de Proyectos y Campañas. Todos los hallazgos del rastreador siguen sin corregir — verificados esta sesión con lectura directa de archivos.

---

## Rastreador de sugerencias — estado actualizado al 2026-08-26

| # | Sugerencia | Prioridad | Estado | Días abierto |
|---|---|---|---|---|
| 1 | Kyo lee `jobs.ts` estático, no Supabase | **Alta** | ⏳ Pendiente | 14 días |
| 2 | Memory leak en `rateLimitMap` sin limpieza | **Alta** | ⏳ Pendiente | 14 días |
| 3 | `navigate_to` acepta cualquier ruta (riesgo seguridad) | **Alta** | ⏳ Pendiente | 14 días |
| 4 | `route.ts` trunca contexto a últimos 20 mensajes | Media | ⏳ Pendiente | 14 días |
| 5 | `localStorage` del chat sin TTL — flujo roto al volver | Media | ⏳ Pendiente | 14 días |
| 6 | `max_tokens: 1024` puede truncar el Paso 5 | Media | ⏳ Pendiente | 14 días |
| 7 | Panel de Kyo inutilizable en mobile con teclado virtual (`vh` → `dvh`) | Media | ⏳ Pendiente | 14 días |
| 8 | Markdown de Kyo no se renderiza (asteriscos literales) | Media | ⏳ Pendiente | 14 días |
| 9 | "Nueva conversacion" sin tilde en `ChatWidget.tsx:161` | Baja | ⏳ Pendiente | 14 días |
| 10 | Campaña finalizada sin CTA de upsell en `/revisor` | Baja | ⏳ Pendiente | 11 días |
| 11 | Comentarios de escena no notifican al colaborador por correo | Baja | ⏳ Pendiente | 11 días |
| 12 | `sessionStorage` vs `localStorage` inconsistente en Kyo | **Alta** | ⏳ Pendiente | 7 días |
| 13 | Navegación de Kyo sin transición visible al cerrar | Media | ⏳ Pendiente | 7 días |
| 14 | Filtro `?marca=` del system-prompt con valores placeholder | Media | ⏳ Pendiente | 7 días |
| 15 | `reset()` no borra el session_id — ensucia el log del admin | Media | ⏳ Pendiente | 7 días |
| 16 | `saveConversation` fire-and-forget sin log de errores | Media | ⏳ Pendiente | 7 días |
| 17 | Dos textareas yuxtapuestos en Proyectos confunden al admin | Media | ⏳ Pendiente | 7 días |
| 18 | Desglose de etapa no cabe en mobile (texto corrido, overflow) | Baja | ⏳ Pendiente | 7 días |
| 19 | `logEvent` graba el nombre y zona del candidato en `site_eventos` (PII) | **Alta** | ⏳ Pendiente | 4 días |
| 20 | `setTimeout` de navegación sin cleanup — dispara aunque Kyo esté cerrado | Media | ⏳ Pendiente | 4 días |
| 21 | Filtro de categoría en `search_jobs` falla con tildes ("Atención al cliente") | Media | ⏳ Pendiente | 4 días |
| 22 | Error 429 no se distingue del error 500 — UX idéntica para dos causas distintas | Baja | ⏳ Pendiente | 4 días |
| 23 | Saludo inicial de Kyo tiene "aqui" sin tilde en `useChat.ts:20` | Baja | ⏳ Pendiente | 3 días |
| 24 | `logEvent("kyo_mensaje")` se dispara antes de confirmar que el API respondió | Media | ⏳ Pendiente | 3 días |
| 25 | Mensajes de Kyo sin `aria-live` — invisibles para lectores de pantalla | Media | ⏳ Pendiente | 3 días |
| 26 | Div de error sin `role="alert"` — no anunciado por lectores de pantalla | Baja | ⏳ Pendiente | 3 días |
| 27 | Fallback de Kyo con tildes faltantes en `route.ts:202` | Baja | ⏳ Pendiente | 2 días |
| 28 | `kyo_faqs` de Supabase ignorada — ediciones en admin no llegan a Kyo | **Alta** | ⏳ Pendiente | 2 días |
| 29 | Filtro `?marca=` en `/vacantes` usa valores placeholder que no coinciden con Supabase | **Alta** | 🆕 Nuevo | 0 días |
| 30 | Empty state de vacantes sin CTA de escape (WhatsApp/Kyo) | Media | 🆕 Nuevo | 0 días |
| 31 | Página de vacantes sin paginación — carga todos los registros sin límite | Media | 🆕 Nuevo | 0 días |
| 32 | Sección Vacantes del home no muestra el salario | Baja | 🆕 Nuevo | 0 días |

---

## Nuevos hallazgos de esta sesión

### #29 — Filtro `?marca=` en `/vacantes` es un dead filter — rompe la navegación de Kyo
**Archivo:** `src/app/vacantes/page.tsx:29` y `src/lib/assistant/system-prompt.ts:86`
**Prioridad:** Alta

```ts
// vacantes/page.tsx:29
const MARCAS = ["Todas", "Grupo Corpora", "Logística Norte", "Sigma Retail", "Clínica Vitalis", "Finanzas MX", "Contact Nova"];
```

El array `MARCAS` en la página de vacantes y los valores sugeridos en el system-prompt de Kyo (`?marca=Sigma Retail`, `?marca=Grupo Corpora`, etc.) son placeholders que nunca se actualizaron. Las vacantes reales en Supabase tienen nombres de empresa distintos. Resultado: cuando Kyo navega a `/vacantes?marca=Sigma Retail`, el filtro no devuelve nada y el candidato ve "0 vacantes encontradas" — el peor resultado posible para el funnel.

**Fix en dos pasos:**
1. Consultar las empresas reales activas en `vacantes` (`SELECT DISTINCT empresa FROM vacantes WHERE activa=true`) y reemplazar el array `MARCAS` con esos valores.
2. En `system-prompt.ts:86`, actualizar los ejemplos de `?marca=` para que coincidan con las empresas reales.

Alternativa más robusta: cambiar el filtro `?marca=` por `?empresa=` y que el sistema de filtros en la página haga un `matchesQuery(job.empresa, params.get("empresa"))` con búsqueda parcial en lugar de coincidencia exacta.

---

### #30 — Empty state de vacantes no convierte — candidato queda atascado
**Archivo:** `src/app/vacantes/page.tsx:230-234`
**Prioridad:** Media

```tsx
// vacantes/page.tsx:230-234
<div className="text-center py-16">
  <h3 className="text-lg font-bold text-navy mb-2">Sin resultados</h3>
  <p className="text-sm text-muted">No encontramos vacantes con esos filtros. Intenta con otras combinaciones.</p>
</div>
```

Cuando el candidato no encuentra nada, el empty state solo le dice "intenta de nuevo". No ofrece salida. En este momento el candidato está listo para tomar acción y el sitio lo deja solo.

**Fix concreto:**
```tsx
<div className="text-center py-16">
  <h3 className="text-lg font-bold text-navy mb-2">Sin resultados con esos filtros</h3>
  <p className="text-sm text-muted mb-6">Prueba con otros filtros o deja que Kyo te ayude a encontrar algo que sí encaje.</p>
  <div className="flex items-center justify-center gap-3 flex-wrap">
    <button onClick={clearAll} className="rounded-full border border-blue text-blue text-sm font-bold px-5 py-2 hover:bg-blue hover:text-white transition-colors">
      Limpiar filtros
    </button>
    <a href="https://wa.link/5zv0ba" target="_blank" rel="noopener noreferrer"
       className="rounded-full bg-[#25D366] text-white text-sm font-bold px-5 py-2 hover:opacity-90 transition-opacity">
      Hablar con un asesor
    </a>
  </div>
</div>
```

---

### #31 — Página de vacantes carga todos los registros sin límite ni paginación
**Archivo:** `src/app/vacantes/page.tsx:69-71`
**Prioridad:** Media

```ts
// vacantes/page.tsx:69-71
supabase.from("vacantes")
  .select("id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,badge,badge_class,descripcion,tags,activa")
  .eq("activa", true).order("id")
  .then(...)
```

La query no tiene `.limit()`. Hoy con pocas vacantes es inofensivo, pero a medida que la BD crezca (campañas activas generan tráfico → más aplicaciones → más vacantes) el payload crecerá sin freno y el tiempo de carga con él.

**Fix mínimo (sin UI de paginación):** Agregar `.limit(50)` como techo razonable para el MVP. Cuando se necesite más, implementar paginación por cursor (`range(0, 19)` → "Ver más") o infinite scroll, que es el patrón estándar en bolsas de trabajo.

---

### #32 — Sección Vacantes del home oculta el salario — dato clave para el candidato
**Archivo:** `src/components/sections/Vacancies.tsx:63-100`
**Prioridad:** Baja

La tarjeta de vacante en el home muestra: categoría, badge, título, empresa, ubicación y contrato. **No muestra el salario.** En la página `/vacantes` sí se muestra con `${job.salario.toLocaleString()} / mes`. El salario es frecuentemente el factor decisivo en si el candidato hace clic o no.

**Fix de una línea** — agregar antes del "Aplicar →":
```tsx
<span className="text-sm font-bold text-navy">${vac.salario?.toLocaleString()} /mes</span>
```
Requiere agregar `salario` al `.select()` en `Vacancies.tsx:27`.

---

## Sugerencias de UX (acumuladas, sin implementar)

### Alta prioridad

- **#1 — Kyo lee `jobs.ts` estático, no Supabase.** `knowledge.ts:1-2`. El array `JOBS` importado de `@/lib/jobs` es fallback legacy. Las vacantes creadas desde `/admin/vacantes` (en Supabase) no aparecen en el chat. Fix: implementar `SupabaseKnowledgeProvider` que llame `supabase.from("vacantes").select("*").eq("activa", true)` y asignarlo al singleton `knowledge` en producción.

- **#2 — `rateLimitMap` crece sin límite.** `route.ts:68`. En producción con tráfico sostenido, el Map acumula una entrada por IP visitante y nunca se limpia. Fix: al inicio de `checkRateLimit`, con ~1% de probabilidad barrer entradas cuyo `resetAt < Date.now()`.

- **#3 — `navigate_to` sin lista blanca.** `tools.ts:105`. Kyo podría ser inducido (prompt injection) a navegar a rutas arbitrarias. Fix: validar `input.path` contra `RUTAS_PERMITIDAS` antes de aceptar la navegación. Rechazar cualquier ruta fuera de `["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"]` y las formas con query (`/vacantes?*`, `/cursos/*`).

- **#12 — `sessionStorage` para session ID vs `localStorage` para mensajes.** `useChat.ts:47-52`. El `session_id` se borra al cerrar la pestaña pero el historial persiste en localStorage. El admin ve conversaciones huérfanas en el log. Fix: mover el session_id a `localStorage` y borrarlo en `reset()`.

- **#19 — `logEvent` registra PII del candidato.** `useChat.ts:81`. El texto del candidato (nombre, zona, experiencia) llega a `site_eventos.valor` visible en el dashboard. Fix: `logEvent("kyo_mensaje")` sin el contenido. Los datos reales ya van a `kyo_conversaciones`.

- **#28 — `kyo_faqs` ignorada.** `knowledge.ts:99-105`. Las FAQs editadas desde el panel admin nunca llegan a Kyo. Fix rápido en `route.ts`: leer también `kyo_faqs` de Supabase y concatenarlas al bloque `# FAQs` del system prompt, igual que ya se lee `kyo_config.instrucciones`.

- **#29 — Filtro `?marca=` con valores placeholder que no existen en Supabase.** `vacantes/page.tsx:29` + `system-prompt.ts:86`. Ver hallazgo nuevo arriba.

### Media prioridad

- **#6 — `max_tokens: 1024` puede truncar el Paso 5.** `route.ts:150`. La recomendación de 2-3 vacantes con "por qué aplica" puede superar el límite. Subir a `2048`.

- **#7 — Kyo con teclado virtual en mobile.** `ChatWidget.tsx:120`. Cambiar `h-[min(60vh,560px)]` → `h-[min(60dvh,560px)]`. Con el teclado abierto en Android, `vh` incluye el espacio del teclado y el panel queda cortado.

- **#8 — Asteriscos de markdown literales.** `ChatWidget.tsx:228` renderiza `{message.content}` como texto plano. Las respuestas de Kyo con `**negrita**` o listas numeradas muestran el markdown crudo. Fix: parser inline básico (regex `**texto**` → `<strong>`) en `MessageBubble` para mensajes del asistente.

- **#14 — `?marca=` del system-prompt con valores placeholder.** `system-prompt.ts:86`. Ver #29 — el mismo problema afecta tanto la URL de navegación de Kyo como el filtro de la página.

- **#15 — `reset()` no borra el session_id.** `useChat.ts:139-145`. Al dar "Nueva conversación", el historial de localStorage se limpia pero `sessionStorage.kyo_session_id` conserva el valor anterior. Fix: agregar `sessionStorage.removeItem("kyo_session_id")` en `reset()`.

- **#16 — `saveConversation` fire-and-forget sin log.** `route.ts:206`. Si el guardado falla silenciosamente, el admin ve un log incompleto. Fix: `await saveConversation(...)` con `catch(err => console.error("[kyo] saveConversation failed:", err))`.

- **#20 — `setTimeout` sin cleanup.** `useChat.ts:127`. Si el usuario cierra Kyo en los 700ms de delay, el `router.push` se ejecuta de todas formas. Fix: guardar la referencia en `useRef` y limpiarla en `reset()`.

- **#21 — Filtro de categoría con tildes.** `knowledge.ts:140`. `"Atencion al cliente"` no coincide con `"Atención al cliente"`. Fix: normalizar acentos antes de comparar con `normalize("NFD")`.

- **#24 — `logEvent` antes de confirmar respuesta.** `useChat.ts:81`. El evento `kyo_mensaje` se registra antes del `await fetch(...)`. Mover a después de `res.ok`.

- **#25 — Sin `aria-live` en conversación.** `ChatWidget.tsx:143`. Fix: `aria-live="polite" aria-atomic="false" aria-label="Conversación con Kyo"` en el div `ref={scrollRef}`.

- **#30 — Empty state de vacantes sin CTA.** `vacantes/page.tsx:230`. Ver hallazgo nuevo arriba.

- **#31 — Sin paginación en vacantes.** `vacantes/page.tsx:69`. Ver hallazgo nuevo arriba.

### Baja prioridad

- **#9 — "Nueva conversacion" sin tilde.** `ChatWidget.tsx:161`. Cambiar a "Nueva conversación".
- **#22 — Error 429 vs 500 idénticos.** `useChat.ts:129`. Diferenciar el mensaje: el 429 dice "espera un minuto", el 500 ofrece WhatsApp.
- **#23 — "aqui" sin tilde en saludo.** `useChat.ts:20`. Cambiar a "aquí".
- **#26 — Error sin `role="alert"`.** `ChatWidget.tsx:149`. Agregar `role="alert"` al div de error.
- **#27 — Fallback sin tildes.** `route.ts:202`. `"¿en que mas te puedo ayudar?"` → `"¿en qué más te puedo ayudar?"`.
- **#32 — Salario oculto en Vacantes del home.** `Vacancies.tsx:63-100`. Ver hallazgo nuevo arriba.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 3 (ubicación) demasiado rígido.** El filtro de `/vacantes?ubicacion=` solo acepta 4 valores exactos. Kyo recibe "Iztapalapa", "Neza", "Ecatepec", "Tlalnepantla" y no sabe a qué filtro mapearlos. Fix: función `normalizarUbicacion(texto)` en `tools.ts` que mapee municipios/colonias CDMX → "CDMX", municipios EDOMEX → "Estado de Mexico", etc.

- **Flujo empresa infradesarrollado.** Cuando el usuario es una empresa interesada en contratar, Kyo navega a `/contacto` sin capturar nada. Fix: agregar 2 preguntas antes del cierre: (a) "¿Cuántas personas necesita incorporar?" (b) "¿Para cuándo lo necesita?". Guardar en `contactos` con `tipo: 'empresa'`.

- **Cierre voluntario sin rama propia.** Cuando el usuario escribe "gracias", "adiós" o "ya terminé", Kyo puede insistir con más vacantes. Agregar rama explícita en el paso 6: si detecta despedida, responder con calidez y NO navegar ni ofrecer más opciones.

- **Recontacto sin memoria.** Un candidato que volvió recibe nuevamente "¿Me permite saber su nombre?". Con el historial en localStorage disponible, cuando `messages.length > 6` el prompt puede arrancar con: *"Hola de nuevo. ¿Sigue buscando trabajo de [puesto] o cambió lo que necesita?"*

### Nuevas tools o capacidades recomendadas

- **Tool `start_application`** — Con los 4 datos recopilados en el flujo (nombre, puesto, zona, jornada), llamar `POST /api/aplicar` directamente desde Kyo. El candidato no tendría que rellenar el formulario a mano. Esto elimina el mayor punto de abandono del funnel.

- **Tool `save_to_talent_bank`** — Cuando ninguna vacante encaja, insertar en `aplicaciones` con `estado: 'banco_talentos'` y los datos del perfil ya recopilados. Hoy el banco queda vacío porque el candidato raramente llena el formulario por su cuenta al ser redirigido a `/contacto`.

- **Tool `agendar_llamada`** — Para candidatos que responden "prefiero que me llamen". Insertar en `contactos` con `tipo: 'llamada_agendada'` y franja horaria preferida. Convierte una despedida pasiva en un lead accionable.

### Problemas detectados (bugs)

- **BUG #1 — Kyo muestra vacantes viejas.** `knowledge.ts:1-2` lee `JOBS` estático. Las vacantes de Supabase son invisibles para el asistente.
- **BUG #2 — Filtro de empresa rompe navegación de Kyo.** `vacantes/page.tsx:29` y `system-prompt.ts:86`. Ver #29.
- **BUG #3 — `saveConversation` fire-and-forget sin log.** `route.ts:206`. Fallos silenciosos.
- **BUG #4 — `sessionStorage` / `localStorage` desincronizados.** `useChat.ts:47-52`. Ver #12/#15.
- **BUG #5 — `setTimeout` navega aunque el widget esté cerrado.** `useChat.ts:127`. Ver #20.
- **BUG #6 — Filtro de categoría con tildes.** `knowledge.ts:140`. Ver #21.
- **BUG #7 — `logEvent` dispara en mensajes fallidos.** `useChat.ts:81`. Ver #24.
- **BUG #8 — `kyo_faqs` nunca se consulta.** `knowledge.ts:99`. Ver #28.

---

## Oportunidades de mejora general

- **Error 503 debe ofrecer WhatsApp como escape hatch.** `useChat.ts:129`. Cuando Anthropic está caído o la API key no está configurada, el candidato ve texto seco. Mostrar el link de WhatsApp (`https://wa.link/5zv0ba`) impide perder el lead en ese momento crítico.

- **Informe mensual sin métricas de campañas pagadas.** `src/lib/social-informe.ts` no consulta `campanas` ni `campana_anuncios`. Con la campaña GPG activa, vale agregar una sección "Campañas" con conteo de anuncios y estado de aprobación.

- **Actualizar valores de `?marca=` en system-prompt y en vacantes.** `system-prompt.ts:86` + `vacantes/page.tsx:29`. Los valores "Grupo Corpora, Logística Norte..." son placeholder. Reemplazar por las empresas reales activas en la tabla `vacantes`. Es la corrección más impactante del ciclo porque hoy un candidato que Kyo redirige con filtro de empresa no encuentra nada.

- **Accesibilidad del widget completa.** El widget carece de `aria-live` en el área de mensajes y `role="alert"` en los errores (#25, #26). También agregar `aria-describedby` al input referenciando el último mensaje de Kyo, para que el lector de pantalla sugiera el contexto de respuesta.

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
| Fallback con tildes faltantes | `route.ts` | 202 | #27 ✅ presente |
| FAQs hardcoded, ignorando `kyo_faqs` | `knowledge.ts` | 99 | #28 ✅ presente |
| `MARCAS` placeholder en `/vacantes` | `vacantes/page.tsx` | 29 | #29 🆕 nuevo |
| Empty state sin CTA de escape | `vacantes/page.tsx` | 230 | #30 🆕 nuevo |
| Query sin `.limit()` en vacantes | `vacantes/page.tsx` | 69 | #31 🆕 nuevo |
| Salario oculto en Vacancies home | `Vacancies.tsx` | 63 | #32 🆕 nuevo |
