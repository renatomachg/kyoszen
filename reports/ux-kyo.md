# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-24
**Cambios analizados:** commits del 2026-05-22 al 2026-05-24

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/ui/AplicarModal.tsx`
- `src/app/contacto/page.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/app/nosotros/page.tsx`
- `src/components/sections/Hero.tsx`

---

## Cambios Recientes Detectados

- **`e11b192`** — Correccion de acento en `src/app/nosotros/page.tsx`. Cambio cosmético, sin impacto logico.
- No hubo cambios funcionales en los ultimos 2 dias — los problemas detectados en sesiones anteriores persisten sin resolver.

---

## Sugerencias de UX

### Alta prioridad

- **Inconsistencia critica de estadisticas: `knowledge.ts` vs sitio publico — Kyo miente a los candidatos.**
  `src/lib/assistant/knowledge.ts:177` dice `"Candidatos colocados": "687+"` y `"Anos en el mercado": "3+"`.
  El sitio publico muestra en `src/app/nosotros/page.tsx:10` y `src/components/sections/Hero.tsx:108` el dato `7000+` y `10+` anos.
  `src/app/contacto/page.tsx:62` dice "Con mas de 10 anos en el mercado".
  Resultado: si un candidato le pregunta a Kyo "cuantos años llevan operando" o "cuanta gente han colocado", responde con los datos del knowledge (3 anos, 687+) que contradicen lo que ve en pantalla.
  **Solucion:** Unificar en `src/lib/assistant/knowledge.ts` los stats hacia los valores del sitio:
  ```ts
  stats: {
    "Candidatos colocados": "7000+",
    "Empresas atendidas": "672+",
    "Tasa de satisfaccion": "99%",
    "Tiempo de respuesta": "24 horas",
    "Anos en el mercado": "10+",
  },
  ```

- **`src/app/vacantes/page.tsx:68` — Estado "cargando" invisible: muestra "0 vacantes" mientras llega Supabase.**
  El componente inicializa `jobs = []` y el `filtered` resultante es `[]`. La UI muestra "0 vacantes encontradas" y el empty state "No encontramos vacantes con esos filtros" mientras Supabase carga. Un usuario que llega sin filtros ve "0 vacantes" por 1-2 segundos antes de ver las reales.
  **Solucion:** Agregar estado de carga:
  ```tsx
  const [loading, setLoading] = useState(true);
  // En el useEffect de Supabase, al finalizar: setLoading(false)
  // En el render, antes del grid:
  {loading ? (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="bg-white rounded-xl border border-border h-[220px] animate-pulse" />
      ))}
    </div>
  ) : filtered.length > 0 ? ( /* grid actual */ ) : ( /* empty state */ )}
  ```

- **`src/components/ui/AplicarModal.tsx:220` — Boton de envio habilitado sin consentimiento activo.**
  `src/app/contacto/page.tsx:100` exige checkbox obligatorio de aviso de privacidad antes de enviar. `AplicarModal.tsx` solo muestra texto informativo pasivo en la linea 229 — el boton "Enviar solicitud" esta siempre habilitado independientemente de si el candidato leyo el aviso. El modal recoge datos mas sensibles (nombre, WhatsApp, correo, CV). Para igualar el estandar de `/contacto`:
  ```tsx
  const [privacidad, setPrivacidad] = useState(false);
  // Agregar antes del boton submit en AplicarModal.tsx:
  <label className="flex items-start gap-2.5 cursor-pointer">
    <input type="checkbox" checked={privacidad} onChange={(e) => setPrivacidad(e.target.checked)} className="mt-0.5 shrink-0" />
    <span className="text-[11px] text-muted leading-relaxed">
      He leido y acepto el{" "}
      <a href="/politica-de-privacidad" target="_blank" className="text-blue underline">Aviso de Privacidad</a>
      {" "}y el tratamiento de mis datos conforme a la LFPDPPP.
    </span>
  </label>
  // En el button submit: disabled={status === "sending" || !privacidad}
  ```
  Eliminar tambien el texto pasivo de lineas 228-235 ya que el checkbox lo reemplaza.

- **`src/app/vacantes/page.tsx:85-98` — Llamadas a setState en el cuerpo del componente fuera de efecto.**
  El bloque `if (prevParams !== params) { setPrevParams(...); setSearch(...); ... }` ejecuta setters durante el render. React en Strict Mode puede ejecutar el render dos veces, causando actualizaciones dobles de estado y warnings en consola. Reemplazar por `useEffect` con dependencia en `params` y eliminar el estado `prevParams` (que solo existe para workaroundear esto):
  ```tsx
  useEffect(() => {
    const q = params.get("q") || params.get("search");
    const u = params.get("ubicacion");
    const m = params.get("marca");
    const c = params.get("contrato");
    const j = params.get("jornada");
    const s = params.get("salario");
    if (q !== null) setSearch(q);
    if (u && UBICACIONES.includes(u)) setUbicacion(u);
    if (m && MARCAS.includes(m)) setMarca(m);
    if (c && CONTRATOS.includes(c)) setContrato(c);
    if (j && JORNADAS.includes(j)) setJornada(j);
    if (s && SALARIOS.includes(s)) setSalario(s);
  }, [params]);
  ```

### Media prioridad

- **`src/app/api/assistant/chat/route.ts:123` — `max_tokens: 1024` puede truncar la respuesta del Paso 5.**
  En el Paso 5, Kyo debe formatear 2-3 vacantes con nombre, empresa y explicacion de compatibilidad, mas la pregunta de cierre. A 1024 tokens eso puede cortarse si los nombres de puesto y empresa son largos. Subir a `max_tokens: 2048` para dar margen sin impacto significativo en costo con Haiku.

- **`src/components/ui/AplicarModal.tsx:146` — Campo WhatsApp sin validacion de formato.**
  `type="tel"` acepta cualquier cadena. Agregar `pattern="[0-9\s\-\+\(\)]{8,15}"` y `title="Ingresa un numero de telefono valido"`. Esto da feedback inmediato antes de llegar al servidor y evita que lleguen aplicaciones con datos de contacto invalidos.

- **`src/components/ui/AplicarModal.tsx:199` — Sin limite de tamano en upload de CV.**
  El `<input type="file">` no tiene validacion de tamano. Nginx en el VPS tiene por default 1MB de `client_max_body_size`. Un CV de Word puede superar eso y el error llega al servidor silenciosamente (el usuario ve "Hubo un error al enviar"). Agregar al `onChange`:
  ```tsx
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file && file.size > 4 * 1024 * 1024) {
      alert("El archivo no debe superar 4 MB. Comprime el PDF o intenta con otro formato.");
      e.target.value = "";
      return;
    }
    setFileName(file?.name || "");
  }}
  ```
  Y actualizar `client_max_body_size 8M;` en el config de Nginx del VPS si se sube el limite a 4MB.

- **`src/components/assistant/ChatWidget.tsx:120` — Ancho fijo del chat en mobile puede dejar UX incompleta.**
  El chat usa `w-[min(86vw,360px)]` y `h-[min(60vh,560px)]`. En pantallas muy pequenas (320px ancho), el 86vw da solo 275px de ancho, lo cual recorta los bubbles de texto. Cambiar a `min(92vw,360px)` para pantallas bajo 360px de ancho. Tambien el `bottom-24` del panel puede solaparse con el teclado virtual en iOS — agregar `safe-area-inset-bottom` via padding-bottom no funciona con `motion.div`, pero si con CSS: agregar `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}` al form container del widget.

- **`src/components/assistant/useChat.ts:27` — Historial sin expiracion: candidatos regresan con vacantes obsoletas.**
  El historial persiste indefinidamente en localStorage. Un candidato que conversó con Kyo hace 3 dias puede regresar y ver recomendaciones de vacantes que ya se cerraron desde el admin. Agregar verificacion de antiguedad en `loadHistory()`:
  ```tsx
  const lastTimestamp = parsed.filter(m => m.timestamp > 0).at(-1)?.timestamp ?? 0;
  if (lastTimestamp > 0 && Date.now() - lastTimestamp > 24 * 60 * 60 * 1000) {
    localStorage.removeItem(STORAGE_KEY);
    return [INITIAL_GREETING];
  }
  ```
  (La condicion `lastTimestamp > 0` excluye el mensaje de saludo cuyo timestamp es 0.)

### Baja prioridad

- **`src/app/contacto/page.tsx:113` — Boton de envio fuera de `<form>` rompe envio con Enter.**
  El formulario usa `<button onClick={handleSubmit}>` en lugar de `<form onSubmit={handleSubmit}>`. Presionar Enter en cualquier `<input>` no envia el formulario — comportamiento no estandar en desktop. Envolver el formulario en `<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>` y cambiar el button a `type="submit"`.

- **`src/components/assistant/ChatWidget.tsx:159` — Boton "Nueva conversacion" sin confirmacion ni feedback.**
  Al pulsar "Nueva conversacion" el historial se borra sin pedirlo. El usuario puede clickear accidentalmente. Agregar un `confirm()` o un estado `confirmingReset` que muestre "¿Seguro? / Cancelar · Confirmar" durante 3 segundos antes de ejecutar el reset.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **`src/lib/assistant/system-prompt.ts:61` — Paso 6 navega a `/contacto` pero el formulario de aplicacion esta en `/vacantes/[id]`.**
  El Paso 6 dice "Navega a /contacto si acepta". Pero el modal "Aplicar ahora" esta en `src/app/vacantes/[id]/_content.tsx`. Si Kyo recomienda la vacante con `id=3` y el candidato dice "si, quiero aplicar", Kyo deberia navegar a `/vacantes/3` (donde esta el boton Aplicar ahora preloaded con el titulo), no a `/contacto` (formulario generico sin referencia a la vacante).
  Cambiar en `system-prompt.ts`:
  ```
  ## Paso 6 — CIERRE
  Cuando el candidato acepte aplicar a una vacante especifica:
  - Usa navigate_to con la ruta de esa vacante: /vacantes/[id]
    Ejemplo: si recomendaste la vacante id=3, navega a /vacantes/3.
  - Dile: "Te llevo directo a la vacante para que apliques ahora."
  Si el candidato NO quiere aplicar ahora pero si contactar al equipo:
  - Navega a /contacto.
  ```

- **`src/lib/assistant/system-prompt.ts` — Ruta `/vacantes/[id]` no esta documentada en "Filtros disponibles en URL".**
  La seccion "Filtros disponibles en URL" lista `/vacantes?ubicacion=...` pero NO lista el patron de detalle. Kyo no puede navegar al detalle de una vacante porque no sabe que existe esa URL. Agregar al final de la seccion:
  ```
  - /vacantes/[id] — detalle de vacante especifica, donde [id] es el numero de id
    Ej: /vacantes/3, /vacantes/7
    Usar cuando el candidato elige una vacante especifica y quiere ver detalles o aplicar.
  ```

- **`src/lib/assistant/system-prompt.ts:112` — Sin instruccion para respuestas vagas en el Paso 1.**
  Si el candidato responde "algo de oficina" o "lo que sea", Kyo no tiene guia de como reformular. Agregar al final del Paso 1:
  ```
  Si la respuesta es vaga ("algo de oficina", "lo que sea", "no se"):
  Repregunta con opciones: "¿En que area le gustaria trabajar? Por ejemplo:
  administracion, ventas, atencion al cliente, operaciones, o RRHH."
  ```

- **`src/lib/assistant/system-prompt.ts:65` — Manejo de empresas enviado a WhatsApp sin contexto de ruta.**
  Si una empresa llega al chat preguntando por servicios de reclutamiento, Kyo responde "Con gusto te conecto con nuestro equipo" pero no navega a /contacto automaticamente. Cambiar:
  ```
  Si el usuario es una empresa (pregunta por contratar, cotizar, servicios):
  Responde: "Con gusto te conecto con nuestro equipo de asesores."
  Luego llama navigate_to con /contacto.
  ```

### Nuevas tools o capacidades recomendadas

- **Tool de contexto de pagina: Kyo no sabe donde esta el usuario al momento de chatear.**
  Si el candidato ya esta en `/vacantes` mirando una vacante y abre el chat, Kyo puede navegar de nuevo a `/vacantes` de forma redundante. Pasar la ruta actual desde el frontend en el body del request. En `src/components/assistant/useChat.ts:87`:
  ```tsx
  body: JSON.stringify({
    messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
    currentPath: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
  }),
  ```
  En `src/app/api/assistant/chat/route.ts`, agregar al system prompt al final:
  ```ts
  `\n# Ubicacion actual del usuario\n${body.currentPath ?? "/"}`
  ```
  Con esto, Kyo puede decir "veo que ya estas en /vacantes, ¿quieres que filtre por tu perfil?" en vez de navegar innecesariamente.

- **Quick replies: chips de respuesta rapida para reducir friccion de apertura.**
  Cuando `messages.length === 1` (solo saludo inicial), mostrar 3 chips bajo el mensaje de Kyo en `ChatWidget.tsx`:
  ```tsx
  {messages.length === 1 && !isLoading && (
    <div className="flex flex-wrap gap-2 pl-9">
      {["Busco empleo", "Ver vacantes", "Soy empresa"].map(chip => (
        <button key={chip} type="button"
          onClick={() => { sendMessage(chip); }}
          className="text-[12px] font-semibold bg-[#E8F0FE] text-navy rounded-full px-3 py-1.5 hover:bg-blue hover:text-white transition-colors">
          {chip}
        </button>
      ))}
    </div>
  )}
  ```
  Sin cambios en el backend: solo envia el texto como si el usuario lo escribiera.

- **Tool `search_jobs` sin filtros de jornada ni contrato.**
  En `src/lib/assistant/tools.ts:39`, `search_jobs` solo acepta `query`, `category` y `location`. Si un candidato dice "busco medio tiempo", Kyo no puede pasar ese filtro a la herramienta — tiene que leer todos los jobs y filtrar mentalmente, lo cual es propenso a errores con Haiku. Agregar:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por tipo de contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  Y en `executeTool / search_jobs` en `tools.ts`, pasar los filtros al `knowledge.listJobs()`. Tambien actualizar `StaticKnowledgeProvider.listJobs()` en `knowledge.ts:138` para filtrar por esos campos.

### Problemas detectados

- **`src/lib/assistant/knowledge.ts:1` — Kyo consulta `lib/jobs.ts` hardcodeado mientras el sitio usa Supabase en tiempo real.**
  `StaticKnowledgeProvider` importa `JOBS` de `src/lib/jobs.ts`. El sitio publico lee vacantes de Supabase. Si se crea o desactiva una vacante desde el panel admin, Kyo no se entera. Este es el riesgo tecnico mas alto del asistente: puede recomendar vacantes cerradas o ignorar las nuevas.
  La solucion `SupabaseKnowledgeProvider` esta documentada en `knowledge.ts:163` como "fase 2". Mientras no se implemente, al menos sincronizar `lib/jobs.ts` manualmente cada vez que se publique o cierre una vacante desde `/admin/vacantes`.

- **`src/app/api/assistant/chat/route.ts:38` — Rate limiter en memoria no sobrevive reinicios de PM2.**
  Si PM2 reinicia el proceso `kyoszen` (mantenimiento, deploy, crash), el `rateLimitMap` se resetea. En produccion de VPS con un solo proceso no es critico, pero si en el futuro se escala a 2 workers, los conteos de rate limit no se comparten. El comentario en linea 38 ya lo documenta. Considerar Upstash Redis si el trafico justifica la escala.

- **`src/app/api/assistant/chat/route.ts:54` — Haiku puede fallar en el Paso 5 con tool-use multi-paso complejo.**
  `claude-haiku-4-5-20251001` es rapido y barato. Pero en el Paso 5 Kyo debe: ejecutar `search_jobs`, opcionalmente `get_job_details` para 2-3 vacantes, formatear el template exacto del prompt, y llamar `navigate_to` — todo dentro del loop de `MAX_TOOL_ITERATIONS=5`. Si se detectan respuestas mal formateadas o tools no invocadas en produccion, cambiar en `.env.local` del VPS:
  ```
  ANTHROPIC_MODEL=claude-sonnet-4-6
  ```
  El impacto en costo es aproximadamente 5x mayor por mensaje, pero la calidad de flujos multi-tool mejora significativamente.

- **`src/components/assistant/useChat.ts:27` — La greeting message tiene `timestamp: 0`, lo cual puede confundir la logica de expiracion.**
  Si se implementa expiracion por timestamp (ver sugerencia en UX media prioridad), el check debe excluir mensajes con `timestamp === 0` (el saludo inicial). La condicion correcta es filtrar solo mensajes del usuario y del asistente con timestamp > 0 antes de evaluar la antiguedad.

---

## Oportunidades de mejora general

- **`src/lib/assistant/knowledge.ts:82` — URL de WhatsApp hardcodeada, no editable desde el panel.**
  `whatsapp: "https://wa.link/5zv0ba"` esta en el codigo. Si Kyoszen cambia numero, requiere codigo + deploy. La tabla `site_config` ya existe en Supabase con clave-valor. Agregar key `whatsapp_url` y leerla en `getCompanyInfo()` desde Supabase (igual que se leen las instrucciones de Kyo desde `kyo_config`).

- **Analytics de funnel de Kyo: no se sabe en que paso abandona el candidato.**
  `useChat.ts:70` loguea `kyo_mensaje` por cada mensaje del usuario, pero no el paso del flujo. Para saber si los candidatos abandonan en el Paso 2 (experiencia) o el Paso 4 (disponibilidad), el backend podria detectar el paso estimado con una heuristica simple (numero de turnos del candidato: 1=nombre dado, 2=puesto dado, 3=experiencia, 4=ubicacion, 5=disponibilidad). El frontend loguea `logEvent("kyo_paso", paso.toString())` al recibir cada respuesta. Con ese dato, el dashboard de `/admin` podria mostrar el funnel de conversion de Kyo.

- **SupabaseKnowledgeProvider: implementacion pendiente critica.**
  El patron de abstraccion esta listo en `knowledge.ts`. La interfaz `KnowledgeProvider` (linea 42) ya define todos los metodos. Solo hay que: (1) crear `class SupabaseKnowledgeProvider implements KnowledgeProvider` con los mismos metodos leyendo de las tablas `vacantes` y `cursos` con el cliente Supabase, (2) cambiar el singleton en `knowledge.ts:167` a `new SupabaseKnowledgeProvider(supabase)`. Esto elimina el desincronismo completo entre lo que Kyo dice y lo que el sitio muestra, y es la mejora de mayor impacto tecnico disponible.

- **`src/app/nosotros/page.tsx:12` — Dato "10+" de anos de experiencia inconsistente con `knowledge.ts:180`.**
  Ya detallado en la seccion de Alta prioridad de UX. Agregar como recordatorio: el campo `stats` de `knowledge.ts` es el unico lugar que hay que actualizar; de ahi Kyo obtiene sus respuestas. El sitio tiene los datos correctos (7000+, 10+), pero Kyo tiene los datos de un estado anterior (687+, 3+). Unificar en `knowledge.ts` resuelve la inconsistencia sin tocar el sitio publico.
