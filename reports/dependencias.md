# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-07-27

## Vulnerabilidades de Seguridad

### 🔴 CRÍTICO / ALTA — `next` (instalado: 16.2.3)

Múltiples CVEs activos. Rango afectado: `>=16.0.0 <16.2.6`:

| Advisory | Severidad | CVSS | Descripción |
|----------|-----------|------|-------------|
| GHSA-8h8q-6873-q5fj | **Alta** | 7.5 | DoS via Server Components — agotamiento de memoria |
| GHSA-26hh-7cqf-hhc6 | **Alta** | 7.5 | Middleware/Proxy bypass en App Router (bypass de autenticación) |
| GHSA-gx5p-jg67-6x7h | Moderada | 6.1 | XSS en scripts `beforeInteractive` con input no confiable |
| GHSA-ffhc-5mcf-pf4q | Moderada | 4.7 | XSS en App Router con CSP nonces |
| GHSA-mg66-mrh9-m8jx | (Alta) | — | DoS por agotamiento de conexiones en Cache Components |
| GHSA-3g8h-86w9-wvmq | Baja | 3.7 | Cache poisoning via redirects de Middleware |
| GHSA-vfv6-92ff-j949 | Baja | 3.7 | Cache poisoning en React Server Component cache-busting |

> ⚠️ El bypass de middleware (GHSA-26hh-7cqf-hhc6) es especialmente relevante: el proyecto usa App Router con rutas protegidas (`/admin`, `/revisor`). Fix disponible en `16.2.6+`, última disponible `16.2.12`.

---

### 🟠 MODERADA — `@anthropic-ai/sdk` (instalado: ~0.89.0)

| Advisory | Severidad | Descripción |
|----------|-----------|-------------|
| GHSA-p7fg-763f-g4gf | Moderada | Permisos de archivo inseguros en Local Filesystem Memory Tool (CWE-732). Rango: 0.79.0–0.91.0. |

Fix disponible en `>=0.91.1`. La herramienta vulnerable no se usa en Kyoszen, pero la versión acumula 26 versiones de atraso. Latest: `0.115.0`.

---

### 🟡 ALTA (indirecta) — `brace-expansion` y `js-yaml`

Dependencias transitivas con CVEs de DoS. CVSS máximo: 7.5. Se resuelven al actualizar las dependencias padre.

| Paquete | Advisory | Severidad | CVSS |
|---------|----------|-----------|------|
| `brace-expansion` | GHSA-jxxr-4gwj-5jf2, GHSA-3jxr-9vmj-r5cp, GHSA-mh99-v99m-4gvg | Alta | 7.5 |
| `js-yaml` | GHSA-h67p-54hq-rp68, GHSA-52cp-r559-cp3m | Alta | 7.5 |

---

### 🟢 BAJA (indirecta) — `@babel/core`

| Advisory | Severidad | CVSS |
|----------|-----------|------|
| GHSA-4x5r-pxfx-6jf8 | Baja | 3.2 |

Arbitrary File Read via `sourceMappingURL`. Impacto bajo en entorno de servidor. Fix disponible.

---

## Paquetes Desactualizados

| Paquete | Instalado | Última versión | Severidad |
|---------|-----------|----------------|-----------|
| `next` | 16.2.3 | **16.2.12** | 🔴 CRÍTICO — contiene fixes de seguridad (múltiples CVEs ALTOS) |
| `@anthropic-ai/sdk` | ~0.89.0 | **0.115.0** | 🟠 ADVERTENCIA — CVE moderado, 26 versiones de atraso |
| `nodemailer` | ^6.9.0 (resuelve 6.10.1) | **9.0.3** | 🟠 ADVERTENCIA — salto de 3 versiones mayores (6→9), puede requerir migración de API |
| `react` | 19.2.4 | **19.2.8** | ℹ️ INFO — parche menor |
| `react-dom` | 19.2.4 | **19.2.8** | ℹ️ INFO — parche menor |
| `@supabase/supabase-js` | ✅ al día | 2.110.9 | OK |
| `framer-motion` | ✅ al día | 12.42.2 | OK |
| `lucide-react` | ✅ al día | 1.27.0 | OK |
| `marked` | ✅ al día | 18.0.7 | OK |
| `unpdf` | ✅ al día | 1.8.0 | OK |

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total paquetes directos | 21 (10 deps + 11 devDeps) |
| Vulnerabilidades directas activas | 2 (`next`, `@anthropic-ai/sdk`) |
| Vulnerabilidades indirectas | 3 (`brace-expansion`, `js-yaml`, `@babel/core`) |
| CVEs de severidad ALTA activos | 9+ (next: 5+, brace-expansion: 4, js-yaml: 2) |
| Paquetes directos desactualizados | 3 con diferencia notable (`next`, `@anthropic-ai/sdk`, `nodemailer`) |

---

## Recomendaciones

### Acción 1 — URGENTE: actualizar `next` a 16.2.12

```bash
npm install next@16.2.12 eslint-config-next@16.2.12
npm run build
# Probar en local (localhost:3002) → aprobar → deploy a VPS
```

Cierra múltiples CVEs incluyendo el bypass de autenticación en App Router (GHSA-26hh-7cqf-hhc6 CVSS 7.5). Patch sin breaking changes (16.2.3→16.2.12).

### Acción 2 — RECOMENDADA: actualizar `@anthropic-ai/sdk` a >=0.91.1

```bash
npm install @anthropic-ai/sdk@0.115.0
```

Es un salto mayor (0.89→0.115). Antes de hacer deploy, probar:
- Kyo (`/api/assistant/chat`) — tool-use con haiku
- Estratega (`/admin/estratega`) — streaming con opus
- Importador de planes — haiku parsing

### Acción 3 — EVALUAR: `nodemailer` v9

`nodemailer@9` introduce breaking changes respecto a v6. Antes de actualizar, revisar:
- `src/app/api/aplicar/route.ts`
- `src/app/api/contacto/route.ts`
- Rutas de `/api/admin/social/` que envíen notificaciones por correo
- Probar flujo SMTP IONOS en local y verificar entrega a renatomachg@gmail.com

### Acción 4 — INFO: parches menores (próximo ciclo de mantenimiento)

```bash
npm install react@19.2.8 react-dom@19.2.8
```

### Limpiar vulnerabilidades indirectas

Después de actualizar `next` y `@anthropic-ai/sdk`:

```bash
npm audit fix --dry-run   # revisar qué va a cambiar
npm audit fix
```

### No hacer
- No correr `npm audit fix --force` — puede degradar versiones principales.
- No deployar `nodemailer@9` sin probar el flujo SMTP IONOS en local primero.
- No deployar `@anthropic-ai/sdk@0.115.0` sin probar Kyo y el Estratega en local.

---

*Generado automáticamente por el agente de mantenimiento — 2026-07-27.*
