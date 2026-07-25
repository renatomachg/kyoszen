# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-25
**Cambios analizados:** Commit `b8ace8f` — `feat(cuestionario): portal conversacional de onboarding + admin de respuestas`. Archivos revisados: `src/app/cuestionario/[token]/CuestionarioCliente.tsx`, `src/app/cuestionario/[token]/page.tsx`, `src/app/api/cuestionario/[token]/route.ts`, `src/app/api/cuestionario/[token]/enviar/route.ts`, `src/app/admin/(panel)/cuestionario/page.tsx`, `src/lib/cuestionario/index.ts`, `src/lib/cuestionario/tipos.ts`, `docs/cuestionario/preguntas.json`, `src/components/layout/PublicShell.tsx`. También: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`.

---

## Cambios Recientes Detectados

**Nuevo módulo: Portal conversacional de onboarding** (`/cuestionario/[token]`). Permite al equipo de Kyoszen (admin) crear invitaciones con token único y enviarlas al cliente para que llene un cuestionario sobre cómo operan sus cursos actualmente. Flujo paso-a-paso con auto-guardado, lógica condicional por respuesta, pantalla de revisión final y envío. Panel admin en `/admin/cuestionario` para crear/ver/borrar invitaciones y leer respuestas en un slide-over lateral.

---

## 🔴 BUGS NUEVOS — DETECTADOS HOY

### BUG 104 — `cierre.titulo` hardcodeado a "Rosy" → cualquier otro invitado verá "¡Listo, Rosy!" (1.er día)
**Archivo:** `docs/cuestionario/preguntas.json` línea 417 y `src/app/cuestionario/[token]/CuestionarioCliente.tsx` línea 341

El JSON tiene `"titulo": "¡Listo, Rosy! 🙌"`. `CuestionarioCliente` usa `{CUESTIONARIO.cierre.titulo}` directamente sin personalización. Si se crea un cuestionario para Monse, Héctor o cualquier otro invitado, la pantalla de cierre dirá "Rosy".

**Fix en `CuestionarioCliente.tsx` línea 341:**
```tsx
<h1>
  {invitadoNombre
    ? `¡Listo, ${invitadoNombre}! 🙌`
    : CUESTIONARIO.cierre.titulo}
</h1>
```

---

### BUG 105 — `cierre.texto` menciona "Renato" por nombre — dato interno expuesto al cliente (1.er día)
**Archivo:** `docs/cuestionario/preguntas.json` línea 418

```json
"texto": "Gracias. Con esto Renato ya puede armar la plataforma de cursos a la medida de Kyoszen."
```

El cliente ve el nombre del desarrollador interno. Poco profesional y puede confundir.

**Fix en `preguntas.json` línea 418:**
```json
"texto": "Gracias. Con esto ya podemos armar la plataforma de cursos exactamente a la medida de Kyoszen. Si algo cambia, siempre podemos ajustarlo."
```

---

### BUG 106 — Sin notificación al admin cuando se completa el cuestionario (1.er día)
**Archivo:** `src/app/api/cuestionario/[token]/enviar/route.ts` línea 37

El endpoint solo hace `UPDATE completado=true` en Supabase y devuelve `{ ok: true }`. No envía correo a `renatomachg@gmail.com`. El admin solo puede enterarse revisando el panel manualmente.

**Fix — añadir notificación SMTP al final de `enviar/route.ts`** (misma lógica que `/api/revisor/posts/[id]/status`):
```ts
// Fire-and-forget
const { data: configRows } = await sb.from("site_config").select("key, value");
const cfg = Object.fromEntries((configRows ?? []).map((r) => [r.key, r.value]));
if (cfg.smtp_host && cfg.smtp_user && cfg.smtp_pass) {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.default.createTransport({
    host: cfg.smtp_host, port: Number(cfg.smtp_port ?? 465), secure: true,
    auth: { user: cfg.smtp_user, pass: cfg.smtp_pass },
  });
  transporter.sendMail({
    from: { name: "Kyoszen Cuestionario", address: cfg.smtp_user },
    to: "renatomachg@gmail.com",
    subject: `✅ Cuestionario completado — token: ${token}`,
    text: `El cuestionario de onboarding con token "${token}" acaba de ser completado.\n\nRevísalo en /admin/cuestionario`,
  }).catch(() => {});
}
```

---

### BUG 107 — PATCH de autosave no ignora cuestionarios completados → permite sobreescribir tras enviar (1.er día)
**Archivo:** `src/app/api/cuestionario/[token]/route.ts` línea 41

El autosave hace PATCH cada vez que el estado cambia (600ms debounce). Si el usuario hace click en "Enviar" y luego navega hacia atrás (botón "Ver de nuevo"), el estado `completado=false` en React desencadenaría un nuevo autosave con respuestas potencialmente modificadas, aunque `completado` en BD ya sea `true`.

**Fix — ignorar silenciosamente si ya está completado:**
```ts
// Al inicio del handler PATCH:
const { data: actual } = await sb
  .from("cuestionario_respuestas")
  .select("completado")
  .eq("token", token)
  .maybeSingle();
if (actual?.completado) {
  return NextResponse.json({ ok: true }); // ya enviado, no tocar
}
```

---

### BUG 108 — `etiquetaRespuesta` duplicada entre componente y librería (1.er día)
**Archivos:** `src/app/cuestionario/[token]/CuestionarioCliente.tsx` líneas 81-100 y `src/lib/cuestionario/index.ts` líneas 80-103

La función `etiquetaRespuesta` está implementada dos veces con lógica casi idéntica. La del componente no usa el import del lib (`etiquetaRespuesta` ya está exportada de `@/lib/cuestionario`).

**Fix en `CuestionarioCliente.tsx`:** Eliminar la función local (líneas 81-100) e importar la existente:
```ts
import { CUESTIONARIO, esVisible, estaRespondida, preguntasVisibles, progreso, etiquetaRespuesta } from "@/lib/cuestionario";
```
Elimina ~20 líneas y garantiza una sola fuente de verdad.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (acumulados)

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (44.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase. El system prompt construye el listado desde `knowledge.listJobs()` — si Supabase tiene vacantes distintas, Kyo da información errónea.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true` y registrar en línea 167.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (44.º día — LFPDPPP)
**Archivo:** `src/components/assistant/useChat.ts` línea 81

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```

El nombre del candidato y cualquier dato que mencione quedan textual en `site_eventos.valor`. Riesgo legal LFPDPPP.

**Fix de 1 línea:**
```ts
logEvent("kyo_mensaje", `[${trimmed.length} chars]`);
```

---

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (33.º día sin fix)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 12

Cualquier request HTTP con un `id` válido puede desencadenar el archivado sin autenticación.

**Fix:** Verificar sesión de Supabase con `createServerClient` + `cookies()` antes de actuar.

---

### BUG 98 — SMTP `from` con string template en proyectos → error 501 en IONOS (4.º día sin fix)
**Archivo:** `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/status/route.ts` línea 66

```ts
from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
```

CLAUDE.md documenta que IONOS da error 501 con ese formato. Las notificaciones de proyectos fallan silenciosamente.

**Fix:** `from: { name: "Kyoszen Revisor", address: smtp.smtp_from ?? smtp.smtp_user },`

---

### BUG 102 — Sin timeout server-side en API de Anthropic → usuario ve "escribiendo..." indefinidamente (2.º día)
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 148-193

El bucle de tool-use llama a `client.messages.create()` hasta 5 veces sin `AbortSignal`. Si Anthropic tarda, el usuario ve el spinner hasta que Next.js corta la conexión.

**Fix — Race contra timeout:**
```ts
const result = await Promise.race([
  runLoop(),
  new Promise<null>((resolve) => setTimeout(() => resolve(null), 22_000)),
]);
if (!result) return NextResponse.json({ error: "El asistente tardó demasiado. Intenta de nuevo." }, { status: 504 });
```

---

### BUG 91 — `INITIAL_GREETING` hardcodeado desincronizado del system prompt (6.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 18 y `src/lib/assistant/system-prompt.ts` línea 16

Si el admin edita el saludo desde el panel de Kyo, el system prompt se actualiza pero el widget muestra el saludo original.

**Fix:** Exportar `KYO_GREETING` desde `system-prompt.ts` e importarlo en `useChat.ts`.

---

### BUG 78 — `PropuestaEditor` sin confirmación antes de enviar correo al cliente (16.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

Clic accidental en "📨 Guardar y avisar al cliente" envía correo a Rosy y Monse sin diálogo de confirmación.

**Fix:** `if (!window.confirm("¿Guardar y notificar a las revisoras ahora?")) return;`

---

### BUG 79 — `PostModal.save()` cierra modal sin verificar si el fetch falló (16.º día sin fix)
`onSaved(); onClose()` se llaman siempre, incluso si la respuesta del servidor fue error.

**Fix:** Verificar `res.ok` antes de llamar callbacks de éxito.

---

## 🟠 BUGS PENDIENTES — ALTA PRIORIDAD

### BUG 99 — Cursos de Supabase no llegan a Kyo (3.er día)
`StaticKnowledgeProvider.listCourses()` lee de `COURSES` hardcoded. Cursos nuevos del admin no aparecen en Kyo.

---

### BUG 100 — `kyo_faqs` de Supabase no alimentan a Kyo (3.er día)
`getCompanyInfo().faqs` devuelve las 5 FAQs hardcodeadas. La tabla `kyo_faqs` nunca se lee.

---

### BUG 103 — `matchesQuery()` no normaliza acentos → búsquedas fallan con diacríticos (2.º día)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 108

**Fix de 5 líneas:**
```ts
function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function matchesQuery(text: string, query: string | undefined): boolean {
  if (!query) return true;
  return normalizar(text).includes(normalizar(query));
}
```

---

### BUG 92 — `aprobarPendientes()` secuencial sin atomicidad → estado parcial si falla (4.º día)
**Fix:** Usar `Promise.allSettled` para paralelizar y detectar fallos parciales.

---

### BUG 93 — Modal de proyectos usa `onMouseDown` para cerrar → cierra al arrastrar texto (4.º día)
**Fix de 2 líneas:** `onClick={onClose}` en el overlay, `onClick={e => e.stopPropagation()}` en el panel.

---

### BUG 97 — "Aprobar todas las pendientes" sin confirmación → aprobación masiva accidental (4.º día)
**Fix:** `if (!window.confirm(\`¿Aprobar las ${progreso.pendiente} escenas pendientes?\`)) return;`

---

### BUG 101 — `DetalleProyecto` modal sin botón "Reintentar" al fallar la carga (3.er día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx`

---

### BUG 89 — `deletePost()` sin `res.ok` (11.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

---

### BUG 90 — `togglePublicado()` sin `res.ok` — UI diverge de BD (11.º día)

---

### BUG 86 — Tres funciones de movimiento sin `res.ok` (12.º día)
`moverPostPeriodo`, `moverPostAFecha`, `intercambiarFechas`

---

### BUG 87 — Input de fecha activo mientras `moving` está en curso (12.º día)
**Fix de 1 atributo:** `<input type="date" disabled={moving} ...>`

---

### BUG 84 — `StoryboardEditor` y `GuiaTecnicaEditor` sin `onSaved()` tras guardar (13.º día)

---

### BUG 85 — `key={i}` en beats de montaje → reorders causan pérdidas de foco (13.º día)

---

### BUG 80 — Botón × del último cuadro/beat sin `disabled` (16.º día)

---

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar (16.º día)

---

### BUG 82 — Triple caption divergente sin sincronización (16.º día)

---

### BUG 83 — Cuadros con solo `tipo` se filtran silenciosamente al guardar (16.º día)

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (33.º día)

---

### BUG 60 — `fetch(version.video_url)` sin timeout (32.º día)

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (31.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 85-86

`"Estado de Mexico"` y `"Hibrido"` (sin acentos) no coinciden con los valores de `/vacantes?ubicacion=Estado de México`.

---

### BUG 76 — Input de Kyo sin `maxLength` (18.º día)

---

### BUG 77 — Sin focus trap en ChatWidget (18.º día)

---

### BUG 72 — AplicarModal no cierra con tecla Escape (19.º día)

---

### BUG 73/74 — Acentos faltantes en AplicarModal y "Si, todo en orden" (19.º día)

---

### BUG 75 — AplicarModal fetch sin timeout (19.º día)

---

### BUG 69 — "aqui" sin acento en DOS archivos (20.º día)

---

### BUG 70 — Error de red muestra string técnico al usuario en Kyo (20.º día)

---

### BUG 71 — Widget de Kyo no cierra con tecla Escape (20.º día)

---

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (28.º día)

---

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs (27.º día)

---

### BUG 68 — Hero muestra datos inconsistentes: `10+ años / 7000+ colocados` vs `3+ / 687+` en knowledge.ts (21.º día)

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (21.º día)

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (30.º día)

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (30.º día)

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (44.º día)

---

### BUG 44 — Inconsistencia usted/tú en system prompt (38.º día)

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (44.º día)

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (44.º día)

---

### BUG 48 — Sin ARIA live region en el chat widget (44.º día)

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (44.º día)

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (44.º día)

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (33.º día)

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (33.º día)

---

### BUG 16 — Memory leak en `rateLimitMap` (44.º día)

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (44.º día)

---

### BUG 94 — Guía de uso no menciona la pestaña "🎬 Proyectos" (4.º día)

---

### BUG 95 — Tour `showGuia`/`showNovedad` ignora la pestaña activa (4.º día)

---

### BUG 96 — `loadPosts()` hace 4 fetches completos al cambiar de semana (4.º día)

---

## Sugerencias de UX

### Alta prioridad

- **[CUESTIONARIO] Indicador de estado del autosave** — `CuestionarioCliente.tsx` línea 550. El footer siempre muestra "✓ Tu avance se guarda solo" sin cambiar si hay un error de red. Agregar estado `saveStatus: 'ok' | 'saving' | 'error'` y mostrar "⚠ No se pudo guardar, reintentando..." en rojo cuando `saveStatus === 'error'`.

- **[CUESTIONARIO] Confirmación antes de enviar** — `CuestionarioCliente.tsx` línea 247. El envío es irreversible (marca `completado=true`). La pantalla de revisión ya existe, pero el botón "Enviar respuestas" actúa sin diálogo adicional. Considerar un breve mensaje inline: `"Una vez enviado no podrás modificar las respuestas."` justo encima del botón cuando `paso === PASO_REVISION`.

- **[CUESTIONARIO] Slide-over admin sin handler de tecla Escape** — `src/app/admin/(panel)/cuestionario/page.tsx` línea 418. El `div` con `role="dialog"` usa `onMouseDown` para cerrar pero no captura `Escape`. Fix:
  ```ts
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") setSeleccionada(null); };
    if (seleccionada) document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [seleccionada]);
  ```

- **Barra CTA sticky en mobile (vacantes/[id])** — El sidebar `sticky top-28` solo aparece en `lg:`. En mobile el candidato hace scroll hasta el fondo sin CTA. Añadir barra fija en bottom exclusiva para mobile.

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx`. Cuando no hay resultados no hay salida. Añadir botón que dispare `CustomEvent("kyo:open")`.

### Media prioridad

- **[CUESTIONARIO] `autoAvance` de 260ms demasiado rápido en touch** — `CuestionarioCliente.tsx` línea 212. En opciones `single`, al tocar en mobile, el estado de selección es casi invisible antes de que cambie la pantalla. Aumentar a 400ms da mejor feedback visual:
  ```ts
  autoAvanceRef.current = setTimeout(() => avanzar(siguientes), 400);
  ```

- **[CUESTIONARIO] Logo real en lugar de inicial "K"** — `CuestionarioCliente.tsx` línea 309. El logo de Kyoszen está en Supabase Storage (`brand/kyoszen-icon.png`). Usar `<img src="/redes/..." />` o la URL de Storage sería más profesional para el portal del cliente.

- **[CUESTIONARIO] Ícono de transición "↗" sin semántica clara** — `CuestionarioCliente.tsx` línea 420. La pantalla de transición entre secciones muestra `↗` como decoración. Cambiar a `✓` o el emoji del `titulo` (`✅` que ya aparece en la transición de cursos a vacantes) sería más intuitivo.

- **Confirmación visual al aprobar en `/revisor`** — Toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Notificación al cliente al publicar video TikTok** — Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos.

- **`enterKeyHint="send"` en input de Kyo** — `ChatWidget.tsx` línea 170. En teclados virtuales de iOS/Android muestra "enviar".

### Baja prioridad

- **[CUESTIONARIO] `cuantos` hardcodea "75 cursos en 11 áreas"** — `docs/cuestionario/preguntas.json` línea 309. Este dato del catálogo real puede cambiar. Si se usa este cuestionario en el futuro con datos distintos, la pregunta será incorrecta. Reescribir como pregunta abierta: `"¿Cuántos cursos tienen actualmente y con cuáles quieren arrancar?"`.

- **Tour de novedad solo en pestaña Publicaciones** — `src/app/revisor/page.tsx` línea 936.
- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true`.
- **Avatares externos de pravatar.cc en Hero** — Reemplazar con SVGs genéricos.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 6 sin manejo de rechazo** — Añadir al Paso 6 en `system-prompt.ts`:
  ```
  Si el candidato rechaza todas las opciones:
  "Entiendo, [nombre]. Puedo registrar su perfil en nuestro banco de talentos para avisarle cuando surja una oportunidad. ¿Le parece bien?"
  Navegar a /contacto.
  ```

- **Mencionar las 24 h de respuesta en Paso 5** — El dato más persuasivo no aparece en el pitch de recomendación. Añadir: `"Nuestro equipo le contacta en menos de 24 horas hábiles."` al formato del Paso 5 (`system-prompt.ts` líneas 44-56).

- **Resumen de perfil en Paso 4** — Al completar Pasos 0-4, sintetizar: `"Perfil capturado: [nombre], [puesto], [N años], zona [X], [jornada]."` Protege contra el truncado de contexto (BUG 52).

- **Manejo de empresa confidencial en Paso 5** — Añadir en system prompt: `"Si la empresa es 'Confidencial', no la menciones. Di: «Empresa confidencial»."` (`system-prompt.ts` línea 52).

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge jornada en el Paso 4 pero `search_jobs` no acepta ese parámetro. Añadir:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  También actualizar `listJobs()` en `knowledge.ts` para aplicar estos filtros.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, crear registro en Supabase directamente desde Kyo sin que el candidato llene el formulario manualmente.

- **Mención del cuestionario de cursos para empresas** — El nuevo módulo `cuestionario` es para onboarding de clientes de cursos. Agregar en `knowledge.ts` / `COMPANY.services`:
  ```ts
  { name: "Plataforma de Capacitación", description: "Digitalización de la operación de cursos: catálogo en línea, control de alumnos, constancias automáticas." }
  ```
  Para que Kyo pueda mencionarlo cuando una empresa pregunte por capacitación interna.

### Problemas detectados

- **Fallback sin acentos cuando solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. `"Entendido, ¿en que mas te puedo ayudar?"` carece de acentos y usa tono incorrecto (tuteo).

  **Fix:**
  ```ts
  const replyContent = finalText
    || (navigations.length > 0 ? "Le abro esa sección ahora mismo." : "Entendido, ¿en qué más le puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` con poco margen** — Paso 5 óptimo = `search_jobs` + `get_job_details ×2` + `navigate_to` = 4 iteraciones. Solo 1 de margen. Subir a 8.

- **`getStoredInstrucciones()` usa anon key** — Si RLS de `kyo_config` se endurece, falla silenciosamente. Usar `sbAdmin` (service role).

- **Cursos y FAQs de Supabase no llegan a Kyo** — BUG 99 y BUG 100.

---

## Oportunidades de mejora general

- **Variables `GOOGLE_*` pendientes en el VPS** — El botón "🗄️ Liberar espacio" devuelve 503 en producción. Añadir las 4 vars al `ecosystem.config.js` del VPS es un deploy de 5 minutos sin código nuevo.

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts`.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — 5 s mirando "Sin resultados" + bubble proactivo de Kyo.

- **Auditoría de auth en todos los endpoints `/api/admin/`** — BUG 56 reveló que `archivar-video` no verifica sesión. Revisar todos los demás endpoints admin del mismo patrón.

- **Sistema de prompts dinámico para Kyo** — El cache de `instrucciones` (60 s) debería extenderse también a `kyo_faqs`, vacantes y cursos de Supabase (BUG 100, 99, 1).

---

## Prioridad de acción acumulada

| # | Bug/Mejora | Esfuerzo | Impacto | Días |
|---|-----------|----------|---------|------|
| 1 | BUG 104 — cierre.titulo hardcodeado a "Rosy" | Bajo (3 líneas) | Alto | 1 |
| 2 | BUG 105 — cierre.texto menciona "Renato" al cliente | Bajo (1 línea JSON) | Alto | 1 |
| 3 | BUG 106 — Sin notificación al admin al completar cuestionario | Bajo (30 min) | Alto | 1 |
| 4 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 44 |
| 5 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 33 |
| 6 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 44 |
| 7 | BUG 98 — SMTP from template string → error 501 IONOS | Bajo (1 línea) | Crítico | 4 |
| 8 | BUG 102 — Sin timeout server-side en Anthropic API | Bajo (20 min) | Crítico | 2 |
| 9 | BUG 107 — PATCH autosave no ignora cuestionarios completados | Bajo (10 min) | Medio | 1 |
| 10 | BUG 108 — etiquetaRespuesta duplicada en componente | Bajo (5 min) | Bajo | 1 |
| 11 | BUG 99 — Cursos de Supabase no llegan a Kyo | Alto | Alto | 3 |
| 12 | BUG 100 — kyo_faqs de Supabase no alimentan a Kyo | Bajo (30 min) | Alto | 3 |
| 13 | BUG 92 — aprobarPendientes() secuencial sin rollback | Bajo (15 min) | Alto | 4 |
| 14 | BUG 91 — INITIAL_GREETING desincronizado del system prompt | Bajo (10 min) | Alto | 6 |
| 15 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 16 |
| 16 | BUG 89 — deletePost() sin res.ok | Bajo (10 min) | Alto | 11 |
| 17 | BUG 90 — togglePublicado() sin res.ok | Bajo (10 min) | Alto | 11 |
| 18 | BUG 86 — moverPost* sin res.ok (3 funciones) | Bajo (15 min) | Alto | 12 |
| 19 | BUG 103 — matchesQuery() no normaliza acentos | Bajo (10 min) | Alto | 2 |
| 20 | BUG 93 — onMouseDown para cerrar modal proyectos | Bajo (2 líneas) | Medio | 4 |
| 21 | BUG 97 — "Aprobar todas" sin confirmación | Bajo (10 min) | Alto | 4 |
| 22 | BUG 101 — DetalleProyecto sin botón Reintentar | Bajo (10 min) | Medio | 3 |
| 23 | BUG 94 — Guía de uso sin paso de Proyectos | Bajo (10 min) | Medio | 4 |
| 24 | BUG 95 — Tour/novedad sin guard de sección activa | Bajo (10 min) | Medio | 4 |
| 25 | BUG 96 — 4 fetches redundantes al cambiar periodo | Bajo (20 min) | Medio | 4 |
| 26 | [CQ] Slide-over admin sin handler de Escape | Bajo (10 min) | Medio | 1 |
| 27 | BUG 87 — Input fecha activo mientras moving=true | Bajo (1 atrib) | Bajo | 12 |
| 28 | BUG 84 — StoryboardEditor/GuiaTecnicaEditor sin onSaved() | Bajo (10 min) | Alto | 13 |
| 29 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 16 |
| 30 | BUG 85 — key={i} en beats de montaje | Bajo (10 min) | Alto | 13 |
| 31 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | 16 |
| 32 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | 16 |
| 33 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | 16 |
| 34 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | 16 |
| 35 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 28 |
| 36 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 27 |
| 37 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 30 |
| 38 | BUG 68 — Hero "10+ años / 7000+ colocados" vs datos reales | Bajo (1 min) | Alto | 21 |
| 39 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 30 |
| 40 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 31 |
| 41 | BUG 57 — subirADrive sin timeout | Bajo (5 min) | Alto | 33 |
| 42 | BUG 60 — fetch(video_url) sin timeout | Bajo (1 línea) | Alto | 32 |
| 43 | Variables GOOGLE_* en VPS | Bajo (5 min) | Alto | 34 |
| 44 | BUG 67 — Placeholder Hero sin acento | Bajo (1 char) | Alto | 21 |
| 45 | BUG 53/73/74 — Acentos en AplicarModal | Bajo (5 min) | Alto | 19 |
| 46 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 44 |
| 47 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 20 |
| 48 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 20 |
| 49 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 19 |
| 50 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 19 |
| 51 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 18 |
| 52 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 18 |
| 53 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 20 |
| 54 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 38 |
| 55 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 44 |
| 56 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 44 |
| 57 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 33 |
| 58 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 59 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 44 |
| 60 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 33 |
| 61 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 44 |
| 62 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 44 |
| 63 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 64 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 65 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 66 | Proyectos: badge urgencia en tarjeta | Bajo (CSS) | Medio | — |
| 67 | Proyectos: hover state en tarjetas | Bajo (CSS) | Bajo | — |
| 68 | Proyectos: role="tabpanel" faltante | Bajo (1 atrib) | Bajo | — |
| 69 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 70 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 71 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 72 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 73 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 74 | Tool register_talent_interest | Medio | Alto | — |
| 75 | Tour novedad solo en pestaña Publicaciones | Bajo (1 línea) | Medio | — |
| 76 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 44 |
| 77 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 44 |
| 78 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 79 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 80 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
| 81 | Sistema de prompts dinámico para Kyo (faqs+cursos+vacantes) | Alto | Alto | — |
| 82 | Mencionar plataforma de cursos en knowledge.ts | Bajo (10 min) | Medio | — |
| 83 | [CQ] autoAvance 260ms → 400ms en touch | Bajo (1 línea) | Bajo | 1 |
| 84 | [CQ] Logo real en lugar de inicial "K" | Bajo (15 min) | Bajo | 1 |
| 85 | [CQ] "75 cursos en 11 áreas" hardcodeado | Bajo (editar JSON) | Bajo | 1 |
