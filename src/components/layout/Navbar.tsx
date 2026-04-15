"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import KyoszenLogo from "./KyoszenLogo";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/vacantes", label: "Vacantes" },
  { href: "/cursos", label: "Cursos" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      <nav
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-white/96 backdrop-blur-[12px] border border-black/7 rounded-full px-3 py-2 h-[62px] grid grid-cols-[auto_1fr_auto] items-center gap-4 w-[calc(100%-48px)] max-w-6xl transition-all duration-300 ${
          scrolled ? "shadow-xl bg-white/99" : "shadow-lg"
        }`}
      >
        {/* Mobile hamburger */}
        <button
          className="flex md:hidden flex-col gap-[5px] p-1 bg-transparent border-none cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          <span className="w-5 h-0.5 bg-navy rounded-sm block" />
          <span className="w-5 h-0.5 bg-navy rounded-sm block" />
          <span className="w-5 h-0.5 bg-navy rounded-sm block" />
        </button>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline shrink-0 md:relative absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0">
          <KyoszenLogo />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex gap-1 justify-center">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`no-underline text-[13px] py-[7px] px-[15px] rounded-full font-medium border-[1.5px] transition-all duration-150 whitespace-nowrap ${
                pathname === link.href
                  ? "border-navy bg-navy text-[#F8FAFC]"
                  : "border-transparent text-[#555] hover:border-blue hover:text-blue"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 shrink-0 ml-auto md:ml-0">
          <a
            href="https://wa.me/525520876765"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-wa text-white border-none rounded-full cursor-pointer flex items-center gap-[7px] no-underline shrink-0 transition-opacity duration-150 text-[13px] font-bold hover:opacity-90 w-10 h-10 md:w-auto md:h-auto md:px-[18px] md:py-[10px] justify-center md:justify-start"
            aria-label="Whatsapp"
          >
            <WhatsAppIcon size={20} />
            <span className="hidden md:inline">Whatsapp</span>
          </a>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed top-[88px] left-5 right-5 bg-white/98 p-4 px-5 flex flex-col z-[99] rounded-3xl shadow-xl border border-black/6 gap-1 backdrop-blur-[12px] md:hidden">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="py-[10px] px-[14px] rounded-xl text-navy no-underline text-sm font-medium hover:bg-blue-soft hover:text-blue"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <a
            href="https://wa.me/525520876765"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-wa text-white border-none rounded-xl py-[11px] text-sm font-bold cursor-pointer mt-2 text-center no-underline block"
          >
            Whatsapp
          </a>
        </div>
      )}
    </>
  );
}
