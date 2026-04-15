"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { COURSES, MODALITY_LABELS, MODALITY_BADGE } from "@/lib/courses";

export default function Courses() {
  const [index, setIndex] = useState(0);
  const total = COURSES.length;

  const go = (dir: 1 | -1) => {
    setIndex((prev) => (prev + dir + total) % total);
  };

  const getCard = (offset: number) => {
    const i = (index + offset + total) % total;
    return { course: COURSES[i], position: offset };
  };

  const visibleCards = [getCard(-1), getCard(0), getCard(1)];

  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-blue-soft relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="text-center max-w-[720px] mx-auto mb-12">
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
              Capacitacion
            </p>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black leading-[1.1] tracking-tight text-navy mb-3">
              ¿Por que elegir nuestros cursos?
            </h2>
            <p className="text-[13.5px] text-muted leading-relaxed max-w-[520px] mx-auto">
              Nuestro compromiso va mas alla del reclutamiento. Capacitamos a tu
              equipo con programas diseñados para el mercado laboral mexicano,
              en modalidades en vivo, online e hibridas.
            </p>
          </div>
        </AnimatedSection>

        {/* Carousel */}
        <div className="relative">
          {/* Navigation buttons */}
          <button
            onClick={() => go(-1)}
            className="absolute left-0 md:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors cursor-pointer"
            aria-label="Anterior"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => go(1)}
            className="absolute right-0 md:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-xl flex items-center justify-center text-navy hover:bg-navy hover:text-white transition-colors cursor-pointer"
            aria-label="Siguiente"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          {/* Cards area */}
          <div className="flex justify-center items-center gap-4 md:gap-6 min-h-[520px] py-4 px-2 md:px-14">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleCards.map(({ course, position }) => {
                const isCenter = position === 0;
                return (
                  <motion.div
                    key={course.slug}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{
                      opacity: isCenter ? 1 : 0.45,
                      scale: isCenter ? 1 : 0.85,
                    }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className={`${isCenter ? "w-full max-w-[440px] z-10" : "hidden md:block w-[280px]"}`}
                  >
                    <Link
                      href={`/cursos/${course.slug}`}
                      className="block bg-blue rounded-[24px] p-7 md:p-8 text-white no-underline shadow-2xl h-full hover:shadow-[0_20px_60px_rgba(0,51,255,0.35)] transition-shadow"
                    >
                      {/* Badges */}
                      <div className="flex items-center gap-2 mb-4 flex-wrap">
                        <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${MODALITY_BADGE[course.modalidad]}`}>
                          {MODALITY_LABELS[course.modalidad]}
                        </span>
                        {course.badge && (
                          <span className="bg-yellow text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                            {course.badge}
                          </span>
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black mb-5 shrink-0"
                        style={{ background: course.color, color: course.iconColor }}
                      >
                        {course.initials}
                      </div>

                      {/* Category + hours */}
                      <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-[#E5E7EB]/80 uppercase tracking-wider">
                        <span>{course.categoriaLabel}</span>
                        <span className="w-1 h-1 rounded-full bg-[#E5E7EB]/40" />
                        <span>{course.horas}h · {course.modulos} mod</span>
                      </div>

                      {/* Title */}
                      <h3 className={`font-extrabold leading-tight mb-3 text-white ${isCenter ? "text-xl md:text-2xl" : "text-lg"}`}>
                        {course.titulo}
                      </h3>

                      {/* Description - pearl gray */}
                      <p className="text-[13.5px] text-[#E5E7EB] leading-relaxed mb-5">
                        {course.descripcionCorta}
                      </p>

                      {/* Stats row */}
                      <div className="flex items-center gap-4 pb-5 border-b border-white/15 mb-5 text-[11.5px] text-[#E5E7EB]/80">
                        <span className="flex items-center gap-1.5">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                          {course.horas} h
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                          Nivel {course.nivel}
                        </span>
                      </div>

                      {/* CTA */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11.5px] text-[#E5E7EB]/70">
                          Constancia DC-3
                        </span>
                        <span className="bg-yellow text-black rounded-full py-2 px-5 text-[12px] font-extrabold inline-flex items-center gap-1.5 hover:bg-[#e6b800] transition-colors">
                          Ver curso →
                        </span>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Dots indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {COURSES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === index ? "bg-navy w-8" : "bg-navy/25 w-2 hover:bg-navy/50"
                }`}
                aria-label={`Ir al curso ${i + 1}`}
              />
            ))}
          </div>

          {/* Counter + link */}
          <div className="flex justify-between items-center mt-6 max-w-[440px] mx-auto text-[12px] text-muted font-semibold">
            <span>
              <strong className="text-navy">{String(index + 1).padStart(2, "0")}</strong> / {String(total).padStart(2, "0")}
            </span>
            <Link href="/cursos" className="text-blue hover:underline font-bold">
              Ver todos los cursos →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
