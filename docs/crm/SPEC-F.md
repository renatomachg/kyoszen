# Módulo CRM (Fase 2) — ENTREGA F: Matching vacante↔candidato (la joya)

Surface el matcher que ya existe (`src/lib/crm/matching.ts`, funciones `rankear`/`puntuarCandidato`) en el admin: elegir una vacante y ver los candidatos anteriores que embonan, con score y razones. Reusa Entregas D y E. NO rompas la página CRM ya construida. Leer `CLAUDE.md`, `docs/crm/SPEC-D.md`, `docs/crm/SPEC-E.md`.

Dato clave: `aplicaciones.vacante` es el TÍTULO (texto) de la vacante a la que aplicó la persona, no un id. Para obtener `categoriasAplicadas` de un candidato hay que cruzar ese título con `vacantes.titulo` y tomar su `categoria`.

## 1. API `src/app/api/admin/crm/match/route.ts` (service_role, runtime nodejs)
- `GET ?vacante=<id>`:
  1. Carga la vacante objetivo por id → arma `VacanteMatch` (`id, titulo, categoria, ubicacion, requisitos ?? [], tags ?? []`). Si no existe → 404.
  2. Carga todos los `crm_candidatos`.
  3. Carga todas las `aplicaciones` con `candidato_id NOT NULL` (`candidato_id, vacante`) y todas las `vacantes` (`titulo, categoria`). Construye un mapa título→categoría (normalizado) para resolver, por cada candidato, sus `categoriasAplicadas` (categorías distintas de las vacantes cuyos títulos coinciden con los `aplicaciones.vacante` de ese candidato).
  4. Arma `CandidatoMatch[]` (`id, nombre, experiencia, ubicacion, categoriasAplicadas`) y llama `rankear(vacante, candidatos)`.
  5. Devuelve `{ vacante: { id, titulo, categoria, ubicacion }, resultados: [...] }` donde cada resultado enriquece el `ResultadoMatch` con datos para pintar: `{ candidatoId, score, razones, nombre, ubicacion, estado, aplicaciones_count }`. Solo score>0, ordenados desc (ya lo hace `rankear`).
- Maneja errores con status correctos y try/catch.

## 2. UI: pestaña "Matching" en la página CRM
En `src/app/admin/(panel)/crm/page.tsx`, agrega un **switch de pestañas** arriba: "Candidatos" (lo que ya existe) y "🎯 Matching por vacante". Haz el cambio MÍNIMO y aditivo: envuelve el contenido actual en la pestaña "Candidatos" y renderiza un componente nuevo para la otra. NO alteres la lógica ya probada de la lista/detalle.

Componente nuevo `src/app/admin/(panel)/crm/MatchingPanel.tsx` ("use client"):
- Carga las **vacantes activas** (`supabase.from("vacantes").select("id, titulo, categoria, ubicacion").eq("activa", true)`), en un dropdown "Elige una vacante".
- Al elegir → `GET /api/admin/crm/match?vacante=<id>` → muestra:
  - Encabezado con la vacante elegida (título, categoría, ubicación).
  - Lista de candidatos sugeridos ordenados por score: nombre, **badge de score** (0–100, con color: verde alto ≥66, azul medio 33–65, gris bajo <33), pill de estado del pipeline, y las **razones como chips** ("Misma zona: …", "Coincide en: …", etc.), y su `aplicaciones_count`.
  - Cada candidato con un link/acción "Ver en candidatos" (puede solo cambiar a la pestaña Candidatos y abrir ese detalle si es fácil; si no, deja el nombre y ya).
  - Estado vacío claro: si no hay coincidencias (`resultados` vacío) → mensaje "Ningún candidato anterior embona con esta vacante todavía." Si no hay vacantes activas → aviso.
- Estilo consistente con el panel (tokens Tailwind `navy/blue/blue-soft/bg/border/muted`, tarjetas `rounded-2xl`).

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. No toques nada fuera de lo listado.
