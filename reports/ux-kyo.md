# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-16
**Cambios analizados:** Sin commits de código nuevos en los últimos 2 días. Último cambio relevante: `src/app/admin/(panel)/redes-sociales/page.tsx` (commit b0bc7b7, 2026-07-13). Archivos del asistente revisados: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/useChat.ts`, `src/components/assistant/ChatWidget.tsx`.

---

## Cambios Recientes Detectados

**Sin commits de código nuevos.** Los últimos 3 commits son solo actualizaciones de `reports/ux-kyo.md`. El último cambio de código fue el commit b0bc7b7 (2026-07-13): botón "📅 Mover a otra fecha" en el modal de detalle del admin — correctamente implementado con `res.ok`, `try/catch/finally`, `alert` de error y navegación automática con `onMoved?.(moveDate)`. No hay cambios nuevos que analizar hoy.

**Todos los bugs acumulados siguen sin corregir** — los contadores de días incrementan.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (35.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt (línea 138 de `system-prompt.ts`) construye el listado desde `knowledge.listJobs()` — si Supabase tiene vacantes distintas a las del archivo, Kyo da al candidato información errónea sobre disponibilidad real.

La interfaz `KnowledgeProvider` (línea 42 de `knowledge.ts`) ya está preparada para el reemplazo. `vacantes/page.tsx` ya lee de Supabase directamente — Kyo es el único componente que sigue usando los datos demo.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. Registrar en línea 167 en lugar del provider estático.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (35.º día — LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```
El nombre del candidato que escribe en el Paso 0, y cualquier dato personal que mencione, queda textual en `site_eventos.valor` (hasta 300 caracteres). Riesgo legal LFPDPPP. **Confirmado presente** al revisar el archivo hoy.

**Fix de 1 línea:**
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (24.º día sin fix)
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

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (19.º día)
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

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs de conversaciones (18.º día)
**Archivos:** `src/components/assistant/useChat.ts` líneas 139-144

`reset()` limpia `localStorage` (historial) pero NO `sessionStorage` (session ID). **Confirmado presente** al revisar el archivo hoy (líneas 142-144). La siguiente conversación reutiliza el mismo `session_id` y el upsert en `kyo_conversaciones` **sobreescribe** el log anterior.

**Fix de 2 líneas en `useChat.ts` líneas 142-143:**
```ts
localStorage.removeItem(STORAGE_KEY);
sessionStorage.removeItem("kyo_session_id"); // ← agregar esta línea
```

---

### BUG 78 — PropuestaEditor sin confirmación antes de enviar correo al cliente (7.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor` aprox. línea 379

El botón `"📨 Guardar y avisar al cliente"` llama directamente a `guardar(true)` → `POST /api/admin/social/posts/[id]/versions` → crea nueva versión y envía correo a todos los `social_reviewers` activos (Rosy y Monse). Sin diálogo de confirmación. Un clic accidental notifica innecesariamente a las clientes.

**Fix:** Añadir confirmación antes del `POST`:
```ts
<button onClick={() => {
  if (!window.confirm("¿Guardar cambios y enviar correo de actualización a las revisoras ahora?")) return;
  guardar(true);
}} disabled={!!saving} ...>
```
O mejor: modal branded (cabecera navy, 2 botones) consistente con el resto del panel.

---

### BUG 79 — `PostModal.save()` cierra el modal sin verificar si el fetch falló (7.º día sin fix)
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

### BUG 89 — `deletePost()` sin verificación de error — el modal cierra aunque el DELETE haya fallado (2.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `deletePost` líneas 890-895

```ts
const deletePost = async () => {
  if (!confirm("¿Eliminar esta publicación y todo su historial?")) return;
  await fetch(`/api/admin/social/posts/${post.id}`, { method: "DELETE" }); // sin res.ok
  onUpdated();
  onClose(); // cierra siempre, sin importar si el DELETE falló
};
```

**Confirmado presente** al revisar el archivo hoy. Si el DELETE falla (sesión expirada, error de red), el admin ve el modal cerrar, el calendario se refresca y la publicación sigue ahí — sin mensaje de error.

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

### BUG 90 — `togglePublicado()` sin `res.ok` — estado UI diverge de la BD si el PATCH falla (2.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `togglePublicado` líneas 897-911

```ts
await fetch(`/api/admin/social/posts/${post.id}`, { method: "PATCH", body: JSON.stringify({ publicado: !publicado }) });
setPublicado(!publicado); // ← se actualiza el estado UI siempre, con o sin éxito
```

**Confirmado presente** al revisar el archivo hoy. Si el PATCH falla, el botón muestra "● Visible para el cliente" pero en la BD el post sigue siendo borrador.

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

### BUG 86 — `moverPostPeriodo()` sin `res.ok` — movimiento por flechas ‹ › sin detección de error (3.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `moverPostPeriodo`

```ts
await fetch(`/api/admin/social/posts/${postId}/versions`, {
  method: "PUT", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fecha_programada: nuevaIso }),
}); // sin res.ok — el calendario avanza al siguiente periodo aunque el PUT haya fallado
setWeekOffset((w) => w + dir); // avanza de todas formas
```

**Fix:**
```ts
const res = await fetch(`/api/admin/social/posts/${postId}/versions`, {
  method: "PUT", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ fecha_programada: nuevaIso }),
});
if (!res.ok) {
  alert("No se pudo mover la publicación. Intenta de nuevo.");
  loadData();
  return;
}
setWeekOffset((w) => w + dir);
```

---

### BUG 87 — `intercambiarFechas()` sin rollback — estado inconsistente si un fetch falla (3.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — función `intercambiarFechas`

Los dos `PUT` se lanzan con `Promise.all()`. Si uno falla, el update optimista ya aplicó el intercambio en ambos posts, pero solo uno se guardó en la base de datos.

**Fix:**
```ts
const [ra, rb] = await Promise.allSettled([
  fetch(`/api/admin/social/posts/${aId}/versions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fecha_programada: fb }) }),
  fetch(`/api/admin/social/posts/${bId}/versions`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fecha_programada: fa }) }),
]);
if (ra.status === "rejected" || rb.status === "rejected" ||
    (ra.value && !ra.value.ok) || (rb.value && !rb.value.ok)) {
  setPosts((prev) => prev.map((x) => (x.id === aId ? { ...x, fecha_programada: fa } : x.id === bId ? { ...x, fecha_programada: fb } : x)));
  alert("No se pudo intercambiar las fechas. Intenta de nuevo.");
}
loadData();
```

---

### BUG 88 — Input de fecha activo mientras el move está en curso (3.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PostDetail` línea 929

**Confirmado presente:** el `<input type="date">` no tiene `disabled={moving}`. El botón "✓ Mover" sí se deshabilita, pero el campo de fecha sigue activo.

**Fix de 1 atributo:**
```tsx
<input type="date" value={moveDate} min={hoyIsoDetail}
  disabled={moving}
  onChange={(e) => setMoveDate(e.target.value)}
  style={{ ..., opacity: moving ? 0.5 : 1 }} />
```

---

### BUG 84 — `StoryboardEditor` y `GuiaTecnicaEditor` sin `onSaved()` tras guardar exitoso (4.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — editores del commit 214e127

Los dos editores hacen PUT pero no llaman a ningún callback para refrescar `selectedPost` en el componente padre. El admin guarda el storyboard, el `PUT` responde 200, pero el panel sigue mostrando los datos previos hasta que cierra y reabre el modal.

**Fix:** Exponer un prop `onSaved?: () => void` en ambos editores y llamarlo tras el `PUT` exitoso, igual que `PropuestaEditor`.

---

### BUG 85 — `GuiaTecnicaEditor`: tabla de montaje con `key={i}` — reorders causan pérdidas de foco (4.º día)
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

### BUG 80 — Botón × del último cuadro/beat no se deshabilita → clic sin efecto visible (7.º día)
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

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar (7.º día)
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

### BUG 82 — Triple caption divergente sin sincronización entre versiones (7.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

Un mismo TikTok puede tener tres captions independientes en `version.caption`, `storyboard.propuesta.caption` y `storyboard.guia_tecnica.caption`. Los editores los actualizan por separado sin advertencia cuando divergen.

**Fix recomendado:** Al guardar desde `PropuestaEditor` con `avisar=false`, propagar `caption` también a `storyboard.guia_tecnica.caption`. Agregar nota bajo el campo caption de la Guía técnica: `"Referencia — actualiza también en Propuesta si cambia."`

---

### BUG 83 — Cuadros con solo `tipo` seleccionado se filtran silenciosamente al guardar (7.º día)
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

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (24.º día)
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

### BUG 60 — `fetch(version.video_url)` sin timeout (23.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 97

```ts
const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });
```

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (22.º día)
**Archivos:** `src/lib/assistant/system-prompt.ts` líneas 85-86 y `src/lib/assistant/tools.ts` línea 44

El system prompt usa `"Estado de Mexico"` y `"Hibrido"`, pero `vacantes/page.tsx` valida contra `["Estado de México", "Híbrido"]`.

**Fix en `system-prompt.ts` línea 85:**
```
- /vacantes?ubicacion=CDMX (valores: CDMX, Estado de México, Híbrido, Remoto)
```

---

### BUG 76 — Input de Kyo sin `maxLength` — riesgo de costos de tokens (9.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 170

**Confirmado presente** al revisar el archivo hoy (línea 170 no tiene `maxLength`).

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

### BUG 77 — Sin focus trap en ChatWidget — usuarios de teclado escapan del widget (9.º día)
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

### BUG 72 — AplicarModal no cierra con tecla Escape (10.º día)
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

### BUG 73 — Acentos faltantes en UBICACION_OPTIONS de AplicarModal (10.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 23-26

```
"CDMX — maximo 1 hora de traslado"   → "CDMX — máximo 1 hora de traslado"
"Estado de Mexico"                     → "Estado de México"
"Disponible para reubicacion"          → "Disponible para reubicación"
```

---

### BUG 74 — "Si, todo en orden" sin acento (10.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 30

```ts
"Si, todo en orden"  →  "Sí, todo en orden"
```

---

### BUG 75 — AplicarModal fetch sin timeout — candidato bloqueado en "Enviando..." (10.º día)
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

### BUG 69 — "aqui" sin acento en DOS archivos (11.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 20 y `src/lib/assistant/system-prompt.ts` línea 16

**Confirmado presente** al revisar `useChat.ts` hoy: `"Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte."` (línea 20 — le falta acento en "aquí").

```ts
// useChat.ts línea 20:
"...estoy aquí para orientarte..."
// system-prompt.ts línea 16:
"...estoy aquí para orientarte..."
```

---

### BUG 70 — Error de red muestra string técnico al usuario (11.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 129-131

**Confirmado presente:** `catch (err) { const msg = err instanceof Error ? err.message : "Error al enviar el mensaje"; setError(msg); }` — si es un TypeError de red, el mensaje incluye el stack técnico.

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

### BUG 71 — Widget de Kyo no cierra con tecla Escape (11.º día)
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

### BUG 68 — Hero muestra "10+ Años exp." vs knowledge base "3+" (12.º día)
**Archivos:** `src/components/sections/Hero.tsx` líneas 107, 158; `src/lib/assistant/knowledge.ts` líneas 78-79

**Fix:** Unificar con los datos reales en ambos archivos: "3+ Años" y "687+ candidatos".

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (12.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 81

```tsx
placeholder="¿Qué puesto buscas?"
```

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (21.º día)
**Archivo:** `src/components/sections/Hero.tsx` líneas 5, 122, 132

```tsx
<img src="/images/Hero2.jpg" alt="Trabajo operativo Kyoszen" className="object-cover w-full h-full" />
<img src="/images/Hero.jpg" alt="Equipo profesional Kyoszen" className="object-cover w-full h-full" />
```

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (21.º día)
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

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (35.º día sin fix)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210, 227

Fix unificado con BUG 65 (ver arriba).

---

### BUG 44 — Inconsistencia usted/tú en system prompt (29.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero el manejo de otros temas tutea: `"te conecto"`, `"¿te ayudo"`. Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (35.º día)
**Archivo:** `src/app/vacantes/page.tsx` líneas 32 y 43

`"Mas de $20k"` → `"Más de $20k"`. Actualizar también la función `matchesSalario`.

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (35.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 y 148-153

Kyo puede decir "salario $12,000" sin aclarar si es neto o bruto. Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()` de `listJobs()`.

---

### BUG 48 — Sin ARIA live region en el chat widget (35.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (35.º día)
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

El fallback `"MXN bruto"` es incorrecto para contratos por proyecto. Cambiar a `"mensual"`.

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (35.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 99 y `src/app/api/assistant/chat/route.ts` línea 131

Con más de 20 mensajes se puede perder el nombre, puesto, experiencia, zona y jornada del candidato al truncar el historial.

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (24.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58

El regex no hace match si hay query params o CDN personalizado. El `.catch(() => {})` oculta el fallo.

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (24.º día)
**Archivo:** `src/components/social/StoryboardView.tsx` línea 63

Cuando `storyboard.archivado` está presente, el admin ve un storyboard vacío. Añadir bloque con info del Drive + link antes del filmstrip.

---

### BUG 16 — Memory leak en `rateLimitMap` (35.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir purga de entradas expiradas en `checkRateLimit()` o migrar a Upstash Redis.

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (35.º día)
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

- **"Nueva conversacion" sin acento y mal posicionado** — `ChatWidget.tsx` línea 161. **Confirmado presente hoy.** Corregir a `"Nueva conversación"` y mover al header.

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

- **Avatares externos de pravatar.cc en Hero** — Reemplazar con avatares SVG genéricos o fotos reales.

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

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. BUG 89/90 muestran el patrón: `deletePost` y `togglePublicado` en el frontend sí tienen sesión (están en el panel protegido), pero si los endpoints del servidor (`/api/admin/social/posts/[id]` con método DELETE y PATCH) no verifican sesión, son accesibles directamente. Revisar: `upload`, `posts`, `config`, `importar`, `informe` y demás.

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto | Días |
|---|-----------|----------|---------|------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 35 |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 24 |
| 3 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 7 |
| 4 | BUG 89 — deletePost() sin res.ok | Bajo (10 min) | Alto | 2 |
| 5 | BUG 90 — togglePublicado() sin res.ok | Bajo (10 min) | Alto | 2 |
| 6 | BUG 86 — moverPostPeriodo() sin res.ok en drag flechas | Bajo (15 min) | Alto | 3 |
| 7 | BUG 87 — intercambiarFechas() sin rollback | Bajo (15 min) | Alto | 3 |
| 8 | BUG 88 — Input fecha activo mientras moving=true | Bajo (1 atrib) | Bajo | 3 |
| 9 | BUG 84 — StoryboardEditor/GuiaTecnicaEditor sin onSaved() | Bajo (10 min) | Alto | 4 |
| 10 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 7 |
| 11 | BUG 85 — key={i} en beats de montaje | Bajo (10 min) | Alto | 4 |
| 12 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | 7 |
| 13 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | 7 |
| 14 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | 7 |
| 15 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | 7 |
| 16 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 19 |
| 17 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 18 |
| 18 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 35 |
| 19 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 21 |
| 20 | BUG 68 — Hero "10+ años" vs knowledge "3+ años" | Bajo (1 min) | Alto | 12 |
| 21 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 21 |
| 22 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 22 |
| 23 | BUG 57 — subirADrive sin timeout | Bajo (5 min) | Alto | 24 |
| 24 | BUG 60 — fetch(video_url) sin timeout | Bajo (1 línea) | Alto | 23 |
| 25 | Variables GOOGLE_* en VPS (no es código) | Bajo (5 min) | Alto | 25 |
| 26 | BUG 67 — Placeholder Hero sin acento "¿Que puesto?" | Bajo (1 char) | Alto | 12 |
| 27 | BUG 53 / BUG 73 / BUG 74 — Acentos faltantes en AplicarModal | Bajo (5 min) | Alto | 35/10/10 |
| 28 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 35 |
| 29 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 11 |
| 30 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 11 |
| 31 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 10 |
| 32 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 10 |
| 33 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 9 |
| 34 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 9 |
| 35 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 11 |
| 36 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 29 |
| 37 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 35 |
| 38 | "Nueva conversacion" sin acento en ChatWidget | Bajo (1 min) | Medio | — |
| 39 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 35 |
| 40 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 24 |
| 41 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 42 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 35 |
| 43 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 24 |
| 44 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 35 |
| 45 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 35 |
| 46 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 47 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 48 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 49 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 50 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 51 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 52 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 53 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 54 | Tool register_talent_interest | Medio | Alto | — |
| 55 | PageHero vacantes con imagen Unsplash externa | Bajo (5 min) | Bajo | — |
| 56 | Tour novedad solo en pestaña Publicaciones | Bajo (1 línea) | Medio | — |
| 57 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 35 |
| 58 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 35 |
| 59 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 60 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 61 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
