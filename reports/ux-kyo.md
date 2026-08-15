# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-15
**Cambios analizados (últimas 48 h):** Sin commits nuevos desde el análisis del 2026-08-14. La ejecución anterior generó `chore: ux-kyo analysis 2026-08-14` como el commit más reciente. Se realizó un análisis más profundo del código existente sin cambios nuevos que evaluar.

**Archivos examinados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/lib/campanas.ts`, `src/app/admin/(panel)/campanas/page.tsx`, `src/app/api/admin/proyectos/[id]/bloques/[bloqueId]/comments/route.ts`

---

## Cambios Recientes Detectados
No hay commits nuevos desde ayer. Las 5 mejoras de los commits anteriores (`feat(proyectos)` ×2, `fix(proyectos)`, `fix(seguridad)` ×2, `feat(campanas)`) ya están en producción y no requieren nueva evaluación.

**Estado de las sugerencias del análisis anterior (2026-08-14) — ninguna implementada todavía:**

| Sugerencia | Prioridad | Estado |
|---|---|---|
| Kyo lee JOBS estático, no Supabase | Alta | ⏳ Pendiente |
| Memory leak en `rateLimitMap` | Alta | ⏳ Pendiente |
| Sin notificación en comentarios de Proyectos | Alta | ⏳ Pendiente |
| `navigate_to` acepta cualquier ruta | Media | ⏳ Pendiente |
| localStorage de Kyo sin expiración | Media | ⏳ Pendiente |
| `max_tokens: 1024` puede truncar Paso 5 | Media | ⏳ Pendiente |

---

## Sugerencias de UX

### Alta prioridad

- **Error ortográfico en `ChatWidget.tsx:158` — "Nueva conversacion" sin acento.**
  El CLAUDE.md exige ortografía correcta en español de México. El botón de reset dice `"Nueva conversacion"` sin tilde. El candidato lo ve en cada sesión larga.
  **Cómo arreglarlo:** En `ChatWidget.tsx` línea 158, cambiar a `"Nueva conversación"`. Cambio de 1 carácter.

- **El panel de Kyo es inutilizable en mobile con el teclado virtual abierto.**
  `ChatWidget.tsx:120`: el panel tiene `h-[min(60vh,560px)]`. En un iPhone SE (667px height), el teclado virtual ocupa ~300px → la ventana visible es ~367px y el panel es `0.60 × 667 = 400px` → la mitad del chat queda detrás del teclado. El candidato no puede ver las preguntas de Kyo mientras escribe.
  **Cómo arreglarlo:** Cambiar el panel a usar `100dvh` (dynamic viewport height, que ya descuenta el teclado en iOS 15+):
  ```tsx
  className="fixed bottom-24 right-5 z-[60] w-[min(86vw,360px)]
    h-[min(60dvh,560px)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
  ```
  `dvh` tiene soporte en todos los browsers modernos. Fallback automático a `vh` en navegadores viejos — sin romper nada.

- **Los mensajes de Kyo no renderizan markdown — los asteriscos aparecen literales.**
  `ChatWidget.tsx:227`: el burbuja de Kyo usa `whitespace-pre-wrap` sin ningún parser. Cuando Claude Haiku formatea su Paso 5 como `**1. Cajero/a — Empresa**`, el candidato ve `**1. Cajero/a — Empresa**` en pantalla. Esto ocurre especialmente en listas de vacantes.
  **Cómo arreglarlo:** En `MessageBubble` (línea 217+), reemplazar el `<div>` del texto por un parser mínimo sin dependencia externa:
  ```tsx
  function parsearTexto(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
  }
  // En el JSX:
  <div ... dangerouslySetInnerHTML={{ __html: parsearTexto(message.content) }} />
  ```
  Si se prefiere evitar `dangerouslySetInnerHTML`, usar la librería `marked` (ya disponible en muchos proyectos Next.js) con `sanitize: true`.

### Media prioridad

- **El `TypingIndicator` de Kyo no tiene `aria-label` — no se anuncia en lectores de pantalla.**
  `ChatWidget.tsx:236-256`: el indicador de "Kyo está respondiendo" (los tres puntos animados) no tiene ningún rol accesible. Un candidato con lector de pantalla (JAWS, VoiceOver) no sabe que hay una respuesta en camino y puede pensar que el formulario se colgó.
  **Cómo arreglarlo:** En el `<div>` raíz del `TypingIndicator` agregar:
  ```tsx
  role="status" aria-label="Kyo está escribiendo una respuesta"
  ```
  Son 2 atributos. También aplica al `<div>` del error rojo en línea 148-152.

- **El botón "Enviar" de Kyo no tiene `aria-label` descriptivo cuando está deshabilitado.**
  `ChatWidget.tsx:179-190`: el botón de envío solo tiene `aria-label="Enviar"`. Cuando está deshabilitado (`!input.trim() || isLoading`), los lectores de pantalla no distinguen si está vacío el campo o si está cargando.
  **Cómo arreglarlo:**
  ```tsx
  aria-label={isLoading ? "Enviando mensaje…" : input.trim() ? "Enviar" : "Escribe un mensaje para continuar"}
  ```

- **El historial de Kyo en localStorage no expira — candidatos que regresan meses después ven conversaciones viejas.**
  `useChat.ts:24-33` (`loadHistory`): carga cualquier historial guardado sin verificar antigüedad. Un candidato que chateó en mayo y vuelve en agosto ve el chat anterior como si fuera la sesión activa, y el contexto enviado al modelo tiene vacantes que ya no existen.
  **Cómo arreglarlo:** En `loadHistory()`, después de `const parsed = JSON.parse(raw)` (línea 29):
  ```ts
  const primerMsg = parsed[0];
  const SIETE_DIAS = 7 * 24 * 3600 * 1000;
  if (primerMsg?.timestamp && Date.now() - primerMsg.timestamp > SIETE_DIAS) {
    localStorage.removeItem(STORAGE_KEY);
    return [INITIAL_GREETING];
  }
  ```
  El mensaje de saludo tiene `timestamp: 0` — considera agregar `timestamp: Date.now()` al `INITIAL_GREETING` para que la primera conversación también expire.

- **La `search_jobs` tool filtra `category` con igualdad exacta, pero los valores del tool description no coinciden con los datos de Supabase.**
  `tools.ts:43`: la descripción dice `"Filtra por categoria: Administrativo, Ventas, Operaciones, Atencion al cliente, RRHH"`. Pero `knowledge.ts:139` usa `j.categoria.toLowerCase() === filters.category.toLowerCase()`. Si en Supabase hay una vacante con `categoria = "Operativo"` (en lugar de `"Operaciones"`), el filtro devuelve vacío y Kyo dice que no hay vacantes — aunque sí las hay.
  **Cómo arreglarlo:** Cambiar el filtro en `knowledge.ts:139` a `includes` en lugar de igualdad, o normalizar los valores al insertar desde el admin:
  ```ts
  .filter((j) => !filters?.category || j.categoria.toLowerCase().includes(filters.category.toLowerCase()))
  ```

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[CRÍTICO — no resuelto desde ayer] Kyo lee vacantes del archivo estático `JOBS`, no de Supabase.**
  `knowledge.ts:1`: `import { JOBS } from "@/lib/jobs"`. Las vacantes en Supabase (administradas desde `/admin/vacantes`) son diferentes: tienen empresas distintas (ej. GPG) y campos nuevos como `salario_nota`, `beneficios` y `horario`. Kyo puede recomendar vacantes que ya fueron cerradas o ignorar vacantes nuevas publicadas esta semana.
  **Cómo arreglarlo (definitivo):** En `src/app/api/assistant/chat/route.ts`, línea 136, después de obtener las instrucciones:
  ```ts
  const { data: vacantesVivas } = await sbAdmin
    .from("vacantes")
    .select("id, titulo, empresa, ubicacion, contrato, jornada, salario, salario_nota, activa")
    .eq("activa", true)
    .order("created_at", { ascending: false });
  ```
  Luego pasar `vacantesVivas ?? []` a `buildSystemPrompt(instrucciones, vacantesVivas ?? [])` y adaptar la función para inyectar esa lista en el prompt en lugar del `jobsSummary` del `knowledge`. Sin este cambio, toda la recomendación de vacantes de Kyo es ficción.

- **Kyo no confirma si el candidato ya encontró trabajo antes de continuar el flujo.**
  El flujo asume que todos los que abren Kyo están buscando trabajo activamente. Pero algunos visitan el sitio para preguntar por cursos o por los servicios de la empresa (reclutadores de otras empresas). El Paso 1 pregunta directamente "¿qué tipo de trabajo busca?", lo que puede desorientar a quien llegó por otro motivo.
  **Cómo arreglarlo:** Agregar en `system-prompt.ts` una pregunta de clasificación entre Paso 0 y Paso 1:
  ```
  ## Paso 0b — CLASIFICACIÓN (solo si el usuario no fue claro en su primer mensaje)
  Si el usuario no menciona empleo, pregunta:
  "¿Viene buscando empleo, o tiene alguna otra consulta sobre nuestros servicios?"
  - Candidato: continúa al Paso 1.
  - Empresa / cursos: usa search_courses y deriva a /contacto.
  ```

- **Kyo no informa cuándo es la próxima actualización de vacantes.**
  Cuando no hay vacante compatible (Paso 5, rama "no match"), Kyo ofrece el banco de talentos y navega a `/contacto`. Pero no dice nada sobre cuándo podría haber vacantes nuevas. Un candidato que es rechazado no sabe si vale la pena regresar mañana o en un mes.
  **Cómo arreglarlo:** Agregar en el system-prompt, en el bloque del "no match":
  ```
  Si no hay vacante compatible, añadir: "Publicamos vacantes cada semana. Si deja sus datos,
  le avisamos cuando tengamos algo que encaje con su perfil."
  ```

- **Placeholder del input no orienta al candidato en el primer mensaje.**
  `ChatWidget.tsx:175`: `placeholder="Escribe tu mensaje..."`. Cuando el widget se abre, el saludo de Kyo ya se muestra (preguntando el nombre). El candidato no sabe qué poner. El placeholder debería reflejar lo que se espera.
  **Cómo arreglarlo:**
  ```tsx
  const esPrimerMensaje = messages.length <= 1;
  // ...
  placeholder={esPrimerMensaje ? "Escribe tu nombre aquí…" : "Escribe tu respuesta…"}
  ```

### Nuevas tools o capacidades recomendadas

- **Tool `register_candidate_interest` — evitar que el candidato repita su perfil en `/contacto`.**
  En el Paso 5 sin vacante compatible, Kyo navega a `/contacto` y el candidato debe volver a escribir todo su perfil (nombre, puesto, zona, disponibilidad) en el formulario. La conversación ya tiene esos datos.
  **Cómo implementar:** En `tools.ts`, agregar:
  ```ts
  {
    name: "register_candidate_interest",
    description: "Registra el perfil del candidato en la base de talentos de Kyoszen. Usa esto ANTES de navegar a /contacto cuando no hay vacante compatible.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        tipo_puesto: { type: "string" },
        experiencia_anios: { type: "number" },
        ubicacion: { type: "string" },
        jornada: { type: "string" },
      },
      required: ["nombre", "tipo_puesto"],
    },
  }
  ```
  En `executeTool()`, hacer un `INSERT` en `contactos` (o una tabla `banco_talentos`). El candidato llega a `/contacto` con un mensaje de confirmación en lugar de un formulario vacío.

- **Tool `get_faq` dinámica — las FAQs editadas desde el admin llegarían a Kyo.**
  La tabla `kyo_faqs` (editable desde `/admin/kyo`) existe pero nunca se consulta en producción. `buildSystemPrompt()` usa las 5 FAQs hardcodeadas de `COMPANY.faqs` en `knowledge.ts`. Si el admin agrega "¿Tienen vacantes de medio tiempo para estudiantes?", Kyo nunca lo sabe.
  **Cómo implementar:** En `route.ts`, junto al fetch de `kyo_config`:
  ```ts
  const { data: faqsVivas } = await sbAdmin
    .from("kyo_faqs")
    .select("pregunta, respuesta")
    .eq("activa", true);
  ```
  Pasar `faqsVivas` a `buildSystemPrompt` e inyectarlas en el bloque `# FAQs` del prompt. Cachear con el mismo TTL de 60s.

### Problemas detectados

- **`rateLimitMap` crece indefinidamente en memoria — potencial OOM en el VPS.**
  `route.ts:68`: `const rateLimitMap = new Map<string, ...>()` nunca se purga. Cada IP única agrega una entrada que queda en memoria para siempre (el `resetAt` solo controla el contador, no la eliminación). Después de semanas de tráfico real, la RAM del proceso Next.js puede crecer varios MB.
  **Cómo arreglarlo:** Al inicio de `checkRateLimit()` (línea 72), purgar entradas vencidas cuando el Map supere 500 entradas:
  ```ts
  if (rateLimitMap.size > 500) {
    for (const [ip, e] of rateLimitMap) if (e.resetAt < now) rateLimitMap.delete(ip);
  }
  ```

- **`navigate_to` acepta cualquier ruta sin validación — Kyo puede enviar candidatos a `/admin` o `/revisor`.**
  `tools.ts:106-113`: el resultado de `navigate_to` se devuelve tal cual, y `useChat.ts:127` ejecuta `router.push(target.path)` con cualquier string. Si Claude Haiku alucina `/admin/vacantes`, el candidato llega a la pantalla de login del panel CMS.
  **Cómo arreglarlo:** En `executeTool()`, antes del return:
  ```ts
  const ALLOWED_PREFIXES = ["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto", "/blog"];
  const ok = ALLOWED_PREFIXES.some(p => (input.path as string) === p || (input.path as string).startsWith(p + "?") || (input.path as string).startsWith(p + "/"));
  if (!ok) return JSON.stringify({ error: "Ruta no permitida" });
  ```

- **El `INITIAL_GREETING` tiene `timestamp: 0` — la expiración de 7 días nunca funcionará para él.**
  `useChat.ts:17-22`: el saludo inicial tiene `timestamp: 0`. Si la lógica de expiración (sugerida ayer) verifica `parsed[0].timestamp` y el primer mensaje es siempre el saludo con `timestamp: 0`, la condición `Date.now() - 0 > 7_días` siempre es `true` — el historial NUNCA persiste entre sesiones.
  **Cómo arreglarlo:** Cambiar el `INITIAL_GREETING` para que `timestamp` sea `Date.now()` al crearlo, no `0`. O hacer que `loadHistory` evalúe el `timestamp` del primer mensaje de usuario, no del saludo:
  ```ts
  const primerMensajeUsuario = parsed.find(m => m.role === "user");
  if (primerMensajeUsuario && Date.now() - primerMensajeUsuario.timestamp > SIETE_DIAS) {
    localStorage.removeItem(STORAGE_KEY);
    return [INITIAL_GREETING];
  }
  ```

---

## Oportunidades de mejora general

- **El widget de Kyo se cierra al navegar y no se reabre automáticamente en la nueva página.**
  Cuando Kyo ejecuta `navigate_to`, el router navega en 700ms (`useChat.ts:127`). El widget se cierra porque `ChatWidget` se desmonta en la nueva ruta. El candidato que acaba de ver sus vacantes recomendadas tiene que volver a abrir Kyo para continuar la conversación.
  **Cómo arreglarlo:** En `useChat.ts`, cuando `data.navigations.length > 0` (línea 124):
  ```ts
  sessionStorage.setItem("kyo_auto_open", "1");
  ```
  En `ChatWidget.tsx`, en el `useEffect` de mount (línea 15):
  ```ts
  useEffect(() => {
    if (sessionStorage.getItem("kyo_auto_open")) {
      setOpen(true);
      sessionStorage.removeItem("kyo_auto_open");
    }
  }, []);
  ```

- **No hay analytics de qué paso del flujo abandona el candidato.**
  `site_eventos` registra `kyo_mensaje` por volumen total, pero no paso a paso. No se sabe si el cuello de botella es "¿cuánta experiencia tiene?" (Paso 2) o "¿le gustaría aplicar?" (Paso 6). Sin esto, no hay base para optimizar el flujo.
  **Cómo arreglarlo:** En `route.ts`, inferir el paso actual con el conteo de mensajes del historial y registrar:
  ```ts
  const paso = history.filter(m => m.role === "user").length; // 1=nombre, 2=puesto, etc.
  await sbAdmin.from("site_eventos").insert({ tipo: "kyo_paso", valor: String(paso), session_id: body.sessionId });
  ```

- **Las FAQs del admin no llegan dinámicamente a Kyo — ya documentado ayer, sigue sin resolverse.**
  `buildSystemPrompt()` usa `company.faqs` del objeto hardcodeado. La tabla `kyo_faqs` es completamente ignorada en producción. Ver sugerencia "Tool `get_faq`" arriba para la solución completa.

- **`max_tokens: 1024` puede truncar la respuesta de Kyo en el Paso 5 de conversaciones largas.**
  `route.ts:150`: el Paso 5 con 3 vacantes, texto introductorio y pregunta de cierre usa ~200 tokens de salida. En conversaciones con herramienta (tool-use overhead suma ~150 tokens de contexto por iteración), el modelo puede quedarse sin tokens. El candidato recibe una respuesta cortada sin aviso.
  **Cómo arreglarlo:** Cambiar `max_tokens: 1024` a `max_tokens: 1536`. El modelo es Haiku, el incremento de costo por mensaje es < $0.001.

- **Panel de campañas finalizadas no tiene CTA de upsell para el cliente.**
  En `CampanasCliente.tsx`, cuando `esFinalizada(campana) === true`, el cliente ve los resultados pero no hay ningún mensaje de cierre ni botón de acción. Es el momento natural para sugerir la siguiente campaña.
  **Cómo arreglarlo:** Agregar debajo del panel de resultados un bloque navy con:
  ```tsx
  <div className="mt-6 rounded-2xl bg-[#042E7B] px-6 py-5 text-white text-center">
    <p className="font-bold text-lg mb-3">Esta campaña ya finalizó. ¿Lista para la siguiente?</p>
    <a href="https://wa.link/5zv0ba" target="_blank" rel="noopener noreferrer"
       className="inline-block rounded-full bg-[#FFCC00] text-[#042E7B] font-black px-6 py-2.5 text-sm">
      Hablar con Kyoszen
    </a>
  </div>
  ```
