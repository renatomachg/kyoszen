"use client";

import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";

const trust = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    label: "Respuesta en 24h",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    label: "687+ candidatos colocados",
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    label: "Garantia de reposicion",
  },
];

export default function CtaFinal() {
  return (
    <section className="relative py-24 px-5 md:px-10 xl:px-20 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1800&auto=format&fit=crop&q=80')",
        }}
      />

      {/* Gradient overlay fading into the footer dark color */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,46,123,0.72) 0%, rgba(4,46,123,0.9) 55%, rgba(3,8,18,0.98) 100%)",
        }}
      />

      {/* Content */}
      <AnimatedSection className="relative z-[2]">
        <div className="max-w-[820px] mx-auto text-center">
          <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black leading-[1.05] tracking-tight text-white mb-5 drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]">
            ¿Listo para transformar
            <br />
            tu <span className="text-yellow">capital humano</span>?
          </h2>
          <p className="text-[14.5px] text-white/85 leading-relaxed max-w-[560px] mx-auto mb-8">
            Ya sea que busques empleo o necesites contratar personal, nuestro
            equipo esta listo para acompañarte en cada paso. Te respondemos en
            menos de 24 horas habiles.
          </p>

          <div className="flex gap-3 justify-center flex-wrap mb-10">
            <Link
              href="/contacto"
              className="bg-yellow text-black rounded-full py-3.5 px-8 text-[14px] font-extrabold no-underline inline-flex items-center gap-2 hover:bg-[#e6b800] transition-colors shadow-lg"
            >
              Hablar con un asesor →
            </Link>
            <Link
              href="/vacantes"
              className="bg-transparent text-white border-2 border-white/50 rounded-full py-3.5 px-8 text-[14px] font-extrabold no-underline inline-flex items-center hover:bg-white/10 hover:border-white transition-colors"
            >
              Ver vacantes
            </Link>
          </div>

          {/* Trust badges row */}
          <div className="flex gap-6 md:gap-10 justify-center items-center flex-wrap text-white/90">
            {trust.map((t) => (
              <div key={t.label} className="flex items-center gap-2 text-[12.5px] font-semibold">
                <span className="text-yellow shrink-0">{t.icon}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
