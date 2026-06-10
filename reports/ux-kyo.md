# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-10
**Cambios analizados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/app/admin/(panel)/vacantes/_form.tsx`, `src/app/api/admin/parse-vacante/route.ts`, `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

- **Vacantes — empresa opcional ("Confidencial"):** el form ahora acepta empresa vacía; el sitio muestra "Confidencial". Aplica a card y detalle.
- **Vacantes — salario_nota y beneficios:** nuevos campos en el form, en el parser IA y en la página de detalle (`_content.tsx`).
- **Vacantes — horario laboral:** nuevo campo textarea en el form; se muestra en la sección de detalle de la vacante.
- **Kyo — DC-3/STPS:** regla dura en el system prompt para no prometer certificaciones oficiales. FAQ actualizada en `knowledge.ts`.
- **Admin — botón "Ver" en listado:** permite ir directamente al detalle público de la vacante desde el panel.

---

## 🚨 Bugs Críticos Detectados

### BUG 1 — Kyo usa datos ESTÁTICOS, no Supabase
**Archivo:** `src/lib/assistant/knowledge.ts` (línea 167) y `src/lib/jobs.ts`

`StaticKnowledgeProvider.listJobs()` lee de `JOBS` (array hardcodeado en `jobs.ts`) en lugar de la tabla `vacantes` de Supabase. Esto significa que Kyo recomienda 8 vacantes de demostración que no existen, mientras las vacantes reales creadas por el admin son invisibles para él.

**Fix:** Crear un `SupabaseKnowledgeProvider` que haga `supabase.from("vacantes").select(...).eq("activa", true)` en el constructor de la route. El code ya anticipa esto — línea 167 tiene el comentario *"In phase 2 a SupabaseKnowledgeProvider will replace this"*.

---

### BUG 2 — Los valores de Jornada y Contrato no coinciden entre el form de admin, la página pública y el system prompt de Kyo

**Archivos afectados:**
- `src/app/admin/(panel)/vacantes/_form.tsx` línea 49-51
- `src/app/vacantes/page.tsx` líneas 31-32
- `src/lib/assistant/system-prompt.ts` líneas 85-91

| Campo | Valores en el form (lo que se guarda) | Valores en el filtro público (lo que se busca) |
|---|---|---|
| `jornada` | Tiempo completo · Medio tiempo · Por proyecto | Matutina · Vespertina · Mixta · Flexible |
| `contrato` | Indefinido · Temporal · Por honorarios | Tiempo completo · Medio tiempo · Por proyecto |
| `ubicacion` | Presencial · Remoto · Hibrido | CDMX · Estado de México · Híbrido · Remoto |

Los filtros públicos nunca devolverán resultados de vacantes reales porque los valores no coinciden. Kyo también usa los valores incorrectos en su guía de navegación URL (system-prompt línea 89: `?jornada=Matutina`).

**Fix A:** Unificar los valores de JORNADAS y CONTRATOS en ambas partes. Opciones recomendadas para jornada: `Matutina · Vespertina · Mixta · Flexible`. Para contrato: `Tiempo completo · Medio tiempo · Por proyecto`.
**Fix B:** Actualizar el system prompt con los valores que realmente se guardan en la BD.
**Fix C:** Para ubicación: reemplazar "Presencial" por opciones con colonia/zona real, o bien alinear a "CDMX/Edomex/Híbrido/Remoto".

---

### BUG 3 — Los nuevos campos (horario, beneficios, salario_nota) no llegan a Kyo

**Archivo:** `src/lib/assistant/knowledge.ts` líneas 138-154

El `JobSummary` interface (línea 30-40) y el mapper `listJobs` no incluyen `horario`, `beneficios` ni `salario_nota`. Aunque el candidato pregunte "¿qué prestaciones tiene la vacante?" o "¿cuál es el horario?", Kyo no tiene acceso a esos datos ni siquiera después de migrar a Supabase.

**Fix:** Agregar los tres campos al interface `JobSummary` y al mapper en `listJobs()`. En el system prompt añadir instrucción: al presentar una vacante en Paso 5, mencionar los beneficios clave si existen.

---

## Sugerencias de UX

### Alta prioridad

- **Sin skeleton en `/vacantes` durante carga de Supabase** — `src/app/vacantes/page.tsx` líneas 206-235. El grid queda vacío y sin indicación mientras se espera la respuesta de Supabase. Agregar un skeleton de 6-8 tarjetas con `animate-pulse` que se muestre mientras `jobs.length === 0`. Evita el "salto" de contenido y comunica que hay vacantes cargando.

- **Empty state sin CTA** — `src/app/vacantes/page.tsx` línea 231-235. Cuando no hay resultados, solo aparece "Sin resultados" sin acción siguiente. Agregar dos botones: "Limpiar filtros" y "Contactar por WhatsApp" (`https://wa.link/5zv0ba`). El candidato frustrado necesita una salida, no un callejón.

- **Overflow del filtro en mobile** — `src/app/vacantes/page.tsx` líneas 174-188. La barra de filtros es un `inline-flex` en una sola línea. En pantallas <480px el bar se desborda y los últimos filtros (Jornada, Salario) quedan fuera de la vista sin indicación de scroll. Añadir `overflow-x: auto` con `-webkit-overflow-scrolling: touch` al contenedor o cambiar a un layout de dos filas en mobile.

### Media prioridad

- **salario_nota no se muestra en la tarjeta del listado** — `src/app/vacantes/page.tsx` línea 223. La tarjeta solo muestra `$X / mes` sin la nota de "neto" o "pago semanal". Considerando que el salario_nota es corto (max ~30 chars), añadirlo en gris debajo del salario: `{job.salario_nota && <span className="text-[10px] text-muted">{job.salario_nota}</span>}`. Evita que el candidato aplique esperando algo diferente.

- **Horario no aparece en las infopills del detalle** — `src/app/vacantes/[id]/_content.tsx` líneas 104-121. El horario está disponible como campo nuevo pero solo aparece en una sección de texto más abajo. Agregar una InfoPill de reloj con el horario resumido (primera línea del campo) junto a las demás pills. El candidato evalúa si puede cumplir el horario en los primeros segundos.

- **"Confidencial" no tiene tratamiento visual diferenciado** — `src/app/vacantes/page.tsx` línea 216 y `_content.tsx` línea 100. "Confidencial" se muestra con el mismo estilo (`text-blue font-bold uppercase`) que un nombre de empresa. Cambiar a `text-muted italic` o agregar un ícono de candado pequeño. Comunica de inmediato que la empresa es confidencial, no que hay un error de datos.

- **"Nueva conversacion" sin acento** — `src/components/assistant/ChatWidget.tsx` línea 160. El texto del botón de reset es `Nueva conversacion` sin acento. Corregir a `Nueva conversación` para consistencia con el resto del sitio.

### Baja prioridad

- **`aria-label` falta en todos los `InfoPill`** — `_content.tsx` línea 249-256. Los pills de info (ubicación, jornada, contrato, salario) no tienen texto alternativo. Lectores de pantalla solo anuncian el icono SVG sin descripción. Agregar `aria-label` o un `<span className="sr-only">` con "Ubicación: CDMX" etc.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 5 no maneja empresa vacía** — `src/lib/assistant/system-prompt.ts` línea 44-51. El formato de presentación dice `[Empresa]` pero si `empresa` está vacío en Supabase, Kyo dejará un hueco en blanco o reproducirá `undefined`. Agregar en el system prompt: *"Si la empresa es vacía o `null`, di 'empresa confidencial' en su lugar."*

- **Paso 6 no tiene manejo de rechazo** — `src/lib/assistant/system-prompt.ts` líneas 60-61. Si el candidato dice "No, ninguna me interesa" o "No me convence", no hay instrucción de qué hacer. Agregar un Paso 6b: *"Si el usuario no quiere aplicar a ninguna: agradece, ofrece quedar en banco de talentos (`/contacto`) y sugiere explorar `/cursos` si busca mejorar su perfil."*

- **Conversación larga puede perder el nombre y preferencias del usuario** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se trunca a los últimos 20 mensajes. En una conversación muy larga, la información del Paso 0-3 (nombre, puesto, experiencia, zona) puede desaparecer del contexto. Solución: en el system prompt, después de completar el Paso 3, pedir a Kyo que incluya un resumen en su siguiente respuesta: *"Muy bien, [nombre]. Perfil: [puesto], [N] años, zona [X], [jornada]."* — este resumen queda en el historial y Kyo puede referenciarlo aunque los mensajes originales se trunquen.

- **La regla DC-3 es duplicada innecesariamente** — `src/lib/assistant/system-prompt.ts` líneas 116-122 y `src/lib/assistant/knowledge.ts` línea 103. La restricción DC-3 ya está en la FAQ y también como "regla dura" en el system prompt. Está bien tenerla en el prompt, pero el FAQ entry también es suficiente. Riesgo actual es ninguno — simplemente ocupa tokens. No es urgente.

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `jornada` y `contrato` a la tool `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Después del Paso 4 (disponibilidad), Kyo conoce la jornada preferida del candidato pero no puede pasarla a `search_jobs`. Agregar dos campos opcionales: `jornada: string` y `contrato: string`. En `executeTool` aplicar el filtro equivalente en `knowledge.listJobs()`.

- **Nueva tool: `register_talent_interest`** — cuando no hay vacante compatible (Paso 5 fallback), Kyo redirige a `/contacto` pero no guarda el perfil del candidato de forma estructurada. Una tool que reciba `{nombre, puesto, experiencia, ubicacion, jornada}` y los inserte en la tabla `contactos` con `origen: 'kyo_banco_talentos'` permitiría al equipo de Kyoszen contactar al candidato sin que tenga que llenar el formulario manualmente. Prioridad alta si se quiere cerrar el flujo de candidatos.

- **Quick-reply chips en el frontend** — `src/components/assistant/ChatWidget.tsx`. Tras ciertos mensajes de Kyo (por ejemplo el de Paso 1 "¿qué tipo de trabajo busca?"), mostrar chips de respuesta rápida con las categorías más comunes: `["Administrativo", "Ventas", "Operativo", "RRHH"]`. Reduce fricción especialmente en mobile donde escribir es más lento. Requiere que la API devuelva `suggestions: string[]` o que el frontend mapee la etapa del flujo a chips predefinidos.

### Problemas detectados

- **`search_jobs` y `get_job_details` buscan en datos estáticos incorrectos** — `src/lib/assistant/tools.ts` líneas 97-103. Actualmente ejecutan contra `JOBS` (datos de demostración). Cuando se implemente `SupabaseKnowledgeProvider`, estas tools funcionarán correctamente sin cambiar su firma. La prioridad es implementar el provider primero (ver Bug 1).

- **Fallback de respuesta vacía es fuera de contexto** — `src/app/api/assistant/chat/route.ts` línea 202: `"Entendido, ¿en que mas te puedo ayudar?"`. Si Claude produce solo un `tool_use` sin texto (lo cual es válido y ocurre cuando navega), `finalText` queda vacío y se devuelve este fallback genérico que llega al candidato como un mensaje no relacionado. Solución: si `navigations.length > 0` y `finalText` es vacío, usar `replyContent = "Te llevo ahí en un momento."` en lugar del fallback genérico.

- **Rate limiter en memoria se reinicia con reinicios de PM2** — `src/app/api/assistant/chat/route.ts` líneas 68-81. El `rateLimitMap` es in-memory, se pierde en cada restart del proceso. Para el volumen actual de Kyoszen esto es aceptable. Si el sitio crece, migrar a Upstash Redis. No es urgente.

---

## Oportunidades de mejora general

- **Tracking de vacantes recomendadas por Kyo** — no existe un evento de analytics para cuando Kyo presenta una recomendación en el Paso 5. Agregar `logEvent("kyo_vacante_recomendada", id)` en la route o en el frontend cuando se detecta que la respuesta contiene una navegación a `/vacantes/[id]`. Actualmente no se puede medir el embudo completo: Kyo recomienda → candidato aplica.

- **Auto-apertura contextual de Kyo en `/vacantes`** — si el candidato llega a la página de vacantes desde un link de WhatsApp o campaña y aún no tiene historial de chat, Kyo podría abrirse automáticamente (o mostrar un bubble "¿Te ayudo a encontrar tu vacante ideal?") después de 3 segundos. Actualmente la página de vacantes tiene filtros potentes pero ningún punto de entrada guiado. Esto incrementaría la tasa de uso de Kyo.

- **Indicador de progreso en el flujo de Kyo** — el chat de 6 pasos no da retroalimentación de en qué etapa está el candidato. Un indicador sutil en el header del chat (e.g., "Paso 3 de 5 · Perfil") reduciría la tasa de abandono al hacer el proceso predecible y transparente. No requiere cambios en la API, solo en el frontend (detectar la etapa por el número de mensajes del usuario).

- **Búsqueda en `/vacantes` no actualiza la URL** — `src/app/vacantes/page.tsx`. Los filtros aplicados (ubicacion, jornada, salario) se guardan en estado local pero la URL no se actualiza. Si el candidato recarga la página o comparte el link, los filtros se pierden. Agregar `router.replace` con los params actualizados al cambiar cualquier filtro mejoraría la shareability y el comportamiento de "atrás" en el navegador.

- **Admin form: JORNADAS y CONTRATOS desalineados con el sitio público** (detallado en Bug 2). La corrección también debería incluir una migración SQL para actualizar registros ya existentes en Supabase si se cambian los valores posibles, de lo contrario los datos históricos quedarán sin coincidir con los nuevos filtros.
