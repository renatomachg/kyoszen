# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-21
**Cambios analizados:** `src/app/api/admin/social/upload/route.ts` (ffmpeg, commit 1c2590d). Re-lectura completa de: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/app/vacantes/[id]/page.tsx`.

---

## Cambios Recientes Detectados

**Sin commits de código nuevo hoy.** El commit más reciente es `1c2590d` (compresión de video TikTok con ffmpeg), igual que ayer. Análisis de hoy agrega 7 bugs nuevos (BUG 46–52) encontrados en la lectura de `useChat.ts` y `_content.tsx`.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (heredados activos)

### BUG 1 — Kyo recomienda vacantes de demo, no de Supabase (10º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` importado de `@/lib/jobs` (datos hardcoded de demo). El Paso 5 del flujo — el más importante para conversión — recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase.

**Fix:** Reemplazar la implementación de `listJobs()` y `getJob()` para leer de Supabase con service role. Estructura ya definida en la interfaz `KnowledgeProvider`.

---

## 🟡 BUGS NUEVOS — DETECTADOS HOY (2026-06-21)

### BUG 46 — Acento faltante en el saludo inicial de Kyo
**Archivo:** `src/components/assistant/useChat.ts` línea 20

```
"Mi nombre es Kyo y estoy aqui para orientarte."
```
`"aqui"` debe ser `"aquí"`. Este es el primer texto que lee todo candidato. Un error ortográfico en el saludo daña la percepción de profesionalismo de la consultora.

**Fix:** Cambiar línea 20 a:
```ts
content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?",
```

---

### BUG 47 — `search_jobs` no incluye `salario_nota` — Kyo da salario sin contexto
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 (interfaz `JobSummary`)

`JobSummary` no tiene el campo `salario_nota` (ej. "Neto · pago semanal"). Cuando Kyo menciona `"$10,500/mes"` sin contexto, el candidato puede asumir erróneamente que es bruto, neto o semanal. El campo existe en la tabla `vacantes` pero no llega al asistente.

**Fix:** Añadir `salario_nota?: string` a `JobSummary` y mapearlo en `listJobs()`:
```ts
salario_nota: j.salario_nota ?? undefined,
```
Actualizar el system-prompt para que Kyo incluya la nota al mencionar salario: `"$10,500/mes (Neto · pago semanal)"`.

---

### BUG 48 — Chat widget sin ARIA live region — lectores de pantalla no anuncian respuestas de Kyo
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

El div de mensajes (`ref={scrollRef}`) no tiene `role="log"` ni `aria-live="polite"`. Los usuarios que navegan con lectores de pantalla no escuchan las respuestas de Kyo; tienen que explorar el DOM manualmente.

**Fix:** Cambiar línea 143:
```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">
```

---

### BUG 49 — `reset()` no limpia `sessionStorage` — nueva conversación reutiliza el mismo `session_id`
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

Al tocar "Nueva conversacion", `localStorage` se borra pero `sessionStorage` (`kyo_session_id`) no. Las siguientes interacciones se loguean bajo el mismo `session_id` en `kyo_conversaciones`, mezclando la sesión nueva con la anterior en el admin de Kyo.

**Fix:** En la función `reset`, añadir:
```ts
sessionStorage.removeItem("kyo_session_id");
```

---

### BUG 50 — `generateStaticParams()` en `/vacantes/[id]` usa `JOBS` hardcoded, no Supabase
**Archivo:** `src/app/vacantes/[id]/page.tsx` línea 4-6

```ts
import { JOBS } from "@/lib/jobs";
export function generateStaticParams() {
  return JOBS.map((j) => ({ id: String(j.id) }));
}
```
Next.js pre-genera solo los IDs del archivo demo. Vacantes nuevas creadas desde el admin (IDs distintos a los hardcoded) se sirven correctamente en runtime vía ruta dinámica, pero si alguien añade `dynamicParams: false` o si el build se rompe, las nuevas vacantes desaparecen del sitio.

**Fix:** Convertir `page.tsx` en async server component que lea de Supabase, o eliminar `generateStaticParams()` completamente (la ruta funciona igual en runtime con `dynamicParams: true` por defecto).

---

### BUG 51 — Fallback `"MXN bruto"` persiste en vacantes sin `salario_nota`
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 202

```tsx
<p className="text-[12px] text-muted">{job.salario_nota?.trim() ? job.salario_nota : "MXN bruto"}</p>
```
El campo `salario_nota` se introdujo explícitamente para reemplazar el texto fijo "MXN bruto". Vacantes existentes en Supabase sin ese campo migrado siguen mostrando "MXN bruto" — que puede ser incorrecto si el salario es neto o semanal.

**Fix:** Cambiar el fallback a un texto neutro:
```tsx
{job.salario_nota?.trim() ? job.salario_nota : "mensual"}
```
O dejar el campo vacío (sin texto adicional) hasta que el admin complete la información.

---

### BUG 52 — `useChat` envía hasta 30 mensajes al API pero el servidor ya solo usa 20
**Archivo:** `src/components/assistant/useChat.ts` línea 99 vs `src/app/api/assistant/chat/route.ts` línea 131

`MAX_STORED = 30` (useChat) pero el route hace `body.messages.slice(-20)`. El cliente envía hasta 30 mensajes a través de la red aunque el servidor descarte los primeros 10. En conversaciones largas, se transmiten ~3-4 KB innecesarios por request.

**Fix:** Pre-truncar en el cliente antes de hacer fetch:
```ts
messages: newMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
```

---

## Sugerencias de UX

### Alta prioridad

- **Barra sticky "Aplicar ahora" en mobile** — `src/app/vacantes/[id]/_content.tsx`. El sidebar con CTA (`Aplicar ahora` + WhatsApp) es `sticky top-28` pero solo aparece en `lg:` (columna derecha). En mobile el candidato tiene que hacer scroll hasta el final de la página para encontrar el botón. Añadir una barra fija en el fondo en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 flex gap-3 lg:hidden z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 font-bold text-sm">Aplicar ahora</button>
    <a href="https://wa.link/5zv0ba" className="flex-1 bg-wa text-white rounded-full py-3 font-bold text-sm text-center">WhatsApp</a>
  </div>
  ```

- **Markdown en burbujas de Kyo (BUG 26, 10º día)** — `src/components/assistant/ChatWidget.tsx` líneas 211 y 227. Los asteriscos `**texto**` aparecen literales en el chat. Fix de 5 minutos añadiendo un helper:
  ```ts
  function renderMarkdown(text: string) {
    return { __html: text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") };
  }
  ```
  Y usar `<div dangerouslySetInnerHTML={renderMarkdown(message.content)} />` en `MessageBubble`.

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx` línea 231. Cuando no hay resultados, solo aparece "Sin resultados. Intenta con otras combinaciones." No se ofrece ninguna salida. Añadir botón que abra el chat de Kyo:
  ```tsx
  <button onClick={() => window.dispatchEvent(new CustomEvent("kyo:open"))} className="mt-4 text-sm font-bold text-blue underline">
    Pídele ayuda a Kyo
  </button>
  ```
  Y escuchar `"kyo:open"` en `ChatWidget.tsx` para abrir el panel.

### Media prioridad

- **Banner de progreso durante subida de video** — `src/app/api/admin/social/upload/route.ts`. La compresión ffmpeg tarda 10-30s sin feedback visual. Añadir en el componente que llama al endpoint un estado `"Optimizando video para web..."` con spinner mientras la petición está en vuelo.

- **Acento faltante en "Nueva conversacion"** — `src/components/assistant/ChatWidget.tsx` línea 159. Debe ser `"Nueva conversación"`.

- **Confirmación visual al aprobar en `/revisor` (BUG 32, 10º día)** — Rosy y Monse necesitan feedback inmediato cuando aprueban o piden cambios. Un toast verde/amarillo de 4 segundos en la esquina superior es suficiente.

### Baja prioridad

- **Tour de novedad bloquea pestaña Análisis (BUG 28, 10º día)** — Una línea en `src/app/revisor/page.tsx`: mostrar `<NovedadFiltros />` solo cuando `seccion === "publicaciones"`.

- **Skeleton de carga en `/revisor`** — Mostrar 6 `animate-pulse` cards mientras `loading === true` mejora la percepción de velocidad.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Resolver registro usted/tú (BUG 44, 2º día)** — `src/lib/assistant/system-prompt.ts`. El saludo usa "usted" (`"¿Me permite saber su nombre?"`), el Paso 1 usa tú implícito, el Paso 5 usa usted (`"Con base en lo que me comento"`). El resultado es inconsistente. Elegir **usted** (estándar en reclutamiento formal mexicano) y revisar los 7 pasos y reglas críticas para eliminar tuteo implícito.

- **Paso 6 sin manejo de rechazo (10º día)** — Si en el Paso 6 el candidato dice "ninguna me interesa" o "no me convencen", no hay Paso 6b definido. Kyo queda sin instrucción y puede inventar. Añadir al Paso 6:
  ```
  Si el candidato rechaza las vacantes propuestas:
  "Entiendo, [nombre]. Puedo registrar su perfil en nuestro banco de talentos para avisarle cuando surja una oportunidad más afín. ¿Le parece bien?"
  Navegar a /contacto.
  ```

- **Mencionar las 24h de respuesta en Paso 5** — `src/lib/assistant/system-prompt.ts` línea 42-58. El dato más persuasivo para motivar la aplicación (`"Candidatos colocados en menos de 72h"`) no se menciona. Añadir al formato del Paso 5: `"Nuestro equipo responde en menos de 24 horas hábiles."`.

- **Pre-calificación de leads empresariales** — Línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto` sin capturar datos. Mejorar a: preguntar nombre de empresa y perfil buscado antes de navegar, para que el equipo reciba contexto útil.

- **Resumen de perfil en Paso 3 (ancla contra truncado de contexto)** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se corta a 20 mensajes. Añadir instrucción: al completar Pasos 0-4, sintetizar: `"Perfil: [nombre], [puesto], [N años], zona [X], [jornada]."` Esto preserva el contexto si la ventana se trunca.

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero no puede filtrar por ella. Añadir al schema de `search_jobs`:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  Y en `knowledge.listJobs()` aplicar los filtros correspondientes. Sin esto, el Paso 4 recoge información que nunca se usa para filtrar.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool capturaría directamente en Supabase: puesto, experiencia, zona, jornada, con `origen: 'kyo_banco_talentos'`. El candidato no tendría que llenar el formulario manualmente.

### Problemas detectados

- **Fallback genérico sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to` sin texto, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acentos, tono frío). Fix:
  ```ts
  const replyContent = finalText || (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 genera 2-3 vacantes con justificación; puede acercarse al límite. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` deja margen de solo 1 error** — Línea 85. El Paso 5 óptimo requiere `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Con 5 hay margen de 1 sola falla extra. Subir a 8.

- **`getStoredInstrucciones()` usa anon key, no service role** — Líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente. Usar `sbAdmin` ya declarado en línea 36 (service role).

- **`rateLimitMap` memory leak (BUG 16, 10º día)** — Líneas 68-80. El Map nunca se limpia. En VPS de 1 CPU con tráfico constante, crece indefinidamente.

---

## Oportunidades de mejora general

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header (`"Paso 2 de 5"`) reduce abandonos. Se puede inferir contando mensajes del usuario en `useChat.ts`.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — Candidato con 5s mirando "Sin resultados" + bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. `useEffect` + `setTimeout(5000)` en la ruta, una vez por sesión (flag en sessionStorage).

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante. Sin este evento es imposible medir el ROI del asistente. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`.

- **Discrepancia de estadísticas** — `knowledge.ts` línea 79 dice `"Años en el mercado": "3+"`. Verificar si el dato del sitio público (`/nosotros`, `/contacto`) es coherente con este número.

- **Notificación al cliente al publicar video TikTok** — Pendiente explícito en CLAUDE.md. Al hacer PATCH para cambiar `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos. La infraestructura IONOS SMTP ya está activa.

---

## Prioridad de acción sugerida (acumulada)

| # | Bug/Mejora | Esfuerzo | Impacto |
|---|-----------|----------|---------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico |
| 2 | BUG 26 — Markdown asteriscos en Kyo | Bajo (5 min) | Alto |
| 3 | BUG 46 — Acento "aquí" en saludo inicial Kyo | Bajo (1 min) | Alto |
| 4 | BUG 44 — Registro usted/tú inconsistente en prompt | Bajo (15 min) | Alto |
| 5 | BUG 41 — Sin validación de tamaño antes de comprimir video | Bajo (5 min) | Alto |
| 6 | BUG 51 — Fallback "MXN bruto" en vacantes sin salario_nota | Bajo (1 min) | Alto |
| 7 | BUG 32 — Confirmación visual al aprobar en /revisor | Bajo (30 min) | Alto |
| 8 | BUG 49 — reset() no limpia sessionStorage | Bajo (1 línea) | Medio |
| 9 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio |
| 10 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio |
| 11 | BUG 52 — Cliente envía 30 msgs cuando servidor usa 20 | Bajo (1 línea) | Bajo |
| 12 | BUG 43 — Sin progreso durante subida de video | Bajo (UI) | Medio |
| 13 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio |
| 14 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo |
| 15 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto |
| 16 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio |
| 17 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto |
| 18 | Tool register_talent_interest | Medio | Alto |
| 19 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio |
| 20 | BUG 28 — Tour novedad en pestaña Análisis | Bajo (1 línea) | Medio |
