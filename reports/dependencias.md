# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-08-03

## Vulnerabilidades de Seguridad

### 🔴 CRÍTICO / ALTO — `next` 16.2.3 (directa) — Fix: 16.2.12 (no breaking)

22 CVEs activos. Rango afectado: `9.3.4-canary.0 – 16.3.0-preview.7`.

Selección de más graves:

| Advisory | Descripción |
|----------|-------------|
| GHSA-267c-6grr-h53f / GHSA-26hh-7cqf-hhc6 | **Middleware/Proxy bypass** en App Router — permite omitir autenticación (rutas `/admin`, `/revisor`) |
| GHSA-ffhc-5mcf-pf4q | **XSS** en App Router con CSP nonces |
| GHSA-gx5p-jg67-6x7h | **XSS** en scripts `beforeInteractive` con input no confiable |
| GHSA-68g3-v927-f742 / GHSA-4633-3j49-mh5q | **Cache poisoning** en RSC y respuestas con UTF-8 inválido |
| GHSA-89xv-2m56-2m9x / GHSA-p9j2-gv94-2wf4 | **SSRF** en Server Actions y rewrites |
| GHSA-955p-x3mx-jcvp | **Exposición de endpoints internos** sin autenticación |
| GHSA-mg66-mrh9-m8jx / GHSA-8h8q-6873-q5fj | **DoS** en Cache Components e Image Optimization API |

> ⚠️ El bypass de middleware es especialmente crítico: el proyecto usa App Router con rutas protegidas.
> Fix no breaking: `npm install next@16.2.12 eslint-config-next@16.2.12`

---

### 🔴 ALTO — `nodemailer` 6.10.1 (directa) — Fix: 9.0.3 (cambio mayor)

8 CVEs activos. Rango afectado: `<=9.0.0`.

| Advisory | Descripción |
|----------|-------------|
| GHSA-c7w3-x93f-qmm8 / GHSA-vvjj-xcjg-gr5g | **SMTP Command Injection** vía CRLF en envelope.size y nombre de transporte |
| GHSA-268h-hp4c-crq3 | **Header injection** en cabeceras List-* |
| GHSA-p6gq-j5cr-w38f | **Lectura arbitraria de archivos y SSRF** via opción `raw` |
| GHSA-r7g4-qg5f-qqm2 | **Validación TLS incorrecta** en OAuth2 token fetch |
| GHSA-rcmh-qjqh-p98v | **DoS** en addressparser por recursión |

> Fix requiere upgrade mayor a v9. Revisar breaking changes antes de actualizar.

---

### 🟡 MODERADO — `@anthropic-ai/sdk` 0.89.0 (directa) — Fix: >=0.91.1 (último: 0.115.0)

| Advisory | Severidad | Descripción |
|----------|-----------|-------------|
| GHSA-p7fg-763f-g4gf | Moderada | **Permisos inseguros** en Local Filesystem Memory Tool (CWE-732). La herramienta no se usa en Kyoszen, impacto directo bajo. |

---

### 🔵 INFO — Dependencias indirectas (transitivas)

| Paquete | Severidad | Descripción |
|---------|-----------|-------------|
| `brace-expansion` | Alta | DoS via expansión ilimitada (3 CVEs, CVSS 7.5) — transitiva de eslint/typescript |
| `js-yaml` | Alta | DoS via merge-key chains (2 CVEs, CVSS 7.5) — transitiva de herramientas de build |
| `postcss` | Alta | Vulnerabilidad en procesamiento CSS — transitiva de tailwindcss |
| `sharp` | Alta | Vulnerabilidad en procesamiento de imágenes — transitiva de next |
| `ws` | Alta | Vulnerabilidad en WebSocket — transitiva |
| `@babel/core` | Baja | Lectura arbitraria de archivo via sourceMappingURL (CVSS 3.2) — transitiva |

Las indirectas se resuelven en su mayoría actualizando `next` a 16.2.12.

---

## Paquetes Desactualizados

| Paquete | Instalada | Última | Tipo | Severidad |
|---------|-----------|--------|------|-----------|
| `next` | 16.2.3 | **16.2.12** | patch | 🔴 CRÍTICO — 22 CVEs incluyendo XSS, SSRF y bypass de auth |
| `nodemailer` | 6.10.1 | **9.0.3** | mayor (v6→v9) | 🔴 CRÍTICO — 8 CVEs de SMTP injection y SSRF |
| `@anthropic-ai/sdk` | 0.89.0 | **0.115.0** | mayor | 🟡 ADVERTENCIA — 1 CVE moderado, 26 versiones de atraso |
| `react` | 19.2.4 | **19.2.8** | patch | 🔵 INFO |
| `react-dom` | 19.2.4 | **19.2.8** | patch | 🔵 INFO |
| `@supabase/supabase-js` | ~2.103.x | **2.112.0** | menor | 🔵 INFO |
| `lucide-react` | ~1.8.x | **1.28.0** | menor | 🔵 INFO |
| `framer-motion` | ~12.38.x | **12.43.0** | patch | 🔵 INFO |
| `marked` | ~18.0.x | **18.0.7** | patch | 🔵 INFO |
| `unpdf` | ~1.6.x | **1.8.0** | menor | 🔵 INFO |

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total paquetes instalados | 531 (41 prod · 455 dev · 84 opcional) |
| Dependencias directas en package.json | 21 (10 deps + 11 devDeps) |
| Vulnerabilidades totales | **9** (0 críticas · 7 altas · 1 moderada · 1 baja) |
| Dependencias directas vulnerables | **3** (`next`, `nodemailer`, `@anthropic-ai/sdk`) |
| Paquetes directos desactualizados con diff notable | **3** (`next`, `nodemailer`, `@anthropic-ai/sdk`) |

---

## Recomendaciones

### Acción 1 — URGENTE: `next` 16.2.3 → 16.2.12

```bash
npm install next@16.2.12 eslint-config-next@16.2.12
npm run build
# Probar en local (localhost:3002) → aprobar → deploy a VPS
```

Cierra 22 CVEs incluyendo bypass de autenticación en rutas `/admin` y `/revisor`. Patch sin breaking changes.

### Acción 2 — PLANIFICADA: `nodemailer` 6 → 9

Antes de actualizar, revisar estos archivos para compatibilidad de API:
- `src/app/api/aplicar/route.ts`
- `src/app/api/contacto/route.ts`
- Rutas de `/api/admin/social/` que envían notificaciones

```bash
npm install nodemailer@9.0.3
# @types/nodemailer es innecesario en v9 (tipos incluidos)
# Probar flujo SMTP IONOS en local y verificar entrega antes de deploy
```

### Acción 3 — EVALUAR: `@anthropic-ai/sdk` 0.89.0 → 0.115.0

Salto mayor. Antes de deploy, probar:
- Kyo (`/api/assistant/chat`) — tool-use con haiku
- Estratega (`/admin/estratega`) — streaming con opus
- Importador de planes — haiku parsing

```bash
npm install @anthropic-ai/sdk@^0.115.0
```

### Acción 4 — INFO: parches sin riesgo

```bash
npm install react@19.2.8 react-dom@19.2.8
```

### Después de las actualizaciones

```bash
npm audit fix --dry-run   # revisar qué va a cambiar
npm audit fix             # aplicar fixes automáticos de dependencias indirectas
```

### No hacer
- No correr `npm audit fix --force` — puede degradar versiones principales.
- No deployar `nodemailer@9` sin probar el flujo SMTP en local primero.
- No deployar `@anthropic-ai/sdk@0.115.0` sin probar Kyo y el Estratega en local.

---

*Generado automáticamente por el agente de mantenimiento — 2026-08-03.*
