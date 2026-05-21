"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const stats = [
  { target: 7000, label: "Candidatos colocados" },
  { target: 25, label: "Cursos disponibles" },
  { target: 10, label: "Años de experiencia" },
];

function Counter({ target, started }: { target: number; started: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!started) return;
    const duration = 3000;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
      else setCount(target);
    }

    requestAnimationFrame(tick);
  }, [started, target]);

  return <span>{count}</span>;
}

export default function StatsBar() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section className="bg-[#64748B] py-12 px-5 md:px-10 xl:px-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-center text-[clamp(1.2rem,2.5vw,1.6rem)] font-extrabold text-white mb-2">
          Resultados que nos respaldan
        </h2>
        <p className="text-center text-[13.5px] text-white/60 max-w-[520px] mx-auto mb-6 leading-relaxed">
          Más de una década conectando talento con empresas mexicanas en
          crecimiento. Estos numeros reflejan nuestro compromiso con cada
          cliente.
        </p>
      </motion.div>
      <div
        ref={ref}
        className="max-w-[900px] mx-auto bg-bg rounded-2xl py-8 px-10 flex items-center justify-center gap-0 flex-wrap"
      >
        {stats.map((stat, i) => (
          <div key={stat.label} className="flex items-center">
            {i > 0 && (
              <div className="w-px h-12 bg-border shrink-0 mx-6 hidden sm:block" />
            )}
            <div className="text-center flex-1 min-w-[120px] py-2 sm:py-0">
              <div className="text-[clamp(1.5rem,3vw,2rem)] font-bold leading-none mb-1 text-[#0F172A]">
                <Counter target={stat.target} started={started} />+
              </div>
              <div className="text-xs text-[#64748B] font-medium">
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
