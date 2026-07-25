# Módulo CRM (Fase 2) — ENTREGA E: APIs + admin Candidatos/Pipeline

Construye la capa de administración de candidatos. Reusa Entrega D (`src/lib/crm`). NO construyas el matching todavía (eso es Entrega F). Leer `CLAUDE.md`, `docs/crm/SPEC-D.md`, y para patrones mira `src/app/admin/(panel)/contactos/page.tsx` (página client con cliente `supabase`, tokens Tailwind `navy/yellow/bg/border/muted/blue/blue-soft`) y `src/app/api/admin/cuestionario/route.ts` (API con service_role, runtime nodejs, validación + try/catch).

Convención: lecturas en admin con cliente `supabase` directo o vía API (elige y sé consistente); escrituras SIEMPRE por API con service_role. Español de México. TypeScript estricto.

## 1. APIs (service_role, runtime nodejs)

### `src/app/api/admin/crm/candidatos/route.ts`
- `GET` → todos los `crm_candidatos` ordenados por `updated_at` desc, cada uno con `aplicaciones_count` (cuántas filas de `aplicaciones` tienen ese `candidato_id`). Devuelve `{ candidatos: [...] }`.
- `POST` → crea candidato manual. Body: `{ nombre, correo?, whatsapp?, ubicacion?, experiencia?, cv_url? }`. `origen='manual'`, `estado='nuevo'`. Valida `nombre` no vacío. Devuelve el candidato creado.

### `src/app/api/admin/crm/candidatos/[id]/route.ts`
- `GET` → el candidato + sus `aplicaciones` (todas las de `aplicaciones` con ese `candidato_id`: `vacante, cv_url, experiencia, ubicacion, created_at`) + sus `crm_notas` (orden desc). Devuelve `{ candidato, aplicaciones, notas }`. 404 si no existe.
- `PATCH` → actualiza `estado` (validado contra los 6 estados) y/o campos editables (`nombre, correo, whatsapp, ubicacion, experiencia, cv_url`) + `updated_at=now()`. Devuelve `{ ok: true }`.
- `DELETE` → borra el candidato (las notas caen por cascade; pon `aplicaciones.candidato_id = null` en sus aplicaciones antes o deja el FK sin acción — asegúrate de no romper el FK: primero `update aplicaciones set candidato_id=null`, luego borra). Devuelve `{ ok: true }`.

### `src/app/api/admin/crm/candidatos/[id]/notas/route.ts`
- `POST` → agrega nota. Body `{ texto, autor? }`. Valida `texto`. Devuelve la nota creada.

### `src/app/api/admin/crm/sync/route.ts`
- `POST` (consolidar desde aplicaciones) → para cada fila de `aplicaciones` con `candidato_id IS NULL`:
  - Normaliza correo (minúsculas, trim) y whatsapp (solo dígitos).
  - Busca un `crm_candidatos` existente que empate por correo (case-insensitive) o, si no hay correo, por whatsapp (dígitos). Si existe → usa ese.
  - Si no existe → crea `crm_candidatos` con `nombre, correo, whatsapp, ubicacion, experiencia, cv_url` de la aplicación, `origen='aplicacion'`.
  - Pon `aplicaciones.candidato_id` = id del candidato.
  - Cuenta `creados` (candidatos nuevos) y `vinculados` (aplicaciones enlazadas). Devuelve `{ creados, vinculados }`.
  - Hazlo robusto para bajo volumen (puedes cargar todos los candidatos y aplicaciones en memoria y procesar; no necesitas optimizar).

## 2. NAV admin
En `src/app/admin/(panel)/layout.tsx` agrega UNA entrada `{ href: "/admin/crm", label: "CRM", icon: "<heroicons users/user-group path>" }`, cerca de Vacantes/Aplicaciones (arriba del divider). No rompas el array.

## 3. Página `src/app/admin/(panel)/crm/page.tsx` ("use client")
Estilo panel Kyoszen (tokens Tailwind como contactos).

**Encabezado**: título "CRM · Candidatos", subtítulo con total y desglose por estado.
**Acciones**: botón "🔄 Sincronizar desde aplicaciones" (POST /sync → alert "N nuevos, M vinculados" → recarga) y "＋ Nuevo candidato" (form chico → POST).

**Filtros de estado**: chips por cada uno de los 6 `ESTADOS` (usa la constante de `@/lib/crm`) + "Todos", con conteo. Filtra la lista.

**Lista de candidatos**: fila por candidato con: nombre, correo/WhatsApp, ubicación, `aplicaciones_count` ("N aplicaciones"), pill de estado (color de `ESTADOS`), fecha. Click → detalle.

**Detalle (panel lateral o modal)**:
- Datos del candidato (editable opcional; mínimo mostrarlos).
- **Selector de estado del pipeline**: dropdown o fila de botones con los 6 estados; al cambiar → PATCH → refleja al instante.
- **Historial de aplicaciones**: lista de las `aplicaciones` del candidato (a qué vacante aplicó, cuándo, link al CV si `cv_url`).
- **Notas**: timeline de `crm_notas` (texto, autor, fecha) + caja para agregar nota (POST) que refresca.
- Botón borrar candidato (con confirm).

Lee la lista por el `GET` de la API (trae `aplicaciones_count`). El detalle por el `GET [id]`.

## Cierre
- Corre `npm run build -- --webpack` (Turbopack no resuelve node_modules en este worktree para build) o `npx tsc --noEmit`, y arregla lo que rompa.
- Reporta archivos creados/modificados y resultado. No toques el matching ni nada fuera de lo listado.
