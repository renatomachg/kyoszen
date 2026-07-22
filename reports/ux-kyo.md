# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-22
**Cambios analizados:** Commit `d8c456f` — Centro de Proyectos (aprobación por escena guion→arte→video). Archivos revisados: `src/app/revisor/page.tsx`, `src/components/revisor/ProyectosCliente.tsx`, `src/app/api/revisor/proyectos/route.ts`, `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/status/route.ts`, `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`.

---

## Cambios Recientes Detectados

**Commit `d8c456f` — Centro de Proyectos (2026-07-21):** nuevo módulo de aprobación de contenido por escena (guion→arte→video). Agrega pestaña "🎬 Proyectos" en `/revisor`, componente `ProyectosCliente.tsx` con gating de etapas, modal `DetalleProyecto` con tabs por etapa y botón "Aprobar todas las pendientes", 4 API routes en `/api/revisor/proyectos/` y `/api/admin/proyectos/`. El análisis de este commit detectó 7 bugs nuevos (BUG 92-98) documentados abajo.

**Sin cambios en el asistente Kyo ni en el sitio público.** Los bugs acumulados de las semanas anteriores siguen presentes.

---

## 🔴 BUGS NUEVOS — CENTRO DE PROYECTOS (commit d8c456f)

### BUG 92 — `aprobarPendientes()` secuencial sin atomicidad → estado parcial si falla (1.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 485-498

```ts
for (const bloque of pendientes) {        // secuencial
  setAccionId(bloque.id);
  await patchEstado(bloque.id, "aprobado"); // si falla aquí a mitad, la etapa queda parcialmente aprobada
}
```

Si la red falla en la escena #3 de 8, las primeras 2 quedan aprobadas pero el rollup de la etapa no se completa. El cliente no recibe error claro; el `recargarTodo()` en el `catch` carga el estado inconsistente.

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

### BUG 93 — Modal de proyectos usa `onMouseDown` para cerrar → cierra al arrastrar texto (1.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` líneas 506-511

```tsx
<div onMouseDown={onClose} ...>      {/* overlay */}
  <div onMouseDown={e => e.stopPropagation()} ...>  {/* modal */}
```

Si el revisor selecciona texto del guion arrastrando el mouse hasta afuera del modal, el `mousedown` en el overlay dispara `onClose` y el modal se cierra perdiendo el contexto. Patrón correcto: `onClick` en el overlay, `onClick stopPropagation` en el modal.

**Fix de 2 líneas:**
```tsx
<div onClick={onClose} ...>
  <div onClick={e => e.stopPropagation()} ...>
```

---

### BUG 94 — Guía de uso no menciona la pestaña "🎬 Proyectos" (1.er día)
**Archivo:** `src/app/revisor/page.tsx` línea 598 — `GUIA_PASOS`

`GUIA_PASOS` tiene 8 pasos pero ninguno menciona la nueva pestaña "🎬 Proyectos". Un revisor nuevo completa el tour sin saber que el Centro de Proyectos existe. La guía se considera vista en `localStorage` y no se vuelve a mostrar.

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

### BUG 95 — Tour `showGuia` / `showNovedad` ignora la pestaña activa → coach marks apuntan a elementos no visibles (1.er día)
**Archivo:** `src/app/revisor/page.tsx` líneas 936-948

El tour de guía (`GuiaUso`) y la novedad de filtros (`NovedadFiltros`) pueden dispararse cuando el usuario está en la pestaña "Proyectos" o "Análisis". Los pasos con `requiereModal: true` intentan abrir una publicación de ejemplo — pero si `posts` está vacío (sin publicaciones en esa semana) o el usuario está en otra pestaña, los `querySelector` devuelven `null` y el coach mark aparece centrado sin spotlight.

**Fix — añadir guard de sección antes de mostrar los tours:**
```ts
// En el useEffect de showGuia/showNovedad, solo mostrar si estamos en "publicaciones":
if (!guiaVista) {
  // Diferir hasta que el usuario esté en publicaciones
  setShowGuia(true);
  ...
}
// Y en el JSX:
{showGuia && seccion === "publicaciones" && <GuiaUso ... />}
{showNovedad && seccion === "publicaciones" && <NovedadFiltros ... />}
```

---

### BUG 96 — `loadPosts()` hace 4 fetches completos al cambiar de semana — config y `todosRes` se recalculan innecesariamente (1.er día)
**Archivo:** `src/app/revisor/page.tsx` líneas 957-984

Cada vez que el usuario toca las flechas `‹ ›` para cambiar de periodo, `loadPosts` hace 4 requests:
1. Posts del periodo (cambia ✓)
2. Config de página (nunca cambia durante la sesión ✗)
3. Stats del mes (solo cambia el 1.º de mes ✗)
4. Todos los posts sin fechas (cambia solo si se añadieron nuevos ✗)

Requests 2 y 4 son especialmente costosos en datos. El request 4 descarga toda la BD de publicaciones en cada flecha.

**Fix — separar carga inicial de recarga de periodo:**
```ts
// Una sola vez al montar:
useEffect(() => {
  if (!user) return;
  Promise.all([
    fetch("/api/admin/social/config").then(r => r.json()),
    fetch("/api/revisor/posts").then(r => r.json()),
  ]).then(([configData, todosData]) => {
    // setConfig, setPostsTodos
  });
}, [user]);

// Al cambiar periodo (solo posts del rango + stats del mes):
const loadPosts = useCallback(async () => {
  // solo 2 requests: periodo + mes
}, [desde, hasta]);
```

---

### BUG 97 — "Aprobar todas las pendientes" sin confirmación → aprobación masiva accidental (1.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx` línea 586

```tsx
<Boton onClick={() => void aprobarPendientes()} disabled={aprobandoTodas || accionId !== null}>
  ✅ {aprobandoTodas ? "Aprobando…" : "Aprobar todas las pendientes"}
</Boton>
```

Un clic accidental aprueba todas las escenas pendientes de la etapa en bloque sin posibilidad de cancelar. En una etapa de Guion con 8 escenas, esto puede disparar el desbloqueo de Arte y el correo al admin antes de que el revisor haya leído todos los guiones.

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

### BUG 98 — SMTP `from` con string template en proyectos → error 501 en IONOS (1.er día)
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

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (acumulados)

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (41.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt (línea 138 de `system-prompt.ts`) construye el listado desde `knowledge.listJobs()` — si Supabase tiene vacantes distintas, Kyo da al candidato información errónea.

La interfaz `KnowledgeProvider` ya está preparada para el reemplazo. `vacantes/page.tsx` ya lee de Supabase directamente — Kyo es el único componente que sigue usando los datos demo.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. Registrar en línea 167 en lugar del provider estático.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (41.º día — LFPDPPP)
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

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (30.º día sin fix)
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

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (25.º día)
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

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs de conversaciones (24.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-144

`reset()` elimina `localStorage` pero NO `sessionStorage`. La siguiente conversación reutiliza el mismo `session_id` y el upsert sobreescribe el log anterior.

**Fix de 1 línea:**
```ts
localStorage.removeItem(STORAGE_KEY);
sessionStorage.removeItem("kyo_session_id"); // ← agregar esta línea
```

---

### BUG 91 — `INITIAL_GREETING` hardcodeado desincronizado del system prompt (3.er día)
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

### BUG 78 — `PropuestaEditor` sin confirmación antes de enviar correo al cliente (13.º día sin fix)
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

### BUG 79 — `PostModal.save()` cierra el modal sin verificar si el fetch falló (13.º día sin fix)
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

### BUG 89 — `deletePost()` sin `res.ok` (8.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `deletePost` líneas 890-895

```ts
await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" });
onUpdated(); onClose(); // cierra siempre
```

**Fix:** Verificar `res.ok` antes de `onUpdated(); onClose()`.

---

### BUG 90 — `togglePublicado()` sin `res.ok` — UI diverge de BD (8.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `togglePublicado` líneas 897-911

```ts
await fetch(...);
setPublicado(!publicado); // siempre
```

**Fix:** Verificar `res.ok` antes de actualizar el estado UI.

---

### BUG 86 — Tres funciones de movimiento sin `res.ok` (9.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `moverPostPeriodo`, `moverPostAFecha`, `intercambiarFechas`

Las tres funciones ejecutan `fetch PUT` y luego actualizan el estado local sin verificar si el servidor respondió OK.

**Fix para `moverPostPeriodo`:**
```ts
const res = await fetch(`...`, { method: "PUT", ... });
if (!res.ok) { alert("No se pudo mover la publicación."); loadData(); return; }
setWeekOffset(w => w + dir);
```

---

### BUG 87 — Input de fecha activo mientras el `moving` está en curso (9.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — línea 929

**Fix de 1 atributo:** `<input type="date" disabled={moving} ...>`

---

### BUG 84 — `StoryboardEditor` y `GuiaTecnicaEditor` sin `onSaved()` tras guardar (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

Los editores hacen PUT pero no llaman ningún callback para refrescar `selectedPost` en el padre.

**Fix:** Exponer `onSaved?: () => void` en ambos editores y llamarlo tras el PUT exitoso.

---

### BUG 85 — `key={i}` en beats de montaje → reorders causan pérdidas de foco (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `GuiaTecnicaEditor`

**Fix:** Generar `_key` estable por beat (ej. `beat-${i}-${Date.now()}` al inicializar).

---

### BUG 80 — Botón × del último cuadro/beat sin `disabled` (13.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

**Fix:** `<button disabled={frames.length === 1} style={{opacity: frames.length === 1 ? 0.35 : 1}}>×</button>`

---

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar (13.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor`, `StoryboardEditor`, `GuiaTecnicaEditor`

**Fix con dirty-check:** `const isDirty = ...` y `if (isDirty && !window.confirm("¿Descartar cambios?")) return;`

---

### BUG 82 — Triple caption divergente sin sincronización (13.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

`version.caption`, `storyboard.propuesta.caption` y `storyboard.guia_tecnica.caption` se editan por separado.

**Fix recomendado:** Al guardar desde `PropuestaEditor`, propagar `caption` también a `storyboard.guia_tecnica.caption`.

---

### BUG 83 — Cuadros con solo `tipo` se filtran silenciosamente al guardar (13.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `StoryboardEditor`

```ts
frames: frames.filter((f) => f.tc || f.overlay || f.escena || f.dice), // descarta cuadros con solo tipo
```

**Fix:** `|| f.tipo !== "normal"` al final del filter.

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (30.º día)
**Archivo:** `src/lib/google-drive.ts` líneas 23 y 69

**Fix:** `signal: AbortSignal.timeout(15_000)` en el token refresh; `signal: AbortSignal.timeout(120_000)` en la subida.

---

### BUG 60 — `fetch(version.video_url)` sin timeout (29.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 97

**Fix:** `const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });`

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (28.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 85-86 y `src/lib/assistant/tools.ts` línea 44

`system-prompt.ts` línea 85 dice `"Estado de Mexico"` y `"Hibrido"` (sin acentos), pero `vacantes/page.tsx` valida contra `["Estado de México", "Híbrido"]`.

**Fix en `system-prompt.ts` línea 85:**
```
- /vacantes?ubicacion=CDMX (valores: CDMX, Estado de México, Híbrido, Remoto)
```

---

### BUG 76 — Input de Kyo sin `maxLength` — riesgo de costos de tokens (15.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 170

**Fix:** `<input maxLength={600} ...>` y validación en `route.ts` para mensajes > 2000 chars.

---

### BUG 77 — Sin focus trap en ChatWidget — usuarios de teclado escapan del widget (15.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 112

**Fix:** `useEffect` con trap de teclado sobre los elementos focuseables del panel.

---

### BUG 72 — AplicarModal no cierra con tecla Escape (16.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx`

**Fix:** `useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [open]);`

---

### BUG 73 — Acentos faltantes en `UBICACION_OPTIONS` de AplicarModal (16.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 23-26

```
"CDMX — maximo 1 hora de traslado"    → "CDMX — máximo 1 hora de traslado"
"Estado de Mexico"                      → "Estado de México"
"Disponible para reubicacion"           → "Disponible para reubicación"
```

---

### BUG 74 — "Si, todo en orden" sin acento (16.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 30

`"Si, todo en orden"` → `"Sí, todo en orden"`

---

### BUG 75 — AplicarModal fetch sin timeout — candidato bloqueado en "Enviando..." (16.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 50

**Fix:** `AbortController` con `setTimeout(30_000)` y mensaje de error en `"timeout"`.

---

### BUG 69 — "aqui" sin acento en DOS archivos (17.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 20 y `src/lib/assistant/system-prompt.ts` línea 16

```ts
"...estoy aquí para orientarte..."
```

---

### BUG 70 — Error de red muestra string técnico al usuario (17.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 129-131

**Fix:**
```ts
} catch (err) {
  const isNetwork = err instanceof TypeError && err.message.includes("fetch");
  setError(isNetwork ? "No se pudo conectar. Verifica tu internet e intenta de nuevo." : ...);
}
```

---

### BUG 71 — Widget de Kyo no cierra con tecla Escape (17.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx`

**Fix:** `useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); }; document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [open]);`

---

### BUG 68 — Hero muestra datos inconsistentes con knowledge base (18.º día)
**Archivos:** `src/components/sections/Hero.tsx` líneas 107, 157, 176; `src/lib/assistant/knowledge.ts` líneas 75-79

Float card (línea 157): `10+` años — knowledge.ts dice `"3+"`. Ambas instancias de candidatos (líneas 107 y 176) dicen `7000+` — knowledge.ts dice `"687+"`.

**Fix en `Hero.tsx`:** Cambiar a `687+` candidatos y `3+` años de experiencia.

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (18.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 81

`placeholder="¿Qué puesto buscas?"`

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (27.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 5

`import Image from "next/image"` — CLAUDE.md prohíbe `next/image`; usar `<img>` nativo.

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (27.º día)
**Archivo:** `src/app/vacantes/page.tsx` línea 29

**Fix dinámico:** Leer empresas únicas de Supabase con `supabase.from("vacantes").select("empresa").eq("activa", true)`.

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (41.º día sin fix)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210, 227

Fix unificado con BUG 65 (ver arriba).

---

### BUG 44 — Inconsistencia usted/tú en system prompt (35.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero el manejo de otros temas tutea: `"te conecto"`, `"¿te ayudo"`. Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (41.º día)
**Archivo:** `src/app/vacantes/page.tsx` líneas 32 y 42

`"Mas de $20k"` → `"Más de $20k"` (en label y en el `case`).

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (41.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 y 148-153

Kyo puede decir "salario $12,000" sin aclarar si es neto o bruto. Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()`.

---

### BUG 48 — Sin ARIA live region en el chat widget (41.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (41.º día)
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

Cambiar fallback `"MXN bruto"` a `"mensual"`.

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (41.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 99 y `src/app/api/assistant/chat/route.ts` línea 131

Con más de 20 mensajes se puede perder el nombre, puesto, experiencia, zona y jornada del candidato.

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (30.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58

El regex no hace match si hay query params o CDN personalizado.

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (30.º día)
**Archivo:** `src/components/social/StoryboardView.tsx` línea 63

Cuando `storyboard.archivado` está presente, el admin ve un storyboard vacío.

---

### BUG 16 — Memory leak en `rateLimitMap` (41.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir purga de entradas expiradas en `checkRateLimit()`.

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (41.º día)
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Las vacantes de Supabase con IDs distintos no se prerenderizan. Eliminar `generateStaticParams()` completamente.

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

- **Proyectos: badge de urgencia en tarjeta** — `ProyectosCliente.tsx` línea 685. Las tarjetas de proyecto no tienen indicador de "🔴 Requiere tu revisión" cuando hay bloques con cambios o pendientes. El usuario tiene que entrar a cada proyecto para saberlo. Añadir badge en la esquina superior derecha de la tarjeta basado en el progreso de las etapas.

### Media prioridad

- **Avisar al candidato que puede seguir hablando con Kyo tras la navegación** — En Paso 5 de `system-prompt.ts` añadir: `"Le abro las vacantes en pantalla. Podemos seguir hablando aquí si tiene dudas."` Y en `useChat.ts` línea 127: incrementar el delay de navegación de 700ms a 1400ms.

- **Confirmación visual al aprobar en `/revisor`** — Toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120 s. Añadir spinner y deshabilitar botón durante la operación.

- **Timeout en fetch del chat** — `src/components/assistant/useChat.ts` línea 95. Añadir `AbortController` con 30 s.

- **Notificación al cliente al publicar video TikTok** — Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos.

- **`enterKeyHint="send"` en input de Kyo** — `ChatWidget.tsx` línea 170. En teclados virtuales de iOS/Android muestra "enviar".

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

---

## Oportunidades de mejora general

- **Variables `GOOGLE_*` pendientes en el VPS** — El botón "🗄️ Liberar espacio" devuelve 503 en producción porque `driveConfigurado()` devuelve `false`. Añadir las 4 vars al `ecosystem.config.js` del VPS es un deploy de 5 minutos sin código nuevo.

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante específica. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts`.

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header del widget (`"Paso 2 de 5"`) reduce abandonos.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — 5 s mirando "Sin resultados" + bubble proactivo de Kyo. Implementar con `useEffect` + `setTimeout(5000)`, una vez por sesión.

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Revisar todos los demás endpoints admin.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto | Días |
|---|-----------|----------|---------|------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 41 |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 30 |
| 3 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 41 |
| 4 | BUG 98 — SMTP from con template string en proyectos → error 501 IONOS | Bajo (1 línea) | Crítico | 1 |
| 5 | BUG 92 — aprobarPendientes() secuencial sin rollback | Bajo (15 min) | Alto | 1 |
| 6 | BUG 91 — INITIAL_GREETING desincronizado del system prompt | Bajo (10 min) | Alto | 3 |
| 7 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 13 |
| 8 | BUG 89 — deletePost() sin res.ok | Bajo (10 min) | Alto | 8 |
| 9 | BUG 90 — togglePublicado() sin res.ok | Bajo (10 min) | Alto | 8 |
| 10 | BUG 86 — moverPost* sin res.ok (3 funciones) | Bajo (15 min) | Alto | 9 |
| 11 | BUG 93 — onMouseDown para cerrar modal proyectos | Bajo (2 líneas) | Medio | 1 |
| 12 | BUG 97 — "Aprobar todas" sin confirmación | Bajo (10 min) | Alto | 1 |
| 13 | BUG 94 — Guía de uso sin paso de Proyectos | Bajo (10 min) | Medio | 1 |
| 14 | BUG 95 — Tour/novedad sin guard de sección activa | Bajo (10 min) | Medio | 1 |
| 15 | BUG 96 — 4 fetches redundantes al cambiar periodo | Bajo (20 min) | Medio | 1 |
| 16 | BUG 87 — Input fecha activo mientras moving=true | Bajo (1 atrib) | Bajo | 9 |
| 17 | BUG 84 — StoryboardEditor/GuiaTecnicaEditor sin onSaved() | Bajo (10 min) | Alto | 10 |
| 18 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 13 |
| 19 | BUG 85 — key={i} en beats de montaje | Bajo (10 min) | Alto | 10 |
| 20 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | 13 |
| 21 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | 13 |
| 22 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | 13 |
| 23 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | 13 |
| 24 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 25 |
| 25 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 24 |
| 26 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 27 |
| 27 | BUG 68 — Hero "10+ años / 7000+ colocados" vs knowledge "3+ / 687+" | Bajo (1 min) | Alto | 18 |
| 28 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 27 |
| 29 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 28 |
| 30 | BUG 57 — subirADrive sin timeout | Bajo (5 min) | Alto | 30 |
| 31 | BUG 60 — fetch(video_url) sin timeout | Bajo (1 línea) | Alto | 29 |
| 32 | Variables GOOGLE_* en VPS (no es código) | Bajo (5 min) | Alto | 31 |
| 33 | BUG 67 — Placeholder Hero sin acento "¿Que puesto?" | Bajo (1 char) | Alto | 18 |
| 34 | BUG 53 / BUG 73 / BUG 74 — Acentos en AplicarModal | Bajo (5 min) | Alto | 41/16/16 |
| 35 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 41 |
| 36 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 17 |
| 37 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 17 |
| 38 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 16 |
| 39 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 16 |
| 40 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 15 |
| 41 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 15 |
| 42 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 17 |
| 43 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 35 |
| 44 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 41 |
| 45 | "Nueva conversacion" sin acento en ChatWidget | Bajo (1 min) | Medio | — |
| 46 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 41 |
| 47 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 30 |
| 48 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 49 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 41 |
| 50 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 30 |
| 51 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 41 |
| 52 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 41 |
| 53 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 54 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 55 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 56 | Proyectos: badge urgencia en tarjeta | Bajo (CSS) | Medio | — |
| 57 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 58 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 59 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 60 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 61 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 62 | Tool register_talent_interest | Medio | Alto | — |
| 63 | PageHero vacantes con imagen Unsplash externa | Bajo (5 min) | Bajo | — |
| 64 | Tour novedad solo en pestaña Publicaciones | Bajo (1 línea) | Medio | — |
| 65 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 41 |
| 66 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 41 |
| 67 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 68 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 69 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
