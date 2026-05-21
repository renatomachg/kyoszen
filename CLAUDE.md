# Kyoszen — Contexto del proyecto

Este archivo lo lee Claude Code al iniciar cada sesión. Mantiene el contexto del proyecto, decisiones importantes y pendientes entre sesiones.

## ⚠️ REGLA INAMOVIBLE — FLUJO DE TRABAJO

**SIEMPRE local primero, producción después. Sin excepciones.**

1. Hacer el cambio en local
2. El usuario lo revisa y aprueba en local (`http://localhost:3002`)
3. Solo después de aprobación explícita: commit → push → deploy al VPS
4. Esto aplica a TODO: código, datos de Supabase, migraciones, configuraciones

Nunca tocar producción (VPS ni Supabase) sin aprobación local previa del usuario.

---

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

- **vacantes** — CRUD desde /admin/vacantes. Sitio público lee solo activas.
- **cursos** — CRUD desde /admin/cursos. Sitio público lee solo activos.
- **blog_posts** — CRUD desde /admin/blog con editor markdown.
- **aplicaciones** — se llenan desde el modal "Aplicar ahora" del sitio
- **contactos** — se llenan desde el formulario de /contacto
- **kyo_config** (id, instrucciones) — instrucciones editables del asistente Kyo
- **site_config** (key, value) — emails destino configurables desde /admin/correos
- **site_eventos** (id, tipo, valor, session_id, created_at) — analytics propio (RLS activo)
- **faqs** — preguntas frecuentes del asistente Kyo

RLS activo en todas las tablas.

## VPS Hostinger

- **IP:** 76.13.111.112 (Ubuntu 24.04, 1 CPU, 4 GB RAM, 50 GB)
- **SSH desde Claude:** `ssh -i ~/.ssh/kyoszen_vps root@76.13.111.112` (llave permanente en Mac)
- **App:** `/home/kyoszen/`
- **PM2 proceso:** `kyoszen` (id 0) — usa `ecosystem.config.js` para cargar `.env.local`
- **Nginx config:** `/etc/nginx/sites-enabled/kyoszen` — proxy a localhost:3000, SSL Certbot activo
- **SSL:** Certbot kyoszen.com + www.kyoszen.com
- **UNICA copia del codigo en el VPS:** `/home/kyoszen/` — no crear copies en otras rutas como /var/www. Si existe otra copia, eliminarla con `rm -rf`.
- **Para actualizar el VPS:** `ssh -i ~/.ssh/kyoszen_vps root@76.13.111.112 "bash /home/kyoszen/deploy.sh"` — Claude siempre ejecuta este comando directamente despues de hacer push a main.
- **Repo publico:** git pull funciona sin credenciales
- **Dev local:** `bash dev.sh` (carga .env.local y arranca en puerto 3002)

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

### General
- [ ] **SMTP_PASS** — agregar contraseña de `info@kyoszen.com` en `.env.local` del VPS para que funcionen los correos. Hacerlo con: `ssh -i ~/.ssh/kyoszen_vps root@76.13.111.112` → `nano /home/kyoszen/.env.local` → `pm2 restart kyoszen`
- [ ] **TikTok** — link en Footer es `href="#"`. Falta URL real del perfil de TikTok de Kyoszen.
- [ ] **Logo PNG** — pendiente de entrega del cliente. Actualmente usa wordmark de texto.
- [ ] Revisar copy con cliente (es razonable pero no 100% aprobado)

### Panel Admin — YA COMPLETO
- [x] Vacantes — CRUD + toggle activa/inactiva + ✨ Completar con IA
- [x] Cursos — CRUD + toggle activo + ✨ Completar con IA
- [x] Blog — CRUD + editor markdown + picker de imagenes + duplicar
- [x] Asistente Kyo — editor instrucciones + test en vivo + FAQs
- [x] Correos — configurar emails destino desde el panel
- [x] Analytics — eventos propios + dashboard

### Deploy — YA FUNCIONANDO
- [x] VPS Hostinger 76.13.111.112 — unico deploy, Vercel descartado
- [x] PM2 + Nginx + SSL Certbot
- [x] Repo publico en GitHub — VPS hace `git pull` directo
- [x] Llave SSH permanente `~/.ssh/kyoszen_vps` para acceso de Claude al VPS

## Cosas que NO hacer

- **No meter acentos** en copy
- **No usar `next/image`** — usar `<img>` nativo
- **No añadir README.md** sin pedirlo
- **No commitear** sin que el usuario lo pida
- **No mergear a `main`** sin autorización

## Comandos frecuentes

```bash
# Dev local — SIEMPRE usar dev.sh para que cargue el .env.local correctamente
cd /Users/renatomachado/Desktop/kyoszen
bash dev.sh        # http://localhost:3002
npm run build
npm run lint

# Deploy a produccion — Claude se conecta directo:
ssh -i ~/.ssh/kyoszen_vps root@76.13.111.112 "bash /home/kyoszen/deploy.sh"
# El deploy.sh: git pull → verifica/recrea ecosystem.config.js → npm build → pm2 restart

# Ver logs del VPS
pm2 logs kyoszen --lines 50 --nostream
pm2 list
```

## Flujo de trabajo

1. Desarrollar en local → probar en `localhost:3002`
2. Decir "manda a produccion"
3. Claude hace commit + push al repo + ejecuta `bash /home/kyoszen/deploy.sh` en VPS

## Resiliencia del VPS

- `ecosystem.config.js` NO esta en git (listado en .gitignore) — se crea manualmente en el VPS
- `deploy.sh` en `/home/kyoszen/deploy.sh` — recrea `ecosystem.config.js` automaticamente si falta
- Si `pm2 save` se sobreescribe accidentalmente: `pm2 start ecosystem.config.js && pm2 save --force`
- `pm2-root` servicio systemd activo → PM2 arranca automaticamente en reboot del VPS

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

2026-05-19 — Sesion completa: sitio desplegado en produccion (kyoszen.com), VPS limpio solo con kyoszen, llave SSH permanente para Claude, panel admin completo (vacantes, cursos, blog, kyo, correos, analytics), feature ✨ Completar con IA en vacantes y cursos, Navbar y seccion home responden a vacantes activas, analytics propio con tabla site_eventos en Supabase.
