# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-06-29

## Vulnerabilidades de Seguridad

### 🔴 ALTA (acción inmediata)

| Paquete | Versión afectada | Advisory | Descripción |
|---------|-----------------|----------|-------------|
| `next` | 16.2.3 (< 16.2.5) | GHSA-8h8q-6873-q5fj | DoS con Server Components (CVSS 7.5) |
| `next` | 16.2.3 (< 16.2.6) | GHSA-26hh-7cqf-hhc6 | Middleware/Proxy bypass en App Router — fuga de datos (CVSS 7.5) |
| `ws` | < 8.21.0 (transitiva) | GHSA-96hv-2xvq-fx4p | Memory exhaustion DoS vía fragmentos diminutos (CVSS 7.5) |

### 🟡 MODERADA

| Paquete | Advisory | Descripción | Fix |
|---------|----------|-------------|-----|
| `@anthropic-ai/sdk` 0.89.x | GHSA-p7fg-763f-g4gf | Permisos inseguros en Local Filesystem Memory Tool (CWE-732). Rango afectado: 0.79.0–0.91.0. | `npm install @anthropic-ai/sdk@0.107.0` |
| `next` | GHSA-ffhc-5mcf-pf4q | XSS en App Router con CSP nonces (CWE-79) | Actualizar a 16.2.9 |
| `postcss` (transitiva) | GHSA-qx2v-qp2m-jg93 | XSS vía `</style>` sin escapar en CSS stringify | Se resuelve al actualizar `next@16.2.9` |
| `brace-expansion` (transitiva) | GHSA-jxxr-4gwj-5jf2 | DoS por rango numérico grande (CWE-400) | `npm audit fix` |
| `js-yaml` (transitiva) | GHSA-h67p-54hq-rp68 | DoS cuadrático en merge key handling (CWE-407) | `npm audit fix` |
| `ws` | GHSA-58qx-3vcg-4xpx | Divulgación de memoria no inicializada (transitiva) | `npm audit fix` |

### ⚪ BAJA

| Paquete | Advisory | Descripción | Fix |
|---------|----------|-------------|-----|
| `@babel/core` (transitiva) | GHSA-4x5r-pxfx-6jf8 | Lectura arbitraria de archivos vía `sourceMappingURL` (CWE-22/200) | `npm audit fix` |

---

## Paquetes Desactualizados

| Paquete | Instalado | Última versión | Severidad |
|---------|-----------|----------------|-----------|
| `next` | 16.2.3 (pin exacto) | **16.2.9** | 🔴 CRÍTICO — vulns HIGH+MODERATE, patch sin breaking changes |
| `@anthropic-ai/sdk` | ~0.89.x | **0.107.0** | 🔴 CRÍTICO — vuln MODERATE, 18 versiones atrás |
| `nodemailer` | ~6.9.x | **9.0.1** | 🟡 ADVERTENCIA — 3 versiones mayores atrás (sin CVEs activos en audit) |
| `react` | 19.2.4 | **19.2.7** | ℹ️ INFO — parche menor |
| `react-dom` | 19.2.4 | **19.2.7** | ℹ️ INFO — parche menor |
| `@supabase/supabase-js` | ~2.103.x | 2.108.2 | ℹ️ INFO — al día dentro del rango |
| `framer-motion` | ~12.38.x | 12.42.0 | ℹ️ INFO — al día dentro del rango |
| `lucide-react` | ~1.8.x | 1.22.0 | ℹ️ INFO — al día dentro del rango |
| `marked` | ~18.0.x | 18.0.5 | ℹ️ INFO — al día dentro del rango |
| `unpdf` | 1.6.2 | 1.6.2 | ✅ Al día |

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total paquetes instalados | 531 (41 prod · 455 dev · 84 opcionales) |
| Paquetes directos declarados | 22 (10 deps + 12 devDeps) |
| **Vulnerabilidades totales** | **8** |
| — Altas | 3 (`next` ×2, `ws`) |
| — Moderadas | 4 (`@anthropic-ai/sdk`, `next` XSS, `postcss`, `brace-expansion`/`js-yaml`) |
| — Bajas | 1 (`@babel/core`) |
| — Críticas | 0 |
| Paquetes directos desactualizados con CVEs | 2 (`next`, `@anthropic-ai/sdk`) |

---

## Recomendaciones

### Acción 1 — URGENTE: actualizar `next` a 16.2.9

```bash
npm install next@16.2.9 eslint-config-next@16.2.9
npm run build
# Probar en local (localhost:3002) → aprobar → deploy a VPS
```

Resuelve los 2 HIGH de next + XSS de CSP nonces + postcss MODERATE. Riesgo de regresión mínimo (patch 16.2.3→16.2.9).

### Acción 2 — URGENTE: actualizar `@anthropic-ai/sdk`

```bash
npm install @anthropic-ai/sdk@0.107.0
```

La vulnerabilidad (permisos en Filesystem Memory Tool) no impacta directamente el uso actual (solo usa tool-use web), pero la versión instalada está muy atrás. Probar `/api/assistant/chat` (Kyo) y el Estratega (streaming) en local antes de hacer deploy.

### Acción 3 — URGENTE: `npm audit fix` para transitivas

```bash
npm audit fix
# Resuelve: ws (HIGH+MODERATE), brace-expansion, js-yaml, @babel/core, postcss
# NO usar --force
```

### Acción 4 — PRIORIDAD MEDIA: evaluar `nodemailer` 6 → 9

```bash
npm install nodemailer@9.0.1 @types/nodemailer@latest
```

Cambio mayor (v6→v9) — no aparece en audit actual con CVEs activos, pero acumula 3 versiones mayores. Revisar API antes de actualizar. Archivos afectados:
- `src/app/api/aplicar/route.ts`
- `src/app/api/contacto/route.ts`
- Rutas en `src/app/api/admin/social/` que envíen correo

### Acción 5 — INFO: parches menores (próximo ciclo de mantenimiento)

```bash
npm install react@19.2.7 react-dom@19.2.7
```

### No hacer
- No correr `npm audit fix --force` — puede degradar `next` a una versión antigua.
- No actualizar `nodemailer` en producción sin probar flujo completo de correo SMTP IONOS en local primero.
- No actualizar `@anthropic-ai/sdk` sin probar Kyo y el Estratega en local.

---

*Generado automáticamente por el agente de mantenimiento. No modificar manualmente — regenerar con el mismo agente.*
