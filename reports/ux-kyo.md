# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-17
**Cambios analizados:** 3 commits del día — `src/app/revisor/page.tsx` (filtros + tour de novedad), `src/components/social/StoryboardView.tsx`, `src/app/api/admin/social/importar-tiktok/route.ts`, `src/app/admin/(panel)/redes-sociales/page.tsx`. Archivos base Kyo: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`.

---

## Cambios Recientes Detectados

1. **Filtros en el revisor** (`/revisor`): las 4 píldoras de estado ahora filtran el grid en tiempo real; nueva fila de filtros por red (Facebook/TikTok); contador "X de Y" y "✕ Limpiar filtros"; empty state inteligente según si hay filtro activo.
2. **Tour de novedad** (`NovedadFiltros`): coach-mark de 6 pasos con spotlight sobre las nuevas píldoras de filtro, activado una sola vez (localStorage `kyoszen_revisor_novedad_filtros_v1`). Lógica para que usuario que ya vio la guía vea directamente la novedad.
3. **Distintivos de red en calendario** (`vista === "mes"`): chip `● FACEBOOK` / `● TIKTOK` con borde izquierdo de color y badge "✨ NUEVA" si hay corrección.
4. **Importador de set TikTok** (3 documentos: Propuesta, Storyboard, Guía técnica): separación por audiencia — cliente ve solo `PropuestaView`, admin ve las 3 pestañas.

---

## 🔴 BUGS CRÍTICOS ACUMULADOS — DÍA 6 SIN CORRECCIÓN

> El flujo candidato → Kyo → vacante → aplicación sigue roto en producción. Estos bugs llevan 6 días sin atención.

### BUG 1 — Kyo recomienda vacantes que no existen *(BLOQUEANTE — 6º día)*
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider.listJobs()` lee de `src/lib/jobs.ts` (demo hardcodeado). Las vacantes reales de Supabase son invisibles para Kyo. En el Paso 5, Kyo presenta IDs de demo que generan 404 al hacer clic.

**Fix en `src/app/api/assistant/chat/route.ts`:** Antes del loop de herramientas, consultar vacantes activas de Supabase con `sbAdmin` y pasarlas a `buildSystemPrompt()` y `executeTool()`.

---

### BUG 2 — Filtro "Marca" en `/vacantes` siempre devuelve 0 resultados *(6º día)*
**Archivo:** `src/app/vacantes/page.tsx` líneas 29 y 180

Las marcas hardcodeadas (`"Grupo Corpora"`, `"Logística Norte"`, etc.) no coinciden con las empresas reales en Supabase.

**Fix:**
```ts
const marcasDisponibles = useMemo(
  () => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())],
  [jobs]
);
```

---

### BUG 3 — Vocabulario Contrato/Jornada incompatible entre BD, filtros y Kyo *(6º día)*
**Archivos:** `src/app/vacantes/page.tsx` líneas 30-31, `src/lib/assistant/system-prompt.ts` líneas 85-91

Los tres sistemas usan valores distintos. Los filtros devuelven 0 resultados aunque existan vacantes compatibles.

---

### BUG 5 — MAX_TOOL_ITERATIONS demasiado bajo para el Paso 5 *(6º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` línea 85

Paso 5 requiere: `search_jobs` → `get_job_details` × 2 → `navigate_to` = 4 iteraciones mínimo. Con 5 como límite, Claude puede truncar la respuesta antes de navegar.

**Fix:** `const MAX_TOOL_ITERATIONS = 8;`

---

### BUG 14 — FAQs editadas en el admin NUNCA llegan a Kyo *(6º día)*
**Archivos:** `src/lib/assistant/knowledge.ts` líneas 99-105, `src/app/api/assistant/chat/route.ts`

`buildSystemPrompt()` usa `COMPANY.faqs` (hardcodeado), ignorando la tabla `kyo_faqs` de Supabase. El admin puede editar FAQs desde el panel sin ningún efecto.

---

### BUG 16 — `rateLimitMap` crece sin límite (memory leak en VPS) *(6º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Con días de uptime, un bot puede agotar la RAM del VPS (4 GB).

**Fix mínimo:**
```ts
if (rateLimitMap.size > 10_000) {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }
}
```

---

### BUG 23 — `reset()` no regenera sessionId *(6º día)*
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

"Nueva conversación" borra localStorage pero no regenera `kyo_session_id`. El nuevo chat sobreescribe la conversación anterior en Supabase.

**Fix:** `sessionStorage.removeItem("kyo_session_id");`

---

### BUG 25 — Cursos del sitio público y Kyo ignoran la tabla de Supabase *(6º día)*
**Archivos:** `src/app/cursos/page.tsx` línea 7, `src/lib/assistant/knowledge.ts` líneas 1-2

La página `/cursos` y Kyo leen de `COURSES` (array estático). Los cambios del admin en `/admin/cursos` nunca se reflejan en el sitio público ni en Kyo.

---

### BUG 26 — Markdown de Kyo renderiza asteriscos literales en el chat *(6º día)*
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 211 y 227

El Paso 5 usa `**texto**` y listas numeradas. Con `whitespace-pre-wrap` los saltos se preservan pero `**texto**` aparece con asteriscos literales.

**Fix seguro (solo en burbujas de asistente):**
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

## 🟠 BUGS NUEVOS — DETECTADOS HOY (2026-06-17)

### BUG 28 — Tour de novedad activa cuando el usuario está en la pestaña "📊 Análisis"
**Archivo:** `src/app/revisor/page.tsx` línea 1235

`showNovedad` se renderiza sin importar el valor de `seccion`. Si el usuario está viendo "Análisis", los selectores `[data-fpill]` y `[data-fred]` no existen en el DOM (están en la pestaña "Publicaciones"). El tour muestra solo el overlay oscuro sin spotlight, y el usuario no puede actuar.

**Fix:** Condicionar el render a la pestaña activa:
```tsx
{showNovedad && seccion === "publicaciones" && <NovedadFiltros onClose={() => setShowNovedad(false)} />}
```

---

### BUG 29 — Modal del revisor: grid 2 columnas se rompe en mobile (pantallas < 700px)
**Archivo:** `src/app/revisor/page.tsx` línea 194

```tsx
style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}
```

No tiene fallback responsive. En mobile el mockup y el panel de acciones se comprimen a ~50% cada uno — el mockup es ilegible y los botones de acción quedan muy pequeños.

**Fix:** Agregar en el `<style>` del componente:
```css
@media (max-width: 700px) {
  .post-modal-grid { grid-template-columns: 1fr !important; }
}
```
Y en el div del grid: `className="post-modal-grid"`.

---

### BUG 30 — `loadPosts` hace fetch doble del mes cuando vista === "mes" y periodOffset === 0
**Archivo:** `src/app/revisor/page.tsx` líneas 926-951

Cuando el usuario está en vista "mes" y en el mes actual, `desde/hasta` coinciden con `mesDesde/mesHasta`. Se hacen 2 fetches idénticos a `/api/revisor/posts`.

**Fix:** Detectar el caso y reutilizar el resultado:
```ts
const mismoPeriodo = vista === "mes" && periodOffset === 0;
const [postsRes, configRes, mesRes] = await Promise.all([
  fetch(`/api/revisor/posts?desde=${desde}&hasta=${hasta}`),
  fetch("/api/admin/social/config"),
  mismoPeriodo ? Promise.resolve(null) : fetch(`/api/revisor/posts?desde=${mesDesde}&hasta=${mesHasta}`),
]);
// Si mismoPeriodo, usar postsData para las stats también.
```

---

### BUG 31 — Botón "Ver propuesta aprobada" en TikTok fase=video muestra contenido vacío si no hay propuesta
**Archivo:** `src/app/revisor/page.tsx` líneas 393-401 (función `TikTokReview`)

Cuando `fase === "video"`, el botón "Ver propuesta aprobada ▼" siempre se muestra. Si el video se subió directamente sin storyboard `propuesta` (e.g., storyboard null o sin campo `propuesta`), el toggle no muestra nada al abrirse.

**Fix:** Solo mostrar el botón si hay propuesta o storyboard real:
```tsx
{(version.storyboard?.propuesta || version.storyboard?.frames?.length) && (
  <button ...>Ver propuesta aprobada ▼</button>
)}
```

---

### BUG 32 — Sin confirmación de éxito al aprobar o solicitar cambios en el revisor
**Archivo:** `src/app/revisor/page.tsx` líneas 125-159 (funciones `aprobar` y `enviarCambios`)

Después de llamar la API, el estado del botón cambia de color pero no hay toast ni banner visible. El cliente no recibe confirmación clara de que su acción fue registrada — especialmente crítico en `enviarCambios` donde el cliente acaba de escribir texto.

**Fix:** Mostrar un banner temporal al completar cada acción:
```tsx
const [exito, setExito] = useState<string | null>(null);
// En aprobar():
setExito("✅ Publicación aprobada. El equipo fue notificado.");
setTimeout(() => setExito(null), 4000);
// En enviarCambios():
setExito("📬 Cambios enviados. Te avisamos cuando estén listos.");
setTimeout(() => setExito(null), 4000);
// Renderizar bajo los botones cuando exito !== null.
```

---

## Sugerencias de UX

### Alta prioridad

- **Modal del revisor: grid 2 columnas en mobile** — ver BUG 29. Afecta a Rosy y Monse al revisar desde el celular.

- **Stats del mes no reflejan el período visible** — `src/app/revisor/page.tsx` líneas 1056-1077. Los contadores de las píldoras siempre muestran el mes completo aunque el usuario esté viendo "Esta semana". Cuando el usuario activa el filtro "Pendientes" y ve "3 de 5", no está claro que "5" es del período visible y "Pendientes: 8" es del mes. Agregar una nota visual sutil: al estar en vista semana, los pills podrían mostrar un superíndice con el total del período:
  ```tsx
  <span style={{ opacity: 0.55, fontSize: 10 }}>/{postsDelPeriodo.length}</span>
  ```

- **CTA de aplicar no visible en mobile en detalle de vacante** — `src/app/vacantes/[id]/_content.tsx` líneas 214-232. El sidebar sticky solo aparece en `lg:`. El candidato en mobile tiene que hacer scroll por toda la vacante para llegar al botón.

  **Fix:** Barra fija inferior en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t px-5 py-3 flex gap-3 z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 text-sm font-extrabold">
      Aplicar ahora
    </button>
  </div>
  ```

### Media prioridad

- **Texto del card TikTok sin guion es genérico** — `src/app/revisor/page.tsx` línea 454. Cuando no hay `storyboard.frames[0].overlay` ni `titulo_interno`, muestra "Storyboard TikTok". Cambiar a "Guion en preparación" para que el cliente entienda que el contenido aún se está definiendo.

- **Tour de novedad ignora si hay publicaciones visibles** — `src/app/revisor/page.tsx` líneas 897-912. El tour de novedad aparece aunque el revisor no tenga publicaciones en el período. El usuario ve el tour de filtros pero el grid está vacío. Fix: `if (posts.length > 0 && !novedadVista) setShowNovedad(true);`

- **`PostCard` vista semana no muestra chip de red de forma consistente** — `src/app/revisor/page.tsx` línea 489. La vista semana usa `<RedLogo red_social={post.red_social} height={11} />` (chip simple). La vista mes usa el pill `● FACEBOOK`/`● TIKTOK` con fondo de color. La inconsistencia es visible cuando el usuario alterna entre vistas. Unificar usando el mismo pill de color en ambas vistas.

- **Empty state de vacantes públicas sin CTA de rescate** — `src/app/vacantes/page.tsx`. Cuando no hay resultados para los filtros activos, no hay botón "Limpiar filtros" ni enlace a WhatsApp. El candidato frustrado no tiene salida. Agregar ambos al empty state.

### Baja prioridad

- **`aria-modal` y `role="dialog"` faltantes en PostModal** — `src/app/revisor/page.tsx` línea 165. Agregar `role="dialog" aria-label="Detalle de publicación" aria-modal="true"` al div del modal.

- **Sin skeleton durante carga de publicaciones en el revisor** — Líneas 1137-1140. Se muestra solo un spinner. Mientras `loading === true`, mostrar 6 cards `animate-pulse` (altura fija, fondo gris) para dar sensación de velocidad.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía/confidencial** — `src/lib/assistant/system-prompt.ts` línea 44. Si la vacante tiene empresa vacía, el campo `[Empresa]` queda en blanco en la respuesta. Agregar instrucción al Paso 5: *"Si la empresa es null o vacía, mostrar 'empresa confidencial'."*

- **Paso 6 no maneja el rechazo del candidato** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "ninguna me interesa", no hay instrucción de flujo. Agregar Paso 6b: *"Si el candidato rechaza todas las opciones: agradecer, ofrecer banco de talentos con `navigate_to('/contacto')` y sugerir `/cursos` si quiere mejorar su perfil."*

- **Kyo no menciona el tiempo de respuesta de 24h al invitar a aplicar** — El stat más convincente para motivar la aplicación nunca aparece en el Paso 6. Agregar en el Paso 6: *"Al invitar a aplicar, mencionar que el equipo responde en menos de 24 horas hábiles."*

- **Resumen de perfil como ancla contra truncado del historial** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se corta a 20 mensajes; si el perfil del candidato quedó en los primeros pasos, Kyo lo olvida. Agregar al Paso 3 del system-prompt: *"Al completar el perfil (pasos 0-4), sintetizar en UNA línea: 'Perfil registrado: [nombre], [puesto], [N] años, zona [X], [jornada].' Esto preserva el contexto si el historial se trunca."*

- **Pre-calificación de leads empresariales** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto` sin información. Mejorar el flujo: preguntar primero *"¿El nombre de su empresa y qué tipo de perfil busca?"* antes de navegar, para que el lead llegue con contexto al inbox de contactos.

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge la jornada preferida en el Paso 4 pero no puede usarla como filtro al buscar.
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```

- **Nueva tool: `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool lo capturaría directamente en Supabase:
  ```ts
  {
    name: "register_talent_interest",
    description: "Registra el perfil del candidato en el banco de talentos cuando no hay vacante disponible.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        puesto: { type: "string" },
        experiencia_anios: { type: "number" },
        ubicacion: { type: "string" },
        jornada: { type: "string" }
      },
      required: ["nombre", "puesto"]
    }
  }
  ```
  En `executeTool`: insertar en `contactos` con `origen: 'kyo_banco_talentos'` para que aparezca en el inbox del admin.

### Problemas detectados

- **Fallback genérico cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202.
  ```ts
  // Actual (sin acento):
  const replyContent = finalText || "Entendido, ¿en que mas te puedo ayudar?";
  // Fix:
  const replyContent = finalText ||
    (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. Presentar 2-3 vacantes con justificación y navegar consume ~700-900 tokens. Cambiar a `max_tokens: 1536`.

- **`sessionId` inconsistente entre visitas** — `src/components/assistant/useChat.ts` líneas 45-53. `session_id` usa `sessionStorage` (efímero) pero el historial usa `localStorage` (persistente). Un candidato que regresa ve su conversación pero genera un `session_id` nuevo. Fix: mover `getSessionId()` a `localStorage`.

- **`getStoredInstrucciones()` usa anon key en vez de service role** — `src/app/api/assistant/chat/route.ts` líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente y cae al default sin avisar. Reemplazar el cliente local por `sbAdmin` (ya declarado en línea 36).

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo de Kyo** — El candidato no sabe en qué paso está. Un texto sutil en el header del chat (ej. "Paso 2 de 5 — Experiencia") reduce abandonos. Implementar en `ChatWidget.tsx` contando mensajes del usuario para inferir el paso actual.

- **Auto-apertura contextual de Kyo en `/vacantes`** — Un candidato que lleva 5 segundos filtrando sin encontrar lo que busca se beneficia de un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. Implementar con `useEffect` + `setTimeout(5000)` en la ruta `/vacantes`, una sola vez por sesión (flag en `sessionStorage`).

- **Tracking del funnel Kyo → aplicación** — No hay evento analytics para cuando Kyo presenta recomendaciones. Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`. Sin este evento es imposible medir el ROI de Kyo.

- **Confirmación de acciones en revisor** — Ver BUG 32. El cliente necesita saber que su aprobación o solicitud de cambios fue registrada, especialmente Rosy y Monse que acceden principalmente desde mobile.

- **Discrepancias de estadísticas en el sitio** — `/contacto/page.tsx` dice "10 años"; `knowledge.ts` dice "3+"; posiblemente `Hero.tsx` dice otro número. Elegir el número correcto y unificarlo en todos los archivos.
