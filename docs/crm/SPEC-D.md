# Módulo CRM (Fase 2) — ENTREGA D: cimientos

Base de datos + lógica pura del CRM de candidatos. Un módulo más del monolito, no toca lo existente salvo lo indicado. Leer `CLAUDE.md`.

Contexto de datos existentes (NO los modifiques en esta entrega):
- `aplicaciones` (bigint id): `vacante` (texto del título al que aplicó), `nombre, whatsapp, correo, experiencia, ubicacion, cv_url, created_at`. Es el intake crudo del sitio.
- `vacantes` (bigint id): `titulo, empresa, ubicacion, jornada, contrato, salario, categoria, requisitos text[], tags text[], responsabilidades text[], activa, ...`.
- `contactos`: leads del formulario de contacto.

El CRM consolida las `aplicaciones` en perfiles de **candidato** con pipeline, y hace matching candidato↔vacante.

## ENTREGA D — SOLO ESTO (nada de APIs, páginas ni componentes)

### 1. Migración SQL (archivo `docs/crm/migration.sql`, NO aplicar)
Prefijo `crm_` para las tablas nuevas (consistente con `social_`, `proyecto_`).

- Tabla `crm_candidatos`:
  - `id uuid PK default gen_random_uuid()`
  - `nombre text`, `correo text`, `whatsapp text`, `ubicacion text`, `experiencia text`, `cv_url text`
  - `estado text NOT NULL default 'nuevo'` con CHECK en (`nuevo`,`contactado`,`entrevista`,`enviado`,`contratado`,`descartado`)
  - `origen text NOT NULL default 'aplicacion'` (`aplicacion`|`contacto`|`manual`)
  - `created_at timestamptz NOT NULL default now()`, `updated_at timestamptz NOT NULL default now()`
- Tabla `crm_notas` (timeline de notas internas por candidato):
  - `id uuid PK default gen_random_uuid()`
  - `candidato_id uuid NOT NULL references crm_candidatos(id) on delete cascade`
  - `texto text NOT NULL`, `autor text`, `created_at timestamptz NOT NULL default now()`
- `ALTER TABLE aplicaciones ADD COLUMN candidato_id uuid references crm_candidatos(id);` (aditivo, nullable — vincula cada aplicación cruda a su candidato consolidado).
- RLS: habilitar en `crm_candidatos` y `crm_notas` con política permisiva `USING (true) WITH CHECK (true)` (patrón del proyecto).
- Índices: `crm_candidatos(estado)`, `crm_notas(candidato_id)`, `aplicaciones(candidato_id)`.

### 2. `src/lib/crm/tipos.ts`
- `EstadoPipeline = "nuevo" | "contactado" | "entrevista" | "enviado" | "contratado" | "descartado"`.
- `Candidato` (refleja `crm_candidatos`), `Nota` (refleja `crm_notas`).
- `VacanteMatch` = subconjunto de vacante usado por el matcher: `{ id: number; titulo: string; categoria: string | null; ubicacion: string | null; requisitos: string[]; tags: string[] }`.
- `CandidatoMatch` = `{ id: string; nombre: string | null; experiencia: string | null; ubicacion: string | null; categoriasAplicadas: string[] }` (categoriasAplicadas = categorías de las vacantes a las que aplicó antes).
- `ResultadoMatch = { candidatoId: string; score: number; razones: string[] }`.

### 3. `src/lib/crm/matching.ts` (PURO, sin DB, testeable)
- `normalizarTexto(s: string): string` — minúsculas, sin acentos, sin puntuación, colapsa espacios.
- `tokenizar(s: string): string[]` — normaliza y separa en palabras de ≥3 chars, quitando stopwords español comunes (de, la, el, en, y, con, para, por, los, las, un, una, del, al, que, se, su, etc.).
- `puntuarCandidato(vacante: VacanteMatch, candidato: CandidatoMatch): ResultadoMatch`:
  - **Ubicación** (peso alto): si la ubicación del candidato y la de la vacante comparten ciudad/alcaldía (normalizadas, contains en cualquier dirección) → suma y agrega razón "Misma zona: <ubicacion>".
  - **Categoría** (peso alto): si `candidato.categoriasAplicadas` incluye (normalizado) la `vacante.categoria` → suma y razón "Ya aplicó a vacantes de <categoria>".
  - **Palabras clave** (peso por coincidencia): tokens de `vacante.titulo + requisitos + tags` cruzados con tokens de `candidato.experiencia`; por cada token en común suma, tope razonable, y razón "Coincide en: <hasta 4 palabras>".
  - Devuelve `score` normalizado 0–100 (define pesos y un máximo teórico para escalar) y `razones` (máx ~4, ordenadas por relevancia). Sin coincidencias → score 0, razones vacías.
- `rankear(vacante: VacanteMatch, candidatos: CandidatoMatch[]): ResultadoMatch[]` — puntúa todos, filtra score>0, ordena desc por score.

### 4. `src/lib/crm/index.ts`
- Re-exporta tipos y funciones de matching.
- Constante `ESTADOS: { value: EstadoPipeline; label: string; color: string; orden: number }[]` — etiquetas en español ("Nuevo", "Contactado", "Entrevista", "Enviado a cliente", "Contratado", "Descartado") y un color por estado (usa clases/tonos coherentes: azul para activos, verde contratado, gris descartado). Sirve para pintar el pipeline después.

## Cierre
- Corre `npx tsc --noEmit` y arréglalo si rompe.
- Reporta archivos creados y resultado. No toques nada fuera de lo listado. NO apliques la migración.
