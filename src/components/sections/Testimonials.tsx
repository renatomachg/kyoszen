"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const testimonials = [
  {
    headline: "EXCEPCIONAL",
    text: "Kyoszen cubrio nuestra vacante en menos de una semana. Los candidatos llegaron con documentacion lista y perfectamente alineados al perfil.",
    name: "Ana Martinez",
    role: "Gerente RRHH · Logistica MX",
    img: "https://i.pravatar.cc/80?img=5",
  },
  {
    headline: "IMPECABLE",
    text: "Proceso agil y transparente. Nos ahorraron semanas de trabajo. Los volveria a contratar sin dudarlo para cualquier proceso de seleccion.",
    name: "Carlos Reyes",
    role: "Director General · ServiPro",
    img: "https://i.pravatar.cc/80?img=11",
  },
  {
    headline: "COMPROMETIDOS",
    text: "Encontre trabajo en 3 dias. Me orientaron en todo y me ayudaron a preparar mi documentacion. ¡Totalmente recomendados!",
    name: "Laura Sanchez",
    role: "Candidata colocada · CDMX",
    img: "https://i.pravatar.cc/80?img=9",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-blue-dark relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="mb-10">
            <span className="inline-block bg-yellow text-black text-[11px] font-extrabold py-1.5 px-4 rounded-full uppercase tracking-wider mb-4">
              Testimonios
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.1] tracking-tight text-white">
              Lo que dicen
              <br />
              nuestros clientes
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#F8FAFC] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            >
              {/* Stars */}
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-yellow text-sm">★</span>
                ))}
              </div>

              {/* Headline */}
              <h3 className="text-[13px] font-black tracking-[1.5px] text-navy mb-3">
                &ldquo;{t.headline}&rdquo;
              </h3>

              {/* Quote */}
              <p className="text-[13px] text-[#4B5563] leading-relaxed mb-6">
                {t.text}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <img
                  src={t.img}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-border"
                />
                <div>
                  <div className="text-[13px] font-extrabold text-navy">{t.name}</div>
                  <div className="text-[11px] text-muted">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
