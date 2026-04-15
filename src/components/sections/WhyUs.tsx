"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const items = [
  {
    n: "01",
    title: "Candidatos verificados",
    desc: "Documentacion completa y perfil revisado antes de presentar a tu empresa.",
  },
  {
    n: "02",
    title: "Respuesta en 24h",
    desc: "Velocidad sin sacrificar calidad. Soluciones rapidas para tu operacion.",
  },
  {
    n: "03",
    title: "Acompañamiento total",
    desc: "Desde el primer contacto hasta la integracion del colaborador.",
  },
];

export default function WhyUs() {
  return (
    <section
      className="py-20 px-5 md:px-10 xl:px-20 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 70% 20%, #4FB3FF 0%, #1883FF 35%, #0A4ECC 70%, #042E7B 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header row */}
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-8 md:gap-12 items-end mb-10">
          <AnimatedSection>
            <p className="text-[11px] font-bold text-yellow uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
              ¿Por que elegirnos?
            </p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.08] tracking-tight text-white">
              Consigue las habilidades
              <br />
              que el mercado
              <br />
              laboral demanda.
            </h2>
          </AnimatedSection>
          <AnimatedSection delay={0.15}>
            <p className="text-[13.5px] text-white/85 leading-relaxed">
              Mas de 10 años conectando talento con empresas mexicanas en
              crecimiento. Combinamos tecnologia, experiencia y un trato
              genuinamente humano para entregar resultados reales.
            </p>
          </AnimatedSection>
        </div>

        {/* Content row: numbered items left, image right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left - Numbered items */}
          <AnimatedSection>
            <div className="flex flex-col gap-5">
              {items.map((item, i) => (
                <motion.div
                  key={item.n}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-yellow flex items-center justify-center text-navy font-black text-base shadow-md">
                    {item.n}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <h4 className="text-base font-extrabold text-white mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[13px] text-white/80 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}

              <div className="mt-3">
                <Link
                  href="/servicios"
                  className="bg-yellow text-navy border-none rounded-full py-3 px-7 text-[13px] font-extrabold no-underline inline-flex items-center gap-1.5 hover:bg-[#e6b800] transition-colors"
                >
                  Ver servicios →
                </Link>
              </div>
            </div>
          </AnimatedSection>

          {/* Right - Image */}
          <AnimatedSection delay={0.2}>
            <div className="rounded-3xl overflow-hidden relative h-[420px] md:h-[480px] shadow-xl">
              <Image
                src="/images/resultados.png"
                alt="Equipo Kyoszen"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 100vw, 600px"
              />
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
