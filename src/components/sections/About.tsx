"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { motion } from "framer-motion";

const stats = [
  { n: "7000+", l: "Candidatos colocados", color: "text-blue" },
  { n: "99%", l: "Clientes satisfechos", color: "text-[#15803d]" },
  { n: "10+", l: "Años de experiencia", color: "text-[#b45309]" },
];

export default function About() {
  return (
    <section className="bg-bg py-20 px-5 md:px-10 xl:px-20">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Left - Image collage with stats */}
          <AnimatedSection className="relative">
            <div className="grid grid-cols-[1.2fr_.8fr] gap-3 h-[420px]">
              <div className="rounded-2xl overflow-hidden">
                <Image src="/images/about.png" alt="Equipo Kyoszen" width={600} height={500} className="w-full h-full object-cover" />
              </div>
              <div className="grid grid-rows-2 gap-3">
                <div className="rounded-xl overflow-hidden">
                  <Image src="/images/Hero.jpg" alt="Reunion de trabajo" width={300} height={200} className="w-full h-full object-cover" />
                </div>
                <div className="rounded-xl overflow-hidden">
                  <Image src="/images/Hero2.jpg" alt="Trabajo operativo" width={300} height={200} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Stats bar overlapping the image bottom-right */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="absolute -bottom-6 right-0 md:right-4 bg-navy rounded-2xl shadow-2xl p-5 md:p-6 grid grid-cols-3 gap-4 md:gap-8 z-[3] min-w-[280px] max-w-[92%]"
            >
              {stats.map((s) => (
                <div key={s.l} className="text-center">
                  <div className={`text-[clamp(1.25rem,2.5vw,1.75rem)] font-black leading-none mb-1 ${s.color === "text-blue" ? "text-yellow" : s.color === "text-[#15803d]" ? "text-yellow" : "text-yellow"}`}>
                    {s.n}
                  </div>
                  <div className="text-[10px] md:text-[11px] text-white/70 font-semibold leading-tight">
                    {s.l}
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Small accent badge top-left */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute top-4 -left-3 bg-white rounded-xl py-2 px-3 shadow-lg flex items-center gap-2 z-[2]"
            >
              <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-green-soft shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
              </div>
              <div>
                <div className="text-xs font-extrabold text-navy leading-none">+10 años</div>
                <div className="text-[9px] text-muted mt-0.5">en el mercado</div>
              </div>
            </motion.div>
          </AnimatedSection>

          {/* Right - Text */}
          <AnimatedSection delay={0.2}>
            <span className="inline-block bg-[#E3F2FF] text-blue-dark text-xs font-bold py-1.5 px-[18px] rounded-full tracking-wide">
              Sobre Kyoszen
            </span>
            <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark mt-4 mb-4">
              Más de <span className="text-blue-btn">10 años</span> impulsando el talento humano en México
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              Somos una consultora especializada en Recursos Humanos que apoya a
              microempresas mexicanas en crecimiento. Reclutamiento,
              capacitación, inducción y digitalización — todo con
              acompañamiento personalizado en CDMX y Área Metropolitana.
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <Link href="/nosotros" className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
                Conocer más →
              </Link>
              <Link href="/contacto" className="bg-[#E3F2FF] text-blue-dark border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center hover:bg-[#cce5ff] transition-colors">
                Contáctanos
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
