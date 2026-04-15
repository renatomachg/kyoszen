"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { COURSES, MODALITY_LABELS, MODALITY_BADGE } from "@/lib/courses";

export default function Courses() {
  const featured = COURSES.slice(0, 4);

  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-blue relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 items-end mb-12">
            <div>
              <span className="inline-block bg-yellow text-black text-[11px] font-extrabold py-1.5 px-4 rounded-full uppercase tracking-wider mb-4">
                Capacitacion
              </span>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black leading-[1.1] tracking-tight text-white">
                Cursos que impulsan
                <br />
                tu crecimiento profesional
              </h2>
            </div>
            <div className="md:text-right md:pb-2">
              <p className="text-[13.5px] text-white/80 leading-relaxed mb-4 max-w-[420px] md:ml-auto">
                Programas diseñados para el mercado laboral mexicano. Todos
                con constancia DC-3 y en modalidades en vivo, online o
                hibridas.
              </p>
              <Link
                href="/cursos"
                className="bg-yellow text-black rounded-full py-2.5 px-6 text-[13px] font-extrabold no-underline inline-flex items-center gap-1.5 hover:bg-[#e6b800] transition-colors"
              >
                Ver todos →
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* Grid of cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {featured.map((course, i) => (
            <motion.div
              key={course.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={`/cursos/${course.slug}`}
                className="block bg-[#F8FAFC] rounded-2xl overflow-hidden no-underline text-navy transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl h-full flex flex-col group"
              >
                {/* Image area */}
                <div
                  className="relative h-[200px] flex items-center justify-center overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${course.color} 0%, #ffffff 100%)`,
                  }}
                >
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg transition-transform duration-300 group-hover:scale-110"
                    style={{ background: course.color, color: course.iconColor }}
                  >
                    {course.initials}
                  </div>
                  {/* Badges top */}
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${MODALITY_BADGE[course.modalidad]}`}>
                      {MODALITY_LABELS[course.modalidad]}
                    </span>
                  </div>
                  {course.badge && (
                    <span className="absolute top-3 right-3 bg-yellow text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                      {course.badge}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
                    {course.categoriaLabel}
                  </span>
                  <h3 className="text-[15px] font-extrabold leading-tight text-navy mb-2">
                    {course.titulo}
                  </h3>
                  <p className="text-[12px] text-muted leading-relaxed mb-4 line-clamp-2 flex-1">
                    {course.descripcionCorta}
                  </p>

                  {/* Bottom row */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-3 text-[11px] text-muted">
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        {course.horas}h
                      </span>
                      <span className="flex items-center gap-1">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                        {course.modulos}
                      </span>
                    </div>
                    <span className="text-[11.5px] font-extrabold text-blue flex items-center gap-1 transition-all group-hover:gap-1.5">
                      Ver curso →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
