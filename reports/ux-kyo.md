# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-18
**Cambios analizados:** 4 commits del día — `src/app/revisor/page.tsx` (filtros multi-fecha + lista plana), `src/app/admin/(panel)/redes-sociales/page.tsx` (PropuestaEditor + drag entre meses + refresco de modal), `src/app/api/admin/social/posts/[id]/versions/route.ts` (PUT acepta storyboard). Archivos base Kyo: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`.

---

## Cambios Recientes Detectados

1. **Revisor: modo filtro multi-fecha** (`src/app/revisor/page.tsx`): al activar cualquier filtro (estado o red), se carga un 4º fetch (`/api/revisor/posts` sin fechas) y se muestra lista plana ordenada por fecha. Se ocultan el toggle Semana/Mes y las flechas de navegación. Header cambia a "Resultados del filtro · N publicaciones · todas las fechas". `handleStatusChange` ahora sincroniza tanto `posts` como `postsTodos` para mantener consistencia entre modo filtro y calendario.

2. **Admin: refresco del modal al guardar** (`src/app/admin/(panel)/redes-sociales/page.tsx`): `loadData` ahora refresca `selectedPost` con los datos actualizados, corrigiendo el bug donde el modal mostraba estado/versión desactualizados después de guardar.

3. **Admin/TikTok: PropuestaEditor** (`src/app/admin/(panel)/redes-sociales/page.tsx` líneas 283-380): nuevo componente que permite editar la propuesta del cliente (título, subtítulo, por_qué, línea de diseño, copy, caption). **Dos rutas de guardado**: "Guardar" = PUT silencioso (actualiza sin notificar ni crear versión nueva) | "Guardar y avisar al cliente" = POST nueva versión + devuelve el post a `pendiente` + correo a revisores activos. La pestaña "📋 Propuesta" ahora siempre visible en TikTok (permite crear propuesta si no existía).

4. **Admin: drag entre períodos** (`src/app/admin/(panel)/redes-sociales/page.tsx` función `moverPostPeriodo`): las flechas ‹ › se convierten en drop targets (resalte azul al arrastrar encima). Soltar una publicación sobre ellas la mueve al período anterior/siguiente, ajustando el día si el mes destino es más corto.

---

## 🔴 BUGS CRÍTICOS — DÍA 7 SIN CORRECCIÓN

> El flujo candidato → Kyo → vacante → aplicación sigue roto en producción. Estos bugs llevan **7 días** sin atención y cada día que pasan afectan a candidatos reales usando el sitio.

### BUG 1 — Kyo recomienda vacantes que no existen *(BLOQUEANTE — 7º día)*
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider.listJobs()` lee de `src/lib/jobs.ts` (array demo hardcodeado). Las vacantes reales del panel admin (Supabase) son invisibles para Kyo. En el Paso 5, Kyo presenta IDs de demo que generan 404 al hacer clic. **Este es el bug de mayor impacto de todo el proyecto.**

**Fix en `src/app/api/assistant/chat/route.ts`:** Antes del loop de herramientas, consultar vacantes activas con `sbAdmin`:
```ts
const { data: vacantesBD } = await sbAdmin
  .from("vacantes")
  .select("id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion,tags")
  .eq("activa", true);
// Inyectar vacantesBD en el knowledge antes del loop de tool-use
```

---

### BUG 2 — Filtro "Marca" en `/vacantes` siempre devuelve 0 resultados *(7º día)*
**Archivo:** `src/app/vacantes/page.tsx` líneas 29 y 180

Las marcas hardcodeadas (`"Grupo Corpora"`, `"Logística Norte"`, etc.) no coinciden con las empresas reales en Supabase. Kyo navega con `?marca=Sigma Retail` y el candidato ve la página vacía.

**Fix:**
```ts
const marcasDisponibles = useMemo(
  () => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())],
  [jobs]
);
```

---

### BUG 3 — Vocabulario Contrato/Jornada incompatible entre BD, filtros y Kyo *(7º día)*
**Archivos:** `src/app/vacantes/page.tsx` líneas 30-31, `src/lib/assistant/system-prompt.ts` líneas 85-91

Los tres sistemas usan valores distintos para el mismo concepto. Los filtros devuelven 0 resultados aunque existan vacantes compatibles.

---

### BUG 5 — MAX_TOOL_ITERATIONS demasiado bajo para el Paso 5 *(7º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` línea 85

Paso 5 requiere: `search_jobs` → `get_job_details` × 2 → `navigate_to` = 4 iteraciones mínimo. Con `MAX_TOOL_ITERATIONS = 5`, Claude puede truncar la respuesta antes de navegar.

**Fix:** `const MAX_TOOL_ITERATIONS = 8;`

---

### BUG 14 — FAQs editadas en el admin NUNCA llegan a Kyo *(7º día)*
**Archivos:** `src/lib/assistant/knowledge.ts` líneas 99-105, `src/app/api/assistant/chat/route.ts`

`buildSystemPrompt()` usa `COMPANY.faqs` (hardcodeado), ignorando la tabla `kyo_faqs` de Supabase. El admin puede editar FAQs desde el panel sin ningún efecto en Kyo.

---

### BUG 16 — `rateLimitMap` crece sin límite (memory leak en VPS) *(7º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Con días de uptime y tráfico de bots, puede agotar la RAM del VPS (4 GB).

**Fix mínimo (añadir al inicio de `checkRateLimit`):**
```ts
if (rateLimitMap.size > 10_000) {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }
}
```

---

### BUG 23 — `reset()` no regenera sessionId *(7º día)*
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

"Nueva conversación" borra localStorage pero no regenera `kyo_session_id`. El nuevo chat sobreescribe la conversación anterior en Supabase, perdiendo el historial del candidato.

**Fix:** Añadir en `reset()`: `sessionStorage.removeItem("kyo_session_id");`

---

### BUG 25 — Cursos del sitio público y Kyo ignoran la tabla de Supabase *(7º día)*
**Archivos:** `src/app/cursos/page.tsx` línea 7, `src/lib/assistant/knowledge.ts` líneas 1-2

La página `/cursos` y Kyo leen de `COURSES` (array estático). Los cambios del admin en `/admin/cursos` nunca se reflejan en el sitio público ni en Kyo.

---

### BUG 26 — Markdown de Kyo renderiza asteriscos literales en el chat *(7º día)*
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 211 y 227

El Paso 5 usa `**texto**` y listas numeradas. Con `whitespace-pre-wrap` los saltos se preservan pero `**texto**` aparece con asteriscos literales en la burbuja.

**Fix seguro (solo en burbujas del asistente):**
```tsx
function renderMarkdown(text: string) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
// En MessageBubble cuando isUser === false:
<div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} ... />
```

---

### BUG 28 — Tour de novedad activa cuando el usuario está en la pestaña "📊 Análisis" *(2º día)*
**Archivo:** `src/app/revisor/page.tsx` línea ~1235

`showNovedad` se renderiza sin importar el valor de `seccion`. Si el usuario está viendo "Análisis", los selectores `[data-fpill]` y `[data-fred]` no existen en el DOM. El tour muestra solo el overlay oscuro sin spotlight y el usuario queda bloqueado sin poder cerrar.

**Fix:**
```tsx
{showNovedad && seccion === "publicaciones" && <NovedadFiltros onClose={() => setShowNovedad(false)} />}
```

---

### BUG 29 — Modal del revisor: grid 2 columnas se rompe en mobile *(2º día)*
**Archivo:** `src/app/revisor/page.tsx` línea ~194

```tsx
style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}
```

No tiene fallback responsive. En mobile (< 700px) el mockup y el panel de acciones se comprimen a ~50% cada uno — mockup ilegible, botones de acción muy pequeños. Afecta directamente a Rosy y Monse que acceden desde el celular.

**Fix:** Añadir clase CSS `.post-modal-grid` y en `<style>`:
```css
@media (max-width: 700px) {
  .post-modal-grid { grid-template-columns: 1fr !important; }
}
```

---

### BUG 31 — "Ver propuesta aprobada" muestra vacío si no hay propuesta *(2º día)*
**Archivo:** `src/app/revisor/page.tsx` líneas 393-401

El botón siempre se muestra en TikTok `fase === "video"`. Si el video se subió directamente sin storyboard o propuesta, el toggle no muestra nada al abrirse — experiencia confusa para el cliente.

**Fix:** `{(version.storyboard?.propuesta || version.storyboard?.frames?.length) && <button>Ver propuesta aprobada ▼</button>}`

---

### BUG 32 — Sin confirmación de éxito al aprobar o solicitar cambios en el revisor *(2º día)*
**Archivo:** `src/app/revisor/page.tsx` funciones `aprobar` y `enviarCambios`

El estado del botón cambia de color pero no hay toast ni banner visible. El cliente no recibe confirmación clara de que su acción fue registrada — crítico en mobile donde la retroalimentación es la única señal.

**Fix:** Añadir `exito: string | null` y mostrar banner temporal de 4 segundos:
```tsx
setExito("✅ Publicación aprobada. El equipo fue notificado.");
setTimeout(() => setExito(null), 4000);
```

---

## 🟠 BUGS NUEVOS — DETECTADOS HOY (2026-06-18)

### BUG 33 — `postsTodos` se refetch completo en cada cambio de período
**Archivo:** `src/app/revisor/page.tsx` líneas 930-945

`loadData` hace 4 fetches paralelos en cada llamada, incluyendo `/api/revisor/posts` sin fechas. Cada vez que el usuario navega entre semanas (cambiando `periodOffset`), este 4º fetch descarga todos los posts históricos sin importar si hay filtros activos o no.

**Fix:** Cargar `postsTodos` solo una vez al montar con un `useEffect` separado:
```ts
useEffect(() => {
  if (!user) return;
  fetch("/api/revisor/posts")
    .then(r => r.json())
    .then(data => { if (Array.isArray(data)) setPostsTodos(data); });
}, [user]); // solo al iniciar sesión, no en cada cambio de período
```

---

### BUG 34 — Modo filtro: header no describe qué filtros están activos
**Archivo:** `src/app/revisor/page.tsx` línea ~1108

Cuando hay filtros activos, el header muestra "Resultados del filtro" sin indicar cuáles. Si el usuario scrolleó hacia abajo y las píldoras quedaron fuera de vista, no sabe qué está filtrando.

**Fix:** Construir descripción dinámica:
```tsx
const descFiltro = [
  filtroEstado !== "todos" ? ESTADO[filtroEstado]?.label : null,
  filtroRed !== "todos" ? filtroRed.toUpperCase() : null,
].filter(Boolean).join(" · ");

<p style={{ ... }}>Filtro: {descFiltro} · {postsFiltrados.length} publicaciones · todas las fechas</p>
```

---

### BUG 35 — Drag entre meses no tiene alternativa en mobile/tablet
**Archivo:** `src/app/admin/(panel)/redes-sociales/page.tsx` función `moverPostPeriodo`

El drag-and-drop usa HTML5 Drag API (`draggable`, `onDragStart`, `onDrop`). En mobile/tablet esta API no funciona. Un admin desde iPad no puede usar drag entre meses ni intercambio de fechas.

**Fix provisional:** Añadir botón "📅" en cada post del calendario que abra un date picker simple como alternativa touch-friendly al drag, sin reemplazar el comportamiento de escritorio.

---

## Sugerencias de UX

### Alta prioridad

- **CTA fijo en mobile para aplicar a vacante** — `src/app/vacantes/[id]/_content.tsx`. El sidebar sticky con el botón "Aplicar ahora" solo aparece en `lg:`. En mobile el candidato tiene que hacer scroll completo por la descripción para llegar al CTA. Agregar barra fija inferior en mobile con el botón de aplicar.

- **Empty state de vacantes sin salida** — `src/app/vacantes/page.tsx`. Cuando no hay resultados, no hay botón "Limpiar filtros" ni sugerencia de WhatsApp. El candidato frustrado abandona sin alternativa. Agregar ambos.

- **Confirmación de acciones en el revisor (BUG 32)** — Crítico para Rosy y Monse en mobile.

### Media prioridad

- **Stats del mes vs. período visible son ambiguos** — `src/app/revisor/page.tsx` líneas 1056-1077. Las píldoras siempre muestran el mes completo aunque la vista sea "Esta semana". Agregar nota visual sutil con el total del período visible como referencia.

- **`PostCard` inconsistente entre vista semana y mes** — Vista semana usa chip simple `<RedLogo>`; vista mes usa pill `● FACEBOOK`/`● TIKTOK` con fondo de color. Unificar al pill de color en ambas vistas.

- **Tour de novedad cuando el grid está vacío** — `src/app/revisor/page.tsx` líneas 897-912. El coach-mark de filtros aparece aunque no haya publicaciones visibles. Fix: `if (posts.length > 0 && !novedadVista) setShowNovedad(true);`

### Baja prioridad

- **Falta `role="dialog"` y `aria-modal` en PostModal del revisor** — `src/app/revisor/page.tsx` línea ~165.
- **Sin skeleton durante carga en el revisor** — Mostrar 6 cards `animate-pulse` mientras `loading === true` para dar sensación de velocidad.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía** — `src/lib/assistant/system-prompt.ts` línea 44. Si la vacante tiene empresa vacía (confidencial), `[Empresa]` queda en blanco en la respuesta. Agregar instrucción: *"Si empresa es null o vacía, mostrar 'empresa confidencial'."*

- **Paso 6 no maneja el rechazo del candidato** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "ninguna me interesa", no hay flujo. Agregar Paso 6b: *"Si el candidato rechaza todas las opciones: agradecer, ofrecer banco de talentos con `navigate_to('/contacto')` y sugerir `/cursos` si quiere mejorar su perfil."*

- **Kyo nunca menciona las 24h de respuesta** — El stat más convincente para motivar la aplicación no aparece en el Paso 6. Agregar: *"Al invitar a aplicar, mencionar que el equipo responde en menos de 24 horas hábiles."*

- **Resumen de perfil como ancla contra truncado de historial** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se corta a 20 mensajes. Agregar al Paso 3: *"Al completar pasos 0-4, sintetizar en una línea: 'Perfil: [nombre], [puesto], [N] años, zona [X], [jornada].' Preserva el contexto si el historial se trunca."*

- **Pre-calificación de leads empresariales** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto` sin capturar datos. Mejorar: preguntar *"¿Nombre de su empresa y qué perfil busca?"* antes de navegar.

### Nuevas tools recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge la jornada preferida en el Paso 4 pero no puede usarla como filtro al buscar vacantes.
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```

- **Nueva tool `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool lo capturaría directamente en Supabase con `origen: 'kyo_banco_talentos'` para diferenciarlo en el inbox del admin.

### Problemas detectados

- **Fallback genérico cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to` sin texto, la respuesta es "Entendido, ¿en que mas te puedo ayudar?" (sin acento). Fix:
  ```ts
  const replyContent = finalText ||
    (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 consume ~700-900 tokens. Con 1024 hay margen mínimo. **Fix:** `max_tokens: 1536`.

- **`sessionId` inconsistente entre visitas** — `src/components/assistant/useChat.ts` líneas 45-53. `kyo_session_id` usa `sessionStorage` pero el historial usa `localStorage`. El candidato que regresa genera un `session_id` nuevo → upsert sobreescribe el chat anterior en Supabase. **Fix:** Mover `getSessionId()` a `localStorage`.

- **`getStoredInstrucciones()` usa anon key** — `src/app/api/assistant/chat/route.ts` líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente. Reemplazar con `sbAdmin` (ya declarado en línea 36).

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo de Kyo** — El candidato no sabe en qué paso está. Un texto sutil en el header del chat (ej. "Paso 2 de 5 — Experiencia") reduce abandonos. Implementar en `ChatWidget.tsx` contando mensajes del usuario para inferir el paso actual.

- **Auto-apertura contextual de Kyo en `/vacantes`** — Un candidato que lleva 5 segundos filtrando sin resultados se beneficia de un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. Implementar con `useEffect` + `setTimeout(5000)` en la ruta `/vacantes`, una vez por sesión.

- **Tracking del funnel Kyo → aplicación** — No hay evento analytics cuando Kyo presenta recomendaciones. Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`. Sin este evento es imposible medir el ROI de Kyo.

- **Discrepancias de estadísticas en el sitio** — `/contacto/page.tsx` dice "10 años"; `knowledge.ts` dice "3+". Unificar con el número correcto.

- **Límite de resultados en `/api/revisor/posts` sin fechas** — Con meses de contenido acumulado, el endpoint sin fecha devolverá cientos de posts. Agregar filtro por año en curso antes de que el volumen crezca.
