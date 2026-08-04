# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-03
**Cambios analizados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/lib/jobs.ts`
- `src/app/vacantes/page.tsx`
- Commits recientes: solo commits automáticos de análisis UX (2026-07-29 a 2026-08-02). Último cambio de código real: b21cdcf (2026-07-28).

## Cambios Recientes Detectados
Sin cambios de código en los últimos 5 días hábiles. El módulo activo más reciente fue el flag `requiere_aprobacion` por archivo en el Centro de Proyectos (Artes). La deuda técnica documentada en reportes anteriores permanece sin resolverse, con especial urgencia en la brecha de datos de vacantes que afecta directamente al candidato que usa Kyo.

---

## Sugerencias de UX

### Alta prioridad

- **[ChatWidget.tsx:120] Panel de chat oculto por el teclado virtual en iOS**: El widget usa `bottom-24` fijo. En iPhone, cuando el candidato toca el input y aparece el teclado virtual (≈300px), el panel queda parcialmente oculto y el input puede estar detrás del teclado. Añadir en el contenedor principal del panel `style={{ bottom: open ? 'env(safe-area-inset-bottom, 96px)' : undefined }}` y en el input `inputMode="text"` para forzar teclado estándar (no emoji). También usar `visualViewport` para recalcular la posición:
  ```typescript
  useEffect(() => {
    const handler = () => {
      if (!open) return;
      const vv = window.visualViewport;
      if (vv) setPanelBottom(window.innerHeight - vv.height - vv.offsetTop + 16);
    };
    window.visualViewport?.addEventListener('resize', handler);
    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, [open]);
  ```
  En móvil el chat es el primer punto de contacto del candidato — si no puede escribir, abandona.

- **[system-prompt.ts:138] `toLocaleString()` sin locale en el servidor**: La línea que formatea el salario en el system prompt usa `j.salario?.toLocaleString?.()` sin especificar locale ni opciones. En Node.js sobre Linux (el VPS), el locale por defecto puede ser `POSIX` o `C`, produciendo `12000` en lugar de `12,000`. El modelo recibe el número sin formato y puede presentarlo de distintas formas al candidato. Corregir:
  ```typescript
  const fmtSalario = (s: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(s);
  // Uso en la línea 138:
  `- id=${j.id} · ${j.titulo} · ${j.empresa} · ... · ${fmtSalario(j.salario)}/mes`
  ```
  Esto garantiza `$12,000/mes` consistente en cualquier entorno.

- **[knowledge.ts:138-153, jobs.ts:1-247] Kyo recomienda vacantes de datos estáticos mientras el sitio público usa Supabase en tiempo real**: `VacantesPage` hace `supabase.from('vacantes').select(...).eq('activa', true)` en cada carga. Kyo usa `JOBS` del archivo `jobs.ts` que tiene 10 vacantes hardcoded, potencialmente diferentes a las que el admin gestiona. Un candidato puede ver en `/vacantes` posiciones que Kyo no conoce, o Kyo puede recomendar vacantes ya inactivas. Esta es la deuda más crítica del asistente. Implementar en `chat/route.ts`, antes de `buildSystemPrompt`:
  ```typescript
  const { data: activeJobs } = await sbAdmin
    .from('vacantes')
    .select('id,titulo,empresa,categoria,ubicacion,contrato,jornada,salario,descripcion,tags,salario_nota,beneficios,horario')
    .eq('activa', true)
    .order('id');
  ```
  Pasar `activeJobs` a `buildSystemPrompt` como parámetro e inyectarlos en lugar del `jobsSummary` estático. El `KnowledgeProvider` ya tiene la interfaz preparada para esto (`knowledge.ts:166`).

- **[tools.ts:43] Categorías de vacantes sin tilde pueden no hacer match**: `category` en `search_jobs` documenta `"Atencion al cliente"` (sin tilde). Si los datos de Supabase guardan `"Atención al cliente"` (con tilde), el filtro `j.categoria.toLowerCase() === filters.category.toLowerCase()` falla. Normalizar el comparador con `deburr` (lodash) o comparación básica:
  ```typescript
  const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  .filter((j) => !filters?.category || normalize(j.categoria) === normalize(filters.category))
  ```
  Aplicar el mismo fix en `listCourses`. Afecta directamente la capacidad de Kyo de filtrar vacantes por categoría.

### Media prioridad

- **[system-prompt.ts:38-40, Paso 3] Kyo no ofrece opciones de zona al preguntar ubicación**: La pregunta de ubicación es abierta ("¿en qué zona vive?"). Un candidato puede responder "Neza", "Iztapalapa", "Tlalnepantla" — topónimos que Kyo no puede mapear a los filtros disponibles (`CDMX`, `Estado de México`, `Híbrido`, `Remoto`). Añadir en el prompt del Paso 3:
  ```
  ## Paso 3 — UBICACION
  Pregunta: "¿En qué zona de la ciudad vive o trabaja? Tenemos vacantes en CDMX, Estado de México, y también posiciones híbridas y remotas."
  Si el usuario da una colonia o municipio, infiere la zona más cercana (Neza → Estado de México, Iztapalapa → CDMX) para usar en search_jobs.
  ```

- **[useChat.ts:24-34] Historial de chat sin expiración — candidato ve vacantes obsoletas**: La conversación se persiste en `localStorage` sin fecha de expiración. Un candidato que regresa 2 semanas después ve un hilo donde Kyo le recomendó vacantes que pueden ya no existir, y Kyo continúa ese contexto como válido. Añadir expiración de 7 días:
  ```typescript
  function loadHistory(): ChatMessage[] {
    // ...existing parse...
    const last = parsed[parsed.length - 1];
    if (last && Date.now() - last.timestamp > 7 * 24 * 60 * 60 * 1000) {
      return [INITIAL_GREETING];
    }
    return parsed.length > 0 ? parsed : [INITIAL_GREETING];
  }
  ```

- **[useChat.ts:94-102] Sin timeout ni AbortController en el fetch a Kyo**: El `fetch` no tiene límite de tiempo. Si el servidor tarda más de 15s (5 iteraciones de tool-use bajo carga), `isLoading` permanece `true` y el usuario ve "escribiendo..." indefinidamente sin poder interrumpir. Añadir:
  ```typescript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch('/api/assistant/chat', { ..., signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      setError('Kyo tardó demasiado en responder. Por favor intenta de nuevo.');
      return;
    }
    // ...existing error handling...
  }
  ```

- **[ChatWidget.tsx:154-164] Botón "Nueva conversación" demasiado discreto**: `text-[11px] text-muted` casi no se ve. El candidato que quiere empezar de cero no lo encuentra fácilmente y puede cerrar y reabrir el widget (perdiendo el contexto anterior). Mejorar visibilidad:
  ```tsx
  <button
    type="button"
    onClick={reset}
    className="text-[12px] text-muted hover:text-navy font-semibold flex items-center gap-1.5 border border-border rounded-full px-3 py-1 hover:border-navy transition-colors"
  >
    <svg width="12" height="12" ...reinicio icon.../> Nueva conversación
  </button>
  ```

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[useChat.ts:20] Tilde faltante en el saludo inicial**: `"estoy aqui para orientarte"` — falta el acento en "aquí". Es la primera impresión del candidato. Corregir la constante `INITIAL_GREETING.content` a: `"Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?"`. **Esta corrección no requiere API — es solo el valor del string en `useChat.ts:20`.**

- **[system-prompt.ts:65-68] Kyo corta el flujo con empresas sin calificar el lead**: Cuando detecta intención de "quiero contratar" o "soy empresa", el prompt instruye ir directo a `/contacto`. Pero ese candidato empresarial es el lead de mayor valor. Antes de navegar, añadir 2 preguntas de calificación rápida en el flujo para empresas:
  ```
  Si el usuario dice que es empresa o quiere contratar:
  1. "¿Qué tipo de puesto buscan cubrir? (operativo, administrativo, gerencial)"
  2. "¿Con qué urgencia? (inmediata, dentro de un mes)"
  Luego navegar a /contacto con un mensaje: "Perfecto, en breve un especialista se pondrá en contacto con usted."
  ```
  Esto permite al equipo de ventas recibir un lead pre-calificado en lugar de un contacto frío.

- **[system-prompt.ts:54-57] Banco de talentos genérico sin usar el nombre y puesto**: El mensaje de fallback cuando no hay vacante compatible es impersonal: navega a /contacto sin mencionar el puesto ni la zona del candidato. Personalizar con los datos ya recopilados en el flujo:
  ```
  "Por ahora no tenemos una vacante de [puesto] en [zona], [nombre], pero podemos contactarle cuando surja una oportunidad similar.
  ¿Le gustaría que anotemos su perfil para nuestro banco de talentos?"
  Si acepta → navigate_to('/contacto')
  Si no → "Entendido. Puede consultar nuestras vacantes en cualquier momento en la sección de vacantes."
  → navigate_to('/vacantes')
  ```

- **[system-prompt.ts — Paso 5] Kyo no menciona el rango salarial al recomendar vacantes**: El formato de respuesta del Paso 5 dice `"[Nombre del puesto] — [Empresa] — [Por qué le aplica]"` pero no incluye el salario. Para el candidato operativo, el salario es el dato más importante antes de decidir si aplica. Actualizar el formato:
  ```
  1. [Puesto] — [Empresa] — $[Salario]/mes · [Por qué le aplica]
  ```
  El salario ya está disponible en el system prompt (lista de vacantes, línea 138).

### Nuevas tools o capacidades recomendadas

- **`save_candidate_interest` (pendiente crítico, ya reportado)**: Sin esta tool, el candidato que no encuentra vacante tiene que salir del chat, ir a `/contacto` y llenar el formulario desde cero. La conversión cae drásticamente. Con la tool, Kyo captura: `{ nombre, puesto_buscado, zona, sessionId }` en `contactos` con `fuente='banco_talentos'`. Implementar:
  - `src/lib/assistant/tools.ts` — nueva entrada `save_candidate_interest`
  - `POST /api/assistant/candidato-interes` — inserta en `contactos` con service_role
  - Triggerar desde el Paso 6 si el candidato acepta el banco de talentos

- **`get_available_jobs_count` (baja prioridad)**: Cuando el candidato pregunta "¿cuántas vacantes tienen?" antes de iniciar el flujo, Kyo actualmente usa el número estático del system prompt (10 vacantes de `jobs.ts`). Con esta tool haría `supabase.from('vacantes').select('id', { count: 'exact' }).eq('activa', true)` y respondería con el dato real. Puede implementarse como un mini-endpoint o inline en `executeTool`.

### Problemas detectados

- **[chat/route.ts:202] Fallback vacío sin tilde ni empatía**: `"Entendido, ¿en que mas te puedo ayudar?"` — falta tilde en "más" y el mensaje suena robótico. Peor aún, aparece cuando Kyo no pudo generar respuesta, que es exactamente cuando el candidato necesita más claridad. Corregir:
  ```typescript
  const replyContent = finalText || "Perdona, tuve un problema al procesar tu mensaje. ¿Podrías repetirme tu pregunta?";
  ```

- **[tools.ts:43 vs knowledge.ts:138-145] Categorías documentadas en tools vs categorías reales en datos**: La tool `search_jobs` documenta las categorías `Administrativo, Ventas, Operaciones, Atencion al cliente, RRHH`. Pero si las vacantes en Supabase usan etiquetas distintas (ej. "Operativo", "Call Center"), el filtro nunca retorna resultados. Verificar que las categorías en la descripción de la tool coincidan exactamente con los valores en la columna `categoria` de la tabla `vacantes` en Supabase. Ejecutar: `SELECT DISTINCT categoria FROM vacantes WHERE activa = true;` y actualizar la descripción de la tool con los valores reales.

- **[knowledge.ts:167] Datos de Supabase ausentes en el contexto de Kyo (deuda crítica, ciclos previos)**: `StaticKnowledgeProvider` usa `JOBS` (10 vacantes hardcoded). El sitio público usa Supabase. Los campos `salario_nota`, `beneficios`, `horario` que se añadieron a la tabla `vacantes` en junio de 2026 **no existen en `jobs.ts`** (confirmado: `grep salario_nota src/lib/jobs.ts` devuelve solo menciones en `requisitos[]`, no como campo propio). Kyo no puede responder `"¿Qué horario tiene esa vacante?"` con datos reales. La solución completa requiere migrar a `SupabaseKnowledgeProvider` como está planeado en el comentario de `knowledge.ts:166`.

- **[chat/route.ts:68-82] Rate limiter en memoria no sobrevive reinicios de PM2**: El `rateLimitMap` es una variable en módulo. Cada `pm2 restart kyoszen` (que ocurre en cada deploy con `deploy.sh`) lo resetea. Un usuario con intenciones de abuso puede enviar 30 mensajes, esperar el restart del deploy, y enviar 30 más. Para producción real usar Redis o al menos añadir el conteo a `kyo_conversaciones` (que ya persiste en Supabase). Por ahora es aceptable dado el volumen, pero documentar el riesgo.

---

## Oportunidades de mejora general

- **[ChatWidget.tsx:37] Botón flotante sin focus ring para teclado**: El `<motion.button>` del widget tiene `aria-label` correcto pero no tiene `focus-visible:ring-*`. En navegación por teclado o lectores de pantalla el foco es invisible. Añadir: `className="... focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none"`.

- **[vacantes/page.tsx:32] Filtro de salario con texto "Mas de $20k" sin tilde**: La constante `SALARIOS` tiene `"Mas de $20k"` (sin tilde en "Más"). Si esta cadena se muestra en la UI o la comparte un candidato por URL, queda con ortografía incorrecta. Corregir a `"Más de $20k"` en la línea 32.

- **Sin métricas de abandono en el flujo de Kyo**: Se logguea `kyo_mensaje` en `useChat.ts:81` pero no hay evento cuando el candidato cierra el widget sin completar el flujo ni cuando llega al Paso 5 y no aplica. Añadir en `useChat.ts:reset()` un evento `logEvent('kyo_reset', messages.length.toString())` para medir cuántos mensajes alcanzó antes de reiniciar. Y en `ChatWidget.tsx` en el botón de cerrar: `logEvent('kyo_cerrado', messages.length.toString())`. Estos datos permitirían identificar en qué paso se pierden más candidatos.

- **[system-prompt.ts:85-91] Filtros de URL documentados con marcas ficticias**: Los valores de ejemplo en el filtro `?marca=Sigma Retail` corresponden a empresas del archivo `jobs.ts` estático (Grupo Corpora, Logística Norte, etc.). Cuando se migre a datos reales de Supabase, estos valores serán incorrectos. Actualizar la sección de filtros disponibles con las empresas reales activas en la BD, o eliminar el filtro `?marca=` del prompt hasta que esté sincronizado con datos reales.

- **Sin modo oscuro en el ChatWidget**: El widget usa colores hardcodeados (`bg-white`, `bg-[#F3F4F7]`, `text-navy`). En sistemas con `prefers-color-scheme: dark`, el widget aparece con fondo blanco brillante sobre fondo oscuro del sitio si el usuario tiene darkmode activado. Añadir variantes Tailwind dark: `dark:bg-[#1a2035] dark:text-white dark:bg-[#222940]` en las burbujas de mensajes y el panel principal.
