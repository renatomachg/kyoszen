# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-06
**Cambios analizados:** src/lib/assistant/system-prompt.ts, src/lib/assistant/tools.ts, src/lib/assistant/knowledge.ts, src/app/api/assistant/chat/route.ts, src/components/assistant/ChatWidget.tsx, src/components/assistant/useChat.ts, src/components/layout/Navbar.tsx, src/components/layout/Footer.tsx, src/components/sections/Vacancies.tsx

---

## Cambios Recientes Detectados

No hay commits de código nuevo en los últimos 2 días — solo commits de reportes automáticos (health check, tendencias, fecha CLAUDE.md). Ningún bug del reporte anterior fue corregido. Este reporte escala los críticos no resueltos y agrega hallazgos nuevos no reportados ayer.

---

## 🚨 Bugs críticos persistentes — escalados (sin corrección por 2+ días)

Estos bugs bloquean experiencias reales de candidatos activos en producción:

- **[ESCALADO — CRÍTICO] Kyo recomienda vacantes del array JOBS.ts estático, no de Supabase.**
  Archivo: `src/lib/assistant/knowledge.ts:167`.
  El `StaticKnowledgeProvider` lee del array `JOBS` hardcodeado. Un candidato puede recibir hoy una recomendación de una vacante que el admin ya cerró en el panel. El admin no recibe ninguna aplicación de esos candidatos porque Kyo los manda a /contacto (formulario genérico), no al formulario de la vacante real. **Mientras este bug exista, Kyo está saboteando el embudo de candidatos.**

- **[ESCALADO — CRÍTICO] Paso 6: Kyo manda al candidato a /contacto en lugar de /vacantes/[id].**
  Archivo: `src/lib/assistant/system-prompt.ts:60-62`.
  `"Navega a /contacto si acepta"` hace que el candidato llegue al formulario "Necesito contratar personal" (formulario para empresas), no al modal de aplicación de la vacante. El candidato que acepta se pierde.

- **[ESCALADO — ALTO] FAQs editadas en /admin/kyo no llegan al system prompt.**
  Archivo: `src/lib/assistant/knowledge.ts:99-105`.
  `COMPANY.faqs` es un array hardcodeado. La tabla `kyo_faqs` en Supabase existe pero nunca se consulta.

- **[ESCALADO — ALTO] Analytics guarda el texto completo del candidato.**
  Archivo: `src/components/assistant/useChat.ts:81`.
  `logEvent("kyo_mensaje", trimmed.slice(0, 300))` guarda hasta 300 caracteres de texto libre en `site_eventos`. Un candidato que escribe su nombre, teléfono o correo en el chat queda registrado en analytics. Viola buenas prácticas de privacidad.
  Fix inmediato (1 línea): `logEvent("kyo_mensaje", String(messages.length));`

---

## Sugerencias de UX

### Alta prioridad

- **[NAVBAR] Anti-patrón React: setState durante el render para cerrar el menú móvil.**
  Archivo: `src/components/layout/Navbar.tsx:34-39`.
  El bloque `if (prevPathname !== pathname) { setPrevPathname(pathname); setMobileOpen(false); }` actualiza estado directamente durante la fase de render, lo cual React puede ejecutar más de una vez y produce warnings en StrictMode. Es un side effect que debe ir en `useEffect`:
  ```tsx
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);
  ```
  Y eliminar `prevPathname`/`setPrevPathname` completamente. Reduce el riesgo de bugs raros al navegar.

- **[NAVBAR] No hay overlay ni cierre con Escape en el menú móvil.**
  Archivo: `src/components/layout/Navbar.tsx:103-124`.
  El menú móvil solo se cierra al tocar un link. Un usuario que abre el menú por accidente no puede cerrarlo sin seleccionar un destino.
  Fix: añadir overlay y listener de teclado:
  ```tsx
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mobileOpen]);
  ```
  Y añadir `<div className="fixed inset-0 z-[98]" onClick={() => setMobileOpen(false)} />` antes del `<div>` del menú cuando `mobileOpen` es `true`.

- **[NAVBAR] `aria-label="Menu"` sin acento y sin `aria-expanded`.**
  Archivo: `src/components/layout/Navbar.tsx:57-63`.
  El botón hamburger tiene `aria-label="Menu"` (sin tilde) y no declara su estado de expansión.
  Fix: `aria-label="Menú" aria-expanded={mobileOpen} aria-controls="mobile-menu"` en el botón, `id="mobile-menu"` en el div del menú.

- **[NAVBAR] Links del menú móvil no muestran página activa.**
  Archivo: `src/components/layout/Navbar.tsx:105-114`.
  En desktop los links activos tienen estilo `bg-navy text-[#F8FAFC]`. En mobile todos los links se ven iguales. El usuario no sabe en qué sección está.
  Fix: añadir clase condicional:
  ```tsx
  className={`py-[10px] px-[14px] rounded-xl text-navy no-underline text-sm font-medium ${
    pathname === link.href ? "bg-navy text-white" : "hover:bg-blue-soft hover:text-blue"
  }`}
  ```

- **[NAVBAR] Supabase count query sin caché — se dispara en cada page mount.**
  Archivo: `src/components/layout/Navbar.tsx:24-29`.
  Cada vez que el usuario navega a cualquier página, el Navbar se monta y lanza `.from("vacantes").select("id", { count: "exact", head: true })`. En un flujo de 6 páginas son 6 queries a Supabase para saber si hay vacantes.
  Fix: cachear en `sessionStorage` con TTL de 10 minutos:
  ```ts
  useEffect(() => {
    const cached = sessionStorage.getItem("kyo_hayVacantes");
    const ttl = sessionStorage.getItem("kyo_hayVacantes_ttl");
    if (cached && ttl && Date.now() < Number(ttl)) {
      setHayVacantes(cached === "1");
      return;
    }
    supabase.from("vacantes")...then(({ count }) => {
      const val = (count ?? 0) > 0;
      sessionStorage.setItem("kyo_hayVacantes", val ? "1" : "0");
      sessionStorage.setItem("kyo_hayVacantes_ttl", String(Date.now() + 10 * 60_000));
      setHayVacantes(val);
    });
  }, []);
  ```

- **[HOME — VACANCIES] Layout shift visible al cargar la sección de Vacantes.**
  Archivo: `src/components/sections/Vacancies.tsx:38`.
  `if (!loaded || vacantes.length === 0) return null` hace que la sección no exista mientras carga (~100–400ms). Cuando aparece empuja todo el contenido debajo: WhyUs, Process, Courses. El usuario ve el contenido brincar, especialmente en mobile.
  Fix: renderizar siempre con altura reservada y skeleton mientras `!loaded`:
  ```tsx
  if (!loaded) return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    </section>
  );
  ```

- **[HOME — VACANCIES] Las tarjetas no muestran salario y ordenan por ID, no por fecha.**
  Archivo: `src/components/sections/Vacancies.tsx:27-30`.
  El `select` no incluye `salario` — el dato más importante para que un candidato decida si hace clic. Además `order("id")` muestra siempre las primeras 4 vacantes creadas, no las más recientes.
  Fix:
  ```ts
  .select("id,titulo,empresa,ubicacion,contrato,badge,badge_class,categoria,salario")
  .order("created_at", { ascending: false })
  ```
  Y en la tarjeta, después de `{vac.contrato}`:
  ```tsx
  {vac.salario && (
    <div className="text-[11px] font-bold text-blue mt-1">
      ${vac.salario.toLocaleString()}/mes
    </div>
  )}
  ```

- **[FOOTER] Email interno de la empresa expuesto públicamente.**
  Archivo: `src/components/layout/Footer.tsx:85`.
  `rsalazar@kyoszen.com.mx` es el correo interno de la consultora, no un correo de contacto público. Bots de spam lo escanean. Sustituir por un correo genérico como `contacto@kyoszen.com.mx` o quitar el email del footer y reemplazar por un link al formulario de /contacto:
  ```tsx
  <Link href="/contacto" className="text-xs opacity-50 hover:opacity-80">
    Formulario de contacto →
  </Link>
  ```

- **[FOOTER] No hay teléfono en la sección de Contacto.**
  Archivo: `src/components/layout/Footer.tsx:79-93`.
  El footer muestra email y horario pero no el teléfono (56 4004 5414), que es la vía principal de conversión para empresas. Un visitante que llega al footer buscando cómo llamar no encuentra el número.
  Fix: añadir antes del horario:
  ```tsx
  <div className="flex items-center gap-3 mb-3">
    <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
      <span role="img" aria-label="teléfono">📞</span>
    </div>
    <a href="tel:+525640045414" className="text-xs opacity-50 hover:opacity-80 no-underline">56 4004 5414</a>
  </div>
  ```

### Media prioridad

- **[CHAT WIDGET] No hay `aria-live` en el contenedor de mensajes.**
  Archivo: `src/components/assistant/ChatWidget.tsx:143`.
  Cuando Kyo responde, el contenido se inserta en el DOM pero los lectores de pantalla (NVDA, VoiceOver) no lo anuncian automáticamente porque el `<div>` no tiene `role="log"` ni `aria-live`.
  Fix: `<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="flex-1 overflow-y-auto...">`

- **[CHAT WIDGET] Input sin `maxLength` ni `autoComplete="off"`.**
  Archivo: `src/components/assistant/ChatWidget.tsx:170-178`.
  Un usuario puede pegar texto muy largo. El autocompletado del navegador en un campo de chat produce sugerencias inapropiadas (correos anteriores, contraseñas).
  Fix: `<input ... maxLength={600} autoComplete="off" autoCorrect="off" spellCheck="false" />`

- **[CHAT WIDGET] Botón "Nueva conversación" sin confirmación.**
  Archivo: `src/components/assistant/ChatWidget.tsx:154-164`.
  El botón `onClick={reset}` borra toda la conversación inmediatamente sin aviso. Un candidato que ya pasó por 4 pasos pierde todo si lo toca por accidente.
  Fix en el handler del botón: `onClick={() => { if (window.confirm("¿Seguro que quieres empezar de nuevo? Se perderá esta conversación.")) reset(); }}`
  Alternativa UX más suave: mover el botón al header junto al "X" de cerrar para que no esté dentro del flujo de mensajes.

- **[CHAT WIDGET] El panel puede quedar oculto bajo el teclado virtual en iOS/Android.**
  Archivo: `src/components/assistant/ChatWidget.tsx:120`.
  `h-[min(60vh,560px)]` — en iPhone SE con teclado abierto, 60vh es ~270px, lo que deja ~140px para mensajes (header ~50px + input ~60px). El campo de texto puede quedar parcialmente oculto en Android.
  Fix: reducir a `h-[min(50vh,520px)]` y añadir `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}` al form del input.

- **[FOOTER] Links legales apuntan a rutas que no existen (404).**
  Archivo: `src/components/layout/Footer.tsx:99-101`.
  `/condiciones-de-uso`, `/politica-de-cookies`, `/politica-de-privacidad` no tienen páginas en `src/app/`. Un usuario que las toque ve un error 404.
  Fix temporal: cambiar a `href="/contacto?asunto=legal"` o simplemente `href="#"` hasta que se creen las páginas.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[PASO 5 — CRÍTICO] Kyo navega a /vacantes antes de que el candidato confirme interés.**
  Archivo: `src/lib/assistant/system-prompt.ts:42-58`.
  La instrucción actual termina el Paso 5 con `"¿Le gustaría aplicar?"` pero luego llama `navigate_to` con filtros de /vacantes sin esperar respuesta. El candidato es enviado a la lista mientras Kyo aún aguarda su decisión.
  Fix en el Paso 5:
  ```
  ## Paso 5 — RECOMENDACIÓN
  Presenta las 2-3 vacantes más compatibles en formato de lista. Pregunta: "¿Le gustaría aplicar a alguna de ellas?"
  NO llames navigate_to en este paso. Espera la respuesta antes de cualquier navegación.
  ```

- **[PASO 6 — CRÍTICO] Kyo manda al candidato a /contacto en lugar de /vacantes/[id].**
  Archivo: `src/lib/assistant/system-prompt.ts:60-62`.
  Fix en el Paso 6:
  ```
  ## Paso 6 — CIERRE
  Cuando el candidato confirme interés en una vacante específica:
  1. Llama get_job_details con el id de esa vacante.
  2. Usa navigate_to con /vacantes/[id] para que encuentre el botón "Aplicar ahora".
  3. Di: "[nombre], te llevo directamente a esa vacante para que puedas aplicar."
  Solo navega a /contacto si NO hay ninguna vacante compatible (banco de talentos).
  ```
  **Además:** añadir `/vacantes/[id]` a la lista de páginas en `src/lib/assistant/knowledge.ts:60-67` y al listado de rutas permitidas en el system prompt (Regla 6, línea 77).

- **[FLUJO] No hay instrucción para manejar cambios de intención a mitad del flujo.**
  Archivo: `src/lib/assistant/system-prompt.ts` (sección "Manejo de otros temas", líneas 63-69).
  Si un candidato en Paso 3 dice "en realidad prefiero algo administrativo, no de ventas", Kyo no sabe si reiniciar desde Paso 1 o continuar. El resultado actual es una respuesta confusa.
  Fix: añadir al bloque "Manejo de otros temas":
  ```
  Si el candidato cambia de opinión sobre el puesto buscado durante el flujo:
  Responde: "Claro, no hay problema. ¿Me puede decir entonces qué tipo de trabajo busca ahora?"
  Y regresa al Paso 1 con esa nueva información.
  ```

- **[FLUJO] "Microempresas" en la descripción limita la propuesta de valor de Kyo.**
  Archivo: `src/lib/assistant/knowledge.ts:73`.
  `"Consultora mexicana especializada en capital humano para microempresas"` — Kyo usa este texto cuando responde sobre la empresa. Si una empresa mediana o grande pregunta por servicios, Kyo podría desanimar el contacto al decir que solo trabajan con microempresas.
  Fix: cambiar a `"Consultora mexicana especializada en capital humano para empresas en crecimiento"`.

- **[EXPIRACIÓN] Historial de chat no expira — candidatos que regresan días después ven conversaciones obsoletas.**
  Archivo: `src/components/assistant/useChat.ts:24-33`.
  `loadHistory()` restaura cualquier conversación sin importar su antigüedad. Un candidato que abrió el chat hace 3 días ve el hilo completo y Kyo intenta continuar ese contexto en lugar de saludar de nuevo.
  Fix en `loadHistory()`, después de `const parsed = JSON.parse(raw)`:
  ```ts
  const last = parsed[parsed.length - 1];
  const AGE_24H = 24 * 60 * 60 * 1000;
  if (last?.timestamp > 0 && (Date.now() - last.timestamp) > AGE_24H) {
    return [INITIAL_GREETING];
  }
  ```

- **[LATENCIA] `MAX_TOOL_ITERATIONS = 5` puede causar hasta 10 segundos de espera.**
  Archivo: `src/app/api/assistant/chat/route.ts:85`.
  Con haiku (~1.5-2s por llamada), 5 iteraciones = 10s de espera máximo. El flujo de 6 pasos nunca necesita más de 2 tool calls por turno (search_jobs + navigate_to).
  Fix: `const MAX_TOOL_ITERATIONS = 3;`

- **[TOKENS] `max_tokens: 1024` puede ser insuficiente para el Paso 5.**
  Archivo: `src/app/api/assistant/chat/route.ts:153`.
  Listar 3 vacantes con nombre, empresa, razón de compatibilidad y la pregunta final de cierre puede superar los 1024 tokens de salida cuando el system prompt ya está cargando el listado completo de vacantes y cursos. Si Claude se corta, el candidato recibe una respuesta truncada.
  Fix: aumentar a `max_tokens: 2048`.

- **[CONTEXTO] `sendMessage` envía hasta 30 mensajes al API en cada turno.**
  Archivo: `src/components/assistant/useChat.ts:99`.
  `newMessages.map((m) => ...)` incluye toda la historia (máx 30 mensajes). Combinado con el system prompt (~1500-2000 tokens), en conversaciones largas se acerca al límite de contexto de haiku y aumenta el costo por mensaje.
  Fix: limitar el historial enviado al API a los últimos 12 mensajes (el servidor ya hace `.slice(-20)`, pero la reducción en el cliente ahorra tokens antes de llegar al servidor):
  ```ts
  messages: newMessages.slice(-12).map((m) => ({ role: m.role, content: m.content })),
  ```

### Nuevas tools o capacidades recomendadas

- **Tool `register_talent_bank` — banco de talentos desde el chat.**
  Archivo: `src/lib/assistant/tools.ts` (nueva tool).
  El system prompt promete "puedo registrar sus datos para contactarle cuando surja una oportunidad" (línea 55), pero no existe ninguna herramienta para hacerlo. Kyo manda al candidato a /contacto y el candidato tiene que volver a escribir toda su información desde cero.
  ```ts
  {
    name: "register_talent_bank",
    description: "Registra al candidato en el banco de talentos cuando no hay vacante compatible. Úsala cuando el candidato acepte quedarse registrado.",
    input_schema: {
      type: "object",
      properties: {
        nombre:        { type: "string", description: "Nombre del candidato" },
        puesto_buscado:{ type: "string", description: "Puesto o área de interés" },
        contacto:      { type: "string", description: "Correo o teléfono que el candidato proporcione voluntariamente" }
      },
      required: ["nombre", "puesto_buscado"]
    }
  }
  ```
  Requiere tabla `banco_talentos (id, nombre, puesto_buscado, contacto, created_at)` en Supabase y una vista en /admin.

- **Filtro `contrato` en `search_jobs` — jornada programática, no textual.**
  Archivo: `src/lib/assistant/tools.ts:39-47`.
  El Paso 4 recopila si el candidato quiere "tiempo completo" o "medio tiempo", pero `search_jobs` no tiene filtro de `contrato`. Kyo debe razonar en texto para filtrar, lo cual es impreciso.
  Fix: añadir al input_schema de `search_jobs`:
  ```ts
  contrato: { type: "string", description: "Filtra por tipo de contrato: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" }
  ```
  Y en `executeTool`, en el caso `search_jobs`:
  ```ts
  .filter((j) => !filters?.contrato || j.contrato.toLowerCase() === (filters.contrato as string).toLowerCase())
  ```

- **Filtro `min_salary` en `search_jobs` — candidatos con expectativa salarial explícita.**
  Archivo: `src/lib/assistant/tools.ts:39-47`.
  Cuando un candidato dice "busco algo que pague más de $10,000", Kyo no puede filtrar y presenta todas las vacantes.
  Fix: añadir `min_salary: { type: "number", description: "Salario mínimo mensual esperado en pesos" }` y en executeTool:
  ```ts
  .filter((j) => !filters?.min_salary || j.salario >= (filters.min_salary as number))
  ```

- **Quick replies (chips) para respuestas de opción múltiple (Pasos 3 y 4).**
  Archivo: `src/app/api/assistant/chat/route.ts` (añadir `suggestions` al payload) + `src/components/assistant/ChatWidget.tsx` (renderizar chips).
  En mobile, el candidato escribe a mano cuando hay respuestas predecibles. Para Paso 3: `["CDMX", "Estado de México", "No me importa la zona"]`. Para Paso 4: `["Tiempo completo", "Medio tiempo"]`.
  Cambio en route.ts: añadir `suggestions: string[]` al `ChatResponseMessage`.
  Cambio en ChatWidget.tsx: renderizar chips como botones debajo del último mensaje de Kyo que llaman `sendMessage(chip)`.

### Problemas detectados

- **BUG CRÍTICO (persistente): `StaticKnowledgeProvider` usa JOBS.ts estático, no Supabase.**
  Archivos: `src/lib/assistant/knowledge.ts:167`, `src/lib/jobs.ts`.
  Ver sección de bugs escalados al inicio.

- **BUG CRÍTICO (persistente): Paso 6 navega a /contacto en lugar de /vacantes/[id].**
  Archivo: `src/lib/assistant/system-prompt.ts:60-62`.
  Ver sección de bugs escalados al inicio.

- **BUG (persistente): FAQs de kyo_faqs en Supabase no llegan al system prompt.**
  Archivo: `src/lib/assistant/knowledge.ts:99-105`.
  `COMPANY.faqs` es un array hardcodeado que ignora todo lo que el admin edita desde /admin/kyo.

- **BUG (persistente): Analytics guarda texto libre del candidato.**
  Archivo: `src/components/assistant/useChat.ts:81`.
  Fix de 1 línea: `logEvent("kyo_mensaje", String(messages.length));`

- **BUG: Los filtros de URL en el system prompt usan empresas de datos demo.**
  Archivo: `src/lib/assistant/system-prompt.ts:86-91`.
  `?marca=Sigma Retail`, `?marca=Grupo Corpora` son empresas del JOBS.ts estático. Cuando las vacantes reales en Supabase tengan otras empresas, Kyo construirá URLs que no mostrarán resultados.
  Fix: eliminar los valores de ejemplo de marcas del system prompt y cambiar por: `?marca=[nombre-exacto-de-empresa-del-listado]`.

- **BUG: `navigate_to` a `/vacantes/[id]` está implícitamente prohibido por la Regla 6.**
  Archivo: `src/lib/assistant/system-prompt.ts:76-78` + `knowledge.ts:60-67`.
  La Regla 6 dice "Solo usa rutas listadas abajo" y las páginas listadas no incluyen `/vacantes/[id]`. Cuando se implemente el fix del Paso 6, hay que añadir esta ruta a las páginas del knowledge y al system prompt.

- **BUG: rate limit en memoria no sobrevive reinicios de PM2.**
  Archivo: `src/app/api/assistant/chat/route.ts:68-82`.
  `rateLimitMap` se borra en cada restart. Para el volumen actual es aceptable, pero si crece el tráfico migrar a Upstash Redis como indica el comentario en el código.

---

## Oportunidades de mejora general

- **[PERFORMANCE] `buildSystemPrompt` se llama en cada POST sin caché.**
  Archivo: `src/app/api/assistant/chat/route.ts:149`.
  Actualmente lee arrays en memoria (rápido). Cuando se migre a Supabase, cada mensaje disparará 4 queries antes de llamar a Anthropic. Implementar el mismo patrón de caché de 60s que ya usa `getStoredInstrucciones` (líneas 8-32).

- **[VACANTES] Sin contador de resultados tras filtrar.**
  Archivo: `src/app/vacantes/page.tsx`.
  Cuando los filtros reducen el resultado a 0-3 vacantes, no hay indicación de cuántas se encontraron. Añadir:
  ```tsx
  <p className="text-sm text-muted mb-4">
    {filtered.length === 0 ? "No se encontraron vacantes con esos filtros." : `Mostrando ${filtered.length} vacante${filtered.length !== 1 ? "s" : ""}`}
  </p>
  ```

- **[VACANTES] Filtros de marca hardcodeados con empresas de demo.**
  Archivo: `src/app/vacantes/page.tsx`.
  El array `MARCAS` lista empresas del jobs.ts estático. Fix: construir las marcas dinámicamente desde los datos cargados de Supabase:
  ```ts
  const marcasUnicas = ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean))];
  ```

- **[VACANTES RELACIONADAS] No hay "otras vacantes" al pie del detalle de una vacante.**
  Archivo: `src/app/vacantes/[id]/_content.tsx` (no existe sección de relacionadas).
  Cuando un candidato descarta una vacante, no hay camino natural hacia otras. Añadir al final del detalle:
  ```ts
  // query:
  .from("vacantes").eq("activa", true).eq("categoria", job.categoria).neq("id", job.id).limit(3)
  ```
  Y renderizar como 3 tarjetas pequeñas con "Otras vacantes que podrían interesarte".

- **[CONTACTO] El estado de éxito no repite el tiempo de respuesta prometido.**
  Archivo: `src/app/contacto/page.tsx`.
  El subtítulo dice "Responderemos en menos de 24 horas hábiles", pero cuando `submitted === true` el usuario ya no ve ese texto. Añadir al estado de éxito: `"Te responderemos en menos de 24 horas hábiles."` para reforzar la promesa cuando el usuario la necesita más.

- **[NAVEGACIÓN KYO] El timeout de navegación (700ms) es corto para mobile.**
  Archivo: `src/components/assistant/useChat.ts:127`.
  `setTimeout(() => router.push(target.path), 700)` da 700ms para leer el mensaje de Kyo antes de la redirección. En mobile con teclado abierto el mensaje puede estar parcialmente visible.
  Fix: aumentar a `1400`.

- **[ADMIN — REDES] Tab Configuración no tiene soporte para TikTok.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx`.
  El tab Configuración solo muestra campos de Facebook (nombre + avatar). Cuando TikTok se active completamente, faltará UI para su mockup. Extender el componente para iterar sobre `REDES_SOCIALES` activas.
