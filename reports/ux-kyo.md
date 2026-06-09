# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-09
**Cambios analizados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/components/sections/Hero.tsx`, `src/components/sections/Vacancies.tsx`, `src/app/contacto/page.tsx`

---

## Cambios Recientes Detectados

No hubo commits de código funcional en los últimos 2 días (solo reportes automáticos y actualización de CLAUDE.md). Los bugs críticos escalados en los reportes del 06-06, 07-06 y 08-06 siguen sin corrección. Este reporte agrega **7 hallazgos nuevos** y escala por 5ª vez los 4 bugs críticos sin resolver.

---

## 🚨 Bugs críticos sin corrección — escalados (5ª vez)

Estos 4 bugs se detectaron originalmente el 2026-06-05. Cada día sin corregirlos afecta a candidatos reales que usan Kyo.

### [CRÍTICO-1] Kyo recomienda vacantes del JOBS.ts estático, no de Supabase
**Archivo:** `src/lib/assistant/knowledge.ts:167`
Candidatos reciben recomendaciones de vacantes que ya fueron cerradas por el admin. El `StaticKnowledgeProvider` lee de `JOBS` hardcodeado en `src/lib/jobs.ts`, ignorando completamente la tabla `vacantes` de Supabase. Fix: migrar `listJobs()` y `getJob()` a queries directas con caché de 60s (mismo patrón que `getStoredInstrucciones` en `route.ts:8-32`).

### [CRÍTICO-2] Paso 6: Kyo navega a /contacto (formulario de empresas)
**Archivo:** `src/lib/assistant/system-prompt.ts:61`
"Navega a /contacto si acepta" envía al candidato al formulario de contacto de empresas. Cuando el candidato quiere aplicar, debe llegar a `navigate_to /vacantes/[id]`, no a /contacto. Fix: en el Paso 6, cambiar la instrucción a `navigate_to /vacantes/[id]` cuando hay vacante seleccionada; reservar /contacto solo para cuando no hay vacante compatible (banco de talentos).

### [ALTO-3] FAQs editadas en /admin/kyo no llegan al system prompt
**Archivo:** `src/lib/assistant/knowledge.ts:99-105`
`kyo_faqs` de Supabase existe pero nunca se consulta. El admin edita FAQs y Kyo sigue usando las 5 hardcodeadas en `knowledge.ts`. Fix: en `getStoredInstrucciones()` o en `buildSystemPrompt()`, hacer una query a `kyo_faqs` y reemplazar el bloque `# FAQs` del prompt.

### [ALTO-4] Analytics guarda texto libre del candidato
**Archivo:** `src/components/assistant/useChat.ts:81`
`logEvent("kyo_mensaje", trimmed.slice(0, 300))` registra hasta 300 chars de texto libre. Fix de 1 línea:
```ts
logEvent("kyo_mensaje", String(messages.length));
```

---

## Nuevos Hallazgos — UX

### Alta prioridad

#### [NUEVO-1] CTAs de aplicar enterradas en mobile — conversión crítica perdida
**Archivo:** `src/app/vacantes/[id]/_content.tsx:166`

El botón "Aplicar ahora" y el link de WhatsApp están en la columna derecha de un grid `lg:grid-cols-[1.6fr_1fr]`. En mobile y tablet (< 1024px), esa columna cae DESPUÉS de descripción, responsabilidades, requisitos y tags — fácilmente 4-5 pantallas de scroll hacia abajo. Un candidato impaciente en mobile puede abandonar sin ver los CTAs.

**Fix — añadir un CTA primario fijo al fondo en mobile:**
```tsx
{/* Añadir antes del cierre de la <section> principal, línea ~210 */}
<div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border px-5 py-3 z-50 flex gap-3">
  <button
    type="button"
    onClick={() => { setModalOpen(true); logEvent("vacante_aplicar_click", ...); }}
    className="flex-1 bg-navy text-white rounded-full py-3 text-[14px] font-extrabold"
  >
    Aplicar ahora
  </button>
  <a
    href="https://wa.link/5zv0ba"
    className="bg-wa text-white rounded-full py-3 px-4 flex items-center justify-center"
  >
    <WhatsAppIcon size={18} />
  </a>
</div>
```
Añadir `pb-20 lg:pb-0` al contenedor de la sección para que el contenido no quede tapado.

---

#### [NUEVO-2] Historial de chat sin TTL — Kyo reanuda conversaciones de hace meses
**Archivo:** `src/components/assistant/useChat.ts:24-33`

`loadHistory()` carga del localStorage sin ninguna verificación de antigüedad. Si un candidato visitó el sitio hace 3 meses, Kyo abre directamente en medio de esa conversación antigua (posiblemente con vacantes ya cerradas recomendadas). El candidato tiene que hacer click manualmente en "Nueva conversación" para empezar de cero.

**Fix — añadir TTL de 24 horas en `loadHistory()`:**
```ts
function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [INITIAL_GREETING];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_GREETING];
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (parsed.length === 0) return [INITIAL_GREETING];
    const lastTimestamp = parsed[parsed.length - 1].timestamp;
    const stale = Date.now() - lastTimestamp > 24 * 60 * 60 * 1000; // 24h
    if (stale) {
      localStorage.removeItem(STORAGE_KEY);
      return [INITIAL_GREETING];
    }
    return parsed;
  } catch {
    return [INITIAL_GREETING];
  }
}
```

---

#### [NUEVO-3] sessionId y chat history desincronizados — conversaciones fragmentadas en admin
**Archivo:** `src/components/assistant/useChat.ts:45-53`

`sessionId` vive en `sessionStorage` (se borra al cerrar la pestaña), pero el historial vive en `localStorage` (persiste). Flujo del problema:
1. Candidato chatea → sessionId = "abc123"
2. Candidato cierra la pestaña
3. Candidato regresa → historial cargado de localStorage, pero sessionId = "xyz789" (nuevo)
4. En `/admin/kyo → Conversaciones`, el admin ve la misma conversación dividida en 2 sesiones distintas, sin poder reconstruir el flujo completo.

**Fix — mover sessionId a localStorage (igual que el historial):**
```ts
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = localStorage.getItem("kyo_session_id"); // cambio: localStorage
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("kyo_session_id", sid); // cambio: localStorage
  }
  return sid;
}
```
Nota: Al implementar el TTL de 24h ([NUEVO-2]), también limpiar `kyo_session_id` del localStorage cuando el historial expire, para crear una sesión nueva limpia.

---

### Media prioridad

#### [NUEVO-4] Suspense sin fallback visible — página de vacantes en blanco al cargar
**Archivo:** `src/app/vacantes/page.tsx:51`

```tsx
<Suspense fallback={null}>
```
Con `fallback={null}`, en conexiones lentas (o si el JS tarda en hidratarse), el usuario ve una página completamente en blanco excepto el navbar. No hay spinner, skeleton ni texto de carga.

**Fix — reemplazar con un fallback mínimo:**
```tsx
<Suspense fallback={
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
  </div>
}>
```

---

#### [NUEVO-5] Formulario de contacto — labels sin htmlFor, inputs sin id
**Archivo:** `src/app/contacto/page.tsx:79-84, 100-103`

Los `<label>` no tienen `htmlFor` y los `<input>` no tienen `id`. Screen readers no pueden asociarlos. Esto es un problema de accesibilidad básica (WCAG 2.1 criterio 1.3.1) y es especialmente relevante en el checkbox del aviso de privacidad (línea 102), que requiere consentimiento informado.

**Fix — añadir `id` a cada input y `htmlFor` al label correspondiente:**
```tsx
// Nombre
<label htmlFor="contact-name" className="...">Nombre</label>
<input id="contact-name" type="text" ... />

// Email
<label htmlFor="contact-email" className="...">Correo electrónico</label>
<input id="contact-email" type="email" ... />

// Mensaje
<label htmlFor="contact-message" className="...">Mensaje</label>
<textarea id="contact-message" ... />
```

---

#### [NUEVO-6] Vacantes page — orden por `id` muestra las más antiguas primero
**Archivo:** `src/app/vacantes/page.tsx:70` y `src/components/sections/Vacancies.tsx:29`

Ambas queries usan `.order("id")` (ascendente por defecto), lo que muestra las vacantes más antiguas al frente. Una vacante nueva marcada como "Urgente" nunca aparece destacada en el homepage ni en la bolsa.

**Fix en ambos archivos:**
```ts
.order("created_at", { ascending: false })
```
Requiere que la columna `created_at` exista en la tabla (debería existir por default en Supabase). Si no existe o no tiene valor, alternativa: `.order("id", { ascending: false })`.

---

#### [NUEVO-7] Analytics de interacción con vacante guarda JSON en campo de texto
**Archivo:** `src/app/vacantes/[id]/_content.tsx:38, 189, 198`

```ts
logEvent("vacante_vista", JSON.stringify({ id: vacante.id, titulo: vacante.titulo }));
logEvent("vacante_aplicar_click", JSON.stringify({ id: job.id, titulo: job.titulo }));
logEvent("whatsapp_click", JSON.stringify({ origen: "vacante", titulo: job.titulo }));
```

El campo `valor` en `site_eventos` es TEXT. Guardar JSON serializado hace imposible consultar directamente con SQL (`WHERE valor = '...'` no funciona). El dashboard de analytics tiene que deserializar manualmente.

**Fix — separar los datos como campos planos. Sugerencia de convención:**
```ts
logEvent("vacante_vista", `${vacante.id}`);           // solo el id
logEvent("vacante_aplicar_click", `${job.id}`);       // solo el id
logEvent("whatsapp_click", "vacante");                // origen fijo
```
Si se necesita el título también, agregar una columna `meta JSONB` a `site_eventos` — JSONB permite indexar y consultar.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

#### [KYO-1] Kyo puede "olvidar" el nombre del candidato en conversaciones largas
**Archivo:** `src/app/api/assistant/chat/route.ts:131`

El historial se trunca a los últimos 20 mensajes. Si el candidato da su nombre en el mensaje 2 y el historial llega a 22+ mensajes, los primeros 2 se cortan y Kyo pierde el nombre. En una sesión real con preguntas adicionales, esto es alcanzable.

**Fix — añadir extracción de nombre en el system prompt dinámico:**
En `buildSystemPrompt()`, si se detecta el nombre en los primeros mensajes del historial antes de truncar, incluirlo explícitamente en el header:
```ts
// En route.ts, antes de llamar buildSystemPrompt:
const nombreCandidato = extraerNombre(history); // buscar en los primeros 4 mensajes
const systemPrompt = buildSystemPrompt(instrucciones, nombreCandidato);

// En system-prompt.ts:
export function buildSystemPrompt(instrucciones?: string, nombre?: string): string {
  const nombreHint = nombre ? `\n# Candidato actual\nNombre confirmado: ${nombre}. Úsalo siempre.\n` : "";
  ...
}
```

---

#### [KYO-2] `get_job_details` nunca se llama durante el flujo normal
**Archivo:** `src/lib/assistant/tools.ts:49-57`

El Paso 5 del system prompt usa solo el resumen de vacantes del prompt (id, título, empresa, ubicación, contrato, jornada, salario). `get_job_details` existe pero nunca se activa en el flujo estándar, por lo que Kyo no puede mencionar responsabilidades ni requisitos al recomendar — los argumentos más persuasivos para que el candidato aplique.

**Fix — añadir al Paso 5:**
```
Antes de mostrar las vacantes recomendadas, llama get_job_details para
cada vacante candidata y usa la descripcion corta y los 2-3 primeros
requisitos para personalizar la explicacion de "por que le aplica".
```

---

#### [KYO-3] Sin validación de longitud por mensaje individual
**Archivo:** `src/app/api/assistant/chat/route.ts:131`

Un candidato que pega su CV en el chat (2,000+ palabras) infla el context sin aportar valor y puede desplazar el system prompt en el límite de tokens de Haiku (8,192 tokens de output con hasta 200k de input, pero context window completo incluye el system prompt de ~2,000 tokens + historial).

**Fix:**
```ts
const history = body.messages
  .map(m => ({ ...m, content: m.content.slice(0, 1000) }))
  .slice(-20);
```

---

### Problemas detectados

- **[PERSISTENTE] BUG CRÍTICO: `StaticKnowledgeProvider` usa JOBS.ts, no Supabase.** Sin resolver 5+ días. (Ver [CRÍTICO-1])
- **[PERSISTENTE] BUG CRÍTICO: Paso 6 navega a /contacto en lugar de /vacantes/[id].** Sin resolver. (Ver [CRÍTICO-2])
- **[PERSISTENTE] FAQs de kyo_faqs ignoradas.** Sin resolver. (Ver [ALTO-3])
- **[PERSISTENTE] Analytics guarda texto libre del candidato.** Fix de 1 línea pendiente. (Ver [ALTO-4])
- **[NUEVO] Chat sin TTL — candidatos regresan a conversaciones rancias con vacantes ya cerradas.** (Ver [NUEVO-2])

---

## Oportunidades de mejora general

- **[STATS INCONSISTENTES]** `knowledge.ts:77` dice `687+ candidatos colocados` y `3+ años`; el Hero muestra `7000+` y `10+`. Si un candidato pregunta a Kyo, recibe datos que contradicen lo que leyó en pantalla. Fix: actualizar `knowledge.ts:77-83` con los valores correctos y mover ambas referencias a `site_config` como única fuente de verdad.

- **[HERO: next/image]** `src/components/sections/Hero.tsx:5,122,131` — `import Image from "next/image"` viola la regla de proyecto ("No usar `next/image`"). Reemplazar con `<img>` nativo. Risk: si alguien retira `unoptimized: true` de `next.config.ts`, el build en VPS fallaría.

- **[HERO: tilde faltante]** `src/components/sections/Hero.tsx:81` — `placeholder="¿Que puesto buscas?"` falta tilde en "Qué". Es el buscador más visible del sitio. Fix: `placeholder="¿Qué puesto buscas?"`.

- **[HERO: avatares externos]** `src/components/sections/Hero.tsx:100` — Los 4 avatares de social proof se cargan de `pravatar.cc` (CDN externo). Si tiene downtime, el Hero muestra imágenes rotas. Descargar 4 fotos genéricas a `/public/images/avatars/` y usar paths locales.

- **[RUTA FALTANTE EN KNOWLEDGE]** `src/lib/assistant/knowledge.ts:60-67` no lista `/vacantes/:id`. Cuando el fix del [CRÍTICO-2] se implemente (navigate_to `/vacantes/12`), la Regla 6 del system prompt lo bloqueará porque no está listada. Añadir `{ path: "/vacantes/:id", title: "Detalle de vacante", ... }` a `SITE_PAGES`.

- **[LATENCIA EN MOBILE]** `src/components/assistant/useChat.ts:127` — `setTimeout(..., 700)` da 700ms antes de redirigir al candidato. En mobile con teclado virtual abierto, el mensaje de Kyo casi no se puede leer antes del redirect. Cambiar a `1400`.
