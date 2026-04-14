"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const vacancies = [
  {
    category: "Administrativo",
    badge: { text: "Nuevo", class: "bg-green-soft text-[#15803d]" },
    logoBg: "bg-blue-soft",
    title: "Auxiliar Administrativo",
    location: "CDMX",
    type: "Tiempo completo",
  },
  {
    category: "Operaciones",
    badge: { text: "Urgente", class: "bg-yellow-soft text-[#b45309]" },
    logoBg: "bg-yellow-soft",
    title: "Operador de Almacen",
    location: "Estado de Mexico",
    type: "Tiempo completo",
  },
  {
    category: "Ventas",
    badge: { text: "Disponible", class: "bg-blue-soft text-blue" },
    logoBg: "bg-yellow-soft",
    title: "Ejecutivo de Ventas",
    location: "CDMX",
    type: "Tiempo completo",
  },
  {
    category: "Atencion al cliente",
    badge: { text: "Disponible", class: "bg-blue-soft text-blue" },
    logoBg: "bg-purple-soft",
    title: "Recepcionista",
    location: "CDMX",
    type: "Medio tiempo",
  },
];

export default function Vacancies() {
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="flex justify-between items-end flex-wrap gap-4 mb-7">
            <div>
              <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
                Oportunidades laborales
              </p>
              <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark">
                Vacantes disponibles
                <br />
                para ti hoy
              </h2>
            </div>
            <Link href="/vacantes" className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
              Ver todas →
            </Link>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {vacancies.map((vac, i) => (
            <motion.div
              key={vac.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href="/vacantes"
                className="block bg-white rounded-xl border-[1.5px] border-border p-5 no-underline text-navy transition-all duration-200 hover:border-blue-mid hover:shadow-lg hover:-translate-y-0.5 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10.5px] font-bold text-muted uppercase tracking-wide">{vac.category}</span>
                  <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${vac.badge.class}`}>{vac.badge.text}</span>
                </div>
                <div className={`w-[38px] h-[38px] rounded-[9px] flex items-center justify-center text-lg mb-3 ${vac.logoBg}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
                </div>
                <div className="text-sm font-extrabold leading-tight text-navy">{vac.title}</div>
                <div className="text-xs text-muted mt-1 flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5s4.5-4.75 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5Z" stroke="currentColor" strokeWidth="1.4" /><circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1.4" /></svg>
                  {vac.location}
                  <span className="w-[3px] h-[3px] bg-border rounded-full inline-block" />
                  {vac.type}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-border mt-3">
                  <span className="text-[11px] text-muted font-semibold">Publicado hoy</span>
                  <span className="text-[11.5px] font-extrabold text-blue flex items-center gap-[3px] transition-all group-hover:gap-1.5">Aplicar →</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
