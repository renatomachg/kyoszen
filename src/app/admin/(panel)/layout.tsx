"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const NAV = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  },
  {
    href: "/admin/vacantes",
    label: "Vacantes",
    icon: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    href: "/admin/cursos",
    label: "Cursos",
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  },
  {
    href: "/admin/aplicaciones",
    label: "Aplicaciones",
    badge: "aplicaciones",
    icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  },
  {
    href: "/admin/contactos",
    label: "Contactos",
    badge: "contactos",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    href: "/admin/kyo",
    label: "Asistente Kyo",
    icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
  },
  {
    href: "/admin/blog",
    label: "Blog",
    icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  },
  {
    href: "/admin/testimonios",
    label: "Testimonios",
    icon: "M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z",
  },
  { divider: true },
  {
    href: "/admin/contenido",
    label: "Contenido",
    icon: "M4 6h16M4 12h16M4 18h7",
  },
  {
    href: "/admin/seo",
    label: "SEO",
    icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  },
  {
    href: "/admin/correos",
    label: "Correos",
    icon: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  },
  {
    href: "/admin/analytics",
    label: "Analytics",
    icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
  {
    href: "/admin/servidor",
    label: "Servidor",
    icon: "M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01",
  },
  {
    href: "/admin/actividad",
    label: "Actividad",
    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  },
];

export default function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState({ aplicaciones: 0, contactos: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace("/admin/login");
      } else {
        setUser(session.user);
        setLoading(false);
      }
    });
  }, [router]);

  // Cargar conteo de no leidos
  useEffect(() => {
    const fetchUnread = async () => {
      const [{ count: ap }, { count: co }] = await Promise.all([
        supabase.from("aplicaciones").select("id", { count: "exact", head: true }).eq("leido", false),
        supabase.from("contactos").select("id", { count: "exact", head: true }).eq("leido", false),
      ]);
      setUnread({ aplicaciones: ap ?? 0, contactos: co ?? 0 });
    };
    fetchUnread();
    // Recargar cada 60 segundos
    const interval = setInterval(fetchUnread, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Cuando se visita aplicaciones o contactos, refrescar badges
  useEffect(() => {
    if (pathname.startsWith("/admin/aplicaciones") || pathname.startsWith("/admin/contactos")) {
      setTimeout(() => {
        Promise.all([
          supabase.from("aplicaciones").select("id", { count: "exact", head: true }).eq("leido", false),
          supabase.from("contactos").select("id", { count: "exact", head: true }).eq("leido", false),
        ]).then(([{ count: ap }, { count: co }]) => {
          setUnread({ aplicaciones: ap ?? 0, contactos: co ?? 0 });
        });
      }, 1500);
    }
  }, [pathname]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  const getBadge = (badge?: string) => {
    if (!badge) return 0;
    return unread[badge as keyof typeof unread] ?? 0;
  };

  return (
    <div className="min-h-screen flex bg-bg">
      {/* Sidebar */}
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
          {NAV.map((item, i) => {
            if ("divider" in item) {
              return <div key={i} className="border-t border-white/10 my-2 mx-1" />;
            }
            const active = isActive(item.href);
            const badgeCount = getBadge(item.badge);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-colors ${
                  active ? "bg-yellow text-navy" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                  <path d={item.icon} />
                </svg>
                <span className="flex-1">{item.label}</span>
                {badgeCount > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none ${active ? "bg-navy text-yellow" : "bg-yellow text-navy"}`}>
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/10 space-y-2">
          <p className="text-white/40 text-[11px] truncate">{user?.email}</p>
          <button
            onClick={logout}
            className="flex items-center gap-2 text-white/60 hover:text-white text-[12px] font-semibold transition-colors cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 ml-60 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
