"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const COURSES = [
  { id: 1, cat: "normatividad", title: "Auditoria Interna", initials: "AI", color: "#EAE0FB", icolor: "var(--color-blue)", badge: "Popular", horas: 16, desc: "Metodologia para realizar auditorias internas basadas en la normatividad actual." },
  { id: 2, cat: "liderazgo", title: "Asesoria para la Organizacion y Estructura de Negocios", initials: "AO", color: "#fff3b0", icolor: "#b45309", badge: "Nuevo", horas: 20, desc: "Desarrolla competencias para dirigir negocios que generen valor financiero, comercial y humano." },
  { id: 3, cat: "rrhh", title: "Asesoria y Capacitacion en Recursos Humanos", initials: "RH", color: "#EAE0FB", icolor: "var(--color-blue)", badge: "Popular", horas: 18, desc: "Reclutamiento, seleccion, psicometria, evaluacion del desempeño y capacitacion." },
  { id: 4, cat: "calidad", title: "Atencion de No Conformidades y Solvencia de Auditorias", initials: "NC", color: "#bbf7d0", icolor: "#15803d", badge: null, horas: 12, desc: "Metodologia para eliminar no conformidades, acciones correctivas y preventivas." },
  { id: 5, cat: "liderazgo", title: "Desarrollo de Habilidades para Jefes y Gerentes", initials: "HJ", color: "#ffedd5", icolor: "var(--color-orange)", badge: "Popular", horas: 16, desc: "Liderazgo situacional, coaching, comunicacion efectiva y manejo de equipos." },
  { id: 6, cat: "normatividad", title: "Proteccion Civil", initials: "PC", color: "#EAE0FB", icolor: "var(--color-blue)", badge: null, horas: 8, desc: "Fundamentos de proteccion civil para empresas. Planes de emergencia y prevencion." },
  { id: 7, cat: "calidad", title: "Manufactura Esbelta / Lean Manufacturing", initials: "LE", color: "#bbf7d0", icolor: "#15803d", badge: "Nuevo", horas: 20, desc: "Herramientas Lean para eliminar desperdicios y optimizar procesos productivos." },
  { id: 8, cat: "rrhh", title: "Relaciones Laborales", initials: "RL", color: "#EAE0FB", icolor: "var(--color-blue)", badge: "Popular", horas: 14, desc: "Ley Federal del Trabajo, contratacion, IMSS, INFONAVIT y manejo de conflictos." },
  { id: 9, cat: "digital", title: "Ciberseguridad para PYMEs", initials: "CS", color: "#bbf7d0", icolor: "#15803d", badge: "Nuevo", horas: 8, desc: "Proteccion de datos, phishing y buenas practicas digitales para empresas." },
  { id: 10, cat: "liderazgo", title: "Emprendimiento e Innovacion", initials: "EI", color: "#EAE0FB", icolor: "var(--color-blue)", badge: "Nuevo", horas: 16, desc: "Design thinking y modelos de negocio para emprendedores y empresas en crecimiento." },
  { id: 11, cat: "digital", title: "Analitica de Datos e Inteligencia Artificial", initials: "IA", color: "#fff3b0", icolor: "#b45309", badge: "Nuevo", horas: 20, desc: "Fundamentos de analitica de datos y estrategia de IA para la toma de decisiones." },
  { id: 12, cat: "calidad", title: "ISO 9001 — Sistema de Gestion de Calidad", initials: "IS", color: "#EAE0FB", icolor: "var(--color-blue)", badge: "Popular", horas: 16, desc: "Implementacion y certificacion del SGC bajo la norma ISO 9001:2015." },
  { id: 13, cat: "ventas", title: "El Poder de Saber Servir al Cliente", initials: "SC", color: "#ffedd5", icolor: "var(--color-orange)", badge: "Popular", horas: 8, desc: "Excelencia en atencion al cliente, manejo de quejas y fidelizacion." },
  { id: 14, cat: "ventas", title: "Tecnicas de Ventas y Negociacion", initials: "TV", color: "#ffedd5", icolor: "var(--color-orange)", badge: "Popular", horas: 12, desc: "Estrategias de venta consultiva, prospeccion, cierre y negociacion." },
  { id: 15, cat: "rrhh", title: "Evaluacion de Desempeño 360 Grados", initials: "ED", color: "#fff3b0", icolor: "#b45309", badge: "Popular", horas: 10, desc: "Metodologia completa de evaluacion 360°. Diseño de instrumentos y planes de desarrollo." },
];

const tabs = ["Todos", "RRHH", "Liderazgo", "Calidad", "Digital", "Normatividad", "Ventas"];
const tabMap: Record<string, string> = { "RRHH": "rrhh", "Liderazgo": "liderazgo", "Calidad": "calidad", "Digital": "digital", "Normatividad": "normatividad", "Ventas": "ventas" };

export default function CursosPage() {
  const [activeTab, setActiveTab] = useState("Todos");

  const filtered = useMemo(() => {
    if (activeTab === "Todos") return COURSES;
    return COURSES.filter((c) => c.cat === tabMap[activeTab]);
  }, [activeTab]);

  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-16 px-5 md:px-10 xl:px-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-[600px] mx-auto text-center">
          <span className="inline-block bg-white/10 text-white text-xs font-bold py-1.5 px-4 rounded-full border border-white/20 mb-4">Capacitacion</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black leading-[1.1] text-white mb-4">Nuestros cursos profesionales</h1>
          <p className="text-sm text-white/60 leading-relaxed">Ofrecemos una amplia variedad de cursos para todos los niveles. +25 programas con constancias DC-3.</p>
        </motion.div>
      </section>

      {/* Courses */}
      <section className="py-16 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-8">
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Capacitacion profesional</p>
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-blue-dark">Elige entre nuestros mejores cursos</h2>
          </AnimatedSection>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap justify-center mb-8">
            {tabs.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-full text-[13px] font-semibold border transition-all cursor-pointer ${activeTab === tab ? "bg-blue text-white border-blue" : "bg-white text-muted border-border hover:border-blue-mid"}`}>
                {tab}
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((course, i) => (
              <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                <Link href="/contacto" className="block bg-white rounded-xl border border-border overflow-hidden no-underline text-navy transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group h-full">
                  <div className="relative h-[180px] bg-gradient-to-br from-bg to-white flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black" style={{ background: course.color, color: course.icolor }}>{course.initials}</div>
                    {course.badge && (
                      <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${course.badge === "Popular" ? "bg-blue-soft text-blue" : "bg-green-soft text-[#15803d]"}`}>{course.badge}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] text-muted">{course.horas}h · Kyoszen</span>
                    </div>
                    <h4 className="text-sm font-extrabold leading-tight mb-2">{course.title}</h4>
                    <p className="text-xs text-muted leading-relaxed">{course.desc}</p>
                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
                      <span className="text-xs text-muted flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        {course.horas}h
                      </span>
                      <span className="text-xs font-bold text-blue">Consultar</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <AnimatedSection className="mt-16">
            <div className="bg-blue rounded-3xl p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <h2 className="text-[clamp(1.3rem,2.5vw,1.8rem)] font-black text-white leading-tight">¿No encuentras el curso que <em>necesitas</em>?</h2>
                <p className="text-sm text-white/60 mt-2">Cuentanos que habilidades quieres desarrollar y diseñamos un programa a la medida.</p>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                <Link href="/contacto" className="bg-yellow text-black rounded-full py-3 px-7 text-[13.5px] font-extrabold no-underline hover:bg-[#e6b800] transition-colors">Solicitar programa →</Link>
                <Link href="/contacto" className="bg-transparent text-white border-2 border-white/30 rounded-full py-3 px-7 text-[13px] font-bold no-underline hover:bg-white/10 transition-colors">Hablar con asesor</Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
