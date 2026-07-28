# Admin — ENTREGA T: botón "Vista cliente" en Centro de Proyectos

Agrega un botón en el admin de Proyectos que abra el portal del cliente (`/revisor`) directo en la pestaña **Proyectos**, en una pestaña nueva, para que el admin vea exactamente lo que ve el cliente. Solo frontend, sin BD.

Archivos: `src/app/admin/(panel)/proyectos/page.tsx` y `src/app/revisor/page.tsx`.

## 1. Botón en el encabezado de Centro de Proyectos
En `src/app/admin/(panel)/proyectos/page.tsx`, en el encabezado (junto a los botones "Importar guion" / "Nueva…"), agrega un botón **secundario/outline** "Vista cliente" con el ícono `eye` de `@/components/ui/IconUI` (estilo corporativo consistente, nada de emoji).
- Acción: abrir `/revisor?tab=proyectos` en **pestaña nueva** (`<a href="/revisor?tab=proyectos" target="_blank" rel="noopener">` o `window.open(..., "_blank", "noopener")`).
- Tooltip/title: "Ver el portal como lo ve el cliente".

## 2. Deep-link de pestaña en el revisor
En `src/app/revisor/page.tsx`, al montar, lee la pestaña inicial desde la URL:
- Si `?tab=` viene con un valor válido de las pestañas (`publicaciones` | `proyectos` | `resultados`), inicia en esa pestaña.
- Si no viene o es inválido, deja el comportamiento actual (pestaña por defecto).
- Cambio mínimo y no rompas nada (filtros, tour, estados). Usa `useSearchParams` o `window.location.search` de forma segura en client component.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado.
