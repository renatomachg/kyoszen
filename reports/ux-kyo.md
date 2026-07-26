# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-26
**Cambios analizados:** Commits `14ae7f5` (CRM: base de candidatos + pipeline + matching) y `bac2e2e` (merge). Archivos revisados: `src/app/admin/(panel)/crm/page.tsx`, `src/app/admin/(panel)/crm/MatchingPanel.tsx`, `src/lib/crm/matching.ts`, `src/lib/crm/tipos.ts`, `src/lib/crm/index.ts`, `src/app/api/admin/crm/*`. También: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`.

---

## Cambios Recientes Detectados

**Nuevo módulo: CRM de candidatos** (`/admin/crm`). Evoluciona el inbox de aplicaciones a una base de candidatos con pipeline (nuevo → contactado → entrevista → enviado → contratado → descartado), timeline de notas y motor de matching por vacante. El sincronizador consolida aplicaciones en candidatos deduplicando por correo/WhatsApp. La pestaña "Matching" muestra un ranking de candidatos históricos para la vacante activa seleccionada, con score 0–100 basado en zona geográfica (40 pts), categoría de vacante (35 pts) y keywords en experiencia (25 pts).

---

## 🔴 BUGS NUEVOS — DETECTADOS HOY

### BUG 109 — `MatchingPanel` usa anon key directamente para leer vacantes (1.er día)
**Archivo:** `src/app/admin/(panel)/crm/MatchingPanel.tsx` línea 66

El componente importa `supabase` de `@/lib/supabase` (anon key) y hace query directo a `vacantes` desde el cliente. Es el único componente del panel admin que salta la capa de API route. Si RLS se endurece o el anon key cambia, el matching falla silenciosamente. El patrón del proyecto es usar `/api/admin/*` con service role.

**Fix:** Crear endpoint `GET /api/admin/crm/vacantes` usando `sbAdmin` y sustituir el `useEffect` del query directo:
```ts
// MatchingPanel.tsx línea 64 — reemplazar
const { data, error } = await supabase.from("vacantes").select(...).eq("activa", true)...
// por:
const response = await fetch("/api/admin/crm/vacantes", { cache: "no-store" });
const data = await leerRespuesta<{ vacantes: VacanteOpcion[] }>(response);
setVacantes(data.vacantes);
```

---

### BUG 110 — `etiquetaEstado` duplicada en `crm/page.tsx` y `MatchingPanel.tsx` (1.er día)
**Archivos:** `src/app/admin/(panel)/crm/page.tsx` línea 65 y `src/app/admin/(panel)/crm/MatchingPanel.tsx` línea 35

La misma función `etiquetaEstado` está definida en ambos archivos. Si cambian los estados en `ESTADOS`, hay que actualizar dos copias.

**Fix:** Exportar desde `src/lib/crm/index.ts`:
```ts
export function etiquetaEstado(estado: EstadoPipeline) {
  return ESTADOS.find((item) => item.value === estado) ?? ESTADOS[0];
}
```
Y eliminar las copias locales.

---

### BUG 111 — `leerRespuesta<T>` duplicada en `crm/page.tsx` y `MatchingPanel.tsx` (1.er día)
**Archivos:** `src/app/admin/(panel)/crm/page.tsx` línea 45 y `src/app/admin/(panel)/crm/MatchingPanel.tsx` línea 39

La misma función auxiliar de fetch tipado está definida en ambos archivos.

**Fix:** Exportarla desde `src/lib/crm/index.ts` e importarla en ambos componentes.

---

### BUG 112 — Formulario "Nuevo candidato" sin campo `experiencia` → score keyword siempre 0 (1.er día)
**Archivo:** `src/app/admin/(panel)/crm/page.tsx` líneas 397-437

El formulario manual tiene nombre, correo, WhatsApp, ubicación. No tiene `experiencia`. Sin embargo, `experiencia` es el campo clave para el matching por palabras clave (`matching.ts` línea 109: `tokenizar(candidato.experiencia ?? "")`). Un candidato creado manualmente siempre tendrá 0 puntos en la dimensión de keywords — reduciendo su score máximo a 75/100.

**Fix:** Añadir al formulario `FormularioNuevo`:
```tsx
<CampoNuevo
  label="Experiencia (puestos, skills)"
  value={formulario.experiencia}
  onChange={(value) => setFormulario((prev) => ({ ...prev, experiencia: value }))}
/>
```
Y añadir `experiencia: ""` a `FORMULARIO_VACIO` + al body del POST en `candidatos/route.ts`.

---

### BUG 113 — Matching no distingue "sin candidatos en CRM" de "candidatos sin coincidencia" (1.er día)
**Archivo:** `src/app/admin/(panel)/crm/MatchingPanel.tsx` línea 196 y `src/lib/crm/matching.ts` línea 132

`.filter((resultado) => resultado.score > 0)` filtra candidatos con score cero. Si hay 50 candidatos pero ninguno embona, el panel muestra el mismo empty state que si no hay candidatos en el CRM. El admin no sabe si el banco está vacío o si simplemente no hay match.

**Fix — API `match/route.ts`:** Retornar el total analizado:
```ts
return NextResponse.json({ vacante, resultados, totalAnalizados: candidatos.length });
```
**Fix — `MatchingPanel.tsx`:** Mostrar contexto en el empty state:
```tsx
<p className="text-[13px] font-bold text-navy">
  {ranking.totalAnalizados === 0
    ? "No hay candidatos en el CRM todavía. Sincroniza aplicaciones primero."
    : `Se analizaron ${ranking.totalAnalizados} candidatos — ninguno embona con esta vacante.`}
</p>
```

---

### BUG 114 — `colorScore()` usa colores hardcodeados sin relación a la paleta del proyecto (1.er día)
**Archivo:** `src/app/admin/(panel)/crm/MatchingPanel.tsx` líneas 29-33

```ts
if (score >= 66) return "bg-green-100 text-green-700";
if (score >= 33) return "bg-blue-soft text-blue-dark";
return "bg-gray-100 text-gray-600";
```

Los colores son Tailwind genéricos, no las variables CSS del proyecto (`--color-blue`, `--color-navy`). Si el tema cambia, estos colores quedan desactualizados.

**Fix menor:** Usar clases del proyecto o CSS custom:
```ts
if (score >= 66) return "bg-green-50 text-green-800 border border-green-200";
if (score >= 33) return "bg-blue-soft text-navy border border-blue/20";
return "bg-bg text-muted border border-border";
```

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (acumulados)

### BUG 1 — Kyo recomienda vacantes demo, no de Supabase (45.º día sin fix)
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `JOBS` hardcoded en `@/lib/jobs`. El Paso 5 recomienda IDs que generan 404 en producción porque las vacantes reales están en Supabase.

**Fix:** Crear `SupabaseKnowledgeProvider` que use `sbAdmin` para leer `vacantes` donde `activa = true` y registrar en línea 167.

---

### BUG 55 — `kyo_mensaje` graba datos personales en analytics (45.º día — LFPDPPP)
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

### BUG 56 — Endpoint `archivar-video` sin verificación de sesión admin (34.º día sin fix)
**Archivo:** `src/app/api/admin/social/posts/[id]/archivar-video/route.ts` línea 12

Cualquier request HTTP con un `id` válido puede desencadenar el archivado sin autenticación.

**Fix:** Verificar sesión de Supabase con `createServerClient` + `cookies()` antes de actuar.

---

### BUG 98 — SMTP `from` con string template en proyectos → error 501 en IONOS (5.º día sin fix)
**Archivo:** `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/status/route.ts` línea 66

```ts
from: `"Kyoszen Revisor" <${smtp.smtp_from ?? smtp.smtp_user}>`,
```

CLAUDE.md documenta que IONOS da error 501 con ese formato. Las notificaciones de proyectos fallan silenciosamente.

**Fix:** `from: { name: "Kyoszen Revisor", address: smtp.smtp_from ?? smtp.smtp_user },`

---

### BUG 102 — Sin timeout server-side en API de Anthropic → usuario ve "escribiendo..." indefinidamente (3.er día)
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

### BUG 91 — `INITIAL_GREETING` hardcodeado desincronizado del system prompt (7.º día)
**Archivos:** `src/components/assistant/useChat.ts` línea 18 y `src/lib/assistant/system-prompt.ts` línea 16

Si el admin edita el saludo desde el panel de Kyo, el system prompt se actualiza pero el widget muestra el saludo original.

**Fix:** Exportar `KYO_GREETING` desde `system-prompt.ts` e importarlo en `useChat.ts`.

---

### BUG 78 — `PropuestaEditor` sin confirmación antes de enviar correo al cliente (17.º día sin fix)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

Clic accidental en "📨 Guardar y avisar al cliente" envía correo a Rosy y Monse sin diálogo de confirmación.

**Fix:** `if (!window.confirm("¿Guardar y notificar a las revisoras ahora?")) return;`

---

### BUG 79 — `PostModal.save()` cierra modal sin verificar si el fetch falló (17.º día sin fix)
`onSaved(); onClose()` se llaman siempre, incluso si la respuesta del servidor fue error.

**Fix:** Verificar `res.ok` antes de llamar callbacks de éxito.

---

## 🟠 BUGS PENDIENTES — ALTA PRIORIDAD

### BUG 99 — Cursos de Supabase no llegan a Kyo (4.º día)
`StaticKnowledgeProvider.listCourses()` lee de `COURSES` hardcoded. Cursos nuevos del admin no aparecen en Kyo.

---

### BUG 100 — `kyo_faqs` de Supabase no alimentan a Kyo (4.º día)
`getCompanyInfo().faqs` devuelve las 5 FAQs hardcodeadas. La tabla `kyo_faqs` nunca se lee.

---

### BUG 103 — `matchesQuery()` no normaliza acentos → búsquedas fallan con diacríticos (3.er día)
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

### BUG 92 — `aprobarPendientes()` secuencial sin atomicidad → estado parcial si falla (5.º día)
**Fix:** Usar `Promise.allSettled` para paralelizar y detectar fallos parciales.

---

### BUG 93 — Modal de proyectos usa `onMouseDown` para cerrar → cierra al arrastrar texto (5.º día)
**Fix de 2 líneas:** `onClick={onClose}` en el overlay, `onClick={e => e.stopPropagation()}` en el panel.

---

### BUG 97 — "Aprobar todas las pendientes" sin confirmación → aprobación masiva accidental (5.º día)
**Fix:** `if (!window.confirm(\`¿Aprobar las ${progreso.pendiente} escenas pendientes?\`)) return;`

---

### BUG 101 — `DetalleProyecto` modal sin botón "Reintentar" al fallar la carga (4.º día)
**Archivo:** `src/components/revisor/ProyectosCliente.tsx`

---

### BUG 89 — `deletePost()` sin `res.ok` (12.º día)
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx`

---

### BUG 90 — `togglePublicado()` sin `res.ok` — UI diverge de BD (12.º día)

---

### BUG 86 — Tres funciones de movimiento sin `res.ok` (13.º día)
`moverPostPeriodo`, `moverPostAFecha`, `intercambiarFechas`

---

### BUG 87 — Input de fecha activo mientras `moving` está en curso (13.º día)
**Fix de 1 atributo:** `<input type="date" disabled={moving} ...>`

---

### BUG 84 — `StoryboardEditor` y `GuiaTecnicaEditor` sin `onSaved()` tras guardar (14.º día)

---

### BUG 85 — `key={i}` en beats de montaje → reorders causan pérdidas de foco (14.º día)

---

### BUG 80 — Botón × del último cuadro/beat sin `disabled` (17.º día)

---

### BUG 81 — Cambios sin guardar se pierden silenciosamente al cancelar (17.º día)

---

### BUG 82 — Triple caption divergente sin sincronización (17.º día)

---

### BUG 83 — Cuadros con solo `tipo` se filtran silenciosamente al guardar (17.º día)

---

### BUG 57 — `subirADrive()` sin timeout — bloquea hasta 5 min si Google falla (34.º día)

---

### BUG 60 — `fetch(version.video_url)` sin timeout (33.º día)

---

### BUG 61 — Filtros de navegación en Kyo con acentos faltantes → filtros silenciosos (32.º día)
**Archivo:** `src/lib/assistant/system-prompt.ts` líneas 85-86

`"Estado de Mexico"` y `"Hibrido"` (sin acentos) no coinciden con los valores de `/vacantes?ubicacion=Estado de México`.

---

### BUG 76 — Input de Kyo sin `maxLength` (19.º día)

---

### BUG 77 — Sin focus trap en ChatWidget (19.º día)

---

### BUG 72 — AplicarModal no cierra con tecla Escape (20.º día)

---

### BUG 73/74 — Acentos faltantes en AplicarModal y "Si, todo en orden" (20.º día)

---

### BUG 75 — AplicarModal fetch sin timeout (20.º día)

---

### BUG 69 — "aqui" sin acento en DOS archivos (21.º día)

---

### BUG 70 — Error de red muestra string técnico al usuario en Kyo (21.º día)

---

### BUG 71 — Widget de Kyo no cierra con tecla Escape (21.º día)

---

### BUG 65 — URL de WhatsApp no es clickeable en burbujas de Kyo (29.º día)

---

### BUG 66 — `reset()` no limpia `sessionStorage` → sobreescribe logs (28.º día)

---

### BUG 68 — Hero muestra datos inconsistentes: `10+ años / 7000+ colocados` vs `3+ / 687+` en knowledge.ts (22.º día)

---

### BUG 67 — Placeholder Hero sin acento: `"¿Que puesto buscas?"` (22.º día)

---

### BUG 62 — `Hero.tsx` usa `next/image` — viola regla de CLAUDE.md (31.º día)

---

### BUG 64 — Filtro "Marca" en `/vacantes` usa nombres demo ficticios (31.º día)

---

### BUG 26 — Markdown asteriscos aparecen literales en burbujas de Kyo (45.º día)

---

### BUG 44 — Inconsistencia usted/tú en system prompt (39.º día)

---

### BUG 54 — "Mas de $20k" sin acento en filtro de salario (45.º día)

---

### BUG 47 — `search_jobs` no incluye `salario_nota` (45.º día)

---

### BUG 48 — Sin ARIA live region en el chat widget (45.º día)

---

### BUG 51 — Fallback `"MXN bruto"` en vacantes sin `salario_nota` (45.º día)

---

### BUG 52 — Pérdida de contexto de perfil en conversaciones largas (45.º día)

---

### BUG 58 — `rutaDeStorage` falla silenciosamente → video no se borra de Storage (34.º día)

---

### BUG 59 — `StoryboardView` no renderiza el estado de video archivado (34.º día)

---

### BUG 16 — Memory leak en `rateLimitMap` (45.º día)

---

### BUG 50 — `generateStaticParams()` usa `JOBS` hardcoded (45.º día)

---

### BUG 94 — Guía de uso no menciona la pestaña "🎬 Proyectos" (5.º día)

---

### BUG 95 — Tour `showGuia`/`showNovedad` ignora la pestaña activa (5.º día)

---

### BUG 96 — `loadPosts()` hace 4 fetches completos al cambiar de semana (5.º día)

---

### BUG 104 — `cierre.titulo` hardcodeado a "Rosy" (2.º día sin fix)
**Archivo:** `docs/cuestionario/preguntas.json` línea 417

**Fix en `CuestionarioCliente.tsx` línea 341:**
```tsx
<h1>
  {invitadoNombre
    ? `¡Listo, ${invitadoNombre}! 🙌`
    : CUESTIONARIO.cierre.titulo}
</h1>
```

---

### BUG 105 — `cierre.texto` menciona "Renato" por nombre (2.º día sin fix)
**Archivo:** `docs/cuestionario/preguntas.json` línea 418

---

### BUG 106 — Sin notificación al admin cuando se completa el cuestionario (2.º día)
**Archivo:** `src/app/api/cuestionario/[token]/enviar/route.ts`

---

### BUG 107 — PATCH autosave no ignora cuestionarios completados (2.º día)
**Archivo:** `src/app/api/cuestionario/[token]/route.ts` línea 41

---

### BUG 108 — `etiquetaRespuesta` duplicada entre componente y librería (2.º día)
**Archivos:** `src/app/cuestionario/[token]/CuestionarioCliente.tsx` líneas 81-100

---

## Sugerencias de UX

### Alta prioridad

- **[CRM] Sin búsqueda de candidatos por nombre** — `src/app/admin/(panel)/crm/page.tsx`. Con muchos candidatos, el único filtro es por estado. Un admin no puede encontrar a "Juan Pérez" si está entre 50 "nuevos". Añadir `<input type="search">` sobre la lista que filtre `candidatosFiltrados` por `nombre.toLowerCase().includes(query)`.

- **[CRM] Score de matching sin explicación para el admin** — `src/app/admin/(panel)/crm/MatchingPanel.tsx` línea 241. El admin ve "47/100" sin saber qué significa. Añadir una nota debajo del ranking:
  ```tsx
  <p className="text-[11px] text-muted">
    Score: zona geográfica (40 pts) · categoría de vacante (35 pts) · keywords de experiencia (25 pts)
  </p>
  ```

- **[CRM] Pipeline visual sin indicador de dirección** — `src/app/admin/(panel)/crm/page.tsx` líneas 702-721. Los 6 botones de pipeline aparecen en grid 2×3 sin orden visual claro. El admin no sabe que son pasos progresivos. Cambiar a layout horizontal scroll o numerar: ya tienen `estado.orden` — mostrarlo más prominente con un stepper lineal simple.

- **Barra CTA sticky en mobile (vacantes/[id])** — El sidebar `sticky top-28` solo aparece en `lg:`. En mobile el candidato hace scroll hasta el fondo sin CTA. Añadir barra fija en bottom exclusiva para mobile.

- **Empty state de vacantes sin CTA a Kyo** — `src/app/vacantes/page.tsx`. Cuando no hay resultados no hay salida. Añadir botón que dispare `CustomEvent("kyo:open")`.

### Media prioridad

- **[CRM] `borrarCandidato` usa `window.confirm` — sin feedback de carga** — `src/app/admin/(panel)/crm/page.tsx` línea 283. Mientras `borrando=true`, solo el botón cambia a "Borrando…" pero el panel sigue visible. El admin puede pensar que el borrado no ocurrió. Considerar agregar un overlay con spinner sobre el `<aside>` durante el borrado.

- **[CRM] Detalle sticky no retorna al candidato tras borrar** — Al borrar un candidato, el aside queda en empty state ("Selecciona un candidato") pero el foco queda donde estaba. Añadir `setTimeout(() => document.querySelector<HTMLButtonElement>(".candidatos-list > button")?.focus(), 100)` tras borrar.

- **Confirmación visual al aprobar en `/revisor`** — Toast de 4 s al hacer clic en "Aprobar" / "Solicitar cambios".

- **Notificación al cliente al publicar video TikTok** — Al hacer PATCH de `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos.

- **`enterKeyHint="send"` en input de Kyo** — `ChatWidget.tsx` línea 170. En teclados virtuales de iOS/Android muestra "enviar".

- **[CUESTIONARIO] Indicador de estado del autosave** — `CuestionarioCliente.tsx` línea 550. El footer siempre muestra "✓ Tu avance se guarda solo" sin cambiar si hay un error de red. Agregar estado `saveStatus: 'ok' | 'saving' | 'error'` y mostrar "⚠ No se pudo guardar, reintentando..." en rojo cuando `saveStatus === 'error'`.

### Baja prioridad

- **[CRM] `grid-cols-[minmax(0,1fr)_440px]` sin max-width en pantallas XL** — `crm/page.tsx` línea 470. En 1920px el panel lateral es 440px fijo con mucho espacio vacío a la derecha. Mejor: `grid-cols-[minmax(0,1fr)_min(440px,38vw)]`.
- **[CUESTIONARIO] Logo real en lugar de inicial "K"** — `CuestionarioCliente.tsx` línea 309. Usar `brand/kyoszen-icon.png` de Supabase Storage.
- **Skeleton de carga en `/revisor`** — 6 cards `animate-pulse` mientras `loading === true`.
- **Tour de novedad solo en pestaña Publicaciones** — `src/app/revisor/page.tsx` línea 936.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Kyo puede mencionar el banco de talentos a empresas que pregunten por contratar** — Cuando `get_company_info` es llamado por alguien que pregunta por contratar personal, añadir al system prompt:
  ```
  Si una empresa pregunta por candidatos disponibles, mencionar:
  "Tenemos un banco de candidatos verificados. ¿Le cuento más sobre nuestro servicio de reclutamiento?"
  Y navegar a /servicios.
  ```
  El CRM ahora tiene candidatos reales — este dato puede resonar más con empresas.

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

- **Mención del cuestionario de cursos para empresas** — Agregar en `knowledge.ts` / `COMPANY.services`:
  ```ts
  { name: "Plataforma de Capacitación", description: "Digitalización de la operación de cursos: catálogo en línea, control de alumnos, constancias automáticas." }
  ```

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
| 1 | BUG 1 — Vacantes reales en Kyo (Supabase) | Alto | Crítico | 45 |
| 2 | BUG 56 — Endpoint archivar-video sin auth | Bajo (15 min) | Crítico | 34 |
| 3 | BUG 55 — kyo_mensaje graba datos personales (LFPDPPP) | Bajo (1 línea) | Crítico | 45 |
| 4 | BUG 98 — SMTP from template string → error 501 IONOS | Bajo (1 línea) | Crítico | 5 |
| 5 | BUG 102 — Sin timeout server-side en Anthropic API | Bajo (20 min) | Crítico | 3 |
| 6 | BUG 109 — MatchingPanel usa anon key directamente | Bajo (30 min) | Alto | 1 |
| 7 | BUG 112 — Form nuevo candidato sin campo experiencia | Bajo (20 min) | Alto | 1 |
| 8 | BUG 113 — Matching no distingue vacío vs sin coincidencia | Bajo (15 min) | Medio | 1 |
| 9 | BUG 110 — etiquetaEstado duplicada en crm/ | Bajo (10 min) | Bajo | 1 |
| 10 | BUG 111 — leerRespuesta duplicada en crm/ | Bajo (5 min) | Bajo | 1 |
| 11 | BUG 114 — colorScore sin relación a paleta CSS | Bajo (5 min) | Bajo | 1 |
| 12 | [CRM] Sin búsqueda de candidatos | Bajo (20 min) | Alto | — |
| 13 | [CRM] Score sin explicación del algoritmo | Bajo (5 min) | Medio | — |
| 14 | [CRM] Pipeline sin indicador de orden | Bajo (CSS) | Medio | — |
| 15 | BUG 99 — Cursos de Supabase no llegan a Kyo | Alto | Alto | 4 |
| 16 | BUG 100 — kyo_faqs de Supabase no alimentan a Kyo | Bajo (30 min) | Alto | 4 |
| 17 | BUG 104 — cierre.titulo hardcodeado a "Rosy" | Bajo (3 líneas) | Alto | 2 |
| 18 | BUG 105 — cierre.texto menciona "Renato" al cliente | Bajo (1 línea JSON) | Alto | 2 |
| 19 | BUG 106 — Sin notificación al admin al completar cuestionario | Bajo (30 min) | Alto | 2 |
| 20 | BUG 92 — aprobarPendientes() secuencial sin rollback | Bajo (15 min) | Alto | 5 |
| 21 | BUG 91 — INITIAL_GREETING desincronizado del system prompt | Bajo (10 min) | Alto | 7 |
| 22 | BUG 78 — PropuestaEditor sin confirm antes de notificar | Bajo (10 min) | Crítico | 17 |
| 23 | BUG 89 — deletePost() sin res.ok | Bajo (10 min) | Alto | 12 |
| 24 | BUG 90 — togglePublicado() sin res.ok | Bajo (10 min) | Alto | 12 |
| 25 | BUG 86 — moverPost* sin res.ok (3 funciones) | Bajo (15 min) | Alto | 13 |
| 26 | BUG 103 — matchesQuery() no normaliza acentos | Bajo (10 min) | Alto | 3 |
| 27 | BUG 93 — onMouseDown para cerrar modal proyectos | Bajo (2 líneas) | Medio | 5 |
| 28 | BUG 97 — "Aprobar todas" sin confirmación | Bajo (10 min) | Alto | 5 |
| 29 | BUG 101 — DetalleProyecto sin botón Reintentar | Bajo (10 min) | Medio | 4 |
| 30 | BUG 94 — Guía de uso sin paso de Proyectos | Bajo (10 min) | Medio | 5 |
| 31 | BUG 95 — Tour/novedad sin guard de sección activa | Bajo (10 min) | Medio | 5 |
| 32 | BUG 96 — 4 fetches redundantes al cambiar periodo | Bajo (20 min) | Medio | 5 |
| 33 | BUG 107 — PATCH autosave no ignora completados | Bajo (10 min) | Medio | 2 |
| 34 | BUG 108 — etiquetaRespuesta duplicada | Bajo (5 min) | Bajo | 2 |
| 35 | BUG 87 — Input fecha activo mientras moving=true | Bajo (1 atrib) | Bajo | 13 |
| 36 | BUG 84 — StoryboardEditor/GuiaTecnicaEditor sin onSaved() | Bajo (10 min) | Alto | 14 |
| 37 | BUG 79 — PostModal.save() no verifica res.ok | Bajo (15 min) | Alto | 17 |
| 38 | BUG 85 — key={i} en beats de montaje | Bajo (10 min) | Alto | 14 |
| 39 | BUG 80 — Botón × sin disabled en último cuadro/beat | Bajo (5 min) | Medio | 17 |
| 40 | BUG 81 — Cambios sin guardar se pierden silenciosamente | Bajo (20 min) | Alto | 17 |
| 41 | BUG 82 — Triple caption divergente sin sincronización | Bajo (30 min) | Alto | 17 |
| 42 | BUG 83 — Cuadros con solo tipo se filtran al guardar | Bajo (10 min) | Medio | 17 |
| 43 | BUG 65 — URL WhatsApp no clickeable en Kyo | Bajo (10 min) | Crítico | 29 |
| 44 | BUG 66 — reset() no limpia sessionStorage | Bajo (1 línea) | Crítico | 28 |
| 45 | BUG 62 — Hero usa next/image | Bajo (5 min) | Alto | 31 |
| 46 | BUG 68 — Hero "10+ años / 7000+ colocados" vs datos reales | Bajo (1 min) | Alto | 22 |
| 47 | BUG 64 — Filtro Marca con nombres demo ficticios | Bajo (30 min) | Alto | 31 |
| 48 | BUG 61 — Filtros ubicación con acentos faltantes | Bajo (2 min) | Alto | 32 |
| 49 | BUG 57 — subirADrive sin timeout | Bajo (5 min) | Alto | 34 |
| 50 | BUG 60 — fetch(video_url) sin timeout | Bajo (1 línea) | Alto | 33 |
| 51 | Variables GOOGLE_* en VPS | Bajo (5 min) | Alto | 35 |
| 52 | BUG 67 — Placeholder Hero sin acento | Bajo (1 char) | Alto | 22 |
| 53 | BUG 53/73/74 — Acentos en AplicarModal | Bajo (5 min) | Alto | 20 |
| 54 | BUG 26 — Markdown asteriscos en Kyo | Bajo (10 min) | Alto | 45 |
| 55 | BUG 69 — "aqui" sin acento en DOS archivos | Bajo (2 min) | Alto | 21 |
| 56 | BUG 70 — Error de red muestra string técnico al usuario | Bajo (5 min) | Alto | 21 |
| 57 | BUG 72 — AplicarModal no cierra con Escape | Bajo (5 min) | Alto | 20 |
| 58 | BUG 75 — AplicarModal fetch sin timeout | Bajo (10 min) | Alto | 20 |
| 59 | BUG 76 — Input Kyo sin maxLength | Bajo (10 min) | Alto | 19 |
| 60 | BUG 77 — Sin focus trap en ChatWidget | Bajo (20 min) | Medio | 19 |
| 61 | BUG 71 — Widget no cierra con Escape | Bajo (5 min) | Medio | 21 |
| 62 | BUG 44 — usted/tú inconsistente en prompt | Bajo (15 min) | Alto | 39 |
| 63 | BUG 51 — Fallback "MXN bruto" en vacantes | Bajo (1 min) | Alto | 45 |
| 64 | BUG 54 — "Mas de $20k" sin acento | Bajo (1 min) | Medio | 45 |
| 65 | BUG 59 — StoryboardView no renderiza estado archivado | Bajo (20 min) | Medio | 34 |
| 66 | Avisar a candidato que puede seguir chateando tras navegación | Bajo (10 min) | Alto | — |
| 67 | BUG 47 — salario_nota faltante en search_jobs | Bajo (20 min) | Medio | 45 |
| 68 | BUG 58 — rutaDeStorage falla silenciosamente | Bajo (5 min) | Medio | 34 |
| 69 | BUG 48 — Sin ARIA live region en chat widget | Bajo (1 línea) | Medio | 45 |
| 70 | BUG 52 — Pérdida de perfil en conversaciones largas | Bajo (1 línea) | Medio | 45 |
| 71 | Auditoría auth endpoints /api/admin/ | Bajo (revisión) | Crítico | — |
| 72 | Timeout en fetch del chat (useChat.ts) | Bajo (15 min) | Medio | — |
| 73 | Barra CTA sticky en mobile (/vacantes/[id]) | Bajo (CSS) | Alto | — |
| 74 | Proyectos: badge urgencia en tarjeta | Bajo (CSS) | Medio | — |
| 75 | Altura widget en iPhone SE | Bajo (1 min) | Medio | — |
| 76 | Empty state vacantes → CTA abrir Kyo | Bajo (30 min) | Medio | — |
| 77 | Filtros jornada/contrato en search_jobs | Bajo (20 min) | Alto | — |
| 78 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio | — |
| 79 | Banner progreso durante archivado a Drive | Bajo (UI) | Medio | — |
| 80 | Tool register_talent_interest | Medio | Alto | — |
| 81 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio | 45 |
| 82 | BUG 50 — generateStaticParams usa JOBS hardcoded | Medio | Bajo | 45 |
| 83 | Avatares externos (pravatar.cc) en Hero | Bajo (30 min) | Bajo | — |
| 84 | enterKeyHint="send" en input de Kyo (mobile) | Bajo (1 min) | Bajo | — |
| 85 | Minimizar widget tras navegación proactiva | Medio (UI) | Alto | — |
| 86 | Sistema de prompts dinámico para Kyo (faqs+cursos+vacantes) | Alto | Alto | — |
| 87 | Mencionar banco de talentos en Kyo para empresas | Bajo (10 min) | Medio | — |
| 88 | [CRM] Detalle sticky sin focus recovery al borrar | Bajo (10 min) | Bajo | — |
| 89 | [CQ] autoAvance 260ms → 400ms en touch | Bajo (1 línea) | Bajo | 2 |
| 90 | [CQ] Logo real en lugar de inicial "K" | Bajo (15 min) | Bajo | 2 |
| 91 | [CQ] "75 cursos en 11 áreas" hardcodeado | Bajo (editar JSON) | Bajo | 2 |
| 92 | [CQ] Slide-over admin sin handler de Escape | Bajo (10 min) | Medio | 2 |
