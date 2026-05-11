# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-11
**Cambios analizados:** No hubo cambios de codigo en los ultimos 2 dias (solo reportes automaticos). Auditoria de segunda pasada enfocada en hallazgos nuevos.

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Hero.tsx`
- `src/components/sections/Vacancies.tsx`
- `src/app/vacantes/page.tsx`

---

## Cambios Recientes Detectados

No hubo cambios de codigo en las ultimas 48 horas. Los commits recientes son solo reportes automaticos (`ux-kyo`, `salud-sitio`). Este reporte es una segunda auditoria profunda que identifica problemas NO cubiertos en el reporte 2026-05-10.

---

## Sugerencias de UX

### Alta prioridad

- **`next/image` en Hero sigue sin corregirse** (`src/components/sections/Hero.tsx`, lineas 122 y 132): las dos fotos del collage usan `<Image>` de next/image. El CLAUDE.md documenta que esto causo un bug visual en VPS (WhyUs fue el caso). Antes de migrar a VPS, cambiar ambas a `<img className="object-cover w-full h-full" />` y eliminar el import de `next/image`. Es el mismo cambio que ya se hizo en WhyUs.

- **No existe pagina de detalle `/vacantes/[id]`**: las tarjetas de la seccion Vacancies del home y del catalogo `/vacantes` no pueden hacer deep-link a una vacante especifica. El dato `id` existe en `src/lib/jobs.ts` pero no hay ruta `/vacantes/[id]/page.tsx`. Crear esta ruta permite que Kyo diga "haz clic aqui para ver los detalles de esta vacante" y que Google indexe cada vacante como URL propia. Impacto: SEO + conversion (el candidato llega al detalle sin tener que buscar de nuevo).

- **Vacancies.tsx sigue con datos hardcodeados duplicados** (`src/components/sections/Vacancies.tsx`, lineas 7-40, pendiente del reporte anterior): el componente define 4 vacantes propias en lugar de importar `JOBS`. Si el catalogo cambia, esta seccion muestra datos desactualizados. Solucion: `import { JOBS } from "@/lib/jobs"` y usar `JOBS.slice(0, 4)`. Las tarjetas tampoco muestran el salario, que es el primer criterio del candidato.

### Media prioridad

- **`navigate_to` dispara navegacion aunque el candidato ya este en esa pagina** (`src/components/assistant/useChat.ts`, linea 109): si el usuario esta en `/vacantes` y Kyo llama `navigate_to("/vacantes")`, el `router.push("/vacantes")` se ejecuta igual, reseteando todos los filtros que el candidato tenia activos. Agregar una guarda: `if (target.path !== window.location.pathname)` antes del `router.push`. Una linea de cambio, evita una regresion concreta.

- **Tecla Esc no cierra el chat** (`src/components/assistant/ChatWidget.tsx`): cuando el widget esta abierto, la tecla Esc no lo cierra. Agregar un `useEffect` con `keydown` listener en el componente:
  ```ts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);
  ```
  Impacto: accesibilidad basica y comportamiento esperado en modales.

- **`toLocaleString()` en system prompt sin locale explicito** (`src/lib/assistant/system-prompt.ts`, linea 120): `j.salario?.toLocaleString?.()` formatea el numero segun el locale del servidor Node.js, que en Vercel puede ser `en-US` y producir "12,000" en lugar de "12,000" (identico pero en VPS podria variar). Cambiar a `j.salario?.toLocaleString("es-MX")` para garantizar formato consistente de salario en el contexto del sistema prompt.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **INITIAL_GREETING aparece tanto en el historial como en el system prompt** (`src/components/assistant/useChat.ts`, lineas 16-21 y `src/lib/assistant/system-prompt.ts`, lineas 21-23): el saludo inicial se guarda en localStorage como mensaje de asistente y se envia al API en cada request. Al mismo tiempo, el system prompt declara "Ya salude al usuario con: Bienvenido a Kyoszen...". Esto significa que Kyo ve el saludo dos veces en contexto. Puede generar un segundo saludo si el candidato escribe un mensaje ambiguo. Solucion: en `useChat.ts` filtrar el INITIAL_GREETING antes de enviarlo al API (`newMessages.filter(m => m.id !== "greeting")`), ya que el system prompt ya lo declara. Impacto: elimina la doble representacion del saludo en el contexto.

- **Kyo no confirma al candidato que lo esta redirigiendo** (`src/components/assistant/useChat.ts`, linea 110-112): cuando Kyo llama `navigate_to`, el candidato ve el mensaje de texto y 700ms despues la pagina cambia sin aviso. Si el candidato estaba leyendo el mensaje, el cambio de pagina lo sorprende. Cambiar el delay de 700ms a 1500ms y agregar en el texto del asistente (system-prompt.ts) la instruccion: "Cuando uses navigate_to, finaliza tu mensaje con 'Te llevo a la pagina en un momento...'". Impacto: la navegacion deja de sentirse como un bug.

- **`search_jobs` no recibe `contrato` ni `jornada` como parametros** (`src/lib/assistant/tools.ts`, lineas 38-47, pendiente del reporte anterior): Kyo recoge disponibilidad en el Paso 4 pero no la aplica al buscar. Agregar `contrato` y `jornada` al schema del tool y al metodo `listJobs()` en `src/lib/assistant/knowledge.ts` (linea 138). Esto es el cambio con mayor impacto en precision del Paso 5.

- **Saludo de retorno identico al de primera vez** (`src/components/assistant/useChat.ts`, lineas 23-30, pendiente del reporte anterior): si el candidato ya converso y regresa, ve "Bienvenido a Kyoszen..." de nuevo. Detectar `messages.length > 1` al cargar historia y mostrar "Hola de nuevo. ¿Continuo ayudandote a encontrar vacantes?" Impacto: experiencia humana para candidatos recurrentes.

### Nuevas tools o capacidades recomendadas

- **Agregar prompt caching al endpoint del asistente** (`src/app/api/assistant/chat/route.ts`, lineas 88-94): el system prompt incluye en cada request el catalogo completo de cursos y vacantes. Esto puede ocupar 1000-2000 tokens que se cobran en cada mensaje. Agregar `cache_control: { type: "ephemeral" }` al bloque `system` usando la API beta de Anthropic:
  ```ts
  system: [{ type: "text", text: buildSystemPrompt(), cache_control: { type: "ephemeral" } }],
  betas: ["prompt-caching-2024-07-31"],
  ```
  Con el catalogo estatico, el cache tendra una tasa de hit muy alta. Impacto: reduccion de costo de API de ~60-70% para conversaciones largas.

- **Tool `open_whatsapp`** (pendiente del reporte anterior): para clientes empresa y temas fuera del flujo de candidatos, Kyo solo puede decir "visita WhatsApp" como texto plano. Una tool que devuelva el URL `https://wa.me/525520876765?text=Hola%2C+me+interesa...` permite que el widget muestre un boton clickeable. Impacto: conversion directa al canal de ventas empresariales.

### Problemas detectados

- **`rateLimitMap` tiene fuga de memoria en VPS** (`src/app/api/assistant/chat/route.ts`, lineas 10-24): las entradas expiradas del mapa nunca se eliminan (solo se sobreescriben cuando el mismo IP llega de nuevo). En VPS con uptime largo y muchas IPs unicas, el mapa crece indefinidamente. Agregar limpieza periodica: cada N requests, iterar el mapa y borrar entradas con `resetAt < Date.now()`. En Vercel serverless el proceso se reinicia frecuentemente y no es un problema, pero en VPS (Fase 2 del deploy) si lo es.

- **Rate limit en memoria no funciona en Vercel serverless** (`src/app/api/assistant/chat/route.ts`, lineas 10-24, pendiente del reporte anterior): el `rateLimitMap` vive en proceso. En Vercel cada invocacion puede ser una nueva instancia. El limite de 30 mensajes/minuto no se aplica en produccion. Cualquier usuario puede generar costos ilimitados de API. Solucion correcta: Upstash Redis (ya mencionado en el comentario del codigo). A corto plazo documentar el riesgo en CLAUDE.md.

- **Solo se ejecuta la primera navegacion del array** (`src/components/assistant/useChat.ts`, linea 109, pendiente del reporte anterior): cuando Claude llama `navigate_to` mas de una vez en un turno (search + navigate), solo se ejecuta `navigations[0]`. La ultima navegacion suele ser la mas relevante. Cambiar a `data.navigations[data.navigations.length - 1]`.

- **Fallback de respuesta vacia es confuso** (`src/app/api/assistant/chat/route.ts`, linea 143, pendiente del reporte anterior): `finalText || "Entendido, ¿en que mas te puedo ayudar?"` aparece cuando Claude responde solo con tool calls y sin texto, justo en el Paso 5 de recomendacion. Cambiar a: `"Revise las vacantes en pantalla. ¿Alguna le interesa o prefiere que busque otras opciones?"`.

---

## Oportunidades de mejora general

- **No hay pagina de error 404 personalizada**: si un candidato llega a una URL inexistente (por ejemplo, una URL de vacante que Kyo invento), Next.js muestra la pagina de error por defecto que no tiene el contexto de Kyoszen ni el chat de Kyo. Crear `src/app/not-found.tsx` con el layout del sitio, un mensaje "Esta pagina no existe" y el boton "Buscar vacantes →" que lleve a `/vacantes`. Coste: 30 minutos. Impacto: experiencia coherente ante errores.

- **El chat widget no tiene boton de WhatsApp como fallback** (`src/components/assistant/ChatWidget.tsx`): cuando el asistente falla (error 500, timeout) el candidato ve un mensaje de error pero no tiene a donde ir. Agregar un enlace `"Escribe al WhatsApp"` dentro del bloque de error (linea 149-152) que abra `https://wa.me/525520876765`. Impacto: candidatos que encuentran el asistente caido no abandonan el sitio.

- **Chips de respuesta rapida siguen sin implementarse** (`src/components/assistant/ChatWidget.tsx`, pendiente del reporte anterior): el candidato en mobile ve el saludo de Kyo y un campo de texto vacio. Agregar chips clicables bajo el input: tras el saludo mostrar ["Busco trabajo", "Info de cursos"]; tras el Paso 1 mostrar las 4 categorias de JOBS. Reduce la friccion de teclado en mobile a cero.

- **Conversion de Kyo a WhatsApp/contacto sin analytics** (`src/components/assistant/useChat.ts`, linea 109, pendiente del reporte anterior): cuando Kyo navega a `/contacto` o el candidato llega a ese punto del flujo, no hay ningun evento registrado. Agregar `window.gtag?.("event", "kyo_conversion", { destination: target.path })` antes del `router.push`. Dato clave para justificar la inversion en el asistente con el cliente.

- **Accesibilidad del area de mensajes del chat** (`src/components/assistant/ChatWidget.tsx`, linea 143, pendiente del reporte anterior): el div de mensajes no tiene `role="log"` ni `aria-live="polite"`. Usuarios con lectores de pantalla no escuchan las respuestas nuevas de Kyo. Cambio de una linea con impacto real en accesibilidad.
