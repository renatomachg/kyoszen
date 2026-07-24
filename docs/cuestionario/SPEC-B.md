# ENTREGA B — Portal público + APIs

Construye el portal conversacional en `/cuestionario/[token]` y sus APIs. Reusa lo de Entrega A (`src/lib/cuestionario/index.ts` y `tipos.ts`). NO modifiques `preguntas.json` ni los archivos de Entrega A. NO toques el admin (eso es Entrega C).

Leer primero: `CLAUDE.md`, `docs/cuestionario/SPEC.md`, y para el patrón de portal excluido mira cómo `/revisor` está hecho (`src/app/revisor/`, `src/components/layout/PublicShell.tsx`, y una API en `src/app/api/revisor/`).

## 1. Exclusión del shell público
En `src/components/layout/PublicShell.tsx`, agrega `/cuestionario` a las rutas donde se ocultan Navbar, Footer y el asistente Kyo (igual que `/revisor` y `/admin`).

## 2. APIs (usar service_role de Supabase, patrón de las rutas existentes)

- `GET /api/cuestionario/[token]/route.ts`
  - Busca la fila por `token`. Si no existe → 404 `{ error: "no encontrado" }`.
  - Si existe → `{ invitado_nombre, respuestas, paso_actual, completado }`.

- `PATCH /api/cuestionario/[token]/route.ts` (autoguardado)
  - Body: `{ respuestas?: object, paso_actual?: number }`.
  - Actualiza solo lo que venga + `updated_at = now()`. Devuelve `{ ok: true }`. Maneja errores con `res.ok`/try-catch y status correcto.

- `POST /api/cuestionario/[token]/enviar/route.ts`
  - Marca `completado = true`, `enviado_en = now()`, guarda `respuestas` finales si vienen en el body. Devuelve `{ ok: true }`.

Todas: `runtime = "nodejs"`. Si el token no existe en PATCH/POST → 404, no crear filas nuevas (las crea el admin en Entrega C; la semilla `rosy` ya existe para probar).

## 3. Página `src/app/cuestionario/[token]/page.tsx` (server component)
- Carga la fila por token con Supabase service_role. Si no existe, renderiza un estado simple "Este enlace no es válido" (sin navbar).
- Pasa `{ token, invitadoNombre, respuestasIniciales, pasoInicial, completadoInicial }` a un client component `CuestionarioCliente`.

## 4. `src/app/cuestionario/[token]/CuestionarioCliente.tsx` ("use client")
Porta el prototipo (que ya validó el cliente) a React. Comportamiento EXACTO:

**Layout**
- Barra superior fija: marca "Kyoszen" (cuadro con "K" degradado azul→navy) a la izquierda; a la derecha contador "Pregunta X de Y"; debajo una barra de progreso azul que se llena.
- Tarjeta central (máx ~640px) con una pregunta a la vez.
- Nav inferior fija: botón "← Atrás" (ghost) y botón primario ("Continuar" / "Enviar respuestas"). Debajo, nota chica: "Tu avance se guarda solo · puedes pausar y seguir después" con palomita.
- Estética: DM Sans, fondo `--color-bg` con leves radiales azul/navy, tarjetas blancas redondeadas, acento `--color-blue`/`--color-blue-dark`, amarillo `--color-yellow` solo para el chip "Prototipo" (aquí NO va ese chip, es real). Respeta `prefers-reduced-motion`.

**Pantallas**
- Intro (usa `CUESTIONARIO.intro`): saludo, título, texto, chips y botón "Empezar".
- Pregunta `single`: opciones como tarjetas grandes; al tocar una, se marca (radio) y AUTO-AVANZA (~260ms). 
- Pregunta `multi`: opciones toggle (checkbox), hint "Puedes elegir varias"; avanza con "Continuar" (habilitado con ≥1).
- Pregunta `text`: input de línea (`input:"line"`) o textarea (`input:"area"`); todas son opcionales, "Continuar" siempre habilitado; autofocus.
- Transición (item `tipo:"transicion"`): pantalla centrada con ícono, título y texto; botón "Continuar". NO cuenta como "Pregunta X de Y".
- Revisión final (antes del cierre): lista TODAS las preguntas visibles respondidas, agrupadas por sección, cada una con su respuesta legible (mapea value→label; multi separado por " · "; sin responder → "Sin responder" en gris) y un botón "Editar". Botón primario "Enviar respuestas ✓".
- Cierre (usa `CUESTIONARIO.cierre`): sello con palomita, título, texto. Botón "Ver de nuevo" opcional.

**Navegación y ramificación**
- Usa los helpers de `src/lib/cuestionario`: `esVisible`, `preguntasVisibles`, `estaRespondida`. Recorre `CUESTIONARIO.flujo` saltando items no visibles según respuestas actuales.
- "Editar" desde la revisión: salta a esa pregunta y activa modo "volver a revisión" — el botón pasa a "Guardar y volver" y al continuar regresa directo a la pantalla de revisión (no re-recorre todo). "Atrás" cancela ese modo.

**Guardado / reanudar**
- Estado local de `respuestas` inicializado con `respuestasIniciales`.
- Autoguardado: en cada cambio de respuesta y cada avance de paso, PATCH con debounce (~600ms) mandando `{ respuestas, paso_actual }`. No bloquear la UI; fallo silencioso con reintento suave.
- Al iniciar, si `pasoInicial>0` y no completado, reanuda en ese punto.
- "Enviar respuestas" → POST a `/enviar` con las respuestas finales; luego muestra el cierre. Si ya venía `completadoInicial`, entra directo al cierre con opción de revisar.

## Cierre de la corrida
- Corre `npm run build` (o `npx tsc --noEmit` si el build tarda demasiado) y arregla lo que rompa.
- Reporta lista de archivos creados/modificados y resultado del build. No toques nada fuera de lo listado (portal, sus APIs, y la línea de PublicShell).
