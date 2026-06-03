# Reporte de Salud — Kyoszen
**Fecha:** 2026-06-03 14:06 UTC

| Página | URL | Código HTTP | Estado |
|--------|-----|-------------|--------|
| Home | https://kyoszen.vercel.app/ | 403 | ⚠️ No verificable |
| Vacantes | https://kyoszen.vercel.app/vacantes | 403 | ⚠️ No verificable |
| Cursos | https://kyoszen.vercel.app/cursos | 403 | ⚠️ No verificable |
| Nosotros | https://kyoszen.vercel.app/nosotros | 403 | ⚠️ No verificable |
| Contacto | https://kyoszen.vercel.app/contacto | 403 | ⚠️ No verificable |
| Servicios | https://kyoszen.vercel.app/servicios | 403 | ⚠️ No verificable |

**Resumen:** 0/6 páginas verificadas correctamente (limitación del sandbox — ver nota técnica).

---

> ⚠️ ALERTA TÉCNICA: Todas las URLs devuelven HTTP 403. Esto NO indica una caída real del sitio.
>
> **Causa confirmada:** El entorno de ejecución remoto (Claude Code en la nube) usa un proxy con
> inspección TLS (`O=Anthropic; CN=sandbox-egress-production TLS Inspection CA`) que bloquea
> peticiones salientes a dominios externos como `kyoszen.vercel.app`. El 403 lo emite el proxy
> del sandbox, no el servidor de Vercel ni el VPS.
>
> Comportamiento registrado idéntico los días 2026-05-19 al 2026-06-03 — limitación
> permanente del sandbox de Claude Code, no una falla nueva del sitio.
>
> **Acción recomendada:** Ejecutar el monitoreo desde un entorno con acceso directo a internet:
> VPS propio (76.13.111.112), GitHub Actions con runner externo, cron local,
> o un servicio dedicado como UptimeRobot / Better Uptime.
