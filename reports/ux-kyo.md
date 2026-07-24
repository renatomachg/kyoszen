# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-24
**Cambios analizados:** Sin commits nuevos en las últimas 48 h (último commit de código `d8c456f` del 2026-07-21 — Centro de Proyectos). Archivos releídos hoy: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/page.tsx`, `src/app/revisor/page.tsx`, `src/components/revisor/ProyectosCliente.tsx`, `src/app/admin/(panel)/proyectos/page.tsx`.

---

## Cambios Recientes Detectados

**Sin commits nuevos.** El último cambio de código es el Centro de Proyectos (`d8c456f`, 2026-07-21). Se incrementan los contadores de todos los bugs existentes y se añaden 2 nuevos hallazgos de la relectura de hoy.

---

## 🔴 BUGS NUEVOS — DETECTADOS HOY

### BUG 102 — `/api/assistant/chat` sin timeout server-side → usuario ve "escribiendo..." indefinidamente (1.er día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 148-193

El bucle de tool-use llama a `client.messages.create()` hasta 5 veces con ningún `AbortSignal` ni timeout. Si Anthropic tarda o se cuelga, el usuario ve el indicador de escritura hasta que Next.js corta la conexión (30 s en la mayoría de plataformas), sin ningún mensaje de error personalizado. El `catch` solo atrapa errores lanzados explícitamente, no timeouts de red.

**Fix — Race contra un timeout:**
```ts
// Envolver el bucle en un Promise.race
async function runLoop() { /* el for loop actual */ }

const result = await Promise.race([
  runLoop(),
  new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), 22_000)
  ),
]);
if (!result) {
  return NextResponse.json(
    { error: "El asistente tardó demasiado. Intenta de nuevo en un momento." },
    { status: 504 }
  );
}
```
Esto da al usuario un mensaje claro en lugar de un spinner eterno.

---

### BUG 103 — `matchesQuery()` no normaliza acentos → búsquedas candidato/vacante no coinciden (1.er día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 108-110

```ts
function matchesQuery(text: string, query: string | undefined): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}
```

`toLowerCase()` no quita diacríticos. Si una vacante tiene el tag `"Área Administrativa"` y el candidato (o Kyo) busca `"area administrativa"`, el `includes` falla porque `á ≠ a`. Lo mismo ocurre al revés: candidato escribe `"atención al cliente"` pero el job tiene tag `"atencion al cliente"`. En español esto afecta a una fracción significativa de búsquedas.

**Fix — Normalizar ambos lados:**
```ts
function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function matchesQuery(text: string, query: string | undefined): boolean {
  if (!query) return true;
  return normalizar(text).includes(normalizar(query));
}
```
El fix es de 5 líneas y mejora la precisión de `search_jobs`, `search_courses` y el filtro de listados.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (acumulados)

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (43.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt (línea 138 de `system-prompt.ts`) construye el listado desde `knowledge.listJobs()` — si Supabase tiene vacantes distintas, Kyo da al candidato información errónea.

La interfaz `KnowledgeProvider` ya está preparada para el reemplazo. `vacantes/page.tsx` ya lee de Supabase directamente — Kyo es el único componente que sigue usando los datos demo.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. Registrar en línea 167 en lugar del provider estático.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (43.º día — LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```

El nombre del candidato (Paso 0) y cualquier dato que mencione quedan textual en `site_eventos.valor`. Riesgo legal LFPDPPP.

**Fix de 1 línea:**
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (32.º día sin fix)
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

---

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (27.º día)
**Archivos:** `src/lib/assistant/knowledge.ts` línea 83 y `src/components/assistant/ChatWidget.tsx` línea 227

`COMPANY.contact.whatsapp = "https://wa.link/5zv0ba"`. Cuando Kyo responde con el link de WhatsApp, la burbuja usa `whitespace-pre-wrap` sin renderizado de markdown — la URL aparece como texto plano, no como enlace. WhatsApp es la conversión principal de Kyoszen y el candidato no puede hacer clic.

**Fix combinado (resuelve también BUG 26):**
```ts
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

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs de conversaciones (26.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-144

`reset()` elimina `localStorage` pero NO `sessionStorage`. La siguiente conversación reutiliza el mismo `session_id` y el upsert sobreescribe el log anterior.

**Fix de 1 línea:**
```ts
localStorage.removeItem(STORAGE_KEY);
sessionStorage.removeItem("kyo_session_id"); // ← agregar esta línea
```

---

### BUG 91 — `INITIAL_GREETING` hardcodeado desincronizado del system prompt (5.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 18 y `src/lib/assistant/system-prompt.ts` línea 16

`INITIAL_GREETING.content` en `useChat.ts` es un string literal fijo. Si el admin edita el saludo desde el panel de Kyo (Supabase `kyo_config`), el system prompt se actualiza pero el mensaje que el usuario ve en el widget sigue siendo el hardcodeado original.

**Fix:**
```ts
// system-prompt.ts — exportar el texto del saludo
export const KYO_GREETING = "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?";

// useChat.ts — importar en lugar de hardcodear
import { KYO_GREETING } from "@/lib/assistant/system-prompt";
const INITIAL_GREETING: ChatMessage = { id: "greeting", role: "assistant", content: KYO_GREETING, timestamp: 0 };
```

---

### BUG 98 — SMTP `from` con string template en proyectos → error 501 en IONOS (3.er día)
**Archivo:** `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/status/route.ts` línea 66

```ts
from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
```

CLAUDE.md documenta que IONOS da error 501 con el formato `"Nombre <correo>"` en string. Las notificaciones de aprobación/cambios de proyectos fallarán silenciosamente (el `catch` es `// noop`).

**Fix (mismo patrón ya usado en otros endpoints):**
```ts
from: { name: "Kyoszen Revisor", address: smtp.smtp_from ?? smtp.smtp_user },
```

---

### BUG 78 — `PropuestaEditor` sin confirmación antes de enviar correo al cliente (15.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor` aprox. línea 379

El botón `"📨 Guardar y avisar al cliente"` llama directamente a `guardar(true)` → crea nueva versión y envía correo a Rosy y Monse sin diálogo de confirmación. Un clic accidental notifica innecesariamente.

**Fix:**
```ts
<button onClick={() => {
  if (!window.confirm("¿Guardar cambios y enviar correo de actualización a las revisoras ahora?")) return;
  guardar(true);
}} ...>
```

---

### BUG 79 — `PostModal.save()` cierra el modal sin verificar si el fetch falló (15.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `save()` en `PostModal` (aprox. línea 176)

El fetch puede fallar silenciosamente y el modal cierra de todas formas (`onSaved(); onClose()` se llaman siempre).

**Fix:**
```ts
const res = await fetch(...);
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  alert(`Error al guardar: ${err.error ?? res.status}. No se perdieron tus datos.`);
  setSaving(false);
  return;
}
setSaving(false);
onSaved();
onClose();
```

---

## 🟠 BUGS PENDIENTES — ALTA PRIORIDAD

### BUG 99 — Cursos de Supabase no llegan a Kyo (2.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 1 y 167

`StaticKnowledgeProvider.listCourses()` lee de `COURSES` hardcoded. Si el admin agrega un curso nuevo en `/admin/cursos`, Kyo no lo ve. El mismo patrón del BUG 1 pero para cursos.

**Fix:** Extender la futura `SupabaseKnowledgeProvider` para leer también de la tabla `cursos`.

---

### BUG 100 — `kyo_faqs` de Supabase no alimentan a Kyo (2.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 99-105

`getCompanyInfo().faqs` devuelve las 5 FAQs hardcodeadas. La tabla `kyo_faqs` nunca se lee.

**Fix:**
```ts
// En chat/route.ts — junto al getStoredInstrucciones():
const { data: faqs } = await sbAdmin.from("kyo_faqs").select("pregunta, respuesta").eq("activo", true);
// Pasar al buildSystemPrompt como parámetro adicional y sustituir company.faqs
```

---

### BUG 92 — `aprobarPendientes()` secuencial sin atomicidad → estado parcial si falla (3.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 485-498

```ts
for (const bloque of pendientes) {        // secuencial
  setAccionId(bloque.id);
  await patchEstado(bloque.id, "aprobado"); // si falla a mitad, la etapa queda parcialmente aprobada
}
```

**Fix — `Promise.allSettled` para paralelizar y detectar fallos parciales:**
```ts
const resultados = await Promise.allSettled(
  pendientes.map(b => patchEstado(b.id, "aprobado"))
);
const fallos = resultados.filter(r => r.status === "rejected");
if (fallos.length > 0) {
  setError(`${fallos.length} escena(s) no se pudieron aprobar. Recarga e intenta de nuevo.`);
}
```

---

### BUG 93 — Modal de proyectos usa `onMouseDown` para cerrar → cierra al arrastrar texto (3.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 506-511

**Fix de 2 líneas:**
```tsx
<div onClick={onClose} ...>
  <div onClick={e => e.stopPropagation()} ...>
```

---

### BUG 97 — "Aprobar todas las pendientes" sin confirmación → aprobación masiva accidental (3.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` línea 586

**Fix:**
```tsx
<Boton
  onClick={() => {
    if (!window.confirm(`¿Aprobar las ${progreso.pendiente} escenas pendientes de esta etapa?`)) return;
    void aprobarPendientes();
  }}
  disabled={aprobandoTodas || accionId !== null}>
  ✅ {aprobandoTodas ? "Aprobando…" : `Aprobar todas (${progreso.pendiente})`}
</Boton>
```

---

### BUG 101 — `DetalleProyecto` modal sin botón "Reintentar" al fallar la carga (2.º día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 528-533

Cuando `cargarDetalle()` falla, se muestra el error pero no hay forma de reintentar sin cerrar y reabrir el modal.

**Fix:**
```tsx
{error && (
  <div ...>
    <p role="alert" ...>{error}</p>
    <Boton onClick={() => void cargarDetalle()} secundario>Volver a intentar</Boton>
  </div>
)}
```

---

### BUG 89 — `deletePost()` sin `res.ok` (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `deletePost`

**Fix:** Verificar `res.ok` antes de `onUpdated(); onClose()`.

---

### BUG 90 — `togglePublicado()` sin `res.ok` — UI diverge de BD (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

**Fix:** Verificar `res.ok` antes de actualizar el estado UI.

---

### BUG 86 — Tres funciones de movimiento sin `res.ok` (11.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `moverPostPeriodo`, `moverPostAFecha`, `intercambiarFechas`

---

### BUG 87 — Input de fecha activo mientras el `moving` está en curso (11.º día)
**Fix de 1 atributo:** `<input type="date" disabled={moving} ...>`

---

### BUG 84 — `StoryboardEditor` y `GuiaTecnicaEditor` sin `onSaved()` tras guardar (12.º día)
**Fix:** Exponer `onSaved?: () => void` en ambos editores y llamarlo tras el PUT exitoso.

---

### BUG 85 — `key={i}` en beats de montaje → reorders causan pérdidas de foco (12.º día)
**Fix:** Generar `_key` estable por beat al inicializar.

---

### BUG 80 — Botón × del último cuadro/beat sin `disabled` (15.º día)
**Fix:** `<button disabled={frames.length === 1} style={{opacity: frames.length === 1 ? 0.35 : 1}}>×</button>`

---

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar (15.º día)
**Fix con dirty-check:** `const isDirty = ...` y `if (isDirty && !window.confirm("¿Descartar cambios?")) return;`

---

### BUG 82 — Triple caption divergente sin sincronización (15.º día)
**Fix recomendado:** Al guardar desde `PropuestaEditor`, propagar `caption` también a `storyboard.guia_tecnica.caption`.

---

### BUG 83 — Cuadros con solo `tipo` se filtran silenciosamente al guardar (15.º día)
```ts
frames: frames.filter((f) => f.tc || f.overlay || f.escena || f.dice), // descarta cuadros con solo tipo
```
**Fix:** `|| f.tipo !== "normal"` al final del filter.

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (32.º día)
**Fix:** `signal: AbortSignal.timeout(15_000)` en el token refresh; `signal: AbortSignal.timeout(120_000)` en la subida.

---

### BUG 60 — `fetch(version.video_url)` sin timeout (31.º día)
**Fix:** `const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });`

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (30.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 85-86

`system-prompt.ts` línea 85 dice `"Estado de Mexico"` y `"Hibrido"` (sin acentos), pero `vacantes/page.tsx` valida contra `["Estado de México", "Híbrido"]`.

**Fix en `system-prompt.ts` línea 85:**
```
- /vacantes?ubicacion=CDMX (valores: CDMX, Estado de México, Híbrido, Remoto)
```

---

### BUG 76 — Input de Kyo sin `maxLength` — riesgo de costos de tokens (17.º día)
**Fix:** `<input maxLength={600} ...>` y validación en `route.ts` para mensajes > 2000 chars.

---

### BUG 77 — Sin focus trap en ChatWidget — usuarios de teclado escapan del widget (17.º día)
**Fix:** `useEffect` con trap de teclado sobre los elementos focuseables del panel.

---

### BUG 72 — AplicarModal no cierra con tecla Escape (18.º día)
**Fix:**
```ts
useEffect(() => {
  const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
  document.addEventListener("keydown", h);
  return () => document.removeEventListener("keydown", h);
}, [open]);
```

---

### BUG 73 — Acentos faltantes en `UBICACION_OPTIONS` de AplicarModal (18.º día)
```
"CDMX — maximo 1 hora de traslado"    → "CDMX — máximo 1 hora de traslado"
"Estado de Mexico"                      → "Estado de México"
"Disponible para reubicacion"           → "Disponible para reubicación"
```

---

### BUG 74 — "Si, todo en orden" sin acento (18.º día)
`"Si, todo en orden"` → `"Sí, todo en orden"`

---

### BUG 75 — AplicarModal fetch sin timeout — candidato bloqueado en "Enviando..." (18.º día)
**Fix:** `AbortController` con `setTimeout(30_000)` y mensaje de error en `"timeout"`.

---

### BUG 69 — "aqui" sin acento en DOS archivos (19.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 20 y `src/lib/assistant/system-prompt.ts` línea 16

---

### BUG 70 — Error de red muestra string técnico al usuario (19.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 129-131

**Fix:**
```ts
} catch (err) {
  const isNetwork = err instanceof TypeError && err.message.includes("fetch");
  setError(isNetwork ? "No se pudo conectar. Verifica tu internet e intenta de nuevo." : ...);
}
```

---

### BUG 71 — Widget de Kyo no cierra con tecla Escape (19.º día)
**Fix:**
```ts
useEffect(() => {
  const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
  document.addEventListener("keydown", h);
  return () => document.removeEventListener("keydown", h);
}, [open]);
```

---

### BUG 68 — Hero muestra datos inconsistentes con knowledge base (20.º día)
**Archivos:** `src/components/sections/Hero.tsx` líneas 107, 157, 176; `src/lib/assistant/knowledge.ts` líneas 75-79

Float card: `10+` años — knowledge.ts dice `"3+"`. Candidatos: `7000+` — knowledge.ts dice `"687+"`.

**Fix en `Hero.tsx`:** Cambiar a `687+` candidatos y `3+` años de experiencia.

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (20.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 81 → `"¿Qué puesto buscas?"`

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (29.º día)
`import Image from "next/image"` — usar `<img>` nativo.

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (29.º día)
**Fix dinámico:** Leer empresas únicas de Supabase con `supabase.from("vacantes").select("empresa").eq("activa", true)`.

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (43.º día sin fix)
Fix unificado con BUG 65 (ver arriba).

---

### BUG 44 — Inconsistencia usted/tú en system prompt (37.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero el manejo de otros temas tutea: `"te conecto"`, `"¿te ayudo"`. Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (43.º día)
`"Mas de $20k"` → `"Más de $20k"` (en label y en el `case`).

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (43.º día)
Kyo puede decir "salario $12,000" sin aclarar si es neto o bruto. Añadir `salario_nota?: string` a `JobSummary`.

---

### BUG 48 — Sin ARIA live region en el chat widget (43.º día)
```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (43.º día)
Cambiar fallback `"MXN bruto"` a `"mensual"`.

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (43.º día)
Con más de 20 mensajes se puede perder el nombre, puesto, experiencia, zona y jornada del candidato.

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (32.º día)
El regex no hace match si hay query params o CDN personalizado.

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (32.º día)
Cuando `storyboard.archivado` está presente, el admin ve un storyboard vacío.

---

### BUG 16 — Memory leak en `rateLimitMap` (43.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir purga de entradas expiradas en `checkRateLimit()`.

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (43.º día)
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Las vacantes de Supabase con IDs distintos no se prerenderizan. Eliminar `generateStaticParams()` completamente.

---

### BUG 94 — Guía de uso no menciona la pestaña "🎬 Proyectos" (3.er día)
**Archivo:** `src/app/revisor/page.tsx` — `GUIA_PASOS`

**Fix — añadir paso a `GUIA_PASOS`:**
```ts
{
  emoji: "🎬",
  titulo: "Centro de Proyectos",
  texto: "En la pestaña «Proyectos» revisas videos o guiones escena por escena. Aprobar una etapa desbloquea la siguiente.",
  selector: null,
},
```

---

### BUG 95 — Tour `showGuia` / `showNovedad` ignora la pestaña activa → coach marks apuntan a elementos no visibles (3.er día)
**Archivo:** `src/app/revisor/page.tsx` líneas 936-948

**Fix:**
```ts
{showGuia && seccion === "publicaciones" && <GuiaUso ... />}
{showNovedad && seccion === "publicaciones" && <NovedadFiltros ... />}
```

---

### BUG 96 — `loadPosts()` hace 4 fetches completos al cambiar de semana (3.er día)
Cada vez que el usuario toca `‹ ›`, se descargan la config de página (inmutable) y todos los posts sin filtro de fechas.

**Fix — separar carga inicial de recarga de periodo** (detalles en reportes anteriores).

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

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx`. Cuando no hay resultados no hay salida. Añadir botón que dispare `CustomEvent("kyo:open")`.

- **"Nueva conversacion" sin acento y mal posicionado** — `ChatWidget.tsx` línea 161. Corregir a `"Nueva conversación"` y mover al header.

- **Altura del widget demasiado pequeña en iPhone SE** — `ChatWidget.tsx` línea 120. Cambiar `h-[min(60vh,560px)]` a `h-[min(70vh,560px)]`.

- **Proyectos: badge de urgencia en tarjeta** — `ProyectosCliente.tsx`. Las tarjetas de proyecto no tienen indicador de "🔴 Requiere tu revisión" cuando hay bloques con cambios o pendientes. Añadir badge basado en el progreso de las etapas.

- **Proyectos: hover state en tarjetas** — `ProyectosCliente.tsx`. Las tarjetas de proyecto usan un `<button>` sin `onMouseEnter`/`onMouseLeave`, mientras las tarjetas de publicaciones sí tienen la elevación. Añadir `transform: "translateY(-2px)"` y `boxShadow` en hover.

### Media prioridad

- **Avisar al candidato que puede seguir hablando con Kyo tras la navegación** — En Paso 5 de `system-prompt.ts` añadir: `"Le abro las vacantes en pantalla. Podemos seguir hablando aquí si tiene dudas."` Y en `useChat.ts` línea 127: incrementar el delay de navegación de 700ms a 1400ms.

- **Confirmación visual al aprobar en `/revisor`** — Toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120 s. Añadir spinner y deshabilitar botón durante la operación.

- **Timeout en fetch del chat** — `src/components/assistant/useChat.ts` línea 95. Añadir `AbortController` con 30 s.

- **Notificación al cliente al publicar video TikTok** — Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos.

- **`enterKeyHint="send"` en input de Kyo** — `ChatWidget.tsx` línea 170. En teclados virtuales de iOS/Android muestra "enviar".

- **Proyectos: `role="tabpanel"` faltante en el área de contenido de etapas** — `ProyectosCliente.tsx`. El `<section>` que muestra los bloques de la etapa no tiene `role="tabpanel"` ni `aria-labelledby`.

### Baja prioridad

- **Tour de novedad solo en pestaña Publicaciones** — `src/app/revisor/page.tsx`: `{showNovedad && seccion === "publicaciones" && <NovedadFiltros />}`. (Cubre también BUG 95.)
- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true`.
- **Avatares externos de pravatar.cc en Hero** — Reemplazar con avatares SVG genéricos.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 6 sin manejo de rechazo** — Añadir al Paso 6 en `system-prompt.ts`:
  ```
  Si el candidato rechaza todas las opciones:
  "Entiendo, [nombre]. Puedo registrar su perfil en nuestro banco de talentos para avisarle cuando surja una oportunidad más afín. ¿Le parece bien?"
  Navegar a /contacto.
  ```

- **Mencionar las 24 h de respuesta en Paso 5** — El dato más persuasivo no aparece en el pitch de recomendación. Añadir al formato del Paso 5: `"Nuestro equipo le contacta en menos de 24 horas hábiles."`

- **Resumen de perfil en Paso 4** — Al completar Pasos 0-4, sintetizar: `"Perfil capturado: [nombre], [puesto], [N años], zona [X], [jornada]."` Protege contra el truncado de contexto de conversaciones largas (BUG 52).

- **Manejo de empresa confidencial en Paso 5** — Añadir en system prompt: `"Si la empresa es 'Confidencial', no la menciones. Di: «Empresa confidencial»."` (`system-prompt.ts` línea 52).

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero `search_jobs` no acepta ese parámetro. Añadir:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  También actualizar `listJobs()` en `knowledge.ts` para aplicar estos filtros.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, crear un registro en Supabase directamente desde Kyo. El candidato no tendría que rellenar el formulario manualmente.

### Problemas detectados

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. `"Entendido, ¿en que mas te puedo ayudar?"`. Cuando Claude solo llama `navigate_to` sin texto, el fallback carece de acentos y usa tono incorrecto.

  **Fix:**
  ```ts
  const replyContent = finalText
    || (navigations.length > 0 ? "Le abro esa sección ahora mismo." : "Entendido, ¿en qué más le puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` con poco margen** — Línea 85. Paso 5 óptimo = `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Solo 1 de margen. Subir a 8.

- **`getStoredInstrucciones()` usa anon key** — Si RLS de `kyo_config` se endurece, falla silenciosamente. Usar `sbAdmin` (service role).

- **Cursos y FAQs de Supabase no llegan a Kyo** — BUG 99 y BUG 100. El admin puede agregar cursos y FAQs desde el panel, pero Kyo siempre responde con los datos hardcodeados.

---

## Oportunidades de mejora general

- **Variables `GOOGLE_*` pendientes en el VPS** — El botón "🗄️ Liberar espacio" devuelve 503 en producción porque `driveConfigurado()` devuelve `false`. Añadir las 4 vars al `ecosystem.config.js` del VPS es un deploy de 5 minutos sin código nuevo.

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante específica. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts`.

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header del widget (`"Paso 2 de 5"`) reduce abandonos.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — 5 s mirando "Sin resultados" + bubble proactivo de Kyo. Implementar con `useEffect` + `setTimeout(5000)`, una vez por sesión.

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Revisar todos los demás endpoints admin.

- **Sistema de prompts dinámico para Kyo** — `chat/route.ts` ya cachea `instrucciones` 60 s. El mismo patrón debería aplicarse para `kyo_faqs` (BUG 100) y eventualmente para vacantes/cursos de Supabase (BUG 1 y BUG 99).

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto | Días |
|---|-----------|----------|---------|------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 43 |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 32 |
| 3 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 43 |
| 4 | BUG 98 — SMTP from con template string en proyectos → error 501 IONOS | Bajo (1 línea) | Crítico | 3 |
| 5 | BUG 102 — Sin timeout server-side en Anthropic API call | Bajo (20 min) | Crítico | 1 |
| 6 | BUG 99 — Cursos de Supabase no llegan a Kyo | Alto | Alto | 2 |
| 7 | BUG 100 — kyo_faqs de Supabase no alimentan a Kyo | Bajo (30 min) | Alto | 2 |
| 8 | BUG 92 — aprobarPendientes() secuencial sin rollback | Bajo (15 min) | Alto | 3 |
| 9 | BUG 91 — INITIAL_GREETING desincronizado del system prompt | Bajo (10 min) | Alto | 5 |
| 10 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 15 |
| 11 | BUG 89 — deletePost() sin res.ok | Bajo (10 min) | Alto | 10 |
| 12 | BUG 90 — togglePublicado() sin res.ok | Bajo (10 min) | Alto | 10 |
| 13 | BUG 86 — moverPost* sin res.ok (3 funciones) | Bajo (15 min) | Alto | 11 |
| 14 | BUG 103 — matchesQuery() no normaliza acentos | Bajo (10 min) | Alto | 1 |
| 15 | BUG 93 — onMouseDown para cerrar modal proyectos | Bajo (2 líneas) | Medio | 3 |
| 16 | BUG 97 — "Aprobar todas" sin confirmación | Bajo (10 min) | Alto | 3 |
| 17 | BUG 101 — DetalleProyecto sin botón Reintentar | Bajo (10 min) | Medio | 2 |
| 18 | BUG 94 — Guía de uso sin paso de Proyectos | Bajo (10 min) | Medio | 3 |
| 19 | BUG 95 — Tour/novedad sin guard de sección activa | Bajo (10 min) | Medio | 3 |
| 20 | BUG 96 — 4 fetches redundantes al cambiar periodo | Bajo (20 min) | Medio | 3 |
| 21 | BUG 87 — Input fecha activo mientras moving=true | Bajo (1 atrib) | Bajo | 11 |
| 22 | BUG 84 — StoryboardEditor/GuiaTecnicaEditor sin onSaved() | Bajo (10 min) | Alto | 12 |
| 23 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 15 |
| 24 | BUG 85 — key={i} en beats de montaje | Bajo (10 min) | Alto | 12 |
| 25 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | 15 |
| 26 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | 15 |
| 27 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | 15 |
| 28 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | 15 |
| 29 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 27 |
| 30 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 26 |
| 31 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 29 |
| 32 | BUG 68 — Hero "10+ años / 7000+ colocados" vs knowledge "3+ / 687+" | Bajo (1 min) | Alto | 20 |
| 33 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 29 |
| 34 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 30 |
| 35 | BUG 57 — subirADrive sin timeout | Bajo (5 min) | Alto | 32 |
| 36 | BUG 60 — fetch(video_url) sin timeout | Bajo (1 línea) | Alto | 31 |
| 37 | Variables GOOGLE_* en VPS (no es código) | Bajo (5 min) | Alto | 33 |
| 38 | BUG 67 — Placeholder Hero sin acento "¿Que puesto?" | Bajo (1 char) | Alto | 20 |
| 39 | BUG 53 / BUG 73 / BUG 74 — Acentos en AplicarModal | Bajo (5 min) | Alto | 43/18/18 |
| 40 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 43 |
| 41 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 19 |
| 42 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 19 |
| 43 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 18 |
| 44 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 18 |
| 45 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 17 |
| 46 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 17 |
| 47 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 19 |
| 48 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 37 |
| 49 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 43 |
| 50 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 43 |
| 51 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 32 |
| 52 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 53 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 43 |
| 54 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 32 |
| 55 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 43 |
| 56 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 43 |
| 57 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 58 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 59 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 60 | Proyectos: badge urgencia en tarjeta | Bajo (CSS) | Medio | — |
| 61 | Proyectos: hover state en tarjetas | Bajo (CSS) | Bajo | — |
| 62 | Proyectos: role="tabpanel" faltante | Bajo (1 atrib) | Bajo | — |
| 63 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 64 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 65 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 66 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 67 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 68 | Tool register_talent_interest | Medio | Alto | — |
| 69 | PageHero vacantes con imagen Unsplash externa | Bajo (5 min) | Bajo | — |
| 70 | Tour novedad solo en pestaña Publicaciones | Bajo (1 línea) | Medio | — |
| 71 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 43 |
| 72 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 43 |
| 73 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 74 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 75 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
| 76 | Sistema de prompts dinámico para Kyo (faqs+cursos+vacantes) | Alto | Alto | — |
