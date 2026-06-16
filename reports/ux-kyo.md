# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-16
**Cambios analizados:** sin commits de código nuevos — análisis profundo de archivos existentes para detectar hallazgos no documentados previamente. Archivos leídos: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/components/ui/AplicarModal.tsx`, `src/components/layout/Navbar.tsx`, `src/app/contacto/page.tsx`, `src/app/cursos/page.tsx`, `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

Sin commits de código en los últimos 2 días — solo health checks y reportes automáticos del VPS. Los bugs críticos documentados desde el 2026-06-12 **siguen sin corregirse (día 5)**. Este reporte añade **3 hallazgos nuevos** (BUG 25–27) y mantiene el escalamiento de los bugs acumulados.

---

## 🔴 BUGS CRÍTICOS ACUMULADOS — DÍA 5 SIN CORRECCIÓN

> El flujo principal candidato → Kyo → vacante → aplicación está **roto en producción**. BUG 1, 2, 3 y 5 juntos hacen que Kyo sea inservible para su propósito central.

### BUG 1 — Kyo recomienda vacantes que no existen *(BLOQUEANTE — 5º día)*
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider.listJobs()` lee de `src/lib/jobs.ts` (demo hardcodeado). Las vacantes reales de Supabase son invisibles para Kyo. En el Paso 5, Kyo presenta IDs de demo que generan 404 al hacer clic.

**Fix en `src/app/api/assistant/chat/route.ts`:** Antes del loop de herramientas, consultar vacantes activas de Supabase con `sbAdmin` y pasarlas a `buildSystemPrompt()` y `executeTool()`.

---

### BUG 2 — Filtro "Marca" en `/vacantes` siempre devuelve 0 resultados *(5º día)*
**Archivo:** `src/app/vacantes/page.tsx` líneas 29 y 180

Las marcas hardcodeadas (`"Grupo Corpora"`, `"Logística Norte"`, etc.) son nombres de demo ficticios que no coinciden con las empresas reales en Supabase.

**Fix:**
```ts
const marcasDisponibles = useMemo(
  () => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())],
  [jobs]
);
```

---

### BUG 3 — Vocabulario Contrato/Jornada incompatible entre BD, filtros y Kyo *(5º día)*
**Archivos:** `src/app/vacantes/page.tsx` líneas 30-31, `src/lib/assistant/system-prompt.ts` líneas 85-91

Los tres sistemas usan valores distintos. Los filtros devuelven 0 resultados aunque existan vacantes compatibles.

**Fix:** Unificar a los valores del form admin (fuente de verdad: la BD).

---

### BUG 5 — MAX_TOOL_ITERATIONS demasiado bajo para el Paso 5 *(5º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` línea 85

Paso 5 requiere: `search_jobs` → `get_job_details` × 2 → `navigate_to` = 4 iteraciones. Con `get_company_info`, se alcanza el límite de 5 y la respuesta se trunca.

**Fix:** Cambiar `MAX_TOOL_ITERATIONS` de `5` a `8`.

---

### BUG 8 — Saludo de Kyo sin acento *(5º día)*
**Archivo:** `src/components/assistant/useChat.ts` línea 20
`"aqui"` → `"aquí"`. Es el primer texto que lee el candidato.

---

### BUG 9 — Múltiples acentos faltantes en AplicarModal *(5º día)*
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 18, 22, 24, 25, 121, 157, 177, 187
"Mas de 5 años", "maximo 1 hora", "Estado de Mexico", "reubicacion", "maximo 24 horas habiles", "Correo electronico", "Ubicacion", "documentacion basica".

---

### BUG 13 — "Nueva conversacion" sin acento *(5º día)*
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 161
`"Nueva conversacion"` → `"Nueva conversación"`.

---

### BUG 14 — FAQs editadas en el admin NUNCA llegan a Kyo *(5º día)*
**Archivos:** `src/lib/assistant/knowledge.ts` líneas 99-105, `src/app/api/assistant/chat/route.ts`

`buildSystemPrompt()` usa `COMPANY.faqs` (hardcodeado), ignorando completamente la tabla `kyo_faqs` de Supabase.

---

### BUG 15 — `getStoredInstrucciones()` usa anon key en vez de service role *(5º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 14-18

Si RLS de `kyo_config` se endurece, falla silenciosamente. Reemplazar cliente local por `sbAdmin` (ya declarado en línea 36).

---

### BUG 16 — `rateLimitMap` crece sin límite (memory leak en VPS) *(5º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Con días de uptime un bot puede agotar la RAM del VPS (4 GB).

**Fix mínimo:**
```ts
if (rateLimitMap.size > 10_000) {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }
}
```

---

### BUG 17 — Conversaciones guardadas en Supabase truncadas *(5º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 42-64 y 131

`saveConversation` recibe `history` ya recortado a 20 mensajes. El admin ve conversaciones sin el nombre del candidato ni el perfil de los primeros pasos.

---

### BUG 18 — `logEvent("kyo_mensaje")` registra PII del candidato *(5º día)*
**Archivo:** `src/components/assistant/useChat.ts` línea 81

El nombre completo (Paso 0) y zona geográfica (Paso 3) quedan en `site_eventos` sin consentimiento explícito.

---

### BUG 19 — Formulario de /contacto sin elemento `<form>` *(5º día)*
**Archivo:** `src/app/contacto/page.tsx` líneas 21, 77-119

`handleSubmit` es un función async invocada con `onClick`. El formulario usa `<div>`. Consecuencias: Enter no envía, validación HTML5 no se dispara, lectores de pantalla no lo reconocen como formulario interactivo.

**Fix:** `<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>` + `<button type="submit">`.

---

### BUG 20 — "Whatsapp" con capitalización incorrecta en Navbar *(5º día)*
**Archivo:** `src/components/layout/Navbar.tsx` líneas 94 y 120

El nombre de marca correcto es **WhatsApp**. Aparece dos veces como "Whatsapp": en `aria-label` (línea 94), botón desktop (línea 97) y menú mobile (línea 120).

---

### BUG 21 — Estadísticas contradictorias entre páginas y Kyo *(5º día)*
**Archivos:** `src/app/contacto/page.tsx` línea 64, `src/lib/assistant/knowledge.ts` línea 79

`/contacto` dice "más de 10 años en el mercado laboral". `knowledge.ts` dice "3+ años". El candidato recibe información contradictoria.

---

### BUG 22 — Menú mobile no cierra al tocar fuera *(5º día)*
**Archivo:** `src/components/layout/Navbar.tsx` líneas 103-124

No hay backdrop ni handler de clic exterior. En mobile el usuario espera que tocar el contenido de fondo cierre el menú.

---

### BUG 23 — `reset()` no regenera sessionId *(5º día)*
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

"Nueva conversación" borra localStorage pero no regenera `kyo_session_id`. El nuevo chat sobreescribe la conversación anterior en Supabase.

**Fix:**
```ts
sessionStorage.removeItem("kyo_session_id");
```

---

### BUG 24 — Redirección interrumpe lectura de recomendaciones *(5º día)*
**Archivo:** `src/components/assistant/useChat.ts` línea 127

Delay fijo de 700ms insuficiente para mensajes con 2-3 vacantes (~300 palabras).

**Fix:**
```ts
const readingMs = Math.min(Math.max(data.content.length * 30, 1200), 4000);
setTimeout(() => router.push(target.path), readingMs);
```

---

## 🔴 BUGS NUEVOS — DETECTADOS HOY (2026-06-16)

### BUG 25 — Cursos del sitio público y Kyo ignoran la tabla de Supabase
**Archivos:** `src/app/cursos/page.tsx` línea 7, `src/lib/assistant/knowledge.ts` línea 1-2

La página pública `/cursos` y Kyo leen de `COURSES` importado de `src/lib/courses.ts` (array estático). El admin puede crear/editar/desactivar cursos en Supabase desde `/admin/cursos`, pero esos cambios **nunca se reflejan ni en la página pública ni en las respuestas de Kyo**.

Esto es el equivalente exacto de BUG 1 para el módulo de cursos. Si el admin añade un nuevo curso de Liderazgo, el candidato empresarial no lo verá en `/cursos` y Kyo no podrá recomendarlo.

**Fix para la página pública (`src/app/cursos/page.tsx`):**
```ts
// Reemplazar import estático por fetch de Supabase al montar:
useEffect(() => {
  supabase
    .from("cursos")
    .select("*")
    .eq("activo", true)
    .order("id")
    .then(({ data }) => setCursos((data as Course[]) ?? []));
}, []);
```

**Fix para Kyo (`src/app/api/assistant/chat/route.ts`):** Igual que BUG 1 — cargar cursos activos de Supabase con `sbAdmin` antes del loop y pasarlos a `buildSystemPrompt()` y `executeTool()`.

---

### BUG 26 — Markdown de Kyo se renderiza como texto plano en el chat
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 211 y 227

`MessageBubble` renderiza `{message.content}` directamente en el DOM. El Paso 5 del system-prompt usa formato numbered list + negrita (`**`):

```
1. Cajero de Caja — Empresa X — Porque...
2. Auxiliar Admin — Empresa Y — Porque...
```

Con `whitespace-pre-wrap` los saltos de línea se preservan, pero `**texto**` aparece literalmente con asteriscos. Esto aplica a todas las respuestas estructuradas de Kyo, haciéndolas visualmente sucias.

**Fix — micro-renderer en `ChatWidget.tsx`:**
```tsx
function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

// En MessageBubble:
<div
  dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }}
  className="max-w-[80%] bg-[#F3F4F7] text-navy rounded-2xl rounded-bl-md px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap"
/>
```

**Nota de seguridad:** Kyo es la única fuente del contenido (`role: "assistant"`), no input del usuario. El texto del usuario NO debe usar `dangerouslySetInnerHTML`. Solo aplicar en burbujas `isUser === false`.

---

### BUG 27 — Navbar hace un query a Supabase en cada carga de página (performance)
**Archivo:** `src/components/layout/Navbar.tsx` líneas 24-29

```ts
useEffect(() => {
  supabase
    .from("vacantes")
    .select("id", { count: "exact", head: true })
    .eq("activa", true)
    .then(({ count }) => setHayVacantes((count ?? 0) > 0));
}, []);
```

Este query se ejecuta en **cada página del sitio** (Navbar está en PublicShell). Agrega ~100-200ms de latencia a cada carga. La lógica solo sirve para OCULTAR el link "Vacantes" si no hay ninguna — un caso rarísimo en producción. El estado optimista `true` ya cubre el 99% de los casos.

**Fix A (simple) — caché en localStorage con TTL de 1 hora:**
```ts
useEffect(() => {
  const KEY = "kyo_hay_vacantes";
  const TTL = 60 * 60 * 1000; // 1h
  const cached = localStorage.getItem(KEY);
  if (cached) {
    const { value, expires } = JSON.parse(cached);
    if (Date.now() < expires) { setHayVacantes(value); return; }
  }
  supabase.from("vacantes").select("id", { count: "exact", head: true }).eq("activa", true)
    .then(({ count }) => {
      const v = (count ?? 0) > 0;
      setHayVacantes(v);
      localStorage.setItem(KEY, JSON.stringify({ value: v, expires: Date.now() + TTL }));
    });
}, []);
```

**Fix B (más simple) — eliminar el query del todo:** Si Kyoszen siempre tiene vacantes activas, eliminar `checkVacantes` de `BASE_LINKS` y mostrar el link siempre.

---

## Sugerencias de UX
### Alta prioridad

- **CTA inaccesible en mobile en detalle de vacante** — `src/app/vacantes/[id]/_content.tsx` líneas 214-232. El sidebar sticky solo aparece en `lg:`. En mobile el candidato tiene que hacer scroll por toda la vacante para llegar a "Aplicar ahora".

  **Fix:** Agregar barra fija inferior en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border px-5 py-3 flex gap-3 z-40 pb-safe">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 text-[13px] font-extrabold">
      Aplicar ahora
    </button>
    <a href="https://wa.link/5zv0ba" target="_blank" className="bg-wa text-white rounded-full px-4 py-3 text-[13px] font-extrabold flex items-center gap-2 no-underline">
      WA
    </a>
  </div>
  ```

- **Empty state de vacantes sin salida** — `src/app/vacantes/page.tsx` líneas 231-234. El candidato sin resultados ve solo texto. Agregar botón "Limpiar filtros" + enlace a WhatsApp para no perder el lead.

- **Tecla Escape no cierra el chat** — `src/components/assistant/ChatWidget.tsx`. Fix:
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  ```

### Media prioridad

- **Sin skeleton durante la carga de vacantes** — `src/app/vacantes/page.tsx`. La página muestra "0 vacantes" mientras Supabase responde. Mostrar 8 tarjetas `animate-pulse` mientras `jobs.length === 0` y no hay filtros activos.

- **"Confidencial" mismo estilo que empresa real** — `src/app/vacantes/page.tsx` línea 216. Aparece en azul bold uppercase como si fuera un nombre real. Cambiar a itálica y color muted: `className="text-[11px] italic text-muted uppercase tracking-wide mb-2"`.

- **`salario_nota` ausente en cards del listado** — `src/app/vacantes/page.tsx`. El campo existe en la BD pero no se incluye en el query del listado (línea 69). El candidato ve `$8,500/mes` sin saber si es neto, bruto o semanal. Añadir `salario_nota` al select y mostrarlo debajo del salario en la card.

- **Chat muy pequeño en landscape mobile** — `src/components/assistant/ChatWidget.tsx` línea 120. `h-[min(60vh,560px)]` en landscape a 400px deja ~240px de área útil. Fix: `h-[min(60svh,560px)]` (usar `svh` para descontar la barra del navegador).

### Baja prioridad

- **`aria-modal` y `role="dialog"` faltantes en el chat** — `src/components/assistant/ChatWidget.tsx` línea 115. Agregar `role="dialog" aria-label="Chat con Kyo" aria-modal="true"`.

- **Hamburger sin `aria-expanded`** — `src/components/layout/Navbar.tsx` línea 55. Cambiar a `aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileOpen}`.

- **Backdrop de AplicarModal cierra sin advertencia en mobile** — `src/components/ui/AplicarModal.tsx` línea 79. Verificar si hay campos completados antes de cerrar para evitar pérdida accidental.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía/confidencial** — `src/lib/assistant/system-prompt.ts` línea 44. Si la vacante tiene empresa vacía, el campo `[Empresa]` queda en blanco. Agregar instrucción: *"Si la empresa es null o vacía, usar 'empresa confidencial'."*

- **Paso 6 no maneja el rechazo del candidato** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "ninguna me interesa", no hay instrucción. Agregar Paso 6b: *"Si el candidato rechaza todas las opciones: agradecer, ofrecer banco de talentos con `navigate_to('/contacto')` y sugerir `/cursos` si quiere mejorar su perfil."*

- **Kyo no menciona el tiempo de respuesta de 24h en el cierre** — El stat más convincente para motivar la aplicación nunca aparece en el Paso 6. Agregar en el Paso 6: *"Al invitar a aplicar, mencionar que el equipo responde en menos de 24 horas hábiles."*

- **Resumen de perfil como ancla contra el truncado del historial** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se corta a 20 mensajes; si el perfil quedó en los primeros pasos, Kyo lo pierde. Agregar al Paso 3 del system-prompt: *"Al completar el perfil, emitir en una sola línea: 'Perfecto, [nombre]. Perfil: [puesto], [N] años, zona [X], jornada [Y].' Esto preserva el contexto ante truncado."*

- **Pre-calificación de leads empresa** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto`. Mejor flujo: preguntar primero *"¿El nombre de su empresa y qué tipo de perfil necesita?"* para que el lead llegue con contexto al inbox.

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo conoce la jornada preferida desde el Paso 4 pero no puede usarla como filtro de búsqueda.

  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```

- **Nueva tool: `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool lo capturaría directamente:

  ```ts
  {
    name: "register_talent_interest",
    description: "Registra el interés de un candidato en el banco de talentos cuando no hay vacante disponible.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        puesto: { type: "string" },
        experiencia_anios: { type: "number" },
        ubicacion: { type: "string" },
        jornada: { type: "string" }
      },
      required: ["nombre", "puesto"]
    }
  }
  ```
  En `executeTool`: insertar en `contactos` con `origen: 'kyo_banco_talentos'`.

### Problemas detectados

- **Fallback genérico cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202.
  ```ts
  // Actual:
  const replyContent = finalText || "Entendido, ¿en que mas te puedo ayudar?";
  // Fix: sin acentos + mejor contexto cuando hay navegación
  const replyContent = finalText ||
    (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. Presentar 2-3 vacantes con justificación consume ~600-800 tokens. Cambiar a `max_tokens: 1536`.

- **`sessionId` inconsistente entre visitas** — `src/components/assistant/useChat.ts` líneas 45-53. `session_id` usa `sessionStorage` (efímero) pero el historial usa `localStorage` (persistente). Un candidato que regresa ve su conversación anterior pero genera un `session_id` nuevo. Fix: mover `getSessionId()` a `localStorage`.

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo de Kyo** — El candidato no sabe en qué paso está. Un texto sutil en el header del chat (ej. "Paso 2 de 5 — Experiencia") reduce abandonos. Inferir el paso contando mensajes del usuario. Implementar en `ChatWidget.tsx` con `estimarPaso(messages: ChatMessage[]): number`.

- **Auto-apertura contextual de Kyo en `/vacantes`** — Un candidato que lleva 5 segundos filtrando sin encontrar lo que busca se beneficia de un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. Implementar con `useEffect` + `setTimeout(3500)` en la ruta `/vacantes`, una sola vez por sesión (flag en `sessionStorage`).

- **Tracking del funnel Kyo → aplicación** — No hay evento analytics para cuando Kyo presenta recomendaciones. Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`. Sin este evento es imposible medir el ROI de Kyo.

- **Discrepancias de estadísticas en el sitio** — `/contacto/page.tsx` línea 64 dice "10 años"; `knowledge.ts` línea 79 dice "3+"; posiblemente `Hero.tsx` dice otro número. Elegir el número correcto y unificar en todos los archivos. Mientras estén desincronizados, la empresa parece inconsistente.
