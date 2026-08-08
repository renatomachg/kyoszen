# Análisis UX y Kyo — Kyoszen
**Fecha:** 2026-08-08
**Commits analizados (últimos 7 desde 2026-08-06):**
- `e4339d3` — feat(usuarios): cambiar la contraseña de una cuenta del panel
- `023294a` — feat(proyectos): entrega interna del colaborador antes de mandar al cliente
- `4638acf` — feat(campanas): modo "ya está corriendo" — mostrar sin pedir aprobación
- `664b04d` — feat(campanas): soportar campañas de alcance (sin formulario)
- `88c39cc` — fix(campanas): mensaje claro cuando el documento no es una campaña
- `59829f8` — feat(campanas): importador (brief/capturas/PDF), alta y borrado con modales propios
- `935adb7` — feat(campanas): módulo de aprobación de campañas pagadas

**Archivos del asistente revisados siempre:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`

**Archivos nuevos revisados este ciclo:**
- `src/app/admin/(panel)/usuarios/page.tsx`
- `src/components/revisor/CampanasCliente.tsx`
- `src/lib/campanas.ts`
- `src/lib/jobs.ts`

---

## Cambios Recientes Detectados

### Módulo de campañas pagadas (principal novedad)
El módulo de campañas es el mayor cambio del ciclo. Incluye:
- **Portal del cliente** (`CampanasCliente.tsx`): el revisor aprueba anuncios uno a uno con mockup de Facebook + simulación del formulario del candidato. Nuevo modo **"ya está corriendo"** (`en_curso`) que muestra la campaña en lectura con comentarios opcionales, sin pedir aprobación.
- **Campañas de alcance** (`tieneFormulario()`): anuncios sin formulario — candidato ve el arte y se presenta físicamente al reclutamiento. Flujo adaptado correctamente en `flujoDeCampana()`.
- **Importador** (`ImportarCampana.tsx`): brief pegado / capturas / PDF → Claude haiku parsea → preview → crear. Soporta visión (opus cuando hay imágenes).
- **ConfirmModal** (`ui/ConfirmModal.tsx`): modal de confirmación con identidad del panel para publicar, eliminar campaña (requiere escribir "ELIMINAR" si está publicada) y eliminar anuncio. Reusable.

### Cambio de contraseña de usuarios (feat menor)
Nueva función `cambiarPassword()` en `usuarios/page.tsx`: permite al admin cambiar la contraseña de cualquier cuenta sin hacer login como ese usuario. La nueva contraseña se muestra una sola vez en el panel de credenciales temporales. El campo de nueva contraseña tiene `type="text"` — problema de seguridad (ver issues).

### Entrega interna de proyectos
Antes del paso al cliente, el colaborador puede marcar una entrega como revisada internamente. La API de etapas/bloques fue actualizada para soportar este estado intermedio.

---

## Sugerencias de UX

### Alta prioridad

- **[usuarios/page.tsx:719] Campo de nueva contraseña en `type="text"` — bug de seguridad**
  El input de la nueva contraseña en la sección "Acceso" tiene `type="text"`, lo que muestra la contraseña en texto plano mientras el admin escribe. Si hay una pantalla compartida o alguien mirando, la contraseña queda expuesta.
  ```tsx
  // Cambiar de:
  <input type="text" value={passwordNueva} ... />
  // A:
  <input type="password" value={passwordNueva} autocomplete="new-password" ... />
  ```
  Archivo: `src/app/admin/(panel)/usuarios/page.tsx`, línea 719. El campo de contraseña temporal al crear usuario también usa `type="text"` (línea 547) — mismo fix.

- **[usuarios/page.tsx:329] `window.confirm()` para borrar usuarios — PENDIENTE del ciclo anterior**
  La función `borrar()` usa `window.confirm()` nativo (línea 329), que fue el antipatrón que el módulo de campañas eliminó con `ConfirmModal`. El ConfirmModal ya existe y es reusable (`src/components/ui/ConfirmModal.tsx`). Aplicarlo a usuario garantiza consistencia y maneja mejor el texto en la confirmación.
  ```tsx
  // Reemplazar el window.confirm() por:
  <ConfirmModal
    titulo="Eliminar usuario"
    descripcion={`¿Borrar a ${nombre}? Se eliminará su acceso y su cuenta de autenticación.`}
    accion="Eliminar usuario"
    peligro
    onConfirm={() => borrarConfirmado(usuario)}
    onCancel={() => setBorrandoId(null)}
  />
  ```

- **[CampanasCliente.tsx:881] Rollup `campana.estado` no se recalcula localmente tras aprobaciones**
  `handleStatusChange()` actualiza el estado de cada anuncio en la lista local, pero no recalcula `campana.estado` (el rollup de la campaña). En la vista de lista (cuando hay más de una campaña), la píldora de estado de la campaña muestra el estado original hasta que el revisor recarga la página. Por ejemplo: aprueba los 3 anuncios → el progreso en la vista de detalle llega a "3 de 3", pero si vuelve al listado, la campaña sigue en amarillo "Pendiente revisión".
  ```tsx
  // En handleStatusChange, tras actualizar campana_anuncios, recalcular el rollup:
  import { rollupCampana } from "@/lib/campanas";
  
  const handleStatusChange = (...) => {
    setCampanas(prev => prev.map(c => {
      const nuevosAnuncios = (c.campana_anuncios ?? []).map(a =>
        a.id === anuncioId ? { ...a, estado, ... } : a
      );
      return { ...c, campana_anuncios: nuevosAnuncios, estado: rollupCampana(nuevosAnuncios) };
    }));
  };
  ```
  La función `rollupCampana` ya existe en `src/lib/campanas.ts:114` — solo falta llamarla.

- **[usuarios/page.tsx:636] Etiqueta "videos" en sección de proyectos — PENDIENTE del ciclo anterior**
  El texto en la sección de proyectos del formulario dice: `"El colaborador solo verá los videos seleccionados."` (línea 636). El módulo evolucionó a Espacios tipados (videos, artes, tableros). Corregir a: `"El colaborador solo verá los proyectos y espacios seleccionados."`

### Media prioridad

- **[CampanasCliente.tsx — flujo en_curso] Sin notificación cuando una campaña sale al aire**
  Cuando el admin cambia el modo de `revision` a `en_curso`, los revisores no reciben correo informándoles que la campaña ya está publicada. Solo lo descubren la próxima vez que entran al revisor. Añadir en la API `PATCH /api/admin/campanas/[id]` cuando `modo` cambia a `en_curso`: enviar correo a `social_reviewers` activos con el título de la campaña y los anuncios que están al aire. El helper de notificaciones ya existe en `src/lib/campanas-notify.ts`.

- **[CampanasCliente.tsx:920] Campaña única auto-seleccionada sin breadcrumb de vuelta**
  Cuando hay exactamente una campaña, el componente la muestra directamente sin pasar por la lista (línea 920: `campanas.length === 1 ? campanas[0] : null`), por lo que `onVolver` es `undefined` y no hay botón "Todas las campañas". Si en el futuro llega una segunda campaña, el usuario que solo conocía la vista directa puede desorientarse. Solución mínima: mantener el botón "Todas las campañas" visible aunque haya solo una, o cambiar la lógica a mostrar siempre la lista cuando hay más de una.

- **[CampanasCliente.tsx:704-715] Sin mensaje de "¡Todo aprobado!" cuando el revisor completa la revisión**
  La barra de progreso llega a 100% cuando todos los anuncios son aprobados, pero no hay ningún estado de celebración / confirmación. El revisor no sabe si debe hacer algo más. Añadir un banner verde cuando `stats.aprobados === stats.total && stats.total > 0`:
  ```tsx
  {stats.aprobados === stats.total && stats.total > 0 && !enCurso && (
    <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: 14, padding: "13px 16px", marginTop: 16 }}>
      <p style={{ margin: 0, fontSize: 13.5, fontWeight: 800, color: "#166534" }}>
        ✓ Revisión completa — los {stats.total} anuncios están aprobados. Kyoszen los tiene listos para publicar.
      </p>
    </div>
  )}
  ```

- **[layout.tsx:268] Email sintético en sidebar — PENDIENTE del ciclo anterior**
  Para colaboradores con login por username, el footer del sidebar muestra `usuario@acceso.kyoszen.com` en lugar del nombre real. La solución está documentada en el ciclo 2026-08-06.

- **[layout.tsx:96-99] Colaborador desactivado redirige a login sin mensaje — PENDIENTE del ciclo anterior**
  El usuario cree que olvidó su contraseña. Añadir `?error=cuenta-inactiva` al redirect y capturar en login/page.tsx.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversación

- **[system-prompt.ts:52] Paso 5 — conflicto entre mostrar texto y navegar — PENDIENTE del ciclo anterior**
  El orden de las instrucciones en Paso 5 puede llevar a Kyo a llamar `navigate_to` antes de mostrar las recomendaciones en texto. Reescribir la instrucción con orden numérico explícito (ver reporte 2026-08-06 para el fix exacto).

- **[system-prompt.ts:65-69] Sin bifurcación candidato/empresa — PENDIENTE del ciclo anterior**
  Kyo asume que el usuario es candidato. Las empresas no tienen un flujo diferenciado hasta que mencionan "contratar" o "cotizar". Añadir Paso 0b de clasificación de tipo de usuario.

- **[Kyo — nuevo] Sin flujo para candidatos que llegan desde anuncios de Facebook**
  Con la campaña GPG activa, candidatos pueden llegar al sitio después de haber visto el anuncio de Facebook. Al usar Kyo, preguntan "vengo por la vacante de cajero que vi en Facebook" — Kyo no tiene contexto de las campañas pagadas ni puede conectar ese interés con la vacante correcta.
  Solución corta: añadir al system prompt, bajo "Manejo de otros temas":
  ```
  Si el usuario menciona haber visto un anuncio de Facebook o una campaña de reclutamiento:
  Confirma el puesto que vio, luego busca la vacante correspondiente con search_jobs y
  dirígelo al formulario de aplicación (/vacantes/[id] o /contacto).
  ```
  Esto no requiere conectar campañas a Kyo — solo reconocer el origen y redirigir al flujo correcto.

### Nuevas tools o capacidades recomendadas

- **`capture_lead` — tool para banco de talentos — PENDIENTE del ciclo anterior**
  Cuando no hay vacante compatible, Kyo navega a `/contacto`. Una tool `capture_lead` que guarde directamente en `crm_candidatos` (tabla que ya existe, con `origen: "kyo"`) evita el abandono del formulario. Ver reporte 2026-08-06 para la definición completa de la tool.

- **`get_salario_mercado` — tool informativa — PENDIENTE del ciclo anterior**
  El módulo `/salarios` tiene datos de 35 puestos en `src/lib/salarios.ts`. Kyo puede consultarlos cuando el candidato pregunta "¿cuánto pagan?". Ver reporte 2026-08-06 para la definición completa.

- **`search_jobs` — añadir filtro por `jornada` — PENDIENTE del ciclo anterior**
  El Paso 4 recolecta la jornada del candidato pero `search_jobs` no la acepta como filtro. La información recolectada en el Paso 4 nunca se usa en la búsqueda del Paso 5. Añadir `schedule` al schema de la tool y el filtro en `knowledge.ts:listJobs()`.

### Problemas detectados

- **[knowledge.ts:167] Kyo usa vacantes del archivo estático, no de Supabase — CRÍTICO, PENDIENTE**
  El sitio público lee vacantes en tiempo real de Supabase; Kyo lee del fallback `jobs.ts`. Un candidato puede recibir recomendaciones de vacantes ya inactivas o no ver las nuevas que el admin publica. Esta sigue siendo la deuda más crítica del asistente.

- **[knowledge.ts:99-106] `kyo_faqs` de Supabase desconectadas de Kyo — PENDIENTE del ciclo anterior**
  Las FAQs editables desde el admin no llegan a Kyo. La pestaña de FAQs en `/admin/kyo` es decorativa desde la perspectiva del asistente. Ver reporte 2026-08-06 para el fix exacto con fetch desde `kyo_faqs`.

- **[useChat.ts:20] Tilde faltante en saludo — PENDIENTE del ciclo anterior**
  `"estoy aqui para orientarte"` → `"estoy aquí para orientarte"`. Es la primera frase que lee el candidato.

- **[chat/route.ts:202] Fallback robótico sin tildes — PENDIENTE del ciclo anterior**
  `"Entendido, ¿en que mas te puedo ayudar?"` → cambiar a `"Perdona, tuve un inconveniente procesando tu mensaje. ¿Podrías repetirme tu pregunta?"` Archivo: `src/app/api/assistant/chat/route.ts`, línea 202.

- **[system-prompt.ts:138] `toLocaleString()` sin locale — PENDIENTE del ciclo anterior**
  En VPS Linux produce `12000` en lugar de `$12,000/mes`. Usar `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(j.salario)`.

- **[useChat.ts:95] Sin AbortController ni timeout — PENDIENTE del ciclo anterior**
  Con 5 iteraciones de tool-use, si el VPS tiene carga el fetch puede colgarse indefinidamente. Añadir timeout de 20s con `AbortController`.

- **[system-prompt.ts:85-87] Filtros de URL con nombres de empresas ficticias — PENDIENTE del ciclo anterior**
  Los filtros `?marca=Sigma Retail`, `?marca=Logistica Norte` etc. son datos de demo de `jobs.ts`, no empresas reales de Kyoszen. Si el admin gestiona vacantes con empresas distintas en Supabase, estos filtros no sirven. Actualizar con los valores reales cuando las vacantes de Supabase tengan nombres de empresa consistentes.

- **[system-prompt.ts:54-58] Empresa "Confidencial" puede quedar expuesta — PENDIENTE del ciclo anterior**
  El Paso 5 muestra `[Empresa]` en la recomendación, pero si la empresa es vacía el `JobSummary.empresa` es `""`. Instruir a Kyo: si `empresa` está vacío o es `"Confidencial"`, no mencionarla en la recomendación.

---

## Oportunidades de mejora general

- **[usuarios/page.tsx] Nuevo: campo de contraseña al crear usuario también en `type="text"`**
  El campo de "Contraseña temporal" al crear un nuevo usuario (línea 547) también tiene `type="text"`. Cambiar a `type="password"` con `autocomplete="new-password"`. El administrador que crea la cuenta puede ver caracteres al escribir si quiere (es un campo que él controla), pero enmascararlo por defecto es la práctica correcta.

- **[analytics] Sin tracking de qué paso del flujo abandona el candidato — PENDIENTE**
  `logEvent("kyo_mensaje")` registra cada mensaje pero no el paso del flujo. Añadir evento `kyo_cerrado` con el número de mensajes al cerrar el widget. Ver reporte 2026-08-06 para el código exacto.

- **[ChatWidget] Chips de respuesta rápida para acelerar el flujo — PENDIENTE**
  En los Pasos 3 (ubicación) y 4 (jornada), las respuestas son predecibles. Chips de respuesta rápida reducen la fricción en mobile. Ver reporte 2026-08-06 para el componente.

- **[admin panel — sidebar] Badge de rol no visible para el usuario logueado — PENDIENTE**
  Añadir un badge pequeño `Admin` / `Colaborador` junto al nombre en el footer del sidebar. Ver reporte 2026-08-06 para el JSX.

---

## Estado de issues acumulados

| Issue | Archivo | Estado |
|---|---|---|
| Tilde en saludo "aquí" | `useChat.ts:20` | **PENDIENTE** |
| "Nueva conversacion" sin tilde | `ChatWidget.tsx:159` | **PENDIENTE** |
| Fallback robótico sin tildes | `chat/route.ts:202` | **PENDIENTE** |
| `toLocaleString()` sin locale | `system-prompt.ts:138` | **PENDIENTE** |
| Sin AbortController en fetch | `useChat.ts:95` | **PENDIENTE** |
| Kyo lee jobs del archivo estático | `knowledge.ts:167` | **PENDIENTE** |
| kyo_faqs desconectadas de Kyo | `knowledge.ts:99` | **PENDIENTE** |
| Email sintético en sidebar | `layout.tsx:268` | **PENDIENTE** |
| `window.confirm()` para borrar usuario | `usuarios/page.tsx:329` | **PENDIENTE** |
| Colaborador desactivado sin mensaje | `layout.tsx:96-99` | **PENDIENTE** |
| Colaboradores sin secciones sin CTA | `layout.tsx:283` | **PENDIENTE** |
| Panel dice "videos" en vez de "proyectos" | `usuarios/page.tsx:636` | **PENDIENTE** |
| Sin tracking de abandono de Kyo | `useChat.ts` | **PENDIENTE** |
| Filtros de URL con empresas ficticias | `system-prompt.ts:85` | **PENDIENTE** |
| Empresa "Confidencial" expuesta en Paso 5 | `system-prompt.ts:54` | **PENDIENTE** |
| search_jobs sin filtro de jornada | `tools.ts:38-46` | **PENDIENTE** |
| Campo contraseña en `type="text"` | `usuarios/page.tsx:547,719` | **NUEVO** |
| Rollup campaña no recalcula en cliente | `CampanasCliente.tsx:881` | **NUEVO** |
| Sin notificación cuando campaña sale al aire | `campanas-notify.ts` | **NUEVO** |
| Sin flujo en Kyo para candidatos de Facebook | `system-prompt.ts` | **NUEVO** |
