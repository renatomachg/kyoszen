# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-27
**Cambios analizados:** Commits desde 2026-05-25. Ultimo commit de codigo: `f7943ce` — Estratega, analytics tracking, Kyo logs y reportes PDF.

**Archivos revisados en esta sesion:**
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/useChat.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/components/ui/AplicarModal.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/app/cursos/page.tsx`
- `src/app/contacto/page.tsx`
- `src/app/admin/(panel)/estratega/page.tsx`
- `src/app/admin/(panel)/kyo/page.tsx`

---

## Cambios Recientes Detectados

No hay commits de codigo nuevo hoy — los chequeos del 2026-05-26 y 2026-05-27 solo actualizan reportes. El commit `f7943ce` sigue siendo el ultimo cambio relevante. Esta sesion es un analisis profundo del estado actual del codigo con foco en hallazgos no cubiertos en reportes anteriores.

---

## PENDIENTES CRITICOS SIN RESOLVER (de sesiones anteriores)

Estos items fueron reportados y siguen sin corregirse. Se escalan a **urgente**:

- **`src/lib/assistant/knowledge.ts:118,138`** — Kyo sigue leyendo vacantes y cursos del archivo estatico. Las vacantes creadas en el panel admin son invisibles para el asistente.
- **`src/app/api/assistant/chat/route.ts:36-39`** — `sbAdmin` se crea a nivel de modulo con `!`; si `SUPABASE_SERVICE_ROLE_KEY` falta en el VPS, toda la ruta devuelve 500.
- **`src/components/assistant/useChat.ts`** — Historial no expira; usuario con contexto obsoleto de hace semanas puede recibir respuestas incorrectas de Kyo.
- **`src/app/vacantes/[id]/_content.tsx`** — Boton "Aplicar ahora" no tiene posicion sticky en mobile. Es el CTA de conversion mas importante del sitio. **Tercera sesion consecutiva sin corregirse.**
- **`src/app/contacto/page.tsx:91`** — La opcion "Quiero aplicar a una vacante" en el select de asunto mezcla candidatos con leads de empresas.

---

## Sugerencias de UX

### Alta prioridad

- **[NUEVO - CRITICO - FAQs DEL ADMIN NUNCA LLEGAN A KYO] `src/lib/assistant/knowledge.ts:99-105` + `src/app/api/assistant/chat/route.ts:136`** — La pestaña "Preguntas frecuentes" del admin guarda FAQs en la tabla `kyo_faqs` de Supabase, pero `buildSystemPrompt()` llama `knowledge.getCompanyInfo()` que retorna `COMPANY.faqs` (5 preguntas hardcodeadas en `knowledge.ts:99-105`). Las FAQs editadas en el panel JAMAS llegan al prompt de Kyo. El administrador puede crear, editar y activar FAQs todo el dia sin ningun efecto. **Solucion:** En `chat/route.ts`, junto al fetch de `instrucciones`, agregar `getStoredFaqs()` que consulte `kyo_faqs` con `activo=true` ordenadas por `orden`. Pasar el resultado a `buildSystemPrompt()` como tercer argumento y en `system-prompt.ts:137` reemplazar `company.faqs` por el argumento recibido (con fallback a `company.faqs` si Supabase no responde).

- **[NUEVO - CRITICO - NAVIGATE_TO SILENCIOSO PARA EL USUARIO] `src/components/assistant/useChat.ts:124-127`** — Cuando Kyo llama `navigate_to`, el frontend hace `setTimeout(() => router.push(path), 700)` pero no inserta ningun mensaje visible en el chat que explique que ocurrio la navegacion. El usuario ve que "algo paso" pero no sabe por que cambio de pagina. Si el widget queda abierto sobre la nueva pagina, el contexto es confuso. **Solucion:** Despues de `logEvent("kyo_navegacion", target.path)`, antes del `setTimeout`, insertar un mensaje sintetico del asistente en el estado de mensajes: `setMessages(prev => [...prev, { id: 'nav-${Date.now()}', role: 'assistant', content: target.reason ? target.reason : 'Te llevo a la pagina correspondiente.', timestamp: Date.now() }])`. Esto da feedback inmediato al usuario.

- **[NUEVO - CHAT WIDGET NO SE CIERRA TRAS NAVEGACION] `src/components/assistant/ChatWidget.tsx:8`** — El estado `open` nunca cambia a `false` cuando Kyo navega al usuario. El widget flotante queda superpuesto sobre la pagina de vacantes o cursos, tapando contenido y confundiendo al usuario. **Solucion:** En `useChat.ts`, exponer un callback `onNavigate` o usar un `CustomEvent`. En `ChatWidget.tsx`, escuchar el evento de navegacion de Kyo y llamar `setOpen(false)` con un delay de 500ms para que el usuario vea el mensaje de navegacion antes de que el widget se cierre.

- **[NUEVO - PRIVACIDAD - MENSAJES DE USUARIO EN ANALYTICS] `src/components/assistant/useChat.ts:81`** — `logEvent("kyo_mensaje", trimmed.slice(0, 300))` guarda los primeros 300 caracteres de cada mensaje del usuario en `site_eventos`. Si el usuario comparte su telefono, correo o cualquier dato personal (lo cual es comun en el flujo de Kyo — el Paso 0 pide el nombre), esos datos quedan en la tabla de analytics sin consentimiento explicito. Esto es inconsistente con LFPDPPP. **Solucion:** Cambiar el evento a solo registrar la presencia del mensaje, no el contenido: `logEvent("kyo_mensaje", "ok")`. Si se necesita analizar temas, registrar solo el numero de palabras: `logEvent("kyo_mensaje", trimmed.split(' ').length.toString())`.

- **[PENDIENTE - ESCALADO] CTA STICKY MOBILE `src/app/vacantes/[id]/_content.tsx:186-204`** — El boton "Aplicar ahora" esta en la columna derecha de un grid `lg:grid-cols-[1.6fr_1fr]`. En mobile ese grid colapsa a 1 columna y el boton queda al final del contenido largo (descripcion, responsabilidades, requisitos). En mobile el usuario tiene que hacer scroll completo para llegar al CTA. **Solucion concreta:** Agregar un `<div>` fijo en mobile que desaparezca en `lg`: `<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border lg:hidden z-40"><button onClick={...} className="w-full bg-navy text-white rounded-full py-4 text-[14px] font-extrabold">Aplicar ahora</button></div>`. En `lg:` el boton sticky del sidebar sigue funcionando normal.

### Media prioridad

- **[NUEVO - MOBILE UX - INPUT WHATSAPP SIN TECLADO NUMERICO] `src/components/ui/AplicarModal.tsx:148-153`** — El campo WhatsApp tiene `type="tel"` pero sin `inputMode="numeric"` ni `pattern`. En Android, `type="tel"` abre el teclado telefonico (con +, *, #), no el numerico puro. Para un formulario de aplicacion donde el candidato quiere tipear rapido en mobile, esto genera friccion. Ademas no hay validacion de formato. **Solucion:** Cambiar a `<input name="whatsapp" type="tel" inputMode="tel" pattern="[0-9\s\-\+\(\)]{10,15}" placeholder="55 1234 5678" title="Ingresa un numero de telefono valido" required className="form-input" />`. El `pattern` rechaza en submit inputs que no parezcan numeros de telefono.

- **[NUEVO - ESTRATEGA - RESPUESTAS SIN FORMATO MARKDOWN] `src/app/admin/(panel)/estratega/page.tsx:303-308`** — El Estratega usa `claude-opus-4-5` que genera respuestas con markdown rico (##, **, listas, etc.) pero el componente renderiza con `whitespace-pre-wrap` plano. Los headers `##` aparecen como texto literal con `##` al inicio, las negritas como `**texto**`. **Solucion:** Instalar `react-markdown` (`npm i react-markdown`) y reemplazar el `<div className="... whitespace-pre-wrap">{m.content}</div>` del Estratega por `<ReactMarkdown className="prose prose-sm prose-navy max-w-none">{m.content}</ReactMarkdown>`. El mismo fix aplica al ChatWidget si Kyo llega a generar listas.

- **[NUEVO - CURSOS - IMAGEN ROTA SIN FALLBACK] `src/app/cursos/page.tsx:250`** — `<img src={category.image} alt={category.label} ...>` carga imagenes de Unsplash. Si la URL falla (CDN caido, URL cambiada), la tarjeta de categoria muestra un rectangulo gris sin contenido visible, haciendo que parezca que la categoria no existe. **Solucion:** Agregar `onError` al `<img>`: `onError={(e) => { (e.target as HTMLImageElement).src = '/images/placeholder-curso.jpg'; }}` y agregar una imagen placeholder en `public/images/`. Alternativamente usar un background-color del brand como fallback via CSS.

- **[NUEVO - CONTACTO - HERO DATO INCORRECTO] `src/app/contacto/page.tsx:64`** — El hero dice "Con más de 10 años en el mercado laboral mexicano" pero `knowledge.ts:79` dice `"Años en el mercado": "3+"`. Hay una inconsistencia de datos entre el copy del hero y la informacion de la empresa. **Solucion:** Cambiar la linea 64 a "Con mas de 3 anos en el mercado laboral mexicano" o unificar el dato en la fuente de verdad (`docs/context/empresa.md`).

### Baja prioridad

- **[NUEVO - A11Y - CHATWIDGET SIN REGION ARIA] `src/components/assistant/ChatWidget.tsx:143`** — La lista de mensajes no tiene `role="log"` ni `aria-live="polite"`. Los lectores de pantalla no anuncian los nuevos mensajes del asistente automaticamente. **Solucion:** Cambiar `<div ref={scrollRef} className="flex-1 overflow-y-auto ...">` a `<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversacion con Kyo" className="flex-1 overflow-y-auto ...">`.

- **[NUEVO - ESTRATEGA - SIN PROTECCION EN API] `src/app/api/admin/estratega/route.ts:97`** — El endpoint POST `/api/admin/estratega` no verifica si el request viene de un usuario autenticado. Cualquiera que conozca la URL puede enviar peticiones y consumir creditos de Anthropic (modelo Opus) y leer datos del negocio. El auth guard esta en el layout del admin pero no en la API. **Solucion:** Agregar al inicio del handler: verificar el header `Authorization` o la cookie de sesion de Supabase con `createServerClient`. Si no hay sesion valida, retornar `{ status: 401 }`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[NUEVO - PASO 0 DUPLICADO EN SALUDO] `src/lib/assistant/system-prompt.ts:15-23` + `src/components/assistant/useChat.ts:18-22`** — El `INITIAL_GREETING` en `useChat.ts` ya pregunta "¿Me permite saber su nombre?" y este mensaje se muestra como el primer mensaje del historial. El system prompt dice en el Paso 0: "El saludo ya pidio el nombre. Cuando el usuario responda, agradece y continua al paso 1." Esto funciona en teoria, pero si el modelo no entiende el contexto (historial truncado a 20 mensajes), podria volver a pedir el nombre. **Solucion:** En el system prompt, hacer el Paso 0 mas explicito: "El PRIMER mensaje visible en el historial (id='greeting') es el saludo inicial que ya fue enviado. NUNCA vuelvas a pedir el nombre si ya aparece en el historial como respuesta del usuario a ese saludo."

- **[NUEVO - PASO 5 NO FILTRA POR BADGE] `src/lib/assistant/system-prompt.ts:131`** — El formato de vacantes en el system prompt es `id · titulo · empresa · ubicacion · contrato · jornada · salario`. El campo `badge` (que puede ser "Urgente", "Nuevo", "Destacado") no se incluye. En el Paso 5, Kyo no puede mencionar urgencia porque no la ve. **Solucion:** Cambiar la linea 131 a: `` `- id=${j.id} · ${j.titulo} · ${j.empresa} · ${j.ubicacion} · ${j.contrato} · ${j.jornada} · $${j.salario?.toLocaleString?.() ?? j.salario}/mes${j.badge ? ` · [${j.badge}]` : ''}` ``. Agregar al system prompt en Paso 5: "Si la vacante tiene [Urgente], menciona que hay alta demanda de candidatos y que aplicar pronto es una ventaja."

- **[NUEVO - MANEJO DEL CASO "NO SE MI NOMBRE"] `src/lib/assistant/system-prompt.ts:22-24`** — El flujo asume que el usuario da su nombre. Pero muchos usuarios pueden responder "no importa", "anonimo" o simplemente saltar al tema. Si el usuario dice algo como "busco trabajo de cajero", el Paso 0 no tiene instruccion sobre como continuar sin nombre. Kyo puede quedar atascado repitiendo la pregunta del nombre. **Solucion:** Agregar al Paso 0: "Si el usuario no da un nombre o cambia de tema directamente, usa 'usted' para referirte a el y avanza al Paso 1 sin insistir en el nombre."

- **[NUEVO - FLUJO EMPRESARIAL INEXISTENTE] `src/lib/assistant/system-prompt.ts:64-67`** — Cuando una empresa escribe ("necesito contratar"), Kyo solo dice "Con gusto te conecto con nuestro equipo" y sugiere WhatsApp o navega a /contacto. No hay ningun flujo estructurado para empresas. El 30% de los visitantes son empresas (segun el contexto de la empresa). **Solucion:** Agregar al system prompt un bloque "# Flujo para empresas" con 3 pasos: (1) preguntar cuantos puestos necesitan cubrir, (2) preguntar el perfil general del puesto, (3) navegar a /contacto y mencionar que se responde en 24h. Esto hace que Kyo capture leads de empresas calificados, no solo los dirija a un formulario generico.

### Nuevas tools o capacidades recomendadas

- **Tool `register_talent` (alta prioridad)** — En el Paso 5, si ninguna vacante encaja, el system prompt dice "ofrece quedar en banco de talentos y navega a /contacto". Pero /contacto es un formulario generico. Una tool `register_talent(nombre, puesto, experiencia, ubicacion)` podria crear directamente un registro en la tabla `aplicaciones` con `vacante = "Banco de Talentos"`. El candidato no tendra que salir del chat. Implementacion: nueva tool en `tools.ts`, nuevo endpoint `/api/talent/register`, insert en tabla `aplicaciones` con campo `tipo = "banco_talentos"`.

- **Tool `get_active_jobs_from_supabase` (critica — reemplaza datos estaticos)** — Esta es la solucion definitiva al bug de datos desactualizados. En lugar de leer `JOBS`, crear una version async de `listJobs()` que consulte Supabase directamente en el momento del chat. La implementacion ya existe el patron en `chat/route.ts` con `sbAdmin`. Agregar `await sbAdmin.from("vacantes").select(...).eq("activa", true)` en `executeTool` para `search_jobs`, usando `sbAdmin` que ya esta disponible en ese scope.

### Problemas detectados

- **[BUG CRITICO - FAQs INUTILIZADAS] `src/lib/assistant/knowledge.ts:99-105`** — Ver seccion UX Alta Prioridad primer punto. El admin puede crear FAQs toda la vida en `/admin/kyo` y Kyo nunca las usara porque `getCompanyInfo()` retorna las FAQs hardcodeadas. Este es probablemente el bug mas impactante actualmente porque rompe la promesa de la interfaz admin.

- **[BUG - RATE LIMITER CON MEMORY LEAK] `src/app/api/assistant/chat/route.ts:68-80`** — `rateLimitMap` nunca limpia entradas expiradas. En el VPS con uptime de semanas, acumula cientos de IPs. **Solucion (una linea):** Al inicio de `checkRateLimit()`, antes del `return true` del nuevo entry: `if (rateLimitMap.size > 500) { const now = Date.now(); for (const [k, v] of rateLimitMap) if (v.resetAt < now) rateLimitMap.delete(k); }`.

- **[BUG - HISTORIAL SIN EXPIRACION] `src/components/assistant/useChat.ts:24-34`** — El historial en `localStorage` nunca expira. Un candidato que chato hace 3 semanas sobre una vacante cerrada abrira Kyo con ese contexto obsoleto. Kyo puede recomendar vacantes que ya no existen. **Solucion (2 lineas en `loadHistory`):** `const lastTs = parsed[parsed.length - 1]?.timestamp ?? 0; if (Date.now() - lastTs > 86_400_000) return [INITIAL_GREETING];`.

- **[BUG - LOCALE EN SALARIO] `src/app/vacantes/[id]/_content.tsx:117,171` + `system-prompt.ts:131`** — `toLocaleString()` sin locale usa el idioma del navegador. En algunos Android puede mostrar formato incorrecto. **Solucion:** Cambiar todas las ocurrencias a `toLocaleString('es-MX')`.

- **[RIESGO LFPDPPP - MENSAJES EN ANALYTICS] `src/components/assistant/useChat.ts:81`** — Ver seccion UX Alta Prioridad cuarto punto. Datos personales del usuario (nombre, al menos) se guardan en `site_eventos` sin consentimiento explicito.

- **[RIESGO LFPDPPP - IP EN CONVERSACIONES] `src/app/api/assistant/chat/route.ts:43-64`** — La tabla `kyo_conversaciones` guarda IP + historial completo de mensajes. El chat widget no tiene aviso de que la conversacion se almacena. **Solucion minima:** Agregar en `ChatWidget.tsx:191` bajo el form: `<p className="text-[10px] text-muted text-center mt-1 px-4">Esta conversacion puede ser guardada para mejorar el servicio.</p>`.

---

## Oportunidades de mejora general

- **Estratega — respuestas sin markdown** — El modelo Opus genera markdown rico pero el componente no lo renderiza. Instalar `react-markdown` (ver Media Prioridad arriba) haria las respuestas del Estratega mucho mas legibles con headers, listas y negritas.

- **Dashboard de Kyo en Analytics** — La tabla `kyo_conversaciones` acumula datos. El endpoint `/api/admin/resumen` podria agregar: total de conversaciones, promedio de mensajes por sesion (proxy de engagement), y tasa de conversion (conversaciones que terminaron con `kyo_navegacion` a `/vacantes/[id]`). Esto justifica el costo de la API de Anthropic con datos concretos.

- **Estratega "Analizar conversaciones de Kyo"** — Boton en la pestaña "Conversaciones" del admin (`/admin/kyo`) que pre-cargue el Estratega con: "Estratega, aqui estan las ultimas 20 preguntas que hicieron los candidatos en Kyo. ¿Que vacantes faltan publicar y que dudas no estamos resolviendo?" Requiere un endpoint que devuelva las ultimas `n` preguntas de candidatos de `kyo_conversaciones`.

- **Kyo no responde preguntas de proceso de aplicacion** — Si un candidato pregunta "¿cuanto tarda el proceso?", "¿en cuantos dias me llaman?", Kyo deberia tener esa informacion de las FAQs. Actualmente las FAQs hardcodeadas responden "72 horas" para reclutamiento (orientado a empresas) pero no hay FAQ de "¿cuanto tardan en contactarme como candidato?". Agregar esta FAQ en el admin una vez que el bug de FAQs este resuelto.

- **Timeout de respuesta de Kyo — cuarto reporte sin corregirse** — Cuando Anthropic tiene latencia, el usuario ve tres puntos indefinidamente. Fix de una linea en `useChat.ts:sendMessage`: `const timeout = setTimeout(() => { setError("La respuesta esta tardando. Intenta de nuevo o contactanos por WhatsApp."); setIsLoading(false); }, 15000)` con `clearTimeout(timeout)` en el `finally`.

---

## Resumen ejecutivo de prioridades

| # | Item | Impacto | Esfuerzo |
|---|------|---------|----------|
| 1 | FAQs admin nunca llegan a Kyo | Alto | Medio |
| 2 | navigate_to silencioso + widget no se cierra | Alto | Bajo |
| 3 | CTA sticky mobile en vacante | Alto | Bajo |
| 4 | Datos sensibles en analytics de Kyo | Alto | Bajo |
| 5 | API Estratega sin autenticacion | Alto | Bajo |
| 6 | Historial sin expiracion (24h) | Medio | Bajo |
| 7 | Rate limiter memory leak | Medio | Bajo |
| 8 | Kyo lee datos estaticos de vacantes/cursos | Critico | Alto |
| 9 | Locale en salario | Bajo | Bajo |
| 10 | Markdown en Estratega | Medio | Bajo |
