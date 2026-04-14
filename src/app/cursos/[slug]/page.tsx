"use client";

import { useState, use } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { COURSES, getCourseBySlug, Course, MODALITY_LABELS, MODALITY_BADGE } from "@/lib/courses";

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const course = getCourseBySlug(slug);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"descripcion" | "contenido" | "instructor">("descripcion");

  if (!course) {
    notFound();
  }

  const totalDuration = `${course.horas} h`;

  return (
    <>
      {/* Back nav */}
      <section className="bg-navy pt-28 pb-8 px-5 md:px-10 xl:px-20">
        <div className="max-w-6xl mx-auto">
          <Link href="/cursos" className="text-white/70 text-[13px] font-semibold hover:text-yellow transition-colors inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Volver a cursos
          </Link>
        </div>
      </section>

      {/* Detail */}
      <section className="py-12 px-5 md:px-10 xl:px-20 bg-bg min-h-screen">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
              {/* LEFT COLUMN */}
              <div>
                {/* Title block */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="bg-navy text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                    {course.categoriaLabel}
                  </span>
                  {course.badge && (
                    <span className="bg-yellow text-black text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      {course.badge}
                    </span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${MODALITY_BADGE[course.modalidad]}`}>
                    {MODALITY_LABELS[course.modalidad]}
                  </span>
                </div>
                <h1 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-navy leading-tight mb-3">
                  {course.titulo}
                </h1>

                {/* Stats row */}
                <div className="flex items-center gap-5 text-[13px] text-muted flex-wrap mb-6">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                    {course.modulos} modulos
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {course.lecciones} lecciones ({totalDuration})
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                    Nivel {course.nivel}
                  </span>
                </div>

                {/* Hero image/video placeholder */}
                <div
                  className="relative rounded-2xl overflow-hidden mb-6 aspect-video flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${course.color}, #ffffff)` }}
                >
                  <div
                    className="w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-black"
                    style={{ background: course.color, color: course.iconColor }}
                  >
                    {course.initials}
                  </div>
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button
                      onClick={() => setSaved(!saved)}
                      className={`rounded-full py-2 px-4 text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors border-2 ${
                        saved ? "bg-navy text-white border-navy" : "bg-white text-navy border-border hover:border-blue-mid"
                      }`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                      {saved ? "Guardado" : "Guardar"}
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto">
                  {([
                    ["descripcion", "Descripcion"],
                    ["contenido", "Contenido"],
                    ["instructor", "Instructor"],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`px-4 py-3 text-[13px] font-semibold cursor-pointer transition-colors border-b-2 whitespace-nowrap ${
                        activeTab === key ? "border-blue text-blue" : "border-transparent text-muted hover:text-navy"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                {activeTab === "descripcion" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-2xl p-8 border border-border"
                  >
                    <p className="text-[15px] font-bold text-navy leading-relaxed mb-5">
                      {course.descripcionCorta}
                    </p>
                    {course.descripcionLarga.map((p, i) => (
                      <p key={i} className="text-[13.5px] text-muted leading-relaxed mb-4">{p}</p>
                    ))}

                    <h3 className="text-lg font-extrabold text-navy mt-6 mb-3">¿Que aprenderas?</h3>
                    <ul className="space-y-2 mb-6">
                      {course.aprenderas.map((a, i) => (
                        <li key={i} className="text-[13.5px] text-muted leading-relaxed flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-blue-soft flex items-center justify-center shrink-0 mt-0.5">
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                          </div>
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="text-lg font-extrabold text-navy mt-6 mb-3">¿A quien va dirigido?</h3>
                    <ul className="space-y-2 mb-6">
                      {course.dirigido.map((d, i) => (
                        <li key={i} className="text-[13.5px] text-muted leading-relaxed flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0 mt-2" />
                          <span>{d}</span>
                        </li>
                      ))}
                    </ul>

                    <h3 className="text-lg font-extrabold text-navy mt-6 mb-3">Requisitos</h3>
                    <ul className="space-y-2">
                      {course.requisitos.map((r, i) => (
                        <li key={i} className="text-[13.5px] text-muted leading-relaxed flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-muted shrink-0 mt-2" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}

                {activeTab === "contenido" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-2xl p-8 border border-border"
                  >
                    <h3 className="text-lg font-extrabold text-navy mb-5">
                      Plan de estudio · {course.modulos} modulos · {totalDuration}
                    </h3>
                    <div className="space-y-3">
                      {course.contenido.map((m, i) => (
                        <div key={i} className="border border-border rounded-xl p-5 hover:border-blue-mid transition-colors">
                          <div className="flex items-center justify-between gap-3 mb-1">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-bold text-muted uppercase tracking-wider">
                                Modulo {String(i + 1).padStart(2, "0")}
                              </span>
                              <span className="text-xs font-semibold text-blue bg-blue-soft px-2 py-0.5 rounded">
                                {m.duracion}
                              </span>
                            </div>
                          </div>
                          <h4 className="text-[15px] font-extrabold text-navy mb-1">{m.titulo}</h4>
                          <p className="text-[13px] text-muted leading-relaxed">{m.descripcion}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === "instructor" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-2xl p-8 border border-border"
                  >
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
                        style={{ background: course.color, color: course.iconColor }}
                      >
                        KZ
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold text-navy">{course.instructor}</h3>
                        <p className="text-[13px] text-muted">Kyoszen · Estrategia en Capital Humano</p>
                      </div>
                    </div>
                    <p className="text-[13.5px] text-muted leading-relaxed">{course.instructorBio}</p>
                  </motion.div>
                )}
              </div>

              {/* RIGHT COLUMN - Sidebar */}
              <div className="space-y-4">
                {/* Main info card */}
                <div className="bg-white rounded-2xl p-6 border border-border space-y-3 sticky top-24">
                  <div className={`inline-block text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${MODALITY_BADGE[course.modalidad]}`}>
                    {MODALITY_LABELS[course.modalidad]}
                  </div>

                  <p className="text-xs text-muted">
                    {course.modulos} modulos · {course.lecciones} lecciones · {totalDuration}
                  </p>

                  <Link
                    href="/contacto"
                    className="bg-blue-btn text-white rounded-full py-3 px-5 text-[13px] font-bold no-underline flex items-center justify-center gap-2 hover:bg-blue-dark transition-colors w-full"
                  >
                    Inscribirme →
                  </Link>
                  <Link
                    href="/contacto"
                    className="bg-white text-navy border-2 border-border rounded-full py-3 px-5 text-[13px] font-bold no-underline flex items-center justify-center gap-2 hover:border-blue-mid transition-colors w-full"
                  >
                    Solicitar informacion
                  </Link>

                  <div className="pt-4 border-t border-border space-y-3">
                    <InfoRow
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>}
                      label={`${course.modulos} modulos`}
                    />
                    <InfoRow
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                      label={`${course.lecciones} lecciones (${totalDuration})`}
                    />
                    <InfoRow
                      icon={
                        course.modalidad === "en-vivo" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><circle cx="12" cy="12" r="8" /></svg>
                        ) : course.modalidad === "online" ? (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>
                        ) : (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a15 15 0 0 1 0 20" /><path d="M2 12h20" /></svg>
                        )
                      }
                      label={MODALITY_LABELS[course.modalidad]}
                    />
                    <InfoRow
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15 15 0 0 1 0 20" /></svg>}
                      label={`Idioma: ${course.idioma}`}
                    />
                    <InfoRow
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>}
                      label={`Nivel ${course.nivel}`}
                    />
                    <InfoRow
                      icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                      label="Constancia DC-3 incluida"
                    />
                  </div>

                  <div className="pt-4 border-t border-border">
                    <p className="text-xs font-bold text-navy mb-2">Incluye:</p>
                    <ul className="space-y-1.5">
                      {course.incluye.map((item, i) => (
                        <li key={i} className="text-[12px] text-muted flex items-start gap-2">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><polyline points="20 6 9 17 4 12" /></svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Related courses */}
            <div className="mt-16">
              <h2 className="text-xl font-extrabold text-navy mb-6">Otros cursos relacionados</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(() => {
                  const related = COURSES.filter((c) => c.slug !== course.slug && c.categoria === course.categoria).slice(0, 3);
                  const fill = related.length === 0 ? COURSES.filter((c) => c.slug !== course.slug).slice(0, 3) : related;
                  return fill.map((relatedCourse) => <RelatedCourseCard key={relatedCourse.slug} course={relatedCourse} />);
                })()}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-6 h-6 rounded-lg bg-blue-soft flex items-center justify-center shrink-0">{icon}</div>
      <span className="text-[12.5px] text-navy">{label}</span>
    </div>
  );
}

function RelatedCourseCard({ course }: { course: Course }) {
  return (
    <Link
      href={`/cursos/${course.slug}`}
      className="block bg-white rounded-xl border border-border overflow-hidden no-underline text-navy transition-all hover:border-blue-mid hover:shadow-md"
    >
      <div
        className="relative h-[120px] flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${course.color}, #ffffff)` }}
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-black"
          style={{ background: course.color, color: course.iconColor }}
        >
          {course.initials}
        </div>
        <span className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${MODALITY_BADGE[course.modalidad]}`}>
          {MODALITY_LABELS[course.modalidad]}
        </span>
      </div>
      <div className="p-4">
        <h4 className="text-sm font-extrabold mb-1">{course.titulo}</h4>
        <p className="text-xs text-muted flex items-center gap-2">
          <span>{course.modulos} modulos</span>
          <span className="w-1 h-1 rounded-full bg-border" />
          <span>{course.horas} h</span>
        </p>
      </div>
    </Link>
  );
}
