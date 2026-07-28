# Proyectos — ENTREGA U: archivos con/sin aprobación (switch por archivo)

En el espacio Artes (archivos), permite marcar por archivo si **requiere aprobación del cliente** o no. Algunos entregables ya vienen autorizados / son solo referencia y no deben pedir aprobación. Reusa Entregas H/K. Preserva lo demás.

Leer: `src/lib/proyectos.ts`, las APIs de archivos (`src/app/api/admin/proyectos/espacios/[id]/archivos/*`, `src/app/api/revisor/proyectos/espacios/[id]/archivos/*`), el gestor admin en `src/app/admin/(panel)/proyectos/page.tsx`, y la vista cliente de archivos en `src/components/revisor/ProyectosCliente.tsx`.

## 1. Migración `docs/proyectos-hub/migration-U.sql` (NO aplicar)
- `ALTER TABLE espacio_archivos ADD COLUMN requiere_aprobacion boolean NOT NULL DEFAULT true;`
(Default true = comportamiento actual: pedir aprobación.)

## 2. Tipos
- `src/lib/proyectos.ts`: agrega `requiere_aprobacion: boolean` a `EspacioArchivo`.

## 3. APIs admin
- **POST** subir (`.../archivos/route.ts`): acepta en el form `requiere_aprobacion` (`"true"`/`"false"`, default `true`) y lo guarda al insertar.
- **PATCH** (`.../archivos/[archivoId]/route.ts`): acepta `requiere_aprobacion` (boolean) para cambiarlo por archivo. Aditivo.

## 4. API revisor
- El GET de archivos debe incluir `requiere_aprobacion` (si hace `select("*")` ya viene; si nombra columnas, agrégala).
- El PUT de estado (`.../archivos/[archivoId]/status/route.ts`): si el archivo tiene `requiere_aprobacion = false`, responde 400 `{ error: "Este archivo no requiere aprobación" }` (no se puede aprobar/pedir cambios).

## 5. Admin UI — gestor de Artes
- **Al subir**: en la zona de carga, un **switch "Requiere aprobación del cliente"** (encendido por defecto). Los archivos subidos en esa tanda heredan ese valor (mándalo en el POST).
- **Por archivo**: en cada tarjeta de archivo, un **switch/toggle "Requiere aprobación"** que hace PATCH y refleja al instante.
- Chip de estado en la tarjeta: si `requiere_aprobacion=true`, muestra el estado normal (pendiente/aprobado/cambios con punto de color). Si `false`, muestra un chip neutro **"Sin aprobación"** (slate) en vez del estado.

## 6. Cliente UI — vista de archivos (ProyectosCliente)
- Si `requiere_aprobacion=false`: muestra el archivo (miniatura + visor + descargar) **sin** los botones Aprobar / Necesito cambios y **sin** el pill de estado; en su lugar una etiqueta discreta **"Sin aprobación requerida"** (gris). Los comentarios pueden seguir disponibles (opcional, no obligatorio).
- Si `requiere_aprobacion=true`: flujo actual (aprobar / pedir cambios / comentarios / estado).

## Reglas
- Default true en todo (los archivos ya subidos siguen pidiendo aprobación como hasta ahora).
- No rompas subcarpetas, preview, ni el resto del gestor. Estilo corporativo (IconUI, navy+amarillo).

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado. NO apliques la migración.
