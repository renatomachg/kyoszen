"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type ChipColor = "green" | "yellow" | "blue";

interface Slide {
  id: string;
  image: string;
  chip: { label: string; color: ChipColor };
  graphic: "bars" | "ring" | "donut";
}

const slides: Slide[] = [
  { id: "vacantes", image: "/images/Hero.jpg", chip: { label: "Vacantes abiertas", color: "green" }, graphic: "bars" },
  { id: "cursos", image: "/images/nosotros1.jpg", chip: { label: "Cursos activos", color: "yellow" }, graphic: "ring" },
  { id: "candidatos", image: "/images/nosotros2.jpg", chip: { label: "Candidatos verificados", color: "blue" }, graphic: "donut" },
];

const chipColors: Record<ChipColor, string> = {
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

/* ------------- GRAPHIC 1: Horizontal progress bars (Vacantes) ------------- */
function BarsGraphic() {
  const rows = [
    { label: "Candidatos colocados", value: 687, target: 800, bg: "#F97316" },
    { label: "Empresas atendidas", value: 672, target: 800, bg: "#9770FF" },
  ];
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r, i) => {
        const pct = Math.min(100, Math.round((r.value / r.target) * 100));
        return (
          <motion.div
            key={r.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.25 + i * 0.12, duration: 0.5 }}
            className="rounded-2xl px-3.5 py-2.5 shadow-xl w-[210px] sm:w-[230px]"
            style={{ background: r.bg, color: "#fff" }}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-[11px] font-bold leading-tight text-white/85">{r.label}</div>
              <div className="text-[22px] font-black leading-none shrink-0">
                <CountUp to={r.value} />
              </div>
            </div>
            <div className="mt-2 h-[5px] w-full rounded-full overflow-hidden bg-white/25">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ delay: 0.45 + i * 0.12, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-white/90 rounded-full"
              />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/* ------------- GRAPHIC 2: Ring progress + checklist (Cursos) ------------- */
function RingGraphic() {
  const pct = 98;
  const size = 56;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - pct / 100);

  const items = ["Liderazgo", "Auditoria Interna", "SGC ISO 9001", "Desarrollo humano"];

  return (
    <div className="flex flex-col gap-2">
      {/* Ring card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="rounded-2xl px-3.5 py-2.5 shadow-xl w-[210px] sm:w-[230px] bg-[#0033FF] text-white"
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="rgba(255,255,255,0.25)" strokeWidth={stroke} fill="none" />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#fff"
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: offset }}
                transition={{ delay: 0.45, duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[13px] font-black">
              <CountUp to={pct} />%
            </div>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white/85 leading-tight">Satisfaccion alumnos</div>
            <div className="text-[18px] font-black leading-tight mt-0.5">25 cursos</div>
          </div>
        </div>
      </motion.div>

      {/* Checklist card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-2xl px-3.5 py-2.5 shadow-xl w-[210px] sm:w-[230px] bg-white text-navy"
      >
        <div className="text-[10px] font-extrabold uppercase tracking-wider text-muted mb-1.5">Categorias</div>
        <ul className="flex flex-col gap-1">
          {items.map((it, i) => (
            <motion.li
              key={it}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.12, duration: 0.35 }}
              className="flex items-center gap-1.5 text-[11px] font-semibold"
            >
              <span className="w-3.5 h-3.5 rounded-full bg-[#15803D] flex items-center justify-center shrink-0">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              {it}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

/* ------------- GRAPHIC 3: Donut + mini bar chart (Candidatos) ------------- */
function DonutGraphic() {
  const segments = [
    { label: "Colocados", value: 62, color: "#F97316" },
    { label: "En proceso", value: 26, color: "#9770FF" },
    { label: "Nuevos", value: 12, color: "#22C55E" },
  ];
  const size = 64;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let acc = 0;
  const arcs = segments.map((s) => {
    const len = (s.value / 100) * circumference;
    const rot = (acc / 100) * 360;
    acc += s.value;
    return { ...s, len, rot };
  });

  const monthBars = [45, 62, 58, 74, 81, 95];

  return (
    <div className="flex flex-col gap-2">
      {/* Donut card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="rounded-2xl px-3.5 py-2.5 shadow-xl w-[210px] sm:w-[230px] bg-white text-navy"
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
              {arcs.map((a, i) => (
                <motion.circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke={a.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${a.len} ${circumference}`}
                  strokeDashoffset={0}
                  initial={{ opacity: 0, pathLength: 0 }}
                  animate={{ opacity: 1, pathLength: 1 }}
                  transition={{ delay: 0.4 + i * 0.2, duration: 0.8, ease: "easeOut" }}
                  style={{ transform: `rotate(${a.rot - 90}deg)`, transformOrigin: "50% 50%" }}
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-[14px] font-black">
                <CountUp to={95} />%
              </span>
              <span className="text-[8px] font-bold text-muted mt-0.5">colocacion</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            {segments.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-[10px] font-semibold">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                <span className="text-navy/80">{s.label}</span>
                <span className="ml-auto font-black">{s.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Bar chart card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="rounded-2xl px-3.5 py-2.5 shadow-xl w-[210px] sm:w-[230px] bg-[#9770FF] text-white"
      >
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-bold text-white/85 leading-tight">Retencion 6 meses</div>
          <div className="text-[18px] font-black leading-none">
            <CountUp to={92} />%
          </div>
        </div>
        <div className="mt-2 flex items-end gap-1.5 h-[34px]">
          {monthBars.map((h, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${h}%` }}
              transition={{ delay: 0.55 + i * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 bg-white/90 rounded-sm"
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

function SlideGraphic({ kind }: { kind: Slide["graphic"] }) {
  if (kind === "bars") return <BarsGraphic />;
  if (kind === "ring") return <RingGraphic />;
  return <DonutGraphic />;
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

                {/* Graphics - stacked bottom-left overlapping image */}
                <div className="absolute -bottom-4 left-1 sm:-left-2 md:-left-4 z-[4]">
                  <SlideGraphic kind={slide.graphic} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
