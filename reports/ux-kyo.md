# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-07
**Cambios analizados:** src/lib/assistant/system-prompt.ts, src/lib/assistant/tools.ts, src/lib/assistant/knowledge.ts, src/app/api/assistant/chat/route.ts, src/components/assistant/ChatWidget.tsx, src/components/assistant/useChat.ts, src/components/layout/Navbar.tsx, src/app/vacantes/page.tsx

---

## Cambios Recientes Detectados

No hay commits de código en los últimos 2 días — solo reportes automáticos. Todos los bugs críticos del reporte anterior siguen sin corrección. Este reporte consolida los escalados no resueltos y agrega **7 hallazgos nuevos** no reportados antes.

---

## 🚨 Bugs críticos persistentes — sin corrección por 3+ días

### [CRÍTICO] Kyo recomienda vacantes del JOBS.ts estático, no de Supabase
**Archivo:** `src/lib/assistant/knowledge.ts:167`

`StaticKnowledgeProvider` lee del array `JOBS` hardcodeado en `src/lib/jobs.ts`. Un candidato recibe hoy una recomendación de una vacante que el admin ya cerró. El candidato que aplica no aparece en el inbox del admin porque la vacante ya no existe en Supabase.

**Fix:** Migrar `listJobs` y `getJob` a consultas directas a Supabase usando el service role key, con caché de 60s igual al patrón de `getStoredInstrucciones` en la API route.

---

### [CRÍTICO] Paso 6: Kyo manda al candidato a /contacto (formulario de empresas)
**Archivo:** `src/lib/assistant/system-prompt.ts:60-62`

`"Navega a /contacto si acepta"` dirige al candidato al formulario "Necesito contratar personal" — destinado a empresas, no a candidatos. El candidato que dice "sí quiero aplicar" aterriza en la página equivocada.

**Fix en el Paso 6:**
```
## Paso 6 — CIERRE
Cuando el candidato confirme interés en una vacante específica:
1. Llama get_job_details con el id de esa vacante.
2. Usa navigate_to con /vacantes/[id] (ejemplo: /vacantes/12).
3. Di: "[nombre], te llevo directo a esa vacante para que apliques."
Solo navega a /contacto si NO hay ninguna vacante compatible (banco de talentos).
```
Además añadir `/vacantes/[id]` a las páginas del knowledge (`knowledge.ts:60-67`) y a las rutas permitidas en la Regla 6 (`system-prompt.ts:77`).

---

### [ALTO] FAQs editadas desde /admin/kyo no llegan al system prompt
**Archivo:** `src/lib/assistant/knowledge.ts:99-105`

`COMPANY.faqs` es un array hardcodeado de 5 preguntas. La tabla `kyo_faqs` en Supabase existe pero nunca se consulta. El admin edita FAQs y no cambia nada en Kyo.

**Fix:** En `buildSystemPrompt` (o en `getStoredInstrucciones`), consultar `kyo_faqs` de Supabase con caché de 60s y reemplazar el bloque `# FAQs` del system prompt con el resultado.

---

### [ALTO] Analytics guarda texto libre del candidato
**Archivo:** `src/components/assistant/useChat.ts:81`

`logEvent("kyo_mensaje", trimmed.slice(0, 300))` guarda hasta 300 caracteres de texto libre en `site_eventos`. Un candidato que escribe su nombre, teléfono o correo queda registrado.

**Fix de 1 línea:**
```ts
logEvent("kyo_mensaje", String(messages.length));
```

---

## Sugerencias de UX

### Alta prioridad

#### [NAVBAR] setState durante render — anti-patrón React
**Archivo:** `src/components/layout/Navbar.tsx:36-39`

```ts
if (prevPathname !== pathname) {
  setPrevPathname(pathname);
  setMobileOpen(false);
}
```
Actualiza estado directamente en el cuerpo del render. React puede ejecutar renders múltiples veces (especialmente en StrictMode) y produce warnings. El `prevPathname`/`setPrevPathname` es innecesario.

**Fix:**
```tsx
useEffect(() => {
  setMobileOpen(false);
}, [pathname]);
```
Y eliminar `prevPathname` y `setPrevPathname` por completo.

---

#### [NAVBAR] Menú móvil sin overlay ni cierre con Escape
**Archivo:** `src/components/layout/Navbar.tsx:103-124`

El menú móvil solo se cierra al tocar un link. Un usuario que lo abre por accidente no puede cerrarlo.

**Fix:**
```tsx
useEffect(() => {
  if (!mobileOpen) return;
  const handler = (e: KeyboardEvent) => e.key === "Escape" && setMobileOpen(false);
  document.addEventListener("keydown", handler);
  return () => document.removeEventListener("keydown", handler);
}, [mobileOpen]);
```
Y añadir antes del `<div>` del menú: `<div className="fixed inset-0 z-[98]" onClick={() => setMobileOpen(false)} />`

---

#### [NAVBAR] `aria-label="Menu"` sin tilde, sin `aria-expanded`
**Archivo:** `src/components/layout/Navbar.tsx:58`

El botón hamburger tiene `aria-label="Menu"` (sin acento) y no declara su estado.

**Fix:**
```tsx
aria-label="Menú"
aria-expanded={mobileOpen}
aria-controls="mobile-menu"
```
Y añadir `id="mobile-menu"` al div del menú móvil.

---

#### [NAVBAR] Links del menú móvil sin indicador de página activa
**Archivo:** `src/components/layout/Navbar.tsx:109`

En desktop los links activos tienen fondo navy. En mobile todos se ven iguales. El usuario no sabe en qué sección está.

**Fix en el className del Link:**
```tsx
className={`py-[10px] px-[14px] rounded-xl text-navy no-underline text-sm font-medium ${
  pathname === link.href ? "bg-navy text-white" : "hover:bg-blue-soft hover:text-blue"
}`}
```

---

#### [NAVBAR] Query a Supabase en cada montaje — sin caché
**Archivo:** `src/components/layout/Navbar.tsx:24-30`

Cada navegación dispara una query a Supabase para contar vacantes activas. En un flujo de 5 páginas = 5 queries redundantes.

**Fix — cachear en sessionStorage con TTL de 10 minutos:**
```ts
useEffect(() => {
  const cached = sessionStorage.getItem("kyo_hayVacantes");
  const ttl = sessionStorage.getItem("kyo_hayVacantes_ttl");
  if (cached && ttl && Date.now() < Number(ttl)) {
    setHayVacantes(cached === "1");
    return;
  }
  supabase.from("vacantes").select("id", { count: "exact", head: true }).eq("activa", true)
    .then(({ count }) => {
      const val = (count ?? 0) > 0;
      sessionStorage.setItem("kyo_hayVacantes", val ? "1" : "0");
      sessionStorage.setItem("kyo_hayVacantes_ttl", String(Date.now() + 10 * 60_000));
      setHayVacantes(val);
    });
}, []);
```

---

#### [VACANTES] setState durante render — anti-patrón React (nuevo hallazgo)
**Archivo:** `src/app/vacantes/page.tsx:85-99`

El bloque `if (prevParams !== params) { setPrevParams(params); setSearch(...); ... }` llama múltiples setters de estado directamente durante el render. Mismo patrón problemático que el Navbar: puede causar renders dobles y warnings en StrictMode.

**Fix:** Eliminar `prevParams`/`setPrevParams` y reemplazar con `useEffect`:
```tsx
useEffect(() => {
  const q = params.get("q") || params.get("search");
  const u = params.get("ubicacion");
  const m = params.get("marca");
  const c = params.get("contrato");
  const j = params.get("jornada");
  const s = params.get("salario");
  if (q) setSearch(q);
  if (u && UBICACIONES.includes(u)) setUbicacion(u);
  if (m && MARCAS.includes(m)) setMarca(m);
  if (c && CONTRATOS.includes(c)) setContrato(c);
  if (j && JORNADAS.includes(j)) setJornada(j);
  if (s && SALARIOS.includes(s)) setSalario(s);
}, [params]);
```

---

#### [VACANTES] `Suspense fallback={null}` — sin estado de carga visible (nuevo hallazgo)
**Archivo:** `src/app/vacantes/page.tsx:51`

`<Suspense fallback={null}>` hace que la página completa esté en blanco mientras Next.js resuelve los search params. El usuario ve una pantalla vacía durante la hidratación.

**Fix — mostrar skeleton mientras carga:**
```tsx
<Suspense fallback={
  <div className="py-20 px-5 md:px-10 xl:px-20">
    <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {[1,2,3,4].map(i => (
        <div key={i} className="h-56 bg-gray-100 rounded-xl animate-pulse" />
      ))}
    </div>
  </div>
}>
```

---

#### [VACANTES] MARCAS hardcodeadas con empresas de demo
**Archivo:** `src/app/vacantes/page.tsx:29`

`MARCAS` lista "Grupo Corpora", "Sigma Retail", etc. del jobs.ts estático. Cuando las vacantes reales de Supabase tengan otras empresas, el filtro de Marca no funcionará.

**Fix — construir marcas dinámicamente desde los datos cargados:**
```ts
const marcasUnicas = useMemo(() =>
  ["Todas", ...new Set(jobs.map(j => j.empresa).filter(Boolean)).values()],
  [jobs]
);
```
Y reemplazar `options={MARCAS}` por `options={marcasUnicas}` en el DropdownPill.

---

#### [VACANTES] Orden por ID, no por fecha de publicación
**Archivo:** `src/app/vacantes/page.tsx:70`

`.order("id")` muestra siempre las primeras vacantes creadas, no las más recientes. Una vacante nueva nunca aparece al inicio.

**Fix:**
```ts
.order("created_at", { ascending: false })
```

---

#### [HOME] Layout shift al cargar la sección de Vacantes
**Archivo:** `src/components/sections/Vacancies.tsx:38`

`if (!loaded || vacantes.length === 0) return null` hace que la sección desaparezca mientras carga, empujando visualmente el contenido inferior.

**Fix — renderizar skeleton con altura reservada:**
```tsx
if (!loaded) return (
  <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />)}
    </div>
  </section>
);
```

---

### Media prioridad

#### [CHAT WIDGET] Panel sin `role="dialog"` ni `aria-label` (nuevo hallazgo)
**Archivo:** `src/components/assistant/ChatWidget.tsx:115`

El contenedor del chat panel (`<motion.div className="fixed bottom-24 ...">`) no tiene `role="dialog"` ni `aria-label`. Los lectores de pantalla no lo identifican como un diálogo modal.

**Fix:**
```tsx
<motion.div
  role="dialog"
  aria-label="Chat con Kyo"
  aria-modal="true"
  ...
>
```

---

#### [CHAT WIDGET] TypingIndicator sin texto accesible (nuevo hallazgo)
**Archivo:** `src/components/assistant/ChatWidget.tsx:234-257`

El indicador de "Kyo está escribiendo" es solo una animación visual de 3 puntos. Un usuario con lector de pantalla no sabe que Kyo está procesando.

**Fix — añadir texto oculto visualmente:**
```tsx
<div className="bg-[#F3F4F7] rounded-2xl rounded-bl-md px-4 py-3">
  <span className="sr-only">Kyo está escribiendo...</span>
  <div className="flex gap-1.5 items-center h-3" aria-hidden="true">
    ...
  </div>
</div>
```

---

#### [CHAT WIDGET] Mensajes sin `role="log"` ni `aria-live`
**Archivo:** `src/components/assistant/ChatWidget.tsx:143`

Cuando Kyo responde, los lectores de pantalla (NVDA, VoiceOver) no anuncian el nuevo mensaje automáticamente.

**Fix:**
```tsx
<div ref={scrollRef} role="log" aria-live="polite" aria-label="Conversación con Kyo" className="flex-1 overflow-y-auto ...">
```

---

#### [CHAT WIDGET] Input sin `maxLength` ni `autoComplete="off"`
**Archivo:** `src/components/assistant/ChatWidget.tsx:170-178`

El navegador sugiere autocompletado (correos anteriores, contraseñas). Sin `maxLength`, un usuario puede pegar texto de varios KB.

**Fix:**
```tsx
<input ... maxLength={600} autoComplete="off" autoCorrect="off" spellCheck="false" />
```

---

#### [CHAT WIDGET] Botón "Nueva conversacion" sin acento y sin confirmación
**Archivo:** `src/components/assistant/ChatWidget.tsx:159`

"Nueva conversacion" falta el acento en "conversación". Además, `onClick={reset}` borra toda la conversación sin aviso. Un candidato que pasó por 4 pasos pierde todo si lo toca.

**Fix — texto correcto y confirmación:**
```tsx
<button type="button" onClick={() => {
  if (window.confirm("¿Seguro que quieres empezar de nuevo? Se perderá esta conversación.")) reset();
}}>
  Nueva conversación
</button>
```

---

#### [CHAT WIDGET] Animación del botón flotante sin `prefers-reduced-motion` (nuevo hallazgo)
**Archivo:** `src/components/assistant/ChatWidget.tsx:49-59`

El botón Kyo tiene `rotate` y `y` con `repeat: Infinity` cada ~7 segundos. Para usuarios con sensibilidad al movimiento (vestibular disorders), la animación continua puede ser incómoda. No se respeta la preferencia del sistema `prefers-reduced-motion`.

**Fix — usar variantes de Framer Motion con reduced motion:**
```tsx
import { useReducedMotion } from "framer-motion";
// ...
const prefersReduced = useReducedMotion();
// En animate:
animate={open ? { rotate: 0 } : prefersReduced ? {} : {
  rotate: [0, -8, 8, -4, 4, 0],
  y: [0, -2, 0, -1, 0],
}}
```

---

#### [CHAT WIDGET] El panel puede quedar bajo el teclado virtual en iOS/Android
**Archivo:** `src/components/assistant/ChatWidget.tsx:120`

`h-[min(60vh,560px)]` en iPhone SE con teclado abierto deja ~140px reales de chat — el input queda parcialmente oculto.

**Fix:**
- Cambiar a `h-[min(50vh,520px)]`
- Añadir al form del input: `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}`

---

#### [FOOTER] Email interno expuesto públicamente
**Archivo:** `src/components/layout/Footer.tsx:85`

`rsalazar@kyoszen.com.mx` es el correo SMTP interno, no el de contacto público. Bots de spam lo indexan.

**Fix:** Reemplazar por un link al formulario:
```tsx
<Link href="/contacto" className="text-xs opacity-50 hover:opacity-80">Formulario de contacto →</Link>
```

---

#### [FOOTER] Sin número de teléfono en la sección de Contacto
**Archivo:** `src/components/layout/Footer.tsx:79-93`

El footer muestra email y horario pero no el teléfono `56 4004 5414`, que es la vía principal de conversión para empresas.

**Fix — añadir antes del horario:**
```tsx
<div className="flex items-center gap-3 mb-3">
  <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
    <span role="img" aria-label="teléfono">📞</span>
  </div>
  <a href="tel:+525640045414" className="text-xs opacity-50 hover:opacity-80 no-underline">56 4004 5414</a>
</div>
```

---

#### [FOOTER] Links legales apuntan a páginas inexistentes (404)
**Archivo:** `src/components/layout/Footer.tsx:99-101`

`/condiciones-de-uso`, `/politica-de-cookies`, `/politica-de-privacidad` no existen. Un usuario que las toca ve un 404.

**Fix temporal:**
```tsx
href="/contacto?asunto=legal"
```

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

#### [PASO 5] Kyo navega a /vacantes antes de que el candidato confirme
**Archivo:** `src/lib/assistant/system-prompt.ts:42-58`

El Paso 5 termina con "¿Le gustaría aplicar?" y luego dice "Usa navigate_to con /vacantes". Son instrucciones contradictorias: Kyo puede navegar mientras aún espera respuesta.

**Fix en el Paso 5:**
```
## Paso 5 — RECOMENDACIÓN
Presenta las 2-3 vacantes más compatibles en formato de lista numerada.
Pregunta: "¿Le gustaría aplicar a alguna de ellas?"
NO llames navigate_to en este paso. Espera la respuesta del candidato.
```

---

#### [MANEJO DE CURSOS] Kyo descarta consultas de cursos sin usar sus tools (nuevo hallazgo)
**Archivo:** `src/lib/assistant/system-prompt.ts:65-66`

La sección "Manejo de otros temas" instruye: _"Si pregunta por cursos o es una empresa: Responde: 'Con gusto te conecto con nuestro equipo' y sugiere WhatsApp."_ Esto ignora completamente las tools `search_courses` y `get_course_details` que Kyo ya tiene. Un candidato que pregunta "¿tienen cursos de liderazgo?" debería recibir la lista, no un redirect a WhatsApp.

**Fix — separar el caso de candidatos que preguntan por cursos:**
```
Si un candidato (no empresa) pregunta por cursos:
  Usa search_courses para encontrar los más relevantes y preséntaselos.
  Ofrece navigate_to /cursos o /cursos/[slug] para el detalle.
Si es una empresa que quiere capacitar a su equipo:
  Responde: "Con gusto te conecto" y navega a /contacto.
```

---

#### [FLUJO] Sin instrucción para cambio de intención a mitad del flujo
**Archivo:** `src/lib/assistant/system-prompt.ts:63-69`

Si en el Paso 3 el candidato dice "en realidad prefiero algo administrativo, no ventas", Kyo no sabe si reiniciar desde Paso 1 o continuar. Responde de forma inconsistente.

**Fix — añadir a "Manejo de otros temas":**
```
Si el candidato cambia el puesto o área buscada durante el flujo:
  Responde: "Claro, ¿me puede decir entonces qué tipo de trabajo busca ahora?"
  Y continúa desde el Paso 1 con la nueva información.
```

---

#### [HISTORIAL] Chat no expira — candidatos que regresan ven contexto obsoleto
**Archivo:** `src/components/assistant/useChat.ts:24-34`

`loadHistory()` restaura cualquier conversación sin importar su antigüedad. Un candidato que abrió el chat hace 3 días ve el hilo completo y Kyo intenta continuar ese contexto en lugar de saludar de nuevo.

**Fix — añadir expiración de 24h en `loadHistory()`:**
```ts
const parsed = JSON.parse(raw) as ChatMessage[];
if (parsed.length > 0) {
  const last = parsed[parsed.length - 1];
  const AGE_24H = 24 * 60 * 60 * 1000;
  if (last.timestamp > 0 && (Date.now() - last.timestamp) > AGE_24H) {
    return [INITIAL_GREETING];
  }
}
return parsed.length > 0 ? parsed : [INITIAL_GREETING];
```

---

#### [SESSIÓN] sessionId se pierde al cerrar la pestaña (nuevo hallazgo)
**Archivo:** `src/components/assistant/useChat.ts:45-52`

`getSessionId()` usa `sessionStorage`, que se borra al cerrar el tab. El historial vive en `localStorage` (persistente). Al reabrir, el candidato ve la misma conversación pero genera un nuevo `sessionId` — la conversación en Supabase queda fragmentada en múltiples registros.

**Fix — migrar `getSessionId` a localStorage con la misma llave de versión:**
```ts
function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  const key = "kyo_session_id_v1";
  let sid = localStorage.getItem(key);
  if (!sid) {
    sid = Date.now().toString(36) + Math.random().toString(36).slice(2);
    localStorage.setItem(key, sid);
  }
  return sid;
}
```
Y al llamar `reset()`, también resetear el sessionId para que el log de Supabase empiece limpio.

---

#### [LATENCIA] MAX_TOOL_ITERATIONS = 5 puede tardar hasta 10 segundos
**Archivo:** `src/app/api/assistant/chat/route.ts:85`

Con haiku (~1.5-2s por llamada), 5 iteraciones = 10s de espera máxima. El flujo de 6 pasos nunca necesita más de 2 tool calls por turno.

**Fix:** `const MAX_TOOL_ITERATIONS = 3;`

---

#### [TOKENS] max_tokens: 1024 insuficiente para el Paso 5
**Archivo:** `src/app/api/assistant/chat/route.ts:153`

Listar 3 vacantes con nombre, empresa, razón de compatibilidad y la pregunta de cierre puede superar los 1024 tokens de output, especialmente cuando el system prompt ya incluye el listado completo de vacantes y cursos. Si Claude se corta, el candidato recibe una respuesta truncada.

**Fix:** `max_tokens: 2048`

---

#### [DESCRIPCIÓN] "microempresas" en el knowledge limita la propuesta de valor
**Archivo:** `src/lib/assistant/knowledge.ts:73`

`"Consultora mexicana especializada en capital humano para microempresas"` — si una empresa mediana o grande pregunta por servicios, Kyo podría desanimar el contacto.

**Fix:**
```ts
description: "Consultora mexicana especializada en capital humano para empresas en crecimiento",
```

---

### Nuevas tools o capacidades recomendadas

#### Tool `register_talent_bank` — banco de talentos desde el chat
**Archivo:** `src/lib/assistant/tools.ts` (nueva tool)

El system prompt promete "registrar sus datos para contactarle cuando surja una oportunidad" (línea 55), pero no existe la herramienta. Kyo manda al candidato a /contacto donde tiene que reescribir todo.

**Tool a añadir:**
```ts
{
  name: "register_talent_bank",
  description: "Registra al candidato en el banco de talentos cuando no hay vacante compatible.",
  input_schema: {
    type: "object",
    properties: {
      nombre:         { type: "string", description: "Nombre del candidato" },
      puesto_buscado: { type: "string", description: "Puesto o área de interés" },
      contacto:       { type: "string", description: "Correo o teléfono que el candidato proporcione voluntariamente" }
    },
    required: ["nombre", "puesto_buscado"]
  }
}
```
Requiere tabla `banco_talentos (id, nombre, puesto_buscado, contacto, created_at)` en Supabase y vista en /admin.

---

#### Filtro `contrato` en `search_jobs`
**Archivo:** `src/lib/assistant/tools.ts:39-47`

El Paso 4 recopila si el candidato quiere tiempo completo o medio tiempo, pero `search_jobs` no tiene filtro de `contrato`. Kyo razona en texto para filtrar, lo que es impreciso.

**Fix — añadir al input_schema de `search_jobs`:**
```ts
contrato: { type: "string", description: "Filtra por tipo: 'Tiempo completo', 'Medio tiempo', 'Por proyecto'" }
```
Y en `executeTool`, caso `search_jobs`:
```ts
.filter((j) => !filters?.contrato || j.contrato.toLowerCase() === (filters.contrato as string).toLowerCase())
```

---

#### Filtro `min_salary` en `search_jobs`
**Archivo:** `src/lib/assistant/tools.ts:39-47`

Cuando un candidato dice "busco algo de más de $10,000", Kyo no puede filtrar por salario mínimo.

**Fix:**
```ts
min_salary: { type: "number", description: "Salario mínimo mensual esperado en pesos" }
```
En executeTool:
```ts
.filter((j) => !filters?.min_salary || j.salario >= (filters.min_salary as number))
```

---

#### Quick replies (chips) para respuestas de opción múltiple
**Archivo:** `src/app/api/assistant/chat/route.ts` + `src/components/assistant/ChatWidget.tsx`

En mobile, el candidato escribe a mano cuando las respuestas son predecibles. Paso 3: `["CDMX", "Estado de México", "No me importa la zona"]`. Paso 4: `["Tiempo completo", "Medio tiempo"]`.

**Implementación:**
1. Añadir `suggestions?: string[]` al `ChatResponseMessage` en route.ts
2. En ChatWidget.tsx, renderizar chips debajo del último mensaje de Kyo:
```tsx
{message.suggestions?.map(s => (
  <button key={s} onClick={() => sendMessage(s)} className="text-[12px] border border-blue text-blue rounded-full px-3 py-1 hover:bg-blue hover:text-white transition-colors">
    {s}
  </button>
))}
```

---

#### Búsqueda semántica básica en `matchesQuery`
**Archivo:** `src/lib/assistant/knowledge.ts:108-111`

`matchesQuery` es un `includes` exacto. "ventas" no encuentra "vendedor", "RRHH" no encuentra "Recursos Humanos". Kyo puede no encontrar vacantes relevantes por diferencias de redacción.

**Fix mínimo — añadir sinónimos a la búsqueda:**
```ts
const SINONIMOS: Record<string, string[]> = {
  "ventas": ["vendedor", "comercial", "asesor"],
  "rrhh": ["recursos humanos", "capital humano"],
  "admin": ["administrativo", "administración"],
  "sistemas": ["it", "tecnología", "tech"],
};
function expandQuery(q: string): string[] {
  const base = q.toLowerCase();
  const extra = SINONIMOS[base] ?? [];
  return [base, ...extra];
}
```

---

### Problemas detectados

- **BUG CRÍTICO (sin resolver): `StaticKnowledgeProvider` usa JOBS.ts, no Supabase.** Ver arriba.
- **BUG CRÍTICO (sin resolver): Paso 6 navega a /contacto en lugar de /vacantes/[id].** Ver arriba.
- **BUG (sin resolver): FAQs de kyo_faqs en Supabase ignoradas.** Ver arriba.
- **BUG (sin resolver): Analytics guarda texto libre del candidato.** Fix de 1 línea en useChat.ts:81.
- **BUG: Filtros de URL en el system prompt usan empresas de demo.** `src/lib/assistant/system-prompt.ts:86-91` lista `?marca=Sigma Retail` etc. del jobs.ts estático. Cuando Supabase tenga otras empresas, los filtros no devuelven resultados. Fix: reemplazar ejemplos de marcas por `?marca=[nombre-exacto]`.
- **BUG: `navigate_to` a `/vacantes/[id]` bloqueado por Regla 6.** `system-prompt.ts:77` — "Solo usa rutas listadas abajo". `/vacantes/[id]` no está listado. Al implementar el fix del Paso 6, añadir esta ruta a `knowledge.ts:60-67`.
- **BUG: rate limit en memoria se borra en cada reinicio de PM2.** `src/app/api/assistant/chat/route.ts:68-82`. Aceptable para el volumen actual; migrar a Upstash Redis cuando crezca el tráfico.

---

## Oportunidades de mejora general

- **[PERFORMANCE] `buildSystemPrompt` sin caché cuando se migre a Supabase.** `src/app/api/assistant/chat/route.ts:149`. Actualmente lee arrays en memoria. Cuando `listJobs`/`listCourses` consulten Supabase, cada mensaje lanzará 4+ queries antes de llamar a Anthropic. Implementar caché de 60s igual al patrón de `getStoredInstrucciones`.

- **[VACANTES] Vacantes relacionadas al pie del detalle.** `src/app/vacantes/[id]/_content.tsx`. Cuando un candidato descarta una vacante, no hay camino a otras. Añadir:
  ```ts
  .from("vacantes").eq("activa", true).eq("categoria", job.categoria).neq("id", job.id).limit(3)
  ```
  Y renderizar 3 tarjetas "Otras vacantes que podrían interesarte".

- **[CONTACTO] El estado de éxito no refuerza el tiempo de respuesta prometido.** `src/app/contacto/page.tsx`. Cuando `submitted === true`, el usuario ya no ve "Responderemos en menos de 24 horas". Añadir ese texto al estado de éxito, que es cuando el usuario más lo necesita.

- **[NAVEGACIÓN KYO] Timeout de 700ms corto para mobile.** `src/components/assistant/useChat.ts:127`. En mobile con teclado abierto el candidato tiene 700ms para leer el mensaje de Kyo antes de ser redirigido. Fix: aumentar a `1400`.

- **[ADMIN — REDES] Tab Configuración no tiene soporte para TikTok.** `src/app/admin/(panel)/redes-sociales/page.tsx`. Solo muestra campos de Facebook. Cuando TikTok se active, faltará UI para su mockup. Extender para iterar sobre `REDES_SOCIALES` activas.

- **[KNOWLEDGE] Stats de empresa hardcodeadas.** `src/lib/assistant/knowledge.ts:77-83`. "687+ candidatos colocados", "672+ empresas atendidas", "3+ años". Si cambian, nadie actualiza el knowledge. Mover a `site_config` en Supabase o al menos documentarlos como "marketing copy a revisar trimestralmente".
