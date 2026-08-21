# Kyoszen

## 1. Identidad
- **Nombre:** Kyoszen — sitio corporativo y plataforma interna de operación
- **Una línea:** Sitio público, panel de administración y portal de aprobación de contenido para una consultoría de capital humano.
- **Primer commit:** 2026-04-13 (`Initial commit - Kyoszen website`, autor Renato Machado)
- **Último commit:** 2026-08-20 (`chore: ux-kyo analysis 2026-08-20`)
- **Commits totales:** 345 en `main` (350 contando todas las ramas). De esos, 195 son commits de trabajo y 150 son commits automáticos generados por tareas programadas en el servidor (`ux-kyo analysis`, `health check`, `dependency report`).
- **Estado actual:** En producción. Evidencia en el repositorio: workflow de GitHub Actions `.github/workflows/deploy.yml` que despliega por SSH a `76.13.111.112` en cada push a `main`; script `.claude/deploy-vps.sh` con `git pull` + `npm run build` + `pm2 startOrRestart`; `CLAUDE.md` documenta el dominio `kyoszen.com` sobre VPS Hostinger con Nginx y SSL. Actividad continua durante 5 meses sin interrupciones (abril a agosto de 2026).

**Distribución de actividad por mes (rama `main`):**

| Mes | Commits totales | Commits de trabajo |
|---|---|---|
| 2026-04 | 77 | 77 |
| 2026-05 | 81 | 33 |
| 2026-06 | 91 | 41 |
| 2026-07 | 57 | 21 |
| 2026-08 | 39 | 23 |

**Periodos de actividad concentrada:** 2026-04-15 (58 commits en un solo día — migración del sitio estático a Next.js), 2026-06-01 y 2026-06-17 (9 y 8 commits), 2026-05-31, 2026-05-20 y 2026-05-07 (8 commits cada uno).

**Autoría de commits:** `Claude` 228, `Renato Machado` 104, `renatomachg` 18. La firma `Claude` corresponde a commits generados mediante asistente de código bajo dirección del autor y a los 150 commits automáticos de las tareas programadas del servidor; el diseño, la decisión técnica y la aprobación de cada entrega son del autor humano.

## 2. Problema que resuelve

El repositorio arranca con un sitio corporativo en HTML estático (los archivos `index.html`, `servicios.html`, `cursos.html`, `vacantes.html`, `nosotros.html` y `contacto.html` siguen en la raíz como vestigio del punto de partida). El proyecto lo convierte en una aplicación con backend y, a partir de ahí, absorbe la operación diaria de la consultoría en tres frentes que antes vivían fuera de cualquier sistema:

1. **Contenido del sitio sin dependencia técnica.** Vacantes, cursos, blog, testimonios y textos del sitio pasaron de estar escritos en el código a estar en base de datos con un panel de edición (`/admin`). Publicar una vacante deja de requerir un despliegue.

2. **Aprobación de contenido con el cliente.** El módulo `/revisor` es un portal donde el cliente final revisa y aprueba —pieza por pieza— publicaciones de redes sociales, campañas pagadas de Facebook y entregables de proyectos de video, con hilo de comentarios y notificación por correo en cada cambio de estado. Todo nace en borrador y solo se vuelve visible para el cliente cuando el administrador lo publica (`social_posts.publicado`, `campanas.publicado`, `proyecto_espacios.publicado`).

3. **Captación de candidatos.** Las aplicaciones que llegan por el sitio se consolidan en una base de candidatos con pipeline de estados y un motor de coincidencia candidato–vacante (`/admin/crm`).

[CONFIRMAR: ¿qué herramientas usaba el equipo para aprobar contenido con el cliente antes de este portal (correo, WhatsApp, hojas de cálculo, Drive)?]

## 3. Qué hace (alcance funcional)

1. **Sitio público** con home, servicios, nosotros, catálogo de cursos, bolsa de vacantes con detalle y aplicación en línea, blog y contacto. Formularios de aplicación y contacto que guardan en base de datos y notifican por correo.
2. **Panel de administración** con 20 secciones (vacantes, cursos, blog, testimonios, aplicaciones, CRM, contactos, redes sociales, campañas, proyectos, cuestionarios, contenido, SEO, correos, analítica, asistente, servidor, actividad, usuarios, dashboard), con control de acceso por rol y por sección.
3. **Portal de revisión para el cliente** (`/revisor`): aprueba o pide cambios sobre publicaciones de redes, anuncios de campañas pagadas y entregables de proyectos, con comentarios, versionado e historial de la propuesta anterior.
4. **Asistente conversacional en el sitio** ("Kyo") que responde con datos reales del catálogo mediante seis herramientas: buscar vacantes, ver detalle de vacante, buscar cursos, ver detalle de curso, datos de la empresa y navegación guiada.
5. **Importadores asistidos por IA** que convierten documentos de trabajo en registros de la plataforma: planes de contenido mensual (HTML/texto/PDF), sets de TikTok de tres documentos, briefs de campañas de Facebook (texto, PDF o capturas de pantalla) y guiones de video en PDF.
6. **Módulo de campañas pagadas** con aprobación anuncio por anuncio, simulación del formulario de captación que verá el candidato y lectura de resultados reales desde la API de Meta (alcance, impresiones, clics, gasto).
7. **Analítica propia** con 16 tipos de evento instrumentados en el sitio, panel de indicadores, embudo de vacantes y generación de reportes periódicos en PDF con diseño de marca.
8. **Herramientas comerciales** de cara al prospecto: calculadora de costo de rotación de personal y comparador de salarios de mercado.

## 4. Cómo funciona (arquitectura)

### Stack
- **Framework:** Next.js 16.2.3 (App Router) sobre React 19.2.4
- **Lenguaje:** TypeScript en modo estricto
- **Estilos:** Tailwind CSS v4; animación con Framer Motion 12
- **Base de datos, autenticación y almacenamiento:** Supabase (PostgreSQL + Auth + Storage)
- **IA:** SDK de Anthropic (`@anthropic-ai/sdk` 0.89)
- **Correo:** Nodemailer sobre SMTP de IONOS
- **Utilidades:** `unpdf` (extracción de texto de PDF), `puppeteer` (generación de PDF con diseño), `marked` (markdown del blog), `nspell` + `dictionary-es` (revisión ortográfica en español)
- **Infraestructura:** VPS Ubuntu con PM2, Nginx como proxy inverso y certificado Certbot

### Componentes principales

| Ruta | Responsabilidad |
|---|---|
| `src/app/` (páginas públicas) | Sitio corporativo: home, servicios, cursos, vacantes, blog, contacto, calculadora, comparador de salarios |
| `src/app/admin/(panel)/` | Panel de administración, 20 secciones bajo un layout con guardia de sesión |
| `src/app/revisor/` | Portal del cliente para aprobación de contenido |
| `src/app/cuestionario/[token]/` | Cuestionario de levantamiento por enlace con token, sin registro |
| `src/app/api/` | 80 rutas de servidor, agrupadas en `admin/`, `revisor/`, `assistant/`, `cuestionario/`, `analytics/` y los formularios públicos |
| `src/lib/admin-auth.ts` | Autorización de todas las rutas `/api/admin/*`: valida el token de sesión de Supabase, exige fila activa en `admin_perfiles` y comprueba el permiso de sección |
| `src/lib/crm/matching.ts` | Motor de coincidencia candidato–vacante (puntuación y explicación) |
| `src/lib/social-informe.ts` | Cálculo de métricas del informe mensual y detección de patrones a partir de datos propios |
| `src/lib/meta-insights.ts` | Lectura de resultados desde la API de Meta, solo lectura |
| `src/lib/google-drive.ts` | Subida a Google Drive con OAuth para archivar video publicado |
| `src/lib/assistant/` | Base de conocimiento, prompt de sistema y definición de herramientas del asistente |
| `src/lib/campanas.ts`, `proyectos.ts` | Reglas de negocio: consolidación de estado (rollup) y bloqueo de etapas |
| `scripts/render/` | Generador de imágenes para redes sociales con plantillas HTML/CSS renderizadas por Puppeteer |

### Integraciones externas
- **Supabase** — base de datos PostgreSQL, autenticación (panel y clientes revisores comparten la misma instancia) y almacenamiento de archivos en el bucket `media`.
- **API de Anthropic** — dos modelos en uso: `claude-haiku-4-5-20251001` en diez puntos del código (parseo de documentos, asistente del sitio, redacción de informes, sugerencias de SEO, autocompletado de fichas) y `claude-opus-4-5` en dos (el agente "Estratega" y el importador de campañas cuando recibe capturas de pantalla, por requerir visión).
- **API de OpenAI** — dependencia declarada con variable `OPENAI_API_KEY`. [CONFIRMAR: ¿sigue en uso o quedó como dependencia residual?]
- **Meta Graph API** (`v26.0`, configurable por `META_API_VERSION`) — lectura de resultados de anuncios: impresiones, alcance, clics, gasto, CPM, CPC, CTR, frecuencia y acciones. Explícitamente de solo lectura.
- **Google Drive** (OAuth con alcance `drive.file`) — archivado de videos ya publicados para liberar almacenamiento.
- **SMTP de IONOS** — 14 archivos del código envían notificaciones por correo.

### Flujo de datos
- **Entradas:** formularios del sitio (aplicación a vacante, contacto, solicitud de informes de curso), eventos de analítica desde el navegador, documentos que el equipo carga en los importadores (HTML, texto, PDF, imágenes), archivos y videos subidos al panel, respuestas del cuestionario de levantamiento y resultados traídos desde Meta.
- **Proceso:** las rutas de servidor validan la sesión y el permiso de sección, escriben en PostgreSQL vía `service_role` y, cuando corresponde, disparan notificación por correo. Los importadores pasan el documento por un modelo de lenguaje con un esquema de salida definido y devuelven una vista previa; nada se escribe hasta que el administrador confirma en un segundo paso.
- **Salidas:** el sitio público lee de la base de datos (vacantes y cursos activos, entradas de blog, testimonios); el portal del cliente lee solo lo marcado como publicado; el panel produce reportes en PDF y correos de notificación; los eventos alimentan el panel de analítica y el informe mensual.

### Automatización
- **Despliegue continuo:** GitHub Actions dispara en cada push a `main` una conexión SSH al VPS que ejecuta `git pull`, `npm install`, `npm run build` y `pm2 restart`. El script `deploy-vps.sh` refuerza esto con un candado `flock` para impedir despliegues simultáneos, limpieza de builds colgados y un reintento con `.next` limpio si el build falla.
- **Candado de calidad antes de subir código:** un hook local ejecuta `npx tsc --noEmit` y bloquea el `git push` si hay errores de tipos; el linter corre en modo informativo.
- **Tareas programadas en el servidor:** generan y commitean automáticamente reportes de salud del sitio, análisis de experiencia de uso del asistente y reporte de dependencias. Su rastro son 150 commits en `main` y los archivos de `reports/` (`salud-sitio.md`, `ux-kyo.md`, `dependencias.md`, `backlog.md`, reportes de tendencias mensuales). [CONFIRMAR: ¿con qué frecuencia exacta corre cada tarea programada en el VPS? La definición del cron vive en el servidor, no en el repositorio.]
- **Notificaciones por evento:** cada cambio de estado en el portal del cliente (aprobado, cambios solicitados, nueva versión publicada) dispara correo a los revisores activos.
- **Pendiente documentado:** el envío automático del resumen periódico guarda la preferencia pero el cron correspondiente aún no está montado en el servidor.

## 5. Proceso manual que sustituye o reduce

- **Publicar contenido del sitio.** Antes, cada vacante, curso o entrada de blog vivía en el código (`src/lib/jobs.ts` y `src/lib/courses.ts` siguen en el repositorio como respaldo, con 75 cursos en 11 categorías). Ahora se crean desde el panel y el sitio los lee de la base de datos, sin tocar código ni desplegar. [CONFIRMAR: ¿cuánto tiempo tomaba publicar una vacante antes del panel?]
- **Capturar una campaña de Facebook.** Una campaña son un encabezado más N anuncios, cada uno con su formulario de captación de hasta siete preguntas. El importador lo reconstruye desde el brief pegado, un PDF o capturas de pantalla del administrador de anuncios, incluyendo formularios descritos por referencia ("igual al anterior pero cambiando la pregunta 3"). [CONFIRMAR: ¿cuánto tiempo tomaba capturar a mano una campaña de tres anuncios?]
- **Cargar el plan de contenido mensual.** El plan que entrega la agencia se pega o se sube y queda convertido en publicaciones fechadas en el calendario, con detección de duplicados por día y red para no pisar lo ya cargado. [CONFIRMAR: ¿cuánto tiempo tomaba capturar un mes de publicaciones a mano?]
- **Rondas de aprobación con el cliente.** El estado de cada pieza, el motivo del cambio solicitado y la versión anterior quedan registrados en el sistema, con aviso por correo automático, en lugar de vivir en una conversación. [CONFIRMAR: ¿cuántas rondas de revisión tomaba un mes de contenido antes del portal?]
- **Revisar aplicaciones recibidas.** El sincronizador consolida aplicaciones en candidatos únicos deduplicando por correo y WhatsApp, y el motor de coincidencia propone candidatos anteriores para cada vacante activa con una explicación en texto de por qué encajan. [CONFIRMAR: ¿cómo se revisaban y reutilizaban las aplicaciones anteriores antes del CRM?]
- **Armar el informe mensual de redes.** Las métricas se calculan de los datos propios del sitio y de las publicaciones; el modelo redacta resumen, decisiones y propuestas sobre esos datos, y el administrador edita antes de publicar al cliente. [CONFIRMAR: ¿cuánto tiempo tomaba armar el informe mensual antes?]

## 6. Escala y volumen

Cifras contadas directamente sobre el código en el commit auditado:

| Métrica | Valor |
|---|---|
| Rutas de API (`route.ts`) | 80 |
| Páginas (`page.tsx`) | 45 |
| Archivos TypeScript/TSX en `src/` | 205 |
| Componentes React en `src/components/` | 38 |
| Líneas de código en `src/` (TS, TSX, CSS) | 40,085 |
| Líneas de código incluyendo `scripts/` | 40,802 |
| Líneas en `src/app/api/` | 9,398 |
| Líneas en `src/app/admin/` | 12,633 |
| Líneas en `src/components/` | 8,812 |
| Líneas en `src/lib/` (lógica de negocio) | 3,896 |
| Tablas de PostgreSQL referenciadas desde el código | 39 |
| Secciones del panel con permiso independiente | 20 |
| Tipos de evento de analítica instrumentados | 16 |
| Herramientas del asistente conversacional | 6 |
| Variables de entorno requeridas | 20 |
| Archivos que envían notificación por correo | 14 |
| Cursos en el catálogo de respaldo | 75, en 11 categorías |
| Puestos en el comparador de salarios | 35 (estimados de mercado, no de una fuente en vivo) |
| Nodos del cuestionario de levantamiento | 34, en 8 secciones, 13 de ellos condicionales |
| Migraciones SQL versionadas en el repositorio | 7 archivos |
| Plantillas HTML del generador de imágenes | 8 |
| Cuentas de cliente revisor documentadas | 3 (dos productivas, una de prueba) |

**Sobre el motor de coincidencia:** puntuación de 0 a 100 sobre un máximo teórico de 100 puntos — ubicación 40, categoría 35 y hasta cinco coincidencias de palabra clave de 5 puntos cada una — con normalización de acentos, lista de palabras vacías en español y una razón en texto por cada punto otorgado.

[CONFIRMAR: ¿cuántas vacantes, aplicaciones, candidatos, publicaciones y conversaciones con el asistente hay hoy en la base de datos de producción? Esos volúmenes viven en Supabase, no en el repositorio.]
[CONFIRMAR: ¿cuántas visitas recibe el sitio al mes?]

## 7. Decisiones técnicas relevantes

**Tablas propias para campañas en lugar de reutilizar las de publicaciones.** Una campaña pagada no es una pieza suelta del calendario: es un encabezado con N anuncios hijos, cada uno con su propio formulario y su propio ciclo de aprobación. Reutilizar `social_posts` habría metido los anuncios en el calendario editorial y ensuciado el informe mensual. Se crearon `campanas`, `campana_anuncios` y `campana_comentarios`, copiando de redes sociales solo el patrón que sí aplicaba: estados `pendiente|aprobado|cambios`, hilo de comentarios y bandera `publicado` como barrera con el cliente. El estado de la campaña se consolida hacia arriba: aprobada solo cuando todos sus anuncios lo están, con cambios si alguno los pide.

**Cierre del panel administrativo después de haber estado abierto.** Las rutas `/api/admin/*` operaban con la clave `service_role` sin validar quién llamaba: cualquiera que conociera la URL podía invocarlas desde internet. La corrección (commits del 11 y 12 de agosto de 2026) introdujo `src/lib/admin-auth.ts`, que valida el token real de Supabase en el encabezado `Authorization` y exige una fila activa en `admin_perfiles`. El detalle que hacía peligrosa la solución obvia está anotado en el propio código: la misma instancia de Supabase Auth guarda las cuentas de los clientes del portal `/revisor`, así que tratar la ausencia de perfil como "es administrador" les habría abierto el panel completo. Sobre esa base se construyó control por sección y por proyecto, para que un colaborador externo vea solo lo suyo.

**Los importadores separan leer de escribir.** Todos los importadores asistidos por IA operan en dos acciones explícitas: `analizar`, que solo lee el documento y devuelve una propuesta, y `crear`, que inserta lo que el administrador dejó seleccionado. La salida del modelo nunca llega a la base de datos sin que un humano la revise en pantalla y descarte lo que no quiere. En el importador de planes, el parseo se reparte por semana en llamadas paralelas, reduciendo el tiempo de procesamiento de un mes de contenido de aproximadamente 58 a 18 segundos según lo documentado en el repositorio.

**Fuente de datos intercambiable en el informe mensual.** El informe se diseñó con un campo `fuente: 'sitio' | 'meta'` desde la primera versión, calculando métricas de datos propios (`site_eventos`, publicaciones, contactos, aplicaciones) mientras se resolvía el acceso a la API de Meta —que requiere aplicación de desarrollador, permisos y revisión. Cuando el acceso llegó, se conectó `meta-insights.ts` sin rehacer el panel de presentación.

**Despliegue endurecido después de fallar.** El script de despliegue no es un `git pull` más `restart`. Incorpora un candado `flock` para que dos despliegues simultáneos no produzcan el error de build concurrente de Next.js, mata builds colgados antes de empezar, reintenta una vez con `.next` limpio si el build falla, y recrea el archivo de configuración de PM2 si no existe —porque ese archivo contiene secretos y por diseño no está en el repositorio.

**Compresión de video en el servidor.** Subir un video fallaba por dos límites acumulados: 1 MB en Nginx y 10 MB en el bucket de Supabase. Se subieron ambos, pero el tope real del plan contratado son 50 MB, así que el endpoint de subida transcodifica el video con ffmpeg antes de almacenarlo (escalado a 1080 px, H.264, `+faststart` para reproducción progresiva), con retorno al archivo original si ffmpeg no está disponible en el entorno. El archivado posterior a Google Drive genera una carátula, sube el original y solo entonces borra de Supabase: si la subida falla, no se borra nada.

## 8. Habilidades demostradas

- Desarrollo full-stack con Next.js App Router, React 19 y TypeScript estricto, sobre una base de 40,000 líneas y 80 rutas de servidor.
- Diseño de modelo de datos relacional en PostgreSQL: 39 tablas con relaciones jerárquicas, autorreferencia (carpetas anidadas), versionado de contenido y restricciones de unicidad sobre columnas nulables.
- Implementación de control de acceso basado en roles y permisos por sección sobre Supabase Auth, incluyendo la remediación de rutas administrativas previamente expuestas.
- Integración de APIs REST de terceros: Meta Graph API (lectura de métricas de anuncios con versión configurable), Google Drive (OAuth con alcance mínimo y subida multiparte) y SMTP transaccional.
- Aplicación de modelos de lenguaje a procesos de negocio: extracción estructurada desde documentos no estructurados (HTML, PDF, capturas de pantalla), uso de herramientas (tool use) en un asistente conversacional con datos en vivo, y salida validada contra esquema con revisión humana obligatoria antes de persistir.
- Selección de modelo por costo y capacidad: modelo económico para tareas de parseo de alto volumen, modelo de mayor capacidad reservado para razonamiento y visión.
- Procesamiento de documentos y multimedia en servidor: extracción de texto de PDF, transcodificación de video con ffmpeg, generación de carátulas y producción de PDF con diseño de marca mediante renderizado headless.
- Diseño de flujos de aprobación con estados, versionado, consolidación jerárquica de estado y bloqueo de etapas dependientes.
- Implementación de algoritmo de coincidencia con puntuación ponderada, normalización de texto en español y explicación legible de cada resultado.
- Construcción de sistema de analítica propio, desde la instrumentación en el navegador hasta el panel de indicadores y la generación de reportes periódicos.
- Automatización de despliegue continuo: GitHub Actions sobre SSH, gestión de procesos con PM2, Nginx como proxy inverso, certificados TLS automatizados, y un script de despliegue con control de concurrencia y recuperación ante fallo de build.
- Aseguramiento de calidad mediante automatización: verificación de tipos como candado bloqueante antes de subir código, revisión ortográfica en español y reportes periódicos automáticos de salud y dependencias.
- Diseño de producto orientado a usuario no técnico: separación estricta entre lo que ve el equipo interno y lo que ve el cliente, guías interactivas de primer uso, diálogos de confirmación con contexto explícito del impacto y mensajes de error en lenguaje llano.
- Documentación técnica sostenida como base de conocimiento del proyecto, con especificaciones por módulo, migraciones versionadas y guía de marca.

## 9. Puntos a confirmar

1. ¿Qué herramientas usaba el equipo para aprobar contenido con el cliente antes de este portal (correo, WhatsApp, hojas de cálculo, Drive)?
2. ¿Sigue en uso la integración con OpenAI (`OPENAI_API_KEY`) o quedó como dependencia residual?
3. ¿Con qué frecuencia exacta corre cada tarea programada del VPS (salud del sitio, análisis de experiencia, reporte de dependencias)? La definición del cron vive en el servidor, no en el repositorio.
4. ¿Cuánto tiempo tomaba publicar una vacante antes del panel de administración?
5. ¿Cuánto tiempo tomaba capturar a mano una campaña de Facebook con tres anuncios y sus formularios?
6. ¿Cuánto tiempo tomaba capturar un mes completo de publicaciones en el calendario a mano?
7. ¿Cuántas rondas de revisión tomaba aprobar un mes de contenido con el cliente antes del portal?
8. ¿Cómo se revisaban y reutilizaban las aplicaciones de candidatos anteriores antes del CRM?
9. ¿Cuánto tiempo tomaba armar el informe mensual de redes antes de que se generara desde el panel?
10. ¿Cuántas vacantes, aplicaciones, candidatos, publicaciones y conversaciones con el asistente hay hoy en la base de datos de producción?
11. ¿Cuántas visitas recibe el sitio al mes?
12. ¿Cuántas personas usan el panel de administración y cuántos clientes usan el portal de revisión hoy?
13. ¿El proyecto se desarrolló como trabajo interno, como servicio a un cliente externo o bajo qué relación contractual?

## 10. Resumen ejecutivo

Kyoszen es la plataforma digital de una consultoría de capital humano en México: un sitio corporativo con bolsa de vacantes y catálogo de cursos, un panel de administración de veinte secciones que le da al equipo control total del contenido sin depender de nadie técnico, y un portal donde el cliente final aprueba —pieza por pieza, con comentarios y aviso por correo— las publicaciones de redes, las campañas pagadas y los entregables de video antes de que salgan al público. Alrededor de ese núcleo se construyeron piezas que absorben trabajo manual: importadores que convierten un brief, un PDF o unas capturas de pantalla en registros listos para revisar, una base de candidatos que deduplica las aplicaciones recibidas y sugiere quién encaja en cada vacante nueva, un sistema de analítica propio y un informe mensual de resultados. Son cinco meses de trabajo continuo (abril a agosto de 2026), 345 commits, 40,000 líneas de código, 80 rutas de servidor y 39 tablas de base de datos, con despliegue automatizado a servidor propio en cada cambio aprobado. El valor no está en el sitio: está en que la operación diaria de la consultoría —publicar, aprobar con el cliente, dar seguimiento a candidatos y medir resultados— dejó de vivir en conversaciones sueltas y pasó a un sistema donde cada decisión queda registrada.
