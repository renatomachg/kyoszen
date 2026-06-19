# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-19
**Cambios analizados:** Sin commits de código desde 2026-06-17. Los 4 commits de esa sesión ya estaban cubiertos en el reporte anterior. Archivos re-leídos hoy: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/revisor/page.tsx`, `src/app/vacantes/page.tsx`.

---

## Cambios Recientes Detectados

**No hay commits de código nuevos desde el 17 de junio.** Solo commits automáticos del cron (`health check` y `ux-kyo analysis`). Los bugs listados a continuación llevan acumulando días sin atención.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES

### BUG 1 — Kyo recomienda vacantes fantasma *(8º día)*
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider` lee de `src/lib/jobs.ts` (array demo). El panel admin escribe en Supabase. Kyo presenta IDs de demo que generan 404 al hacer clic. El Paso 5 del flujo — el más importante — está roto para todos los candidatos.

**Fix en `src/app/api/assistant/chat/route.ts`:** Antes del loop de herramientas, consultar vacantes activas:
```ts
const { data: vacantesBD } = await sbAdmin
  .from("vacantes")
  .select("id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion,tags")
  .eq("activa", true);
```
Luego crear un `DynamicKnowledgeProvider` que reciba `vacantesBD` e inyectarlo en `buildSystemPrompt()` y `TOOLS`.

---

### BUG 2 — Filtro "Marca" en `/vacantes` hardcodeado, siempre devuelve 0 *(8º día)*
**Archivo:** `src/app/vacantes/page.tsx` línea 29

```ts
const MARCAS = ["Todas", "Grupo Corpora", "Logística Norte", "Sigma Retail", ...];
```
Estas marcas son demo, no existen en Supabase. Kyo navega con `?marca=Sigma Retail` y el candidato ve página vacía. Además, el system-prompt (línea 86) lista estas mismas marcas demo como filtros disponibles.

**Fix:**
```ts
const marcasDisponibles = useMemo(
  () => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())],
  [jobs]
);
```
Y actualizar el system-prompt para eliminar el filtro `?marca=` hasta que sea dinámico — indicar a Kyo que use `?q=` (búsqueda libre) en su lugar.

---

### BUG 3 — Vocabulario Contrato/Jornada incompatible *(8º día)*
**Archivos:** `src/app/vacantes/page.tsx` líneas 30-31 vs `src/lib/assistant/system-prompt.ts` líneas 85-91

Los tres sistemas (BD, filtros de UI, instrucciones de Kyo) usan valores distintos para el mismo concepto. Filtrar `?contrato=Tiempo completo` devuelve 0 si en la BD el valor es `"tiempo-completo"`. Auditar los valores reales en Supabase con `SELECT DISTINCT contrato, jornada FROM vacantes` y homologar los tres sistemas.

---

### BUG 14 — FAQs del panel admin nunca llegan a Kyo *(8º día)*
**Archivos:** `src/lib/assistant/knowledge.ts` líneas 99-105

`buildSystemPrompt()` usa `COMPANY.faqs` (hardcodeado en el mismo archivo), ignorando `kyo_faqs` de Supabase. El admin puede editar FAQs desde el panel sin ningún efecto en Kyo.

**Fix:** Añadir fetch de `kyo_faqs` en `route.ts` y pasarlas a `buildSystemPrompt()` como parámetro.

---

### BUG 16 — `rateLimitMap` crece sin límite (memory leak en VPS) *(8º día)*
**Archivo:** `src/app/api/assistant/chat/route.ts` líneas 68-80

El `Map` nunca se limpia. Con días de uptime y bots, puede agotar la RAM del VPS (4 GB).

**Fix mínimo al inicio de `checkRateLimit`:**
```ts
if (rateLimitMap.size > 10_000) {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (val.resetAt < now) rateLimitMap.delete(key);
  }
}
```

---

### BUG 23 — `reset()` no regenera sessionId *(8º día)*
**Archivo:** `src/components/assistant/useChat.ts` líneas 139-145

"Nueva conversación" borra `localStorage` pero no borra `sessionStorage.kyo_session_id`. El siguiente chat sobreescribe la conversación anterior en `kyo_conversaciones` de Supabase, perdiendo el historial.

**Fix (una línea):**
```ts
const reset = useCallback(() => {
  setMessages([INITIAL_GREETING]);
  setError(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("kyo_session_id"); // ← añadir esto
  }
}, []);
```

---

### BUG 25 — Cursos del sitio y Kyo ignoran la tabla Supabase *(8º día)*
**Archivos:** `src/app/cursos/page.tsx` y `src/lib/assistant/knowledge.ts` líneas 1-2

La página `/cursos` y Kyo leen de `COURSES` (array estático). Los cambios del admin en `/admin/cursos` nunca se reflejan en el sitio público ni en Kyo.

---

### BUG 26 — Markdown de Kyo renderiza asteriscos literales *(8º día)*
**Archivo:** `src/components/assistant/ChatWidget.tsx` líneas 211 y 227

El Paso 5 usa `**texto**` y listas numeradas. Con `whitespace-pre-wrap`, los asteriscos aparecen literales en la burbuja.

**Fix seguro (solo burbujas del asistente):**
```tsx
function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}
// En MessageBubble (isUser === false):
<div dangerouslySetInnerHTML={{ __html: renderMarkdown(message.content) }} className="..." />
```

---

### BUG 28 — Tour de novedad bloquea la pantalla en pestaña "📊 Análisis" *(3º día)*
**Archivo:** `src/app/revisor/page.tsx` línea ~1250

`showNovedad` se renderiza sin importar el valor de `seccion`. Si el usuario está viendo Análisis, los selectores `[data-fpill]` no existen en el DOM. El tour muestra el overlay oscuro sin spotlight y el usuario queda atrapado sin poder cerrar.

**Fix (una línea):**
```tsx
{showNovedad && seccion === "publicaciones" && <NovedadFiltros onClose={() => setShowNovedad(false)} />}
```

---

### BUG 29 — Modal del revisor: grid 2 columnas se rompe en mobile *(3º día)*
**Archivo:** `src/app/revisor/page.tsx` línea ~194

`gridTemplateColumns: "1fr 1fr"` no tiene fallback responsive. En mobile (< 700px) el mockup y las acciones se comprimen a ~50% cada uno. Rosy y Monse acceden desde el celular.

**Fix:**
```tsx
// Añadir clase al div
<div className="post-modal-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>

// En <style> al fondo del componente:
.post-modal-grid { grid-template-columns: 1fr 1fr; }
@media (max-width: 700px) { .post-modal-grid { grid-template-columns: 1fr !important; } }
```

---

### BUG 32 — Sin confirmación visual al aprobar o solicitar cambios *(3º día)*
**Archivo:** `src/app/revisor/page.tsx` funciones `aprobar` (línea 125) y `enviarCambios` (línea 137)

El botón cambia de color pero no hay toast ni banner. El cliente (especialmente en mobile) no tiene certeza de que su acción fue registrada.

**Fix:** Añadir `const [exito, setExito] = useState<string | null>(null)` y tras cada acción:
```tsx
setExito("✅ Publicación aprobada. El equipo fue notificado.");
setTimeout(() => setExito(null), 4000);
```
Mostrar `exito` como banner verde fijo en la parte superior del modal.

---

### BUG 33 — `postsTodos` se refetch en cada cambio de período *(3º día)*
**Archivo:** `src/app/revisor/page.tsx` líneas 934-940

`loadData` incluye siempre el fetch `/api/revisor/posts` sin fechas (todos los posts históricos), aunque no haya filtros activos. Se ejecuta al navegar entre semanas.

**Fix:**
```ts
// Cargar postsTodos solo una vez al iniciar sesión:
useEffect(() => {
  if (!user) return;
  fetch("/api/revisor/posts")
    .then(r => r.json())
    .then(d => { if (Array.isArray(d)) setPostsTodos(d); });
}, [user]);

// Quitar el fetch de postsTodos dentro de loadPosts
```

---

## 🟡 BUGS NUEVOS — DETECTADOS HOY (2026-06-19)

### BUG 36 — `getSessionId` usa `sessionStorage`: cada pestaña nueva borra el contexto de Kyo
**Archivo:** `src/components/assistant/useChat.ts` líneas 45-53

`sessionStorage` se limpia al cerrar la pestaña y es exclusivo por pestaña. Si el candidato abre el sitio en una pestaña nueva mientras chatea en otra, genera un `sessionId` diferente. El historial (`localStorage`) persiste pero Supabase recibe dos conversaciones distintas, perdiendo el seguimiento del candidato.

**Fix:** Cambiar a `localStorage` para que el `sessionId` persista entre pestañas y sesiones:
```ts
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = localStorage.getItem("kyo_session_id");
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("kyo_session_id", sid);
  }
  return sid;
}
```
Y en `reset()` limpiar también: `localStorage.removeItem("kyo_session_id");`

---

### BUG 37 — Kyo usa `?marca=` pero el filtro de vacantes espera nombre exacto de empresa
**Archivos:** `src/lib/assistant/system-prompt.ts` línea 86, `src/app/vacantes/page.tsx` línea 95

El sistema-prompt enseña a Kyo a navegar con `?marca=Sigma Retail`, pero en `vacantes/page.tsx` el filtro hace `j.empresa === marca` (igualdad exacta). Las empresas reales en Supabase no son las del ejemplo. Resultado: cualquier URL con `?marca=` que genere Kyo devuelve 0 resultados.

**Fix inmediato (sin cambiar BD):** Reemplazar en el system-prompt la instrucción de `?marca=` por `?q=` (búsqueda libre que sí funciona):
```
- /vacantes?q=logistica (búsqueda libre — PREFERIR sobre ?marca=)
```

---

### BUG 38 — Empty state de `/vacantes` no tiene CTA alternativo
**Archivo:** `src/app/vacantes/page.tsx` líneas 231-235

Cuando `filtered.length === 0`, el componente muestra "Sin resultados" sin un botón "Limpiar filtros" ni un link a WhatsApp. El botón "Limpiar filtros" solo existe en la barra superior (línea 195) y queda fuera de la vista cuando el candidato scrolleó hasta el empty state.

**Fix:**
```tsx
<div className="text-center py-16">
  <span className="text-4xl">😕</span>
  <h3 className="text-lg font-bold text-navy mt-4 mb-2">Sin vacantes con esos filtros</h3>
  <p className="text-sm text-muted mb-5">Intenta con otros criterios o escríbenos directamente.</p>
  <div className="flex gap-3 justify-center flex-wrap">
    {anyActive && (
      <button onClick={clearAll} className="text-sm font-bold text-white bg-blue px-5 py-2.5 rounded-full">
        Limpiar filtros
      </button>
    )}
    <a href="https://wa.link/5zv0ba" target="_blank" rel="noopener noreferrer"
       className="text-sm font-bold text-navy border border-border px-5 py-2.5 rounded-full hover:border-blue">
      Hablar con un reclutador →
    </a>
  </div>
</div>
```

---

### BUG 39 — `"Nueva conversacion"` sin acento en el botón de reset
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 159

```tsx
<button type="button" onClick={reset} className="text-[11px] text-muted hover:text-navy font-medium">
  Nueva conversacion
</button>
```
Falta el acento: debe ser `"Nueva conversación"`. Pequeño pero afecta la percepción de calidad.

---

### BUG 40 — `kyo_faqs` en Supabase no tiene límite de resultados en el fetch de `route.ts`
**Archivo:** `src/app/api/assistant/chat/route.ts`

Cuando se integren las FAQs dinámicas (fix de BUG 14), el fetch sin `.limit()` traerá todas las filas. Si se acumulan decenas de FAQs, el system-prompt superará el límite de tokens y Anthropic devolverá un error.

**Prevención:** Al agregar el fetch de FAQs, incluir siempre `.limit(20).order("id")`.

---

## Sugerencias de UX

### Alta prioridad

- **CTA fijo en mobile para aplicar a vacante** — `src/app/vacantes/[id]/_content.tsx`. El sidebar sticky con "Aplicar ahora" solo aparece en `lg:`. En mobile el candidato tiene que hacer scroll completo para llegar al CTA. Añadir barra fija inferior en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border lg:hidden z-20">
    <button onClick={() => setModalOpen(true)} className="w-full bg-blue text-white font-bold py-3 rounded-full">
      Aplicar ahora
    </button>
  </div>
  ```

- **Confirmación visual al aprobar/solicitar cambios (BUG 32)** — Crítico para Rosy y Monse en mobile.

- **Responsive del modal en `/revisor` (BUG 29)** — Las revisoras usan el celular.

### Media prioridad

- **`PostCard` inconsistente entre vista semana y mes** — Vista semana usa `<RedLogo>` simple; vista mes usa pill con fondo de color y borde izquierdo. Unificar al pill de color en ambas vistas para coherencia.

- **Descripción del filtro activo en modo filtro** — `src/app/revisor/page.tsx` línea ~1108. Cuando hay filtros activos, el header dice "Resultados del filtro" sin indicar cuáles. Si el usuario scrolleó, no sabe qué está filtrando. Añadir: `Filtro: {ESTADO[filtroEstado]?.label ?? "Todos"} · {filtroRed !== "todos" ? filtroRed.toUpperCase() : "Todas las redes"}`.

- **Tour de novedad cuando no hay posts** — `src/app/revisor/page.tsx` línea ~910. El coach-mark de filtros aparece aunque no haya publicaciones, resaltando píldoras vacías. Fix: `if (user && posts.length > 0 && !novedadVista) setShowNovedad(true);`

### Baja prioridad

- **Sin skeleton durante carga en `/revisor`** — Mostrar 6 cards `animate-pulse` mientras `loading === true` reduce la percepción de latencia.
- **Falta `role="dialog"` y `aria-modal="true"` en PostModal** — `src/app/revisor/page.tsx` línea ~165. Accesibilidad básica.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía** — `src/lib/assistant/system-prompt.ts` línea 44. Si la vacante tiene empresa vacía, `[Empresa]` queda en blanco. Agregar instrucción: *"Si empresa es null o vacía, mostrar 'empresa confidencial'."*

- **Paso 6 no maneja el rechazo del candidato** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "ninguna me interesa", no hay flujo definido. Agregar Paso 6b: *"Si el candidato rechaza todas las opciones: agradecer, ofrecer banco de talentos con `navigate_to('/contacto')` y sugerir `/cursos` si quiere mejorar su perfil."*

- **Kyo no menciona las 24h de respuesta** — El dato más convincente para motivar la aplicación no aparece en el Paso 6. Agregar: *"Al invitar a aplicar, mencionar que el equipo responde en menos de 24 horas hábiles."*

- **Resumen de perfil como ancla contra truncado** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se corta a 20 mensajes. Agregar al Paso 3: *"Al completar pasos 0-4, sintetizar en una línea: 'Perfil: [nombre], [puesto], [N] años, zona [X], [jornada].' Preserva el contexto si el historial se trunca."*

- **Pre-calificación de leads empresariales** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto` sin capturar datos. Mejorar: preguntar *"¿Nombre de su empresa y qué perfil busca?"* antes de navegar.

### Nuevas tools recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge la jornada en el Paso 4 pero no puede filtrar por ella.
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```

- **Nueva tool `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool lo capturaría directamente en Supabase con `origen: 'kyo_banco_talentos'` y el perfil completo (puesto, experiencia, zona, jornada).

### Problemas detectados

- **Fallback genérico cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to` sin texto, la respuesta es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acento, sin contexto). Fix:
  ```ts
  const replyContent = finalText ||
    (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 consume ~700-900 tokens. Con 1024 el margen es mínimo. Fix: `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` demasiado bajo** — `src/app/api/assistant/chat/route.ts` línea 85. El Paso 5 requiere `search_jobs` → `get_job_details` × 2 → `navigate_to` = 4 iteraciones mínimo. Fix: `const MAX_TOOL_ITERATIONS = 8;`

- **`getStoredInstrucciones()` usa anon key** — `src/app/api/assistant/chat/route.ts` líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente. Reemplazar con `sbAdmin` (ya declarado en línea 36).

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo de Kyo** — El candidato no sabe en qué paso está. Un texto sutil en el header del chat (ej. "Paso 2 de 5 — Experiencia") reduce abandonos. Implementar en `ChatWidget.tsx` contando mensajes del usuario para inferir el paso actual.

- **Auto-apertura contextual de Kyo en `/vacantes`** — Un candidato que lleva 5 segundos filtrando sin resultados se beneficia de un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. Implementar con `useEffect` + `setTimeout(5000)` en la ruta `/vacantes`, una vez por sesión.

- **Tracking del funnel Kyo → aplicación** — No hay evento analytics cuando Kyo presenta recomendaciones. Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`. Sin este evento es imposible medir el ROI de Kyo.

- **Discrepancias de estadísticas en el sitio** — `/contacto/page.tsx` dice "10 años"; `knowledge.ts` dice "3+". Unificar con el número correcto.

- **Límite de resultados en `/api/revisor/posts` sin fechas** — Con meses de contenido acumulado, el endpoint sin fecha devolverá cientos de posts. Agregar `.limit(500)` o filtro por año en curso.

---

## Prioridad de acción sugerida

| # | Bug | Esfuerzo | Impacto |
|---|-----|----------|---------|
| 1 | BUG 1 — Vacantes reales en Kyo | Alto | Crítico |
| 2 | BUG 26 — Markdown asteriscos | Bajo (5 min) | Alto |
| 3 | BUG 23 + 36 — sessionId | Bajo (2 líneas) | Alto |
| 4 | BUG 29 — Modal responsive mobile | Bajo (CSS) | Alto |
| 5 | BUG 32 — Confirmación aprobar | Bajo (30 min) | Alto |
| 6 | BUG 2 + 37 — Filtros dinámicos | Medio | Alto |
| 7 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio |
| 8 | BUG 38 — Empty state vacantes | Bajo (20 min) | Medio |
| 9 | BUG 28 — Tour en pestaña análisis | Bajo (1 línea) | Medio |
| 10 | BUG 14 — FAQs dinámicas | Medio | Medio |
