"use client";

import Link from "next/link";
import Image from "next/image";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { motion } from "framer-motion";

export default function About() {
  return (
    <section className="bg-bg py-20 px-[5%]">
      <div className="max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* Left - Text */}
          <AnimatedSection>
            <span className="inline-block bg-[#E3F2FF] text-blue-dark text-xs font-bold py-1.5 px-[18px] rounded-full tracking-wide">
              Sobre Kyoszen
            </span>
            <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark mt-4 mb-4">
              Mas de <span className="text-blue-btn">10 años</span> impulsando el talento humano en Mexico
            </h2>
            <p className="text-sm text-[#64748B] leading-relaxed mb-6">
              Somos una consultora especializada en Recursos Humanos que apoya a
              microempresas mexicanas en crecimiento. Reclutamiento,
              capacitacion, induccion y digitalizacion — todo con
              acompañamiento personalizado en CDMX y Area Metropolitana.
            </p>
            <div className="flex gap-2.5 flex-wrap">
              <Link href="/nosotros" className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
                Conocer mas →
              </Link>
              <Link href="/contacto" className="bg-[#E3F2FF] text-blue-dark border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center hover:bg-[#cce5ff] transition-colors">
                Contactanos
              </Link>
            </div>
          </AnimatedSection>

          {/* Right - Image collage */}
          <AnimatedSection delay={0.2} className="relative">
            <div className="grid grid-cols-[1.2fr_.8fr] gap-3 h-[360px]">
              <div className="rounded-2xl overflow-hidden">
                <Image src="/images/about.png" alt="Equipo Kyoszen" width={600} height={400} className="w-full h-full object-cover" />
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

            {/* Float cards */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="absolute bottom-5 -left-4 bg-white rounded-xl py-2.5 px-3.5 shadow-[0_4px_20px_rgba(0,0,0,.1)] flex items-center gap-2.5 z-[2]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#E3F2FF] shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004EE0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              </div>
              <div>
                <div className="text-[15px] font-extrabold text-[#0F172A] leading-none">687+</div>
                <div className="text-[10px] text-[#64748B] mt-px">Colocados</div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute top-5 -right-4 bg-white rounded-xl py-2.5 px-3.5 shadow-[0_4px_20px_rgba(0,0,0,.1)] flex items-center gap-2.5 z-[2]"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-soft shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>
              </div>
              <div>
                <div className="text-[15px] font-extrabold text-[#0F172A] leading-none">99%</div>
                <div className="text-[10px] text-[#64748B] mt-px">Satisfaccion</div>
              </div>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
