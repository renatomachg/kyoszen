# Reporte de Salud — Kyoszen
**Fecha:** 2026-05-17 00:00 UTC

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

> ⚠️ ALERTA TECNICA: Todas las URLs devolvieron HTTP 403, pero **esto NO es una caida del sitio en Vercel**.
>
> **Causa:** El entorno de ejecucion remoto (Claude Code en la nube) usa un proxy con inspeccion TLS
> (`O=Anthropic; CN=sandbox-egress-production TLS Inspection CA`) que bloquea peticiones salientes
> a dominios externos como `kyoszen.vercel.app`. El codigo 403 lo emite el proxy del sandbox,
> no el servidor de Vercel.
>
> El handshake TLS con Vercel completo exitosamente y el certificado de `*.vercel.app` es valido
> (emitido 2026-05-17, expira 2026-06-16), lo que confirma que el sitio esta alcanzable
> desde internet — solo el egress de este sandbox esta restringido.
>
> **Accion recomendada:** Ejecutar el monitoreo desde un entorno con acceso directo a internet:
> VPS propio (76.13.111.112), GitHub Actions con runner externo, cron local,
> o un servicio como UptimeRobot / Better Uptime.
