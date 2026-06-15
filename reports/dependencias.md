# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-06-15

## Vulnerabilidades de Seguridad

### `next` 16.2.3 — CRÍTICO (múltiples CVEs HIGH/MODERATE)

| Advisory | Severidad | CVSS | Descripción | Fix |
|----------|-----------|------|-------------|-----|
| GHSA-8h8q-6873-q5fj | HIGH | 7.5 | Denial of Service con Server Components (CWE-770) | ≥16.2.5 |
| GHSA-26hh-7cqf-hhc6 | HIGH | 7.5 | Middleware/Proxy bypass en App Router — fix incompleto (CWE-288) | ≥16.2.6 |
| GHSA-mg66-mrh9-m8jx | HIGH | 7.5 | DoS vía agotamiento de conexiones con Cache Components (CWE-770) | ≥16.2.5 |
| GHSA-gx5p-jg67-6x7h | MODERATE | 6.1 | XSS en scripts `beforeInteractive` con input no confiable (CWE-79) | ≥16.2.5 |
| GHSA-h64f-5h5j-jqjh | MODERATE | 5.9 | DoS en Image Optimization API (CWE-770) | ≥16.2.5 |
| GHSA-ffhc-5mcf-pf4q | MODERATE | 4.7 | XSS en App Router vía CSP nonces (CWE-79) | ≥16.2.5 |
| GHSA-3g8h-86w9-wvmq | LOW | 3.7 | Cache poisoning vía Middleware/Proxy redirects (CWE-349) | ≥16.2.5 |
| GHSA-vfv6-92ff-j949 | LOW | 3.7 | Cache poisoning vía React Server Component cache-busting (CWE-328) | ≥16.2.5 |

La versión instalada es 16.2.3; el **fix completo requiere 16.2.9** (latest al 2026-06-15).

### `@anthropic-ai/sdk` 0.89.0 — ADVERTENCIA (MODERATE)

| Advisory | Severidad | Descripción | Fix |
|----------|-----------|-------------|-----|
| GHSA-p7fg-763f-g4gf | MODERATE | Permisos de archivo inseguros en la herramienta de memoria del filesystem local (CWE-732). Rango afectado: 0.79.0–0.91.0. | ≥0.91.1 |

Nota: Kyoszen no usa la herramienta de Filesystem Memory local, por lo que el riesgo real en producción es bajo. Sin embargo, salir del rango vulnerable sigue siendo recomendable.

### Dependencias transitivas (MODERATE) — solo devDependencies

| Paquete | Advisory | CVSS | Descripción | Vía | Fix |
|---------|----------|------|-------------|-----|-----|
| `brace-expansion` 5.0.2–5.0.5 | GHSA-jxxr-4gwj-5jf2 | 6.5 | DoS por rango numérico grande que evita protección `max` (CWE-400) | `@typescript-eslint` | `npm audit fix` |

No afecta producción.

---

## Paquetes Desactualizados

| Paquete | Instalado | Última versión | Severidad |
|---------|-----------|----------------|-----------|
| `next` | 16.2.3 | **16.2.9** | 🔴 CRÍTICO — 3 CVEs HIGH activos; patch sin breaking changes |
| `@anthropic-ai/sdk` | 0.89.0 | **0.104.1** | 🟡 ADVERTENCIA — vulnerabilidad MODERATE; salto mayor de versión (0.89→0.104) |
| `nodemailer` | ~6.10.1 | **9.0.0** | 🟡 ADVERTENCIA — 3 versiones mayores de atraso (v6→v9); sin CVE activo en npm audit hoy |
| `lucide-react` | ~1.8.0 | 1.18.0 | ℹ️ INFO |
| `react` | 19.2.4 | 19.2.7 | ℹ️ INFO |
| `react-dom` | 19.2.4 | 19.2.7 | ℹ️ INFO |
| `@supabase/supabase-js` | ~2.103.0 | 2.108.2 | ℹ️ INFO |
| `framer-motion` | ~12.38.0 | 12.40.0 | ℹ️ INFO |
| `marked` | ~18.0.3 | 18.0.5 | ℹ️ INFO |

---

## Resumen

- **Total paquetes declarados:** 21 (9 dependencies · 12 devDependencies)
- **Paquetes con vulnerabilidades activas:** 3 (`next`, `@anthropic-ai/sdk`, `brace-expansion` transitiva)
- **Vulnerabilidades totales:** 10 (3 high · 4 moderate · 2 low · 1 moderate-transitiva)
- **Paquetes desactualizados:** 9

---

## Recomendaciones

### Acción 1 — URGENTE: Actualizar `next` a 16.2.9

```bash
# Editar package.json: "next": "16.2.9" y "eslint-config-next": "16.2.9"
npm install
npm run build
# Probar en local → aprobar → deploy a VPS
```

Patch update que corrige los 3 CVEs HIGH (DoS ×2, Middleware bypass) y todos los MODERATE/LOW adicionales. Bajo riesgo de regresión — el incremento es 16.2.3 → 16.2.9, misma serie menor. **Prioridad máxima.**

### Acción 2 — ADVERTENCIA: Actualizar `@anthropic-ai/sdk` a ≥0.91.1

```bash
# Cambiar en package.json a "^0.104.0" (semver ^0.89.0 no actualiza a 0.90+ automáticamente)
npm install @anthropic-ai/sdk@0.104.1
```

El salto 0.89 → 0.104 puede incluir cambios de API. Probar `/api/assistant/chat` (asistente Kyo) y el Estratega (streaming) en local antes de hacer deploy. Revisar el changelog de Anthropic SDK.

### Acción 3 — ADVERTENCIA: Planificar actualización de `nodemailer` a v9

```bash
npm install nodemailer@9.0.0 @types/nodemailer@latest
```

Sin CVE activo detectado hoy, pero v6 está 3 versiones mayores atrás. La API de transporte cambió entre v6 y v9; revisar uso en `src/app/api/aplicar/route.ts` y `src/app/api/contacto/route.ts`. Probar flujo completo de correo (IONOS SMTP) en local antes de subir a producción.

### Acción 4 — Transitivas: `npm audit fix`

```bash
npm audit fix
```

Resuelve `brace-expansion` (devDependency, no afecta producción). No usar `--force`.

### Acción 5 — INFO: Parches menores

```bash
npm install react@19.2.7 react-dom@19.2.7
```

Sin breaking changes esperados.

### No hacer
- No correr `npm audit fix --force` — puede degradar `next` a una versión antigua.
- No actualizar `nodemailer` en producción sin probar el flujo de correo en local primero.
- No actualizar `@anthropic-ai/sdk` sin probar Kyo y el Estratega en local.

---

*Generado automáticamente por el agente de mantenimiento. No modificar manualmente — regenerar con el mismo agente.*
