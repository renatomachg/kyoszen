# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-31
**Cambios analizados:**
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/page.tsx`
- `src/app/vacantes/[id]/_content.tsx`
- `src/components/ui/AplicarModal.tsx`
- `src/components/sections/Hero.tsx`

> No hay commits de codigo nuevos desde `f7943ce`. Este reporte es el tercer pase profundo consecutivo. Se documentan los **issues criticos persistentes sin corregir** y **7 hallazgos nuevos** no reportados antes.

---

## Issues Criticos Persistentes (sin corregir desde 2026-05-29)

Estos 4 issues bloquean la experiencia del candidato y siguen sin atenderse:

| # | Issue | Archivo | Linea |
|---|-------|---------|-------|
| C1 | Kyo recomienda vacantes inactivas (lee JOBS estatico, no Supabase) | `src/lib/assistant/knowledge.ts` | 138 |
| C2 | Paso 6 manda a /contacto en lugar de abrir AplicarModal — conversion perdida | `src/lib/assistant/system-prompt.ts` | 61 |
| C3 | Link /politica-de-privacidad da 404 en AplicarModal justo antes de enviar | `src/components/ui/AplicarModal.tsx` | 232 |
| C4 | `reset()` no regenera sessionId — historial previo se sobreescribe en Supabase | `src/components/assistant/useChat.ts` | 139 |

---

## Hallazgos Nuevos Esta Sesion

### CRITICO — Inconsistencia de estadisticas entre Hero y Kyo

**Archivo:** `src/components/sections/Hero.tsx` l.108 vs `src/lib/assistant/knowledge.ts` l.76

El Hero muestra **"+7000 candidatos colocados"**. El objeto `COMPANY` en `knowledge.ts` dice **"687+ Candidatos colocados"**. Kyo responde con el dato de `COMPANY` cuando le preguntan cuantos candidatos han colocado. Un usuario que vio el hero y luego pregunta a Kyo recibe numeros contradictorios, lo que destruye credibilidad.

**Correccion:** Unificar el dato. Si el dato real es 7000+, actualizar `knowledge.ts` l.76: `"Candidatos colocados": "7,000+"`. Si el dato real es 687, corregir el Hero en l.108 a `"+687"`.

---

### CRITICO — generateStaticParams en /vacantes/[id] usa JOBS estatico, no Supabase

**Archivo:** `src/app/vacantes/[id]/page.tsx` l.4-6

```ts
export function generateStaticParams() {
  return JOBS.map((j) => ({ id: String(j.id) }));
}
```

`JOBS` es el array hardcodeado en `src/lib/jobs.ts`. Cuando el admin crea una nueva vacante en Supabase con un ID que no existe en `JOBS`, Next.js no pre-renderiza esa pagina. En produccion con output estatico, esa URL da 404. Kyo puede hacer `navigate_to` a `/vacantes/42` (ID de Supabase) que no existe estaticamente.

**Correccion:** Cambiar `generateStaticParams` para que lea de Supabase, o bien agregar `export const dynamicParams = true` en `page.tsx` para que las rutas no pre-generadas se sirvan dinamicamente en lugar de dar 404.

Solucion minima en `src/app/vacantes/[id]/page.tsx`:
```ts
export const dynamicParams = true;
```

---

### ALTA — El historial truncado a 20 mensajes hace que Kyo olvide el nombre del candidato

**Archivo:** `src/app/api/assistant/chat/route.ts` l.130-131

```ts
const history = body.messages.slice(-20);
```

El hook `useChat` persiste hasta 30 mensajes en localStorage (`MAX_STORED = 30`). La API solo toma los ultimos 20. Si un candidato ha tenido mas de 20 intercambios (posible en una sesion larga), Kyo pierde el mensaje inicial donde el candidato dio su nombre. En el proximo mensaje, Kyo no puede usar el nombre o lo repite incorrectamente.

El nombre y perfil del candidato son el mensaje 2 (respuesta al saludo). Si hay 21+ mensajes en el historial, ese contexto se pierde.

**Correccion:** No reducir `MAX_STORED` en `useChat`. En cambio, en `chat/route.ts` preservar siempre los primeros 2 mensajes del historial (saludo + nombre) y tomar los ultimos 18 del resto:

```ts
const allMessages = body.messages;
const history = allMessages.length > 20
  ? [...allMessages.slice(0, 2), ...allMessages.slice(-18)]
  : allMessages;
```

---

### ALTA — Kyo puede navegar a /admin via navigate_to sin ninguna restriccion

**Archivo:** `src/lib/assistant/tools.ts` l.105-112

`executeTool("navigate_to", { path: "/admin" })` funciona sin validacion. Un usuario malicioso podria pedirle a Kyo que lo lleve al panel de administracion. La tool devuelve `{ navigated: true, path: "/admin" }` y el frontend ejecuta `router.push("/admin")`.

El panel tiene auth guard de Supabase, pero la navegacion expone la ruta y puede confundir al candidato.

**Correccion:** Agregar whitelist en `src/lib/assistant/tools.ts` l.105, antes del return:

```ts
case "navigate_to": {
  const path = input.path as string;
  const ALLOWED = ["/", "/servicios", "/cursos", "/vacantes", "/nosotros", "/contacto"];
  if (!ALLOWED.some((p) => path === p || path.startsWith(p + "?") || path.startsWith(p + "/"))) {
    return JSON.stringify({ error: "Ruta no permitida", path });
  }
  return JSON.stringify({ navigated: true, path, reason: (input.reason as string) ?? "" });
}
```

---

### MEDIA — Contexto de pagina actual no se pasa a Kyo

**Archivo:** `src/components/assistant/useChat.ts` l.95-103 y `src/components/assistant/ChatWidget.tsx` l.8-12

Cuando el candidato abre el widget estando en `/vacantes/3`, Kyo arranca con "Bienvenido a Kyoszen. ¿Me permite saber su nombre?" sin saber que el candidato ya esta viendo una vacante especifica.

**Correccion en dos partes:**

1. En `useChat.ts`, incluir `currentPath` en el body del POST:
```ts
body: JSON.stringify({
  messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
  sessionId: getSessionId(),
  currentPath: typeof window !== "undefined" ? window.location.pathname : "/",
}),
```

2. En `chat/route.ts`, agregar una linea al system prompt cuando `currentPath` empieza con `/vacantes/`:
```ts
const currentPath = body.currentPath ?? "/";
const contextNote = currentPath.startsWith("/vacantes/")
  ? `\n\nNOTA: El usuario esta viendo la pagina ${currentPath}. Si es su primer mensaje, puedes mencionar que ves que esta revisando esa vacante.`
  : "";
system: buildSystemPrompt(instrucciones) + contextNote,
```

---

### MEDIA — Chips de respuesta rapida ausentes en saludo inicial

**Archivo:** `src/components/assistant/ChatWidget.tsx` l.143-165

El saludo inicial pregunta el nombre. El 60-70% de usuarios en chatbots no saben como arrancar y cierran el widget. No hay guia visual de que hacer.

**Correccion:** Cuando `messages.length === 1` (solo el saludo inicial) y no hay carga activa, mostrar dos chips debajo del saludo:

```tsx
{messages.length === 1 && !isLoading && (
  <div className="flex gap-2 flex-wrap pt-1">
    {["Busco empleo", "Soy empresa"].map((chip) => (
      <button
        key={chip}
        type="button"
        onClick={() => { sendMessage(chip); }}
        className="text-[12px] font-semibold text-blue border border-blue/30 rounded-full px-3 py-1.5 hover:bg-blue/5 transition-colors"
      >
        {chip}
      </button>
    ))}
  </div>
)}
```

Insertar despues del bloque `{messages.map(...)}` en `ChatWidget.tsx` l.144.

---

### BAJA — Historial en localStorage nunca expira

**Archivo:** `src/components/assistant/useChat.ts` l.24-34

Un candidato que visita el sitio 30 dias despues retoma la conversacion donde la dejo, pero con vacantes potencialmente desaparecidas. Kyo puede recomendar vacantes que ya no existen.

**Correccion:** Agregar TTL de 7 dias en `loadHistory()`:

```ts
function loadHistory(): ChatMessage[] {
  if (typeof window === "undefined") return [INITIAL_GREETING];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [INITIAL_GREETING];
    const { messages, savedAt } = JSON.parse(raw) as { messages: ChatMessage[]; savedAt: number };
    if (!savedAt || Date.now() - savedAt > 7 * 24 * 60 * 60 * 1000) return [INITIAL_GREETING];
    return messages.length > 0 ? messages : [INITIAL_GREETING];
  } catch {
    return [INITIAL_GREETING];
  }
}
```

Ajustar `saveHistory` para incluir `savedAt: Date.now()`.

---

## Sugerencias de UX

### Alta prioridad

- **Flash de "0 vacantes" antes de cargar** (`src/app/vacantes/page.tsx` l.59, l.191): `jobs` se inicializa como `[]`. Agregar `const [loading, setLoading] = useState(true)`, poner `setLoading(false)` en el `.then()` del `useEffect`, y reemplazar el bloque `filtered.length > 0 ? ... : <div Sin resultados>` por: si `loading === true`, renderizar 8 tarjetas skeleton con `bg-gray-100 animate-pulse rounded-xl h-48`.

- **Acentos en _content.tsx violan convencion del cliente** (`src/app/vacantes/[id]/_content.tsx` l.122, 179, 182): `"Descripción del puesto"` → `"Descripcion del puesto"`, `"Ubicación"` → `"Ubicacion"`, `"Categoría"` → `"Categoria"`.

- **AplicarModal: sin validacion de peso de CV en cliente** (`src/components/ui/AplicarModal.tsx` l.204): Agregar en el `onChange` del `<input type="file">`: `if (file.size > 5 * 1024 * 1024) { alert("El archivo supera 5MB"); e.target.value = ""; return; }`. Evita que el usuario espere un upload completo para recibir un error del servidor.

### Media prioridad

- **ChatWidget demasiado pequeno en mobile** (`src/components/assistant/ChatWidget.tsx` l.120): `h-[min(60vh,560px)]` deja 280px utiles en iPhone SE. Cambiar a `h-[min(72vh,560px)]` para dar mas espacio a las burbujas sin afectar desktop.

- **ChatWidget: input sin aria-label formal** (`src/components/assistant/ChatWidget.tsx` l.174): Agregar `aria-label="Mensaje para Kyo"` al `<input>`. El placeholder desaparece al escribir y los lectores de pantalla pierden contexto.

- **ChatWidget: sin boton de reintento al fallar** (`src/components/assistant/useChat.ts` l.129 + `ChatWidget.tsx` l.149): El error se muestra pero el mensaje previo del usuario queda sin reenvio posible. Exportar `retryLast` de `useChat` y agregar `<button onClick={retryLast}>Reintentar</button>` en el bloque de error.

- **Label "Marca" confuso para candidatos** (`src/app/vacantes/page.tsx` l.178): Cambiar `label="Marca"` a `label="Empresa"` en el `DropdownPill`. El candidato no piensa en "marcas", piensa en empresas donde quiere trabajar.

### Baja prioridad

- **Hero image de vacantes viene de Unsplash CDN externa** (`src/app/vacantes/page.tsx` l.139): Mover la imagen a `/public/images/hero-vacantes.jpg` para no depender de CDN en produccion.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **Paso 5 no instruye a navegar directamente a la vacante elegida** (`src/lib/assistant/system-prompt.ts` l.45-58): El formato del Paso 5 lista vacantes pero no indica que hacer cuando el candidato elige una. Agregar al final del Paso 5: `"Cuando el candidato confirme interes en una vacante especifica, llama inmediatamente get_job_details con su id para obtener datos actualizados, luego navega con navigate_to a /vacantes/[id]. No pidas confirmacion extra."`.

- **No hay manejo para candidato que cambia de opinion a mitad del flujo** (`src/lib/assistant/system-prompt.ts`): Si en Paso 3 el candidato dice "en realidad busco otra cosa", Kyo continua con datos contradictorios. Agregar regla: `"Si el candidato da informacion que contradice una respuesta anterior (cambio de puesto, ubicacion o jornada), confirma el cambio con una sola oracion y reinicia la recoleccion desde el dato cambiado."`.

- **Kyo no ofrece WhatsApp cuando el candidato esta frustrado** (`src/lib/assistant/system-prompt.ts` l.65-78): La seccion "Manejo de otros temas" solo ofrece WhatsApp para empresas. Agregar: `"Si el candidato lleva 3 o mas intercambios sin avanzar en el flujo, o expresa frustracion, ofrece: 'Tambien puedes escribirnos directamente al WhatsApp para atencion personalizada.' y usa navigate_to con https://wa.link/5zv0ba."`.

- **Kyo no llama get_course_details tras search_courses** (`src/lib/assistant/system-prompt.ts` l.65-68): Kyo da respuestas incompletas sobre cursos (sin modulos, duracion, a quien va dirigido). Agregar: `"Si el usuario pide detalles de un curso especifico, llama primero search_courses para encontrar el slug, luego get_course_details con ese slug para dar informacion completa."`.

### Nuevas tools o capacidades recomendadas

- **Tool `register_candidate` para banco de talentos** (`src/lib/assistant/tools.ts`): El sistema prompt menciona ofrecer "banco de talentos" cuando no hay vacante compatible (l.54-57), pero no hay tool para registrar el perfil del candidato directamente desde Kyo. Crear tool que haga `INSERT` en una tabla `banco_talentos` en Supabase con `{ nombre, puesto, experiencia, ubicacion, jornada }`. Mientras no exista, Kyo navega a /contacto (formulario generico) lo cual genera friction innecesaria.

- **Instruccion de verificar vacante antes de recomendar** (`src/lib/assistant/system-prompt.ts` + `src/lib/assistant/tools.ts`): Kyo usa el resumen del system prompt (construido con datos estaticos) para recomendar en Paso 5. Agregar instruccion: `"Antes de mostrar las vacantes recomendadas en Paso 5, llama search_jobs con el puesto y ubicacion del candidato para obtener resultados actualizados."`.

### Problemas detectados

- **`MAX_TOOL_ITERATIONS = 5` puede terminar con mensaje vacio** (`src/app/api/assistant/chat/route.ts` l.85, l.202): Si Claude agota las 5 iteraciones sin llegar a `stop_reason !== "tool_use"`, `finalText` es `""` y la respuesta es `"Entendido, ¿en que mas te puedo ayudar?"`. Cambiar el fallback l.202 a: `"Tuve un problema procesando tu solicitud. ¿Puedes repetirla con otras palabras?"`.

- **knowledge.ts usa COURSES estatico igual que JOBS** (`src/lib/assistant/knowledge.ts` l.1, l.118-131): Cursos creados/modificados desde el admin de Supabase no se reflejan en las respuestas de Kyo. La implementacion de `SupabaseKnowledgeProvider` debe cubrir `listCourses` y `getCourse`, no solo vacantes.

- **Sistema de cache de instrucciones es por proceso de PM2** (`src/app/api/assistant/chat/route.ts` l.8-10): `_cachedInstrucciones` es una variable de modulo. Con PM2 en modo cluster, cada worker tiene su propio cache. Si el admin actualiza las instrucciones de Kyo, algunos workers siguen con el cache viejo hasta que expira (60 segundos). No es un bug critico, pero puede confundir durante pruebas. Documentar en el admin panel: "Los cambios pueden tardar hasta 60 segundos en verse reflejados en Kyo."

---

## Oportunidades de mejora general

- **Indicador de progreso del flujo**: El candidato no sabe en que paso esta. Agregar convencion en el system prompt: al inicio de cada respuesta en los pasos 1-5, Kyo incluye `(Paso N de 5)` al final de la linea. No requiere cambio en el widget.

- **VacantesPage: ausencia de estado skeleton** (`src/app/vacantes/page.tsx`): La pagina es la primera que ve el candidato despues de que Kyo navega. El flash de "0 vacantes" es la primera impresion. Este issue combina con el chip "Busco empleo" — si el candidato llega aqui por recomendacion de Kyo, una grilla vacia por 200ms es muy visible. Priorizar esqueleto de carga.

- **El flujo de Kyo asume que el usuario es candidato**: El 30% del trafico puede ser empresas buscando contratar. Agregar en el Paso 0 (o en los chips de inicio): si el usuario responde "soy empresa" o similar, derivar inmediatamente a /contacto con un mensaje de contexto antes de navegar.
