# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-17
**Cambios analizados:** Sin cambios de codigo en los ultimos 2 dias (solo reportes automaticos). Auditoria de tercera pasada: todas las sugerencias son NUEVAS (no cubiertas en reportes del 2026-05-15 ni 2026-05-16).

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Vacancies.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/FAQ.tsx`
- `src/components/sections/Process.tsx`
- `src/components/ui/AplicarModal.tsx`
- `src/components/layout/Navbar.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/page.tsx`
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

Sin cambios de codigo. Los ultimos 5 commits son reportes automaticos (`salud-sitio.md`, `ux-kyo.md`). Esta es una auditoria de tercera pasada con observaciones nuevas no cubiertas en los reportes del 2026-05-15 y 2026-05-16.

---

## Sugerencias de UX

### Alta prioridad

- **[CRITICO — Pagina de vacante detalle sin SEO ni Open Graph]** `src/app/vacantes/[id]/page.tsx` linea 1: el archivo tiene `"use client"` al inicio, lo que impide usar `generateMetadata()` de Next.js. Cuando alguien comparte un link como `/vacantes/3` por WhatsApp o LinkedIn, el preview muestra el titulo del sitio generico ("Kyoszen") sin mencionar el puesto ni la empresa. En Google, el canonical de cada vacante tampoco tiene `<title>` dinamico. Solucion: separar en un Server Component wrapper que llame `generateMetadata` y exporte el layout, mas un Client Component hijo para la interactividad del modal. El Server Component queda en `page.tsx`, el Cliente en `VacanteDetailClient.tsx`. Impacto directo en conversion de candidatos que llegan por redes sociales.

- **[AplicarModal sin focus trap ni atributos ARIA de dialogo]** `src/components/ui/AplicarModal.tsx` linea 82: el `<motion.div>` del modal no tiene `role="dialog"`, `aria-modal="true"` ni `aria-labelledby`. Cuando el usuario abre el modal con teclado, el foco puede escaparse al contenido detras del backdrop y el lector de pantalla no anuncia que se abrio un dialogo. Agregar:
  ```tsx
  <motion.div
    role="dialog"
    aria-modal="true"
    aria-label="Aplicar a vacante"
    ...
  >
  ```
  Adicionalmente, agregar un `useEffect` que haga focus al primer campo del form cuando `open === true`:
  ```tsx
  useEffect(() => {
    if (open) formRef.current?.querySelector<HTMLElement>("input, select")?.focus();
  }, [open]);
  ```

- **[Mobile — sidebar CTA de vacante invisible hasta el final del scroll]** `src/app/vacantes/[id]/page.tsx` linea 132: el sidebar (`sticky top-28`) solo funciona en desktop (`lg:grid-cols-[1.6fr_1fr]`). En mobile el grid es `grid-cols-1`, la columna derecha aparece DESPUES de toda la descripcion y requisitos — el candidato tiene que bajar ~3 pantallas para ver el boton "Aplicar ahora". Agregar un banner sticky en el bottom para mobile:
  ```tsx
  {/* Mobile sticky CTA — solo visible en mobile */}
  <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-border px-5 py-3 flex gap-3">
    <button onClick={() => setModalOpen(true)}
      className="flex-1 bg-navy text-white rounded-full py-3 text-sm font-extrabold">
      Aplicar ahora
    </button>
    <a href={`https://wa.me/525520876765?text=...`}
      className="flex-1 bg-wa text-white rounded-full py-3 text-sm font-extrabold text-center no-underline">
      WhatsApp
    </a>
  </div>
  ```
  El padding-bottom del section principal debe compensar: `pb-24 lg:pb-12`.

### Media prioridad

- **[FAQ inconsiste con AplicarModal sobre documentacion requerida]** `src/components/sections/FAQ.tsx` linea 18: la FAQ "¿Que documentos necesito?" responde "Acta de nacimiento, comprobante de domicilio (max 3 meses), ID oficial, CURP, numero de seguridad social y constancia de situacion fiscal." Sin embargo, `AplicarModal.tsx` solo tiene un campo `documentacion` de SI/NO que pregunta si ya los tiene. Un candidato lee el FAQ, reune sus documentos, abre el modal, y ve que no se los piden. Inconsistente. Solucion: actualizar la respuesta del FAQ en `FAQ.tsx` a: "Cuando te llamemos te pediremos: Acta de nacimiento, comprobante de domicilio, ID oficial, CURP, NSS y constancia fiscal. En tu solicitud inicial no los necesitas — solo aplicar es suficiente." Esto reduce la friccion psicologica de candidatos que creen que deben tener todo antes de aplicar.

- **[Process section esta orientada 100% a empresas, invisible para candidatos]** `src/components/sections/Process.tsx` linea 6-26: los 4 pasos ("Identificamos el perfil", "Busqueda dirigida", etc.) son el proceso de Kyoszen hacia la empresa, no el del candidato. Un candidato que llega al Home leyendo los pasos no sabe si esto es relevante para el. El Hero ya mezcla audiencias (tiene buscador de vacantes pero el H1 dice "Transforma tu empresa"). Agregar al final de la seccion Process un CTA secundario minimo:
  ```tsx
  <div className="text-center mt-8">
    <p className="text-sm text-muted mb-3">¿Eres candidato buscando empleo?</p>
    <Link href="/vacantes" className="text-blue font-bold text-sm hover:underline">
      Ver vacantes disponibles →
    </Link>
  </div>
  ```
  No requiere redisenar la seccion. Solo clarifica la audiencia dual del sitio.

- **["Publicado hoy" hardcodeado en todas las cards de la seccion Vacancies]** `src/components/sections/Vacancies.tsx` linea 92: el texto "Publicado hoy" aparece en las 4 cards aunque los datos de `jobs.ts` no tienen campo `publishedAt`. Si este componente se deja activo por semanas, las 4 vacantes siempre diran "Publicado hoy" — es falso y puede generar desconfianza. Solucion a corto plazo: cambiar el texto a "Vigente" que es siempre verdadero. A largo plazo: agregar campo `publishedAt: string` al tipo `Job` en `src/lib/jobs.ts` y mostrarlo formateado con `Intl.RelativeTimeFormat`.

- **[Navbar mobile — menu no tiene animacion de apertura/cierre]** `src/components/layout/Navbar.tsx` linea 92: el menu mobile usa `{mobileOpen && (...)}` sin `AnimatePresence`. Aparece y desaparece instantaneamente — el resto del sitio usa Framer Motion con animaciones suaves. Wrappear con `AnimatePresence` y agregar `motion.div` con `initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}`. Consistencia visual con el resto del sitio.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[Kyo no detecta que el usuario ya eligio una vacante especifica antes de abrir el chat]** Si un candidato esta leyendo `/vacantes/3` (Ejecutivo de Ventas, Sigma Retail) y abre el ChatWidget, Kyo empieza desde cero: "¿Que tipo de trabajo busca?" — cuando la respuesta es evidente. Esto ya fue sugerido en el reporte anterior como idea, aqui se especifica la implementacion completa:
  1. En `ChatWidget.tsx`, al abrir el chat (cuando `setOpen(true)`), leer `window.location.pathname`.
  2. Si coincide con `/vacantes/\d+`, extraer el id: `const jobId = Number(pathname.split("/").pop())`.
  3. Inyectar un mensaje de sistema inicial extra en el primer POST: `system_context: { viewing_job_id: jobId }`.
  4. En `route.ts`, si `system_context.viewing_job_id` existe, anteponer al conversation: `{ role: "user", content: "[CONTEXTO: El usuario esta viendo la vacante id=${jobId}]" }` como primer mensaje antes del historial.
  5. En `system-prompt.ts` agregar: "Si recibes un mensaje de CONTEXTO indicando que el usuario ya esta en una vacante, omite el Paso 1 y comienza directamente en Paso 2 mencionando esa vacante."

- **[Kyo no valida que la respuesta al Paso 0 sea un nombre real]** `src/lib/assistant/system-prompt.ts` Paso 0 — NOMBRE: si el usuario escribe "hola", "si", "nada" o "123", Kyo puede interpretar eso como un nombre y llamarle "Hola" o "Si" durante toda la conversacion. Agregar instruccion especifica:
  ```
  ## Paso 0 — NOMBRE (manejo de casos especiales)
  Si la respuesta parece una saludo, confirmacion o no es un nombre (ej. "hola", "bien", "nada", "anonimo", numeros solos):
  - Responde: "Con gusto. ¿Me podria decir su nombre para orientarle mejor?"
  - Si insiste en no dar nombre: usa "amigo" o "usted" y avanza al Paso 1. Nunca insistas mas de una vez.
  ```

- **[Delay de navegacion de 700ms es insuficiente — el usuario no alcanza a leer el mensaje]** `src/components/assistant/useChat.ts` linea 110: `setTimeout(() => router.push(target.path), 700)`. Una respuesta tipica de Kyo (2-3 lineas) tarda entre 1.5 y 3 segundos en aparecer desde que el usuario envia. Cuando finalmente aparece la respuesta, 700ms despues ya se esta navegando — el usuario lee la primera mitad del mensaje y la pantalla cambia. Aumentar el delay a 2000ms para dar tiempo real de lectura:
  ```typescript
  setTimeout(() => router.push(target.path), 2000);
  ```

- **[Kyo no entiende jerga coloquial mexicana — reduce accesibilidad para candidatos de nivel operativo]** `src/lib/assistant/system-prompt.ts` — no hay ninguna instruccion sobre lenguaje regional. Un candidato operativo puede escribir "busco chamba de almacen", "traigo 2 años de jale", "quiero lana de minimo 10". Si Kyo responde formalmente sin entender "chamba" como trabajo o "lana" como salario, puede pedir aclaracion innecesaria o malinterpretar. Agregar en la seccion de Personalidad del system-prompt:
  ```
  - Entiende coloquialismos mexicanos: "chamba/jale/trabajo" son sinonimos, "lana/dinero/salario" son sinonimos,
    "ahorita" = pronto, "por el momento" = disponible ahora. Nunca corrijas al usuario. Responde siempre en tono profesional.
  ```

### Nuevas tools o capacidades recomendadas

- **[Agregar tool: check_application_status — para candidatos que regresan]** Un candidato que aplico hace 3 dias puede regresar al sitio y preguntarle a Kyo "¿ya supe algo de mi solicitud?" Actualmente Kyo no tiene forma de manejar esto — diria "Siempre usa tools antes de inventar datos" pero no hay tool para verificar. Sin integracion Supabase real, la respuesta correcta es redirigir al WhatsApp. Agregar instruccion en el system-prompt:
  ```
  ## Seguimiento de solicitudes
  Si el usuario pregunta por el estado de su aplicacion previa, responde:
  "Para seguimiento personalizado, contacta directamente a nuestro equipo por WhatsApp: 55 2087 6765 (Lun-Vie 9am-6pm).
  Ellos tienen acceso a tu expediente."
  Navega a /contacto si quiere mas opciones.
  ```
  Cuando Supabase este integrado, esta tool puede convertirse en una llamada real.

- **[Agregar soporte para enviar el perfil del candidato por WhatsApp al terminar el flujo]** Actualmente el Paso 6 lleva al formulario de `/contacto`. Alternativa de menor friccion: al final del flujo Kyo podria generar un mensaje pre-llenado para WhatsApp que incluya el resumen del perfil del candidato (nombre, puesto, experiencia, ubicacion, jornada). Implementacion en `tools.ts` con una nueva tool `generate_whatsapp_message`:
  ```typescript
  {
    name: "generate_whatsapp_message",
    description: "Genera un link de WhatsApp con el perfil del candidato pre-llenado para enviar al equipo de Kyoszen.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        puesto: { type: "string" },
        experiencia: { type: "string" },
        ubicacion: { type: "string" },
        jornada: { type: "string" },
        vacante_id: { type: "number", description: "ID de la vacante de interes (opcional)" }
      },
      required: ["nombre", "puesto"]
    }
  }
  ```
  En `executeTool` genera el link: `https://wa.me/525520876765?text=Hola%2C+me+llamo+${nombre}...`
  El frontend detecta una URL en la respuesta y la renderiza como boton clickable.

### Problemas detectados

- **[BUG — Kyo puede incluir URLs crudas de wa.me en su respuesta — no son clickables en el ChatWidget]** `src/lib/assistant/knowledge.ts` linea 83: el campo `whatsapp` en COMPANY es `"https://wa.me/525520876765"`. Este dato llega al system-prompt en la seccion de Contacto. Si el usuario pregunta "¿como me comunico?" y Kyo incluye la URL en su respuesta, el ChatWidget la renderiza como texto plano (no como `<a>` — los mensajes usan `whitespace-pre-wrap` en `ChatWidget.tsx` linea 227 sin parseo de markdown). El usuario ve la URL pero no puede hacer clic. Dos correcciones necesarias:
  1. En `src/lib/assistant/knowledge.ts` linea 83, cambiar `whatsapp` a solo el numero: `whatsapp: "55 2087 6765"`.
  2. En `system-prompt.ts` linea 110, actualizar el texto que usa esa variable para no generar la URL completa.
  3. Opcional a futuro: agregar un parser de URLs en `MessageBubble` de `ChatWidget.tsx` que convierta `https://wa.me/...` en un `<a target="_blank">` clickable.

- **[BUG — Rate limit por IP falla en entornos con NAT compartido — tipico en Mexico]** `src/app/api/assistant/chat/route.ts` lineas 10-23: el rate limit es 30 msg/min por IP. En Mexico es comun que hogares y oficinas compartan una IP publica via NAT (Telmex, Izzi, redes moviles de Telcel/Movistar con CGNAT). Si 3 candidatos de la misma empresa abren Kyo simultaneamente, el 3ro recibe "Demasiados mensajes, intenta de nuevo en un minuto" aunque no haya enviado nada. Dos mejoras:
  1. Aumentar `RATE_LIMIT` de `30` a `60` en linea 11 — candidatos reales raramente mandan mas de 10 mensajes seguidos.
  2. Agregar throttle en el cliente para evitar spam accidental: en `useChat.ts`, deshabilitar `sendMessage` por 800ms despues de cada envio con un ref de timestamp:
  ```typescript
  const lastSentAt = useRef(0);
  // en sendMessage:
  if (Date.now() - lastSentAt.current < 800) return;
  lastSentAt.current = Date.now();
  ```

- **[BUG — buildSystemPrompt() manda todo el catalogo de cursos y vacantes en cada request — costo innecesario]** `src/app/api/assistant/chat/route.ts` linea 92: `buildSystemPrompt()` incluye todas las vacantes y cursos en el system prompt. Con 8 vacantes y 15 cursos el token count es ~1200 tokens solo para el system. Cuando el catalogo crezca a 50+ vacantes el costo por mensaje puede duplicarse. La solucion de memoizacion ya fue sugerida en el reporte del 2026-05-16. Adicionalmente, considerar usar **prompt caching** de la API de Anthropic: el system prompt con datos estaticos es el candidato ideal para `cache_control: { type: "ephemeral" }`. Implementacion en `route.ts`:
  ```typescript
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
    tools: TOOLS,
    messages: conversation,
  });
  ```
  El cache de Anthropic dura 5 minutos y reduce el costo del system prompt en ~90% para conversaciones consecutivas. Requiere modelo `claude-haiku-4-5-20251001` o superior — ya es el modelo actual.

---

## Oportunidades de mejora general

- **[Agregar Schema.org FAQPage para SEO de preguntas frecuentes]** `src/components/sections/FAQ.tsx` — el componente tiene 5 FAQs pero no incluye structured data. Google puede mostrar estas preguntas como "rich snippets" en los resultados de busqueda (el acordeon aparece directamente en Google). Agregar al final del componente, antes del cierre del `<section>`:
  ```tsx
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(f => ({
        "@type": "Question",
        "name": f.q,
        "acceptedAnswer": { "@type": "Answer", "text": f.a }
      }))
    }) }}
  />
  ```
  Impacto: mejora visibilidad organica para busquedas como "cuanto tiempo tarda una consultora en cubrir vacante" o "que documentos necesito para aplicar a empleo CDMX".

- **[Vacante detalle — agregar seccion "Vacantes similares" al final]** `src/app/vacantes/[id]/page.tsx` — al llegar al final de la descripcion de una vacante, el usuario no tiene una razon para quedarse si esa vacante no le convence. Agregar una seccion simple al final con 2-3 vacantes de la misma categoria:
  ```typescript
  const similares = JOBS.filter(j => j.categoria === job.categoria && j.id !== job.id).slice(0, 3);
  ```
  Renderizar como mini-cards horizontales. Sin APIs adicionales, sin dependencias nuevas — datos ya disponibles en `jobs.ts`. Reduce tasa de abandono cuando la vacante vista no es la correcta.

- **[Kyo podria iniciar la conversacion de forma mas contextual segun la pagina]** Actualmente el saludo es identico sin importar desde que pagina se abre el chat. Si el usuario esta en `/cursos`, el saludo deberia ser diferente al de `/vacantes`. El saludo actual `"Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aqui para orientarte. ¿Me permite saber su nombre?"` funciona para candidatos pero es brusco para una empresa que busca cursos de capacitacion. Propuesta: en `ChatWidget.tsx`, pasar `window.location.pathname` al hook `useChat` al inicializar. En `useChat.ts`, seleccionar el `INITIAL_GREETING` segun la pagina:
  ```typescript
  const greetingByPath: Record<string, string> = {
    "/cursos": "Bienvenido a Kyoszen. Soy Kyo, puedo orientarle sobre nuestros cursos de capacitacion. ¿Me permite su nombre?",
    "/vacantes": "Bienvenido a Kyoszen. Soy Kyo y le ayudo a encontrar la vacante ideal. ¿Me puede decir su nombre?",
    "/servicios": "Bienvenido a Kyoszen. Soy Kyo, asistente de la consultora. ¿En que puedo orientarle hoy?",
  };
  const greeting = greetingByPath[pathname] ?? INITIAL_GREETING.content;
  ```
  El saludo se personaliza sin cambiar el flujo — mejora la primera impresion segun la intencion del usuario.
