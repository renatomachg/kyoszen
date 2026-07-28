# Proyectos Hub — ENTREGA K: Subcarpetas dentro de un Espacio de Archivos

Agrega carpetas anidadas al espacio tipo `archivos` (Artes). Hoy los archivos son una lista plana por espacio; ahora podrán organizarse en carpetas y subcarpetas, con navegación tipo Drive. Reusa Entrega H (drive) y G. NO rompas nada. El admin crea/organiza carpetas; el cliente navega (solo lectura) y sigue aprobando/comentando archivos.

Leer: `CLAUDE.md`, `src/lib/proyectos.ts`, las APIs y UI de archivos de Entrega H (`src/app/api/admin/proyectos/espacios/[id]/archivos/*`, `src/app/api/revisor/proyectos/espacios/[id]/archivos/*`, el gestor admin en `src/app/admin/(panel)/proyectos/page.tsx` y la vista cliente de archivos en `src/components/revisor/ProyectosCliente.tsx`).

## 1. Migración `docs/proyectos-hub/migration-K.sql` (NO aplicar)
- `espacio_carpetas`: `id uuid pk default gen_random_uuid()`, `espacio_id uuid not null references proyecto_espacios(id) on delete cascade`, `parent_id uuid references espacio_carpetas(id) on delete cascade` (NULL = raíz del espacio), `nombre text not null`, `orden int default 0`, `created_at/updated_at timestamptz default now()`.
- `ALTER TABLE espacio_archivos ADD COLUMN carpeta_id uuid REFERENCES espacio_carpetas(id) ON DELETE SET NULL;` (NULL = raíz del espacio; al borrar una carpeta, sus archivos suben a la raíz).
- RLS habilitado + política permisiva en `espacio_carpetas`.
- Índices: `espacio_carpetas(espacio_id)`, `espacio_carpetas(parent_id)`, `espacio_archivos(carpeta_id)`.

## 2. `src/lib/proyectos.ts`
- Interfaz `EspacioCarpeta` (id, espacio_id, parent_id, nombre, orden, created_at, updated_at).
- Agrega `carpeta_id: string | null` a `EspacioArchivo`.

## 3. APIs admin
### Carpetas — `src/app/api/admin/proyectos/espacios/[id]/carpetas/route.ts`
- `GET` → TODAS las carpetas del espacio (lista plana, ordenadas por `orden`, `nombre`). El front arma el árbol/breadcrumb. `{ carpetas }`.
- `POST` → crea carpeta `{ nombre, parent_id? }`. Valida `nombre`; si viene `parent_id`, que pertenezca al mismo espacio.
### `src/app/api/admin/proyectos/espacios/[id]/carpetas/[carpetaId]/route.ts`
- `PATCH` → `{ nombre?, parent_id?, orden? }` (mover carpeta = cambiar parent_id; evita ciclos: no permitir mover una carpeta dentro de sí misma o de un descendiente). `DELETE` → borra (subcarpetas caen por cascade; archivos suben a raíz por el ON DELETE SET NULL).
### Archivos (extender Entrega H, aditivo)
- `GET` de archivos: soporta `?carpeta=<id>` para filtrar por carpeta; sin parámetro o `?carpeta=root` → archivos con `carpeta_id IS NULL`. (O devuelve todos con su `carpeta_id` y que el front filtre — elige lo más simple y documenta.)
- `POST` (subir): acepta `carpeta_id` en el form (dónde cae el archivo). Si no viene → raíz.
- `PATCH [archivoId]`: acepta `carpeta_id` para **mover** el archivo entre carpetas.

## 4. API revisor
- `GET` de archivos del espacio (`src/app/api/revisor/proyectos/espacios/[id]/archivos/route.ts`): devuelve `{ espacio, carpetas: [...todas], archivos: [...todos con carpeta_id] }`. El cliente navega en memoria (bajo volumen). Mantén compatibilidad con lo que ya consume.

## 5. Admin UI — gestor con carpetas
En la vista del espacio Artes:
- **Breadcrumb**: Raíz ▸ Carpeta ▸ Subcarpeta (clic para subir de nivel).
- Botón **"＋ Nueva carpeta"** (crea en la carpeta actual).
- El grid muestra primero las **carpetas** de la carpeta actual (ícono 📁, clic para entrar; con opción renombrar/borrar) y luego los **archivos** de esa carpeta.
- **Subir** archivos cae en la carpeta actual (mantén el drag-and-drop existente).
- Opcional: mover un archivo a otra carpeta (control "mover a").

## 6. Cliente UI — navegación de carpetas
En la vista del espacio Artes del `/revisor`:
- Mismo **breadcrumb** + navegación por carpetas (solo lectura).
- Dentro de la carpeta actual: subcarpetas (entrar) y archivos (preview, aprobar, comentar — como ya funciona).
- Estado vacío por carpeta: "Esta carpeta está vacía."

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. NO apliques la migración. No toques Tablero, aprobación ni cuestionario.
