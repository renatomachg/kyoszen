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
|----|----------|--------|---------|
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

- [ ] Limpiar los ~323 errores de lint preexistentes del proyecto (reglas nuevas React 19/Next 16: set-state-in-effect, static-components, no-unescaped-entities, etc.) para dejar el candado de lint verde de verdad. No afecta build/produccion; el hook ya es informativo.
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

2026-07-28 — **Proyectos Hub: subcarpetas + vista previa de archivos + rediseño corporativo del revisor y admin de Proyectos.** (entregas K/L/M/N/O/P, flujo Opus↔Codex).
- **Subcarpetas (K):** `espacio_carpetas` (id, espacio_id, parent_id self-ref = anidado, nombre, orden) + `espacio_archivos.carpeta_id` (ON DELETE SET NULL → archivos suben a raíz). Navegación tipo Drive con breadcrumb en admin y cliente; admin crea/mueve carpetas (con anti-ciclos en el PATCH), cliente navega. APIs `/api/admin/proyectos/espacios/[id]/carpetas[/carpetaId]`; el GET revisor de archivos devuelve `{carpetas, archivos}`.
- **Vista previa (L/M):** miniatura real en la tarjeta (imagen `<img>`, PDF `<iframe view=Fit #toolbar=0>` en **formato vertical** proporción documento) + visor grande embebido al hacer clic (imagen / iframe PDF ~72vh) con botones Abrir/Descargar. Los PDFs de Storage se sirven sin `content-disposition: attachment` → embeben inline en Chrome.
- **Rediseño corporativo (N/O/P):** fuera emojis decorativos, íconos SVG de línea por tipo (cámara/carpeta/columnas) en mosaico blue-wash, tarjetas/píldoras/botones sobrios. Cliente `/revisor`: pestañas con íconos, píldoras de stats con puntos de color semánticos, tarjetas de Publicación y detalle limpios (se preservaron `data-fpill`/`data-fred`/`data-novedad` del tour y el contenido real de las publicaciones). Admin `/admin/proyectos`: mismo tratamiento, se **eliminó el campo Ícono emoji** del formulario de espacio (el ícono se deriva del `tipo`; el cliente ya ignoraba `icono`/`color`). Se mantiene navy + **amarillo `#FFCC00`** para CTAs primarios del panel (identidad, no infantil).
- **PENDIENTE — "todo Kyoszen":** barrido corporativo del RESTO del admin por lotes (Vacantes, Cursos, Aplicaciones, CRM, Contactos, Kyo, Blog, Testimonios, Redes Sociales, Cuestionarios, Contenido, SEO, Correos, Analytics, Estratega). Mismo criterio: fuera emojis decorativos, íconos de línea, componentes consistentes, navy+amarillo.

2026-07-27 — **Proyectos Hub: /revisor Proyectos evoluciona a hub general→particular con "Espacios" tipados.** Construido con el flujo Opus planea → `codex exec` construye → Opus revisa y verifica en vivo (entregas G/H/I/J).
- **Concepto:** capa "Espacios" arriba de `proyectos`. Cada espacio tiene un `tipo` que define su vista particular. Vista general = tarjetas por espacio; vista particular = su contenido. El flujo de video (guion→arte→video, aprobación por escena) queda intacto dentro del espacio "Videos de inducción".
- **Tablas nuevas:** `proyecto_espacios` (nombre, tipo `aprobacion|archivos|tablero`, icono, color, orden, publicado, `cuestionario_token`), `espacio_archivos` (drive: url/tipo/peso/nota/estado pendiente|aprobado|cambios), `espacio_columnas` + `espacio_tarjetas` (kanban), `espacio_comentarios` (archivo_id|tarjeta_id genérico). `proyectos.espacio_id` (FK nullable). RLS permisivo. Tipos en `src/lib/proyectos.ts`. Seed: 3 espacios (Videos de inducción 🎬 / Artes 🎨 / Plataforma 🧩) con los 2 videos bajo Videos de inducción y 3 columnas en Plataforma.
- **P2 Artes (drive):** subir/ver/aprobar/comentar archivos (PDF, imágenes) al bucket `media` bajo `proyectos/<espacioId>/`. APIs `/api/admin/proyectos/espacios/[id]/archivos[/archivoId]` y `/api/revisor/.../archivos[/archivoId]/{status,comments}`.
- **P3 Tablero (kanban tipo Trello):** admin maneja columnas/tarjetas (crear/mover/editar), cliente ve y comenta (no mueve). APIs `/api/admin/proyectos/espacios/[id]/{columnas,tarjetas}` y `/api/revisor/.../{tablero,tarjetas/[id]/comments}`. Componentes `TableroAdmin.tsx` / `TableroCliente.tsx`.
- **Cuestionario en el espacio (J):** `proyecto_espacios.cuestionario_token` adjunta un cuestionario a un espacio; el cliente ve una tarjeta de onboarding con estado (sin empezar / en progreso X de Y / completado, vía `contarRespondidas`) que abre `/cuestionario/<token>`. El admin lo asigna con un selector de invitaciones. Ya está adjunto el token `rosy` al espacio Plataforma.
- Admin: gestión de espacios (crear/publicar/asignar proyecto) + gestor de archivos + kanban en `/admin/proyectos`. Cliente: `src/components/revisor/ProyectosCliente.tsx` reestructurado a general→particular.
- **PENDIENTE opcional:** el placeholder de correo en el status de archivos (notificación al cliente) quedó como TODO si no se reusó el helper existente; revisar.

2026-07-25 — **Plataforma SaaS/CRM: Fase 1 (cuestionario de onboarding) + Fase 2 (CRM de candidatos).** Construido con el flujo Opus planea → `codex exec` construye → Opus revisa y verifica en vivo.
- **Fase 1 — Cuestionario conversacional** (`/cuestionario/[token]`): portal para que clientes (ej. Rosy) contesten un cuestionario ramificado sobre sus cursos, una pregunta a la vez, con branching (`showIf` declarativo), transición entre temas, revisión editable, autoguardado con debounce y reanudar. Fuente de verdad en `docs/cuestionario/preguntas.json`; helpers puros en `src/lib/cuestionario` (`esVisible`, `preguntasVisibles`, `estaRespondida`, `resumenPorSeccion`). APIs `/api/cuestionario/[token]` (GET/PATCH) + `/enviar`. Admin `/admin/cuestionario`: lista de invitaciones, generar links con slug automático, ver respuestas por sección. Tabla `cuestionario_respuestas` (token único, respuestas jsonb, paso_actual, completado) con RLS. Excluido de Navbar/Footer/Kyo en `PublicShell`. La pregunta de catálogo dice "75 cursos en 11 áreas" (dato real de la BD). Prototipo de referencia en `docs/cuestionario/`.
- **Fase 2 — CRM de candidatos** (`/admin/crm`): evoluciona el inbox de `aplicaciones` a base de candidatos con pipeline y matching. Tablas `crm_candidatos` (estado: nuevo/contactado/entrevista/enviado/contratado/descartado; origen), `crm_notas` (timeline), y `aplicaciones.candidato_id` (FK nullable). Lógica pura en `src/lib/crm` (`matching.ts`: `puntuarCandidato`/`rankear`, pesos ubicación 40 / categoría 35 / keywords 5×5, normalizado 0–100 con razones en español; `ESTADOS`). APIs `/api/admin/crm/{candidatos,candidatos/[id],candidatos/[id]/notas,sync,match}`. **Sincronizador** consolida aplicaciones→candidatos deduplicando por correo/WhatsApp (4 aplicaciones → 2 candidatos). **Matching (la joya)**: pestaña "Matching por vacante" en el admin CRM → elige vacante activa → candidatos anteriores sugeridos con score + razones ("Ya aplicó a vacantes de Operativo", "Misma zona: CDMX"). Pipeline editable + notas por candidato.
- **Diferido hasta que Rosy conteste el cuestionario:** auto-aviso al candidato cuando embona, y portal para empresas (marketplace). La fuente del matching queda lista para meter embeddings semánticos (pgvector) cuando haya más volumen.
- **Nota de matching:** palabras genéricas ("experiencia", "años") generan coincidencias débiles; refinable metiéndolas al stoplist en `src/lib/crm/matching.ts`.
- **OJO date-bump espurio:** algo (¿hook?) bumpea la fecha del primer entry de "Última actualización" al abrir/editar CLAUDE.md; descartar ese cambio al commitear.

2026-07-21 — **Centro de Proyectos: nuevo módulo de aprobación por escena (guion→arte→video).** Construido con Codex (planeación/revisión con Opus, construcción con `codex exec`).
- **Tablas nuevas** (Supabase): `proyectos` (tipo, folio, estado, etapa_actual, publicado), `proyecto_etapas` (tipo guion/arte/video, `modo` por_escena|entregable_unico, estado rollup/bloqueada = gating), `proyecto_escenas` (numero, titulo, orden), `proyecto_bloques` (la unidad aprobable = etapa×escena; escena_id null = entregable único; estado pendiente/aprobado/cambios, contenido jsonb {locucion,en_pantalla}, archivos, nota, version_num, es_activa), `proyecto_comentarios` (por bloque). RLS permisivo. Índice único activo por celda con `NULLS NOT DISTINCT`. Tipos en `src/lib/proyectos.ts` (+`rollupEtapa`).
- **Admin** `/admin/proyectos` (link en sidebar): tablero de tarjetas con progreso por etapa ("6/8 aprobadas"), bandeja **"🔴 Por corregir"** (todas las escenas con cambios pedidos, endpoint `/api/admin/proyectos/pendientes`), modal detalle con tabs de etapa (bloqueadas 🔒 solo lectura) y edición por escena (locución+en pantalla en guion; nota+archivos en arte/video). **Importador de guion con IA**: sube PDF (o pega texto) → `unpdf` + haiku `claude-haiku-4-5-20251001` → escenas con locución+en pantalla → crear. El "en pantalla" se hereda como brief de la etapa Arte.
- **Cliente** `/revisor` → pestaña **"🎬 Proyectos"** (`src/components/revisor/ProyectosCliente.tsx`): aprueba/pide cambios **toma por toma**; aprobar una etapa completa desbloquea la siguiente; reabrir una etapa (nueva versión) re-bloquea las posteriores.
- **APIs:** `/api/admin/proyectos/*` (+`importar-guion`, `pendientes`, `bloques/[id]` PUT/versions) y `/api/revisor/proyectos/*` (`bloques/[id]/status` con gating+rollup, `comments`). Notifica por SMTP a `social_reviewers` activos / admin. Rigor "ligero" (estado+versiones+comentarios, como redes); auth por guard de página + service_role en rutas (patrón existente). Revisado con `/codex review` ×2: corregidos re-bloqueo de gating al reabrir, índice NULL, edición de bloque aprobado (409→forzar versión), revisor exige publicado+es_activa, validación de estado, guard de importador largo.
- **PENDIENTE opcional:** separar automáticamente un proyecto por puesto cuando el PDF trae varios videos; guion importado detecta 1 proyecto por documento.

2026-07-13 — **Mover publicaciones a cualquier fecha + cursos de la semana de julio llenados.**
- **"📅 Mover a otra fecha"** en el modal de detalle del admin de redes: la fecha del header es botón → selector de fecha (min hoy en hora LOCAL, no UTC) → PUT `fecha_programada` con manejo de error (`res.ok`, alert del error del server, try/catch/finally) → `onMoved` cierra el modal y `seguirFecha(iso)` navega el calendario al mes/semana destino (calcula `weekOffset`; si el offset no cambia, `loadData()` directo). Resuelve mover borradores entre meses lejanos sin arrastrar mes por mes. Revisado con `/codex review` (2 hallazgos corregidos: response.ok + fecha UTC).
- **Cursos de la semana de julio**: los posts 84 (NOM-035, 21 jul) y 85 (Atención al Cliente, 27 jul) estaban con caption/nota_visual VACÍOS en `social_post_versions` — se llenaron vía SQL con el formato estándar (card ámbar, constancia de participación, sin DC-3/STPS). El post 85 usa el curso real "El Poder de Saber Servir al Cliente". Siguen en borrador; falta imagen.
- **Flujo de trabajo acordado**: Fable (Claude Code) piensa/analiza/construye → skill `/codex` revisa el diff como segunda opinión (el skill codex es read-only: review/challenge/consult, no construye).

2026-06-22 (tarde) — **Archivado de videos a Google Drive (liberar espacio) + fix de video en imagenes[].**
- **Liberar espacio de videos publicados:** botón "🗄️ Liberar espacio" en el detalle del TikTok admin → sube el MP4 a Google Drive, genera **carátula** (ffmpeg, frame ~1s, JPG ~50KB), borra el original de Supabase Storage. **Solo borra si la subida a Drive tuvo éxito.** Metadata en `storyboard.archivado` (drive_url, drive_file_id, poster_url, archivado_en, peso_mb) — **sin migración de BD**. Endpoint `POST /api/admin/social/posts/[id]/archivar-video`. Modal de confirmación con CSS branded (cabecera navy + 3 pasos). Aviso suave si el video lleva +14 días programado.
- **Estado "archivado" en admin y cliente:** muestra la carátula + chip + link a Drive (admin) / "✅ Publicado en redes" (cliente, sin link interno). Tarjeta del grid del revisor usa el poster. Tipo `ArchivadoVideo` en `StoryboardView.tsx`.
- **Google Drive OAuth:** helper `src/lib/google-drive.ts` (refresh token, scope `drive.file` = mínimo privilegio, subida multipart con fetch, sin dep nueva). Credenciales en `.env.local`: `GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN/DRIVE_FOLDER_ID`. Script de obtención de token: `scripts/google-oauth-token.mjs` (loopback localhost:53682). **OJO consentimiento:** la pantalla OAuth debe estar en **Producción** (no Testing) para que el refresh token no expire a los 7 días; tipo de usuario **Externo**. Carpeta destino en Drive: "Kyoszen · Videos publicados".
- **FALTA en el VPS:** agregar las 4 vars `GOOGLE_*` al `.env.local`/`ecosystem.config.js` del VPS para que el botón funcione en producción (en local ya están).
- **Fix bug previo (video en imagenes[]):** al arrastrar un video al recuadro de imágenes del modal "Editar publicación", el `.mp4` caía en `imagenes[]` y el sitio lo renderizaba como `<img>` → roto. Ahora `handleFiles` **rechaza videos** con aviso ("usa el botón Subir video"). Se arregló el post 88 (movido el mp4 de imagenes[]→video_url). Verificado: no había otros casos.
- **OJO local:** Mac sin ffmpeg → la carátula no se genera en local (muestra 🎬), en el VPS sí. node_modules del worktree = hardlinks del repo principal (turbopack rechaza symlinks fuera de su raíz).

2026-06-22 — **Subida de videos TikTok: límites + compresión con ffmpeg.**
- **Límites subidos (eran el bloqueo del 413 al subir video):** Nginx kyoszen `client_max_body_size 200M` (antes default 1MB, faltaba en el sitio — solo estaba en makerlab); bucket Supabase `media` `file_size_limit` 50MB (antes 10MB; **50MB es el tope global del plan**, no se puede más sin upgrade). Respaldo del nginx en el VPS (`kyoszen.bak.*`).
- **Compresión en el VPS con ffmpeg** (`apt install ffmpeg`, 6.1.1): el endpoint `/api/admin/social/upload` ahora detecta video (mime `video/*` o ext mp4/mov/webm/m4v/avi/mkv) y lo transcodifica a MP4 web (`scale='min(1080,iw)':-2`, libx264 veryfast crf 28, aac 128k, +faststart) **antes** de subir a Storage → archivos chicos (~test 2.3MB→0.3MB, ~10s/clip 15s en 1 CPU). `runtime=nodejs`, `maxDuration=300`. **Fallback:** si ffmpeg no está (p.ej. Mac local) o falla, sube el original. Imágenes pasan sin tocar.
- **PENDIENTE opcional:** al subir el video NO se manda correo al cliente (la PATCH de `posts/[id]` solo cambia fase/estado). Si se quiere avisar "🎬 tu video ya está listo", agregar notificación.

2026-06-20 (noche 5) — **Revisor: filtros multi-fecha + fix refresco de modal.**
- **Modo filtro (revisor):** al activar cualquier filtro (estado o red), el revisor carga TODAS las publicadas (`postsTodos`, fetch a `/api/revisor/posts` sin fechas) y muestra las coincidencias como **lista plana ordenada por fecha** (no atada a la semana/mes). Antes filtrar en vista Semana mostraba vacío si los pendientes estaban en otra semana. Se oculta el toggle Semana/Mes + flechas; header "Resultados del filtro · N · todas las fechas"; contador "X de {todas}". `handleStatusChange` sincroniza `postsTodos`. Sin filtro = calendario normal.
- **Fix admin:** `loadData` ahora refresca `selectedPost` con los datos nuevos, así el modal refleja al instante los cambios (propuesta/versión/estado) en vez de mostrar datos viejos.

2026-06-17 (noche 4) — **Editar la Propuesta del cliente en TikToks (admin).** En el detalle de un TikTok → pestaña 📋 Propuesta → "✏️ Editar propuesta": editor (`PropuestaEditor`) de todo lo que ve el cliente (título, subtítulo, por_que, linea_diseno[], copy[], caption). **Dos botones:** "Guardar" = PUT en sitio (sin avisar, no crea versión) · "📨 Guardar y avisar al cliente" = POST nueva versión (vuelve a pendiente + correo a revisores). Endpoints `/api/admin/social/posts/[id]/versions`: PUT ahora acepta `storyboard`; POST acepta `storyboard` + `titulo_interno`. Todo anidado en `storyboard.propuesta` (sin migración). La pestaña Propuesta ahora siempre se muestra en TikTok (permite crear propuesta si no existe).

2026-06-17 (noche 3) — **Arrastrar publicaciones entre meses.** En el calendario admin, soltar una publicación sobre las flechas **‹ ›** la mueve al mes (o semana, según vista) anterior/siguiente — mismo día del mes, ajustado si el destino es más corto — y navega para seguirla. Las flechas son drop targets (se resaltan azul + escalan al arrastrar encima). Respeta bloqueo de fechas pasadas. Función `moverPostPeriodo(postId, dir)` en `redes-sociales/page.tsx`. Para saltos lejanos: repetir gesto o usar ✏️ Editar.

2026-06-17 (noche 2) — **Distintivo de red en calendario + filtros en revisor + tour de novedad.**
- **Chip de red en vista Mes** (admin y cliente): cada evento muestra chip `● FACEBOOK` (azul) / `● TIKTOK` (negro) + borde izquierdo en color de la red, ícono 🎬 (TikTok) / 📝 (Facebook). Admin además: pill "BORRADOR" y punto de estado; cliente: badge "✨ NUEVA" si hay corrección (sin pill borrador).
- **Filtros en el revisor (`/revisor`):** las 4 píldoras (Total/Aprobados/Pendientes/Con cambios) ahora **filtran por estado** al tocarlas; nueva fila de **filtros de red** (Todas/📘 Facebook/🎵 TikTok). Combinables, con contador "X de Y", "✕ Limpiar filtros" y empty state inteligente. `postsFiltrados` aplica a vista semana y mes.
- **Tour de novedad (una sola vez):** `NovedadFiltros` = coach-mark de 6 pasos (intro → Aprobados → Pendientes → Con cambios → Facebook → TikTok) con spotlight sobre cada píldora real (atributos `data-fpill` / `data-fred`), puntos de progreso, Atrás/Siguiente. localStorage `kyoszen_revisor_novedad_filtros_v1`. Usuario que ya vio la guía → ve la novedad; usuario nuevo → ve la guía y se marca la novedad como vista (sin doble popup).
- **UX importador:** al "Crear" TikToks, salta al tab Calendario en el mes del primero y banner verde global con las fechas. Se borraron 4 TikToks viejos de prueba (ids 59/65/71/77).

2026-06-17 (noche) — **Importador de set TikTok (3 documentos) + separación por audiencia.**
- **3 documentos por set** (Holadiseño entrega 3 HTML/PDF por mes): **Propuesta CLIENTE** (pitch que aprueba el cliente), **Storyboard** (guion cuadro por cuadro, para generar el video) y **Guía técnica INTERNA** (prompts Higgsfield + montaje CapCut). Todo se guarda **anidado en el `storyboard` jsonb** existente → `storyboard.propuesta` y `storyboard.guia_tecnica`. **Cero migración de BD.**
- **Importador** (`/admin/redes-sociales` → Importar → 🎬 TikTok): **3 zonas de carga** (acepta HTML/TXT/PDF arrastrar/subir/pegar). Acción `analizar-set` en `/api/admin/social/importar-tiktok` parsea los 3 en paralelo (haiku, prompts `SYSTEM`/`SYSTEM_PROP`/`SYSTEM_TEC`) y **empata por índice de video**. Con uno solo basta (storyboard o propuesta). Fechas sugeridas en martes.
- **Separación por audiencia:** cliente (`/revisor`) ve **solo la Propuesta** (`PropuestaView`); admin ve pestañas **📋 Propuesta · 🎬 Storyboard · 🛠️ Guía técnica** (`GuiaTecnicaView` = prompts en bloques copiables + tabla de montaje). Componentes en `src/components/social/StoryboardView.tsx` (exports `PropuestaView`, `GuiaTecnicaView`, tipos `Propuesta`/`GuiaTecnica`).
- **OJO datos:** local y prod comparten la MISMA Supabase. Los 3 archivos subidos NO se almacenan (se parsean en memoria; el PDF se descarta). Lo que SÍ persiste al dar "Crear" son los posts (borrador, `publicado=false`) y los videos/imágenes (Storage `media`). La barrera con el cliente es el flag `publicado`, no el entorno.
- Lector de archivos compartido `leerArchivoComoTexto` (PDF→extract-pdf, HTML/TXT directo) reusado por importador Facebook y TikTok.

2026-06-17 (tarde) — **TikTok de 2 fases (guion → video) + importador de storyboards + soporte PDF.**
- **Flujo TikTok 2 fases:** una pieza de TikTok nace como **guion/storyboard** (`fase='guion'`), el cliente lo aprueba en el revisor, luego el admin **sube el video generado** (cambia a `fase='video'`, `estado='pendiente'`) y se le avisa al cliente para que también lo revise. Columnas: `social_posts.fase` ('guion'|'video'), `social_post_versions.storyboard` (jsonb: audiencia/duracion/frames[hook|normal|cta con tc/overlay/escena/dice]/cta/hashtags/nota_produccion) y `.video_url`.
- **Componente `src/components/social/StoryboardView.tsx`** dibuja el guion visual (cuadros con colores por tipo). Vista admin = `TikTokAdminBlock` (stepper Guion/Video + subir video), vista cliente = `TikTokReview` (aprueba guion → revisa video, toggle "ver guion").
- **Importador de storyboards TikTok** (`/api/admin/social/importar-tiktok`, IA haiku): tab Importar → toggle **📘 Facebook / 🎬 TikTok**. Pega/sube storyboard → analizar (parse a frames) → preview con checkboxes → crear guiones (fechas sugeridas en **martes**). Nace `fase='guion'`, `publicado=false`.
- **Soporte PDF en importadores** (Facebook y TikTok): endpoint `/api/admin/social/extract-pdf` extrae texto con **`unpdf`** (dep nueva). Zona de subir archivo acepta `.html/.txt/.pdf`. PDF escaneado (sin texto) → avisa. `handleImportFile` es async y compartido.
- **BUG corregido:** default de `social_posts.fase` estaba en `'video'` (debía ser `'guion'`). El `ALTER TABLE ... SET DEFAULT 'guion'` NO se pudo correr desde el MCP (estaba `--read-only`); se garantizó a nivel de app (el create manual e importador setean `fase:'guion'` para TikTok). **PENDIENTE opcional:** correr ese ALTER en el SQL Editor. Se arreglaron 4 TikToks viejos rotos (fase=video sin contenido) → pasados a `guion`.
- **MCP Supabase:** se quitó el flag `--read-only` de `.mcp.json` (gitignored, no se sube) para permitir escrituras; **aplica al reiniciar la sesión**. Recomendado volver a ponerlo tras cambios de esquema.

2026-06-17 — Sesion larga. Todo en produccion. Foco: panel de redes (publicacion), asistente Kyo, vacantes e infra de deploys.

**Redes sociales / revisor:**
- Campo `publicado` (booleano) en `social_posts`: las publicaciones nacen como **borrador (solo admin)** hasta darles "📤 Publicar al cliente". El revisor (cliente) solo ve `publicado=true`. Badge "Borrador" en el calendario; boton publicar/ocultar en el detalle.
- **Editar publicaciones en su lugar** (texto, imagenes, fecha, red) con boton "✏️ Editar" — endpoint `PUT` en `/api/admin/social/posts/[id]/versions` que NO crea version ni notifica al cliente. Esto tambien arreglo cargar imagen desde vista mes.
- **Importador con checkboxes**: seleccionar/deseleccionar piezas antes de "Crear", con "Seleccionar/Quitar todas" y aviso suave de "Fin de semana".
- **Bloqueo de fechas pasadas** en alta manual e importador (front + back).
- **Arrastrar publicaciones**: drag&drop para mover de dia o soltar sobre otra para intercambiar fechas (admin). Guarda via el PUT con guarda de fecha pasada.
- **Vista Mes = calendario real** (Dom→Sab, semanas por fila) en admin y en vista cliente. Eventos compactos con barra de color por estado.

**Asistente Kyo + sitio — NO damos DC-3 ni validez STPS:**
- Kyoszen NO emite certificaciones DC-3 ni constancias con validez oficial STPS; solo **constancia de participacion**. Corregido en `knowledge.ts` (FAQ + servicio), **regla dura** en `system-prompt.ts` (ignora cualquier dato viejo de DC-3), y en el sitio publico (servicios, cursos, home/Courses, `courses.ts` curso NOM-035/LFT) + placeholders admin/parser. `salarios.ts` conserva STPS como fuente de datos salariales (legitimo).
- IMPORTANTE: las **Instrucciones** del panel de Kyo = personalidad/comportamiento; los **hechos** (servicios, FAQs) viven en `knowledge.ts`. Para cambiar un hecho hay que tocar la base de conocimiento, no solo las instrucciones.

**Vacantes:**
- Campos nuevos (migraciones aplicadas a tabla `vacantes`): `salario_nota` text (ej "Neto · pago semanal", reemplaza el "MXN bruto" fijo), `beneficios` text[] (seccion "Prestaciones y beneficios"), `horario` text (seccion "Horario laboral", multilinea).
- **Empresa opcional**: si se deja vacia, el sitio muestra "Confidencial".
- Sexo/Edad/Escolaridad se ponen como **requisitos** (texto libre). El parser de IA captura salario_nota, beneficios, horario y manda esos datos a requisitos.
- **Guardado seguro**: el form detecta updates de 0 filas (RLS/sesion vencida) y avisa, en vez de redirigir como si hubiera guardado.
- Boton **"Ver"** en el listado admin (abre la vacante publica en pestaña nueva).

**Infra de deploys (mas confiables):**
- Hook de pre-push: lint ahora **informativo (no bloquea)**; TypeScript sigue como candado duro. (El cambio esta commiteado; aplica del todo en la proxima sesion.)
- `deploy.sh` del VPS **robusto**: `flock` (un deploy a la vez), mata builds colgados, y si el build falla limpia `.next` y reintenta. Copia de referencia en `.claude/deploy-vps.sh`. Respaldo del anterior en el VPS (`deploy.sh.bak.*`).
- `.gitattributes` con `CLAUDE.md merge=union` para evitar conflictos al rebasear entre las 2 Macs.
- OJO: el **VPS tiene un cron** (`health-check.sh`, `watchdog.sh`) que auto-commitea "health check"/"ux-kyo analysis" y los pushea a `origin/main`. Por eso origin avanza solo: **siempre `git fetch` antes de pushear** y no asustarse si HEAD del VPS != tu ultimo commit (tu commit queda como ancestro).

2026-06-08 — Continuacion. En produccion:
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
