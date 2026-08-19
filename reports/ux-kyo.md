# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-19
**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/app/admin/(panel)/proyectos/page.tsx`
- `src/components/revisor/CampanasCliente.tsx` (inferido de los commits)

---

## Cambios Recientes Detectados

No hay commits de código nuevo desde 2026-08-13. El trunk tiene solo reportes automatizados. Los últimos commits reales analizados:

| Commit | Descripción |
|---|---|
| `460b1f3` | `feat(proyectos)`: etapa dice cuánto material llegó (`conMaterial`) |
| `46c41c1` | `fix(proyectos)`: pedir cambios no obliga a repetir el motivo |
| `2cffce9` | `feat(proyectos)`: conversación admin ↔ colaborador por escena |
| `287dca3` | `fix(seguridad)`: subidor de archivos sin sección fija |
| `d8fa46d` | `feat(campanas)`: campaña terminada se muestra finalizada |
| `32cc319` | `fix(seguridad)`: exigir sesión y permisos en todo el panel (51 rutas) |
| `97dff99` | `fix(seguridad)`: sin perfil de panel no se entra |
| `e9d9390` | `feat(proyectos)`: arte lo aprueba Kyoszen, no el cliente |

---

## Rastreador de sugerencias — estado acumulado

| # | Sugerencia | Prioridad | Estado | Días abierto |
|---|---|---|---|---|
| 1 | Kyo lee `jobs.ts` estático, no Supabase | **Alta** | ⏳ Pendiente | 7 días |
| 2 | Memory leak en `rateLimitMap` sin limpieza | **Alta** | ⏳ Pendiente | 7 días |
| 3 | `navigate_to` acepta cualquier ruta (riesgo seguridad) | **Alta** | ⏳ Pendiente | 7 días |
| 4 | `saveConversation` guarda solo los últimos 20 mensajes | Media | ⏳ Pendiente | 7 días |
| 5 | `localStorage` del chat sin TTL — flujo se rompe al regresar | Media | ⏳ Pendiente | 7 días |
| 6 | `max_tokens: 1024` puede truncar el Paso 5 | Media | ⏳ Pendiente | 7 días |
| 7 | Panel de Kyo inutilizable en mobile con teclado virtual (`vh` → `dvh`) | Media | ⏳ Pendiente | 7 días |
| 8 | Markdown de Kyo no se renderiza (asteriscos literales) | Media | ⏳ Pendiente | 7 días |
| 9 | "Nueva conversacion" sin tilde en `ChatWidget.tsx:161` | Baja | ⏳ Pendiente | 7 días |
| 10 | Campaña finalizada sin CTA de upsell en `/revisor` | Baja | ⏳ Pendiente | 4 días |
| 11 | Comentarios de escena no notifican por correo al colaborador | Baja | ⏳ Pendiente | 4 días |

---

## Nuevos hallazgos de esta sesión

### Bug confirmado: `sessionStorage` para session ID vs `localStorage` para mensajes — inconsistencia

**Archivo:** `src/components/assistant/useChat.ts:45-53` y `:14`

`getSessionId()` usa `sessionStorage` (se reinicia al cerrar la pestaña), pero el historial de mensajes usa `localStorage` (persiste entre sesiones). Resultado en producción:

- Candidato visita el lunes, escribe su nombre, avanza al Paso 3.
- El martes abre el sitio de nuevo: ve la conversación anterior (bien), pero con un **nuevo session ID**.
- El admin en `/admin/kyo` ve dos filas separadas para el mismo candidato, sin poder saber que son la misma persona.

**Cómo arreglarlo:** En `useChat.ts:45`, cambiar `sessionStorage` por `localStorage` para el session ID:
```ts
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let sid = localStorage.getItem("kyo_session_id"); // antes: sessionStorage
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem("kyo_session_id", sid); // antes: sessionStorage
  }
  return sid;
}
```
Con este cambio, el mismo candidato acumula su conversación bajo un solo ID persistente hasta que llame a `reset()`.

---

### Bug de UX: navegación de Kyo cierra el chat sin transición visible

**Archivo:** `src/components/assistant/useChat.ts:124-128`

Cuando Kyo llama `navigate_to`, el frontend ejecuta `router.push(target.path)` con 700 ms de delay. La navegación cambia la página y el widget de chat desaparece abruptamente. El candidato no sabe si el chat se cerró por error o si llegó a donde Kyo lo mandó.

**Cómo arreglarlo:** En `ChatWidget.tsx`, mostrar una burbuja transitoria antes de navegar:
```tsx
// En sendMessage, antes de router.push:
const navMsg: ChatMessage = {
  id: `nav-${Date.now()}`,
  role: "assistant",
  content: `📍 Te estoy llevando a ${target.path === "/contacto" ? "la página de contacto" : target.path}...`,
  timestamp: Date.now(),
};
setMessages(prev => [...prev, navMsg]);
```
Esto da al candidato contexto de que la navegación es intencional y no una falla del chat.

---

### Hallazgo: el filtro `?marca=` del system-prompt apunta a empresas placeholder

**Archivo:** `src/lib/assistant/system-prompt.ts:87`

El `DEFAULT_INSTRUCCIONES` lista valores para el filtro `?marca=`:
```
valores: Grupo Corpora, Logistica Norte, Sigma Retail, Clinica Vitalis, Finanzas MX, Contact Nova
```

Estos son nombres de ejemplo hardcodeados. Si Kyo usa `navigate_to({ path: "/vacantes?marca=Sigma Retail" })`, el sitio público no va a encontrar nada (las vacantes reales en Supabase tienen empresas como "Confidencial" o nombres reales de clientes de Kyoszen).

**Cómo arreglarlo:** Actualizar la lista de marcas en el DEFAULT_INSTRUCCIONES con los valores reales de Supabase (o eliminar el filtro `?marca=` y reemplazar por `?q=` que es texto libre y sí funciona).

---

### Hallazgo: `INITIAL_GREETING.timestamp = 0` puede confundir el futuro TTL

**Archivo:** `src/components/assistant/useChat.ts:22`

El greeting inicial tiene `timestamp: 0`. Cuando se implemente el TTL de 24h (sugerencia #5), cualquier lógica `m.timestamp > hace24h` eliminaría el greeting (0 > cualquier tiempo reciente = false). El reporte anterior sugirió `|| m.id === "greeting"` como guard. Confirmar que se incluya esa excepción al implementar el TTL.

---

## Sugerencias de UX (anteriores no implementadas)

### Alta prioridad

- **Sugerencia #1 — Kyo lee `jobs.ts` estático, no Supabase — vacantes incorrectas.**
  `src/lib/assistant/knowledge.ts`: `StaticKnowledgeProvider.listJobs()` lee de `JOBS` en `src/lib/jobs.ts`. Si el admin agrega, desactiva o edita una vacante en `/admin/vacantes`, Kyo la sigue mostrando (o no la muestra) incorrectamente.
  **Cómo arreglarlo:** En `knowledge.ts`, reemplazar `listJobs()` con una consulta a Supabase:
  ```ts
  async listJobs(filters) {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    let q = sb.from("vacantes")
      .select("id, titulo, empresa, ubicacion, contrato, jornada, salario, salario_nota, desc")
      .eq("activa", true);
    if (filters?.location) q = q.ilike("ubicacion", `%${filters.location}%`);
    if (filters?.query)    q = q.or(`titulo.ilike.%${filters.query}%,desc.ilike.%${filters.query}%`);
    const { data } = await q.order("created_at", { ascending: false });
    return (data ?? []).map(j => ({
      id: j.id, titulo: j.titulo, empresa: j.empresa ?? "Confidencial",
      categoria: "Operativo", ubicacion: j.ubicacion, contrato: j.contrato,
      jornada: j.jornada, salario: j.salario, desc: j.desc ?? "",
    }));
  }
  ```
  La interfaz `KnowledgeProvider` ya está preparada para este cambio (línea 166 `knowledge.ts`).

- **Sugerencia #2 — `rateLimitMap` crece sin límite en memoria.**
  `src/app/api/assistant/chat/route.ts:68`: Map acumula una entrada por IP indefinidamente.
  **Cómo arreglarlo:** En `checkRateLimit`, agregar limpieza probabilística:
  ```ts
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitMap) if (v.resetAt < now) rateLimitMap.delete(k);
  }
  ```

- **Sugerencia #3 — `navigate_to` no valida la ruta — Kyo podría navegar a `/admin`.**
  `src/lib/assistant/tools.ts:105`: sin lista blanca de rutas.
  **Cómo arreglarlo:** En `executeTool`, antes de `return JSON.stringify({ navigated: true ... })`:
  ```ts
  const RUTAS_PERMITIDAS = ["/", "/vacantes", "/cursos", "/nosotros", "/servicios", "/contacto", "/blog"];
  const valida = RUTAS_PERMITIDAS.some(r =>
    path === r || path.startsWith(r + "?") || path.startsWith(r + "/")
  );
  if (!valida) return JSON.stringify({ error: "Ruta no permitida" });
  ```

### Media prioridad

- **Sugerencia #4 — `saveConversation` guarda solo los últimos 20 mensajes.**
  `src/app/api/assistant/chat/route.ts:205`: se pasa `history` (slice de 20) en vez de `body.messages`. Admin ve conversaciones truncadas.
  **Cómo arreglarlo:** `route.ts:205` → pasar `body.messages` a `saveConversation` en vez de `history`.

- **Sugerencia #5 — Historial de Kyo sin TTL — flujo roto al regresar días después.**
  `src/components/assistant/useChat.ts:29`: `loadHistory()` carga mensajes sin revisar timestamp.
  **Cómo arreglarlo:** Agregar filtro en `loadHistory()`:
  ```ts
  const hace24h = Date.now() - 24 * 60 * 60 * 1000;
  const recientes = parsed.filter(m => m.id === "greeting" || m.timestamp > hace24h);
  return recientes.length > 1 ? recientes : [INITIAL_GREETING];
  ```

- **Sugerencia #6 — `max_tokens: 1024` puede truncar el Paso 5.**
  `src/app/api/assistant/chat/route.ts:152`: subir a 2048. Costo incremental Haiku ≈ $0.0003/mensaje.

- **Sugerencia #7 — Panel de Kyo inutilizable en mobile con teclado virtual.**
  `src/components/assistant/ChatWidget.tsx:120`: cambiar `h-[min(60vh,560px)]` por `h-[min(60dvh,560px)]`.

- **Sugerencia #8 — Markdown de Kyo no se renderiza — asteriscos literales.**
  `src/components/assistant/ChatWidget.tsx` → `MessageBubble`: aplicar parser inline mínimo en burbujas del asistente:
  ```tsx
  function parsearMd(text: string) {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/\n/g, "<br/>");
  }
  // En MessageBubble (solo rol assistant):
  <div dangerouslySetInnerHTML={{ __html: parsearMd(message.content) }} />
  ```

### Baja prioridad

- **Sugerencia #9 — Falta tilde: "Nueva conversacion" en `ChatWidget.tsx:161`.**
  Cambiar a `"Nueva conversación"`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 3 (ubicación) usa comparación exacta — no encuentra candidatos de municipios.**
  `src/lib/assistant/knowledge.ts:140`: `.toLowerCase() === filters.location.toLowerCase()` falla si el usuario escribe "Ecatepec", "Neza" o "CDMX Iztapalapa".
  **Cómo arreglarlo — dos cambios:**
  1. `knowledge.ts:140` → `.toLowerCase().includes(filters.location.toLowerCase())`
  2. En `tools.ts`, normalizar la ubicación antes de llamar `listJobs`:
     ```ts
     function normalizarUbicacion(raw: string): string {
       const low = raw.toLowerCase();
       const cdmx  = ["cdmx", "ciudad de mexico", "df", "iztapalapa", "benito juarez", "coyoacan"];
       const edomex = ["edomex", "estado de mexico", "ecatepec", "naucalpan", "texcoco", "neza", "toluca"];
       if (cdmx.some(k  => low.includes(k))) return "CDMX";
       if (edomex.some(k => low.includes(k))) return "Estado de Mexico";
       return raw;
     }
     ```

- **El flujo para empresas no captura datos — pierde leads calificados.**
  `src/lib/assistant/system-prompt.ts:65`: "Si es una empresa: sugiere WhatsApp o navega a /contacto." Sin preguntas previas, el formulario de `/contacto` no diferencia empresa de candidato.
  **Cómo mejorarlo:** Agregar en `DEFAULT_INSTRUCCIONES` un flujo empresa mínimo:
  ```
  ## Flujo para empresas (quien necesita contratar, no busca trabajo)
  1. Pregunta qué puesto(s) necesita cubrir.
  2. Pregunta cuántos candidatos y en qué plazo.
  3. Navega a /contacto: "Ya tengo tu información, un asesor te contactará en menos de 24 horas."
  ```

- **No hay manejo de cierre voluntario — "gracias, ya encontré trabajo" recibe respuesta genérica.**
  Agregar en `DEFAULT_INSTRUCCIONES`:
  ```
  ## Cierre voluntario
  Si el usuario dice "gracias", "adiós", "ya no" o indica que ya no necesita ayuda:
  Responde con calidez, deséale éxito y ofrece volver cuando lo necesite. No navegues a ninguna página.
  ```

### Nuevas tools o capacidades recomendadas

- **Tool: `start_application` — aplicar desde Kyo sin salir del chat.**
  Kyo navega a `/vacantes/[id]` y el candidato debe rellenar el formulario. La tasa de abandono sube por el cambio de contexto.
  **Propuesta:** `start_application({ job_id, name, whatsapp })` que llame a `POST /api/aplicar` (ya existe) con los datos recopilados en el flujo de 6 pasos. Kyo solo necesitaría pedir el WhatsApp o correo para completar la aplicación sin salir del chat.

- **Tool: `save_to_talent_bank` — registrar candidato sin vacante compatible.**
  El Paso 5 navega a `/contacto` cuando no hay vacante. El formulario genérico no captura los datos estructurados que Kyo ya tiene (puesto, zona, jornada).
  **Propuesta:** Tool `save_candidate({ name, puesto, ubicacion, jornada, whatsapp })` que inserte en `aplicaciones` con `estado='banco_talentos'`. Kyo ya tiene los primeros 4 datos; solo preguntaría el contacto.

### Problemas detectados (bugs)

- **BUG — `saveHistory` corre con `messages = []` en el primer render.**
  `useChat.ts:70`: cuando el componente monta, `initialized.current` se pone en `true` sincrónicamente dentro del primer `useEffect`, y el segundo `useEffect` (guardar) se ejecuta en el mismo ciclo con `messages = []` (valor inicial antes de `setMessages`). Resultado: `localStorage` se vacía brevemente.
  **Cómo arreglarlo:** Usar un segundo `useRef` dedicado a la carga completada:
  ```ts
  const historyCargado = useRef(false);
  // En useEffect de carga, después de setMessages(loadHistory()):
  historyCargado.current = true;
  // En useEffect de guardado:
  if (!historyCargado.current) return;
  saveHistory(messages);
  ```

- **BUG — `saveConversation` recibe `history` (20 mensajes) en vez del historial completo.**
  `route.ts:205`: la función `saveConversation(body.sessionId, history, ...)` pasa el slice de 20, no `body.messages`. Conversaciones de más de 20 turnos llegan truncadas al admin en `/admin/kyo`.

- **BUG — `sessionStorage` para session ID se reinicia al cerrar la pestaña** *(nuevo esta sesión).*
  `useChat.ts:46`: `sessionStorage.getItem("kyo_session_id")` crea un ID nuevo cada vez que el candidato abre el sitio en una pestaña nueva. El admin ve múltiples sesiones para el mismo candidato. Ver "Nuevos hallazgos" arriba para el fix.

- **BUG — Navegación de Kyo sin transición visual** *(nuevo esta sesión).*
  `useChat.ts:127`: `router.push(target.path)` cambia la página y el widget desaparece sin aviso. Ver "Nuevos hallazgos" arriba para el fix.

---

## Oportunidades de mejora general

- **Sugerencia #10 — Campaña finalizada sin CTA de upsell en `/revisor`.**
  `src/components/revisor/CampanasCliente.tsx`: cuando `faseDeCampana()` devuelve `"finalizada"`, no hay CTA. El fin de campaña es el mejor momento para proponer la siguiente.
  **Sugerencia:** Agregar bloque de cierre cuando `fase === "finalizada"`:
  ```tsx
  <div className="rounded-xl bg-[#042E7B] text-white p-5 mt-4">
    <p className="font-bold text-sm">Campaña finalizada</p>
    <p className="text-xs opacity-80 mt-1">¿Planear la siguiente campaña?</p>
    <a href="https://wa.link/5zv0ba"
       className="mt-3 inline-block bg-[#FFCC00] text-[#042E7B] text-xs font-bold px-4 py-2 rounded-full">
      Hablar con mi asesor
    </a>
  </div>
  ```

- **Sugerencia #11 — Conversación por escena no notifica al colaborador por correo.**
  `src/app/api/admin/proyectos/[id]/bloques/[bloqueId]/comments/route.ts`: inserta comentario en BD sin enviar correo. El colaborador no sabe que el admin respondió.
  **Sugerencia:** Agregar `await enviarCorreo(...)` (usando `nodemailer` + SMTP de `site_config`) cuando el comentador es "Kyoszen" (admin) para notificar al colaborador del proyecto.

- **Filtro `?marca=` en system-prompt apunta a empresas placeholder** *(nuevo esta sesión).*
  `src/lib/assistant/system-prompt.ts:87`: los valores de `?marca=` son nombres de ejemplo que no existen en la BD real de Supabase. Ver "Nuevos hallazgos" arriba para el fix.

- **El error 503 (API key no configurada) muestra texto técnico sin CTA de contacto.**
  `useChat.ts:104-106`: cuando `/api/assistant/chat` devuelve 503, el candidato ve "El asistente aún no está configurado" sin ninguna alternativa.
  **Sugerencia:** En `useChat.ts:104`, diferenciar el 503:
  ```ts
  if (res.status === 503) {
    throw new Error("El asistente está en mantenimiento. Escríbenos por WhatsApp →");
  }
  ```
  Y en `ChatWidget.tsx`, cuando el error incluye "WhatsApp →", renderizar un enlace real a `https://wa.link/5zv0ba`.

- **Informe mensual de redes no incluye métricas de campañas pagadas.**
  `src/lib/social-informe.ts`: `calcularMetricasSitio()` no consulta `campanas` ni `campana_anuncios`. El cliente ve el informe sin saber el alcance del anuncio de GPG.
  **Sugerencia:** Agregar sección "Campañas pagadas" con conteo de campañas activas/finalizadas en el período, y placeholder para resultados de Meta (Fase 2).
