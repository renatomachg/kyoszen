/* Puerta de las rutas /api/admin/*. Solo servidor.

   Hasta ahora estas rutas usaban la service_role sin validar nada: cualquiera
   que supiera la URL podía llamarlas desde internet. Aquí se valida la sesión
   real de Supabase que manda el panel en el header Authorization. */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type RolAdmin = "admin" | "colaborador";

export interface Identidad {
  user_id: string;
  email: string | null;
  nombre: string | null;
  rol: RolAdmin;
  secciones: string[];
  proyectos: string[];
}

/** Error listo para devolver desde una ruta. */
export class SinPermiso extends Error {
  constructor(readonly status: 401 | 403, mensaje: string) {
    super(mensaje);
    this.name = "SinPermiso";
  }
  get respuesta() {
    return NextResponse.json({ error: this.message }, { status: this.status });
  }
}

function tokenDeRequest(req: Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const [esquema, valor] = header.split(" ");
  return esquema?.toLowerCase() === "bearer" && valor ? valor.trim() : null;
}

/** Quién está llamando. Lanza `SinPermiso` si no hay sesión válida.
 *
 *  Sin fila en `admin_perfiles` no se entra. La misma instancia de Supabase Auth
 *  guarda las cuentas del cliente en /revisor (Rosy, Monse), así que tratar la
 *  ausencia de perfil como "administrador" les habría abierto el panel. */
export async function identificar(req: Request): Promise<Identidad> {
  const token = tokenDeRequest(req);
  if (!token) throw new SinPermiso(401, "Necesitas iniciar sesión.");

  const { data, error } = await sb.auth.getUser(token);
  if (error || !data?.user) throw new SinPermiso(401, "Tu sesión ya no es válida. Vuelve a entrar.");

  const usuario = data.user;
  const { data: perfil } = await sb
    .from("admin_perfiles")
    .select("user_id, email, nombre, rol, secciones, proyectos, activo")
    .eq("user_id", usuario.id)
    .maybeSingle();

  if (!perfil) {
    throw new SinPermiso(403, "Tu cuenta no tiene acceso al panel.");
  }
  if (perfil.activo === false) {
    throw new SinPermiso(403, "Tu cuenta está desactivada.");
  }

  return {
    user_id: perfil.user_id,
    email: perfil.email ?? usuario.email ?? null,
    nombre: perfil.nombre ?? null,
    rol: perfil.rol === "colaborador" ? "colaborador" : "admin",
    secciones: Array.isArray(perfil.secciones) ? perfil.secciones : [],
    proyectos: Array.isArray(perfil.proyectos) ? perfil.proyectos : [],
  };
}

/** Como `identificar`, pero además exige rol de administrador. */
export async function soloAdmin(req: Request): Promise<Identidad> {
  const quien = await identificar(req);
  if (quien.rol !== "admin") {
    throw new SinPermiso(403, "Esta sección es solo para administradores.");
  }
  return quien;
}

/** Exige que el que llama tenga esa sección asignada. El admin pasa siempre.
 *  `seccion` es una clave de ADMIN_SECCIONES (p.ej. "campanas", "proyectos"). */
export async function exigirSeccion(req: Request, seccion: string): Promise<Identidad> {
  const quien = await identificar(req);
  if (quien.rol === "admin") return quien;
  if (!quien.secciones.includes(seccion)) {
    throw new SinPermiso(403, "No tienes acceso a esta sección del panel.");
  }
  return quien;
}

/** Un colaborador solo toca los proyectos que le asignaron. El admin, todos. */
export function puedeVerProyecto(quien: Identidad, proyectoId: string): boolean {
  return quien.rol === "admin" || quien.proyectos.includes(proyectoId);
}

export async function exigirProyecto(req: Request, proyectoId: string): Promise<Identidad> {
  const quien = await exigirSeccion(req, "proyectos");
  if (!puedeVerProyecto(quien, proyectoId)) {
    throw new SinPermiso(403, "Este proyecto no está asignado a tu cuenta.");
  }
  return quien;
}

/** Envuelve el manejador de una ruta y traduce `SinPermiso` en su respuesta. */
export async function conPermiso<T>(
  fn: () => Promise<T>
): Promise<T | NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof SinPermiso) return e.respuesta;
    throw e;
  }
}
