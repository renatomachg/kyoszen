"use client";

import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";

export default function CtaFinal() {
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="bg-blue-soft rounded-3xl p-10 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative overflow-hidden">
            {/* Decorative */}
            <div className="absolute w-[220px] h-[220px] bg-blue-mid opacity-30 rounded-full -top-[90px] -right-[30px] pointer-events-none" />
            <div className="absolute w-[150px] h-[150px] bg-yellow opacity-[.12] rounded-full -bottom-[60px] left-[8%] pointer-events-none" />

            <div className="relative z-[1]">
              <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
                ¿Listo para empezar?
              </p>
              <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-black leading-[1.15] tracking-tight">
                ¿Listo para dar
                <br />
                el <b className="text-blue">siguiente paso</b>?
              </h2>
              <p className="text-[13.5px] text-muted leading-relaxed max-w-[420px] my-3 mb-6">
                Ya sea que busques empleo o necesites contratar, estamos aqui.
                Te respondemos en menos de 24 horas habiles.
              </p>
              <div className="flex gap-2.5 flex-wrap">
                <Link href="/vacantes" className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
                  Ver vacantes →
                </Link>
                <Link href="/contacto" className="bg-[#E3F2FF] text-blue-dark border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center hover:bg-[#cce5ff] transition-colors">
                  Contratar personal
                </Link>
              </div>
            </div>

            <div className="relative z-[1]">
              <img
                src="https://picsum.photos/seed/kyo-cta/400/300"
                alt=""
                className="w-full max-w-[340px] h-[260px] object-cover object-top rounded-3xl mx-auto block"
              />
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
