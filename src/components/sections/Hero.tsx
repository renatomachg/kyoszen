"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type CardColor = "blue" | "yellow" | "green" | "purple" | "orange";

interface Slide {
  id: string;
  pill: string;
  imgSmall: { src: string; alt: string };
  imgLarge: { src: string; alt: string };
  chip: string;
  cards: {
    value: string;
    label: string;
    color: CardColor;
    position: "top-right" | "bottom-left" | "right-middle";
    icon: React.ReactNode;
  }[];
}

const colorMap: Record<CardColor, { bg: string; stroke: string }> = {
  blue: { bg: "#EAE0FB", stroke: "#0033FF" },
  yellow: { bg: "#fff3b0", stroke: "#b45309" },
  green: { bg: "#bbf7d0", stroke: "#15803d" },
  purple: { bg: "#EAE0FB", stroke: "#9770FF" },
  orange: { bg: "#ffedd5", stroke: "#f97316" },
};

const slides: Slide[] = [
  {
    id: "vacantes",
    pill: "Vacantes abiertas",
    imgSmall: { src: "/images/Hero2.jpg", alt: "Trabajo operativo Kyoszen" },
    imgLarge: { src: "/images/Hero.jpg", alt: "Equipo profesional Kyoszen" },
    chip: "687+ candidatos colocados",
    cards: [
      {
        value: "672+",
        label: "Empresas",
        color: "yellow",
        position: "top-right",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="7" width="20" height="14" rx="2" />
            <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
          </svg>
        ),
      },
      {
        value: "687+",
        label: "Colocados",
        color: "blue",
        position: "bottom-left",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0033FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
          </svg>
        ),
      },
      {
        value: "24h",
        label: "Respuesta",
        color: "green",
        position: "right-middle",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "cursos",
    pill: "Cursos activos",
    imgSmall: { src: "/images/nosotros3.jpg", alt: "Capacitacion Kyoszen" },
    imgLarge: { src: "/images/nosotros1.jpg", alt: "Clases Kyoszen" },
    chip: "25+ cursos con constancia DC-3",
    cards: [
      {
        value: "25+",
        label: "Cursos",
        color: "purple",
        position: "top-right",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9770FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        ),
      },
      {
        value: "DC-3",
        label: "Constancia",
        color: "yellow",
        position: "bottom-left",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        ),
      },
      {
        value: "3",
        label: "Modalidades",
        color: "orange",
        position: "right-middle",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        ),
      },
    ],
  },
  {
    id: "candidatos",
    pill: "Candidatos verificados",
    imgSmall: { src: "/images/nosotros2.jpg", alt: "Candidato Kyoszen" },
    imgLarge: { src: "/images/nosotros4.jpg", alt: "Equipo Kyoszen" },
    chip: "99% de satisfaccion del cliente",
    cards: [
      {
        value: "99%",
        label: "Satisfaccion",
        color: "green",
        position: "top-right",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        ),
      },
      {
        value: "100%",
        label: "Verificados",
        color: "blue",
        position: "bottom-left",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0033FF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ),
      },
      {
        value: "10+",
        label: "Años exp.",
        color: "yellow",
        position: "right-middle",
        icon: (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ),
      },
    ],
  },
];

const positionClasses: Record<string, string> = {
  "top-right": "-top-2 -right-4",
  "bottom-left": "bottom-[15%] -left-6",
  "right-middle": "bottom-[40%] -right-6",
};

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
    <section className="bg-navy pt-32 pb-12 px-5 md:px-10 xl:px-20 overflow-hidden relative">
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

        {/* RIGHT - Animated carousel */}
        <div className="relative hidden md:block">
          <div className="relative w-full max-w-[440px] h-[500px] mx-auto">
            {/* Deco icon - static */}
            <div className="absolute top-0 right-[28%] z-[3] w-14 h-14 bg-white/[.12] backdrop-blur-[8px] rounded-2xl flex items-center justify-center border border-white/[.18]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0"
              >
                {/* Photo small - top left */}
                <motion.div
                  initial={{ opacity: 0, x: -30, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.96 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute w-[48%] h-[55%] top-[5%] left-0 z-[1] rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/[.12]"
                >
                  <Image src={slide.imgSmall.src} alt={slide.imgSmall.alt} fill className="object-cover" sizes="250px" />
                </motion.div>

                {/* Photo large - bottom right */}
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.96 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
                  className="absolute w-[58%] h-[68%] bottom-[10%] right-0 z-[2] rounded-2xl overflow-hidden shadow-2xl border-[3px] border-white/[.12]"
                >
                  <Image src={slide.imgLarge.src} alt={slide.imgLarge.alt} fill className="object-cover" sizes="300px" />

                  {/* Bottom chip over the image */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg whitespace-nowrap"
                  >
                    <span className="text-[11px] font-bold text-navy">
                      ✓ {slide.chip}
                    </span>
                  </motion.div>
                </motion.div>

                {/* Floating cards */}
                {slide.cards.map((card, i) => {
                  const colors = colorMap[card.color];
                  return (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, scale: 0.85, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: -5 }}
                      transition={{
                        delay: 0.25 + i * 0.12,
                        duration: 0.5,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className={`absolute bg-white rounded-xl py-3 px-4 shadow-lg border border-border z-[4] ${positionClasses[card.position]}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: colors.bg }}
                        >
                          {card.icon}
                        </div>
                        <div>
                          <div className="text-[17px] font-black text-navy leading-none">
                            {card.value}
                          </div>
                          <div className="text-[10px] text-muted mt-0.5">
                            {card.label}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* Category pill - fixed position, changes content */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 z-[5]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={slide.id + "-pill"}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.4 }}
                  className="inline-block bg-yellow text-black text-[10px] font-extrabold uppercase tracking-[1.5px] px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                >
                  {slide.pill}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Dots indicator */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-[5]">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIndex(i)}
                  aria-label={`Ir al slide ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === slideIndex ? "w-8 bg-yellow" : "w-1.5 bg-white/30 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
