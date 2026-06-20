# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-20
**Cambios analizados:** `src/app/api/admin/social/upload/route.ts` (compresión ffmpeg de TikToks). Re-lectura de: `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`.

---

## Cambios Recientes Detectados

**1 commit de código desde ayer:** `1c2590d Redes: comprimir videos con ffmpeg al subir (TikTok)` — el endpoint `/api/admin/social/upload` ahora detecta video y lo transcodifica a MP4 H.264 vía `ffmpeg` antes de subirlo a Storage. Fallback automático si `ffmpeg` no está disponible. Implementación sólida con limpieza de tmp en `finally`.

**Todos los bugs del reporte anterior (2026-06-19) siguen sin resolver** — es el **9º día** para la mayoría. Se mantienen en la tabla de prioridades al final.

---

## 🔴 BUGS CRÍTICOS — BLOQUEANTES (heredados)

> Los bugs 1, 2, 3, 14, 16, 23, 25, 26, 28, 29, 32, 33, 36, 37, 38, 39, 40 del reporte anterior siguen abiertos. Solo se documentan los nuevos detectados hoy.

---

## 🟡 BUGS NUEVOS — DETECTADOS HOY (2026-06-20)

### BUG 41 — Sin limite de tamaño antes de intentar comprimir video
**Archivo:** `src/app/api/admin/social/upload/route.ts` líneas 55-69

El endpoint lee `file.arrayBuffer()` completo en memoria **antes** de llamar a `comprimirVideo`. Un archivo de 800 MB intentará cargarse en RAM y luego escribirse en `/tmp` antes de que ffmpeg lo rechace o el VPS se quede sin memoria. El límite de 50 MB de Storage solo aplica al archivo ya comprimido.

**Fix:** Añadir validación de tamaño antes del `arrayBuffer()`:
```ts
const MAX_INPUT_MB = 500;
if (file.size > MAX_INPUT_MB * 1024 * 1024) {
  return NextResponse.json(
    { error: `El archivo pesa más de ${MAX_INPUT_MB} MB. Comprime el video antes de subir.` },
    { status: 413 }
  );
}
```

---

### BUG 42 — Archivos tmp huérfanos si el proceso Next.js muere durante compresión
**Archivo:** `src/app/api/admin/social/upload/route.ts` líneas 21-46

El bloque `finally` limpia `input` y `output` al terminar normalmente. Pero si PM2 reinicia el proceso durante la compresión (por deploy o watchdog), los archivos `kyo-{stamp}-in` y `kyo-{stamp}-out.mp4` quedan en `/tmp` indefinidamente. En un VPS de 50 GB esto puede acumularse con el tiempo.

**Fix recomendado (bajo costo):** Añadir una tarea de limpieza de arranque en `upload/route.ts`:
```ts
// Al arrancar el módulo, limpiar tmp viejos (>1 hora) de sesiones previas
import { readdir, stat } from "node:fs/promises";
async function limpiarTmpViejos() {
  const files = await readdir(tmpdir()).catch(() => [] as string[]);
  const hora = Date.now() - 60 * 60 * 1000;
  for (const f of files.filter(f => f.startsWith("kyo-"))) {
    const s = await stat(join(tmpdir(), f)).catch(() => null);
    if (s && s.mtimeMs < hora) unlink(join(tmpdir(), f)).catch(() => {});
  }
}
limpiarTmpViejos();
```

---

### BUG 43 — Sin indicador de progreso durante la subida de video
**Archivos:** `src/app/api/admin/social/upload/route.ts` + cualquier componente que llame al endpoint

La compresión en el VPS toma ~10s por clip de 15s. El frontend no recibe ningún estado intermedio — la petición se queda `pending` sin feedback. Si el usuario ve que "no pasa nada", puede cancelar o resubir el mismo video.

**Fix mínimo (sin streaming):** Antes de subir, devolver un `202 Accepted` con un `jobId` y agregar un endpoint `GET /api/admin/social/upload/status/[jobId]` que el cliente consulte cada 2s. Alternativa más simple: mostrar un banner fijo en el componente de subida: `"Comprimiendo y subiendo video, esto puede tomar hasta 30 segundos..."` con un spinner mientras la petición está en vuelo.

---

### BUG 44 — El saludo inicial de Kyo usa "¿Me permite saber su nombre?" (usted) pero el sistema mezcla tuteo
**Archivo:** `src/components/assistant/useChat.ts` línea 18 vs `src/lib/assistant/system-prompt.ts` líneas 8-97

El saludo es `"¿Me permite saber su nombre?"` (usted formal). Las instrucciones de personalidad dicen `"Tono profesional y cercano"`. El Paso 1 dice `"Pregunta que tipo de trabajo busca"` (tú implícito). El Paso 5 dice `"Con base en lo que me comento"` (usted). El resultado es que Kyo mezcla "tú" y "usted" a lo largo de la conversación según qué parte del prompt activó cada respuesta.

**Fix:** Decidir un registro y hacerlo consistente en TODO el prompt. Recomendación: **usted** (es el estándar en reclutamiento formal en México). Revisar cada paso y las instrucciones de personalidad para eliminar pronombres implícitos que puedan inferirse como tuteo.

---

### BUG 45 — `knowledge.ts` lista 15 cursos en `listPages()` pero solo 10 están documentados en `docs/context/cursos.md`
**Archivo:** `src/lib/assistant/knowledge.ts` línea 63

`SITE_PAGES` dice: `"15 cursos con filtros por categoria"`. El archivo `docs/context/cursos.md` lista 10 cursos. Si Kyo menciona el número 15 y el usuario ve menos, pierde credibilidad. Verificar el número real en Supabase y actualizar el summary de la página.

---

## Sugerencias de UX

### Alta prioridad

- **Barra sticky "Aplicar ahora" en mobile para `/vacantes/[id]`** — El sidebar con CTA solo aparece en `lg:`. En mobile el candidato tiene que hacer scroll completo. Añadir barra fija inferior en mobile (ver detalle en reporte 2026-06-19).

- **Markdown en burbujas de Kyo (BUG 26, 9º día)** — `src/components/assistant/ChatWidget.tsx` líneas 211 y 227. Los asteriscos de `**texto**` aparecen literales. Fix de 5 minutos con `dangerouslySetInnerHTML` y replace de `**` → `<strong>`.

- **Feedback visual al aprobar/solicitar cambios en `/revisor` (BUG 32, 9º día)** — Rosy y Monse necesitan confirmación visual de que su acción fue registrada. Un toast verde de 4 segundos es suficiente.

### Media prioridad

- **Banner de "procesando video" durante la subida** — Contexto del BUG 43. Mientras la compresión corre (~10-30s), el admin no ve progreso. Una línea de texto `"Optimizando video para web..."` con spinner reduce la ansiedad de "¿se colgó?".

- **Notificación al cliente cuando el video TikTok está listo** — CLAUDE.md lo marca como pendiente. Al cambiar `fase` de `guion` a `video` en `PATCH /api/admin/social/posts/[id]`, enviar correo a revisores activos con asunto `"🎬 Tu video de TikTok está listo para revisar"`. El template ya existe en el módulo de correos de revisión.

- **Acento faltante en "Nueva conversacion"** — `src/components/assistant/ChatWidget.tsx` línea 159. Debe ser `"Nueva conversación"`. Fix de 5 segundos.

### Baja prioridad

- **Tour de novedad en pestaña "Análisis" bloquea UI (BUG 28, 9º día)** — Una sola línea en `src/app/revisor/page.tsx`: `{showNovedad && seccion === "publicaciones" && <NovedadFiltros ... />}`.

- **Sin skeleton durante carga en `/revisor`** — Mostrar 6 cards `animate-pulse` mientras `loading === true` mejora la percepción de velocidad.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **Resolver el registro usted/tú (BUG 44, nuevo)** — `src/lib/assistant/system-prompt.ts`. Elegir un registro y aplicarlo en los 7 pasos más las reglas críticas. La incoherencia percibida hace al bot sentir "máquina mal entrenada".

- **Paso 6 sin manejo de rechazo (9º día)** — Si el candidato dice "ninguna me interesa", no hay instrucción definida. Añadir Paso 6b: ofrecer banco de talentos y navegar a `/contacto`.

- **Mencionar las 24h de respuesta en Paso 6** — `src/lib/assistant/system-prompt.ts` línea 60. El dato más persuasivo para motivar la aplicación no se usa. Añadir: `"mencionar que el equipo responde en menos de 24 horas hábiles."`.

- **Resumen de perfil como ancla contra truncado de contexto** — `src/app/api/assistant/chat/route.ts` línea 131. El historial se corta a 20 mensajes. Añadir instrucción al Paso 3: `"Al completar pasos 0-4, sintetizar en una línea: 'Perfil: [nombre], [puesto], [N] años, zona [X], [jornada].' Esto preserva el contexto si el historial se trunca."`.

- **Pre-calificación de leads empresariales** — `src/lib/assistant/system-prompt.ts` línea 65. Cuando detecta intención de contratar, Kyo navega directo a `/contacto` sin capturar datos. Mejorar: preguntar nombre de empresa y perfil buscado antes de navegar.

### Nuevas tools o capacidades recomendadas

- **Filtros `jornada` y `contrato` en `search_jobs`** — `src/lib/assistant/tools.ts` líneas 39-46. Kyo recoge la jornada en el Paso 4 pero no puede filtrar por ella en la tool. Añadir:
  ```ts
  jornada: { type: "string", description: "Filtra por jornada: Matutina, Vespertina, Mixta, Flexible" },
  contrato: { type: "string", description: "Filtra por contrato: Tiempo completo, Medio tiempo, Por proyecto" },
  ```
  Y en `executeTool` aplicar los filtros en `knowledge.listJobs()`.

- **Tool `register_talent_interest`** — Cuando no hay vacante compatible, el perfil del candidato se pierde al navegar a `/contacto`. Esta tool lo capturaría directamente en Supabase (`origen: 'kyo_banco_talentos'`, puesto, experiencia, zona, jornada) sin que el candidato llene el formulario manualmente.

### Problemas detectados

- **Vacantes reales en Kyo (BUG 1, crítico, 9º día)** — `src/lib/assistant/knowledge.ts` línea 167. `StaticKnowledgeProvider` lee de `jobs.ts` (demo). El Paso 5 — el más importante del flujo — recomienda IDs que generan 404. Sin este fix, Kyo no puede funcionar como herramienta de conversión.

- **Fallback genérico sin acento ni contexto** — `src/app/api/assistant/chat/route.ts` línea 202. Cuando Claude solo llama `navigate_to` sin texto, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` (sin acentos). Fix: `const replyContent = finalText || (navigations.length > 0 ? "Te llevo ahí ahora mismo." : "Entendido, ¿en qué más te puedo ayudar?");`

- **`max_tokens: 1024` puede truncar el Paso 5** — `src/app/api/assistant/chat/route.ts` línea 150. El Paso 5 consume ~700-900 tokens listando 2-3 vacantes con justificación. El margen es mínimo. Subir a `max_tokens: 1536`.

- **`MAX_TOOL_ITERATIONS = 5` demasiado bajo** — `src/app/api/assistant/chat/route.ts` línea 85. El Paso 5 óptimo requiere `search_jobs` → `get_job_details × 2` → `navigate_to` = 4 iteraciones. Con 5 hay margen de solo 1 error. Subir a `MAX_TOOL_ITERATIONS = 8`.

- **`getStoredInstrucciones()` usa anon key** — `src/app/api/assistant/chat/route.ts` líneas 14-18. Si RLS de `kyo_config` se endurece, falla silenciosamente y Kyo cae al DEFAULT_INSTRUCCIONES. Reemplazar con `sbAdmin` (ya declarado en línea 36).

- **`rateLimitMap` memory leak (BUG 16, 9º día)** — `src/app/api/assistant/chat/route.ts` líneas 68-80. El Map nunca se limpia. Fix de 5 líneas para purgar entradas expiradas.

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo de Kyo** — El candidato no sabe en qué paso está. Un texto sutil en el header del chat (ej. "Paso 2 de 5") reduce abandonos. Contar mensajes del usuario en `useChat.ts` para inferir el paso.

- **Auto-apertura de Kyo en `/vacantes` sin resultados** — Candidato con 5s sin resultados + un bubble proactivo: *"¿Te ayudo a encontrar la vacante ideal?"*. `useEffect` + `setTimeout(5000)` en la ruta, una vez por sesión.

- **Tracking Kyo → aplicación** — No hay `logEvent` cuando Kyo recomienda una vacante. Sin este evento es imposible medir el ROI del asistente. Añadir `logEvent("kyo_vacante_recomendada", vacante_id)` en `route.ts` cuando `navigations` incluya `/vacantes/[id]`.

- **Discrepancia de estadísticas** — `/contacto/page.tsx` dice "10 años de experiencia"; `knowledge.ts` línea 79 dice `"Años en el mercado": "3+"`. Actualizar con el número correcto y homologar en todo el sitio.

- **Notificación al cliente al publicar video TikTok** — Pendiente explícito en CLAUDE.md. Al hacer PATCH para cambiar `fase='video'` + `estado='pendiente'`, enviar correo a `social_reviewers` activos. El infrastructure de correos (IONOS SMTP) ya está lista.

---

## Prioridad de acción sugerida (acumulada)

| # | Bug/Mejora | Esfuerzo | Impacto |
|---|-----------|----------|---------|
| 1 | BUG 1 — Vacantes reales en Kyo | Alto | Crítico |
| 2 | BUG 26 — Markdown asteriscos en Kyo | Bajo (5 min) | Alto |
| 3 | BUG 44 — Usted/tú inconsistente en Kyo | Bajo (15 min) | Alto |
| 4 | BUG 41 — Sin validación de tamaño en upload video | Bajo (5 min) | Alto |
| 5 | BUG 29 — Modal responsive en mobile (revisor) | Bajo (CSS) | Alto |
| 6 | BUG 32 — Confirmación visual al aprobar (revisor) | Bajo (30 min) | Alto |
| 7 | BUG 23 + 36 — sessionId mal gestionado | Bajo (2 líneas) | Medio |
| 8 | BUG 16 — Memory leak rateLimitMap | Bajo (5 min) | Medio |
| 9 | BUG 43 — Sin progreso durante subida de video | Bajo (UI) | Medio |
| 10 | BUG 2 + 37 — Filtros dinámicos en vacantes | Medio | Alto |
| 11 | BUG 28 — Tour en pestaña Análisis | Bajo (1 línea) | Medio |
| 12 | BUG 38 — Empty state vacantes sin CTA | Bajo (20 min) | Medio |
| 13 | BUG 14 — FAQs dinámicas desde Supabase | Medio | Medio |
| 14 | BUG 42 — Tmp huérfanos si PM2 muere | Bajo (cleanup) | Bajo |
| 15 | Notificación cliente video TikTok listo | Bajo (30 min) | Medio |
