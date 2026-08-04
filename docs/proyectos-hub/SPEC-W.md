# Admin — ENTREGA W: login por usuario (sin correo) para colaboradores

Encima de la Entrega V (roles + usuarios), permite crear y loguear usuarios con un **usuario** en vez de correo. Supabase Auth necesita un email por debajo, así que se genera un **correo interno sintético** que el colaborador nunca ve. Reusa V. No rompas el login por correo existente.

Leer: `src/app/admin/login/page.tsx` (pantalla de login actual), `src/app/api/admin/usuarios/route.ts` y `[id]/route.ts` (Entrega V), `src/app/admin/(panel)/usuarios/page.tsx`, `src/lib/admin-secciones.ts`.

## 1. Migración `docs/proyectos-hub/migration-W.sql` (NO aplicar)
- `ALTER TABLE admin_perfiles ADD COLUMN usuario text UNIQUE;` (nullable — los admin por correo pueden no tener usuario).

## 2. Correo interno sintético
- Dominio interno: `acceso.kyoszen.com` (subdominio de su dominio real; formato de email válido, no colisiona con buzones reales). Helper: `correoInterno(usuario) => \`${usuarioSanitizado}@acceso.kyoszen.com\``.
- Sanitizar usuario: `trim().toLowerCase()`, permitir solo `[a-z0-9._-]`, sin espacios. Validar no vacío.

## 3. API crear usuario (`src/app/api/admin/usuarios/route.ts` POST) — extender
- Acepta body con **`usuario`** (además del `email` opcional para compatibilidad):
  - Si viene `usuario` y no `email`: valida/sanitiza `usuario`, verifica que no exista otro perfil con ese `usuario` (409 si duplicado), arma `email = correoInterno(usuario)`, crea el Auth user con ese email + password (o temporal), inserta perfil con `usuario`, `email` (el interno), nombre, rol, secciones.
  - Si viene `email` (flujo actual): igual que antes, `usuario` queda null.
- Devuelve `{ usuario: <perfil>, passwordTemporal }`. Que la respuesta incluya el `usuario` (no el correo interno) para mostrárselo al admin.

## 4. Resolver usuario→correo para login (`src/app/api/admin/usuarios/resolver/route.ts`, runtime nodejs, service_role)
- `POST { usuario }` → busca `admin_perfiles` por `usuario` (sanitizado). Si existe y `activo`, devuelve `{ email }` (el correo interno). Si no existe o inactivo → 404 `{ error: "Usuario no encontrado" }`.
- (Sólo mapea usuario→correo interno sintético; no expone datos sensibles.)

## 5. Login (`src/app/admin/login/page.tsx`) — aceptar usuario o correo
- Cambia el campo/label a **"Usuario o correo"**.
- Al enviar: si el valor **incluye `@`**, trátalo como correo (flujo actual). Si **no** incluye `@`, es un usuario → `POST /api/admin/usuarios/resolver` con ese usuario → obtén `email` → `supabase.auth.signInWithPassword({ email, password })`.
- Errores claros: usuario/correo o contraseña incorrectos (no reveles si el usuario existe o no más allá de lo necesario). Conserva el resto del flujo (redirección a `/admin`, estados de carga).

## 6. Página Usuarios (`src/app/admin/(panel)/usuarios/page.tsx`) — usar "usuario"
- En el form de crear: para colaborador, el campo principal es **"Usuario"** (no correo). Muestra el `usuario` en la lista (columna Usuario). Al crear, muestra **usuario + contraseña temporal** para copiar (no el correo interno).
- Permite seguir creando admins por correo si se quiere (campo opcional), pero el caso principal es usuario.

## Reglas
- No rompas el login por correo (tú y las cuentas actuales siguen entrando con su correo).
- Reusa IconUI, navy + amarillo. Escrituras por API service_role.

## Cierre
- Corre `npm run build -- --webpack` (o `npx tsc --noEmit`), arregla lo que rompa.
- Reporta archivos modificados y resultado. NO apliques la migración.
