"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import PageHero from "@/components/ui/PageHero";

const features = [
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, title: "Reclutamiento y Seleccion", desc: "Identificamos, evaluamos y presentamos candidatos verificados alineados a tu cultura y perfil en tiempo record.", link: "/vacantes", linkText: "Ver vacantes →" },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#b45309" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>, title: "Capacitacion y Cursos", desc: "Programas de formacion en RRHH, liderazgo, calidad y normatividad diseñados para el mercado laboral mexicano.", link: "/cursos", linkText: "Ver cursos →" },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#15803d" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>, title: "Induccion y Onboarding", desc: "Diseñamos procesos de integracion efectivos para que tus nuevos colaboradores sean productivos desde el primer dia.", link: "/contacto", linkText: "Saber mas →" },
  { icon: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--color-purple)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>, title: "Digitalizacion de RRHH", desc: "Implementamos herramientas digitales para modernizar y automatizar los procesos de tu area de capital humano.", link: "/contacto", linkText: "Saber mas →" },
];

const splitSections = [
  {
    label: "Reclutamiento",
    title: "Recopilamos reseñas de tus mejores candidatos",
    desc: "Nuestro proceso de seleccion incluye verificacion de documentos, evaluacion de competencias y presentacion de candidatos alineados a tu cultura empresarial.",
    features: [
      { title: "Documentacion verificada", desc: "Revisamos cada perfil antes de presentarlo." },
      { title: "Entrega en 72 horas", desc: "Candidatos disponibles en tiempo record." },
      { title: "Garantia de reposicion", desc: "Si no funciona, lo reemplazamos." },
      { title: "Seguimiento activo", desc: "Acompañamos la integracion." },
    ],
    cta: { text: "Solicitar reclutamiento →", href: "/contacto" },
    phone: "55 2087 6765",
    img1: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=900&auto=format&fit=crop&q=80",
    img2: "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=700&auto=format&fit=crop&q=80",
    reverse: false,
  },
  {
    label: "Capacitacion",
    title: "Contrata a nuestros mejores instructores calificados",
    desc: "Programas diseñados para el contexto laboral mexicano, con instructores especializados en RRHH, liderazgo, calidad y normatividad.",
    features: [
      { title: "Modalidad flexible", desc: "Presencial, online o hibrido." },
      { title: "Constancia DC-3", desc: "Validez oficial STPS." },
      { title: "Programas a medida", desc: "Adaptados a tu empresa." },
      { title: "Instructores expertos", desc: "Con experiencia mexicana real." },
    ],
    cta: { text: "Ver cursos →", href: "/cursos" },
    phone: "55 2087 6765",
    img1: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&auto=format&fit=crop&q=80",
    img2: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=700&auto=format&fit=crop&q=80",
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
      <PageHero
        image="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1800&auto=format&fit=crop&q=80"
        chip="Servicios"
        title="Nuestros increibles servicios para tu empresa"
        description="Cada servicio esta diseñado para resolver los retos reales de las microempresas mexicanas. Sin burocracia, sin costos ocultos."
      />

      {/* Empowering intro */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* LEFT - Text */}
          <AnimatedSection>
            <span className="inline-block bg-blue-soft text-blue text-[11px] font-extrabold uppercase tracking-[1.5px] px-3 py-1.5 rounded-full mb-5">
              Servicios
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black tracking-tight text-navy leading-[1.1] mb-5">
              Empoderamos a tu empresa para alcanzar su{" "}
              <span className="text-blue">maximo potencial</span> y un
              crecimiento sostenido
            </h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-7">
              En Kyoszen combinamos tecnologia, experiencia y trato humano para
              entregar soluciones integrales de capital humano. Cada servicio
              esta diseñado para que tu empresa crezca con el talento adecuado,
              procesos claros y resultados medibles desde el primer dia.
            </p>

            <h4 className="text-[13px] font-extrabold text-navy mb-4 uppercase tracking-wider">
              Areas clave donde nos enfocamos
            </h4>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {[
                "Reclutamiento verificado",
                "Capacitacion DC-3",
                "Onboarding y retencion",
                "Manejo de clima laboral",
                "Digitalizacion de RRHH",
                "Cumplimiento normativo",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-[13px] text-navy">
                  <span className="w-5 h-5 rounded-full bg-yellow flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </AnimatedSection>

          {/* RIGHT - Image with floating card */}
          <AnimatedSection delay={0.2}>
            <div className="relative rounded-3xl overflow-hidden h-[440px] md:h-[540px]">
              <img
                src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&auto=format&fit=crop&q=80"
                alt="Equipo Kyoszen"
                className="w-full h-full object-cover"
              />
              {/* Floating guarantee card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="absolute bottom-5 left-5 right-5 sm:right-auto sm:max-w-[300px] bg-white rounded-2xl p-5 shadow-xl border border-border"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-10 h-10 rounded-full bg-yellow flex items-center justify-center shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </span>
                  <div>
                    <div className="text-[16px] font-black text-navy leading-none">Respuesta 24h</div>
                    <div className="text-[10.5px] font-bold text-muted mt-1">cada solicitud</div>
                  </div>
                </div>
                <p className="text-[12px] text-muted leading-relaxed">
                  Garantia de reposicion y acompañamiento durante todo el proceso.
                </p>
              </motion.div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-blue-btn">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-8">
            <p className="text-[11px] font-bold text-yellow uppercase tracking-[2px] mb-2 flex items-center gap-1.5 justify-center before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">Lo que hacemos</p>
          </AnimatedSection>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.5 }} className="bg-[#F8FAFC] rounded-2xl p-6 transition-all duration-200 hover:shadow-2xl hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-soft flex items-center justify-center mb-4">{f.icon}</div>
                <h4 className="text-sm font-extrabold mb-2 text-navy">{f.title}</h4>
                <p className="text-[12.5px] text-muted leading-relaxed mb-3">{f.desc}</p>
                <Link href={f.link} className="text-xs font-bold text-blue no-underline hover:underline">{f.linkText}</Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Split sections */}
      {splitSections.map((sec, idx) => (
        <section key={idx} className={`py-20 px-5 md:px-10 xl:px-20 ${sec.reverse ? "bg-bg" : "bg-white"}`}>
          <div className={`max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center ${sec.reverse ? "lg:[&>*:first-child]:order-2" : ""}`}>
            {/* Images - overlapping pair */}
            <AnimatedSection>
              <div className="relative h-[440px] md:h-[520px]">
                <div className="absolute top-0 left-0 w-[75%] h-[75%] rounded-3xl overflow-hidden shadow-xl">
                  <img src={sec.img1} alt={sec.title} className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-0 right-0 w-[55%] h-[55%] rounded-3xl overflow-hidden shadow-xl border-[5px] border-white">
                  <img src={sec.img2} alt={sec.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </AnimatedSection>

            {/* Text + features */}
            <AnimatedSection delay={0.2}>
              <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">{sec.label}</p>
              <h2 className="text-[clamp(1.6rem,3vw,2.3rem)] font-black tracking-tight text-navy leading-[1.12] mb-4">{sec.title}</h2>
              <p className="text-[13.5px] text-muted leading-relaxed mb-7">{sec.desc}</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 mb-8">
                {sec.features.map((f) => (
                  <div key={f.title} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-yellow flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    <div>
                      <h5 className="text-[14px] font-extrabold text-navy mb-0.5">{f.title}</h5>
                      <p className="text-[12px] text-muted leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-5 flex-wrap">
                <Link href={sec.cta.href} className="bg-blue-btn text-white rounded-full py-3 px-7 text-[13px] font-bold no-underline inline-flex items-center hover:bg-blue-dark transition-colors">
                  {sec.cta.text}
                </Link>
                <a href={`tel:${sec.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 text-[13px] font-bold text-navy no-underline hover:text-blue">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  +52 {sec.phone}
                </a>
              </div>
            </AnimatedSection>
          </div>
        </section>
      ))}

      {/* Commitment panel */}
      <section className="py-16 px-5 md:px-10 xl:px-20 bg-white">
        <AnimatedSection className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl">
            {/* LEFT - Bright blue panel */}
            <div className="bg-blue-btn p-8 md:p-12 flex flex-col justify-center">
              <span className="inline-block bg-white/15 text-white text-[10px] font-extrabold uppercase tracking-[1.5px] px-3 py-1.5 rounded-full border border-white/25 backdrop-blur-[4px] mb-5 w-fit">
                Sobre nosotros
              </span>
              <h3 className="text-[clamp(1.6rem,3vw,2.2rem)] font-black text-white leading-[1.1] mb-5">
                Comprometidos con
                <br />
                el crecimiento de tu empresa
              </h3>
              <p className="text-[13.5px] text-white/85 leading-relaxed mb-6">
                En Kyoszen combinamos tecnologia, experiencia real en el
                mercado mexicano y un trato genuinamente humano. Nos esforzamos
                por empoderar a las microempresas con capital humano verificado,
                accesible y listo para integrarse desde el primer dia.
              </p>
              <Link
                href="/nosotros"
                className="inline-flex items-center gap-2 text-[13px] font-extrabold text-white no-underline hover:gap-3 transition-all w-fit"
              >
                Saber mas
                <span className="w-8 h-8 rounded-full bg-yellow flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </Link>
            </div>

            {/* RIGHT - Image */}
            <div className="relative min-h-[280px] md:min-h-[380px]">
              <img
                src="https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?w=1200&auto=format&fit=crop&q=80"
                alt="Equipo Kyoszen comprometido"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Reviews */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-7xl mx-auto text-center">
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
      <section className="bg-blue py-16 px-5 md:px-10 xl:px-20 text-center">
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
