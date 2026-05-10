# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-10
**Cambios analizados:** No hubo cambios de codigo en los ultimos 2 dias (solo reportes automaticos). Auditoria completa del estado actual.

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Vacancies.tsx`
- `src/components/sections/Hero.tsx`
- `src/app/vacantes/page.tsx`

---

## Cambios Recientes Detectados

No hubo cambios de codigo en las ultimas 48 horas. Este reporte es una auditoria de base del estado actual del asistente y la UX del sitio.

---

## Sugerencias de UX

### Alta prioridad

- **Homepage Vacancies usa datos duplicados y hardcodeados** (`src/components/sections/Vacancies.tsx`, lineas 7-40): el componente define sus propias vacantes en lugar de importar desde `src/lib/jobs.ts`. Si se actualiza el catalogo JOBS, esta seccion muestra datos viejos. Solucion: `import { JOBS } from "@/lib/jobs"` y usar `JOBS.slice(0, 4)`. Impacto: consistencia automatica de datos.

- **Tarjetas de vacantes en homepage van a `/vacantes` en lugar del detalle** (`src/components/sections/Vacancies.tsx`, linea 74): todos los `<Link href="/vacantes">` deberian ser `<Link href={`/vacantes/${vac.id}`}>` para llevar al candidato directo al puesto. Actualmente tiene que buscar la vacante de nuevo. Impacto: elimina un paso innecesario en el funnel de aplicacion.

- **"Publicado hoy" hardcodeado en tarjetas del home** (`src/components/sections/Vacancies.tsx`, linea 92): el texto es falso cuando el candidato vuelve dias despues. Reemplazar por el campo `badge` del objeto JOBS real (ej. "Nuevo", "Urgente", "Disponible"). Impacto: credibilidad del sitio.

- **Estado vacio en `/vacantes` no ofrece alternativa al candidato** (`src/app/vacantes/page.tsx`, lineas 198-202): cuando los filtros no dan resultados, solo aparece un mensaje pasivo. Agregar un CTA como "Habla con Kyo para que te oriente" que abra el chat, o un boton "Registra tu perfil" que lleve a `/contacto`. Impacto: retiene candidatos que de otro modo abandonan.

- **Hero usa `next/image` en lugar de `<img>` nativo** (`src/components/sections/Hero.tsx`, lineas 122 y 132): CLAUDE.md documenta que `next/image` causo un bug en VPS. Las fotos del Hero usan `<Image>` de next/image. Cambiar a `<img className="object-cover w-full h-full">` antes de migrar a VPS. Impacto: previene el mismo bug que ya ocurrio en WhyUs.

### Media prioridad

- **Fotos de avatares en Hero dependen de pravatar.cc** (`src/components/sections/Hero.tsx`, linea 99): si el servicio externo cae, aparecen 4 imagenes rotas junto a la metrica "+687 candidatos colocados". Descargar 4 fotos de muestra a `/public/images/avatars/` y referenciarlas localmente.

- **PageHero de vacantes usa imagen de Unsplash externa** (`src/app/vacantes/page.tsx`, linea 106): la imagen hero viene de `images.unsplash.com`. Descargar a `/public/images/vacantes-hero.jpg`. Impacto: funciona offline y elimina dependencia externa.

- **Falta el salario en tarjetas del homepage** (`src/components/sections/Vacancies.tsx`): el salario es el primer criterio de un candidato. Las tarjetas del home no lo muestran. Agregar `$${job.salario.toLocaleString()}/mes` como ya aparece en la pagina de vacantes. Impacto: mayor motivacion para hacer clic en "Ver todas".

- **Sin feedback visual al activar un filtro que da 0 resultados** (`src/app/vacantes/page.tsx`): el candidato activa un filtro y puede encontrarse con 0 resultados sin saber cual filtro fue el culpable. Al llegar a 0 resultados, resaltar visualmente el ultimo filtro activado con borde rojo o un tooltip "0 resultados con este filtro".

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **El saludo de retorno es identico al de primera vez** (`src/components/assistant/useChat.ts`, lineas 16-21): si el candidato ya converso con Kyo y vuelve horas despues, ve "Bienvenido a Kyoszen..." y debe repetir todo el flujo. Detectar si `messages.length > 1` al cargar la historia y mostrar un saludo diferente: "Hola de nuevo. ¿Continuo buscando vacantes para ti?" Impacto: experiencia humana para candidatos recurrentes, no repiten los 6 pasos.

- **Kyo no maneja ubicaciones fuera del catalogo** (`src/lib/assistant/system-prompt.ts`, Paso 3): si el candidato dice "vivo en Neza", "en la colonia Juarez" o "en Queretaro", Kyo puede pasar ese valor como filtro URL `?ubicacion=Neza`, que no filtraria nada. Agregar al system prompt el mapeo: "Si el usuario menciona municipios del EDOMEX, usa 'Estado de Mexico'. Si menciona una ciudad distinta a CDMX/EDOMEX, ofrece perfiles Remotos o Hibridos." Impacto: Paso 3 funciona correctamente para candidatos de toda la zona metropolitana.

- **Sin chips de respuesta rapida** (`src/components/assistant/ChatWidget.tsx`): el candidato ve el saludo de Kyo y una caja de texto en blanco. En mobile esto genera friccion alta. Agregar un array `suggestions?: string[]` al tipo `ChatMessage` y renderizar chips clicables sobre el input. Tras el saludo inicial: ["Busco trabajo", "Informacion de cursos"]. Tras Paso 1: ["Ventas", "Administrativo", "Operaciones", "Atencion al cliente"]. Impacto: reduce el tiempo del flujo de 6 pasos a la mitad en mobile.

- **Mensajes de Kyo se renderizan como texto plano** (`src/components/assistant/ChatWidget.tsx`, linea 227): el Paso 5 lista 2-3 vacantes en formato numerado, pero se ve como texto corrido porque `whitespace-pre-wrap` no convierte markdown. Agregar un parser simple que convierta `**texto**` a `<strong>` y lineas con `1.` a items numerados. Alternativa: instalar `react-markdown` que es liviano. Impacto: el Paso 5 (recomendacion de vacantes) es visualmente legible.

- **Sin timeout en el fetch del asistente** (`src/components/assistant/useChat.ts`, lineas 81-87): si Anthropic tarda mas de 15 segundos, el candidato ve el indicador de escritura indefinidamente. Agregar `AbortController` con timeout de 20 segundos y mostrar: "La respuesta tardo demasiado. Intenta de nuevo o escribe al WhatsApp." Impacto: el candidato no piensa que el chat esta roto.

### Nuevas tools o capacidades recomendadas

- **Agregar `contrato` y `jornada` a `search_jobs`** (`src/lib/assistant/tools.ts`, lineas 38-47 y `src/lib/assistant/knowledge.ts`, linea 138): Kyo pregunta disponibilidad en Paso 4 pero la tool `search_jobs` no tiene parametros `contrato` ni `jornada` para filtrar. Resultado: recopila esa informacion pero no la usa al recomendar vacantes. Agregar ambos parametros al schema del tool y al metodo `listJobs()` del provider. Impacto directo en precision del Paso 5.

- **Tool `open_whatsapp`**: para clientes empresariales y temas fuera del flujo de candidatos, Kyo solo puede decir "visita nuestro WhatsApp" como texto. Una tool que devuelva el URL `https://wa.me/525520876765?text=Hola%2C+me+interesa...` permite que Kyo ejecute `navigate_to` con ese URL directamente y mida la conversion. Impacto: conversion directa al canal de ventas para empresas.

- **Tool `register_candidate`**: cuando no hay vacante compatible, Kyo navega a `/contacto` generico. Una tool que capture nombre, puesto buscado y contacto, y los envie a Supabase o a un endpoint POST, convierte candidatos sin vacante en leads calificados en lugar de dejarlos en un formulario generico. Cuando Supabase este activo, esta seria la primera integracion real.

### Problemas detectados

- **Rate limit en memoria no funciona en Vercel serverless** (`src/app/api/assistant/chat/route.ts`, lineas 10-24): el `rateLimitMap` vive en la memoria del proceso. En Vercel cada request puede iniciar una nueva instancia, reseteando el contador. El limite de 30 mensajes/minuto no se aplica en produccion. A corto plazo: subir el limite a 100 (porque igual no se aplica). Solucion correcta: Upstash Redis (ya mencionado en el comentario del codigo). Impacto: sin la correccion, cualquier usuario puede generar costos ilimitados de API.

- **Fallback de respuesta vacia es demasiado generico** (`src/app/api/assistant/chat/route.ts`, linea 143): si Claude responde solo con tool calls y sin texto, `finalText` queda en `""` y el fallback es "Entendido, ¿en que mas te puedo ayudar?" — respuesta que confunde al candidato que esperaba ver vacantes. Cambiar el fallback a: "Revise las opciones en la pagina. ¿Tiene alguna pregunta sobre las vacantes?" Impacto: evita mensajes sin contexto en el Paso 5.

- **Solo se ejecuta la primera navegacion del array** (`src/components/assistant/useChat.ts`, linea 109): `data.navigations[0]` toma la primera navegacion si Claude llama `navigate_to` mas de una vez. Dado que la ultima navegacion suele ser la mas relevante (la que sigue a la busqueda), cambiar a `data.navigations[data.navigations.length - 1]` para ejecutar siempre la mas reciente. Impacto: el candidato llega a la pagina correcta cuando Kyo navega tras buscar vacantes.

---

## Oportunidades de mejora general

- **Indicador de disponibilidad en el boton flotante de Kyo** (`src/components/assistant/ChatWidget.tsx`, lineas 63-69): el boton pulsa con halo animado pero no comunica que Kyo esta disponible. Agregar un punto verde de 10px absolutamente posicionado en la esquina superior derecha del boton. Similar al indicador de presencia de WhatsApp. Impacto: aumenta la tasa de apertura del chat al comunicar disponibilidad activa.

- **Conversion Kyo → WhatsApp no esta medida**: cuando Kyo navega a `/contacto` o sugiere WhatsApp, no hay evento de analytics. Agregar `window.gtag?.('event', 'kyo_conversion', { path: target.path })` en `useChat.ts` al detectar `data.navigations.length > 0`. Impacto: dato clave para justificar la inversion en el asistente al cliente.

- **Accesibilidad del area de mensajes del chat** (`src/components/assistant/ChatWidget.tsx`, linea 143): el `<div ref={scrollRef}>` que contiene los mensajes no tiene roles ARIA. Usuarios con lectores de pantalla no escuchan las respuestas de Kyo. Agregar `role="log" aria-live="polite" aria-label="Conversacion con Kyo"`. Cambio de 5 minutos con impacto real en accesibilidad.

- **El chat no tiene contexto segun la pagina actual**: Kyo saluda igual en `/cursos` que en `/vacantes`. Pasar una prop `context` a `ChatWidget` y personalizar el saludo inicial segun la pagina. En `/vacantes`: "¿Le ayudo a encontrar la vacante correcta?". En `/cursos`: "¿Le oriento sobre nuestros programas de capacitacion?". Requiere que `INITIAL_GREETING` en `useChat.ts` sea dinamico o que el sistema prompt reciba el contexto de pagina.

- **Flujo de 6 pasos sin indicador de progreso**: el candidato no sabe en que paso va ni cuanto falta. Agregar una barra de progreso discreta de 6 segmentos en el header del chat que avance con cada respuesta. Implementacion: inferir el paso actual contando mensajes del asistente en el historial. Impacto: reduce abandono a mitad del flujo porque el usuario sabe que queda poco.
