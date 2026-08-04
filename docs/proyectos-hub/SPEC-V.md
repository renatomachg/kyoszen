# Admin — ENTREGA V: roles + gestión de usuarios (acceso por sección)

Permite crear usuarios del panel con **rol** y **secciones permitidas**, para dar acceso limitado (ej. un colaborador de video que solo ve Proyectos). Incluye una sección "Usuarios" en el admin. No rompas nada existente. Estilo corporativo (IconUI, navy + amarillo).

Leer: `src/app/admin/(panel)/layout.tsx` (sidebar/NAV + auth guard con `supabase.auth.getSession`), `src/lib/supabase.ts`, y un API admin de ejemplo con service_role (`src/app/api/admin/cuestionario/route.ts`).

## 1. Migración `docs/proyectos-hub/migration-V.sql` (NO aplicar)
- Tabla `admin_perfiles`:
  - `user_id uuid PRIMARY KEY` (el id de `auth.users`; sin FK al esquema auth).
  - `email text`, `nombre text`.
  - `rol text NOT NULL DEFAULT 'colaborador' CHECK (rol IN ('admin','colaborador'))`.
  - `secciones text[] NOT NULL DEFAULT '{}'` (claves de sección permitidas cuando rol='colaborador'; para 'admin' se ignora, ve todo).
  - `activo boolean NOT NULL DEFAULT true`.
  - `created_at/updated_at timestamptz DEFAULT now()`.
- RLS habilitado + política permisiva `USING(true) WITH CHECK(true)`.
- (Sin seed. Ver punto 4 sobre el default para usuarios sin perfil.)

## 2. Claves de sección (una sola fuente)
Define en `src/lib/admin-secciones.ts` la lista de secciones del panel con `{ key, label, href }`, derivadas del NAV actual: `dashboard(/admin)`, `vacantes`, `cursos`, `aplicaciones`, `crm`, `contactos`, `kyo`, `blog`, `testimonios`, `proyectos`, `redes-sociales`, `cuestionario`, `contenido`, `seo`, `correos`, `analytics`, `estratega`, `servidor`, `actividad`. (La sección "usuarios" es SIEMPRE solo-admin, no va en esta lista asignable.)

## 3. APIs admin (service_role, runtime nodejs)
### `src/app/api/admin/usuarios/route.ts`
- `GET` → lista `admin_perfiles` (todos) ordenados por `created_at`. `{ usuarios }`.
- `POST` (crear usuario) → body `{ email, nombre?, rol, secciones?, password? }`.
  - Crea el usuario en Auth con service_role: `sb.auth.admin.createUser({ email, password: <password o uno temporal generado>, email_confirm: true })`.
  - Inserta fila en `admin_perfiles` con el `user_id` devuelto, email, nombre, rol, secciones (vacío si admin).
  - Devuelve `{ usuario, passwordTemporal }` (para que el admin lo comparta; si no mandaron password, genera uno tipo `Kyoszen2025!` o aleatorio legible).
  - Maneja el caso "email ya existe" (si createUser falla por duplicado, 409 con mensaje claro).
### `src/app/api/admin/usuarios/[id]/route.ts`
- `PATCH` → actualiza `rol`, `secciones`, `activo`, `nombre` (+ updated_at). (id = user_id.)
- `DELETE` → borra el perfil y el usuario de Auth (`sb.auth.admin.deleteUser(user_id)`). Con confirm en el front.

## 4. Layout admin — guard por rol/secciones (`src/app/admin/(panel)/layout.tsx`)
- Tras `getSession`, consulta `admin_perfiles` por `user_id = session.user.id`.
- **Default seguro:** si NO hay perfil para ese usuario → trátalo como **admin** (ve todo). Así los usuarios actuales (tú, etc.) no se ven afectados. Solo los usuarios con perfil `colaborador` quedan restringidos.
- Si el perfil existe y `activo=false` → cierra sesión y manda a login.
- Si `rol='colaborador'`:
  - **Filtra el NAV** a solo las secciones en `perfil.secciones` (mapea cada item del NAV a su `key`). Oculta "Usuarios".
  - **Guarda la ruta**: si el `pathname` actual no corresponde a una sección permitida (ni a `/admin` raíz si dashboard no está permitido), redirige a la primera sección permitida (o a una pantalla simple "No tienes acceso a esta sección"). Sé cuidadoso con `pathname.startsWith`.
- Si `rol='admin'` (o sin perfil) → NAV completo, incluida la nueva sección "Usuarios".
- Muestra un loader mientras carga el perfil (no parpadees el NAV completo antes de filtrar).

## 5. NAV + página "Usuarios" (solo admin)
- Agrega al NAV un item **"Usuarios"** (`/admin/usuarios`, ícono `users` de IconUI), visible solo para admin.
- `src/app/admin/(panel)/usuarios/page.tsx` ("use client", estilo panel):
  - Lista de usuarios (nombre, email, rol con chip, secciones como chips, activo).
  - **Crear usuario**: form con email, nombre, selector de rol (admin/colaborador) y, si es colaborador, **checkboxes de secciones** (de `admin-secciones.ts`). Al crear, muestra el **correo + contraseña temporal** para copiar.
  - **Editar**: cambiar rol, secciones (checkboxes), activar/desactivar. Borrar (con confirm).
  - Guard: si un colaborador llegara aquí, no debe poder (ya lo cubre el layout).

## Reglas
- No rompas el auth actual ni el resto del panel. Reusa `IconUI`. Navy + amarillo.
- Las escrituras por API con service_role; lecturas del layout con el cliente `supabase` (RLS permisivo).

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. NO apliques la migración.
