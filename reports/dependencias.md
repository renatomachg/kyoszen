# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-08-17

## Vulnerabilidades de Seguridad

### 🔴 CRÍTICO / ALTA PRIORIDAD (paquetes directos)

| Paquete | Severidad | Problema | Fix disponible |
|---------|-----------|----------|----------------|
| `next` 16.2.3 | **Alta** | 22 CVEs: XSS, SSRF, DoS, cache poisoning, middleware bypass, Server Actions. Rango afectado: >=16.0.0 <16.2.11 / <16.3.1 | `npm install next@16.3.1` ✅ (no es major) |
| `nodemailer` 6.x | **Alta** | Inyección de comandos SMTP (CRLF), email a dominio no intencionado. Rango: <8.0.4 | `npm install nodemailer@^9.0.5` ⚠️ (major: v6→v9) |
| `puppeteer` 24.x | **Alta** | Path traversal en `extract-zip` vía `@puppeteer/browsers`. Rango: <=2.13.2 (browsers) | `npm install puppeteer@^25.8.0` ⚠️ (major) |
| `@anthropic-ai/sdk` 0.89.0 | **Moderada** | Permisos inseguros en herramienta Local Filesystem Memory. Rango: >=0.79.0 <0.91.1 | `npm install @anthropic-ai/sdk@^0.117.1` ⚠️ (major) |

### 🟡 Vulnerabilidades Indirectas (transitivas)

| Paquete | Severidad | Problema | Origen |
|---------|-----------|----------|--------|
| `brace-expansion` | Alta | DoS: expansión exponencial, out-of-memory. Múltiples CVEs | Transitivo (varios) |
| `extract-zip` | Alta | Path traversal / symlink no validado | Puppeteer |
| `ip-address` | Alta | SSRF: clasificación errónea de IPv4-mapped/NAT64, bypass de CIDR | Transitivo |
| `js-yaml` | Alta | DoS cuadrático en merge keys y !!omap | Transitivo (Next.js/ESLint) |
| `nanoid` | Alta | Loop infinito con size negativo o cero | Transitivo |
| `@babel/core` | Baja | Lectura de archivos arbitrarios via sourceMappingURL | Transitivo (dev) |
| `postcss`, `sharp`, `ws` | Alta | Varias | Transitivo (Next.js) |

---

## Paquetes Desactualizados

| Paquete | Instalado | Última versión | Severidad | Notas |
|---------|-----------|----------------|-----------|-------|
| `next` | 16.2.3 | 16.3.1 | 🔴 **CRÍTICO** | 22+ CVEs de seguridad, actualizar urgente (no es major) |
| `nodemailer` | ~6.9.0 | 9.0.5 | 🔴 **CRÍTICO** | Inyección SMTP, 3 versiones major de retraso |
| `@anthropic-ai/sdk` | ~0.89.0 | 0.117.1 | 🟠 **ADVERTENCIA** | CVE moderado + muy desactualizado |
| `framer-motion` | ~12.38.0 | 13.1.0 | 🟠 **ADVERTENCIA** | 1 versión major de retraso |
| `puppeteer` | ~24.43.1 | 25.8.0 | 🟠 **ADVERTENCIA** | CVE alto + 1 versión major |
| `react` | 19.2.4 | 19.2.8 | 🔵 Info | Parche menor |
| `react-dom` | 19.2.4 | 19.2.8 | 🔵 Info | Parche menor |
| `@supabase/supabase-js` | ~2.103.0 | 2.112.3 | 🔵 Info | Minor, sin CVEs |
| `marked` | ~18.0.3 | 18.0.9 | 🔵 Info | Parche menor |
| `lucide-react` | ~1.8.0 | 1.31.0 | 🟠 **ADVERTENCIA** | Múltiples minors de retraso |
| `unpdf` | ~1.6.2 | 1.8.1 | 🔵 Info | Minor, sin CVEs |

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total paquetes (incluyendo transitivos) | 531 |
| Paquetes directos en producción | 41 |
| Vulnerabilidades **críticas** | 0 |
| Vulnerabilidades **altas** | 13 |
| Vulnerabilidades **moderadas** | 1 |
| Vulnerabilidades **bajas** | 1 |
| **Total vulnerabilidades** | **15** |
| Paquetes directos desactualizados | 6 |

---

## Recomendaciones

### ⚡ Acción inmediata (alta prioridad)

1. **Actualizar `next` a 16.3.1** — No es cambio major, resuelve 22 CVEs de golpe. Es la acción más urgente y de menor riesgo:
   ```bash
   npm install next@16.3.1
   ```

2. **Actualizar `nodemailer` a v9** — Requiere revisar la API (cambios breaking). En producción se usa IONOS SMTP, revisar compatibilidad antes de actualizar:
   ```bash
   npm install nodemailer@^9.0.5
   ```

### 🔶 Planificar para el siguiente sprint

3. **Actualizar `@anthropic-ai/sdk`** — El salto de 0.89 a 0.117 puede incluir cambios breaking en la API de tool-use (Kyo y el Estratega). Revisar el changelog antes:
   ```bash
   npm install @anthropic-ai/sdk@^0.117.1
   ```

4. **Actualizar `puppeteer`** — Solo se usa en el generador de PDFs/renders. Riesgo bajo pero requiere prueba local:
   ```bash
   npm install puppeteer@^25.8.0
   ```

5. **Actualizar `framer-motion` a v13** — Puede tener cambios breaking en animaciones. Probar en local antes.

### 🔵 Sin urgencia

6. `react` / `react-dom` → esperar estabilización de 19.2.8.
7. `@supabase/supabase-js`, `marked`, `unpdf` → sin CVEs, actualizar en la próxima ronda de mantenimiento.

---

> **Nota:** Las vulnerabilidades en paquetes transitivos (brace-expansion, js-yaml, nanoid, etc.) se resuelven al actualizar `next` y `puppeteer`, ya que son dependencias de esos paquetes. No requieren intervención directa.
