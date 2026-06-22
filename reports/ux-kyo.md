# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-22
**Cambios analizados:** Sin commits de código nuevo desde `1c2590d` (compresión ffmpeg, 2026-06-20). Re-lectura completa de: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/app/vacantes/[id]/page.tsx`, `src/components/ui/AplicarModal.tsx`, `src/app/revisor/page.tsx`.

---

## Cambios Recientes Detectados

**Sin código nuevo hoy.** El último commit de código sigue siendo `1c2590d` (compresión de video TikTok con ffmpeg). Análisis de hoy agrega 3 bugs nuevos (BUG 53–55) encontrados en `AplicarModal.tsx` y `useChat.ts` durante la revisión de privacidad de datos.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (heredados activos)

### BUG 1 — Kyo recomienda vacantes de demo, no de Supabase (11º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` importado de `@/lib/jobs` (datos hardcoded de demo). El Paso 5 del flujo — el más importante para conversión — recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase.

**Fix:** Reemplazar `listJobs()` y `getJob()` para leer de Supabase con service role en una implementación `SupabaseKnowledgeProvider`. La interfaz ya está definida en `KnowledgeProvider`.

---

## 🟠 BUGS NUEVOS — DETECTADOS HOY (2026-06-22)

### BUG 53 — 6 cadenas sin acento en AplicarModal — afectan a TODOS los candidatos que aplican
**Archivo:** `src/components/ui/AplicarModal.tsx`

El modal de aplicación es el formulario más crítico del sitio (conversión final). Tiene 6 strings sin acento que dañan la percepción profesional:

| Línea | Actual | Corrección |
|-------|--------|------------|
| 19 | `"Mas de 5 años"` | `"Más de 5 años"` |
| 25 | `"CDMX — maximo 1 hora de traslado"` | `"CDMX — máximo 1 hora de traslado"` |
| 121 | `"en maximo 24 horas habiles"` | `"en máximo 24 horas hábiles"` |
| 156 | `label="Correo electronico"` | `label="Correo electrónico"` |
| 177 | `label="Ubicacion / alcance de traslado"` | `label="Ubicación / alcance de traslado"` |
| 187 | `"documentacion basica"` | `"documentación básica"` |

**Impacto:** El mensaje de éxito (línea 121) es lo último que lee el candidato antes de cerrar. Cometidos en ese momento refuerzan la impresión negativa.

---

### BUG 54 — Opción "Mas de $20k" sin acento en el filtro de salario de /vacantes
**Archivo:** `src/app/vacantes/page.tsx` línea 32

```ts
const SALARIOS = ["Todos", "Menos de $10k", "$10k - $15k", "$15k - $20k", "Mas de $20k"];
```

`"Mas de $20k"` debería ser `"Más de $20k"`. Es el filtro de salario más seleccionado por candidatos calificados (perfil objetivo de Kyoszen).

**Fix:** Una línea: cambiar `"Mas de $20k"` a `"Más de $20k"`.

---

### BUG 55 — `logEvent("kyo_mensaje")` graba datos personales en analytics (privacidad LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```

El flujo de Kyo pide el nombre del candidato en el Paso 0. Cuando el candidato responde `"Me llamo Juan Pérez"`, ese texto se guarda textual en `site_eventos.valor`. Las primeras respuestas también pueden incluir números de teléfono o correos si el candidato los escribe voluntariamente.

El modal de aplicación invoca la LFPDPPP (línea 232), pero `kyo_mensaje` no está cubierta por ese aviso porque los usuarios no saben que sus respuestas al chat van a analytics.

**Fix:** Registrar el evento sin el payload completo del mensaje:
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```
O, si se necesita el texto para análisis, filtrar nombres antes de guardar (difícil de hacer correctamente). La opción más simple y segura es no guardar el contenido.

---

## Bugs anteriores aún sin resolver (prioridad descendente)

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (11º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210 y 227

`whitespace-pre-wrap` muestra `**texto**` literal. Fix de 5 minutos:
```ts
function renderMd(t: string) {
  return { __html: t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") };
}
```
Y usar `<div dangerouslySetInnerHTML={renderMd(message.content)} />` en `MessageBubble` (líneas 210 y 227).

### BUG 46 — "aqui" sin acento en el saludo inicial de Kyo (11º día)
**Archivo:** `src/components/assistant/useChat.ts` línea 20

`"estoy aqui para orientarte"` → `"estoy aquí para orientarte"`. Primer texto que lee todo candidato.

### BUG 49 — `reset()` no limpia `sessionStorage` — nueva conversación reutiliza el mismo `session_id`
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

Añadir al `reset`: `sessionStorage.removeItem("kyo_session_id");`

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota`
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

Cambiar el fallback de `"MXN bruto"` a `"mensual"` (neutro) hasta que el admin complete la información.

### BUG 47 — `search_jobs` no incluye `salario_nota` — Kyo cita salario sin contexto bruto/neto
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42

Añadir `salario_nota?: string` a `JobSummary` e instruir a Kyo para que lo mencione: `"$10,500/mes (Neto · pago semanal)"`.

### BUG 48 — Sin ARIA live region en el chat widget
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

Cambiar a: `<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">`

### BUG 52 — Cliente envía hasta 30 mensajes, servidor solo usa 20
**Archivo:** `src/components/assistant/useChat.ts` línea 99

Pre-truncar antes del fetch: `messages: newMessages.slice(-20).map(...)`.

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded en vez de Supabase
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Eliminar `generateStaticParams()` completamente; la ruta dinámica funciona igual en runtime con `dynamicParams: true` por defecto.

### BUG 44 — Inconsistencia usted/tú en el system prompt de Kyo (5º día)
**Archivo:** `src/lib/assistant/system-prompt.ts`

El saludo usa "usted" (`"¿Me permite saber su nombre?"`), el Paso 5 usa usted (`"Con base en lo que me comento"`), pero otras secciones tutean implícitamente. Elegir **usted** uniformemente en los 7 pasos y reglas.

### BUG 16 — Memory leak en `rateLimitMap` (11º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir un `setInterval` de limpieza o usar Upstash Redis.

---

## Sugerencias de UX

### Alta prioridad

- **Barra CTA sticky en mobile** — `src/app/vacantes/[id]/_content.tsx`. El sidebar `sticky top-28` solo aparece en `lg:`. En mobile el candidato hace scroll hasta el fondo sin CTA visible. Añadir:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 flex gap-3 lg:hidden z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 font-bold text-sm">
      Aplicar ahora
    </button>
    <a href="https://wa.link/5zv0ba" className="flex-1 bg-wa text-white rounded-full py-3 font-bold text-sm text-center">
      WhatsApp
    </a>
  </div>
  ```

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx` línea 231. "Sin resultados" sin ninguna salida. Añadir botón que abra Kyo:
  ```tsx
  <button onClick={() => window.dispatchEvent(new CustomEvent("kyo:open"))} className="mt-4 text-sm font-bold text-blue underline">
    Pídele ayuda a Kyo →
  </button>
  ```
  Y escuchar `"kyo:open"` en `ChatWidget.tsx` para abrir el panel.

### Media prioridad

- **"Nueva conversacion" sin acento y mal posicionado** — `ChatWidget.tsx` línea 161. Corregir a `"Nueva conversación"`. Además, el botón está al final del scroll de mensajes: el usuario tiene que bajar hasta el final para encontrarlo. Moverlo al header del widget, junto al título "Kyo · Asistente".

- **Confirmación visual al aprobar en `/revisor`** — Rosy y Monse no tienen feedback inmediato. Un toast verde/amarillo de 4s en la esquina superior al aprobar o pedir cambios.

- **Banner de progreso durante compresión ffmpeg** — La compresión tarda 10-30s sin feedback. Añadir estado `"Optimizando video para web..."` con spinner en el componente de subida de video del admin mientras la petición está en vuelo.

### Baja prioridad

- **Tour de novedad bloquea pestaña Análisis** — `src/app/revisor/page.tsx`: mostrar `<NovedadFiltros />` solo cuando `seccion === "publicaciones"`, no en la pestaña de análisis.

- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true` mejora la percepción de velocidad.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 6 sin manejo de rechazo** — Si el candidato dice "ninguna me interesa", no hay instrucción. Añadir al Paso 6 en `system-prompt.ts`:
  ```
  Si el candidato rechaza las vacantes:
  "Entiendo, [nombre]. Puedo registrar su perfil en nuestro banco de talentos para
  avisarle cuando surja una oportunidad más afín. ¿Le parece bien?"
  Navegar a /contacto.
  ```

- **Mencionar las 24h de respuesta en el Paso 5** — El dato más persuasivo para motivar la aplicación no se menciona. Añadir al formato del Paso 5: `"Nuestro equipo responde en menos de 24 horas hábiles."`.

- **Resumen de perfil en Paso 4 (ancla contra truncado de contexto)** — Con el historial cortado a 20 mensajes, una conversación larga pierde el nombre del candidato. Añadir instrucción: al completar Pasos 0-4, sintetizar: `"Perfil: [nombre], [puesto], [N años], zona [X], [jornada]."`

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero no puede filtrar por ella. Añadir al schema:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  Sin esto, el Paso 4 recoge información que nunca se usa.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, crear registro en Supabase directamente desde Kyo (puesto, experiencia, zona, jornada, `origen: 'kyo_banco_talentos'`). El candidato no tendría que llenar el formulario manualmente.

### Problemas detectados

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to`, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acentos). Fix:
  ```ts
  const replyContent = finalText || (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 (2-3 vacantes con justificación) puede acercarse al límite. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` con poco margen** — Línea 85. Paso 5 óptimo = `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Solo 1 de margen. Subir a 8.

- **`getStoredInstrucciones()` usa anon key** — Líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente. Usar `sbAdmin` (service role) declarado en línea 36.

---

## Oportunidades de mejora general

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante específica. Sin este evento es imposible medir el ROI del asistente. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`.

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header del widget (`"Paso 2 de 5"`) reduce abandonos. Se puede inferir contando mensajes del usuario en `useChat.ts`.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — Con 5s mirando "Sin resultados" + bubble proactivo. `useEffect` + `setTimeout(5000)` en la ruta, una vez por sesión (flag en sessionStorage).

- **Notificación al cliente al publicar video TikTok** — Pendiente explícito en CLAUDE.md. Al hacer PATCH para cambiar `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos. La infraestructura IONOS SMTP ya está activa.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto |
|---|-----------|----------|---------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico |
| 2 | BUG 53 — 6 accents faltantes en AplicarModal | Bajo (5 min) | Alto |
| 3 | BUG 26 — Markdown asteriscos en Kyo | Bajo (5 min) | Alto |
| 4 | BUG 55 — `kyo_mensaje` graba datos personales en analytics | Bajo (1 línea) | Alto |
| 5 | BUG 46 — Acento "aquí" en saludo inicial Kyo | Bajo (1 min) | Alto |
| 6 | BUG 54 — "Mas de $20k" sin acento en filtro salario | Bajo (1 min) | Medio |
| 7 | BUG 44 — Registro usted/tú inconsistente en prompt | Bajo (15 min) | Alto |
| 8 | BUG 51 — Fallback "MXN bruto" en vacantes sin salario_nota | Bajo (1 min) | Alto |
| 9 | BUG 32 — Confirmación visual al aprobar en /revisor | Bajo (30 min) | Alto |
| 10 | BUG 49 — reset() no limpia sessionStorage | Bajo (1 línea) | Medio |
| 11 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio |
| 12 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio |
| 13 | BUG 52 — Cliente envía 30 msgs cuando servidor usa 20 | Bajo (1 línea) | Bajo |
| 14 | BUG 43 — Sin progreso durante subida de video | Bajo (UI) | Medio |
| 15 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio |
| 16 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo |
| 17 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto |
| 18 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio |
| 19 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto |
| 20 | Tool register_talent_interest | Medio | Alto |
| 21 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio |
| 22 | BUG 28 — Tour novedad en pestaña Análisis | Bajo (1 línea) | Medio |
