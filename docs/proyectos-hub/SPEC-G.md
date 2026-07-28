# Proyectos Hub — ENTREGA G (P1): Espacios + navegación general→particular

Evoluciona `/revisor → Proyectos` de lista plana a un hub organizado por **Espacios** tipados. NO rompas el flujo de video actual (guion→arte→video, aprobación por escena): solo queda agrupado dentro de un espacio.

Leer primero: `CLAUDE.md`, `src/lib/proyectos.ts` (modelo actual), `src/components/revisor/ProyectosCliente.tsx` (vista cliente actual), `src/app/admin/(panel)/proyectos/page.tsx` (admin actual), `src/app/api/revisor/proyectos/route.ts` y `src/app/api/admin/proyectos/route.ts` (patrones de API con service_role).

Concepto: un **Espacio** tiene un `tipo` que define su vista particular:
- `aprobacion` → agrupa `proyectos` (el flujo de video actual). Ej: "Videos de inducción".
- `archivos` → drive de entregables (se construye en Entrega H).
- `tablero` → kanban tipo Trello (se construye en Entrega I).

## 1. Migración `docs/proyectos-hub/migration.sql` (esquema COMPLETO del hub, NO aplicar)
Incluye TODAS las tablas (P1/P2/P3) para no volver a migrar después.

- `proyecto_espacios`: `id uuid pk default gen_random_uuid()`, `nombre text not null`, `tipo text not null check (tipo in ('aprobacion','archivos','tablero'))`, `descripcion text`, `icono text` (emoji), `color text`, `orden int not null default 0`, `publicado boolean not null default false`, `created_at/updated_at timestamptz default now()`.
- `ALTER TABLE proyectos ADD COLUMN espacio_id uuid REFERENCES proyecto_espacios(id);`
- `espacio_archivos` (para Entrega H): `id uuid pk`, `espacio_id uuid not null references proyecto_espacios(id) on delete cascade`, `nombre text not null`, `url text not null`, `tipo text`, `peso bigint`, `nota text`, `estado text not null default 'pendiente' check (estado in ('pendiente','aprobado','cambios'))`, `orden int default 0`, `created_at/updated_at`.
- `espacio_columnas` (para Entrega I): `id uuid pk`, `espacio_id uuid not null references proyecto_espacios(id) on delete cascade`, `nombre text not null`, `orden int default 0`, `created_at`.
- `espacio_tarjetas` (para Entrega I): `id uuid pk`, `columna_id uuid not null references espacio_columnas(id) on delete cascade`, `titulo text not null`, `descripcion text`, `orden int default 0`, `created_at/updated_at`.
- `espacio_comentarios` (para H e I): `id uuid pk`, `archivo_id uuid references espacio_archivos(id) on delete cascade`, `tarjeta_id uuid references espacio_tarjetas(id) on delete cascade`, `autor_nombre text`, `autor_rol text check (autor_rol in ('admin','cliente'))`, `contenido text not null`, `created_at`.
- RLS habilitado + política permisiva `USING(true) WITH CHECK(true)` en las 5 tablas nuevas.
- Índices: `proyectos(espacio_id)`, `espacio_archivos(espacio_id)`, `espacio_columnas(espacio_id)`, `espacio_tarjetas(columna_id)`, `espacio_comentarios(archivo_id)`, `espacio_comentarios(tarjeta_id)`.
- **Seed** (usa un bloque `DO`/CTE con `RETURNING` para capturar ids):
  - Crea 3 espacios publicados: "Videos de inducción" (`aprobacion`, icono 🎬, orden 1), "Artes" (`archivos`, icono 🎨, orden 2), "Plataforma" (`tablero`, icono 🧩, orden 3).
  - `UPDATE proyectos SET espacio_id = <id de Videos de inducción>` (todos los proyectos existentes son video de inducción).
  - Para el espacio "Plataforma" crea 3 columnas: "Por hacer" (orden 0), "En progreso" (1), "Listo" (2).

## 2. `src/lib/proyectos.ts` (SOLO agregar, no romper)
- `TipoEspacio = "aprobacion" | "archivos" | "tablero"`.
- Interfaces `Espacio`, `EspacioArchivo`, `EspacioColumna`, `EspacioTarjeta`, `EspacioComentario` que reflejen las tablas.

## 3. APIs (service_role, runtime nodejs)
### Admin `src/app/api/admin/proyectos/espacios/route.ts`
- `GET` → todos los espacios ordenados por `orden`, cada uno con conteos: `proyectos_count`, `archivos_count`, `tarjetas_count`. Devuelve `{ espacios }`.
- `POST` → crea espacio. Body `{ nombre, tipo, descripcion?, icono?, color?, orden? }`. Valida `nombre` y `tipo`.
### Admin `src/app/api/admin/proyectos/espacios/[id]/route.ts`
- `PATCH` → edita (`nombre, descripcion, icono, color, orden, publicado`). `DELETE` → borra el espacio (los proyectos quedan con `espacio_id=null`; archivos/columnas caen por cascade).
### Admin: asignar proyecto a espacio
- En el PATCH de proyecto existente (`src/app/api/admin/proyectos/[id]/route.ts`) acepta y actualiza `espacio_id` (aditivo, no rompas lo demás).
### Revisor `src/app/api/revisor/proyectos/espacios/route.ts`
- `GET` → espacios `publicado=true` ordenados por `orden`, con los mismos conteos (solo contando proyectos publicados en `proyectos_count`). Para el general del cliente.

## 4. Cliente — `src/components/revisor/ProyectosCliente.tsx` (reestructurar la pestaña Proyectos)
- **Vista general** (default): tarjetas por espacio publicado (ícono grande, nombre, tipo legible, y resumen según tipo: aprobación → "N proyectos", archivos → "N archivos", tablero → "N tarjetas"). Diseño consistente con las tarjetas actuales.
- **Vista particular** (al hacer clic en un espacio): con un botón "← Espacios" para volver.
  - `aprobacion` → muestra los `proyectos` de ese espacio (el grid actual de tarjetas de proyecto) y al hacer clic en un proyecto entra al detalle de aprobación por escena que YA existe. Reutiliza la lógica actual; solo fíltrala por `espacio_id`.
  - `archivos` → placeholder elegante "🎨 Este espacio estará disponible muy pronto." (lo llena Entrega H).
  - `tablero` → placeholder elegante "🧩 Tablero en camino." (lo llena Entrega I).
- Mantén el fetch actual de proyectos; agrega el fetch de espacios (`/api/revisor/proyectos/espacios`). No rompas Publicaciones ni Análisis.

## 5. Admin — `src/app/admin/(panel)/proyectos/page.tsx`
- Agrega una sección/tab "Espacios": lista los espacios (con sus conteos), permite **crear** un espacio (nombre, tipo, ícono, color, publicar) y **editar/publicar/borrar**.
- En el alta/edición de un proyecto (o en su tarjeta) permite **elegir su Espacio** (selector que hace PATCH `espacio_id`). Cambio mínimo y aditivo; no toques el flujo de importar guion ni la aprobación.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. NO apliques la migración. No construyas Artes ni Tablero (son H e I).
