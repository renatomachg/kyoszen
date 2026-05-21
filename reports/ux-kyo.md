# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-20
**Cambios analizados:** No hubo cambios de codigo en los ultimos 2 dias (solo commits de reportes automaticos). Se analizo el estado actual completo del codigo.

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
- `src/components/sections/Services.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/ui/AplicarModal.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/api/aplicar/route.ts`
- `src/lib/jobs.ts`
- `src/lib/courses.ts`

---

## Cambios Recientes Detectados

No se detectaron cambios de codigo en las ultimas 48 horas. El ultimo cambio funcional fue `9e4d8d0` (GitHub Actions deploy al VPS). El analisis cubre el estado actual del codebase completo.

---

## Sugerencias de UX

### Alta prioridad

- **`src/components/sections/Vacancies.tsx` lineas 7-40 — Datos de vacantes desincronizados.**
  El componente `Vacancies` del Home hardcodea 4 tarjetas con data estatica que NO viene del array `JOBS`. Cuando se agregue o modifique una vacante en `src/lib/jobs.ts`, el home no se actualizara. Solucion: reemplazar el array local con `import { JOBS } from "@/lib/jobs"` y tomar los primeros 4 jobs (`JOBS.slice(0, 4)`). Impacto: candidatos veran vacantes reales actualizadas en el home.

- **`src/components/sections/Vacancies.tsx` linea 73 — Cards no enlazan a la vacante especifica.**
  Cada tarjeta de vacante en el home hace `<Link href="/vacantes">` para todas las tarjetas. Esto es una oportunidad perdida: el candidato que hace clic en "Auxiliar Administrativo" deberia ir a `/vacantes/1`, no a la lista general. Cambiar `href="/vacantes"` a `href={\`/vacantes/${vac.id}\`}` (una vez que el array venga de `JOBS`). Mejora directamente la tasa de conversion de candidatos.

- **`src/components/sections/Hero.tsx` lineas 122 y 132 — Uso de `next/image` en imagenes del hero.**
  CLAUDE.md indica explicitamente "No usar `next/image` en VPS — ya se tuvo problema en WhyUs. Preferir `<img>` nativo". El Hero usa `Image` de `next/image` para `Hero.jpg` y `Hero2.jpg`. En el deploy al VPS esto puede romper las imagenes. Reemplazar ambos bloques `<Image ... fill ...>` con `<img style={{ objectFit: "cover", width: "100%", height: "100%", position: "absolute" }}>`.

- **`src/components/sections/Hero.tsx` linea 98-103 — Avatares de confianza desde CDN externo.**
  Los 4 avatares del bloque "+687 candidatos colocados" vienen de `https://i.pravatar.cc/56?img=X`. Si ese CDN cae o bloquea la peticion, el hero muestra imagenes rotas. Reemplazar con SVGs circulares de color solido (placeholders) o fotos reales en `/public/images/`. No depender de servicios de terceros para elementos visuales criticos del hero.

### Media prioridad

- **`src/components/sections/Services.tsx` linea 24 — Inconsistencia en numero de cursos.**
  El texto dice "+25 cursos" pero `src/lib/courses.ts` tiene exactamente 15 cursos. Cambiar a "+15 cursos" o al numero real. Un candidato que ve "+25" y entra a `/cursos` y ve 15 pierde confianza. Mejor aun: importar `COURSES.length` dinamicamente.

- **`src/components/layout/Navbar.tsx` linea 91-112 — Menu mobile sin animacion.**
  El menu mobile aparece y desaparece abruptamente con un simple `{mobileOpen && ...}`. Todo el sitio usa Framer Motion. Envolver el menu en `<AnimatePresence>` con `motion.div` (initial: opacity 0 / y: -10, animate: opacity 1 / y: 0, exit: opacity 0 / y: -10, transition: duration 0.18). Consistencia visual y sensacion de calidad.

- **`src/components/sections/FAQ.tsx` linea 84 — Accordion con altura maxima rigida.**
  El accordion usa `max-h-[200px]` para mostrar la respuesta. Si la respuesta tiene mas de ~6 lineas (posible al agregar FAQs mas detalladas), el contenido se corta sin scroll visible. Cambiar a `max-h-[500px]` que en la practica nunca se alcanza para texto de FAQ.

- **`src/components/assistant/ChatWidget.tsx` — Sin badge de notificacion cuando el widget esta cerrado.**
  Kyo envia el saludo automatico al cargar la pagina, pero si el widget esta cerrado no hay indicador visual de que hay un mensaje nuevo. Agregar un punto rojo (`w-3 h-3 bg-red-500 rounded-full absolute top-0 right-0`) que aparezca cuando `messages.length > 0` y el widget este cerrado. Aumentaria significativamente la tasa de apertura del chat.

- **`src/components/assistant/ChatWidget.tsx` linea 170 — Input sin limite de caracteres.**
  El campo de texto no tiene `maxLength`. Un usuario puede pegar un texto de miles de caracteres, generando una llamada costosa a la API o un error. Agregar `maxLength={500}` al input. Con 500 caracteres hay suficiente espacio para cualquier pregunta razonable.

### Baja prioridad

- **`src/components/assistant/ChatWidget.tsx` lineas 154-163 — Reset sin confirmacion.**
  El boton "Nueva conversacion" destruye el historial inmediatamente sin pedir confirmacion. Un candidato que lo presiona por accidente a mitad de su flujo pierde todo el contexto. Agregar un `window.confirm("¿Iniciar nueva conversacion? Se borrara el historial actual.")` antes de llamar a `reset()`.

- **Accesibilidad — Botones de accordion sin `aria-expanded`.**
  Los botones del FAQ accordion (`FAQ.tsx` lineas 67-69) no tienen `aria-expanded`. Agregar `aria-expanded={openIndex === i}` para lectores de pantalla.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **`src/lib/assistant/system-prompt.ts` — Paso 5 no incluye salario en el formato de recomendacion.**
  El formato actual es: `[Nombre] — [Empresa] — [Por que le aplica]`. El salario es el dato #1 que un candidato quiere saber al evaluar una vacante, y ya esta disponible en el contexto del sistema (linea 120 del system-prompt, incluye `$${j.salario}/mes`). Cambiar el formato a:
  ```
  1. [Nombre del puesto] — [Empresa] — $[salario]/mes — [Por que le aplica]
  ```
  Editar linea 51-56 del system-prompt para agregar el campo de salario en el ejemplo de formato.

- **`src/lib/assistant/system-prompt.ts` lineas 31-46 — No maneja el caso de "usuario da toda la info de golpe".**
  Si el candidato escribe "busco trabajo de ventas en CDMX tiempo completo, tengo 2 años de experiencia", Kyo deberia saltar directo al Paso 5. Agregar instruccion explicita despues del Paso 0: `Si el usuario proporciona voluntariamente mas de una respuesta en un solo mensaje (puesto + experiencia + ubicacion), absorbe esa informacion sin repetir preguntas ya respondidas y avanza al siguiente dato faltante o directamente a la recomendacion.`

- **`src/lib/assistant/knowledge.ts` lineas 99-105 y `src/components/sections/FAQ.tsx` lineas 7-27 — FAQs desincronizadas.**
  `knowledge.ts` tiene 5 FAQs distintas a las 5 de `FAQ.tsx`. "¿Que documentos necesito para aplicar?" aparece en FAQ.tsx pero NO en knowledge.ts. Si un candidato le pregunta a Kyo sobre documentos, no tiene esa info. Solucio: agregar esa FAQ a `knowledge.ts > COMPANY.faqs`:
  ```typescript
  { q: "¿Que documentos necesito para aplicar?", a: "Acta de nacimiento, comprobante de domicilio (max 3 meses), ID oficial, CURP, numero de seguridad social y constancia de situacion fiscal." }
  ```

- **`src/components/assistant/useChat.ts` linea 18 — Historial de chat sin caducidad.**
  El chat persiste hasta 30 mensajes en localStorage sin TTL. Un candidato que regresa 3 meses despues ve una conversacion obsoleta que referencia vacantes que pueden ya no existir. Agregar logica de expiracion en `loadHistory()`: verificar si el ultimo mensaje tiene mas de 7 dias y si es asi, retornar `[INITIAL_GREETING]` en su lugar.
  ```typescript
  const last = parsed[parsed.length - 1];
  if (last && Date.now() - last.timestamp > 7 * 24 * 60 * 60 * 1000) return [INITIAL_GREETING];
  ```

### Nuevas tools o capacidades recomendadas

- **`src/lib/assistant/tools.ts` — Tool `search_jobs` sin filtros de contrato ni jornada.**
  En el Paso 4 del flujo, Kyo pregunta sobre disponibilidad (tiempo completo / medio tiempo), pero la tool `search_jobs` no tiene parametros `contract` ni `schedule`. El dato existe en `src/lib/jobs.ts`. Agregar a la definicion de la tool:
  ```typescript
  contract: { type: "string", description: "Filtra por tipo de contrato: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" },
  schedule: { type: "string", description: "Filtra por jornada: 'Matutina', 'Vespertina', 'Mixta', 'Flexible'" },
  ```
  Y en `knowledge.ts > listJobs` agregar los filtros correspondientes. Sin esto, la respuesta del Paso 4 no mejora la calidad de las recomendaciones del Paso 5.

- **Tool faltante: `save_candidate_interest` — El "banco de talentos" no guarda nada real.**
  Cuando no hay vacante compatible, el system-prompt dice ofrecer "registrar sus datos para contactarle". Actualmente solo navega a `/contacto` (formulario generico). Crear tool `save_candidate_interest` que POST a `/api/candidatos` con el perfil recopilado en el flujo (nombre, puesto buscado, ubicacion, jornada). El endpoint puede enviar correo a `rsalazar@kyoszen.com` similar a `/api/aplicar/route.ts`. Esto cierra el funnel para candidatos sin vacante activa.

- **Quick replies / chips de respuesta rapida en el chat.**
  En el Paso 1 (tipo de puesto) y Paso 3 (ubicacion), las opciones son predecibles. Agregar un campo `suggestions?: string[]` a `ChatMessage` y renderizarlo en `ChatWidget.tsx` como botones clicables bajo el mensaje de Kyo. Ejemplo: despues de "¿En que zona vive?", mostrar chips `["CDMX", "Estado de Mexico", "Hibrido", "Remoto"]`. Esto reduce friccion especialmente en mobile donde escribir es mas lento.

### Problemas detectados

- **`src/app/api/assistant/chat/route.ts` linea 93 — `max_tokens: 1024` puede truncar respuestas del Paso 5.**
  En el Paso 5, Kyo construye un mensaje con 2-3 vacantes, cada una con nombre, empresa, salario y razon de match. Con el saludo personalizado y el cierre, un mensaje tipico puede acercarse al limite. Si la respuesta se trunca, el candidato ve texto cortado. Aumentar a `max_tokens: 2048`. El costo marginal con Haiku es minimo.

- **`src/components/assistant/useChat.ts` lineas 109-112 — Navegacion forzada aunque el usuario este en esa pagina.**
  Si el candidato ya esta en `/vacantes` y Kyo llama `navigate_to('/vacantes?ubicacion=CDMX')`, el hook hace `router.push(target.path)`. Esto recarga la pagina destruyendo el estado local de filtros. Cambiar a `router.replace(target.path)` para evitar agregar al historial del navegador y no recargar la pagina si el pathname base es el mismo.

- **`src/app/api/aplicar/route.ts` lineas 20-32 — SMTP sin env vars falla silenciosamente.**
  Si `SMTP_HOST`, `SMTP_USER` o `SMTP_PASS` no estan configurados en el VPS, `nodemailer` falla al hacer `sendMail` y el candidato ve un error generico sin saber si su aplicacion llego. Agregar al inicio del handler:
  ```typescript
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: "Servicio no disponible. Contactanos por WhatsApp." }, { status: 503 });
  }
  ```
  Tambien agregar `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` a la seccion de env vars requeridas en `CLAUDE.md`.

---

## Oportunidades de mejora general

- **Auto-abrir Kyo en `/vacantes` para primeras visitas.**
  En `ChatWidget.tsx`, verificar con `sessionStorage` si el usuario ya abrio el chat en esta sesion. Si esta en `/vacantes` (usando `usePathname`) y no lo ha abierto, hacer `setOpen(true)` automaticamente despues de 4 segundos. Los candidatos en `/vacantes` ya estan en modo de busqueda activa — es el mejor momento para que Kyo se presente. Usar `sessionStorage` (no `localStorage`) para que se abra solo una vez por sesion.

- **Mostrar el `reason` de la navegacion como mensaje en el chat.**
  En `useChat.ts` lineas 109-112, cuando Kyo navega, el `reason` se ignora en el frontend. Agregar el reason como mensaje del asistente antes de navegar: `"Te llevo a [reason] para que puedas ver las opciones directamente."`. El campo `reason` ya esta definido en la tool (`tools.ts` linea 68) pero no se usa en el widget.

- **Centralizar la data de `SITE_PAGES` en `knowledge.ts`.**
  `/blog` existe como ruta (`src/app/blog/[slug]/page.tsx`) pero NO esta en el array `SITE_PAGES` de `knowledge.ts` (lineas 60-67). Kyo no sabe que el blog existe y no puede navegar a el ni mencionarlo. Agregar:
  ```typescript
  { path: "/blog", title: "Blog", purpose: "Articulos y recursos de RRHH", summary: "Contenido sobre reclutamiento, liderazgo y tendencias de capital humano." },
  ```

- **Validacion de numero de telefono en AplicarModal.**
  `AplicarModal.tsx` linea 146 acepta cualquier `type="tel"`. Un candidato puede escribir "abc" y el formulario se envia. Agregar `pattern="[0-9\s\-\+]{10,15}"` y un mensaje de validacion. Los numeros de WA invalidos hacen que el reclutador no pueda contactar al candidato.
