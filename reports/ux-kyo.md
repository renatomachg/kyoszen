# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-13
**Cambios analizados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/components/ui/AplicarModal.tsx`, `src/components/layout/Navbar.tsx`, `src/components/sections/Hero.tsx`, `src/app/contacto/page.tsx`

---

## Cambios Recientes Detectados

Sin commits de código en las últimas 48 horas — solo health checks automáticos del VPS. Los bugs críticos acumulados de los dos reportes anteriores siguen abiertos. Este reporte escala los de mayor impacto y añade **12 hallazgos nuevos** detectados hoy.

---

## 🔴 BUGS CRÍTICOS — PENDIENTES (tercer día sin corregir)

### BUG 1 — Kyo recomienda vacantes que no existen en producción *(máxima prioridad)*
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider.listJobs()` lee del array estático `JOBS` de `src/lib/jobs.ts`. Las vacantes creadas en Supabase son completamente invisibles para Kyo. En el Paso 5, Kyo recomienda IDs de demo (`id=1`, `id=2`) que generan un 404 cuando el candidato hace clic. **El flujo principal del asistente está roto en producción.**

**Fix en `src/app/api/assistant/chat/route.ts`** — agregar antes del loop de herramientas:
```ts
const { data: vacantesSupabase } = await sbAdmin
  .from("vacantes")
  .select("id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion,tags,salario_nota,beneficios,horario")
  .eq("activa", true);
```
Pasar `vacantesSupabase` a `buildSystemPrompt()` y a `executeTool()` en lugar del singleton estático.

---

### BUG 2 — Filtro "Marca" siempre devuelve 0 resultados
**Archivo:** `src/app/vacantes/page.tsx` línea 29

```ts
const MARCAS = ["Todas", "Grupo Corpora", "Logística Norte", "Sigma Retail", "Clínica Vitalis", "Finanzas MX", "Contact Nova"];
```
Estas son empresas de demo ficticias. Las vacantes reales en Supabase tienen otros nombres.

**Fix (opción correcta):**
```ts
const marcasDisponibles = useMemo(
  () => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())],
  [jobs]
);
```
Reemplazar `MARCAS` por `marcasDisponibles` en el `DropdownPill` de la línea 180.

---

### BUG 3 — Valores de Contrato y Jornada incompatibles entre form admin, filtros públicos y Kyo
**Archivos:** `src/app/vacantes/page.tsx` líneas 30-31, `src/lib/assistant/system-prompt.ts` líneas 85-91

| Campo | Form admin (entra a BD) | Filtros públicos (vacantes/page.tsx) | URL que Kyo construye |
|---|---|---|---|
| `contrato` | `Indefinido / Temporal / Por honorarios` | `Tiempo completo / Medio tiempo / Por proyecto` | `Tiempo completo` |
| `jornada` | `Tiempo completo / Medio tiempo / Por proyecto` | `Matutina / Vespertina / Mixta / Flexible` | `Matutina` |

Los tres juegos de valores son incompatibles — los filtros siempre devuelven 0 coincidencias.

**Fix:** Unificar a los valores del form admin (fuente de verdad: la BD). Actualizar `CONTRATOS` y `JORNADAS` en `vacantes/page.tsx` y los ejemplos de URL en `system-prompt.ts` líneas 85-91.

---

### BUG 4 — "15 cursos" erróneo en knowledge.ts
**Archivo:** `src/lib/assistant/knowledge.ts` línea 63

La página de cursos se describe como "15 cursos" pero el array `COURSES` en `courses.ts` tiene significativamente más entradas. Cuando Kyo responde "¿cuántos cursos tienen?" usando `get_company_info`, informa un número incorrecto.

**Fix:**
```ts
import { COURSES } from "@/lib/courses";
// …
summary: `${COURSES.length} cursos con filtros por categoría (RRHH, Liderazgo, Calidad, Digital, Ventas, Normatividad) y modalidad.`,
```

---

### BUG 5 — MAX_TOOL_ITERATIONS demasiado bajo para el Paso 5
**Archivo:** `src/app/api/assistant/chat/route.ts` línea 85

En el Paso 5, Kyo puede ejecutar: `search_jobs` → `get_job_details` × 2 → `navigate_to` = 4 iteraciones. Con una llamada adicional a `get_company_info`, se alcanza el límite de 5 y el último bloque puede truncarse.

**Fix:** Cambiar `MAX_TOOL_ITERATIONS` de `5` a `8`.

---

## 🟡 Bugs Nuevos Detectados (hoy)

### BUG 6 — Discrepancia de estadísticas: Hero dice 7,000+ colocados, knowledge.ts dice 687+
**Archivos:** `src/components/sections/Hero.tsx` línea 107 y 175, `src/lib/assistant/knowledge.ts` línea 77

El Hero muestra dos fuentes distintas:
- Float card (línea 175): `"7000+"` colocados
- Trust line (línea 107): `"+7000 candidatos colocados"`
- `knowledge.ts` stats: `"Candidatos colocados": "687+"`

Kyo usa el dato de `knowledge.ts`. Si un candidato abre el chat después de ver el Hero, verá números contradictorios. Elegir un número y unificar en ambos archivos.

---

### BUG 7 — Discrepancia de años de experiencia: Hero dice "10+" y knowledge.ts dice "3+"
**Archivos:** `src/components/sections/Hero.tsx` línea 158, `src/lib/assistant/knowledge.ts` línea 79

Float card del Hero: `"10+ Años exp."` — knowledge.ts: `"Años en el mercado": "3+"`.

**Fix:** Unificar al dato correcto en ambos archivos.

---

### BUG 8 — Saludo inicial de Kyo tiene acento faltante (visible al usuario)
**Archivo:** `src/components/assistant/useChat.ts` línea 20

```ts
content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte. ¿Me permite saber su nombre?",
```
`"aqui"` debe ser `"aquí"`. Este es el primer mensaje que ve el candidato — el acento erróneo es inmediatamente visible.

**Fix en línea 20:**
```ts
content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?",
```

---

### BUG 9 — Múltiples acentos faltantes en AplicarModal (visible al usuario)
**Archivo:** `src/components/ui/AplicarModal.tsx` líneas 13-33 y 157

Textos visibles con faltas de ortografía:
- Línea 19: `"Mas de 5 años"` → `"Más de 5 años"`
- Línea 23: `"CDMX — maximo 1 hora de traslado"` → `"máximo"`
- Línea 24: `"Estado de Mexico"` → `"Estado de México"`
- Línea 25: `"Disponible para reubicacion"` → `"reubicación"`
- Línea 31: `"Si, todo en orden"` → `"Sí, todo en orden"`
- Línea 157: `label="Correo electronico"` → `"Correo electrónico"`
- Línea 177: `label="Ubicacion / alcance de traslado"` → `"Ubicación"`
- Línea 187: `label="¿Tienes toda la documentacion basica lista?"` → `"documentación básica"`
- Línea 122: `"en maximo 24 horas habiles"` → `"en máximo 24 horas hábiles"`

---

### BUG 10 — Placeholder del buscador del Hero sin acento
**Archivo:** `src/components/sections/Hero.tsx` línea 84

```tsx
placeholder="¿Que puesto buscas?"
```
Debe ser `"¿Qué puesto buscas?"`.

---

### BUG 11 — Botón de envío en /contacto no responde a la tecla Enter
**Archivo:** `src/app/contacto/page.tsx` línea 115

El botón usa `onClick={handleSubmit}` y no hay un `<form>` que envuelva los campos. Presionar Enter en cualquier campo no envía el formulario — comportamiento esperado por los usuarios de desktop.

**Fix:** Envolver el contenido del formulario en `<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>` y cambiar el botón a `type="submit"`.

---

### BUG 12 — Tocar fuera del modal de aplicación borra el formulario completo
**Archivo:** `src/components/ui/AplicarModal.tsx` línea 79

El backdrop llama a `handleClose` en `onClick`. Si el candidato lleva 3 campos completados y toca accidentalmente el backdrop (muy probable en mobile), pierde todo sin advertencia.

**Fix:** Quitar el `onClick={handleClose}` del backdrop mientras `status === "idle"` con datos cargados, o agregar un `confirm()`:
```ts
// En el onClick del backdrop:
onClick={() => {
  const hasData = formRef.current && new FormData(formRef.current).get("nombre");
  if (!hasData || confirm("¿Cerrar el formulario? Perderás lo que escribiste.")) handleClose();
}}
```

---

### BUG 13 — "Nueva conversacion" sin acento (texto visible)
**Archivo:** `src/components/assistant/ChatWidget.tsx` línea 161

`"Nueva conversacion"` → `"Nueva conversación"`.

---

## Sugerencias de UX

### Alta prioridad

- **CTA de vacante inaccesible en mobile** — `src/app/vacantes/[id]/_content.tsx` líneas 214-232. El sidebar sticky con los botones "Aplicar ahora" y "WhatsApp" solo aplica en `lg:` (1024px+). En mobile, el candidato tiene que bajar por toda la descripción, responsabilidades, requisitos, horario y beneficios para llegar a los CTA. En vacantes extensas, la tasa de aplicación se desploma.

  **Fix:** Agregar barra fija solo en mobile:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border px-5 py-3 flex gap-3 z-40 safe-area-bottom">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 text-[13px] font-extrabold">
      Aplicar ahora
    </button>
    <a href="https://wa.link/5zv0ba" target="_blank" className="flex items-center justify-center gap-1.5 bg-wa text-white rounded-full px-4 py-3 text-[13px] font-extrabold no-underline">
      <WhatsAppIcon size={16} /> WhatsApp
    </a>
  </div>
  ```
  Agregar `pb-20 lg:pb-0` al contenedor principal.

- **Sin esqueleto durante la carga de vacantes** — `src/app/vacantes/page.tsx` línea 206. La página queda en blanco mientras Supabase responde. El `Suspense fallback={null}` (línea 51) tampoco ayuda.

  **Fix:** Mostrar 8 tarjetas placeholder mientras `jobs.length === 0 && !anyActive`:
  ```tsx
  {jobs.length === 0 && !anyActive && (
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

- **Empty state sin salida para el candidato** — `src/app/vacantes/page.tsx` líneas 231-234. El candidato que no encuentra resultados ve solo texto y no sabe qué hacer.

  **Fix:**
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

- **Tecla Escape no cierra el chat** — `src/components/assistant/ChatWidget.tsx`. Comportamiento esperado por convención de diálogos.

  **Fix:** Agregar en el `useEffect` del widget:
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape" && open) setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  ```

### Media prioridad

- **`salario_nota` ausente en la card del listado** — `src/app/vacantes/page.tsx`. La interface `Vacante` (línea 12) no incluye `salario_nota`. El candidato ve `$X / mes` pero no la nota (ej. "Neto · pago semanal").

  **Fix:** Agregar `salario_nota?: string | null` a la interface y al query de `select` (línea 69). Mostrar la nota debajo del salario:
  ```tsx
  {job.salario_nota?.trim() && (
    <span className="text-[10px] text-muted block mt-0.5">{job.salario_nota}</span>
  )}
  ```

- **"Confidencial" con el mismo estilo visual que una empresa real** — `src/app/vacantes/page.tsx` línea 216. Aparece en azul bold uppercase, igual que si fuera un nombre de empresa.

  **Fix:**
  ```tsx
  <p className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${job.empresa?.trim() ? "text-blue" : "text-muted italic normal-case tracking-normal"}`}>
    {job.empresa?.trim() ? job.empresa : "Confidencial"}
  </p>
  ```

- **Pills de filtro se desbordan en pantallas < 480px** — `src/app/vacantes/page.tsx` línea 175. El `inline-flex flex-wrap` puede ocupar 2-3 líneas empujando el contenido hacia abajo. En mobile conviene scroll horizontal.

  **Fix:** Cambiar el wrapper de pills a:
  ```tsx
  <div className="flex justify-center mb-2 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1">
    <div className="inline-flex items-center gap-1 bg-white rounded-full border border-border shadow-sm px-2 py-1.5 whitespace-nowrap">
  ```

- **Chat muy pequeño en landscape mobile** — `src/components/assistant/ChatWidget.tsx` línea 120. `h-[min(60vh,560px)]` en landscape a 400px de alto → solo 240px de chat, lo suficiente para 2-3 burbujas.

  **Fix:** `h-[min(60dvh,560px)] sm:h-[min(70dvh,560px)]` y añadir `@media (orientation: landscape) and (max-height: 500px)` con altura fija de 340px.

### Baja prioridad

- **Horario ausente de las InfoPills del detalle** — `src/app/vacantes/[id]/_content.tsx` líneas 104-121. El horario es relevante para la decisión inicial pero solo aparece mucho más abajo. Añadir una `InfoPill` con ícono de reloj si `job.horario` tiene valor.

- **Filtros no actualizan la URL** — `src/app/vacantes/page.tsx`. Los filtros no modifican la URL, impidiendo compartir búsquedas. Agregar `router.replace` en cada handler de filtro.

- **`role="dialog"` y `aria-modal` faltantes en el chat** — `src/components/assistant/ChatWidget.tsx` línea 115. Agregar `role="dialog" aria-label="Chat con Kyo" aria-modal="true"` al `motion.div` del panel.

- **`aria-label` incompleto en hamburger** — `src/components/layout/Navbar.tsx` línea 59. `aria-label="Menu"` debería reflejar el estado: `aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}` y agregar `aria-expanded={mobileOpen}`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no menciona empresa confidencial** — `src/lib/assistant/system-prompt.ts` línea 44. Si la vacante tiene `empresa` vacía o null, el formato `[Empresa]` quedará en blanco. Añadir en el Paso 5: *"Si la empresa es vacía o null, usa la frase 'empresa confidencial' al presentarla."*

- **Paso 6 no maneja el rechazo** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "Ninguna me interesa" o "No me convence", no hay instrucción. Agregar:

  *"**Paso 6b — Si no aplica a ninguna:** Agradece, ofrece quedar en banco de talentos con `navigate_to('/contacto')` y menciona que le contactaremos cuando surja una vacante compatible. Si el candidato quiere reforzar su perfil, sugiere `/cursos`."*

- **Leads de empresas sin pre-calificación** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando alguien dice "Quiero contratar personal", Kyo navega directamente a `/contacto`. Modificar para que Kyo pregunte primero: *"¿Me podría decir el nombre de su empresa y el tipo de perfil que necesita? Así nuestro equipo estará listo para atenderle."* — esto mejora la calidad del lead que llega al inbox.

- **Kyo no menciona el tiempo de respuesta de 24h en el cierre** — `src/lib/assistant/knowledge.ts` línea 99. El stat `"Tiempo de respuesta": "24 horas"` nunca lo usa Kyo en el Paso 6. Es el argumento más eficaz para motivar al candidato a aplicar. Agregar en el Paso 6 del system prompt: *"Al invitar a aplicar, menciona que el equipo se pone en contacto en menos de 24 horas."*

- **Historial de 20 mensajes puede eliminar el perfil del candidato** — `src/app/api/assistant/chat/route.ts` línea 131. En conversaciones largas, los pasos iniciales (nombre, puesto, zona) se truncan. Añadir en el Paso 3 del system prompt: *"Al completar el perfil (nombre + puesto + zona + jornada), emite un resumen compacto: 'Perfecto, [nombre]. Perfil: [puesto], [N] años de experiencia, zona [X], jornada [Y].' — esto actúa como memoria comprimida."*

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo conoce la jornada preferida del candidato desde el Paso 4 pero no puede usarla como filtro en la búsqueda.

  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Tiempo completo, Medio tiempo, Por proyecto" },
  contrato: { type: "string", description: "Filtra por contrato: Indefinido, Temporal, Por honorarios" },
  ```

  Agregar la lógica de filtrado en `executeTool` (`case "search_jobs"`) para que `knowledge.listJobs()` los reciba.

- **Nueva tool: `register_talent_interest`** — cuando no hay vacante compatible, Kyo redirige a `/contacto` pero el perfil del candidato se pierde. Esta tool lo capturaría de forma estructurada:

  ```ts
  {
    name: "register_talent_interest",
    description: "Registra el perfil de un candidato en el banco de talentos cuando no hay vacante disponible. Úsala solo si el candidato acepta.",
    input_schema: {
      type: "object",
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

  En `executeTool`: insertar en `contactos` con `origen: 'kyo_banco_talentos'` y `asunto: 'Banco de talentos — Kyo'`. Cierra el flujo sin requerir que el candidato llene el formulario manualmente.

### Problemas detectados

- **Fallback vacío cuando Kyo solo ejecuta `navigate_to`** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Kyo hace solo una navegación, `finalText` queda vacío y el candidato recibe: *"Entendido, ¿en que mas te puedo ayudar?"* (sin contexto y con tildes incorrectas).

  **Fix:**
  ```ts
  const replyContent = finalText ||
    (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **max_tokens 1024 puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 153. Presentar 2-3 vacantes con nombre, empresa y justificación consume ~600-800 tokens. Con el overhead del sistema, el presupuesto puede quedar corto.

  **Fix:** Aumentar a `max_tokens: 1536`.

- **sessionId inconsistente entre sesiones** — `src/components/assistant/useChat.ts` líneas 45-53 vs 36-43. El `session_id` usa `sessionStorage` (se destruye al cerrar la pestaña) pero el historial usa `localStorage` (persiste). Si el usuario regresa al sitio, ve el historial de Kyo pero el `session_id` es nuevo. Las conversaciones en Supabase quedan fragmentadas.

  **Fix:** Mover `getSessionId()` a `localStorage` en lugar de `sessionStorage`:
  ```ts
  let sid = localStorage.getItem("kyo_session_id");
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("kyo_session_id", sid);
  }
  ```

---

## Oportunidades de mejora general

- **Auto-apertura contextual de Kyo en `/vacantes`** — El candidato puede llevar 5 segundos filtrando sin guía. Mostrar un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"* con `useEffect` + `setTimeout(3000)` solo en la ruta `/vacantes`, una vez por sesión (flag en `sessionStorage`).

- **Tracking del funnel completo Kyo → aplicación** — No existe evento analytics para el momento en que Kyo presenta recomendaciones. Agregar `logEvent("kyo_vacante_recomendada", String(vacante_id))` en `route.ts` cuando `navigations` incluya una ruta `/vacantes/[id]`. Sin este evento es imposible medir el ROI de Kyo.

- **Indicador de progreso del flujo de Kyo** — El flujo de 6 pasos no indica al candidato en qué etapa está. Un texto sutil en el header (ej. "Paso 2 de 5 — Experiencia") reduciría abandonos. El frontend puede inferir la etapa por el conteo de mensajes del usuario sin cambios en la API. Implementar en `ChatWidget.tsx` con una función `estimarPaso(messages)`.

- **Búsqueda sin feedback durante carga inicial** — `src/app/vacantes/page.tsx`. Al ingresar a la página mientras `jobs === []`, el contador muestra "0 vacantes encontradas" en vez de un estado de carga. Cambiar a `"Cargando vacantes..."` cuando el array esté vacío y no haya filtros activos.

- **Hero placeholder sin género** — `src/components/sections/Hero.tsx` línea 84. El placeholder `"¿Qué puesto buscas?"` asume que el visitante es un candidato. Kyoszen también atiende empresas. En la siguiente iteración del Hero, considerar un selector de modo ("Busco empleo / Quiero contratar") antes de la barra de búsqueda, como hacen OCC y LinkedIn.
