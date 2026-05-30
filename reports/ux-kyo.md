# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-30
**Cambios analizados:**
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/components/ui/AplicarModal.tsx`

> Ultimo commit con cambios reales de codigo: `f7943ce` (feat: Estratega, analytics tracking, Kyo logs y reportes PDF). Los commits desde esa fecha son solo reportes de mantenimiento. Este analisis hace un segundo pase profundo sobre los mismos archivos para detectar issues no cubiertos en el reporte anterior.

---

## Cambios Recientes Detectados

No hay commits de codigo nuevos en los ultimos 2 dias. El sistema de reportes esta activo. Se detectaron **6 issues criticos pendientes del reporte anterior que siguen sin corregirse**, mas **9 hallazgos nuevos** en esta lectura.

---

## Issues Criticos Pendientes (del reporte 2026-05-29)

Estos siguen en el codigo y se escalan a Alta prioridad porque bloquean la experiencia del candidato:

- **CRITICO — Kyo recomienda vacantes inactivas** (`src/lib/assistant/knowledge.ts` l.138): `StaticKnowledgeProvider.listJobs()` lee del array `JOBS` estatico. Las vacantes desactivadas en Supabase admin siguen visibles para Kyo. Sin correccion activa desde el reporte.

- **CRITICO — Paso 6 manda al candidato a /contacto en lugar de a la vacante** (`src/lib/assistant/system-prompt.ts` l.61): El candidato que decide aplicar es llevado a un formulario generico en vez de al AplicarModal. Conversion perdida en el paso mas importante del embudo.

- **Link /politica-de-privacidad da 404** (`src/components/ui/AplicarModal.tsx` l.232): El modal de aplicacion linkea a una pagina inexistente justo cuando el candidato esta a punto de enviar su solicitud.

- **Reset del chat no regenera sessionId** (`src/components/assistant/useChat.ts` l.139): `reset()` limpia localStorage pero no sessionStorage, por lo que `saveConversation` sobreescribe el historial anterior en Supabase con el mismo `session_id`.

---

## Sugerencias de UX

### Alta prioridad

- **VacantesPage muestra "0 vacantes encontradas" en el flash inicial** (`src/app/vacantes/page.tsx` l.59, l.191): `jobs` se inicializa como `[]`. Mientras llega la respuesta de Supabase, el contador dice `"0 vacantes encontradas"` con grilla vacia. Esto parece un sitio sin contenido. Solucion: agregar un estado `loading` inicializado en `true`. En la grilla, si `loading === true`, renderizar 8 tarjetas skeleton con `bg-gray-100 animate-pulse` en lugar del mensaje "Sin resultados". Cambiar en l.59: `const [loading, setLoading] = useState(true)` y en el `.then()` de l.70 agregar `setLoading(false)`.

- **ChatWidget demasiado pequeno en mobile** (`src/components/assistant/ChatWidget.tsx` l.120): El panel usa `h-[min(60vh,560px)]`. En un telefono de 667px de alto (iPhone SE), eso son 400px. Con header 60px + input 56px = 116px de chrome, quedan 284px para mensajes: apenas 4-5 burbujas visibles. Un candidato en Paso 5 viendo 3 vacantes recomendadas necesita scroll inmediato. Cambiar a `h-[min(72vh,560px)]` para dar un 20% mas de espacio en mobile sin afectar desktop.

- **VacanteContent tiene acentos que violan la convencion del cliente** (`src/app/vacantes/[id]/_content.tsx` l.122, 128, 142, 179, 182): `"Descripción del puesto"`, `"Responsabilidades"` (ok), `"Categoría"` en sidebar. Los sectores del sidebar en l.179 y l.182 usan `"Ubicación"` y `"Categoría"` con tilde. Corregir a: `"Descripcion del puesto"`, `"Ubicacion"`, `"Categoria"`.

- **AplicarModal: validacion de peso del CV solo ocurre en el servidor** (`src/components/ui/AplicarModal.tsx` l.198-205): El `<input type="file">` acepta hasta cualquier tamano sin restriccion cliente. Si el backend rechaza un PDF de 10MB, el usuario espera la carga completa antes de ver el error. Agregar `onChange` que valide: `if (file.size > 5 * 1024 * 1024) { setFileError("El archivo supera 5MB"); return; }`. Mostrar el error debajo del boton de archivo.

### Media prioridad

- **ChatWidget: input sin `aria-label` formal** (`src/components/assistant/ChatWidget.tsx` l.170-177): El `<input>` solo tiene `placeholder="Escribe tu mensaje..."`. Los lectores de pantalla anuncian el placeholder como si fuera el label, lo cual se corta cuando el usuario empieza a escribir. Agregar `aria-label="Mensaje para Kyo"` al input.

- **ChatWidget: no hay boton de reintento cuando falla el envio** (`src/components/assistant/ChatWidget.tsx` l.148-152, `src/components/assistant/useChat.ts` l.129): Cuando la API falla, se muestra el error pero el mensaje del usuario ya esta en la lista. Para volver a intentarlo, el usuario tiene que retipear el mensaje. Exportar desde `useChat` una funcion `retry` que reenvie el ultimo mensaje del usuario, y agregar en el bloque de error un `<button onClick={retry}>Reintentar</button>`.

- **VacantesPage: hero usa URL externa de Unsplash** (`src/app/vacantes/page.tsx` l.139): `https://images.unsplash.com/photo-1521737604893...` es una dependencia en runtime a una CDN externa. Si Unsplash cambia la URL o aplica rate limiting, el hero queda roto silenciosamente. Mover la imagen a `/public/images/hero-vacantes.jpg` y servir local.

- **`navigate_to` tool no tiene whitelist de rutas validas** (`src/lib/assistant/tools.ts` l.105-112): Claude puede invocar `navigate_to` con cualquier `path`, incluyendo `/admin`, `/admin/vacantes` o URLs externas. No hay validacion. Agregar en `executeTool`: `const ALLOWED_PATHS = ["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"]; if (!ALLOWED_PATHS.some(p => (input.path as string).startsWith(p))) return JSON.stringify({ error: "Ruta no permitida" });`.

### Baja prioridad

- **VacantesPage: contador de resultados sin estado de carga** (`src/app/vacantes/page.tsx` l.191-198): Mientras carga, dice `"0 vacantes encontradas"` en texto negro. Cuando `loading === true`, mostrar `"Cargando..."` en gris en lugar del contador para no crear expectativas erroneas.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **El flujo no instruge a Kyo a llamar `get_course_details` despues de `search_courses`** (`src/lib/assistant/system-prompt.ts` l.65-68 y `src/lib/assistant/tools.ts` l.10-23): Cuando un usuario pregunta detalles de un curso especifico, Kyo suele solo llamar `search_courses` (que devuelve resumen) sin hacer el segundo llamado a `get_course_details`. Las respuestas quedan incompletas: faltan modulos, duracion, para quien va dirigido. Agregar al system prompt en la seccion "Manejo de otros temas": `"Si el usuario pide detalles de un curso especifico, llama primero search_courses para encontrar el slug, luego get_course_details con ese slug para obtener informacion completa."`.

- **Kyo no conoce la pagina donde esta el usuario** (`src/components/assistant/ChatWidget.tsx` l.8-12 y `src/components/assistant/useChat.ts` l.95-103): Si el candidato abre el widget estando en `/vacantes/3`, Kyo arranca desde Paso 0 (pedir nombre) en lugar de decir "Veo que estas viendo esta vacante, ¿te interesa aplicar?". Solucion: en `ChatWidget.tsx`, al abrir el chat leer `window.location.pathname` y pasarlo al primer mensaje del sistema. En `useChat.ts`, incluir `currentPath: window.location.pathname` en el body del POST. En `chat/route.ts`, agregar ese contexto al system prompt: `"El usuario esta actualmente en la pagina: [path]"`.

- **Paso 5 muestra vacantes pero no incluye la URL para navegar directamente** (`src/lib/assistant/system-prompt.ts` l.45-58): El formato de respuesta del Paso 5 lista `[Nombre del puesto] — [Empresa]` pero no instruye a Kyo a mostrar el link ni a hacer `navigate_to` a la vacante. Cuando el candidato dice "Me interesa la primera", Kyo no tiene instrucciones claras de que hacer. Agregar al Paso 5: `"Cuando el candidato elija una vacante, inmediatamente llama navigate_to con /vacantes/[id] de esa vacante. No pidas confirmacion extra."`.

- **No hay manejo para cuando el candidato cambia de opinion a mitad del flujo** (`src/lib/assistant/system-prompt.ts`): Si en Paso 3 el candidato dice "en realidad busco otra cosa", no hay instruccion de reiniciar el flujo. Kyo puede intentar continuar con informacion contradictoria. Agregar una regla: `"Si el candidato da informacion que contradice una respuesta anterior, actualiza mentalmente su perfil y confirma el cambio antes de continuar."`.

### Nuevas tools o capacidades recomendadas

- **Tool `get_vacante_by_id` para que Kyo pueda leer detalles completos de una vacante antes de recomendarla** (`src/lib/assistant/tools.ts`): Hoy Kyo usa `search_jobs` (devuelve resumen) o `get_job_details` (devuelve todo), pero el system prompt en Paso 5 nunca indica cuando usar cada una. Agregar al system prompt: `"Antes de recomendar una vacante en Paso 5, llama get_job_details para verificar que sigue activa y obtener el salario exacto."`. No requiere nueva tool, solo mejor instruccion.

- **Chip de respuestas rapidas en el widget para arrancar el flujo** (`src/components/assistant/ChatWidget.tsx`): El saludo inicial pide el nombre, pero el 70% de usuarios en chatbots no saben como arrancar y cierran el widget. Agregar debajo del saludo inicial 2 chips clickeables: `"Busco empleo"` y `"Soy empresa"`. Al hacer clic, envian ese texto automaticamente. Implementar en `ChatWidget.tsx`: cuando el ultimo mensaje es el saludo inicial y `messages.length === 1`, mostrar un `<div>` con 2 `<button>` que llamen `sendMessage("Busco empleo")` o `sendMessage("Soy empresa")`.

### Problemas detectados

- **NUEVO — `knowledge.ts` usa COURSES estatico igual que JOBS** (`src/lib/assistant/knowledge.ts` l.1, l.118-131): `listCourses` lee del array `COURSES` hardcodeado en `@/lib/courses`. Si el admin agrega o modifica un curso en Supabase, Kyo sigue mostrando el catalogo viejo. Mismo problema que con vacantes. La implementacion de `SupabaseKnowledgeProvider` debe cubrir tanto `listJobs` como `listCourses`.

- **NUEVO — `executeTool` es sincrono para `search_jobs` y `search_courses` pero recibe `await`** (`src/lib/assistant/tools.ts` l.85, l.87-89): `knowledge.listCourses()` y `knowledge.listJobs()` retornan arrays sincrono. Sin embargo estan dentro de `await Promise.all(toolUses.map(async ...))` en `chat/route.ts` l.185. Cuando `SupabaseKnowledgeProvider` sea implementado, estas funciones seran async. La estructura ya esta bien. Solo documentar que `executeTool` debe ser declarado `async` para ese futuro cambio — actualmente lo es (`async function executeTool`) en l.85 pero los cases internos no hacen `await`. No es un bug hoy, pero confunde.

- **NUEVO — `MAX_TOOL_ITERATIONS = 5` puede silenciar el resultado final** (`src/app/api/assistant/chat/route.ts` l.85, l.148, l.202): Si Claude llega a 5 iteraciones de tools sin llegar a `stop_reason !== "tool_use"`, el loop termina y `finalText` puede estar vacio (nunca se asigno un texto final). En ese caso, la respuesta al usuario sera `"Entendido, ¿en que mas te puedo ayudar?"` (l.202), que es un mensaje confuso si el candidato estaba en medio de una recomendacion. Agregar un mensaje de fallback mas claro: `"Tuve un problema procesando tu solicitud. ¿Podrias repetirla con otras palabras?"`.

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo para el candidato**: El widget no muestra en que paso esta el candidato. En un flujo de 6 pasos, el candidato no sabe cuanto falta. Agregar en el header del chat (`ChatWidget.tsx` l.124-140) un indicador de progreso textual minimo como `"Paso 3 de 6"` que Kyo podria incluir en cada mensaje. No requiere cambio en el widget — puede implementarse como convencion en el system prompt: al inicio de cada respuesta en los pasos 1-5, Kyo anade `[Paso N/6]` en texto pequeno.

- **El historial en localStorage nunca expira** (`src/components/assistant/useChat.ts` l.24-34): Si un candidato visita el sitio 30 dias despues, Kyo continuara la conversacion de donde la dejo, pero las vacantes pueden haber cambiado. Agregar TTL al historial: guardar `{ messages, savedAt: Date.now() }` y en `loadHistory()` descartar el historial si `Date.now() - savedAt > 7 * 24 * 60 * 60 * 1000` (7 dias).

- **Filtro "Marca" en VacantesPage no corresponde al concepto real** (`src/app/vacantes/page.tsx` l.29): La constante se llama `MARCAS` y el label es `"Marca"`, pero el valor que filtra es `j.empresa`. Desde la perspectiva del candidato, filtrar por "Grupo Corpora" o "Sigma Retail" es filtrar por **empresa**, no por marca. Renombrar el label a `"Empresa"` en el DropdownPill l.178 para mayor claridad: `label="Empresa"`.

- **Kyo no ofrece WhatsApp como alternativa cuando el candidato esta frustrado**: El system prompt en la seccion "Manejo de otros temas" (`system-prompt.ts` l.65-69) menciona ofrecer WhatsApp para empresas y cursos, pero no para candidatos que expresan frustracion o llevan mas de 4 intercambios sin resultado. Agregar: `"Si el candidato lleva 3+ mensajes sin avanzar en el flujo o expresa frustracion, ofrece: 'Tambien puedes escribirnos directamente al WhatsApp para una atencion mas personalizada.' y usa navigate_to con https://wa.link/5zv0ba."`.
