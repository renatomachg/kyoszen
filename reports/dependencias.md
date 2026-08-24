# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-08-24

---

## Vulnerabilidades de Seguridad

### 🔴 HIGH — `next` (directo)
- **Rango afectado:** 9.3.4-canary.0 – 16.3.0-preview.10
- **Versión actual:** 16.2.3 | **Fix disponible:** 16.3.2 (actualización menor, NO rompe API)
- **Descripción:** Next.js Vulnerable to Denial of Service con Server Components
- **Fix secundario incluido:** postcss (XSS via `</style>` en CSS Stringify) y sharp (CVEs en libvips: CVE-2026-33327, CVE-2026-33328)
- **⚡ ACCIÓN RECOMENDADA: Actualizar next a 16.3.2 — es minor bump y corrige 3 vulnerabilidades HIGH.**

### 🔴 HIGH — `nodemailer` (directo)
- **Rango afectado:** ≤9.0.0
- **Versión actual:** 6.9.0 | **Fix disponible:** 9.0.5 (major bump)
- **Descripción:** Interpretación conflictiva de dominio puede enviar correos a dominio no intencionado
- **Nota:** El salto es major (v6→v9); revisar cambios de API antes de actualizar.

### 🔴 HIGH — `puppeteer` (directo, solo devDependency)
- **Rango afectado:** 19.8.1 – 24.43.1
- **Versión actual:** 24.43.1 | **Fix disponible:** 25.8.0 (major bump)
- **Sub-dependencias afectadas:** `@puppeteer/browsers` (≤2.13.2) — path traversal en extract-zip
- **Nota:** Puppeteer se usa solo para generar PDFs en el VPS. El riesgo es bajo en producción ya que no procesa archivos de usuarios.

### 🔴 HIGH — `brace-expansion` (indirecta)
- **Rango afectado:** ≤1.1.17 || 3.0.0–5.0.8
- **Descripción:** Múltiples CVEs de DoS — expansión exponencial desborda memoria
- **Fix:** Disponible vía actualización de dependencias padres.

### 🔴 HIGH — `ws` (indirecta, vía next/puppeteer)
- **Rango afectado:** 8.0.0–8.20.1
- **Descripción:** Divulgación de memoria no inicializada
- **Fix:** Disponible vía actualización de next.

### 🔴 HIGH — `nanoid` (indirecta)
- **Rango afectado:** ≤3.3.17
- **Descripción:** Generadores no seguros pueden iterar indefinidamente con tamaño negativo
- **Fix:** Disponible vía actualización de dependencias padres.

### 🔴 HIGH — `js-yaml` (indirecta)
- **Rango afectado:** 4.0.0–4.3.0
- **Descripción:** DoS de complejidad cuadrática en merge key handling
- **Fix:** Disponible.

### 🔴 HIGH — `ip-address` (indirecta)
- **Rango afectado:** ≤10.3.0
- **Descripción:** Address4 decodifica octetos con cero al inicio como decimal; desacuerdo con resolvers DNS
- **Fix:** Disponible.

### 🟡 MODERATE — `@anthropic-ai/sdk` (directo)
- **Rango afectado:** 0.79.0–0.91.0
- **Versión actual:** 0.89.0 | **Fix disponible:** 0.120.0 (major bump)
- **CVE:** GHSA-p7fg-763f-g4gf
- **Descripción:** Permisos de archivo inseguros en la herramienta Local Filesystem Memory
- **Nota:** El riesgo es bajo si no se usa la herramienta de sistema de archivos local del SDK (Kyoszen no la usa).

### 🟢 LOW — `@babel/core` (indirecta)
- **Rango afectado:** ≤7.29.0
- **Descripción:** Lectura arbitraria de archivos vía comentario `sourceMappingURL` (solo en entornos de build)
- **Fix:** Disponible vía actualización de dependencias padres.

---

## Paquetes Desactualizados

| Paquete | Actual | Última versión | Severidad |
|---------|--------|----------------|-----------|
| `next` | 16.2.3 | **16.3.2** | 🔴 HIGH (fix de seguridad) |
| `nodemailer` | 6.9.0 | 9.0.5 | 🔴 HIGH (major bump) |
| `puppeteer` | 24.43.1 | 25.8.0 | 🔴 HIGH (major bump, solo dev) |
| `@anthropic-ai/sdk` | 0.89.0 | 0.120.0 | 🟡 MODERATE (major bump, +31 versiones) |
| `framer-motion` | 12.43.0 | 13.1.1 | ⚠️ ADVERTENCIA (major bump) |
| `react` + `react-dom` | 19.2.4 | 19.2.8 | ℹ️ INFO (patch, bug fixes) |

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total paquetes instalados | 531 |
| Paquetes de producción | 41 |
| Paquetes de desarrollo | 455 |
| Vulnerabilidades totales | 15 |
| — Críticas | 0 |
| — Altas (HIGH) | 13 |
| — Moderadas | 1 |
| — Bajas | 1 |
| Paquetes directos desactualizados | 6 |

---

## Recomendaciones

### ⚡ Acción inmediata (esta semana)

1. **Actualizar `next` de 16.2.3 → 16.3.2** — es la única actualización minor segura que resuelve vulnerabilidades HIGH directas (DoS en Server Components, XSS en postcss, CVEs en sharp/libvips). Comando:
   ```bash
   npm install next@16.3.2
   ```
   Probar con `npm run build` antes de hacer deploy.

### 📋 Acción a corto plazo (próxima sesión)

2. **Actualizar `@anthropic-ai/sdk` de 0.89.0 → última estable** (actualmente 0.120.0). Hay 31 versiones de diferencia. Revisar changelog por cambios de API que afecten el asistente Kyo y el Estratega. Luego del bump, correr las rutas `/api/assistant/chat` y `/admin/estratega` en local.

3. **Evaluar actualización de `nodemailer` de 6.x → 9.x** — corrige vulnerabilidad HIGH de enrutamiento de correo. Hay cambios de API entre v6 y v9 (especialmente en `createTransport`). Probar SMTP con IONOS en local antes de subir a producción.

### 🔍 Acción a mediano plazo

4. **Actualizar `puppeteer` de 24.x → 25.x** — solo afecta la generación de PDFs/reportes en devDependencies. Bajo riesgo en producción.

5. **`framer-motion` 12 → 13** — cambio major de animaciones. No urgente pero conviene actualizar para evitar deuda técnica acumulada.

6. El resto de vulnerabilidades indirectas (brace-expansion, ws, nanoid, js-yaml, ip-address, @babel/core) se resolverán automáticamente al actualizar los paquetes directos mencionados arriba.

---

*Generado automáticamente por el agente de mantenimiento de dependencias.*
