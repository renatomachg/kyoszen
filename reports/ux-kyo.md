# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-03
**Cambios analizados:** src/app/admin/(panel)/redes-sociales/page.tsx, src/app/revisor/page.tsx, src/app/api/admin/social/posts/[id]/route.ts, src/app/api/admin/social/posts/[id]/versions/route.ts, src/app/api/admin/social/posts/route.ts, src/app/api/admin/social/importar/route.ts, src/app/api/revisor/posts/route.ts, src/lib/assistant/system-prompt.ts, src/lib/assistant/tools.ts, src/lib/assistant/knowledge.ts, src/app/api/assistant/chat/route.ts, src/components/assistant/ChatWidget.tsx, src/components/assistant/useChat.ts

---

## Cambios Recientes Detectados

- **Vista mes como calendario real (dom→sáb):** Tanto en `/admin/redes-sociales` como en `/revisor`, se reemplazó la lista de días por un grid de 7 columnas con semanas reales. El primer día es domingo, hay relleno para días fuera del mes, y las celdas del día actual tienen borde/fondo azul.
- **Drag & drop en el admin:** El admin puede arrastrar una tarjeta a otro día del calendario (mover) o soltarla sobre otra tarjeta (intercambiar fechas). Incluye actualización optimista y bloqueo de fechas pasadas.
- **Edición libre de posts (editMode):** Nuevo modo en `PostModal` que edita la versión activa en su lugar sin crear nueva versión ni notificar al cliente. Permite cambiar título, fecha, red social, caption e imágenes.
- **Control borrador/publicado:** El admin decide qué posts ve el cliente con un toggle. Los borradores muestran un badge amarillo "Borrador" en la vista semana y un punto amarillo en la vista mes.
- **Selección individual en el importador:** Se puede marcar/desmarcar cada pieza antes de crear, con contadores en tiempo real, "Seleccionar todas" / "Quitar todas", y advertencias por fecha pasada o fin de semana.

---

## Sugerencias de UX

### Alta prioridad

- **[ADMIN] El drag & drop no tiene `onDragLeave` — las celdas quedan resaltadas al sacar el cursor.**
  Archivos: `src/app/admin/(panel)/redes-sociales/page.tsx:933-935` (vista mes) y `:992-994` (vista semana).
  Cuando el usuario arrastra un post sobre una celda y luego mueve el cursor fuera sin soltar, `dropTarget` mantiene el valor y la celda sigue resaltada en azul. Nunca se limpia hasta que se suelta en otro lugar.
  Fix: añadir `onDragLeave={() => setDropTarget(null)}` en cada celda `<div>` con `onDragOver`. Una línea en cada celda.

- **[ADMIN] No hay advertencia al mover/intercambiar posts ya publicados para el cliente.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:551-577` (funciones `moverPostAFecha` e `intercambiarFechas`).
  Ambas funciones no verifican si el post tiene `publicado: true`. Si el cliente ya vio y aprobó una publicación para el martes, el admin puede moverla accidentalmente al jueves sin ningún aviso, y el cliente verá la fecha incorrecta en su próxima visita al revisor.
  Fix: en ambas funciones, antes de hacer fetch, verificar `posts.find(x => x.id === postId)?.publicado` y mostrar `confirm("Este post ya está visible para el cliente. ¿Seguro que quieres cambiar su fecha?")`.

- **[ADMIN VISTA MES] No hay botón `+` cuando una celda ya tiene posts.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:938-940`.
  La condición `{dayPosts.length === 0 && !esPasado && (...)}` solo muestra el `+` cuando el día está vacío. Si ya hay una publicación, no hay forma de agregar otra sin cambiar a la vista semana.
  Fix: quitar `dayPosts.length === 0 &&` de la condición. El botón puede mostrarse siempre en el `display: flex` del encabezado de la celda, o aparecer solo en hover con `opacity` CSS.

- **[ADMIN VISTA MES] El badge "Borrador" no aparece en las tarjetas del mes.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:943-965` (cards vista mes) vs `:1017` (cards vista semana).
  La vista semana muestra `<span ...>Borrador</span>` cuando `!p.publicado`. La vista mes solo muestra un punto amarillo apenas visible. El admin no puede distinguir fácilmente qué posts están ocultos para el cliente cuando ve el mes completo.
  Fix: en las tarjetas del mes (línea ~958-963), añadir el mismo span de "Borrador" que aparece en la semana, o al menos aumentar el punto amarillo de `w-6 h-6` a algo más visible.

- **[ADMIN EDICIÓN] `editMode` no incluye el campo `nota_visual`.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:112-275` (PostModal).
  Cuando el admin edita una publicación en modo `editMode`, el formulario no muestra ni guarda el campo `nota_visual` ("qué diseñar"). Si el enfoque visual del post cambia (ej. cambia de vacante a marca empleadora), el diseñador seguirá viendo las instrucciones anteriores.
  Fix: añadir un `<textarea>` para `nota_visual` en el PostModal cuando `editMode || isNew`, y pasarlo en el `body` del fetch a `versions/[id]` (método PUT). La API `PUT /versions` ya acepta ese campo porque lo usa al crear.

### Media prioridad

- **[ADMIN DRAG] Instrucción de arrastrar siempre visible aunque no haya posts.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:907-909`.
  El texto "✋ Arrastra una publicación a otro día..." aparece incluso cuando no hay posts en el período actual. En la primera semana del mes (antes de importar el plan), el usuario ve la instrucción pero no puede hacer nada.
  Fix: añadir condición `{posts.length > 0 && (...)}` al wrapper del texto de instrucción.

- **[ADMIN IMPORTADOR] Las piezas de "fin de semana" no permiten ajustar la fecha inline.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:827-851` (lista de piezas del importador).
  Los posts marcados "⚠ Fin de semana" pueden seleccionarse y crearse igualmente. El admin luego tendría que abrir cada uno y editar su fecha. Sería más eficiente permitir editar la fecha directamente en la fila del importador: un `<input type="date">` inline que aparezca al hacer clic en la fecha marcada en naranja. Requiere cambiar `ImportPieza.fecha` a editable en el estado local.

- **[REVISOR VISTA MES] Las tarjetas en vista mes no muestran el badge "✨ Nueva propuesta".**
  Archivo: `src/app/revisor/page.tsx` (renderizado de tarjetas en vista mes, bloque análogo al `:943-965` del admin).
  Cuando hay una corrección, en el revisor el grid de semana y el modal muestran el badge y el efecto de doble tarjeta. Pero en la vista mes del revisor, las tarjetas son botones pequeños sin ese indicador. La cliente no sabe que hay una nueva propuesta para revisar.
  Fix: en las tarjetas del mes del revisor, cuando `post.social_post_versions.filter(v => !v.es_activa).length > 0`, añadir un pequeño badge verde "✨" en la esquina superior derecha de la tarjeta.

- **[REVISOR] El modal no cierra con `Escape`.**
  Archivo: `src/app/revisor/page.tsx:160-167` (overlay del PostModal del revisor).
  El overlay cierra con clic exterior, pero no con teclado. Para revisoras en desktop con teclado, es fricción. Ya se señaló en el reporte anterior y sigue sin implementarse.
  Fix (una vez, 5 líneas):
  ```js
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  ```

- **[REVISOR] Sin "Recuperar contraseña" en el login.**
  Archivo: `src/app/revisor/page.tsx` (componente `LoginView`).
  Las revisoras reciben contraseña temporal. Si la olvidan no hay camino visible para recuperarla. Ya señalado en reporte anterior, pendiente de implementar.
  Fix: enlace `¿Olvidaste tu contraseña?` → `supabase.auth.resetPasswordForEmail(email)` + toast de confirmación.

- **[ADMIN/REVISOR] El calendario mes tiene duplicación de lógica `monthGrid` en dos archivos.**
  Archivos: `src/app/admin/(panel)/redes-sociales/page.tsx:51-60` y `src/app/revisor/page.tsx:74-83`.
  Exactamente la misma función `monthGrid(first: Date)` está copiada en ambas páginas. Si en el futuro se quiere cambiar el primer día de la semana o agregar localización, hay que cambiarlo en dos lugares.
  Fix: extraer a `src/lib/calendar.ts` y exportar como `monthGrid`. Importar en ambas páginas.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **El historial en localStorage no expira — candidatos que vuelven días después ven una conversación antigua irrelevante.**
  Archivo: `src/components/assistant/useChat.ts:24-33` (función `loadHistory`).
  Con `MAX_STORED = 30` mensajes, un candidato que visitó el sitio hace 5 días ve toda la conversación anterior al abrir el chat. Si ya fue contactado o perdió interés, el contexto es confuso. Agregar verificación de antigüedad en `loadHistory`:
  ```ts
  const last = parsed[parsed.length - 1];
  const tooOld = last && (Date.now() - last.timestamp) > 24 * 60 * 60 * 1000; // 24 hrs
  if (tooOld) return [INITIAL_GREETING];
  ```
  Esto resetea automáticamente conversaciones de más de 24 horas sin borrar localStorage manualmente.

- **El system prompt no maneja el caso "ya apliqué antes".**
  Archivo: `src/lib/assistant/system-prompt.ts:63-70` (sección "Manejo de otros temas").
  Si un candidato dice "ya apliqué la semana pasada" o "ya tengo entrevista con ustedes", Kyo no tiene instrucción clara y puede reiniciar el flujo de 6 pasos, lo que es confuso y poco profesional.
  Fix: agregar en la sección "Manejo de otros temas":
  `"Si el candidato menciona que ya aplicó o que ya tiene proceso activo: agradece su interés, dile que el equipo ya tiene su información, y sugiere contactar directamente por WhatsApp para seguimiento."`.

- **`max_tokens: 1024` puede truncar la respuesta del Paso 5.**
  Archivo: `src/app/api/assistant/chat/route.ts:149-155`.
  En el Paso 5, Kyo necesita mostrar 2-3 vacantes con nombre, empresa y razón personalizada. Con un perfil complejo (candidato con historial de preguntas previas y contexto acumulado), 1024 tokens puede ser insuficiente y la respuesta aparece cortada.
  Fix: aumentar `max_tokens` de 1024 a 1500 para dar margen a respuestas más completas.

- **Las vacantes del system prompt y el nombre del usuario se repiten mecánicamente en cada respuesta.**
  Archivo: `src/lib/assistant/system-prompt.ts:18` (instrucción del nombre).
  Ya señalado en el reporte anterior. Con Haiku, el modelo saluda con el nombre en casi cada mensaje de seguimiento. Sigue pendiente mejorar la instrucción a: `"Usa el nombre del candidato con naturalidad — máximo 1 vez cada 3-4 mensajes. No lo uses en respuestas de 1-2 líneas."`.

### Nuevas tools o capacidades recomendadas

- **Tool `log_candidate_intent` — registrar el paso actual antes de navegar.**
  Archivo: `src/lib/assistant/tools.ts` (agregar nueva tool).
  Actualmente no hay registro de en qué paso del flujo está cada candidato cuando abandona el chat. Agregar una tool que guarde en `site_eventos` el paso alcanzado (`{ tipo: "kyo_paso", valor: "paso_5_recomendacion" }`) cuando el candidato llega al Paso 5. Esto le daría a Kyoszen una métrica valiosa: "X% de candidatos que hablan con Kyo llegan a ver vacantes".
  La tool sería del lado servidor y no requiere cambio en el frontend:
  ```ts
  { name: "log_step", description: "Registra en analytics el paso actual del flujo de conversación. Llama esto cuando el candidato llega al Paso 5 o al Paso 6.", input_schema: { type: "object", properties: { paso: { type: "string" }, vacante_id: { type: "number" } } } }
  ```

- **Quick replies / chips de respuesta para jornada y ubicación.**
  Archivo: `src/app/api/assistant/chat/route.ts` (agregar campo `suggestions` en la respuesta) + `src/components/assistant/ChatWidget.tsx` (renderizar chips).
  En mobile, el candidato tiene que escribir "Tiempo completo", "CDMX", etc. en el teclado. Los pasos 3 y 4 (ubicación y jornada) tienen opciones predecibles. El API podría devolver `suggestions: ["Tiempo completo", "Medio tiempo"]` cuando Kyo hace esas preguntas, y `ChatWidget.tsx` los renderizaría como chips tocables.
  Requiere: (1) que el API detecte el paso actual y añada `suggestions` al payload de respuesta; (2) que `ChatWidget.tsx` renderice los chips y los envíe como si fueran texto del usuario cuando se tocan.

### Problemas detectados

- **BUG CRÍTICO (persistente desde reporte anterior): Kyo recomienda vacantes desactualizadas.**
  Archivos: `src/lib/assistant/knowledge.ts:167` y `src/lib/jobs.ts`.
  `StaticKnowledgeProvider.listJobs()` lee del array `JOBS` hardcodeado, no de Supabase. El admin puede abrir o cerrar vacantes desde `/admin/vacantes`, pero Kyo no se entera. También el system prompt se genera con `knowledge.listJobs()` en cada request, con los mismos datos estáticos.
  Fix pendiente: crear `SupabaseKnowledgeProvider` que implemente la interfaz `KnowledgeProvider` ya definida en `knowledge.ts:42-58`. La arquitectura ya está preparada — el comentario en línea 167 lo confirma: "In phase 2 this will become: new SupabaseKnowledgeProvider(supabaseClient)".

- **BUG (persistente): las FAQs editadas en `/admin/kyo` no llegan al system prompt.**
  Archivos: `src/lib/assistant/knowledge.ts:99-105` y `src/app/api/assistant/chat/route.ts:11-32`.
  `getStoredInstrucciones()` solo carga el campo `instrucciones` de `kyo_config`. Las FAQs en el system prompt vienen de `COMPANY.faqs` hardcodeadas. La tabla `kyo_faqs` en Supabase existe y el admin la edita, pero esas ediciones nunca se reflejan en la conversación.

- **BUG (persistente): el analytics guarda el texto del mensaje del candidato.**
  Archivo: `src/components/assistant/useChat.ts:81`.
  `logEvent("kyo_mensaje", trimmed.slice(0, 300))` guarda hasta 300 caracteres en `site_eventos`. Si el candidato escribe su nombre (que Kyo pide en el Paso 0) seguido de información adicional, esos datos personales quedan en la tabla de analytics. Cambiar a `logEvent("kyo_mensaje", String(messages.length))` para registrar solo el número de mensaje en la conversación, no el contenido.

- **BUG NUEVO: el system prompt incluye vacantes en texto plano Y la tool `search_jobs` también busca en las mismas vacantes estáticas.**
  Archivo: `src/lib/assistant/system-prompt.ts:130-131` y `src/lib/assistant/tools.ts:36-46`.
  El system prompt ya lista todas las vacantes como texto (línea 130-131). Si Claude usa `search_jobs`, obtiene exactamente los mismos datos (del mismo `JOBS` estático). Esto duplica información en el contexto sin agregar valor, y cuando se migre a Supabase, habrá inconsistencia entre los datos del system prompt (cacheados 60s en `_cachedInstrucciones`) y los resultados de `search_jobs` (que podrían estar frescos de Supabase).
  Fix: en `buildSystemPrompt()`, eliminar el bloque `# Vacantes disponibles actualmente` del texto del system prompt y confiar 100% en la tool `search_jobs` para que Kyo consulte vacantes a demanda. Esto también reduce los tokens del system prompt.

---

## Oportunidades de mejora general

- **[ADMIN] La vista mes del calendario no muestra un resumen del mes al pie.**
  Cuando el admin está en vista mes, no hay un contador de "X publicaciones este mes · Y aprobadas · Z pendientes · W borradores". Agregar un bar de stats debajo del grid (igual a las pills del revisor) daría una vista ejecutiva rápida del estado del mes sin tener que contar tarjetas.

- **[ADMIN] El tab "Configuración" solo cubre Facebook — sería extensible para TikTok.**
  Archivo: `src/app/admin/(panel)/redes-sociales/page.tsx:1041-1082` (tab config).
  El formulario de configuración está hardcodeado para `red_social: "facebook"`. Cuando TikTok tenga logo y se active, el admin no podrá configurar su nombre de perfil ni avatar desde aquí. El form debería iterar sobre `Object.values(REDES)` y mostrar una sección por cada red activa. Requiere cambio menor en el form de guardado.

- **[REVISOR] La vista mes del revisor no tiene navegación de período integrada en el header.**
  Archivo: `src/app/revisor/page.tsx` (header del revisor).
  En el revisor, el toggle Semana/Mes y los botones `‹ ›` están en la misma línea. Al cambiar a vista mes, no es obvio que las flechas ahora mueven meses en lugar de semanas. Agregar una etiqueta dinámica junto a las flechas que cambie de "Semana anterior" a "Mes anterior" según la vista activa (via `title` en los botones, o un label visible).

- **[ADMIN/KYO] Añadir TikTok mockup al modal del revisor.**
  Archivo: `src/app/revisor/page.tsx:189-256` (layout del mockup del modal).
  El mockup siempre es de Facebook (cuadrado, fondo blanco, botones de reacción). Para posts de TikTok el mockup debería ser vertical (9:16), fondo negro, con overlay de texto al pie. Implementar un componente `TikTokMockup` que se seleccione con `post.red_social === "tiktok"`. Esto es especialmente relevante ahora que el calendario ya soporta TikTok.

- **[GENERAL] Extraer `monthGrid` a una utilidad compartida.**
  Archivos: `src/app/admin/(panel)/redes-sociales/page.tsx:51-60` y `src/app/revisor/page.tsx:74-83`.
  La función `monthGrid` está copiada textualmente en dos archivos. Crear `src/lib/calendar.ts` con esta función y las constantes `DAYS_SUN`, `isoDate`, `fmtDay` que también se repiten. Esto elimina la deuda de duplicación y facilita futuros cambios (ej: semana que inicie en lunes en lugar de domingo).
