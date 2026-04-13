"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const features = [
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, title: "Reclutamiento y Seleccion", desc: "Identificamos, evaluamos y presentamos candidatos verificados alineados a tu cultura y perfil en tiempo record.", link: "/vacantes", linkText: "Ver vacantes →" },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#b45309" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>, title: "Capacitacion y Cursos", desc: "Programas de formacion en RRHH, liderazgo, calidad y normatividad diseñados para el mercado laboral mexicano.", link: "/cursos", linkText: "Ver cursos →" },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, title: "Induccion y Onboarding", desc: "Diseñamos procesos de integracion efectivos para que tus nuevos colaboradores sean productivos desde el primer dia.", link: "/contacto", linkText: "Saber mas →" },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-purple)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>, title: "Digitalizacion de RRHH", desc: "Implementamos herramientas digitales para modernizar y automatizar los procesos de tu area de capital humano.", link: "/contacto", linkText: "Saber mas →" },
];

const specialties = [
  { title: "Administrativo", desc: "Asistentes, coordinadores y gerentes de area", count: "45+ perfiles" },
  { title: "Ventas", desc: "Ejecutivos, representantes y directores comerciales", count: "38+ perfiles" },
  { title: "Operaciones", desc: "Almacen, logistica, produccion y calidad", count: "52+ perfiles" },
  { title: "RRHH", desc: "Especialistas y directores de capital humano", count: "29+ perfiles" },
];

const splitSections = [
  {
    label: "Reclutamiento",
    title: "Recopilamos reseñas de tus mejores candidatos",
    desc: "Nuestro proceso de seleccion incluye verificacion de documentos, evaluacion de competencias y presentacion de candidatos alineados a tu cultura empresarial.",
    bullets: ["Candidatos con documentacion completa y verificada", "Presentacion en menos de 72 horas habiles", "Garantia de reposicion si el candidato no funciona"],
    cta: { text: "Solicitar reclutamiento →", href: "/contacto" },
    img: "https://picsum.photos/seed/svc-rec/700/500",
    reverse: false,
  },
  {
    label: "Capacitacion",
    title: "Contrata a nuestros mejores instructores calificados",
    desc: "Programas diseñados para el contexto laboral mexicano, con instructores especializados en RRHH, liderazgo, calidad y normatividad.",
    bullets: ["Cursos presenciales, en linea o hibridos", "Constancias con validez oficial (DC-3)", "Programas a medida para tu empresa"],
    cta: { text: "Ver cursos →", href: "/cursos" },
    img: "https://picsum.photos/seed/svc-cap/700/500",
    reverse: true,
  },
];

const reviews = [
  { text: "Kyoszen cubrio nuestra vacante de gerente en menos de una semana. Los candidatos venian perfectamente filtrados y documentados. Excelente servicio.", name: "Maria Rodriguez", role: "Directora de RRHH · LogiMex", initials: "MR" },
  { text: "El curso de Liderazgo que tomamos con Kyoszen transformo la dinamica de nuestro equipo. Muy recomendado para empresas en crecimiento.", name: "Jorge Luna", role: "Gerente General · Retail Plus", initials: "JL" },
  { text: "Gracias a Kyoszen encontre un trabajo en menos de 10 dias. El proceso fue transparente y siempre estuvieron en contacto conmigo. ¡Los recomiendo!", name: "Andrea Garcia", role: "Ejecutiva de Ventas · Candidata", initials: "AG" },
];

export default function ServiciosPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy pt-32 pb-16 px-[5%] text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-[600px] mx-auto">
          <span className="inline-block bg-white/10 text-white text-xs font-bold py-1.5 px-4 rounded-full border border-white/20 mb-4">Servicios</span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-black leading-[1.1] text-white mb-4">Nuestros increibles servicios para tu empresa</h1>
          <p className="text-sm text-white/60 leading-relaxed">Cada servicio esta diseñado para resolver los retos reales de las microempresas mexicanas. Sin burocracia, sin costos ocultos.</p>
        </motion.div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-[5%] bg-white">
        <div className="max-w-[1200px] mx-auto">
          <AnimatedSection className="text-center mb-8">
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Lo que hacemos</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="bg-bg rounded-2xl p-6 border border-border transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-soft flex items-center justify-center mb-4">{f.icon}</div>
                <h4 className="text-sm font-extrabold mb-2">{f.title}</h4>
                <p className="text-[12.5px] text-muted leading-relaxed mb-3">{f.desc}</p>
                <Link href={f.link} className="text-xs font-bold text-blue no-underline hover:underline">{f.linkText}</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Specialties */}
      <section className="py-20 px-[5%] bg-bg">
        <div className="max-w-[1200px] mx-auto text-center">
          <AnimatedSection>
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Explora nuestras areas</p>
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-blue-dark mb-3">Especialidades de reclutamiento</h2>
            <p className="text-[13.5px] text-muted max-w-[500px] mx-auto mb-10">Cubrimos todas las areas clave para empresas en CDMX y Estado de Mexico con candidatos listos para integrarse.</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {specialties.map((s, i) => (
              <motion.div key={s.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="bg-white rounded-2xl p-6 border border-border text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <h4 className="text-base font-extrabold mb-1">{s.title}</h4>
                <p className="text-xs text-muted mb-3">{s.desc}</p>
                <span className="text-xs font-bold text-blue bg-blue-soft rounded-full px-3 py-1">{s.count}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Split sections */}
      {splitSections.map((sec, idx) => (
        <section key={idx} className={`py-20 px-[5%] ${sec.reverse ? "bg-bg" : "bg-white"}`}>
          <div className={`max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${sec.reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
            <AnimatedSection>
              <div className="rounded-[20px] overflow-hidden relative">
                <img src={sec.img} alt={sec.title} className="w-full h-[400px] object-cover" />
              </div>
            </AnimatedSection>
            <AnimatedSection delay={0.2}>
              <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">{sec.label}</p>
              <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-navy mb-4">{sec.title}</h2>
              <p className="text-[13.5px] text-muted leading-relaxed mb-5">{sec.desc}</p>
              <div className="flex flex-col gap-3 mb-6">
                {sec.bullets.map((b) => (
                  <div key={b} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue flex items-center justify-center shrink-0">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    </div>
                    <span className="text-[13px] text-navy">{b}</span>
                  </div>
                ))}
              </div>
              <Link href={sec.cta.href} className="bg-blue-btn text-white rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center hover:bg-blue-dark transition-colors">{sec.cta.text}</Link>
            </AnimatedSection>
          </div>
        </section>
      ))}

      {/* Reviews */}
      <section className="py-20 px-[5%] bg-bg">
        <div className="max-w-[1200px] mx-auto text-center">
          <AnimatedSection className="mb-10">
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Testimonios</p>
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-blue-dark">Revisa los testimonios recientes</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.map((r, i) => (
              <motion.div key={r.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="bg-white rounded-xl p-6 border border-border text-left">
                <div className="text-yellow text-sm mb-3">★★★★★</div>
                <p className="text-[13px] text-[#444] leading-relaxed mb-4">&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-soft flex items-center justify-center text-xs font-bold text-blue">{r.initials}</div>
                  <div>
                    <div className="text-[13px] font-extrabold">{r.name}</div>
                    <div className="text-[11px] text-muted">{r.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue py-16 px-[5%] text-center">
        <AnimatedSection className="max-w-[600px] mx-auto">
          <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black text-white mb-3">Contrata a nuestros mejores <em>talentos</em></h2>
          <p className="text-sm text-white/60 leading-relaxed mb-6">Ya sea que necesites cubrir una vacante urgente o capacitar a tu equipo, estamos listos para ayudarte hoy mismo.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contacto" className="bg-yellow text-black rounded-full py-3 px-7 text-[13.5px] font-extrabold no-underline hover:bg-[#e6b800] transition-colors">Hablar con un asesor →</Link>
            <Link href="/vacantes" className="bg-transparent text-white border-2 border-white/30 rounded-full py-3 px-7 text-[13px] font-bold no-underline hover:bg-white/10 transition-colors">Ver vacantes</Link>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
