# Módulo Cuestionario — Spec de construcción

Portal conversacional para que un cliente (ej. Rosy) responda un cuestionario ramificado, con guardado automático. Un módulo más del monolito Kyoszen, no toca nada existente.

Fuente de verdad de las preguntas: `docs/cuestionario/preguntas.json` (ya escrito, NO modificar el contenido).

Reglas del proyecto (leer `CLAUDE.md` en la raíz):
- Next.js 16 App Router, React 19, Tailwind v4, TypeScript estricto.
- Español de México con acentos y signos (¿ ¡).
- Usar `<img>` nativo, NO `next/image`.
- Fuente DM Sans (ya cargada globalmente en el proyecto).
- Supabase: cliente en `src/lib/supabase.ts`. En API routes se usa la service_role. RLS activo con políticas permisivas `USING(true)` (el acceso real lo controla la service_role).
- El portal debe quedar EXCLUIDO de Navbar/Footer/asistente Kyo. Ver cómo `src/components/layout/PublicShell.tsx` excluye `/revisor` y replicar para `/cuestionario`.
- Paleta (variables CSS en globals.css): `--color-navy #042E7B`, `--color-blue #1883FF`, `--color-blue-dark #0A4ECC`, `--color-yellow #FFCC00`, `--color-bg #F8FAFC`.

## Modelo de datos (tabla nueva)

Tabla `cuestionario_respuestas`:
- `id` uuid PK default gen_random_uuid()
- `token` text UNIQUE NOT NULL — identifica al invitado (ej. "rosy"). El link es `/cuestionario/<token>`.
- `invitado_nombre` text — nombre para saludar (ej. "Rosy"). Opcional.
- `respuestas` jsonb NOT NULL default '{}' — mapa `{ [key]: valor }`. valor = string (single/text) o string[] (multi).
- `paso_actual` int NOT NULL default 0 — para reanudar donde se quedó.
- `completado` boolean NOT NULL default false.
- `enviado_en` timestamptz — cuándo tocó "Enviar respuestas".
- `created_at` timestamptz NOT NULL default now()
- `updated_at` timestamptz NOT NULL default now() (trigger o set manual en la API).

RLS: habilitar y crear política permisiva `USING (true) WITH CHECK (true)` como el resto del proyecto.

Semilla: insertar una fila demo con token `rosy`, invitado_nombre `Rosy` (para pruebas locales).

## ENTREGA A (SOLO ESTO en esta corrida)

Crear únicamente estos archivos. NO crear páginas, componentes React ni API routes todavía (eso es Entrega B/C).

1. `src/lib/cuestionario/tipos.ts`
   - Tipos TypeScript que modelan `preguntas.json`: `Opcion`, `Condicion` (`{ key: string; includesAny?: string[]; equals?: string[] }`), `Pregunta` (con `key`, `seccion`, `tipo: "single"|"multi"|"text"`, `input?: "line"|"area"`, `opcional?`, `showIf?`, `opciones?`, `pregunta`, `ayuda?`, `placeholder?`), `Transicion` (`{ tipo:"transicion"; titulo; texto }`), `ItemFlujo = Pregunta | Transicion`, `Intro`, `Cierre`, y `Cuestionario` (la forma completa del JSON).
   - Tipo `Respuestas = Record<string, string | string[]>`.

2. `src/lib/cuestionario/index.ts`
   - Importa el JSON (`import data from "../../../docs/cuestionario/preguntas.json"` o mueve/copía el JSON a `src/lib/cuestionario/preguntas.json` si prefieres import limpio; documenta la decisión). Expórtalo tipado como `CUESTIONARIO: Cuestionario`.
   - Helpers PUROS (sin DB, sirven en cliente y server):
     - `esVisible(item: ItemFlujo, resp: Respuestas): boolean` — evalúa `showIf`. `includesAny`: la respuesta (que es string[]) contiene al menos uno. `equals`: la respuesta (string) está en la lista. Sin `showIf` => true. Transiciones => siempre true.
     - `preguntasVisibles(resp): Pregunta[]` — items tipo pregunta visibles según respuestas actuales (excluye transiciones).
     - `estaRespondida(p: Pregunta, resp): boolean` — text/opcional => true; multi => array con length>0; single => valor no vacío.
     - `progreso(resp, itemActualKey): { pos: number; total: number }`.

3. Archivo SQL de migración: `docs/cuestionario/migration.sql`
   - El `CREATE TABLE`, RLS, política e insert semilla descritos arriba. NO ejecutarlo, solo dejar el archivo.

Al terminar: correr `npx tsc --noEmit` (o `npm run build` si es rápido) para confirmar que los tipos compilan. Reportar en una lista corta qué archivos creaste y el resultado del typecheck. No tocar nada fuera de lo listado.
