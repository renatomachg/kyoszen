# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-19
**Cambios analizados:** Sin cambios de codigo en los ultimos 2 dias (solo reportes automaticos). Analisis completo sobre el estado actual del codigo.

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Vacancies.tsx`
- `src/components/ui/AplicarModal.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/api/aplicar/route.ts`
- `src/lib/jobs.ts`
- `src/lib/courses.ts`

---

## Cambios Recientes Detectados

No hubo cambios de codigo en los ultimos 2 dias. Los ultimos commits solo contienen reportes automaticos (`salud-sitio.md`, `dependencias.md`, `ux-kyo.md`). Este analisis cubre el estado completo del codigo actual.

---

## Sugerencias de UX

### Alta prioridad

- **Bug: discrepancia entre parametros de busqueda del Hero y la pagina de vacantes.**
  En `src/components/sections/Hero.tsx:76`, el form de busqueda genera la URL `/vacantes?search=...`, pero en `src/app/vacantes/page.tsx:54` el parametro se lee como `params.get("q") || params.get("search")`. Esto funciona en la pagina, pero el system prompt de Kyo en `src/lib/assistant/system-prompt.ts:95` documenta el filtro como `?q=ventas`. Unificar: usar siempre `?q=` en Hero, Kyo y la pagina, eliminar el fallback a `?search`.

- **Bug: la seccion de vacantes en el Home (`src/components/sections/Vacancies.tsx`) tiene datos hardcodeados duplicados.**
  Los 4 primeros trabajos estan copiados literalmente de `src/lib/jobs.ts` pero sin importar de ahi. Si cambia el catalogo en `jobs.ts`, el home no se actualiza. Solucionar importando `JOBS` y haciendo `JOBS.slice(0, 4).map(...)` para que siempre refleje las vacantes reales.

- **Las imagenes del hero usan una URL externa de avatares ficticios (`i.pravatar.cc`) que puede fallar.**
  En `src/components/sections/Hero.tsx:103`, los avatares del trust strip vienen de `https://i.pravatar.cc/56?img=${i}`. Si el CDN externo tiene downtime, se muestran imagenes rotas. Reemplazar con 4 imagenes guardadas en `/public/images/` o usar SVGs generados localmente.

- **No hay timeout en el fetch del chat — el usuario puede quedarse esperando indefinidamente.**
  En `src/components/assistant/useChat.ts:81`, el `fetch("/api/assistant/chat")` no tiene `AbortController` ni timeout. Si la API tarda mas de 10 segundos (tool-use loop maximo = 5 iteraciones de Anthropic), el usuario ve el spinner infinito. Agregar `AbortController` con timeout de 25 segundos y mostrar mensaje de error accionable.

### Media prioridad

- **El historial de chat guardado en localStorage no expira.**
  En `src/components/assistant/useChat.ts:24-32`, el historial se carga sin revisar antiguedad. Un usuario que vuelva semanas despues retoma la conversacion desde donde quedo — incluyendo su nombre y perfil. Esto puede ser confuso si el contexto ya no aplica. Agregar un campo `savedAt` al JSON y resetear si tiene mas de 7 dias.

- **El boton "Nueva conversacion" aparece enterrado al fondo de los mensajes.**
  En `src/components/assistant/ChatWidget.tsx:154-165`, el boton de reset aparece despues de los mensajes, debajo del scroll. En conversaciones largas queda oculto. Moverlo al header del widget, junto al nombre "Kyo · Asistente", con un icono de refresh discreto.

- **Vacantes en el Home no muestran el salario** — informacion clave para el candidato que decide si le interesa explorar mas. El componente `Vacancies.tsx` muestra titulo, ubicacion y tipo, pero omite el rango salarial. Agregar el salario formateado (`$10,000/mes`) en la tarjeta, dado que `JOBS` ya tiene ese dato.

- **El AplicarModal no tiene validacion de numero de WhatsApp.**
  En `src/components/ui/AplicarModal.tsx:143-151`, el campo de WhatsApp es `type="tel"` con `required`, pero no valida formato. Un numero invalido llega al correo del cliente sin aviso. Agregar `pattern="[0-9]{10}"` y un helper text "10 digitos, sin espacios".

- **No hay feedback visual durante navegacion proactiva de Kyo.**
  En `src/components/assistant/useChat.ts:109-113`, cuando Kyo navega a una pagina, el `router.push()` ocurre 700ms despues del mensaje sin ningun indicador. El usuario no sabe que la pagina va a cambiar. Agregar en el mensaje de Kyo una linea tipo `"→ Abriendo la pagina de vacantes..."` antes de que se ejecute la navegacion.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **El flujo de 6 pasos no distingue si el visitante es candidato o empresa.**
  En `src/lib/assistant/system-prompt.ts:12`, Kyo arranca asumiendo candidato. Un reclutador o empresa sera forzado al flujo incorrecto. Agregar un Paso 0.5 despues del nombre: "¿Busca empleo o necesita contratar personal?" y bifurcar el flujo. Si es empresa, navegar a `/contacto` directamente con contexto.

- **Kyo puede perder el perfil del candidato si la conversacion supera 20 mensajes.**
  En `src/app/api/assistant/chat/route.ts:73`, el historial se recorta a los ultimos 20 mensajes. Si el nombre y perfil del candidato estaban en los primeros 5 mensajes, Kyo los olvida. Solucionar extrayendo nombre/perfil del candidato como metadato y re-inyectandolo en el system prompt cuando el historial se recorte.

- **El mensaje de fallback cuando no hay texto es demasiado generico.**
  En `src/app/api/assistant/chat/route.ts:144`, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"`. Este texto rompe el tono de Kyo y no orienta al candidato. Reemplazar por: `"Claro, ¿me platica un poco mas sobre el tipo de puesto que busca?"`.

- **El flujo no maneja explicitamente candidatos sin experiencia.**
  En el Paso 2 (experiencia), si el usuario responde "ninguna" o "recien egresado", el flujo continua pero Kyo no recalibra la busqueda. Agregar en el system prompt: "Si la experiencia es cero, en el Paso 5 prioriza vacantes cuyo requisito sea 'Sin experiencia' o 'menos de 6 meses'."

- **Kyo puede navegar prematuramente antes de terminar el perfil del candidato.**
  En `src/lib/assistant/system-prompt.ts:88`, la instruccion dice "navega sin pedir confirmacion extra". Esto puede activarse si el candidato menciona una categoria casualmente antes de completar los 4 pasos. Agregar: "Solo llama a `navigate_to` en el Paso 5 o si el usuario pide explicitamente ver una seccion especifica."

### Nuevas tools o capacidades recomendadas

- **Agregar filtros `contrato` y `jornada` a la tool `search_jobs`.**
  En `src/lib/assistant/tools.ts:39-47`, `search_jobs` acepta `query`, `category`, y `location`, pero NO filtra por `contrato` (Tiempo completo/Medio tiempo) ni `jornada` (Matutina/Vespertina/Mixta/Flexible). Cuando el candidato dice "busco medio tiempo vespertino", Kyo usa texto libre, lo cual es poco confiable. Agregar ambos campos al schema y a `knowledge.ts:listJobs()`.

- **Nueva tool: `register_candidate` (banco de talentos).**
  Cuando no hay vacante compatible, el system prompt indica navegar a `/contacto`. Sin embargo, el candidato ya compartio su nombre, puesto, experiencia, ubicacion y jornada. Una tool que registre esos datos directamente (via Supabase o un POST a `/api/aplicar`) evita que el candidato tenga que repetir todo en el formulario. Mejora de conversion estimada: significativa.

- **Nueva tool: `open_apply_modal` para disparar el AplicarModal desde el chat.**
  Actualmente Kyo navega a `/vacantes` y el candidato busca la vacante manualmente. Una tool que envie el `id` de la vacante al frontend (via el mecanismo de `navigations[]` en `useChat.ts:109`) podria abrir el `AplicarModal` directamente con la vacante prellenada.

- **Agregar filtro por salario minimo a `search_jobs`.**
  Candidatos frecuentemente mencionan expectativa salarial antes de aplicar. Agregar un parametro opcional `salario_min: number` a la tool y filtrar en `listJobs()` con `j.salario >= salario_min`. Kyo podria capturarlo en el Paso 3 o 4 del flujo.

### Problemas detectados

- **El rate limiter en-memoria se resetea en cada cold start de Vercel (bug en produccion).**
  En `src/app/api/assistant/chat/route.ts:10-13`, `rateLimitMap` es un `Map` en memoria del proceso Node.js. Vercel crea instancias nuevas por cada request serverless, haciendo el rate limit completamente ineficaz en produccion. Un usuario malicioso puede hacer requests ilimitados. Reemplazar con Upstash Redis (ya mencionado en el comentario del codigo) o al menos implementar rate limit por sesion en el frontend como medida parcial.

- **El system prompt se construye desde cero en cada iteracion del loop sin caching.**
  En `src/app/api/assistant/chat/route.ts:91`, `buildSystemPrompt()` se llama en cada iteracion del tool-use loop (hasta 5 veces por request). El prompt es estatico y largo (~2,000 tokens incluyendo cursos y vacantes). Implementar prompt caching de Anthropic con `cache_control: { type: "ephemeral" }` en el system prompt ahorraria ~60-70% en costo de tokens y reduciria latencia de cada iteracion.

- **`navigate_to` no valida que el path sea una ruta conocida del sitio.**
  En `src/lib/assistant/tools.ts:105-113`, el tool acepta cualquier string como `path` sin validar. Si Claude alucina una ruta (ej. `/empleos` o `/blog/articulo`), el usuario llega a una pagina 404 sin saberlo. Agregar validacion contra las rutas validas del sitio (SITE_PAGES + patrones `/cursos/[slug]` y `/vacantes/[id]`) y devolver error si el path no es valido.

---

## Oportunidades de mejora general

- **Prompt caching de Anthropic — cambio de 5 lineas, ahorro estimado del 60% en costo de API.**
  En `src/app/api/assistant/chat/route.ts:88-94`, cambiar el parametro `system` de string a array de bloques con `cache_control`. El system prompt es casi completamente estatico (solo cambia si se agregan cursos/vacantes). Este cambio es el de mayor ROI en todo el proyecto.

- **Agregar `aria-live` al area de mensajes del chat para accesibilidad.**
  En `src/components/assistant/ChatWidget.tsx:143`, el `div` de mensajes no tiene `aria-live="polite"`. Los usuarios con lectores de pantalla no escuchan las respuestas de Kyo cuando llegan. Agregar `aria-live="polite"` y `aria-atomic="false"` al contenedor de mensajes.

- **Agregar Open Graph y meta description a `/vacantes` y `/cursos`.**
  Las paginas de vacantes y cursos son el principal destino de trafico organico. Un candidato que llegue desde Google o WhatsApp no ve una preview enriquecida. Agregar `export const metadata` con `title`, `description`, y `openGraph` en `src/app/vacantes/page.tsx` y `src/app/cursos/page.tsx`.

- **Vacantes en la pagina y en el Home muestran un icono de maletin generico como logo de empresa.**
  En `src/components/sections/Vacancies.tsx:81-83`, el logo de empresa es siempre el mismo SVG. Para candidatos que reconocen las marcas (Sigma Retail, Clinica Vitalis), mostrar las iniciales de la empresa en texto (`SR`, `GC`) con colores distintos por empresa es mas informativo y menos generico. El campo `empresa` ya esta disponible en `JOBS`.

- **Agregar indicador de estado offline antes de intentar el fetch del chat.**
  En `src/components/assistant/useChat.ts:81`, si el usuario esta sin conexion, el error es generico. Detectar `!navigator.onLine` antes del fetch y mostrar: `"Sin conexion a internet. Verifica tu red e intenta de nuevo."` Mejora la experiencia en usuarios moviles con conexion intermitente.
