"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { COURSES, MODALITY_LABELS, MODALITY_BADGE } from "@/lib/courses";

export default function Courses() {
  const featured = COURSES.slice(0, 4);

  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-bg">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div>
              <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
                Capacitacion
              </p>
              <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark">
                ¿Por que elegir
                <br />
                nuestros cursos?
              </h2>
              <p className="text-[13.5px] text-muted leading-relaxed max-w-[480px] mt-3">
                Nuestro compromiso va mas alla del reclutamiento. Capacitamos a
                tu equipo con programas diseñados para el mercado laboral
                mexicano, en modalidades en vivo, online e hibridas.
              </p>
            </div>
            <Link href="/cursos" className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
              Ver todos →
            </Link>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
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
                className="block bg-white rounded-[20px] border border-border overflow-hidden shadow-md no-underline text-navy transition-all duration-200 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col"
              >
                <div
                  className="relative h-[140px] flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${course.color}, #ffffff)` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-base font-black"
                    style={{ background: course.color, color: course.iconColor }}
                  >
                    {course.initials}
                  </div>
                  <span className={`absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${MODALITY_BADGE[course.modalidad]}`}>
                    {MODALITY_LABELS[course.modalidad]}
                  </span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h4 className="text-[1rem] font-bold leading-tight mb-2">{course.titulo}</h4>
                  <p className="text-[12.5px] text-muted leading-relaxed flex-1">{course.descripcionCorta}</p>
                  <span className="inline-flex items-center gap-1 mt-4 bg-bg text-navy border-none rounded-[7px] py-[7px] px-[13px] text-xs font-semibold w-fit transition-colors">
                    Ver curso →
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
