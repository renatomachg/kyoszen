"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AplicarModalProps {
  open: boolean;
  onClose: () => void;
  vacante: string;
}

const EXPERIENCIA_OPTIONS = [
  "Sin experiencia",
  "Menos de 1 año",
  "1 a 2 años",
  "3 a 5 años",
  "Mas de 5 años",
];

const UBICACION_OPTIONS = [
  "CDMX — sin problema de traslado",
  "CDMX — maximo 1 hora de traslado",
  "Estado de Mexico",
  "Disponible para reubicacion",
  "Solo remoto",
];

const DOCUMENTACION_OPTIONS = [
  "Si, todo en orden",
  "Me falta alguno",
  "No",
];

export default function AplicarModal({ open, onClose, vacante }: AplicarModalProps) {
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [fileName, setFileName] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;

    setStatus("sending");
    try {
      const fd = new FormData(formRef.current);
      fd.set("vacante", vacante);

      const res = await fetch("/api/aplicar", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const handleClose = () => {
    if (status === "sending") return;
    onClose();
    setTimeout(() => {
      setStatus("idle");
      setFileName("");
      formRef.current?.reset();
    }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white z-10 px-6 pt-6 pb-4 border-b border-border rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold text-navy">Aplicar a vacante</h2>
                  <p className="text-[12.5px] text-muted mt-0.5">{vacante}</p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-8 h-8 rounded-full hover:bg-bg flex items-center justify-center text-muted hover:text-navy transition-colors"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {status === "success" ? (
              <div className="px-6 py-12 text-center">
                <div className="w-14 h-14 rounded-full bg-green-soft flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h3 className="text-lg font-extrabold text-navy mb-2">Solicitud enviada</h3>
                <p className="text-[13.5px] text-muted leading-relaxed">
                  Recibimos tu solicitud. Te contactaremos en maximo 24 horas habiles.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 bg-navy text-white rounded-full py-3 px-8 text-[13.5px] font-extrabold hover:bg-blue-dark transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {/* Nombre */}
                <FormField label="Nombre completo" required>
                  <input
                    name="nombre"
                    type="text"
                    required
                    placeholder="Tu nombre completo"
                    className="form-input"
                  />
                </FormField>

                {/* WhatsApp */}
                <FormField label="WhatsApp" required>
                  <input
                    name="whatsapp"
                    type="tel"
                    required
                    placeholder="55 1234 5678"
                    className="form-input"
                  />
                </FormField>

                {/* Correo */}
                <FormField label="Correo electronico" required>
                  <input
                    name="correo"
                    type="email"
                    required
                    placeholder="tu@correo.com"
                    className="form-input"
                  />
                </FormField>

                {/* Experiencia */}
                <FormField label="Años de experiencia en el puesto" required>
                  <select name="experiencia" required defaultValue="" className="form-input">
                    <option value="" disabled>Selecciona</option>
                    {EXPERIENCIA_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </FormField>

                {/* Ubicación */}
                <FormField label="Ubicacion / alcance de traslado" required>
                  <select name="ubicacion" required defaultValue="" className="form-input">
                    <option value="" disabled>Selecciona</option>
                    {UBICACION_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </FormField>

                {/* Documentación */}
                <FormField label="¿Tienes toda la documentacion basica lista?" required>
                  <select name="documentacion" required defaultValue="" className="form-input">
                    <option value="" disabled>Selecciona</option>
                    {DOCUMENTACION_OPTIONS.map((o) => (
                      <option key={o} value={o}>{o}</option>
                    ))}
                  </select>
                </FormField>

                {/* CV */}
                <FormField label="Subir CV (opcional)">
                  <input
                    ref={fileRef}
                    name="cv"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-xl py-3.5 px-4 text-[13px] text-muted hover:border-blue hover:text-blue transition-colors text-left"
                  >
                    {fileName || "PDF o Word — clic para seleccionar"}
                  </button>
                </FormField>

                {status === "error" && (
                  <p className="text-[12.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    Hubo un error al enviar. Intenta de nuevo o contactanos por WhatsApp.
                  </p>
                )}

                {/* Submit */}
                <div className="pt-2 pb-1">
                  <button
                    type="submit"
                    disabled={status === "sending"}
                    className="w-full bg-navy text-white rounded-full py-3.5 text-[14px] font-extrabold hover:bg-blue-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {status === "sending" ? "Enviando..." : "Enviar solicitud"}
                  </button>
                  <p className="text-[11px] text-muted text-center mt-3 leading-relaxed">
                    Al enviar, aceptas nuestro{" "}
                    <a href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer" className="text-blue underline hover:text-blue-dark transition-colors">
                      Aviso de Privacidad
                    </a>{" "}
                    y el tratamiento de tus datos conforme a la LFPDPPP.
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FormField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-bold text-navy mb-1.5 block">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
