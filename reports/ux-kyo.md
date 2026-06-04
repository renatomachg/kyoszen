# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-04
**Cambios analizados:** src/lib/assistant/system-prompt.ts, src/lib/assistant/tools.ts, src/lib/assistant/knowledge.ts, src/app/api/assistant/chat/route.ts, src/components/assistant/ChatWidget.tsx, src/components/assistant/useChat.ts, src/app/vacantes/[id]/_content.tsx, src/app/vacantes/page.tsx, src/app/contacto/page.tsx, src/app/revisor/page.tsx, src/app/admin/(panel)/redes-sociales/page.tsx

---

## Cambios Recientes Detectados

No hay commits de código nuevo en las últimas 48 horas — solo commits de reportes automáticos (health check, tendencias, fecha CLAUDE.md). Este reporte es una iteración más profunda sobre el estado actual del código, con hallazgos nuevos en páginas no cubiertas en el reporte anterior (vacante detalle, contacto, flujo Paso 5→6 de Kyo).

---

## Pendientes del reporte anterior que SIGUEN sin implementarse

Los siguientes bugs del reporte 2026-06-03 continúan abiertos y se marcan como críticos:

- **BUG CRÍTICO: Kyo usa vacantes estáticas (JOBS hardcodeado), no Supabase** — `src/lib/assistant/knowledge.ts:167`
- **BUG: FAQs editadas en /admin/kyo no llegan al system prompt** — `kyo_faqs` en Supabase existe pero no se usa
- **BUG: analytics guarda el texto del mensaje del candidato** — `src/components/assistant/useChat.ts:81`
- **BUG: system prompt lista vacantes en texto + search_jobs tiene los mismos datos → duplicación** — `system-prompt.ts:130-131`
- **[ADMIN] onDragLeave faltante — celdas quedan resaltadas** — `redes-sociales/page.tsx:933`
- **[REVISOR] Modal no cierra con Escape** — `revisor/page.tsx:160`
- **[REVISOR] Sin "Recuperar contraseña" en el login** — `revisor/page.tsx` (LoginView)
- **[ADMIN/REVISOR] `monthGrid` duplicada en dos archivos** — extraer a `src/lib/calendar.ts`

---

## Sugerencias de UX

### Alta prioridad

- **[VACANTE DETALLE] CTA "Aplicar ahora" no visible en mobile sin hacer scroll.**
  Archivo: `src/app/vacantes/[id]/_content.tsx:164-204`.
  En desktop hay un sidebar sticky (`sticky top-28`) con el botón siempre visible. En mobile, el grid cambia a una sola columna y el sidebar queda al pie de todo el contenido — después de descripción, responsabilidades y requisitos (~900-1100px de scroll dependiendo del puesto). Un candidato en mobile puede llegar a la vacante, leer el título y salir sin encontrar el botón de aplicar.
  Fix: añadir un botón flotante fijo en mobile que aparezca solo cuando el sidebar derecho no es visible:
  ```tsx
  <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border z-40">
    <button onClick={() => setModalOpen(true)} className="w-full bg-navy text-white rounded-full py-3.5 font-extrabold text-[14px]">Aplicar ahora</button>
  </div>
  ```

- **[VACANTE DETALLE] AplicarModal no recibe el ID numérico de la vacante.**
  Archivo: `src/app/vacantes/[id]/_content.tsx:212-216`.
  El componente recibe `vacante={job.titulo + " — " + job.empresa}` como string, pero no el `job.id`. Si la API `/api/aplicar` guarda solo el nombre de la vacante, el admin no puede cruzar la aplicación con la tabla `vacantes` por ID para saber cuántas aplicaciones tiene cada puesto activo.
  Fix: añadir `vacanteId={job.id}` al componente AplicarModal y pasarlo en el body del POST a `/api/aplicar` como campo `vacante_id`.

- **[CONTACTO] Copy incorrecto: "más de 10 años" — la empresa tiene 3 años.**
  Archivo: `src/app/contacto/page.tsx:64`.
  El hero de contacto dice "Con más de 10 años en el mercado laboral mexicano". Pero `src/lib/assistant/knowledge.ts:79` registra "3+ años en el mercado" y el CLAUDE.md confirma "3+ Años en el mercado". Esta inconsistencia daña la credibilidad si un cliente o candidato compara con /nosotros o pregunta a Kyo.
  Fix: cambiar a `"Con más de 3 años en el mercado laboral mexicano, estamos listos..."`.

### Media prioridad

- **[VACANTE DETALLE] No hay estado de error si Supabase falla — el usuario ve un 404.**
  Archivo: `src/app/vacantes/[id]/_content.tsx:32-48`.
  Si la query a Supabase devuelve error (timeout, red caída), `data` es `null` y el componente llama a `notFound()`. El usuario ve "404 — Página no encontrada" cuando en realidad la vacante existe pero hubo un error de red.
  Fix: separar los estados `null` (vacante no encontrada) y `error` (fallo de red):
  ```ts
  const { data, error } = await supabase.from("vacantes")...
  if (error) return <ErrorState mensaje="No pudimos cargar esta vacante. Intenta de nuevo." />;
  if (!data) notFound();
  ```

- **[CONTACTO] Validación sin feedback por campo — el usuario no sabe qué campo le falta.**
  Archivo: `src/app/contacto/page.tsx:21-30`.
  La validación en submit muestra un error genérico ("Por favor completa todos los campos") pero no resalta cuál campo está vacío. Para un formulario de 5 campos esto genera fricción innecesaria.
  Fix: añadir estado `errors: Record<string, string>` que se llena en submit y agrega `border-red-400` + mensaje debajo de cada campo vacío.

- **[VACANTES] Los filtros de "Marca" están hardcodeados y no coinciden con empresas reales en Supabase.**
  Archivo: `src/app/vacantes/page.tsx:29`.
  `MARCAS` incluye "Sigma Retail", "Clínica Vitalis", etc. — empresas de ejemplo del JOBS.ts estático. Cuando el admin agregue vacantes reales con `empresa: "Kyoszen S.A."`, el filtro de marca no las incluirá y el usuario no podrá filtrar por ellas.
  Fix: construir el array de marcas dinámicamente al cargar las vacantes:
  ```ts
  const marcasUnicas = ["Todas", ...new Set(jobs.map(j => j.empresa))];
  ```
  Y usarlo en el `DropdownPill` de marca en lugar del array hardcodeado.

- **[VACANTES] La búsqueda por keyword no busca en `responsabilidades` ni `requisitos`.**
  Archivo: `src/app/vacantes/page.tsx:101-116`.
  `matchesSearch` busca en `titulo`, `descripcion`, `empresa` y `tags`. Si un candidato busca "Excel" (que está en los requisitos de Auxiliar Administrativo) o "Preparatoria" (en requisitos), no encuentra la vacante.
  Fix: añadir `j.requisitos?.join(" ")` y `j.responsabilidades?.join(" ")` al texto de búsqueda en la función `matchesSearch`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[PASO 6] Kyo navega a /contacto cuando debería navegar a /vacantes/[id].**
  Archivo: `src/lib/assistant/system-prompt.ts:60-62`.
  El Paso 6 dice "Navega a /contacto si acepta". Pero el formulario de aplicación está en la página de cada vacante (el botón "Aplicar ahora" que abre AplicarModal), no en /contacto. Cuando Kyo lleva al candidato a /contacto, este ve el formulario de contacto genérico ("Necesito contratar personal", "Información sobre cursos") — no un formulario de aplicación.
  Fix: cambiar la instrucción del Paso 6 a:
  ```
  Paso 6 — CIERRE
  Cuando el candidato confirme interés en una vacante, usa navigate_to con /vacantes/[id]
  (el id viene de la tool get_job_details) para que el candidato vea el botón "Aplicar ahora".
  Solo navega a /contacto si el candidato no encontró vacante compatible (banco de talentos).
  ```

- **[PASO 5] Kyo navega a /vacantes antes de que el candidato diga que le interesa una.**
  Archivo: `src/lib/assistant/system-prompt.ts:58`.
  "Usa navigate_to con /vacantes y los filtros..." está dentro del Paso 5 (Recomendación). El modelo navega automáticamente mientras presenta las vacantes, sin esperar la reacción del candidato. Si el candidato responde "ninguna me interesa", ya fue enviado a /vacantes. El flujo debería ser: recomendar → esperar → si acepta, navegar.
  Fix: mover la instrucción de `navigate_to` al Paso 6. En el Paso 5 solo presentar las vacantes y hacer la pregunta "¿Le gustaría aplicar a alguna?".

- **[HISTORIAL] La conversación no expira — candidatos que vuelven días después ven contexto obsoleto.**
  Archivo: `src/components/assistant/useChat.ts:24-33`.
  Pendiente del reporte anterior. Agregar en `loadHistory`:
  ```ts
  const last = parsed[parsed.length - 1];
  if (last && (Date.now() - last.timestamp) > 24 * 60 * 60 * 1000) return [INITIAL_GREETING];
  ```

- **[GREETING] El saludo inicial en el widget no se actualiza si el admin cambia las instrucciones.**
  Archivo: `src/components/assistant/useChat.ts:17-22` vs `src/lib/assistant/system-prompt.ts:16`.
  `INITIAL_GREETING` está hardcodeado como constante en el frontend. Si el admin edita el mensaje de saludo en `/admin/kyo`, el system prompt refleja el cambio, pero el widget sigue mostrando el saludo original. Hay un desacoplamiento entre lo que el admin configura y lo que el candidato ve.
  Fix: agregar un campo `saludo` en la tabla `kyo_config` de Supabase y cargarlo desde el API al montar el widget (puede usarse el mismo caché de 60s que ya existe en `getStoredInstrucciones`).

### Nuevas tools o capacidades recomendadas

- **Tool `register_talent_bank` — banco de talentos desde el chat.**
  Archivo: `src/lib/assistant/tools.ts` (agregar nueva tool) + nueva tabla `banco_talentos` en Supabase.
  El system prompt menciona "ofrece quedar en banco de talentos" (`system-prompt.ts:54`) pero no hay herramienta para registrarlo. El candidato es enviado a /contacto donde tiene que escribir todo de cero. Una tool que guarde `nombre`, `puesto_buscado`, `correo_o_telefono` directamente desde el chat completaría el flujo sin fricción:
  ```ts
  { name: "register_talent_bank", description: "Registra al candidato en el banco de talentos de Kyoszen cuando no hay vacante compatible. Llama esta tool cuando el candidato acepte quedar registrado.", input_schema: { type: "object", properties: { nombre: { type: "string" }, puesto_buscado: { type: "string" }, contacto: { type: "string", description: "Correo o teléfono" } }, required: ["nombre", "puesto_buscado", "contacto"] } }
  ```

- **Instruir el uso explícito de `get_job_details` en el Paso 5.**
  Archivo: `src/lib/assistant/system-prompt.ts:40-52`.
  La tool `get_job_details` existe (`tools.ts:48-58`) pero el system prompt nunca instruye a Kyo para usarla antes de recomendar. Kyo puede presentar vacantes con los datos del system prompt (texto estático) sin obtener detalles frescos. Esto importa cuando la vacante tiene información clave en `responsabilidades` o `requisitos` que haría la recomendación más convincente.
  Fix: añadir al Paso 5: "Antes de presentar cada vacante recomendada, llama a `get_job_details` para incluir al menos un requisito específico que haga la recomendación más personalizada (ej: 'esta vacante requiere Office 365, que mencionaste manejar')."

- **Quick replies / chips de respuesta en los pasos 3 y 4 (ubicación, jornada).**
  Pendiente del reporte anterior. En mobile el candidato escribe texto cuando podría tocar una opción. Sugerencia ya documentada: el API devuelve `suggestions: string[]` y `ChatWidget.tsx` los renderiza como chips.

### Problemas detectados

- **BUG CRÍTICO (persistente): Kyo recomienda vacantes del array JOBS.ts estático, no de Supabase.**
  Archivos: `src/lib/assistant/knowledge.ts:167`, `src/lib/jobs.ts`.
  La arquitectura (`KnowledgeProvider` interface en `knowledge.ts:42-58`) ya está preparada para el migration. Es el bug de mayor impacto operativo: un candidato podría aplicar a una vacante que el admin ya cerró.

- **BUG (persistente): FAQs de kyo_faqs en Supabase no se cargan en el system prompt.**
  Archivos: `src/lib/assistant/knowledge.ts:99-105`, `src/app/api/assistant/chat/route.ts:11-32`.

- **BUG (persistente): analytics guarda contenido del mensaje del candidato.**
  Archivo: `src/components/assistant/useChat.ts:81`.
  `logEvent("kyo_mensaje", trimmed.slice(0, 300))` almacena hasta 300 caracteres de texto libre incluyendo nombre y datos personales. Cambiar a `logEvent("kyo_mensaje", String(messages.length))`.

- **BUG: navigate_to puede ser llamado con /vacantes/[id] si Kyo conoce el ID, pero ese path no está en la lista de rutas permitidas.**
  Archivo: `src/lib/assistant/system-prompt.ts:76-78` (Regla 6: "Solo usa rutas listadas abajo. Nunca inventes URLs") y la lista de páginas en `knowledge.ts:60-67` que no incluye `/vacantes/[id]`.
  Si se implementa el fix del Paso 6 (navegar al detalle de la vacante), hay que añadir `/vacantes/:id` como ruta permitida en el system prompt y en la lista de páginas del sitio.

- **BUG: logEvent en página de vacante guarda el título de la empresa real.**
  Archivo: `src/app/vacantes/[id]/_content.tsx:38`.
  `logEvent("vacante_vista", JSON.stringify({ id, titulo }))` guarda el título completo en `site_eventos`. Consistente con el issue de privacidad en Kyo. Cambiar a `logEvent("vacante_vista", String(vacante.id))`.

---

## Oportunidades de mejora general

- **[VACANTE DETALLE] No hay vacantes relacionadas al pie de la página.**
  Archivo: `src/app/vacantes/[id]/_content.tsx` (no hay sección de relacionadas).
  Cuando un candidato llega a una vacante y no cumple los requisitos (o la vacante ya no le interesa), no hay camino natural hacia otras oportunidades. Añadir al final de la página una sección "Otras vacantes que podrían interesarte" con 2-3 vacantes de la misma categoría o ubicación. Requiere una segunda query a Supabase: `from("vacantes").select(...).eq("activa", true).eq("categoria", job.categoria).neq("id", job.id).limit(3)`.

- **[VACANTES] Sin contador de resultados tras filtrar.**
  Archivo: `src/app/vacantes/page.tsx:136-230`.
  Cuando los filtros reducen el listado a 0-3 resultados, no hay feedback visible de "Se encontraron X vacantes". El usuario no sabe si hay pocos resultados o si falló algo. Añadir un `<p>` arriba del grid con "Mostrando {filtered.length} vacante{filtered.length !== 1 ? 's' : ''}".

- **[CONTACTO] El formulario de contacto no indica si el correo llegó correctamente después del submit.**
  Archivo: `src/app/contacto/page.tsx:16-51`.
  `submitted` cambia a `true` y se muestra un estado de éxito, pero no hay indicación del tiempo de respuesta prometido en el estado de éxito (solo aparece en el subtítulo antes de enviar). En el estado de éxito, repetir "Te responderemos en menos de 24 horas hábiles" para reforzar la promesa.

- **[GENERAL] La duración del timeout de navegación de Kyo (700ms) es corta para mobile.**
  Archivo: `src/components/assistant/useChat.ts:127`.
  `setTimeout(() => router.push(target.path), 700)` da 700ms al usuario para leer el mensaje antes de ser redirigido. En conexiones lentas o en mobile donde el teclado puede seguir abierto, el usuario es llevado a otra página antes de entender qué pasó.
  Fix: aumentar a `1400` ms para dar tiempo de leer el mensaje de Kyo que precede la navegación.

- **[ADMIN] La vista mes del calendario no muestra un resumen del mes al pie.**
  Pendiente del reporte anterior. Añadir pills de stats debajo del grid: "X publicaciones · Y aprobadas · Z pendientes · W borradores".

- **[ADMIN] El tab "Configuración" solo soporta Facebook — falta extensión para TikTok.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:1041-1082`.
  Cuando TikTok se active, el admin no tendrá UI para configurar su nombre de perfil ni avatar desde esta tab.
