"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const field =
  "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white font-mono";
const lbl = "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

interface EmailConfig {
  contact_email: string;
  courses_email: string;
  aplicaciones_email: string;
}

const DEFAULTS: EmailConfig = {
  contact_email: "rsalazar@kyoszen.com.mx",
  courses_email: "info@kyoszen.com",
  aplicaciones_email: "rsalazar@kyoszen.com.mx",
};

export default function AdminCorreos() {
  const [config, setConfig] = useState<EmailConfig>(DEFAULTS);
  const [saved, setSaved] = useState<EmailConfig>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  /* ── Load from Supabase ── */
  useEffect(() => {
    supabase
      .from("site_config")
      .select("key, value")
      .in("key", ["contact_email", "courses_email", "aplicaciones_email"])
      .then(({ data }) => {
        if (data && data.length > 0) {
          const map: Record<string, string> = {};
          data.forEach((r) => { map[r.key] = r.value; });
          const merged: EmailConfig = {
            contact_email: map.contact_email ?? DEFAULTS.contact_email,
            courses_email: map.courses_email ?? DEFAULTS.courses_email,
            aplicaciones_email: map.aplicaciones_email ?? DEFAULTS.aplicaciones_email,
          };
          setConfig(merged);
          setSaved(merged);
        }
        setLoading(false);
      });
  }, []);

  /* ── Save ── */
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Basic email validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const [k, v] of Object.entries(config)) {
      if (!emailRe.test(v)) {
        setError(`El correo "${v}" no es valido (campo: ${k.replace(/_/g, " ")}).`);
        return;
      }
    }

    setSaving(true);
    const rows = Object.entries(config).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }));
    const { error: err } = await supabase
      .from("site_config")
      .upsert(rows, { onConflict: "key" });

    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved({ ...config });
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  }

  const dirty = JSON.stringify(config) !== JSON.stringify(saved);

  const smtpVars = [
    { key: "SMTP_HOST", hint: "smtp.hostinger.com" },
    { key: "SMTP_PORT", hint: "587" },
    { key: "SMTP_USER", hint: "rsalazar@kyoszen.com.mx" },
    { key: "SMTP_PASS", hint: "••••••••" },
  ];

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">Correos electronicos</h1>
        <p className="text-[13px] text-muted">
          Configura a donde llegan los formularios del sitio y verifica la configuracion del servidor de correo.
        </p>
      </div>

      {/* ═══════ Correos de destino ═══════ */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-5">
        <h2 className="text-[15px] font-black text-navy mb-1">Correos de destino</h2>
        <p className="text-[12.5px] text-muted mb-5 leading-relaxed">
          Aqui defines a que correo llega cada tipo de formulario. Se puede cambiar sin reiniciar el servidor.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className={lbl}>Formulario de contacto</label>
              <input
                className={field}
                type="email"
                value={config.contact_email}
                onChange={(e) => setConfig((c) => ({ ...c, contact_email: e.target.value }))}
                placeholder="rsalazar@kyoszen.com.mx"
              />
              <p className="text-[11.5px] text-muted mt-1">
                Recibe los mensajes del formulario /contacto (asuntos generales).
              </p>
            </div>

            <div>
              <label className={lbl}>Solicitudes de informes de cursos</label>
              <input
                className={field}
                type="email"
                value={config.courses_email}
                onChange={(e) => setConfig((c) => ({ ...c, courses_email: e.target.value }))}
                placeholder="info@kyoszen.com"
              />
              <p className="text-[11.5px] text-muted mt-1">
                Recibe los mensajes con asunto "Informes: [curso]" desde el formulario de contacto.
              </p>
            </div>

            <div>
              <label className={lbl}>Aplicaciones a vacantes</label>
              <input
                className={field}
                type="email"
                value={config.aplicaciones_email}
                onChange={(e) => setConfig((c) => ({ ...c, aplicaciones_email: e.target.value }))}
                placeholder="rsalazar@kyoszen.com.mx"
              />
              <p className="text-[11.5px] text-muted mt-1">
                Recibe los formularios de aplicacion a vacantes (con CV adjunto si aplica).
              </p>
            </div>

            {error && (
              <p className="text-red-600 text-sm">{error}</p>
            )}

            <div className="flex items-center gap-3 pt-1">
              <button
                type="submit"
                disabled={saving || !dirty}
                className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : ok ? "✓ Guardado" : "Guardar correos"}
              </button>
              {dirty && (
                <span className="text-[12px] text-yellow-600 font-medium">· Cambios sin guardar</span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ═══════ Servidor SMTP ═══════ */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <h2 className="text-[15px] font-black text-navy mb-1">Servidor SMTP</h2>
        <p className="text-[12.5px] text-muted mb-4 leading-relaxed">
          Las credenciales del servidor de correo se configuran directamente en el archivo{" "}
          <code className="bg-bg px-1.5 py-0.5 rounded text-[11px] font-mono">.env.local</code>{" "}
          del servidor por seguridad. No se pueden editar desde el panel.
        </p>

        <div className="bg-bg border border-border rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-2 border-b border-border bg-navy/5">
            <p className="text-[11px] font-bold text-navy uppercase tracking-wide">
              Variables requeridas en .env.local del VPS
            </p>
          </div>
          <div className="divide-y divide-border">
            {smtpVars.map(({ key, hint }) => (
              <div key={key} className="flex items-center justify-between px-4 py-2.5">
                <code className="text-[12.5px] font-mono font-bold text-navy">{key}</code>
                <span className="text-[12px] text-muted font-mono">{hint}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow/10 border border-yellow/30 rounded-xl p-3.5">
          <p className="text-[12.5px] text-navy font-semibold mb-1">Para configurar en el VPS</p>
          <p className="text-[12px] text-muted leading-relaxed">
            Conéctate por SSH y edita el archivo:{" "}
            <code className="bg-white/60 px-1.5 py-0.5 rounded font-mono text-[11px]">
              nano /home/kyoszen/kyoszen/.env.local
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
