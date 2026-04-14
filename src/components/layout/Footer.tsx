import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-footer text-white pt-16 pb-8 px-[5%]">
      <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-[1.7fr_1fr_1fr_1.5fr] gap-10 pb-10 border-b border-white/7">
        {/* Brand */}
        <div>
          <span className="text-white text-lg block mb-3 font-black tracking-[2px]">KYOSZEN</span>
          <p className="text-xs opacity-40 leading-relaxed max-w-[230px] mb-5">
            Estrategia en Capital Humano. Conectamos el talento correcto con las empresas que crecen.
          </p>
          <div className="flex gap-2">
            {["f", "in", "tt"].map((icon) => (
              <a
                key={icon}
                href="#"
                className="w-[34px] h-[34px] bg-white/7 rounded-lg flex items-center justify-center text-[13px] text-white no-underline hover:bg-blue transition-colors"
              >
                {icon}
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div>
          <h5 className="text-[12.5px] font-extrabold mb-4 opacity-85">Navegacion</h5>
          {[
            { href: "/", label: "Inicio" },
            { href: "/servicios", label: "Servicios" },
            { href: "/vacantes", label: "Vacantes" },
            { href: "/cursos", label: "Cursos" },
            { href: "/nosotros", label: "Nosotros" },
            { href: "/contacto", label: "Contacto" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-xs opacity-40 text-white no-underline mb-2 hover:opacity-100 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Services */}
        <div>
          <h5 className="text-[12.5px] font-extrabold mb-4 opacity-85">Servicios</h5>
          {[
            { href: "/servicios", label: "Reclutamiento" },
            { href: "/cursos", label: "Capacitacion" },
            { href: "/servicios", label: "Induccion" },
            { href: "/servicios", label: "Digitalizacion" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="block text-xs opacity-40 text-white no-underline mb-2 hover:opacity-100 transition-opacity"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div>
          <h5 className="text-[12.5px] font-extrabold mb-4 opacity-85">Contacto</h5>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
              <span role="img" aria-label="phone">📞</span>
            </div>
            <span className="text-xs opacity-50">55 2087 6765</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
              <span role="img" aria-label="email">✉️</span>
            </div>
            <span className="text-xs opacity-50">contacto@kyoszen.com</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
              <span role="img" aria-label="clock">🕐</span>
            </div>
            <span className="text-xs opacity-50">Lun-Vie 9am-6pm</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto mt-8 flex justify-between flex-wrap gap-2">
        <p className="text-[11px] opacity-20">&copy; 2026 Kyoszen · Todos los derechos reservados</p>
        <p className="text-[11px] opacity-20">Diseñado por Holadiseño!</p>
      </div>
    </footer>
  );
}
