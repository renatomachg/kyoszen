"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type SlideCard = {
  label: string;
  value: number;
  unit?: string;
  target: number;
  barColor: string;
  bgColor: string;
  textColor: string;
  subtle: string;
};

interface Slide {
  id: string;
  image: string;
  chip: { label: string; color: "green" | "yellow" | "blue" };
  cards: SlideCard[];
}

const slides: Slide[] = [
  {
    id: "vacantes",
    image: "/images/Hero.jpg",
    chip: { label: "Vacantes abiertas", color: "green" },
    cards: [
      {
        label: "Candidatos colocados",
        value: 687,
        target: 800,
        barColor: "bg-white/90",
        bgColor: "#F97316",
        textColor: "#ffffff",
        subtle: "rgba(255,255,255,0.85)",
      },
      {
        label: "Empresas atendidas",
        value: 672,
        target: 800,
        barColor: "bg-white/90",
        bgColor: "#9770FF",
        textColor: "#ffffff",
        subtle: "rgba(255,255,255,0.85)",
      },
    ],
  },
  {
    id: "cursos",
    image: "/images/nosotros1.jpg",
    chip: { label: "Cursos activos", color: "yellow" },
    cards: [
      {
        label: "Cursos disponibles",
        value: 25,
        target: 30,
        barColor: "bg-white/90",
        bgColor: "#0033FF",
        textColor: "#ffffff",
        subtle: "rgba(255,255,255,0.85)",
      },
      {
        label: "Satisfaccion alumnos",
        value: 98,
        unit: "%",
        target: 100,
        barColor: "bg-white/90",
        bgColor: "#15803D",
        textColor: "#ffffff",
        subtle: "rgba(255,255,255,0.85)",
      },
    ],
  },
  {
    id: "candidatos",
    image: "/images/nosotros2.jpg",
    chip: { label: "Candidatos verificados", color: "blue" },
    cards: [
      {
        label: "Tasa de colocacion",
        value: 95,
        unit: "%",
        target: 100,
        barColor: "bg-white/90",
        bgColor: "#EF4444",
        textColor: "#ffffff",
        subtle: "rgba(255,255,255,0.85)",
      },
      {
        label: "Retencion 6 meses",
        value: 92,
        unit: "%",
        target: 100,
        barColor: "bg-white/90",
        bgColor: "#9770FF",
        textColor: "#ffffff",
        subtle: "rgba(255,255,255,0.85)",
      },
    ],
  },
];

const chipColors: Record<string, string> = {
  green: "bg-[#22C55E] text-white",
  yellow: "bg-yellow text-navy",
  blue: "bg-[#0033FF] text-white",
};

function CountUp({ to, duration = 1.6 }: { to: number; duration?: number }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => setDisplay(v));
    const controls = animate(count, to, { duration, ease: [0.22, 1, 0.36, 1] });
    return () => {
      controls.stop();
      unsub();
    };
  }, [to, duration, count, rounded]);

  return <>{display}</>;
}

function AnimatedCard({ card, delay }: { card: SlideCard; delay: number }) {
  const fillPct = Math.min(100, Math.round((card.value / card.target) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl px-4 py-3 sm:px-5 sm:py-4 shadow-xl w-full sm:min-w-[230px]"
      style={{ background: card.bgColor, color: card.textColor }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-[12px] font-bold leading-tight" style={{ color: card.subtle }}>
          {card.label}
        </div>
        <div className="text-[28px] font-black leading-none shrink-0">
          <CountUp to={card.value} />
          {card.unit ?? ""}
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-[6px] w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.25)" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ delay: delay + 0.2, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="h-full bg-white/90 rounded-full"
        />
      </div>
    </motion.div>
  );
}

export default function Hero() {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const slide = slides[slideIndex];

  return (
    <section className="bg-navy pt-32 pb-16 px-5 md:px-10 xl:px-20 overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute w-[500px] h-[500px] bg-white/[.04] rounded-full -top-[200px] -right-[100px] pointer-events-none z-0" />
      <div className="absolute w-[250px] h-[250px] bg-blue/[.12] rounded-full bottom-0 left-[5%] pointer-events-none z-0" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-[1]">
        {/* LEFT - Fixed text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-[clamp(2rem,4.5vw,3.2rem)] font-black leading-[1.08] tracking-tight text-white mb-4">
            Transforma tu empresa
            <br />
            con el <span className="text-yellow">equipo ideal</span>
          </h1>
          <p className="text-[14.5px] text-white/65 leading-relaxed max-w-[460px] mb-7">
            Conectamos personas que buscan empleo con empresas que necesitan
            talento. Reclutamiento agil, candidatos verificados, resultados
            reales.
          </p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-[460px] mb-8 bg-white/10 border-[1.5px] border-white/20 rounded-full py-[5px] pr-[5px] pl-5 items-center">
            <input
              placeholder="¿Que puesto buscas?"
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#bbb] font-[inherit]"
            />
            <Link
              href="/vacantes"
              className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold cursor-pointer transition-colors duration-150 no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark"
            >
              Buscar →
            </Link>
          </div>

          {/* Trust */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/56?img=${i}`}
                  alt=""
                  className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover -ml-2 first:ml-0 bg-blue-soft"
                />
              ))}
            </div>
            <span className="text-[12.5px] text-white/65">
              <strong>+687</strong> candidatos colocados este año
            </span>
          </div>
        </motion.div>

        {/* RIGHT - Single image + animated cards */}
        <div className="relative mt-4 md:mt-0">
          <div className="relative w-full max-w-[440px] h-[440px] sm:h-[480px] md:h-[520px] mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                {/* Single photo */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl border-[3px] border-white/[.12]"
                >
                  <Image
                    src={slide.image}
                    alt={slide.chip.label}
                    fill
                    className="object-cover"
                    sizes="440px"
                    priority
                  />
                </motion.div>

                {/* Chip pill floating top-left on image */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="absolute top-4 left-4 z-[5]"
                >
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-lg ${chipColors[slide.chip.color]}`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {slide.chip.label}
                  </span>
                </motion.div>

                {/* Animated stat cards - stacked bottom-left overlapping image */}
                <div className="absolute -bottom-4 left-1 sm:-left-2 md:-left-4 z-[4] flex flex-col gap-2.5 w-[calc(100%-0.5rem)] sm:w-auto sm:max-w-[280px]">
                  {slide.cards.map((card, i) => (
                    <AnimatedCard key={`${slide.id}-${i}`} card={card} delay={0.3 + i * 0.15} />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
