# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-06
**Commits analizados (últimos 5):**
- `885ed30` — chore: ux-kyo analysis 2026-08-05 (sin cambios de código)
- `278903b` — chore: reporte de tendencias Agosto 2026 (sin cambios de código)
- `20b13ac` — fix(proyectos): notificaciones confiables (await + log)
- `c6ce339` — feat(admin): acceso por proyecto para colaboradores
- `0dc92f7` — feat(admin): roles + gestión de usuarios con login por usuario

**Archivos del asistente revisados:**
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/app/admin/(panel)/layout.tsx`
- `src/app/admin/(panel)/usuarios/page.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/admin/(panel)/kyo/page.tsx`

---

## Cambios Recientes Detectados

No hubo commits de código entre el 2026-08-05 y hoy. Los últimos cambios funcionales siguen siendo los del 2026-08-03:
- **Sistema de roles** (`admin|colaborador`) con acceso por sección y proyecto asignado
- **Login por username** (sin correo real, resuelve `usuario → @acceso.kyoszen.com`)
- **Notificaciones de proyectos** ahora usan `await` en lugar de fire-and-forget

**Estado de issues previos**: Todos los issues reportados en el ciclo 2026-08-05 siguen sin corregirse. Se listan al final con estado `[PENDIENTE]`.

---

## Sugerencias de UX

### Alta prioridad

- **[knowledge.ts:96-106] `kyo_faqs` de Supabase desconectadas de Kyo — BUG CRÍTICO**
  El admin puede agregar/editar preguntas frecuentes en `/admin/kyo` → pestaña "Preguntas frecuentes", que se guardan en la tabla `kyo_faqs`. Sin embargo, `StaticKnowledgeProvider.getCompanyInfo()` devuelve FAQs **hardcodeadas en el código** (líneas 99-106 de `knowledge.ts`), nunca leyendo de Supabase. Resultado: editar FAQs desde el admin **no tiene ningún efecto en Kyo**. La pestaña entera de FAQs en el panel es decorativa desde la perspectiva del asistente.
  Solución en `src/app/api/assistant/chat/route.ts`: cargar las FAQs activas de `kyo_faqs` junto con las instrucciones y pasarlas al `buildSystemPrompt`:
  ```typescript
  // En getStoredInstrucciones() o una función nueva getFaqs():
  const { data: faqsData } = await sb
    .from("kyo_faqs")
    .select("pregunta, respuesta")
    .eq("activo", true)
    .order("orden");
  // Pasar a buildSystemPrompt como argumento adicional
  ```
  Y en `knowledge.ts`, reemplazar las FAQs hardcodeadas en `COMPANY.faqs` con las cargadas dinámicamente. Alternativamente, inyectarlas directamente en el system prompt tras el bloque `# FAQs` ya existente. Impacto: el admin puede actualizar lo que Kyo responde sin tocar código.

- **[layout.tsx:80-84] `cargarAcceso()` no carga `nombre` ni `usuario` del perfil**
  El select es `.select("rol, secciones, activo")` (líneas 80-84). El footer del sidebar muestra `user?.email` (línea 268), que para colaboradores con login por username es el correo sintético `nombre@acceso.kyoszen.com` — correo que el colaborador nunca vio. Dos fixes simultáneos:
  ```typescript
  // layout.tsx — en el select:
  .select("rol, secciones, activo, nombre, usuario")
  // Añadir estado:
  const [displayName, setDisplayName] = useState("");
  // En cargarAcceso(), tras setPerfil(acceso):
  setDisplayName(data?.nombre || data?.usuario || session.user.email || "");
  // En el footer (línea 268):
  <p className="text-white/40 text-[11px] truncate">{displayName}</p>
  ```
  Impacto: un colaborador llamado "Carlos García" verá su nombre, no `carlos.garcia@acceso.kyoszen.com`.

- **[layout.tsx:96-99] Colaborador desactivado no sabe por qué no puede entrar**
  Cuando `!acceso.activo`, el layout ejecuta signOut y redirige a `/admin/login` sin ningún mensaje (líneas 96-99). La página de login no muestra ningún error. El colaborador cree que olvidó su contraseña cuando en realidad su cuenta fue desactivada. Fix: añadir query param al redirect:
  ```typescript
  router.replace("/admin/login?error=cuenta-inactiva");
  ```
  Y en `login/page.tsx`, leer el param y mostrar el mensaje:
  ```typescript
  const params = useSearchParams();
  const errorParam = params.get("error");
  // En el JSX, sobre el formulario:
  {errorParam === "cuenta-inactiva" && (
    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-[13px] px-4 py-3 rounded-lg">
      Tu cuenta ha sido desactivada. Contacta al administrador.
    </div>
  )}
  ```

- **[useChat.ts:30 + useChat.ts:14-16] Historia truncada pero Kyo no sabe que la perdió**
  `localStorage` guarda hasta `MAX_STORED = 30` mensajes; el API route recibe solo los últimos 20 (`history = body.messages.slice(-20)`). En conversaciones largas, Kyo pierde los primeros 10 mensajes — que incluyen el nombre del candidato (Paso 0) y el tipo de trabajo que busca (Paso 1). Resultado: Kyo vuelve a preguntar el nombre o ignora contexto ya dado. Solución de mínima: reducir `MAX_STORED` a 20 para evitar la ilusión de que hay más contexto del que el API recibe. Solución completa: conservar el nombre y el puesto en un campo separado en `sessionStorage` y anteponer un resumen al inicio de los mensajes enviados a la API:
  ```typescript
  // En sendMessage(), antes del fetch:
  const contexto = sessionStorage.getItem("kyo_contexto"); // "Nombre: Ana, Busca: cajera"
  const mensajesConContexto = contexto
    ? [{ role: "user" as const, content: `[Contexto previo: ${contexto}]` }, ...history]
    : history;
  ```

### Media prioridad

- **[useChat.ts:139-145] `reset()` no limpia el session ID de Supabase**
  Al hacer "Nueva conversación", se borra el localStorage pero `sessionStorage.getItem("kyo_session_id")` sigue igual (línea 139-145). Todos los mensajes posteriores se guardan en `kyo_conversaciones` bajo el mismo `session_id` que la conversación anterior. En `/admin/kyo` → Conversaciones, la "nueva" conversación aparece concatenada con la anterior. Fix:
  ```typescript
  const reset = useCallback(() => {
    setMessages([INITIAL_GREETING]);
    setError(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem("kyo_session_id"); // ← nuevo
    }
  }, []);
  ```

- **[kyo/page.tsx:230] `confirm()` nativo para eliminar FAQs**
  La función `eliminarFaq` usa `window.confirm()` (línea 230) igual que el borrado de usuarios. Reemplazar con confirmación inline sobre la tarjeta de la FAQ:
  ```tsx
  const [confirmDeleteFaqId, setConfirmDeleteFaqId] = useState<number | null>(null);
  // En la tarjeta:
  {confirmDeleteFaqId === faq.id ? (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-red-700 font-bold">¿Eliminar?</span>
      <button onClick={() => { eliminarFaqConfirmado(faq.id); setConfirmDeleteFaqId(null); }}
        className="text-red-700 font-black">Sí</button>
      <button onClick={() => setConfirmDeleteFaqId(null)} className="text-muted">No</button>
    </div>
  ) : (
    <button onClick={() => setConfirmDeleteFaqId(faq.id)}>Eliminar</button>
  )}
  ```

- **[kyo/page.tsx:407] El contador de FAQs dice "activas" pero Kyo no las usa**
  La pestaña muestra `"{faqs.filter(f => f.activo).length} activas · {faqs.length} total"` (línea 407). Hasta que `knowledge.ts` lea de `kyo_faqs`, esta UI promete algo que no ocurre. Añadir un aviso debajo del contador:
  ```tsx
  <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2">
    Las FAQs se guardan correctamente, pero Kyo aún las lee del código fuente.
    Pide al equipo técnico que conecte <code>kyo_faqs</code> al asistente.
  </p>
  ```
  Impacto inmediato: el admin entiende que su edición aún no tiene efecto, evita confusión.

- **[ChatWidget.tsx:154-164] Botón "Nueva conversacion" visible solo tras 2 mensajes, umbral incorrecto**
  La condición `messages.length > 2` (línea 154) cuenta el saludo inicial (mensaje 1) más el primer mensaje del usuario (mensaje 2) = 2. Con 2 mensajes el botón ya aparece — demasiado pronto, antes de que la conversación tenga contexto real. Cambiar a `> 4` para que aparezca después de al menos 2 intercambios completos. Adicionalmente, el texto sigue siendo `"Nueva conversacion"` sin tilde — corregir a `"Nueva conversación"`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[system-prompt.ts:52] Paso 5 navega con filtros antes de mostrar recomendaciones**
  La instrucción en Paso 5 dice "Usa `navigate_to` con `/vacantes` y los filtros que mejor correspondan" (línea 58). Pero el formato de respuesta correcto del Paso 5 (líneas 44-51) primero muestra 2-3 vacantes con texto, y *después* navega. El orden puede invertirse si Kyo interpreta la instrucción de `navigate_to` antes de mostrar el texto. Clarificar el orden explícitamente:
  ```
  ## Paso 5 — RECOMENDACIÓN
  1. PRIMERO: muestra las 2-3 vacantes más compatibles con el formato de texto indicado.
  2. DESPUÉS: llama a navigate_to con los filtros correspondientes al perfil.
  Nunca llames navigate_to antes de mostrar las recomendaciones escritas.
  ```

- **[system-prompt.ts:65-69] Manejo de empresas sin flujo claro**
  Cuando una empresa pregunta (no candidato), la instrucción dice "Responde: 'Con gusto te conecto con nuestro equipo' y sugiere WhatsApp o navega a /contacto" (líneas 65-67). Kyo no diferencia entre candidato y empresa en ningún paso previo del flujo — el saludo no pregunta si es candidato o empresa. Añadir una bifurcación temprana:
  ```
  ## Paso 0b — TIPO DE USUARIO (después del nombre)
  Si de la primera respuesta del usuario queda claro que es una EMPRESA (busca contratar, cotizar, capacitar a su equipo), salta directamente al flujo de empresa:
  "Mucho gusto, [nombre]. ¿Me puede comentar qué servicio le interesa explorar con Kyoszen?"
  Luego navega a /servicios o /contacto según corresponda.
  Si es un CANDIDATO (busca empleo, trabajo, vacante), continúa al Paso 1 normal.
  ```

- **[knowledge.ts:136-152] `listJobs()` no tiene filtro por `jornada` o `contrato`**
  La tool `search_jobs` acepta `category`, `location` y `query` como filtros (líneas 38-46 de `tools.ts`), pero el Paso 4 del flujo recoge la `jornada` (tiempo completo / medio tiempo). Kyo no puede filtrar vacantes por ese atributo porque la tool no lo soporta. Añadir filtro en `tools.ts` y en `knowledge.ts`:
  ```typescript
  // tools.ts — en search_jobs input_schema:
  schedule: { type: "string", description: "Filtra por jornada: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" },
  contract: { type: "string", description: "Filtra por contrato: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" },
  // knowledge.ts — en listJobs():
  .filter((j) => !filters?.schedule || j.jornada.toLowerCase().includes(filters.schedule.toLowerCase()))
  ```
  Sin este filtro, la información de jornada que el candidato da en el Paso 4 nunca se usa en la búsqueda.

### Nuevas tools o capacidades recomendadas

- **`capture_lead` — tool para registrar interés sin navegar**
  Cuando no hay vacante compatible, Kyo navega a `/contacto` (Paso 5 fallback). Pero muchos candidatos abandonan el sitio antes de completar el formulario de contacto. Una tool `capture_lead` que llame a `/api/aplicar` directamente desde el chat (con los datos ya recolectados: nombre, puesto, ubicación, jornada) evita esa fricción:
  ```typescript
  // tools.ts
  {
    name: "capture_lead",
    description: "Registra el interés de un candidato cuando no hay vacante exacta. Guarda su perfil en la base de datos para contactarle cuando surja una oportunidad.",
    input_schema: {
      type: "object",
      properties: {
        nombre: { type: "string" },
        puesto_interes: { type: "string" },
        ubicacion: { type: "string" },
        jornada: { type: "string" },
        whatsapp: { type: "string", description: "Número de WhatsApp del candidato (opcional)" },
      },
      required: ["nombre", "puesto_interes"],
    },
  }
  ```
  El backend puede guardar en la tabla `crm_candidatos` que ya existe, marcando `origen: "kyo"`.

- **`get_salario_mercado` — tool informativa de rango salarial**
  El módulo `/salarios` ya tiene datos de mercado para 35 puestos (`src/lib/salarios.ts`). Añadir una tool que Kyo pueda consultar cuando el candidato pregunta "¿cuánto pagan?" en una categoría:
  ```typescript
  {
    name: "get_salario_mercado",
    description: "Devuelve el rango salarial estimado de mercado para un puesto en CDMX.",
    input_schema: {
      type: "object",
      properties: {
        puesto: { type: "string", description: "Nombre del puesto, ej: cajero, analista de nómina" },
      },
      required: ["puesto"],
    },
  }
  ```
  Implementación en `executeTool`: buscar en `SALARIOS` por nombre parecido, devolver `{ puesto, salario_min, salario_max, nivel }`. Esto hace a Kyo más útil y diferenciador.

### Problemas detectados

- **[useChat.ts:20] Tilde faltante en el saludo — PENDIENTE CICLO ANTERIOR**
  `"estoy aqui para orientarte"` → debe ser `"estoy aquí para orientarte"`. Es la primera frase que lee el candidato.

- **[chat/route.ts:202] Fallback sin tildes y robotico — PENDIENTE CICLO ANTERIOR**
  `"Entendido, ¿en que mas te puedo ayudar?"` → cambiar a:
  `"Perdona, tuve un inconveniente procesando tu mensaje. ¿Podrías repetirme tu pregunta?"`

- **[system-prompt.ts:138] `toLocaleString()` sin locale en VPS Linux — PENDIENTE CICLO ANTERIOR**
  Produce `12000` en lugar de `$12,000`. Usar `Intl.NumberFormat('es-MX', {...})`.

- **[useChat.ts:95] Sin AbortController ni timeout — PENDIENTE CICLO ANTERIOR**
  Con 5 iteraciones de tool-use, si el VPS tiene carga el fetch puede colgarse indefinidamente. Añadir timeout de 20s con AbortController.

- **[knowledge.ts:167] Kyo usa vacantes del archivo estático, no de Supabase — PENDIENTE CICLO ANTERIOR**
  El sitio público lee vacantes en tiempo real de Supabase; Kyo lee del fallback `jobs.ts`. Un candidato puede recibir recomendaciones de vacantes ya inactivas. Esta sigue siendo la deuda más crítica del asistente.

- **[sistema prompt:54-58] Referencia `empresa` en las recomendaciones puede revelar info confidencial**
  El Paso 5 del system prompt muestra `[Empresa]` en la recomendación. Pero en el admin de vacantes existe la opción "Empresa: Confidencial" (documentado en CLAUDE.md: "si se deja vacía, el sitio muestra 'Confidencial'"). El `JobSummary` en `knowledge.ts` incluye el campo `empresa` que puede estar vacío o con valor real. El system prompt debe instruir: "Si la empresa es vacía o 'Confidencial', no la menciones en la recomendación."

---

## Oportunidades de mejora general

- **[analytics] Sin tracking de qué paso del flujo abandona el candidato**
  `logEvent("kyo_mensaje")` registra cada mensaje enviado, pero no el paso del flujo en que se encuentra Kyo. Añadir en `useChat.ts` un evento al cerrar el widget y al resetear:
  ```typescript
  // En reset():
  logEvent("kyo_reset", String(messages.length));
  // En ChatWidget.tsx, al cerrar (onClick del botón close y del botón flotante):
  if (messages.length > 1) logEvent("kyo_cerrado", String(messages.length));
  ```
  Con esto, el dashboard de analytics puede mostrar "los candidatos promedio abandonan a los X mensajes" — dato clave para optimizar el flujo.

- **[sistema/general] Chips de respuesta rápida para acelerar el flujo**
  En los Pasos 3 y 4, las respuestas son predecibles (ubicación: CDMX / Estado de México / Remoto; jornada: Tiempo completo / Medio tiempo). Añadir chips debajo del input en `ChatWidget.tsx` que aparezcan contextualmente cuando Kyo hace esas preguntas:
  ```tsx
  // En ChatWidget, tras el área de mensajes, si el último mensaje es de Kyo:
  {lastAssistantMsg?.includes("zona") && (
    <div className="flex gap-2 flex-wrap px-5 pb-2">
      {["CDMX", "Estado de México", "Híbrido", "Remoto"].map(chip => (
        <button key={chip} onClick={() => sendMessage(chip)}
          className="text-[12px] border border-navy/30 text-navy rounded-full px-3 py-1 hover:bg-navy/5">
          {chip}
        </button>
      ))}
    </div>
  )}
  ```
  Reduce la fricción de escritura en mobile y aumenta la tasa de completación del flujo.

- **[admin panel — sidebar] No hay indicador de rol visible para el usuario logueado**
  El sidebar solo muestra el email (o nombre si se aplica el fix de layout). Añadir un badge pequeño con el rol actual (`Admin` / `Colaborador`) en el footer del sidebar, junto al nombre, para que el usuario sepa qué permisos tiene:
  ```tsx
  <div className="flex items-center gap-2">
    <p className="text-white/40 text-[11px] truncate flex-1">{displayName}</p>
    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide ${
      esAdmin ? "bg-yellow/20 text-yellow" : "bg-white/10 text-white/50"
    }`}>{esAdmin ? "Admin" : "Colaborador"}</span>
  </div>
  ```

- **[chat/route.ts:69-82] Rate limiter en memoria, se resetea en cada deploy**
  El `rateLimitMap` (líneas 68-81) vive en memoria del proceso. Cada `pm2 restart` tras un deploy borra todos los conteos. Con los VPS watchdog scripts que hacen commits+push a main, los deploys son frecuentes. El riesgo es bajo con el volumen actual de tráfico, pero documentado para cuando escale.

---

## Estado de issues del ciclo anterior (2026-08-05)

| Issue | Archivo | Estado |
|---|---|---|
| Tilde en saludo inicial "aquí" | `useChat.ts:20` | **PENDIENTE** |
| "Nueva conversacion" sin tilde | `ChatWidget.tsx:159` | **PENDIENTE** |
| Fallback robotico sin tildes | `chat/route.ts:202` | **PENDIENTE** |
| `toLocaleString()` sin locale | `system-prompt.ts:138` | **PENDIENTE** |
| Sin AbortController en fetch | `useChat.ts:95` | **PENDIENTE** |
| Kyo lee jobs del archivo estático | `knowledge.ts:167` | **PENDIENTE** |
| Email sintético en sidebar | `layout.tsx:268` | **PENDIENTE** |
| `window.confirm()` para borrar usuario | `usuarios/page.tsx:277` | **PENDIENTE** |
| Recuperación de contraseña colaboradores | `login/page.tsx:91` | **PENDIENTE** |
| Colaboradores sin secciones sin CTA | `layout.tsx:283` | **PENDIENTE** |
| Panel dice "videos" en vez de "proyectos" | `usuarios/page.tsx:581` | **PENDIENTE** |
| Sin tracking de abandono de Kyo | `useChat.ts` | **PENDIENTE** |
| Filtros de URL con empresas ficticias | `system-prompt.ts:85` | **PENDIENTE** |
| Correo de notificación proyectos hardcodeado | `status/route.ts:69` | **PENDIENTE** |
| kyo_faqs desconectadas de Kyo | `knowledge.ts:99` | **PENDIENTE** ← *nuevo detalle hoy* |
