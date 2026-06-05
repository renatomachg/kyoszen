# Kyoszen — Contexto del proyecto

Este archivo lo lee Claude Code al iniciar cada sesión. Mantiene el contexto del proyecto, decisiones importantes y pendientes entre sesiones.

## 🚨 REGLA INAMOVIBLE — FLUJO DE TRABAJO

**SIEMPRE local primero → usuario aprueba → LUEGO producción. SIN EXCEPCIONES.**

1. Hacer el cambio en local
2. Correr el servidor local si no está arriba: `bash dev.sh` → `http://localhost:3002`
3. Decirle al usuario que revise en local y esperar su aprobación explícita
4. Solo después del "listo" o "mándalo a producción": commit → push → deploy VPS

**Aplica a TODO — incluyendo:**
- Cambios de una sola línea ("fixes rápidos")
- Correcciones de bugs urgentes
- Migraciones de Supabase
- Cambios de configuración

**No hay excepciones por urgencia, simplicidad o confianza en el cambio.**
El flujo es: local → aprobación → producción. Siempre.

### Cuando el usuario aprueba y dice "manda a producción":
Ejecutar los 3 pasos **automáticamente y sin esperar confirmación adicional**:
1. `git add` + `git commit`
2. `git push origin main`
3. `ssh deploy` al VPS

No hacer solo 1 o 2 de los 3. Los 3 siempre juntos.

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
- **kyo_conversaciones** (id, session_id, messages JSONB, ip, created_at) — log de cada chat con Kyo. Se ve en /admin/kyo → tab Conversaciones.
- **kyo_faqs** — preguntas frecuentes del asistente Kyo
- **site_config** (key, value) — emails destino + SMTP + config de resumen (`resumen_email`, `resumen_periodicidad`)
- **site_eventos** (id, tipo, valor, session_id, created_at) — analytics propio (RLS activo)
- **estratega_chats** (id, title, messages JSONB, created_at, updated_at) — historial del Estratega
- **social_posts** (id, red_social, fecha_programada, estado, titulo_interno) — publicaciones de redes. estado: pendiente/aprobado/cambios
- **social_post_versions** (id, post_id, version_num, caption, imagenes JSONB, nota_visual, es_activa) — versiones de cada post. `nota_visual` = "qué diseñar"
- **social_comments** (id, post_id, autor_nombre, autor_rol, contenido) — comentarios del revisor (admin/cliente)
- **social_page_config** (red_social, nombre_pagina, avatar_url) — config del mockup por red
- **social_reviewers** (id UUID→auth.users, nombre, email, activo) — clientes que reciben notificaciones del revisor. Solo los `activo:true` reciben correos.
- **social_informes** (id, periodo "2026-06", periodo_label, desde, hasta, metricas JSONB, resumen, decisiones, propuestas, estado, fuente) — informe mensual de análisis de redes. estado: borrador (solo admin) / publicado (cliente lo ve). fuente: 'sitio' (fase 1) / 'meta' (fase 2). UNIQUE(periodo).

RLS activo en todas las tablas (políticas permisivas USING(true) — el acceso real lo controla la service_role en las API routes).

### Supabase Storage
- Bucket **`media`** (público) — imágenes de redes sociales (`social/`), avatares, logos de marca (`brand/`)
- IMPORTANTE: el bucket debe crearse vía la API de Storage (`sb.storage.createBucket`), NO por SQL — crear por SQL no lo registra en PostgREST.
- Logos en Storage: `brand/kyoszen-logo.svg`, `brand/kyoszen-icon.png`, `brand/social-illustration.png`

### MCP de Supabase — ojo
- El MCP genérico `mcp__supabase__*` apunta al proyecto **Makerlab**, NO a Kyoszen.
- Para Kyoszen usar el MCP con `project_id: "xwzggymwdrvxpwvuefqf"` (`mcp__7f010f9a-...__apply_migration` / `execute_sql`).
- O usar un script node con `.env.local` (service role) que siempre apunta a Kyoszen.

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
    voz-tono.md       # Tono corporativo, voz de Kyo
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
- **Ortografía correcta** en español de México — acentos, signos de apertura (¿¡) y mayúsculas donde corresponda
- **Navbar flotante redondeada** (no full-width)
- **PublicShell** oculta Navbar/Footer/Kyo en rutas `/admin`
- **Supabase sin genérico Database** — el tipo en types/database.ts está desactualizado, no usarlo
- **Vacantes del sitio público leen de Supabase** — no del archivo jobs.ts
- **Idioma:** español de México

## Módulos nuevos (sesión jun 2026)

### 1. Revisor de redes sociales (`/revisor` + `/admin/redes-sociales`)
Portal para que el cliente (Rosy, Monse) apruebe el contenido de redes ANTES de publicarse.
- **`/revisor`** — portal limpio (sin navbar/footer/Kyo, excluido en `PublicShell`). Login con Supabase Auth. **2 pestañas: "📋 Publicaciones" y "📊 Análisis"**. En Publicaciones ve grid responsivo, abre modal con mockup de Facebook, botones **Aprobar** / **Necesito cambios** (este abre campo de texto → guarda comentario + cambia estado + notifica por correo, todo junto). Pills de stats del mes. Toggle **Semana/Mes**. **Guía de uso** = tour interactivo con coach marks (spotlight sobre elementos reales), aparece la 1ª vez (localStorage `kyoszen_revisor_guia_vista`) + botón "❔ Guía de uso".
- **Comparador de versiones**: cuando una publicación tiene corrección (>1 versión), el grid la muestra con **efecto doble tarjeta + badge "✨ Nueva propuesta"**; el modal tiene toggle **"Ver cómo estaba antes"** (compara v-nueva vs anterior). Mismo comparador en el modal del admin. Al subir una nueva versión NO se arrastra la imagen anterior (empieza limpia).
- **`/admin/redes-sociales`** — 4 tabs: **Calendario** (semana 7-cols con "+ Añadir" por día, o vista mes en grid), **Importar plan**, **Informe mensual**, **Configuración** (nombre + avatar del mockup). Crear publicación con selector de red (Facebook/TikTok), imagen/carrusel, caption, fecha. Ver versiones, comentarios, nota visual "qué diseñar".
- **APIs:** `/api/admin/social/{posts,config,upload,importar,informe}`, `/api/revisor/{posts/[id]/{status,comments},informe}`. Notificaciones a renatomachg@gmail.com vía IONOS SMTP. Al subir nueva versión, notifica a `social_reviewers` activos ("✅ ya corregimos tu publicación").
- **Multi-red:** `src/lib/redes-sociales.ts` define cada red (logo, color, emoji). Componente `src/components/RedLogo.tsx` muestra logo o chip de marca si no hay logo. Facebook activo con `/redes/facebook.svg`. TikTok activo pero SIN logo (muestra chip negro) — cuando llegue el SVG, ponerlo en `/public/redes/tiktok.svg` y `logo: "/redes/tiktok.svg"` en redes-sociales.ts.

### 2. Importador de planes de contenido (`/admin/redes-sociales` → tab Importar)
Pega/sube el HTML o texto de un plan de contenido → lo parsea con Claude (haiku-4-5) → crea las publicaciones en el calendario.
- 2 pasos: **"Analizar"** (solo lee, NO crea nada) → preview → **"Crear"** (inserta en BD real).
- Parsing en paralelo por semana (`dividirEnLotes`) → ~18s para un mes (vs 58s en serie). Limpia el HTML antes (`limpiarHtml`) para velocidad y mejor clasificación.
- **Detección de duplicados por día+red:** si ya existe publicación ese día/red, la marca "✓ Ya en calendario" y la respeta, solo crea las nuevas.
- Cada pieza crea: fecha, título, caption+hashtags, `nota_visual` (qué diseñar, visible en detalle admin). Imagen vacía → el usuario la diseña en Illustrator y la sube después.

### 2b. Panel de Análisis — informe mensual de redes (Fase 1)
"Panel de datos/decisiones/propuestas" de cara al cliente. Admin lo genera y publica; el cliente lo ve en la pestaña **"📊 Análisis"** del revisor.
- **Admin** (`/admin/redes-sociales` → tab "📊 Informe mensual", componente `src/components/admin/InformeAdmin.tsx`): selecciona mes → "Generar" calcula métricas reales + IA (haiku) redacta resumen/decisiones/propuestas → admin edita → "Publicar al cliente". estado borrador/publicado.
- **Cliente** (`src/components/revisor/InformeCliente.tsx`): diseño editorial de consultoría premium (portada navy con rombo dorado, secciones numeradas 01–05, indicador estrella grande + tabla de indicadores, plan de acción numerado, oportunidades en bloque navy). Responsivo (clases CSS `.inf-*` con media queries). Solo ve informes **publicados** (`/api/revisor/informe`).
- **Datos Fase 1** (`src/lib/social-informe.ts`, función `calcularMetricasSitio`): de `site_eventos` + `social_posts` + contactos/aplicaciones. Métricas: clics WhatsApp (joya), contactos, aplicaciones, vistas vacantes, interés cursos, mensajes Kyo, publicaciones, comparativa vs mes anterior. `detectarPatrones()` = reglas que fundamentan las decisiones (nada inventado). **Fuente intercambiable**: Fase 2 = conectar API de Meta (alcance/seguidores orgánicos) sin rehacer el panel.
- **IMPORTANTE control de publicación**: el cliente NO ve nada hasta que el admin da "Publicar". local y prod comparten la MISMA BD, así que generar un informe en local ya queda en la BD real, pero mientras esté en `borrador` el cliente solo ve el empty state.
- Decisiones del grilleo (visión completa): audiencia admin+cliente con caras distintas · decisiones como columna (datos base, propuestas cierre) · reglas+IA con visto bueno · informe mensual + datos vivos + filtro de fechas futuro · métricas construcción de marca + conversión (joya) · pestaña en revisor · propuestas para que Kyoszen gane en su negocio + upsell · Fase 1 datos propios → Meta en paralelo.

### 3. Estratega (`/admin/estratega`)
Agente IA (Claude Opus) que lee datos reales de Supabase (30 días) y propone servicios de postventa para Kyoszen. Sidebar con historial de chats persistido en tabla `estratega_chats`. Streaming.

### 4. Analytics — tracking + dashboard + reportes (`/admin/analytics`)
- **Tracking** activo en frontend con `logEvent()` de `@/lib/analytics`: vacante_vista, vacante_aplicar_click, vacante_aplicacion_enviada, curso_informes_click/enviada, whatsapp_click, kyo_mensaje, contacto_enviado, comparador_*, calculadora_*.
- **Dashboard** redesign: KPIs, funnel de vacantes, top rankings, tab **Feed** y tab **Reportes**.
- **Reportes** (`/api/admin/resumen`): genera resumen semanal/mensual. Descarga **PDF con diseño branded** (Puppeteer), descarga TXT, o envía por correo. Config de periodicidad + correo guardada en site_config. (El cron automático real aún no está montado en el VPS).

### 5. Herramientas "secretas" (links no enlazados en el sitio — para presentar al cliente)
- **`/calculadora`** — calculadora de costo de rotación de personal (metodología SHRM, 3 meses de salario por empleado). CTA WhatsApp pre-llenado.
- **`/salarios`** — comparador de salarios CDMX 2025. Datos en `src/lib/salarios.ts` (35 puestos, **estimados de mercado** — NO de API real). Wording honesto: "Estimado de mercado · CDMX 2025". Compara salario actual vs mercado (🔴 bajo / 🟢 en línea / 🔵 alto).
- NO están en el homepage ni navbar. Solo el usuario conoce los links.

## Cuentas de revisores (Supabase Auth)
Creadas con `sb.auth.admin.createUser` + contraseña temporal `Kyoszen2025!` (el usuario las comparte por WhatsApp; cambian la contraseña al entrar):
- **Rocio Salazar** — rsalazar@kyoszen.com.mx
- **Monserrat Gonzalez** — mgonzalez@kyoszen.com.mx
- **Hector Gonzalez** — info@mhome.mx (cuenta de PRUEBA)
- **Supabase Auth → URL Configuration:** Site URL = `https://kyoszen.com`, Redirect URLs incluyen `https://kyoszen.com/**` y `http://localhost:3002/**`. (Necesario para que los links de invitación/reset no manden a localhost).
- Correo de invitación: se envía con script node + nodemailer (IONOS), diseño branded con logo + ilustración. NO hay registro público — el admin crea las cuentas.

## SMTP — IONOS
- Configurado en `site_config`: smtp_host=`smtp.ionos.com`, smtp_port=`465` (secure), smtp_user=`rsalazar@kyoszen.com.mx`.
- El HostGator viejo (mail.kyoszen.com / 162.241.62.140) NO entrega — descartado.
- En `from` usar `{ name, address: smtp_user }` (no template string `"Nombre <correo>"` que da error 501 en IONOS).

## Modelos de Claude usados
- Asistente Kyo: `claude-haiku-4-5-20251001` (default)
- Estratega: `claude-opus-4-5` (streaming)
- Importador de planes: `claude-haiku-4-5-20251001` (rápido, parsing)
- IDs confirmados que funcionan con la key: `claude-opus-4-5`, `claude-haiku-4-5-20251001`. NO asumir que existe un id de sonnet sin confirmar.

## Pendientes activos

### General
- [x] **SMTP_PASS** — correos funcionando vía IONOS, confirmado por usuario y cliente.
- [ ] **Logo de TikTok** — cuando llegue, ponerlo en `/public/redes/tiktok.svg` y activar `logo` en redes-sociales.ts. Por ahora muestra chip negro "TikTok".
- [ ] **TikTok** — link en Footer es `href="#"`. Falta URL real del perfil.
- [ ] **Logo PNG** — el icono ya se usa en el revisor (`brand/kyoszen-icon.png`). Footer aún usa wordmark de texto.
- [ ] **Cron del resumen mensual** — el toggle guarda la preferencia pero el envío automático (cron en VPS llamando a /api/admin/resumen) aún no está montado.
- [ ] **Panel de Análisis Fase 2** — conectar API de Meta (Graph API insights orgánicos: alcance, seguidores, engagement). Requiere: app de Meta for Developers + permisos `read_insights`/`pages_read_engagement` + App Review (días/semanas). El usuario es admin de la página de FB de Kyoszen. La fuente de datos en `social-informe.ts` es intercambiable (`fuente: 'sitio'|'meta'`), enchufar sin rehacer el panel.
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

- **No escribir copy sin acentos** — el español correcto lleva tildes, signos de apertura y mayúsculas
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

2026-06-05 — Continuacion. En produccion:
- **Comparador de versiones** en revisor y admin: efecto doble tarjeta + badge "Nueva propuesta" en el grid, toggle "Ver como estaba antes" en el modal. Nueva version ya no arrastra la imagen anterior.
- **Notificacion al cliente** al subir correccion: correo "ya corregimos tu publicacion" a `social_reviewers` activos (Rosy, Monse). Hector inactivo (era prueba).
- **Panel de Analisis Fase 1** (informe mensual de redes): admin genera con IA + datos reales del sitio y publica; cliente lo ve en pestaña "Analisis" del revisor (diseño editorial de consultoria, responsivo). Control borrador/publicado. Fuente intercambiable para Meta (Fase 2 pendiente).
- Cuentas de revisor: contraseñas reales enviadas a Rosy y Monse, ya entraron y les gusto el panel.

2026-06-01 — Sesion grande. Nuevos modulos en produccion:
- **Revisor de redes sociales** (`/revisor` + `/admin/redes-sociales`): calendario, mockup Facebook, aprobar/pedir cambios, comentarios, notificaciones por correo, vista semana/mes, guia interactiva (tour coach marks), multi-red Facebook/TikTok.
- **Importador de planes** de contenido: pega/sube HTML → Claude parsea en paralelo (~18s) → crea publicaciones con deteccion de duplicados por dia+red. La imagen la sube el usuario despues (disena en Illustrator). La `nota_visual` guarda "que disenar".
- **Estratega** con historial en Supabase.
- **Analytics**: tracking en frontend + dashboard redesign + tab Reportes (PDF branded/TXT/correo).
- **Herramientas secretas** (links no enlazados): `/calculadora` (costo de rotacion) y `/salarios` (comparador de salarios CDMX, datos estimados).
- **Cuentas de revisor** creadas en Supabase Auth (Rosy, Monse, Hector-prueba), contrasena temporal `Kyoszen2025!`, Site URL de Auth = kyoszen.com.
- **SMTP** migrado a IONOS (HostGator viejo descartado).

2026-05-26 — Sitio desplegado en produccion, VPS limpio, panel admin completo (vacantes, cursos, blog, kyo, correos, analytics), ✨ Completar con IA, analytics propio.
