# Reporte de Salud — Kyoszen
**Fecha:** 2026-05-15 14:09 UTC

| Pagina | URL | Estado |
|--------|-----|--------|
| Home | / | ⚠️ NO VERIFICABLE |
| Vacantes | /vacantes | ⚠️ NO VERIFICABLE |
| Cursos | /cursos | ⚠️ NO VERIFICABLE |
| Nosotros | /nosotros | ⚠️ NO VERIFICABLE |
| Contacto | /contacto | ⚠️ NO VERIFICABLE |
| Servicios | /servicios | ⚠️ NO VERIFICABLE |

**Resumen:** 0/6 paginas verificadas — monitoreo bloqueado por restriccion del entorno de ejecucion.

> ⚠️ ALERTA DE ENTORNO (no del sitio): Las solicitudes HTTP salientes desde el entorno
> de ejecucion de Claude Code estan interceptadas por un proxy de inspeccion TLS interno
> de Anthropic. Todas las URLs devuelven HTTP 403 con cuerpo `"Host not in allowlist"`
> y certificado emitido por `O=Anthropic; CN=sandbox-egress-production TLS Inspection CA`.
>
> Esto NO indica una caida de kyoszen.vercel.app. El 403 proviene del proxy del sandbox,
> no de Vercel.
>
> **Para monitoreo real:** ejecutar desde un entorno sin restricciones de egress —
> VPS propio (76.13.111.112), GitHub Actions, cron local, o un servicio externo
> como UptimeRobot / Better Uptime.
