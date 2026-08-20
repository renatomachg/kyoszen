# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-20
**Archivos examinados esta sesión:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/app/admin/(panel)/proyectos/page.tsx`
- Diff `2cffce9..460b1f3` (bloque de commits de proyectos)

---

## Cambios Recientes Detectados

Sigue **sin haber código nuevo desde 2026-08-13**. El trunk solo acumula reportes automatizados (`ux-kyo`, `dependencias`). El último bloque real analizado son los 3 commits sobre Proyectos:

| Commit | Descripción |
|---|---|
| `460b1f3` | `feat(proyectos)`: la pestaña de etapa dice cuánto material ya llegó, no solo aprobado |
| `46c41c1` | `fix(proyectos)`: pedir cambios no obliga a repetir el motivo si ya hay comentarios |
| `2cffce9` | `feat(proyectos)`: conversación admin ↔ colaborador por escena (compositor, comentarios, badge "Te pidieron cambios") |
| `287dca3` | `fix(seguridad)`: subidor de archivos sin sección fija |
| `d8fa46d` | `feat(campanas)`: campaña terminada se muestra finalizada |
| `32cc319` | `fix(seguridad)`: exigir sesión y permisos en todo el panel (51 rutas) |

**Riesgo de estancamiento:** ya son 7 días sin cambios de UX/producto. El backlog abajo tiene 11 elementos abiertos que llevan igual tiempo esperando.

---

## Rastreador de sugerencias — estado acumulado

| # | Sugerencia | Prioridad | Estado | Días abierto |
|---|---|---|---|---|
| 1 | Kyo lee `jobs.ts` estático, no Supabase | **Alta** | ⏳ Pendiente | 8 días |
| 2 | Memory leak en `rateLimitMap` sin limpieza | **Alta** | ⏳ Pendiente | 8 días |
| 3 | `navigate_to` acepta cualquier ruta (riesgo seguridad) | **Alta** | ⏳ Pendiente | 8 días |
| 4 | `saveConversation` guarda solo los últimos 20 mensajes | Media | ⏳ Pendiente | 8 días |
| 5 | `localStorage` del chat sin TTL — flujo se rompe al regresar | Media | ⏳ Pendiente | 8 días |
| 6 | `max_tokens: 1024` puede truncar el Paso 5 | Media | ⏳ Pendiente | 8 días |
| 7 | Panel de Kyo inutilizable en mobile con teclado virtual (`vh` → `dvh`) | Media | ⏳ Pendiente | 8 días |
| 8 | Markdown de Kyo no se renderiza (asteriscos literales) | Media | ⏳ Pendiente | 8 días |
| 9 | "Nueva conversacion" sin tilde en `ChatWidget.tsx:161` | Baja | ⏳ Pendiente | 8 días |
| 10 | Campaña finalizada sin CTA de upsell en `/revisor` | Baja | ⏳ Pendiente | 5 días |
| 11 | Comentarios de escena no notifican por correo al colaborador | Baja | ⏳ Pendiente | 5 días |
| 12 | `sessionStorage` vs `localStorage` inconsistente en Kyo | **Alta** | ⏳ Pendiente | 1 día |
| 13 | Navegación de Kyo cierra el chat sin transición visible | Media | ⏳ Pendiente | 1 día |
| 14 | Filtro `?marca=` del system-prompt apunta a empresas placeholder | Media | ⏳ Pendiente | 1 día |

**Solo #11 está atada al bloque nuevo de "conversación por escena" — vale la pena resolverla junto con la sugerencia nueva #17 de esta sesión (ver abajo), porque atacan el mismo hueco.**

---

## Nuevos hallazgos de esta sesión

### #15 — `reset()` de Kyo no borra el `session_id`, ensucia el log del admin
**Archivo:** `src/components/assistant/useChat.ts:139-145`
**Prioridad:** Media

`reset()` limpia `localStorage[STORAGE_KEY]` (los mensajes del widget) pero NO limpia el `sessionStorage.getItem("kyo_session_id")`. Consecuencia en `/admin/kyo`:

1. Candidato llena los 6 pasos, se le presentan vacantes, escribe "gracias" y cierra.
2. Vuelve al rato, toca "Nueva conversación" para preguntar por cursos.
3. En BD: el mismo `session_id` recibe un `upsert` con solo los 2 mensajes nuevos y **borra todo el flujo anterior de vacantes** (porque `messages` es un JSONB reemplazado, no un append).

Combinado con la sugerencia #12 (mover session_id a `localStorage`), el fix es:

```ts
const reset = useCallback(() => {
  setMessages([INITIAL_GREETING]);
  setError(null);
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("kyo_session_id"); // así la nueva conversación es una fila nueva en el admin
  }
}, []);
```

Sin este cambio la tabla `kyo_conversaciones` tiene datos silenciosamente corruptos: filas con flujo aparente "gracias / de nada" que en realidad reemplazaron una conversación de 12 turnos con datos de perfil valiosos.

---

### #16 — `saveConversation` sin `await` — riesgo de pérdida silenciosa en runtime edge/serverless
**Archivo:** `src/app/api/assistant/chat/route.ts:203-207`
**Prioridad:** Media

```ts
if (body.sessionId) {
  saveConversation(body.sessionId, history, replyContent, ip);
}
```

`saveConversation` es `async` pero se llama fire-and-forget. En `runtime = "nodejs"` de Next.js sobre VPS con PM2 el proceso sigue vivo y suele completar el upsert, **pero no está garantizado**: si el request se cancela (el usuario cierra pestaña) o el evento no se drena antes de que la instancia idle-se, el upsert se pierde.

Además, el resultado del upsert no se loggea nunca: si Supabase devuelve error (RLS, tabla en migración, service_role expirado), **el admin nunca lo detecta**.

**Fix:**
```ts
if (body.sessionId) {
  try {
    await saveConversation(body.sessionId, body.messages, replyContent, ip);
  } catch (e) {
    console.error("[assistant] save fail:", e);
  }
}
```

Nota: se cambió `history` por `body.messages` — arregla también la sugerencia #4 sin código adicional.

---

### #17 — Los cambios de "conversación por escena" agregaron un canal que el admin no controla
**Archivo:** `src/app/admin/(panel)/proyectos/page.tsx:572-593` + commit `2cffce9`
**Prioridad:** Media

El commit nuevo permite al admin escribir comentarios en cada escena (compositor tipo textarea + botón "Enviar comentario"). Al lado, "Pedir cambios" abre un recuadro rojo separado con **otro** textarea. Dos entradas de texto libre a 3 cm de distancia que hacen cosas parecidas:

- Compositor de comentarios → `POST /comments`, agrega un comentario sin cambiar estado.
- Motivo de cambios → `PATCH /status` con `comentario` opcional, agrega comentario + marca `cambios`.

Un admin apurado escribirá su feedback en el compositor y le dará a "Pedir cambios" pensando que ese texto se manda como motivo — y no. El motivo queda vacío o duplicado.

**Fix propuesto (mínimo, no requiere backend):**

```tsx
// Cuando el admin abre "Pedir cambios" y el compositor tiene texto no enviado,
// arrastrarlo al motivo:
<button onClick={() => {
  setPidiendoCambios(true);
  if (comentario.trim() && !motivoCambios.trim()) {
    setMotivoCambios(comentario.trim());
    setComentario("");
  }
}}>
```

O, mejor todavía, si `bloque.estado === "pendiente"` ocultar el compositor libre y dejar solo dos botones ("Aprobar" · "Pedir cambios"). El compositor libre solo tiene sentido después de aprobar o marcar cambios (para dar seguimiento). Menos cajas de texto = menos confusión sobre qué canal usar.

---

### #18 — El desglose textual de la etapa es útil pero no cabe en mobile
**Archivo:** `src/app/admin/(panel)/proyectos/page.tsx:170-181` (`resumenEtapa()`)
**Prioridad:** Baja

El commit `460b1f3` agrega la línea:
> "9 escenas · 1 con material · 1 con cambios pedidos · 8 sin empezar"

En desktop se ve bien; en mobile (~340 px de ancho útil dentro del modal) esta línea con 4 puntos separadores no rompe, por lo que sale con overflow horizontal o clipping según el navegador. Y en una etapa con estado maduro puede alcanzar 6 partes.

**Fix:** poner una barra flex-wrap alrededor y usar chips visuales en vez de texto corrido, para que se apilen naturalmente:
```tsx
<div className="mt-1 flex flex-wrap gap-1.5">
  <ChipInfo tono="slate">{progreso.total} escenas</ChipInfo>
  {material > 0    && <ChipInfo tono="amber">{material} con material</ChipInfo>}
  {progreso.aprobado > 0 && <ChipInfo tono="green">{progreso.aprobado} aprobadas</ChipInfo>}
  {progreso.cambios > 0  && <ChipInfo tono="red">{progreso.cambios} con cambios</ChipInfo>}
  {vacias > 0      && <ChipInfo tono="slate">{vacias} sin empezar</ChipInfo>}
</div>
```

Bonus: los chips de colores permiten leer el estado de la etapa sin leer el texto. Hoy la línea es un párrafo azul que hay que parsear palabra por palabra.

---

## Sugerencias de UX (anteriores no implementadas)

### Alta prioridad

- **#1 — Kyo lee `jobs.ts` estático, no Supabase.** `knowledge.ts:138` sigue leyendo del array `JOBS` en `src/lib/jobs.ts`. Fix propuesto en el reporte del 2026-08-19: reemplazar `StaticKnowledgeProvider.listJobs()` por consulta a `vacantes` en Supabase.

- **#2 — `rateLimitMap` crece sin límite.** `route.ts:68`. Fix: limpieza probabilística (1%) al inicio de `checkRateLimit`.

- **#3 — `navigate_to` sin lista blanca.** `tools.ts:105`. Fix: validar contra `RUTAS_PERMITIDAS` antes de retornar `navigated: true`.

- **#12 — `sessionStorage` para session ID vs `localStorage` para mensajes.** `useChat.ts:47`. Fix: mover el session_id a `localStorage` y agregar `removeItem` en `reset()` (ver #15 arriba).

### Media prioridad

- **#4 — `saveConversation` guarda solo los últimos 20 mensajes.** Se resuelve automáticamente con el fix de #16.
- **#5 — Historial de Kyo sin TTL.** `useChat.ts:29`. Filtrar por `timestamp > hace24h` en `loadHistory()` (con excepción `id === "greeting"`).
- **#6 — `max_tokens: 1024` puede truncar el Paso 5.** Subir a 2048.
- **#7 — Kyo con teclado virtual en mobile.** `ChatWidget.tsx:120`: `min(60vh,560px)` → `min(60dvh,560px)`.
- **#8 — Asteriscos de markdown se muestran literales.** Parser inline en `MessageBubble`.
- **#13 — Navegación de Kyo sin transición visible.** Burbuja transitoria antes de `router.push`.
- **#14 — `?marca=` en system-prompt con valores placeholder.** Reemplazar por lista real de Supabase o cambiar a `?q=` texto libre.

### Baja prioridad

- **#9 — "Nueva conversacion" sin tilde** en `ChatWidget.tsx:161`.
- **#10 — Campaña finalizada sin CTA de upsell** en `/revisor`.
- **#11 — Comentarios de escena no notifican al colaborador por correo.** El commit `2cffce9` cierra la nota en su propio mensaje: "No se manda correo: estas cuentas usan correos internos que no existen." Reabrir cuando existan cuentas reales, o abrir un canal alternativo (WhatsApp / notificación in-app).

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Paso 3 (ubicación) usa comparación exacta.** `knowledge.ts:140`. Fix: cambiar `===` por `.includes()` + función `normalizarUbicacion` en `tools.ts` (reconoce "Iztapalapa", "Ecatepec", "Neza", etc.).

- **Flujo empresa mínimo.** Agregar 2 preguntas al bloque de empresas antes de mandar a `/contacto` (puesto, cantidad + plazo). Hoy se pierden leads calificados por falta de captura.

- **Cierre voluntario.** Agregar rama para "gracias / adiós / ya no": responder con calidez y no navegar. Hoy Kyo puede insistir con vacantes o cursos cuando el usuario ya se despidió.

- **NUEVO — Kyo no distingue "recontacto" de "nueva búsqueda".** Un candidato que ya completó el flujo la semana pasada y regresa recibe otra vez la pregunta del nombre. Con el fix de #12 (session_id persistente en `localStorage`), el system-prompt puede ver `history.length > 6` y arrancar con: *"Hola de nuevo. ¿Sigue buscando trabajo de [puesto anterior] o cambió lo que necesita?"* — reactivar la conversación sin repetir preguntas.

### Nuevas tools o capacidades recomendadas

- **Tool `start_application`** (aplicar sin salir del chat). Llama `POST /api/aplicar` con los 4 datos ya recopilados + WhatsApp.
- **Tool `save_to_talent_bank`** (registrar candidato sin vacante compatible). Inserta en `aplicaciones` con `estado='banco_talentos'`.
- **NUEVO — Tool `agendar_llamada`** para candidatos calificados que dicen "prefiero que me llamen". Insertaría en `contactos` con `tipo='llamada_agendada'` + franja horaria. Convierte una respuesta pasiva ("ok gracias") en un lead accionable.

### Problemas detectados (bugs)

- **BUG — `saveHistory` corre con `messages = []` en el primer render.** `useChat.ts:70`. Fix: `useRef historyCargado` que se levanta después del `setMessages(loadHistory())`.
- **BUG — `sessionStorage` para session ID.** Ver #12/#15.
- **BUG — `saveConversation` fire-and-forget sin log de errores.** Ver #16.
- **BUG — `saveConversation` pasa `history` (20) en vez de `body.messages`.** Ver #4/#16.
- **BUG — Navegación de Kyo sin transición visible.** Ver #13.

---

## Oportunidades de mejora general

- **#10 — CTA de upsell al finalizar campaña** en `/revisor`.
- **#11 — Correo al colaborador cuando el admin comenta una escena** (o alternativa in-app / WhatsApp).
- **#14 — Actualizar valores de `?marca=` en system-prompt.**
- **NUEVO — Error 503 debe ofrecer WhatsApp como fallback.** `useChat.ts:104-106`. Cuando Anthropic está caído o `ANTHROPIC_API_KEY` no está configurada, el candidato ve un texto seco. En 5 segundos podría redirigirse a `https://wa.link/5zv0ba` como escape hatch — es exactamente el momento en que más importa no perder el lead.
- **NUEVO — Informe mensual sin métricas de campañas pagadas.** `src/lib/social-informe.ts` no consulta `campanas`. Con la campaña GPG viva vale la pena agregar sección "Campañas pagadas" con conteo + placeholder para Meta insights (Fase 2).
- **NUEVO — Rastreador de sugerencias no re-verifica automáticamente.** Este reporte lleva 8 días marcando #1–#9 como "pendiente" sin volver a leer los archivos. Si alguien las arregla localmente y no se toca este archivo, el tracker se queda mintiendo. Añadir a la próxima iteración del prompt: "para cada item pendiente, `Grep` el patrón que introdujo el bug y marcar `✅ Corregido` cuando no aparezca". Bajo costo, alta señal.
