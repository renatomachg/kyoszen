# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-18
**Cambios analizados:** Sin cambios de codigo en los ultimos 2 dias (solo reportes automaticos). Auditoria de cuarta pasada — todas las sugerencias son NUEVAS, no cubiertas en reportes anteriores (2026-05-15 a 2026-05-17).

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Vacancies.tsx`
- `src/components/sections/Hero.tsx`
- `src/components/sections/FAQ.tsx`
- `src/components/layout/Navbar.tsx`
- `src/components/ui/AplicarModal.tsx`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/page.tsx`
- `src/app/contacto/page.tsx`
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

Sin cambios de codigo. Los ultimos commits son reportes automaticos. Esta auditoria identifica observaciones nuevas no cubiertas en sesiones previas.

---

## Sugerencias de UX

### Alta prioridad

- **[CRITICO — Formulario de contacto no tiene elemento `<form>` — Enter no envia]** `src/app/contacto/page.tsx` linea 107: el boton de envio usa `onClick={handleSubmit}` pero no hay un `<form onSubmit>` wrapeando los campos. Consecuencias directas: (1) presionar Enter dentro de cualquier campo no envia el formulario, lo cual es comportamiento esperado en cualquier form; (2) los navegadores no ofrecen autofill porque no reconocen el bloque como un formulario HTML; (3) gestores de contrasenas como 1Password tampoco lo detectan. Correccion: envolver los campos en `<form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>` y cambiar el boton a `type="submit"`. Tambien agregar `autocomplete="name"` al campo nombre, `autocomplete="email"` al correo.

- **[Seccion Vacancies del Home usa datos hardcodeados independientes de jobs.ts]** `src/components/sections/Vacancies.tsx` lineas 7-40: el componente define su propio array local `const vacancies = [...]` con 4 vacantes ficticias en lugar de importar de `src/lib/jobs.ts`. Si se actualiza el catalogo real en `jobs.ts`, el Home seguira mostrando las mismas 4 vacantes estáticas. La seccion pierde credibilidad si un candidato ve en el Home "Auxiliar Administrativo" y llega a `/vacantes` con datos distintos. Correccion:
  ```tsx
  import { JOBS } from "@/lib/jobs";
  // reemplazar el array local por:
  const vacancies = JOBS.slice(0, 4);
  ```
  Ajustar el renderizado para usar `job.titulo`, `job.ubicacion`, `job.contrato`, `job.badge`, `job.badgeClass`. Una sola linea de cambio elimina el riesgo de desfase de datos.

- **[ChatWidget permanece abierto despues de que Kyo navega — experiencia confusa en mobile]** `src/components/assistant/useChat.ts` linea 109-113: cuando Kyo llama `navigate_to`, el hook hace `router.push(target.path)` pero el ChatWidget queda visible flotando sobre la nueva pagina. En desktop esto es tolerable, pero en mobile el widget ocupa `86vw` y tapa el contenido de la pagina a la que Kyo acaba de llevar al usuario. Solucion en `ChatWidget.tsx`: exponer una prop `onNavigate` o usar un callback en el hook para cerrar el panel:
  ```tsx
  // En useChat.ts, aceptar un callback opcional:
  export function useChat(onNavigate?: (path: string) => void) {
    ...
    if (data.navigations.length > 0) {
      const target = data.navigations[0];
      setTimeout(() => {
        router.push(target.path);
        onNavigate?.(target.path);
      }, 2000);
    }
  }
  // En ChatWidget.tsx:
  const { messages, sendMessage, ... } = useChat(() => setOpen(false));
  ```
  El chat se cierra suavemente antes de que el usuario vea la nueva pagina. En mobile esto es critico para la conversion.

- **[WhatsApp en detalle de vacante no lleva mensaje pre-llenado]** `src/app/vacantes/[id]/page.tsx` linea 161: el link es `https://wa.me/525520876765` sin parametro `text`. El candidato llega a WhatsApp con un chat vacio y tiene que escribir desde cero cual vacante le interesa. Tasa de abandono alta. Cambiar a:
  ```tsx
  href={`https://wa.me/525520876765?text=${encodeURIComponent(`Hola, me interesa la vacante de ${job.titulo} en ${job.empresa}. Me podrian dar mas informacion?`)}`}
  ```
  Costo: 0 lineas de logica. Impacto: el candidato ya sabe que escribir y el equipo de Kyoszen recibe el contexto inmediatamente.

### Media prioridad

- **[FAQ accordion puede truncar respuestas largas con max-h:200px fija]** `src/components/sections/FAQ.tsx` linea 83: la animacion usa `max-h-[200px]` como valor fijo. Si alguna respuesta supera 200px de altura (aprox. 6 lineas de texto a 13.5px), el contenido queda cortado sin scroll. Actualmente las respuestas son cortas, pero cuando el cliente actualice el copy con respuestas mas detalladas se volvera un bug silencioso. Cambiar a `max-h-[600px]` o mejor aun, usar Framer Motion `AnimatePresence` con `height: "auto"` para que la animacion se adapte al contenido real:
  ```tsx
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: "auto", opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    transition={{ duration: 0.25 }}
    className="overflow-hidden"
  >
  ```

- **[Hero usa imagenes de pravatar.cc — dependencia externa no confiable]** `src/components/sections/Hero.tsx` lineas 97-104: los avatares del bloque de prueba social (`+687 candidatos colocados`) se cargan de `https://i.pravatar.cc/56?img=1` a `img=4`. pravatar.cc es un servicio de terceros gratuito sin SLA. Si cae, el bloque de credibilidad del Hero aparece con 4 cuadros rotos justo debajo del H1. Reemplazar con 4 imagenes de placeholder locales guardadas en `/public/images/avatar-1.jpg` etc. (cualquier foto de stock en dominio publico funciona). Cero dependencias externas para la primera vista del sitio.

- **[Boton "Nueva conversacion" demasiado sutil — candidatos no lo descubren al final del flujo]** `src/components/assistant/ChatWidget.tsx` lineas 153-164: el boton aparece despues de 2+ mensajes como texto de 11px color muted. Cuando Kyo completa el flujo de 6 pasos y navega a `/contacto`, el candidato cierra el chat o queda con una conversacion finalizada sin un prompt claro de reinicio. Cambiar a un estado de "conversacion completada" mas visible. Al detectar que el ultimo mensaje del asistente contiene "/contacto" (o via una flag en el hook), mostrar un mensaje de cierre con boton prominente:
  ```tsx
  {messages.length > 6 && !isLoading && (
    <div className="bg-blue-soft rounded-xl p-3 text-center mt-2">
      <p className="text-[12px] text-navy font-medium mb-2">¿Necesitas mas ayuda?</p>
      <button onClick={reset}
        className="bg-navy text-white text-[12px] font-bold rounded-full px-4 py-1.5">
        Nueva consulta
      </button>
    </div>
  )}
  ```

- **[Salario siempre muestra "MXN bruto" — puede desmotivar candidatos operativos]** `src/app/vacantes/[id]/page.tsx` linea 139: el texto "MXN bruto" esta hardcodeado pero los datos en `jobs.ts` no tienen campo `esNeto: boolean`. Para la vacante de Recepcionista ($8,000/mes), un candidato que lee "bruto" calcula que su quincena neta sera aprox $3,200 despues de IMSS/ISR y puede desistir. Para vacantes operativas en Mexico es comun ofrecer salario neto. Soluciones: (a) eliminar el texto "bruto" del UI y dejarlo sin especificar (mas neutro), o (b) agregar campo `tipSalario: "bruto" | "neto"` al tipo `Job` en `jobs.ts` y mostrarlo dinamicamente. La opcion (a) es un cambio de 2 caracteres con impacto inmediato.

- **[Hamburger button sin aria-expanded — falla basica de accesibilidad]** `src/components/layout/Navbar.tsx` linea 43: el boton de menu mobile no tiene `aria-expanded={mobileOpen}`. Los lectores de pantalla no saben si el menu esta abierto o cerrado. Cambio minimal:
  ```tsx
  <button
    aria-expanded={mobileOpen}
    aria-controls="mobile-nav-menu"
    aria-label={mobileOpen ? "Cerrar menu" : "Abrir menu"}
    ...
  >
  ```
  Y agregar `id="mobile-nav-menu"` al div del menu mobile (linea 92).

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[Kyo no tiene rama para "ya aplique antes" — candidatos recurrentes quedan sin respuesta]** `src/lib/assistant/system-prompt.ts` — no hay instruccion para cuando un candidato dice "ya mande mis datos la semana pasada" o "¿saben algo de mi solicitud?" (esto es diferente al "check_application_status" ya sugerido). El candidato recurrente no quiere pasar por el flujo de 6 pasos de nuevo. Agregar seccion en el system-prompt:
  ```
  ## Candidatos recurrentes
  Si el usuario menciona que ya aplico o ya envio sus datos previamente:
  - NO reinicies el flujo de 6 pasos.
  - Responde: "[Nombre], para dar seguimiento a tu proceso te recomiendo contactar directamente
    a nuestro equipo: WhatsApp 55 2087 6765, disponibles Lun-Vie 9am-6pm. Ellos tienen acceso
    a tu expediente."
  - Navega a /contacto si quiere otras opciones de contacto.
  ```

- **[Kyo no establece expectativa de tiempo en el Paso 6 — candidato queda en el limbo]** `src/lib/assistant/system-prompt.ts` linea 67: el Paso 6 solo dice "Invitalo a llenar el formulario de aplicacion. Navega a /contacto si acepta." No hay instruccion de mencionar cuanto tiempo tarda Kyoszen en responder. El candidato aplica y no sabe si lo llamaran en 2 horas o 2 semanas. Agregar al Paso 6:
  ```
  ## Paso 6 — CIERRE
  Antes de navegar a /contacto, menciona explicitamente:
  "Una vez que envie sus datos, nuestro equipo le contactara en menos de 24 horas habiles.
  ¿Listo para proceder?"
  Solo entonces navega a /contacto.
  ```
  El dato "24 horas" ya esta en el knowledge base (COMPANY.stats). Usarlo en el cierre reduce la ansiedad del candidato.

- **[Kyo puede perder el contexto del nombre si el candidato reanuda una conversacion anterior]** `src/components/assistant/useChat.ts` linea 13: el historial se persiste en localStorage con clave `kyoszen_chat_history_v1`. Si un candidato regresa 2 dias despues con una conversacion activa que ya paso el Paso 0 (dio su nombre), Kyo ve todo el historial. Pero el saludo inicial (`INITIAL_GREETING`) tiene `timestamp: 0` y el saludo de reapertura del chat siempre es el mismo "Bienvenido a Kyoszen...". Hay una inconsistencia: si el historial tiene 10 mensajes y el candidato ya dio su nombre, el mensaje inicial de bienvenida aparece al top del chat como si fuera una conversacion nueva. Solucion en `useChat.ts`:
  ```typescript
  // Al cargar historial, si hay mas de 1 mensaje (conversacion activa),
  // reemplazar el greeting fijo con uno de retorno:
  const RETURN_GREETING: ChatMessage = {
    id: "greeting",
    role: "assistant",
    content: "Hola de nuevo. ¿En que mas puedo orientarle?",
    timestamp: 0,
  };
  function loadHistory(): ChatMessage[] {
    const parsed = ...; // logica actual
    if (parsed.length > 3) {
      // conversacion activa — no repetir el saludo de nombre
      return [RETURN_GREETING, ...parsed.slice(1)];
    }
    return parsed;
  }
  ```

### Nuevas tools o capacidades recomendadas

- **[Agregar filtro `min_salary` a search_jobs — candidatos dicen "busco de minimo X"]** `src/lib/assistant/tools.ts` linea 39-46: `search_jobs` puede filtrar por `category` y `location` pero no por salario minimo. Cuando un candidato dice "busco de minimo $12,000", Kyo tiene que buscar todas las vacantes y filtrar mentalmente. Agregar parametro al schema:
  ```typescript
  min_salary: {
    type: "number",
    description: "Salario minimo mensual requerido por el candidato en pesos MXN"
  }
  ```
  En `executeTool` (linea 97 de `tools.ts`), agregar al filtro:
  ```typescript
  const results = knowledge.listJobs(input as { ... });
  const filtered = input.min_salary
    ? results.filter(j => j.salario >= (input.min_salary as number))
    : results;
  return JSON.stringify({ count: filtered.length, jobs: filtered });
  ```
  Y en `knowledge.ts` linea 138, agregar el filtro en `listJobs`. Cambio de ~10 lineas total.

### Problemas detectados

- **[BUG — MAX_TOOL_ITERATIONS = 5 puede terminar el loop sin mensaje visible para el usuario]** `src/app/api/assistant/chat/route.ts` lineas 87 y 143: si las 5 iteraciones del tool-use loop terminan todas con `stop_reason === "tool_use"`, el loop rompe con `finalText = ""`. El fallback en linea 143 devuelve `"Entendido, ¿en que mas te puedo ayudar?"` — un mensaje completamente generico que no explica lo que paso. En la practica, 5 iteraciones son suficientes para el flujo actual, pero si Kyo llama `search_jobs` + `get_job_details` + `navigate_to` + otra tool en un solo mensaje, puede llegar al limite. Dos correcciones:
  1. Aumentar `MAX_TOOL_ITERATIONS` de `5` a `8` — el costo es minimo ya que la mayoria de conversaciones usan 1-2 iteraciones.
  2. Mejorar el fallback: si `finalText` esta vacio al terminar el loop, hacer un ultimo request a Claude sin tools para que genere un resumen de lo que proceso:
  ```typescript
  if (!finalText && iter >= MAX_TOOL_ITERATIONS - 1) {
    // solicitar resumen sin tools
    const summary = await client.messages.create({
      model: MODEL, max_tokens: 200, system: buildSystemPrompt(),
      messages: [...conversation, { role: "user", content: "Resume en 2 lineas lo que encontraste." }]
    });
    finalText = summary.content.filter(b => b.type === "text").map(b => b.text).join("");
  }
  ```

- **[BUG — ChatWidget sin aria-live — lectores de pantalla no anuncian respuestas de Kyo]** `src/components/assistant/ChatWidget.tsx` linea 143: el contenedor de mensajes `<div ref={scrollRef} className="flex-1 overflow-y-auto...">` no tiene `aria-live="polite"`. Cuando Kyo responde, los usuarios de lectores de pantalla (NVDA, VoiceOver) no reciben ninguna notificacion del nuevo mensaje. Para un asistente de empleo, ignorar accesibilidad puede excluir candidatos con discapacidad visual. Cambio de una linea:
  ```tsx
  <div
    ref={scrollRef}
    aria-live="polite"
    aria-label="Conversacion con Kyo"
    className="flex-1 overflow-y-auto px-5 pb-3 space-y-4"
  >
  ```

---

## Oportunidades de mejora general

- **[Filtros de vacantes no muestran conteo por opcion — usuarios filtran a ciegas]** `src/app/vacantes/page.tsx` lineas 145-153: los `DropdownPill` muestran solo el nombre de la opcion sin indicar cuantos resultados hay. Si un usuario selecciona "Remoto" y hay solo 1 vacante (o ninguna), lo sabe solo despues de aplicar el filtro. Mejora: calcular counts antes de renderizar:
  ```typescript
  const countByUbicacion = useMemo(() =>
    Object.fromEntries(UBICACIONES.map(u => [u, u === "Todas" ? JOBS.length : JOBS.filter(j => j.ubicacion === u).length])),
  []);
  ```
  Pasar como prop a `DropdownPill` para mostrar "(2)" junto a cada opcion. Cero dependencias nuevas — datos disponibles en `jobs.ts`.

- **[Pagina de cursos usa imagenes de Unsplash en cada card — carga lenta en mobile]** `src/app/cursos/page.tsx` lineas 14-20: el `categoryImage` usa URLs de Unsplash con `w=600`. En mobile 4G en Mexico (promedio 15 Mbps), cargar 8-12 imagenes de 600px en el grid de cursos agrega ~2-3s al LCP. Opciones: (a) descargar las 6 imagenes de categoria a `/public/images/cursos/` y servir de forma estatica — cero latencia de CDN externo; (b) agregar `loading="lazy"` a las imagenes que estan fuera del fold inicial; (c) reducir la resolucion de Unsplash de `w=600` a `w=400` para las cards (tamano real en mobile es ~200px). La opcion (c) es cambio de 1 linea y reduce el peso ~40%.

- **[Contacto page muestra correo hola@kyoszen.com como texto plano — no es clickable]** `src/app/contacto/page.tsx` linea 11: el correo `hola@kyoszen.com` aparece en la tarjeta de informacion como texto. En mobile, los usuarios esperan poder tapear el correo para abrir su cliente de email. Cambiar el `<div>` del value a `<a href="mailto:hola@kyoszen.com">`:
  ```tsx
  { title: "Correo", value: "hola@kyoszen.com", href: "mailto:hola@kyoszen.com" }
  ```
  Y en el renderizado:
  ```tsx
  {item.href
    ? <a href={item.href} className="text-[13px] text-blue hover:underline">{item.value}</a>
    : <div className="text-[13px] text-muted">{item.value}</div>}
  ```
  El numero de telefono tambien deberia ser `<a href="tel:5520876765">` para permitir click-to-call en mobile.
