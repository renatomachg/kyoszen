"use client";

import { useState } from "react";
import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";

const faqs = [
  {
    q: "¿Cuanto cuesta el servicio de reclutamiento?",
    a: "El costo varia segun el perfil y numero de vacantes. Un asesor te dara una propuesta personalizada sin costo y sin compromiso.",
  },
  {
    q: "¿En cuanto tiempo cubren una vacante?",
    a: "Garantizamos cobertura en tiempo y forma. El plazo varia segun el perfil, siempre priorizando rapidez sin sacrificar calidad.",
  },
  {
    q: "¿Que documentos necesito para aplicar a una vacante?",
    a: "Acta de nacimiento, comprobante de domicilio (max 3 meses), ID oficial, CURP, numero de seguridad social y constancia de situacion fiscal.",
  },
  {
    q: "¿En que zonas operan?",
    a: "Principalmente CDMX y Estado de Mexico. Contactanos para confirmar cobertura en tu zona especifica.",
  },
  {
    q: "¿Que pasa despues de enviar mis datos?",
    a: "Te contactamos en 24 horas habiles para dar seguimiento personalizado a tu proceso.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  return (
    <section className="py-20 px-[5%] bg-white">
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
            <div className="flex flex-col">
              {faqs.map((faq, i) => (
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
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
