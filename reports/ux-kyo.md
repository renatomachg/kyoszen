# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-06-08
**Cambios analizados:** `src/lib/assistant/system-prompt.ts`, `src/lib/assistant/tools.ts`, `src/lib/assistant/knowledge.ts`, `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatWidget.tsx`, `src/components/assistant/useChat.ts`, `src/app/vacantes/page.tsx`, `src/app/vacantes/[id]/_content.tsx`, `src/components/sections/Hero.tsx`, `src/components/sections/Vacancies.tsx`, `src/components/layout/Footer.tsx`

---

## Cambios Recientes Detectados

No hubo commits de código funcional en los últimos 2 días (solo reportes automáticos y actualizaciones de CLAUDE.md). Los bugs críticos escalados en los reportes del 06-06 y 07-06 siguen sin corrección. Este reporte agrega **8 hallazgos nuevos** no reportados antes y escala los 4 bugs críticos sin resolver.

---

## 🚨 Bugs críticos sin corrección — escalados (4ª vez)

Estos 4 bugs se detectaron originalmente el 2026-06-05. Cada día sin corregirlos afecta a candidatos reales que usan Kyo.

### [CRÍTICO-1] Kyo recomienda vacantes del JOBS.ts estático, no de Supabase
**Archivo:** `src/lib/assistant/knowledge.ts:167`
Candidatos reciben recomendaciones de vacantes que ya fueron cerradas por el admin. El fix requiere migrar `StaticKnowledgeProvider.listJobs` y `getJob` a queries directas a Supabase con caché de 60s (mismo patrón que `getStoredInstrucciones` en route.ts:8-32).

### [CRÍTICO-2] Paso 6: Kyo navega a /contacto (formulario de empresas)
**Archivo:** `src/lib/assistant/system-prompt.ts:61`
"Navega a /contacto si acepta" envía al candidato al formulario de empresas. Fix: `navigate_to /vacantes/[id]` cuando hay vacante seleccionada; `/contacto` solo cuando no hay compatible (banco de talentos).

### [ALTO-3] FAQs editadas en /admin/kyo no llegan al system prompt
**Archivo:** `src/lib/assistant/knowledge.ts:99-105`
`kyo_faqs` de Supabase existe pero nunca se consulta. El admin edita FAQs y Kyo sigue usando las 5 hardcodeadas.

### [ALTO-4] Analytics guarda texto libre del candidato
**Archivo:** `src/components/assistant/useChat.ts:81`
`logEvent("kyo_mensaje", trimmed.slice(0, 300))` registra hasta 300 chars de texto libre. Fix de 1 línea: `logEvent("kyo_mensaje", String(messages.length));`

---

## Nuevos Hallazgos — UX

### Alta prioridad

#### [NUEVO] Inconsistencia crítica de estadísticas entre Hero y Kyo
**Archivos:** `src/components/sections/Hero.tsx:107,157,176` y `src/lib/assistant/knowledge.ts:77-83`

El Hero muestra **"7000+ candidatos colocados"** y **"10+ Años exp."** en las tarjetas flotantes. Kyo tiene hardcodeado **"687+ Candidatos colocados"** y **"3+ Años en el mercado"**. Si un candidato pregunta a Kyo por las estadísticas de la empresa, recibe números que contradicen lo que acaba de leer en la página.

**Fix inmediato:**
1. `knowledge.ts:77-83` — actualizar los valores:
```ts
"Candidatos colocados": "7000+",
"Años en el mercado": "10+",
```
2. A largo plazo, mover estas stats a `site_config` en Supabase para que solo exista una fuente de verdad.

---

#### [NUEVO] Hero.tsx usa `next/image` — violación de regla de proyecto
**Archivo:** `src/components/sections/Hero.tsx:6,122,131`

`import Image from "next/image"` aparece en Hero a pesar de que CLAUDE.md establece explícitamente: *"No usar `next/image` — usar `<img>` nativo"*. En el VPS con `unoptimized: true` funciona, pero al actualizar Next.js o si alguien quita esa opción, rompe el build de producción.

**Fix:**
```tsx
// Línea 122 — reemplazar:
<Image src="/images/Hero2.jpg" alt="Trabajo operativo Kyoszen" fill className="object-cover" sizes="250px" />
// Con:
<img src="/images/Hero2.jpg" alt="Trabajo operativo Kyoszen" className="object-cover w-full h-full" />

// Línea 131 — igual:
<img src="/images/Hero.jpg" alt="Equipo profesional Kyoszen" className="object-cover w-full h-full" />
```
Y eliminar el import de la línea 6.

---

#### [NUEVO] Hero placeholder "¿Que puesto buscas?" — tilde faltante
**Archivo:** `src/components/sections/Hero.tsx:81`

El buscador principal del sitio tiene `placeholder="¿Que puesto buscas?"` — falta la tilde en "Qué". Es la barra de búsqueda más visible del sitio; el error tipográfico daña la percepción de profesionalismo.

**Fix de 1 carácter:** `placeholder="¿Qué puesto buscas?"`

---

#### [NUEVO] Vacancies.tsx también ordena por ID, no por fecha
**Archivo:** `src/components/sections/Vacancies.tsx:29`

```ts
.order("id")
```
La sección de vacantes del homepage muestra las 4 vacantes más antiguas, no las más recientes. Una vacante nueva y urgente nunca aparece destacada.

**Fix:**
```ts
.order("created_at", { ascending: false })
```
(Mismo fix que ya se reportó para `vacantes/page.tsx:70` — aplica igual a esta sección.)

---

### Media prioridad

#### [NUEVO] Búsqueda de vacantes registra texto libre — problema de privacidad
**Archivo:** `src/app/vacantes/page.tsx:78`

```ts
logEvent("busqueda_vacantes", q.slice(0, 200));
```
Un candidato que escribe su nombre o empresa en el buscador queda registrado en `site_eventos`. Mismo patrón que el bug ya reportado en `useChat.ts:81`.

**Fix — registrar solo que hubo una búsqueda, no qué se buscó:**
```ts
logEvent("busqueda_vacantes", String(q.length > 0 ? "activa" : "limpia"));
```
O si se quieren métricas de términos, aplicar hash antes de guardar.

---

#### [NUEVO] Hero depende de imágenes externas de terceros (pravatar.cc)
**Archivo:** `src/components/sections/Hero.tsx:102`

```tsx
src={`https://i.pravatar.cc/56?img=${i}`}
```
Los 4 avatares del elemento "social proof" (+7000 candidatos colocados) se cargan de un CDN externo. Si pravatar.cc tiene downtime o bloquea por rate limit, el Hero muestra cuadros rotos. Además, son fotos de personas ficticias sin consentimiento implícito para uso comercial.

**Fix:** Descargar 4 fotos de stock genéricas a `/public/images/avatars/avatar-{1,2,3,4}.jpg` y reemplazar las URLs externas por paths locales.

---

#### [NUEVO] Vacante detalle sin sección de "Otras vacantes"
**Archivo:** `src/app/vacantes/[id]/_content.tsx` — al final del archivo, después de la línea 217

Un candidato que visita el detalle de una vacante y decide que no le interesa no tiene camino directo a otras opciones. El único CTA visible es "Aplicar ahora" o WhatsApp — si no quiere aplicar, se va del sitio.

**Fix — añadir al final del `<section>` de detalle, antes de cerrar el `max-w-5xl`:**
```tsx
const [relacionadas, setRelacionadas] = useState<Vacante[]>([]);
useEffect(() => {
  if (!job) return;
  supabase.from("vacantes")
    .select("id,titulo,empresa,categoria,ubicacion,contrato,badge,badge_class")
    .eq("activa", true)
    .eq("categoria", job.categoria)
    .neq("id", job.id)
    .limit(3)
    .then(({ data }) => setRelacionadas((data as Vacante[]) ?? []));
}, [job]);

// En el JSX:
{relacionadas.length > 0 && (
  <div className="mt-12">
    <h2 className="text-lg font-extrabold text-navy mb-4">Otras vacantes que podrían interesarte</h2>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {relacionadas.map(v => (
        <Link key={v.id} href={`/vacantes/${v.id}`} className="...tarjeta mínima...">
          {v.titulo} — {v.empresa}
        </Link>
      ))}
    </div>
  </div>
)}
```

---

#### [NUEVO] CLAUDE.md desactualizado — TikTok link ya no es "#"
**Archivo:** CLAUDE.md (pendientes) y `src/components/layout/Footer.tsx:21`

El CLAUDE.md lista como tarea pendiente: *"TikTok — link en Footer es `href="#"`. Falta URL real del perfil."* Pero el Footer ya tiene el link real: `href: "https://www.tiktok.com/@kyoszen3"`. La tarea ya está completada y debería marcarse como `[x]` en CLAUDE.md para no confundir futuras sesiones.

**Fix:** En CLAUDE.md, cambiar:
```
- [ ] **TikTok** — link en Footer es `href="#"`. Falta URL real del perfil.
```
Por:
```
- [x] **TikTok** — link en Footer actualizado a https://www.tiktok.com/@kyoszen3
```

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación (no repetidas de reportes anteriores)

#### [NUEVO] Kyo no usa el nombre del candidato en el Paso 5
**Archivo:** `src/lib/assistant/system-prompt.ts:44-51`

El template del Paso 5 dice:
```
"Con base en lo que me comento, [nombre], estas vacantes se ajustan..."
```
Pero en el flujo real, Kyo a veces olvida usar el nombre porque la instrucción de "usar el nombre de forma natural" está en el Paso 0, lejos del Paso 5. El modelo puede perder ese hilo cuando el historial es largo.

**Fix — reforzar en el Paso 5 explícitamente:**
```
## Paso 5 — RECOMENDACIÓN
SIEMPRE abre este paso usando el nombre del candidato tal como lo dio en el Paso 0.
Formato obligatorio: "Con base en lo que me comentó, [nombre], ..."
```

---

#### [NUEVO] `get_job_details` nunca se llama durante el flujo normal
**Archivo:** `src/lib/assistant/tools.ts:49-57`

La tool `get_job_details` existe pero el system prompt no la usa en ningún paso. En el Paso 5, Kyo usa el resumen del listado de vacantes del system prompt (que solo incluye `id, titulo, empresa, ubicacion, contrato, jornada, salario`). No llama `get_job_details` para mostrar descripción, responsabilidades o tags — que serían los argumentos más persuasivos para que el candidato aplique.

**Fix — añadir en el Paso 5:**
```
Antes de mostrar las vacantes recomendadas, llama get_job_details
para cada candidata y usa la descripcion corta y los 2-3 primeros
requisitos para personalizar la explicacion de "por qué le aplica".
```

---

#### [NUEVO] Sin respaldo cuando el candidato escribe un mensaje muy largo
**Archivo:** `src/app/api/assistant/chat/route.ts:131`

El historial se trunca a los últimos 20 mensajes (`body.messages.slice(-20)`). Pero no hay validación de longitud por mensaje individual. Si un candidato pega un CV completo (2,000+ palabras) en el chat, ese mensaje solo infla el context sin aportar valor, y puede hacer que el system prompt quede cortado por el límite de tokens.

**Fix — añadir validación antes del slice:**
```ts
const history = body.messages
  .map(m => ({ ...m, content: m.content.slice(0, 1000) }))  // max 1000 chars por mensaje
  .slice(-20);
```

---

### Problemas detectados

- **[NUEVO] Stats de Kyo desactualizadas vs Hero**: `knowledge.ts:77` dice `687+`; Hero dice `7000+`. Cualquier candidato que pregunte "¿cuántos candidatos han colocado?" recibe respuesta inconsistente. Fix: ver hallazgo de stats arriba.
- **[PERSISTENTE] BUG CRÍTICO: `StaticKnowledgeProvider` usa JOBS.ts, no Supabase.** Sin resolver desde hace 4+ días.
- **[PERSISTENTE] BUG CRÍTICO: Paso 6 navega a /contacto.** Sin resolver desde hace 4+ días.
- **[PERSISTENTE] FAQs de kyo_faqs ignoradas.** Sin resolver.
- **[PERSISTENTE] Analytics guarda texto libre.** Fix de 1 línea sin aplicar.

---

## Oportunidades de mejora general

- **[RUTA FALTANTE EN KNOWLEDGE] `/vacantes/[id]`**: `knowledge.ts:60-67` no lista la ruta dinámica `/vacantes/[id]`. Cuando el fix del Paso 6 se implemente (navigate_to a `/vacantes/12`), la Regla 6 del system prompt bloqueará la navegación porque no está en el listado de rutas permitidas. Añadir: `{ path: "/vacantes/:id", title: "Detalle de vacante", purpose: "Página de detalle de una vacante activa con botón Aplicar", summary: "Muestra descripción, responsabilidades, requisitos y CTA de aplicación." }` a `SITE_PAGES` y actualizar la mención en `system-prompt.ts:77`.

- **[CONTACTO] Estado de éxito no refuerza el SLA de 24h**: `src/app/contacto/page.tsx`. El texto "Te respondemos en menos de 24 horas hábiles" aparece antes del envío (línea 76). Después de `submitted === true`, el usuario ya no lo ve — pero es exactamente cuando más lo necesita para no quedarse con incertidumbre. Añadir ese texto al estado de confirmación.

- **[KYO — LATENCIA] Navegación en mobile demasiado rápida**: `src/components/assistant/useChat.ts:127`. `setTimeout(..., 700)` da 700ms al candidato para leer el mensaje de Kyo antes de ser redirigido. En mobile con teclado abierto, esos 700ms no alcanzan. Cambiar a `1400`.

- **[KYO — CONOCIMIENTO] Descripción "microempresas" limita propuesta de valor**: `src/lib/assistant/knowledge.ts:73`. "Consultora mexicana especializada en capital humano para microempresas" puede disuadir contacto de empresas medianas. Fix: `"para empresas en crecimiento"`.

- **[PERFORMANCE] `buildSystemPrompt` concatena listas cada request**: `src/app/api/assistant/chat/route.ts:149`. Cuando la migración a Supabase llegue, cada mensaje del candidato lanzará 4+ queries antes de siquiera llamar a Anthropic. Planear caché de 60s para el resultado completo de `buildSystemPrompt`.
