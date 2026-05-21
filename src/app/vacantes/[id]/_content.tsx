"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import AplicarModal from "@/components/ui/AplicarModal";

interface Vacante {
  id: number;
  titulo: string;
  empresa: string;
  categoria: string;
  ubicacion: string;
  contrato: string;
  jornada: string;
  salario: number;
  badge: string;
  badge_class: string;
  descripcion: string;
  tags: string[];
  responsabilidades: string[];
  requisitos: string[];
}

export default function VacanteContent({ id }: { id: string }) {
  const [job, setJob] = useState<Vacante | null | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    supabase.from("vacantes").select("*").eq("id", id).eq("activa", true).single()
      .then(({ data }) => setJob((data as Vacante) ?? null));
  }, [id]);

  if (job === undefined) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (job === null) {
    notFound();
  }

  return (
    <>
      {/* Back nav */}
      <section className="bg-navy pt-28 pb-8 px-5 md:px-10 xl:px-20">
        <div className="max-w-5xl mx-auto">
          <Link
            href="/vacantes"
            className="text-white/70 text-[13px] font-semibold hover:text-yellow transition-colors inline-flex items-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver a vacantes
          </Link>
        </div>
      </section>

      {/* Detail */}
      <section className="py-12 px-5 md:px-10 xl:px-20 bg-bg min-h-screen">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-8">
              {/* LEFT COLUMN */}
              <div>
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="bg-navy text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                    {job.categoria}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded ${job.badge_class}`}>
                    {job.badge}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-[clamp(1.8rem,3.5vw,2.6rem)] font-black text-navy leading-tight mb-2">
                  {job.titulo}
                </h1>
                <p className="text-blue text-[15px] font-bold uppercase tracking-wide mb-6">
                  {job.empresa}
                </p>

                {/* Info pills */}
                <div className="flex flex-wrap gap-3 mb-8">
                  <InfoPill
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>}
                    label={job.ubicacion}
                  />
                  <InfoPill
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>}
                    label={job.jornada}
                  />
                  <InfoPill
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>}
                    label={job.contrato}
                  />
                  <InfoPill
                    icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>}
                    label={`$${job.salario.toLocaleString()} / mes`}
                  />
                </div>

                {/* Description */}
                <div className="mb-8">
                  <h2 className="text-lg font-extrabold text-navy mb-3">Descripción del puesto</h2>
                  <p className="text-[14px] text-muted leading-relaxed">{job.descripcion}</p>
                </div>

                {/* Responsibilities */}
                <div className="mb-8">
                  <h2 className="text-lg font-extrabold text-navy mb-3">Responsabilidades</h2>
                  <ul className="space-y-2.5">
                    {job.responsabilidades.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-muted leading-relaxed">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1883FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Requirements */}
                <div className="mb-8">
                  <h2 className="text-lg font-extrabold text-navy mb-3">Requisitos</h2>
                  <ul className="space-y-2.5">
                    {job.requisitos.map((r, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-[14px] text-muted leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-navy shrink-0 mt-2" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {job.tags.map((tag) => (
                    <span key={tag} className="bg-blue-soft text-blue text-[11px] font-semibold px-3 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN — Sidebar */}
              <div>
                <div className="bg-white rounded-2xl border border-border p-6 shadow-sm sticky top-28">
                  {/* Salary highlight */}
                  <div className="text-center mb-6 pb-6 border-b border-border">
                    <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-1">Salario mensual</p>
                    <p className="text-[clamp(1.6rem,3vw,2rem)] font-black text-navy">
                      ${job.salario.toLocaleString()}
                    </p>
                    <p className="text-[12px] text-muted">MXN bruto</p>
                  </div>

                  {/* Quick info */}
                  <div className="space-y-3 mb-6 pb-6 border-b border-border">
                    <SidebarRow label="Empresa" value={job.empresa} />
                    <SidebarRow label="Ubicación" value={job.ubicacion} />
                    <SidebarRow label="Contrato" value={job.contrato} />
                    <SidebarRow label="Jornada" value={job.jornada} />
                    <SidebarRow label="Categoría" value={job.categoria} />
                  </div>

                  {/* CTA buttons */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="block w-full bg-navy text-white text-center rounded-full py-3.5 text-[14px] font-extrabold hover:bg-blue-dark transition-colors cursor-pointer"
                    >
                      Aplicar ahora
                    </button>
                    <a
                      href="https://wa.link/5zv0ba"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-wa text-white rounded-full py-3.5 text-[14px] font-extrabold no-underline hover:opacity-90 transition-opacity"
                    >
                      <WhatsAppIcon size={18} />
                      Consultar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <AplicarModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        vacante={`${job.titulo} — ${job.empresa}`}
      />
    </>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white border border-border rounded-full px-3.5 py-2 text-[12.5px] font-semibold text-navy">
      {icon}
      {label}
    </span>
  );
}

function SidebarRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="text-[12.5px] font-bold text-navy">{value}</span>
    </div>
  );
}
