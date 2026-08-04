# Admin — ENTREGA X: acceso por proyecto (video) para colaboradores

Encima de V/W (roles + usuarios), permite asignar a un colaborador **proyectos específicos** dentro del Centro de Proyectos, de modo que solo vea esos videos y nada más. Reusa lo existente. Solo afecta a colaboradores; los admin ven todo. Estilo IconUI, navy + amarillo.

Leer: `src/app/admin/(panel)/layout.tsx` (cómo se lee `admin_perfiles` por `user_id`), `src/app/admin/(panel)/proyectos/page.tsx` (Centro de Proyectos: tabs Proyectos/Espacios, tarjetas de proyecto, "Por corregir", importar, Vista cliente), `src/app/admin/(panel)/usuarios/page.tsx`, `src/app/api/admin/usuarios/*`, `src/app/api/admin/proyectos/route.ts` (lista de proyectos).

## 1. Migración `docs/proyectos-hub/migration-X.sql` (NO aplicar)
- `ALTER TABLE admin_perfiles ADD COLUMN proyectos uuid[] NOT NULL DEFAULT '{}';`
(Lista de `proyectos.id` que el colaborador puede ver. Vacío = ninguno.)

## 2. API usuarios (extender V/W)
- POST y PATCH de `/api/admin/usuarios[/[id]]`: aceptan y guardan `proyectos` (array de uuid). GET los devuelve.

## 3. Página Usuarios (`src/app/admin/(panel)/usuarios/page.tsx`)
- En el editor de un **colaborador** que tenga la sección **"Proyectos"** activada, muestra una lista de **checkboxes de proyectos** (fetch a `/api/admin/proyectos`; muestra título + folio/espacio) para elegir cuáles puede ver. Guarda en `perfil.proyectos`.
- Si no tiene la sección Proyectos, no muestra esta lista.

## 4. Centro de Proyectos (`src/app/admin/(panel)/proyectos/page.tsx`) — vista de colaborador
- Al montar, obtén el perfil del usuario actual (igual que el layout: `getSession` → `admin_perfiles` por `user_id`). Calcula `esAdmin` (rol admin o sin perfil) y `proyectosPermitidos` (Set de ids).
- **Si `esAdmin`** → todo igual que ahora (sin cambios).
- **Si es colaborador** (no admin):
  - Muestra **solo el tab "Proyectos"**; oculta el tab/gestión de **"Espacios"**, y los botones **"Importar guion"**, **"Nueva…"** y **"Vista cliente"** (acciones de admin).
  - En el tab Proyectos, muestra **solo los proyectos cuyo id esté en `proyectosPermitidos`**. Igual filtra la bandeja **"Por corregir"** a esos proyectos.
  - Si intenta abrir el detalle de un proyecto que no está permitido (por estado/URL), no lo abras (guárdalo).
  - Puede trabajar normalmente **dentro** de sus proyectos asignados (editar guion/arte/video, versiones, comentarios) — eso no cambia.
  - Estado vacío si no tiene proyectos asignados: "Aún no tienes videos asignados. Pídele acceso a un administrador."
- Sé quirúrgico: no rompas la experiencia de admin ni la lógica existente (importador, aprobación, espacios, Artes, tablero). Solo agrega el gate por rol/proyectos.

## Nota de seguridad (dejar como está, documentar)
El filtrado es a nivel de UI/página (igual que el resto del admin, que se protege por la sesión y el guard de página, no por auth en cada API). Es consistente con el patrón actual. Endurecer a nivel de API sería un cambio aparte.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado. NO apliques la migración.
