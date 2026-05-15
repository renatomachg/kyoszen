# Analisis UX y Kyo — Kyoszen
**Fecha:** 2026-05-15
**Cambios analizados:** No hubo cambios de codigo en los ultimos 2 dias (solo reportes automaticos). Auditoria profunda del estado actual del asistente y UX.

**Archivos revisados:**
- `src/lib/assistant/system-prompt.ts`
- `src/lib/assistant/tools.ts`
- `src/lib/assistant/knowledge.ts`
- `src/app/api/assistant/chat/route.ts`
- `src/components/assistant/ChatWidget.tsx`
- `src/components/assistant/useChat.ts`
- `src/app/vacantes/page.tsx`
- `src/app/vacantes/[id]/page.tsx`
- `src/components/ui/AplicarModal.tsx`
- `src/app/contacto/page.tsx`
- `src/lib/jobs.ts`
- `src/components/sections/Hero.tsx`

---

## Cambios Recientes Detectados

Sin cambios de codigo. Los ultimos commits son reportes automaticos (`salud-sitio.md`, `ux-kyo.md`). El analisis es una auditoria de fondo del estado actual del sistema.

---

## Sugerencias de UX

### Alta prioridad

- **[Vacantes page — estado vacio sin CTA]** `src/app/vacantes/page.tsx` linea 198-202: cuando `filtered.length === 0` solo se muestra texto estatico. El candidato que no encuentra lo que busca necesita una salida. Agregar un boton "Consultar por WhatsApp" con link `https://wa.me/525520876765?text=No+encontre+la+vacante+que+busco` y un texto secundario "o abre el chat con Kyo". Costo: ~8 lineas. Impacto: evita que el candidato abandone el sitio.

- **[Vacante detalle — CTA "Aplicar ahora" queda enterrado en mobile]** `src/app/vacantes/[id]/page.tsx` linea 152-169: el sidebar es sticky solo en desktop. En mobile el boton "Aplicar ahora" queda despues de responsabilidades + requisitos + tags — el usuario tiene que hacer scroll largo para llegar. Agregar un boton flotante solo en mobile al pie del viewport: `<div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border lg:hidden z-40"><button onClick={() => setModalOpen(true)} ...>Aplicar ahora</button></div>`. Es el mismo `setModalOpen` ya disponible.

- **[ChatWidget — no hay chips de inicio rapido]** `src/components/assistant/ChatWidget.tsx` linea 143-165: despues del saludo inicial el usuario ve un campo en blanco sin guia. Agregar 2-3 chips de sugerencia que aparezcan solo cuando `messages.length === 1` (unicamente el saludo): `["Busco empleo", "Me interesan los cursos", "Quiero contratar personal"]`. Al hacer clic en un chip, llamar `sendMessage(chip)`. Esto reduce la friccion de arranque del 100% de usuarios nuevos.

- **[Kyo — Paso 6 navega a /contacto en lugar de a la vacante especifica]** `src/lib/assistant/system-prompt.ts` linea 67: `"Navega a /contacto si acepta"`. El formulario de aplicacion real (`AplicarModal`) vive en `/vacantes/{id}`, NO en `/contacto`. Si Kyo lleva al usuario a `/contacto`, el candidato llena un formulario generico en lugar de aplicar directamente a la vacante recomendada. Cambiar la instruccion del Paso 6: `"Navega a /vacantes/{id} de la vacante que el candidato quiere, donde el boton 'Aplicar ahora' abre el formulario de aplicacion."`. Reservar `/contacto` para cuando no hay vacante compatible.

### Media prioridad

- **[Contacto — asunto no se preselecciona cuando viene de Kyo]** `src/app/contacto/page.tsx` linea 87: el `<select>` de asunto llega siempre en blanco. Agregar lectura de `useSearchParams()` para el parametro `?asunto=...` y preseleccionarlo. Kyo ya puede navegar con URL params (el sistema de vacantes lo hace). Editar `contacto/page.tsx` para inicializar `form.subject` desde `params.get("asunto")` si existe. Kyo pasaria `?asunto=Quiero+aplicar+a+una+vacante` desde el Paso 6.

- **[ChatWidget — boton "Nueva conversacion" es practicamente invisible]** `src/components/assistant/ChatWidget.tsx` linea 158: `text-[11px] text-muted` — texto gris de 11px con bajo contraste. El usuario que quiere reiniciar la sesion probablemente no lo encuentra. Cambiar a `text-[12px] text-blue font-semibold underline` y agregar un icono de refresh de 12px antes del texto.

- **[Hero — campo de busqueda sin conexion al asistente]** `src/components/sections/Hero.tsx`: el campo de busqueda navega a `/vacantes?q=...`. Considerar agregar un boton secundario "o pregunta a Kyo" junto al input que abra el widget y pre-popule el primer mensaje con el texto de busqueda. Requiere un evento global (context o event emitter) para abrir el ChatWidget desde fuera del componente.

---

## Sugerencias para el Asistente Kyo

### Mejoras al flujo de conversacion

- **[Paso 5 navega a lista filtrada en vez de a la vacante especifica]** `system-prompt.ts` linea 64: `"Usa navigate_to con /vacantes y los filtros..."`. Si el candidato ya escucho las recomendaciones y dice "me interesa la primera", Kyo deberia navegar a `/vacantes/{id}` del job recomendado, no a una lista filtrada. Cambiar instruccion: "Si el candidato expresa interes en una vacante especifica, usa navigate_to con /vacantes/{id}. Solo navega a /vacantes con filtros si pide ver mas opciones."

- **[No hay manejo de pivot — candidato que cambia de perfil a empresa]** `system-prompt.ts` no tiene instrucciones para cuando el usuario revela a mitad del flujo que es empleador. Agregar seccion en el system prompt: `# Si el usuario es empresa o empleador: Abandona el flujo de candidato, confirma su interes y navega a /contacto con ?asunto=Necesito+contratar+personal. No continues el flujo de 6 pasos.`

- **[Paso 2 recopila experiencia pero la tool no puede filtrar por ella]** Kyo pregunta anos de experiencia en Paso 2 pero `search_jobs` en `tools.ts` no tiene ese filtro. Claude hace el matching mentalmente, lo cual funciona, pero es mas confiable si el knowledge layer lo soporta. Ver "Nuevas tools" abajo.

- **[Sesion restaurada sin verificar frescura del historial]** `useChat.ts` linea 23-32: `loadHistory()` restaura el historial de localStorage sin verificar antiguedad. Si el usuario regresa 24 horas despues, Kyo continua una conversacion vieja sin saludar. Agregar logica de expiracion: si `messages[messages.length-1].timestamp < Date.now() - 8*60*60*1000`, hacer reset automatico. El INITIAL_GREETING incluye `timestamp: 0` lo que actualmente evita el reset, corregir usando `Date.now()` como timestamp del saludo inicial al hacer reset.

### Nuevas tools o capacidades recomendadas

- **[Agregar filtros contrato y jornada a search_jobs]** `src/lib/assistant/tools.ts` linea 38-47 y `src/lib/assistant/knowledge.ts` linea 138-153: el tool `search_jobs` tiene `query`, `category`, `location` pero NO tiene `contrato` ni `jornada`. Kyo recopila exactamente esos datos en Pasos 3-4 y no puede usarlos para filtrar. Agregar en `tools.ts` dentro de `search_jobs.input_schema.properties`:
  ```
  "contrato": { "type": "string", "description": "Tiempo completo, Medio tiempo, Por proyecto" },
  "jornada":  { "type": "string", "description": "Matutina, Vespertina, Mixta, Flexible" }
  ```
  Y en `knowledge.ts listJobs()`: agregar `.filter((j) => !filters?.contrato || j.contrato === filters.contrato)` y equivalente para jornada.

- **[Agregar tool: save_candidate_interest]** Cuando no hay vacante compatible (Paso 5 negativo), Kyo dice "puedo registrar sus datos" pero no tiene tool para hacerlo. El candidato tiene que navegar a `/contacto` y llenar todo desde cero. Crear tool `register_candidate` que reciba `{nombre, telefono?, interes, ubicacion, jornada}` y POST a `/api/contacto` (o endpoint nuevo). La confirmacion apareceria en el chat sin abandonar el widget. Elimina la friccion del ultimo paso del funnel negativo.

- **[Agregar tool: get_whatsapp_link]** Tool simple que retorne el link de WhatsApp de Kyoszen con un mensaje pre-formateado segun el contexto (ej: candidato interesado en vacante X). Permite a Kyo mostrar el link en el chat en lugar de solo decir "contactanos por WhatsApp". Input: `{context: string}`. Output: URL de `wa.me/...?text=...`.

### Problemas detectados

- **[BUG CRITICO — El nombre del usuario se pierde en conversaciones largas]** `src/app/api/assistant/chat/route.ts` linea 73: `body.messages.slice(-20)`. Si la conversacion supera 20 mensajes, el primer intercambio (donde el usuario dio su nombre en Paso 0) se pierde. Kyo olvidara el nombre y podria usar el placeholder `[nombre]` del system prompt o inventar uno. **Fix inmediato**: preservar siempre los primeros 2 mensajes mas los ultimos 18:
  ```typescript
  const first2 = body.messages.slice(0, 2);
  const last18 = body.messages.slice(-18);
  const history = [...new Map([...first2, ...last18].map(m => [m.role + m.content, m])).values()];
  ```

- **[BUG — Paso 5 template contradice la regla de "2-3 lineas max"]** `system-prompt.ts` linea 81 dice "Respuestas de 2-3 lineas max" pero el template del Paso 5 (lineas 51-56) tiene un bloque de 5+ lineas. Esta contradiccion puede hacer que Claude intente comprimir el Paso 5 o que ignore la regla en otros pasos. Cambiar la regla global: `"Respuestas de 2-3 lineas max, excepto en el Paso 5 donde el formato estructurado de vacantes es obligatorio."`.

- **[BUG — Solo se ejecuta la primera navegacion si Kyo llama navigate_to dos veces]** `src/components/assistant/useChat.ts` linea 109: `data.navigations[0]` — solo la primera navegacion se ejecuta. Si Claude llama la tool dos veces en un mismo ciclo de tool-use, la segunda se pierde silenciosamente. No es critico ahora pero puede causar comportamientos confusos. Agregar comentario en useChat.ts documentando la limitacion intencionalmente.

- **[Potencial confusion — greeting hardcodeado no incluye el nombre de Kyo en el header]** `useChat.ts` linea 17-21 define el saludo. `ChatWidget.tsx` linea 127 muestra "Kyo · Asistente" en el header. Coherente. Pero si se cambia el saludo en `useChat.ts`, el header no cambia. Centralizar el nombre "Kyo" en una constante compartida por ambos archivos.

---

## Oportunidades de mejora general

- **[Vacante detalle — sin opcion de compartir]** `src/app/vacantes/[id]/page.tsx` no tiene boton de compartir. En Mexico, WhatsApp es el canal de difusion principal entre candidatos. Agregar en el sidebar (despues de los 2 CTAs actuales) un boton "Compartir por WhatsApp" que genere `https://wa.me/?text=Mira+esta+vacante+en+Kyoszen:+https://kyoszen.com/vacantes/{id}`. Costo: ~5 lineas. Alto valor para crecimiento organico.

- **[AplicarModal — campo de CV es opcional pero se muestra igual que campos requeridos]** `src/components/ui/AplicarModal.tsx` linea 195: el campo de CV no tiene asterisco rojo y su label dice "(opcional)" pero visualmente el `FormField` se ve igual que los obligatorios. Considerar hacer el bloque de CV visualmente diferente (borde punteado con color mas claro, label en `text-muted`) para que el usuario no sienta que lo necesita para aplicar.

- **[Salario en recomendacion de Paso 5 no esta en el template]** El system prompt en Paso 5 (linea 51-53) no incluye salario en el formato de recomendacion: `"[Nombre del puesto] — [Empresa] — [Por que le aplica]"`. El salario es el dato #1 que el candidato quiere antes de decidir. Agregar `$[salario]/mes` al template: `"[Puesto] — [Empresa] — $[salario]/mes — [Razon de compatibilidad]"`. Ya esta disponible en el contexto del system prompt (linea 120).

- **[Accesibilidad — contraste del texto "Ver detalle" en cards de vacantes]** `src/app/vacantes/page.tsx` linea 191: `text-blue` (#1883FF) sobre `bg-white` tiene ratio de contraste ~3.1:1 para texto de 11.5px — por debajo del minimo WCAG AA de 4.5:1. Cambiar a `text-navy` (#042E7B) en estado normal y mantener `text-blue` solo en `group-hover`. Mejora accesibilidad sin afectar la estetica hover.

- **[Rate limit en-memoria no sobrevive multiples instancias]** `src/app/api/assistant/chat/route.ts` linea 10-13: el `rateLimitMap` es in-memory. En Vercel con multiples lambdas, cada instancia tiene su propio mapa — un usuario puede exceder el limite real enviando mensajes a distintas instancias. No es critico ahora en produccion pequeña, pero al escalar considerar Upstash Redis como reemplazo (ya mencionado en el comentario del codigo). Agregar un `TODO: Upstash` con el link de la documentacion de Vercel KV.
