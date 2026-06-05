# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-05
**Cambios analizados:** src/lib/assistant/system-prompt.ts, src/lib/assistant/tools.ts, src/lib/assistant/knowledge.ts, src/app/api/assistant/chat/route.ts, src/components/assistant/ChatWidget.tsx, src/components/assistant/useChat.ts, src/components/layout/Navbar.tsx, src/components/layout/Footer.tsx, src/components/sections/Vacancies.tsx, src/app/page.tsx

---

## Cambios Recientes Detectados

No hay commits de código nuevo en las últimas 48 horas — solo commits de reportes automáticos (health check, tendencias, fecha CLAUDE.md). Este reporte cubre nuevos hallazgos en Navbar, Footer y la sección de Vacancies del Home, además de mantener el seguimiento de bugs persistentes críticos.

**Corrección detectada:** El link de TikTok en Footer ya tiene URL real (`https://www.tiktok.com/@kyoszen3`) — fue corregido. El CLAUDE.md decía que seguía en `href="#"` pero el código muestra la URL definitiva.

---

## Bugs críticos persistentes (sin implementar desde reportes anteriores)

Estos bugs siguen abiertos y se escalan a **CRÍTICO** porque bloquean experiencias reales de candidatos:

- **BUG CRÍTICO: Kyo usa vacantes del array JOBS.ts estático, no de Supabase** — `src/lib/assistant/knowledge.ts:167`. Un candidato puede recibir recomendaciones de vacantes que el admin ya cerró. El admin ve 0 aplicaciones en esas vacantes porque los candidatos de Kyo se mandan a /contacto, no al formulario de la vacante real.
- **BUG CRÍTICO: Paso 6 — Kyo navega a /contacto en lugar de /vacantes/[id]** — `src/lib/assistant/system-prompt.ts:60-62`. El candidato llega a un formulario de contacto genérico ("Necesito contratar personal") en vez del modal de aplicación de la vacante.
- **BUG: FAQs editadas en /admin/kyo no llegan al system prompt** — `kyo_faqs` existe en Supabase pero `knowledge.ts:99` usa FAQs hardcodeadas en `COMPANY.faqs`.
- **BUG: Analytics guarda el texto del candidato** — `useChat.ts:81`. `logEvent("kyo_mensaje", trimmed.slice(0, 300))` guarda hasta 300 caracteres incluyendo nombre y datos personales. Cambiar a `logEvent("kyo_mensaje", String(messages.length))`.
- **BUG: system-prompt lista vacantes en texto (línea 131) Y search_jobs tiene los mismos datos** — duplicación que infla el context window de Claude con datos que ya se pasan en el system prompt estático.

---

## Sugerencias de UX

### Alta prioridad

- **[NAVBAR] Mobile menu no cierra al hacer clic fuera ni con Escape.**
  Archivo: `src/components/layout/Navbar.tsx:103-124`.
  El menú móvil se abre con el hamburger pero solo se cierra al tocar un link (hay un `onClick` en cada link) o al cambiar de ruta. No hay overlay transparente detrás del menú, ni listener de Escape, ni cierre al hacer clic fuera. En móvil, el usuario que toca accidentalmente el hamburger queda atrapado con el menú abierto encima del contenido.
  Fix: añadir un overlay oscuro detrás del menú y un listener en `useEffect`:
  ```tsx
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  ```
  Y añadir `<div className="fixed inset-0 z-[98] bg-black/20" onClick={() => setMobileOpen(false)} />` antes del menú cuando `mobileOpen` es `true`.

- **[NAVBAR] No hay `aria-expanded` en el botón hamburger.**
  Archivo: `src/components/layout/Navbar.tsx:55-63`.
  El `<button>` de hamburger no tiene `aria-expanded={mobileOpen}` ni `aria-controls`. Los lectores de pantalla no pueden saber si el menú está abierto o cerrado.
  Fix: añadir `aria-expanded={mobileOpen} aria-controls="mobile-menu"` al botón y `id="mobile-menu"` al `<div>` del menú.

- **[NAVBAR] Links del menú móvil no muestran página activa.**
  Archivo: `src/components/layout/Navbar.tsx:105-113`.
  En desktop los links activos tienen `border-navy bg-navy text-[#F8FAFC]`. En mobile no hay comprobación de `pathname`, todos los links se ven iguales. El usuario no sabe en qué sección está.
  Fix: añadir clase condicional en el `Link` del móvil:
  ```tsx
  className={`... ${pathname === link.href ? "bg-navy text-white" : "hover:bg-blue-soft hover:text-blue"}`}
  ```

- **[HOME — VACANCIES] Layout shift visible al cargar la sección de Vacantes.**
  Archivo: `src/components/sections/Vacancies.tsx:38`.
  `if (!loaded || vacantes.length === 0) return null` hace que mientras Supabase responde (100–400ms), toda la sección no existe. Cuando aparece, empuja hacia abajo WhyUs, Process, Courses y todo lo demás — el usuario ve el contenido saltar, especialmente en mobile donde el scroll ya empezó.
  Fix: renderizar siempre la sección con altura reservada y un skeleton durante la carga:
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

- **[HOME — VACANCIES] Las tarjetas de vacante no muestran el salario.**
  Archivo: `src/components/sections/Vacancies.tsx:27`.
  El `select` trae `id,titulo,empresa,ubicacion,contrato,badge,badge_class,categoria` pero no `salario`. El salario es el primer dato que filtra un candidato antes de aplicar. Mostrarlo (ej. `$9,500/mes`) evita que candidatos lleguen a la vacante y se vayan porque no cumple su expectativa salarial.
  Fix: añadir `salario` al select y renderizarlo en la tarjeta entre ubicacion/contrato:
  ```tsx
  // En el select:
  .select("id,titulo,empresa,ubicacion,contrato,badge,badge_class,categoria,salario")
  // En la tarjeta, después de ubicacion/contrato:
  {vac.salario && <div className="text-[11px] font-bold text-blue mt-1">${vac.salario.toLocaleString()}/mes</div>}
  ```

- **[FOOTER] El número de teléfono no está en la columna de Contacto del footer.**
  Archivo: `src/components/layout/Footer.tsx:79-94`.
  El footer muestra email y horario pero no el teléfono (56 4004 5414), que es la principal vía de conversión para empresas que quieren contratar. Un visitante que recorre la página hasta el footer buscando cómo contactar ve email y horario, pero tiene que ir a /contacto para encontrar el número.
  Fix: añadir un tercer bloque de contacto antes del horario:
  ```tsx
  <div className="flex items-center gap-3 mb-3">
    <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
      <span role="img" aria-label="teléfono">📞</span>
    </div>
    <span className="text-xs opacity-50">56 4004 5414</span>
  </div>
  ```

### Media prioridad

- **[CHAT WIDGET] El TypingIndicator no está anunciado a lectores de pantalla.**
  Archivo: `src/components/assistant/ChatWidget.tsx:234-258`.
  `<motion.div>` del indicador de escritura no tiene `role` ni `aria-label`. Los lectores de pantalla no saben que Kyo está procesando la respuesta.
  Fix: `<motion.div role="status" aria-label="Kyo está escribiendo..." ...>`.

- **[CHAT WIDGET] El panel de chat puede quedar oculto bajo el teclado en iOS/Android.**
  Archivo: `src/components/assistant/ChatWidget.tsx:120`.
  En mobile, cuando el usuario toca el input y el teclado virtual sube, el viewport se reduce. El panel tiene `h-[min(60vh,560px)]` — en un iPhone SE con teclado abierto, 60vh puede ser ~270px, lo que deja solo ~140px para mensajes (header ~50px + input ~60px). El campo de input puede quedar totalmente oculto bajo el teclado en algunos Android.
  Fix: añadir `bottom-safe` o usar `env(safe-area-inset-bottom)` en el espaciado inferior, y cambiar a `h-[min(50vh,560px)]` para que haya más margen cuando el teclado está abierto.

- **[CHAT WIDGET] Botón "Nueva conversación" se mezcla visualmente con mensajes.**
  Archivo: `src/components/assistant/ChatWidget.tsx:154-163`.
  El botón aparece debajo del último mensaje sin separación visual clara. Un candidato que no lo busca puede no encontrarlo, y uno que lo toca accidentalmente pierde toda la conversación sin confirmación.
  Fix: añadir un diálogo de confirmación al hacer clic: `if (!confirm("¿Seguro que quieres empezar una nueva conversación?")) return;` dentro del handler de `reset`. También mover el botón al header (junto al "X" de cerrar) en vez del área de mensajes.

- **[FOOTER] Links de políticas legales apuntan a rutas que no existen.**
  Archivo: `src/components/layout/Footer.tsx:99-101`.
  `/condiciones-de-uso`, `/politica-de-cookies`, `/politica-de-privacidad` están en el footer pero no hay páginas para esas rutas en `src/app/`. Un usuario que las toque verá un 404. Mientras no existan esas páginas: cambiar `href` a `href="#"` o apuntar a /contacto con un `?asunto=legal`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[PASO 6 — CRÍTICO] Kyo manda al candidato a /contacto en lugar de la vacante real.**
  Archivo: `src/lib/assistant/system-prompt.ts:60-62`.
  "Navega a /contacto si acepta" dentro del Paso 6 lleva al candidato al formulario genérico de contacto de empresa, no al formulario de aplicación de la vacante. Además, el Paso 5 llama `navigate_to` con filtros de /vacantes antes de que el candidato diga si le interesa, enviándolo a la lista mientras Kyo aún espera respuesta.
  Fix al Paso 5:
  ```
  ## Paso 5 — RECOMENDACIÓN
  Presenta las 2-3 vacantes más compatibles en formato de lista. Luego pregunta: "¿Le gustaría aplicar a alguna de ellas?"
  NO navegues todavía. Espera la respuesta antes de llamar navigate_to.
  ```
  Fix al Paso 6:
  ```
  ## Paso 6 — CIERRE
  Cuando el candidato confirme interés en una vacante específica, llama get_job_details para obtener el id numérico
  y usa navigate_to con /vacantes/[id] para que encuentre el botón "Aplicar ahora".
  Solo navega a /contacto si NO hay vacante compatible (banco de talentos).
  ```

- **[FILTROS DEL SISTEMA] Los valores de ejemplo de filtros en el system prompt son datos de demo.**
  Archivo: `src/lib/assistant/system-prompt.ts:86-91`.
  La sección "Filtros disponibles en URL" lista `?marca=Sigma Retail`, `?marca=Grupo Corpora`, etc. — nombres de empresa del JOBS.ts estático de demo. Cuando las vacantes reales en Supabase tengan empresas distintas, Kyo construirá URLs de filtro que no mostrarán resultados.
  Fix: eliminar los valores de ejemplo de marcas del system prompt y reemplazar por: `?marca=[nombre-empresa-exacto-del-listado-de-vacantes]`. Alternativamente, inyectar dinámicamente los nombres únicos de empresa del listado de vacantes al construir el system prompt.

- **[EXPIRACIÓN DE HISTORIAL] La conversación no expira — candidatos que vuelven días después ven contexto obsoleto.**
  Archivo: `src/components/assistant/useChat.ts:24-33`.
  No hay verificación de edad de los mensajes guardados en localStorage. Un candidato que abrió el chat hace 3 días ve la conversación anterior completa y Kyo intenta continuar ese hilo en lugar de saludar de nuevo.
  Fix en `loadHistory()`:
  ```ts
  const last = parsed[parsed.length - 1];
  const AGE_24H = 24 * 60 * 60 * 1000;
  if (last && last.timestamp > 0 && (Date.now() - last.timestamp) > AGE_24H) {
    return [INITIAL_GREETING];
  }
  ```

- **[MAX ITERACIONES] `MAX_TOOL_ITERATIONS = 5` puede producir latencias de hasta 10 segundos.**
  Archivo: `src/app/api/assistant/chat/route.ts:85`.
  Con 5 iteraciones y ~1.5–2s por llamada a Anthropic (haiku), el peor caso es 10s de espera. El flujo de 6 pasos nunca necesita más de 2 tool calls en un turno (search_jobs + navigate_to). Reducir a 3 cap la latencia en ~6s sin perder funcionalidad.
  Fix: `const MAX_TOOL_ITERATIONS = 3;`

### Nuevas tools o capacidades recomendadas

- **Tool `register_talent_bank` — banco de talentos desde el chat.**
  Archivo: `src/lib/assistant/tools.ts` (añadir).
  El system prompt promete "puedo registrar sus datos para contactarle cuando surja una oportunidad" pero no hay herramienta para hacerlo. Kyo manda al candidato a /contacto donde tiene que volver a escribir todo de cero. Una tool que guarde directamente nombre, puesto buscado y contacto en Supabase completaría el flujo sin fricción:
  ```ts
  {
    name: "register_talent_bank",
    description: "Registra al candidato en el banco de talentos de Kyoszen cuando no hay vacante compatible. Usa esta tool cuando el candidato acepte quedarse registrado.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        puesto_buscado: { type: "string" },
        contacto: { type: "string", description: "Correo o teléfono que el candidato proporcione voluntariamente" }
      },
      required: ["nombre", "puesto_buscado"]
    }
  }
  ```
  Requiere tabla `banco_talentos (id, nombre, puesto_buscado, contacto, created_at)` en Supabase.

- **Quick replies (chips) en pasos 3 y 4 (ubicación y jornada).**
  Archivo: `src/components/assistant/ChatWidget.tsx` (añadir chips de respuesta rápida).
  En mobile, el candidato escribe texto cuando podría tocar una opción. El API ya devuelve la respuesta completa — el backend puede añadir un campo `suggestions: string[]` y el widget los renderiza como chips bajo el TypingIndicator. Para el Paso 3: `["CDMX", "Estado de México", "No importa la zona"]`. Para el Paso 4: `["Tiempo completo", "Medio tiempo", "Por proyecto"]`.
  Cambio en route.ts: añadir detección del paso actual por el historial y devolver suggestions en el payload.
  Cambio en ChatWidget.tsx: renderizar chips como botones que llaman `sendMessage(chip)` sin necesidad de escribir.

- **Filtro por rango de salario en `search_jobs`.**
  Archivo: `src/lib/assistant/tools.ts:39-47`.
  La herramienta search_jobs tiene filtros de `category`, `location` pero no de salario. Cuando un candidato dice "busco algo que pague más de $10,000", Kyo no puede filtrar y presenta todas las vacantes para luego razonar en texto. Añadir `min_salary: { type: "number" }` al input_schema y filtrarlo en `executeTool`:
  ```ts
  .filter((j) => !filters?.min_salary || j.salario >= filters.min_salary)
  ```

### Problemas detectados

- **BUG CRÍTICO (persistente): Kyo recomienda vacantes del array JOBS.ts estático.**
  Archivos: `src/lib/assistant/knowledge.ts:167`, `src/lib/jobs.ts`.
  El `StaticKnowledgeProvider` lee de `JOBS` hardcodeado. La interfaz `KnowledgeProvider` ya está definida para el reemplazo. Prioridad máxima: un candidato puede recibir una recomendación de vacante cerrada.

- **BUG (persistente): FAQs de kyo_faqs en Supabase no llegan al system prompt.**
  Archivos: `src/lib/assistant/knowledge.ts:99-105`. El `COMPANY.faqs` array hardcodeado ignora las FAQs editables del admin.

- **BUG (persistente): analytics guarda texto del mensaje del candidato.**
  Archivo: `src/components/assistant/useChat.ts:81`.
  `logEvent("kyo_mensaje", trimmed.slice(0, 300))` almacena hasta 300 caracteres de texto libre.
  Fix: `logEvent("kyo_mensaje", String(messages.length))`.

- **BUG: Los ejemplos de filtro de URL en el system prompt usan empresas de demo.**
  Archivo: `src/lib/assistant/system-prompt.ts:86-91`. Ver sección "Filtros del sistema" arriba.

- **BUG: navigate_to a /vacantes/[id] no está permitido por las reglas del system prompt.**
  Archivo: `src/lib/assistant/system-prompt.ts:76-78` (Regla 6: "Solo usa rutas listadas abajo") + `knowledge.ts:60-67` que no incluye `/vacantes/:id`.
  Cuando se implemente el fix del Paso 6, hay que añadir `/vacantes/[id]` a la lista de páginas del knowledge y a la documentación de rutas del system prompt.

- **BUG: rate limit en memory no sobrevive reinicios de PM2.**
  Archivo: `src/app/api/assistant/chat/route.ts:68-82`.
  `rateLimitMap` se borra en cada restart de PM2. Un atacante puede vaciar el contador restarteando el proceso. Para el volumen actual es aceptable, pero si el tráfico crece hay que migrar a Redis/Upstash como indica el comentario en el código.

---

## Oportunidades de mejora general

- **[PERFORMANCE] `buildSystemPrompt` se llama en cada POST a /api/assistant/chat.**
  Archivo: `src/app/api/assistant/chat/route.ts:149`. Hoy el `StaticKnowledgeProvider` lee arrays en memoria (instantáneo). Cuando se migre a Supabase, cada mensaje de Kyo disparará 4 queries a Supabase (`listPages`, `listCourses`, `listJobs`, `getCompanyInfo`) ANTES de llamar a Anthropic. El system prompt debería cachearse con el mismo patrón de 60s que ya usa `getStoredInstrucciones` (`route.ts:8-32`). Cuando las vacantes cambien en Supabase, el cache se invalidará en max 60s — aceptable.

- **[CANDIDATO — VACANTE DETALLE] No hay vacantes relacionadas al pie de la página de detalle.**
  Archivo: `src/app/vacantes/[id]/_content.tsx` (no existe sección de relacionadas).
  Cuando el candidato descarta una vacante, no hay camino natural hacia otras oportunidades. Añadir al final del contenido (antes del sidebar en mobile): "Otras vacantes que podrían interesarte" con 2-3 vacantes de la misma categoría o ubicación, con query: `.from("vacantes").eq("activa", true).eq("categoria", job.categoria).neq("id", job.id).limit(3)`.

- **[VACANTES] Sin contador de resultados tras filtrar.**
  Archivo: `src/app/vacantes/page.tsx:136-230`.
  Cuando los filtros reducen el listado a 0-3 resultados, no hay texto que indique cuántos se encontraron. Añadir `<p className="text-sm text-muted mb-4">Mostrando {filtered.length} vacante{filtered.length !== 1 ? 's' : ''}</p>` antes del grid.

- **[VACANTES] Los filtros de marca están hardcodeados con empresas de demo.**
  Archivo: `src/app/vacantes/page.tsx:29`.
  El array `MARCAS` lista empresas del jobs.ts estático. Las vacantes reales en Supabase pueden tener otras empresas. Fix: construir las marcas dinámicamente desde los datos cargados:
  ```ts
  const marcasUnicas = ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean))];
  ```

- **[CONTACTO] El estado de éxito no repite el tiempo de respuesta prometido.**
  Archivo: `src/app/contacto/page.tsx:16-51`.
  El subtítulo dice "Te responderemos en menos de 24 horas hábiles" pero cuando `submitted === true` se muestra solo el estado de éxito sin reiterar ese compromiso. Añadir al estado de éxito: `"Te responderemos en menos de 24 horas hábiles."` para reforzar la promesa cuando el usuario ya no ve el subtítulo original.

- **[NAVEGACIÓN KYO] El timeout de navegación (700ms) es corto para mobile.**
  Archivo: `src/components/assistant/useChat.ts:127`.
  `setTimeout(() => router.push(target.path), 700)` da 700ms para leer el mensaje de Kyo antes de ser redirigido. En mobile con teclado abierto, el mensaje puede estar parcialmente visible. Aumentar a `1400ms` para garantizar que el candidato ve la razón de la navegación antes de ser llevado a otra página.

- **[ADMIN — REDES] Tab Configuración no tiene soporte para TikTok.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:1041-1082`.
  El tab Configuración solo muestra campos de Facebook (nombre de perfil + avatar). Cuando TikTok se active completamente, faltará UI para configurar el nombre y avatar del mockup de TikTok. Extender el componente para iterar sobre todas las redes activas.
