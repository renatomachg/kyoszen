# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-14
**Cambios analizados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/admin/(panel)/kyo/page.tsx`

---

## Cambios Recientes Detectados

Sin commits de código en las últimas 48 horas — solo health checks automáticos del VPS. Los bugs críticos documentados en los reportes del 12 y 13 de junio **siguen abiertos por tercer día consecutivo**. Este reporte añade **5 hallazgos nuevos** no detectados anteriormente y escala la severidad de los bugs acumulados.

---

## 🔴 BUGS CRÍTICOS ACUMULADOS — DÍA 3 SIN CORRECCIÓN

> Los siguientes bugs fueron reportados el 2026-06-12 y 2026-06-13.
> Se escalan a BLOQUEANTE: el flujo candidato → vacante → aplicación está roto en producción.

### BUG 1 — Kyo recomienda vacantes que no existen *(BLOQUEANTE)*
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider.listJobs()` lee de `src/lib/jobs.ts` (array estático de demo). Las vacantes reales de Supabase son invisibles para Kyo. En el Paso 5, Kyo presenta IDs de demo que generan 404 al hacer clic. **El propósito principal de Kyo está roto.**

**Fix en `src/app/api/assistant/chat/route.ts`:** Antes del loop de herramientas, agregar:
```ts
const { data: vacantesDB } = await sbAdmin
  .from("vacantes")
  .select("id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion,tags,salario_nota,activa")
  .eq("activa", true);
```
Pasar `vacantesDB` a `buildSystemPrompt()` y a `executeTool()`.

---

### BUG 2 — Filtro "Marca" siempre devuelve 0 resultados
**Archivo:** `src/app/vacantes/page.tsx` líneas 29 y 180

Las marcas están hardcodeadas con nombres de demo ficticios incompatibles con las empresas reales en Supabase.

**Fix:**
```ts
const marcasDisponibles = useMemo(
  () => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())],
  [jobs]
);
```

---

### BUG 3 — Valores Contrato/Jornada incompatibles entre BD, filtros públicos y Kyo
**Archivos:** `src/app/vacantes/page.tsx` líneas 30-31, `src/lib/assistant/system-prompt.ts` líneas 85-91

Los tres sistemas usan vocabularios distintos. Los filtros siempre devuelven 0 coincidencias.

**Fix:** Unificar a los valores del form admin (fuente de verdad: la BD). Actualizar CONTRATOS/JORNADAS en vacantes/page.tsx y los ejemplos de URL en system-prompt.ts.

---

### BUG 5 — MAX_TOOL_ITERATIONS demasiado bajo para el Paso 5
**Archivo:** `src/app/api/assistant/chat/route.ts` línea 85

En el Paso 5: `search_jobs` → `get_job_details` × 2 → `navigate_to` = 4 iteraciones. Con `get_company_info` adicional, se alcanza el límite de 5 y la respuesta se trunca.

**Fix:** Cambiar `MAX_TOOL_ITERATIONS` de `5` a `8`.

---

### BUG 8 — Saludo de Kyo sin acento (primer mensaje visible al candidato)
**Archivo:** `src/components/assistant/useChat.ts` línea 20

```ts
"Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte."
```
`"aqui"` debe ser `"aquí"`. Es el primer texto que lee el candidato.

---

### BUG 9 — Múltiples acentos faltantes en AplicarModal
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 19, 23-25, 31, 122, 157, 177, 187

"Mas de 5 años", "maximo 1 hora", "Estado de Mexico", "reubicacion", "Correo electronico", "Ubicacion", "documentacion basica", "Si, todo en orden", "maximo 24 horas habiles" — todos deben llevar tildes y caracteres correctos.

---

### BUG 13 — "Nueva conversacion" sin acento
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 161

`"Nueva conversacion"` → `"Nueva conversación"`.

---

## 🔴 BUGS NUEVOS — DETECTADOS HOY

### BUG 14 — Los FAQs editados en el admin panel NUNCA llegan a Kyo *(crítico)*
**Archivos:** `src/app/admin/(panel)/kyo/page.tsx`, `src/lib/assistant/knowledge.ts` líneas 99-105, `src/app/api/assistant/chat/route.ts` línea 152

El admin panel tiene una pestaña completa para gestionar la tabla `kyo_faqs` en Supabase (crear, editar, activar/desactivar). **Sin embargo, `buildSystemPrompt()` nunca lee esa tabla.**

La línea 152 del route llama a `buildSystemPrompt(instrucciones)`, que internamente llama a `knowledge.getCompanyInfo()`, que devuelve `COMPANY.faqs` — un array hardcodeado con 5 FAQs estáticas en `knowledge.ts` líneas 99-105.

**Resultado:** Si el admin edita o agrega FAQs en el panel, Kyo sigue respondiendo con las FAQs del código, no las de la base de datos.

**Fix en `src/app/api/assistant/chat/route.ts`:** Agregar antes de `buildSystemPrompt`:
```ts
const { data: faqsDB } = await sbAdmin
  .from("kyo_faqs")
  .select("pregunta, respuesta")
  .eq("activo", true)
  .order("orden");

const faqsDynamic = faqsDB?.map(f => ({ q: f.pregunta, a: f.respuesta })) ?? [];
```
Pasar `faqsDynamic` a `buildSystemPrompt()` y añadir un parámetro opcional `faqsOverride` que reemplace `company.faqs` cuando esté presente.

---

### BUG 15 — `getStoredInstrucciones()` usa anon key, no service role
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 14-18

```ts
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!  // ← anon key
);
```

El resto de la route usa `sbAdmin` (service role, línea 36). Si la política RLS de `kyo_config` se endurece en el futuro (como en otras tablas del proyecto), esta fetch fallará silenciosamente y Kyo usará siempre las instrucciones default — **sin que nadie lo note**, porque el catch solo hace `return null`.

**Fix:** Reemplazar el cliente temporal por `sbAdmin`:
```ts
async function getStoredInstrucciones(): Promise<string | null> {
  if (_cachedInstrucciones && Date.now() < _cacheExpiry) return _cachedInstrucciones;
  try {
    const { data } = await sbAdmin
      .from("kyo_config")
      .select("instrucciones")
      .eq("id", 1)
      .single();
    // ...
```
Eliminar la creación del cliente local (líneas 14-18).

---

### BUG 16 — `rateLimitMap` crece sin límite (memory leak en producción)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` de rate limiting nunca se limpia. En producción con PM2 corriendo semanas, cada IP única agrega una entrada permanente. Un bot que use muchas IPs rotativas puede hacer crecer el Map hasta agotar la RAM del VPS (4 GB).

**Fix:** Purgar entradas expiradas periódicamente:
```ts
// Después de checkRateLimit:
if (rateLimitMap.size > 10_000) {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }
}
```

---

### BUG 17 — Conversaciones guardadas en Supabase están truncadas
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 42-64 y 131

`saveConversation` recibe `history` que ya está recortado a los últimos 20 mensajes (línea 131: `body.messages.slice(-20)`). Esto significa que si una conversación tiene 25+ intercambios, el admin ve en `/admin/kyo → Conversaciones` solo la cola de la conversación — **sin el nombre del candidato ni el perfil recopilado en los primeros pasos.**

**Fix:** Transmitir el historial completo al backend o, más sencillo, guardar el `sessionId` desde el inicio y hacer upsert incremental en cada turno. Alternativa mínima: pasar `body.messages` (sin el slice) a `saveConversation` como parámetro separado.

---

### BUG 18 — `logEvent("kyo_mensaje")` registra PII del candidato en analytics
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```

Cada mensaje del candidato se registra en `site_eventos` con su contenido literal. En el flujo normal, el Paso 0 captura el **nombre completo**, y el Paso 3 captura la **zona geográfica**. Estos datos personales quedan en analytics sin consentimiento explícito del usuario.

**Fix mínimo:** Solo registrar si el mensaje envió (indicativo de actividad), sin el contenido:
```ts
logEvent("kyo_mensaje", "");  // solo contar, no guardar contenido
```
**Fix completo:** Registrar solo metadatos no-PII (largo del mensaje, paso estimado del flujo).

---

## Sugerencias de UX

### Alta prioridad

- **CTA inaccesible en mobile en detalle de vacante** — `src/app/vacantes/[id]/_content.tsx` líneas 214-232. El sidebar sticky solo aparece en `lg:` (1024px+). En mobile el candidato tiene que hacer scroll por toda la vacante para llegar a "Aplicar ahora".

  **Fix:** Agregar barra fija en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border px-5 py-3 flex gap-3 z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 text-[13px] font-extrabold">
      Aplicar ahora
    </button>
    <a href="https://wa.link/5zv0ba" target="_blank" className="bg-wa text-white rounded-full px-4 py-3 text-[13px] font-extrabold flex items-center gap-2 no-underline">
      WhatsApp
    </a>
  </div>
  ```

- **Empty state de vacantes sin salida** — `src/app/vacantes/page.tsx` líneas 231-234. El candidato sin resultados ve solo texto estático. Agregar botón "Limpiar filtros" + enlace a WhatsApp.

- **Tocar backdrop borra el formulario en AplicarModal** — `src/components/ui/AplicarModal.tsx` línea 79. El `onClick={handleClose}` en el backdrop destruye el formulario sin advertencia. En mobile esto ocurre accidentalmente con frecuencia.

  **Fix:** Pedir confirmación si hay datos:
  ```ts
  onClick={() => {
    const nombre = (document.querySelector('[name="nombre"]') as HTMLInputElement)?.value;
    if (!nombre || confirm("¿Cerrar el formulario? Perderás lo que escribiste.")) handleClose();
  }}
  ```

- **Tecla Escape no cierra el chat** — `src/components/assistant/ChatWidget.tsx`. Comportamiento esperado en cualquier diálogo.

  **Fix:** Agregar en el componente:
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  ```

### Media prioridad

- **Sin skeleton durante la carga de vacantes** — `src/app/vacantes/page.tsx`. La página queda en blanco mientras Supabase responde. Mostrar 8 tarjetas `animate-pulse` mientras `jobs.length === 0`.

- **"Confidencial" con mismo estilo visual que empresa real** — `src/app/vacantes/page.tsx` línea 216. Aparece en azul bold uppercase, idéntico a un nombre de empresa. Cambiar a itálica y color muted cuando la empresa esté vacía.

- **`salario_nota` ausente en cards del listado** — `src/app/vacantes/page.tsx`. El campo existe en la BD pero no se incluye en el query ni en la UI. El candidato ve `$8,500/mes` sin saber si es neto, bruto o por semana.

- **Chat muy pequeño en landscape mobile** — `src/components/assistant/ChatWidget.tsx` línea 120. `h-[min(60vh,560px)]` en landscape a 400px → solo 240px de área útil, suficiente para 2 burbujas.

### Baja prioridad

- **`aria-modal` y `role="dialog"` faltantes en el chat** — `src/components/assistant/ChatWidget.tsx` línea 115. Agregar `role="dialog" aria-label="Chat con Kyo" aria-modal="true"` al `motion.div`.

- **Hamburger sin `aria-expanded`** — `src/components/layout/Navbar.tsx` línea 59. Cambiar a `aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileOpen}`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía/confidencial** — `src/lib/assistant/system-prompt.ts` línea 44. Si la vacante tiene empresa vacía, el formato `[Empresa]` queda en blanco. Agregar: *"Si la empresa es null o vacía, usar la frase 'empresa confidencial'."*

- **Paso 6 no maneja el rechazo del candidato** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "ninguna me interesa", no hay instrucción. Agregar Paso 6b:

  *"Si el candidato rechaza todas las opciones: agradecer, ofrecer banco de talentos con `navigate_to('/contacto')` y mencionar que le contactaremos cuando surja algo compatible. Si quiere mejorar su perfil, sugerir `/cursos`."*

- **Kyo no menciona el tiempo de 24h en el cierre** — `src/lib/assistant/knowledge.ts` línea 99. El stat más poderoso para motivar la aplicación nunca lo usa Kyo en el Paso 6. Agregar en el Paso 6: *"Al invitar a aplicar, mencionar que el equipo responde en menos de 24 horas hábiles."*

- **Resumen comprimido para conversaciones largas** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se trunca a 20 mensajes; si el perfil del candidato quedó en los primeros pasos, Kyo lo pierde. Agregar en el Paso 3 del system-prompt: *"Al completar el perfil (nombre + puesto + zona + jornada), emitir un resumen compacto de una línea que actúe como memoria: 'Perfecto, [nombre]. Perfil: [puesto], [N] años, zona [X], jornada [Y].' Esto asegura que el contexto clave sobreviva al truncado del historial."*

- **Pre-calificación de leads empresa** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto`. Mejor flujo: preguntar primero *"¿Me podría decir el nombre de su empresa y qué tipo de perfil necesita?"* para que el lead que llega al inbox ya tenga contexto.

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo conoce la jornada preferida desde el Paso 4 pero no puede usarla como filtro en la búsqueda:

  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Tiempo completo, Medio tiempo, Por proyecto" },
  contrato: { type: "string", description: "Filtra por contrato: Indefinido, Temporal, Por honorarios" },
  ```
  Agregar la lógica de filtrado correspondiente en `executeTool` y en `StaticKnowledgeProvider.listJobs()`.

- **Nueva tool: `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool lo capturaría estructuradamente sin que el candidato llene el formulario:

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
  En `executeTool`: insertar en `contactos` con `origen: 'kyo_banco_talentos'` y `asunto: 'Banco de talentos — Kyo'`.

### Problemas detectados

- **Fallback sin acento ni contexto cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202.
  ```ts
  const replyContent = finalText || "Entendido, ¿en que mas te puedo ayudar?";
  ```
  Dos problemas: acento faltante en "qué" y falta de contexto. Fix:
  ```ts
  const replyContent = finalText ||
    (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. Presentar 2-3 vacantes con justificación consume ~600-800 tokens. Cambiar a `max_tokens: 1536`.

- **`sessionId` inconsistente entre visitas** — `src/components/assistant/useChat.ts` líneas 45-53 vs líneas 27-33. El `session_id` usa `sessionStorage` (efímero) pero el historial usa `localStorage` (persistente). Un candidato que regresa ve su conversación anterior pero genera un `session_id` nuevo — las conversaciones en Supabase quedan fragmentadas. Fix: mover `getSessionId()` a `localStorage`.

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo de Kyo** — El candidato no sabe en qué paso del proceso está. Un texto sutil en el header del chat (ej. "Paso 2 de 5 — Experiencia") reduce abandonos. Se puede inferir el paso contando los mensajes del usuario sin cambios en la API. Implementar en `ChatWidget.tsx` con una función `estimarPaso(messages: ChatMessage[]): number`.

- **Auto-apertura contextual de Kyo en `/vacantes`** — Un candidato que lleva 5 segundos filtrando sin encontrar lo que busca se beneficia de un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. Implementar con `useEffect` + `setTimeout(3500)` en la ruta `/vacantes`, una sola vez por sesión (flag en `sessionStorage`).

- **Tracking del funnel Kyo → aplicación** — No hay evento analytics para cuando Kyo presenta recomendaciones de vacantes. Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`. Sin este evento es imposible medir el ROI real de Kyo.

- **Búsqueda muestra "0 vacantes" durante la carga** — `src/app/vacantes/page.tsx`. El contador dice "0 vacantes encontradas" mientras Supabase responde. Cambiar a "Cargando vacantes..." cuando el array esté vacío y no haya filtros activos.

- **Discrepancias de estadísticas entre Hero y knowledge.ts** — `src/components/sections/Hero.tsx` vs `src/lib/assistant/knowledge.ts`. El Hero muestra "7000+ candidatos colocados" y "10+ años"; knowledge.ts dice "687+" y "3+". Un candidato que abre el chat tras ver el Hero recibe datos contradictorios. Elegir los números correctos y unificarlos en ambos archivos.
