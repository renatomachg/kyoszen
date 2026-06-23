# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-23
**Cambios analizados:** `src/lib/google-drive.ts`, `src/app/api/admin/social/posts/[id]/archivar-video/route.ts`, `src/components/social/StoryboardView.tsx` (tipo `ArchivadoVideo`), `src/app/revisor/page.tsx`, `src/app/admin/(panel)/redes-sociales/page.tsx` — feat del 2026-06-22 (archivado de videos a Google Drive + fix video en imagenes[]).
Re-lectura completa: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`.

---

## Cambios Recientes Detectados (2026-06-23)

**Commit `b14f8f3` — archivado de videos a Google Drive:**
- Nuevo helper `src/lib/google-drive.ts`: autenticación OAuth con refresh token, subida multipart sin dependencias adicionales.
- Nuevo endpoint `POST /api/admin/social/posts/[id]/archivar-video`: descarga el MP4 desde Storage, genera carátula con ffmpeg (best-effort), sube a Drive, guarda metadata en `storyboard.archivado` JSONB y borra el original de Storage. Diseño seguro: si Drive falla, no borra nada.
- `StoryboardView.tsx` añade tipo `ArchivadoVideo` y campo `archivado` en `Storyboard`.
- `revisor/page.tsx`: usa el poster del archivado en tarjetas del grid; muestra "✅ Publicado en redes" al cliente en lugar del reproductor cuando el video está archivado.
- **Fix de bug**: `handleFiles` ahora rechaza `.mp4` en el input de imágenes con aviso, evitando que `video_url` caiga en `imagenes[]`.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES

### BUG 1 — Kyo recomienda vacantes de demo, no de Supabase (12.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` importado de `@/lib/jobs` (datos hardcoded de demo). El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer de `vacantes` donde `activa = true`. La interfaz `KnowledgeProvider` ya está definida y lista para sustituirla.

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (NUEVO — 2026-06-23)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 62-163

La ruta no verifica que el llamante tenga una sesión de admin válida. Solo comprueba que Drive esté configurado. Cualquier request HTTP con un `id` válido de post puede disparar:
1. Descarga del MP4 desde Supabase Storage (tráfico de salida).
2. Subida del MP4 a Google Drive (cuota de Drive del propietario).
3. Eliminación irreversible del video de Supabase Storage.

Los demás endpoints `/api/admin/social/` tampoco se revisaron — conviene auditar todos.

**Fix:** Añadir verificación de sesión al inicio de la función `POST`:
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

---

### BUG 57 — `subirADrive()` sin timeout — cuelga hasta 5 minutos si Google falla (NUEVO)
**Archivo:** `src/lib/google-drive.ts` líneas 68-83

`fetch("https://www.googleapis.com/upload/...")` no tiene `AbortController` ni timeout. Si la API de Google responde lento o no responde, el endpoint `/archivar-video` se bloquea hasta el `maxDuration: 300` (5 min), consumiendo un worker de PM2 y dejando al admin esperando sin feedback.

**Fix:** Envolver la subida con `AbortSignal.timeout(120_000)`:
```ts
const up = await fetch(uploadUrl, {
  method: "POST",
  headers: { ... },
  body,
  signal: AbortSignal.timeout(120_000), // 2 min máx para subida
});
```
Aplicar el mismo pattern a `getAccessToken()` (línea 23).

---

## 🟠 BUGS NUEVOS — 2026-06-23

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58 y 154-155

```ts
function rutaDeStorage(url: string): string | null {
  const m = url.match(/\/storage\/v1\/object\/public\/media\/(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}
```

Si `video_url` apunta a una URL de CDN personalizada, a un proxy, o tiene query params (`?v=123`), el regex no hace match y devuelve `null`. La línea 155 hace `.catch(() => {})` sin logging, así que el operador no se entera y el video queda en Storage ocupando espacio.

**Fix 1 (simple):** Loguear cuando la ruta no se pudo extraer:
```ts
if (!ruta) console.warn(`[archivar-video] No se pudo extraer ruta de Storage: ${version.video_url}`);
```
**Fix 2 (robusto):** Hacer la extracción más flexible con `new URL()`:
```ts
function rutaDeStorage(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/^\/storage\/v1\/object\/public\/media\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch { return null; }
}
```

---

### BUG 59 — `StoryboardView` renderiza `null` cuando el video está archivado (NUEVO)
**Archivo:** `src/components/social/StoryboardView.tsx`

El tipo `Storyboard` ahora incluye `archivado?: ArchivadoVideo | null`, pero ninguno de los tres exports (`StoryboardView`, `PropuestaView`, `GuiaTecnicaView`) renderiza nada cuando el campo está presente. Si el admin llama `<StoryboardView sb={storyboard} />` con un storyboard archivado, el componente muestra el storyboard original (que puede no tener frames) en lugar de una indicación de que el video está en Drive.

**Fix:** En `StoryboardView`, antes de renderizar los cuadros, añadir:
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

## Bugs anteriores aún sin resolver (prioridad descendente)

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (12.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210 y 227

`whitespace-pre-wrap` muestra `**texto**` literal. Fix de 5 minutos:
```ts
function renderMd(t: string) {
  return { __html: t.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>") };
}
```
Usar `<div dangerouslySetInnerHTML={renderMd(message.content)} />` en `MessageBubble`.

---

### BUG 46 — "aqui" sin acento en el saludo inicial de Kyo (12.º día)
**Archivo:** `src/components/assistant/useChat.ts` línea 20

`"estoy aqui para orientarte"` → `"estoy aquí para orientarte"`. Primer texto que lee todo candidato.

---

### BUG 53 — 6 cadenas sin acento en AplicarModal — afectan a TODOS los candidatos que aplican
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

### BUG 54 — "Mas de $20k" sin acento en el filtro de salario de /vacantes
**Archivo:** `src/app/vacantes/page.tsx` línea 32

```ts
const SALARIOS = ["Todos", "Menos de $10k", "$10k - $15k", "$15k - $20k", "Mas de $20k"];
```
`"Mas de $20k"` → `"Más de $20k"`. También actualizar `matchesSalario` en línea 42 para que el string coincida.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (privacidad LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```
El Paso 0 pide el nombre. Ese nombre queda textual en `site_eventos.valor`. **Fix:**
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 49 — `reset()` no limpia `sessionStorage` — nueva conversación reutiliza el mismo `session_id`
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

Añadir al `reset`: `sessionStorage.removeItem("kyo_session_id");`

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota`
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

Cambiar el fallback de `"MXN bruto"` a `"mensual"` (neutro) hasta que el admin complete la información.

---

### BUG 47 — `search_jobs` no incluye `salario_nota` — Kyo cita salario sin contexto bruto/neto
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42

Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()` de `listJobs()`.

---

### BUG 48 — Sin ARIA live region en el chat widget
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 52 — Cliente envía hasta 30 mensajes, servidor solo usa 20
**Archivo:** `src/components/assistant/useChat.ts` línea 99

Pre-truncar antes del fetch: `messages: newMessages.slice(-20).map(...)`

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded en vez de Supabase
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Eliminar `generateStaticParams()` completamente; la ruta dinámica funciona en runtime con `dynamicParams: true` por defecto.

---

### BUG 44 — Inconsistencia usted/tú en el system prompt de Kyo (6.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero las frases de manejo de otros temas tutean: `"te conecto"` (línea 66), `"¿te ayudo"` (línea 67). Unificar a **usted** en todo el prompt.

---

### BUG 16 — Memory leak en `rateLimitMap` (12.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir limpieza periódica o usar Upstash Redis en producción multi-instancia.

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

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx` línea 231. Sin resultados, sin salida. Añadir botón:
  ```tsx
  <button onClick={() => window.dispatchEvent(new CustomEvent("kyo:open"))} className="mt-4 text-sm font-bold text-blue underline">
    Pídele ayuda a Kyo →
  </button>
  ```
  Y escuchar `"kyo:open"` en `ChatWidget.tsx` para abrir el panel.

### Media prioridad

- **"Nueva conversacion" sin acento y mal posicionado** — `ChatWidget.tsx` línea 161. Corregir a `"Nueva conversación"`. Mover el botón al header del widget (junto a "Kyo · Asistente") para que no requiera scroll hasta el final.

- **Confirmación visual al aprobar en `/revisor`** — Rosy y Monse no tienen feedback inmediato al aprobar o pedir cambios. Añadir un toast 4s en la esquina superior al hacer click en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120s (descarga + ffmpeg + subida a Drive). El botón "🗄️ Liberar espacio" no tiene indicador de progreso real; el admin solo ve que el modal desaparece. Añadir estado `"Archivando video..."` con spinner y desactivar el botón durante la operación.

- **Notificación al cliente al publicar video TikTok** — Pendiente explícito en CLAUDE.md. Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos. La infraestructura IONOS SMTP ya está activa. Archivo a editar: la API route de PATCH en `/api/admin/social/posts/[id]/versions`.

### Baja prioridad

- **Tour de novedad bloquea pestaña Análisis** — `src/app/revisor/page.tsx`: mostrar `<NovedadFiltros />` solo cuando `seccion === "publicaciones"`, no en la pestaña de análisis.

- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true` mejoran la percepción de velocidad.

- **Poster nulo cuando ffmpeg no disponible** — El campo `poster_url` puede ser `null` si ffmpeg no está en el entorno. La tarjeta del grid del revisor debería mostrar un placeholder coherente (ej. un emoji 🎬 sobre fondo navy) en lugar de un `<img src="">` roto.

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

- **Mencionar las 24h de respuesta en el Paso 5** — El dato más persuasivo para motivar la aplicación no se menciona. Añadir al formato de respuesta del Paso 5: `"Nuestro equipo le contacta en menos de 24 horas hábiles."`

- **Resumen de perfil en Paso 4 (ancla contra truncado de contexto)** — Con el historial cortado a 20 mensajes, una conversación larga puede perder el nombre del candidato. Añadir instrucción: al completar los Pasos 0-4, sintetizar en una línea: `"Perfil capturado: [nombre], [puesto], [N años], zona [X], [jornada]."`

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero no puede filtrar por ella. Añadir:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  Sin esto, el Paso 4 recoge información que nunca se usa en la búsqueda.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, crear registro en Supabase directamente desde Kyo (puesto, experiencia, zona, jornada, `origen: 'kyo_banco_talentos'`). El candidato no tendría que rellenar el formulario manualmente.

### Problemas detectados

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to`, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acentos). Fix:
  ```ts
  const replyContent = finalText || (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 (2-3 vacantes con justificación + `navigate_to`) puede acercarse al límite. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` con poco margen** — Línea 85. Paso 5 óptimo = `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Solo 1 de margen. Subir a 8.

- **`getStoredInstrucciones()` usa anon key** — Líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente y aplica el prompt por defecto. Usar `sbAdmin` (service role) declarado en línea 36 para mayor resiliencia.

---

## Oportunidades de mejora general

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante específica. Sin este evento es imposible medir el ROI del asistente. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`.

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header del widget (`"Paso 2 de 5"`) reduce abandonos. Puede inferirse contando mensajes del usuario en `useChat.ts`.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — 5s mirando "Sin resultados" + bubble proactivo de Kyo. Implementar con `useEffect` + `setTimeout(5000)` en la ruta, una vez por sesión (flag en sessionStorage).

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Conviene revisar si el resto de rutas admin (`upload`, `posts`, `config`, `importar`, `informe`, `archivar-video`) también carecen de verificación explícita de sesión, ya que la guard del layout UI no protege las APIs directas.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto |
|---|-----------|----------|---------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico |
| 2 | **BUG 56 — Endpoint archivar-video sin auth (NUEVO)** | Bajo (15 min) | Crítico |
| 3 | **BUG 57 — subirADrive sin timeout (NUEVO)** | Bajo (5 min) | Alto |
| 4 | BUG 53 — 6 accents faltantes en AplicarModal | Bajo (5 min) | Alto |
| 5 | BUG 26 — Markdown asteriscos en Kyo | Bajo (5 min) | Alto |
| 6 | BUG 55 — `kyo_mensaje` graba datos personales en analytics | Bajo (1 línea) | Alto |
| 7 | BUG 46 — Acento "aquí" en saludo inicial Kyo | Bajo (1 min) | Alto |
| 8 | BUG 54 — "Mas de $20k" sin acento en filtro salario | Bajo (1 min) | Medio |
| 9 | BUG 44 — Registro usted/tú inconsistente en prompt | Bajo (15 min) | Alto |
| 10 | BUG 51 — Fallback "MXN bruto" en vacantes sin salario_nota | Bajo (1 min) | Alto |
| 11 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio |
| 12 | BUG 32 — Confirmación visual al aprobar en /revisor | Bajo (30 min) | Alto |
| 13 | BUG 49 — reset() no limpia sessionStorage | Bajo (1 línea) | Medio |
| 14 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio |
| 15 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio |
| 16 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio |
| 17 | BUG 52 — Cliente envía 30 msgs cuando servidor usa 20 | Bajo (1 línea) | Bajo |
| 18 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico |
| 19 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto |
| 20 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio |
| 21 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto |
| 22 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio |
| 23 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio |
| 24 | Tool register_talent_interest | Medio | Alto |
| 25 | BUG 28 — Tour novedad en pestaña Análisis | Bajo (1 línea) | Medio |
| 26 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio |
| 27 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo |
