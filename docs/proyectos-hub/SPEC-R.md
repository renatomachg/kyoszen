# Admin barrido — TANDA 2: Analytics + Estratega (corporativo)

Mismo criterio que Tanda 1 (Redes Sociales): **cambio quirúrgico y solo visual**, reemplaza emojis decorativos por íconos de línea / puntos de color, preserva TODA la lógica (fetch, streaming del Estratega, handlers, gráficas, estados, endpoints, `data-*`). Conserva navy + amarillo `#FFCC00` para CTAs.

Archivos:
- `src/app/admin/(panel)/analytics/page.tsx` (~31 emojis: KPIs, funnel, rankings, tabs Feed/Reportes).
- `src/app/admin/(panel)/estratega/page.tsx` (~9 emojis) y cualquier componente que use (sidebar de chats, mensajes).

## 0. Componente de íconos COMPARTIDO (crear una vez, reutilizable en el resto del barrido)
Crea `src/components/ui/IconUI.tsx`: componente `IconUI({ name, size=18, className, style })` que renderiza SVG de línea (`stroke=currentColor`, `strokeWidth=1.7`, `viewBox="0 0 24 24"`). Incluye un set inicial de nombres usados aquí y fácilmente ampliable: `check, x, pencil, trash, plus, upload, download, calendar, comment, eye, image, video, document, chart, target, globe, clipboard, archive, wrench, mail, arrow-right, arrow-left, chevron-left, chevron-right, refresh, sparkle-off(=chip NUEVA), user, users, funnel, trophy, clock, dot`. Exporta también un `<Dot color />` chico si ayuda para estados. Usa este componente en Analytics y Estratega. (Las próximas tandas lo importarán; no dupliques.)

## Cambios
- **Analytics**: tabs (Dashboard/Feed/Reportes u similares), KPIs, funnel de vacantes, top rankings, botones de descarga/enviar reporte → íconos de línea; estados/tendencias con punto de color o flecha (↑/↓ como ícono, no emoji). Mantén los números, cálculos y la lógica de reportes (PDF/TXT/correo) intactos.
- **Estratega**: header, botones (nuevo chat, enviar), íconos del historial de chats, indicadores → íconos de línea. **No toques el streaming ni el manejo de mensajes/estado.**
- Quita ✨ decorativos; "NUEVA/nuevo" como chip limpio si aplica.

## Reglas duras
- No renombres ni muevas lógica; no cambies fetch/endpoints/useEffect/handlers.
- No elimines emojis que sean contenido real (mensajes del usuario/IA en el Estratega se quedan como están).
- Responsivo y comportamiento idénticos.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado; confirma que no quedan emojis decorativos en Analytics ni Estratega.
