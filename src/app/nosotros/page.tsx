"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import PageHero from "@/components/ui/PageHero";

const values = [
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, title: "Equipo profesional", desc: "Expertos en capital humano comprometidos con el exito de cada cliente y candidato." },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>, title: "Orientados a resultados", desc: "Cada accion esta enfocada en generar impacto real y medible para tu empresa." },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>, title: "Garantia de exito", desc: "Respaldamos nuestros procesos con 99% de satisfaccion y seguimiento post-colocacion." },
];

const stats = [
  { n: "687+", l: "Candidatos colocados", s: "y contando" },
  { n: "672+", l: "Empresas atendidas", s: "CDMX y Edomex" },
  { n: "99%", l: "Clientes satisfechos", s: "tasa de recomendacion" },
  { n: "3+", l: "Años de experiencia", s: "en el mercado laboral" },
];

export default function NosotrosPage() {
  return (
    <>
      {/* Hero */}
      <PageHero
        image="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1800&auto=format&fit=crop&q=80"
        title="Sobre nosotros"
        description="Somos una consultora especializada en capital humano para microempresas mexicanas. Conectamos talento con empresas que crecen, con rapidez, tecnologia y trato humano."
      />

      {/* Photo collage */}
      <section className="px-5 md:px-10 xl:px-20 py-10 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <motion.div key={n} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: n * 0.1, duration: 0.5 }} className="rounded-2xl overflow-hidden h-[220px] md:h-[280px]">
              <Image src={`/images/nosotros${n}.jpg`} alt="Equipo Kyoszen" width={400} height={300} className="w-full h-full object-cover" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <AnimatedSection>
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Nuestra mision</p>
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-navy">Nos aseguramos de que tu idea y crecimiento se entreguen correctamente</h2>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="text-[13.5px] text-muted leading-relaxed mb-5">Somos especialistas en capital humano enfocados en microempresas mexicanas. Combinamos tecnologia, experiencia y un trato genuinamente humano para ofrecer resultados que duran.</p>
            <p className="text-[13.5px] text-muted leading-relaxed">Cada proceso que manejamos — desde el reclutamiento hasta la capacitacion — esta diseñado para que tu empresa cuente con el talento correcto en el momento correcto, sin costos ocultos ni compromisos innecesarios.</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Empower */}
      <section className="py-16 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <AnimatedSection>
            <div className="rounded-3xl overflow-hidden relative">
              <Image src="/images/nosotros2.jpg" alt="Kyoszen impacto" width={700} height={500} className="w-full h-[400px] object-cover" />
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                <p className="text-sm font-bold text-navy">&ldquo;Generando impacto, juntos&rdquo;</p>
                <span className="text-xs text-muted">Equipo Kyoszen</span>
              </div>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={0.2}>
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">¿Por que existimos?</p>
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-navy mb-4">Empoderamos a los dueños de pequeñas empresas</h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-4">Entendemos los retos de crecer con recursos limitados. Por eso ofrecemos soluciones de capital humano accesibles, agiles y con resultados medibles desde el primer dia.</p>
            <div className="bg-white border-l-4 border-blue p-5 rounded-r-xl">
              <p className="text-[13px] text-navy leading-relaxed italic">&ldquo;Kyoszen cubrio nuestra vacante en menos de una semana con candidatos perfectamente alineados al perfil que necesitabamos. Un servicio que realmente entiende a las empresas mexicanas.&rdquo;</p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-navy py-16 px-5 md:px-10 xl:px-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {stats.map((s, i) => (
            <motion.div key={s.l} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }}>
              <div className="text-[clamp(2rem,4vw,3rem)] font-black text-yellow leading-none mb-1">{s.n}</div>
              <div className="text-sm font-bold text-white mb-0.5">{s.l}</div>
              <div className="text-xs text-white/50">{s.s}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center max-w-[520px] mx-auto mb-10">
            <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Nuestros valores</p>
            <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-blue-dark">Ayudamos a los negocios a crecer mas rapido y mas grandes</h2>
          </AnimatedSection>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {values.map((v, i) => (
              <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="bg-bg rounded-2xl p-6 border border-border text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200">
                <div className="w-12 h-12 rounded-xl bg-blue-soft flex items-center justify-center mx-auto mb-4">{v.icon}</div>
                <h4 className="text-base font-extrabold mb-2">{v.title}</h4>
                <p className="text-[12.5px] text-muted leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-bg py-16 px-5 md:px-10 xl:px-20">
        <AnimatedSection className="max-w-[600px] mx-auto text-center">
          <div className="text-2xl mb-2">✦</div>
          <h2 className="text-[clamp(1.4rem,2.5vw,2rem)] font-extrabold tracking-tight text-navy mb-4">Ayudamos a los negocios a crecer mas rapido y mas grandes</h2>
          <p className="text-[13.5px] text-muted leading-relaxed mb-6">Ya sea que busques empleo o necesites contratar, estamos aqui para acompañarte. Te respondemos en menos de 24 horas habiles.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/vacantes" className="bg-navy text-white rounded-full py-3 px-7 text-[13px] font-bold no-underline hover:bg-blue-dark transition-colors">Ver vacantes →</Link>
            <Link href="/contacto" className="bg-[#E3F2FF] text-blue-dark rounded-full py-3 px-7 text-[13px] font-bold no-underline hover:bg-[#cce5ff] transition-colors">Contratar personal</Link>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
