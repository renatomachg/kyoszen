# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-05-18

## Vulnerabilidades de Seguridad

### `next` 16.2.3 — CRITICO (multiples CVEs HIGH)

| Advisory | Severidad | CVSS | Descripcion | Fix |
|---|---|---|---|---|
| GHSA-c4j6-fc7j-m34r | HIGH | 8.6 | SSRF via WebSocket upgrades (CWE-918) | >= 16.2.5 |
| GHSA-492v-c6pp-mqqv | HIGH | 8.1 | Middleware/Proxy bypass por inyeccion de parametros dinamicos (CWE-288) | >= 16.2.5 |
| GHSA-8h8q-6873-q5fj | HIGH | 7.5 | Denial of Service con Server Components (CWE-770) | >= 16.2.5 |
| GHSA-26hh-7cqf-hhc6 | HIGH | 7.5 | Middleware/Proxy bypass en App Router — fix incompleto seguimiento (CWE-288) | >= 16.2.6 |
| GHSA-mg66-mrh9-m8jx | HIGH | 7.5 | DoS via agotamiento de conexiones con Cache Components (CWE-770) | >= 16.2.5 |
| GHSA-gx5p-jg67-6x7h | MODERATE | 6.1 | XSS en scripts `beforeInteractive` con input no confiable (CWE-79) | >= 16.2.5 |
| GHSA-h64f-5h5j-jqjh | MODERATE | 5.9 | DoS en Image Optimization API (CWE-770) | >= 16.2.5 |
| GHSA-ffhc-5mcf-pf4q | MODERATE | 4.7 | XSS en App Router con CSP nonces (CWE-79) | >= 16.2.5 |
| GHSA-3g8h-86w9-wvmq | LOW | 3.7 | Cache poisoning via Middleware/Proxy redirects (CWE-349) | >= 16.2.5 |
| GHSA-vfv6-92ff-j949 | LOW | 3.7 | Cache poisoning via React Server Component cache-busting (CWE-328) | >= 16.2.5 |

### `@anthropic-ai/sdk` 0.89.0 — ADVERTENCIA (MODERATE)

| Advisory | Severidad | Descripcion | Fix |
|---|---|---|---|
| GHSA-p7fg-763f-g4gf | MODERATE | Permisos de archivo inseguros en la herramienta de memoria del filesystem local (CWE-732). Afecta 0.79.0 – 0.91.0. | >= 0.91.1 |

---

## Paquetes Desactualizados

| Paquete | Actual | Ultima Version | Severidad |
|---------|--------|----------------|-----------|
| `next` | 16.2.3 | 16.2.6 | CRITICO — multiples CVEs HIGH, actualizar urgente |
| `@anthropic-ai/sdk` | 0.89.0 | 0.96.0 | ADVERTENCIA — fix de seguridad disponible en 0.91.1 |
| `nodemailer` | ~6.9.x | 8.0.7 | ADVERTENCIA — 2 versiones mayores atras (v6 → v8) |
| `react` | 19.2.4 | 19.2.6 | INFO — parche menor disponible |
| `react-dom` | 19.2.4 | 19.2.6 | INFO — parche menor disponible |

> Paquetes al dia: `@supabase/supabase-js` (2.106.0), `framer-motion` (12.39.0), `lucide-react` (1.16.0)

---

## Resumen

- **Total paquetes directos:** 16 (8 produccion + 8 desarrollo)
- **Vulnerabilidades:** 2 paquetes afectados — 11 advisories en total (5 HIGH, 4 MODERATE, 2 LOW)
- **Desactualizados:** 5 paquetes (2 con advertencia de seguridad, 1 con advertencia de version, 2 informativos)

---

## Recomendaciones

### Accion 1 — URGENTE: Actualizar `next` a 16.2.6

```bash
npm install next@16.2.6 eslint-config-next@16.2.6
```

Corrige los 10 advisories listados, incluyendo 5 HIGH (SSRF CVSS 8.6, Middleware bypass CVSS 8.1, DoS x3).
La version 16.2.6 cubre el advisory GHSA-26hh-7cqf-hhc6 que requiere exactamente >=16.2.6.

### Accion 2 — URGENTE: Actualizar `@anthropic-ai/sdk` a 0.96.0

```bash
npm install @anthropic-ai/sdk@0.96.0
```

La version instalada (0.89.0) tiene permisos inseguros en la herramienta de memoria del filesystem.
El fix minimo es 0.91.1; la ultima estable es 0.96.0. Revisar changelog antes de hacer deploy
(salto de 0.89 → 0.96 puede incluir cambios en la API del asistente Kyo).

### Accion 3 — ADVERTENCIA: Evaluar migracion de `nodemailer` a v8

```bash
npm install nodemailer@latest @types/nodemailer@latest
```

Dos versiones mayores de diferencia (v6 → v8). Revisar changelog oficial por breaking changes
en la API de transporte antes de actualizar; no es urgente si el flujo de correo funciona.

### Accion 4 — INFO: Actualizar `react` y `react-dom`

```bash
npm install react@19.2.6 react-dom@19.2.6
```

Parches menores sin breaking changes esperados.

### No hacer
- No correr `npm audit fix --force` — puede degradar `next` a una version antigua e inviable.

---

*Generado automaticamente — no modificar manualmente. Regenerar con el agente de mantenimiento.*
