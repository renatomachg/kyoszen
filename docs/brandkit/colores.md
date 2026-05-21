# Kyoszen — Paleta de Colores

## Indicacion del cliente

"Tonos azulados, grises" — tono corporativo.

## Paleta actual implementada

| Nombre       | Variable CSS         | Hex       | Uso principal                        |
|--------------|----------------------|-----------|--------------------------------------|
| Blue         | `--color-blue`       | `#1883FF` | Acciones, links, botones secundarios |
| Navy         | `--color-navy`       | `#042E7B` | Fondo hero, encabezados principales  |
| Blue Dark    | `--color-blue-dark`  | `#0A4ECC` | Hover de botones, acentos            |
| Yellow       | `--color-yellow`     | `#FFCC00` | Acento, CTA principal, highlights    |
| Background   | `--color-bg`         | `#F8FAFC` | Fondo general de paginas             |
| WhatsApp     | `--color-wa`         | `#25D366` | Boton de WhatsApp                    |

## Escala de grises (Tailwind)

- `gray-100` `#F3F4F6` — fondos alternos de secciones
- `gray-400` `#9CA3AF` — texto secundario, placeholders
- `gray-600` `#4B5563` — texto de cuerpo
- `gray-900` `#111827` — texto principal oscuro

## Uso por contexto

### Sitio web
- **Fondo general:** `--color-bg` (`#F8FAFC`)
- **Secciones alternas:** `gray-100`
- **Hero / headers:** `--color-navy` con texto blanco
- **CTA principal:** `--color-yellow` con texto navy
- **Links / botones secundarios:** `--color-blue`

### Panel admin
- Sidebar: navy
- Acciones: blue / blue-dark
- Alertas exito: verde
- Alertas error: rojo

## Pendientes

- [ ] Confirmar paleta oficial con el cliente (manual de marca pendiente)
- [ ] Logo PNG del cliente (reemplazar `KyoszenLogo.tsx`)
