# Proyectos Hub — ENTREGA H (P2): Espacio "Artes" (drive de archivos)

Llena la vista de los espacios `tipo='archivos'` (hoy es placeholder). Un repositorio para subir, ver, aprobar y comentar entregables (PDF, imágenes, etc.). Reusa Entrega G. NO toques el flujo de video ni el tablero. Tablas ya existen: `espacio_archivos`, `espacio_comentarios`.

Leer: `CLAUDE.md`, `src/lib/proyectos.ts`, cómo se sube a Storage en `src/app/api/admin/social/upload/route.ts` (bucket `media`), y el patrón de comentarios/status en `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/{status,comments}/route.ts`.

## 1. APIs admin (service_role, runtime nodejs)
### `src/app/api/admin/proyectos/espacios/[id]/archivos/route.ts`
- `GET` → archivos del espacio ordenados por `orden` asc, `created_at` desc. `{ archivos }`.
- `POST` (multipart) → sube el archivo al bucket `media` bajo `proyectos/<espacioId>/<timestamp>-<nombreSanitizado>` (público), e inserta fila en `espacio_archivos` con `nombre` (original), `url`, `tipo` (mime), `peso`. Sin compresión (imágenes/PDF pasan tal cual). Devuelve el archivo creado. Acepta también `nota` opcional en el form.
### `src/app/api/admin/proyectos/espacios/[id]/archivos/[archivoId]/route.ts`
- `PATCH` → edita `nota`, `orden` (aditivo). `DELETE` → borra la fila (opcional: intenta borrar del Storage; si falla, borra la fila igual).

## 2. APIs revisor (cliente)
### `src/app/api/revisor/proyectos/espacios/[id]/archivos/route.ts`
- `GET` → archivos del espacio (solo si el espacio está `publicado`). `{ espacio, archivos }`.
### `src/app/api/revisor/proyectos/espacios/[id]/archivos/[archivoId]/status/route.ts`
- `PUT` → body `{ estado: 'aprobado' | 'cambios' }` → actualiza `espacio_archivos.estado`. Al pasar a 'cambios' o 'aprobado', notifica por correo a los `social_reviewers` activos / admin siguiendo el patrón existente de proyectos (reusa el helper de notificación si existe; si no, omite el correo pero deja el TODO). Devuelve `{ ok: true }`.
### `src/app/api/revisor/proyectos/espacios/[id]/archivos/[archivoId]/comments/route.ts`
- `GET` → comentarios de ese archivo (de `espacio_comentarios` where `archivo_id`). `POST` → body `{ contenido, autor_nombre?, autor_rol? }` inserta comentario. Reusa el mismo endpoint desde el admin también (autor_rol 'admin').

## 3. Admin UI — vista del espacio Artes
En el admin de proyectos (`src/app/admin/(panel)/proyectos/page.tsx` o un componente nuevo), cuando se abre un espacio `tipo='archivos'`, muestra un **gestor de archivos**:
- Zona de **subir** (botón + arrastrar/soltar) que sube por multipart al POST.
- **Grid** de archivos: miniatura para imágenes (`<img>` nativo), ícono para PDF/otros; nombre, peso, pill de estado (pendiente/aprobado/cambios con color), nota. Acciones: editar nota, borrar, ver comentarios.
- Al subir, refresca la lista.

## 4. Cliente UI — `src/components/revisor/ProyectosCliente.tsx`
Reemplaza el placeholder de `tipo='archivos'` por la vista real:
- Grid de archivos (miniatura imagen / ícono PDF, nombre, estado). Clic en un archivo → panel/modal: previsualización (imagen embebida o link "Abrir" para PDF), la `nota` del admin ("qué es esto"), botones **Aprobar** / **Necesito cambios** (este pide comentario → POST comment + PUT status), y el hilo de comentarios.
- Estado vacío: "Aún no hay archivos en este espacio."
- Consistente con el estilo del revisor (mismos componentes/tono que el flujo de video).

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. No toques el Tablero (Entrega I) ni el flujo de video.
