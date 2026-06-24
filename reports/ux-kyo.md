# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-24
**Cambios analizados:** Sin commits de código nuevos desde 2026-06-22. Re-verificación de bugs anteriores + nueva observación en `archivar-video/route.ts` (línea 97).
Archivos del asistente: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`.
Archivos de UI: `src/components/assistant/ChatWidget.tsx`, `src/components/social/StoryboardView.tsx`, `src/app/revisor/page.tsx`.

---

## Cambios Recientes Detectados

Ningún commit de código nuevo hoy. El último commit funcional fue `b14f8f3` (2026-06-22): archivado de videos a Google Drive + fix de video en `imagenes[]`.

**Pendiente operativo crítico (no es código, es configuración):** Las variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` y `GOOGLE_DRIVE_FOLDER_ID` aún no están en el `.env.local`/`ecosystem.config.js` del VPS (registrado en CLAUDE.md). El botón "🗄️ Liberar espacio" falla silenciosamente en producción porque `driveConfigurado()` devuelve `false`.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (13.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. La interfaz `KnowledgeProvider` (línea 42) ya está definida y lista para el reemplazo.

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (2.º día sin fix)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 62

La función `POST` no verifica sesión de Supabase. Cualquier request HTTP con un `id` válido puede descargar el MP4, subirlo al Drive del propietario y borrar el original de Storage. Confirmado leyendo el archivo — la primera verificación es `driveConfigurado()`, no una sesión de usuario.

**Fix:**
```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

const cookieStore = await cookies();
const sbSession = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { getAll: () => cookieStore.getAll() } }
);
const { data: { session } } = await sbSession.auth.getSession();
if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
```
Añadir como primera instrucción antes de `driveConfigurado()`.

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (2.º día)
**Archivo:** `src/lib/google-drive.ts`

La llamada `fetch` a la API de Google no tiene `AbortController` ni timeout. Si la API responde lento, el endpoint `/archivar-video` bloquea un worker de PM2 durante `maxDuration: 300` (5 min).

**Fix:**
```ts
const up = await fetch(uploadUrl, {
  method: "POST",
  headers: { ... },
  body,
  signal: AbortSignal.timeout(120_000),
});
```
Aplicar también a `getAccessToken()`.

---

### BUG 60 — `fetch(version.video_url)` sin timeout — bloquea si Storage es lento (NUEVO)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 97

```ts
const res = await fetch(version.video_url);
```

Si el CDN de Supabase Storage responde lento o la URL es inválida, este `fetch` bloquea sin límite de tiempo antes incluso de llegar al paso de Drive. No hay `signal` ni timeout.

**Fix:** Añadir timeout de 60 s a la descarga del video:
```ts
const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });
```

---

## 🟠 BUGS — PENDIENTES SIN RESOLVER

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (2.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58 y 154-155

El regex `/\/storage\/v1\/object\/public\/media\/(.+)$/` no hace match si hay query params o si la URL es de CDN personalizado. El `.catch(() => {})` en línea 155 oculta el fallo — el video queda en Storage ocupando espacio.

**Fix rápido:** Loguear cuando la ruta no se extraiga:
```ts
const ruta = rutaDeStorage(version.video_url);
if (!ruta) console.warn(`[archivar-video] No se extrajo ruta de Storage: ${version.video_url}`);
if (ruta) await sb.storage.from("media").remove([ruta]).catch(() => {});
```
**Fix robusto:** Usar `new URL()` para parsear el path de forma tolerante a query params.

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (2.º día)
**Archivo:** `src/components/social/StoryboardView.tsx`

Cuando `storyboard.archivado` está presente, el componente no lo muestra. El admin ve un storyboard sin frames en lugar de un aviso de que el video está en Drive.

**Fix:** Añadir antes de la sección `/* filmstrip de cuadros 9:16 */` (línea 76):
```tsx
{sb?.archivado && (
  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 10, padding: "10px 14px", marginBottom: 12, display: "flex", gap: 10, alignItems: "center" }}>
    <span style={{ fontSize: 20 }}>🗄️</span>
    <div>
      <p style={{ margin: 0, fontWeight: 700, fontSize: 13, color: "#166534" }}>Video archivado en Google Drive</p>
      <p style={{ margin: "2px 0 0", fontSize: 12, color: "#16a34a" }}>
        {sb.archivado.peso_mb}MB liberados · {new Date(sb.archivado.archivado_en).toLocaleDateString("es-MX")}
        {" · "}<a href={sb.archivado.drive_url} target="_blank" rel="noopener" style={{ color: "#1883FF" }}>Ver en Drive →</a>
      </p>
    </div>
  </div>
)}
```

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (13.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210 y 227

`whitespace-pre-wrap` muestra `**texto**` sin renderizar. Fix de 5 min:
```ts
function renderMd(t: string) {
  return { __html: t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") };
}
```
Usar `<div dangerouslySetInnerHTML={renderMd(message.content)} />` en `MessageBubble`.

---

### BUG 46 — "aqui" sin acento en el saludo inicial de Kyo (13.º día)
**Archivo:** `src/components/assistant/useChat.ts` línea 20

`"estoy aqui para orientarte"` → `"estoy aquí para orientarte"`. Primer texto que lee cualquier candidato que abre el chat.

---

### BUG 53 — 6 cadenas sin acento en AplicarModal (13.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx`

| Línea | Actual | Corrección |
|-------|--------|------------|
| 19 | `"Mas de 5 años"` | `"Más de 5 años"` |
| 25 | `"CDMX — maximo 1 hora de traslado"` | `"CDMX — máximo 1 hora de traslado"` |
| 121 | `"en maximo 24 horas habiles"` | `"en máximo 24 horas hábiles"` |
| 156 | `label="Correo electronico"` | `label="Correo electrónico"` |
| 177 | `label="Ubicacion / alcance de traslado"` | `label="Ubicación / alcance de traslado"` |
| 187 | `"documentacion basica"` | `"documentación básica"` |

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (13.º día — LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```
El nombre del candidato que escribe en el Paso 0 queda textual en `site_eventos.valor`.

**Fix (1 línea):**
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 44 — Inconsistencia usted/tú en el system prompt de Kyo (7.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero las frases de manejo de otros temas tutean: `"te conecto"` (línea 66), `"¿te ayudo"` (línea 67). Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario de /vacantes (13.º día)
**Archivo:** `src/app/vacantes/page.tsx` línea 32

```ts
const SALARIOS = ["Todos", "Menos de $10k", "$10k - $15k", "$15k - $20k", "Mas de $20k"];
```
`"Mas de $20k"` → `"Más de $20k"`. Actualizar también la función `matchesSalario` (línea 42) para que el string coincida.

---

### BUG 47 — `search_jobs` no incluye `salario_nota` — Kyo cita salario sin contexto bruto/neto (13.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 y 148-153

Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()` de `listJobs()`.

---

### BUG 48 — Sin ARIA live region en el chat widget (13.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

El contenedor de mensajes no tiene atributos de accesibilidad.

**Fix (1 línea):**
```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 49 — `reset()` no limpia `sessionStorage` — nueva conversación reutiliza el `session_id` anterior (13.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

**Fix (1 línea):** Añadir al bloque `reset`:
```ts
sessionStorage.removeItem("kyo_session_id");
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (13.º día)
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

Cambiar el fallback de `"MXN bruto"` a `"mensual"` (neutro) hasta que el admin complete el campo.

---

### BUG 52 — Cliente envía hasta 30 mensajes, servidor solo usa 20 (13.º día)
**Archivo:** `src/components/assistant/useChat.ts` línea 99

Pre-truncar antes del fetch:
```ts
messages: newMessages.slice(-20).map(...)
```

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded en vez de Supabase (13.º día)
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Eliminar `generateStaticParams()` completamente. La ruta dinámica funciona en runtime con `dynamicParams: true` por defecto.

---

### BUG 16 — Memory leak en `rateLimitMap` (13.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir limpieza periódica o migrar a Upstash Redis en producción multi-instancia.

---

## Sugerencias de UX

### Alta prioridad

- **Barra CTA sticky en mobile** — `src/app/vacantes/[id]/_content.tsx`. El sidebar `sticky top-28` solo aparece en `lg:`. En mobile el candidato hace scroll hasta el fondo sin CTA visible. Añadir:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 flex gap-3 lg:hidden z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 font-bold text-sm">Aplicar ahora</button>
    <a href="https://wa.link/5zv0ba" className="flex-1 bg-wa text-white rounded-full py-3 font-bold text-sm text-center">WhatsApp</a>
  </div>
  ```

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx` línea 231. Cuando no hay resultados no hay salida. Añadir botón que abra el widget de Kyo:
  ```tsx
  <button onClick={() => window.dispatchEvent(new CustomEvent("kyo:open"))} className="mt-4 text-sm font-bold text-blue underline">
    Pídele ayuda a Kyo →
  </button>
  ```
  Escuchar `"kyo:open"` en `ChatWidget.tsx` con `useEffect` para abrir el panel.

### Media prioridad

- **"Nueva conversacion" sin acento y mal posicionado** — `ChatWidget.tsx` línea 161. Corregir a `"Nueva conversación"`. Mover el botón al header del widget (junto a "Kyo · Asistente") para que no requiera scroll hasta el final.

- **Confirmación visual al aprobar en `/revisor`** — Rosy y Monse no tienen feedback inmediato al aprobar o pedir cambios. Añadir un toast 4 s en la esquina superior al hacer click en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120 s (descarga + ffmpeg + subida). El botón "🗄️ Liberar espacio" no tiene indicador de progreso real. Añadir estado `"Archivando video..."` con spinner y deshabilitar el botón durante la operación.

- **Notificación al cliente al publicar video TikTok** — Pendiente explícito en CLAUDE.md. Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos. La infraestructura IONOS SMTP ya está activa. Editar la API route de PATCH en `/api/admin/social/posts/[id]/versions`.

### Baja prioridad

- **Tour de novedad bloquea pestaña Análisis** — `src/app/revisor/page.tsx`: mostrar `<NovedadFiltros />` solo cuando `seccion === "publicaciones"`, no en la pestaña de análisis.

- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true` mejoran la percepción de velocidad.

- **Poster nulo cuando ffmpeg no disponible** — El campo `poster_url` puede ser `null` si ffmpeg no está en el entorno. La tarjeta del grid del revisor debería mostrar un placeholder coherente (ej. emoji 🎬 sobre fondo navy) en lugar de un `<img src="">` roto.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 6 sin manejo de rechazo** — Si el candidato dice "ninguna me interesa", no hay instrucción. Añadir al Paso 6 en `system-prompt.ts`:
  ```
  Si el candidato rechaza todas las opciones:
  "Entiendo, [nombre]. Puedo registrar su perfil en nuestro banco de talentos
  para avisarle cuando surja una oportunidad más afín. ¿Le parece bien?"
  Navegar a /contacto.
  ```

- **Mencionar las 24 h de respuesta en el Paso 5** — El dato más persuasivo para motivar la aplicación no aparece. Añadir al formato de respuesta del Paso 5: `"Nuestro equipo le contacta en menos de 24 horas hábiles."`

- **Resumen de perfil en Paso 4 (ancla contra truncado de contexto)** — Con el historial cortado a 20 mensajes, una conversación larga puede perder el nombre del candidato. Añadir instrucción: al completar los Pasos 0-4, sintetizar en una línea: `"Perfil capturado: [nombre], [puesto], [N años], zona [X], [jornada]."`

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero `search_jobs` no acepta ese parámetro, así que la información se descarta. Añadir:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  También actualizar `listJobs()` en `knowledge.ts` para aceptar y aplicar estos filtros.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, crear un registro en Supabase directamente desde Kyo (puesto, experiencia, zona, jornada, `origen: 'kyo_banco_talentos'`). El candidato no tendría que rellenar el formulario manualmente.

### Problemas detectados

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to` sin texto, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acentos). Fix:
  ```ts
  const replyContent = finalText
    || (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 (2-3 vacantes con justificación + `navigate_to`) puede acercarse al límite. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` con poco margen** — Línea 85. Paso 5 óptimo = `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Solo 1 de margen. Subir a 8.

- **`getStoredInstrucciones()` usa anon key** — Líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente y aplica el prompt por defecto. Usar `sbAdmin` (service role) declarado en línea 36 para mayor resiliencia.

---

## Oportunidades de mejora general

- **Variables `GOOGLE_*` pendientes en el VPS** — El botón "🗄️ Liberar espacio" devuelve 503 en producción porque `driveConfigurado()` devuelve `false`. Añadir las 4 vars al `ecosystem.config.js` del VPS es un deploy de 5 minutos sin código nuevo.

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante específica. Sin este evento es imposible medir el ROI del asistente. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`.

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header del widget (`"Paso 2 de 5"`) reduce abandonos. Puede inferirse contando mensajes del usuario en `useChat.ts`.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — 5 s mirando "Sin resultados" + bubble proactivo de Kyo. Implementar con `useEffect` + `setTimeout(5000)` en la ruta, una vez por sesión (flag en sessionStorage).

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Revisar si `upload`, `posts`, `config`, `importar`, `informe` y los demás también carecen de verificación explícita, ya que la guard del layout UI no protege las APIs directas.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto |
|---|-----------|----------|---------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico |
| 3 | BUG 57 — `subirADrive` sin timeout | Bajo (5 min) | Alto |
| 4 | **BUG 60 — `fetch(video_url)` sin timeout (NUEVO)** | Bajo (1 línea) | Alto |
| 5 | Variables `GOOGLE_*` en VPS (no es código) | Bajo (5 min) | Alto |
| 6 | BUG 53 — 6 acentos faltantes en AplicarModal | Bajo (5 min) | Alto |
| 7 | BUG 26 — Markdown asteriscos en Kyo | Bajo (5 min) | Alto |
| 8 | BUG 55 — `kyo_mensaje` graba datos personales | Bajo (1 línea) | Alto |
| 9 | BUG 46 — Acento "aquí" en saludo inicial Kyo | Bajo (1 min) | Alto |
| 10 | BUG 54 — "Mas de $20k" sin acento en filtro salario | Bajo (1 min) | Medio |
| 11 | BUG 44 — Registro usted/tú inconsistente en prompt | Bajo (15 min) | Alto |
| 12 | BUG 51 — Fallback "MXN bruto" en vacantes sin salario_nota | Bajo (1 min) | Alto |
| 13 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio |
| 14 | BUG 32 — Confirmación visual al aprobar en /revisor | Bajo (30 min) | Alto |
| 15 | BUG 49 — reset() no limpia sessionStorage | Bajo (1 línea) | Medio |
| 16 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio |
| 17 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio |
| 18 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio |
| 19 | BUG 52 — Cliente envía 30 msgs cuando servidor usa 20 | Bajo (1 línea) | Bajo |
| 20 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico |
| 21 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto |
| 22 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio |
| 23 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto |
| 24 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio |
| 25 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio |
| 26 | Tool register_talent_interest | Medio | Alto |
| 27 | BUG 28 — Tour novedad en pestaña Análisis | Bajo (1 línea) | Medio |
| 28 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio |
| 29 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo |
