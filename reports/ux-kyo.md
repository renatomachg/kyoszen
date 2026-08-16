# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-16
**Cambios analizados (últimas 48 h):** Sin commits de código nuevos desde el 2026-08-13. Los últimos 2 commits son solo los informes de análisis automatizados.

**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/lib/jobs.ts`
- `src/lib/campanas.ts`
- `src/app/admin/(panel)/proyectos/page.tsx` (últimas 3 sesiones de commits)

---

## Cambios Recientes Detectados

Sin cambios nuevos en la última ejecución. Los 6 commits anteriores (commits `460b1f3`–`32cc319`) ya están en producción y se analizaron en sesiones previas:

| Commit | Descripción |
|---|---|
| `460b1f3` | `feat(proyectos)`: etapa muestra cuánto material llegó (`conMaterial`) |
| `46c41c1` | `fix(proyectos)`: pedir cambios no obliga a repetir el motivo |
| `2cffce9` | `feat(proyectos)`: conversación admin ↔ colaborador por escena |
| `287dca3` | `fix(seguridad)`: subidor de archivos sin sección fija |
| `d8fa46d` | `feat(campanas)`: campaña terminada se muestra finalizada (`faseDeCampana`) |
| `32cc319` | `fix(seguridad)`: exigir sesión y permisos en todo el panel |

**Estado de las sugerencias de los análisis anteriores — ninguna implementada todavía:**

| Sugerencia | Prioridad | Estado |
|---|---|---|
| Kyo lee JOBS estático, no Supabase | **Alta** | ⏳ Pendiente |
| Memory leak en `rateLimitMap` | Alta | ⏳ Pendiente |
| `navigate_to` acepta cualquier ruta (riesgo seguridad) | Alta | ⏳ Pendiente |
| "Nueva conversacion" sin acento | Media | ⏳ Pendiente |
| `localStorage` de Kyo sin expiración (flujo roto al regresar) | Media | ⏳ Pendiente |
| `max_tokens: 1024` puede truncar Paso 5 | Media | ⏳ Pendiente |
| Mobile keyboard oculta el panel de chat | Media | ⏳ Pendiente |

---

## Sugerencias de UX

### Alta prioridad

- **Kyo recomienda vacantes ficticias — `knowledge.ts` lee de `jobs.ts` estático, no de Supabase.**
  El sitio público en `/vacantes` lee vacantes en tiempo real de Supabase (activas, con salario_nota, beneficios, horario actualizados). Kyo, en cambio, consulta `JOBS` en `src/lib/jobs.ts`, que es un array hardcodeado que no cambia entre despliegues. Si el admin agrega, desactiva o edita una vacante en el panel, Kyo la sigue mostrando (o no la muestra) incorrectamente.
  **Cómo arreglarlo:** En `src/lib/assistant/knowledge.ts`, reemplazar `StaticKnowledgeProvider` con una clase que consulte Supabase en `listJobs()`:
  ```ts
  // src/lib/assistant/knowledge.ts — método listJobs()
  async listJobs(filters) {
    const sb = createClient(supabaseUrl, supabaseAnonKey);
    let q = sb.from("vacantes").select("id, titulo, empresa, ubicacion, contrato, jornada, salario, salario_nota, desc").eq("activa", true);
    if (filters?.location) q = q.ilike("ubicacion", `%${filters.location}%`);
    if (filters?.query)    q = q.ilike("titulo", `%${filters.query}%`);
    const { data } = await q.order("created_at", { ascending: false });
    return (data ?? []).map(mapearVacante);
  }
  ```
  La interfaz `KnowledgeProvider` ya está definida para soportar esto (la nota "phase 2" en `knowledge.ts:166` menciona `SupabaseKnowledgeProvider`). El `executeTool` en `tools.ts` y el `buildSystemPrompt` en `system-prompt.ts` no necesitan cambios.

- **`rateLimitMap` crece sin límite en memoria — puede crashear PM2 con tráfico sostenido.**
  `src/app/api/assistant/chat/route.ts:68`: el `Map` acumula una entrada por IP sin limpieza. Después de una ventana de 60 s la entrada `resetAt` ya expiró pero nunca se borra. Con 10 000 visitantes únicos al mes, la Map termina con 10 000 entradas persistentes.
  **Cómo arreglarlo:** En `chat/route.ts`, después del `return false` del rate limit, agregar una limpieza periódica:
  ```ts
  // limpiar entradas expiradas cada 5 min
  if (Math.random() < 0.01) {
    const now = Date.now();
    for (const [k, v] of rateLimitMap) if (v.resetAt < now) rateLimitMap.delete(k);
  }
  ```
  Esto borra ~1% de las llamadas (probabilidad de limpieza), sin bloquear el request. Alternativa limpia a futuro: Upstash Redis (el comentario en `chat/route.ts:68` ya lo menciona).

- **`navigate_to` no valida la ruta — Kyo podría navegar a `/admin` o `/admin/login`.**
  `src/lib/assistant/tools.ts:105`: el `case "navigate_to"` devuelve `navigated: true` sin validar si el `path` está en la lista de páginas conocidas. Si un usuario escribe "llévame al panel de administración" o ingresa un prompt adversarial, Claude podría llamar `navigate_to({ path: "/admin/vacantes" })` y el frontend ejecutaría `router.push("/admin/vacantes")` (que luego redirige al login, pero revela que existe).
  **Cómo arreglarlo:** En `executeTool` de `tools.ts`, antes de devolver `navigated: true`, validar contra la lista blanca:
  ```ts
  case "navigate_to": {
    const RUTAS_PERMITIDAS = ["/", "/vacantes", "/cursos", "/nosotros", "/servicios", "/contacto", "/blog"];
    const path = input.path as string;
    const valida = RUTAS_PERMITIDAS.some(r => path === r || path.startsWith(r + "?") || path.startsWith(r + "/"));
    if (!valida) return JSON.stringify({ error: "Ruta no permitida" });
    return JSON.stringify({ navigated: true, path, reason: (input.reason as string) ?? "" });
  }
  ```

### Media prioridad

- **El historial de Kyo en `localStorage` no expira — el flujo se rompe al regresar días después.**
  `src/components/assistant/useChat.ts:37`: `loadHistory()` carga mensajes sin revisar su `timestamp`. Un candidato que visitó hace 2 semanas ve su conversación vieja (con su nombre ya capturado) pero el estado del servidor empieza en cero. Kyo repregunta el nombre o salta pasos.
  **Cómo arreglarlo:** En `loadHistory()`, agregar un TTL de 24 h:
  ```ts
  const parsed = JSON.parse(raw) as ChatMessage[];
  const hace24h = Date.now() - 24 * 60 * 60 * 1000;
  const recientes = parsed.filter(m => m.timestamp > hace24h || m.id === "greeting");
  return recientes.length > 1 ? recientes : [INITIAL_GREETING];
  ```

- **`max_tokens: 1024` puede truncar la respuesta del Paso 5 cuando hay muchas vacantes.**
  `src/app/api/assistant/chat/route.ts:152`: con el system prompt completo (instrucciones + empresa + vacantes + cursos + FAQs) y una conversación de 6 turnos, Claude puede quedarse sin tokens en el Paso 5 (listado de 2–3 vacantes con razones). Una respuesta truncada aparece cortada a la mitad sin punto final.
  **Cómo arreglarlo:** Subir `max_tokens` de 1024 a 2048 en `route.ts:152`. El costo incremental de Haiku es despreciable (~$0.0003 por mensaje extra). No hay riesgo de respuestas más largas de lo necesario porque Haiku respeta la instrucción "2-3 líneas max".

- **El panel de Kyo es inutilizable en mobile con el teclado virtual abierto.**
  `src/components/assistant/ChatWidget.tsx:120`: la clase `h-[min(60vh,560px)]` usa `vh` que en iOS es el viewport completo sin descontar el teclado. Con teclado abierto (~300px en iPhone SE), el panel queda parcialmente oculto debajo.
  **Cómo arreglarlo:** Cambiar `60vh` por `60dvh` (dynamic viewport height, soporte universal desde iOS 15.4 y Chrome 108):
  ```tsx
  className="fixed bottom-24 right-5 z-[60] w-[min(86vw,360px)] h-[min(60dvh,560px)] bg-white rounded-2xl ..."
  ```
  No rompe navegadores viejos (el fallback es `vh`). Cambio de 4 caracteres.

- **Error ortográfico en `ChatWidget.tsx:161` — "Nueva conversacion" sin acento.**
  El botón de reset dice `"Nueva conversacion"` sin la tilde. El CLAUDE.md exige ortografía correcta en español de México.
  **Cómo arreglarlo:** Línea 161 de `ChatWidget.tsx`:
  ```tsx
  // antes:
  >Nueva conversacion</button>
  // después:
  >Nueva conversación</button>
  ```

- **Los mensajes de Kyo no renderizan markdown básico — los asteriscos aparecen literales.**
  `src/components/assistant/ChatWidget.tsx:227`: `MessageBubble` para el asistente usa `whitespace-pre-wrap` sin ningún parser. Cuando Claude Haiku usa `**Cajero/a**` o listas numeradas en el Paso 5, el candidato ve los asteriscos en pantalla.
  **Cómo arreglarlo:** Reemplazar el `<div>` del contenido del burbuja de asistente por un parser inline mínimo (sin dependencias):
  ```tsx
  // En la función MessageBubble, para role === "assistant":
  function parsearMarkdownSimple(text: string): string {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  }
  // uso:
  <div ... dangerouslySetInnerHTML={{ __html: parsearMarkdownSimple(message.content) }} />
  ```
  Solo aplica al burbuja de Kyo, no al del usuario (que puede contener HTML arbitrario — ese sí debe quedar como texto plano).

### Baja prioridad

- **No hay chips de respuesta rápida después del Paso 5 — el candidato no sabe qué escribir.**
  Después de que Kyo lista las vacantes recomendadas, el candidato debe escribir manualmente "sí" o "quiero aplicar". Muchos abandonan sin responder.
  **Cómo arreglarlo:** En `MessageBubble`, cuando el contenido incluye "¿Le gustaría aplicar?" o "¿Le parece bien?", mostrar 2 chips táctiles:
  ```tsx
  const CHIPS: Record<string, string[]> = {
    "¿Le gustaría aplicar?": ["Sí, quiero aplicar", "Ver más vacantes"],
    "¿Le parece bien?": ["Sí, anoten mis datos", "No por ahora"],
  };
  ```
  Esto reduce la fricción en mobile y aumenta la tasa de cierre del flujo de 6 pasos. Implementación: 2–3 h.

- **El indicador de progreso del flujo de 6 pasos no existe — el candidato no sabe cuánto falta.**
  Kyo hace hasta 4 preguntas antes de mostrar vacantes (Pasos 1–4), pero el candidato no sabe si ya terminó o si hay más preguntas. Algunas personas responden y luego no siguen porque creen que el chat no funciona.
  **Cómo mejorarlo:** Sin cambiar el backend, el frontend puede detectar el paso actual contando los mensajes del asistente. Si hay 2 mensajes del asistente = Paso 1, 3 = Paso 2, etc. Mostrar una barra de progreso pequeña (5 puntos) encima del input.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **El saludo hardcodeado en el system prompt no coincide con el INITIAL_GREETING dinámico.**
  `system-prompt.ts:16`: el `DEFAULT_INSTRUCCIONES` dice "Ya saludé al usuario con: 'Bienvenido a Kyoszen...'" pero este texto está hardcodeado. Si el admin cambia el saludo desde el panel de Kyo (`kyo_config`), el system prompt sigue diciendo el saludo viejo. Kyo podría confundirse y repetir el saludo.
  **Cómo arreglarlo:** En `buildSystemPrompt()`, el saludo debería ser un parámetro o derivarse de `INITIAL_GREETING` en `useChat.ts`, no estar escrito dos veces en dos archivos. Mover la constante a un archivo compartido (`src/lib/assistant/constants.ts`) que importe tanto `useChat.ts` como `system-prompt.ts`.

- **Paso 3 (ubicación) es ambiguo para candidatos de Estado de México.**
  El system prompt en el Paso 3 dice "en qué zona vive o cuánto tiempo de traslado tolera". Si el candidato responde "Ecatepec" o "Texcoco", Kyo debe mapear eso a "Estado de México" para el filtro de URL. Pero el mapeo no existe — la tool `search_jobs` recibe el texto libre y lo compara exacto con `j.ubicacion.toLowerCase()` en `knowledge.ts:140`.
  **Cómo arreglarlo:** En `tools.ts`, antes de llamar a `knowledge.listJobs()`, normalizar el `location`:
  ```ts
  function normalizarUbicacion(input: string): string {
    const cdmx = ["cdmx", "ciudad de mexico", "df", "benito juarez", "iztapalapa", "tlalpan", "coyoacan"];
    const edomex = ["edomex", "estado de mexico", "ecatepec", "naucalpan", "toluca", "texcoco", "nezahualcoyotl"];
    const low = input.toLowerCase();
    if (cdmx.some(k => low.includes(k))) return "CDMX";
    if (edomex.some(k => low.includes(k))) return "Estado de Mexico";
    return input;
  }
  ```
  Esto mejora el matching sin tocar el system prompt.

- **El flujo para empresas que buscan candidatos no tiene pasos definidos — todo va a `/contacto`.**
  `system-prompt.ts:65`: "Si pregunta por cursos o es una empresa: responde 'Con gusto te conecto con nuestro equipo' y sugiere WhatsApp o navega a /contacto." No hay un flujo mínimo para capturar el tipo de empresa (sector, número de empleados, qué buscan). El admin pierde leads calificados.
  **Cómo mejorarlo:** Agregar un Paso alternativo en el system prompt para cuando se detecte que el interlocutor es una empresa (palabras como "queremos contratar", "necesitamos personal", "somos una empresa"):
  ```
  ## Flujo para empresas
  Si el usuario dice que necesita contratar (no busca trabajo), cambia al flujo empresa:
  1. Pregunta qué tipo de puesto(s) necesita cubrir.
  2. Pregunta cuántos candidatos necesita y en qué plazo.
  3. Navega a /contacto con el mensaje "Ya tengo tu información, un asesor te contactará en menos de 24 horas."
  ```

- **No hay manejo de intención de abandono — el candidato que escribe "gracias" o "adiós" recibe silencio.**
  Si el candidato escribe "gracias, ya encontré trabajo" o "adiós", Kyo responde de forma genérica porque no hay instrucción específica. Una respuesta de cierre cálida deja mejor impresión y puede rescatar la conversación ("¡Qué gusto! Si en el futuro necesitas cambio, aquí estaremos. ¿Algo más en lo que te ayude?").
  **Cómo arreglarlo:** Agregar una sección al `DEFAULT_INSTRUCCIONES`:
  ```
  ## Cierre voluntario
  Si el usuario dice "gracias", "adiós", "ya no" o expresa que ya no necesita ayuda:
  Responde con calidez, desea suerte y ofrece volver cuando lo necesite. No navegues a ninguna página.
  ```

### Nuevas tools o capacidades recomendadas

- **Tool: `get_job_application_form` — enviar el formulario de aplicación desde Kyo.**
  Actualmente Kyo navega a `/vacantes/[id]` para que el candidato aplique manualmente. La tasa de abandono es alta porque el cambio de contexto (del chat al formulario) interrumpe el flujo.
  **Propuesta:** Agregar una tool `start_application(job_id, candidate_name)` que pre-rellene el formulario de aplicación con el nombre capturado en el Paso 0. El endpoint `POST /api/aplicar` ya existe. Kyo podría enviar la aplicación directamente desde el chat si el candidato dice "sí, quiero aplicar a esa".
  **Impacto estimado:** Reduce pasos del candidato de 4 (navegar → leer → scroll → llenar formulario) a 1 ("sí, quiero").

- **Tool: `save_to_talent_bank` — registrar al candidato sin vacante compatible.**
  El Paso 5 del system prompt dice "si ninguna vacante encaja, ofrece quedar en banco de talentos y navega a /contacto". Pero navegar al formulario de contacto es genérico — no diferencia a un candidato de un cliente. Y el formulario no captura los datos estructurados (puesto buscado, zona, jornada) que Kyo ya recolectó.
  **Propuesta:** Agregar una tool `save_candidate_to_talent_bank(name, puesto, ubicacion, jornada, contacto?)` que inserte directamente en la tabla `aplicaciones` con `estado='banco_talentos'`. Kyo podría preguntar el WhatsApp o correo del candidato (que actualmente no pide en el flujo) solo si va a banco de talentos.

### Problemas detectados

- **BUG: `listJobs()` en `knowledge.ts` filtra por `j.ubicacion.toLowerCase() === filters.location.toLowerCase()`.**
  Comparación exacta, no `includes()`. Si el admin guarda una vacante con ubicación "CDMX, Iztapalapa" (con coma), la tool `search_jobs({ location: "CDMX" })` NO la encuentra porque "cdmx, iztapalapa" !== "cdmx".
  **Cómo arreglarlo:** En `knowledge.ts:140`, cambiar `===` por `includes()`:
  ```ts
  .filter((j) => !filters?.location || j.ubicacion.toLowerCase().includes(filters.location.toLowerCase()))
  ```

- **BUG: `chathistory` de `localStorage` puede contener el saludo con `timestamp: 0` perpetuamente.**
  `useChat.ts:18`: `INITIAL_GREETING` tiene `timestamp: 0`. Si se agrega el TTL de 24 h sugerido arriba, el saludo inicial (con `timestamp: 0`) siempre sería eliminado por el filtro `m.timestamp > hace24h`. Hay que conservarlo explícitamente con `m.id === "greeting"` (como ya se muestra en la sugerencia del TTL anterior).

- **BUG POTENCIAL: `saveConversation` en `chat/route.ts` se llama con `history` (últimos 20 msgs) pero guarda como si fuera el historial completo.**
  `route.ts:205`: se pasa `history` (slice de 20) a `saveConversación`, pero el upsert en Supabase sobreescribe `messages` completo. Una conversación larga que tenga 25 mensajes pierde los 5 más viejos al guardar. El admin que revisa conversaciones largas en `/admin/kyo` ve la conversación truncada.
  **Cómo arreglarlo:** En lugar de `history`, guardar `body.messages` completo (todos los mensajes), o aplicar el slice solo para el contexto de Anthropic (que ya lo hace) pero no para el log.

---

## Oportunidades de mejora general

- **`feat(campanas)`: el estado "finalizada" no tiene CTA para el cliente en `/revisor`.**
  El commit `d8fa46d` implementó `faseDeCampana()` correctamente — si la campaña pasó su `fecha_fin`, se muestra automáticamente como finalizada. Pero la vista del cliente (`src/components/revisor/CampanasCliente.tsx`) no muestra ningún CTA al llegar a este estado: ni "¿Contratar de nuevo?", ni "Ver resultados en Meta", ni mensaje de cierre.
  **Sugerencia:** En `CampanasCliente.tsx`, cuando `fase === "finalizada"`, mostrar un bloque de cierre:
  ```tsx
  <div className="rounded-xl bg-[#042E7B] text-white p-5 mt-4">
    <p className="font-bold text-sm">Campaña finalizada</p>
    <p className="text-xs opacity-80 mt-1">Esta campaña ya terminó de correr. ¿Te gustaría planear la siguiente?</p>
    <a href="https://wa.link/5zv0ba" className="mt-3 inline-block bg-[#FFCC00] text-[#042E7B] text-xs font-bold px-4 py-2 rounded-full">Hablar con mi asesor</a>
  </div>
  ```
  Esto convierte el fin de campaña en una oportunidad de upsell directo.

- **`feat(proyectos)`: el término "con material" puede ser confuso para el cliente en `/revisor`.**
  El commit `460b1f3` agrega el conteo de escenas con material entregado en la cabecera de la etapa admin. Excelente para el admin. Pero si este resumen llega al cliente (en la vista de Proyectos del revisor), "con material" puede sonar técnico o ambiguo.
  **Sugerencia:** En la vista cliente, usar "recibidas" en lugar de "con material" para las escenas que el cliente aún no aprobó pero que el admin ya subió.

- **`feat(proyectos)`: la conversación por escena no notifica al colaborador por correo.**
  El commit `2cffce9` agrega un hilo de comentarios entre el admin y el colaborador en cada escena de un proyecto. Revisando `src/app/api/admin/proyectos/[id]/bloques/[bloqueId]/comments/route.ts`, el `POST` inserta el comentario en BD pero no envía correo.
  **Sugerencia:** Agregar una llamada a `campanas-notify.ts` (el helper SMTP ya existe) cuando el admin comenta en un bloque asignado a un colaborador externo. Esto cierra el loop de comunicación sin que nadie tenga que entrar a revisar el panel.

- **El `informe mensual` de redes del admin no incluye las campañas pagadas como métrica.**
  `src/lib/social-informe.ts` calcula métricas del sitio (clics WhatsApp, contactos, aplicaciones) y de publicaciones orgánicas (`social_posts`). Pero las campañas pagadas (`campanas` + `campana_anuncios`) no están integradas. El cliente ve el informe de mayo sin saber cuántas personas vieron el anuncio de GPG ni cuántos formularios se llenaron.
  **Sugerencia:** Agregar una sección "📢 Campañas pagadas" al informe con conteo de campañas activas/finalizadas en el período, y placeholder para resultados de Meta (cuando se conecte la API). Modificar `calcularMetricasSitio()` para que incluya el campo `campanas_activas` y `campanas_finalizadas`.

- **No hay página de estado del servicio visible al candidato cuando `/api/assistant/chat` falla.**
  `useChat.ts:105`: cuando el fetch falla, `setError(msg)` muestra el error dentro del chat (texto rojo pequeño). En un error 503 (API Key no configurada) o 500 (Anthropic caído), el candidato ve "Error al conectar con el asistente" sin saber qué hacer.
  **Sugerencia:** Cuando `res.status === 503`, el error debería incluir un CTA directo: "Por ahora no puedo responder. Puedes escribirnos al WhatsApp 📱 [link]". Modificar `useChat.ts:105` para que el mensaje de error 503 sea distinto:
  ```ts
  if (res.status === 503) throw new Error("El asistente está en mantenimiento. Escríbenos directo al WhatsApp.");
  ```
