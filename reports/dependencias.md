# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-05-11

## Vulnerabilidades de Seguridad

| Paquete | Severidad | CVE / Advisory | Descripcion | Fix Disponible |
|---------|-----------|----------------|-------------|----------------|
| `@anthropic-ai/sdk` | MODERADA | GHSA-p7fg-763f-g4gf | Permisos de archivo inseguros en la herramienta de memoria del sistema de archivos local (CWE-732). Afecta versiones 0.79.0 – 0.91.0. | Actualizar a >=0.95.1 |
| `postcss` | MODERADA | GHSA-qx2v-qp2m-jg93 | XSS via `</style>` no escapado en la salida de PostCSS CSS Stringify (CVSS 6.1 / CWE-79). Versiones <8.5.10. Arrastrado por `next`. | Actualizar `next` cuando haya fix compatible |
| `next` (via postcss) | MODERADA | — | Dependencia transitiva de postcss vulnerable. | Esperar parche de Next.js que incluya postcss >=8.5.10 |

> **Nota:** No se detectaron vulnerabilidades de severidad ALTA ni CRITICA.

---

## Paquetes Desactualizados

| Paquete | Declarado en package.json | Ultima Version | Tipo de Cambio | Severidad |
|---------|--------------------------|----------------|----------------|----------|
| `nodemailer` | ^6.9.0 | 8.0.7 | Major x2 (6→8) | ADVERTENCIA |
| `@anthropic-ai/sdk` | ^0.89.0 | 0.95.1 | Minor (tiene vuln activa) | ADVERTENCIA |
| `lucide-react` | ^1.8.0 | 1.14.0 | Minor | INFO |
| `@supabase/supabase-js` | ^2.103.0 | 2.105.4 | Patch/minor | INFO |
| `next` | 16.2.3 | 16.2.6 | Patch | INFO |
| `react` | 19.2.4 | 19.2.6 | Patch | INFO |
| `react-dom` | 19.2.4 | 19.2.6 | Patch | INFO |

> `framer-motion` (12.38.0) esta en la ultima version disponible.

---

## Resumen

- **Total paquetes declarados:** 17 (8 prod + 9 dev)
- **Total paquetes instalados (incluyendo transitivos):** 445
- **Vulnerabilidades:** 3 moderadas, 0 altas, 0 criticas
- **Paquetes desactualizados:** 7 (2 con advertencia, 5 informativos)

---

## Recomendaciones

### Prioridad alta
1. **Actualizar `@anthropic-ai/sdk` a >=0.95.1** — tiene vulnerabilidad de seguridad activa (permisos inseguros en filesystem memory tool). El salto es fuera del rango semver declarado (^0.89.0), asi que hay que editar `package.json` manualmente y revisar changelog por breaking changes antes de hacer deploy.

### Prioridad media
2. **Monitorear actualizaciones de `next`** — la vulnerabilidad de `postcss` se resolvera cuando Next.js publique una version que incluya postcss >=8.5.10. Actualizar a `next@16.2.6` (patch disponible) y verificar si ya incluye el fix.
3. **Evaluar migracion de `nodemailer` a v8** — dos versiones mayores de diferencia (6→8). Revisar changelog; v7 y v8 tienen cambios en la API de transporte. No es urgente si el flujo de correo funciona, pero conviene planificarlo.

### Prioridad baja (actualizaciones de rutina)
4. `lucide-react` ^1.8.0 → 1.14.0: actualizar para obtener nuevos iconos y correcciones.
5. `@supabase/supabase-js` ^2.103.0 → 2.105.4: actualizar en la siguiente ventana de mantenimiento.
6. `react` / `react-dom` 19.2.4 → 19.2.6: parche menor, bajo riesgo.

### No hacer ahora
- No correr `npm audit fix --force` — el "fix" sugerido por npm para `next`/`postcss` baja a `next@9.3.3`, lo cual es regresivo e inviable.
- No actualizar `next` mas alla de 16.2.x sin pruebas exhaustivas (es la version core del proyecto).
