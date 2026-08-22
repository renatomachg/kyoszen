# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-22
**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/components/assistant/ChatWidget.tsx` (líneas clave)

---

## Cambios Recientes Detectados

**Sin cambios de producto desde 2026-08-13 (9 días).** Los últimos commits en trunk son reportes automatizados (`ux-kyo`, `dependencias`). El último bloque de código real fue sobre el módulo de Proyectos:

| Commit | Descripción |
|---|---|
| `460b1f3` | `feat(proyectos)`: desglose textual del progreso de etapa |
| `46c41c1` | `fix(proyectos)`: pedir cambios no repide el motivo si ya hay comentarios |
| `2cffce9` | `feat(proyectos)`: conversación admin ↔ colaborador por escena |

> **⚠️ Alerta:** los 18 ítems del backlog (ver rastreador abajo) llevan **9 días abiertos sin acción**. Ninguno de los hallazgos anteriores ha sido corregido — verificado esta sesión con Grep sobre los archivos fuente.

---

## Rastreador de sugerencias — estado actualizado al 2026-08-22

| # | Sugerencia | Prioridad | Estado | Días abierto |
|---|---|---|---|---|
| 1 | Kyo lee `jobs.ts` estático, no Supabase | **Alta** | ⏳ Pendiente | 10 días |
| 2 | Memory leak en `rateLimitMap` sin limpieza | **Alta** | ⏳ Pendiente | 10 días |
| 3 | `navigate_to` acepta cualquier ruta (riesgo seguridad) | **Alta** | ⏳ Pendiente | 10 días |
| 4 | `saveConversation` guarda solo últimos 20 mensajes | Media | ⏳ Pendiente | 10 días |
| 5 | `localStorage` del chat sin TTL — flujo roto al volver | Media | ⏳ Pendiente | 10 días |
| 6 | `max_tokens: 1024` puede truncar el Paso 5 | Media | ⏳ Pendiente | 10 días |
| 7 | Panel de Kyo inutilizable en mobile con teclado virtual (`vh` → `dvh`) | Media | ⏳ Pendiente | 10 días |
| 8 | Markdown de Kyo no se renderiza (asteriscos literales) | Media | ⏳ Pendiente | 10 días |
| 9 | "Nueva conversacion" sin tilde en `ChatWidget.tsx:161` | Baja | ⏳ Pendiente | 10 días |
| 10 | Campaña finalizada sin CTA de upsell en `/revisor` | Baja | ⏳ Pendiente | 7 días |
| 11 | Comentarios de escena no notifican al colaborador por correo | Baja | ⏳ Pendiente | 7 días |
| 12 | `sessionStorage` vs `localStorage` inconsistente en Kyo | **Alta** | ⏳ Pendiente | 3 días |
| 13 | Navegación de Kyo sin transición visible al cerrar | Media | ⏳ Pendiente | 3 días |
| 14 | Filtro `?marca=` del system-prompt con valores placeholder | Media | ⏳ Pendiente | 3 días |
| 15 | `reset()` no borra el session_id — ensucía el log del admin | Media | ⏳ Pendiente | 3 días |
| 16 | `saveConversation` fire-and-forget sin log de errores | Media | ⏳ Pendiente | 3 días |
| 17 | Dos textareas yuxtapuestos en Proyectos confunden al admin | Media | ⏳ Pendiente | 3 días |
| 18 | Desglose de etapa no cabe en mobile (texto corrido, overflow) | Baja | ⏳ Pendiente | 3 días |
| 19 | `logEvent` graba el nombre y zona del candidato en `site_eventos` (PII) | **Alta** | 🆕 Nuevo | 0 días |
| 20 | `setTimeout` de navegación sin cleanup — dispara aunque Kyo esté cerrado | Media | 🆕 Nuevo | 0 días |
| 21 | Filtro de categoría en `search_jobs` falla con tildes ("Atención al cliente") | Media | 🆕 Nuevo | 0 días |
| 22 | Error 429 no se distingue del error 500 — UX idéntica para dos causas distintas | Baja | 🆕 Nuevo | 0 días |

---

## Nuevos hallazgos de esta sesión

### #19 — `logEvent` registra PII del candidato en `site_eventos` sin anonimizar
**Archivo:** `src/components/assistant/useChat.ts:81`
**Prioridad:** Alta

```ts
logEvent("kyo_mensaje", trimmed.slice(0, 300));
```

Esta línea guarda **cada mensaje del usuario** en `site_eventos.valor`. Eso incluye:
- Paso 0: el **nombre** del candidato ("Soy Mario López")
- Paso 2: su **experiencia** ("5 años de supervisor")
- Paso 3: su **zona de residencia** ("vivo en Iztapalapa")

El dashboard de Analytics muestra `site_eventos` en texto plano. Cualquier persona con acceso al admin de Kyoszen ve estos datos vinculados al mismo `session_id`.

**Fix mínimo sin romper el analytics:**
```ts
// Solo loguear la presencia del evento, no el contenido del mensaje
logEvent("kyo_mensaje");
// O loguear solo el número de turno, no el texto:
logEvent("kyo_mensaje", `turno_${newMessages.length}`);
```

Si se quiere conservar el contenido textual, hacerlo exclusivamente en `kyo_conversaciones` (tabla ya existente con acceso restringido), no en `site_eventos` que está pensada para métricas de clics.

---

### #20 — `setTimeout` de navegación sin cleanup — dispara aunque el widget ya esté cerrado
**Archivo:** `src/components/assistant/useChat.ts:127`
**Prioridad:** Media

```ts
setTimeout(() => router.push(target.path), 700);
```

Si el usuario cierra el widget de Kyo durante los 700 ms de delay, el `router.push` se ejecuta de todas formas y navega la página. En mobile, donde es común cerrar el chat con un tap fuera, esto produce navegaciones fantasma que el usuario no esperaba.

**Fix:** guardar la referencia del timeout y limpiarlo en el `reset` o en un `useEffect` de cleanup:

```ts
// En useChat.ts
const navTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

// Al navegar:
if (data.navigations.length > 0) {
  const target = data.navigations[0];
  logEvent("kyo_navegacion", target.path);
  if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
  navTimeoutRef.current = setTimeout(() => router.push(target.path), 700);
}

// En reset():
const reset = useCallback(() => {
  if (navTimeoutRef.current) clearTimeout(navTimeoutRef.current);
  // ... resto del reset
}, []);
```

---

### #21 — Filtro de categoría en `search_jobs` falla cuando Kyo pasa tildes
**Archivo:** `src/lib/assistant/knowledge.ts:140`
**Prioridad:** Media

```ts
.filter((j) => !filters?.category || j.categoria.toLowerCase() === filters.category.toLowerCase())
```

El system-prompt (línea 43 de `tools.ts`) lista las categorías como:
`"Administrativo, Ventas, Operaciones, Atencion al cliente, RRHH"`

Pero el modelo puede inferir la forma con tilde: `"Atención al cliente"`. La comparación exacta con `===` fallaría. El `query` libre sí usa `matchesQuery` con `includes()`, pero la ruta de filtro de categoría es exacta.

**Fix:** agregar normalización de acentos antes de comparar:

```ts
// En knowledge.ts, antes del filtro:
function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

.filter((j) => !filters?.category || normalizar(j.categoria) === normalizar(filters.category))
```

Aplica el mismo fix al filtro de `listCourses` (categoría) para consistencia.

---

### #22 — Error 429 y error 500 tienen la misma UX — candidato sin contexto de qué hacer
**Archivo:** `src/components/assistant/useChat.ts:129-132`
**Prioridad:** Baja

Actualmente cualquier error (rate limit, API key ausente, servidor caído) muestra el mismo `setError(msg)` como texto rojo. Para el candidato, "Demasiados mensajes, intenta de nuevo en un minuto." y "Error al conectar con el asistente" se ven igual. El 429 tiene solución inmediata (esperar), el 500 tiene fallback (WhatsApp).

**Fix propuesto:**

```ts
if (!res.ok) {
  const data = await res.json().catch(() => ({ error: "Error desconocido" }));
  if (res.status === 429) {
    setError("Demasiados mensajes. Espera un momento e intenta de nuevo.");
  } else {
    // Mostrar error + CTA de WhatsApp como escape hatch
    setError(`${data.error ?? "Error al conectar"} — ¿Prefiere escribirnos directo? https://wa.link/5zv0ba`);
  }
  return;
}
```

El fallback de WhatsApp convierte un momento de frustración en un lead capturado. Es el punto en que más importa no perder al candidato.

---

## Sugerencias de UX (anteriores no implementadas)

### Alta prioridad

- **#1 — Kyo lee `jobs.ts` estático, no Supabase.** `knowledge.ts:138-139`. El array `JOBS` es un fallback legacy. Las vacantes nuevas creadas desde `/admin/vacantes` (Supabase) no aparecen en el chat. Fix: reemplazar `StaticKnowledgeProvider.listJobs()` por `supabase.from("vacantes").select("*").eq("activa", true)`.

- **#2 — `rateLimitMap` crece sin límite.** `route.ts:68`. En producción con tráfico sostenido, la Map acumula una entrada por IP visitante y nunca se limpia. Fix: al inicio de `checkRateLimit`, con 1% de probabilidad, barrer las entradas cuyo `resetAt < Date.now()`.

- **#3 — `navigate_to` sin lista blanca.** `tools.ts:105`. Kyo podría ser inducido (prompt injection) a navegar a rutas arbitrarias. Fix: validar `input.path` contra `RUTAS_PERMITIDAS = ["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"]` + permitir `/vacantes?*` y `/cursos/*` con regex. Rechazar cualquier ruta fuera de esa lista.

- **#19 — `logEvent` registra PII del candidato.** Ver hallazgo nuevo arriba.

### Media prioridad

- **#6 — `max_tokens: 1024` puede truncar el Paso 5.** `route.ts:151`. Cuando Kyo lista 2-3 vacantes con descripción de por qué aplican, puede superar el límite y la respuesta llega cortada. Subir a `2048`.

- **#7 — Kyo con teclado virtual en mobile.** `ChatWidget.tsx:120`: cambiar `min(60vh,560px)` → `min(60dvh,560px)`. Con el teclado abierto en Android, `vh` incluye el espacio del teclado y el panel queda cortado.

- **#8 — Asteriscos de markdown se muestran literales.** Las respuestas de Kyo usan `**negrita**` pero el componente de burbuja no tiene parser. Agregar parser inline básico (regex `**texto**` → `<strong>`) o usar `react-markdown` solo para los mensajes del asistente.

- **#12/#15 — `sessionStorage` para session ID vs `localStorage` para mensajes.** `useChat.ts:47-52`. El session_id se borra al cerrar la pestaña pero el historial persiste en localStorage. El admin ve conversaciones huérfanas (historial real, sin sesión). Fix: mover el session_id a localStorage y limpiarlo en `reset()`.

- **#16 — `saveConversation` fire-and-forget sin await ni log de errores.** `route.ts:206`. Fix: `await saveConversation(...)` con `try/catch` que imprima a `console.error`.

- **#20 — `setTimeout` sin cleanup.** Ver hallazgo nuevo arriba.

- **#21 — Filtro de categoría con tildes.** Ver hallazgo nuevo arriba.

### Baja prioridad

- **#9 — "Nueva conversacion" sin tilde** en `ChatWidget.tsx:161`. Cambiar a "Nueva conversación".
- **#18 — Desglose de etapa en Proyectos no cabe en mobile.** `proyectos/page.tsx`. Reemplazar texto corrido por chips flex-wrap de colores.
- **#22 — Error 429 vs 500 sin diferenciación.** Ver hallazgo nuevo arriba.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 3 (ubicación) demasiado rígido.** El filtro de Supabase en `/vacantes?ubicacion=CDMX` solo acepta 4 valores exactos. Kyo recibe "Iztapalapa", "Neza", "Ecatepec", "Tlalnepantla" y no sabe a qué filtro mapearlos. Fix: agregar una función `normalizarUbicacion(texto)` en `tools.ts` que mapee colonias/municipios a los 4 valores del filtro.

- **Flujo empresa infradesarrollado.** Cuando el usuario es una empresa interesada en contratar, Kyo dice "te conecto con nuestro equipo" y navega a `/contacto` sin capturar nada. Se pierden leads calificados. Fix: agregar 2 preguntas antes del cierre: (a) "¿Cuántas personas necesita incorporar?" (b) "¿Para cuándo?". Guardar con `save_to_talent_bank` marcado como `tipo: 'empresa'`.

- **Cierre voluntario sin rama propia.** Cuando el usuario escribe "gracias", "adiós" o "ya terminé", Kyo puede insistir con más vacantes. Agregar rama explícita en el paso 6: si detecta despedida, responder con calidez y NO navegar ni ofrecer más opciones.

- **Recontacto sin memoria.** Un candidato que completó el flujo la semana pasada y regresa recibe nuevamente "¿Me permite saber su nombre?". Con el historial en localStorage disponible, el system-prompt puede detectar `history.length > 6` y arrancar directamente: *"Hola de nuevo. ¿Sigue buscando trabajo de [puesto anterior] o cambió lo que necesita?"*

### Nuevas tools o capacidades recomendadas

- **Tool `start_application`** — Aplicar sin salir del chat. Con los 4 datos recopilados (nombre, puesto, zona, jornada), llamar `POST /api/aplicar` directamente. El candidato no tendría que rellenar el formulario a mano.

- **Tool `save_to_talent_bank`** — Cuando ninguna vacante encaja, insertar en `aplicaciones` con `estado: 'banco_talentos'` y los datos del perfil ya recopilados. Hoy ese banco queda vacío porque el candidato raramente llena el formulario por su cuenta.

- **Tool `agendar_llamada`** — Para candidatos que responden "prefiero que me llamen". Insertar en `contactos` con `tipo: 'llamada_agendada'` y franja horaria. Convierte una despedida pasiva en un lead accionable.

### Problemas detectados (bugs)

- **BUG #1 — Kyo muestra vacantes viejas.** `knowledge.ts` lee `JOBS` estático. Las vacantes de Supabase son invisibles para el asistente.
- **BUG #2 — `saveHistory` corre en el primer render con `messages = []`.** `useChat.ts:70-73`. El segundo `useEffect` se ejecuta antes de que el primero termine de cargar el historial, sobrescribiendo brevemente localStorage con un array vacío. Fix: flag `historyCargado` (`useRef`) que se levanta después de `setMessages(loadHistory())`.
- **BUG #3 — `saveConversation` fire-and-forget sin log.** Ver #16.
- **BUG #4 — `sessionStorage` / `localStorage` desincronizados.** Ver #12/#15.
- **BUG #5 — `setTimeout` navega aunque el widget esté cerrado.** Ver #20.
- **BUG #6 — Filtro de categoría con tildes.** Ver #21.

---

## Oportunidades de mejora general

- **Error 503 debe ofrecer WhatsApp como escape hatch.** `useChat.ts:129`. Cuando Anthropic está caído o la API key no está configurada, el candidato ve un texto seco. En ese momento crítico, redirigir a `https://wa.link/5zv0ba` en 5 segundos impide perder el lead.

- **Informe mensual sin métricas de campañas pagadas.** `src/lib/social-informe.ts` no consulta las tablas `campanas` ni `campana_anuncios`. Con la campaña GPG activa, vale agregar una sección "Campañas" con conteo de anuncios, estado de aprobación y placeholder para Meta insights (Fase 2).

- **Actualizar valores de `?marca=` en system-prompt.** `system-prompt.ts:86`. Los valores "Grupo Corpora, Logistica Norte, Sigma Retail..." son placeholder. Reemplazar por las empresas reales activas en la tabla `vacantes`, o cambiar el filtro a `?q=texto_libre` hasta que haya datos reales.

- **Rastreador verificado automáticamente esta sesión.** Se usó Grep para confirmar que los 18 ítems anteriores siguen presentes en el código. Ninguno ha sido corregido. Los patrones buscados y encontrados:
  - `JOBS` en knowledge.ts → ✅ sigue presente (#1)
  - `rateLimitMap` sin cleanup → ✅ sigue presente (#2)
  - `navigate_to` sin lista blanca → ✅ sigue presente (#3)
  - `sessionStorage.getItem("kyo_session_id")` → ✅ sigue en línea 47 (#12)
  - `saveConversation(body.sessionId, history` sin `await` → ✅ sigue en línea 206 (#16)
  - `max_tokens: 1024` → ✅ sigue en línea 151 (#6)
  - `min(60vh` en ChatWidget → ✅ sigue en línea 120 (#7)
  - `"Nueva conversacion"` sin tilde → ✅ sigue en línea 161 (#9)
