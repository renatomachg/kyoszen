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
 *  Una cuenta sin fila en `admin_perfiles` se considera administrador: son las
 *  cuentas originales del panel, anteriores al módulo de usuarios. Es el mismo
 *  criterio que ya usaba la interfaz. */
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
    return {
      user_id: usuario.id,
      email: usuario.email ?? null,
      nombre: null,
      rol: "admin",
      secciones: [],
      proyectos: [],
    };
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
