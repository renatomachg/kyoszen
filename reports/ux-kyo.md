# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-29
**Cambios analizados:**
- `src/app/api/assistant/chat/route.ts` — rate limit, logging a kyo_conversaciones
- `src/components/assistant/useChat.ts` — session tracking, analytics eventos
- `src/components/ui/AplicarModal.tsx` — modal de aplicacion con logEvent
- `src/app/vacantes/[id]/_content.tsx` — logEvent en vista/click/aplicacion
- `src/app/cursos/page.tsx` — carga desde Supabase con fallback a estatico
- `src/app/contacto/page.tsx` — logEvent en envio de formulario
- `src/app/admin/(panel)/estratega/page.tsx` — nuevo chat admin con streaming
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`

---

## Cambios Recientes Detectados

El commit `f7943ce` introdujo:
- **Estratega**: nuevo chat admin con streaming que analiza datos del sitio y propone servicios
- **Analytics tracking**: `logEvent` integrado en vistas de vacantes, clicks de aplicar, cursos y contacto
- **kyo_conversaciones**: el backend guarda cada sesion de Kyo en Supabase via `saveConversation`
- **Rate limiting** en `/api/assistant/chat`: 30 mensajes/minuto por IP (en memoria)
- **sessionId** enviado al backend desde `useChat.ts` para correlacionar conversaciones

---

## Sugerencias de UX

### Alta prioridad

- **Contacto page viola regla "sin acentos"** (`src/app/contacto/page.tsx` l.58, 64, 125, 126): El PageHero usa `"Contáctanos"` y `"Con más de 10 años en el mercado"`. El success state usa `"¡Mensaje enviado!"`. La convencion del cliente prohíbe acentos en copy del sitio. Corregir a: `"Contactanos"`, `"mas de 10 anos en el mercado"`, `"Mensaje enviado"`.

- **Copy inconsistente: 10 anos vs 3 anos** (`src/app/contacto/page.tsx` l.64 vs `src/lib/assistant/knowledge.ts` l.78): El PageHero de /contacto dice "Con más de 10 años en el mercado laboral mexicano" pero `knowledge.ts` registra `"Anos en el mercado": "3+"`. Kyo dira 3+ anos al usuario mientras el sitio dice 10+. Alinear ambos a la cifra real del cliente antes de que un candidato note la discrepancia.

- **VacanteContent no tiene skeleton de carga** (`src/app/vacantes/[id]/_content.tsx` l.43-48): Mientras carga desde Supabase solo muestra un spinner centrado en pantalla en blanco. Para una pagina de detalle con columnas, titulo, pills y sidebar, esto es desorientador en mobile. Reemplazar con un skeleton que replique la estructura real (titulo gris, pills gris, columnas) usando `bg-gray-100 animate-pulse`.

- **Link /politica-de-privacidad probablemente da 404** (`src/components/ui/AplicarModal.tsx` l.232 y `src/app/contacto/page.tsx` l.106): Ambos formularios linkean a `/politica-de-privacidad` que no aparece en la estructura del app ni en `SITE_PAGES`. El usuario hace clic justo al momento de decidir si acepta el aviso de privacidad y ve 404. Crear la pagina `src/app/politica-de-privacidad/page.tsx` con el texto del aviso o redirigir a una ancla en /nosotros.

### Media prioridad

- **Estratega admin no renderiza markdown** (`src/app/admin/(panel)/estratega/page.tsx` l.303-309): Las respuestas del AI se muestran con `whitespace-pre-wrap` en texto plano. Claude devuelve markdown (headers `##`, bullets `-`, bold `**texto**`) que aparece como caracteres literales. Agregar `react-markdown` o un parser minimo. En el div de `m.content`, cambiar por `<ReactMarkdown>{m.content}</ReactMarkdown>` con clases de prosa de Tailwind (`prose prose-sm`).

- **Cursos page: placeholder textarea tiene falta de acento intencional?** (`src/app/cursos/page.tsx` l.151): El placeholder dice `"Cuantas personas, fechas preferidas, dudas..."`. Si el cliente aplica "sin acentos", esta bien. Si no, cambiarlo a `"¿Cuantas personas asistiran, fechas preferidas, dudas?"` para que suene mas natural.

- **CategoryCard altura fija 200px comprime imagenes en mobile** (`src/app/cursos/page.tsx` l.249): En pantallas de 360px de ancho con grid de 2 columnas, cada tarjeta mide ~160px de ancho × 200px de alto, haciendo la proporcion muy cuadrada. Cambiar a `h-[140px] sm:h-[200px]` para que mobile tenga tarjetas mas proporcionales.

- **AplicarModal no indica limite de peso para CV** (`src/components/ui/AplicarModal.tsx` l.210): El boton dice `"PDF o Word — clic para seleccionar"` sin informar el tamano maximo. Si el backend rechaza archivos grandes, el usuario no tiene contexto. Agregar `" · max 5MB"` o el limite real que aplique la API `/api/aplicar`.

- **VacanteContent sidebar: `sticky top-28` puede fallar en mobile** (`src/app/vacantes/[id]/_content.tsx` l.166): En mobile el layout es de 1 columna (no hay sticky), pero en desktop con Navbar a altura diferente de 7rem, `top-28` podria quedar mal. Usar `top-[var(--navbar-height,7rem)]` o validar en viewport 1280px que el sidebar este correctamente anclado al scrollear.

### Baja prioridad

- **Estratega page: sidebar no colapsa bien en pantallas pequenas** (`src/app/admin/(panel)/estratega/page.tsx` l.186): El aside usa `w-64`/`w-0` en toggle pero en pantallas <640px ocupa espacio del area de mensajes cuando esta abierto. Agregar `hidden sm:flex` al aside y mover el toggle de menu a un boton fijo en la esquina en mobile.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **Paso 6 navega a /contacto en lugar de a la vacante** (`src/lib/assistant/system-prompt.ts` l.61-62): Cuando el candidato acepta aplicar, el prompt dice `"Navega a /contacto si acepta"`. Pero el flujo correcto es `/vacantes/[id]` donde existe el AplicarModal. Cambiar el Paso 6 a: `"Usa navigate_to con la URL exacta de la vacante elegida (/vacantes/[id]) para que el candidato pueda usar el formulario directo de aplicacion."` Esto elimina un paso de friccion en el paso mas critico del embudo.

- **Kyo puede repedir el nombre si el historial se trunca** (`src/lib/assistant/system-prompt.ts` l.22): El historial se limita a 20 mensajes (`chat/route.ts` l.131). En conversaciones largas el nombre del usuario cae fuera del contexto y Kyo vuelve a pedirlo, violando su propia regla de "una pregunta a la vez". Agregar al system prompt: `"Si el historial muestra que ya obtuviste el nombre del usuario, nunca lo repitas aunque no lo recuerdes. Usa 'estimado candidato' como alternativa."`.

- **"Banco de talentos" redirige a /contacto pero ese formulario no tiene esa opcion** (`src/lib/assistant/system-prompt.ts` l.54-57 y `src/app/contacto/page.tsx` l.90-95): El dropdown de /contacto tiene: "Quiero aplicar a una vacante", "Necesito contratar personal", "Informacion sobre cursos", "Cotizacion de servicios", "Otro". No hay opcion para banco de talentos. Dos opciones: (1) agregar la opcion al select de contacto, o (2) actualizar el system prompt para que Kyo diga al candidato: `"Selecciona 'Otro' en el formulario y en el mensaje escribe que quieres quedar en banco de talentos."`.

### Nuevas tools o capacidades recomendadas

- **Tool `get_live_jobs` que lea vacantes activas de Supabase en tiempo real**: `knowledge.ts` usa `StaticKnowledgeProvider` que lee de `JOBS` hardcodeado. La pagina /vacantes ya lee de Supabase, pero Kyo no. Si se desactiva una vacante desde el admin, Kyo seguira recomendandola a candidatos. Implementar `SupabaseKnowledgeProvider.listJobs()` con `supabase.from("vacantes").select().eq("activa", true)`. Es la mejora de mayor impacto: evita que Kyo mande candidatos a vacantes cerradas.

- **Tool `register_talent` para banco de talentos**: Cuando no hay vacante compatible, Kyo deberia poder registrar el perfil del candidato directamente. Nueva tool: `register_talent({ nombre, puesto, experiencia, ubicacion, jornada })` que inserte en la tabla `contactos` con asunto `"Banco de talentos"`. Convierte un rechazo en un lead capturado sin requerir que el usuario navegue a otro formulario.

- **Navegacion a vacante con `?apply=1` para abrir AplicarModal automaticamente**: Cuando el candidato decide aplicar en Paso 6, hacer `navigate_to("/vacantes/[id]?apply=1")`. En `_content.tsx`, agregar un `useEffect` que lea `searchParams.get("apply")` y llame `setModalOpen(true)` automaticamente. Esto completa el embudo candidato→formulario en un solo flujo sin clics extra.

### Problemas detectados

- **CRITICO — Kyo recomienda vacantes inactivas**: `src/lib/assistant/knowledge.ts` l.138-153: `listJobs` filtra desde el array `JOBS` estatico (`@/lib/jobs`). Las vacantes desactivadas en Supabase siguen en ese array ya que no tienen campo `activa`. Si el cliente desactiva una vacante, Kyo la seguira mostrando como disponible. Solucion: implementar `SupabaseKnowledgeProvider` (ver arriba).

- **Reset del chat no regenera sessionId** (`src/components/assistant/useChat.ts` l.139-145): `reset()` limpia `localStorage` pero no `sessionStorage`. La siguiente conversacion hace `upsert` con el mismo `session_id` y sobreescribe el historial anterior en `kyo_conversaciones`. Agregar `sessionStorage.removeItem("kyo_session_id")` dentro de `reset()` para que el siguiente chat genere un ID nuevo.

- **Rate limit en memoria se pierde en cada reinicio de PM2** (`src/app/api/assistant/chat/route.ts` l.68): `rateLimitMap` es un `Map` de Node en memoria. Cada `pm2 restart` o crash lo reinicia, permitiendo a un usuario bypassear el limite. No es bloqueante con el trafico actual pero documentar para migrar a Redis cuando escale.

- **MAX_TOKENS = 1024 puede truncar respuesta en Paso 5** (`src/app/api/assistant/chat/route.ts` l.152): En Paso 5, Kyo lista 2-3 vacantes con titulo, empresa y razon de compatibilidad. Si el catalogo tiene muchas entradas y Claude hace analisis extenso antes de responder, 1024 tokens puede truncar el mensaje a la mitad. Subir a `max_tokens: 1500` para haiku sin impacto significativo en costo.

- **`navigate_to` solo ejecuta la primera navegacion** (`src/components/assistant/useChat.ts` l.124): `data.navigations[0]` descarta navegaciones adicionales sin avisar. Si Claude llama `navigate_to` dos veces, el usuario ve solo la primera. Agregar `console.warn("[kyo] multiple navigations, only first executed:", data.navigations)` para detectar si esto ocurre en produccion.

---

## Oportunidades de mejora general

- **Kyo deberia detectar si el usuario esta en una vacante especifica**: Si el usuario abre el widget estando en `/vacantes/[id]`, podria arrancar desde Paso 5 directamente. En `ChatWidget.tsx`, leer `window.location.pathname` al abrir el chat y, si es `/vacantes/*`, pre-cargar el contexto de esa vacante para que Kyo salte los pasos 1-4 y ofrezca aplicar directamente.

- **Analytics: falta evento kyo_session_start**: `useChat.ts` registra `kyo_mensaje` por mensaje, pero no cuando el usuario abre el widget. Agregar `logEvent("kyo_session_start", "")` en el `useEffect` de mount (`useChat.ts` l.63-67) para medir cuantas sesiones se inician vs cuantos mensajes se envian — la diferencia revela tasa de abandono temprano.

- **Estratega: sugerencias predefinidas deberian ser dinamicas** (`src/app/admin/(panel)/estratega/page.tsx` l.18-23): Los 4 SUGERENCIAS son estaticos y genericos. Serian mas utiles si se generaran con base en datos reales del momento: ej. `"Tienes X vacantes sin aplicaciones esta semana"` o `"El curso Y tuvo Z solicitudes — como capitalizarlo?"`.

- **AplicarModal deberia detectar abandono del formulario** (`src/components/ui/AplicarModal.tsx` l.59-67): Si el usuario abre el modal, llena algun campo y lo cierra sin enviar, ese dato es valioso para saber en que paso se frena. En `handleClose`, si `status === "idle"` y el form tiene datos, disparar `logEvent("aplicar_modal_abandonado", vacante)`.

- **Cursos page: filtros de URL en system-prompt no tienen equivalente en la UI** (`src/lib/assistant/system-prompt.ts` l.91): El prompt menciona `/cursos?modalidad=online` pero la pagina de cursos no lee ni aplica query params. Kyo puede enviar al usuario a URLs con `?modalidad=` que se ignoran silenciosamente. Verificar si el componente de cursos aplica esos params; si no, eliminarlos del system prompt para que Kyo no genere expectativas falsas.
