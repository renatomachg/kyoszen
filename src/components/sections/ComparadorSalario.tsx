"use client";

import { useState, useRef, useEffect } from "react";
import { SALARIOS, buscarPuestos, getNivel, type PuestoSalario } from "@/lib/salarios";
import { logEvent } from "@/lib/analytics";
import AnimatedSection from "@/components/ui/AnimatedSection";

const WA_EMPRESA = "5215640045414";
const WA_CANDIDATO = "5215640045414";

function formatMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

const CATEGORIAS = [...new Set(SALARIOS.map(s => s.categoria))];

const NIVEL_CONFIG = {
  bajo:    { label: "Por debajo del mercado", color: "text-red-600",   bg: "bg-red-50",   border: "border-red-200",   dot: "bg-red-500",   emoji: "🔴" },
  mercado: { label: "En línea con el mercado", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500", emoji: "🟢" },
  alto:    { label: "Por encima del mercado",  color: "text-blue",      bg: "bg-blue/5",   border: "border-blue/20",   dot: "bg-blue",      emoji: "🔵" },
};

interface Props { standalone?: boolean }

export default function ComparadorSalario({ standalone = false }: Props) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PuestoSalario[]>([]);
  const [selected, setSelected] = useState<PuestoSalario | null>(null);
  const [salarioActual, setSalarioActual] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState("Todos");
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSuggestions(buscarPuestos(query));
    setSelected(null);
    setShowResult(false);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (puesto: PuestoSalario) => {
    setSelected(puesto);
    setQuery(puesto.puesto);
    setSuggestions([]);
  };

  const handleComparar = () => {
    if (!selected) return;
    setShowResult(true);
    logEvent("comparador_salario", JSON.stringify({
      puesto: selected.puesto,
      salario_actual: salarioActual ? Number(salarioActual.replace(/\D/g, "")) : null,
    }));
  };

  const salarioNum = salarioActual ? Number(salarioActual.replace(/\D/g, "")) : null;
  const nivel = selected && salarioNum ? getNivel(salarioNum, selected) : null;
  const nivelCfg = nivel ? NIVEL_CONFIG[nivel] : null;

  // Posición del salario actual en la barra (%)
  const getPct = (val: number) => {
    if (!selected) return 0;
    const range = selected.max - selected.min;
    return Math.min(100, Math.max(0, Math.round(((val - selected.min) / range) * 100)));
  };

  const puestosFiltrados = categoriaFiltro === "Todos"
    ? SALARIOS
    : SALARIOS.filter(s => s.categoria === categoriaFiltro);

  const waEmpresaMsg = selected
    ? encodeURIComponent(`Hola, revisé el comparador de Kyoszen para el puesto de ${selected.puesto} y me interesa saber cómo pueden ayudarme a contratar o capacitar a mi equipo con salarios competitivos.`)
    : "";
  const waCandidatoMsg = selected
    ? encodeURIComponent(`Hola, revisé el comparador de Kyoszen y me interesa aplicar a vacantes de ${selected.puesto}. ¿Tienen posiciones disponibles?`)
    : "";

  return (
    <section className={standalone ? "min-h-screen bg-bg py-16 px-5" : "py-20 px-5 md:px-10 xl:px-20 bg-white"}>
      <div className="max-w-5xl mx-auto">
        <AnimatedSection>
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-blue/10 text-blue text-[12px] font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              Datos del mercado laboral · CDMX 2025
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              ¿Tu salario es <em className="text-blue not-italic">competitivo</em>?
            </h2>
            <p className="text-[14px] text-muted max-w-xl mx-auto leading-relaxed">
              Compara cualquier puesto contra los rangos salariales reales del mercado laboral en CDMX y Área Metropolitana.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-8">
            {/* ── Panel izquierdo: búsqueda ── */}
            <div className="bg-bg rounded-3xl border border-border p-7 flex flex-col gap-5">
              <div>
                <label className="block text-[11px] font-black text-navy uppercase tracking-widest mb-2">
                  Busca el puesto
                </label>
                <div className="relative" ref={dropdownRef}>
                  <div className="relative">
                    <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input
                      ref={inputRef}
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      placeholder="Ej: Cajero, Almacenista, Reclutador..."
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl text-[13px] outline-none focus:border-blue transition-colors bg-white"
                    />
                  </div>
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-border rounded-xl shadow-lg mt-1 z-20 overflow-hidden">
                      {suggestions.map(s => (
                        <button key={s.puesto} onClick={() => handleSelect(s)}
                          className="w-full text-left px-4 py-3 hover:bg-bg transition-colors flex items-center justify-between border-b border-border last:border-0">
                          <span className="text-[13px] font-semibold text-navy">{s.puesto}</span>
                          <span className="text-[10px] text-muted bg-border/40 px-2 py-0.5 rounded-full">{s.categoria}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Salario actual (opcional) */}
              <div>
                <label className="block text-[11px] font-black text-navy uppercase tracking-widest mb-2">
                  Tu salario actual <span className="text-muted font-normal normal-case">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-[13px] font-bold">$</span>
                  <input
                    value={salarioActual}
                    onChange={e => setSalarioActual(e.target.value.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))}
                    placeholder="12,000"
                    className="w-full pl-8 pr-4 py-3 border border-border rounded-xl text-[13px] outline-none focus:border-blue transition-colors bg-white"
                  />
                </div>
                <p className="text-[11px] text-muted mt-1.5">Ingresa tu salario mensual neto para ver dónde estás en el mercado.</p>
              </div>

              <button
                onClick={handleComparar}
                disabled={!selected}
                className="w-full bg-navy hover:bg-blue disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-[14px] py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                Comparar con el mercado
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>

              {/* Categorías populares */}
              <div>
                <p className="text-[11px] text-muted font-bold uppercase tracking-widest mb-2">O explora por categoría</p>
                <div className="flex flex-wrap gap-1.5">
                  {["Todos", ...CATEGORIAS].map(cat => (
                    <button key={cat}
                      onClick={() => { setCategoriaFiltro(cat); setQuery(""); setSelected(null); setShowResult(false); }}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-colors ${
                        categoriaFiltro === cat
                          ? "bg-navy text-white border-navy"
                          : "bg-white text-muted border-border hover:border-navy hover:text-navy"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Panel derecho: resultado o tabla ── */}
            <div className="flex flex-col gap-5">
              {showResult && selected ? (
                <>
                  {/* Resultado */}
                  <div className="bg-bg rounded-3xl border border-border p-7">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <p className="text-[11px] text-muted font-bold uppercase tracking-widest mb-1">{selected.categoria}</p>
                        <h3 className="text-[20px] font-black text-navy">{selected.puesto}</h3>
                      </div>
                      <span className="text-[10px] text-muted bg-white border border-border px-2.5 py-1 rounded-full">
                        {selected.fuente}
                      </span>
                    </div>

                    {/* Barra de rango */}
                    <div className="mb-5">
                      <div className="flex justify-between text-[11px] text-muted mb-2">
                        <span>Mínimo<br/><strong className="text-navy text-[13px]">{formatMXN(selected.min)}</strong></span>
                        <span className="text-center">Mediana<br/><strong className="text-navy text-[13px]">{formatMXN(selected.mediana)}</strong></span>
                        <span className="text-right">Máximo<br/><strong className="text-navy text-[13px]">{formatMXN(selected.max)}</strong></span>
                      </div>
                      <div className="relative h-4 bg-white border border-border rounded-full overflow-hidden">
                        <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-yellow/60 via-blue/60 to-blue rounded-full" />
                        {/* Mediana marker */}
                        <div
                          className="absolute top-0 bottom-0 w-0.5 bg-navy/40"
                          style={{ left: `${getPct(selected.mediana)}%` }}
                        />
                        {/* Salario actual marker */}
                        {salarioNum && (
                          <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-navy rounded-full shadow-md transition-all duration-700"
                            style={{ left: `calc(${getPct(salarioNum)}% - 8px)` }}
                          />
                        )}
                      </div>
                      {salarioNum && (
                        <div className="flex justify-between text-[10px] text-muted mt-1">
                          <span></span>
                          <span style={{ marginLeft: `${getPct(salarioNum)}%`, transform: "translateX(-50%)" }} className="font-bold text-navy">
                            Tu salario
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Badge de nivel */}
                    {salarioNum && nivelCfg && (
                      <div className={`${nivelCfg.bg} ${nivelCfg.border} border rounded-2xl p-4 mb-5`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{nivelCfg.emoji}</span>
                          <span className={`font-black text-[14px] ${nivelCfg.color}`}>{nivelCfg.label}</span>
                        </div>
                        {nivel === "bajo" && (
                          <p className="text-[12px] text-muted">
                            La mediana del mercado es <strong className="text-navy">{formatMXN(selected.mediana)}</strong>.
                            Estás <strong className="text-red-600">{formatMXN(selected.mediana - salarioNum)} por debajo</strong> — puede afectar la retención de talento.
                          </p>
                        )}
                        {nivel === "mercado" && (
                          <p className="text-[12px] text-muted">
                            Tu salario está dentro del rango competitivo para este puesto en CDMX. Buen trabajo.
                          </p>
                        )}
                        {nivel === "alto" && (
                          <p className="text-[12px] text-muted">
                            Pagas <strong className="text-blue">{formatMXN(salarioNum - selected.mediana)} por encima</strong> de la mediana — eso es una ventaja para atraer y retener talento.
                          </p>
                        )}
                      </div>
                    )}

                    {/* CTAs */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-2xl border border-border p-4">
                        <p className="text-[11px] font-black text-navy mb-1.5">¿Eres empresa?</p>
                        <p className="text-[11px] text-muted mb-3 leading-snug">Atrae talento con salarios competitivos</p>
                        <a href={`https://wa.me/${WA_EMPRESA}?text=${waEmpresaMsg}`} target="_blank" rel="noopener noreferrer"
                          onClick={() => logEvent("comparador_cta_empresa", selected.puesto)}
                          className="flex items-center justify-center gap-1.5 bg-navy text-white text-[11px] font-bold py-2 rounded-xl hover:bg-blue transition-colors">
                          <svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          Contactar Kyoszen
                        </a>
                      </div>
                      <div className="bg-white rounded-2xl border border-border p-4">
                        <p className="text-[11px] font-black text-navy mb-1.5">¿Eres candidato?</p>
                        <p className="text-[11px] text-muted mb-3 leading-snug">Encuentra vacantes con mejor salario</p>
                        <a href={`/vacantes`}
                          onClick={() => logEvent("comparador_cta_candidato", selected.puesto)}
                          className="flex items-center justify-center gap-1.5 bg-blue text-white text-[11px] font-bold py-2 rounded-xl hover:bg-blue-dark transition-colors">
                          Ver vacantes →
                        </a>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                /* Tabla de puestos por categoría */
                <div className="bg-bg rounded-3xl border border-border overflow-hidden">
                  <div className="px-6 py-4 border-b border-border">
                    <p className="text-[13px] font-black text-navy">
                      {categoriaFiltro === "Todos" ? "Todos los puestos" : categoriaFiltro}
                      <span className="text-muted font-normal ml-2">({puestosFiltrados.length} puestos)</span>
                    </p>
                  </div>
                  <div className="overflow-y-auto max-h-[420px]">
                    <table className="w-full text-[12px]">
                      <thead className="bg-white sticky top-0">
                        <tr className="border-b border-border">
                          <th className="text-left px-5 py-3 text-muted font-bold">Puesto</th>
                          <th className="text-right px-3 py-3 text-muted font-bold">Mínimo</th>
                          <th className="text-right px-3 py-3 text-muted font-bold">Mediana</th>
                          <th className="text-right px-5 py-3 text-muted font-bold">Máximo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {puestosFiltrados.map((p, i) => (
                          <tr key={p.puesto}
                            onClick={() => handleSelect(p)}
                            className={`border-b border-border last:border-0 cursor-pointer hover:bg-white transition-colors ${i % 2 === 1 ? "bg-white/50" : ""}`}>
                            <td className="px-5 py-3">
                              <span className="font-semibold text-navy">{p.puesto}</span>
                            </td>
                            <td className="px-3 py-3 text-right text-muted">{formatMXN(p.min)}</td>
                            <td className="px-3 py-3 text-right font-black text-navy">{formatMXN(p.mediana)}</td>
                            <td className="px-5 py-3 text-right text-muted">{formatMXN(p.max)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 py-3 border-t border-border bg-white">
                    <p className="text-[10px] text-muted">Clic en cualquier puesto para comparar · Datos: OCC, IMSS, Indeed MX 2025</p>
                  </div>
                </div>
              )}

              {/* Tabla siempre visible debajo */}
              <div className="bg-bg rounded-3xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <p className="text-[13px] font-black text-navy">
                    {categoriaFiltro === "Todos" ? "Todos los puestos" : categoriaFiltro}
                    <span className="text-muted font-normal ml-2">({puestosFiltrados.length} puestos)</span>
                  </p>
                  <p className="text-[11px] text-muted">Clic para comparar</p>
                </div>
                <div className="overflow-y-auto max-h-[320px]">
                  <table className="w-full text-[12px]">
                    <thead className="bg-white sticky top-0">
                      <tr className="border-b border-border">
                        <th className="text-left px-5 py-3 text-muted font-bold">Puesto</th>
                        <th className="text-right px-3 py-3 text-muted font-bold">Mínimo</th>
                        <th className="text-right px-3 py-3 text-muted font-bold">Mediana</th>
                        <th className="text-right px-5 py-3 text-muted font-bold">Máximo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {puestosFiltrados.map((p, i) => (
                        <tr key={p.puesto} onClick={() => { handleSelect(p); setShowResult(false); }}
                          className={`border-b border-border last:border-0 cursor-pointer transition-colors ${
                            selected?.puesto === p.puesto ? "bg-blue/5 border-l-2 border-l-blue" : i % 2 === 1 ? "bg-white/50 hover:bg-white" : "hover:bg-white"
                          }`}>
                          <td className="px-5 py-2.5">
                            <span className={`font-semibold ${selected?.puesto === p.puesto ? "text-blue" : "text-navy"}`}>{p.puesto}</span>
                          </td>
                          <td className="px-3 py-2.5 text-right text-muted">{formatMXN(p.min)}</td>
                          <td className="px-3 py-2.5 text-right font-black text-navy">{formatMXN(p.mediana)}</td>
                          <td className="px-5 py-2.5 text-right text-muted">{formatMXN(p.max)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* ── Metodología ── */}
          <div className="mt-12 bg-navy rounded-3xl p-8 md:p-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-yellow/20 flex items-center justify-center shrink-0">
                  <span className="text-lg">📊</span>
                </div>
                <h3 className="text-[17px] font-black text-white">¿Cómo construimos estos rangos?</h3>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                {[
                  {
                    icon: "🧠",
                    titulo: "Experiencia de campo",
                    desc: "Kyoszen lleva más de 10 años colocando talento en CDMX y Área Metropolitana. Los rangos reflejan lo que empresas realmente ofrecen y candidatos realmente aceptan en el mercado operativo y administrativo.",
                  },
                  {
                    icon: "📋",
                    titulo: "Reportes públicos de mercado",
                    desc: "Complementamos con información de reportes salariales públicos de bolsas de trabajo, encuestas de compensación y datos de empleo formal publicados en México para el período 2024-2025.",
                  },
                  {
                    icon: "🔄",
                    titulo: "Actualización continua",
                    desc: "A medida que Kyoszen realiza más colocaciones, los rangos se irán refinando con datos propios reales. El objetivo es que esta herramienta evolucione con el mercado.",
                  },
                ].map(f => (
                  <div key={f.titulo} className="bg-white/10 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{f.icon}</span>
                      <p className="text-white font-black text-[13px] leading-snug">{f.titulo}</p>
                    </div>
                    <p className="text-white/70 text-[12px] leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-5 grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-white/90 text-[12.5px] leading-relaxed">
                    <strong className="text-yellow">¿Qué representan los rangos?</strong> El valor mínimo refleja el salario de entrada típico, la mediana el valor más común en el mercado, y el máximo lo que ofrecen empresas con mayor competitividad salarial — todos para puestos en CDMX y Área Metropolitana.
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-[11.5px] leading-relaxed">
                    <strong className="text-white/80">Aviso:</strong> Los rangos son estimados de referencia para el mercado laboral de CDMX 2025. Pueden variar según industria, tamaño de empresa, nivel de experiencia y paquete de beneficios. No incluyen prestaciones superiores a la ley. Si necesitas un análisis personalizado para tu empresa, <a href="/contacto" className="text-yellow underline">contáctanos</a>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
