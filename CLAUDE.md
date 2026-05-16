# Kyoszen — Contexto del proyecto

Este archivo lo lee Claude Code al iniciar cada sesión. Mantiene el contexto del proyecto, decisiones importantes y pendientes entre sesiones.

## Resumen

Sitio corporativo de **Kyoszen** — consultoría de capital humano (reclutamiento, capacitación, inducción, digitalización de RRHH) en México.

- **Propietario del repo:** renatomachg
- **Repo:** renatomachg/kyoszen
- **Dominio:** kyoszen.com — produccion final en VPS Hostinger 76.13.111.112
- **Deploy:** VPS Hostinger unicamente (Vercel descartado)
- **Rama de produccion:** `main`
- **Rama activa de trabajo:** `preview/admin-panel`

## Stack

- **Next.js** 16.2.3 (App Router)
- **React** 19.2.4
- **Tailwind** v4
- **Framer Motion** para animaciones
- **TypeScript** estricto
- **Anthropic SDK** (`@anthropic-ai/sdk`) — asistente virtual Kyo (`/api/assistant/chat`)
- **Supabase** (`@supabase/supabase-js`) — base de datos activa (URL: xwzggymwdrvxpwvuefqf.supabase.co)
- Imágenes con `unoptimized: true` en `next.config.ts`

## Arquitectura — directorios clave

```
src/
  app/
    admin/                         # Panel CMS — protegido con Supabase Auth
      login/                       # /admin/login
      (panel)/                     # Layout con sidebar (auth guard)
        page.tsx                   # Dashboard con stats
        vacantes/                  # CRUD de vacantes
        aplicaciones/              # Inbox de aplicaciones recibidas
        contactos/                 # Inbox de mensajes de contacto
    api/
      assistant/chat/route.ts      # Kyo — Anthropic tool-use
      aplicar/route.ts             # Recibe aplicaciones → SMTP + Supabase
      contacto/route.ts            # Recibe mensajes → SMTP + Supabase
    cursos/                        # /cursos + /cursos/[slug]
    vacantes/                      # /vacantes + /vacantes/[id] — lee de Supabase
    blog/                          # /blog/[slug]
    nosotros/
    servicios/
    contacto/
    page.tsx                       # Home
  components/
    layout/
      Navbar.tsx
      Footer.tsx
      PublicShell.tsx              # Oculta Navbar/Footer/Kyo en rutas /admin
    sections/                      # Hero, Services, About, WhyUs, etc.
    assistant/                     # ChatWidget, KyoLogo, useChat
    ui/                            # AnimatedSection, PageHero, DropdownPill, WhatsAppIcon
  lib/
    supabase.ts                    # Cliente Supabase (sin genérico Database)
    assistant/                     # knowledge, system-prompt, tools
    courses.ts                     # Cursos hardcoded (pendiente migrar a Supabase)
    jobs.ts                        # Vacantes hardcoded (YA MIGRADO a Supabase — mantener como fallback)
  types/
```

## Supabase — Tablas activas

- **vacantes** — gestionadas desde /admin/vacantes. Sitio público lee de aquí.
- **aplicaciones** — se llenan desde el modal "Aplicar ahora" del sitio
- **contactos** — se llenan desde el formulario de /contacto
- **cursos** — tabla creada, pendiente migrar datos y conectar al sitio

RLS activo: publico lee activos, admin autenticado hace todo.

## VPS Hostinger

- **IP:** 76.13.111.112 (Ubuntu 24.04, 1 CPU, 4 GB RAM, 50 GB)
- **SSH:** `ssh root@76.13.111.112` (siempre por terminal, nunca consola web)
- **App:** `/home/kyoszen/` (o buscar con `find /home /root -name "next.config.ts"`)
- **PM2 proceso:** `kyoszen` (id 3)
- **Nginx config:** `/etc/nginx/sites-available/demo.kyoszen.com`
- **SSL:** Certbot, expira 2026-08-09
- **Otros procesos en el VPS:** `maya` (id 0,2), `kyoszen-backend` (id 1) — no tocar
- **Para actualizar el VPS:** `cd /home/kyoszen && git pull && npm install && npm run build && pm2 restart kyoszen`
- **.env.local en VPS:** tiene ANTHROPIC_API_KEY personal (reemplazar por la del cliente al migrar), falta agregar variables de Supabase

## Documentacion del proyecto

Carpeta `docs/` en la raiz del repo. Es la **fuente de verdad unica** del proyecto — alimenta el sitio, el asistente Kyo, las redes sociales y cualquier pieza nueva. Leerla antes de escribir copy, disenar, o actualizar el knowledge base de Kyo.

```
docs/
  context/
    empresa.md        # Mision, vision, valores, servicios, diferenciadores
    audiencia.md      # Cliente ideal, perfil candidato, proceso de seleccion
    mensajes-clave.md # Propuesta de valor, FAQs, pendientes del cliente
    cursos.md         # Catalogo de 10 cursos, videos de induccion
  brandkit/
    colores.md        # Paleta completa con variables CSS y uso por contexto
    tipografia.md     # DM Sans, jerarquia, convenciones
    voz-tono.md       # Tono corporativo, voz de Kyo, sin acentos
    redes-sociales.md # Dimensiones, redes prioritarias, ideas de contenido
    logos/            # PNGs del logo (pendiente recibir del cliente)
    referencias/      # Moodboards e imagenes de referencia
```

## El asistente Kyo

Widget flotante en esquina inferior derecha. Usa tool-use de Anthropic.

- Tools: `src/lib/assistant/tools.ts`
- Knowledge base: `src/lib/assistant/knowledge.ts`
- System prompt: `src/lib/assistant/system-prompt.ts`
- Requiere `ANTHROPIC_API_KEY`

## Paleta de colores / estilo

Variables CSS en `src/app/globals.css`:
- `--color-blue: #1883FF`
- `--color-navy: #042E7B`
- `--color-blue-dark: #0A4ECC`
- `--color-yellow: #FFCC00`
- `--color-bg: #F8FAFC`
- `--color-wa: #25D366`
- Font: DM Sans

## Decisiones tomadas

- **Sin output: export** — Next.js con runtime completo (APIs, middleware)
- **`unoptimized: true`** — compatible con VPS y cualquier hosting
- **Sin acentos** en textos del sitio (convención del cliente)
- **Navbar flotante redondeada** (no full-width)
- **PublicShell** oculta Navbar/Footer/Kyo en rutas `/admin`
- **Supabase sin genérico Database** — el tipo en types/database.ts está desactualizado, no usarlo
- **Vacantes del sitio público leen de Supabase** — no del archivo jobs.ts
- **Idioma:** español de México

## Pendientes activos

### Panel Admin
- [ ] Cursos — migrar a Supabase y gestionar desde /admin/cursos
- [ ] Blog — crear y editar artículos desde /admin/blog
- [ ] Kyo — editar knowledge base y system prompt desde el panel

### Deploy (VPS Hostinger — kyoszen.com)
- [ ] Clonar repo en VPS de nuevo (se perdió la carpeta)
- [ ] Agregar variables de Supabase al .env.local del VPS
- [ ] **ANTES de subir al VPS — variables requeridas en `.env.local` del VPS:**
  - `SMTP_HOST=smtp.hostinger.com`
  - `SMTP_PORT=587`
  - `SMTP_USER=rsalazar@kyoszen.com.mx`
  - `SMTP_PASS=<contraseña de rsalazar@kyoszen.com.mx>`
  - `CONTACT_EMAIL=rsalazar@kyoszen.com.mx` — recibe formularios de /contacto y vacantes
  - `COURSES_EMAIL=info@kyoszen.com` — recibe formularios de solicitud de informes de cursos
  - `ANTHROPIC_API_KEY=<key del cliente>` — asistente Kyo
  - `NEXT_PUBLIC_SUPABASE_URL=https://xwzggymwdrvxpwvuefqf.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>`
  - Sin SMTP los formularios no envian correos.
- [ ] Configurar GitHub Actions para auto-deploy al hacer push a main
- [ ] Cambiar A record kyoszen.com → 76.13.111.112 (actualmente apunta a hosting viejo)
- **NOTA: Vercel descartado.** Todo va a VPS. Las API keys van solo en .env.local del servidor, nunca en base de datos ni en el panel de admin.

### General
- [x] Logo SVG del cliente recibido e implementado (`public/images/logo.svg`, componente `KyoszenLogo.tsx`)
- [ ] Revisar copy con cliente
- [ ] TikTok: agregar link real a la red social en Footer (actualmente `href="#"`)

## Cosas que NO hacer

- **No meter acentos** en copy
- **No usar `next/image`** — usar `<img>` nativo
- **No añadir README.md** sin pedirlo
- **No commitear** sin que el usuario lo pida
- **No mergear a `main`** sin autorización

## Comandos frecuentes

```bash
# Dev local
cd /Users/renatomachado/Desktop/kyoszen
npm run dev        # http://localhost:3000
npm run build
npm run lint

# Alias configurado en .zshrc
kyoszen            # entra a la carpeta y abre Claude

# VPS
ssh root@76.13.111.112
cd /home/kyoszen && git pull && npm install && npm run build && pm2 restart kyoszen
pm2 list
pm2 logs kyoszen --lines 50
```

## Ramas

- `main` — produccion
- `preview/admin-panel` — rama activa (panel CMS con Supabase)
- `demo/hostgator` — export estático para demo en HostGator
- Convención: `preview/<feature>` para trabajo nuevo, mergear a main cuando esté listo

## Sistema de generación de posts — Social Media

Construido en `scripts/render/`. Genera imágenes PNG para redes sociales con HTML/CSS + Puppeteer.

```bash
# Generar un post
node scripts/render/renderer.js scripts/render/data/KYO-FB-001.json
```

### Layouts aprobados

| ID | Template | Estilo | Uso |
|----|----------|--------|-----|
| D1 | facebook-post-d1.html | Navy · comillas gigantes · texto bold blanco | Marca empleadora, educativo |
| D2 | facebook-post-d2.html | Blanco · tipografía 148px · foto diagonal | Presentación, servicios |
| Vacante-A | (demo-vacante-recortada.png) | Navy · persona recortada · rombos | Vacantes urgentes |
| Vacante-B | facebook-post-vacante.html | Color blocking navy/blanco · persona rompe bloques | Vacantes destacadas |

### Herramientas instaladas

- `puppeteer` — en devDependencies del proyecto
- `rembg` (Python 3.9) — remueve fondos de fotos automáticamente
  - Modelo en `~/.u2net/u2net.onnx` (176MB, ya descargado)
  - Uso: `python3 -c "from rembg import remove; from PIL import Image; img=remove(Image.open('foto.jpg')); img.save('recortada.png')"`

### Fotos disponibles en docs/contenido/mayo-2026/

- `stock-profesionales.jpg` — escena de oficina
- `stock-persona-blanco.jpg` — persona fondo limpio
- `stock-persona-limpia.jpg` — persona alternativa
- `persona-recortada.png` — recorte con IA listo para usar

### Referencias visuales

```
docs/brandkit/referencias/
  Facebook-1.jpg          # Moodboard general aprobado
  vacantes/
    ref-urgente-01.jpg    # Estilo vacantes (persona recortada, fondo sólido, rombos)
    ref-urgente-02.jpg    # Estilo vacantes (texto bold, persona flotante)
```

### Pendientes del sistema (próxima sesión)

- [ ] Template carrusel (6 slides + slide CTA final)
- [ ] Layout sin foto para posts educativos de texto
- [ ] Integrar rembg al renderer.js automáticamente
- [ ] Registrar layouts D1, D2, Vacante-A y Vacante-B con IDs formales en el renderer
- [ ] Actualizar agente `canva-production-kyoszen` → apuntar al renderer HTML

### Estrategia social media

PDF completo en `docs/context/kyoszen_estrategia_social_media.pdf`

Semana 1 lanzamiento (Mayo 18-24):
- Lunes 19 · IMAGEN · Presentación de marca · 11am
- Miércoles 21 · CARRUSEL 6 slides · "5 señales RRHH" · 1pm
- Viernes 23 · CARRUSEL 6 slides · "Cursos y capacitación" · 11am
- Martes 20 · TIKTOK 30 seg · Presentación cuenta · 12pm

## Última actualización

2026-05-13 — Sistema de generación de posts HTML/CSS+Puppeteer construido y aprobado. 4 layouts aprobados (D1, D2, Vacante-A, Vacante-B). rembg instalado para recorte de personas con IA. Estrategia social media cargada desde PDF. Agentes de social media creados en .claude/agents/.
