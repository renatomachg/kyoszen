# Reporte de Dependencias — Kyoszen
**Fecha:** 2026-08-10

---

## Vulnerabilidades de Seguridad

### 🔴 ALTA (9 vulnerabilidades — 2 dependencias directas)

| Paquete | Directo | Vulnerabilidad | Fix disponible |
|---------|---------|----------------|----------------|
| **next** 16.2.3 | ✅ Sí | DoS en Server Components; Middleware/Proxy bypass (múltiples CVEs); XSS en App Router con nonces CSP; cache poisoning en RSC; SSRF en Server Actions y WebSocket upgrades; bypass en Pages Router i18n; endpoint disclosure | `npm install next@16.3.0` |
| **nodemailer** 6.10.1 | ✅ Sí | SMTP command injection vía `envelope.size`; CRLF injection en HELO/EHLO y List-* headers; TLS incorrecto en OAuth2; bypass de `disableFileAccess`/`disableUrlAccess`; DoS en addressparser | `npm install nodemailer@9.0.5` (major) |
| brace-expansion | ❌ Indirecto | DoS: expansión exponencial / arrays ilimitados / crash OOM (múltiples CVEs encadenados) | Actualizar dependencia padre |
| ip-address | ❌ Indirecto | SSRF y bypass de trust-boundary: octetos con ceros iniciales, CIDR suffix, IPv4-mapped/NAT64 | Actualizar dependencia padre |
| js-yaml | ❌ Indirecto | DoS: complejidad cuadrática en merge keys, aliases y !!omap (múltiples CVEs) | Actualizar dependencia padre |
| nanoid | ❌ Indirecto | Loop infinito con generadores custom de tamaño 0 o negativo | Actualizar dependencia padre |
| postcss | ❌ Indirecto | XSS vía `</style>` sin escapar; path traversal en sourceMappingURL; lectura arbitraria de archivos .map | Se resuelve al actualizar `next@16.3.0` |
| sharp | ❌ Indirecto | Vulnerabilidades heredadas de libvips: CVE-2026-33327/33328/35590/35591 | Se resuelve al actualizar `next@16.3.0` |
| ws | ❌ Indirecto | Divulgación de memoria no inicializada; DoS por agotamiento de memoria | Actualizar dependencia padre |

### 🟡 MODERADA (1 vulnerabilidad — dependencia directa)

| Paquete | Directo | Vulnerabilidad | Fix disponible |
|---------|---------|----------------|----------------|
| **@anthropic-ai/sdk** 0.89.x | ✅ Sí | Permisos de archivo inseguros en Local Filesystem Memory Tool (CWE-732). Rango afectado: >=0.79.0 <0.91.1 | `npm install @anthropic-ai/sdk@latest` (0.116.0, major bump) |

### ⚪ BAJA (1 vulnerabilidad — indirecta)

| Paquete | Directo | Vulnerabilidad | Fix disponible |
|---------|---------|----------------|----------------|
| @babel/core | ❌ Indirecto | Lectura arbitraria de archivos vía comentario `sourceMappingURL` (CVSS 3.2) | Actualizar dependencia padre |

---

## Paquetes Desactualizados

| Paquete | Instalado | Último (range) | Último (global) | Severidad |
|---------|-----------|----------------|-----------------|-----------|
| next | 16.2.3 | 16.2.3 | **16.3.0** | 🔴 CRÍTICO — múltiples CVEs HIGH |
| nodemailer | 6.9.x | 6.10.1 | **9.0.5** | 🔴 CRÍTICO — CVEs HIGH + 3 versiones mayores |
| @anthropic-ai/sdk | 0.89.x | 0.89.x | **0.116.0** | 🟡 MODERADA — CVE + 1 versión mayor atrás |
| framer-motion | 12.x | 12.43.0 | **13.1.0** | ⚠️ ADVERTENCIA — nueva versión mayor disponible |
| react | 19.2.4 | 19.2.4 | 19.2.8 | ℹ️ INFO — patch menor |
| react-dom | 19.2.4 | 19.2.4 | 19.2.8 | ℹ️ INFO — patch menor |

> Los paquetes `@supabase/supabase-js`, `lucide-react`, `marked` y `unpdf` están al día en su última versión.

---

## Resumen

| Métrica | Valor |
|---------|-------|
| Total de paquetes (prod + dev + optional) | 531 |
| Vulnerabilidades totales | 11 (0 críticas, 9 altas, 1 moderada, 1 baja) |
| Dependencias directas con CVE | 3 (`next`, `nodemailer`, `@anthropic-ai/sdk`) |
| Paquetes desactualizados | 6 (2 con CVE resuelto en nueva versión) |

---

## Recomendaciones

### Acción inmediata (esta semana)

1. **Actualizar `next` a 16.3.0** — Resuelve 9 vulnerabilidades HIGH en el framework principal, incluyendo bypasses de middleware y ataques de cache poisoning que podrían afectar al panel `/admin` y al revisor `/revisor`. La actualización es minor (no breaking):
   ```bash
   npm install next@16.3.0 eslint-config-next@16.3.0
   ```

2. **Actualizar `nodemailer` a 9.0.5** — El proyecto usa nodemailer para correos SMTP (IONOS) de notificaciones a clientes. Los CVEs HIGH incluyen SMTP injection y bypass de restricciones de archivo. Es un salto major; revisar si el API cambió:
   ```bash
   npm install nodemailer@9.0.5
   # Verificar que el transporte SMTP con puerto 465 (secure:true) siga funcionando
   ```

### Acción a corto plazo (próximo ciclo)

3. **Actualizar `@anthropic-ai/sdk`** — De 0.89.x a la última (0.116.0). Es un salto major; revisar changelog del SDK de Anthropic antes de actualizar para no romper el asistente Kyo ni el Estratega:
   ```bash
   npm install @anthropic-ai/sdk@latest
   ```

4. **Ejecutar `npm audit fix`** — Para resolver las dependencias indirectas (brace-expansion, ip-address, js-yaml, nanoid, ws, postcss, sharp) que en su mayoría se resuelven automáticamente o al actualizar next:
   ```bash
   npm audit fix
   ```

### Notas

- Las vulnerabilidades de `brace-expansion`, `postcss` y `sharp` se resuelven en cadena al actualizar `next@16.3.0`.
- La vulnerabilidad de `@anthropic-ai/sdk` (permisos de archivo) aplica al **Local Filesystem Memory Tool** — si el proyecto no usa esa feature, el riesgo real es bajo. Igualmente recomendado actualizar.
- `framer-motion` v13 puede tener breaking changes respecto a v12; actualizar después de verificar el changelog.
