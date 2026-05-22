# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-22
**Cambios analizados:** commits del 2026-05-21 al 2026-05-22

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/ui/AplicarModal.tsx`
- `src/app/contacto/page.tsx`
- `src/app/cursos/page.tsx`
- `src/app/vacantes/page.tsx`

---

## Cambios Recientes Detectados

- **`596c049`** — Se agrego aviso de privacidad (link a `/politica-de-privacidad`) en tres puntos de conversion: `AplicarModal.tsx` (pie del formulario de aplicacion), `contacto/page.tsx` (checkbox obligatorio antes de enviar), y `cursos/page.tsx` (pie del modal de informes). Buen movimiento para LFPDPPP, pero genera inconsistencias nuevas (ver abajo).
- **`d542bbb`** — Correcciones de ortografia y acentos en paginas publicas (`contacto`, `nosotros`, `servicios`, `footer`, secciones del home). Sin impacto logico, solo texto.

---

## Sugerencias de UX

### Alta prioridad

- **`src/app/contacto/page.tsx` linea 20 — Formulario no se envia con Enter.**
  `handleSubmit` esta asignado al `onClick` del boton (linea 113), pero el contenedor no es un `<form onSubmit={handleSubmit}>`. Presionar Enter en cualquier input no envia el formulario. Esto rompe el comportamiento esperado en desktop y es un fallo critico de UX en formularios. Solucion: envolver los campos en `<form onSubmit={handleSubmit}>` y cambiar el `<button type="button">` a `<button type="submit">`.

- **`src/app/cursos/page.tsx` lineas 161-168 vs `src/app/contacto/page.tsx` lineas 100-109 — Inconsistencia de consentimiento LFPDPPP.**
  `contacto/page.tsx` usa checkbox activo (el usuario debe marcar para poder enviar). `cursos/page.tsx` y `AplicarModal.tsx` solo muestran el aviso como texto sin requerir consentimiento activo. Bajo LFPDPPP el consentimiento debe ser expreso para datos personales. En `AplicarModal.tsx` el riesgo es mayor porque incluye datos laborales y CV. Agregar checkbox con estado de validacion en ambos formularios, identico al de `contacto/page.tsx` lineas 100-109:
  ```tsx
  <label className="flex items-start gap-2.5 cursor-pointer">
    <input type="checkbox" required />
    <span>He leído y acepto el <a href="/politica-de-privacidad">Aviso de Privacidad</a>...</span>
  </label>
  ```

- **`src/app/contacto/page.tsx` linea 62 vs `src/lib/assistant/knowledge.ts` linea 79 — Experiencia declarada contradictoria.**
  El PageHero de `/contacto` dice "Con mas de 10 anos en el mercado laboral mexicano". El `knowledge.ts` tiene `"Anos en el mercado": "3+"`. El sitio dice 10, Kyo dice 3. Un candidato que le pregunta a Kyo "cuantos anos llevan?" recibe una respuesta diferente a la que ve en la pagina. Decidir el dato correcto y sincronizar ambos. CLAUDE.md dice "3+ anos". La cifra en el hero de contacto parece desactualizada o incorrecta.

- **`/politica-de-privacidad` — Ruta referenciada en 3 formularios que probablemente no existe.**
  Los commits recientes agregaron links a `/politica-de-privacidad` en `AplicarModal.tsx`, `contacto/page.tsx` y `cursos/page.tsx`. Si esa pagina no existe en el router de Next.js, el candidato que hace clic antes de aplicar ve un 404. Verificar si `src/app/politica-de-privacidad/page.tsx` existe. Si no, crearla con el aviso de privacidad de Kyoszen antes de que el sitio atraiga trafico real.

### Media prioridad

- **`src/components/ui/AplicarModal.tsx` lineas 67-108 — Modal sin atributos de accesibilidad.**
  El modal no tiene `role="dialog"`, `aria-modal="true"` ni `aria-labelledby`. El foco no queda atrapado dentro del modal al abrirse: un usuario de teclado puede Tab fuera del modal hacia el contenido del fondo. Agregar a la `motion.div` del modal (linea 82):
  ```tsx
  role="dialog"
  aria-modal="true"
  aria-labelledby="modal-title"
  ```
  Y en el `<h2>` del header (linea 94): `id="modal-title"`.

- **`src/app/vacantes/page.tsx` lineas 84-99 — Mutacion de estado durante el render (carry-over del reporte anterior).**
  El bloque `if (prevParams !== params) { setPrevParams(params); setSearch(q); ... }` llama setters de estado en la fase de render, fuera de un efecto. React puede ejecutar esto multiples veces en Strict Mode y genera warnings. Mover toda esa logica a:
  ```tsx
  useEffect(() => {
    const q = params.get("q") || params.get("search");
    if (q) setSearch(q);
    // ... resto de filtros
  }, [params]);
  ```
  Y eliminar el estado `prevParams` que ya no se necesita.

- **`src/components/sections/Hero.tsx` lineas 122, 132 — `next/image` en produccion (carry-over critico).**
  Las imagenes del hero usan `<Image>` de `next/image`, que CLAUDE.md prohibe explicitamente para el VPS. Puede romper las fotos silenciosamente. Reemplazar con `<img>` nativo:
  ```tsx
  <img
    src="/images/Hero.jpg"
    alt="Equipo profesional Kyoszen"
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
  />
  ```

### Baja prioridad

- **`src/components/ui/AplicarModal.tsx` linea 143 — Campo WhatsApp sin validacion de formato.**
  El campo `type="tel"` acepta cualquier texto. Sin validar, el reclutador recibe numeros incompletos y no puede contactar al candidato. Agregar `pattern="[0-9\s\-\+]{10,15}"` y `title="Ingresa un numero de 10 digitos"` para dar feedback antes de enviar.

- **`src/app/cursos/page.tsx` linea 14 — `CourseModal` bloquea scroll global con efecto secundario.**
  El `useEffect` en linea 18-21 modifica `document.body.style.overflow = "hidden"` directamente. Si el usuario navega a otra pagina mientras el modal esta abierto (ej. con el boton atras del navegador), el cleanup no corre y el body queda con overflow hidden. Asegurarse de que el cleanup tambien corra en casos de desmontaje abrupto. El `return () => { document.body.style.overflow = ""; }` deberia ser suficiente, pero verificar que funciona en navegacion Back.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **`src/lib/assistant/system-prompt.ts` lineas 40-62 — Kyo no menciona privacidad antes de recomendar vacantes.**
  Ahora que los formularios del sitio tienen aviso de privacidad activo, hay una desconexia: Kyo guia al candidato a aplicar pero nunca menciona que sus datos seran tratados. Agregar una linea al Paso 6 para suavizar la transicion al formulario:
  ```
  ## Paso 6 — CIERRE
  Antes de navegar, menciona brevemente: "Sus datos se manejan con total confidencialidad conforme a la LFPDPPP."
  Luego navega a /vacantes/[id] de la vacante elegida.
  ```
  Esto reduce friccion en el paso mas critico (cuando el candidato decide aplicar).

- **`src/lib/assistant/system-prompt.ts` linea 56-58 — Paso 6 navega a `/contacto` en lugar de a la vacante especifica (carry-over de alta prioridad).**
  El Paso 6 dice "Navega a `/contacto` si acepta". Pero cada vacante tiene su propio modal de aplicacion en `/vacantes/[id]`. Cambiar la instruccion:
  ```
  ## Paso 6 — CIERRE
  Cuando el candidato elija una vacante, usa navigate_to con /vacantes/[id] de esa vacante.
  El candidato encontrara el boton "Aplicar ahora" directamente en la pagina.
  Solo navega a /contacto si no hay vacante compatible (banco de talentos).
  ```

- **`src/lib/assistant/system-prompt.ts` lineas 22-45 — Flujo no absorbe respuestas multiples en un mensaje (carry-over).**
  Si el candidato escribe todo de golpe ("busco trabajo de ventas en CDMX, tiempo completo, tengo 2 anos de experiencia"), Kyo hace preguntas ya respondidas. Agregar despues del Paso 0:
  ```
  IMPORTANTE: Si el candidato proporciona voluntariamente datos de varios pasos
  en un solo mensaje, absorbe esa informacion sin repetir preguntas ya respondidas.
  Avanza directamente al primer dato faltante, o al Paso 5 si ya tienes todo.
  ```

- **`src/lib/assistant/system-prompt.ts` linea 52 — Formato del Paso 5 no incluye salario (carry-over).**
  El candidato evalua primero el salario. Cambiar el formato de recomendacion a:
  ```
  1. [Nombre del puesto] — [Empresa] — $[salario]/mes — [Por que le aplica en 1 linea]
  ```

### Nuevas tools o capacidades recomendadas

- **`src/lib/assistant/tools.ts` — Tool `search_jobs` sin parametros de contrato ni jornada (carry-over).**
  En el Paso 4 Kyo pregunta disponibilidad pero `search_jobs` no puede filtrar por contrato/jornada. Agregar a `input_schema.properties`:
  ```typescript
  contract: { type: "string", description: "Filtra por tipo de contrato: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" },
  schedule: { type: "string", description: "Filtra por jornada: 'Matutina', 'Vespertina', 'Mixta', 'Flexible'" },
  ```
  Y en `knowledge.ts > listJobs()`, agregar los filtros en la cadena `.filter()`.

- **`src/lib/assistant/knowledge.ts` — Quick replies para pasos con respuestas predecibles.**
  En pasos donde las respuestas son predecibles (Paso 3: ubicacion, Paso 4: jornada), agregar `suggestions?: string[]` a la interfaz `ChatMessage` y renderizarlos como chips clicables en `ChatWidget.tsx`. Reduce friccion especialmente en mobile donde escribir es lento:
  - Paso 3 → ["CDMX", "Estado de Mexico", "Hibrido", "Solo remoto"]
  - Paso 4 → ["Tiempo completo", "Medio tiempo"]

### Problemas detectados

- **`src/lib/assistant/knowledge.ts` linea 167 — Kyo sigue leyendo vacantes hardcoded, no de Supabase (carry-over critico).**
  `StaticKnowledgeProvider` lee de `src/lib/jobs.ts`. Toda la gestion de vacantes es en Supabase via el panel admin. Vacantes nuevas o desactivadas son invisibles para Kyo. El comentario en linea 166 ya anticipa la solucion: `SupabaseKnowledgeProvider`. Implementar `listJobs()` con:
  ```typescript
  const { data } = await supabase.from("vacantes").select("id,titulo,empresa,...").eq("activa", true);
  return data ?? [];
  ```
  Sin este cambio, Kyo recomendara vacantes que ya no existen o ignorara vacantes nuevas activas.

- **`src/components/assistant/useChat.ts` lineas 24-33 — Historial sin TTL (carry-over).**
  El historial en `localStorage` no expira. Un candidato que regresa despues de 2 semanas ve una conversacion obsoleta con vacantes desaparecidas. Agregar en `loadHistory()`:
  ```typescript
  const last = parsed[parsed.length - 1];
  if (last && Date.now() - last.timestamp > 7 * 24 * 60 * 60 * 1000) return [INITIAL_GREETING];
  ```

- **`src/app/api/assistant/chat/route.ts` linea 122 — `max_tokens: 1024` puede truncar el Paso 5 (carry-over).**
  Con 2-3 vacantes + salario + razon de match + CTA, el Paso 5 se acerca al limite. Cambiar a `max_tokens: 2048`. El costo con Haiku es minimo.

- **`src/components/assistant/useChat.ts` lineas 112-116 — `router.push` reinicia estado de filtros (carry-over).**
  Si el candidato esta en `/vacantes` y Kyo navega a `/vacantes?ubicacion=CDMX`, `router.push` lo trata como ruta nueva y reinicia filtros locales. Cambiar a `router.replace(target.path)` para navegaciones dentro de la misma ruta base.

---

## Oportunidades de mejora general

- **Validar que `/politica-de-privacidad` existe antes de la proxima sesion de trafico real.**
  Se agrego el link en 3 formularios de conversion. Si la pagina no existe, cualquier candidato que haga clic antes de aplicar ve un 404 y puede abandonar el proceso. Verificar `src/app/politica-de-privacidad/page.tsx` y crearla si no existe.

- **Auto-abrir Kyo en `/vacantes` para primera visita del candidato (carry-over).**
  En `ChatWidget.tsx`, usar `sessionStorage` para detectar si el usuario ya abrio el chat. Si esta en `/vacantes` y no lo ha hecho, `setOpen(true)` despues de 4 segundos. Aumenta tasa de enganche en la pagina con mayor intencion de conversion.

- **Badge de notificacion en el boton de Kyo cuando hay mensajes sin leer (carry-over).**
  Agregar un punto rojo (`w-3 h-3 bg-red-500 rounded-full absolute -top-0.5 -right-0.5`) visible cuando `messages.length > 0 && !open`. Recuerda al candidato que tiene una conversacion activa.

- **`src/lib/assistant/knowledge.ts` linea 60-67 — El blog no esta en `SITE_PAGES` (carry-over).**
  La ruta `/blog` existe pero Kyo no sabe que existe ni puede navegar a ella. Agregar:
  ```typescript
  { path: "/blog", title: "Blog", purpose: "Articulos y recursos de RRHH", summary: "Contenido sobre reclutamiento, liderazgo y tendencias del mercado laboral mexicano." },
  ```

---

## Resumen de pendientes por ciclo

### Nuevos este ciclo (2026-05-22)
- [ ] Formulario `/contacto` sin `onSubmit` — Enter no envia (alta prioridad)
- [ ] Inconsistencia de consentimiento LFPDPPP entre formularios (alta prioridad)
- [ ] Contradiccion "10 anos" vs "3+" en `/contacto` vs `knowledge.ts`
- [ ] Verificar y crear `/politica-de-privacidad` si no existe (bloqueante)
- [ ] `AplicarModal` sin atributos ARIA para accesibilidad
- [ ] Mencionar privacidad/confidencialidad en el Paso 6 de Kyo

### Pendientes del ciclo anterior (2026-05-21)
- [ ] `next/image` → `<img>` nativo en `Hero.tsx` (critico para VPS)
- [ ] Kyo lee vacantes hardcoded — conectar a Supabase (critico para confianza)
- [ ] `max_tokens: 1024` → 2048 en `/api/assistant/chat/route.ts`
- [ ] Historial con TTL de 7 dias en `useChat.ts`
- [ ] `router.push` → `router.replace` en navegaciones de Kyo
- [ ] Paso 6 navegar a `/vacantes/[id]` en lugar de `/contacto`
- [ ] Salario en formato de recomendacion del Paso 5
- [ ] Kyo absorber respuestas multiples en un solo mensaje
- [ ] Quick replies / chips en el chat
- [ ] Tool `search_jobs` con filtros de contrato/jornada
- [ ] Blog en `SITE_PAGES` de `knowledge.ts`
- [ ] Badge de notificacion en boton del chat
- [ ] Auto-abrir Kyo en `/vacantes` para primera visita
- [ ] Validacion de telefono en `AplicarModal`
- [ ] Mutacion de estado durante render en `vacantes/page.tsx`
