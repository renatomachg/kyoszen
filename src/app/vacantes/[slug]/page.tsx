"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter, notFound } from "next/navigation";
import { motion } from "framer-motion";
import { JOBS, getJobBySlug, Job } from "@/lib/jobs";

export default function VacancyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const job = getJobBySlug(slug);
  const [saved, setSaved] = useState(false);

  if (!job) {
    notFound();
  }

  return (
    <>
      {/* Hero minimal */}
      <section className="bg-navy pt-28 pb-8 px-5 md:px-10 xl:px-20">
        <div className="max-w-6xl mx-auto">
          <Link href="/vacantes" className="text-white/70 text-[13px] font-semibold hover:text-yellow transition-colors inline-flex items-center gap-1.5 mb-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Volver a vacantes
          </Link>
        </div>
      </section>

      {/* Detail */}
      <section className="py-12 px-5 md:px-10 xl:px-20 bg-bg min-h-screen">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {/* Top header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-navy leading-tight mb-1">
                  {job.titulo}
                </h1>
                <p className="text-[14px] text-muted mb-3">Kyoszen · Estrategia en Capital Humano</p>
                <div className="flex items-center gap-3 text-[13px] text-muted flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                    {job.ubicacion}
                  </span>
                  <span className="text-border">·</span>
                  <span className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {job.publicado}
                  </span>
                  <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${job.badgeClass}`}>{job.badge}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setSaved(!saved)}
                  className={`rounded-full py-3 px-6 text-[13px] font-bold cursor-pointer flex items-center gap-2 transition-colors border-2 ${
                    saved
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-navy border-border hover:border-blue-mid"
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
                  {saved ? "Guardado" : "Guardar"}
                </button>
                <Link
                  href="/contacto"
                  className="bg-green-500 text-white rounded-full py-3 px-7 text-[13px] font-bold no-underline flex items-center gap-2 hover:bg-green-600 transition-colors"
                  style={{ backgroundColor: "#22c55e" }}
                >
                  Aplicar →
                </Link>
              </div>
            </div>

            {/* Main grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
              {/* Left column - content */}
              <div className="bg-white rounded-2xl p-8 border border-border">
                <h2 className="text-lg font-extrabold text-navy mb-3">Descripcion del puesto</h2>
                <p className="text-[13.5px] text-muted leading-relaxed mb-8">{job.descripcion}</p>

                <h2 className="text-lg font-extrabold text-navy mb-3">Responsabilidades</h2>
                <ul className="space-y-2 mb-8">
                  {job.responsabilidades.map((r, i) => (
                    <li key={i} className="text-[13.5px] text-muted leading-relaxed flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue shrink-0 mt-2" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>

                <h2 className="text-lg font-extrabold text-navy mb-3">Requisitos</h2>
                <ul className="space-y-2 mb-8">
                  {job.requisitos.map((r, i) => (
                    <li key={i} className="text-[13.5px] text-muted leading-relaxed flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-blue-soft flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                      </div>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>

                <h2 className="text-lg font-extrabold text-navy mb-3">Habilidades</h2>
                <div className="flex flex-wrap gap-2 mb-8">
                  {job.habilidades.map((h) => (
                    <span key={h} className="bg-blue-soft text-blue rounded-full px-3 py-1 text-xs font-semibold">
                      {h}
                    </span>
                  ))}
                </div>

                <h2 className="text-lg font-extrabold text-navy mb-3">Beneficios</h2>
                <ul className="space-y-2">
                  {job.beneficios.map((b, i) => (
                    <li key={i} className="text-[13.5px] text-muted leading-relaxed flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-yellow-soft flex items-center justify-center shrink-0 mt-0.5">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                      </div>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column - sidebar */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-border space-y-4">
                  <InfoRow
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></svg>}
                    label="Area"
                    value={job.categoria}
                  />
                  <InfoRow
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>}
                    label="Tipo de contratacion"
                    value={job.contrato}
                  />
                  <InfoRow
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                    label="Jornada"
                    value={job.jornada}
                  />
                  <InfoRow
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                    label="Ubicacion"
                    value={job.ubicacion}
                  />
                  <InfoRow
                    icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>}
                    label="Contacto"
                    value={job.contactEmail}
                    copyable
                  />
                </div>

                {/* CTA card */}
                <div className="bg-navy rounded-2xl p-6 text-white">
                  <h3 className="text-base font-extrabold mb-2">¿Te interesa esta vacante?</h3>
                  <p className="text-xs text-white/70 mb-4 leading-relaxed">Aplica ahora y te contactaremos en 24 horas habiles.</p>
                  <Link href="/contacto" className="bg-yellow text-black rounded-full py-2.5 px-5 text-[13px] font-bold no-underline inline-flex items-center gap-1.5 hover:bg-[#e6b800] transition-colors">
                    Aplicar ahora →
                  </Link>
                </div>
              </div>
            </div>

            {/* Related jobs */}
            <div className="mt-16">
              <h2 className="text-xl font-extrabold text-navy mb-6">Otras vacantes similares</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {JOBS.filter((j) => j.slug !== job.slug && j.categoria === job.categoria)
                  .slice(0, 3)
                  .map((relatedJob) => (
                    <RelatedJobCard key={relatedJob.slug} job={relatedJob} />
                  ))}
                {JOBS.filter((j) => j.slug !== job.slug && j.categoria === job.categoria).length === 0 &&
                  JOBS.filter((j) => j.slug !== job.slug)
                    .slice(0, 3)
                    .map((relatedJob) => (
                      <RelatedJobCard key={relatedJob.slug} job={relatedJob} />
                    ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function InfoRow({ icon, label, value, copyable }: { icon: React.ReactNode; label: string; value: string; copyable?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-blue-soft flex items-center justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold text-navy">{label}</div>
        {copyable ? (
          <button onClick={copy} className="text-[12px] text-muted truncate hover:text-blue cursor-pointer flex items-center gap-1 max-w-full">
            <span className="truncate">{value}</span>
            {copied && <span className="text-green-600 text-[10px] font-bold shrink-0">Copiado</span>}
          </button>
        ) : (
          <div className="text-[12px] text-muted truncate">{value}</div>
        )}
      </div>
    </div>
  );
}

function RelatedJobCard({ job }: { job: Job }) {
  return (
    <Link
      href={`/vacantes/${job.slug}`}
      className="block bg-white rounded-xl border border-border p-5 no-underline text-navy transition-all hover:border-blue-mid hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10.5px] font-bold text-muted uppercase tracking-wide">{job.categoria}</span>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${job.badgeClass}`}>{job.badge}</span>
      </div>
      <h4 className="text-sm font-extrabold mb-1">{job.titulo}</h4>
      <p className="text-xs text-muted flex items-center gap-1">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M8 1.5C5.51 1.5 3.5 3.51 3.5 6c0 3.75 4.5 8.5 4.5 8.5s4.5-4.75 4.5-8.5c0-2.49-2.01-4.5-4.5-4.5Z" /><circle cx="8" cy="6" r="1.5" /></svg>
        {job.ubicacion} · {job.contrato}
      </p>
    </Link>
  );
}
