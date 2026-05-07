# Backlog de Mejoras y Fallas — Kyoszen

Este archivo es el diario del proyecto. Aqui se registran todos los problemas encontrados,
mejoras pendientes y tareas tecnicas. Se actualiza conforme se van resolviendo.

**Leyenda:**
- `[ ]` Pendiente
- `[x]` Resuelto ✅
- `[~]` En progreso 🔄

---

## 🔴 Critico — Bloquean el git push o rompen funcionalidad

- [x] **[LINT] Navbar.tsx:30** — `setMobileOpen(false)` dentro de `useEffect`. Resuelto con patron setState-durante-render. ✅ 2026-05-07
- [x] **[LINT] Hero.tsx:28** — `setIsDeleting(false)` dentro de `useEffect`. Resuelto envolviendo en setTimeout(50ms). ✅ 2026-05-07
- [x] **[LINT] cursos/page.tsx:57** — `setActiveTab(cat)` dentro de `useEffect`. Resuelto con patron setState-durante-render + prevParams. ✅ 2026-05-07
- [x] **[LINT] vacantes/page.tsx:58** — `setSearch(q)` dentro de `useEffect`. Resuelto con patron setState-durante-render + prevParams. ✅ 2026-05-07

---

## 🟠 Alto — No funcionan o tienen riesgo en produccion

- [ ] **[FORMULARIO] contacto/page.tsx** — El formulario de contacto NO envia nada. Solo muestra una alerta de exito falsa. Necesita un endpoint `/api/contacto` similar a `/api/aplicar`.
- [ ] **[SEGURIDAD] api/aplicar/route.ts** — El email de destino `rsalazar@kyoszen.com` esta escrito en el codigo. Si cambia el correo, hay que editar codigo y redesplegar. Moverlo a variable de entorno `CONTACT_EMAIL`.
- [ ] **[SEGURIDAD] api/assistant/chat/route.ts** — El rate limiting usa un `Map` en memoria. Si Vercel escala a multiples instancias, el limite se pierde. En produccion real necesita Redis/Upstash.

---

## 🟡 Medio — Funcionalidad incompleta

- [ ] **[INCOMPLETO] Newsletter.tsx** — El componente existe y se ve bien, pero no tiene endpoint. El email nunca se guarda ni envia. Necesita `/api/newsletter` o integracion con un servicio de email.
- [ ] **[INCOMPLETO] Blog** — Solo hay 3 articulos hardcodeados. No existe la pagina `/blog` (solo los articulos individuales). Falta crear `src/app/blog/page.tsx` con el listado.
- [ ] **[INCOMPLETO] Supabase** — Esta instalado (`@supabase/supabase-js`) pero nunca se usa. Los datos de cursos y vacantes son estaticos. Decidir si se integra o se desinstala para no cargar el bundle.
- [ ] **[LIMPIEZA] Tipos duplicados** — `src/types/index.ts` tiene tipos `Vacancy` y `Course` que nunca se usan. Los tipos reales estan en `lib/jobs.ts` y `lib/courses.ts`. Borrar `src/types/index.ts` o unificar.

---

## 🟢 Bajo — Mejoras de calidad y limpieza

- [ ] **[LIMPIEZA] Archivos HTML viejos** — En la raiz del proyecto hay archivos `index.html`, `cursos.html`, `servicios.html` etc. de una version anterior. No se usan y confunden. Eliminarlos.
- [ ] **[CALIDAD] Importacion no usada en Hero.tsx:6** — `import Link` definido pero nunca usado. Borrar esa linea.
- [ ] **[CALIDAD] Importacion no usada en contacto/page.tsx:4** — `motion` importado pero nunca usado. Borrar esa linea.
- [ ] **[CALIDAD] Sin tests automatizados** — El proyecto no tiene ningun test. Como minimo agregar tests para los endpoints de API (`/api/aplicar`, `/api/assistant/chat`).
- [ ] **[PERFORMANCE] Sin paginacion backend** — `/vacantes` y `/cursos` cargan todos los datos en el navegador. Con 8 vacantes y 16 cursos esta bien, pero si crece a 100+ va a ser lento.
- [ ] **[PERFORMANCE] Sin cache en datos estaticos** — Los datos de cursos y vacantes no tienen headers de cache. Con Next.js se puede usar `revalidate` para mejorar tiempos de carga.

---

## ✅ Resuelto

- [x] **[LINT] Navbar.tsx** — setState en useEffect → patron render condicional ✅ 2026-05-07
- [x] **[LINT] Hero.tsx** — setState en useEffect → setTimeout(50ms) ✅ 2026-05-07
- [x] **[LINT] cursos/page.tsx** — setState en useEffect → prevParams render condicional ✅ 2026-05-07
- [x] **[LINT] vacantes/page.tsx** — setState en useEffect → prevParams render condicional ✅ 2026-05-07

---

## 📋 Como usar este archivo

1. Cuando atacas un problema, cambia `[ ]` a `[~]` y pon la fecha: `[~] 2026-05-07`
2. Cuando terminas, cambia a `[x]` y mueve el item a la seccion **Resuelto** con la fecha
3. Los agentes automaticos (salud, dependencias, UX) pueden agregar nuevos items a este backlog
4. Revisa este archivo antes de cada sesion de trabajo para saber por donde empezar

---
*Generado el 2026-05-07 | Actualizado automaticamente por agentes de monitoreo*
