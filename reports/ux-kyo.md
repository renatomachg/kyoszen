# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-05
**Cambios analizados:**
- `src/app/admin/login/page.tsx` (login por usuario sin correo)
- `src/app/admin/(panel)/layout.tsx` (roles + access control)
- `src/app/admin/(panel)/usuarios/page.tsx` (CRUD de usuarios con permisos)
- `src/app/api/admin/usuarios/route.ts` (API creación/listado)
- `src/app/api/admin/usuarios/[id]/route.ts` (API edición/borrado)
- `src/app/api/admin/usuarios/resolver/route.ts` (resuelve usuario→email)
- `src/app/api/revisor/proyectos/[id]/bloques/[bloqueId]/status/route.ts` (notif await fix)
- `src/app/api/revisor/proyectos/espacios/[id]/archivos/[archivoId]/status/route.ts`
- `src/lib/admin-secciones.ts`
- `src/lib/admin-usuarios.ts`
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`

## Cambios Recientes Detectados

**Commit `0dc92f7` + `c6ce339` (2026-08-03/04):** Sistema de roles y gestión de usuarios en el panel admin. Los colaboradores ahora pueden tener login por username (ej. `carlos.garcia`) sin necesidad de correo electrónico real. El layout del panel filtrado las secciones según el rol. Se añadió asignación de proyectos específicos por colaborador.

**Commit `20b13ac` (2026-08-04):** Fix de notificaciones en Proyectos Hub: las llamadas a `notifyAdmin` ahora usan `await` en lugar de fire-and-forget, con logs de error explícitos.

---

## Sugerencias de UX

### Alta prioridad

- **[login/page.tsx:95] Sin recuperación de contraseña para colaboradores**: El formulario de login no tiene enlace "¿Olvidé mi contraseña?". Un colaborador que olvida su contraseña temporal no puede recuperarla — depende 100% de que Renato entre a `/admin/usuarios` y genere una nueva. Como el admin no puede cambiar contraseñas desde la UI actual (solo se muestran al crear), el flujo queda bloqueado. Solución mínima: añadir bajo el botón de enviar un texto `"¿Problemas para entrar? Escríbele a Renato por WhatsApp."` con el link `https://wa.link/5zv0ba`. Solución completa: añadir en `/admin/usuarios` un botón "Restablecer contraseña" que llame a `sb.auth.admin.generateLink({ type: 'recovery', email })` y muestre la nueva contraseña temporal al admin.

- **[usuarios/page.tsx:497] Campo de contraseña temporal visible (`type="text"`)**: El campo de contraseña al crear un usuario es de tipo texto plano (línea 497). Si alguien pasa detrás del admin en ese momento, ve la contraseña en pantalla. Cambiar a `type="password"` y añadir un botón show/hide:
  ```tsx
  const [mostrarPass, setMostrarPass] = useState(false);
  <div className="relative">
    <input
      type={mostrarPass ? "text" : "password"}
      ...
    />
    <button type="button" onClick={() => setMostrarPass(v => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
      {mostrarPass ? "Ocultar" : "Ver"}
    </button>
  </div>
  ```

- **[layout.tsx:268] Email interno confuso en el sidebar**: El footer del sidebar muestra `user?.email` (línea 268). Para colaboradores con login por username, ese email es `nombre.apellido@acceso.kyoszen.com` — un correo ficticio que el colaborador nunca vio y puede generar confusión ("¿tengo un correo del trabajo que no sabía?"). Mostrar el `nombre` del perfil si existe, o el `usuario` si no hay correo real:
  ```tsx
  // En el layout, después de cargar el perfil, guardar también el display name:
  const [displayName, setDisplayName] = useState("");
  // En cargarAcceso():
  setDisplayName(data?.nombre || data?.usuario || session.user.email || "");
  // En el footer:
  <p className="text-white/40 text-[11px] truncate">{displayName}</p>
  ```

- **[usuarios/page.tsx:277] Confirmación de borrado con `window.confirm()` nativo**: El diálogo nativo del browser para confirmar el borrado de un usuario es brusco e inconsistente con el estilo del panel. No indica las consecuencias reales (se pierde acceso de autenticación). Reemplazar con un estado de confirmación inline:
  ```tsx
  const [confirmarBorradoId, setConfirmarBorradoId] = useState<string | null>(null);
  // En la fila del usuario:
  {confirmarBorradoId === usuario.user_id ? (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-red-600 font-bold">¿Confirmar borrado?</span>
      <button onClick={() => { setBorradoId(null); borrarConfirmado(usuario); }} className="text-[11px] text-red-600 font-black">Sí</button>
      <button onClick={() => setConfirmarBorradoId(null)} className="text-[11px] text-muted">No</button>
    </div>
  ) : (
    <button onClick={() => setConfirmarBorradoId(usuario.user_id)}>Borrar</button>
  )}
  ```

### Media prioridad

- **[layout.tsx:49] Split de secciones por índice hardcodeado**: `SECCIONES_PRINCIPALES = ADMIN_SECCIONES.slice(0, 9)` y `SECCIONES_HERRAMIENTAS = ADMIN_SECCIONES.slice(9)` (líneas 49-50). Si `admin-secciones.ts` alguna vez reordena las secciones (ej. mover CRM arriba), el separador visual del sidebar se mueve en silencio a otro lugar. Añadir un campo `grupo: "principal" | "herramienta"` en `ADMIN_SECCIONES` y filtrar por ese campo en lugar del slice por índice. Es un cambio quirúrgico de 2 archivos que previene un bug difícil de detectar.

- **[usuarios/page.tsx:464] Campo "Nombre" sin `required`**: El nombre del usuario es opcional en el formulario (línea 464-475), pero en la lista se muestra como "Sin nombre" si está vacío (línea 705). En la práctica es el identificador principal visible. Hacer `required` el campo nombre para colaboradores — el username ya es identificador técnico; el nombre es para que el admin sepa quién es quién.

- **[layout.tsx:283-293] "Sin secciones asignadas" sin acción clara para el colaborador**: El estado de error cuando un colaborador no tiene secciones (líneas 283-293) muestra un mensaje explicativo correcto, pero no da ninguna instrucción de a quién contactar ni cómo. Añadir debajo del párrafo:
  ```tsx
  <a href="https://wa.link/5zv0ba"
    className="inline-flex items-center gap-2 mt-4 bg-yellow text-navy rounded-xl px-4 py-2 text-sm font-bold">
    Contactar al administrador
  </a>
  ```

- **[usuarios/page.tsx:578-650] El panel de proyectos dice "videos" cuando aplica a cualquier espacio**: El label dice "El colaborador solo verá los **videos** seleccionados." (línea 581). Pero el módulo de Proyectos ahora incluye espacios de tipo `artes`, `tablero`, `aprobacion` — no solo videos. Cambiar a "El colaborador solo verá los **proyectos** seleccionados."

---

## Sugerencias para el Asistente Kyo

*(Nota: Kyo no recibió cambios en este ciclo. Se reportan issues pendientes del ciclo anterior que siguen sin corregirse.)*

### Mejoras al flujo de conversación (PENDIENTES DEL CICLO ANTERIOR)

- **[useChat.ts:20] Tilde faltante en el saludo inicial — SIGUE SIN CORREGIR**: `"estoy aqui para orientarte"` — falta acento en "aquí". Es la primera impresión del candidato. El modelo de Kyo leen esta cadena en español y la inconsistencia ortográfica puede afectar cómo calibra su tono. Corrección de 3 caracteres:
  ```typescript
  content: "Bienvenido a Kyoszen. Mi nombre es Kyo y estoy aquí para orientarte. ¿Me permite saber su nombre?",
  ```

- **[ChatWidget.tsx:160] "Nueva conversacion" sin tilde y con estilo casi invisible**: El botón de reset (línea 159-163) sigue con texto `"Nueva conversacion"` (sin tilde) y en `text-[11px] text-muted font-medium` — casi invisible. Corregir texto y mejorar visibilidad:
  ```tsx
  <button
    type="button"
    onClick={reset}
    className="text-[12px] text-muted hover:text-navy font-semibold flex items-center gap-1.5 border border-border rounded-full px-3 py-1 hover:border-navy/40 transition-colors"
  >
    Nueva conversación
  </button>
  ```

- **[chat/route.ts:202] Fallback sin tilde y poco empático — SIGUE SIN CORREGIR**: `"Entendido, ¿en que mas te puedo ayudar?"` — falta tilde en "más" y el mensaje suena robótico cuando aparece tras un error de la API. Corregir:
  ```typescript
  const replyContent = finalText || "Perdona, tuve un problema procesando tu mensaje. ¿Podrías repetirme tu pregunta?";
  ```

- **[system-prompt.ts:138] `toLocaleString()` sin locale en el VPS — SIGUE SIN CORREGIR**: En Node.js sobre Linux el locale puede ser POSIX, produciendo `12000` en lugar de `$12,000`. El candidato recibe un número sin formato de parte de Kyo. Corregir en `buildSystemPrompt`:
  ```typescript
  const fmtSalario = (s: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(s);
  // línea 138:
  `· ${fmtSalario(j.salario ?? 0)}/mes`
  ```

- **[knowledge.ts:167] Kyo recomienda vacantes del archivo estático, no de Supabase — SIGUE SIN CORREGIR**: El sitio público lee de Supabase en tiempo real; Kyo usa `jobs.ts` con vacantes hardcoded. Un candidato puede ver vacantes en `/vacantes` que Kyo no conoce, o recibir recomendaciones de vacantes ya inactivas. Esta es la deuda más crítica del asistente. Ver implementación en el reporte del 2026-08-03.

### Nuevas issues detectadas en este ciclo

- **[admin-secciones.ts:7] Colaboradores asignados a "Asistente Kyo" pueden editar el system prompt**: La sección `kyo` da acceso a `/admin/kyo`, que incluye el editor de instrucciones y el test en vivo del asistente. Un colaborador (ej. fotógrafo asignado a "proyectos") con acceso a "kyo" puede modificar el comportamiento del asistente en producción. En `/admin/usuarios`, mostrar una advertencia al seleccionar "Asistente Kyo":
  ```tsx
  {seccion.key === "kyo" && seleccionada && (
    <p className="text-[10px] text-amber-700 font-bold mt-1 col-span-full">
      ⚠ Permite editar las instrucciones del asistente en producción.
    </p>
  )}
  ```

- **[status/route.ts:69] Correo de notificación de proyectos hardcodeado**: La función `notifyAdmin` en el route de status de bloques (línea 69) envía a `renatomachg@gmail.com` directamente en el código, en lugar de leer de `site_config.resumen_email` como hacen los otros módulos. Si el correo destino cambia, este módulo queda desactualizado. Corregir:
  ```typescript
  // En getSmtp(), añadir "resumen_email" al select:
  .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from", "resumen_email"])
  // En notifyAdmin():
  to: smtp.resumen_email || "renatomachg@gmail.com",
  ```

- **[useChat.ts:94-102] Sin timeout en fetch a Kyo — SIGUE SIN CORREGIR**: El fetch no tiene AbortController. Con 5 iteraciones de tool-use bajo carga del VPS, `isLoading` puede quedar en `true` indefinidamente. En el contexto del nuevo módulo de usuarios (más carga en la API), esto es más probable. Añadir:
  ```typescript
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);
  try {
    const res = await fetch('/api/assistant/chat', {
      ...,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      setError('Kyo tardó demasiado. Por favor intenta de nuevo.');
      return;
    }
    // ...existing error handling
  }
  ```

### Nuevas tools o capacidades recomendadas

- **`reset_collaborator_password` (admin tool)**: No es una tool de Kyo sino una capacidad del panel admin. La ausencia de reset de contraseña para colaboradores es el bloqueador más práctico del módulo de usuarios recién lanzado. Implementar en `/api/admin/usuarios/[id]/route.ts` un endpoint `POST .../reset-password` que use `sb.auth.admin.updateUserById(userId, { password: generarPasswordTemporal() })` y devuelva la nueva contraseña temporal al admin. El botón aparecería en el formulario de edición de usuario.

### Problemas detectados

- **[admin/usuarios/route.ts:124-130] Validación de proyectos no verifica existencia en BD**: `validarProyectos` valida que los IDs sean UUIDs válidos (regex), pero no consulta si esos IDs existen en la tabla `proyectos`. Si un UUID se filtra accidentalmente (proyecto borrado), el perfil del colaborador tendría un proyecto fantasma en su array. Añadir una consulta de verificación:
  ```typescript
  if (proyectos.length > 0) {
    const { data: existentes } = await sb.from("proyectos")
      .select("id").in("id", proyectos);
    const idsValidos = new Set((existentes ?? []).map(p => p.id));
    const invalidos = proyectos.filter(id => !idsValidos.has(id));
    if (invalidos.length > 0) {
      return NextResponse.json({ error: "Uno o más proyectos no existen." }, { status: 400 });
    }
  }
  ```

- **[chat/route.ts:68-82] Rate limiter en memoria se resetea en cada deploy**: Cada `pm2 restart` (que ocurre en cada deploy via `deploy.sh`) resetea el `rateLimitMap`. Con el módulo de usuarios activo, los deploys son más frecuentes en esta etapa. La solución es añadir el conteo al campo `messages` de `kyo_conversaciones` que ya existe en Supabase, o usar un contador simple en site_config. Riesgo actual: bajo dado el volumen de tráfico, pero documentado.

---

## Oportunidades de mejora general

- **[usuarios/page.tsx] Sin notificación automática al colaborador de sus credenciales**: Al crear un usuario, el admin debe copiar y enviar manualmente las credenciales (hay un botón "Copiar" pero nada de envío automático). Si el colaborador tiene correo real (admins), enviar automáticamente un correo con las credenciales via IONOS SMTP — el helper de correo ya existe en el proyecto. Para username-based (sin correo real), el flujo manual actual es correcto, pero añadir en el bloque de credenciales: "Envía estas credenciales al colaborador por WhatsApp o en persona. La contraseña no se volverá a mostrar." (texto más accionable que el actual).

- **[layout.tsx — sidebar] Sin indicador del nombre del usuario logueado**: El footer del sidebar (línea 267-276) muestra el email pero no el nombre completo ni el rol del usuario. Para admins que gestionan varios colaboradores es útil ver de un vistazo "quién está dentro". Añadir el nombre completo si está disponible (se puede leer de `admin_perfiles` al cargar el layout). El rol `"Colaborador"` también podría mostrarse como badge pequeño.

- **[usuarios/page.tsx — proyectos] No hay feedback de cuántos proyectos tiene el colaborador en el listado**: En la lista de usuarios, los permisos de sección se muestran como chips (líneas 722-738). Los proyectos asignados no aparecen — solo se ven secciones. Añadir bajo los chips de sección:
  ```tsx
  {usuario.proyectos?.length > 0 && (
    <span className="text-[10px] text-slate-500 font-semibold">
      + {usuario.proyectos.length} proyecto{usuario.proyectos.length > 1 ? 's' : ''} asignado{usuario.proyectos.length > 1 ? 's' : ''}
    </span>
  )}
  ```

- **Sin métricas de abandono en el flujo de Kyo (pendiente ciclos anteriores)**: `logEvent('kyo_mensaje')` registra mensajes pero no el abandono. Añadir en `useChat.ts:reset()`: `logEvent('kyo_reset', messages.length.toString())` y en `ChatWidget.tsx` al cerrar: `logEvent('kyo_cerrado', String(messages.length))`. Estos datos revelan en qué paso se pierden los candidatos.

- **[system-prompt.ts:85-91] Filtros de URL con empresas ficticias del archivo estático**: Los filtros de ejemplo `?marca=Sigma Retail`, `?marca=Grupo Corpora` (líneas 85-91) corresponden a datos de `jobs.ts` estático. Cuando la migración a Supabase esté completa, estos valores serán incorrectos. Por ahora, añadir un comentario en el prompt: `"(los valores de marca varían según las vacantes activas — usa search_jobs para conocer las empresas disponibles)"`.
