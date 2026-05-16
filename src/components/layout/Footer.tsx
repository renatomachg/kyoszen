import Link from "next/link";
import KyoszenLogo from "./KyoszenLogo";

export default function Footer() {
  return (
    <footer className="bg-footer text-white pt-16 pb-8 px-5 md:px-10 xl:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-[1.7fr_1fr_1fr_1.5fr] gap-10 pb-10 border-b border-white/7">
        {/* Brand */}
        <div>
          <div className="mb-3"><KyoszenLogo height={26} variant="white" /></div>
          <p className="text-xs opacity-40 leading-relaxed max-w-[230px] mb-5">
            Estrategia en Capital Humano. Conectamos el talento correcto con las empresas que crecen.
          </p>
          <div className="flex gap-2 mt-4">
            {[
              { icon: "/images/facebook.svg", label: "Facebook", href: "https://www.facebook.com/profile.php?id=61572162331314" },
              { icon: "/images/tiktok.svg",   label: "TikTok",   href: "#" },
            ].map(({ icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="w-[34px] h-[34px] bg-white/7 rounded-lg flex items-center justify-center no-underline hover:bg-blue transition-colors p-[9px]"
              >
                <img
                  src={icon}
                  alt={label}
                  className="w-full h-full object-contain"
                  style={{ filter: "brightness(0) invert(1)" }}
                />
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
            <span className="text-xs opacity-50">56 4004 5414</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
              <span role="img" aria-label="email">✉️</span>
            </div>
            <span className="text-xs opacity-50">rsalazar@kyoszen.com.mx</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-[30px] h-[30px] bg-white/7 rounded-[7px] flex items-center justify-center text-[13px] shrink-0">
              <span role="img" aria-label="clock">🕐</span>
            </div>
            <span className="text-xs opacity-50">Lun-Vie 9am-6pm</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 flex justify-between flex-wrap gap-3">
        <p className="text-[11px] opacity-20">&copy; 2026 Integradores Kyoszen SA de CV · Todos los derechos reservados</p>
        <div className="flex gap-4 flex-wrap">
          <Link href="/condiciones-de-uso" className="text-[11px] opacity-30 text-white no-underline hover:opacity-70 transition-opacity">Condiciones de Uso</Link>
          <Link href="/politica-de-cookies" className="text-[11px] opacity-30 text-white no-underline hover:opacity-70 transition-opacity">Politica de Cookies</Link>
          <Link href="/politica-de-privacidad" className="text-[11px] opacity-30 text-white no-underline hover:opacity-70 transition-opacity">Politica de Privacidad</Link>
        </div>
      </div>
    </footer>
  );
}
