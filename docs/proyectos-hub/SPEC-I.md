# Proyectos Hub — ENTREGA I (P3): Espacio "Tablero" (kanban tipo Trello)

Llena la vista de los espacios `tipo='tablero'` (hoy es placeholder). Un planificador kanban: columnas con tarjetas, comentarios por tarjeta. Reusa Entregas G/H. NO toques Artes ni el flujo de video. Tablas ya existen: `espacio_columnas`, `espacio_tarjetas`, `espacio_comentarios` (el espacio "Plataforma" ya tiene 3 columnas: Por hacer / En progreso / Listo).

Modelo de colaboración: **Kyoszen (admin) maneja el tablero** (crea/mueve/edita columnas y tarjetas). El **cliente ve el tablero y comenta** las tarjetas (no las mueve). Así funciona como planificador compartido.

Leer: `CLAUDE.md`, `src/lib/proyectos.ts`, patrón de comentarios de Entrega H (`espacio_comentarios`), y cómo ProyectosCliente renderiza espacios.

## 1. APIs admin (service_role, runtime nodejs)
### Columnas — `src/app/api/admin/proyectos/espacios/[id]/columnas/route.ts`
- `GET` → columnas del espacio ordenadas por `orden`. `POST` → crea columna `{ nombre, orden? }`.
### `src/app/api/admin/proyectos/espacios/[id]/columnas/[columnaId]/route.ts`
- `PATCH` → `{ nombre?, orden? }`. `DELETE` → borra columna (tarjetas caen por cascade).
### Tarjetas — `src/app/api/admin/proyectos/espacios/[id]/tarjetas/route.ts`
- `POST` → crea tarjeta `{ columna_id, titulo, descripcion? , orden? }`. Valida que la columna pertenezca al espacio.
### `src/app/api/admin/proyectos/espacios/[id]/tarjetas/[tarjetaId]/route.ts`
- `PATCH` → `{ titulo?, descripcion?, columna_id?, orden? }` (mover entre columnas = cambiar `columna_id`). `DELETE`.

## 2. APIs revisor (cliente)
### `src/app/api/revisor/proyectos/espacios/[id]/tablero/route.ts`
- `GET` → solo si el espacio está `publicado`: devuelve `{ espacio, columnas: [{...columna, tarjetas: [...]}] }` (columnas ordenadas, con sus tarjetas ordenadas anidadas).
### `src/app/api/revisor/proyectos/espacios/[id]/tarjetas/[tarjetaId]/comments/route.ts`
- `GET` → comentarios de la tarjeta (de `espacio_comentarios` where `tarjeta_id`). `POST` → `{ contenido, autor_nombre?, autor_rol? }`. Reusable desde el admin (autor_rol 'admin').

## 3. Admin UI — tablero
En el admin de proyectos, al abrir un espacio `tipo='tablero'`, muestra un **kanban**:
- Columnas en fila horizontal (scroll-x si no caben), cada una con su título (editable), botón "＋ Añadir columna", y botón para borrar/renombrar.
- Tarjetas dentro de cada columna: título; clic abre editor (título, descripción, borrar) y el hilo de comentarios. Botón "＋ Añadir tarjeta" por columna.
- **Mover tarjetas entre columnas**: arrastrar y soltar si es directo; si no, un control "mover a ▸ <columna>" por tarjeta. Persiste con el PATCH (`columna_id`).
- Consistente con el estilo del panel (tokens Tailwind del admin).

## 4. Cliente UI — `src/components/revisor/ProyectosCliente.tsx`
Reemplaza el placeholder de `tipo='tablero'` por el tablero real (solo lectura + comentar):
- Columnas horizontales con sus tarjetas (título; si tiene descripción, indícalo). Diseño limpio, mismo tono del revisor.
- Clic en una tarjeta → panel/modal: título, descripción, y el hilo de **comentarios** con caja para escribir (POST como `cliente`).
- El cliente NO mueve ni crea tarjetas; solo ve y comenta.
- Estado vacío: si no hay columnas/tarjetas → "El plan de trabajo aparecerá aquí muy pronto."

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. No toques Artes ni el flujo de video.
