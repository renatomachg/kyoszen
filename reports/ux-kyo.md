# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-14
**Cambios analizados:** Sin cambios de codigo desde el commit de ayer (health check 2026-05-14). Quinta auditoria — enfocada en hallazgos nuevos no cubiertos en las cuatro auditorias previas (2026-05-10 a 2026-05-13).

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/components/sections/Vacancies.tsx`
- `src/lib/jobs.ts`
- `reports/ux-kyo.md` (reporte previo para evitar duplicar)

---

## Cambios Recientes Detectados

Sin cambios de codigo en las ultimas 48 horas. Todas las sugerencias de alta prioridad de los reportes previos siguen sin implementar:
- Anchor de historial (primeros 4 mensajes) para que Kyo no olvide el nombre (reportado 2026-05-13)
- `search_jobs` sin filtros por `contrato`/`jornada` (reportado 2026-05-13)
- `next/image` en Hero.tsx (reportado 2026-05-10)
- Vacancies.tsx con datos hardcodeados desconectados del catalogo real (reportado 2026-05-10)
- `navigate_to` sin validacion de rutas (reportado 2026-05-13)
- Quick-reply chips en chat (reportado 2026-05-13)

Los hallazgos de esta auditoria son **nuevos y no cubiertos** en los reportes previos.

---

## Sugerencias de UX

### Alta prioridad

- **"Nueva conversacion" queda enterrado en el scroll** (`src/components/assistant/ChatWidget.tsx`, linea 154): el boton aparece dentro del contenedor scrollable, despues de todos los mensajes. Con 15+ mensajes en localStorage, el usuario llega al chat con historial y el boton esta completamente fuera de la pantalla visible — tiene que scrollear hasta el final para encontrarlo. Solucion: moverlo al header (junto al boton X de cerrar) donde siempre sea visible:
  ```tsx
  // En el header (linea 129), despues del boton de cerrar:
  {messages.length > 2 && (
    <button type="button" onClick={reset}
      className="text-[10px] text-muted hover:text-navy font-medium mr-1">
      Nueva sesion
    </button>
  )}
  ```
  Y eliminar el bloque de lineas 153-164 del area de scroll. Impacto: el candidato que quiere empezar de nuevo no tiene que buscarlo.

- **La navegacion automatica ocurre en silencio durante 700ms** (`src/components/assistant/useChat.ts`, linea 112): cuando Kyo llama a `navigate_to`, el frontend hace `setTimeout(() => router.push(target.path), 700)`. Durante esos 700ms el usuario no sabe que va a ser redirigido. Si hace clic en otro elemento del chat o en un enlace externo, el `router.push` se dispara de todas formas y lo redirige inesperadamente. Solucion en dos partes:
  1. Antes del timeout, mostrar un indicador visual inline en el chat: agregar el campo `reason` de la navegacion como un mensaje de sistema con estilo diferenciado (fondo amarillo suave, italic).
  2. Aumentar el delay a 1400ms para darle tiempo al usuario de leer el mensaje de Kyo antes de ser movido.
  ```ts
  if (data.navigations.length > 0) {
    const target = data.navigations[0];
    const navNote: ChatMessage = {
      id: `nav-${Date.now()}`,
      role: "assistant",
      content: `Llevandote a ${target.reason ?? target.path}...`,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, navNote]);
    setTimeout(() => router.push(target.path), 1400);
  }
  ```

- **El teclado virtual de mobile colapsa el panel del chat** (`src/components/assistant/ChatWidget.tsx`, linea 120): `h-[min(60vh,560px)]` usa `vh` que NO se reduce cuando el teclado virtual se abre en Android (el viewport en Android no cambia con el teclado en navegadores modernos, excepto en iOS Safari que si lo hace). En iOS Safari con el teclado abierto, el chat panel puede quedar con menos de 200px de altura, haciendo el area de mensajes inutilizable. Cambio de una clase:
  ```tsx
  // Antes:
  className="...h-[min(60vh,560px)]..."
  // Despues:
  className="...h-[min(60svh,560px)]..."
  ```
  `svh` (small viewport height) es el valor del viewport cuando el browser chrome es maximo — en iOS Safari esto ya descuenta la barra de botones. Soporte: todos los navegadores modernos desde 2023. Sin cambio de logica.

### Media prioridad

- **Salary formatting puede cambiar con el locale del servidor** (`src/lib/assistant/system-prompt.ts`, linea 120): `j.salario?.toLocaleString?.()` usa el locale del proceso Node.js del servidor. En el VPS de Boston con locale `en_US`, `12000` se formatea como `"12,000"`. Si el servidor tiene locale europeo, seria `"12.000"`. Ademas, el optional chaining en `toLocaleString?.()` es innecesario ya que `j.salario` es `number`. Fix en una linea:
  ```ts
  // Antes:
  $${j.salario?.toLocaleString?.() ?? j.salario}/mes
  // Despues:
  $${j.salario.toLocaleString('es-MX')}/mes
  ```
  `'es-MX'` formatea `12000` como `"12,000"` consistentemente en cualquier servidor.

- **`listCourses` y `listJobs` tienen logica de filtrado de categoria inconsistente** (`src/lib/assistant/knowledge.ts`, lineas 120 y 140): `listCourses` acepta el filtro si `c.categoria === filters.category` (comparacion exacta) O si `c.categoriaLabel.toLowerCase() === filters.category.toLowerCase()` (case-insensitive). `listJobs` solo hace `j.categoria.toLowerCase() === filters.category.toLowerCase()`. Esta asimetria significa que si Kyo pasa `"Administrativo"` como categoria en `search_jobs`, falla si hay cualquier diferencia de mayusculas, mientras que el mismo error en `search_courses` podria pasar gracias al double-check. Estandarizar a lowercase en ambos:
  ```ts
  // En listCourses (linea 120):
  .filter((c) => !filters?.category || c.categoriaLabel.toLowerCase() === filters.category.toLowerCase())
  // (eliminar la comparacion exacta c.categoria === filters.category)
  ```

- **Respuesta fallback cuando Claude no genera texto** (`src/app/api/assistant/chat/route.ts`, linea 144): si en alguna iteracion Claude solo emite `tool_use` sin ningun `TextBlock` (ej. llama a `navigate_to` sin texto previo), `finalText` queda vacio y el API devuelve `"Entendido, ¿en que mas te puedo ayudar?"`. Esta frase no tiene contexto y confunde al candidato que acaba de dar su nombre. El problema real es que la variable `finalText` se sobreescribe en cada iteracion (linea 99: `finalText = textBlocks...`), por lo que si la ultima iteracion es un tool_use sin texto, se pierde el texto de iteraciones anteriores. Fix: acumular texto en lugar de sobreescribir:
  ```ts
  // Antes (linea 99):
  if (textBlocks.length > 0) {
    finalText = textBlocks.map((b) => b.text).join("\n");
  }
  // Despues:
  if (textBlocks.length > 0) {
    finalText = (finalText ? finalText + "\n" : "") + textBlocks.map((b) => b.text).join("\n");
  }
  ```
  Esto preserva el texto de la iteracion anterior si la siguiente solo produce tool calls.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **Conflicto de instrucciones en el caso "no hay vacante compatible"** (`src/lib/assistant/system-prompt.ts`, lineas 60-64): el bloque del Paso 5 primero dice que cuando no hay vacante, Kyo navegue a `/contacto` (linea 62: "Y navega a \`/contacto\`"). Pero inmediatamente despues, linea 64, hay una instruccion general: "Usa \`navigate_to\` con \`/vacantes\` y los filtros que mejor correspondan al perfil." Esta segunda instruccion no tiene un "Si hay vacantes compatibles:" que la delimite — parece que aplica siempre, incluyendo el caso de "no hay vacante". El modelo puede ejecutar ambas navegaciones en secuencia: `/contacto` primero, luego `/vacantes`. Correccion: agregar el condicional explicitamente:
  ```
  Si HAY vacantes compatibles:
  Usa `navigate_to` con `/vacantes` y los filtros que mejor correspondan al perfil.

  Si NO hay vacantes compatibles:
  "Por el momento no tenemos una vacante exacta para su perfil..."
  Y navega a `/contacto`.
  ```

- **Kyo no puede incluir el link de WhatsApp como clickeable en el chat** (`src/components/assistant/ChatWidget.tsx`, linea 227): el `MessageBubble` usa `whitespace-pre-wrap` y renderiza el contenido como texto plano. Cuando Kyo sugiere "contactanos por WhatsApp", escribe texto; el link `https://wa.me/525520876765` nunca es clickeable. El candidato tiene que copiar el numero manualmente. Dos opciones:
  1. (Simple) Agregar en `system-prompt.ts` la instruccion: "Cuando menciones WhatsApp, escribe el numero como '55 2087 6765' sin la URL — el sitio tiene un boton de WhatsApp siempre visible."
  2. (Completo) Hacer que `MessageBubble` detecte URLs y las renderice como `<a>` tags. Esto requiere un parser de texto simple (`urlRegex`). El beneficio es que cualquier URL que Kyo genere (slugs de cursos, etc.) tambien se volveria clickeable.

- **Paso 1 genera respuestas demasiado abiertas que Kyo no puede mapear** (`src/lib/assistant/system-prompt.ts`, linea 31): "¿Que tipo de trabajo busca?" es una pregunta completamente abierta. Un candidato puede responder "algo de oficina", "algo en ventas aunque sea de medio tiempo", o "cualquier cosa en RRHH, llevo 5 años". Kyo tiene que interpretar estas respuestas y mapearlas a categorias (`Administrativo`, `Ventas`, `Operaciones`, `Atencion al cliente`, `RRHH`) para que `search_jobs` filtre correctamente. Sin guia, el modelo puede mapear incorrectamente o no filtrar por categoria en absoluto. Agregar una instruccion de mapeo al system prompt despues de la descripcion del Paso 1:
  ```
  Mapa de categorias: si el candidato menciona "ventas", "vendedor", "comercial" → categoria=Ventas.
  "admin", "oficina", "secretaria", "asistente" → Administrativo.
  "almacen", "logistica", "operador", "produccion" → Operaciones.
  "atencion al cliente", "recepcion", "call center" → Atencion al cliente.
  "recursos humanos", "RRHH", "nomina", "reclutamiento" → RRHH.
  Si no encaja en ninguna, usa query libre en search_jobs.
  ```

### Nuevas tools o capacidades recomendadas

- **Agregar quick-action de WhatsApp en el footer del chat** (`src/components/assistant/ChatWidget.tsx`, linea 168): en lugar de que Kyo intente dar el link (que no renderiza clickeable), agregar un boton fijo "Hablar con asesor" en el footer del chat que siempre este visible. Esto crea una ruta de escape clara para candidatos frustrados o con preguntas complejas sin depender de que Kyo lo mencione:
  ```tsx
  // En el footer, debajo del form (linea 191):
  <div className="px-4 pb-3 flex justify-center">
    <a href="https://wa.me/525520876765?text=Hola,%20me%20comunico%20desde%20el%20chat%20de%20Kyo"
      target="_blank" rel="noopener noreferrer"
      className="text-[11px] text-[--color-wa] font-semibold flex items-center gap-1 hover:underline">
      Hablar con un asesor
    </a>
  </div>
  ```
  El mensaje pre-llenado en el link indica al asesor que viene del chat de Kyo, mejorando el handoff.

### Problemas detectados

- **El `search_jobs` de `knowledge.ts` no devuelve el salario en `JobSummary.desc`** (`src/lib/assistant/knowledge.ts`, linea 148): cuando Kyo llama a `search_jobs`, recibe el campo `desc` (descripcion corta) pero no el campo `salario` directamente en el resumen. El salario SI esta en el system prompt completo (linea 120), pero si Kyo hace `search_jobs` para buscar vacantes filtradas, el resultado JSON tiene `salario` en el mapa de `JobSummary` (linea 148 lo incluye). Esto esta bien. Sin embargo, el `desc` que recibe Kyo en `search_jobs` no menciona el salario, y Kyo podria citarlo desde el system prompt (que puede estar desactualizado si las vacantes cambian via Supabase en el futuro). Agregar `salario` explicitamente al resultado de `search_jobs` en el map (ya esta en `JobSummary` interface, linea 39, pero confirmar que `executeTool` lo devuelve — si lo hace, es un no-issue).

- **El campo `contrato` en `Vacancies.tsx` no coincide exactamente con el valor en `JOBS`** (`src/components/sections/Vacancies.tsx`, linea 14 vs `src/lib/jobs.ts`, linea 26): la seccion del home muestra `type: "Tiempo completo"` y `type: "Medio tiempo"`, que casualmente coinciden con los valores de `JOBS`. Pero si alguien agrega una vacante con `contrato: "Por proyecto"` (como la vacante id=8 de Contact Nova), el componente Vacancies del home nunca lo mostraria porque los datos son hardcodeados. Cuando se resuelva el pendiente de conectar `Vacancies.tsx` con `JOBS` (ya reportado), este campo se resolvera automaticamente — solo recordarlo al hacer ese cambio.

- **`loadHistory` en `useChat.ts` no valida que el parsed JSON sea un array** (`src/components/assistant/useChat.ts`, linea 28): `JSON.parse(raw) as ChatMessage[]` hace un cast sin verificar. Si localStorage contiene un objeto en lugar de un array (por ejemplo, del formato futuro con `saved_at` sugerido en el reporte del 2026-05-13), `parsed.length` sera `undefined` y la condicion `parsed.length > 0` retornara false, devolviendo `[INITIAL_GREETING]`. Esto es un comportamiento correcto accidentalmente, pero dejarlo sin un check explicito es fragil. Agregar validacion:
  ```ts
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.length === 0) return [INITIAL_GREETING];
  return parsed as ChatMessage[];
  ```

---

## Oportunidades de mejora general

- **Kyo no puede distinguir entre un candidato y una empresa que llega al chat** (`src/lib/assistant/system-prompt.ts`, linea 69-73): el flujo de 6 pasos asume que todo el que abre el chat es un candidato buscando trabajo. El system prompt trata el caso "empresa" como una excepcion ("Si pregunta por cursos o es una empresa: Responde..."), pero no hay forma de detectar proactivamente si el usuario es empresa. Los quick-reply chips sugeridos en el reporte anterior ("Busco empleo" / "Tengo una empresa") son la forma mas eficiente de resolver esto. Complementar con una instruccion al inicio del flujo: "Si en el Paso 0 o el Paso 1 el usuario menciona 'quiero contratar', 'tengo una empresa', 'busco candidatos', sal del flujo de candidato inmediatamente y navega a /contacto."

- **El endpoint `/api/assistant/chat` no tiene timeout para llamadas al API de Anthropic** (`src/app/api/assistant/chat/route.ts`, linea 87): si la llamada a Anthropic tarda mas de 10 segundos (timeout por defecto del SDK), el servidor Next.js mantiene la conexion abierta. En Vercel, las funciones serverless tienen un limite de 10s en el plan Hobby. En el VPS con PM2, no hay limite pero el usuario vera el "..." de typing indefinidamente. Agregar un AbortController con timeout de 20s:
  ```ts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await client.messages.create({...}, { signal: controller.signal });
    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json({ error: "El asistente tardo demasiado. Intenta de nuevo." }, { status: 504 });
    }
    throw err;
  }
  ```

- **El chat no tiene estado persistente entre paginas** (`src/components/assistant/useChat.ts`): cuando el candidato navega (por ejemplo, Kyo lo lleva a `/vacantes`), el componente `ChatWidget` se remonta en la nueva pagina. Si Next.js hace un full page navigation (no client-side), `useChat` lee de localStorage correctamente y la conversacion se restaura. Pero si hay un error de hidratacion o un `layout.tsx` que no incluya `ChatWidget` en todas las rutas, la conversacion se interrumpe. Verificar que `ChatWidget` esta en el layout raiz y no en paginas individuales — si esta en `layout.tsx`, esto ya esta correcto. Si esta en `page.tsx` de algun nivel, el candidato pierde el contexto al navegar.

- **Oportunidad de A/B test: saludo con nombre vs sin nombre** (`src/lib/assistant/system-prompt.ts`, linea 22): el saludo actual pide el nombre desde el primer mensaje. Esto genera friccion para candidatos que solo quieren ver vacantes rapido. Una alternativa es que Kyo muestre las 3 vacantes mas recientes como "preview" antes de pedir el nombre: "Tenemos 8 vacantes activas hoy. ¿Le cuento las que mas se ajustan a su perfil?" Si el candidato dice si, entonces pide el nombre. Esto reduce el tiempo hasta la primera informacion de valor de ~6 intercambios a ~2, y solo pide datos personales cuando hay intencion confirmada. Implementarlo seria un cambio de 3 lineas en el system prompt (solo el Paso 0 y el Paso 1).
