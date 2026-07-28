# Proyectos Hub — ENTREGA J: Cuestionario de onboarding dentro de un Espacio

Permite adjuntar un cuestionario (el de `/cuestionario/[token]`) a un Espacio, y mostrarlo como una tarjeta de onboarding en la vista del cliente. Pensado para el espacio "Plataforma", pero general (cualquier espacio puede tener uno). Reusa Entregas G/H/I y el módulo cuestionario (`src/lib/cuestionario`). NO rompas nada existente.

Leer: `CLAUDE.md`, `src/lib/proyectos.ts`, `src/lib/cuestionario/index.ts` (helper `contarRespondidas`, `CUESTIONARIO`), `src/app/api/admin/cuestionario/route.ts` (lista de invitaciones), la vista de espacio del cliente en `src/components/revisor/ProyectosCliente.tsx`, y el admin de espacios en `src/app/admin/(panel)/proyectos/page.tsx`.

## 1. Migración `docs/proyectos-hub/migration-J.sql` (NO aplicar)
- `ALTER TABLE proyecto_espacios ADD COLUMN cuestionario_token text;` (nullable). Es el token de una fila de `cuestionario_respuestas`.

## 2. `src/lib/proyectos.ts`
- Agrega `cuestionario_token: string | null` a la interfaz `Espacio`.

## 3. API admin
- En el PATCH de espacio (`src/app/api/admin/proyectos/espacios/[id]/route.ts`) acepta y actualiza `cuestionario_token` (puede ser string o null para desasignar). Aditivo.
- El GET admin de espacios ya devuelve el espacio; incluye `cuestionario_token` en el select.

## 4. API revisor — estado del cuestionario del espacio
- En el GET revisor de espacios (`src/app/api/revisor/proyectos/espacios/route.ts`) y/o en el GET del tablero, cuando el espacio tenga `cuestionario_token`, incluye un objeto `cuestionario` con el estado:
  - Busca la fila en `cuestionario_respuestas` por ese token. Si existe, calcula con `contarRespondidas(respuestas)` de `@/lib/cuestionario`: `{ token, invitado_nombre, respondidas, total, completado }`. Si el token no existe → `cuestionario: null`.
- Hazlo de forma que la vista general (tarjetas de espacio) y/o la particular puedan mostrarlo. Lo más simple: agregar `cuestionario` al objeto de cada espacio en el GET de espacios del revisor.

## 5. Cliente — tarjeta de onboarding
En `src/components/revisor/ProyectosCliente.tsx`, dentro de la **vista particular de un espacio** (arriba de su contenido, sea tablero/archivos/aprobación), si el espacio trae `cuestionario`, muestra una **tarjeta destacada**:
- Ícono 📋, título "Cuestionario de onboarding", y estado:
  - `completado` → "Completado ✓" (verde) + botón "Ver respuestas".
  - respondidas>0 y no completado → "En progreso · X de Y" (azul) + botón "Continuar".
  - respondidas=0 → "Aún no lo has contestado" (gris) + botón "Contestar ahora".
- El botón abre `/cuestionario/<token>` (en la misma pestaña o nueva, tu criterio; nueva pestaña es más seguro para no perder el revisor).
- Diseño consistente con el resto del revisor (tarjeta con borde, sombra suave, colores de marca).

## 6. Admin — asignar cuestionario al espacio
En el admin de proyectos, en la edición de un espacio, agrega un **selector "Cuestionario de onboarding"**: carga las invitaciones desde `GET /api/admin/cuestionario` y deja elegir una (por `invitado_nombre` + `token`) o "Ninguno". Al elegir → PATCH del espacio con `cuestionario_token`. Cambio mínimo y aditivo.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. NO apliques la migración.
