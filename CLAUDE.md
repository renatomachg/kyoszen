# Kyoszen — Contexto del proyecto

Este archivo lo lee Claude Code al iniciar cada sesión. Mantiene el contexto del proyecto, decisiones importantes y pendientes entre sesiones.

## Resumen

Sitio corporativo de **Kyoszen** — consultoría de capital humano (reclutamiento, capacitación, inducción, digitalización de RRHH) en México.

- **Propietario del repo:** renatomachg
- **Repo:** renatomachg/kyoszen
- **Dominio:** kyoszen.com (en Hostinger, actualmente apunta a IP de shared hosting viejo: 162.241.62.140)
- **Deploy actual:** Vercel (kyoszen.vercel.app, production branch = `main`)

## Stack

- **Next.js** 16.2.3 (App Router)
- **React** 19.2.4
- **Tailwind** v4
- **Framer Motion** para animaciones
- **TypeScript** estricto
- **Anthropic SDK** (`@anthropic-ai/sdk`) — para el asistente virtual Kyo (endpoint `/api/assistant/chat`)
- **Supabase** (`@supabase/supabase-js`) — base de datos (no 100% integrada aún)
- Imágenes servidas estáticas desde `/public/images/` con `unoptimized: true` en `next.config.ts`

## Arquitectura — directorios clave

```
src/
  app/
    api/assistant/chat/route.ts   # Endpoint del chat de Kyo (server-side, Anthropic)
    cursos/                       # /cursos + /cursos/[slug]
    vacantes/
    nosotros/
    servicios/
    contacto/
    page.tsx                      # Home
  components/
    layout/                       # Navbar, Footer, KyoszenLogo
    sections/                     # Hero, Services, About, WhyUs, Process, Courses, Testimonials, Blog, CtaFinal, FAQ, Vacancies
    assistant/                    # ChatWidget, KyoLogo, useChat hook
    ui/                           # AnimatedSection, PageHero, DropdownPill, WhatsAppIcon
  lib/
    assistant/                    # knowledge, system-prompt, tools (tool-use del asistente)
    courses.ts                    # Catálogo de cursos
    jobs.ts                       # Vacantes
    supabase.ts
  types/
```

## El asistente Kyo

Widget flotante de chat en esquina inferior derecha. Usa **tool-use** de Anthropic para navegar proactivamente por el sitio (e.g., el usuario pregunta "¿qué cursos tienen?" → Kyo llama a una tool y abre la pagina de cursos).

- Tools definidos en `src/lib/assistant/tools.ts`
- Knowledge base en `src/lib/assistant/knowledge.ts`
- System prompt en `src/lib/assistant/system-prompt.ts` (conversacional, pide nombre al inicio)
- El widget auto-saluda tras X segundos

Requiere `ANTHROPIC_API_KEY` como env var.

## Paleta de colores / estilo

Variables CSS en `src/app/globals.css`:
- `--color-blue: #1883FF` (bright blue, CTA / highlights)
- `--color-navy: #042E7B` (deep blue, texto fuerte / nav activa)
- `--color-blue-dark: #0A4ECC`
- `--color-blue-soft` (fondos suaves)
- `--color-yellow: #FFCC00` (acentos, CTA secundarias)
- `--color-bg: #F8FAFC` (pearl gray de fondo)
- `--color-wa: #25D366` (verde WhatsApp)
- `--color-footer: #030812` (casi negro para footer)
- Font: DM Sans

## Decisiones tomadas

- **Export estático NO** — se necesita Next.js con runtime para el endpoint `/api/assistant/chat`
- **`unoptimized: true`** en Image config → compatible con cualquier hosting
- **Sin acentos** en textos del sitio (por convención del cliente / evitar problemas de encoding)
- **Navbar es un componente flotante redondeado** (no full-width tradicional)
- **Idioma:** español de México, todo el contenido

## Pendientes activos

### 1. [ ] Logo SVG nuevo del cliente
- **Contexto:** El cliente pasó un SVG completo del logo (símbolo + wordmark). El archivo existe en historial de conversación pero NO se implementó porque el cliente dijo que lo hará con PNG después.
- **Acción cuando llegue el PNG:** reemplazar el componente `src/components/layout/KyoszenLogo.tsx` y añadirlo al Footer (actualmente usa solo el texto "KYOSZEN").

### 2. [ ] Decisión del cliente: Deploy en VPS Hostinger vs Vercel
- **Estado:** Esperando aprobación del cliente para migrar a VPS Hostinger.
- **VPS ya contratado hasta 2028-04-07:** KVM 1 (Ubuntu 24.04, 1 CPU, 4 GB RAM, 50 GB, IPv4: 76.13.111.112, hostname srv1565661.hstgr.cloud, SSH root)
- **Ventaja de VPS:** sin restricciones comerciales, control total, ya pagado
- **Desventaja:** ~25 min/mes mantenimiento, latencia (Boston → México), tiene que administrarlo
- **Alternativa:** quedarse en Vercel Hobby (funciona técnicamente pero es non-commercial por ToS) o Vercel Pro ($20/mes)
- **Runbook de VPS ya discutido** (Fase 1-4 resumidas abajo)

#### Runbook resumido del VPS (para cuando se apruebe)

**Fase 1 — Seguridad (~15 min)**
- SSH al root @ 76.13.111.112
- `apt update && apt upgrade -y`
- Crear user `kyoszen` con sudo, copiar llave SSH
- UFW firewall (22, 80, 443)
- `fail2ban`
- Deshabilitar login root por password

**Fase 2 — Node.js + App**
- Instalar Node 20 LTS (via nvm o nodesource)
- Instalar PM2 global
- Como user `kyoszen`: clonar repo en `/home/kyoszen/kyoszen`
- `npm install` → `npm run build`
- Crear `.env.local` con `ANTHROPIC_API_KEY` + Supabase
- `pm2 start npm --name kyoszen -- start`
- `pm2 save && pm2 startup`

**Fase 3 — Nginx reverse proxy**
- `apt install nginx`
- Config en `/etc/nginx/sites-available/kyoszen.com`
- `proxy_pass http://localhost:3000;`
- Habilitar sitio, `nginx -t`, `systemctl reload nginx`

**Fase 4 — DNS + SSL**
- En Hostinger DNS: cambiar A record `kyoszen.com` → `76.13.111.112` (actualmente 162.241.62.140)
- También A record `www` → `76.13.111.112`
- Verificar MX records (correo) antes de tocar — no romperlos
- Bajar TTL a 3600 antes del cambio
- Esperar propagación (~30-60 min)
- `certbot --nginx -d kyoszen.com -d www.kyoszen.com`

**Fase 5 — Auto-deploy con GitHub Actions**
- Crear `deploy` user key SSH en el VPS
- Agregar secret `SSH_PRIVATE_KEY` al repo en GitHub
- Workflow `.github/workflows/deploy.yml` que haga SSH + `git pull && npm install && npm run build && pm2 restart kyoszen`

### 3. [ ] Revisar textos con cliente
- Copy actual es placeholder/razonable pero no 100% aprobado
- No meterse a cambiar copy sin confirmación

### 4. [ ] Integración Supabase real
- Cliente Supabase existe en `src/lib/supabase.ts`
- Tablas / esquema aún no conectados a datos reales (courses.ts y jobs.ts son hardcoded)
- Pendiente definir si realmente se va a usar Supabase o si se queda todo hardcoded

## Cosas que NO hacer

- **No meter acentos** en copy (decisión del cliente/convención del proyecto)
- **No usar `next/image` con sitios en VPS** — ya se tuvo problema en WhyUs. Preferir `<img>` nativo (consistente con `unoptimized: true`)
- **No añadir README.md ni otros .md** sin pedirlo explícitamente
- **No commitear** cambios sin que el usuario pida commit
- **No mergear a `main`** sin autorización (production branch de Vercel)

## Comandos frecuentes

```bash
# Dev local
npm install
npm run dev    # http://localhost:3000

# Build de producción
npm run build
npm start

# Lint
npm run lint
```

## Ramas

- `main` — producción (Vercel auto-deploya)
- `claude/review-and-continue-MHOzx` — rama de trabajo actual (ya mergeada a main)
- `preview/*` — ramas de features previas
- Convención: crear `preview/<feature>` para trabajo nuevo, mergear a main cuando esté listo

## Última actualización

2026-04-15 — Creado tras sesión donde se arregló la imagen de WhyUs (native `<img>` en lugar de `next/image`) y se discutió el plan de deploy en VPS Hostinger.
