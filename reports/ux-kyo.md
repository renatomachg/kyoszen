# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-28
**Cambios analizados:** Sin commits de codigo nuevo desde `f7943ce` (2026-05-19). Esta sesion es analisis incremental — agrega hallazgos no detectados en sesiones anteriores y escala pendientes criticos sin resolver.

**Archivos revisados en esta sesion:**
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/components/ui/AplicarModal.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

Sin cambios de codigo desde `f7943ce` (2026-05-19). Los tres reportes diarios anteriores (2026-05-26, 2026-05-27, 2026-05-28) actualizan solo archivos de reporte. El codigo de produccion permanece identico. Los bugs criticos de sesiones previas siguen sin corregirse.

---

## PENDIENTES CRITICOS SIN RESOLVER (acumulados)

Los siguientes items fueron reportados en sesiones anteriores y persisten sin corrección. Se mantienen aqui para presionar su resolucion:

| # | Archivo | Descripcion | Sesiones sin corregir |
|---|---------|-------------|----------------------|
| P1 | `src/lib/assistant/knowledge.ts:118,138` | Kyo lee vacantes y cursos del archivo estatico. Las vacantes del admin son invisibles para Kyo. | 3 |
| P2 | `src/app/api/assistant/chat/route.ts:36-39` | `sbAdmin` se inicializa a nivel de modulo con `!`; si falta `SUPABASE_SERVICE_ROLE_KEY`, toda la ruta devuelve 500. | 3 |
| P3 | `src/components/assistant/useChat.ts` | Historial sin expiracion — usuario con contexto de hace semanas recibe recomendaciones de vacantes ya cerradas. | 3 |
| P4 | `src/app/vacantes/[id]/_content.tsx:186-204` | Boton "Aplicar ahora" no es sticky en mobile. CTA de conversion principal del sitio. | 3 |
| P5 | `src/lib/assistant/knowledge.ts:99-105` + `chat/route.ts` | FAQs editadas en admin nunca llegan al prompt de Kyo — bug que rompe la promesa del panel admin. | 2 |
| P6 | `src/components/assistant/useChat.ts:124-127` | `navigate_to` silencioso — widget no muestra mensaje ni se cierra al navegar. | 2 |
| P7 | `src/components/assistant/useChat.ts:81` | Nombre del usuario (dato personal) se guarda en analytics sin consentimiento explicito. | 2 |
| P8 | `src/app/api/assistant/chat/route.ts:68-80` | `rateLimitMap` nunca limpia entradas — memory leak en VPS de larga ejecucion. | 2 |
| P9 | `src/app/api/admin/estratega/route.ts` | Endpoint de Estratega sin autenticacion — cualquiera puede consumir creditos de Opus. | 2 |
| P10 | `src/app/contacto/page.tsx:64` | Hero dice "10 anos de experiencia" cuando la empresa tiene 3+. | 2 |

---

## Sugerencias de UX

### Alta prioridad

- **[NUEVO DIA 3 - CRITICO - VACANTES MUESTRA "0" MIENTRAS CARGA] `src/app/vacantes/page.tsx:59,69-71`** — El estado inicial es `jobs = []` y no existe un estado `loading`. Al cargar la pagina, el usuario ve "**0** vacantes encontradas" con la grilla vacia durante el tiempo de fetch de Supabase (tipicamente 300-800ms). Un candidato que llegue por redes sociales puede leer ese "0" y abandonar pensando que no hay oportunidades. **Solucion concreta:** Agregar `const [loading, setLoading] = useState(true)` en la linea 59. Al final del `.then(({ data }) => { setJobs(...); setLoading(false); })` en linea 71. En el render, antes del grid (linea 206), agregar: `{loading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">{Array.from({length:8}).map((_,i)=><div key={i} className="bg-white rounded-xl border border-border h-52 animate-pulse"/>)}</div> : ...}`. El skeleton de 8 tarjetas pulso comunica carga activa y elimina el "0" falso.

- **[NUEVO DIA 3 - ANTI-PATRON REACT - STATE MUTATION EN RENDER] `src/app/vacantes/page.tsx:85-99`** — El bloque `if (prevParams !== params) { setPrevParams(params); setSearch(...); ... }` se ejecuta durante el render (fuera de `useEffect`). Llamar `setState` durante render es un anti-patron documentado por React — puede causar renders infinitos en StrictMode y comportamientos impredecibles en produccion. Next.js App Router usa React StrictMode en desarrollo, lo que puede duplicar renders. **Solucion:** Reemplazar todo el bloque `prevParams` (lineas 66-99) por un solo `useEffect`: `useEffect(() => { const q=params.get('q')||params.get('search'); if(q) setSearch(q); const u=params.get('ubicacion'); if(u && UBICACIONES.includes(u)) setUbicacion(u); /* ... resto de params */ }, [params])`. Eliminar los estados `prevParams` y `setPrevParams` completamente.

- **[PENDIENTE P4 - ESCALADO A CRITICO] CTA STICKY MOBILE `src/app/vacantes/[id]/_content.tsx:186-204`** — Cuarta sesion consecutiva. El boton "Aplicar ahora" esta en sidebar `lg:grid` que colapsa en mobile. En un iPhone 14 el usuario tiene que hacer scroll por ~800px de texto antes de ver el CTA. **Solucion de una vez:** Agregar este bloque justo antes del `<AplicarModal>` en la linea 212:
  ```tsx
  <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white/95 backdrop-blur-sm border-t border-border lg:hidden z-40 safe-area-bottom">
    <button
      type="button"
      onClick={() => { setModalOpen(true); logEvent("vacante_aplicar_click", JSON.stringify({ id: job.id, titulo: job.titulo })); }}
      className="w-full bg-navy text-white rounded-full py-4 text-[14px] font-extrabold"
    >
      Aplicar ahora
    </button>
  </div>
  ```

- **[PENDIENTE P5 - ESCALADO A CRITICO] FAQs ADMIN NUNCA LLEGAN A KYO `src/lib/assistant/knowledge.ts:99-105`** — `buildSystemPrompt()` usa `company.faqs` hardcodeadas. **Solucion especifica:** En `chat/route.ts`, agregar funcion junto a `getStoredInstrucciones()`:
  ```ts
  async function getStoredFaqs(): Promise<{ q: string; a: string }[] | null> {
    try {
      const { data } = await sb.from("kyo_faqs").select("pregunta,respuesta").eq("activo", true).order("orden");
      return data?.map((r) => ({ q: r.pregunta, a: r.respuesta })) ?? null;
    } catch { return null; }
  }
  ```
  En `buildSystemPrompt(instrucciones?, faqs?)`, reemplazar linea 137 `company.faqs.map(...)` por `(faqs ?? company.faqs).map(...)`. Llamar ambas funciones en paralelo: `const [instrucciones, faqs] = await Promise.all([getStoredInstrucciones(), getStoredFaqs()])`.

### Media prioridad

- **[NUEVO DIA 3 - FILTRO ?marca= INUTILIZABLE EN PRODUCCION] `src/lib/assistant/system-prompt.ts:87` + `src/app/vacantes/page.tsx:29`** — El system prompt lista como valores de `?marca=`: "Grupo Corpora, Logistica Norte, Sigma Retail, Clinica Vitalis, Finanzas MX, Contact Nova". Estos son los nombres de empresas del archivo estatico `jobs.ts` (datos demo). Las vacantes reales en Supabase tienen nombres de empresas reales distintos. Cuando Kyo navega con `?marca=Sigma Retail` y la produccion tiene empresas diferentes, el filtro muestra 0 resultados. **Solucion:** Eliminar del system prompt los valores fijos de `?marca=`. Reemplazar por: "Puedes combinar `?marca=NOMBRE_EMPRESA` con el nombre exacto de la empresa si el candidato lo pide". Los filtros utiles y confiables son `?ubicacion=`, `?contrato=`, `?jornada=` y `?q=` (busqueda libre) — estos si son predecibles.

- **[NUEVO DIA 3 - MODELO HAIKU PARA MATCHING LABORAL] `src/app/api/assistant/chat/route.ts:84`** — `claude-haiku-4-5-20251001` es el modelo por defecto. Para el Paso 5 del flujo (comparar perfil del candidato contra 10+ vacantes y seleccionar las 2-3 mas compatibles con razonamiento sobre ubicacion, jornada, experiencia y salario), Haiku tiende a hacer matching superficial por keyword. Sonnet hace razonamiento multi-criterio real. **Evidencia:** Haiku puede recomendar una vacante de "Vendedor" a un candidato que busca "Atencion al cliente" porque ambos tienen contacto con publico. **Solucion:** Cambiar `process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001"` a `process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6"`. El costo por conversacion sube ~5x pero la calidad de recomendacion es la diferencia entre un usuario que aplica y uno que abandona.

- **[PENDIENTE P6 - NAVIGATE_TO SILENCIOSO] `src/components/assistant/useChat.ts:124-127`** — El widget no cierra ni confirma la navegacion. **Solucion de dos partes:** (1) En `useChat.ts:121`, antes del `setTimeout`, insertar mensaje sintetico: `setMessages(prev => [...prev, { id: \`nav-\${Date.now()}\`, role: 'assistant' as const, content: target.reason ?? 'Te llevo a la pagina correspondiente.', timestamp: Date.now() }])`. (2) En `ChatWidget.tsx`, exponer una prop `onNavigate?: () => void` desde `useChat` y llamar `setTimeout(() => setOpen(false), 1200)` tras la navegacion.

- **[PENDIENTE P7 - DATOS PERSONALES EN ANALYTICS] `src/components/assistant/useChat.ts:81`** — Nombre del candidato se guarda en `site_eventos`. **Fix de una linea:** Cambiar `logEvent("kyo_mensaje", trimmed.slice(0, 300))` por `logEvent("kyo_mensaje", trimmed.split(' ').length.toString())` — registra solo longitud del mensaje, no el contenido.

### Baja prioridad

- **[NUEVO DIA 3 - EMPTY STATE PASIVO EN VACANTES] `src/app/vacantes/page.tsx:231-234`** — Cuando los filtros no tienen resultados, el empty state dice "No encontramos vacantes con esos filtros. Intenta con otras combinaciones." Sin ningun CTA. El candidato que no encuentra vacante adecuada debia ser redirigido al banco de talentos o al chat con Kyo. **Solucion:** Reemplazar el parrafo estatico por: `<p>...Intenta con otras combinaciones o <button className="text-blue underline" onClick={() => { clearAll(); /* opcional: abrir Kyo */ }}>limpia los filtros</button> para ver todas las opciones disponibles.</p>`. Agregar debajo: `<p className="text-xs text-muted mt-2">¿No encuentras lo que buscas? <a href="#kyo-chat" className="text-blue underline" onClick={() => document.dispatchEvent(new CustomEvent('open-kyo'))}>Platica con Kyo</a> para orientacion personalizada.</p>`.

- **[PENDIENTE P8 - MEMORY LEAK RATE LIMITER] `src/app/api/assistant/chat/route.ts:72-81`** — **Fix de una linea** al inicio de `checkRateLimit()`: `if (rateLimitMap.size > 500) { const now = Date.now(); for (const [k, v] of rateLimitMap) if (v.resetAt < now) rateLimitMap.delete(k); }`.

- **[PENDIENTE P3 - HISTORIAL SIN EXPIRACION] `src/components/assistant/useChat.ts:24-34`** — **Fix de dos lineas** en `loadHistory()` antes del `return parsed`: `const lastTs = parsed[parsed.length - 1]?.timestamp ?? 0; if (Date.now() - lastTs > 86_400_000) return [INITIAL_GREETING];`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[NUEVO DIA 3 - PASO 6 LLEVA A /contacto EN LUGAR DE /vacantes/{id}] `src/lib/assistant/system-prompt.ts:60-61`** — El cierre dice "Invitalo a llenar el formulario de aplicacion. Navega a /contacto si acepta." Pero `/contacto` es el formulario de contacto de empresas y candidatos mezclado. El formulario correcto para aplicar a una vacante especifica esta en `/vacantes/{id}` donde esta el boton "Aplicar ahora" con todos los campos. Enviar al candidato a `/contacto` es un paso extra innecesario que reduce conversion. **Solucion:** Cambiar el Paso 6 a: "Invitalo a ver el detalle de la vacante seleccionada. Usa `navigate_to` con la ruta `/vacantes/{id}` de la vacante que le intereso. En esa pagina hay un boton 'Aplicar ahora' para completar su solicitud. Solo navega a /contacto si el candidato no selecciono ninguna vacante especifica."

- **[NUEVO DIA 3 - PASO 5 NO DIFERENCIA URGENCIA DE VACANTES] `src/lib/assistant/system-prompt.ts:131`** — La lista de vacantes en el system prompt omite el campo `badge` (que puede ser "Urgente", "Nuevo", "Destacado"). Kyo no puede mencionar urgencia porque no la ve, perdiendo un motivador clave para acelerar la decision del candidato. **Solucion:** En `buildSystemPrompt()`, linea 131, cambiar el template string a: `` `- id=${j.id} · ${j.titulo} · ${j.empresa} · ${j.ubicacion} · ${j.contrato} · ${j.jornada} · $${j.salario?.toLocaleString?.('es-MX') ?? j.salario}/mes${(j as {badge?:string}).badge ? ` · [${(j as {badge?:string}).badge}]` : ''}` ``. Agregar al Paso 5: "Si la vacante recomendada tiene [Urgente], menciona que hay alta demanda y que aplicar pronto es una ventaja."

- **[PENDIENTE P1 CRITICO - FLUJO EMPRESARIAL MINIMO] `src/lib/assistant/system-prompt.ts:64-67`** — Cuando una empresa contacta, Kyo solo los deriva a WhatsApp. No hay flujo estructurado. **Solucion:** Agregar al system prompt:
  ```
  # Flujo para empresas
  Paso E1 — Pregunta cuantos puestos necesitan cubrir y en que area.
  Paso E2 — Pregunta si es urgente o tienen fecha limite.
  Paso E3 — Di: "Perfecto, nuestro equipo puede presentar candidatos verificados en menos de 72 horas. Te conecto ahora." y navega a /contacto.
  ```

- **[PENDIENTE - MANEJO SIN NOMBRE] `src/lib/assistant/system-prompt.ts:22-24`** — Agregar al Paso 0: "Si el usuario no da nombre o cambia de tema directamente, usa 'usted' y avanza al Paso 1 sin insistir."

### Nuevas tools o capacidades recomendadas

- **[NUEVO DIA 3 - Tool `get_vacancy_url`]** — Cuando Kyo hace navigate_to en el Paso 6, necesita la URL exacta de la vacante (`/vacantes/42`). Actualmente el system prompt muestra el `id` en la lista de vacantes, por lo que Kyo podria construir la URL manualmente. Pero si el id es 0 o undefined (datos incorrectos), navegaria a una pagina rota. **Solucion segura:** Agregar instruccion en el Paso 5: "Para navegar a una vacante especifica, usa `navigate_to` con `/vacantes/` seguido del id de la vacante (ej. `/vacantes/3`). Verifica que el id este en la lista de vacantes disponibles antes de navegar." No requiere nueva tool — solo instruccion mas clara.

- **[PENDIENTE - Tool `register_talent`]** — Cuando ninguna vacante encaja, Kyo dice "quedar en banco de talentos" y navega a /contacto. Una tool que inserte directamente en la tabla `aplicaciones` con `vacante = "Banco de Talentos"` permite completar el flujo sin salir del chat. Implementacion: nueva tool en `tools.ts`, nuevo endpoint `/api/talent/register`, insert en `aplicaciones` con los datos recopilados en el flujo (nombre, puesto, experiencia, ubicacion).

- **[PENDIENTE - Tool `get_active_jobs_from_supabase`]** — Reemplaza `StaticKnowledgeProvider.listJobs()`. En `executeTool` para `search_jobs`, usar `sbAdmin.from("vacantes").select(...).eq("activa", true)` en lugar de leer `JOBS`. El cliente `sbAdmin` ya esta disponible en `chat/route.ts` scope. Es la solucion definitiva al P1.

### Problemas detectados

- **[BUG CRITICO NUEVO DIA 3 - KYO RECOMIENDA VACANTES QUE NO EXISTEN EN PRODUCCION]** — Consecuencia directa del P1. `StaticKnowledgeProvider` lee de `src/lib/jobs.ts` que tiene 8 vacantes con empresas demo (Grupo Corpora, Sigma Retail, etc.). El sitio publico muestra vacantes reales de Supabase. Kyo puede recomendar "Auxiliar Administrativo en Grupo Corpora" y el candidato navega a `/vacantes` y no encuentra esa empresa. Si el admin borro esa vacante en Supabase, la URL `/vacantes/1` da 404. Esto es critico para la credibilidad del asistente.

- **[BUG NUEVO DIA 3 - LOCALE EN SALARIO INCONSISTENTE] `src/app/vacantes/page.tsx:223` + `_content.tsx:117,171` + `system-prompt.ts:131`** — `toLocaleString()` sin locale usa el navegador del usuario. En Android latinoamerica puede mostrar "12.000" (punto como separador de miles) en vez de "12,000". **Fix:** Cambiar todas las ocurrencias a `toLocaleString('es-MX')`.

- **[BUG PENDIENTE P9 - API ESTRATEGA SIN AUTH] `src/app/api/admin/estratega/route.ts`** — Endpoint publico que consume Opus. Agregar verificacion de sesion Supabase al inicio del handler.

- **[BUG PENDIENTE P2 - sbAdmin MODULO-LEVEL] `src/app/api/assistant/chat/route.ts:36-39`** — Mover `createClient(sbAdmin)` dentro del handler o lazy-init con `if (!_sbAdmin)...`.

---

## Oportunidades de mejora general

- **[NUEVO DIA 3 - QUICK REPLIES EN EL CHAT]** — En el Paso 2 (anos de experiencia) y Paso 4 (jornada), Kyo hace preguntas cerradas con respuestas esperadas. Mostrar botones de respuesta rapida ("Sin experiencia", "1-2 años", "3-5 años", "5+ años") reduciria la friccion del candidato y aumentaria la tasa de completacion del flujo. Implementacion: el `ChatWidget` puede detectar si el ultimo mensaje del asistente corresponde a Paso 2 o Paso 4 por keywords y mostrar chips de respuesta debajo del input. No requiere cambios en el backend.

- **[NUEVO DIA 3 - TIMEOUT DE RESPUESTA KYO - CUARTO REPORTE SIN CORREGIRSE] `src/components/assistant/useChat.ts`** — Si Anthropic tiene latencia, el usuario ve tres puntos indefinidamente sin limite de tiempo. **Fix de tres lineas** en `sendMessage()`:
  ```ts
  const timeout = setTimeout(() => {
    setError("La respuesta esta tardando. Intenta de nuevo o escríbenos por WhatsApp.");
    setIsLoading(false);
  }, 15000);
  // En el finally:
  clearTimeout(timeout);
  ```

- **[NUEVO DIA 3 - AVISO LFPDPPP EN CHAT] `src/components/assistant/ChatWidget.tsx:191`** — La tabla `kyo_conversaciones` guarda IP + historial completo. El chat no avisa al usuario. Agregar bajo el form: `<p className="text-[10px] text-muted text-center mt-1 px-2 leading-relaxed">Esta conversacion puede guardarse para mejorar el servicio. Ver <a href="/politica-de-privacidad" className="underline">Aviso de Privacidad</a>.</p>`.

- **Markdown en respuestas del Estratega** — El admin panel usa Opus que genera markdown rico. El componente renderiza texto plano con `##` y `**` literales. Instalar `react-markdown` y aplicar en el componente del Estratega.

- **Dashboard de conversion de Kyo** — La tabla `kyo_conversaciones` existe. Agregar en `/admin/analytics` una seccion con: total sesiones Kyo, promedio de mensajes por sesion, tasa de sesiones que terminaron con navegacion a `/vacantes/[id]`.

---

## Resumen ejecutivo de prioridades

| # | Item | Impacto | Esfuerzo | Sesiones pendiente |
|---|------|---------|----------|--------------------|
| 1 | Kyo recomienda vacantes que no existen en prod (static jobs vs Supabase) | Critico | Alto | 3 |
| 2 | Vacantes muestra "0" mientras carga (no loading state) | Alto | Bajo | NUEVO |
| 3 | Anti-patron React state-en-render en vacantes/page.tsx | Alto | Bajo | NUEVO |
| 4 | Paso 6 navega a /contacto en vez de /vacantes/{id} | Alto | Bajo | NUEVO |
| 5 | FAQs admin nunca llegan a Kyo | Alto | Medio | 2 |
| 6 | CTA sticky mobile en vacante (boton Aplicar ahora) | Alto | Bajo | 3 |
| 7 | navigate_to silencioso + widget no se cierra | Alto | Bajo | 2 |
| 8 | Filtro ?marca= con valores demo inutilizables en prod | Medio | Bajo | NUEVO |
| 9 | Modelo Haiku para matching laboral (Sonnet recomendado) | Medio | Bajo | NUEVO |
| 10 | Datos personales (nombre) en analytics | Medio | Bajo | 2 |
| 11 | Timeout de respuesta de Kyo (15s) | Medio | Bajo | 4 |
| 12 | Rate limiter memory leak | Bajo | Bajo | 2 |
| 13 | Historial sin expiracion (24h) | Bajo | Bajo | 2 |
| 14 | sbAdmin a nivel de modulo con ! | Bajo | Bajo | 3 |
| 15 | API Estratega sin autenticacion | Bajo | Bajo | 2 |
