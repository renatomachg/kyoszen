# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-12
**Cambios analizados:** No hubo cambios de codigo en las ultimas 48 horas (commits recientes son solo reportes automaticos). Tercera auditoria profunda: enfocada exclusivamente en hallazgos NO cubiertos en reportes anteriores (2026-05-10 y 2026-05-11).

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/app/api/aplicar/route.ts`
- `src/app/api/contacto/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Vacancies.tsx`
- `src/components/ui/AplicarModal.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/page.tsx`
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

Sin cambios de codigo. Las sugerencias de los dos reportes previos siguen pendientes de implementacion:
- `next/image` en Hero.tsx sin corregir (alta prioridad desde 2026-05-10)
- `search_jobs` sin filtros `contrato`/`jornada` (alta prioridad desde 2026-05-11)
- Vacancies.tsx con datos hardcodeados duplicados (alta prioridad desde 2026-05-10)

---

## Sugerencias de UX

### Alta prioridad

- **Seguridad XSS en el email de aplicaciones** (`src/app/api/aplicar/route.ts`, lineas 44-57): el HTML del correo se construye con interpolacion directa de datos del usuario (`${nombre}`, `${whatsapp}`, `${correo}`, etc.). Si alguien envia `<img src=x onerror=...>` en cualquier campo, ese codigo se inyecta en el cuerpo del email enviado a `rsalazar@kyoszen.com`. Correccion: crear una funcion `escapeHtml(s: string)` que reemplace `&`, `<`, `>`, `"`, `'` por sus entidades HTML, y aplicarla a todos los valores antes de interpolarlos en el template. Ejemplo:
  ```ts
  const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  ```
  Luego usar `esc(nombre)`, `esc(correo)`, etc. en el HTML. Cambio de 10 lineas, cierra un vector de ataque real.

- **Sin limite de tamaño en CV adjunto** (`src/app/api/aplicar/route.ts`, linea 35): el codigo hace `await cv.arrayBuffer()` sin verificar `cv.size` previamente. Un archivo de 100 MB consumiria toda la RAM disponible en el servidor. Agregar antes de la linea 35:
  ```ts
  if (cv && cv.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "El CV no puede superar 5 MB" }, { status: 400 });
  }
  ```
  En Vercel el limite de payload es 4.5 MB por defecto, pero en VPS no hay ese limite automatico.

- **Sin rate limiting en `/api/aplicar`** (`src/app/api/aplicar/route.ts`, linea 4): el endpoint de aplicacion no tiene ningun rate limit. El endpoint del chat si lo tiene (30 req/min por IP). Un atacante puede enviar miles de formularios y saturar el correo de `rsalazar@kyoszen.com`. Copiar el patron del `checkRateLimit` del route del asistente (o importarlo de un modulo compartido) y aplicarlo al inicio del handler de `/api/aplicar`. Limite razonable: 5 aplicaciones por IP por hora.

- **Kyo no puede navegar a vacantes especificas aunque la ruta existe** (`src/lib/assistant/system-prompt.ts`, lineas 91-99 y `src/lib/assistant/tools.ts`, linea 63): la pagina `/vacantes/[id]` ya existe y funciona completamente (con modal de aplicacion, salario, requisitos, boton de WhatsApp). Sin embargo, el system prompt no incluye `/vacantes/[id]` como ruta de navegacion valida y la tool `navigate_to` no la documenta. Resultado: en el Paso 5, Kyo navega a `/vacantes?q=ventas` en lugar de `/vacantes/3` (la vacante exacta recomendada). El candidato llega al listado y tiene que buscar de nuevo la vacante que Kyo ya le recomendo. Solucion: agregar en el system prompt (`linea 99`) la linea:
  - `/vacantes/<id>` para detalle de vacante especifica (ej: `/vacantes/3`)
  Y agregar en la instruccion del Paso 5 (`linea 64`): "Usa `navigate_to` con la ruta `/vacantes/<id>` de la vacante mas compatible, no con el listado general." Impacto: el candidato llega directo al boton "Aplicar ahora" de la vacante recomendada — conversion directa.

### Media prioridad

- **Variables SMTP no validadas antes de intentar enviar** (`src/app/api/aplicar/route.ts`, linea 22): el transporter de nodemailer se crea aunque `SMTP_HOST`, `SMTP_USER` y `SMTP_PASS` sean `undefined`. La falla ocurre en `transporter.sendMail()` con un error generico que el frontend muestra como "Hubo un error al enviar." Agregar al inicio del handler (antes de parsear el form):
  ```ts
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json({ error: "Servicio de correo no configurado" }, { status: 503 });
  }
  ```
  Hace el fallo de configuracion explicito en lugar de oculto.

- **Email de destino hardcodeado** (`src/app/api/aplicar/route.ts`, linea 41): `to: "rsalazar@kyoszen.com"` esta quemado en el codigo. Si el destinatario cambia requiere un deploy. Mover a variable de entorno: `to: process.env.APLICAR_TO_EMAIL ?? "rsalazar@kyoszen.com"`. Consistente con como deberian manejarse todos los datos de configuracion operacional.

- **`/vacantes/[id]/page.tsx` es `use client` completa** (linea 1): toda la pagina de detalle de vacante es cliente porque usa `useState` para el modal. Esto impide que Next.js la renderice en servidor, eliminando el beneficio de SEO para cada vacante (las vacantes no tendran contenido indexable por Google). Solucion: separar el componente en dos. El page.tsx es server component que renderiza el contenido estatico; el modal se extrae a un `AplicarButton.tsx` client component minimo que solo maneja el `useState`. Impacto: cada vacante es indexable individualmente, mejora posicionamiento en busquedas como "auxiliar administrativo CDMX empleo".

- **Hero usa imagenes externas de pravatar.cc** (`src/components/sections/Hero.tsx`, lineas 99-104): las 4 imagenes de "candidatos colocados" vienen de `https://i.pravatar.cc/56?img=1..4`. Si ese servicio falla, el bloque de confianza del Hero muestra 4 imagenes rotas. Reemplazar con 4 imagenes de placeholder locales en `/public/images/avatars/1.jpg..4.jpg` (pueden ser las mismas descargadas una vez). Adicionalmente, estas imagenes no tienen `alt` descriptivo lo que genera advertencias de accesibilidad.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **Paso 5: Kyo recomienda pero no usa `get_job_details` antes de recomendar** (`src/lib/assistant/system-prompt.ts`, lineas 47-58): el system prompt instruye a Kyo a analizar las vacantes con las 4 respuestas del candidato y mostrar las 2-3 mas compatibles. Pero Kyo solo tiene el resumen del listado (titulo, empresa, salario, jornada). Si el candidato pregunta "¿por que me recomiendas esa?", Kyo no tiene los requisitos ni responsabilidades detalladas para justificarlo. Agregar en las instrucciones del Paso 5: "Usa `get_job_details` para la vacante que vayas a recomendar antes de explicar por que aplica al candidato." Esto mejora la calidad y especificidad del razonamiento de Kyo.

- **Paso 6: Kyo manda al candidato a `/contacto` pero el boton "Aplicar ahora" esta en `/vacantes/[id]`** (`src/lib/assistant/system-prompt.ts`, linea 67): el flujo de cierre navega a `/contacto` (formulario general). Pero la pagina de detalle de vacante ya tiene un modal de aplicacion especifico (`AplicarModal`) con campo de CV adjunto y todos los datos de la vacante prellenados. Cambiar la instruccion del Paso 6 a: "Navega a `/vacantes/<id>` de la vacante elegida. El candidato encontrara el boton 'Aplicar ahora' directamente." Esto reduce un paso en el flujo de conversion.

- **Kyo no maneja el caso de experiencia cero** (`src/lib/assistant/system-prompt.ts`, Paso 2): si el candidato responde "no tengo experiencia" o "es mi primer trabajo", no hay instruccion especifica. Kyo podria ignorar ese dato o quedar atascado buscando vacantes con `experiencia: 0`. Agregar en el Paso 2: "Si el candidato responde que no tiene experiencia, toma nota y en el Paso 5 filtra con `query: 'sin experiencia'` y busca vacantes con requisito 'Preparatoria terminada' o 'experiencia minima 6 meses'." Las vacantes id=1 (Auxiliar Administrativo) y id=4 (Recepcionista) son ideales para perfiles sin experiencia.

- **Kyo no maneja el caso de busqueda amplia** (`src/lib/assistant/system-prompt.ts`, Paso 1): si el candidato responde "cualquier trabajo" o "lo que sea", el flujo se rompe porque Kyo no puede hacer una recomendacion util sin un tipo de puesto. Agregar manejo: "Si el candidato dice que acepta cualquier trabajo, pregunta: '¿Prefiere trabajo de oficina, operativo o atencion a clientes?' como refinamiento del Paso 1 antes de pasar al Paso 2."

### Nuevas tools o capacidades recomendadas

- **Documentar `/vacantes/<id>` en la tool `navigate_to`** (`src/lib/assistant/tools.ts`, linea 63): actualmente la descripcion del path solo menciona ejemplos como `/cursos`, `/vacantes`, `/contacto`. Agregar: "Para vacantes especificas usa `/vacantes/<id>` donde `<id>` es el numero de id del catalogo (ej: `/vacantes/3`)." No requiere cambio de logica, solo de documentacion. Si ademas se quiere prevenir que Kyo invente IDs inexistentes, agregar en `executeTool` una validacion:
  ```ts
  if (input.path?.startsWith("/vacantes/") && input.path !== "/vacantes/") {
    const id = Number(input.path.split("/")[2]);
    if (!knowledge.getJob(id)) return JSON.stringify({ error: "Vacante no encontrada" });
  }
  ```

- **Agregar `salario_min` al tool `search_jobs`** (`src/lib/assistant/tools.ts`, lineas 38-47): el candidato puede mencionar expectativa salarial en cualquier momento de la conversacion ("busco algo de al menos $12,000") pero Kyo no puede filtrar por salario minimo. Agregar `salario_min: { type: "number", description: "Salario minimo mensual en pesos MXN" }` al schema y en `knowledge.ts` linea 138 agregar `.filter((j) => !filters?.salario_min || j.salario >= filters.salario_min)`. Dato que el candidato casi siempre tiene en mente y que cambiaria significativamente las recomendaciones.

### Problemas detectados

- **Kyo puede inventar rutas de vacantes inexistentes**: la instruccion "Solo usa rutas listadas abajo" en el system prompt (linea 83) lista rutas como `/vacantes?ubicacion=...` y `/cursos/<slug>` pero no `/vacantes/<id>`. Sin esa instruccion explicita, Kyo puede intentar navegar a `/vacantes/99` (id que no existe) si infiere el patron. La pagina de detalle maneja esto con `notFound()`, pero el candidato experimentaria una pagina de error 404. Solucion: listar explicitamente los IDs validos en el system prompt justo debajo del catalogo de vacantes, o agregar la validacion en `executeTool` descrita arriba.

- **El fallback de aplicacion en AplicarModal no tiene timeout** (`src/components/ui/AplicarModal.tsx`, linea 40): el `fetch("/api/aplicar")` no tiene timeout. Si el servidor SMTP esta lento, el candidato ve el boton "Enviando..." indefinidamente. Agregar `AbortController` con timeout de 15 segundos:
  ```ts
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  const res = await fetch("/api/aplicar", { method: "POST", body: fd, signal: controller.signal });
  clearTimeout(timer);
  ```
  Y manejar `AbortError` como `status("error")`.

- **Kyo puede proponer una vacante eliminada si el candidato regresa con historial guardado**: si el catalogo cambia (se quita una vacante) y el candidato regresa con historial en localStorage, Kyo puede ver en mensajes anteriores una referencia a `id=3` y navegar a `/vacantes/3` aunque esa vacante ya no exista. Mitigacion: agregar en el system prompt la aclaracion: "El catalogo que ves es el actual. No hagas referencia a vacantes de mensajes anteriores si el id no aparece en el catalogo que tienes arriba."

---

## Oportunidades de mejora general

- **La seccion Vacancies del home linkea a `/vacantes` (listado) en lugar de a `/vacantes/[id]`** (`src/components/sections/Vacancies.tsx`, linea 73): ahora que la pagina de detalle existe, cada tarjeta de vacante del home deberia linkar a `/vacantes/${vac.id}`. Ademas el Vacancies del home no muestra el salario de cada vacante, que es el primer dato que el candidato quiere ver. Las tarjetas del listado `/vacantes` si muestran el salario; las del home no.

- **El flow de Kyo y el flujo de aplicacion manual estan desconectados**: si un candidato empieza con Kyo (que recoge nombre, puesto, experiencia, ubicacion), luego navega a `/vacantes/1` y hace clic en "Aplicar ahora", el AplicarModal le vuelve a pedir nombre, experiencia y ubicacion — datos que Kyo ya recogio. Una opcion liviana: guardar en `localStorage` los datos del candidato cuando Kyo los recoge (nombre, experiencia, ubicacion) y leerlos en AplicarModal al abrirse. Impacto: elimina friccion en la conversion final.

- **No hay sitemap.xml con las rutas de vacantes**: ahora que `/vacantes/[id]` es una ruta dinamica, Google necesita un sitemap para descubrirlas. Sin sitemap, solo indexara las rutas que encuentre por enlaces internos. Crear `src/app/sitemap.ts`:
  ```ts
  import { JOBS } from "@/lib/jobs";
  export default function sitemap() {
    return [
      { url: "https://kyoszen.com/", lastModified: new Date() },
      { url: "https://kyoszen.com/vacantes", lastModified: new Date() },
      ...JOBS.map(j => ({ url: `https://kyoszen.com/vacantes/${j.id}`, lastModified: new Date() }))
    ];
  }
  ```
  Impacto: SEO organico para cada vacante especifica, sin costo adicional.

- **El endpoint `/api/contacto/route.ts` probablemente tiene el mismo XSS que `/api/aplicar`**: basado en el patron del route de aplicar (interpolacion directa de datos de usuario en HTML), es muy probable que el de contacto tenga el mismo problema. Revisar y aplicar la misma funcion `escapeHtml` si es el caso.
