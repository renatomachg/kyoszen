# Admin barrido — TANDA 3: CRM + secciones chicas (corporativo)

Mismo criterio que Tandas 1–2: **cambio quirúrgico, solo visual**, emojis decorativos → íconos de línea / puntos de color, preservando TODA la lógica (fetch, handlers, endpoints, estados, `data-*`). Navy + amarillo `#FFCC00` para CTAs. **Reutiliza el componente compartido `src/components/ui/IconUI.tsx`** (agrega nombres de íconos si falta alguno; no dupliques helpers locales).

Secciones a intervenir (todas bajo `src/app/admin/(panel)/`) y sus componentes:
- **crm/** — `page.tsx` y `MatchingPanel.tsx` (estados del pipeline con punto de color, tabs Candidatos/Matching, botón sincronizar, score/razones).
- **blog/** — páginas de lista/editor (botones nuevo/duplicar/guardar, picker de imágenes).
- **correos/** — `page.tsx`.
- **vacantes/** — lista + form (toggle activa, ✨ Completar con IA → chip/ícono, ver/editar).
- **seo/** — `page.tsx`.
- **cursos/** — lista + form (toggle activo, ✨ Completar con IA, ver/editar).
- **kyo/** — `page.tsx` (tabs Instrucciones/Test/FAQs/Conversaciones).
- **cuestionario/** — `page.tsx` (estados sin-empezar/en-progreso/completado con punto de color, copiar link, ver respuestas).
- **contenido/** — `page.tsx`.

## Criterio
- Reemplaza cualquier emoji decorativo por el `IconUI` que corresponda (check, pencil, trash, plus, copy, eye, mail, refresh, sparkle-off→chip "IA"/"NUEVA", chart, etc.). Los estados usan **punto de color** + texto (verde/ámbar/rojo/slate).
- "✨ Completar con IA" → botón limpio con un ícono (p. ej. destello de línea o "chip IA") sin el emoji ✨.
- No toques lógica, nombres, endpoints, ni el comportamiento (toggles, IA, guardado seguro, copiar link, etc.).
- No elimines emojis que sean **contenido real** (texto de blog, respuestas, mensajes, etc.).
- Mantén responsivo e idéntico comportamiento.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado; confirma que no quedan emojis decorativos en estas secciones.
