# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-01
**Cambios analizados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/app/vacantes/page.tsx`
- `src/components/revisor/ProyectosCliente.tsx`
- `src/app/revisor/page.tsx`
- Commits recientes: b21cdcf (switch requiere-aprobación por archivo), 79eecc8 (Vista cliente + deep-link ?tab=)

## Cambios Recientes Detectados
Los últimos 2 días contienen solo commits automáticos de este análisis. Los últimos cambios sustantivos (29-jul) están en el módulo de Proyectos Hub: se sustituyó el toggle "Requiere aprobación" a nivel de espacio por una bandera `requiere_aprobacion` por archivo individual, y se añadió un botón "Vista cliente" en el admin de proyectos con soporte de deep-link `?tab=` en el revisor para aterrizar en la pestaña correcta.

---

## Sugerencias de UX

### Alta prioridad

- **[vacantes/page.tsx:231] Empty state sin CTA de conversión**: Cuando los filtros no retornan resultados, el usuario ve "Sin resultados" con texto genérico y ninguna acción disponible. Añadir un botón de WhatsApp pre-llenado ("Háblanos sobre el puesto que buscas") y un enlace a `/contacto`. Los candidatos que no encuentran vacante son exactamente el perfil que más necesita el banco de talentos — perderlos en este punto es un costo real.

- **[ChatWidget.tsx:143] Sin región ARIA para mensajes entrantes**: El contenedor de mensajes no tiene `role="log"` ni `aria-live="polite"`. Los lectores de pantalla no anuncian las respuestas de Kyo. Cambiar el `<div ref={scrollRef} className="flex-1 overflow-y-auto ...">` a `<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" ...>`.

- **[ChatWidget.tsx:37] Botón flotante sin indicador de mensajes sin leer**: Si Kyo responde y el usuario cierra el chat, no hay señal visual de que hay un mensaje esperando. Añadir un badge rojo con conteo: `useState<number>` que incremente al recibir mensaje con `open === false`, y se resetee al abrir el chat.

- **[revisor/page.tsx — LoginView:617] Sin enlace "Olvidé mi contraseña"**: La página de login del revisor no tiene ningún mecanismo de recuperación visible. Si Rosy o Monse olvidan su contraseña, están bloqueadas. Añadir un `<button>` de texto que dispare `supabase.auth.resetPasswordForEmail(email)` y muestre "Revisa tu correo" como confirmación.

- **[vacantes/page.tsx:139] Hero con imagen de Unsplash hardcodeada**: La URL `https://images.unsplash.com/photo-...` puede fallar o cambiar. Subir la imagen al bucket `media` de Supabase y referenciar desde ahí. Es un punto de fallo en producción que el cliente ve como imagen rota.

### Media prioridad

- **[vacantes/page.tsx:51] `Suspense fallback={null}` deja pantalla en blanco**: Durante la carga inicial, el usuario ve una pantalla vacía. Cambiar `fallback={null}` por un skeleton de 4 tarjetas con shimmer (`animate-pulse bg-gray-100`) para comunicar que el contenido está cargando.

- **[vacantes/page.tsx:32] Filtro de salario sin acento**: `SALARIOS` incluye `"Mas de $20k"` sin tilde — debería ser `"Más de $20k"`. Inconsistencia tipográfica menor pero visible.

- **[ProyectosCliente.tsx:1055] Emoji en empty state de archivos**: La carpeta vacía muestra `📂` (emoji decorativo). Per las reglas del proyecto, reemplazar con `<IconoEspacio tipo="archivos" size={36} />` con `color: C.muted`.

- **[revisor/page.tsx:939] Emoji en botón "Entendido 👍"**: El botón del tour NovedadFiltros tiene emoji decorativo. Cambiar a "Entendido" para mantener coherencia con el barrido corporativo reciente.

- **[ChatWidget.tsx:154] Botón "Nueva conversación" demasiado discreto**: En `text-[11px]` sin contraste, muchos usuarios no lo encuentran. Darle más visibilidad: añadir borde, ícono de recarga SVG, y subir a `text-[12px] font-semibold`.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[system-prompt.ts:22-58] Kyo no maneja el caso "usuario da todo de golpe"**: Si alguien escribe "Busco trabajo de contador, 3 años de experiencia, CDMX, tiempo completo" en el primer mensaje, Kyo pregunta el nombre de nuevo ignorando la información ya dada. Añadir regla explícita después del Paso 0: "Si el usuario proporciona puesto + experiencia + ubicación + jornada en un solo mensaje, extrae esos datos directamente y salta al Paso 5. No repitas preguntas ya respondidas." Esto reduce la fricción para candidatos que saben lo que quieren.

- **[system-prompt.ts:84-97] Desincronía entre filtros del prompt y valores reales de la UI**: El prompt lista `ubicacion=Estado de Mexico` (sin acento) pero `vacantes/page.tsx:28` define `"Estado de México"` (con acento) y el filtro hace comparación exacta. Cuando Kyo navega a `/vacantes?ubicacion=Estado de Mexico`, el filtro no se activa. Corregir el prompt para que coincida exactamente: `CDMX`, `Estado de México`, `Híbrido`, `Remoto` — incluyendo tildes.

- **[system-prompt.ts:54-58] Flujo de "banco de talentos" débil**: El mensaje de fallback cuando no hay vacante es genérico. Mejorar: "Por ahora no tenemos una vacante exacta para [puesto] en [zona], pero podemos avisarle en cuanto surja una. ¿Quiere que anotemos su perfil?" Navegar con `navigate_to('/contacto?origen=banco-talentos')` para contextualizar la conversión.

- **[system-prompt.ts:64-69] Manejo de "soy empresa" muy escueto**: Si una empresa llega al chat buscando contratar, Kyo solo dice "te conecto con nuestro equipo". Mejorar añadiendo 1-2 frases del diferenciador (candidatos en 72 horas, garantía 30 días) antes de navegar a `/contacto`. Convierte el chat en un punto de calificación de empresas.

- **[system-prompt.ts:44] Paso 5: mensaje de recomendación demasiado largo**: El formato actual lista 2-3 vacantes con nombre, empresa y razón en párrafos. En mobile con el widget pequeño (360px) esto se lee mal. Reformatear como lista compacta: `1. Cajero · Sigma Retail · CDMX` seguido de una línea de razón, sin párrafo introductorio largo.

### Nuevas tools o capacidades recomendadas

- **`save_candidate_interest` (tool nueva, alta prioridad)**: Cuando no hay vacante compatible, Kyo solo puede navegar a `/contacto`. Con esta tool, Kyo guardaría nombre + puesto + zona directamente en `contactos` desde el chat sin que el usuario abandone la conversación. Archivos: añadir entrada en `src/lib/assistant/tools.ts` y nuevo endpoint `POST /api/assistant/candidato-interes` que inserte en `contactos` con `tipo='banco_talentos'` y dispare el correo de notificación.

- **`search_jobs` mejorado con ranking de relevancia (mejora en tools.ts:37)**: El método `listJobs` en `knowledge.ts:138` filtra pero no ordena por relevancia. Si el candidato dice "busco operativo en CDMX", devuelve todos en orden de ID. Añadir un campo `score` calculado por coincidencia de `query` contra `titulo` y `tags`, y ordenar descendente antes de retornar. El candidato ve primero lo que más le aplica.

- **`get_salary_range` (tool nueva, media prioridad)**: Los candidatos preguntan "¿cuánto paga eso?" frecuentemente antes del Paso 5. Actualmente Kyo tiene que recordar el salario del contexto del prompt. Una tool explícita que reciba un puesto/categoría y retorne el rango salarial de las vacantes activas daría respuestas más confiables.

### Problemas detectados

- **[knowledge.ts:167] Kyo usa datos ESTÁTICOS, no Supabase — impacto alto**: `StaticKnowledgeProvider` lee de `JOBS` importado de `src/lib/jobs.ts` (hardcoded), no de la tabla `vacantes`. El prompt dice "Vacantes disponibles actualmente (X)" pero esos datos no reflejan lo que el admin ha publicado/despublicado. Kyo puede recomendar vacantes inactivas o perder vacantes nuevas. Solución: en `src/app/api/assistant/chat/route.ts`, antes de llamar `buildSystemPrompt`, hacer `supabase.from('vacantes').select(...).eq('activa', true)` con `service_role` e inyectar los resultados en el prompt. El `KnowledgeProvider` ya está diseñado para ser intercambiable (comentario de fase 2 en knowledge.ts:166).

- **[chat/route.ts:202] Fallback sin acento ni empatía**: Cuando `finalText` está vacío, el fallback es `"Entendido, ¿en que mas te puedo ayudar?"` — sin acento en "más" y tono frío. Corregir a: `"Perdona, no pude generar una respuesta. ¿Podrías repetirme tu pregunta?"`.

- **[chat/route.ts:136] `previewPrompt` vacío (`""`) pasa la validación `??`**: `body.previewPrompt ?? await getStoredInstrucciones()` — si el frontend envía `previewPrompt: ""` (string vacío), el operador `??` lo toma como valor válido y Kyo queda sin instrucciones de comportamiento. Cambiar a: `const instrucciones = body.previewPrompt?.trim() || await getStoredInstrucciones() || undefined;` (usa `||` para excluir strings vacíos).

- **[tools.ts:63-70] `navigate_to` no valida paths**: La tool acepta cualquier string como `path`. Si el modelo alucina un path (`/vacantes/undefined`, `/admin/...`), el router del cliente navega a una 404 o ruta protegida. Añadir validación en `executeTool('navigate_to')`: comparar `input.path` contra la lista de paths de `SITE_PAGES` o un whitelist regex `/^\/[a-z0-9\-\/\?\=\&%\.]+$/`. El prompt ya tiene la regla "Solo usa rutas listadas" pero el ejecutor no la hace cumplir en código.

- **[chat/route.ts:68] Rate limiter en memoria se resetea en cada deploy**: El cron del VPS hace `git pull` y PM2 reinicia periódicamente, lo que borra `rateLimitMap`. Documentar esto y, si se quiere un rate limit real, usar una cookie de sesión o Upstash. Como solución temporal, subir el límite de 30 a 60 mensajes/min para que sea menos molesto en producción.

---

## Oportunidades de mejora general

- **Sin memoria entre sesiones para candidatos recurrentes**: Cada apertura del chat empieza desde cero. Guardar en `localStorage` el nombre y tipo de puesto del candidato (post-Paso 3), e inicializar el chat con "¿Seguimos buscando [puesto] en [zona], [nombre]?" cuando el usuario regresa. Mejora la percepción de continuidad sin cambios en el backend.

- **Sin tracking del abandono del flujo de Kyo**: No se sabe en qué paso se pierden los usuarios. Añadir en el frontend `logEvent('kyo_paso_N', texto_de_kyo.slice(0,50))` al recibir cada respuesta, detectando por palabras clave del texto si está en Paso 1, 2, etc. Con esos datos en `site_eventos`, el dashboard de Analytics puede mostrar el funnel de conversación y optimizar los pasos de mayor abandono.

- **[revisor/page.tsx:617] Login del revisor sin toggle de contraseña**: El campo `type="password"` no tiene ícono de ojo. En móvil es frustrante al escribir contraseñas largas. Añadir un botón SVG dentro del input que alterne `type="password"` / `type="text"` con `useState<boolean>`.

- **[ProyectosCliente.tsx — DetalleProyecto] Modal sin preservar scroll en mobile**: Al abrir y cerrar el detalle de un proyecto, la lista vuelve al top. Guardar la posición de scroll del contenedor antes de abrir el modal y restaurarla al cerrarlo. En mobile donde el usuario puede volver de otro contexto, esto evita re-navegar toda la lista.

- **[revisor/page.tsx — GUIA_PASOS:666-679] Tour asume que existen posts**: Los pasos 5-6 del tour (`requiereModal: true`) intentan abrir un post de ejemplo. Si el mes está vacío, `onAbrirEjemplo()` no hace nada y el usuario ve un overlay sin contenido contextual. Añadir: `if (actual.requiereModal && !hayPosts) { setPaso(paso + 1); return; }` para saltar esos pasos automáticamente cuando no hay publicaciones disponibles.
