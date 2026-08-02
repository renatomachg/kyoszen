# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-02
**Cambios analizados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/app/revisor/page.tsx`
- `src/components/revisor/ProyectosCliente.tsx`
- `src/app/api/admin/proyectos/espacios/[id]/archivos/route.ts`
- `src/app/api/revisor/proyectos/espacios/[id]/archivos/[archivoId]/status/route.ts`
- Commits recientes: b21cdcf (requiere_aprobacion por archivo en Artes), 79eecc8 (Vista cliente + deep-link ?tab=)

## Cambios Recientes Detectados
Los últimos 2 días contienen solo commits automáticos de este análisis. Los últimos cambios sustantivos (29-jul) están en el módulo Proyectos Hub:
- **b21cdcf:** Se reemplazó el toggle "requiere aprobación" a nivel de espacio por una bandera `requiere_aprobacion` por archivo individual. La API del revisor rechaza con 400 si el archivo no requiere aprobación.
- **79eecc8:** Se añadió botón "Vista cliente" en el admin de proyectos y soporte de deep-link `?tab=` en el revisor para aterrizar en la pestaña correcta. El tab se lee del URL en el `useEffect` de montaje (`window.location.search`), sobrevive al login sin redirect porque el componente no desmonta.

---

## Sugerencias de UX

### Alta prioridad

- **[archivos/route.ts:91] Sin validación de tamaño de archivo antes de subir**: El POST de `/api/admin/proyectos/espacios/[id]/archivos` no valida `file.size`. Si el admin sube un archivo de más de 50 MB (límite del bucket `media`), Supabase Storage devuelve un error en inglés que llega crudo al frontend. Añadir antes del upload: `if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: 'El archivo no puede superar 50 MB. Comprime el documento e intenta de nuevo.' }, { status: 413 })`. Mismo check en `/api/admin/social/upload` (ya existe, pero no en proyectos).

- **[archivos/route.ts:POST] Sin notificación al cliente cuando el admin sube un archivo nuevo**: Cuando el admin sube un archivo a un espacio de Artes con `requiere_aprobacion=true`, no se envía ningún correo a los revisores activos (`social_reviewers`). El cliente tiene que entrar manualmente al revisor para descubrir que hay material esperando su aprobación. Añadir en el POST, después del `insert` exitoso, el mismo helper SMTP que usa el revisor de redes: notificar a los revisores activos con `subject: "Nuevo archivo para revisar · ${file.name}"` y link a `/revisor?tab=proyectos`.

- **[ProyectosCliente.tsx:914,1099] Badge "Sin aprobación requerida" confuso para el cliente**: El archivo se muestra en el listado pero sin botones de acción ni explicación. El cliente puede pensar que hay un error técnico o que los botones no cargaron. Cambiar el mensaje de `— Sin aprobación requerida` (en gris muted) por un texto más claro: `"Este archivo ya fue revisado internamente y no requiere tu aprobación."` Considerar añadir un ícono de check verde para reforzar visualmente que está OK.

- **[useChat.ts:94-102] Sin timeout en el fetch al asistente**: El `fetch` en `sendMessage` no tiene `AbortController` ni timeout. Si el servidor tarda más de lo esperado (loop de 5 iteraciones de tool-use con haiku), `isLoading` queda en `true` indefinidamente y el usuario ve el indicador de "escribiendo" sin poder interrumpir. Añadir:
  ```typescript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);
  const res = await fetch('/api/assistant/chat', { ..., signal: controller.signal });
  clearTimeout(timeoutId);
  ```
  Y en el `catch`, detectar `AbortError` para mostrar: `"Kyo tardó demasiado en responder. Intenta de nuevo."`.

### Media prioridad

- **[status/route.ts:38] Correo de notificación del revisor de archivos hardcodeado**: La línea `to: "renatomachg@gmail.com"` está hardcodeada. Si el cliente cambia el correo destino desde el panel de Correos (`/admin/correos`), esta notificación seguirá llegando al mismo email. Corregir: leer la clave `email_destino` (o `resumen_email`) de `site_config` en el mismo bloque donde ya se leen las credenciales SMTP, y usar ese valor como destinatario.

- **[useChat.ts:37-43] Historial de chat sin expiración**: `STORAGE_KEY` persiste indefinidamente en `localStorage` (hasta 30 mensajes). Un candidato que regresa semanas después ve su conversación anterior con recomendaciones de vacantes que ya pueden haber vencido, y Kyo continúa ese contexto como válido. Añadir una marca de timestamp al guardar y limpiar si el último mensaje tiene más de 7 días:
  ```typescript
  function loadHistory(): ChatMessage[] {
    // ...
    const last = parsed[parsed.length - 1];
    if (last && Date.now() - last.timestamp > 7 * 24 * 60 * 60 * 1000) {
      return [INITIAL_GREETING];
    }
    return parsed.length > 0 ? parsed : [INITIAL_GREETING];
  }
  ```

- **[chat/route.ts:85] `MAX_TOOL_ITERATIONS=5` insuficiente para flujos complejos**: Un candidato que consulta 2 vacantes en detalle puede generar: `search_jobs` → `get_job_details` × 2 → `get_company_info` → `navigate_to` = 5 tool calls. Si el modelo hace esas 5 llamadas sin generar texto final, el loop termina y `finalText` queda vacío, cayendo al fallback sin acento. Subir el límite a 8 y añadir logging: `console.warn('[kyo] MAX_TOOL_ITERATIONS alcanzado, finalText vacío')` para detectar el caso en producción.

- **[revisor/page.tsx:1132-1140] Botones de tab sin `aria-selected` ni `role="tab"`**: Los botones de navegación entre Publicaciones / Proyectos / Resultados son `<button>` sin semántica de tabs. Los lectores de pantalla no comunican que son tabs ni cuál está activo. Añadir `role="tab"` a cada botón, `aria-selected={seccion === k}`, y envolver en un `<nav role="tablist">`. El contenido debería tener `role="tabpanel"`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[useChat.ts:20] Tilde faltante en el saludo inicial de Kyo**: El `INITIAL_GREETING` dice `"estoy aqui para orientarte"` — falta la tilde en "aquí". Es la primera frase que ve el candidato y establece la percepción de calidad. Corregir a: `"Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?"`.

- **[system-prompt.ts:65-68] Kyo redirige empresas sin calificar la oportunidad**: Cuando detecta "soy empresa" o "quiero contratar", el prompt instruye navegar a `/contacto` inmediatamente. Sin embargo, el chat es el mejor punto para capturar el tipo de perfil que buscan (operativo, profesional, ejecutivo), la urgencia y el volumen. Antes de navegar, añadir 2-3 preguntas de calificación rápida: `"¿Qué tipo de puesto están buscando cubrir? ¿Es urgente?"`. Esto convierte el chat en un filtro de leads de mayor calidad.

- **[system-prompt.ts:55] "Banco de talentos" sin personalización del mensaje**: El fallback cuando no hay vacante compatible dice genéricamente que puede navegar a `/contacto`. Mejorar para que Kyo use el nombre del candidato y el puesto que describió: `"Por ahora no tenemos una vacante exacta para [puesto] en [zona], [nombre], pero podemos contactarle en cuanto surja una oportunidad similar. ¿Le parece bien que anotemos su perfil?"` Usar `navigate_to('/contacto')` solo si el candidato acepta, no de forma automática.

- **[system-prompt.ts:38-40] Paso 3 (ubicación) no sugiere zonas disponibles**: Kyo pregunta "¿en qué zona vive?" sin dar opciones. Un candidato puede responder "Neza" o "Iztapalapa" y Kyo no sabe si eso cae en CDMX o Estado de México. El prompt debería incluir las zonas disponibles en la pregunta: `"¿En qué zona vive? Tenemos vacantes en CDMX, Estado de México, y también posiciones híbridas o remotas."` Esto reduce respuestas ambiguas y agiliza el matching.

### Nuevas tools o capacidades recomendadas

- **`save_candidate_interest` (tool nueva, alta prioridad)**: Ya reportada en ciclos previos como pendiente de implementar. Sin esta tool, el candidato que no encuentra vacante tiene que salir del chat y llenar el formulario de `/contacto` desde cero. Con la tool, Kyo podría guardar nombre + puesto + zona en `contactos` con `tipo='banco_talentos'` directamente desde la conversación. Archivos: nueva entrada en `src/lib/assistant/tools.ts` + endpoint `POST /api/assistant/candidato-interes`. Impacto: convierte el mayor punto de fuga del funnel en una captura de lead.

- **`get_active_jobs_count` (tool nueva, baja prioridad)**: Permite que Kyo responda con precisión "actualmente tenemos 12 vacantes activas en CDMX" en lugar de confiar en el número estático del system prompt. Query simple: `supabase.from('vacantes').select('id', { count: 'exact' }).eq('activa', true)`. Útil cuando el candidato pregunta "¿cuántas vacantes tienen?" antes de iniciar el flujo.

### Problemas detectados

- **[knowledge.ts:167] Kyo sigue usando datos estáticos (JOBS del archivo jobs.ts)**: Problema ya identificado y pendiente de resolución. La base de conocimiento de vacantes no refleja en tiempo real lo que el admin publica/despublica en Supabase. Cada sesión que genera el VPS puede tener datos de vacantes obsoletos. Solución: en `chat/route.ts`, antes de `buildSystemPrompt`, consultar `supabase.from('vacantes').select(...).eq('activa', true)` con service_role e inyectar dinámicamente. El `KnowledgeProvider` ya está diseñado para esto (comentario en `knowledge.ts:166`).

- **[chat/route.ts:202] Fallback sin tilde ni empatía (pendiente desde reporte anterior)**: `"Entendido, ¿en que mas te puedo ayudar?"` — sin tilde en "más". Corregir a: `"Perdona, no pude generar una respuesta. ¿Podrías repetirme tu pregunta?"`.

- **[archivos/[archivoId]/status/route.ts:76] API devuelve 400 al cliente pero el frontend no muestra el mensaje de error**: Cuando el cliente intenta aprobar un archivo con `requiere_aprobacion === false` (lo cual no debería ocurrir si el UI oculta los botones correctamente), la API devuelve `{ error: "Este archivo no requiere aprobación" }` con status 400. El componente `ProyectosCliente.tsx:805` hace `throw new Error(await mensajeError(...))` y el error llega al estado `error` que sí se muestra. Sin embargo, hay un edge case: si el archivo cambia `requiere_aprobacion` mientras el modal está abierto (admin lo edita al mismo tiempo), el cliente verá este error sin contexto. Añadir un mensaje más claro: `"Este archivo fue marcado como no requerido de revisión. Recarga la página para ver el estado actualizado."`.

---

## Oportunidades de mejora general

- **Sin feedback visual en el botón de "Nueva conversación" (pendiente desde reporte anterior)**: El botón `text-[11px] text-muted` es muy discreto. Subir visibilidad: añadir borde `border border-border`, ícono SVG de recarga, y `text-[12px] font-semibold`.

- **[revisor/page.tsx] Deep-link ?tab= funciona correctamente**: Verificado en el código: el `useEffect` que lee `window.location.search` corre en el montaje del componente raíz (no en LoginView), y como el login usa `setUser()` sin `router.push()`, el componente nunca desmonta. El estado `seccion` sobrevive el login. No requiere cambio.

- **[ChatWidget.tsx:37] Botón flotante sin focus ring visible para teclado**: El `<motion.button>` tiene `aria-label` correcto pero no tiene clases de focus ring en Tailwind. En usuarios de teclado, el foco no es visible. Añadir `className="... focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"`.

- **[archivos/route.ts — GET] El endpoint de cliente no tiene paginación**: Para espacios con muchos archivos, el GET devuelve todos los registros en una sola query. Con un cliente con decenas de archivos por espacio, esto puede ser lento. Añadir `limit(50)` y soporte de cursor/offset como mejora preventiva antes de que crezca el volumen.

- **Sin historial de acciones en el revisor de archivos**: El cliente puede aprobar un archivo y luego no recordar cuál fue. A diferencia de la sección de publicaciones (que tiene comments con timestamp), el listado de archivos no muestra un historial de "Aprobado el DD/MM por [nombre]". Añadir `updated_at` y `estado` visible en la tarjeta de archivo del cliente además del modal.
