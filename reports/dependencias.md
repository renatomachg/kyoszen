# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-06-08

## Vulnerabilidades de Seguridad

### `next` 16.2.3 — CRITICO (multiples CVEs HIGH/MODERATE)

| Advisory | Severidad | CVSS | Descripcion | Fix |
|---|---|---|---|---|
| GHSA-8h8q-6873-q5fj | HIGH | 7.5 | Denial of Service con Server Components (CWE-770) | >= 16.2.5 |
| GHSA-26hh-7cqf-hhc6 | HIGH | 7.5 | Middleware/Proxy bypass en App Router — fix incompleto (CWE-288) | >= 16.2.6 |
| GHSA-mg66-mrh9-m8jx | HIGH | 7.5 | DoS via agotamiento de conexiones con Cache Components (CWE-770) | >= 16.2.5 |
| GHSA-gx5p-jg67-6x7h | MODERATE | 6.1 | XSS en scripts `beforeInteractive` con input no confiable (CWE-79) | >= 16.2.5 |
| GHSA-h64f-5h5j-jqjh | MODERATE | 5.9 | DoS en Image Optimization API (CWE-770) | >= 16.2.5 |
| GHSA-ffhc-5mcf-pf4q | MODERATE | 4.7 | XSS en App Router via CSP nonces (CWE-79) | >= 16.2.5 |
| GHSA-3g8h-86w9-wvmq | LOW | 3.7 | Cache poisoning via Middleware/Proxy redirects (CWE-349) | >= 16.2.5 |
| GHSA-vfv6-92ff-j949 | LOW | 3.7 | Cache poisoning via React Server Component cache-busting (CWE-328) | >= 16.2.5 |

### `nodemailer` <=8.0.4 — CRITICO (HIGH)

| Advisory | Severidad | Descripcion | Fix |
|---|---|---|---|
| — | HIGH | Vulnerabilidad en todas las versiones <= 8.0.4 incluyendo la rama v6 actualmente instalada | Actualizar a >= 8.0.5 (latest: 8.0.10) |

### `@anthropic-ai/sdk` 0.89.x — ADVERTENCIA (MODERATE)

| Advisory | Severidad | Descripcion | Fix |
|---|---|---|---|
| GHSA-p7fg-763f-g4gf | MODERATE | Permisos de archivo inseguros en la herramienta de memoria del filesystem local (CWE-732). Rango afectado: 0.79.0 – 0.91.0. | >= 0.91.1 (latest: 0.102.0) |

### Dependencias transitivas (MODERATE)

| Paquete | Advisory | CVSS | Descripcion | Via | Fix |
|---|---|---|---|---|---|
| `postcss` < 8.5.10 | GHSA-qx2v-qp2m-jg93 | 6.1 | XSS via `</style>` sin escapar en CSS Stringify (CWE-79) | `next` | Actualizar `next` a 16.2.7 |
| `brace-expansion` 5.0.2–5.0.5 | GHSA-jxxr-4gwj-5jf2 | 6.5 | DoS por rango numerico grande que evita proteccion `max` (CWE-400) | `@typescript-eslint` | `npm audit fix` |
| `ws` 8.0.0–8.20.0 | GHSA-58qx-3vcg-4xpx | 4.4 | Divulgacion de memoria no inicializada (CWE-908) | — | `npm audit fix` |

---

## Paquetes Desactualizados

| Paquete | Actual | Ultima Version | Severidad |
|---------|--------|----------------|-----------|
| `next` | 16.2.3 | **16.2.7** | CRITICO — 3 CVEs HIGH + 5 MODERATE/LOW; patch sin breaking changes |
| `nodemailer` | ~6.10.1 | **8.0.10** | CRITICO — vulnerabilidad HIGH en todas las v6/v7/v8<=8.0.4; 2 versiones mayores atras |
| `@anthropic-ai/sdk` | 0.89.0 | **0.102.0** | ADVERTENCIA — fix de seguridad en 0.91.1; salto grande de versiones |
| `lucide-react` | ~1.8.0 | 1.17.0 | INFO |
| `react` | 19.2.4 | 19.2.7 | INFO |
| `react-dom` | 19.2.4 | 19.2.7 | INFO |
| `@supabase/supabase-js` | ~2.103.0 | 2.108.0 | INFO |
| `framer-motion` | ~12.38.0 | 12.40.0 | INFO |
| `marked` | ~18.0.3 | 18.0.5 | INFO |

---

## Resumen

- **Total dependencias:** 530 (40 produccion · 455 desarrollo · 84 opcionales)
- **Vulnerabilidades criticas:** 0
- **Vulnerabilidades altas:** 2 paquetes directos (`next`, `nodemailer`)
- **Vulnerabilidades moderadas:** 4 (`@anthropic-ai/sdk`, `postcss`, `brace-expansion`, `ws`)
- **Total advisories:** 11 (en 6 paquetes distintos)
- **Paquetes desactualizados:** 9

---

## Recomendaciones

### Accion 1 — URGENTE: Actualizar `next` a 16.2.7

```bash
npm install next@16.2.7 eslint-config-next@16.2.7
```

Patch update que corrige 3 CVEs HIGH (DoS x3, CVSS 7.5 c/u), 3 MODERATE (XSS x2, DoS), y resuelve
las transitivas de `postcss` y los CVEs LOW de cache poisoning. Bajo riesgo de regresion.
La version 16.2.7 cubre todos los CVEs incluyendo el Middleware bypass (que requeria >=16.2.6).

### Accion 2 — URGENTE: Actualizar `nodemailer` a 8.0.10

```bash
npm install nodemailer@8.0.10 @types/nodemailer@latest
```

La rama v6 actualmente instalada tiene una vulnerabilidad HIGH activa. La API de transporte cambio
entre v6 y v8; revisar el uso actual en `src/app/api/aplicar/route.ts` y `src/app/api/contacto/route.ts`
antes de hacer deploy. Cambio tipico: `createTransport` mantiene firma similar pero opciones SMTP
y manejo de OAuth pueden diferir. Probar flujo completo de correo (IONOS SMTP) en local antes de subir.

### Accion 3 — ADVERTENCIA: Actualizar `@anthropic-ai/sdk` a >=0.91.1

```bash
npm install @anthropic-ai/sdk@0.102.0
```

La vulnerabilidad afecta la herramienta de memoria del filesystem local; Kyoszen no la usa
directamente (solo usa `messages.create` y streaming). El salto 0.89 → 0.102 puede incluir cambios
en la API; revisar changelog de Anthropic antes de hacer deploy. Probar `/api/assistant/chat` y
el Estratega (streaming) en local.

### Accion 4 — Transitivas: Ejecutar `npm audit fix`

```bash
npm audit fix
```

Resuelve `brace-expansion` y `ws` (dependencias de desarrollo/dev). No afecta
codigo de produccion pero mantiene el entorno limpio.

### Accion 5 — INFO: Parches menores

```bash
npm install react@19.2.7 react-dom@19.2.7
```

Sin breaking changes esperados.

### No hacer
- No correr `npm audit fix --force` — puede degradar `next` a una version antigua e inviable.
- No actualizar `nodemailer` en produccion sin probar el flujo de correo en local primero.
- No actualizar `@anthropic-ai/sdk` sin probar el asistente Kyo y el Estratega en local.

---

*Generado automaticamente — no modificar manualmente. Regenerar con el agente de mantenimiento.*
