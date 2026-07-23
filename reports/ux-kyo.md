# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-23
**Cambios analizados:** Sin commits nuevos desde ayer (último commit `d8c456f` del 2026-07-21 — Centro de Proyectos). Archivos releídos hoy: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/app/revisor/page.tsx`, `src/components/revisor/ProyectosCliente.tsx`, `src/app/admin/(panel)/proyectos/page.tsx`, `src/lib/proyectos.ts`.

---

## Cambios Recientes Detectados

**Sin commits nuevos en las últimas 24 h.** La base del análisis es el commit `d8c456f` (Centro de Proyectos, 2026-07-21). Se reedita el reporte con 2 bugs nuevos detectados hoy en la relectura de `knowledge.ts` (BUG 99 y BUG 100), contadores de días incrementados y la tabla de prioridades actualizada.

---

## 🔴 BUGS NUEVOS — DETECTADOS HOY

### BUG 99 — Cursos de Supabase no llegan a Kyo (1.er día)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 1 y 167

`StaticKnowledgeProvider.listCourses()` lee de `COURSES` hardcoded importado de `@/lib/courses`. El panel `/admin/cursos` guarda cursos en Supabase (`cursos` table), pero Kyo no los ve. Si el admin agrega el curso "PNL para Ventas" hoy, Kyo seguirá diciendo que no existe o no lo sugerirá.

El mismo patrón del BUG 1 (vacantes), pero para cursos. La interfaz `KnowledgeProvider` ya soporta el reemplazo.

**Fix:** Extender la futura `SupabaseKnowledgeProvider` para leer también de la tabla `cursos` (igual que ya se haría para vacantes). Como solución intermedia:
```ts
// En StaticKnowledgeProvider.listCourses() — query Supabase si está disponible
// (mismo enfoque que se usará en SupabaseKnowledgeProvider)
```

---

### BUG 100 — `kyo_faqs` de Supabase no alimentan a Kyo (1.er día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 99-105

`getCompanyInfo().faqs` devuelve las FAQs hardcodeadas en el objeto `COMPANY`. La tabla `kyo_faqs` existe en Supabase (documentada en CLAUDE.md) pero nunca se lee. Si el admin agrega preguntas frecuentes desde el panel de Kyo, no llegan al asistente.

El system prompt las incluye en línea 143 (`company.faqs.map(...)`), pero siempre serán las 5 FAQs fijas del código.

**Fix:** Leer `kyo_faqs` desde Supabase en el `buildSystemPrompt()` o en `getCompanyInfo()`, igual que ya se hace con `kyo_config` en `chat/route.ts`:
```ts
// En chat/route.ts — junto al getStoredInstrucciones():
const { data: faqs } = await sbAdmin.from("kyo_faqs").select("pregunta, respuesta").eq("activo", true);
// Pasar al buildSystemPrompt como parámetro adicional y sustituir company.faqs
```

---

### BUG 101 — `DetalleProyecto` modal sin botón "Reintentar" al fallar la carga (1.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 528-533

Cuando `cargarDetalle()` falla (red, Supabase), se muestra el mensaje de error pero el modal no ofrece ninguna acción:
```tsx
{error && (
  <p role="alert" ...>{error}</p>
  // ← no hay botón de reintentar; el único escape es cerrar y volver a abrir
)}
```
El revisor tiene que cerrar el modal, esperar, y hacer clic en el proyecto de nuevo. Frustrante en conexiones inestables.

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

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (acumulados)

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (42.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt (línea 138 de `system-prompt.ts`) construye el listado desde `knowledge.listJobs()` — si Supabase tiene vacantes distintas, Kyo da al candidato información errónea.

La interfaz `KnowledgeProvider` ya está preparada para el reemplazo. `vacantes/page.tsx` ya lee de Supabase directamente — Kyo es el único componente que sigue usando los datos demo.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. Registrar en línea 167 en lugar del provider estático.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (42.º día — LFPDPPP)
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

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (31.º día sin fix)
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

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (26.º día)
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

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs de conversaciones (25.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-144

`reset()` elimina `localStorage` pero NO `sessionStorage`. La siguiente conversación reutiliza el mismo `session_id` y el upsert sobreescribe el log anterior.

**Fix de 1 línea:**
```ts
localStorage.removeItem(STORAGE_KEY);
sessionStorage.removeItem("kyo_session_id"); // ← agregar esta línea
```

---

### BUG 91 — `INITIAL_GREETING` hardcodeado desincronizado del system prompt (4.º día)
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

### BUG 98 — SMTP `from` con string template en proyectos → error 501 en IONOS (2.º día)
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

### BUG 78 — `PropuestaEditor` sin confirmación antes de enviar correo al cliente (14.º día sin fix)
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

### BUG 79 — `PostModal.save()` cierra el modal sin verificar si el fetch falló (14.º día sin fix)
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

### BUG 92 — `aprobarPendientes()` secuencial sin atomicidad → estado parcial si falla (2.º día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 485-498

```ts
for (const bloque of pendientes) {        // secuencial
  setAccionId(bloque.id);
  await patchEstado(bloque.id, "aprobado"); // si falla a mitad, la etapa queda parcialmente aprobada
}
```

Si la red falla en la escena #3 de 8, las primeras 2 quedan aprobadas pero el rollup de la etapa no se completa.

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

### BUG 93 — Modal de proyectos usa `onMouseDown` para cerrar → cierra al arrastrar texto (2.º día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 506-511

Si el revisor selecciona texto del guion arrastrando el mouse hasta afuera del modal, el `mousedown` en el overlay dispara `onClose` y el modal se cierra. Patrón correcto: `onClick` en el overlay.

**Fix de 2 líneas:**
```tsx
<div onClick={onClose} ...>
  <div onClick={e => e.stopPropagation()} ...>
```

---

### BUG 97 — "Aprobar todas las pendientes" sin confirmación → aprobación masiva accidental (2.º día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` línea 586

Un clic accidental aprueba todas las escenas pendientes de la etapa en bloque, puede disparar el desbloqueo de Arte y el correo al admin antes de que el revisor haya leído todos los guiones.

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

### BUG 89 — `deletePost()` sin `res.ok` (9.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `deletePost` líneas 890-895

```ts
await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" });
onUpdated(); onClose(); // cierra siempre
```

**Fix:** Verificar `res.ok` antes de `onUpdated(); onClose()`.

---

### BUG 90 — `togglePublicado()` sin `res.ok` — UI diverge de BD (9.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `togglePublicado` líneas 897-911

```ts
await fetch(...);
setPublicado(!publicado); // siempre
```

**Fix:** Verificar `res.ok` antes de actualizar el estado UI.

---

### BUG 86 — Tres funciones de movimiento sin `res.ok` (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `moverPostPeriodo`, `moverPostAFecha`, `intercambiarFechas`

Las tres funciones ejecutan `fetch PUT` y luego actualizan el estado local sin verificar si el servidor respondió OK.

**Fix para `moverPostPeriodo`:**
```ts
const res = await fetch(`...`, { method: "PUT", ... });
if (!res.ok) { alert("No se pudo mover la publicación."); loadData(); return; }
setWeekOffset(w => w + dir);
```

---

### BUG 87 — Input de fecha activo mientras el `moving` está en curso (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — línea 929

**Fix de 1 atributo:** `<input type="date" disabled={moving} ...>`

---

### BUG 84 — `StoryboardEditor` y `GuiaTecnicaEditor` sin `onSaved()` tras guardar (11.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

Los editores hacen PUT pero no llaman ningún callback para refrescar `selectedPost` en el padre.

**Fix:** Exponer `onSaved?: () => void` en ambos editores y llamarlo tras el PUT exitoso.

---

### BUG 85 — `key={i}` en beats de montaje → reorders causan pérdidas de foco (11.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `GuiaTecnicaEditor`

**Fix:** Generar `_key` estable por beat (ej. `beat-${i}-${Date.now()}` al inicializar).

---

### BUG 80 — Botón × del último cuadro/beat sin `disabled` (14.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

**Fix:** `<button disabled={frames.length === 1} style={{opacity: frames.length === 1 ? 0.35 : 1}}>×</button>`

---

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar (14.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor`, `StoryboardEditor`, `GuiaTecnicaEditor`

**Fix con dirty-check:** `const isDirty = ...` y `if (isDirty && !window.confirm("¿Descartar cambios?")) return;`

---

### BUG 82 — Triple caption divergente sin sincronización (14.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

`version.caption`, `storyboard.propuesta.caption` y `storyboard.guia_tecnica.caption` se editan por separado.

**Fix recomendado:** Al guardar desde `PropuestaEditor`, propagar `caption` también a `storyboard.guia_tecnica.caption`.

---

### BUG 83 — Cuadros con solo `tipo` se filtran silenciosamente al guardar (14.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `StoryboardEditor`

```ts
frames: frames.filter((f) => f.tc || f.overlay || f.escena || f.dice), // descarta cuadros con solo tipo
```

**Fix:** `|| f.tipo !== "normal"` al final del filter.

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (31.º día)
**Archivo:** `src/lib/google-drive.ts` líneas 23 y 69

**Fix:** `signal: AbortSignal.timeout(15_000)` en el token refresh; `signal: AbortSignal.timeout(120_000)` en la subida.

---

### BUG 60 — `fetch(version.video_url)` sin timeout (30.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 97

**Fix:** `const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });`

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (29.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 85-86 y `src/lib/assistant/tools.ts` línea 44

`system-prompt.ts` línea 85 dice `"Estado de Mexico"` y `"Hibrido"` (sin acentos), pero `vacantes/page.tsx` valida contra `["Estado de México", "Híbrido"]`.

**Fix en `system-prompt.ts` línea 85:**
```
- /vacantes?ubicacion=CDMX (valores: CDMX, Estado de México, Híbrido, Remoto)
```

---

### BUG 76 — Input de Kyo sin `maxLength` — riesgo de costos de tokens (16.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 170

**Fix:** `<input maxLength={600} ...>` y validación en `route.ts` para mensajes > 2000 chars.

---

### BUG 77 — Sin focus trap en ChatWidget — usuarios de teclado escapan del widget (16.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 112

**Fix:** `useEffect` con trap de teclado sobre los elementos focuseables del panel.

---

### BUG 72 — AplicarModal no cierra con tecla Escape (17.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx`

**Fix:** `useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [open]);`

---

### BUG 73 — Acentos faltantes en `UBICACION_OPTIONS` de AplicarModal (17.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 23-26

```
"CDMX — maximo 1 hora de traslado"    → "CDMX — máximo 1 hora de traslado"
"Estado de Mexico"                      → "Estado de México"
"Disponible para reubicacion"           → "Disponible para reubicación"
```

---

### BUG 74 — "Si, todo en orden" sin acento (17.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 30

`"Si, todo en orden"` → `"Sí, todo en orden"`

---

### BUG 75 — AplicarModal fetch sin timeout — candidato bloqueado en "Enviando..." (17.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 50

**Fix:** `AbortController` con `setTimeout(30_000)` y mensaje de error en `"timeout"`.

---

### BUG 69 — "aqui" sin acento en DOS archivos (18.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 20 y `src/lib/assistant/system-prompt.ts` línea 16

---

### BUG 70 — Error de red muestra string técnico al usuario (18.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 129-131

**Fix:**
```ts
} catch (err) {
  const isNetwork = err instanceof TypeError && err.message.includes("fetch");
  setError(isNetwork ? "No se pudo conectar. Verifica tu internet e intenta de nuevo." : ...);
}
```

---

### BUG 71 — Widget de Kyo no cierra con tecla Escape (18.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx`

**Fix:** `useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [open]);`

---

### BUG 68 — Hero muestra datos inconsistentes con knowledge base (19.º día)
**Archivos:** `src/components/sections/Hero.tsx` líneas 107, 157, 176; `src/lib/assistant/knowledge.ts` líneas 75-79

Float card (línea 157): `10+` años — knowledge.ts dice `"3+"`. Ambas instancias de candidatos (líneas 107 y 176) dicen `7000+` — knowledge.ts dice `"687+"`.

**Fix en `Hero.tsx`:** Cambiar a `687+` candidatos y `3+` años de experiencia.

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (19.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 81

`placeholder="¿Qué puesto buscas?"`

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (28.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 5

`import Image from "next/image"` — CLAUDE.md prohíbe `next/image`; usar `<img>` nativo.

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (28.º día)
**Archivo:** `src/app/vacantes/page.tsx` línea 29

**Fix dinámico:** Leer empresas únicas de Supabase con `supabase.from("vacantes").select("empresa").eq("activa", true)`.

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (42.º día sin fix)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210, 227

Fix unificado con BUG 65 (ver arriba).

---

### BUG 44 — Inconsistencia usted/tú en system prompt (36.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero el manejo de otros temas tutea: `"te conecto"`, `"¿te ayudo"`. Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (42.º día)
**Archivo:** `src/app/vacantes/page.tsx` líneas 32 y 42

`"Mas de $20k"` → `"Más de $20k"` (en label y en el `case`).

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (42.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 y 148-153

Kyo puede decir "salario $12,000" sin aclarar si es neto o bruto. Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()`.

---

### BUG 48 — Sin ARIA live region en el chat widget (42.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (42.º día)
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

Cambiar fallback `"MXN bruto"` a `"mensual"`.

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (42.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 99 y `src/app/api/assistant/chat/route.ts` línea 131

Con más de 20 mensajes se puede perder el nombre, puesto, experiencia, zona y jornada del candidato.

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (31.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58

El regex no hace match si hay query params o CDN personalizado.

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (31.º día)
**Archivo:** `src/components/social/StoryboardView.tsx` línea 63

Cuando `storyboard.archivado` está presente, el admin ve un storyboard vacío.

---

### BUG 16 — Memory leak en `rateLimitMap` (42.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir purga de entradas expiradas en `checkRateLimit()`.

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (42.º día)
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Las vacantes de Supabase con IDs distintos no se prerenderizan. Eliminar `generateStaticParams()` completamente.

---

### BUG 94 — Guía de uso no menciona la pestaña "🎬 Proyectos" (2.º día)
**Archivo:** `src/app/revisor/page.tsx` línea 598 — `GUIA_PASOS`

`GUIA_PASOS` tiene 8 pasos pero ninguno menciona la nueva pestaña "🎬 Proyectos". Un revisor nuevo completa el tour sin saber que el Centro de Proyectos existe.

**Fix — añadir paso a `GUIA_PASOS` (antes del paso final):**
```ts
{
  emoji: "🎬",
  titulo: "Centro de Proyectos",
  texto: "En la pestaña «Proyectos» revisas videos o guiones escena por escena. Aprobar una etapa desbloquea la siguiente.",
  selector: null,
},
```

---

### BUG 95 — Tour `showGuia` / `showNovedad` ignora la pestaña activa → coach marks apuntan a elementos no visibles (2.º día)
**Archivo:** `src/app/revisor/page.tsx` líneas 936-948

El tour y la novedad de filtros pueden dispararse cuando el usuario está en la pestaña "Proyectos" o "Análisis", donde los `querySelector` devuelven `null` y los coach marks aparecen centrados sin spotlight.

**Fix:**
```ts
{showGuia && seccion === "publicaciones" && <GuiaUso ... />}
{showNovedad && seccion === "publicaciones" && <NovedadFiltros ... />}
```

---

### BUG 96 — `loadPosts()` hace 4 fetches completos al cambiar de semana — config y `todosRes` se recalculan innecesariamente (2.º día)
**Archivo:** `src/app/revisor/page.tsx` líneas 957-984

Cada vez que el usuario toca las flechas `‹ ›` para cambiar de periodo, se descargan la config de página (inmutable) y todos los posts sin filtro de fechas (datos completos de la BD).

**Fix — separar carga inicial de recarga de periodo** (detalles en reporte anterior del 2026-07-22).

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

- **Proyectos: badge de urgencia en tarjeta** — `ProyectosCliente.tsx` línea 685. Las tarjetas de proyecto no tienen indicador de "🔴 Requiere tu revisión" cuando hay bloques con cambios o pendientes. El usuario tiene que entrar a cada proyecto para saberlo. Añadir badge basado en el progreso de las etapas.

- **Proyectos: hover state en tarjetas** — `ProyectosCliente.tsx` línea 690. Las tarjetas de proyecto usan un `<button>` sin estilos `onMouseEnter`/`onMouseLeave`, mientras las tarjetas de publicaciones sí tienen la elevación. Inconsistencia en la interactividad percibida. Añadir `onMouseEnter`/`onMouseLeave` con `transform: "translateY(-2px)"` y `boxShadow`.

### Media prioridad

- **Avisar al candidato que puede seguir hablando con Kyo tras la navegación** — En Paso 5 de `system-prompt.ts` añadir: `"Le abro las vacantes en pantalla. Podemos seguir hablando aquí si tiene dudas."` Y en `useChat.ts` línea 127: incrementar el delay de navegación de 700ms a 1400ms.

- **Confirmación visual al aprobar en `/revisor`** — Toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120 s. Añadir spinner y deshabilitar botón durante la operación.

- **Timeout en fetch del chat** — `src/components/assistant/useChat.ts` línea 95. Añadir `AbortController` con 30 s.

- **Notificación al cliente al publicar video TikTok** — Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos.

- **`enterKeyHint="send"` en input de Kyo** — `ChatWidget.tsx` línea 170. En teclados virtuales de iOS/Android muestra "enviar".

- **Proyectos: `role="tabpanel"` faltante en el área de contenido de etapas** — `ProyectosCliente.tsx` línea 576. El `<section>` que muestra los bloques de la etapa no tiene `role="tabpanel"` ni `aria-labelledby`, reduciendo el contexto para lectores de pantalla.

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

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 (2-3 vacantes con justificación + `navigate_to`) puede acercarse al límite. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` con poco margen** — Línea 85. Paso 5 óptimo = `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Solo 1 de margen. Subir a 8.

- **`getStoredInstrucciones()` usa anon key** — Si RLS de `kyo_config` se endurece, falla silenciosamente. Usar `sbAdmin` (service role).

- **Cursos y FAQs de Supabase no llegan a Kyo** — BUG 99 y BUG 100 arriba. El admin puede agregar cursos y FAQs desde el panel, pero Kyo siempre responde con los datos hardcodeados del código. Impacto directo en la utilidad del asistente.

---

## Oportunidades de mejora general

- **Variables `GOOGLE_*` pendientes en el VPS** — El botón "🗄️ Liberar espacio" devuelve 503 en producción porque `driveConfigurado()` devuelve `false`. Añadir las 4 vars al `ecosystem.config.js` del VPS es un deploy de 5 minutos sin código nuevo.

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante específica. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts`.

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header del widget (`"Paso 2 de 5"`) reduce abandonos.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — 5 s mirando "Sin resultados" + bubble proactivo de Kyo. Implementar con `useEffect` + `setTimeout(5000)`, una vez por sesión.

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Revisar todos los demás endpoints admin.

- **Sistema de prompts dinámico para Kyo** — `chat/route.ts` ya cachea `instrucciones` 60 s. El mismo patrón debería aplicarse para `kyo_faqs` (BUG 100) y eventualmente para vacantes/cursos de Supabase (BUG 1 y BUG 99). Implementar un `KyoDynamicContext` que se refresque periódicamente.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto | Días |
|---|-----------|----------|---------|------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 42 |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 31 |
| 3 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 42 |
| 4 | BUG 98 — SMTP from con template string en proyectos → error 501 IONOS | Bajo (1 línea) | Crítico | 2 |
| 5 | BUG 99 — Cursos de Supabase no llegan a Kyo | Alto | Alto | 1 |
| 6 | BUG 100 — kyo_faqs de Supabase no alimentan a Kyo | Bajo (30 min) | Alto | 1 |
| 7 | BUG 92 — aprobarPendientes() secuencial sin rollback | Bajo (15 min) | Alto | 2 |
| 8 | BUG 91 — INITIAL_GREETING desincronizado del system prompt | Bajo (10 min) | Alto | 4 |
| 9 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 14 |
| 10 | BUG 89 — deletePost() sin res.ok | Bajo (10 min) | Alto | 9 |
| 11 | BUG 90 — togglePublicado() sin res.ok | Bajo (10 min) | Alto | 9 |
| 12 | BUG 86 — moverPost* sin res.ok (3 funciones) | Bajo (15 min) | Alto | 10 |
| 13 | BUG 93 — onMouseDown para cerrar modal proyectos | Bajo (2 líneas) | Medio | 2 |
| 14 | BUG 97 — "Aprobar todas" sin confirmación | Bajo (10 min) | Alto | 2 |
| 15 | BUG 101 — DetalleProyecto sin botón Reintentar | Bajo (10 min) | Medio | 1 |
| 16 | BUG 94 — Guía de uso sin paso de Proyectos | Bajo (10 min) | Medio | 2 |
| 17 | BUG 95 — Tour/novedad sin guard de sección activa | Bajo (10 min) | Medio | 2 |
| 18 | BUG 96 — 4 fetches redundantes al cambiar periodo | Bajo (20 min) | Medio | 2 |
| 19 | BUG 87 — Input fecha activo mientras moving=true | Bajo (1 atrib) | Bajo | 10 |
| 20 | BUG 84 — StoryboardEditor/GuiaTecnicaEditor sin onSaved() | Bajo (10 min) | Alto | 11 |
| 21 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 14 |
| 22 | BUG 85 — key={i} en beats de montaje | Bajo (10 min) | Alto | 11 |
| 23 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | 14 |
| 24 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | 14 |
| 25 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | 14 |
| 26 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | 14 |
| 27 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 26 |
| 28 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 25 |
| 29 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 28 |
| 30 | BUG 68 — Hero "10+ años / 7000+ colocados" vs knowledge "3+ / 687+" | Bajo (1 min) | Alto | 19 |
| 31 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 28 |
| 32 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 29 |
| 33 | BUG 57 — subirADrive sin timeout | Bajo (5 min) | Alto | 31 |
| 34 | BUG 60 — fetch(video_url) sin timeout | Bajo (1 línea) | Alto | 30 |
| 35 | Variables GOOGLE_* en VPS (no es código) | Bajo (5 min) | Alto | 32 |
| 36 | BUG 67 — Placeholder Hero sin acento "¿Que puesto?" | Bajo (1 char) | Alto | 19 |
| 37 | BUG 53 / BUG 73 / BUG 74 — Acentos en AplicarModal | Bajo (5 min) | Alto | 42/17/17 |
| 38 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 42 |
| 39 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 18 |
| 40 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 18 |
| 41 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 17 |
| 42 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 17 |
| 43 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 16 |
| 44 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 16 |
| 45 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 18 |
| 46 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 36 |
| 47 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 42 |
| 48 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 42 |
| 49 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 31 |
| 50 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 51 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 42 |
| 52 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 31 |
| 53 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 42 |
| 54 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 42 |
| 55 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 56 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 57 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 58 | Proyectos: badge urgencia en tarjeta | Bajo (CSS) | Medio | — |
| 59 | Proyectos: hover state en tarjetas | Bajo (CSS) | Bajo | — |
| 60 | Proyectos: role="tabpanel" faltante | Bajo (1 atrib) | Bajo | — |
| 61 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 62 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 63 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 64 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 65 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 66 | Tool register_talent_interest | Medio | Alto | — |
| 67 | PageHero vacantes con imagen Unsplash externa | Bajo (5 min) | Bajo | — |
| 68 | Tour novedad solo en pestaña Publicaciones | Bajo (1 línea) | Medio | — |
| 69 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 42 |
| 70 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 42 |
| 71 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 72 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 73 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
| 74 | Sistema de prompts dinámico para Kyo (faqs+cursos+vacantes) | Alto | Alto | — |
