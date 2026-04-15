"use client";

import Link from "next/link";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { motion } from "framer-motion";

const services = [
  {
    href: "/servicios",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
    ),
    bg: "bg-blue-soft",
    title: "Reclutamiento y Seleccion",
    desc: "Candidatos verificados y alineados a tu cultura organizacional.",
  },
  {
    href: "/cursos",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>
    ),
    bg: "bg-yellow-soft",
    title: "Capacitacion de Personal",
    desc: "+25 cursos en RRHH, Liderazgo, Calidad y Normatividad.",
  },
  {
    href: "/servicios",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
    ),
    bg: "bg-green-soft",
    title: "Induccion de Personal",
    desc: "Colaboradores integrados con procesos claros y efectivos.",
  },
  {
    href: "/servicios",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-purple)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
    ),
    bg: "bg-purple-soft",
    title: "Digitalizacion de RRHH",
    desc: "Gestion eficiente y moderna de tu area de capital humano.",
  },
];

export default function Services() {
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection className="text-center mb-10">
          <span className="inline-block bg-[#E3F2FF] text-blue-dark text-xs font-bold py-1.5 px-[18px] rounded-full tracking-wide">
            Nuestros servicios
          </span>
          <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark mt-4">
            Todo lo que necesitas en
            <br />
            capital humano
          </h2>
        </AnimatedSection>

        {/* 4 Service cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {services.map((svc, i) => (
            <motion.div
              key={svc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={svc.href}
                className="block bg-white rounded-2xl p-6 shadow-md no-underline text-navy transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${svc.bg}`}>
                  {svc.icon}
                </div>
                <h4 className="text-sm font-extrabold mb-1">{svc.title}</h4>
                <p className="text-[12.5px] text-muted leading-relaxed">{svc.desc}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

