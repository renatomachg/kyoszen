"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/ui/AnimatedSection";

const bullets = [
  {
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
    title: "Candidatos verificados",
    desc: "Documentacion completa y perfil revisado antes de presentar a tu empresa.",
  },
  {
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    title: "Respuesta en 24h",
    desc: "Velocidad sin sacrificar calidad. Soluciones rapidas para tu operacion.",
  },
  {
    icon: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    title: "Acompañamiento total",
    desc: "Desde el primer contacto hasta la integracion del colaborador.",
  },
];

export default function WhyUs() {
  return (
    <section className="py-20 sec-pad bg-bg">
      <div className="sec-container">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.1fr] gap-12 md:gap-16 items-center">
          {/* Left */}
          <AnimatedSection>
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
              ¿Por que elegirnos?
            </p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black leading-[1.08] tracking-tight text-blue-dark mb-0">
              Consigue las habilidades
              <br />
              que el mercado
              <br />
              laboral demanda.
            </h2>
            <div className="flex flex-col gap-0 my-8">
              {bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-3.5 relative">
                  <div className="flex flex-col items-center shrink-0 mt-px">
                    <div className="w-[34px] h-[34px] rounded-full bg-white border-[1.5px] border-border flex items-center justify-center shrink-0 relative z-[1]">
                      {b.icon}
                    </div>
                    {i < bullets.length - 1 && <div className="w-[1.5px] bg-border flex-1 min-h-[28px]" />}
                  </div>
                  <div className={i < bullets.length - 1 ? "pb-7" : ""}>
                    <h5 className="text-sm font-bold text-navy mt-1.5 mb-1">{b.title}</h5>
                    <p className="text-[13px] text-muted leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/servicios" className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
              Ver servicios →
            </Link>
          </AnimatedSection>

          {/* Right */}
          <AnimatedSection delay={0.2} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-0 bg-white rounded-xl border-[1.5px] border-border overflow-hidden">
              <div className="p-4 px-5 border-r-[1.5px] border-border">
                <div className="text-[2.2rem] font-extrabold text-blue leading-none mb-1">3+</div>
                <div className="text-xs text-muted leading-snug">Años de<br />experiencia</div>
              </div>
              <div className="p-4 px-5">
                <div className="text-[2.2rem] font-extrabold text-blue leading-none mb-1">687+</div>
                <div className="text-xs text-muted leading-snug">Candidatos<br />colocados</div>
              </div>
            </div>
            <Image
              src="/images/resultados.png"
              alt="Profesional Kyoszen"
              width={600}
              height={420}
              className="w-full h-[420px] object-cover object-top rounded-3xl"
            />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
