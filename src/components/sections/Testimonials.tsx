"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const testimonials = [
  {
    text: "Kyoszen cubrio nuestra vacante en menos de una semana. Los candidatos llegaron con documentacion lista y perfectamente alineados al perfil.",
    name: "Ana Martinez",
    role: "Gerente RRHH · Logistica MX",
    img: "https://i.pravatar.cc/80?img=5",
  },
  {
    text: "Proceso agil y transparente. Nos ahorraron semanas de trabajo. Los volveria a contratar sin dudarlo para cualquier proceso de seleccion.",
    name: "Carlos Reyes",
    role: "Director General · ServiPro",
    img: "https://i.pravatar.cc/80?img=11",
  },
  {
    text: "Encontre trabajo en 3 dias. Me orientaron en todo y me ayudaron a preparar mi documentacion. ¡Totalmente recomendados!",
    name: "Laura Sanchez",
    role: "Candidata colocada · CDMX",
    img: "https://i.pravatar.cc/80?img=9",
  },
];

export default function Testimonials() {
  return (
    <section className="py-20 px-[5%] bg-bg">
      <div className="max-w-[1200px] mx-auto">
        <AnimatedSection className="text-center max-w-[500px] mx-auto">
          <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
            Testimonios
          </p>
          <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark text-center">
            Lo que dicen
            <br />
            nuestros clientes
          </h2>
        </AnimatedSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-xl p-6 border border-border transition-all duration-200 hover:shadow-[0_6px_24px_rgba(0,0,0,.06)] hover:-translate-y-0.5"
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (
                  <span key={j} className="text-yellow text-sm">★</span>
                ))}
              </div>
              <div className="text-[2.5rem] text-blue opacity-15 leading-none font-serif mb-1">&ldquo;</div>
              <p className="text-[13.5px] text-[#444] leading-relaxed mb-4">{t.text}</p>
              <div className="flex items-center gap-3">
                <img src={t.img} alt="" className="w-[42px] h-[42px] rounded-full object-cover border-2 border-border" />
                <div>
                  <div className="text-[13px] font-extrabold">{t.name}</div>
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
