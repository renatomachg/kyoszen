# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-12
**Cambios analizados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/[id]/_content.tsx`, `src/app/vacantes/page.tsx`, `src/app/admin/(panel)/vacantes/_form.tsx`, `src/lib/courses.ts`

---

## Cambios Recientes Detectados

Hoy no hubo commits de código — solo health checks automáticos del VPS y actualización de CLAUDE.md. Los bugs identificados ayer **siguen sin corregir**. Este reporte los re-escala con prioridad máxima y añade 4 observaciones nuevas del análisis profundo de hoy.

---

## 🔴 BUGS CRÍTICOS — PENDIENTES (escalados por 2 días)

### BUG 1 — Kyo recomienda vacantes de demo que no existen en producción *(máxima prioridad)*
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider.listJobs()` lee del array `JOBS` hardcodeado en `src/lib/jobs.ts`. Las vacantes creadas en Supabase son completamente invisibles para Kyo. En el Paso 5, Kyo recomienda IDs de demo (`id=1`, `id=2`…) que generan un 404 cuando el candidato hace clic. Este es el error de mayor impacto: el flujo principal del asistente está roto en producción.

**Fix concreto** — en `src/app/api/assistant/chat/route.ts`, agregar antes del loop de herramientas:
```ts
// Leer vacantes reales de Supabase al inicio del request
const { data: vacantesSupabase } = await sbAdmin
  .from("vacantes")
  .select("id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion,tags,salario_nota,beneficios,horario")
  .eq("activa", true);
```
Pasar `vacantesSupabase` a `buildSystemPrompt()` y a `executeTool()` en lugar del singleton estático.

---

### BUG 2 — Valores de Jornada, Contrato y Ubicación son distintos en form admin, filtros públicos y system prompt de Kyo
**Archivos:** `src/app/admin/(panel)/vacantes/_form.tsx` líneas 48-50, `src/app/vacantes/page.tsx` líneas 28-32, `src/lib/assistant/system-prompt.ts` líneas 85-91

| Campo | Form admin (lo que entra a BD) | Filtros públicos | URL que Kyo construye |
|---|---|---|---|
| `jornada` | `Tiempo completo / Medio tiempo / Por proyecto` | `Matutina / Vespertina / Mixta / Flexible` | `Matutina` |
| `contrato` | `Indefinido / Temporal / Por honorarios` | `Tiempo completo / Medio tiempo / Por proyecto` | `Tiempo completo` |
| `ubicacion` | `Presencial / Remoto / Hibrido` | `CDMX / Estado de México / Híbrido / Remoto` | `CDMX` |

Los tres juegos de valores son incompatibles. Los filtros públicos siempre devuelven 0 resultados porque ningún valor de la BD coincide con las opciones del `DropdownPill`.

**Fix:** Unificar los tres. Recomendación:
- `jornada`: usar `Tiempo completo / Medio tiempo / Por proyecto` en form + filtros + Kyo.
- `contrato`: usar `Indefinido / Temporal / Por honorarios` en form + filtros + Kyo.
- `ubicacion`: cambiar form a `CDMX / Estado de México / Híbrido / Remoto` y actualizar `UBICACIONES` en `vacantes/page.tsx` línea 28. Actualizar los ejemplos de URL en `system-prompt.ts` líneas 85-91.

---

### BUG 3 — Horario, beneficios y salario_nota no llegan a Kyo
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 30-40 (interface `JobSummary`) y líneas 138-154 (`listJobs`)

`JobSummary` no incluye estos campos. Si el candidato pregunta "¿cuál es el horario?" o "¿qué prestaciones incluye?", Kyo responde que no tiene información aunque exista en la BD.

**Fix en `JobSummary` (línea 30):**
```ts
horario?: string | null;
beneficios?: string[];
salario_nota?: string | null;
```
**Fix en el mapper de `listJobs` (línea 142):**
```ts
horario: j.horario ?? null,
beneficios: j.beneficios ?? [],
salario_nota: j.salario_nota ?? null,
```
En el system prompt, agregar en Paso 5: *"Si la vacante tiene beneficios o horario, menciona los más relevantes al presentarla."*

---

### BUG 4 — Filtro "Marca" usa empresas de demostración hardcodeadas
**Archivo:** `src/app/vacantes/page.tsx` línea 29

```ts
const MARCAS = ["Todas", "Grupo Corpora", "Logística Norte", "Sigma Retail", "Clínica Vitalis", "Finanzas MX", "Contact Nova"];
```
Estas son empresas ficticias. Las vacantes reales de Supabase tienen otros nombres y nunca coincidirán. El filtro "Marca" es inoperante en producción.

**Fix (opción B — correcta):**
```ts
const marcasDisponibles = useMemo(
  () => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())],
  [jobs]
);
```
Reemplazar `MARCAS` por `marcasDisponibles` en el `DropdownPill` de la línea 180.

---

### BUG 5 — Empresa default "Kyoszen" en el form y en el parser de IA
**Archivos:** `src/app/admin/(panel)/vacantes/_form.tsx` línea 30, `src/app/api/admin/parse-vacante/route.ts` línea 28

El estado inicial tiene `empresa: "Kyoszen"`. Si el admin parsea una vacante de un cliente y el texto no menciona la empresa explícitamente, se publicará con empresa "Kyoszen" en vez de quedar como "Confidencial".

**Fix `_form.tsx` línea 30:** `empresa: ""`
**Fix `parse-vacante/route.ts`:** cambiar el hint de IA a `"empresa": "string (dejar vacío si no se menciona explícitamente)"`.

---

## Bugs Nuevos Detectados (hoy)

### BUG 6 — SITE_PAGES dice "15 cursos" pero el catálogo real tiene ~75
**Archivo:** `src/lib/assistant/knowledge.ts` línea 63

```ts
summary: "15 cursos con filtros por categoria (RRHH, Liderazgo, Calidad, Digital, Ventas, Normatividad)..."
```
`src/lib/courses.ts` contiene 75 entradas en `COURSES[]` (solo RRHH tiene 18 según el comentario de sección). Cuando Kyo responde a "¿cuántos cursos tienen?" con `get_company_info`, informa 15 cuando hay ~75. Esto genera desconfianza si el candidato navega al catálogo y ve más cursos de los mencionados.

**Fix en `knowledge.ts` línea 63:** Cambiar la summary a un conteo dinámico, o al menos correcto:
```ts
summary: `${COURSES.length} cursos con filtros por categoría (RRHH, Liderazgo, Calidad, Digital, Ventas, Normatividad) y modalidad.`,
```

---

### BUG 7 — Salario $0 puede publicarse sin validación
**Archivo:** `src/app/admin/(panel)/vacantes/_form.tsx` línea 35

El estado inicial tiene `salario: 0` y no hay validación que impida guardar con salario cero. Una vacante con `$0 / mes` en el sitio público parece un error y daña la credibilidad.

**Fix:** Agregar al handler de guardado:
```ts
if (!form.salario || form.salario <= 0) {
  setError("El salario debe ser mayor a 0.");
  return;
}
```

---

### BUG 8 — MAX_TOOL_ITERATIONS=5 puede quedarse corto en el Paso 5
**Archivo:** `src/app/api/assistant/chat/route.ts` línea 85

En el Paso 5, Kyo puede ejecutar: `search_jobs` → `get_job_details` (vacante 1) → `get_job_details` (vacante 2) → `navigate_to` = 4 iteraciones. Si además hay una llamada a `get_company_info` para armar la presentación, llega exactamente al límite de 5 y el último mensaje puede truncarse o no enviarse.

**Fix:** Aumentar `MAX_TOOL_ITERATIONS` de `5` a `8` en la línea 85. El costo en latencia es mínimo porque las iteraciones extras solo se ejecutan si el modelo sigue llamando herramientas.

---

## Sugerencias de UX

### Alta prioridad

- **CTAs de vacante inaccesibles en mobile** — `src/app/vacantes/[id]/_content.tsx` líneas 192-233. En pantallas < 1024px el layout es de una columna y los botones "Aplicar ahora" y "WhatsApp" quedan debajo de toda la descripción, requisitos, horario y beneficios. En vacantes extensas el candidato móvil abandona sin llegar al CTA.

  **Fix:** Agregar una barra fija solo en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border px-5 py-3 flex gap-3 z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 text-[13px] font-extrabold">
      Aplicar ahora
    </button>
    <a href="https://wa.link/5zv0ba" target="_blank" className="flex items-center justify-center gap-1.5 bg-wa text-white rounded-full px-4 py-3 text-[13px] font-extrabold no-underline">
      <WhatsAppIcon size={16} /> WhatsApp
    </a>
  </div>
  ```
  Añadir `pb-20 lg:pb-0` al contenedor principal para que el contenido no quede tapado.

- **Sin skeleton durante la carga de vacantes** — `src/app/vacantes/page.tsx` líneas 206-235. La página queda en blanco mientras Supabase responde. Agregar 8 tarjetas placeholder con `animate-pulse` cuando `jobs.length === 0`:
  ```tsx
  {jobs.length === 0 && (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-border p-5 h-52 animate-pulse">
          <div className="h-3 bg-bg rounded mb-3 w-1/2" />
          <div className="h-5 bg-bg rounded mb-2" />
          <div className="h-3 bg-bg rounded mb-4 w-2/3" />
          <div className="h-16 bg-bg rounded" />
        </div>
      ))}
    </div>
  )}
  ```

- **Empty state sin salida** — `src/app/vacantes/page.tsx` líneas 231-235. El candidato que no encuentra resultados ve solo texto y no sabe qué hacer.

  **Fix:** Reemplazar el `div` por:
  ```tsx
  <div className="text-center py-16">
    <h3 className="text-lg font-bold text-navy mb-2">Sin resultados</h3>
    <p className="text-sm text-muted mb-6">No encontramos vacantes con esos filtros.</p>
    <div className="flex justify-center gap-3 flex-wrap">
      <button onClick={clearAll} className="bg-navy text-white rounded-full px-5 py-2.5 text-sm font-bold">
        Limpiar filtros
      </button>
      <a href="https://wa.link/5zv0ba" target="_blank" className="bg-wa text-white rounded-full px-5 py-2.5 text-sm font-bold flex items-center gap-2 no-underline">
        <WhatsAppIcon size={15} /> Consultar por WhatsApp
      </a>
    </div>
  </div>
  ```

### Media prioridad

- **Overflow del filtro en mobile** — `src/app/vacantes/page.tsx` línea 175. El `inline-flex` de pills es una fila horizontal que en pantallas < 480px oculta los últimos filtros (Jornada, Salario) sin indicación de scroll. Agregar `overflow-x-auto [&::-webkit-scrollbar]:hidden` al wrapper de filtros.

- **`salario_nota` ausente en la card del listado** — `src/app/vacantes/page.tsx` línea 223. La card muestra `$X / mes` pero no la nota (ej. "Neto · pago semanal"). Agregar `salario_nota` al interface `Vacante` de la línea 12 y mostrar la nota debajo del salario:
  ```tsx
  {job.salario_nota && (
    <span className="text-[10px] text-muted block mt-0.5">{job.salario_nota}</span>
  )}
  ```

- **"Confidencial" sin diferenciación visual** — `src/app/vacantes/page.tsx` línea 216. Aparece con el mismo estilo `text-blue font-bold uppercase` que una empresa real. Cambiar a `text-muted italic` cuando no hay empresa:
  ```tsx
  <p className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${job.empresa?.trim() ? "text-blue" : "text-muted italic"}`}>
    {job.empresa?.trim() ? job.empresa : "Confidencial"}
  </p>
  ```

- **Horario ausente de las InfoPills** — `src/app/vacantes/[id]/_content.tsx` líneas 104-121. El horario es relevante para la decisión inicial del candidato pero solo aparece en la sección de texto más abajo. Agregar una InfoPill con ícono de reloj si `job.horario` tiene valor (primera línea del texto):
  ```tsx
  {job.horario?.trim() && (
    <InfoPill
      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
      label={job.horario.split("\n")[0]}
    />
  )}
  ```

### Baja prioridad

- **Los filtros de vacantes no actualizan la URL** — `src/app/vacantes/page.tsx`. Cambiar un filtro no modifica la URL. Agregar `router.replace` en cada handler para que el candidato pueda compartir o recargar manteniendo los filtros.

- **`aria-label` falta en InfoPills** — `src/app/vacantes/[id]/_content.tsx` líneas 249-256. Los íconos SVG no tienen texto alternativo para lectores de pantalla. Agregar `aria-hidden="true"` a cada SVG y `<span className="sr-only">{label}</span>` dentro del `InfoPill`.

- **El chat no tiene `role="dialog"`** — `src/components/assistant/ChatWidget.tsx` línea 115. El panel del chat no tiene semántica de diálogo. Agregar `role="dialog" aria-label="Chat con Kyo" aria-modal="true"` al `motion.div` del panel.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía en la presentación** — `src/lib/assistant/system-prompt.ts` línea 44. El formato `[Empresa]` dejará un hueco si la vacante es confidencial. Agregar al Paso 5: *"Si la empresa de una vacante es vacía o null, usa 'empresa confidencial' al presentarla."*

- **Paso 6 no tiene manejo de rechazo** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "Ninguna me interesa" o "No me convence", no hay instrucción para ese caso. Agregar Paso 6b: *"Si el usuario no quiere aplicar: agradece, ofrece quedar en banco de talentos con `navigate_to('/contacto')` y sugiere `/cursos` si quiere reforzar su perfil."*

- **Leads de empresas sin captura de datos** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando alguien dice "Quiero contratar personal", Kyo navega a `/contacto` sin recopilar datos. Modificar esa instrucción para que Kyo pregunte primero: *"¿Me podría decir el nombre de su empresa y el tipo de perfil que necesita? Así nuestro equipo estará listo para atenderle."*

- **Historial truncado puede perder el perfil del candidato** — `src/app/api/assistant/chat/route.ts` línea 131. La ventana de 20 mensajes puede eliminar los pasos iniciales (nombre, puesto, zona) en conversaciones largas. Solución: instruir a Kyo para que al completar el Paso 3 emita un resumen compacto: *"Perfecto, [nombre]. Perfil: [puesto], [N] años de experiencia, zona [X], jornada [Y]."* Este resumen actúa como memoria comprimida si los primeros mensajes se truncan.

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo conoce la jornada preferida del candidato desde el Paso 4 pero no puede pasarla a la búsqueda. Agregar:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Tiempo completo, Medio tiempo, Por proyecto" },
  contrato: { type: "string", description: "Filtra por contrato: Indefinido, Temporal, Por honorarios" },
  ```

- **Nueva tool: `register_talent_interest`** — cuando no hay vacante compatible, Kyo redirige a `/contacto` pero no guarda el perfil de forma estructurada. Propuesta:
  ```ts
  {
    name: "register_talent_interest",
    description: "Registra el perfil de un candidato en el banco de talentos cuando no hay vacante disponible.",
    input_schema: {
      properties: {
        nombre: { type: "string" },
        puesto: { type: "string" },
        experiencia_anios: { type: "number" },
        ubicacion: { type: "string" },
        jornada: { type: "string" },
        notas: { type: "string" }
      },
      required: ["nombre", "puesto"]
    }
  }
  ```
  En `executeTool`: insertar en la tabla `contactos` con `origen: 'kyo_banco_talentos'`. Cierra el flujo sin requerir que el candidato llene el formulario manualmente.

### Problemas detectados

- **Fallback vacío cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Kyo ejecuta solo `navigate_to`, `finalText` queda vacío y el candidato recibe: *"Entendido, ¿en que mas te puedo ayudar?"* (sin contexto y con tildes incorrectas). Corregir:
  ```ts
  const replyContent = finalText || (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **max_tokens 1024 puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 153. Presentar 2-3 vacantes con título, empresa y justificación consume ~600-800 tokens. Con el overhead del sistema, el budget puede quedar corto. Aumentar a `max_tokens: 1536`.

- **"Nueva conversacion" sin acento** — `src/components/assistant/ChatWidget.tsx` línea 161. Corregir a `"Nueva conversación"`.

- **"en que mas" sin tildes en el fallback** — `src/app/api/assistant/chat/route.ts` línea 202. Corregir a `"¿en qué más te puedo ayudar?"`.

- **sessionId y historial usan almacenamientos distintos** — `src/components/assistant/useChat.ts` líneas 45-53 vs líneas 36-43. El `session_id` usa `sessionStorage` (se destruye al cerrar la pestaña) pero el historial usa `localStorage` (persiste). Si el usuario reabre el sitio, ve el historial de Kyo pero el `session_id` es nuevo. Las conversaciones guardadas en Supabase quedan fragmentadas bajo IDs diferentes para el mismo usuario. Solución: mover `session_id` a `localStorage` con la misma key de historial para que el ID sea consistente mientras exista historial.

---

## Oportunidades de mejora general

- **Auto-apertura contextual de Kyo en `/vacantes`** — Si el candidato lleva más de 3 segundos en la página sin haber abierto el chat, mostrar un bubble: *"¿Te ayudo a encontrar la vacante ideal para tu perfil?"* con `useEffect` + `setTimeout`. Actualmente la página tiene filtros potentes pero ningún punto de entrada guiado.

- **Tracking del embudo completo Kyo → aplicación** — No existe evento analytics para el momento en que Kyo presenta una recomendación de vacante. Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en el route cuando `navigations` incluya `/vacantes/[id]`. Sin este evento es imposible medir el ROI de Kyo.

- **Indicador de progreso en el flujo de Kyo** — El chat de 6 pasos no informa al candidato en qué etapa está. Un indicador sutil en el header (ej. "Paso 2 de 5") reduciría abandonos al hacer el proceso predecible. El frontend puede inferir la etapa por el número de mensajes del usuario sin cambios en la API.

- **Búsqueda sin feedback de "cargando"** — `src/app/vacantes/page.tsx`. Al escribir en el campo de búsqueda, el filtrado es instantáneo (client-side), pero si el usuario escribe rápido puede ver 0 resultados momentáneamente antes de que el estado se actualice. Un debounce de 150ms en el filtro visual (no en el evento de analytics que ya tiene 1200ms) evitaría ese parpadeo.

- **Kyo no menciona el tiempo de respuesta de Kyoszen** — `src/lib/assistant/knowledge.ts` línea 99. El stat `"Tiempo de respuesta": "24 horas"` nunca lo usa Kyo en el cierre. Agregar en el Paso 6 del system prompt: *"Menciona que nuestro equipo se pone en contacto en menos de 24 horas."* Es el argumento más eficaz para que el candidato aplique de inmediato.
