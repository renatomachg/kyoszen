# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-19
**Cambios analizados:** Sin commits de código nuevos en los últimos 2 días. Último cambio relevante: `src/app/admin/(panel)/redes-sociales/page.tsx` (commit b0bc7b7, 2026-07-13). Archivos del asistente revisados: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/useChat.ts`, `src/components/assistant/ChatWidget.tsx`.

---

## Cambios Recientes Detectados

**Sin commits de código nuevos.** Los últimos 3 commits son solo actualizaciones de `reports/ux-kyo.md` y `reports/salud-sitio.md`. El último cambio de código fue el commit b0bc7b7 (2026-07-13): botón "📅 Mover a otra fecha" en el modal de detalle del admin. **Todos los bugs acumulados siguen sin corregirse** — los contadores de días continúan incrementando.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (38.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt (línea 138 de `system-prompt.ts`) construye el listado desde `knowledge.listJobs()` — si Supabase tiene vacantes distintas a las del archivo, Kyo da al candidato información errónea sobre disponibilidad real.

La interfaz `KnowledgeProvider` (línea 42 de `knowledge.ts`) ya está preparada para el reemplazo. `vacantes/page.tsx` ya lee de Supabase directamente — Kyo es el único componente que sigue usando los datos demo.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. Registrar en línea 167 en lugar del provider estático.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (38.º día — LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```
**Confirmado presente** al revisar el archivo hoy (línea 81). El nombre del candidato que escribe en el Paso 0, y cualquier dato personal que mencione, queda textual en `site_eventos.valor` (hasta 300 caracteres). Riesgo legal LFPDPPP.

**Fix de 1 línea:**
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (27.º día sin fix)
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

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (22.º día)
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

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs de conversaciones (21.º día)
**Archivos:** `src/components/assistant/useChat.ts` líneas 139-144

**Confirmado presente** al revisar el archivo hoy: `reset()` (línea 143) elimina `localStorage` pero NO `sessionStorage`. La siguiente conversación reutiliza el mismo `session_id` y el upsert en `kyo_conversaciones` sobreescribe el log anterior.

**Fix de 1 línea en `useChat.ts` línea 143:**
```ts
localStorage.removeItem(STORAGE_KEY);
sessionStorage.removeItem("kyo_session_id"); // ← agregar esta línea
```

---

### BUG 78 — PropuestaEditor sin confirmación antes de enviar correo al cliente (10.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor` aprox. línea 379

El botón `"📨 Guardar y avisar al cliente"` llama directamente a `guardar(true)` → `POST /api/admin/social/posts/[id]/versions` → crea nueva versión y envía correo a todos los `social_reviewers` activos (Rosy y Monse). Sin diálogo de confirmación. Un clic accidental notifica innecesariamente a las clientes.

**Fix:**
```ts
<button onClick={() => {
  if (!window.confirm("¿Guardar cambios y enviar correo de actualización a las revisoras ahora?")) return;
  guardar(true);
}} disabled={!!saving} ...>
```

---

### BUG 79 — `PostModal.save()` cierra el modal sin verificar si el fetch falló (10.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `save()` en `PostModal` (aprox. línea 176)

```ts
const save = async () => {
  ...
  await fetch("/api/admin/social/posts", { ... }); // si falla, no se detecta
  setSaving(false);
  onSaved(); // ← se llama siempre, con éxito o fallo
  onClose(); // ← el modal cierra y el usuario pierde el contenido sin aviso
};
```

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

### BUG 89 — `deletePost()` sin verificación de error — el modal cierra aunque el DELETE haya fallado (5.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `deletePost` líneas 890-895

```ts
const deletePost = async () => {
  if (!confirm("¿Eliminar esta publicación y todo su historial?")) return;
  await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" }); // sin res.ok
  onUpdated();
  onClose(); // cierra siempre, sin importar si el DELETE falló
};
```

**Confirmado presente** al revisar el archivo hoy (líneas 890-895). Si el DELETE falla, el admin ve el modal cerrar y la publicación sigue en el calendario sin mensaje de error.

**Fix:**
```ts
const res = await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" });
if (!res.ok) {
  const err = await res.json().catch(() => ({}));
  alert(`No se pudo eliminar: ${err.error ?? res.status}`);
  return;
}
onUpdated();
onClose();
```

---

### BUG 90 — `togglePublicado()` sin `res.ok` — estado UI diverge de la BD si el PATCH falla (5.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `togglePublicado` líneas 897-911

```ts
await fetch(`/api/admin/social/posts/${post.id}`, { method: "PATCH", body: JSON.stringify({ publicado: !publicado }) });
setPublicado(!publicado); // ← se actualiza el estado UI siempre, con o sin éxito
```

**Confirmado presente** al revisar el archivo hoy (líneas 903-908). Si el PATCH falla, el botón muestra "● Visible para el cliente" pero en la BD el post sigue siendo borrador.

**Fix:**
```ts
const res = await fetch(`/api/admin/social/posts/${post.id}`, { method: "PATCH", ... });
if (!res.ok) {
  alert("No se pudo cambiar el estado de publicación. Intenta de nuevo.");
  setTogglingPub(false);
  return;
}
setPublicado(!publicado);
```

---

### BUG 86 — Tres funciones de movimiento sin `res.ok` — calendario avanza aunque el PUT haya fallado (6.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — funciones `moverPostPeriodo`, `moverPostAFecha` e `intercambiarFechas`

**Confirmado presente** al revisar el archivo hoy. Las tres funciones ejecutan `fetch PUT` y luego actualizan el estado local o navegan al siguiente periodo sin verificar si el servidor respondió OK.

- `moverPostPeriodo` (línea 1309): `await fetch(...)` sin `res.ok` → `setWeekOffset` avanza de todas formas.
- `moverPostAFecha` (línea 1268): `await fetch(...)` sin `res.ok` → `loadData()` se llama siempre.
- `intercambiarFechas` (línea 1284): `Promise.all([fetch, fetch])` sin `res.ok` en ninguno → actualización optimista sin rollback.

**Fix para `moverPostPeriodo`:**
```ts
const res = await fetch(`/api/admin/social/posts/${postId}/versions`, { method: "PUT", ... });
if (!res.ok) {
  alert("No se pudo mover la publicación. Intenta de nuevo.");
  loadData();
  return;
}
setWeekOffset((w) => w + dir);
```

**Fix para `intercambiarFechas`:**
```ts
const [ra, rb] = await Promise.allSettled([
  fetch(`.../${aId}/versions`, { method: "PUT", body: JSON.stringify({ fecha_programada: fb }) }),
  fetch(`.../${bId}/versions`, { method: "PUT", body: JSON.stringify({ fecha_programada: fa }) }),
]);
if (ra.status === "rejected" || rb.status === "rejected" ||
    (ra.value && !ra.value.ok) || (rb.value && !rb.value.ok)) {
  setPosts((prev) => prev.map((x) => (x.id === aId ? { ...x, fecha_programada: fa } : x.id === bId ? { ...x, fecha_programada: fb } : x)));
  alert("No se pudo intercambiar las fechas. Intenta de nuevo.");
}
loadData();
```

---

### BUG 87 — Input de fecha activo mientras el move está en curso (6.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PostDetail` línea 929

**Confirmado presente:** el `<input type="date">` (línea 929) no tiene `disabled={moving}`. El botón "✓ Mover" sí se deshabilita, pero el campo de fecha sigue activo durante el guardado.

**Fix de 1 atributo:**
```tsx
<input type="date" value={moveDate} min={hoyIsoDetail}
  disabled={moving}
  onChange={(e) => setMoveDate(e.target.value)}
  style={{ ..., opacity: moving ? 0.5 : 1 }} />
```

---

### BUG 84 — `StoryboardEditor` y `GuiaTecnicaEditor` sin `onSaved()` tras guardar exitoso (7.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — editores del commit 214e127

Los dos editores hacen PUT pero no llaman a ningún callback para refrescar `selectedPost` en el componente padre. El admin guarda el storyboard, el `PUT` responde 200, pero el panel sigue mostrando los datos previos hasta que cierra y reabre el modal.

**Fix:** Exponer un prop `onSaved?: () => void` en ambos editores y llamarlo tras el `PUT` exitoso, igual que `PropuestaEditor`.

---

### BUG 85 — `GuiaTecnicaEditor`: tabla de montaje con `key={i}` — reorders causan pérdidas de foco (7.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `GuiaTecnicaEditor`

Los beats de montaje se renderizan con `key={i}` (índice). Al eliminar un beat intermedio, React reutiliza los nodos del DOM y los `<input>` adyacentes pierden su valor o desplazan el cursor.

**Fix:**
```ts
const [montaje, setMontaje] = useState(
  (gt?.montaje ?? []).map((b, i) => ({ ...b, _key: `beat-${i}-${Date.now()}` }))
);
// En el render: key={beat._key}
```

---

### BUG 80 — Botón × del último cuadro/beat no se deshabilita → clic sin efecto visible (10.º día)
**Archivos:** `src/app/admin/(panel)/redes-sociales/page.tsx`

Cuando solo queda un cuadro (o beat), el botón × no hace nada pero sigue visualmente activo. El admin hace clic repetidamente pensando que algo falló.

**Fix en ambos componentes:**
```tsx
<button
  onClick={() => setFrames(frames.length > 1 ? frames.filter((_, j) => j !== i) : frames)}
  disabled={frames.length === 1}
  style={{ ..., opacity: frames.length === 1 ? 0.35 : 1, cursor: frames.length === 1 ? "default" : "pointer" }}
>×</button>
```

---

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor` (l. 384), `StoryboardEditor` (l. 490), `GuiaTecnicaEditor` (l. 592)

Los tres editores tienen botón "Cancelar" sin verificar cambios sin guardar.

**Fix con dirty-check ligero:**
```ts
const isDirty = audiencia !== sbActual.audiencia || duracion !== sbActual.duracion || frames.length !== (sbActual.frames?.length ?? 1);

const handleCancel = () => {
  if (isDirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
  onCancel();
};
```

---

### BUG 82 — Triple caption divergente sin sincronización entre versiones (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

Un mismo TikTok puede tener tres captions independientes en `version.caption`, `storyboard.propuesta.caption` y `storyboard.guia_tecnica.caption`. Los editores los actualizan por separado sin advertencia cuando divergen.

**Fix recomendado:** Al guardar desde `PropuestaEditor` con `avisar=false`, propagar `caption` también a `storyboard.guia_tecnica.caption`. Agregar nota bajo el campo caption de la Guía técnica: `"Referencia — actualiza también en Propuesta si cambia."`

---

### BUG 83 — Cuadros con solo `tipo` seleccionado se filtran silenciosamente al guardar (10.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `StoryboardEditor`

```ts
frames: frames.filter((f) => f.tc || f.overlay || f.escena || f.dice),
```

Un cuadro con tipo seleccionado pero sin otros campos se descarta silenciosamente.

**Fix:**
```ts
frames: frames.filter((f) => f.tc || f.overlay || f.escena || f.dice || f.tipo !== "normal"),
```

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (27.º día)
**Archivo:** `src/lib/google-drive.ts` líneas 23 y 69

**Fix:**
```ts
const r = await fetch("https://oauth2.googleapis.com/token", {
  ..., signal: AbortSignal.timeout(15_000),
});
const up = await fetch("https://www.googleapis.com/upload/...", {
  ..., signal: AbortSignal.timeout(120_000),
});
```

---

### BUG 60 — `fetch(version.video_url)` sin timeout (26.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 97

```ts
const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });
```

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (25.º día)
**Archivos:** `src/lib/assistant/system-prompt.ts` líneas 85-86 y `src/lib/assistant/tools.ts` línea 44

El system prompt usa `"Estado de Mexico"` y `"Hibrido"`, pero `vacantes/page.tsx` valida contra `["Estado de México", "Híbrido"]` (verificado hoy: línea 28 de `vacantes/page.tsx` tiene los acentos correctos). Kyo genera URLs con acentos incorrectos que los filtros del frontend no reconocen.

**Fix en `system-prompt.ts` línea 85:**
```
- /vacantes?ubicacion=CDMX (valores: CDMX, Estado de México, Híbrido, Remoto)
```

---

### BUG 76 — Input de Kyo sin `maxLength` — riesgo de costos de tokens (12.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 170

**Confirmado presente** al revisar el archivo hoy: el `<input>` en línea 170 no tiene `maxLength`.

**Fix:**
```tsx
<input maxLength={600} ... />
```
```ts
// route.ts:
const tooLong = history.some(m => m.content.length > 2000);
if (tooLong) return NextResponse.json({ error: "Mensaje demasiado largo." }, { status: 400 });
```

---

### BUG 77 — Sin focus trap en ChatWidget — usuarios de teclado escapan del widget (12.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 112

**Fix:**
```ts
useEffect(() => {
  if (!open) return;
  const panel = document.querySelector("[data-kyo-panel]") as HTMLElement;
  if (!panel) return;
  const focusable = panel.querySelectorAll<HTMLElement>('button, input, a[href]');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const trap = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
      e.preventDefault();
      (e.shiftKey ? last : first).focus();
    }
  };
  document.addEventListener("keydown", trap);
  first?.focus();
  return () => document.removeEventListener("keydown", trap);
}, [open]);
```
Añadir `data-kyo-panel` al `<motion.div>` del panel (línea 115).

---

### BUG 72 — AplicarModal no cierra con tecla Escape (13.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx`

**Fix:**
```ts
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
  if (open) document.addEventListener("keydown", handleEsc);
  return () => document.removeEventListener("keydown", handleEsc);
}, [open]);
```

---

### BUG 73 — Acentos faltantes en UBICACION_OPTIONS de AplicarModal (13.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 23-26

**Confirmado presente** al revisar hoy:
```
"CDMX — maximo 1 hora de traslado"    → "CDMX — máximo 1 hora de traslado"
"Estado de Mexico"                      → "Estado de México"
"Disponible para reubicacion"           → "Disponible para reubicación"
```

---

### BUG 74 — "Si, todo en orden" sin acento (13.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 30

**Confirmado presente** al revisar hoy:
```ts
"Si, todo en orden"  →  "Sí, todo en orden"
```

---

### BUG 75 — AplicarModal fetch sin timeout — candidato bloqueado en "Enviando..." (13.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 50

**Fix:**
```ts
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30_000);
try {
  const res = await fetch("/api/aplicar", { method: "POST", body: fd, signal: controller.signal });
  clearTimeout(timeout);
} catch (err) {
  clearTimeout(timeout);
  const isAbort = err instanceof DOMException && err.name === "AbortError";
  setStatus(isAbort ? "timeout" : "error");
}
```

---

### BUG 69 — "aqui" sin acento en DOS archivos (14.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 20 y `src/lib/assistant/system-prompt.ts` línea 16

**Confirmado presente** al revisar `useChat.ts` hoy (línea 20): `"Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte."`.

```ts
// useChat.ts línea 20:
"...estoy aquí para orientarte..."
// system-prompt.ts línea 16:
"...estoy aquí para orientarte..."
```

---

### BUG 70 — Error de red muestra string técnico al usuario (14.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 129-131

**Fix:**
```ts
} catch (err) {
  const isNetwork = err instanceof TypeError && err.message.includes("fetch");
  setError(isNetwork
    ? "No se pudo conectar. Verifica tu internet e intenta de nuevo."
    : (err instanceof Error ? err.message : "Error al enviar el mensaje"));
}
```

---

### BUG 71 — Widget de Kyo no cierra con tecla Escape (14.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx`

**Fix:**
```ts
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
  document.addEventListener("keydown", handleEsc);
  return () => document.removeEventListener("keydown", handleEsc);
}, [open]);
```

---

### BUG 68 — Hero muestra "10+ Años exp." vs knowledge base "3+" (15.º día)
**Archivos:** `src/components/sections/Hero.tsx` líneas 107, 157; `src/lib/assistant/knowledge.ts` líneas 78-79

**Confirmado presente** al revisar hoy: Hero.tsx línea 157 muestra `"10+"`. knowledge.ts línea 79 dice `"Años en el mercado": "3+"`. Inconsistencia visible en la landing.

**Fix:** Unificar con los datos reales en ambos archivos: "3+ Años" y "687+ candidatos".

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (15.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 81

**Confirmado presente** al revisar hoy.

```tsx
placeholder="¿Qué puesto buscas?"
```

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (24.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 5

**Confirmado presente:** `import Image from "next/image"` en línea 5. CLAUDE.md prohíbe `next/image`; usar `<img>` nativo.

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (24.º día)
**Archivo:** `src/app/vacantes/page.tsx` línea 29

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

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (38.º día sin fix)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210, 227

**Confirmado presente** al revisar hoy: el `<div>` de la burbuja en línea 227 usa `whitespace-pre-wrap` sin parseo de markdown. Fix unificado con BUG 65 (ver arriba).

---

### BUG 44 — Inconsistencia usted/tú en system prompt (32.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero el manejo de otros temas tutea: `"te conecto"`, `"¿te ayudo"`. Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (38.º día)
**Archivo:** `src/app/vacantes/page.tsx` líneas 32 y 42

**Confirmado presente** al revisar hoy: línea 32 `"Mas de $20k"` y línea 42 `case "Mas de $20k":`. Actualizar también la función `matchesSalario`.

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (38.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 y 148-153

Kyo puede decir "salario $12,000" sin aclarar si es neto o bruto. Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()` de `listJobs()`.

---

### BUG 48 — Sin ARIA live region en el chat widget (38.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

**Confirmado presente** al revisar hoy: el `<div ref={scrollRef}>` en línea 143 carece de `role="log"` y `aria-live`. Sin esto, lectores de pantalla no anuncian las respuestas de Kyo.

```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (38.º día)
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

El fallback `"MXN bruto"` es incorrecto para contratos por proyecto. Cambiar a `"mensual"`.

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (38.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 99 y `src/app/api/assistant/chat/route.ts` línea 131

Con más de 20 mensajes se puede perder el nombre, puesto, experiencia, zona y jornada del candidato al truncar el historial.

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (27.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58

El regex no hace match si hay query params o CDN personalizado. El `.catch(() => {})` oculta el fallo.

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (27.º día)
**Archivo:** `src/components/social/StoryboardView.tsx` línea 63

Cuando `storyboard.archivado` está presente, el admin ve un storyboard vacío. Añadir bloque con info del Drive + link antes del filmstrip.

---

### BUG 16 — Memory leak en `rateLimitMap` (38.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir purga de entradas expiradas en `checkRateLimit()` o migrar a Upstash Redis.

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (38.º día)
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

- **"Nueva conversacion" sin acento y mal posicionado** — `ChatWidget.tsx` línea 161. **Confirmado presente hoy.** Corregir a `"Nueva conversación"` y mover al header para que sea fácil de encontrar sin hacer scroll.

- **Altura del widget demasiado pequeña en iPhone SE** — `ChatWidget.tsx` línea 120. Cambiar `h-[min(60vh,560px)]` a `h-[min(70vh,560px)]`.

### Media prioridad

- **Avisar al candidato que puede seguir hablando con Kyo tras la navegación** — En Paso 5 de `system-prompt.ts` añadir: `"Le abro las vacantes en pantalla. Podemos seguir hablando aquí si tiene dudas."` Y en `useChat.ts` línea 127: incrementar el delay de navegación de 700ms a 1400ms.

- **Confirmación visual al aprobar en `/revisor`** — Toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120 s. Añadir spinner y deshabilitar botón durante la operación.

- **Timeout en fetch del chat** — `src/components/assistant/useChat.ts` línea 95. **Confirmado ausente.** Añadir `AbortController` con 30 s.

- **Notificación al cliente al publicar video TikTok** — Pendiente explícito en CLAUDE.md. Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos.

- **PageHero de `/vacantes` usa imagen externa de Unsplash** — Descargar a `/public/images/` y servir localmente.

- **`enterKeyHint="send"` en input de Kyo** — `ChatWidget.tsx` línea 170. En teclados virtuales de iOS/Android muestra "enviar" en lugar de "return".

### Baja prioridad

- **Tour de novedad bloquea pestaña Análisis** — `src/app/revisor/page.tsx`: mostrar `<NovedadFiltros />` solo cuando `seccion === "publicaciones"`.

- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true` mejoran la percepción de velocidad.

- **Avatares externos de pravatar.cc en Hero** — **Confirmado presente:** `src/components/sections/Hero.tsx` línea 100. Reemplazar con avatares SVG genéricos o fotos reales.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 6 sin manejo de rechazo** — Añadir al Paso 6 en `system-prompt.ts`:
  ```
  Si el candidato rechaza todas las opciones:
  "Entiendo, [nombre]. Puedo registrar su perfil en nuestro banco de talentos
  para avisarle cuando surja una oportunidad más afín. ¿Le parece bien?"
  Navegar a /contacto.
  ```

- **Mencionar las 24 h de respuesta en Paso 5** — El dato más persuasivo no aparece en el pitch de recomendación. Añadir al formato del Paso 5: `"Nuestro equipo le contacta en menos de 24 horas hábiles."`

- **Resumen de perfil en Paso 4 (ancla contra truncado de contexto)** — Con el historial cortado a 20 mensajes (BUG 52), una conversación larga puede perder el nombre. Añadir instrucción en Paso 4: al completar Pasos 0-4, sintetizar en una línea: `"Perfil capturado: [nombre], [puesto], [N años], zona [X], [jornada]."`

- **Manejo de empresa confidencial en Paso 5** — Si la empresa está vacía en Supabase, añadir en el system prompt: `"Si la empresa es confidencial, omite el nombre y pon 'Empresa confidencial'."`

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero `search_jobs` no acepta ese parámetro. Añadir:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  También actualizar `listJobs()` en `knowledge.ts` para aplicar estos filtros.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, crear un registro en Supabase directamente desde Kyo. El candidato no tendría que rellenar el formulario manualmente.

### Problemas detectados

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. **Confirmado presente:** `"Entendido, ¿en que mas te puedo ayudar?"`. Cuando Claude solo llama `navigate_to` sin texto, el fallback carece de acentos y usa tono incorrecto.

  **Fix:**
  ```ts
  const replyContent = finalText
    || (navigations.length > 0 ? "Le abro esa sección ahora mismo." : "Entendido, ¿en qué más le puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 (2-3 vacantes con justificación + `navigate_to`) puede acercarse al límite. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` con poco margen** — Línea 85. Paso 5 óptimo = `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Solo 1 de margen. Subir a 8.

- **`getStoredInstrucciones()` usa anon key** — Líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente. Usar `sbAdmin` (service role) para mayor resiliencia.

---

## Oportunidades de mejora general

- **Variables `GOOGLE_*` pendientes en el VPS** — El botón "🗄️ Liberar espacio" devuelve 503 en producción porque `driveConfigurado()` devuelve `false`. Añadir las 4 vars al `ecosystem.config.js` del VPS es un deploy de 5 minutos sin código nuevo.

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante específica. Sin este evento es imposible medir el ROI del asistente. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`.

- **Indicador de paso en el flujo de Kyo** — El candidato no sabe en qué etapa está. Un texto sutil en el header del widget (`"Paso 2 de 5"`) reduce abandonos. Puede inferirse contando mensajes del usuario en `useChat.ts`.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — 5 s mirando "Sin resultados" + bubble proactivo de Kyo. Implementar con `useEffect` + `setTimeout(5000)` en la ruta, una vez por sesión (flag en sessionStorage).

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Revisar que todos los demás endpoints admin (`upload`, `posts`, `config`, `importar`, `informe`) también validan sesión en el servidor antes de operar.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto | Días |
|---|-----------|----------|---------|------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 38 |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 27 |
| 3 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 10 |
| 4 | BUG 89 — deletePost() sin res.ok | Bajo (10 min) | Alto | 5 |
| 5 | BUG 90 — togglePublicado() sin res.ok | Bajo (10 min) | Alto | 5 |
| 6 | BUG 86 — moverPost* sin res.ok (3 funciones) | Bajo (15 min) | Alto | 6 |
| 7 | BUG 87 — Input fecha activo mientras moving=true | Bajo (1 atrib) | Bajo | 6 |
| 8 | BUG 84 — StoryboardEditor/GuiaTecnicaEditor sin onSaved() | Bajo (10 min) | Alto | 7 |
| 9 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 10 |
| 10 | BUG 85 — key={i} en beats de montaje | Bajo (10 min) | Alto | 7 |
| 11 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | 10 |
| 12 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | 10 |
| 13 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | 10 |
| 14 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | 10 |
| 15 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 22 |
| 16 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 21 |
| 17 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 38 |
| 18 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 24 |
| 19 | BUG 68 — Hero "10+ años" vs knowledge "3+ años" | Bajo (1 min) | Alto | 15 |
| 20 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 24 |
| 21 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 25 |
| 22 | BUG 57 — subirADrive sin timeout | Bajo (5 min) | Alto | 27 |
| 23 | BUG 60 — fetch(video_url) sin timeout | Bajo (1 línea) | Alto | 26 |
| 24 | Variables GOOGLE_* en VPS (no es código) | Bajo (5 min) | Alto | 28 |
| 25 | BUG 67 — Placeholder Hero sin acento "¿Que puesto?" | Bajo (1 char) | Alto | 15 |
| 26 | BUG 53 / BUG 73 / BUG 74 — Acentos en AplicarModal | Bajo (5 min) | Alto | 38/13/13 |
| 27 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 38 |
| 28 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 14 |
| 29 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 14 |
| 30 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 13 |
| 31 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 13 |
| 32 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 12 |
| 33 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 12 |
| 34 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 14 |
| 35 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 32 |
| 36 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 38 |
| 37 | "Nueva conversacion" sin acento en ChatWidget | Bajo (1 min) | Medio | — |
| 38 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 38 |
| 39 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 27 |
| 40 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 41 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 38 |
| 42 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 27 |
| 43 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 38 |
| 44 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 38 |
| 45 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 46 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 47 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 48 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 49 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 50 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 51 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 52 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 53 | Tool register_talent_interest | Medio | Alto | — |
| 54 | PageHero vacantes con imagen Unsplash externa | Bajo (5 min) | Bajo | — |
| 55 | Tour novedad solo en pestaña Publicaciones | Bajo (1 línea) | Medio | — |
| 56 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 38 |
| 57 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 38 |
| 58 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 59 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 60 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
