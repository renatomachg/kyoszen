"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const courses = [
  {
    bg: "bg-blue-soft",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    title: "Reclutamiento y Seleccion",
    desc: "Aprende a identificar, atraer y seleccionar al candidato ideal. Metodologias probadas para microempresas mexicanas.",
  },
  {
    bg: "bg-yellow-soft",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#b45309" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    title: "Liderazgo y Gestion de Equipos",
    desc: "Desarrolla habilidades para liderar, motivar y gestionar equipos de alto desempeño con resultados medibles.",
  },
  {
    bg: "bg-purple-soft",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--color-purple)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>,
    title: "Normas de Calidad ISO 9001",
    desc: "Implementa los estandares internacionales de calidad en tu organizacion y eleva la competitividad de tu empresa.",
  },
  {
    bg: "bg-green-soft",
    icon: <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>,
    title: "Digitalizacion de RRHH",
    desc: "Herramientas y procesos digitales para modernizar tu area de capital humano y mejorar la eficiencia operativa.",
  },
];

export default function Courses() {
  return (
    <section className="py-20 sec-pad bg-bg">
      <div className="sec-container">
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
                mexicano.
              </p>
            </div>
            <Link href="/cursos" className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
              Ver todos →
            </Link>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mt-10">
          {courses.map((course, i) => (
            <motion.div
              key={course.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href="/cursos"
                className="block bg-white rounded-3xl border border-border p-6 pt-7 shadow-md no-underline text-navy transition-all duration-200 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col"
              >
                <div className={`w-[46px] h-[46px] rounded-xl flex items-center justify-center mb-5 shrink-0 ${course.bg}`}>
                  {course.icon}
                </div>
                <h4 className="text-[1.05rem] font-bold leading-tight mb-2.5">{course.title}</h4>
                <p className="text-[12.5px] text-muted leading-relaxed flex-1">{course.desc}</p>
                <span className="inline-flex items-center gap-1 mt-5 bg-bg text-navy border-none rounded-[7px] py-[7px] px-[13px] text-xs font-semibold cursor-pointer transition-colors w-fit hover:bg-blue hover:text-white">
                  Ver curso →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
