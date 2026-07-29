# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-07-29
**Cambios analizados:** `b21cdcf` (requiere aprobación por archivo en Artes), `79eecc8` (botón Vista cliente + deep-link ?tab= en revisor), `c2e039b` (barrido corporativo admin — 0 emojis decorativos), más archivos base del asistente Kyo.

---

## Cambios Recientes Detectados

- **SPEC-U — Aprobación por archivo en Artes:** `espacio_archivos.requiere_aprobacion` (bool) controla si el cliente ve los botones Aprobar/Necesito cambios en `DetalleArchivo`. El API devuelve 400 si se intenta aprobar un archivo con `requiere_aprobacion=false`.
- **SPEC-T — Vista cliente + deep-link ?tab=:** El admin de Proyectos tiene un enlace "Vista cliente" que abre `/revisor?tab=proyectos`. El revisor lee `?tab=` al montar y activa la pestaña correspondiente.
- **Barrido corporativo admin:** Eliminación de emojis decorativos en las 17 secciones del admin, creación de `src/components/ui/IconUI.tsx` para íconos SVG de línea compartidos. El barrido no tocó la vista del cliente (`/revisor`).

---

## Sugerencias de UX

### Alta prioridad

- **[src/app/revisor/page.tsx:975-980] Deep-link `?tab=` pierde contexto tras el login.**
  El botón "Vista cliente" abre `/revisor?tab=proyectos` en pestaña nueva. Si la revisora no tiene sesión activa en el portal (auth separada del admin), Supabase redirige al login y, tras autenticarse, vuelve a `/revisor` sin el parámetro `?tab=`. La revisora llega a Publicaciones en vez de Proyectos. **Fix:** antes del redirect al login, guardar el tab en `sessionStorage` (`revisor_pending_tab`); en el `useEffect` de auth (línea 968), si hay valor pendiente, restaurar la sección y limpiar el storage.

- **[src/app/revisor/page.tsx:976-979] URL no se actualiza al cambiar de pestaña — deep-link se desincroniza.**
  El `useEffect` lee `?tab=` solo al montar. Cuando el usuario navega entre pestañas con `setSeccion(k)` (línea 1132), la URL queda igual. Si copia la URL en ese momento y la comparte, el receptor no llega a la pestaña activa. **Fix:** en el click handler de pestaña, añadir `window.history.replaceState(null, '', \`?tab=\${k}\`)` junto al `setSeccion(k)`.

- **[src/components/revisor/ProyectosCliente.tsx:886] Emoji decorativo 📎 en el visor — inconsistente con el barrido corporativo.**
  El visor de archivos no previsualizable usa `<span style={{ fontSize: 58 }}>📎</span>` (línea 886). El commit `c2e039b` eliminó emojis decorativos de todo el admin, pero este elemento vive en la vista del cliente y quedó intacto. También, el botón "Aprobar" en línea 908 usa `"✅ Aprobar"` — emoji en texto de acción. Reemplazar el 📎 por un ícono SVG de línea (tipo "clip/adjunto") usando el mismo patrón `IconoEspacio` del archivo. Reemplazar `✅` por texto plano "Aprobar".

- **[src/components/revisor/ProyectosCliente.tsx:912-915] "Sin aprobación requerida" — mensaje ambiguo para el cliente.**
  Cuando `requiere_aprobacion === false`, se muestra `— Sin aprobación requerida` en texto gris apagado. El cliente puede interpretar esto como: ¿el archivo ya fue aprobado? ¿es un error? El estado real es "solo referencia". **Fix:** reemplazar el `<span>` gris por una píldora de contexto con fondo `#EAF2FF` y texto `#042E7B`: `"Solo para referencia · Sin acción requerida"`. Mismo estilo que las píldoras de estado pendiente/aprobado/cambios ya presentes en el mismo componente.

### Media prioridad

- **[src/app/admin/(panel)/proyectos/page.tsx:84-101] Dos sistemas de íconos en el mismo archivo fragmentan la iconografía.**
  El admin de proyectos usa `IconUI` (del componente compartido `src/components/ui/IconUI.tsx`) para el ícono `"eye"` (línea 1417), pero define un componente local `IconoLinea` (líneas 84-101) para otros 6 tipos: `carpeta`, `carpeta-mas`, `documento`, `subir`, `bloqueo`, `enviar`. Con el tiempo, los íconos nuevos irán a uno u otro lugar sin criterio claro. **Fix:** mover los 6 paths de `IconoLinea` a `IconUI.tsx` bajo esos mismos nombres, y eliminar `IconoLinea` del archivo de proyectos.

- **[src/app/revisor/page.tsx:1014, 1018] `loadPosts` hace 4 fetch en cada carga — incluyendo "todos" sin filtro innecesariamente.**
  La línea 1018 hace `fetch('/api/revisor/posts')` sin rango de fechas (trae TODOS los posts del portal) en cada carga de la vista, incluso cuando no hay filtros activos. En portales con 3+ meses de contenido, esto puede traer 80+ registros innecesarios. **Fix:** mover el fetch de `postsTodos` (línea 1018) a un efecto separado que solo se dispare cuando `filtroEstado !== "todos" || filtroRed !== "todos"`.

- **[src/app/admin/(panel)/proyectos/page.tsx:1416] Botón "Vista cliente" no avisa si el espacio está despublicado.**
  El botón abre el portal del cliente, pero si el espacio seleccionado tiene `publicado=false`, el cliente no lo verá — llegará a un empty state confuso. El admin no tiene contexto para entender por qué. **Fix:** añadir un `title` o tooltip al botón: `title="Abre el portal como lo ve el cliente · Solo se muestran espacios publicados"`. Bajo costo, alto valor preventivo.

- **[src/app/revisor/page.tsx:861-868] Tour de novedad usa emojis decorativos en contexto corporativo.**
  `NOVEDAD_PASOS` (líneas 861-868) usa emojis `✨ ✅ 🕐 🔴 📘 🎵` en el campo `emoji` de cada paso del coach mark. La tarjeta de bienvenida del tour los muestra a `fontSize: 48` (línea 818). Contrasta con el rediseño corporativo del resto del panel. **Fix de bajo impacto:** reemplazar emojis del campo `emoji` de `NOVEDAD_PASOS` por íconos SVG inline (`<svg>…</svg>` en el JSX de `NovedadFiltros`), o al menos eliminar el emoji gigante de la tarjeta de bienvenida y reemplazarlo por el logo Kyoszen.

---

## Sugerencias para el Asistente Kyo

### Problema crítico — datos desincronizados (reiteración urgente)

- **[src/lib/assistant/knowledge.ts:2] Kyo sigue leyendo vacantes del array estático `JOBS`.**
  El sitio público `/vacantes` y el admin leen de Supabase (tabla `vacantes`, solo `activa=true`), pero `knowledge.ts` importa `{ JOBS }` de `@/lib/jobs` — 9 vacantes hardcodeadas. Kyo puede recomendar vacantes cerradas o desconocer vacantes nuevas creadas desde el admin. Este bug reportado ayer sigue sin corregirse. **Prioridad máxima:** crear un endpoint `/api/assistant/jobs` que lea `vacantes` activas de Supabase y actualizar `StaticKnowledgeProvider.listJobs()` para llamarlo, o activar `SupabaseKnowledgeProvider`.

### Mejoras al flujo de conversación

- **[src/lib/assistant/knowledge.ts:143] Filtro de ubicación no tolera tildes — vacantes "Estado de México" invisibles.**
  La línea 143 usa `j.ubicacion.toLowerCase() === filters.location.toLowerCase()`. Si Kyo envía `location: "Estado de Mexico"` (sin acento), el filtro no matchea `"Estado de México"` (con acento en é) — fallo silencioso, 0 resultados. **Fix:** normalizar ambos valores antes de comparar:
  ```ts
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
  .filter(j => !filters?.location || norm(j.ubicacion) === norm(filters.location))
  ```

- **[src/lib/assistant/system-prompt.ts:86-88] Valores del filtro `?marca=` son ficticios — navegación genera resultados vacíos.**
  El system prompt lista valores como `marca=Sigma Retail`, `marca=Grupo Corpora`, `marca=Clinica Vitalis` para el parámetro URL. Estos son los nombres del array `JOBS` estático (placeholder). En Supabase, las empresas reales pueden llamarse diferente. Cualquier `navigate_to` con `?marca=Sigma Retail` en producción devuelve 0 resultados. **Fix temporal:** eliminar los ejemplos de `?marca=` del system prompt hasta que los valores coincidan con la BD real. Solo conservar filtros seguros: `?ubicacion=`, `?contrato=`, `?jornada=`, `?q=`.

- **[src/app/api/assistant/chat/route.ts:152] `max_tokens: 1024` puede truncar el Paso 5.**
  Paso 5 presenta 2-3 vacantes con nombre, empresa y razón de compatibilidad. Con context del tool-use previo, el total fácilmente supera los 700 tokens. En la práctica, Kyo a veces devuelve una respuesta cortada. **Fix:** subir `max_tokens` a `2048`. El costo adicional con Haiku es despreciable (~$0.00015 por mensaje extra).

- **[src/lib/assistant/system-prompt.ts:28-38] El flujo pide datos de uno en uno aunque el candidato los dio todos juntos.**
  Si el candidato escribe "soy cajera, tengo 2 años, vivo en Iztapalapa, tiempo completo", Kyo igual pregunta experiencia, luego ubicación, luego jornada — una por una. **Fix:** añadir al inicio del Paso 1 en el system prompt:
  ```
  Si el usuario respondió múltiples datos en un solo mensaje, extrae todos y
  salta al siguiente dato faltante. No repitas preguntas ya contestadas.
  ```

### Nuevas tools o capacidades recomendadas

- **Tool: `register_candidate`** — Cuando no hay vacante compatible (Paso 5 sin match), Kyo navega a `/contacto`. El candidato que abandona el formulario largo se pierde. Una tool que capture `{ nombre, puesto_buscado, contacto }` e inserte en `contactos` con `tipo='banco_talentos'` recuperaría estos leads sin requerir el formulario completo. Bajo costo de implementación, alta recuperación de leads.

- **Tool: `get_salary_range`** — Devuelve el rango salarial de una categoría (min/max/promedio) leyendo vacantes activas de Supabase. Muchos candidatos preguntan el sueldo antes de dar su nombre; Kyo no puede responder. Con esta tool respondería "Los puestos de Cajera van de $8,500 a $11,000/mes" y mantendría al candidato en el flujo.

### Problemas detectados

- **[src/app/api/assistant/chat/route.ts:202] Mensaje fallback genérico sale de tono.**
  Línea 202: `"Entendido, ¿en que mas te puedo ayudar?"` aparece cuando el modelo solo llamó tools y no generó texto. Con el flujo de 6 pasos, esto suena robótico tras una navegación. **Fix:** cambiar a string vacío `""` y en el frontend de `ChatWidget`, si `content === ""` y `navigations.length > 0`, no mostrar burbuja de texto — solo el chip de navegación.

- **[src/app/api/assistant/chat/route.ts:68-80] Rate limiter en memoria se resetea en cada deploy — ventana de abuso post-deploy.**
  `rateLimitMap` vive en el proceso Node. Cada `pm2 restart` tras un deploy borra los contadores. Los primeros 30 mensajes de cualquier IP quedan sin limite justo después del deploy. Alternativa sin Upstash: al detectar `kyo_mensaje` en `site_eventos` (ya se loggea), usar ese conteo como límite secundario persistente.

---

## Oportunidades de mejora general

- **La URL del revisor no refleja el tab activo — issue de deep-link sistémico.** Además del caso "Vista cliente", cuando la revisora llega al portal, hace clic en Proyectos, y luego copia/comparte la URL, el receptor llega a Publicaciones. El patrón correcto para un portal SPA es `replaceState` en cada cambio de tab. Una vez implementado, el botón "Vista cliente" también funciona correctamente sin el workaround de `sessionStorage`.

- **Kyo no bifurca empresa vs. candidato hasta que el texto lo revela tardíamente.** Si una empresa escribe "necesito contratar 10 cajeros", Kyo pregunta "¿Qué tipo de trabajo busca?" (Paso 1 de candidato) antes de detectar el contexto. Añadir al Paso 0/1 del system prompt: "Si el primer mensaje contiene 'contratar', 'necesito personal', 'busco candidatos' o similar, ir directo al flujo de empresa sin hacer las 4 preguntas de candidato."

- **El panel `/admin/kyo` no documenta las tools disponibles.** Si el admin edita el system prompt y borra las instrucciones de `navigate_to`, Kyo deja de navegar sin error visible. Añadir en la página del admin Kyo una sección colapsable "Tools disponibles" con la lista de las 5 tools y una descripción de cada una (dato estático, sin API). Previene que el admin rompa el comportamiento sin saberlo.

- **Vista previa de PDF en revisor no pasa parámetros de limpieza.** El visor grande del archivo en `DetalleArchivo` (línea 883) usa `<iframe src={archivo.url}>` directo, mostrando el toolbar de Chrome con botones de descarga/print que distraen en modo revisión. Cambiar a `src={archivo.url + "#toolbar=0&navpanes=0&view=Fit"}` para una experiencia de revisión más limpia, igual que la miniatura ya lo hace con `urlMiniaturaPdf()`.
