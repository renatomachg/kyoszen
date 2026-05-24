# Reporte de Salud — Kyoszen
**Fecha:** 2026-05-24 00:00 UTC

| Pagina | URL | Codigo HTTP | Estado |
|--------|-----|-------------|--------|
| Home | / | 403 | ⚠️ No verificable |
| Vacantes | /vacantes | 403 | ⚠️ No verificable |
| Cursos | /cursos | 403 | ⚠️ No verificable |
| Nosotros | /nosotros | 403 | ⚠️ No verificable |
| Contacto | /contacto | 403 | ⚠️ No verificable |
| Servicios | /servicios | 403 | ⚠️ No verificable |

**Resumen:** 0/6 paginas verificadas correctamente.

---

> ⚠️ ALERTA TECNICA: Todas las URLs devuelven HTTP 403. Esto NO indica una caida real del sitio.
>
> **Causa confirmada:** El entorno de ejecucion remoto (Claude Code en la nube) usa un proxy con
> inspeccion TLS (`O=Anthropic; CN=sandbox-egress-production TLS Inspection CA`) que bloquea
> peticiones salientes a dominios externos como `kyoszen.vercel.app`. El 403 lo emite el proxy
> del sandbox, no el servidor de Vercel ni el VPS.
>
> Comportamiento registrado identico los dias 2026-05-19, 2026-05-22, 2026-05-23 y 2026-05-24 — limitacion
> permanente del sandbox de Claude Code, no una falla nueva del sitio.
>
> **Accion recomendada:** Ejecutar el monitoreo desde un entorno con acceso directo a internet:
> VPS propio (76.13.111.112), GitHub Actions con runner externo, cron local,
> o un servicio dedicado como UptimeRobot / Better Uptime.
