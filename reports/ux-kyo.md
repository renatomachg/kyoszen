# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-28
**Cambios analizados:** `eb831e9` (subcarpetas + vista previa + rediseño corporativo revisor y admin), `abb0ba0` (hub Espacios), plus archivos base del asistente Kyo.

---

## Cambios Recientes Detectados

- **Proyectos Hub — Subcarpetas (K):** navegación tipo Drive con breadcrumb en cliente y admin; archivos huérfanos suben a raíz si se borra la carpeta.
- **Vista previa de archivos (L/M):** miniatura real en tarjeta (imagen `<img>`, PDF `<iframe>` vertical); visor grande embebido al hacer clic con botones Abrir/Descargar.
- **Rediseño corporativo revisor y admin (N/O/P):** fuera emojis decorativos, íconos SVG de línea por tipo, mosaico blue-wash, tarjetas sobrias en `/revisor` y `/admin/proyectos`.

---

## Sugerencias de UX

### Alta prioridad

- **[ProyectosCliente.tsx:1044-1049] Empty state de carpeta vacía usa emoji 📂 — inconsistente con el rediseño.**
  Los commits N/O/P eliminaron emojis decorativos del admin, pero el estado vacío de `ArchivosCliente` sigue usando `<span aria-hidden="true" style={{ fontSize: 36 }}>📂</span>`. Reemplazar por el componente `MosaicoEspacio tipo="archivos"` ya definido en el mismo archivo (línea 165), que muestra el ícono SVG de línea con el fondo blue-wash. Sin ese cambio, el empty state rompe la consistencia visual que el rediseño buscó.

- **[ProyectosCliente.tsx:573-594] Botón "Aprobar todas las pendientes" — sin confirmación de masa.**
  El botón de la línea 682 dispara un `for` que llama `patchEstado` en serie sin confirmación previa. En un proyecto con 8+ escenas el cliente puede pulsar por error y aprobar todo sin haberlo revisado. Añadir un diálogo de confirmación inline antes del loop: "Aprobarás X escenas pendientes. ¿Continuar?" — implementable con un estado booleano `confirmarAprobacionMasiva` y un pequeño panel que aparece sobre el botón.

- **[ProyectosCliente.tsx:806-818] Aprobar archivo cierra el modal sin feedback de éxito.**
  En `DetalleArchivo.aprobar()` se llama `onUpdated()` y luego `onClose()` de inmediato. El usuario ve el modal cerrar de golpe sin confirmación de que el archivo quedó aprobado. Añadir un estado transitorio de 1s: `const [exito, setExito] = useState(false)` → mostrar "✅ Aprobado" en el header del modal durante 1s antes de cerrar con `setTimeout(onClose, 1000)`.

- **[ProyectosCliente.tsx:1023-1042] Breadcrumb con áreas táctiles insuficientes en mobile.**
  Los botones del breadcrumb tienen `padding: "6px 8px"` y `fontSize: 12`, resultando en áreas táctiles menores a los 44×44px mínimos de WCAG 2.1. Aumentar a `padding: "10px 14px"` y `fontSize: 13`. También aplicar `minHeight: 36` al botón "Raíz" para que todos los elementos del breadcrumb sean alcanzables sin error en teléfono.

### Media prioridad

- **[ProyectosCliente.tsx:882] PDF en visor grande sin parámetros de limpieza de toolbar.**
  La tarjeta miniatura usa `urlMiniaturaPdf()` (línea 1076) que añade `#toolbar=0&navpanes=0&view=Fit`, pero el visor grande (línea 882 en `DetalleArchivo`) usa `archivo.url` directo. En Chrome el visor nativo aparece con toolbar de descarga/print, lo que distrae al cliente en modo revisión. Cambiar línea 882 a `src={urlMiniaturaPdf(archivo.url)}` (la función ya está importada en el mismo scope).

- **[ProyectosCliente.tsx:904-942] Dos cuadros de texto simultáneos en `DetalleArchivo` son ambiguos.**
  Cuando `pidiendoCambios` es false, el usuario ve el textarea de "Publicar comentario" debajo de los botones. Cuando activa "Necesito cambios", aparece el form rojo encima. Si el cliente escribe algo en el comentario general primero y luego pulsa "Necesito cambios", el contenido previo se pierde. Limpiar el textarea general cuando `setPidiendoCambios(true)` (ya existe la línea `setComentario("")`), y añadir una etiqueta visible "Dejar un comentario" sobre el textarea general para diferenciar ambos flujos visualmente.

- **[ProyectosCliente.tsx:1052-1065] Tarjetas de carpeta usan emoji 📁 — inconsistente con el rediseño.**
  Las tarjetas de carpeta en `ArchivosCliente` usan `<span aria-hidden="true" style={{ fontSize: 46 }}>📁</span>`. Reemplazar por un ícono SVG de línea (carpeta abierta, estilo Heroicons) igual que `IconoEspacio`, con el mismo envoltorio blue-wash del resto del rediseño.

- **[InformeCliente.tsx] Selector de mes sin indicador del informe más reciente.**
  El componente muestra varios informes con índice (`idx`), pero no indica cuál es el más reciente. Al cargar, `idx=0` pero el array puede estar en cualquier orden. Añadir una píldora "Más reciente" o borde destacado al primer ítem del selector, y en `useEffect` ordenar descendente por `periodo` antes de setear `setInformes` para garantizar que el 0 siempre sea el último.

---

## Sugerencias para el Asistente Kyo

### Problema crítico — datos desincronizados

- **[src/lib/assistant/knowledge.ts:2] Kyo lee vacantes del array estático `JOBS`, el sitio lee de Supabase.**
  `knowledge.ts` línea 2 importa `{ JOBS }` desde `@/lib/jobs` (9 vacantes hardcodeadas). El sitio público `/vacantes/page.tsx` lee de Supabase (tabla `vacantes`, solo `activa=true`). Esto significa que Kyo puede recomendar vacantes cerradas, o no saber de vacantes activas recientes creadas desde el admin. **Corrección inmediata:** crear un endpoint `/api/assistant/jobs` (GET, con anon key, filtra `activa=true`) y actualizar `StaticKnowledgeProvider.listJobs()` — o mejor, activar `SupabaseKnowledgeProvider` que ya está definido como interfaz en `knowledge.ts:42`. Mientras llega esa refactorización, al menos sincronizar manualmente `JOBS` con el seed real de Supabase.

### Mejoras al flujo de conversación

- **[src/lib/assistant/system-prompt.ts:40-50] Paso 5 no tiene criterios de ranking — Kyo elige arbitrariamente qué 2-3 mostrar.**
  La instrucción dice "muestra SOLO las 2-3 vacantes más compatibles", pero `search_jobs` devuelve todos los resultados sin score. Si hay 6 vacantes que coinciden por categoría, el modelo elige sin criterio claro. Añadir al final del Paso 5 en el system prompt:
  ```
  Criterio de priorización: 1) ubicación exacta match > 2) misma jornada pedida > 3) salario más alto.
  Nunca muestres más de 3 vacantes aunque haya más.
  ```

- **[src/lib/assistant/system-prompt.ts:28-38] El flujo es rígido — hace las 4 preguntas aunque el candidato ya las respondió todas en un mensaje.**
  Si el candidato escribe "busco trabajo de cajero en Iztapalapa, tiempo completo, tengo 2 años de experiencia", Kyo sigue preguntando experiencia, luego ubicación, luego jornada — una por una. Añadir instrucción de extracción múltiple al inicio del Paso 1:
  ```
  Si el usuario responde a más de un paso en un solo mensaje, extrae todos los datos disponibles
  y salta directamente al siguiente dato que aún falte. No hagas preguntas que ya respondió.
  ```

- **[src/lib/assistant/system-prompt.ts:64-68] Flujo de empresa no llama `navigate_to` — el candidato recibe texto sin acción.**
  Cuando detecta que el usuario es una empresa, el system prompt dice "sugiere WhatsApp o navega a /contacto", pero no instruye a llamar la tool. El modelo a menudo solo responde con texto. Cambiar a: "Cuando el usuario sea empresa, llama `navigate_to` con path='/contacto' y reason='Conectar con el equipo de reclutamiento', y en tu respuesta menciona el WhatsApp 56 4004 5414."

- **[src/app/api/assistant/chat/route.ts:202] Mensaje fallback genérico cuando no se genera texto.**
  Línea 202: `"Entendido, ¿en que mas te puedo ayudar?"` — aparece cuando el modelo solo llamó tools y no generó texto. Queda fuera de tono con el flujo de 6 pasos. Cambiar a `""` (string vacío) y que el frontend lo ignore mostrando solo el resultado de la navegación, o añadir instrucción en el system prompt: "Siempre responde al menos 1-2 líneas de texto antes de llamar cualquier tool."

### Nuevas tools o capacidades recomendadas

- **Tool: `register_candidate`** — Cuando no hay vacante compatible (Paso 5 fallback), Kyo actualmente solo navega a `/contacto` y el candidato puede abandonar. Una tool que reciba `nombre`, `puesto_buscado` y `contacto` (WhatsApp o correo) e inserte en Supabase tabla `contactos` con `tipo='banco_talentos'` cerraría el loop sin requerir que el candidato llene el formulario completo. Alta recuperación de leads.

- **Tool: `get_salary_range`** — Devuelve el rango salarial de una categoría leyendo vacantes activas de Supabase. Actualmente Kyo no puede responder "¿cuánto pagan?" sin detalles de una vacante específica. Muchos candidatos preguntan el salario antes de dar su información. Esta tool permitiría responder "Los puestos de Cajero van de $8,500 a $11,000/mes" con datos reales y mantener al candidato en el flujo.

### Problemas detectados

- **[src/app/vacantes/[id]/page.tsx:1] Detalle de vacante individual sigue leyendo de `JOBS` estático.**
  La página de detalle importa `JOBS` de `@/lib/jobs`. Si Kyo navega a una vacante creada desde el admin (nueva en Supabase, no en el array), el usuario llega a una página vacía o 404. Migrar `/vacantes/[id]/page.tsx` a leer de Supabase igual que la lista pública. Prioridad alta por ser el CTA final del flujo de Kyo.

- **[src/lib/assistant/system-prompt.ts:85] Valor de filtro URL con error de acento.**
  El system prompt lista `ubicacion=Estado de Mexico` (sin acento), pero el componente `/vacantes/page.tsx` compara con `"Estado de México"` (con acento). La URL generada por Kyo no activará el filtro del dropdown. Cambiar línea 85 del system prompt a `ubicacion=Estado%20de%20M%C3%A9xico` o mejor dejar la comparación case-insensitive en `vacantes/page.tsx`.

- **[src/app/api/assistant/chat/route.ts:68-80] Rate limiter en memoria se resetea con cada deploy/restart de PM2.**
  El `rateLimitMap` vive en el proceso Node. Al reiniciar PM2 (cada deploy), el contador se borra. No es crítico en producción de 1 instancia, pero sí un vector de abuso justo tras un deploy. Para protección mínima sin Upstash: guardar el count de mensajes por IP en `site_eventos` con tipo `kyo_mensaje` (ya se loggea con `logEvent`) y checkear ahí.

---

## Oportunidades de mejora general

- **Kyo no recupera la conversación al refrescar la página.** Los mensajes se guardan en `kyo_conversaciones` por `session_id` (chat/route.ts:204-207), pero el ChatWidget no los carga al iniciar. El candidato que refresca accidentalmente pierde el contexto del Paso 3 o 4 y Kyo reinicia desde el saludo. Corrección de bajo costo: guardar el historial serializado en `sessionStorage` en el frontend (clave `kyo_session_<sessionId>`), restaurarlo al montar el widget. Sin cambios de backend.

- **Kyo no bifurca empresa vs candidato hasta que el texto lo revela tardíamente.** Si una empresa pregunta "necesito contratar 10 cajeros", Kyo hace el Paso 1 ("¿Qué tipo de trabajo busca?") antes de identificar que es empresa. Añadir al Paso 0/1 del system prompt una regla de detección temprana: "Si el primer mensaje contiene 'contratar', 'necesito personal', 'busco candidatos' o similares, ve directamente al flujo de empresa sin hacer las 4 preguntas de candidato."

- **Kyo carece de indicador de "buscando" contextual.** Durante el tool-use loop, el usuario ve el spinner genérico del widget. Si la búsqueda tarda 2-3s, el candidato no sabe qué está pasando. En el ChatWidget, detectar cuando el mensaje más reciente del usuario fue respondido con `navigations.length > 0` o está en estado `loading`, y mostrar un texto contextual intermedio como "Buscando vacantes para tu perfil…" antes de mostrar la respuesta.

- **El panel `/admin/kyo` no documenta las tools disponibles.** Si el admin edita el system prompt y elimina o altera la instrucción de `navigate_to`, Kyo deja de navegar sin error visible. Añadir en el tab de configuración una sección colapsable "Tools disponibles" con la lista de las 6 tools y una línea de descripción de cada una (dato estático, sin API). Esto previene que el admin rompa el comportamiento sin saberlo.
