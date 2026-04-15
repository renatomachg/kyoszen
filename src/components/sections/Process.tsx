"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const steps = [
  {
    num: "01",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    title: "Identificamos el perfil",
    desc: "Analizamos requerimientos, cultura y expectativas para definir el candidato exacto.",
  },
  {
    num: "02",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
    title: "Busqueda dirigida",
    desc: "Reclutamos activamente en multiples canales y evaluamos con criterio claro.",
  },
  {
    num: "03",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    title: "Evaluacion profunda",
    desc: "Verificamos habilidades, actitud, compatibilidad y documentacion completa.",
  },
  {
    num: "04",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    title: "Cierre y seguimiento",
    desc: "Presentamos candidatos y acompañamos hasta la contratacion exitosa.",
  },
];

export default function Process() {
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-blue-dark relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="mb-10 max-w-[620px]">
            <span className="inline-block bg-yellow text-black text-[11px] font-extrabold py-1.5 px-4 rounded-full uppercase tracking-wider mb-4">
              Como trabajamos
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.1] tracking-tight text-white">
              No paramos despues
              <br />
              de contratar
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative bg-[#E3F2FF] rounded-2xl p-6 pt-7 border border-white/5 shadow-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Square icon like the service cards */}
              <div className="absolute -top-4 right-5 w-11 h-11 rounded-xl bg-yellow flex items-center justify-center shadow-md">
                {step.icon}
              </div>

              {/* Step number */}
              <span className="text-[11px] font-extrabold text-blue uppercase tracking-wider mb-2 block">
                Paso {step.num}
              </span>

              <h4 className="text-base font-extrabold text-navy mb-2 leading-tight">
                {step.title}
              </h4>
              <p className="text-[13px] text-muted leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
