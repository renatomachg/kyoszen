# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-10
**Cambios analizados:** `src/app/admin/(panel)/redes-sociales/page.tsx` (commit 214e127 — editar Storyboard y Guía técnica de TikTok)
Archivos revisados hoy: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/app/admin/(panel)/redes-sociales/page.tsx` (análisis profundo de los 3 editores nuevos: `PropuestaEditor`, `StoryboardEditor`, `GuiaTecnicaEditor`).

---

## Cambios Recientes Detectados

**commit 214e127** — `feat: permite editar Storyboard y Guía técnica de TikTok en admin`

Archivo modificado: `src/app/admin/(panel)/redes-sociales/page.tsx`

Se agregaron dos nuevos editores inline (`StoryboardEditor` línea 395 y `GuiaTecnicaEditor` línea 499) que permiten al admin editar el guion cuadro por cuadro y los prompts de Higgsfield + tabla de montaje CapCut directamente en el panel, sin salir de la vista de detalle. El análisis profundo de hoy detectó 4 bugs nuevos en estos componentes.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (29.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt (línea 138 de `system-prompt.ts`) construye el listado desde `knowledge.listJobs()` — si Supabase tiene vacantes distintas a las del archivo, Kyo da al candidato información errónea sobre disponibilidad real.

La interfaz `KnowledgeProvider` (línea 42 de `knowledge.ts`) ya está preparada para el reemplazo. `vacantes/page.tsx` ya lee de Supabase directamente — Kyo es el único componente que sigue usando los datos demo.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true`. Registrar en línea 167 en lugar del provider estático.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (29.º día — LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```
El nombre del candidato que escribe en el Paso 0, y cualquier dato personal que mencione, queda textual en `site_eventos.valor` (hasta 300 caracteres). Riesgo legal LFPDPPP.

**Fix de 1 línea:**
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (18.º día sin fix)
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

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (13.º día)
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

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs de conversaciones (12.º día)
**Archivos:** `src/components/assistant/useChat.ts` líneas 139-144

`reset()` limpia `localStorage` (historial) pero NO `sessionStorage` (session ID). La siguiente conversación reutiliza el mismo `session_id` y el upsert en `kyo_conversaciones` **sobreescribe** el log anterior.

**Fix de 2 líneas en `useChat.ts` líneas 142-143:**
```ts
localStorage.removeItem(STORAGE_KEY);
sessionStorage.removeItem("kyo_session_id"); // ← agregar esta línea
```

---

### BUG 78 — PropuestaEditor sin confirmación antes de enviar correo al cliente (1.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor` línea 379

El botón `"📨 Guardar y avisar al cliente"` (línea 379) llama directamente a `guardar(true)` → `POST /api/admin/social/posts/[id]/versions` → crea nueva versión y envía correo a todos los `social_reviewers` activos (Rosy y Monse). Sin diálogo de confirmación. Un clic accidental notifica innecesariamente a las clientes.

**Fix:** Añadir confirmación antes del `POST`:
```ts
<button onClick={() => {
  if (!window.confirm("¿Guardar cambios y enviar correo de actualización a las revisoras ahora?")) return;
  guardar(true);
}} disabled={!!saving} ...>
```
O mejor: modal branded (cabecera navy, 2 botones) consistente con el resto del panel.

---

### BUG 79 — `PostModal.save()` cierra el modal sin verificar si el fetch falló (1.º día sin fix)
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

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (18.º día)
**Archivo:** `src/lib/google-drive.ts` líneas 23 y 69

`getAccessToken()` y `subirADrive()` usan `fetch` sin `AbortController`. Si Google OAuth o el upload responden lento, el endpoint bloquea un worker de PM2 durante `maxDuration: 300`.

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

### BUG 60 — `fetch(version.video_url)` sin timeout (17.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 97

```ts
const res = await fetch(version.video_url);
```
Sin límite de tiempo. Fix de 1 línea:
```ts
const res = await fetch(version.video_url, { signal: AbortSignal.timeout(60_000) });
```

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (16.º día)
**Archivos:** `src/lib/assistant/system-prompt.ts` líneas 85-86 y `src/lib/assistant/tools.ts` línea 44

El system prompt instruye a Kyo con `"Estado de Mexico"` y `"Hibrido"`, pero `vacantes/page.tsx` valida contra `["Estado de México", "Híbrido"]` (con acentos). El filtro se ignora silenciosamente.

**Fix en `system-prompt.ts` línea 85:**
```
- /vacantes?ubicacion=CDMX (valores: CDMX, Estado de México, Híbrido, Remoto)
```
**Fix adicional en `tools.ts` línea 44:**
```ts
location: { type: "string", description: "Filtra por ubicación: CDMX, Estado de México, Híbrido, Remoto" },
```

---

## 🟠 BUGS NUEVOS HOY

### BUG 80 — Botón × del último cuadro/beat no se deshabilita → clic sin efecto visible **(NUEVO)**
**Archivos:** `src/app/admin/(panel)/redes-sociales/page.tsx`
- `StoryboardEditor` línea 461: `onClick={() => setFrames(frames.length > 1 ? frames.filter(...) : frames)}`
- `GuiaTecnicaEditor` línea 564: `onClick={() => setMontaje(montaje.length > 1 ? montaje.filter(...) : montaje)}`

Cuando solo queda un cuadro (o beat), el botón × no hace nada pero visualmente sigue activo (sin `disabled`, mismo color rojo). El admin hace clic repetidamente pensando que algo falló.

**Fix en ambos componentes:**
```tsx
<button
  onClick={() => setFrames(frames.length > 1 ? frames.filter((_, j) => j !== i) : frames)}
  disabled={frames.length === 1}
  style={{ ..., opacity: frames.length === 1 ? 0.35 : 1, cursor: frames.length === 1 ? "default" : "pointer" }}
>×</button>
```
Mismo patrón para `montaje` en `GuiaTecnicaEditor`.

---

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar o cambiar pestaña **(NUEVO)**
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor` (l. 384), `StoryboardEditor` (l. 490), `GuiaTecnicaEditor` (l. 592)

Los tres editores tienen botón "Cancelar" que llama `onCancel()` directamente, sin verificar si hay cambios sin guardar. Si el admin edita 10 cuadros del storyboard y accidentalmente hace clic en "Cancelar", todo se pierde sin advertencia.

**Fix con dirty-check ligero (igual para los 3 editores):**
```ts
const isDirty = audiencia !== sbActual.audiencia || duracion !== sbActual.duracion || frames.length !== (sbActual.frames?.length ?? 1);

const handleCancel = () => {
  if (isDirty && !window.confirm("¿Descartar los cambios sin guardar?")) return;
  onCancel();
};
```

---

### BUG 82 — Triple caption divergente: sin sincronización entre `version.caption`, `propuesta.caption` y `guia_tecnica.caption` **(NUEVO)**
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `PropuestaEditor` l. 302 y `GuiaTecnicaEditor` l. 507

Un mismo TikTok puede tener tres captions independientes almacenadas en:
1. `version.caption` (el caption publicado real)
2. `storyboard.propuesta.caption` (lo que ve el cliente en el revisor)
3. `storyboard.guia_tecnica.caption` (referencia interna para montaje)

Los editores los actualizan por separado con `PUT`. No hay advertencia cuando divergen. El admin puede corregir el caption en el editor de Propuesta y olvidar actualizarlo en la Guía técnica (o viceversa), resultando en tres versiones distintas.

**Fix recomendado:** Al guardar desde `PropuestaEditor` con `avisar=false`, propagar `caption` también a `storyboard.guia_tecnica.caption` si están sincronizados (i.e., eran iguales antes de editar). Agregar nota aclaratoria debajo del campo caption en la Guía técnica: `"Referencia — actualiza también en Propuesta si cambia."`.

---

### BUG 83 — Cuadros con solo `tipo` seleccionado se filtran silenciosamente al guardar **(NUEVO)**
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` — `StoryboardEditor` línea 419

```ts
frames: frames.filter((f) => f.tc || f.overlay || f.escena || f.dice),
```

Si el admin agrega un cuadro, selecciona el tipo ("CTA") pero no escribe nada más (tc/overlay/escena/dice), ese cuadro se descarta silenciosamente al guardar. El tipo queda fuera del predicado de filtro. El storyboard guardado tiene menos cuadros de los que el admin veía.

**Fix:** Incluir `tipo !== "normal"` en el predicado o no filtrar en absoluto (dejar que el backend ignore cuadros vacíos, pero que el frontend los preserve):
```ts
frames: frames.filter((f) => f.tc || f.overlay || f.escena || f.dice || f.tipo !== "normal"),
```
O simplemente: guardar todos los cuadros sin filtrar y avisar al usuario si alguno está vacío.

---

## 🟠 BUGS CONFIRMADOS — PENDIENTES

### BUG 76 — Input de Kyo sin `maxLength` — riesgo de costos de tokens (3.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 170

El `<input>` del widget no tiene `maxLength` y el API route no valida longitud por mensaje. Un usuario que pegue texto masivo envía miles de tokens de entrada a Anthropic por mensaje.

**Fix de 2 cambios:**
```tsx
// ChatWidget.tsx línea 170:
<input maxLength={600} ... />
```
```ts
// route.ts líneas 126-130:
const tooLong = history.some(m => m.content.length > 2000);
if (tooLong) return NextResponse.json({ error: "Mensaje demasiado largo." }, { status: 400 });
```

---

### BUG 77 — Sin focus trap en ChatWidget — usuarios de teclado escapan del widget (3.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 112

Cuando el widget está abierto, Tab mueve el foco a elementos del sitio en lugar de permanecer dentro del panel.

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

### BUG 72 — AplicarModal no cierra con tecla Escape (4.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 35

**Fix (agregar `useEffect` en `AplicarModal`):**
```ts
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
  if (open) document.addEventListener("keydown", handleEsc);
  return () => document.removeEventListener("keydown", handleEsc);
}, [open]);
```

---

### BUG 73 — Acentos faltantes en UBICACION_OPTIONS de AplicarModal (4.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 23-26

```ts
"CDMX — maximo 1 hora de traslado"   → "CDMX — máximo 1 hora de traslado"
"Estado de Mexico"                     → "Estado de México"
"Disponible para reubicacion"          → "Disponible para reubicación"
```

---

### BUG 74 — "Si, todo en orden" sin acento en DOCUMENTACION_OPTIONS (4.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 30

```ts
"Si, todo en orden"  →  "Sí, todo en orden"
```

---

### BUG 75 — AplicarModal fetch sin timeout — candidato bloqueado en "Enviando..." (4.º día)
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 50

```ts
const res = await fetch("/api/aplicar", { method: "POST", body: fd });
```
Sin `AbortController`. Si el endpoint demora o cae, el botón queda en estado `"Enviando..."` indefinidamente.

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
Agregar estado `"timeout"` con mensaje: `"La solicitud tardó demasiado. Inténtalo de nuevo o escríbenos por WhatsApp."`

---

### BUG 69 — "aqui" sin acento EN DOS ARCHIVOS: useChat.ts y system-prompt.ts (5.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 20 y `src/lib/assistant/system-prompt.ts` línea 16

```ts
// useChat.ts línea 20:
content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?",
// system-prompt.ts línea 16:
Ya salude al usuario con: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?"
```

---

### BUG 70 — Error de red muestra string técnico al usuario (5.º día)
**Archivo:** `src/components/assistant/useChat.ts` líneas 129-131

Si `fetch` lanza un error de red (e.g., `"Failed to fetch"`, `"NetworkError"`), ese string técnico se muestra al candidato.

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

### BUG 71 — Widget de Kyo no cierra con tecla Escape (5.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 8

**Fix:**
```ts
useEffect(() => {
  const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
  document.addEventListener("keydown", handleEsc);
  return () => document.removeEventListener("keydown", handleEsc);
}, [open]);
```

---

### BUG 68 — Hero muestra "10+ Años exp." y "+7000 colocados" vs knowledge base (6.º día)
**Archivos:** `src/components/sections/Hero.tsx` líneas 107 y 158; `src/lib/assistant/knowledge.ts` líneas 78-79

- `Hero.tsx` línea 158: `"10+"` / `"Años exp."`
- `knowledge.ts` línea 79: `"Años en el mercado": "3+"`
- `Hero.tsx` línea 107: `"+7000 candidatos colocados"`
- `knowledge.ts` línea 78: `"Candidatos colocados": "687+"`

**Fix:** Unificar con los datos reales aprobados por el cliente en ambos archivos.

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (6.º día)
**Archivo:** `src/components/sections/Hero.tsx` línea 81

**Fix de 1 carácter:**
```tsx
placeholder="¿Qué puesto buscas?"
```

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (15.º día)
**Archivo:** `src/components/sections/Hero.tsx` líneas 5, 122, 132

**Fix:**
```tsx
<img src="/images/Hero2.jpg" alt="Trabajo operativo Kyoszen" className="object-cover w-full h-full" />
<img src="/images/Hero.jpg" alt="Equipo profesional Kyoszen" className="object-cover w-full h-full" />
```
Eliminar el import de `next/image` (línea 5).

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (15.º día)
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
Actualizar también `system-prompt.ts` para no referenciar marcas hardcoded.

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (29.º día sin fix)
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 210 y 227

`whitespace-pre-wrap` muestra `**texto**` sin renderizar. Fix unificado con BUG 65 (ver arriba).

---

### BUG 44 — Inconsistencia usted/tú en system prompt de Kyo (23.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 66-68

Las reglas usan "usted" pero el manejo de otros temas tutea: `"te conecto"` (línea 66), `"¿te ayudo"` (línea 67). Unificar a **usted** en todo el prompt.

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (29.º día)
**Archivo:** `src/app/vacantes/page.tsx` líneas 32 y 43

`"Mas de $20k"` → `"Más de $20k"`. Actualizar también la función `matchesSalario`.

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (29.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 38-42 y 148-153

Kyo puede decir "salario $12,000" sin aclarar si es neto o bruto. Añadir `salario_nota?: string` a `JobSummary` e incluirlo en el `.map()` de `listJobs()`.

---

### BUG 48 — Sin ARIA live region en el chat widget (29.º día)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 143

Fix de 1 línea:
```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="...">
```

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (29.º día)
**Archivo:** `src/app/vacantes/[id]/_content.tsx` línea 201

El fallback de `"MXN bruto"` es incorrecto para contratos por proyecto o jornadas parciales. Cambiar a `"mensual"` (neutro).

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (29.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 99 y `src/app/api/assistant/chat/route.ts` línea 131

El cliente envía todos los mensajes; el servidor trunca a los últimos 20. Con más de 20 mensajes se puede perder el nombre, puesto, experiencia, zona y jornada del candidato.

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (18.º día)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` líneas 56-58

El regex no hace match si hay query params o CDN personalizado. El `.catch(() => {})` oculta el fallo.

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (18.º día)
**Archivo:** `src/components/social/StoryboardView.tsx` línea 63

Cuando `storyboard.archivado` está presente, el admin ve un storyboard vacío. Añadir bloque con info del Drive + link antes del filmstrip.

---

### BUG 16 — Memory leak en `rateLimitMap` (29.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Añadir purga de entradas expiradas en `checkRateLimit()` o migrar a Upstash Redis.

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (29.º día)
**Archivo:** `src/app/vacantes/[id]/page.tsx` líneas 4-6

Las vacantes de Supabase con IDs distintos a los de `JOBS` no se prerenderizan. Eliminar `generateStaticParams()` completamente.

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

### Media prioridad

- **Avisar al candidato que puede seguir hablando con Kyo tras la navegación** — En Paso 5 de `system-prompt.ts` añadir: `"Le abro las vacantes en pantalla. Podemos seguir hablando aquí si tiene dudas."` Y en `useChat.ts` línea 127: incrementar el delay de navegación de 700ms a 1400ms.

- **Confirmación visual al aprobar en `/revisor`** — Toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Banner de progreso durante archivado a Drive** — El archivado puede tardar 30-120 s. Añadir spinner y deshabilitar botón durante la operación.

- **Timeout en fetch del chat** — `src/components/assistant/useChat.ts` línea 95. Añadir `AbortController` con 30 s.

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

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to` sin texto, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acentos, más usa "te" informal). Fix:
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

| # | Bug/Mejora | Esfuerzo | Impacto | Días |
|---|-----------|----------|---------|------|
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 29 |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 18 |
| 3 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 1 |
| 4 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 1 |
| 5 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | **NUEVO** |
| 6 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | **NUEVO** |
| 7 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | **NUEVO** |
| 8 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | **NUEVO** |
| 9 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 13 |
| 10 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 12 |
| 11 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 29 |
| 12 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 15 |
| 13 | BUG 68 — Hero "10+ años" vs knowledge "3+ años" | Bajo (1 min) | Alto | 6 |
| 14 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 15 |
| 15 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 16 |
| 16 | BUG 57 — `subirADrive` sin timeout | Bajo (5 min) | Alto | 18 |
| 17 | BUG 60 — `fetch(video_url)` sin timeout | Bajo (1 línea) | Alto | 17 |
| 18 | Variables `GOOGLE_*` en VPS (no es código) | Bajo (5 min) | Alto | 19 |
| 19 | BUG 67 — Placeholder Hero sin acento "¿Que puesto?" | Bajo (1 char) | Alto | 6 |
| 20 | BUG 53 / BUG 73 / BUG 74 — Acentos faltantes en AplicarModal | Bajo (5 min) | Alto | 29/4/4 |
| 21 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 29 |
| 22 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 5 |
| 23 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 5 |
| 24 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 4 |
| 25 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 4 |
| 26 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 3 |
| 27 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 3 |
| 28 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 5 |
| 29 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 23 |
| 30 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 29 |
| 31 | "Nueva conversacion" sin acento en ChatWidget | Bajo (1 min) | Medio | — |
| 32 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 29 |
| 33 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 18 |
| 34 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 35 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 29 |
| 36 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 18 |
| 37 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 29 |
| 38 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 29 |
| 39 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 40 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 41 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 42 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 43 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 44 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 45 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 46 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 47 | Tool register_talent_interest | Medio | Alto | — |
| 48 | PageHero vacantes con imagen Unsplash externa | Bajo (5 min) | Bajo | — |
| 49 | Tour novedad solo en pestaña Publicaciones | Bajo (1 línea) | Medio | — |
| 50 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 29 |
| 51 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 29 |
| 52 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 53 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 54 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
