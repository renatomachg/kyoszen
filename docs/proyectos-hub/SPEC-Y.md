# Proyectos — ENTREGA Y: notificaciones confiables (await + log)

Las notificaciones por correo del Centro de Proyectos se disparaban con `void` (fire-and-forget) y con un `catch {}` vacío. Si el proceso se reiniciaba (deploy) justo después, el correo moría a medio enviar y el error quedaba invisible. Este fix las hace **confiables y visibles**. Solo cambia el manejo del envío; no toca la lógica de negocio.

Archivos (todas las rutas de notificación del hub de proyectos):
- `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/status/route.ts`
- `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/comments/route.ts`
- `src/app/api/revisor/proyectos/espacios/[id]/archivos/[archivoId]/status/route.ts`
- `src/app/api/revisor/proyectos/espacios/[id]/archivos/[archivoId]/comments/route.ts`
- `src/app/api/admin/proyectos/[id]/bloques/[bloqueId]/versions/route.ts` (si notifica al cliente)

## Cambios
1. **Esperar el envío**: cambia la llamada de notificación de `void notify...(...)` a `await notify...(...)` **antes** de `return NextResponse.json(...)`. Así el correo se completa antes de responder y un reinicio no lo interrumpe.
   - Envuelve el `await` de forma que **un fallo de correo NO rompa la respuesta al cliente** (la acción del revisor debe responder OK aunque el correo falle). Es decir: `try { await notify(...) } catch (e) { console.error("[notif proyecto] fallo:", e) }` justo antes del return.
2. **Registrar el error**: dentro de cada helper de notificación (`notifyAdmin`, etc.), en el `catch`, agrega `console.error("[notif ...] error al enviar:", e)` (con un prefijo claro por ruta) en lugar de un catch vacío. Que quede en los logs de PM2.
3. Opcional pero recomendado: dentro del helper, envuelve el `sendMail` con un **timeout defensivo** (ej. `Promise.race` con 15s) para que un SMTP colgado no atore la respuesta del revisor indefinidamente; si expira, loguea y sigue.

## Reglas
- No cambies a quién se le manda, ni el asunto/cuerpo, ni la lógica de aprobación/gating/rollup. Solo `await` + logging (+ timeout defensivo).
- No rompas nada; el revisor debe seguir recibiendo su respuesta OK aunque el correo falle (solo que ahora el fallo queda logueado).

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado.
