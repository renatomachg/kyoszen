"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const faqData = {
  empresa: [
    {
      q: "¿Cuanto cuesta el servicio de reclutamiento?",
      a: "El costo varia segun el perfil y numero de vacantes. Un asesor te dara una propuesta personalizada sin costo y sin compromiso.",
    },
    {
      q: "¿En cuanto tiempo cubren una vacante?",
      a: "Garantizamos cobertura en tiempo y forma. El plazo varia segun el perfil, siempre priorizando rapidez sin sacrificar calidad.",
    },
    {
      q: "¿En que zonas operan?",
      a: "Principalmente CDMX y Estado de Mexico. Contactanos para confirmar cobertura en tu zona especifica.",
    },
    {
      q: "¿Ofrecen garantia si el candidato no funciona?",
      a: "Si, ofrecemos garantia de reposicion. Si el candidato no se adapta en el periodo acordado, buscamos un reemplazo sin costo adicional.",
    },
    {
      q: "¿Que tipo de perfiles reclutan?",
      a: "Administrativos, operativos, ventas, atencion al cliente, RRHH y mas. Cubrimos perfiles operativos y de mandos medios para microempresas.",
    },
  ],
  candidato: [
    {
      q: "¿Que documentos necesito para aplicar a una vacante?",
      a: "Acta de nacimiento, comprobante de domicilio (max 3 meses), ID oficial, CURP, numero de seguridad social y constancia de situacion fiscal.",
    },
    {
      q: "¿Que pasa despues de enviar mis datos?",
      a: "Te contactamos en 24 horas habiles para dar seguimiento personalizado a tu proceso.",
    },
    {
      q: "¿Tiene algun costo aplicar a una vacante?",
      a: "No, el proceso es completamente gratuito para los candidatos. Nunca te cobraremos por postularte o ser colocado.",
    },
    {
      q: "¿Como me preparo para la entrevista?",
      a: "Te orientamos en todo el proceso: revision de CV, preparacion de documentos y tips para tu entrevista. Nuestro equipo te acompaña paso a paso.",
    },
    {
      q: "¿En cuanto tiempo puedo ser colocado?",
      a: "Dependiendo del perfil y vacantes disponibles, muchos candidatos son colocados en menos de una semana.",
    },
  ],
};

type TabKey = "empresa" | "candidato";

export default function FAQ() {
  const [activeTab, setActiveTab] = useState<TabKey>("empresa");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setOpenIndex(null);
  };

  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
      <div className="max-w-[960px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1.6fr] gap-12 items-start">
          {/* Left */}
          <AnimatedSection>
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
              Preguntas frecuentes
            </p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black leading-[1.1] tracking-tight text-navy mb-4">
              ¿Tienes dudas?
              <br />
              Nosotros
              <br />
              te ayudamos.
            </h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-6">
              Resolvemos las preguntas mas comunes sobre nuestros servicios de
              reclutamiento, candidatos y procesos.
            </p>
            <Link href="/contacto" className="text-[13px] font-bold text-blue no-underline inline-flex items-center gap-1 hover:gap-[7px] transition-all">
              Mas preguntas →
            </Link>
          </AnimatedSection>

          {/* Right */}
          <AnimatedSection delay={0.2}>
            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => switchTab("empresa")}
                className={`flex-1 py-3 px-4 rounded-xl text-[13px] font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "empresa"
                    ? "bg-blue text-white border-blue"
                    : "bg-white text-navy border-border hover:border-blue-mid"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                Soy empresa
              </button>
              <button
                onClick={() => switchTab("candidato")}
                className={`flex-1 py-3 px-4 rounded-xl text-[13px] font-bold border-2 transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  activeTab === "candidato"
                    ? "bg-blue text-white border-blue"
                    : "bg-white text-navy border-border hover:border-blue-mid"
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                Soy candidato
              </button>
            </div>

            {/* FAQ list */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col"
              >
                {faqData[activeTab].map((faq, i) => (
                  <div key={i} className="border-b border-border first:border-t first:border-border">
                    <button
                      onClick={() => toggle(i)}
                      className="py-4 flex justify-between items-center cursor-pointer gap-4 w-full bg-transparent border-none text-left"
                    >
                      <span className={`text-sm font-semibold transition-colors ${openIndex === i ? "text-blue" : "text-navy"}`}>
                        {faq.q}
                      </span>
                      <div className={`w-[22px] h-[22px] border-[1.5px] rounded-full flex items-center justify-center text-sm shrink-0 transition-all duration-200 ${
                        openIndex === i
                          ? "bg-navy border-navy text-white rotate-45"
                          : "border-border text-muted"
                      }`}>
                        +
                      </div>
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${
                        openIndex === i ? "max-h-[200px] pb-4" : "max-h-0"
                      }`}
                    >
                      <p className="text-[13.5px] text-muted leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
