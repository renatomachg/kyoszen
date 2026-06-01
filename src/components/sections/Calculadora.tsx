"use client";

import { useState, useRef, useEffect } from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { logEvent } from "@/lib/analytics";

const WA_NUMBER = "5215640045414";

function formatMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(n);
}

function calcularCosto(empleados: number, rotacion: number, salario: number) {
  const rotanAlAno = Math.round(empleados * (rotacion / 100));
  const costoTotal = rotanAlAno * salario * 3;
  const reclutamiento = rotanAlAno * salario * 1;
  const capacitacion = rotanAlAno * salario * 1;
  const productividad = rotanAlAno * salario * 1;
  return { rotanAlAno, costoTotal, reclutamiento, capacitacion, productividad };
}

function AnimatedNumber({ value, prefix = "" }: { value: number; prefix?: string }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);

  useEffect(() => {
    const start = prevRef.current;
    const end = value;
    const duration = 800;
    const steps = 40;
    const increment = (end - start) / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      const next = Math.round(start + increment * step);
      setDisplay(step >= steps ? end : next);
      if (step >= steps) { clearInterval(timer); prevRef.current = end; }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{formatMXN(display)}</span>;
}

interface Props {
  standalone?: boolean;
}

export default function Calculadora({ standalone = false }: Props) {
  const [empleados, setEmpleados] = useState(50);
  const [rotacion, setRotacion] = useState(20);
  const [salario, setSalario] = useState(12000);
  const [calculado, setCalculado] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const resultado = calcularCosto(empleados, rotacion, salario);
  const pct = Math.min(100, Math.round((resultado.costoTotal / 2_000_000) * 100));

  const handleCalcular = () => {
    setCalculado(true);
    if (!standalone) setShowModal(true);
    logEvent("calculadora_resultado", JSON.stringify({
      empleados, rotacion, salario, costo_total: resultado.costoTotal
    }));
  };

  const waMessage = encodeURIComponent(
    `Hola, usé la calculadora de Kyoszen y descubrí que mi empresa pierde aproximadamente ${formatMXN(resultado.costoTotal)} al año por rotación de personal (${resultado.rotanAlAno} empleados). Me interesa saber cómo pueden ayudarme a reducirlo.`
  );
  const waUrl = `https://wa.me/${WA_NUMBER}?text=${waMessage}`;

  const ResultContent = () => (
    <div>
      {/* Resultado principal */}
      <div className="bg-navy rounded-2xl p-6 text-center mb-6">
        <p className="text-white/60 text-[12px] font-bold uppercase tracking-widest mb-2">
          Tu empresa pierde al año por rotación
        </p>
        <p className="text-yellow font-black text-4xl mb-1">
          <AnimatedNumber value={resultado.costoTotal} />
        </p>
        <p className="text-white/50 text-[12px]">
          {resultado.rotanAlAno} empleados rotan al año · {formatMXN(resultado.costoTotal / 12)}/mes
        </p>
      </div>

      {/* Desglose */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Reclutamiento", value: resultado.reclutamiento, icon: "🔍", color: "bg-blue/10 text-blue" },
          { label: "Capacitación", value: resultado.capacitacion, icon: "🎓", color: "bg-yellow/10 text-yellow-700" },
          { label: "Productividad perdida", value: resultado.productividad, icon: "📉", color: "bg-red-50 text-red-600" },
        ].map((item) => (
          <div key={item.label} className="bg-bg rounded-xl p-4 text-center">
            <span className="text-xl block mb-1">{item.icon}</span>
            <p className="text-[11px] text-muted font-semibold leading-tight mb-1">{item.label}</p>
            <p className={`text-[13px] font-black ${item.color.split(" ")[1]}`}>{formatMXN(item.value)}</p>
          </div>
        ))}
      </div>

      {/* Barra de impacto */}
      <div className="mb-6">
        <div className="flex justify-between text-[11px] text-muted mb-1.5">
          <span>Impacto financiero</span>
          <span className="font-bold text-navy">{pct}% de afectación estimada</span>
        </div>
        <div className="h-3 bg-bg rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow to-blue rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Ahorro potencial */}
      <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
        <span className="text-2xl shrink-0">💡</span>
        <div>
          <p className="text-[13px] font-black text-green-800 mb-0.5">Kyoszen puede reducir esto hasta en un 60%</p>
          <p className="text-[12px] text-green-700">
            Eso representa un ahorro potencial de <strong>{formatMXN(resultado.costoTotal * 0.6)}</strong> al año
          </p>
        </div>
      </div>

      {/* CTA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1fba59] text-white rounded-2xl py-4 font-black text-[15px] transition-colors w-full"
        onClick={() => logEvent("calculadora_whatsapp_click", JSON.stringify({ costo_total: resultado.costoTotal }))}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
        Quiero reducir esta pérdida
      </a>
      <p className="text-[11px] text-muted text-center mt-2">Sin compromiso · Respuesta en menos de 24 horas</p>
    </div>
  );

  // Standalone (página /calculadora)
  if (standalone) {
    return (
      <div className="min-h-screen bg-bg py-16 px-5">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="inline-block bg-blue/10 text-blue text-[12px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">Herramienta gratuita</span>
            <h1 className="text-3xl md:text-4xl font-black text-navy mb-3">
              ¿Cuánto le cuesta la rotación<br className="hidden md:block" /> de personal a tu empresa?
            </h1>
            <p className="text-[14px] text-muted max-w-md mx-auto leading-relaxed">
              Calcula en segundos el impacto financiero real de perder y reponer empleados cada año.
            </p>
          </div>

          <div className="bg-white rounded-3xl border border-border shadow-sm p-8 mb-6">
            <InputsSection
              empleados={empleados} setEmpleados={setEmpleados}
              rotacion={rotacion} setRotacion={setRotacion}
              salario={salario} setSalario={setSalario}
              onCalcular={handleCalcular}
            />
          </div>

          {calculado && (
            <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
              <ResultContent />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Homepage section
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-bg">
      <AnimatedSection>
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-blue/10 text-blue text-[12px] font-bold px-3 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              Herramienta gratuita
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-navy mb-4">
              ¿Cuánto te cuesta la rotación<br className="hidden md:block" /> de personal?
            </h2>
            <p className="text-[14px] text-muted max-w-xl mx-auto leading-relaxed">
              Calcula en segundos el dinero que tu empresa pierde cada año por perder y reponer empleados.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: inputs */}
            <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
              <InputsSection
                empleados={empleados} setEmpleados={setEmpleados}
                rotacion={rotacion} setRotacion={setRotacion}
                salario={salario} setSalario={setSalario}
                onCalcular={handleCalcular}
              />
            </div>

            {/* Right: preview or result */}
            <div className="bg-white rounded-3xl border border-border shadow-sm p-8">
              {calculado ? <ResultContent /> : <PreviewCard />}
            </div>
          </div>

          <div className="mt-6 bg-white border border-border rounded-2xl p-5 max-w-2xl mx-auto">
            <p className="text-[12px] font-black text-navy mb-2">¿Cómo se calcula?</p>
            <p className="text-[12px] text-muted leading-relaxed mb-3">
              Basado en la metodología de la <strong className="text-navy">SHRM</strong> (Society for Human Resource Management), la asociación de RRHH más grande del mundo, adaptada al mercado laboral mexicano para puestos operativos y administrativos.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {[
                { icon: "🔍", label: "Reclutamiento", desc: "Publicación, entrevistas y tiempo del equipo" },
                { icon: "🎓", label: "Capacitación", desc: "Onboarding y tiempo del supervisor" },
                { icon: "📉", label: "Productividad", desc: "El nuevo empleado tarda ~90 días en rendir al 100%" },
              ].map(item => (
                <div key={item.label} className="bg-bg rounded-xl p-3">
                  <span className="text-base block mb-1">{item.icon}</span>
                  <p className="text-[11px] font-black text-navy mb-0.5">{item.label}</p>
                  <p className="text-[10px] text-muted leading-snug">{item.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted">
              * El cálculo usa un factor conservador de <strong>3 meses de salario</strong> por empleado repuesto — el escenario mínimo según SHRM (el costo real puede llegar al 200% del salario anual en puestos especializados).
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* Modal para mobile */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:hidden" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-border rounded-full mx-auto mb-6" />
            <ResultContent />
          </div>
        </div>
      )}
    </section>
  );
}

function InputsSection({ empleados, setEmpleados, rotacion, setRotacion, salario, setSalario, onCalcular }: {
  empleados: number; setEmpleados: (v: number) => void;
  rotacion: number; setRotacion: (v: number) => void;
  salario: number; setSalario: (v: number) => void;
  onCalcular: () => void;
}) {
  const resultado = calcularCosto(empleados, rotacion, salario);

  return (
    <div>
      <h3 className="text-[17px] font-black text-navy mb-6">Datos de tu empresa</h3>

      <div className="space-y-6">
        {/* Empleados */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[13px] font-bold text-navy">Número de empleados</label>
            <span className="text-[13px] font-black text-blue">{empleados}</span>
          </div>
          <input type="range" min={5} max={500} step={5} value={empleados}
            onChange={e => setEmpleados(Number(e.target.value))}
            className="w-full accent-blue h-2 rounded-full" />
          <div className="flex justify-between text-[11px] text-muted mt-1">
            <span>5</span><span>500+</span>
          </div>
        </div>

        {/* Rotación */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[13px] font-bold text-navy">Rotación anual</label>
            <span className="text-[13px] font-black text-blue">{rotacion}%</span>
          </div>
          <input type="range" min={5} max={80} step={5} value={rotacion}
            onChange={e => setRotacion(Number(e.target.value))}
            className="w-full accent-blue h-2 rounded-full" />
          <div className="flex justify-between text-[11px] text-muted mt-1">
            <span>5%</span><span className="text-yellow-600 font-semibold">Promedio MX: 20%</span><span>80%</span>
          </div>
        </div>

        {/* Salario */}
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[13px] font-bold text-navy">Salario mensual promedio</label>
            <span className="text-[13px] font-black text-blue">{formatMXN(salario)}</span>
          </div>
          <input type="range" min={5000} max={60000} step={1000} value={salario}
            onChange={e => setSalario(Number(e.target.value))}
            className="w-full accent-blue h-2 rounded-full" />
          <div className="flex justify-between text-[11px] text-muted mt-1">
            <span>$5,000</span><span>$60,000</span>
          </div>
        </div>

        {/* Preview rápido */}
        <div className="bg-navy/5 rounded-2xl p-4 border border-navy/10">
          <p className="text-[12px] text-muted mb-1">{resultado.rotanAlAno} empleados rotarán este año · costo estimado:</p>
          <p className="text-2xl font-black text-navy">{formatMXN(resultado.costoTotal)}</p>
        </div>

        <button
          onClick={onCalcular}
          className="w-full bg-navy hover:bg-blue text-white font-black text-[15px] py-4 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          Ver mi análisis completo
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function PreviewCard() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-8 gap-5">
      <div className="w-16 h-16 rounded-2xl bg-navy/5 flex items-center justify-center">
        <span className="text-3xl">🧮</span>
      </div>
      <div>
        <h3 className="text-[17px] font-black text-navy mb-2">Tu análisis aparecerá aquí</h3>
        <p className="text-[13px] text-muted leading-relaxed max-w-xs">
          Mueve los controles y presiona <strong>"Ver mi análisis completo"</strong> para descubrir cuánto dinero puede recuperar tu empresa.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3 w-full mt-2">
        {["🔍 Reclutamiento", "🎓 Capacitación", "📉 Productividad"].map(item => (
          <div key={item} className="bg-bg rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted font-semibold">{item}</p>
            <p className="text-[13px] font-black text-navy/30 mt-1">$—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
