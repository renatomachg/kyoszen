# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-11
**Cambios analizados:** `src/app/admin/(panel)/vacantes/_form.tsx`, `src/app/admin/(panel)/vacantes/page.tsx`, `src/app/api/admin/parse-vacante/route.ts`, `src/app/vacantes/[id]/_content.tsx`, `src/app/vacantes/page.tsx`, `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`

---

## Cambios Recientes Detectados

- **Vacantes — empresa opcional ("Confidencial"):** form acepta empresa vacía; sitio muestra "Confidencial" en card y detalle (`commit 9afe2aa`).
- **Vacantes — horario laboral + botón "Ver" en admin:** nuevo campo textarea en form; sección en detalle público; botón directo al detalle desde el listado admin (`commit a27e4e4`).
- **Vacantes — salario_nota, beneficios:** campos nuevos en form, parser IA y página de detalle (`commit 6299301`).
- **Kyo — DC-3/STPS:** regla dura en system prompt, FAQ actualizada en knowledge.ts (`commit 4f72cc9`).

---

## 🚨 Bugs Críticos — SIGUEN SIN CORREGIR (escalados desde ayer)

### BUG 1 — Kyo usa vacantes de demostración, no las vacantes reales de Supabase
**Archivo:** `src/lib/assistant/knowledge.ts` línea 167

`StaticKnowledgeProvider.listJobs()` lee del array `JOBS` hardcodeado en `src/lib/jobs.ts`. Las vacantes creadas por el admin en Supabase son completamente invisibles para Kyo. Cuando recomienda una vacante en el Paso 5 y hace `navigate_to("/vacantes/[id]")`, el candidato llega a un 404 porque esos IDs de demo no existen en la BD real.

**Fix concreto:** En `src/app/api/assistant/chat/route.ts`, reemplazar el singleton `knowledge` por un provider que lea de Supabase al inicio del request:
```ts
// Reemplazar la línea que importa knowledge por un fetch a Supabase
const { data: vacantesData } = await sbAdmin.from("vacantes").select("id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,desc:descripcion,tags").eq("activa", true);
```
Pasar esos datos a `buildSystemPrompt()` como argumento en lugar de leer de `StaticKnowledgeProvider`. Este es el cambio de mayor impacto: hace que Kyo recomiende vacantes reales.

---

### BUG 2 — Los valores de Jornada, Contrato y Ubicación no coinciden entre el form admin, los filtros públicos y el system prompt de Kyo
**Archivos:** `src/app/admin/(panel)/vacantes/_form.tsx` líneas 48-50, `src/app/vacantes/page.tsx` líneas 28-32, `src/lib/assistant/system-prompt.ts` líneas 85-91

| Campo | Valores guardados por el admin (BD) | Valores en filtros públicos | Valores que Kyo le pasa a la URL |
|---|---|---|---|
| `jornada` | Tiempo completo · Medio tiempo · Por proyecto | Matutina · Vespertina · Mixta · Flexible | Matutina · Vespertina |
| `contrato` | Indefinido · Temporal · Por honorarios | Tiempo completo · Medio tiempo · Por proyecto | Tiempo completo |
| `ubicacion` | Presencial · Remoto · Hibrido | CDMX · Estado de México · Híbrido · Remoto | CDMX · Estado de Mexico |

Los filtros públicos **nunca** devolverán coincidencias porque los valores almacenados no existen en las opciones de filtro. Kyo también navega con parámetros incorrectos.

**Fix:** Unificar los tres juegos de valores. Sugerencia para jornada: `Tiempo completo · Medio tiempo · Por proyecto` (lo que ya usa el form). Actualizar `JORNADAS` en `vacantes/page.tsx` línea 31 y las URL de ejemplo en `system-prompt.ts` líneas 88-90. Para ubicación: cambiar `UBICACIONES` en el form (línea 48) de `["Presencial", "Remoto", "Hibrido"]` a `["CDMX", "Estado de México", "Híbrido", "Remoto"]`.

---

### BUG 3 — Los campos horario, beneficios y salario_nota no llegan a Kyo
**Archivo:** `src/lib/assistant/knowledge.ts` líneas 30-40 (interface `JobSummary`) y líneas 138-154 (`listJobs`)

`JobSummary` no incluye `horario`, `beneficios` ni `salario_nota`. Si un candidato pregunta "¿cuál es el horario?" o "¿qué prestaciones tiene?", Kyo responde que no tiene esa información aunque sí exista en la BD.

**Fix:** Agregar los tres campos al interface y al mapper:
```ts
// En JobSummary (línea 30):
horario?: string | null;
beneficios?: string[];
salario_nota?: string | null;

// En listJobs mapper (línea 142):
horario: j.horario ?? null,
beneficios: j.beneficios ?? [],
salario_nota: j.salario_nota ?? null,
```
En el system prompt, agregar instrucción en Paso 5: *"Si la vacante tiene beneficios o horario, menciona los más relevantes al presentarla."*

---

## Bugs Nuevos Detectados (hoy)

### BUG 4 — El filtro "Marca" tiene empresas de demostración hardcodeadas, no datos reales
**Archivo:** `src/app/vacantes/page.tsx` línea 29

```ts
const MARCAS = ["Todas", "Grupo Corpora", "Logística Norte", "Sigma Retail", "Clínica Vitalis", "Finanzas MX", "Contact Nova"];
```
Estas son empresas ficticias del array de demo `JOBS`. Las vacantes reales creadas en Supabase tienen sus propios nombres de empresa y nunca coincidirán con esta lista. El filtro "Marca" es completamente inoperante en producción.

**Fix opción A (rápida):** Eliminar el filtro "Marca" del componente hasta que se dinámica.
**Fix opción B (correcta):** Después de cargar `jobs` desde Supabase, construir la lista de marcas dinámicamente:
```ts
const marcasDisponibles = useMemo(() => ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean).sort())], [jobs]);
```
Reemplazar `MARCAS` por `marcasDisponibles` en el `DropdownPill` de la línea 180.

---

### BUG 5 — empresa default "Kyoszen" en el form y en el parser de IA puede publicar vacantes con empresa incorrecta
**Archivos:** `src/app/admin/(panel)/vacantes/_form.tsx` línea 30, `src/app/api/admin/parse-vacante/route.ts` línea 28

El `EMPTY` state tiene `empresa: "Kyoszen"` como default. El prompt del parser de IA también dice `"empresa": "string (default: Kyoszen)"`. Si el admin usa la IA para parsear una vacante de un cliente y el texto no menciona claramente la empresa, se publicará con empresa "Kyoszen" en lugar de quedar como "Confidencial".

**Fix en `_form.tsx` línea 30:** Cambiar `empresa: "Kyoszen"` por `empresa: ""`.
**Fix en `parse-vacante/route.ts` línea 28:** Cambiar `"empresa": "string (default: Kyoszen)"` por `"empresa": "string (dejar vacio si no se menciona explicitamente)"`.

---

## Sugerencias de UX

### Alta prioridad

- **CTAs de vacante inaccesibles en mobile** — `src/app/vacantes/[id]/_content.tsx` líneas 192-233. La sidebar con "Aplicar ahora" y "Consultar por WhatsApp" usa `sticky top-28` dentro de la columna derecha, que solo existe en layout `lg`. En mobile (menos de 1024px), la grid es de una columna y los botones quedan después de toda la descripción, responsabilidades, requisitos, horario y beneficios. En vacantes con contenido extenso, el candidato móvil puede abandonar sin ver el CTA.
  
  **Fix:** Agregar una barra flotante de CTA solo en mobile:
  ```tsx
  {/* Solo visible en mobile */}
  <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-border px-5 py-3 flex gap-3 z-40">
    <button onClick={() => setModalOpen(true)} className="flex-1 bg-navy text-white rounded-full py-3 text-[13px] font-extrabold">
      Aplicar ahora
    </button>
    <a href="https://wa.link/5zv0ba" target="_blank" className="flex items-center justify-center gap-1.5 bg-wa text-white rounded-full px-4 py-3 text-[13px] font-extrabold">
      <WhatsAppIcon size={16} /> WhatsApp
    </a>
  </div>
  ```
  Añadir también `pb-20 lg:pb-0` al contenedor principal para que el contenido no quede debajo de la barra.

- **Sin skeleton en `/vacantes` durante carga** — `src/app/vacantes/page.tsx` líneas 206-235. Mientras Supabase responde, `jobs.length === 0` y la página muestra vacío. Agregar skeleton de 8 tarjetas con `animate-pulse` que se oculte cuando `jobs.length > 0`:
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

- **Empty state sin salida** — `src/app/vacantes/page.tsx` líneas 231-235. El mensaje "Sin resultados" no ofrece ninguna acción. Un candidato frustrado no sabe qué hacer.
  
  **Fix:** Reemplazar el div actual por:
  ```tsx
  <div className="text-center py-16">
    <h3 className="text-lg font-bold text-navy mb-2">Sin resultados</h3>
    <p className="text-sm text-muted mb-6">No encontramos vacantes con esos filtros.</p>
    <div className="flex justify-center gap-3 flex-wrap">
      <button onClick={clearAll} className="bg-navy text-white rounded-full px-5 py-2.5 text-sm font-bold">
        Limpiar filtros
      </button>
      <a href="https://wa.link/5zv0ba" target="_blank" className="bg-wa text-white rounded-full px-5 py-2.5 text-sm font-bold flex items-center gap-2">
        <WhatsAppIcon size={15} /> Consultar por WhatsApp
      </a>
    </div>
  </div>
  ```

### Media prioridad

- **Overflow del filtro en mobile** — `src/app/vacantes/page.tsx` líneas 174-188. El `inline-flex` de pills es una sola fila horizontal. En pantallas <480px los últimos filtros (Jornada, Salario) quedan fuera de vista sin indicación de scroll. Agregar `overflow-x-auto` y esconder la barra de scroll: `className="... overflow-x-auto [&::-webkit-scrollbar]:hidden"`.

- **salario_nota no visible en la card del listado** — `src/app/vacantes/page.tsx` línea 223. La card solo muestra `$X / mes` sin la nota. Agregar debajo del salario:
  ```tsx
  {(job as Vacante & { salario_nota?: string }).salario_nota && (
    <span className="text-[10px] text-muted block">{(job as Vacante & { salario_nota?: string }).salario_nota}</span>
  )}
  ```
  Requiere también agregar `salario_nota` al interface `Vacante` en `vacantes/page.tsx` línea 12.

- **"Confidencial" sin diferenciación visual** — `src/app/vacantes/page.tsx` línea 216. Aparece con el mismo estilo `text-blue font-bold uppercase` que un nombre de empresa real. Cambiar a:
  ```tsx
  <p className={`text-[11px] font-bold uppercase tracking-wide mb-2 ${job.empresa?.trim() ? "text-blue" : "text-muted italic"}`}>
    {job.empresa?.trim() ? job.empresa : "Confidencial"}
  </p>
  ```

- **Horario ausente de las InfoPills** — `src/app/vacantes/[id]/_content.tsx` líneas 104-121. El horario es relevante para la decisión inicial del candidato y debería ser visible junto a ubicación, jornada y contrato. Agregar una InfoPill con ícono de calendario si `job.horario` tiene valor (primera línea del campo):
  ```tsx
  {job.horario?.trim() && (
    <InfoPill
      icon={<svg ...reloj.../>}
      label={job.horario.split("\n")[0]}
    />
  )}
  ```

### Baja prioridad

- **Los filtros de vacantes no actualizan la URL** — `src/app/vacantes/page.tsx`. Cambiar un filtro no modifica la URL. Si el candidato recarga o comparte el link, los filtros se pierden. Agregar `router.replace` en el handler de cada filtro para mantener la URL sincronizada con los filtros activos.

- **`aria-label` falta en InfoPills** — `src/app/vacantes/[id]/_content.tsx` líneas 249-256. Los íconos SVG no tienen texto alternativo. Agregar `aria-label` en cada `InfoPill`: `<span aria-label={label} ...>`.

- **El chat no tiene `role="dialog"`** — `src/components/assistant/ChatWidget.tsx` línea 115. El panel del chat no tiene `role="dialog"` ni `aria-label`. Los lectores de pantalla no anuncian la apertura del chat. Agregar `role="dialog" aria-label="Chat con Kyo" aria-modal="true"` al `motion.div`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía** — `src/lib/assistant/system-prompt.ts` línea 44. El formato de presentación incluye `[Empresa]` pero si la empresa está vacía en Supabase (vacante confidencial), Kyo dejará el campo en blanco. Agregar en el system prompt: *"Si la empresa de una vacante es vacía o null, menciona 'empresa confidencial' en su lugar."*

- **Paso 6 no tiene manejo de rechazo** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "Ninguna me interesa" o "No me convence", el sistema no tiene instrucción. Agregar Paso 6b: *"Si el usuario no quiere aplicar: agradece, ofrece quedar en banco de talentos con `navigate_to('/contacto')` y sugiere `/cursos` si quiere reforzar su perfil."*

- **Leads de empresas se cortan sin capturar datos** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando alguien dice "Quiero contratar personal" o "Somos una empresa", Kyo responde "Con gusto te conecto con nuestro equipo" y termina. No se captura ni el nombre de la empresa ni el contacto. Modificar esa instrucción para que antes de navegar a `/contacto`, Kyo pregunte: *"¿Me podría decir el nombre de su empresa y qué tipo de perfil necesita? Así nuestro equipo estará listo para atenderle."* Una sola pregunta adicional puede convertir un lead en datos concretos.

- **Historial truncado puede perder perfil del candidato** — `src/app/api/assistant/chat/route.ts` línea 131. La ventana de 20 mensajes puede cortar los primeros pasos (nombre, puesto, zona) en conversaciones largas. Solución: Agregar instrucción en el system prompt para que al completar el Paso 3, Kyo emita un resumen compacto: *"Perfecto, [nombre]. Perfil: [puesto], [N] años de experiencia, zona [X], jornada [Y]."* Este resumen actúa como memoria comprimida si los primeros mensajes se truncan.

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo conoce la jornada preferida del candidato desde el Paso 4 pero no puede pasarla a `search_jobs`. Agregar:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Tiempo completo, Medio tiempo, Por proyecto" },
  contrato: { type: "string", description: "Filtra por contrato: Indefinido, Temporal, Por honorarios" },
  ```
  En `executeTool`, agregar los filtros equivalentes en `knowledge.listJobs()`. Esto mejora directamente la precisión de las recomendaciones del Paso 5.

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
  En `executeTool`, insertar en la tabla `contactos` con `origen: 'kyo_banco_talentos'`. Esto cierra el flujo sin requerir que el candidato llene el formulario manualmente.

### Problemas detectados

- **Fallback vacío cuando Kyo solo navega** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Kyo ejecuta `navigate_to` sin texto adicional, `finalText` queda vacío y el candidato recibe: *"Entendido, ¿en que mas te puedo ayudar?"* (sin contexto y con tildes incorrectas: "qué" y "más"). Además `finalText` se actualiza solo si hay bloques de texto (`textBlocks.length > 0`), pero si en una iteración Kyo produce solo un `tool_use`, el texto de la iteración anterior sí se guarda en `finalText`. El fallback debería ser condicional:
  ```ts
  // línea 202
  const replyContent = finalText || (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");
  ```

- **max_tokens 1024 puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 153. Al presentar 2-3 vacantes con título, empresa y justificación (Paso 5), el token budget puede quedar corto y el mensaje se trunca mid-sentence. Aumentar a `max_tokens: 1536`.

- **"Nueva conversacion" sin acento** — `src/components/assistant/ChatWidget.tsx` línea 161. Corregir a `"Nueva conversación"`.

- **"en que mas" sin tildes en el fallback** — `src/app/api/assistant/chat/route.ts` línea 202. Corregir a `"¿en qué más te puedo ayudar?"` (incluye el fix del punto anterior).

- **`parse-vacante` prompt tiene "anos" sin tilde** — `src/app/api/admin/parse-vacante/route.ts` línea 38. El prompt de ejemplo tiene `'Edad: 18 a 50 anos'`. Cambiar a `'Edad: 18 a 50 años'` para que el modelo genere salidas con ortografía correcta.

---

## Oportunidades de mejora general

- **Auto-apertura contextual de Kyo en `/vacantes`** — Si un candidato llega a `/vacantes` con más de 3 segundos en la página y aún no ha abierto el chat, mostrar un mensaje bubble: *"¿Te ayudo a encontrar la vacante ideal para tu perfil?"* usando `useEffect` con `setTimeout`. Actualmente la página tiene filtros potentes pero ningún punto de entrada guiado. Un simple bubble aumentaría la tasa de uso de Kyo sin ser intrusivo.

- **Tracking de vacantes recomendadas por Kyo** — No existe evento analytics para cuando Kyo presenta una recomendación (Paso 5). Agregar `logEvent("kyo_vacante_recomendada", vacante_id)` en la route cuando `navigations` incluya `/vacantes/[id]`. Actualmente es imposible medir el embudo completo: Kyo recomienda → candidato aplica.

- **Indicador de progreso en el flujo de Kyo** — El chat de 6 pasos no informa al candidato en qué etapa está. Un indicador sutil en el header (ej. "Paso 2 de 5") reduciría abandonos al hacer el proceso predecible. No requiere cambios en la API — el frontend puede inferir la etapa por el número de mensajes del usuario.

- **Búsqueda en `/vacantes` no actualiza la URL** — Los filtros aplicados se guardan solo en estado local. Si el candidato recarga o comparte el link, los filtros se pierden. Agregar `router.replace` con los params actualizados al cambiar cualquier filtro.

- **Kyo no menciona el tiempo de respuesta de Kyoszen** — `src/lib/assistant/knowledge.ts` línea 99. La empresa tiene como stat `"Tiempo de respuesta": "24 horas"` y la FAQ lo menciona. Kyo podría usarlo como argumento de cierre en el Paso 6: *"Nuestro equipo se pone en contacto en menos de 24 horas."* Agregar esta instrucción en el Paso 6 del system prompt para aumentar la confianza del candidato al aplicar.
