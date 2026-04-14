"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const steps = [
  {
    num: "01",
    bg: "bg-blue-soft",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
    title: "Identificamos el perfil",
    desc: "Analizamos requerimientos, cultura y expectativas para definir el candidato exacto.",
  },
  {
    num: "02",
    bg: "bg-yellow-soft",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></svg>,
    title: "Busqueda dirigida",
    desc: "Reclutamos activamente en multiples canales y evaluamos con criterio claro.",
  },
  {
    num: "03",
    bg: "bg-purple-soft",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-purple)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
    title: "Evaluacion profunda",
    desc: "Verificamos habilidades, actitud, compatibilidad y documentacion completa.",
  },
  {
    num: "04",
    bg: "bg-green-soft",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    title: "Cierre y seguimiento",
    desc: "Presentamos candidatos y acompañamos hasta la contratacion exitosa.",
  },
];

export default function Process() {
  return (
    <section className="py-20 sec-pad bg-white">
      <div className="sec-container">
        <AnimatedSection className="text-center max-w-[520px] mx-auto">
          <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
            Como trabajamos
          </p>
          <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark text-center">
            No paramos despues
            <br />
            de contratar
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-bg rounded-xl p-6 border-[1.5px] border-transparent transition-all duration-200 hover:border-blue-mid hover:bg-white hover:shadow-md relative overflow-hidden group"
            >
              <span className="absolute -top-2 right-2.5 text-[5rem] font-black text-blue opacity-5 leading-none">{step.num}</span>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg mb-4 ${step.bg}`}>
                {step.icon}
              </div>
              <h4 className="text-sm font-extrabold mb-1">{step.title}</h4>
              <p className="text-[12.5px] text-muted leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
