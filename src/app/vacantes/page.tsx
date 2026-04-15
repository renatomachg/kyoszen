"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import DropdownPill from "@/components/ui/DropdownPill";
import PageHero from "@/components/ui/PageHero";
import { JOBS } from "@/lib/jobs";

const UBICACIONES = ["Todas", "CDMX", "Estado de Mexico", "Hibrido", "Remoto"];
const MARCAS = ["Todas", "Grupo Corpora", "Logistica Norte", "Sigma Retail", "Clinica Vitalis", "Finanzas MX", "Contact Nova"];
const CONTRATOS = ["Todos", "Tiempo completo", "Medio tiempo", "Por proyecto"];
const JORNADAS = ["Todas", "Matutina", "Vespertina", "Mixta", "Flexible"];
const SALARIOS = ["Todos", "Menos de $10k", "$10k - $15k", "$15k - $20k", "Mas de $20k"];

function matchesSalario(salario: number, bucket: string): boolean {
  switch (bucket) {
    case "Menos de $10k":
      return salario < 10000;
    case "$10k - $15k":
      return salario >= 10000 && salario < 15000;
    case "$15k - $20k":
      return salario >= 15000 && salario < 20000;
    case "Mas de $20k":
      return salario >= 20000;
    default:
      return true;
  }
}

export default function VacantesPage() {
  const [search, setSearch] = useState("");
  const [ubicacion, setUbicacion] = useState("Todas");
  const [marca, setMarca] = useState("Todas");
  const [contrato, setContrato] = useState("Todos");
  const [jornada, setJornada] = useState("Todas");
  const [salario, setSalario] = useState("Todos");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return JOBS.filter((j) => {
      const matchesSearch =
        !q ||
        j.titulo.toLowerCase().includes(q) ||
        j.desc.toLowerCase().includes(q) ||
        j.empresa.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q));
      const matchesUbicacion = ubicacion === "Todas" || j.ubicacion === ubicacion;
      const matchesMarca = marca === "Todas" || j.empresa === marca;
      const matchesContrato = contrato === "Todos" || j.contrato === contrato;
      const matchesJornada = jornada === "Todas" || j.jornada === jornada;
      const matchesSalarioRange = matchesSalario(j.salario, salario);
      return matchesSearch && matchesUbicacion && matchesMarca && matchesContrato && matchesJornada && matchesSalarioRange;
    });
  }, [search, ubicacion, marca, contrato, jornada, salario]);

  const clearAll = () => {
    setSearch("");
    setUbicacion("Todas");
    setMarca("Todas");
    setContrato("Todos");
    setJornada("Todas");
    setSalario("Todos");
  };

  const anyActive =
    search.trim().length > 0 ||
    ubicacion !== "Todas" ||
    marca !== "Todas" ||
    contrato !== "Todos" ||
    jornada !== "Todas" ||
    salario !== "Todos";

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1800&auto=format&fit=crop&q=80"
        chip="Vacantes"
        title="Encuentra tu proximo empleo"
        description="Vacantes verificadas en CDMX y Estado de Mexico. Aplicar es rapido y confidencial."
      />

      {/* Filters + Results */}
      <section className="py-16 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-7xl mx-auto">
          {/* Keyword search */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2 bg-white rounded-full border border-border shadow-sm pl-5 pr-1 py-1 w-full max-w-[560px]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                placeholder="Palabra clave: puesto, empresa o habilidad"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-[13px] text-navy placeholder:text-muted py-2"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="text-muted hover:text-navy text-xs font-bold px-3 py-1.5 rounded-full cursor-pointer"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Breadcrumb-style filter pill */}
          <div className="flex justify-center mb-2">
            <div className="inline-flex items-center gap-1 bg-white rounded-full border border-border shadow-sm px-2 py-1.5 flex-wrap max-w-full">
              <span className="px-3 py-1.5 text-[13px] font-semibold text-muted">Vacantes</span>
              <span className="text-border">/</span>
              <DropdownPill label="Ubicacion" value={ubicacion} options={UBICACIONES} onChange={setUbicacion} highlight={ubicacion !== "Todas"} />
              <span className="text-border">/</span>
              <DropdownPill label="Marca" value={marca} options={MARCAS} onChange={setMarca} highlight={marca !== "Todas"} />
              <span className="text-border">/</span>
              <DropdownPill label="Contrato" value={contrato} options={CONTRATOS} onChange={setContrato} highlight={contrato !== "Todos"} />
              <span className="text-border">/</span>
              <DropdownPill label="Jornada" value={jornada} options={JORNADAS} onChange={setJornada} highlight={jornada !== "Todas"} />
              <span className="text-border">/</span>
              <DropdownPill label="Salario" value={salario} options={SALARIOS} onChange={setSalario} highlight={salario !== "Todos"} />
            </div>
          </div>

          <div className="flex items-center justify-between mb-6 mt-4">
            <p className="text-sm text-muted">
              <strong className="text-navy">{filtered.length}</strong> vacantes encontradas
            </p>
            {anyActive && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[12px] text-blue hover:text-blue-dark font-bold cursor-pointer"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {/* Jobs grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filtered.map((job, i) => (
                <motion.div key={job.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05, duration: 0.4 }}>
                  <div className="bg-white rounded-xl border-[1.5px] border-border p-5 transition-all duration-200 hover:border-blue-mid hover:shadow-lg hover:-translate-y-0.5 group h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10.5px] font-bold text-muted uppercase tracking-wide">{job.ubicacion}</span>
                      <span className={`rounded-md px-2.5 py-0.5 text-[11px] font-bold ${job.badgeClass}`}>{job.badge}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-navy mb-1">{job.titulo}</h3>
                    <p className="text-[11px] font-bold text-blue uppercase tracking-wide mb-2">{job.empresa}</p>
                    <p className="text-xs text-muted leading-relaxed mb-3 flex-1">{job.desc}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="bg-bg text-navy text-[10px] font-semibold px-2 py-0.5 rounded-md">{job.contrato}</span>
                      <span className="bg-bg text-navy text-[10px] font-semibold px-2 py-0.5 rounded-md">{job.jornada}</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
                      <span className="text-sm font-bold text-navy">${job.salario.toLocaleString()} / mes</span>
                      <Link href="/contacto" className="text-[11.5px] font-extrabold text-blue no-underline flex items-center gap-[3px] transition-all group-hover:gap-1.5">Aplicar →</Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-lg font-bold text-navy mb-2">Sin resultados</h3>
              <p className="text-sm text-muted">No encontramos vacantes con esos filtros. Intenta con otras combinaciones.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
