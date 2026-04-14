"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const faqData = {
  empresa: [
    { q: "¿Cuanto cuesta el servicio de reclutamiento?", a: "El costo varia segun el perfil y numero de vacantes. Un asesor te dara una propuesta personalizada sin costo y sin compromiso." },
    { q: "¿En cuanto tiempo cubren una vacante?", a: "Garantizamos cobertura en tiempo y forma. El plazo varia segun el perfil, siempre priorizando rapidez sin sacrificar calidad." },
    { q: "¿En que zonas operan?", a: "Principalmente CDMX y Estado de Mexico. Contactanos para confirmar cobertura en tu zona especifica." },
    { q: "¿Ofrecen garantia de reposicion?", a: "Si, ofrecemos garantia de reposicion. Si el candidato no se adapta en el periodo acordado, buscamos un reemplazo sin costo adicional." },
    { q: "¿Que tipo de perfiles reclutan?", a: "Administrativos, operativos, ventas, atencion al cliente, RRHH y mas. Cubrimos perfiles operativos y de mandos medios." },
    { q: "¿Ofrecen capacitacion para mi equipo?", a: "Si, tenemos mas de 25 cursos en RRHH, liderazgo, calidad y normatividad. Programas presenciales, en linea o hibridos." },
  ],
  candidato: [
    { q: "¿Que documentos necesito para aplicar?", a: "Acta de nacimiento, comprobante de domicilio (max 3 meses), ID oficial, CURP, numero de seguridad social y constancia de situacion fiscal." },
    { q: "¿Que pasa despues de enviar mis datos?", a: "Te contactamos en 24 horas habiles para dar seguimiento personalizado a tu proceso." },
    { q: "¿Tiene algun costo aplicar a una vacante?", a: "No, el proceso es completamente gratuito para los candidatos. Nunca te cobraremos por postularte o ser colocado." },
    { q: "¿Como me preparo para la entrevista?", a: "Te orientamos en todo el proceso: revision de CV, preparacion de documentos y tips para tu entrevista." },
    { q: "¿En cuanto tiempo puedo ser colocado?", a: "Dependiendo del perfil y vacantes disponibles, muchos candidatos son colocados en menos de una semana." },
    { q: "¿En que zonas hay vacantes disponibles?", a: "Principalmente CDMX y Estado de Mexico. Consulta nuestra seccion de vacantes para ver las oportunidades actuales." },
  ],
};

type TabKey = "empresa" | "candidato";

export default function FAQ() {
  const [activeTab, setActiveTab] = useState<TabKey>("empresa");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setSelectedIndex(null);
  };

  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection className="text-center mb-10">
          <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
            Preguntas frecuentes
          </p>
          <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-black leading-[1.1] tracking-tight text-navy">
            ¿Tienes dudas? Nosotros te ayudamos.
          </h2>
        </AnimatedSection>

        {/* Tabs */}
        <div className="flex gap-3 justify-center mb-10">
          <button
            onClick={() => switchTab("empresa")}
            className={`py-3 px-6 rounded-xl text-[13px] font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
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
            className={`py-3 px-6 rounded-xl text-[13px] font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "candidato"
                ? "bg-blue text-white border-blue"
                : "bg-white text-navy border-border hover:border-blue-mid"
            }`}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
            Soy candidato
          </button>
        </div>

        {/* FAQ Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
              {faqData[activeTab].map((faq, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(selectedIndex === i ? null : i)}
                  className={`text-left p-5 rounded-xl border-2 transition-all duration-200 cursor-pointer flex items-center justify-between gap-4 ${
                    selectedIndex === i
                      ? "border-blue bg-blue-soft border-l-4"
                      : "border-border bg-bg hover:border-blue-mid hover:bg-white"
                  }`}
                >
                  <span className={`text-[13.5px] font-semibold leading-snug ${selectedIndex === i ? "text-blue-dark" : "text-navy"}`}>
                    {faq.q}
                  </span>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={selectedIndex === i ? "var(--color-blue)" : "var(--color-muted)"}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`shrink-0 transition-transform duration-200 ${selectedIndex === i ? "rotate-90" : ""}`}
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              ))}
            </div>

            {/* Answer panel */}
            <AnimatePresence>
              {selectedIndex !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -5, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="max-w-4xl mx-auto mt-6 overflow-hidden"
                >
                  <div className="bg-bg border border-border rounded-xl p-6 flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-blue flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy mb-1">{faqData[activeTab][selectedIndex].q}</p>
                      <p className="text-[13.5px] text-muted leading-relaxed">{faqData[activeTab][selectedIndex].a}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="text-center mt-10">
          <p className="text-[13px] text-muted mb-3">¿No encontraste tu respuesta?</p>
          <Link href="/contacto" className="bg-blue-btn text-white rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
            Contactar un asesor →
          </Link>
        </div>
      </div>
    </section>
  );
}
