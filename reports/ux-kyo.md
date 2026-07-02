# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-02
**Cambios analizados:** Sin commits de código desde 2026-06-22 (11.º día consecutivo sin fix).
Archivos revisados: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/components/sections/Hero.tsx`.

---

## Cambios Recientes Detectados

Ningún commit de código desde el 2026-06-22 (11 días). Los únicos commits son reportes automáticos (`ux-kyo.md`, `tendencias-julio-2026.md`, `dependencias.md`).

**Pendiente operativo crítico (configuración, no código):** Las 4 variables `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN` y `GOOGLE_DRIVE_FOLDER_ID` siguen sin estar en el `ecosystem.config.js` del VPS. El botón "🗄️ Liberar espacio" devuelve 503 en producción (11.º día pendiente).

> ⚠️ **Alerta de acumulación:** 22 bugs abiertos con antigüedad de 21+ días. Los 4 más críticos (BUG 1, 56, 65, 66) tienen impacto directo en candidatos en producción ahora mismo. Todos los bugs del reporte anterior siguen sin corrección.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (21.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt (línea 138 de `system-prompt.ts`) construye el listado desde `knowledge.listJobs()` — si Supabase tiene 8 vacantes y `JOBS` tiene 3, Kyo le dice al candidato "hay 3 vacantes disponibles" cuando en realidad hay 8. La interfaz `KnowledgeProvider` (línea 42) ya está preparada para el reemplazo.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. Registrar en línea 167 en lugar del provider estático.

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (10.º día sin fix)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 12

La función `POST` no verifica sesión de Supabase antes de actuar. Cualquier request HTTP con un `id` válido puede descargar el MP4, subirlo al Drive del propietario y borrar el original de Storage.

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
Añadir como primeras instrucciones del handler, antes de `driveConfigurado()`.

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (10.º día)
**Archivo:** `src/lib/google-drive.ts` líneas 23 y 69

`getAccessToken()` y `subirADrive()` usan `fetch` sin `AbortController`. Si Google OAuth o el upload responden lento, el endpoint bloquea un worker de PM2 durante `maxDuration: 300`.

**Fix:**
```ts
// En getAccessToken():
const r = await fetch("https://oauth2.googleapis.com/token", {
  ..., signal: AbortSignal.timeout(15_000),
});

// En subirADrive():
const up = await fetch("https://www.googleapis.com/upload/...", {
  ..., signal: AbortSignal.timeout(120_000),
});
```

---

### BUG 60 — `fetch(version.video_url)` sin timeout (9.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 97

```ts
const res = await fetch(version.video_url);
```
Sin límite de tiempo. Fix de 1 línea:
```ts
const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });
```

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (8.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 85-86

El system prompt instruye a Kyo con `"Estado de Mexico"` y `"Hibrido"`, pero `vacantes/page.tsx` línea 28 valida contra `["Estado de México", "Híbrido"]` (con acentos). El filtro se ignora silenciosamente: Kyo navega a `/vacantes?ubicacion=Estado de Mexico` y la página no muestra filtro aplicado.

**Fix en `system-prompt.ts` línea 85:**
```
- /vacantes?ubicacion=CDMX (valores: CDMX, Estado de México, Híbrido, Remoto)
```

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (7.º día)
**Archivo:** `src/components/sections/Hero.tsx` líneas 5, 122, 129

```ts
import Image from "next/image";
// ...
<Image src="/images/Hero2.jpg" ... />
<Image src="/images/Hero.jpg" ... />
```

CLAUDE.md: **"No usar `next/image` — usar `<img>` nativo"**. Las mismas fotos se sirven con `<img>` nativo + `unoptimized: true` configurado en `next.config.ts`.

**Fix:**
```tsx
<img src="/images/Hero2.jpg" alt="Trabajo operativo Kyoszen" className="object-cover w-full h-full" />
<img src="/images/Hero.jpg" alt="Equipo profesional Kyoszen" className="object-cover w-full h-full" />
```
Eliminar el import de `next/image` (línea 5).

---

### BUG 63 — Estadística Hero "+7000 colocados" vs knowledge.ts "687+" — contradicción visible (7.º día)
**Archivos:** `src/components/sections/Hero.tsx` líneas 107 y 175, y `src/lib/assistant/knowledge.ts` línea 78

El Hero muestra **"+7000 candidatos colocados"** (confirmado en líneas 107 y 175). El `knowledge.ts` que Kyo usa como base de respuestas dice **"687+ candidatos colocados"**. Si un candidato le pregunta a Kyo cuántos han colocado, responde 687+, pero el hero visual dice 7000+. Contradicción que daña la credibilidad.

**Fix:** Unificar el número en ambos archivos con el dato real aprobado por el cliente.

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (7.º día)
**Archivo:** `src/app/vacantes/page.tsx` línea 29

```ts
const MARCAS = ["Todas", "Grupo Corpora", "Logística Norte", "Sigma Retail", ...];
```

Nombres de empresa ficticios de prueba. Si las vacantes reales en Supabase tienen empresas distintas, el filtro retorna 0 resultados y confunde al candidato. El system prompt de Kyo (línea 88) también referencia estos nombres hardcoded para construir filtros URL, que también fallan.

**Fix dinámico:**
```ts
useEffect(() => {
  supabase.from("vacantes").select("empresa").eq("activa", true)
    .then(({ data }) => {
      const unique = [...new Set((data ?? []).map(r => r.empresa).filter(Boolean))].sort();
      setMarcas(["Todas", ...unique]);
    });
}, []);
```
Actualizar también `system-prompt.ts` para no referenciar marcas hardcoded.

---

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (5.º día)
**Archivos:** `src/lib/assistant/knowledge.ts` línea 85 y `src/components/assistant/ChatWidget.tsx` línea 227

`COMPANY.contact.whatsapp = "https://wa.link/5zv0ba"`. Cuando Kyo responde con el link de WhatsApp, la burbuja usa `whitespace-pre-wrap` sin renderizado de markdown — la URL aparece como texto plano, no como enlace. WhatsApp es la conversión principal de Kyoszen y el candidato no puede hacer clic.

**Fix combinado (resuelve también BUG 26):**
```ts
// En ChatWidget.tsx, reemplazar el contenido del MessageBubble de assistant:
function renderContent(text: string) {
  return {
    __html: text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" style="color:#1883FF;text-decoration:underline">$1</a>')
      .replace(/\n/g, "<br/>"),
  };
}
// Usar: <div dangerouslySetInnerHTML={renderContent(message.content)} />
```

---

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs de conversaciones (4.º día)
**Archivos:** `src/components/assistant/useChat.ts` líneas 139-145 y `src/app/api/assistant/chat/route.ts` línea 52

`reset()` limpia `localStorage` (historial) pero NO `sessionStorage` (session ID). La siguiente conversación reutiliza el mismo `session_id` y el upsert en `kyo_conversaciones` **sobreescribe** el log anterior. Si un admin quiere ver qué dijo un candidato que reinició el chat, los mensajes viejos ya no existen.

**Fix de 2 líneas en `useChat.ts` líneas 142-143:**
```ts
localStorage.removeItem(STORAGE_KEY);
sessionStorage.removeItem("kyo_session_id"); // ← agregar esta línea
```

---

## 🟠 BUGS — PENDIENTES SIN RESOLVER (heredados)

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (10.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58 y 154-155

El regex no hace match si hay query params o CDN personalizado. El `.catch(() => {})` oculta el fallo.

**Fix rápido — loguear cuando no se extrae la ruta:**
```ts
const ruta = rutaDeStorage(version.video_url);
if (!ruta) console.warn(`[archivar-video] No se extrajo ruta de Storage: ${version.video_url}`);
if (ruta) await sb.storage.from("media").remove([ruta]).catch(() => {});
```

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (10.º día)
**Archivo:** `src/components/social/StoryboardView.tsx` línea 63

Cuando `storyboard.archivado` está presente, el admin ve un storyboard vacío. Añadir bloque antes del filmstrip:
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

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (21.º día sin fix)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210 y 227

`whitespace-pre-wrap` muestra `**texto**` sin renderizar. Fix unificado con BUG 65 (ver arriba).

---

### BUG 46 — "aqui" sin acento en el saludo inicial de Kyo (21.º día)
**Archivo:** `src/components/assistant/useChat.ts` línea 20

`"estoy aqui para orientarte"` → `"estoy aquí para orientarte"`. Primer texto que lee cualquier candidato. Confirmado en código: `const INITIAL_GREETING = { content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte. ¿Me permite saber su nombre?" }`.

---

### BUG 53 — 6 cadenas sin acento en AplicarModal (21.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx`

| Línea | Actual | Corrección |
|-------|--------|------------|
| 18 | `"Mas de 5 años"` | `"Más de 5 años"` |
| 23 | `"CDMX — maximo 1 hora"` | `"CDMX — máximo 1 hora"` |
| 121 | `"en maximo 24 horas habiles"` | `"en máximo 24 horas hábiles"` |
| 156 | `label="Correo electronico"` | `label="Correo electrónico"` |
| 177 | `label="Ubicacion / alcance"` | `label="Ubicación / alcance"` |
| 187 | `"documentacion basica"` | `"documentación básica"` |

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (21.º día — LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

El nombre del candidato que escribe en el Paso 0 queda textual en `site_eventos.valor` (confirmado: `logEvent("kyo_mensaje", trimmed.slice(0, 300))`). Fix de 1 línea:
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 44 — Inconsistencia usted/tú en system prompt de Kyo (15.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero el manejo de otros temas tutea: `"te conecto"` (línea 66), `"¿te ayudo"` (línea 67). Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (21.º día)
**Archivo:** `src/app/vacantes/page.tsx` línea 32

`"Mas de $20k"` → `"Más de $20k"`. Actualizar también la función `matchesSalario`.

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (21.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 y 148-153

Kyo puede decir "salario $12,000" sin aclarar si es neto o bruto. Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()` de `listJobs()`.

---

### BUG 48 — Sin ARIA live region en el chat widget (21.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

Confirmado: `<div ref={scrollRef} className="flex-1 overflow-y-auto px-5 pb-3 space-y-4">` sin atributos de accesibilidad. Fix de 1 línea:
```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (21.º día)
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

Confirmado: `{job.salario_nota?.trim() ? job.salario_nota : "MXN bruto"}`. Cambiar el fallback de `"MXN bruto"` a `"mensual"` (neutro) hasta que el admin complete el campo.

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (21.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 99 y `src/app/api/assistant/chat/route.ts` línea 131

El cliente almacena hasta 30 mensajes (`MAX_STORED = 30`), el servidor trunca a 20 (`body.messages.slice(-20)`). Los Pasos 0-4 usan ~10 mensajes. Una conversación con más de 20 mensajes puede perder el nombre, puesto, experiencia, zona y jornada del candidato. Fix en `useChat.ts` — truncar antes del fetch:
```ts
messages: newMessages.slice(-20).map(...)
```

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (21.º día)
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Confirmado: `return JOBS.map((j) => ({ id: String(j.id) }))`. Las vacantes de Supabase con IDs distintos a los de `JOBS` no se prerenderizan y pueden tener peor TTI. Eliminar `generateStaticParams()` completamente — la ruta dinámica funciona en runtime con `dynamicParams: true` por defecto.

---

### BUG 16 — Memory leak en `rateLimitMap` (21.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Con el tiempo, acumula entradas expiradas y crece indefinidamente. Añadir purga de entradas expiradas en `checkRateLimit()` o migrar a Upstash Redis en producción multi-instancia.

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

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx`. Cuando no hay resultados no hay salida. Añadir botón que abra el widget de Kyo:
  ```tsx
  <button onClick={() => window.dispatchEvent(new CustomEvent("kyo:open"))} className="mt-4 text-sm font-bold text-blue underline">
    Pídele ayuda a Kyo →
  </button>
  ```
  Escuchar `"kyo:open"` en `ChatWidget.tsx` con `useEffect` para abrir el panel.

- **"Nueva conversacion" sin acento y mal posicionado** — `ChatWidget.tsx` línea 161. El botón dice `"Nueva conversacion"` (sin tilde). Corregir a `"Nueva conversación"`. Mover al header del widget (junto al botón de cerrar) para que sea visible sin hacer scroll.

- **Altura del widget demasiado pequeña en iPhone SE** — `src/components/assistant/ChatWidget.tsx` línea 120. `h-[min(60vh,560px)]` en un viewport de 568px (iPhone SE) da solo 341px de panel, y con header (~60px) e input (~60px) quedan apenas ~220px para mensajes. Cambiar a `h-[min(70vh,560px)]`.

### Media prioridad

- **Avisar al candidato que puede seguir hablando con Kyo tras la navegación** — Cuando el Paso 5 ejecuta `navigate_to('/vacantes?...')`, la página cambia pero el widget permanece. El candidato no sabe que el chat sigue activo. Añadir al Paso 5 en `system-prompt.ts`: `"Le abro las vacantes en pantalla. Podemos seguir hablando aquí si tiene dudas."` Y en `useChat.ts` línea 127: incrementar el delay de navegación de 700ms a 1400ms para que el candidato pueda leer la respuesta.

- **Confirmación visual al aprobar en `/revisor`** — Rosy y Monse no tienen feedback inmediato. Añadir un toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120 s. El botón "🗄️ Liberar espacio" no tiene indicador de progreso real. Añadir estado `"Archivando video..."` con spinner y deshabilitar el botón durante la operación.

- **Timeout en fetch del chat** — `src/components/assistant/useChat.ts` línea 95. La llamada a `/api/assistant/chat` no tiene `AbortController`. Añadir:
  ```ts
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch("/api/assistant/chat", { ..., signal: controller.signal });
  clearTimeout(timeout);
  ```

- **Notificación al cliente al publicar video TikTok** — Pendiente explícito en CLAUDE.md. Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos.

### Baja prioridad

- **Tour de novedad bloquea pestaña Análisis** — `src/app/revisor/page.tsx`: mostrar `<NovedadFiltros />` solo cuando `seccion === "publicaciones"`.

- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true` mejoran la percepción de velocidad.

- **Imagen de confianza con avatares externos** — `src/components/sections/Hero.tsx` línea 98. Los avatares de `https://i.pravatar.cc/56?img=1` son fotos de personas aleatorias de internet. Dependencia externa que puede fallar o causar problemas legales. Reemplazar con avatares genéricos SVG o fotos de candidatos reales con permiso.

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

- **Mencionar las 24 h de respuesta en Paso 5** — El dato más persuasivo para motivar la aplicación no aparece en el pitch de recomendación. Añadir al formato de respuesta del Paso 5: `"Nuestro equipo le contacta en menos de 24 horas hábiles."`

- **Resumen de perfil en Paso 4 (ancla contra truncado de contexto)** — Con el historial cortado a 20 mensajes (BUG 52), una conversación larga puede perder el nombre del candidato. Añadir instrucción en Paso 4: al completar Pasos 0-4, sintetizar en una línea: `"Perfil capturado: [nombre], [puesto], [N años], zona [X], [jornada]."`

- **Manejo de empresa confidencial en Paso 5** — Si la empresa está vacía en Supabase, Kyo podría mostrar "— undefined" o en blanco. Añadir en el system prompt: `"Si la empresa es confidencial, omite el nombre y pon 'Empresa confidencial'."`

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero `search_jobs` no acepta ese parámetro. Añadir:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  También actualizar `listJobs()` en `knowledge.ts` para aplicar estos filtros.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, crear un registro en Supabase directamente desde Kyo (puesto, experiencia, zona, jornada, `origen: 'kyo_banco_talentos'`). El candidato no tendría que rellenar el formulario manualmente.

### Problemas detectados

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to` sin texto, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acentos). Fix:
  ```ts
  const replyContent = finalText
    || (navigations.length > 0 ? "Le abro esa sección ahora mismo." : "Entendido, ¿en qué más le puedo ayudar?");
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

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Revisar si `upload`, `posts`, `config`, `importar`, `informe` y los demás también carecen de verificación explícita.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto |
|---|-----------|----------|---------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico |
| 3 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico |
| 4 | BUG 66 — reset() no limpia sessionStorage → sobreescribe logs | Bajo (1 línea) | Crítico |
| 5 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico |
| 6 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto |
| 7 | BUG 63 — Estadísticas +7000 vs 687+ contradicción | Bajo (1 min) | Alto |
| 8 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto |
| 9 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (1 min) | Alto |
| 10 | BUG 57 — `subirADrive` sin timeout | Bajo (5 min) | Alto |
| 11 | BUG 60 — `fetch(video_url)` sin timeout | Bajo (1 línea) | Alto |
| 12 | Variables `GOOGLE_*` en VPS (no es código) | Bajo (5 min) | Alto |
| 13 | BUG 53 — 6 acentos faltantes en AplicarModal | Bajo (5 min) | Alto |
| 14 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto |
| 15 | BUG 46 — Acento "aquí" en saludo inicial Kyo | Bajo (1 min) | Alto |
| 16 | BUG 44 — Registro usted/tú inconsistente en prompt | Bajo (15 min) | Alto |
| 17 | BUG 51 — Fallback "MXN bruto" en vacantes sin salario_nota | Bajo (1 min) | Alto |
| 18 | "Nueva conversacion" sin acento en ChatWidget | Bajo (1 min) | Medio |
| 19 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio |
| 20 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio |
| 21 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto |
| 22 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio |
| 23 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio |
| 24 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio |
| 25 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio |
| 26 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico |
| 27 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio |
| 28 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto |
| 29 | Altura widget en iPhone SE | Bajo (1 min) | Medio |
| 30 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio |
| 31 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto |
| 32 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio |
| 33 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio |
| 34 | Tool register_talent_interest | Medio | Alto |
| 35 | Tour novedad en pestaña Análisis | Bajo (1 línea) | Medio |
| 36 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio |
| 37 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo |
| 38 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo |
