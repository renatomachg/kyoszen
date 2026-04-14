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

function FaqCard({ faq, isOpen, onClick }: { faq: { q: string; a: string }; isOpen: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-left w-full rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isOpen ? "border-blue-mid bg-white shadow-md" : "border-border bg-white hover:border-blue-mid hover:shadow-sm"
      }`}
    >
      <div className="flex items-center justify-between gap-4 p-5">
        <span className={`text-[13.5px] font-semibold leading-snug transition-colors ${isOpen ? "text-blue" : "text-navy"}`}>
          {faq.q}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke={isOpen ? "var(--color-blue)" : "var(--color-muted)"}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-[13px] text-muted leading-relaxed px-5 pb-5">
              {faq.a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

export default function FAQ() {
  const [activeTab, setActiveTab] = useState<TabKey>("empresa");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const switchTab = (tab: TabKey) => {
    setActiveTab(tab);
    setOpenIndex(null);
  };

  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-bg">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-black leading-[1.1] tracking-tight text-navy">
              Preguntas frecuentes
            </h2>
            <Link href="/contacto" className="bg-blue-btn text-white rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors w-fit shrink-0">
              Contactanos →
            </Link>
          </div>
        </AnimatedSection>

        {/* Tabs */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => switchTab("empresa")}
            className={`py-2.5 px-5 rounded-full text-[13px] font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "empresa"
                ? "bg-blue text-white border-blue"
                : "bg-white text-navy border-border hover:border-blue-mid"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
            Soy empresa
          </button>
          <button
            onClick={() => switchTab("candidato")}
            className={`py-2.5 px-5 rounded-full text-[13px] font-bold border-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === "candidato"
                ? "bg-blue text-white border-blue"
                : "bg-white text-navy border-border hover:border-blue-mid"
            }`}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
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
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {faqData[activeTab].map((faq, i) => (
              <FaqCard
                key={i}
                faq={faq}
                isOpen={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
