"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import PageHero from "@/components/ui/PageHero";

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

      {/* About + Stats */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center max-w-[820px] mx-auto mb-14">
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black tracking-tight text-navy mb-5">
              Sobre nosotros
            </h2>
            <p className="text-[14px] text-muted leading-relaxed">
              Somos especialistas en capital humano enfocados en microempresas
              mexicanas. Combinamos tecnologia, experiencia y un trato
              genuinamente humano para ofrecer resultados que duran. Cada
              proceso que manejamos — desde el reclutamiento hasta la
              capacitacion — esta diseñado para que tu empresa cuente con el
              talento correcto en el momento correcto, sin costos ocultos ni
              compromisos innecesarios.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s, i) => (
              <motion.div
                key={s.l}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <div className="text-[clamp(2.5rem,5vw,4rem)] font-black text-navy leading-none mb-3 tracking-tight">
                  {s.n}
                </div>
                <div className="text-[12px] text-muted font-medium">
                  {s.l}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Empower */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-7xl mx-auto">
          {/* Top row: title left, intro right */}
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-8 md:gap-12 mb-10 md:mb-14 items-start">
            <AnimatedSection>
              <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">¿Por que existimos?</p>
              <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black tracking-tight text-navy leading-[1.1]">
                Empoderamos a los dueños
                <br />
                de pequeñas empresas
              </h2>
            </AnimatedSection>
            <AnimatedSection delay={0.15}>
              <p className="text-[13.5px] text-muted leading-relaxed md:pt-2">
                Entendemos los retos de crecer con recursos limitados. Por eso
                ofrecemos soluciones de capital humano accesibles, agiles y con
                resultados medibles desde el primer dia.
              </p>
            </AnimatedSection>
          </div>

          {/* Bottom row: image left, numbered items right */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <AnimatedSection>
              <div className="rounded-3xl overflow-hidden relative">
                <Image src="/images/nosotros2.jpg" alt="Kyoszen impacto" width={700} height={500} className="w-full h-[360px] md:h-[440px] object-cover" />
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <p className="text-sm font-bold text-navy">&ldquo;Generando impacto, juntos&rdquo;</p>
                  <span className="text-xs text-muted">Equipo Kyoszen</span>
                </div>
              </div>
            </AnimatedSection>

            <div className="flex flex-col gap-5">
              {[
                { n: "01", title: "Procesos a la medida", desc: "Diseñamos estrategias de capital humano adaptadas al tamaño, cultura y etapa de tu empresa." },
                { n: "02", title: "Equipo experimentado", desc: "Mas de 3 años colocando talento verificado en microempresas de CDMX y Estado de Mexico." },
                { n: "03", title: "Enfoque humano", desc: "Cada candidato y cliente recibe trato genuinamente humano, con acompañamiento durante todo el proceso." },
              ].map((item, i) => (
                <motion.div
                  key={item.n}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-border"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-[#c4f74b] flex items-center justify-center text-navy font-black text-base shadow-sm">
                    {item.n}
                  </div>
                  <div className="flex-1 pt-1">
                    <h4 className="text-[15px] font-extrabold text-navy mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[12.5px] text-muted leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
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
            {[
              {
                tag: "Equipo",
                title: "Profesionales especializados en capital humano",
                image: "/images/nosotros1.jpg",
                highlight: false,
                href: "/servicios",
              },
              {
                tag: "Reconocimiento",
                title: "Mas de 687 colocaciones exitosas en mercado mexicano",
                image: "/images/nosotros3.jpg",
                highlight: true,
                href: "/nosotros",
              },
              {
                tag: "Reporte",
                title: "2024 Reporte de satisfaccion y retencion del talento",
                image: "/images/nosotros4.jpg",
                highlight: false,
                href: "/contacto",
              },
            ].map((card, i) => (
              <motion.div
                key={card.tag}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
              >
                <Link
                  href={card.href}
                  className={`group relative block rounded-3xl overflow-hidden h-[440px] no-underline transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                    card.highlight ? "bg-[#c4f74b]" : "bg-bg border border-border"
                  }`}
                >
                  {/* Arrow icon top-right */}
                  <span
                    className={`absolute top-5 right-5 z-[3] w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:-rotate-45 ${
                      card.highlight ? "bg-navy text-white" : "bg-white text-navy border border-border"
                    }`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </span>

                  {card.highlight ? (
                    // Highlighted card: large image on top (cutout), content at bottom
                    <>
                      <div className="absolute inset-x-0 top-0 h-[60%] overflow-hidden">
                        <Image
                          src={card.image}
                          alt={card.title}
                          width={500}
                          height={400}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-6 z-[2]">
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-[1.5px] text-navy/80 mb-2">
                          {card.tag}
                        </span>
                        <h4 className="text-[16px] font-extrabold text-navy leading-tight">
                          {card.title}
                        </h4>
                      </div>
                    </>
                  ) : (
                    // Regular cards: label + title at top, image at bottom
                    <>
                      <div className="p-6 pr-16">
                        <span className="inline-block text-[10px] font-extrabold uppercase tracking-[1.5px] text-muted mb-3 px-2.5 py-1 bg-white rounded-full border border-border">
                          {card.tag}
                        </span>
                        <h4 className="text-[16px] font-extrabold text-navy leading-tight">
                          {card.title}
                        </h4>
                      </div>
                      <div className="absolute inset-x-5 bottom-5 h-[200px] rounded-2xl overflow-hidden">
                        <Image
                          src={card.image}
                          alt={card.title}
                          width={500}
                          height={400}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tailored Strategies */}
      <section className="py-20 px-5 md:px-10 xl:px-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* LEFT - Text column */}
          <AnimatedSection>
            <span className="inline-block bg-bg text-navy text-[11px] font-extrabold uppercase tracking-[1.5px] px-3 py-1.5 rounded-full border border-border mb-5">
              Nuestros servicios
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black tracking-tight text-navy leading-[1.1] mb-5">
              Estrategias a la medida para el maximo crecimiento de tu negocio
            </h2>
            <p className="text-[13.5px] text-muted leading-relaxed mb-7">
              Diseñamos soluciones de capital humano adaptadas a la realidad de
              cada empresa mexicana. Sin plantillas genericas: entendemos tu
              contexto, tus metas y entregamos resultados medibles.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-7">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#c4f74b] flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
                  </svg>
                </div>
                <h4 className="text-[15px] font-extrabold text-navy mb-1.5">Reclutamiento dirigido</h4>
                <p className="text-[12px] text-muted leading-relaxed">
                  Identificamos y presentamos candidatos verificados alineados a tu cultura y necesidades.
                </p>
              </div>
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#c4f74b] flex items-center justify-center mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" />
                    <line x1="8" y1="21" x2="16" y2="21" />
                    <line x1="12" y1="17" x2="12" y2="21" />
                  </svg>
                </div>
                <h4 className="text-[15px] font-extrabold text-navy mb-1.5">Soluciones digitales</h4>
                <p className="text-[12px] text-muted leading-relaxed">
                  Procesos agiles con tecnologia, tableros de seguimiento y trato humano en cada etapa.
                </p>
              </div>
            </div>

            <p className="text-[13px] text-muted leading-relaxed">
              Mas de 3 años conectando talento con empresas mexicanas en
              crecimiento. Combinamos tecnologia, experiencia y un trato
              genuinamente humano.
            </p>
          </AnimatedSection>

          {/* RIGHT - Image with stats overlay */}
          <AnimatedSection delay={0.2}>
            <div className="relative rounded-3xl overflow-hidden h-[460px] md:h-[560px]">
              <Image
                src="/images/nosotros1.jpg"
                alt="Equipo Kyoszen trabajando"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 600px"
              />
              {/* Stats card - bottom right overlay */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="absolute bottom-5 right-5 left-5 sm:left-auto sm:max-w-[340px] bg-[#c4f74b] rounded-2xl p-5 shadow-xl"
              >
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[22px] md:text-[26px] font-black text-navy leading-none">687+</div>
                    <div className="text-[10px] font-bold text-navy/75 mt-1.5">Candidatos</div>
                  </div>
                  <div>
                    <div className="text-[22px] md:text-[26px] font-black text-navy leading-none">672+</div>
                    <div className="text-[10px] font-bold text-navy/75 mt-1.5">Empresas</div>
                  </div>
                  <div>
                    <div className="text-[22px] md:text-[26px] font-black text-navy leading-none">99%</div>
                    <div className="text-[10px] font-bold text-navy/75 mt-1.5">Satisfaccion</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </AnimatedSection>
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
