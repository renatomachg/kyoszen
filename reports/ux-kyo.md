# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-15
**Cambios analizados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/components/ui/AplicarModal.tsx`, `src/components/layout/Navbar.tsx`, `src/app/contacto/page.tsx`

---

## Cambios Recientes Detectados

Sin commits de código en los últimos 3 días — solo health checks y reportes automáticos del VPS. Los bugs críticos documentados desde el 2026-06-12 **siguen sin corregirse (día 4)**. Este reporte añade **6 hallazgos nuevos** (BUG 19–24) no detectados en reportes anteriores y mantiene el escalamiento de los bugs acumulados.

---

## 🔴 BUGS CRÍTICOS ACUMULADOS — DÍA 4 SIN CORRECCIÓN

> Reportados el 2026-06-12/13/14. El flujo candidato → Kyo → vacante → aplicación está **roto en producción**.

### BUG 1 — Kyo recomienda vacantes que no existen *(BLOQUEANTE — 4º día)*
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

### BUG 2 — Filtro "Marca" siempre devuelve 0 resultados *(4º día)*
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

### BUG 3 — Vocabulario Contrato/Jornada incompatible entre BD, filtros y Kyo *(4º día)*
**Archivos:** `src/app/vacantes/page.tsx` líneas 30-31, `src/lib/assistant/system-prompt.ts` líneas 85-91

Los tres sistemas usan valores distintos. Los filtros siempre devuelven 0 coincidencias.

**Fix:** Unificar a los valores del form admin (fuente de verdad: la BD). Actualizar CONTRATOS/JORNADAS en `vacantes/page.tsx` y los ejemplos de URL en `system-prompt.ts`.

---

### BUG 5 — MAX_TOOL_ITERATIONS demasiado bajo para el Paso 5 *(4º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` línea 85

En el Paso 5: `search_jobs` → `get_job_details` × 2 → `navigate_to` = 4 iteraciones. Con `get_company_info` adicional, se alcanza el límite de 5 y la respuesta se trunca.

**Fix:** Cambiar `MAX_TOOL_ITERATIONS` de `5` a `8`.

---

### BUG 8 — Saludo de Kyo sin acento *(4º día)*
**Archivo:** `src/components/assistant/useChat.ts` línea 20

`"aqui"` → `"aquí"`. Es el primer texto que lee el candidato.

---

### BUG 9 — Múltiples acentos faltantes en AplicarModal *(4º día)*
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 18, 22, 24, 25, 121, 157, 177, 187

"Mas de 5 años", "maximo 1 hora", "Estado de Mexico", "reubicacion", "maximo 24 horas habiles", "Correo electronico", "Ubicacion", "documentacion basica". Todos deben llevar tildes y caracteres correctos en español.

---

### BUG 13 — "Nueva conversacion" sin acento *(4º día)*
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 161

`"Nueva conversacion"` → `"Nueva conversación"`.

---

### BUG 14 — FAQs editadas en el admin NUNCA llegan a Kyo *(4º día)*
**Archivos:** `src/lib/assistant/knowledge.ts` líneas 99-105, `src/app/api/assistant/chat/route.ts` línea 152

`buildSystemPrompt()` usa `COMPANY.faqs` (hardcodeado), ignorando completamente la tabla `kyo_faqs` de Supabase que el admin edita.

**Fix en `src/app/api/assistant/chat/route.ts`:**
```ts
const { data: faqsDB } = await sbAdmin
  .from("kyo_faqs")
  .select("pregunta, respuesta")
  .eq("activo", true)
  .order("orden");
const faqsDynamic = faqsDB?.map(f => ({ q: f.pregunta, a: f.respuesta })) ?? [];
```
Pasar `faqsDynamic` a `buildSystemPrompt()` con un parámetro opcional `faqsOverride`.

---

### BUG 15 — `getStoredInstrucciones()` usa anon key en vez de service role *(4º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 14-18

Si la política RLS de `kyo_config` se endurece, esta fetch fallará silenciosamente y Kyo usará siempre las instrucciones default.

**Fix:** Reemplazar el cliente local por `sbAdmin` (ya declarado en línea 36).

---

### BUG 16 — `rateLimitMap` crece sin límite (memory leak en producción) *(4º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` de rate limiting nunca se limpia. Con días de uptime un bot con IPs rotativas puede agotar la RAM del VPS.

**Fix:**
```ts
if (rateLimitMap.size > 10_000) {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }
}
```

---

### BUG 17 — Conversaciones guardadas en Supabase están truncadas *(4º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 42-64 y 131

`saveConversation` recibe `history` ya recortado a 20 mensajes. El admin ve en `/admin/kyo → Conversaciones` solo la cola de la conversación, sin el nombre del candidato ni el perfil de los primeros pasos.

**Fix mínimo:** Pasar el historial completo a `saveConversation` como parámetro separado, sin el slice.

---

### BUG 18 — `logEvent("kyo_mensaje")` registra PII del candidato *(4º día)*
**Archivo:** `src/components/assistant/useChat.ts` línea 81

El Paso 0 captura el nombre completo y el Paso 3 la zona geográfica — datos que quedan en `site_eventos` sin consentimiento explícito.

**Fix mínimo:**
```ts
logEvent("kyo_mensaje", "");  // solo contar, no guardar contenido
```

---

## 🔴 BUGS NUEVOS — DETECTADOS HOY (2026-06-15)

### BUG 19 — Formulario de /contacto sin elemento `<form>` (accesibilidad rota)
**Archivo:** `src/app/contacto/page.tsx` líneas 71-119

El formulario de contacto está construido con `<div>` y un botón con `onClick`. Consecuencias:
- Presionar **Enter** en cualquier campo NO envía el formulario (flujo roto para teclado)
- La validación HTML5 nativa (`required`) no se dispara
- Los lectores de pantalla no anuncian el área como formulario interactivo
- El autocompletado del navegador funciona de forma degradada

**Fix:** Envolver los campos en `<form>` y cambiar el botón:
```tsx
<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
  {/* campos existentes */}
  <button type="submit" disabled={sending}>
    {sending ? "Enviando..." : "Enviar mensaje"}
  </button>
</form>
```

---

### BUG 20 — "Whatsapp" con capitalización incorrecta en Navbar
**Archivo:** `src/components/layout/Navbar.tsx` líneas 97 y 120

El nombre de marca correcto es **WhatsApp** (con A y P mayúsculas). Aparece dos veces como "Whatsapp": en el botón desktop y en el menú mobile. Es el botón más visible del Navbar.

**Fix en línea 97 y 120:** `"Whatsapp"` → `"WhatsApp"`.

---

### BUG 21 — Discrepancia "10 años" en /contacto vs datos reales
**Archivo:** `src/app/contacto/page.tsx` línea 64

El hero de /contacto dice **"más de 10 años en el mercado laboral"**. `src/lib/assistant/knowledge.ts` línea 79 dice **"3+"** años. Un candidato que lee /contacto y luego habla con Kyo recibe datos contradictorios sobre la antigüedad de la empresa.

(Nota: el Hero de la home tiene el mismo problema con "7000+" vs "687+", reportado como oportunidad de mejora el 2026-06-14).

**Fix:** Decidir el número correcto y actualizarlo en `/contacto/page.tsx` línea 64 y en `knowledge.ts` línea 79 de forma simultánea.

---

### BUG 22 — Menú mobile no cierra al tocar fuera
**Archivo:** `src/components/layout/Navbar.tsx` líneas 103-124

El menú mobile se abre pero no tiene backdrop ni handler de clic exterior. El usuario que abre el menú y toca en el contenido de fondo espera que se cierre — no ocurre. En mobile es el comportamiento esperado y su ausencia genera confusión.

**Fix:** Agregar un overlay semitransparente detrás del menú que al tocarse ejecute `setMobileOpen(false)`:
```tsx
{mobileOpen && (
  <>
    <div className="fixed inset-0 z-[98] bg-transparent" onClick={() => setMobileOpen(false)} />
    <div className="fixed top-[88px] left-5 right-5 ... z-[99]">
      {/* menú existente */}
    </div>
  </>
)}
```

---

### BUG 23 — `reset()` no regenera sessionId → conversaciones se mezclan en Supabase
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

Cuando el usuario hace "Nueva conversación", `reset()` borra el historial de localStorage pero **no regenera el `kyo_session_id` en sessionStorage**. El nuevo chat sigue enviando el mismo `sessionId` al API, por lo que el `upsert` en `kyo_conversaciones` sobreescribe la conversación anterior en lugar de crear un registro nuevo. El admin ve una sola conversación que mezcla dos sesiones distintas.

**Fix en `useChat.ts`:**
```ts
const reset = useCallback(() => {
  setMessages([INITIAL_GREETING]);
  setError(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("kyo_session_id"); // fuerza nuevo ID en el próximo mensaje
  }
}, []);
```

---

### BUG 24 — Redirección de Kyo interrumpe mensajes largos antes de que el usuario los lea
**Archivo:** `src/components/assistant/useChat.ts` línea 127

```ts
setTimeout(() => router.push(target.path), 700);
```

El delay fijo de 700ms es insuficiente para mensajes con 2-3 vacantes recomendadas (~300 palabras). El usuario inicia la lectura y es redirigido antes de terminar. Si la vacante no le convence, tiene que volver y el chat ya no muestra el contexto de la recomendación.

**Fix:** Escalar el delay en función del largo del texto de respuesta:
```ts
const readingMs = Math.min(Math.max(data.content.length * 30, 1200), 4000);
setTimeout(() => router.push(target.path), readingMs);
```
Esto da ~1.2s para mensajes cortos y hasta 4s para respuestas largas, sin exceder la tolerancia del usuario.

---

## Sugerencias de UX
### Alta prioridad

- **CTA inaccesible en mobile en detalle de vacante** — `src/app/vacantes/[id]/_content.tsx` líneas 214-232. El sidebar sticky solo aparece en `lg:`. En mobile el candidato tiene que hacer scroll por toda la vacante para llegar a "Aplicar ahora".

  **Fix:** Agregar barra fija inferior en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border px-5 py-3 flex gap-3 z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 text-[13px] font-extrabold">
      Aplicar ahora
    </button>
    <a href="https://wa.link/5zv0ba" target="_blank" className="bg-wa text-white rounded-full px-4 py-3 text-[13px] font-extrabold flex items-center gap-2 no-underline">
      WA
    </a>
  </div>
  ```

- **Empty state de vacantes sin salida** — `src/app/vacantes/page.tsx` líneas 231-234. El candidato sin resultados ve solo texto. Agregar botón "Limpiar filtros" + enlace a WhatsApp para no perder el lead.

- **Tocar backdrop cierra AplicarModal sin advertencia** — `src/components/ui/AplicarModal.tsx` línea 79. En mobile ocurre accidentalmente. Fix: verificar si hay nombre escrito antes de cerrar.

- **Tecla Escape no cierra el chat** — `src/components/assistant/ChatWidget.tsx`. Fix:
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  ```

### Media prioridad

- **Sin skeleton durante la carga de vacantes** — `src/app/vacantes/page.tsx`. La página muestra 0 resultados mientras Supabase responde. Mostrar 8 tarjetas `animate-pulse` mientras `jobs.length === 0` y no hay filtros activos.

- **"Confidencial" mismo estilo que empresa real** — `src/app/vacantes/page.tsx` línea 216. Aparece en azul bold uppercase como si fuera un nombre real. Cambiar a itálica y color muted.

- **`salario_nota` ausente en cards del listado** — `src/app/vacantes/page.tsx`. El campo existe en la BD pero no se incluye en el query del listado. El candidato ve `$8,500/mes` sin saber si es neto, bruto o semanal.

- **Chat muy pequeño en landscape mobile** — `src/components/assistant/ChatWidget.tsx` línea 120. `h-[min(60vh,560px)]` en landscape a 400px deja solo ~240px de área útil. Fix: `h-[min(60vh,max(340px,560px))]` o detectar landscape con media query.

### Baja prioridad

- **`aria-modal` y `role="dialog"` faltantes en el chat** — `src/components/assistant/ChatWidget.tsx` línea 115. Agregar `role="dialog" aria-label="Chat con Kyo" aria-modal="true"`.

- **Hamburger sin `aria-expanded`** — `src/components/layout/Navbar.tsx` línea 55. Cambiar a `aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={mobileOpen}`.

- **Navbar `aria-label="Whatsapp"`** — `src/components/layout/Navbar.tsx` línea 95. Correcto sería `aria-label="Escribirnos por WhatsApp"`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía/confidencial** — `src/lib/assistant/system-prompt.ts` línea 44. Si la vacante tiene empresa vacía, el campo `[Empresa]` queda en blanco. Agregar: *"Si la empresa es null o vacía, usar la frase 'empresa confidencial'."*

- **Paso 6 no maneja el rechazo del candidato** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "ninguna me interesa", no hay instrucción. Agregar Paso 6b: *"Si el candidato rechaza todas las opciones: agradecer, ofrecer banco de talentos con `navigate_to('/contacto')` y mencionar que le contactaremos cuando surja algo compatible. Si quiere mejorar su perfil, sugerir `/cursos`."*

- **Kyo no menciona el tiempo de 24h en el cierre** — El stat más poderoso para motivar la aplicación nunca aparece en el Paso 6. Agregar en el Paso 6: *"Al invitar a aplicar, mencionar que el equipo responde en menos de 24 horas hábiles."*

- **Resumen de perfil como memoria contra truncado** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se corta a 20 mensajes; si el perfil quedó en los primeros pasos, Kyo lo pierde. Agregar en el Paso 3 del system-prompt: *"Al completar el perfil, emitir un resumen compacto de una línea: 'Perfecto, [nombre]. Perfil: [puesto], [N] años, zona [X], jornada [Y].' Esto preserva el contexto clave ante truncado del historial."*

- **Pre-calificación de leads empresa** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto`. Mejor flujo: preguntar primero *"¿Me podría decir el nombre de su empresa y qué tipo de perfil necesita?"* para que el lead llegue con contexto al inbox.

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo conoce la jornada preferida desde el Paso 4 pero no puede usarla como filtro de búsqueda.

  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```

- **Nueva tool: `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool lo capturaría sin formulario manual:

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

- **Fallback sin acento ni contexto cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202.
  ```ts
  // Actual:
  const replyContent = finalText || "Entendido, ¿en que mas te puedo ayudar?";
  // Fix:
  const replyContent = finalText ||
    (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. Presentar 2-3 vacantes con justificación consume ~600-800 tokens. Cambiar a `max_tokens: 1536`.

- **`sessionId` inconsistente entre visitas** — `src/components/assistant/useChat.ts` líneas 45-53. El `session_id` usa `sessionStorage` (efímero) pero el historial usa `localStorage` (persistente). Un candidato que regresa ve su conversación anterior pero genera un `session_id` nuevo. Fix: mover `getSessionId()` a `localStorage`.

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo de Kyo** — El candidato no sabe en qué paso del proceso está. Un texto sutil en el header del chat (ej. "Paso 2 de 5 — Experiencia") reduce abandonos. Se puede inferir el paso contando los mensajes del usuario. Implementar en `ChatWidget.tsx` con `estimarPaso(messages: ChatMessage[]): number`.

- **Auto-apertura contextual de Kyo en `/vacantes`** — Un candidato que lleva 5 segundos filtrando sin encontrar lo que busca se beneficia de un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. Implementar con `useEffect` + `setTimeout(3500)` en la ruta `/vacantes`, una sola vez por sesión (flag en `sessionStorage`).

- **Tracking del funnel Kyo → aplicación** — No hay evento analytics para cuando Kyo presenta recomendaciones. Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`. Sin este evento es imposible medir el ROI de Kyo.

- **Búsqueda muestra "0 vacantes" durante la carga** — `src/app/vacantes/page.tsx`. El contador dice "0 vacantes encontradas" mientras Supabase responde. Cambiar a "Cargando vacantes..." cuando el array esté vacío y no haya filtros activos.

- **Discrepancias de estadísticas en el sitio** — `src/components/sections/Hero.tsx` dice "7000+ candidatos / 10+ años"; `src/lib/assistant/knowledge.ts` línea 79 dice "687+ / 3+"; `src/app/contacto/page.tsx` línea 64 dice "10 años". Son tres fuentes distintas con números distintos. Elegir los números correctos y unificarlos en los tres lugares.
