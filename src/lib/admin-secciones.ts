export const ADMIN_SECCIONES = [
  { key: "dashboard", label: "Dashboard", href: "/admin" },
  { key: "vacantes", label: "Vacantes", href: "/admin/vacantes" },
  { key: "cursos", label: "Cursos", href: "/admin/cursos" },
  { key: "aplicaciones", label: "Aplicaciones", href: "/admin/aplicaciones" },
  { key: "crm", label: "CRM", href: "/admin/crm" },
  { key: "contactos", label: "Contactos", href: "/admin/contactos" },
  { key: "kyo", label: "Asistente Kyo", href: "/admin/kyo" },
  { key: "blog", label: "Blog", href: "/admin/blog" },
  { key: "testimonios", label: "Testimonios", href: "/admin/testimonios" },
  { key: "proyectos", label: "Proyectos", href: "/admin/proyectos" },
  { key: "redes-sociales", label: "Redes Sociales", href: "/admin/redes-sociales" },
  { key: "campanas", label: "Campañas", href: "/admin/campanas" },
  { key: "cuestionario", label: "Cuestionarios", href: "/admin/cuestionario" },
  { key: "contenido", label: "Contenido", href: "/admin/contenido" },
  { key: "seo", label: "SEO", href: "/admin/seo" },
  { key: "correos", label: "Correos", href: "/admin/correos" },
  { key: "analytics", label: "Analytics", href: "/admin/analytics" },
  { key: "estratega", label: "Estratega", href: "/admin/estratega" },
  { key: "servidor", label: "Servidor", href: "/admin/servidor" },
  { key: "actividad", label: "Actividad", href: "/admin/actividad" },
] as const;

export type AdminSeccionKey = (typeof ADMIN_SECCIONES)[number]["key"];

export const ADMIN_SECCION_KEYS = new Set<string>(
  ADMIN_SECCIONES.map((seccion) => seccion.key),
);

export function seccionDeRuta(pathname: string) {
  if (pathname === "/admin") {
    return ADMIN_SECCIONES[0];
  }

  return ADMIN_SECCIONES.find(
    (seccion) =>
      seccion.href !== "/admin" &&
      (pathname === seccion.href || pathname.startsWith(`${seccion.href}/`)),
  );
}
