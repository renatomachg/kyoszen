# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-07-20

## Vulnerabilidades de Seguridad

### CRITICO / ALTO

#### `next` — instalado: 16.2.3 | Fix: 16.2.10 (sin breaking changes)

| Advisory | Severidad | CVSS | Descripción |
|----------|-----------|------|-------------|
| GHSA-c4j6-fc7j-m34r | HIGH | 8.6 | SSRF en aplicaciones con WebSocket upgrades |
| GHSA-492v-c6pp-mqqv | HIGH | 8.1 | Middleware/Proxy bypass vía inyección de parámetros de ruta dinámica (bypass de autenticación) |
| GHSA-8h8q-6873-q5fj | HIGH | 7.5 | DoS con Server Components |
| GHSA-mg66-mrh9-m8jx | HIGH | 7.5 | DoS por agotamiento de conexiones en Cache Components |
| GHSA-26hh-7cqf-hhc6 | HIGH | 7.5 | Middleware/Proxy bypass vía segment-prefetch routes (fix incompleto anterior) |
| GHSA-267c-6grr-h53f | HIGH | 7.5 | Middleware/Proxy bypass en App Router |
| GHSA-36qx-fr4f-26g5 | HIGH | 7.5 | Middleware/Proxy bypass en Pages Router con i18n |
| GHSA-gx5p-jg67-6x7h | MODERATE | 6.1 | XSS en scripts `beforeInteractive` con input no saneado |
| GHSA-h64f-5h5j-jqjh | MODERATE | 5.9 | DoS en la API de optimización de imágenes |
| GHSA-wfc6-r584-vfw7 | MODERATE | 5.4 | Cache poisoning en respuestas de React Server Components |
| GHSA-ffhc-5mcf-pf4q | MODERATE | 4.7 | XSS en App Router con CSP nonces |
| GHSA-3g8h-86w9-wvmq | LOW | 3.7 | Cache poisoning en redirects de Middleware/Proxy |
| GHSA-vfv6-92ff-j949 | LOW | 3.7 | Cache poisoning en cache-busting de React Server Components |

> El fix es actualizar a 16.2.10. Misma versión mayor, sin breaking changes.

---

#### `nodemailer` — instalado: 6.10.1 | Fix: 9.0.3 (breaking change — v6→v9)

| Advisory | Severidad | Descripción |
|----------|-----------|-------------|
| — | HIGH | SMTP command injection vía `envelope.size` no saneado |
| — | HIGH | SMTP command injection vía CRLF en Transport name (EHLO/HELO) |
| — | HIGH | CRLF injection en encabezados List-* (message header injection) |
| — | HIGH | Validación incorrecta de certificado TLS en OAuth2 Token Fetch (interception de credenciales) |
| — | HIGH | Email enviado a dominio no intencionado por conflicto de interpretación |
| — | HIGH | `jsonTransport` bypasses `disableFileAccess`/`disableUrlAccess` en normalización del mensaje |
| — | HIGH | Opción `raw` a nivel mensaje permite lectura de archivos arbitrarios y SSRF |
| — | HIGH | DoS por llamadas recursivas en `addressparser` |

> Requiere salto a v9 (breaking change). Revisar changelog y probar flujo SMTP IONOS en local antes de hacer deploy.

---

#### `ws` — versión indirecta (vía Next.js)

| Advisory | Severidad | Descripción |
|----------|-----------|-------------|
| — | HIGH | Divulgación de memoria no inicializada |
| — | HIGH | DoS por agotamiento de memoria via fragmentos y chunks pequeños |

> Se resuelve actualizando `next` a 16.2.10.

---

### MODERADO

#### `@anthropic-ai/sdk` — instalado: 0.89.0 | Fix: ≥0.91.1 (última: 0.112.3)

| Advisory | Severidad | Descripción |
|----------|-----------|-------------|
| GHSA-p7fg-763f-g4gf | MODERATE | Permisos de archivo inseguros en la herramienta de memoria de sistema de archivos local (CWE-732). Rango afectado: 0.79.0–0.91.0. |

> La herramienta vulnerable (Local Filesystem Memory) no se usa en Kyoszen, pero la versión instalada acumula 22 versiones de atraso (0.89→0.111). Actualizar recomendable.

---

### BAJO (dependencias indirectas — se resuelven al actualizar deps directas)

| Paquete | Advisory | Severidad | Descripción |
|---------|----------|-----------|-------------|
| `brace-expansion` 5.0.2–5.0.5 | GHSA-jxxr-4gwj-5jf2 | MODERATE | DoS: rango numérico grande supera protección `max` |
| `js-yaml` 4.0.0–4.1.1 | GHSA-h67p-54hq-rp68 | MODERATE | DoS por complejidad cuadrática en claves merge con alias repetidos |
| `postcss` | — | MODERATE | XSS via `</style>` sin escapar en CSS Stringify Output |
| `@babel/core` ≤7.29.0 | GHSA-4x5r-pxfx-6jf8 | LOW | Lectura arbitraria de archivos vía `sourceMappingURL` |

---

## Paquetes Desactualizados

| Paquete | Instalado | Última versión | Severidad |
|---------|-----------|----------------|-----------|
| `next` | 16.2.3 | **16.2.10** | CRITICO — 13+ CVEs (SSRF 8.6, bypass auth 8.1, DoS), patch sin breaking changes |
| `nodemailer` | 6.10.1 | **9.0.3** | CRITICO — 8 CVEs HIGH incluyendo inyección SMTP y SSRF, salto de 3 versiones mayores |
| `@anthropic-ai/sdk` | 0.89.0 | **0.112.3** | ADVERTENCIA — CVE moderado, 23+ versiones de atraso |
| `react` | 19.2.4 | 19.2.7 | INFO — parches menores |
| `react-dom` | 19.2.4 | 19.2.7 | INFO — parches menores |
| `@supabase/supabase-js` | ✅ al día | 2.110.3 | OK |
| `framer-motion` | ✅ al día | 12.42.2 | OK |
| `lucide-react` | ✅ al día | 1.24.0 | OK |
| `marked` | ✅ al día | 18.0.6 | OK |
| `unpdf` | ✅ al día | 1.6.2 | OK |

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total paquetes directos | 20 (10 deps + 10 devDeps) |
| Paquetes con vulnerabilidades | 8 |
| — Críticas | 0 |
| — Altas | 3 paquetes (`next`, `nodemailer`, `ws` indirecta) |
| — Moderadas | 4 (`@anthropic-ai/sdk`, `brace-expansion`, `js-yaml`, `postcss`) |
| — Bajas | 1 (`@babel/core`) |
| CVEs de severidad alta activos | 17 (next: 7, nodemailer: 8, ws: 2) |
| Paquetes directos desactualizados | 5 |
| Paquetes directos con CVEs activos | 3 (`next`, `nodemailer`, `@anthropic-ai/sdk`) |

---

## Recomendaciones

### Acción 1 — URGENTE: actualizar `next` a 16.2.10

```bash
npm install next@16.2.10 eslint-config-next@16.2.10
npm run build
# Probar en local (localhost:3002) → aprobar → deploy a VPS
```

Resuelve 13+ advisories de un golpe, incluyendo SSRF (8.6), bypass de autenticación (8.1) y DoS. Sin riesgo de regresión (patch 16.2.3→16.2.10). También cierra las 2 vulnerabilidades HIGH de `ws` que son indirectas vía Next.js.

### Acción 2 — URGENTE: actualizar `nodemailer` a v9

```bash
npm install nodemailer@^9 @types/nodemailer@latest
```

Revisar API de `createTransport` y opciones SMTP — hubo cambios en v7+. Archivos afectados:
- `src/app/api/aplicar/route.ts`
- `src/app/api/contacto/route.ts`
- `src/app/api/admin/social/` (rutas que envíen correo)
- `src/app/api/admin/resumen/route.ts`

Probar flujo completo de correo IONOS en local antes de hacer deploy.

### Acción 3 — RECOMENDADA: actualizar `@anthropic-ai/sdk`

```bash
npm install @anthropic-ai/sdk@0.112.3
```

Probar Kyo (`/api/assistant/chat`) y el Estratega (streaming) en local antes de deploy. Verificar que los schemas de tool-use no hayan cambiado con el salto de versión mayor.

### Acción 4 — INFO: parches menores (próximo ciclo de mantenimiento)

```bash
npm install react@19.2.7 react-dom@19.2.7
```

### No hacer
- No correr `npm audit fix --force` — puede degradar `next` a una versión antigua o introducir cambios no probados.
- No actualizar `nodemailer` en producción sin probar el flujo SMTP IONOS en local primero.
- No actualizar `@anthropic-ai/sdk` sin probar Kyo y el Estratega en local.

---

*Generado automáticamente por el agente de mantenimiento — 2026-07-20. No modificar manualmente.*
