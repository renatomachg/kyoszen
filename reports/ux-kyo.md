# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-16
**Cambios analizados:** Sin cambios de codigo en los ultimos 2 dias (solo reportes automaticos). Auditoria de segunda pasada: todas las sugerencias son NUEVAS (no repeticiones del reporte anterior).

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Vacancies.tsx` (home section)
- `src/components/sections/Services.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Newsletter.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/page.tsx`
- `src/app/contacto/page.tsx`
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

Sin cambios de codigo. Los ultimos 5 commits son reportes automaticos (`salud-sitio.md`, `ux-kyo.md`). Esta es una auditoria de segunda pasada con observaciones nuevas no cubiertas en el reporte del 2026-05-15.

---

## Sugerencias de UX

### Alta prioridad

- **[CRITICO — Newsletter no hace nada al hacer clic en "Suscribirse"]** `src/components/sections/Newsletter.tsx` linea 21: el `<button>` no tiene `type="submit"`, no hay `<form>` wrapping, y no hay `onClick`. Hacer clic en "Suscribirse" es un dead-end completo — el input se llena y nada pasa. Wrappear en un `<form onSubmit={handleSubscribe}>` con handler minimo que llame a un endpoint `/api/newsletter` (o simplemente rediriga a `/contacto?asunto=Newsletter`). Como minimo, agregar `type="submit"` y un `alert("Gracias, te contactaremos pronto")` temporal hasta implementar el backend. Actualmente daña la credibilidad del sitio.

- **[Vacancies home section desincronizada de JOBS]** `src/components/sections/Vacancies.tsx` lineas 7-40: define un array hardcodeado de 4 vacantes CON datos distintos a los de `src/lib/jobs.ts`. Si se cambia el titulo, empresa o tipo de una vacante en `jobs.ts`, la seccion home NO se actualiza. Reemplazar el array local con `import { JOBS } from "@/lib/jobs"` y usar `JOBS.slice(0, 4)`. Elimina la duplicacion y el riesgo de inconsistencia sin cambiar el visual.

- **[Hero usa imagenes externas de pravatar.cc — pueden bloquearse o tardar]** `src/components/sections/Hero.tsx` lineas 97-104: carga 4 avatares de `https://i.pravatar.cc/56?img={1..4}`. Este servicio externo puede ser lento, bloqueado por VPN corporativas, o caer. Cuando falla, los avatares se rompen y el conteo "687+" queda sin la fila de fotos, impactando la prueba social del Hero. Reemplazar con 4 imagenes locales en `/public/images/avatars/` (fotos de stock libres de derechos) o con divs de color con iniciales generadas en CSS — ambas opciones son mas confiables.

- **[PageHero carga imagenes de Unsplash externos en produccion]** `src/app/vacantes/page.tsx` linea 107 y `src/app/contacto/page.tsx` linea 55: ambas usan `https://images.unsplash.com/...?w=1800`. En produccion con VPS Hostinger (Boston), estas requests van a Unsplash CDN y agregan ~300-800ms de latencia adicional al LCP. Si Unsplash cambia la URL o el rate-limit se activa, el hero queda roto. Descargar las imagenes como archivos locales en `/public/images/` y referenciarlas ahi — ya se hace esto correctamente en el Hero con `Hero.jpg` y `Hero2.jpg`.

### Media prioridad

- **[Services section — 3 de 4 cards llevan a la misma pagina /servicios]** `src/components/sections/Services.tsx` lineas 8, 27, 36: "Induccion de Personal" y "Digitalizacion de RRHH" apuntan a `/servicios` identico. El usuario que hace clic en cualquiera llega al mismo lugar. Cuando la pagina `/servicios` tenga secciones con ID, cambiar los hrefs a `/servicios#induccion` y `/servicios#digitalizacion`. Por ahora, agregar un `#` con el nombre del servicio en minusculas: `href="/servicios#induccion-de-personal"` — no rompe nada y prepara la ancla.

- **[Vacante detalle — WhatsApp CTA no incluye contexto de la vacante]** `src/app/vacantes/[id]/page.tsx` linea 161: el link de WhatsApp es `https://wa.me/525520876765` sin mensaje. El reclutador recibe un mensaje en blanco y no sabe de que vacante habla el candidato. Cambiar a:
  ```
  href={`https://wa.me/525520876765?text=${encodeURIComponent(`Hola, me interesa la vacante de ${job.titulo} en ${job.empresa}`)}`}
  ```
  Costo: 1 linea. Mejora la conversion porque el candidato no tiene que explicar de que vacante habla.

- **[ChatWidget — messages container no tiene aria-live]** `src/components/assistant/ChatWidget.tsx` linea 143: el `<div ref={scrollRef}>` que contiene los mensajes no tiene `aria-live="polite"`. Los usuarios de lectores de pantalla (NVDA, VoiceOver) no escuchan las respuestas de Kyo. Agregar `aria-live="polite"` y `aria-label="Conversacion con Kyo"` al div contenedor. Costo: 1 linea. Requerido para accesibilidad basica.

- **[Contacto page — no lee searchParams aunque el sistema los genera]** `src/app/contacto/page.tsx` linea 18: `form.subject` se inicializa en `""` y no lee `useSearchParams()`. Ya en el reporte anterior se senalo que Kyo navega a `/contacto` como fallback cuando no hay vacantes. Si Kyo pasa `?asunto=Quiero+aplicar`, no habra ningun efecto. Este arreglo es la contraparte necesaria de la sugerencia de Kyo del reporte anterior — sin el no cierra el loop. Agregar en la pagina: `import { useSearchParams } from "next/navigation"` y en `useState`: `useSearchParams().get("asunto") ?? ""` como valor inicial del `subject`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[Greeting duplicado en dos archivos — violacion de single source of truth]** El saludo `"Bienvenido a Kyoszen. Mi nombre es Kyo..."` existe LITERALMENTE en dos lugares: `src/components/assistant/useChat.ts` linea 17-21 (el objeto `INITIAL_GREETING`) Y `src/lib/assistant/system-prompt.ts` linea 22 (como texto referencial en el prompt). Si el cliente pide cambiar el saludo ("Di 'Buenos dias'" o "Agrega tu apellido virtual") se tiene que editar en DOS archivos y es facil olvidar uno. Extraer el saludo a una constante en `src/lib/assistant/system-prompt.ts`:
  ```typescript
  export const KYO_INITIAL_GREETING = "Bienvenido a Kyoszen. Mi nombre es Kyo..."
  ```
  Y en `useChat.ts`: `import { KYO_INITIAL_GREETING } from "@/lib/assistant/system-prompt"` y usar esa constante en `INITIAL_GREETING.content`.

- **[Kyo nunca pregunta expectativa salarial — reduce calidad del match]** El flujo de 6 pasos recoge: puesto (P1), experiencia (P2), ubicacion (P3), jornada (P4). Pero omite la expectativa salarial, que es el factor #1 de desercion cuando el candidato llega a la vacante y ve que no cubre su expectativa. Agregar un **Paso 3.5** entre ubicacion y disponibilidad en `system-prompt.ts`:
  ```
  ## Paso 3.5 — SALARIO
  Pregunta: "¿Cual es el rango salarial que busca aproximadamente?"
  Acepta rangos como "$10k-$15k", "mas de $20k", "el que ofrezcan".
  Usa este dato en Paso 5 para priorizar vacantes dentro del rango.
  ```
  Todos los jobs ya tienen `salario` en `jobs.ts` — Kyo puede comparar sin tool adicional.

- **[Kyo no distingue contexto de pagina actual al reanudar sesion]** `src/components/assistant/useChat.ts` carga el historial de localStorage pero nunca le dice a Kyo EN QUE PAGINA esta el usuario en ese momento. Si el usuario abre el chat en `/vacantes/3`, Kyo no sabe que ya esta en esa vacante y podria navegar proactivamente a ella aunque ya este ahi. Agregar en el `sendMessage` de `useChat.ts`, dentro del body del fetch:
  ```typescript
  current_path: typeof window !== "undefined" ? window.location.pathname : "/"
  ```
  Y en `system-prompt.ts` agregar instruccion: "Si `current_path` es `/vacantes/{id}`, el usuario ya esta viendo esa vacante — no navegues de nuevo, ofrece directamente el boton de aplicar o el WhatsApp."

### Nuevas tools o capacidades recomendadas

- **[Agregar tool: open_application_modal]** Actualmente cuando Kyo quiere que el usuario aplique, navega a `/vacantes/{id}` y el candidato tiene que hacer clic en "Aplicar ahora" manualmente. Seria mejor una tool `open_application_modal` que emita un evento custom (`CustomEvent("kyo:open-modal", {detail: {jobId}})`) que el componente `AplicarModal` en `/vacantes/[id]/page.tsx` escuche. Esto no requiere navegacion — el modal abre directamente en la misma pagina. Impacto: elimina un paso de friction en la conversion final del candidato.

- **[Agregar tool: get_job_by_title]** Actualmente `get_job_details` requiere el `id` numerico. Si el candidato dice "la vacante de recepcionista" y Kyo no recuerda el id, tiene que llamar `search_jobs` primero para obtenerlo. Agregar en `tools.ts` y `knowledge.ts` una funcion `getJobByTitle(titulo: string)` que haga busqueda fuzzy por titulo y retorne el primer match con su id. Reduce la cantidad de iteraciones en el tool-use loop.

### Problemas detectados

- **[BUG — Sin timeout en el cliente Anthropic — el usuario espera hasta 30 segundos sin feedback]** `src/app/api/assistant/chat/route.ts` linea 88: `client.messages.create({...})` no tiene timeout configurado. Si la API de Anthropic responde lento (latencia de red, carga del modelo), el usuario ve el indicador de "typing" durante hasta 30 segundos (timeout default de Next.js lambdas). La percepcion es que el asistente se congelo. Agregar `AbortController` con timeout de 18 segundos:
  ```typescript
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18_000);
  try {
    const response = await client.messages.create({...}, { signal: controller.signal });
    clearTimeout(timeout);
    ...
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ error: "El asistente tardo demasiado. Intenta de nuevo." }, { status: 504 });
    }
    ...
  }
  ```

- **[BUG — buildSystemPrompt() se llama en cada request sin memoizacion]** `src/app/api/assistant/chat/route.ts` linea 92 llama `buildSystemPrompt()` en cada POST. Esta funcion llama `knowledge.listCourses()`, `knowledge.listJobs()`, `knowledge.getCompanyInfo()` y construye un string de ~2000 caracteres. Con datos estaticos (no cambian entre requests), esto es trabajo redundante. En Vercel serverless, cada request puede ser una instancia nueva, pero dentro de una instancia caliente el costo es real. Memoizar fuera del handler:
  ```typescript
  let _cachedPrompt: string | undefined;
  function getSystemPrompt() {
    return (_cachedPrompt ??= buildSystemPrompt());
  }
  ```
  Llamar `getSystemPrompt()` en lugar de `buildSystemPrompt()` en la linea 92.

- **[BUG — Tool-use loop finaliza silenciosamente si excede MAX_TOOL_ITERATIONS]** `src/app/api/assistant/chat/route.ts` linea 87: si el loop llega a `iter === 5` con `stop_reason === "tool_use"`, el loop termina y `finalText` podria estar vacio o incompleto (el ultimo texto antes del tool-call que no se resolvio). El usuario recibe el fallback `"Entendido, ¿en que mas te puedo ayudar?"` sin contexto. Agregar un log de warning y cambiar el fallback:
  ```typescript
  if (iter === MAX_TOOL_ITERATIONS - 1 && response.stop_reason === "tool_use") {
    console.warn("[assistant] MAX_TOOL_ITERATIONS reached, cutting tool loop");
    finalText = finalText || "Tuve un problema procesando tu consulta. ¿Puedes reformularla o intentarlo de nuevo?";
  }
  ```

- **[BUG — navigate_to acepta cualquier path sin validacion — riesgo de XSS/path injection]** `src/app/api/assistant/chat/route.ts` linea 113-116 y `src/lib/assistant/tools.ts` linea 105-112: el path de `navigate_to` se pasa directamente al frontend sin validar contra las rutas conocidas del sitio. Si Claude alucina y genera `/vacantes/exec('malicious')` o una URL absoluta `https://phishing.com`, el `router.push()` del cliente lo ejecutaria. Agregar whitelist en `executeTool`:
  ```typescript
  const ALLOWED_PATHS = ["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"];
  const isAllowed = ALLOWED_PATHS.some(p => (input.path as string).startsWith(p));
  if (!isAllowed) return JSON.stringify({ error: "Ruta no permitida" });
  ```

---

## Oportunidades de mejora general

- **[Hero search bar y ChatWidget estan desconectados — oportunidad de sinergia]** El `<input>` de busqueda del Hero (`Hero.tsx`) y el ChatWidget son dos puntos de entrada separados. El candidato que escribe "enfermera" en el Hero va a `/vacantes?search=enfermera`. El candidato que abre Kyo empieza desde cero. Oportunidad: cuando el usuario ya escribio en el Hero y luego abre Kyo, pre-poblar el primer mensaje de Kyo con lo que escribio. Implementacion: guardar el query del Hero en `sessionStorage` con key `kyo_prefill`. En `useChat.ts`, al abrir el chat por primera vez, leer ese key y si existe, hacer `sendMessage(prefill)` automaticamente. Costo: ~10 lineas distribuidas.

- **[Vacantes page — no hay paginacion ni lazy load para escalabilidad]** `src/app/vacantes/page.tsx` linea 173-196: renderiza TODAS las vacantes filtradas en el DOM al mismo tiempo. Con 8 jobs actuales no hay problema, pero cuando el catalogo crezca (50+) el render inicial sera pesado. Agregar slice simple: `filtered.slice(0, visibleCount)` con un boton "Ver mas" que incremente `visibleCount` en 12. Patron simple, sin dependencias extra, escala linealmente.

- **[Vacantes page — filtro "Marca" no es terminologia del candidato]** `src/app/vacantes/page.tsx` linea 12: el label del filtro es "Marca" (`MARCAS`). Para un candidato buscando empleo, "marca" es confuso — el concepto es "Empresa". El array ya contiene nombres de empresas. Cambiar el label del `DropdownPill` a `"Empresa"` en linea 147: `<DropdownPill label="Empresa" ...>`. Solo cambia el texto visible, no la logica de filtrado.

- **[Kyo podria ofrecer agendar una llamada como alternativa al formulario]** El Paso 6 cierra con "llena el formulario". Pero una parte de los candidatos prefiere hablar por telefono. Agregar en el Paso 6 del system-prompt una alternativa: "Si el candidato prefiere hablar, comparte el numero `55 2087 6765` y el horario `Lunes a Viernes 9am-6pm`." Actualmente Kyo solo menciona WhatsApp o el formulario — agregar el telefono como tercera opcion de cierre.
