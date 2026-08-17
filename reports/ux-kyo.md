# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-17
**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/lib/campanas.ts`
- `src/app/admin/(panel)/proyectos/page.tsx`

---

## Cambios Recientes Detectados

Sin commits de código nuevos desde el 2026-08-13. Los últimos 5 commits son solo los informes de análisis automatizados. Los commits reales ya en producción son:

| Commit | Descripción |
|---|---|
| `460b1f3` | `feat(proyectos)`: etapa muestra cuánto material llegó (`conMaterial`) |
| `46c41c1` | `fix(proyectos)`: pedir cambios no obliga a repetir el motivo |
| `2cffce9` | `feat(proyectos)`: conversación admin ↔ colaborador por escena |
| `287dca3` | `fix(seguridad)`: subidor de archivos sin sección fija |
| `d8fa46d` | `feat(campanas)`: campaña terminada se muestra finalizada (`faseDeCampana`) |

**Rastreador de sugerencias abiertas — ninguna implementada todavía:**

| Sugerencia | Prioridad | Estado | Días abierto |
|---|---|---|---|
| Kyo lee JOBS estático, no Supabase | **Alta** | ⏳ Pendiente | 4+ días |
| Memory leak en `rateLimitMap` | **Alta** | ⏳ Pendiente | 4+ días |
| `navigate_to` acepta cualquier ruta (riesgo seguridad) | **Alta** | ⏳ Pendiente | 4+ días |
| `localStorage` de Kyo sin TTL (flujo roto al regresar días después) | Media | ⏳ Pendiente | 4+ días |
| `max_tokens: 1024` puede truncar Paso 5 | Media | ⏳ Pendiente | 4+ días |
| Mobile keyboard oculta el panel de chat (`vh` → `dvh`) | Media | ⏳ Pendiente | 4+ días |
| Markdown de Kyo no se renderiza (asteriscos literales) | Media | ⏳ Pendiente | 4+ días |
| "Nueva conversacion" sin acento en `ChatWidget.tsx:161` | Baja | ⏳ Pendiente | 4+ días |
| Campaña finalizada sin CTA en `/revisor` | Baja | ⏳ Pendiente | 4+ días |
| Comentarios de escena no notifican por correo | Baja | ⏳ Pendiente | 2+ días |

---

## Sugerencias de UX

### Alta prioridad

- **Kyo recomienda vacantes ficticias — `knowledge.ts` lee de `jobs.ts` estático, no de Supabase.**
  El sitio público en `/vacantes` lee vacantes en tiempo real de Supabase (activas, con salario_nota, beneficios, horario actualizados). Kyo, en cambio, consulta `JOBS` en `src/lib/jobs.ts`, un array hardcodeado que no cambia entre despliegues. Si el admin agrega, desactiva o edita una vacante en el panel, Kyo la sigue mostrando (o no la muestra) incorrectamente.
  **Cómo arreglarlo:** En `src/lib/assistant/knowledge.ts`, reemplazar `StaticKnowledgeProvider.listJobs()` con una consulta directa a Supabase:
  ```ts
  async listJobs(filters) {
    const sb = createClient(supabaseUrl, supabaseAnonKey);
    let q = sb.from("vacantes").select("id, titulo, empresa, ubicacion, contrato, jornada, salario, salario_nota").eq("activa", true);
    if (filters?.location) q = q.ilike("ubicacion", `%${filters.location}%`);
    if (filters?.query)    q = q.ilike("titulo", `%${filters.query}%`);
    const { data } = await q.order("created_at", { ascending: false });
    return (data ?? []).map(mapearVacante);
  }
  ```
  La interfaz `KnowledgeProvider` y el note "phase 2 → SupabaseKnowledgeProvider" en `knowledge.ts:166` ya anticipan este cambio. El `executeTool` y `buildSystemPrompt` no necesitan modificaciones.

- **`rateLimitMap` crece sin límite en memoria — puede crashear PM2 con tráfico sostenido.**
  `src/app/api/assistant/chat/route.ts:68`: el `Map` acumula una entrada por IP sin limpieza. Con 10 000 visitantes únicos al mes, la Map termina con 10 000 entradas persistentes sin liberar.
  **Cómo arreglarlo:** En `chat/route.ts`, agregar una limpieza probabilística al inicio de `checkRateLimit`:
  ```ts
  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    // limpiar ~1% de las llamadas para no acumular entradas expiradas
    if (Math.random() < 0.01) {
      for (const [k, v] of rateLimitMap) if (v.resetAt < now) rateLimitMap.delete(k);
    }
    // ... resto de la función
  }
  ```

- **`navigate_to` no valida la ruta — Kyo podría navegar a `/admin` si un usuario lo provoca.**
  `src/lib/assistant/tools.ts:105`: el `case "navigate_to"` devuelve `navigated: true` sin validar si el `path` está en la lista de páginas públicas. Un prompt adversarial podría hacer que Kyo llame `navigate_to({ path: "/admin/login" })` y el frontend ejecutaría `router.push("/admin/login")`, revelando que el panel existe.
  **Cómo arreglarlo:** En `executeTool` de `tools.ts`, antes de devolver `navigated: true`, validar contra lista blanca:
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
  `src/components/assistant/useChat.ts:27`: `loadHistory()` carga mensajes sin revisar su timestamp. Un candidato que visitó hace 2 semanas ve la conversación vieja pero Kyo empieza en cero. El asistente puede repreguntarle el nombre o saltar pasos del flujo de 6 pasos.
  **Cómo arreglarlo:** En `loadHistory()` (`useChat.ts:24`), agregar TTL de 24 h:
  ```ts
  const parsed = JSON.parse(raw) as ChatMessage[];
  const hace24h = Date.now() - 24 * 60 * 60 * 1000;
  const recientes = parsed.filter(m => m.timestamp > hace24h || m.id === "greeting");
  return recientes.length > 1 ? recientes : [INITIAL_GREETING];
  ```
  La condición `m.id === "greeting"` conserva el saludo inicial (cuyo `timestamp` es `0` por diseño) sin que el filtro de 24 h lo elimine.

- **`max_tokens: 1024` puede truncar la respuesta del Paso 5 cuando hay muchas vacantes.**
  `src/app/api/assistant/chat/route.ts:152`: con el system prompt completo (instrucciones + empresa + vacantes + cursos + FAQs) y una conversación de 6 turnos, Claude puede quedarse sin tokens en el Paso 5 (listado de 2–3 vacantes con razones). Una respuesta truncada aparece cortada sin punto final.
  **Cómo arreglarlo:** Subir `max_tokens` de 1024 a 2048 en `route.ts:152`. El costo incremental de Haiku es despreciable (~$0.0003 por mensaje extra).

- **El panel de Kyo es inutilizable en mobile con el teclado virtual abierto.**
  `src/components/assistant/ChatWidget.tsx:120`: la clase `h-[min(60vh,560px)]` usa `vh` que en iOS es el viewport completo sin descontar el teclado. Con teclado abierto (~300px en iPhone SE), el panel queda parcialmente oculto.
  **Cómo arreglarlo:** Cambiar `60vh` por `60dvh` (dynamic viewport height, soporte desde iOS 15.4 y Chrome 108). Cambio de 4 caracteres; no rompe navegadores viejos (el fallback es `vh`):
  ```tsx
  // ChatWidget.tsx:120 — antes
  className="... h-[min(60vh,560px)] ..."
  // después
  className="... h-[min(60dvh,560px)] ..."
  ```

- **Los mensajes de Kyo no renderizan markdown básico — los asteriscos aparecen literales.**
  `src/components/assistant/ChatWidget.tsx` — `MessageBubble` usa `whitespace-pre-wrap` sin parser. Cuando Claude Haiku usa `**Cajero/a**` o listas numeradas en el Paso 5, el candidato ve `**Cajero/a**` en pantalla.
  **Cómo arreglarlo:** En `MessageBubble`, para `role === "assistant"`, aplicar un parser inline mínimo:
  ```tsx
  function parsearMd(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  }
  // Usar dangerouslySetInnerHTML solo en el burbuja del asistente (nunca en el del usuario)
  <div dangerouslySetInnerHTML={{ __html: parsearMd(message.content) }} />
  ```

### Baja prioridad

- **Error ortográfico confirmado en `ChatWidget.tsx:161` — "Nueva conversacion" sin tilde.**
  El botón de reset dice `"Nueva conversacion"` sin acento. El CLAUDE.md exige español correcto.
  **Cómo arreglarlo:** `ChatWidget.tsx:161` → `>Nueva conversación</button>`

- **No hay chips de respuesta rápida después del Paso 5 — el candidato no sabe qué escribir.**
  Después de que Kyo lista las vacantes, el candidato debe escribir "sí" o "quiero aplicar" manualmente. Muchos abandonan sin responder.
  **Sugerencia:** En `MessageBubble`, detectar la pregunta de cierre y mostrar 2 chips táctiles:
  ```tsx
  const CHIPS: Record<string, string[]> = {
    "¿Le gustaría aplicar?": ["Sí, quiero aplicar", "Ver más vacantes"],
    "¿Le parece bien?": ["Sí, anoten mis datos", "No por ahora"],
  };
  ```

- **El indicador de progreso del flujo de 6 pasos no existe — el candidato no sabe cuánto falta.**
  Kyo hace hasta 4 preguntas antes de mostrar vacantes (Pasos 1–4), pero no hay retroalimentación visual. Algunas personas no continúan creyendo que el chat no funciona.
  **Sugerencia:** El frontend puede detectar el paso actual contando los mensajes del asistente (2 msgs = Paso 1, 3 = Paso 2, etc.) y mostrar 5 puntos de progreso encima del input. Implementación puramente en frontend, sin tocar el backend.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **El saludo en `system-prompt.ts:16` está duplicado respecto a `INITIAL_GREETING` en `useChat.ts:19`.**
  Si el admin cambia el saludo desde el panel de Kyo (`kyo_config`), el system prompt sigue describiendo el saludo viejo, causando confusión en Kyo.
  **Cómo arreglarlo:** Mover la constante de saludo a `src/lib/assistant/constants.ts` y que tanto `useChat.ts` como `system-prompt.ts` la importen. Un solo lugar de verdad.

- **Paso 3 (ubicación) es ambiguo para candidatos de Estado de México.**
  Si el candidato responde "Ecatepec" o "Texcoco", Kyo no lo mapea a "Estado de México". La tool `search_jobs` en `knowledge.ts:140` compara `j.ubicacion.toLowerCase() === filters.location.toLowerCase()` — comparación exacta.
  **Cómo arreglarlo — dos cambios:**
  1. En `knowledge.ts:140`, cambiar `===` por `includes()`:
     ```ts
     .filter((j) => !filters?.location || j.ubicacion.toLowerCase().includes(filters.location.toLowerCase()))
     ```
  2. En `tools.ts`, normalizar el `location` antes de llamar a `knowledge.listJobs()`:
     ```ts
     function normalizarUbicacion(input: string): string {
       const cdmx  = ["cdmx", "ciudad de mexico", "df", "benito juarez", "iztapalapa", "coyoacan", "tlalpan"];
       const edomex = ["edomex", "estado de mexico", "ecatepec", "naucalpan", "toluca", "texcoco", "neza"];
       const low = input.toLowerCase();
       if (cdmx.some(k  => low.includes(k))) return "CDMX";
       if (edomex.some(k => low.includes(k))) return "Estado de Mexico";
       return input;
     }
     ```

- **El flujo para empresas que buscan candidatos no tiene pasos definidos — todo va a `/contacto`.**
  `system-prompt.ts:65`: "Si es una empresa: sugiere WhatsApp o navega a /contacto." No hay un flujo mínimo para capturar el tipo de empresa, cantidad de candidatos que necesitan ni plazo. El admin pierde leads calificados.
  **Cómo mejorarlo:** Agregar al `DEFAULT_INSTRUCCIONES` un flujo empresa mínimo de 3 preguntas antes de navegar a `/contacto`:
  ```
  ## Flujo para empresas
  Si el usuario dice que necesita contratar (no busca trabajo), cambia al flujo empresa:
  1. Pregunta qué tipo de puesto(s) necesita cubrir.
  2. Pregunta cuántos candidatos necesita y en qué plazo.
  3. Navega a /contacto con el mensaje "Ya tengo tu información, un asesor te contactará en menos de 24 horas."
  ```

- **No hay manejo de intención de abandono — el candidato que escribe "gracias" o "adiós" recibe respuesta genérica.**
  Si el candidato escribe "gracias, ya encontré trabajo", Kyo responde de forma genérica sin cerrar la conversación de manera cálida.
  **Cómo arreglarlo:** Agregar una sección al `DEFAULT_INSTRUCCIONES`:
  ```
  ## Cierre voluntario
  Si el usuario dice "gracias", "adiós", "ya no" o expresa que ya no necesita ayuda:
  Responde con calidez, desea suerte y ofrece volver cuando lo necesite. No navegues a ninguna página.
  ```

### Nuevas tools o capacidades recomendadas

- **Tool: `start_application` — aplicar desde Kyo sin salir del chat.**
  Actualmente Kyo navega a `/vacantes/[id]` y el candidato debe rellenar el formulario manualmente. La tasa de abandono es alta porque el cambio de contexto interrumpe el flujo.
  **Propuesta:** Agregar `start_application(job_id, candidate_name)` que llame a `POST /api/aplicar` (ya existe) con el nombre capturado en el Paso 0. Kyo preguntaría solo el WhatsApp o correo del candidato para completar la aplicación sin salir del chat.
  **Impacto estimado:** Reduce pasos del candidato de 4 (navegar → leer → scroll → formulario) a 1 ("sí, quiero").

- **Tool: `save_to_talent_bank` — registrar candidato sin vacante compatible.**
  El Paso 5 dice "ofrece quedar en banco de talentos y navega a /contacto". El formulario genérico de `/contacto` no diferencia a un candidato de un cliente, y no captura los datos estructurados (puesto buscado, zona, jornada) que Kyo ya tiene.
  **Propuesta:** Tool `save_candidate({ name, puesto, ubicacion, jornada, whatsapp? })` que inserte directamente en `aplicaciones` con `estado='banco_talentos'`. Kyo preguntaría solo el WhatsApp/correo si va a banco de talentos.

### Problemas detectados

- **BUG CONFIRMADO: `saveHistory` en `useChat.ts:70` corre con `messages = []` en el primer render.**
  La lógica de guards es:
  1. `useEffect` 1 (línea 63): `initialized.current = true` → `setMessages(loadHistory())` → programa re-render
  2. `useEffect` 2 (línea 70): `initialized.current` ya es `true` → `saveHistory([])` guarda `[]` en `localStorage`
  3. Re-render: `messages = loadHistory()` → `useEffect` 2 vuelve a correr y guarda el historial correcto
  El resultado neto es correcto (la segunda ejecución sobreescribe la primera), pero es una race condition sutil: si hay un error en el segundo render, el `localStorage` quedaría con `[]` y el candidato perdería su historial. La solución es usar un segundo `useRef` (`historyCargado`) que se active solo cuando la carga del historial se complete:
  ```ts
  const historyCargado = useRef(false);
  // En el useEffect de carga:
  setMessages(history);
  historyCargado.current = true;
  // En el useEffect de guardado:
  if (!historyCargado.current) return;
  saveHistory(messages);
  ```

- **BUG: `saveConversation` en `chat/route.ts:205` guarda solo los últimos 20 mensajes.**
  `route.ts:130`: `const history = body.messages.slice(-20)` — se pasa a `saveConversation`, que hace upsert sobreescribiendo `messages` completo. Una conversación de 25 turnos pierde los 5 primeros al guardar. El admin que revisa en `/admin/kyo` ve conversaciones truncadas.
  **Cómo arreglarlo:** Pasar `body.messages` completo a `saveConversation` (no `history`). El slice de 20 se usa solo para el contexto de Anthropic (ya lo hace correctamente).

- **BUG: filtro de ubicación en `knowledge.ts:140` usa `===` (exacto), no `includes()`.**
  Si una vacante tiene ubicación "CDMX, Iztapalapa" (con coma), la tool `search_jobs({ location: "CDMX" })` no la encuentra.
  **Cómo arreglarlo:** `knowledge.ts:140` → cambiar `.toLowerCase() === filters.location.toLowerCase()` por `.toLowerCase().includes(filters.location.toLowerCase())`.

---

## Oportunidades de mejora general

- **`feat(campanas)`: el estado "finalizada" no tiene CTA para el cliente en `/revisor`.**
  Cuando `faseDeCampana()` retorna `"finalizada"`, la vista del cliente (`src/components/revisor/CampanasCliente.tsx`) no muestra ningún CTA. El fin de campaña es una oportunidad de upsell que se pierde.
  **Sugerencia:** Mostrar un bloque de cierre navy cuando `fase === "finalizada"`:
  ```tsx
  <div className="rounded-xl bg-[#042E7B] text-white p-5 mt-4">
    <p className="font-bold text-sm">Campaña finalizada</p>
    <p className="text-xs opacity-80 mt-1">Esta campaña ya terminó. ¿Planear la siguiente?</p>
    <a href="https://wa.link/5zv0ba" className="mt-3 inline-block bg-[#FFCC00] text-[#042E7B] text-xs font-bold px-4 py-2 rounded-full">
      Hablar con mi asesor
    </a>
  </div>
  ```

- **`feat(proyectos)`: la conversación por escena no notifica al colaborador por correo.**
  `src/app/api/admin/proyectos/[id]/bloques/[bloqueId]/comments/route.ts` inserta el comentario en BD pero no envía correo. El colaborador debe entrar al panel para ver si el admin comentó algo.
  **Sugerencia:** Agregar una llamada al helper SMTP existente (`src/lib/campanas-notify.ts` o equivalente) cuando el admin comenta en un bloque asignado a un colaborador externo.

- **El informe mensual de redes no incluye campañas pagadas como métrica.**
  `src/lib/social-informe.ts` calcula métricas de publicaciones orgánicas, pero las campañas pagadas (`campanas` + `campana_anuncios`) no están integradas. El cliente ve el informe de un mes sin saber cuántas personas vieron el anuncio de GPG.
  **Sugerencia:** Agregar una sección "Campañas pagadas" en `calcularMetricasSitio()` con conteo de campañas activas/finalizadas en el período, y un placeholder para resultados de Meta (cuando se conecte la API).

- **No hay página de error amigable cuando `/api/assistant/chat` falla (503/500).**
  `useChat.ts:104-106`: cuando el fetch falla, muestra el error en texto rojo dentro del chat. En un error 503 (API Key no configurada) el candidato ve "Error al conectar" sin CTA para contactar a Kyoszen.
  **Sugerencia:** En `useChat.ts:104`, distinguir el error 503 con un mensaje con CTA:
  ```ts
  if (res.status === 503) throw new Error("El asistente está en mantenimiento. Escríbenos directo al WhatsApp →");
  ```
  Y en `ChatWidget.tsx`, cuando el texto del error incluye "WhatsApp →", renderizar un link real al número de Kyoszen.
