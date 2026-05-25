# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-25
**Cambios analizados:** Sin commits de codigo en los ultimos 2 dias (solo reportes automaticos). Analisis profundo del estado actual del codigo.

**Archivos revisados:**
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/app/vacantes/[id]/page.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Vacancies.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/ui/AplicarModal.tsx`

---

## Cambios Recientes Detectados

No hubo cambios de codigo en los ultimos 2 dias. Los commits recientes son solo reportes automaticos (`salud-sitio.md`, `ux-kyo.md`). El analisis cubre el estado actual del codigo sin delta de cambios.

---

## Sugerencias de UX

### Alta prioridad

- **[INCONSISTENCIA DE DATOS CRITICA] `Hero.tsx:108` vs `knowledge.ts:75,79`** — El Hero muestra "+7000 candidatos colocados" pero `knowledge.ts` COMPANY.stats dice "687+". La tarjeta flotante en `Hero.tsx:159` dice "10+ Anos exp." mientras `knowledge.ts:79` dice "3+ Anos en el mercado". Estas inconsistencias se ven en el mismo sitio y danan la credibilidad. **Solucion:** Crear `src/lib/constants.ts` con un objeto `KYOSZEN_STATS` compartido y consumirlo en `Hero.tsx` y en `knowledge.ts`. Definir con el cliente cual es el numero correcto y usarlo en ambos lados.

- **[VACANTES - ESTADO VACIO SIN CTA] `src/app/vacantes/page.tsx:231-234`** — Cuando ningun resultado coincide con los filtros, el bloque muestra solo texto: "No encontramos vacantes con esos filtros." Sin ninguna accion el usuario abandona. **Solucion:** Reemplazar ese `<div>` por un bloque con dos botones: (1) "Limpiar filtros" que llame `clearAll()`, y (2) "Hablar con Kyo" que dispatch un evento para abrir el ChatWidget o enlace a WhatsApp.

- **[MOBILE - SIN CTA STICKY EN DETALLE] `src/app/vacantes/[id]/_content.tsx:159-199`** — El sidebar con "Aplicar ahora" cae debajo de todo el contenido en mobile porque el grid es `lg:grid-cols-[1.6fr_1fr]`. En mobile el candidato debe scrollear cientos de px para llegar al boton. **Solucion:** Agregar un boton sticky fijo solo en mobile: `<div className="lg:hidden fixed bottom-0 inset-x-0 p-4 bg-white border-t border-border z-50"><button onClick={() => setModalOpen(true)} className="w-full bg-navy text-white rounded-full py-3.5 font-extrabold">Aplicar ahora</button></div>`.

- **[generateStaticParams CON DATOS INCORRECTOS] `src/app/vacantes/[id]/page.tsx:3-5`** — `generateStaticParams` importa `JOBS` del archivo estatico `src/lib/jobs.ts`. Vacantes creadas en el admin desde Supabase con IDs nuevos no tienen ruta pre-generada. **Solucion:** Eliminar `generateStaticParams` y agregar `export const dynamic = 'force-dynamic'` en `page.tsx`. El contenido ya se carga desde el cliente en `_content.tsx`, asi que no hay ganancia real de tener rutas estaticas.

### Media prioridad

- **[NAVBAR - BLOG NO ENLAZADO] `src/components/layout/Navbar.tsx:10-17`** — El sitio tiene `/blog` gestionado desde el admin, pero `BASE_LINKS` no lo incluye. Los usuarios no pueden descubrir ese contenido. **Solucion:** Agregar `{ href: "/blog", label: "Blog" }` al array. Opcional: seguir el mismo patron de `checkVacantes` para solo mostrarlo cuando haya posts activos.

- **[VACANTES - FLASH DE "0 RESULTADOS"] `src/app/vacantes/page.tsx:57-71`** — `jobs` inicia como `[]` y se llena en el `useEffect`. Entre el render inicial y la respuesta de Supabase se muestra brevemente "0 vacantes encontradas". **Solucion:** Agregar `const [loading, setLoading] = useState(true)`, setearlo a `false` en el `.then()`. Mientras `loading === true`, mostrar un skeleton de 8 tarjetas con `animate-pulse` en lugar de mostrar el contador.

- **[PARAMETRO DE BUSQUEDA INCONSISTENTE] `Hero.tsx:76` vs `vacantes/page.tsx:60` vs `system-prompt.ts:89`** — El Hero envia `?search=`, la pagina lee `params.get("q") || params.get("search")`, y el system prompt de Kyo usa `?q=`. Tres codigos, dos parametros distintos. **Solucion:** Estandarizar a `?q=` en todos lados. Cambiar `Hero.tsx:76` de `?search=${...}` a `?q=${...}`. Eliminar el `params.get("search")` de `vacantes/page.tsx:60`.

- **[MODAL APLICAR - VALIDACION DE TELEFONO] `src/components/ui/AplicarModal.tsx:143-153`** — El campo WhatsApp acepta cualquier valor `tel` sin validar formato. **Solucion:** Agregar `pattern="[0-9]{10}"`, `maxLength={10}`, `title="10 digitos sin espacios ni guiones"`, y cambiar el placeholder a `"5512345678"`.

- **[MOBILE - MENU SIN ANIMACION] `src/components/layout/Navbar.tsx:103-124`** — El menu mobile aparece y desaparece sin transicion mientras que el resto del sitio usa Framer Motion en todo. **Solucion:** Envolver en `<AnimatePresence>` con `motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}`.

### Accesibilidad

- **[ARIA-LABEL EN CARDS DE VACANTE] `src/app/vacantes/page.tsx:210`** — Los `<Link>` de las tarjetas no tienen `aria-label`. Un lector de pantalla leeria "Ver detalle →" sin contexto. **Solucion:** Agregar `aria-label={`Ver detalle de ${job.titulo} en ${job.empresa}`}` al `<Link>` de cada tarjeta del grid.

- **[CHAT - SIN TIMEOUT DE RESPUESTA] `src/components/assistant/ChatWidget.tsx:147`** — Si la API de Anthropic tarda mas de ~15s, el usuario solo ve los tres puntos indefinidamente. **Solucion:** En `useChat.ts:sendMessage`, agregar `const timeout = setTimeout(() => { setError("La respuesta esta tardando. Intenta de nuevo o contactanos por WhatsApp."); setIsLoading(false); }, 15000)` y limpiar el timeout cuando la respuesta llegue.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[CRITICO] Paso 6 envia al candidato a /contacto, que es formulario de EMPRESAS** — `system-prompt.ts:61` dice "Navega a /contacto si acepta." Pero `/contacto` es para cotizaciones corporativas, no para candidatos. El candidato pierde el hilo y no sabe como aplicar. **Solucion:** Cambiar Paso 6 para que Kyo navegue a `/vacantes/{id}` de la vacante elegida: "Te llevo a la pagina de la vacante para que apliques directamente." Si el usuario no eligio vacante especifica, navegar a `/vacantes` con los filtros del perfil.

- **[CRITICO] Candidatos sin vacante son enviados al formulario corporativo** — `system-prompt.ts:55-58` — cuando no hay vacante compatible, Kyo navega a `/contacto`. Ese formulario pide "nombre de empresa", "servicios de interes", etc. No sirve para candidatos. **Solucion inmediata:** Cambiar el mensaje a "Puedes contactarnos por WhatsApp y te avisamos cuando surja algo para tu perfil" y usar `navigate_to` apuntando a `https://wa.link/5zv0ba`. Solucion definitiva: implementar la tool `save_to_talent_pool` descrita abajo.

- **[INCONSISTENCIA DE TRATAMIENTO] `system-prompt.ts:17` vs resto del prompt** — El saludo usa "usted" ("¿Me permite saber su nombre?", "¿Le gustaria aplicar?") pero en otras partes el tono es mas informal. El perfil de candidato operativo en Mexico responde mejor al tuteo respetuoso y consistente. **Solucion:** Elegir un trato y aplicarlo en todo el system prompt. Recomendacion: tuteo ("¿Me puedes decir tu nombre?", "¿Que tipo de trabajo buscas?", "¿Te gustaria aplicar?") — mas cercano para el perfil target.

- **[MEJORA DE CONVERSION] Paso 5 no muestra salario ni jornada en la recomendacion** — `system-prompt.ts:44-51` — El formato actual es `[Puesto] — [Empresa] — [Por que aplica]`. El salario y la jornada son los dos datos que mas influyen en la decision del candidato. **Solucion:** Cambiar el formato a: `1. [Puesto] — [Empresa] — $[salario]/mes — [Jornada] — [Por que aplica]`. Esto se puede lograr actualizando el bloque de formato en el system prompt.

- **[MEJORA] Paso 5 deberia llamar get_job_details antes de recomendar** — Kyo conoce las vacantes del system prompt pero con datos resumidos. Si llama `get_job_details` en el Paso 5 para las 2-3 mejores candidatas, puede incluir responsabilidades clave en su argumento de "por que aplica", haciendo la recomendacion mas convincente. **Solucion:** Agregar en el system prompt: "Antes de recomendar, llama a get_job_details para cada vacante candidata para poder argumentar con datos reales de responsabilidades."

### Nuevas tools o capacidades recomendadas

- **Tool `save_to_talent_pool`** — Cuando no hay vacante compatible, Kyo deberia poder capturar nombre + WhatsApp + puesto buscado directamente en el chat y guardarlos en Supabase (tabla `aplicaciones` con `vacante = "Banco de talentos"`). Implementacion: agregar la tool en `tools.ts`, crear endpoint `POST /api/talent-pool` que inserte en `aplicaciones`, actualizar Paso 5 del system prompt para usarla en lugar de navegar a /contacto.

- **Filtro de salario en `search_jobs`** — `tools.ts:39-47` — La tool no tiene parametro de salario minimo. Si el candidato dice "busco al menos 12 mil", Kyo no puede usarlo para filtrar. **Solucion:** Agregar `salary_min: { type: "number", description: "Salario minimo esperado en pesos MXN" }` al input schema, y en `knowledge.ts:138-154` agregar `.filter((j) => !filters?.salary_min || j.salario >= filters.salary_min)`.

- **Tool `open_application_modal`** — Actualmente Kyo solo puede navegar a la pagina de la vacante. No puede abrir el modal "Aplicar ahora" directamente. **Solucion:** Crear una tool que retorne una senial especial `{ action: "open_modal", jobId: number }`. En `useChat.ts`, detectar esa senial y emitir un evento custom. En `_content.tsx`, escuchar ese evento y auto-abrir `AplicarModal`. Esto elimina una friccion enorme: el candidato aplica sin salir del flujo de chat.

### Problemas detectados

- **[BUG CRITICO] `knowledge.ts:167` — Kyo consulta datos hardcodeados, no Supabase** — `StaticKnowledgeProvider.listJobs()` importa `JOBS` de `src/lib/jobs.ts` (datos de demo estaticos). Las vacantes creadas desde el panel admin en Supabase son invisibles para Kyo. Puede recomendar vacantes cerradas y jamas vera vacantes nuevas. El comentario de la linea 167 dice "In phase 2 this will become: new SupabaseKnowledgeProvider" — ese phase 2 nunca llego. **Solucion urgente:** Crear `SupabaseKnowledgeProvider` en `knowledge.ts` con `listJobs()` que llame a `supabase.from("vacantes").select(...).eq("activa", true)` y `getJob(id)` similar. Instanciar en `route.ts` donde existe el cliente de Supabase.

- **[BUG] `system-prompt.ts:131` — Formato de salario puede fallar con valores null** — `j.salario?.toLocaleString?.() ?? j.salario` — si `salario` es `null` en Supabase (campo no rellenado), imprime `null/mes` en el system prompt. **Solucion:** `j.salario != null ? `$${j.salario.toLocaleString('es-MX')}` : "A convenir"`.

- **[RIESGO] `useChat.ts:36-40` — Historial persiste indefinidamente en localStorage** — El usuario puede retomar el chat dias despues y ver recomendaciones de vacantes ya cerradas. **Solucion:** En `loadHistory()`, limpiar si han pasado mas de 24h: `if (parsed[0]?.timestamp && Date.now() - parsed[0].timestamp > 86_400_000) return [INITIAL_GREETING]`.

- **[RIESGO] `route.ts:38-51` — Rate limit in-memory se resetea en cada deploy** — El `rateLimitMap` se limpia con cada `pm2 restart`. Como `deploy.sh` hace restart en cada push, el rate limit es efectivamente nulo despues de cada deploy. **Solucion minima:** Usar un contador basado en cookie HttpOnly con TTL, que sobrevive reinicios del proceso. Solucion optima: Upstash Redis (tier gratuito).

- **[RIESGO] `route.ts:101` — Context window crece con conversaciones largas** — `history = body.messages.slice(-20)` limita a 20 mensajes, pero el system prompt ya es extenso (vacantes + cursos + company info + instrucciones). Con muchas vacantes activas, el system prompt puede acercarse al limite de tokens de claude-haiku. **Solucion:** Agregar un log del numero de tokens del system prompt con `console.log('[kyo] prompt length:', buildSystemPrompt().length)` para monitorear, y considerar reducir la lista de vacantes en el prompt a las 10 mas recientes (confiando mas en la tool `search_jobs`).

---

## Oportunidades de mejora general

- **Quick-reply chips despues del saludo** — Cuando `messages.length === 1` (solo el saludo inicial), mostrar en `ChatWidget.tsx` tres chips de respuesta rapida: `[Busco empleo]` `[Soy empresa]` `[Ver cursos]`. El usuario hace clic y se envian como mensaje. Reduce la barrera de entrada para quienes no saben que escribir.

- **Kyo contextual en pagina de vacantes con 0 resultados** — Cuando `filtered.length === 0` en `vacantes/page.tsx`, agregar un banner: "Kyo puede ayudarte a encontrar algo → [Abrir Kyo]". Requiere un evento global para abrir el widget desde fuera del componente (ej. `window.dispatchEvent(new Event('open-kyo'))`), escuchado en `ChatWidget.tsx` con `useEffect`.

- **Saludo diferenciado por hora del dia** — Cambiar `INITIAL_GREETING.content` en `useChat.ts:17-21` a una funcion que retorne "Buenos dias", "Buenas tardes" o "Buenas noches" segun `new Date().getHours()`. Detalle que da sensacion de presencia real.

- **Numero de folio al aplicar** — En `AplicarModal.tsx:117-119`, el success state muestra texto generico. Si `/api/aplicar` retornara el ID de la fila insertada en Supabase, se podria mostrar: "Tu folio es #2847. Te contactaremos en maximo 24 horas habiles." Aumenta confianza del candidato.

- **Analytics de abandono del chat** — `useChat.ts:71` loguea `kyo_mensaje` al enviar, pero no hay evento de abandono. Agregar en `ChatWidget.tsx` un `useEffect` que detecte cuando `open` cambia de `true` a `false` con `messages.length > 2` y logee `kyo_abandono` con el numero de mensajes intercambiados. Permitira identificar en que paso del flujo se pierde mas gente.
