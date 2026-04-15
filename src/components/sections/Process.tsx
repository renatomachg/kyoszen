"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const steps = [
  {
    num: "01",
    title: "Identificamos el perfil",
    desc: "Analizamos requerimientos, cultura y expectativas para definir el candidato exacto.",
  },
  {
    num: "02",
    title: "Busqueda dirigida",
    desc: "Reclutamos activamente en multiples canales y evaluamos con criterio claro.",
  },
  {
    num: "03",
    title: "Evaluacion profunda",
    desc: "Verificamos habilidades, actitud, compatibilidad y documentacion completa.",
  },
  {
    num: "04",
    title: "Cierre y seguimiento",
    desc: "Presentamos candidatos y acompañamos hasta la contratacion exitosa.",
  },
];

export default function Process() {
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="text-center max-w-[640px] mx-auto mb-12">
            <span className="inline-block bg-yellow text-black text-[11px] font-extrabold py-1.5 px-4 rounded-full uppercase tracking-wider mb-4">
              Como trabajamos
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.1] tracking-tight text-navy mb-4">
              No paramos despues de contratar
            </h2>
            <p className="text-[13.5px] text-muted leading-relaxed max-w-[540px] mx-auto">
              Un proceso claro, transparente y con seguimiento en cada etapa.
              Nuestro metodo garantiza que el talento correcto llegue a tu
              empresa y se quede.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
          {steps.map((step, i) => {
            const highlighted = i % 2 === 0;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`rounded-2xl p-8 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between min-h-[360px] ${
                  !highlighted ? "lg:mt-16" : ""
                } ${
                  highlighted
                    ? "bg-blue-dark text-white"
                    : "bg-white text-navy border border-border shadow-md"
                }`}
              >
                <div
                  className={`text-[clamp(2.5rem,4vw,3.5rem)] font-black leading-none tracking-tight ${
                    highlighted ? "text-yellow" : "text-navy"
                  }`}
                >
                  {step.num}
                </div>

                <div className="text-right mt-6">
                  <h4 className={`text-lg font-extrabold leading-tight mb-2 ${highlighted ? "text-white" : "text-navy"}`}>
                    {step.title}
                  </h4>
                  <p
                    className={`text-[13px] leading-relaxed ${
                      highlighted ? "text-white/75" : "text-muted"
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
