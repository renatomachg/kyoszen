# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-23
**Cambios analizados:** commits del 2026-05-21 al 2026-05-23

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
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

- **`e11b192`** — Correccion de acento en "Mas de 7000" en `src/app/nosotros/page.tsx`. Solo texto, sin impacto logico.
- **`596c049`** — Aviso de privacidad con link a `/politica-de-privacidad` en `AplicarModal.tsx`, `contacto/page.tsx` y `cursos/page.tsx`. La pagina `/politica-de-privacidad/page.tsx` existe, correcto. Persiste inconsistencia de implementacion entre formularios (ver sugerencias).
- **`d542bbb`** — Correcciones de acentos y ortografia en paginas publicas.

---

## Sugerencias de UX

### Alta prioridad

- **`src/app/contacto/page.tsx` linea 62 — "10 anos" vs "3+" en knowledge.ts.**
  El PageHero de `/contacto` dice "Con mas de 10 anos en el mercado laboral mexicano". El `knowledge.ts` linea 179 tiene `"Anos en el mercado": "3+"`. Kyo responde "3 anos" a quien lo pregunte; la pagina de contacto dice 10. Segun CLAUDE.md el dato correcto es "3+". Cambiar en `src/app/contacto/page.tsx:62`:
  ```tsx
  description="Con mas de 3 anos en el mercado laboral mexicano, estamos listos para ayudarte sin costos adicionales ni compromisos."
  ```

- **`src/components/ui/AplicarModal.tsx` linea 170 — Aviso de privacidad sin checkbox de consentimiento activo.**
  `contacto/page.tsx` (lineas 100-109) usa checkbox obligatorio como consentimiento expreso bajo LFPDPPP. `AplicarModal.tsx` solo muestra texto informativo pasivo sin checkbox. El formulario de aplicacion recoge nombre, WhatsApp, correo, datos laborales y CV — datos mas sensibles que el formulario de contacto. Agregar checkbox con estado antes del boton de envio:
  ```tsx
  const [privacy, setPrivacy] = useState(false);
  // Antes del button submit:
  <label className="flex items-start gap-2.5 cursor-pointer">
    <input type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-0.5 shrink-0" />
    <span className="text-[11px] text-muted leading-relaxed">
      He leido y acepto el{" "}
      <a href="/politica-de-privacidad" target="_blank" className="text-blue underline">Aviso de Privacidad</a>
      {" "}y el tratamiento de mis datos conforme a la LFPDPPP.
    </span>
  </label>
  // En el button: disabled={status === "sending" || !privacy}
  ```

- **`src/app/vacantes/page.tsx` bloque prevParams lineas 88-98 — Mutacion de estado durante render.**
  Los setters `setPrevParams`, `setSearch`, etc. se llaman en el cuerpo del componente fuera de un efecto. React puede ejecutarlo multiples veces en Strict Mode y genera warnings. Reemplazar por un `useEffect` limpio y eliminar el estado `prevParams`:
  ```tsx
  useEffect(() => {
    const q = params.get("q") || params.get("search");
    const u = params.get("ubicacion");
    const m = params.get("marca");
    const c = params.get("contrato");
    const j = params.get("jornada");
    const s = params.get("salario");
    if (q) setSearch(q);
    if (u && UBICACIONES.includes(u)) setUbicacion(u);
    if (m && MARCAS.includes(m)) setMarca(m);
    if (c && CONTRATOS.includes(c)) setContrato(c);
    if (j && JORNADAS.includes(j)) setJornada(j);
    if (s && SALARIOS.includes(s)) setSalario(s);
  }, [params]);
  ```

### Media prioridad

- **`src/components/ui/AplicarModal.tsx` linea 43 — Campo WhatsApp sin validacion de formato.**
  El `type="tel"` acepta texto arbitrario. Un candidato puede enviar "hola" como telefono y el formulario lo acepta. Agregar `pattern="[0-9\s\-\+\(\)]{8,15}"` y `title="Ingresa un numero de telefono valido (minimo 8 digitos)"` para feedback inmediato en el cliente antes de llegar al servidor.

- **`src/components/ui/AplicarModal.tsx` lineas 82-84 — Modal sin atributos de accesibilidad.**
  El `motion.div` del modal no tiene `role="dialog"`, `aria-modal="true"` ni `aria-labelledby`. Agregar a la `motion.div` principal:
  ```tsx
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-aplicar-title"
  ```
  Y al `<h2>` del header: `id="modal-aplicar-title"`. Sin esto, lectores de pantalla no anuncian el modal correctamente.

- **`src/components/assistant/ChatWidget.tsx` — Sin feedback visual al resetear la conversacion.**
  Al pulsar "Nueva conversacion" el historial se borra y vuelve el saludo, pero no hay animacion ni confirmacion de que el reset ocurrio. El usuario puede creer que fallo. Agregar un estado temporal `justReset` con `setTimeout(..., 1500)` que muestre un badge "Conversacion reiniciada" en el header del chat por 1.5 segundos tras llamar a `reset()`.

### Baja prioridad

- **`src/app/contacto/page.tsx` — Boton de envio fuera de un `<form>` impide envio con Enter.**
  El formulario usa un `<div>` contenedor en lugar de `<form onSubmit>`. Presionar Enter en cualquier input no envia. Envolver en `<form onSubmit={handleSubmit}>` y cambiar `<button type="button" onClick={handleSubmit}>` a `<button type="submit">` para habilitar el comportamiento estandar de teclado en desktop.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **`src/lib/assistant/system-prompt.ts` Paso 6 linea 61 — Kyo envia candidatos a `/contacto` para aplicar, cuando el flujo correcto es `/vacantes/[id]`.**
  El Paso 6 dice "Navega a /contacto si acepta". Pero el formulario de aplicacion (`AplicarModal`) esta en la pagina de detalle de cada vacante: `src/app/vacantes/[id]/_content.tsx`. `/contacto` es un formulario generico de "Deja tu mensaje" que no menciona la vacante ni preselecciona nada. Cambiar el Paso 6 en `system-prompt.ts` a:
  ```
  ## Paso 6 — CIERRE
  Invitalo a aplicar directamente. Usa navigate_to con la ruta de la vacante especifica: /vacantes/[id],
  donde [id] es el numero de id de la vacante recomendada (ej. /vacantes/3).
  El boton "Aplicar ahora" en esa pagina abrira el formulario con la vacante pre-cargada.
  Si el candidato no quiere aplicar ahora pero si contactar al equipo, navega a /contacto.
  ```
  Tambien agregar en "Navegacion proactiva": `- /vacantes/[id] — detalle de vacante, donde [id] es el numero de id (ej. /vacantes/3)`

- **`src/lib/assistant/system-prompt.ts` Paso 1 — Sin instruccion para respuestas vagas del candidato.**
  Si el candidato responde "quiero trabajar" o "lo que sea", Kyo no tiene instruccion de como reformular. Agregar al final del Paso 1:
  ```
  Si la respuesta es vaga ("algo de oficina", "lo que sea", "cualquier cosa"):
  Repregunta con opciones concretas: "¿En que area le gustaria trabajar —
  administracion, ventas, atencion al cliente, operaciones, o algo diferente?"
  ```

- **`src/lib/assistant/system-prompt.ts` — Sin instruccion para retomar el flujo si el candidato pregunta algo fuera de tema.**
  Si en el Paso 3 el candidato pregunta "oye y cuanto cobran sus servicios?", Kyo responde pero puede perder el contexto del perfil. Agregar despues del Paso 4:
  ```
  Si el candidato hace una pregunta fuera del flujo durante los pasos 1-4:
  Responde en una linea, luego retoma: "Continuando con su perfil, [siguiente pregunta del paso en curso]."
  Nunca abandones el flujo de recoleccion de perfil si la pregunta es solo informativa.
  ```

### Nuevas tools o capacidades recomendadas

- **Pasar la pagina actual desde el frontend — Kyo no sabe donde esta el usuario.**
  Si el candidato ya esta en `/vacantes` y pregunta "que vacantes tienen?", Kyo puede navegar de nuevo a `/vacantes` (viaje redundante). El frontend puede pasar la ruta actual en el request. En `useChat.ts` linea 87, dentro del `body` del fetch:
  ```tsx
  body: JSON.stringify({
    messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
    currentPath: typeof window !== "undefined" ? window.location.pathname : "/",
  }),
  ```
  Y en `chat/route.ts`, agregar al system prompt: `# Pagina actual del usuario: ${body.currentPath}`. Con esto, Kyo puede decir "ya estas en la pagina de vacantes" en vez de navegar de nuevo.

- **`src/lib/assistant/system-prompt.ts` — URL de detalle de vacante no esta documentada.**
  El prompt lista rutas como `/vacantes`, `/vacantes?ubicacion=CDMX`, `/cursos`, etc., pero NO lista `/vacantes/[id]`. Kyo no puede navegar al detalle de una vacante especifica porque no conoce ese patron de URL. Agregar en la seccion "Filtros disponibles en URL":
  ```
  - /vacantes/[id] — pagina de detalle de vacante especifica (ej. /vacantes/3, /vacantes/7)
    Usar cuando el candidato ya eligio una vacante y quiere aplicar.
  ```

### Problemas detectados

- **`src/lib/assistant/knowledge.ts` linea 2 — Kyo usa datos estaticos de `lib/jobs.ts` mientras el sitio usa Supabase.**
  `StaticKnowledgeProvider` importa `JOBS` de `src/lib/jobs.ts`, un archivo hardcodeado. El sitio publico de vacantes (`vacantes/page.tsx`) lee de Supabase en tiempo real. Resultado: Kyo puede recomendar vacantes desactivadas desde el admin, o ignorar vacantes nuevas publicadas desde el panel. Este es el riesgo tecnico mas alto del asistente hoy. La solucion de "fase 2" (`SupabaseKnowledgeProvider`) esta documentada en `knowledge.ts` linea 163. Priorizar su implementacion, o al minimo, mantener `lib/jobs.ts` sincronizado manualmente cada vez que se agrega o desactiva una vacante.

- **`src/components/assistant/useChat.ts` lineas 27-35 — Historial en localStorage sin expiracion.**
  El historial persiste indefinidamente. Un candidato que vuelve al sitio dias despues ve la conversacion anterior con vacantes que ya pudieron cerrarse. Agregar verificacion de antiguedad en `loadHistory()`:
  ```tsx
  const lastTimestamp = parsed[parsed.length - 1]?.timestamp ?? 0;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  if (Date.now() - lastTimestamp > TWENTY_FOUR_HOURS) {
    localStorage.removeItem(STORAGE_KEY);
    return [INITIAL_GREETING];
  }
  ```

- **`src/app/api/assistant/chat/route.ts` linea 54 — Haiku puede fallar en flujos de tool-use multi-paso.**
  El chat usa `claude-haiku-4-5-20251001`. En el Paso 5 el modelo debe: (1) ejecutar `search_jobs` con filtros del perfil, (2) opcionalmente `get_job_details` para dos o tres vacantes, (3) formatear la respuesta segun el template exacto del prompt, y (4) llamar `navigate_to` con la URL correcta — todo en iteraciones dentro del loop de `MAX_TOOL_ITERATIONS=5`. Si en produccion Kyo da respuestas mal formateadas o no llama las tools, cambiar el modelo en `.env.local` del VPS:
  ```
  ANTHROPIC_MODEL=claude-sonnet-4-6
  ```

---

## Oportunidades de mejora general

- **Quick replies en ChatWidget para reducir la friccion de apertura.**
  Cuando `messages.length === 1` (solo el saludo inicial), mostrar 2-3 chips de respuesta rapida bajo el mensaje de Kyo: "Busco empleo", "Informacion de cursos", "Soy empresa". El candidato que llega sin contexto no sabe exactamente que escribir. Esta mejora no requiere cambios en el backend: en `ChatWidget.tsx`, renderizar chips condicionales que llamen a `sendMessage(texto)` al hacer clic.

- **`src/lib/assistant/knowledge.ts` linea 175 — URL de WhatsApp hardcodeada en el codigo.**
  El campo `whatsapp: "https://wa.link/5zv0ba"` esta en el codigo. Si Kyoszen cambia su numero, requiere deploy. Mover a la tabla `site_config` de Supabase (ya existe) con key `whatsapp_url`, editable desde el panel admin sin tocar el codigo.

- **Analitica de Kyo incompleta: no se sabe en que paso del flujo abandona el candidato.**
  `useChat.ts` linea 70 loguea `kyo_mensaje` por cada mensaje del usuario, pero no el paso del flujo. Para saber si los candidatos abandonan en el Paso 2 (experiencia) o en el Paso 4 (disponibilidad), el backend podria incluir `step: number` en el response JSON de `chat/route.ts`, y el frontend lo loguea con `logEvent("kyo_paso", step.toString())`. Con ese dato, el dashboard de analytics mostraria el funnel de conversion de Kyo.

- **SupabaseKnowledgeProvider — implementacion pendiente critica.**
  El patron esta preparado en `knowledge.ts`. La clase `StaticKnowledgeProvider` puede ser reemplazada por `SupabaseKnowledgeProvider` sin cambiar el asistente, las tools ni el route. Solo hay que: (1) crear la clase con los mismos metodos pero consultando Supabase, (2) cambiar el singleton en la linea 163 de `knowledge.ts`. Esto elimina el desincronismo entre lo que Kyo dice y lo que el sitio muestra.
