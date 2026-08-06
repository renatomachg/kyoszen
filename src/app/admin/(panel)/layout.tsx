"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { IconUI, type IconUIName } from "@/components/ui/IconUI";
import {
  ADMIN_SECCIONES,
  seccionDeRuta,
  type AdminSeccionKey,
} from "@/lib/admin-secciones";
import { supabase } from "@/lib/supabase";

type PerfilAcceso = {
  rol: "admin" | "colaborador";
  secciones: string[];
  activo: boolean;
};

const ICONOS: Record<AdminSeccionKey, IconUIName> = {
  dashboard: "chart",
  vacantes: "clipboard",
  cursos: "book-open",
  aplicaciones: "document",
  crm: "users",
  contactos: "mail",
  kyo: "comment",
  blog: "pencil",
  testimonios: "trophy",
  proyectos: "menu",
  "redes-sociales": "send",
  campanas: "target",
  cuestionario: "clipboard",
  contenido: "document",
  seo: "search",
  correos: "mail",
  analytics: "chart",
  estratega: "lightbulb",
  servidor: "archive",
  actividad: "clock",
};

const BADGES: Partial<Record<AdminSeccionKey, "aplicaciones" | "contactos">> = {
  aplicaciones: "aplicaciones",
  contactos: "contactos",
};

const SECCIONES_PRINCIPALES = ADMIN_SECCIONES.slice(0, 9);
const SECCIONES_HERRAMIENTAS = ADMIN_SECCIONES.slice(9);

function Loader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [perfil, setPerfil] = useState<PerfilAcceso | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState({ aplicaciones: 0, contactos: 0 });

  useEffect(() => {
    let activo = true;

    const cargarAcceso = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!activo) return;

      if (!session) {
        router.replace("/admin/login");
        return;
      }

      const { data } = await supabase
        .from("admin_perfiles")
        .select("rol, secciones, activo")
        .eq("user_id", session.user.id)
        .maybeSingle();
      if (!activo) return;

      // Las cuentas anteriores a esta entrega no tienen perfil: conservan acceso admin.
      const acceso: PerfilAcceso = data
        ? {
            rol: data.rol === "colaborador" ? "colaborador" : "admin",
            secciones: Array.isArray(data.secciones) ? data.secciones : [],
            activo: data.activo !== false,
          }
        : { rol: "admin", secciones: [], activo: true };

      if (!acceso.activo) {
        await supabase.auth.signOut();
        if (activo) router.replace("/admin/login");
        return;
      }

      setUser(session.user);
      setPerfil(acceso);
      setLoading(false);
    };

    void cargarAcceso();
    return () => {
      activo = false;
    };
  }, [router]);

  useEffect(() => {
    if (loading) return;

    const fetchUnread = async () => {
      const [{ count: ap }, { count: co }] = await Promise.all([
        supabase.from("aplicaciones").select("id", { count: "exact", head: true }).eq("leido", false),
        supabase.from("contactos").select("id", { count: "exact", head: true }).eq("leido", false),
      ]);
      setUnread({ aplicaciones: ap ?? 0, contactos: co ?? 0 });
    };

    void fetchUnread();
    const interval = window.setInterval(fetchUnread, 60_000);
    return () => window.clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (
      loading ||
      (!pathname.startsWith("/admin/aplicaciones") &&
        !pathname.startsWith("/admin/contactos"))
    ) {
      return;
    }

    const timeout = window.setTimeout(() => {
      Promise.all([
        supabase.from("aplicaciones").select("id", { count: "exact", head: true }).eq("leido", false),
        supabase.from("contactos").select("id", { count: "exact", head: true }).eq("leido", false),
      ]).then(([{ count: ap }, { count: co }]) => {
        setUnread({ aplicaciones: ap ?? 0, contactos: co ?? 0 });
      });
    }, 1500);

    return () => window.clearTimeout(timeout);
  }, [loading, pathname]);

  const esAdmin = perfil?.rol === "admin";
  const permitidas = useMemo(
    () => new Set(perfil?.secciones ?? []),
    [perfil?.secciones],
  );
  const seccionActual = seccionDeRuta(pathname);
  const rutaPermitida =
    esAdmin || Boolean(seccionActual && permitidas.has(seccionActual.key));
  const primeraPermitida = ADMIN_SECCIONES.find((seccion) =>
    permitidas.has(seccion.key),
  );

  useEffect(() => {
    if (
      loading ||
      esAdmin ||
      rutaPermitida ||
      !primeraPermitida
    ) {
      return;
    }
    router.replace(primeraPermitida.href);
  }, [esAdmin, loading, primeraPermitida, router, rutaPermitida]);

  const navGrupos = useMemo(() => {
    const filtrar = (secciones: typeof ADMIN_SECCIONES[number][]) =>
      secciones.filter((seccion) => esAdmin || permitidas.has(seccion.key));

    return [
      filtrar([...SECCIONES_PRINCIPALES]),
      filtrar([...SECCIONES_HERRAMIENTAS]),
    ].filter((grupo) => grupo.length > 0);
  }, [esAdmin, permitidas]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (loading || !perfil) {
    return <Loader />;
  }

  if (!rutaPermitida && primeraPermitida) {
    return <Loader />;
  }

  const isActive = (href: string) =>
    href === "/admin"
      ? pathname === "/admin"
      : pathname === href || pathname.startsWith(`${href}/`);

  const getBadge = (key: AdminSeccionKey) => {
    const badge = BADGES[key];
    return badge ? unread[badge] : 0;
  };

  return (
    <div className="min-h-screen flex bg-bg">
      <aside className="w-60 bg-navy flex flex-col shrink-0 fixed h-full z-10">
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow rounded-lg flex items-center justify-center shrink-0">
              <span className="text-navy font-black text-sm">KZ</span>
            </div>
            <div>
              <p className="text-white font-black text-[13px] leading-none">Kyoszen</p>
              <p className="text-white/40 text-[10px] mt-0.5">Panel Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navGrupos.map((grupo, grupoIndex) => (
            <div key={grupo[0].key}>
              {grupoIndex > 0 && <div className="border-t border-white/10 my-2 mx-1" />}
              {grupo.map((item) => {
                const active = isActive(item.href);
                const badgeCount = getBadge(item.key);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                      active
                        ? "bg-yellow text-navy"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <IconUI name={ICONOS[item.key]} size={15} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {badgeCount > 0 && (
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${active ? "bg-navy text-yellow" : "bg-yellow text-navy"}`}>
                        {badgeCount > 99 ? "99+" : badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}

          {esAdmin && (
            <Link
              href="/admin/usuarios"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                isActive("/admin/usuarios")
                  ? "bg-yellow text-navy"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <IconUI name="users" size={15} className="shrink-0" />
              <span className="flex-1">Usuarios</span>
            </Link>
          )}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <p className="text-white/40 text-[11px] truncate">{user?.email}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-white/60 hover:text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <IconUI name="arrow-left" size={13} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-60 p-8 min-h-screen">
        {rutaPermitida ? (
          children
        ) : (
          <div className="max-w-xl bg-white border border-border rounded-2xl p-8">
            <div className="w-11 h-11 rounded-xl bg-blue-soft text-navy flex items-center justify-center mb-4">
              <IconUI name="key" size={22} />
            </div>
            <h1 className="text-xl font-black text-navy mb-2">Sin secciones asignadas</h1>
            <p className="text-sm text-muted leading-relaxed">
              Tu cuenta está activa, pero todavía no tiene acceso a una sección del panel.
              Pide a un administrador que actualice tus permisos.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
