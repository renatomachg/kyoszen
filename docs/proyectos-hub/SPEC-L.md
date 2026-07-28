# Proyectos Hub — ENTREGA L: Vista previa de archivos (drive Artes)

Mejora la previsualización de archivos en el espacio tipo `archivos`, tanto en el cliente (`/revisor`) como en el admin. Hoy los PDF muestran un ícono genérico y al abrir solo hay un link "Abrir". Queremos ver el contenido: miniatura real en la tarjeta y un visor grande embebido al hacer clic. **Solo frontend, sin cambios de BD ni de API.**

Leer: la UI de archivos de Entregas H y K en `src/components/revisor/ProyectosCliente.tsx` (vista cliente del espacio Artes) y `src/app/admin/(panel)/proyectos/page.tsx` (gestor admin de archivos). Reusa los datos que ya devuelven las APIs (`url`, `tipo`, `nombre`, `estado`, `nota`).

Detección de tipo: usa el campo `tipo` (mime) del archivo. `image/*` → imagen; `application/pdf` (o extensión `.pdf`) → PDF; cualquier otro → ícono genérico + acción de abrir/descargar.

## 1. Miniatura en la tarjeta
- **Imágenes**: `<img src={url}>` con `object-fit: cover`, ocupando el área de preview de la tarjeta (como ya se hace). `loading="lazy"`.
- **PDF**: miniatura real de la primera página usando un `<iframe>` embebido:
  - `src={url + "#toolbar=0&navpanes=0&scrollbar=0&view=FitH"}` (oculta la barra del visor nativo).
  - Escalado al área de la tarjeta, `pointer-events: none` (el clic lo maneja la tarjeta, no el iframe), `overflow: hidden`, esquinas redondeadas. Fondo neutro mientras carga.
  - `loading="lazy"` / `title` con el nombre.
- **Otros tipos**: mantener el ícono genérico actual con la extensión.

## 2. Visor grande al hacer clic (modal / panel de detalle)
Al abrir un archivo:
- **Imagen**: `<img>` grande centrada (máx ~72vh, `object-fit: contain`, fondo oscuro suave).
- **PDF**: visor embebido `<iframe src={url}>` a buen tamaño (ancho completo del modal, alto ~72vh), con el visor nativo del navegador (con toolbar, para que pueda hacer zoom/paginar).
- **Otros**: mensaje "Este tipo de archivo no se puede previsualizar" + botón descargar.
- Siempre: nombre del archivo, pill de estado, la `nota` del admin, y botones **"Abrir en pestaña nueva"** (`<a target="_blank" rel="noopener">`) y **"Descargar"** (`<a href={url} download>`).
- En el **cliente**: conserva los controles ya existentes (Aprobar / Necesito cambios + hilo de comentarios) junto al visor.
- En el **admin**: conserva editar nota / borrar / mover.

## 3. Detalles
- El modal debe cerrar con la ✕, clic en el backdrop y tecla `Esc`.
- Responsivo: en móvil el visor baja a ~60vh y los botones se apilan.
- No romper la navegación por carpetas ni el resto de la vista. Estilo consistente con el revisor/admin (colores de marca, `<img>` nativo, no `next/image`).
- Rendimiento: los iframes de miniatura solo para archivos PDF visibles; con `loading="lazy"` basta por ahora (bajo volumen).

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado. No toques APIs, BD, Tablero, aprobación ni cuestionario.
