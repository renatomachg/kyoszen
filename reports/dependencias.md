# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-06-22

## Vulnerabilidades de Seguridad

### CRÍTICO — HIGH (acción inmediata)

#### `next` 16.2.3 → corregido en 16.2.9

13 vulnerabilidades HIGH en el rango `9.3.4-canary.0 – 16.3.0-canary.5`. El fix es un **patch** sin breaking changes.

| Advisory | Descripción |
|----------|-------------|
| GHSA-8h8q-6873-q5fj | DoS con Server Components (CWE-770, CVSS 7.5) |
| GHSA-26hh-7cqf-hhc6 | Middleware/Proxy bypass via segment-prefetch — fix incompleto (CWE-288) |
| GHSA-267c-6grr-h53f | Middleware/Proxy bypass en App Router (CWE-288) |
| GHSA-492v-c6pp-mqqv | Middleware bypass via inyección de parámetros de ruta dinámica |
| GHSA-36qx-fr4f-26g5 | Middleware bypass en Pages Router con i18n |
| GHSA-gx5p-jg67-6x7h | XSS en scripts `beforeInteractive` con input no confiable (CWE-79) |
| GHSA-ffhc-5mcf-pf4q | XSS en App Router con CSP nonces (CWE-79) |
| GHSA-vfv6-92ff-j949 | Cache poisoning en respuestas RSC (CWE-328) |
| GHSA-wfc6-r584-vfw7 | Cache poisoning adicional en RSC |
| GHSA-3g8h-86w9-wvmq | Cache poisoning vía Middleware/Proxy redirects |
| GHSA-c4j6-fc7j-m34r | SSRF vía WebSocket upgrades |
| GHSA-h64f-5h5j-jqjh | DoS en Image Optimization API |
| GHSA-mg66-mrh9-m8jx | DoS vía agotamiento de conexiones con Cache Components |

**Fix:** `npm install next@16.2.9 eslint-config-next@16.2.9` (patch, sin breaking changes)

---

#### `nodemailer` ≤9.0.0 → corregido en 9.0.1

8 vulnerabilidades HIGH. Kyoszen usa nodemailer para correos del revisor, notificaciones y alertas SMTP (IONOS).

| Advisory | Descripción |
|----------|-------------|
| GHSA-c7w3-x93f-qmm8 | SMTP command injection vía `envelope.size` sin sanitizar |
| GHSA-vvjj-xcjg-gr5g | SMTP command injection vía CRLF en nombre de transporte (EHLO/HELO) |
| GHSA-268h-hp4c-crq3 | CRLF injection en cabeceras `List-*` → inyección de headers |
| GHSA-mm7p-fcc7-pg87 | Correo enviado a dominio no deseado (interpretation conflict) |
| GHSA-rcmh-qjqh-p98v | DoS en `addressparser` por llamadas recursivas |
| GHSA-wqvq-jvpq-h66f | `jsonTransport` bypassa `disableFileAccess`/`disableUrlAccess` |
| GHSA-r7g4-qg5f-qqm2 | TLS incorrecto en OAuth2 token fetch — permite intercepción de credenciales |
| GHSA-p6gq-j5cr-w38f | Opción `raw` bypassa acceso a archivos/URLs → SSRF + lectura de archivos |

**Fix:** `npm install nodemailer@9.0.1` — **cambio mayor** (v6→v9); revisar API antes de actualizar.

---

#### `ws` (dependencia transitiva) → corregido vía `npm audit fix`

| Advisory | Descripción |
|----------|-------------|
| GHSA-58qx-3vcg-4xpx | Divulgación de memoria no inicializada |
| GHSA-96hv-2xvq-fx4p | Memory exhaustion DoS por fragmentos pequeños |

**Fix:** `npm audit fix`

---

### ADVERTENCIA — MODERATE

| Paquete | Advisory | Descripción | Fix |
|---------|----------|-------------|-----|
| `@anthropic-ai/sdk` 0.89.x | GHSA-p7fg-763f-g4gf | Permisos inseguros en Local Filesystem Memory Tool (CWE-732). Rango afectado: 0.79.0–0.91.0. | `npm install @anthropic-ai/sdk@0.105.0` (cambio mayor) |
| `postcss` (transitiva) | GHSA-qx2v-qp2m-jg93 | XSS vía `</style>` sin escapar en CSS stringify | Se resuelve al actualizar `next@16.2.9` |
| `brace-expansion` (transitiva) | GHSA-jxxr-4gwj-5jf2 | DoS por rango numérico grande (CWE-400) | `npm audit fix` |
| `js-yaml` (transitiva) | GHSA-h67p-54hq-rp68 | DoS cuadrático en merge key handling (CWE-407) | `npm audit fix` |

---

### BAJA — LOW

| Paquete | Advisory | Descripción | Fix |
|---------|----------|-------------|-----|
| `@babel/core` (transitiva) | GHSA-4x5r-pxfx-6jf8 | Lectura arbitraria de archivos vía `sourceMappingURL` (CWE-22/200) | `npm audit fix` |

---

## Paquetes Desactualizados

| Paquete | Instalado | Última versión | Severidad |
|---------|-----------|----------------|-----------|
| `next` | 16.2.3 (pin exacto) | **16.2.9** | CRÍTICO — 13 vulns HIGH, patch sin breaking changes |
| `nodemailer` | ~6.9.x | **9.0.1** | CRÍTICO — 8 vulns HIGH, cambio mayor (v6→v9) |
| `@anthropic-ai/sdk` | ~0.89.x | **0.105.0** | ADVERTENCIA — vuln MODERATE, cambio mayor |
| `@supabase/supabase-js` | ~2.103.x | 2.108.2 | INFO |
| `framer-motion` | ~12.38.x | 12.40.0 | INFO |
| `lucide-react` | ~1.8.x | 1.21.0 | INFO |
| `react` | 19.2.4 | 19.2.7 | INFO |
| `react-dom` | 19.2.4 | 19.2.7 | INFO |
| `marked` | ~18.0.x | 18.0.5 | INFO |

---

## Resumen

- Total paquetes instalados: 531 (41 producción · 455 dev · 84 opcionales)
- Total paquetes directos declarados: 22 (10 deps + 12 devDeps)
- **Vulnerabilidades detectadas: 8 paquetes afectados**
  - Altas: 3 (next, nodemailer, ws transitiva)
  - Moderadas: 4 (@anthropic-ai/sdk, postcss, brace-expansion, js-yaml)
  - Bajas: 1 (@babel/core transitiva)
  - Críticas: 0
- Paquetes directos desactualizados con CVEs: 3 (next, nodemailer, @anthropic-ai/sdk)

---

## Recomendaciones

### Acción 1 — URGENTE: actualizar `next` a 16.2.9

```bash
# En package.json cambiar: "next": "16.2.9", "eslint-config-next": "16.2.9"
npm install
npm run build
# Probar en local (localhost:3002) → aprobar → deploy a VPS
```

Resuelve 13 vulns HIGH + postcss MODERATE. Riesgo de regresión mínimo (patch 16.2.3→16.2.9).

### Acción 2 — URGENTE: `npm audit fix` para transitivas

```bash
npm audit fix
# Resuelve: ws (2 HIGH), brace-expansion (MODERATE), js-yaml (MODERATE), @babel/core (LOW)
# NO usar --force
```

### Acción 3 — PRIORIDAD MEDIA: actualizar `nodemailer` a 9.0.1

```bash
npm install nodemailer@9.0.1 @types/nodemailer@latest
```

Cambio mayor (v6→v9) — revisar API antes de actualizar. Archivos afectados:
- `src/app/api/aplicar/route.ts`
- `src/app/api/contacto/route.ts`
- Todas las rutas en `src/app/api/admin/social/` que envíen correo
- Configuración SMTP en `site_config` (IONOS, puerto 465)

### Acción 4 — PRIORIDAD MEDIA: actualizar `@anthropic-ai/sdk` a 0.105.0

```bash
npm install @anthropic-ai/sdk@0.105.0
```

La vulnerabilidad (permisos en Filesystem Memory Tool) no impacta directamente el uso actual de Kyoszen (solo usa tool-use web), pero es buena práctica salir del rango vulnerable. Revisar changelog y probar `/api/assistant/chat` (Kyo), Estratega (streaming) e importadores de contenido en local antes de hacer deploy.

### Acción 5 — INFO: parches menores (próximo ciclo de mantenimiento)

```bash
npm install react@19.2.7 react-dom@19.2.7
```

### No hacer
- No correr `npm audit fix --force` — puede degradar `next` a una versión antigua.
- No actualizar `nodemailer` en producción sin probar flujo completo de correo SMTP en local primero.
- No actualizar `@anthropic-ai/sdk` sin probar Kyo y el Estratega en local.

---

*Generado automáticamente por el agente de mantenimiento. No modificar manualmente — regenerar con el mismo agente.*
