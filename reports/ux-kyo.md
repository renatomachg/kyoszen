# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-09
**Cambios analizados:** `src/app/api/aplicar/route.ts`, `src/app/api/contacto/route.ts`, `src/app/api/assistant/chat/route.ts`, `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/components/sections/Hero.tsx`, `src/components/sections/Vacancies.tsx`, `src/app/vacantes/page.tsx`, `src/components/layout/Navbar.tsx`

---

## Cambios Recientes Detectados

Los ultimos 2 dias solo contienen commits de salud del sitio (`reports/salud-sitio.md`). Los cambios funcionales mas recientes (ultimos 5 commits) fueron:
- Fix de SMTP para IONOS con port 587 + TLS (`src/app/api/aplicar/route.ts`, `src/app/api/contacto/route.ts`)
- Correo de contacto apuntado a `renatomachg@gmail.com` para pruebas (luego movido a `rsalazar@kyoszen.com` en aplicar)
- Fix de 4 errores de lint + hook pre-push
- Ajustes en `Navbar.tsx` y `Hero.tsx`

---

## Sugerencias de UX

### Alta prioridad

- **`src/components/sections/Vacancies.tsx` — datos hardcodeados desconectados del catalogo real**
  Las 4 tarjetas de la seccion en el Home NO vienen de `src/lib/jobs.ts`. Son objetos hardcodeados con titulos y ubicaciones fijos que no se actualizan cuando cambia el catalogo. Reemplazar el array `vacancies` por `import { JOBS } from "@/lib/jobs"; const vacancies = JOBS.slice(0, 4);` y cambiar el `href` de cada tarjeta a `/vacantes/${job.id}` en lugar de `/vacantes`. Tambien remover "Publicado hoy" hardcodeado y mostrar `job.badge` real.

- **`src/app/vacantes/page.tsx` lineas 197-202 — estado vacio sin CTA**
  Cuando no hay resultados con los filtros activos, el estado vacio solo muestra texto plano. No hay ningun llamado a la accion. Agregar debajo del texto un boton `Hablar con Kyo` que abra el ChatWidget, y un segundo boton `Ver todas las vacantes` que llame `clearAll()`. El candidato frustrado sin resultados es el momento mas critico para retenerlo.

- **`src/app/vacantes/page.tsx` linea 106 — imagen PageHero desde Unsplash externo**
  La imagen del hero de la pagina de vacantes viene de `https://images.unsplash.com/...`. Dependencia externa que puede fallar o tener latencia alta. Descargar la imagen a `/public/images/vacantes-hero.jpg` y referenciarla localmente. Alinearia con el patron ya usado en `Hero.tsx` que usa `/images/Hero.jpg`.

- **`src/components/sections/Hero.tsx` lineas 97-103 — avatares de `pravatar.cc` externos**
  Las fotos de los 4 avatares de confianza vienen de `https://i.pravatar.cc/56?img=${i}`. Son placeholder fotos de personas que no son candidatos reales de Kyoszen. Si el servicio falla, aparecen como broken images. Reemplazar con 4 fotos reales (o ilustraciones) guardadas en `/public/images/testimonials/` y con `alt` descriptivo.

### Media prioridad

- **`src/components/assistant/ChatWidget.tsx` linea 143 — sin `aria-live` en el area de mensajes**
  La lista de mensajes del chat no tiene atributo `aria-live`, por lo que lectores de pantalla (usuarios con discapacidad visual) no anuncian las respuestas de Kyo. Agregar `aria-live="polite"` al `<div ref={scrollRef}>` para accesibilidad basica.

- **`src/components/assistant/ChatWidget.tsx` lineas 154-163 — boton "Nueva conversacion" enterrado**
  El boton aparece al fondo del scroll de mensajes despues del mensaje #3. La mayoria de usuarios no lo vera. Moverlo al header del widget, junto al boton de cerrar, con un icono de reset (flecha circular). Esto tambien libera espacio en el scroll.

- **`src/components/assistant/ChatWidget.tsx` lineas 148-152 — error sin opcion de reintento**
  Cuando la API falla, el error aparece en rojo pero no hay boton "Reintentar". El usuario debe recordar y retipear su mensaje. Agregar un boton `Reintentar` que llame `sendMessage` con el ultimo mensaje del usuario (`messages[messages.length - 1]?.content`).

- **`src/components/assistant/ChatWidget.tsx` linea 120 — widget puede quedar tapado por teclado en iOS**
  `h-[min(60vh,560px)]` con `bottom-24` puede quedar fuera de vista cuando el teclado virtual de iOS sube el viewport. Agregar `@supports (height: 100dvh)` para usar dynamic viewport height en mobile: cambiar `h-[min(60vh,560px)]` a `h-[min(60dvh,560px)]`.

### Baja prioridad

- **`src/components/layout/Navbar.tsx` — sin indicador activo en subpaginas**
  La comparacion `pathname === link.href` marca activo solo en rutas exactas. Si el usuario esta en `/vacantes/3`, el link de "Vacantes" no se resalta. Cambiar a `pathname.startsWith(link.href) && link.href !== "/"` (con excepcion para `/` para evitar que siempre este activo).

- **`src/app/vacantes/page.tsx` — sin counter de filtros activos visible**
  Los dropdowns de filtro no muestran cuantos filtros estan activos. Si el usuario aplico 3 filtros y no ve resultados, no es obvio que puede limpiarlos. Mostrar un badge numerico en el pill de filtros cuando `anyActive === true`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **`src/lib/assistant/system-prompt.ts` linea 64 — Paso 5 no usa `search_jobs` explicitamente**
  El paso 5 le pide a Claude que "analice las vacantes disponibles" usando su memoria del system prompt. Pero la lista en el prompt es un resumen plano sin todos los detalles. Agregar instruccion explicita: "Antes de recomendar, llama a `search_jobs` con los parametros del perfil del candidato para obtener resultados actualizados." Esto tambien prepara el codigo para cuando JOBS venga de Supabase.

- **`src/lib/assistant/system-prompt.ts` linea 67 — Paso 6 envia a `/contacto` en lugar del formulario de vacante**
  El endpoint `/api/aplicar` ya existe y espera datos del candidato (nombre, WhatsApp, correo, experiencia, ubicacion, vacante). Pero Kyo envia a `/contacto` que es un formulario generico. Cambiar el Paso 6 a: "Navega a `/vacantes/[id]` de la vacante elegida. El formulario de aplicacion esta en esa pagina." Requiere que `/vacantes/[id]` tenga el formulario de aplicacion visible y accesible.

- **`src/lib/assistant/system-prompt.ts` lineas 91-96 — filtro de salario no documentado**
  La pagina de vacantes soporta `?salario=Menos+de+$10k` (y los otros rangos definidos en `SALARIOS`), pero el system prompt no menciona este parametro. Kyo nunca pregunta sobre expectativa salarial. Agregar al Paso 3 o Paso 4: "Si el candidato menciona expectativa de sueldo, usa `?salario=` al navegar." Y agregar al listado de filtros: `- /vacantes?salario=Menos de $10k` (valores: Menos de $10k, $10k - $15k, $15k - $20k, Mas de $20k).

- **`src/lib/assistant/system-prompt.ts` lineas 63-67 — sin confirmacion de navegacion en el chat**
  Cuando Kyo llama `navigate_to`, la pagina cambia silenciosamente. El usuario puede no entender que cambio de pagina. Agregar instruccion: "Despues de llamar `navigate_to`, escribe en el siguiente mensaje: 'Te lleve a [nombre de pagina]. Puedes ver las opciones ahi.'" Actualmente Kyo responde texto primero y luego navega, lo cual esta bien, pero el texto no siempre menciona que hubo navegacion.

- **`src/lib/assistant/system-prompt.ts` lineas 28-45 — flujo no maneja interrupciones**
  Si el candidato esta en Paso 2 y de repente pregunta "¿cuanto tarda el proceso?", Kyo responde y luego retoma el flujo, pero no hay instruccion sobre como recuperarlo. Agregar al final de la seccion de flujo: "Si el usuario interrumpe con una pregunta fuera del flujo, responde brevemente y luego retoma con: '[Nombre], para continuar con tu busqueda, [siguiente pregunta del paso actual].'"

### Nuevas tools o capacidades recomendadas

- **Nueva tool: `pre_fill_application`** — Deberia existir una tool que llame al endpoint `/api/aplicar` directamente con los datos que Kyo ya recopio (nombre, experiencia, ubicacion, vacante elegida). El candidato solo tendria que confirmar con su WhatsApp y correo. Esto reduciria friccion drasticamente: en lugar de navegar a un formulario externo, Kyo podria decir "Llenare tu solicitud. Dame tu correo y WhatsApp y yo me encargo."

- **Nueva tool: `register_talent_bank`** — Cuando no hay vacante compatible (Paso 5 sin match), Kyo ofrece el banco de talentos pero no tiene forma de registrar al candidato. Crear una tool que llame a un endpoint (puede ser una variante de `/api/contacto`) con `tipo: "banco_talentos"` y los datos recopilados. Requiere endpoint y tabla en Supabase.

- **Tool existente `get_company_info` es redundante** (`src/lib/assistant/tools.ts` lineas 74-77) — Toda la informacion de la empresa ya esta embebida en el system prompt. La tool existe pero duplica tokens sin agregar valor real. Se puede eliminar para reducir el token budget por llamada y simplificar el codigo.

### Problemas detectados

- **`src/app/api/assistant/chat/route.ts` lineas 10-23 — rate limiter no funciona en Vercel serverless**
  `rateLimitMap` es un `Map` en memoria. En Vercel, cada invocacion puede correr en una instancia diferente del serverless function, por lo que el contador se resetea en cada request. El rate limit efectivamente no protege nada en produccion. Solucion rapida (sin Redis): mover el conteo al cliente via `localStorage` en `useChat.ts`, o usar `@upstash/ratelimit` con Upstash Redis (plan free). Tambien agregar `X-RateLimit-Remaining` en el response header para que el frontend pueda mostrar advertencia al usuario antes de llegar al limite.

- **`src/components/assistant/useChat.ts` lineas 73-79 — historial cortado puede causar re-saludo**
  El historial persiste hasta 30 mensajes en localStorage, pero el API solo recibe los ultimos 20 (`route.ts` linea 73). Si el nombre del candidato fue capturado en el mensaje 12 de una conversacion larga, cuando la ventana se deslice fuera de los 20 mas recientes, Kyo ya no "recuerda" el nombre y puede preguntar de nuevo. Solucion: extraer el nombre del candidato del historial al inicio del hook y agregarlo como primer mensaje del sistema o en un campo separado del payload.

- **`src/components/assistant/useChat.ts` lineas 108-113 — solo se ejecuta la primera navegacion**
  Si Kyo llama `navigate_to` mas de una vez en un mismo ciclo de tool-use (por ejemplo, primero navega a `/vacantes` y luego a `/contacto`), el frontend solo ejecuta `data.navigations[0]`. El system prompt no sabe de esta limitacion. Agregar comentario en el system prompt: "Solo puedes llamar `navigate_to` una vez por mensaje." O en el frontend, encadenar las navegaciones con delay.

- **`src/app/api/assistant/chat/route.ts` linea 143 — fallback texto rompe el flujo**
  Si `finalText` es string vacio (puede ocurrir si Claude solo llama tools sin texto en ninguna iteracion), el response es "Entendido, ¿en que mas te puedo ayudar?". Esto rompe el flujo conversacional — el candidato que estaba en Paso 3 recibe un reset implicito. Cambiar el fallback a `null` y en el frontend no agregar un mensaje de asistente si el contenido es null, solo procesar las navegaciones.

- **`src/lib/assistant/system-prompt.ts` linea 88 — navegacion sin confirmacion del usuario puede ser intrusiva**
  "Cuando tengas claro lo que busca, usa `navigate_to` para llevar al usuario a la pagina correcta. No pidas confirmacion extra." Esto puede ser brusco: el candidato esta escribiendo y de repente cambia de pagina. En mobile especialmente es confuso. Considerar cambiar a: navegar solo cuando el usuario expresa intencion clara de ver vacantes ("quiero ver las vacantes", "muestrame"), no en automatico tras el Paso 4.

---

## Oportunidades de mejora general

- **Integrar el formulario de aplicacion dentro de `/vacantes/[id]`**: El endpoint `POST /api/aplicar` ya esta listo con todos los campos necesarios. Falta crear el formulario en la pagina de detalle de cada vacante. Esto completaria el flujo candidato end-to-end: Kyo recomienda → usuario va a `/vacantes/3` → llena el form → llega el correo a `rsalazar@kyoszen.com`. Sin este paso, el funnel queda roto.

- **Indicador de "Kyo esta disponible" en el boton flotante**: Cuando el asistente no tiene API key configurada, el endpoint devuelve 503. Pero el boton flotante siempre se ve activo. Agregar una llamada de health check al montar el widget que verifique disponibilidad y desactive el boton con tooltip "Asistente temporalmente no disponible" si el servidor responde 503.

- **Quick reply buttons en el chat**: Despues del saludo inicial, mostrar 3 botones de respuesta rapida: "Busco empleo", "Informacion sobre cursos", "Quiero contratar talento". Esto acelera el flujo y reduce la barrera de escribir un primer mensaje en blanco. Se puede implementar como un array de sugerencias en el mensaje de saludo en `useChat.ts` y renderizarlos como chips clickeables en `ChatWidget.tsx`.

- **Metricas de conversion del asistente**: No hay ningun tracking de cuantos candidatos llegan al Paso 5 o 6. Agregar eventos minimos (puede ser con `console.log` estructurado en `route.ts` o con Vercel Analytics) para medir: (a) porcentaje de conversaciones que llegan al Paso 5, (b) cuantas navegaciones a `/vacantes` dispara Kyo, (c) cuantas conversaciones terminan en "no hay vacante compatible". Sin datos, no se puede mejorar el funnel.

- **Consistencia en el parametro de busqueda**: `Hero.tsx` linea 76 genera URLs con `?search=`, pero el system prompt en `system-prompt.ts` linea 96 documenta `?q=`. `VacantesPage` acepta ambos (`params.get("q") || params.get("search")`), lo cual es correcto, pero deberia elegirse uno como estandar para simplificar. Recomendacion: estandarizar en `?q=` y actualizar `Hero.tsx` para que use `?q=` tambien.
