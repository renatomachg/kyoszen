# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-13
**Cambios analizados:** Sin cambios de codigo en las ultimas 48 horas (commits: health check, GitHub Actions deploy workflow). Cuarta auditoria: enfocada exclusivamente en hallazgos no cubiertos en reportes anteriores (2026-05-10, 2026-05-11, 2026-05-12).

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Vacancies.tsx`
- `src/app/vacantes/page.tsx`
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

Sin cambios de codigo. Se agrego el workflow de GitHub Actions para auto-deploy al VPS (`.github/workflows/deploy.yml`). Las sugerencias de alta prioridad de reportes previos siguen pendientes:
- `next/image` en Hero.tsx sin corregir (reportado 2026-05-10)
- Vacancies.tsx con datos hardcodeados (reportado 2026-05-10)
- XSS en `/api/aplicar` (reportado 2026-05-12)
- Kyo no navega a `/vacantes/<id>` directo (reportado 2026-05-12)

---

## Sugerencias de UX

### Alta prioridad

- **Kyo pierde el nombre y contexto del candidato en conversaciones largas** (`src/app/api/assistant/chat/route.ts`, linea 73): el API corta el historial a los ultimos 20 mensajes con `body.messages.slice(-20)`. En una conversacion tipica de 6 pasos, los mensajes 1-4 (nombre del candidato, tipo de trabajo buscado) se pierden cuando la conversacion llega al intercambio numero 10. A partir de ese punto, Kyo olvida el nombre y el puesto, y puede repetir preguntas ya respondidas o referirse al candidato de forma impersonal. Solucion: cambiar la estrategia de truncado para preservar siempre los primeros 4 mensajes (el saludo, el nombre del candidato, la confirmacion de Kyo, y el tipo de trabajo) y completar con los ultimos 16 del resto:
  ```ts
  const anchor = body.messages.slice(0, 4);
  const tail = body.messages.slice(-16);
  const history = [...anchor, ...tail];
  ```
  Si el historial tiene menos de 20 mensajes, esta logica es inocua (los mensajes se solapan o se dejan igual).

- **`search_jobs` no puede filtrar por `contrato` ni `jornada` aunque Paso 4 los recolecta** (`src/lib/assistant/tools.ts`, lineas 38-47 y `src/lib/assistant/knowledge.ts`, linea 138): el flujo de Kyo pregunta en Paso 4 si el candidato busca "Tiempo completo o Medio tiempo". Pero la tool `search_jobs` solo acepta `query`, `category` y `location`. No existe filtro por `contrato` ni `jornada`. Resultado: Kyo recoge ese dato pero no puede filtrarlo; puede recomendar una vacante de "Medio tiempo" a alguien que explicitamente dijo querer "Tiempo completo". Solucion en dos partes:
  1. Agregar en `tools.ts` en el schema de `search_jobs`:
     ```ts
     contrato: { type: "string", description: "Filtra por tipo de contrato: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" },
     jornada: { type: "string", description: "Filtra por jornada: 'Matutina', 'Vespertina', 'Mixta', 'Flexible'" },
     ```
  2. Agregar en `knowledge.ts` en `listJobs` (despues de linea 141):
     ```ts
     .filter((j) => !filters?.contrato || j.contrato.toLowerCase() === filters.contrato.toLowerCase())
     .filter((j) => !filters?.jornada || j.jornada.toLowerCase() === filters.jornada.toLowerCase())
     ```
  Esto hace que la recoleccion del Paso 4 tenga impacto real en las recomendaciones del Paso 5.

- **Sistema de rate limiting se reinicia con cada restart del servidor** (`src/app/api/assistant/chat/route.ts`, linea 10): el `rateLimitMap` es una variable en memoria del proceso Node.js. En Vercel cada lambda coldstart crea una instancia nueva con el mapa vacio. En el VPS con PM2, cada `pm2 restart` lo reinicia. Un usuario puede hacer `pm2 restart` o esperar un coldstart para saltarse el limite. Para el VPS donde la estabilidad del proceso si es alta, el problema real es cuando hay un crash o deploy. El comentario del codigo ya dice "In production with multiple instances, replace with Upstash Redis." Agregar al menos un limite por session/IP por hora como segundo nivel: si la sesion lleva mas de 60 intercambios totales (localStorage cuenta 30 max), el widget deberia mostrar un mensaje de "Para continuar, contactanos por WhatsApp". Esto se implementa en `useChat.ts` revisando `messages.length > 28` antes de enviar y retornando un error local sin llamar al API.

### Media prioridad

- **El chat no tiene `role="dialog"` ni focus trap para accesibilidad** (`src/components/assistant/ChatWidget.tsx`, linea 115): el panel del chat se abre y cierra visualmente, pero no usa `role="dialog"`, `aria-modal="true"` ni `aria-labelledby`. Un usuario de lector de pantalla no sabe que hay un dialogo modal activo, y el foco no queda atrapado dentro del panel (puede tabular hacia elementos debajo). Correccion minima: agregar a la `motion.div` del chat panel (linea 115):
  ```tsx
  role="dialog"
  aria-modal="true"
  aria-label="Chat con Kyo, asistente de Kyoszen"
  ```
  Y agregar `tabIndex={-1}` con ref para hacer focus al panel al abrirse (en lugar de hacer focus solo al input en linea 22).

- **Input del chat sin `enterKeyHint` para mobile** (`src/components/assistant/ChatWidget.tsx`, linea 174): el `<input>` de texto no tiene `enterKeyHint="send"`. En teclados virtuales de iOS y Android, esto cambia el label del boton de Enter a "Enviar" o el icono de avion de papel, que es una senal visual clara para el candidato. Cambio de una linea:
  ```tsx
  enterKeyHint="send"
  ```
  Impacto: mejora la experiencia mobile sin ninguna logica adicional.

- **Historial de chat en localStorage nunca expira** (`src/components/assistant/useChat.ts`, linea 14): `STORAGE_KEY = "kyoszen_chat_history_v1"` guarda hasta 30 mensajes sin ninguna fecha de expiracion. Si un candidato vuelve al sitio 3 semanas despues, vera su conversacion anterior truncada a la mitad, sin contexto de por que estaba en ese punto. Kyo continuara desde donde quedaron pero las vacantes pueden haber cambiado. Agregar al guardar en `saveHistory`:
  ```ts
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ saved_at: Date.now(), messages: messages.slice(-MAX_STORED) }));
  ```
  Y en `loadHistory`: si `Date.now() - saved_at > 7 * 24 * 60 * 60 * 1000` (7 dias), devolver `[INITIAL_GREETING]` e ignorar el historial viejo. Evita que candidatos retomen conversaciones obsoletas.

- **El boton flotante de Kyo se superpone con la barra de navegacion de iPhone** (`src/components/assistant/ChatWidget.tsx`, linea 41): `bottom-5` equivale a 20px. En iPhones con barra de gesto (Home Indicator), la zona segura inferior puede consumir hasta 34px. El boton puede quedar parcialmente debajo del indicador de inicio. Cambiar a `bottom-[max(20px,env(safe-area-inset-bottom,20px))]` o mas simplemente usar `pb-safe` si Tailwind tiene configurado el plugin `tailwindcss-safe-area`. Alternativa sencilla: cambiar `bottom-5` a `bottom-8` (32px) para dar margen suficiente en todos los dispositivos.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **Kyo no tiene instruccion para cuando el usuario da toda la informacion en un solo mensaje** (`src/lib/assistant/system-prompt.ts`, lineas 28-67): el flujo de 6 pasos asume que el candidato responde una pregunta a la vez. Pero es comun que un candidato escriba: "Hola, me llamo Maria, busco trabajo de recepcionista, tengo 2 años de experiencia, vivo en CDMX y quiero tiempo completo." En ese caso, el sistema prompt instruye a Kyo a preguntar "que tipo de trabajo busca" (Paso 1) aunque ya lo sabe. Esto genera friccion y hace el asistente parecer torpe. Agregar al inicio del flujo (despues de linea 29):
  ```
  EXCEPCION: Si el usuario proporciona voluntariamente informacion de varios pasos en un solo mensaje
  (puesto, experiencia, ubicacion, disponibilidad), acepta toda esa informacion y avanza directamente
  al Paso 5 sin hacer preguntas ya respondidas. Agradece y confirma: "Perfecto, [nombre]. Entiendo
  que busca [puesto], con [X] años de experiencia, en [ubicacion] y a [jornada]. Permita que busque
  vacantes para su perfil."
  ```

- **Kyo no sabe en que pagina esta el usuario cuando abre el chat** (`src/components/assistant/useChat.ts`, linea 81-87 y `src/app/api/assistant/chat/route.ts`): cuando el chat se abre, Kyo inicia siempre con el saludo generico y el flujo de candidato, sin importar si el usuario esta en `/cursos`, `/servicios` o `/vacantes`. Si alguien esta en `/cursos` y abre Kyo, casi seguro quiere informacion de cursos, no buscar trabajo. Solucion: pasar la pagina actual como contexto en el request:
  - En `useChat.ts` linea 83 agregar al body: `current_page: window.location.pathname`
  - En `route.ts` linea 61 extraer ese campo del body
  - En `system-prompt.ts` agregar un bloque: "Pagina actual del usuario: [path]. Si esta en /cursos, el usuario probablemente quiere informacion de cursos. Si esta en /vacantes, ya esta buscando trabajo. Ajusta tu saludo."
  Impacto: Kyo parece mas inteligente y contextual, reduce preguntas innecesarias.

- **Paso 5: el formato de recomendacion no incluye el salario** (`src/lib/assistant/system-prompt.ts`, linea 51-56): el formato definido para la recomendacion es `[Nombre del puesto] — [Empresa] — [Por que le aplica]`. No incluye el salario, que es el primer dato que un candidato quiere saber. Si Kyo dice "Auxiliar Administrativo — Grupo Corpora — se ajusta a su experiencia" sin mencionar que paga $12,000/mes, el candidato tiene que ir a la pagina de la vacante para saberlo. Agregar al formato del Paso 5:
  ```
  1. [Nombre del puesto] — [Empresa] — $[salario]/mes — [Por que le aplica]
  ```
  El salario esta en el catalogo de vacantes que Kyo ya tiene en el system prompt.

### Nuevas tools o capacidades recomendadas

- **Implementar prompt caching de Anthropic en el system prompt** (`src/app/api/assistant/chat/route.ts`, linea 88-94): el system prompt con todas las vacantes y cursos ocupa aproximadamente 2,000 tokens. Se reconstruye y envia completo en CADA llamada a la API. Implementar `cache_control: { type: "ephemeral" }` en el bloque del system prompt reduciria el costo de tokens en ~90% para ese bloque (solo se cobra al crear el cache, no al reutilizarlo). Con `claude-haiku-4-5-20251001`, el ahorro es de ~0.25 USD por cada 1,000 mensajes. Para implementarlo, cambiar la llamada en linea 88 de:
  ```ts
  system: buildSystemPrompt(),
  ```
  a:
  ```ts
  system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
  ```
  El SDK de Anthropic ya soporta este formato. No hay cambio de comportamiento, solo ahorro de costo.

- **Agregar tool `save_candidate_data` para prellenar AplicarModal** (`src/lib/assistant/tools.ts`): cuando Kyo recolecta nombre, puesto y ubicacion en los pasos 0-3, esos datos se quedan atrapados en el historial del chat pero no estan disponibles para el formulario de aplicacion. Si el candidato hace clic en "Aplicar ahora" en la vacante, tiene que volver a escribir su nombre. Agregar una tool que guarde los datos del candidato en `localStorage`:
  ```ts
  {
    name: "save_candidate_profile",
    description: "Guarda el perfil del candidato en el navegador para prellenar el formulario de aplicacion.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        puesto_buscado: { type: "string" },
        ubicacion: { type: "string" },
      },
      required: ["nombre"],
    },
  }
  ```
  En `executeTool`, devolver un JSON especial que `useChat.ts` detecte y guarde en `localStorage` bajo la clave `kyoszen_candidate_profile`. `AplicarModal.tsx` lee esa clave al abrirse para prellenar los campos. Reduce el punto de friccion mayor en la conversion.

### Problemas detectados

- **`INITIAL_GREETING` tiene `timestamp: 0` como valor sentinel** (`src/components/assistant/useChat.ts`, linea 17): el timestamp `0` es el 1 enero 1970 (Unix epoch). Si en el futuro se agrega logica que agrupe mensajes por fecha, muestre "hace X tiempo" o filtre sesiones por antiguedad, este valor causara que el saludo inicial aparezca como "hace 56 años" o pase silenciosamente los filtros de fecha. Cambiar a `timestamp: Date.now()` en la constante, o mejor aun, hacer `INITIAL_GREETING` una funcion que cree el mensaje con timestamp actual:
  ```ts
  function createGreeting(): ChatMessage {
    return { id: "greeting", role: "assistant", content: "...", timestamp: Date.now() };
  }
  ```
  Y reemplazar todos los usos de `INITIAL_GREETING` con `createGreeting()`.

- **El flujo asume que el candidato ya leyo el saludo automatico, pero este puede no haberse mostrado** (`src/lib/assistant/system-prompt.ts`, linea 21-23): el system prompt dice "Ya salude al usuario con: 'Bienvenido a Kyoszen...'". Pero si el usuario borra el localStorage o entra desde un navegador diferente, o si hay un error en `loadHistory`, el mensaje de saludo podria no estar. Kyo asume que ya pidio el nombre pero el candidato no lo vio. Resultado: Kyo espera el nombre pero el candidato pregunta algo completamente diferente. Agregar una instruccion: "Si el primer mensaje del usuario NO es su nombre sino una pregunta directa, adapta y responde la pregunta; luego pide el nombre de forma natural al final: '¿Me permite saber su nombre para ayudarle mejor?'"

- **`navigate_to` acepta cualquier path sin validacion en `executeTool`** (`src/app/api/assistant/chat/route.ts`, linea 108-113): si Claude (por alucinar) genera `path: "/admin"` o `path: "https://otro-sitio.com"`, `navigate_to` ejecuta el `router.push` en el frontend sin ninguna validacion. Agregar validacion en `executeTool` antes de confirmar la navegacion:
  ```ts
  const ALLOWED_PATHS = ["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"];
  const isValid = ALLOWED_PATHS.some(p => (input.path as string).startsWith(p));
  if (!isValid) return JSON.stringify({ error: "Ruta no permitida", path: input.path });
  ```
  En `useChat.ts`, el frontend ya solo actua sobre el primer elemento de `navigations`, pero la validacion del lado del servidor es mas robusta.

---

## Oportunidades de mejora general

- **Agregar quick-reply chips para primeros usuarios del chat** (`src/components/assistant/ChatWidget.tsx`): el primer mensaje del candidato es el mayor punto de abandono — no saben que escribir. Mostrar 2-3 botones de respuesta rapida debajo del historial cuando solo hay el mensaje de saludo (1 mensaje total):
  ```tsx
  {messages.length === 1 && !isLoading && (
    <div className="flex flex-wrap gap-2 px-5 pb-2">
      {["Busco empleo", "Tengo una empresa", "Ver cursos"].map((chip) => (
        <button key={chip} onClick={() => sendMessage(chip)}
          className="text-[12px] bg-blue-soft text-blue-dark rounded-full px-3 py-1.5 border border-blue/20 hover:bg-blue hover:text-white transition-colors">
          {chip}
        </button>
      ))}
    </div>
  )}
  ```
  Impacto: elimina la pantalla en blanco del candidato que no sabe que escribir, canaliza correctamente entre candidatos y empresas desde el primer click.

- **La seccion Vacancies del home muestra 4 vacantes hardcodeadas que no coinciden con las del catalogo real** (`src/components/sections/Vacancies.tsx`, lineas 7-40): las tarjetas del home muestran titulos y categorias iguales a los del catalogo (`JOBS`), pero no tienen los mismos datos (empresa, salario, ID). El link de cada tarjeta apunta a `/vacantes` (listado general) en lugar de a `/vacantes/${id}`. Esto no es solo un problema de duplicacion de datos (ya reportado); es que el candidato que hace clic en "Auxiliar Administrativo" del home espera ir a esa vacante especifica pero aterriza en el listado de todas las vacantes. Reemplazar el array `vacancies` local con los primeros 4 de `JOBS` importados directamente y cambiar el href a `/vacantes/${vac.id}`. Cambio de ~10 lineas que elimina datos duplicados Y mejora la conversion.

- **No hay indicador visual de en que paso del flujo esta el candidato** (`src/components/assistant/ChatWidget.tsx`): el chat tiene 6 pasos (nombre, puesto, experiencia, ubicacion, disponibilidad, recomendacion) pero el candidato no tiene forma de saber cuanto falta. Un simple indicador de progreso (5 puntos lineales con el activo resaltado) en el header del chat, que Kyo actualice a traves de un campo en la respuesta del API, daria al candidato sensacion de avance. Alternativa mas simple sin cambios al backend: mostrar un texto estatico en el header: "Paso [N] de 5" que el frontend infiera por la cantidad de pares pregunta/respuesta en el historial.

- **No hay forma de que el candidato corrija informacion ya dada** (`src/lib/assistant/system-prompt.ts`): si en el Paso 2 el candidato dice "2 años de experiencia" y en el Paso 3 quiere corregir a "4 años", no hay instruccion para Kyo sobre como manejar correcciones. Kyo podria confundirse o continuar con el dato incorrecto. Agregar al final de las Reglas Criticas (linea 84): "Si el usuario dice 'en realidad', 'me equivoque', 'quiero cambiar' o algo similar, acepta la correccion, actualiza el dato mentalmente y confirma: '[Nombre], entendido, tomo nota del cambio.'"
