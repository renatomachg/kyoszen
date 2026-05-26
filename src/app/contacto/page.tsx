"use client";

import { useState } from "react";
import { logEvent } from "@/lib/analytics";
import AnimatedSection from "@/components/ui/AnimatedSection";
import PageHero from "@/components/ui/PageHero";

const contactInfo = [
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>, title: "Oficina", value: "CDMX, México" },
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>, title: "WhatsApp", value: "56 4004 5414 (reclutamiento)" },
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>, title: "Horario", value: "Lun-Vie 9am-6pm" },
  { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--color-blue)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>, title: "Correo", value: "rsalazar@kyoszen.com.mx" },
];

export default function ContactoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", privacy: false });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      setError("Por favor completa todos los campos.");
      return;
    }
    if (!form.privacy) {
      setError("Debes aceptar el aviso de privacidad.");
      return;
    }
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.name,
          correo: form.email,
          asunto: form.subject,
          mensaje: form.message,
        }),
      });
      if (!res.ok) throw new Error();
      setSubmitted(true);
      logEvent("contacto_enviado", form.subject);
    } catch {
      setError("Ocurrió un error al enviar el mensaje. Inténtalo de nuevo o escríbenos por WhatsApp.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Hero */}
      <PageHero
        image="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1800&auto=format&fit=crop&q=80"
        chip="Contáctanos"
        title={
          <>
            No dudes en <em className="text-yellow not-italic">escribirnos</em>
          </>
        }
        description="Con más de 10 años en el mercado laboral mexicano, estamos listos para ayudarte sin costos adicionales ni compromisos."
      />

      {/* Contact body */}
      <section className="py-16 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10">
          {/* Form */}
          <AnimatedSection>
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
              {!submitted ? (
                <>
                  <h2 className="text-xl font-extrabold text-navy mb-1">Deja tu mensaje</h2>
                  <p className="text-[13px] text-muted mb-6">Te respondemos en menos de 24 horas hábiles.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1.5">Nombre</label>
                      <input type="text" placeholder="Tu nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:border-blue transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-navy mb-1.5">Correo electrónico</label>
                      <input type="email" placeholder="tu@correo.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:border-blue transition-colors" />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-navy mb-1.5">Asunto</label>
                    <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:border-blue transition-colors bg-white">
                      <option value="" disabled>Selecciona un asunto</option>
                      <option>Quiero aplicar a una vacante</option>
                      <option>Necesito contratar personal</option>
                      <option>Información sobre cursos</option>
                      <option>Cotización de servicios</option>
                      <option>Otro</option>
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-xs font-bold text-navy mb-1.5">Mensaje</label>
                    <textarea placeholder="Escribe tu mensaje aquí..." rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full border-[1.5px] border-border rounded-xl py-2.5 px-3.5 text-[13px] outline-none focus:border-blue transition-colors resize-none" />
                  </div>
                  <label className="flex items-start gap-2.5 mb-5 cursor-pointer">
                    <input type="checkbox" checked={form.privacy} onChange={(e) => setForm({ ...form, privacy: e.target.checked })} className="mt-0.5 shrink-0" />
                    <span className="text-xs text-muted leading-relaxed">
                      He leído y acepto el{" "}
                      <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="text-blue underline hover:text-blue-dark transition-colors">
                        Aviso de Privacidad
                      </a>{" "}
                      y autorizo el tratamiento de mis datos personales conforme a la LFPDPPP.
                    </span>
                  </label>
                  {error && (
                    <p className="text-xs text-red-600 mb-3">{error}</p>
                  )}
                  <button onClick={handleSubmit} disabled={sending} className="bg-blue-btn text-white rounded-full py-3 px-7 text-[13px] font-bold cursor-pointer flex items-center gap-2 hover:bg-blue-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
                    {sending ? "Enviando..." : "Enviar mensaje"}
                  </button>
                </>
              ) : (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-green-soft rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                  <h3 className="text-xl font-extrabold text-navy mb-2">¡Mensaje enviado!</h3>
                  <p className="text-[13px] text-muted">Gracias por contactarnos. Un asesor de Kyoszen te responderá en menos de 24 horas hábiles.</p>
                </div>
              )}
            </div>
          </AnimatedSection>

          {/* Info side */}
          <AnimatedSection delay={0.2}>
            <div className="flex flex-col gap-6">
              <div>
                <h2 className="text-xl font-extrabold text-navy mb-2">No dudes en <em className="text-blue">contactarnos</em></h2>
                <p className="text-[13px] text-muted leading-relaxed">Estamos disponibles para resolver tus dudas sobre vacantes, reclutamiento, cursos o cualquier servicio de capital humano.</p>
              </div>
              <div className="flex flex-col gap-3">
                {contactInfo.map((item) => (
                  <div key={item.title} className="bg-white rounded-xl p-4 flex items-center gap-4 border border-border">
                    <div className="w-10 h-10 rounded-xl bg-blue-soft flex items-center justify-center shrink-0">{item.icon}</div>
                    <div>
                      <div className="text-xs font-bold text-navy">{item.title}</div>
                      <div className="text-[13px] text-muted">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
}
