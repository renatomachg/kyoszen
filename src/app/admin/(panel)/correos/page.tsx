"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { logAdminClient } from "@/lib/admin-log-client";

const field =
  "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white font-mono";
const lbl = "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

/* ══════════════════════════════════════════════
   CORREOS DE DESTINO
══════════════════════════════════════════════ */
interface EmailConfig {
  contact_email: string;
  courses_email: string;
  aplicaciones_email: string;
}

const EMAIL_DEFAULTS: EmailConfig = {
  contact_email: "rsalazar@kyoszen.com.mx",
  courses_email: "info@kyoszen.com",
  aplicaciones_email: "rsalazar@kyoszen.com.mx",
};

/* ══════════════════════════════════════════════
   SMTP CONFIG
══════════════════════════════════════════════ */
interface SmtpForm {
  host: string;
  port: string;
  user: string;
  pass: string;
}

const SMTP_DEFAULTS: SmtpForm = { host: "", port: "587", user: "", pass: "" };

export default function AdminCorreos() {
  /* ── Correos de destino ── */
  const [config, setConfig] = useState<EmailConfig>(EMAIL_DEFAULTS);
  const [savedConfig, setSavedConfig] = useState<EmailConfig>(EMAIL_DEFAULTS);
  const [loadingEmails, setLoadingEmails] = useState(true);
  const [savingEmails, setSavingEmails] = useState(false);
  const [emailsOk, setEmailsOk] = useState(false);
  const [emailsError, setEmailsError] = useState("");

  /* ── SMTP ── */
  const [smtp, setSmtp] = useState<SmtpForm>(SMTP_DEFAULTS);
  const [savedSmtp, setSavedSmtp] = useState<SmtpForm>(SMTP_DEFAULTS);
  const [smtpPassSet, setSmtpPassSet] = useState(false);
  const [loadingSmtp, setLoadingSmtp] = useState(true);
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpOk, setSmtpOk] = useState("");
  const [smtpError, setSmtpError] = useState("");
  const [showPass, setShowPass] = useState(false);

  /* ── Load correos de destino ── */
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
            contact_email: map.contact_email ?? EMAIL_DEFAULTS.contact_email,
            courses_email: map.courses_email ?? EMAIL_DEFAULTS.courses_email,
            aplicaciones_email: map.aplicaciones_email ?? EMAIL_DEFAULTS.aplicaciones_email,
          };
          setConfig(merged);
          setSavedConfig(merged);
        }
        setLoadingEmails(false);
      });
  }, []);

  /* ── Load SMTP config ── */
  useEffect(() => {
    fetch("/api/admin/smtp")
      .then((r) => r.json())
      .then((data) => {
        const s: SmtpForm = {
          host: data.host ?? "",
          port: data.port ?? "587",
          user: data.user ?? "",
          pass: "",
        };
        setSmtp(s);
        setSavedSmtp(s);
        setSmtpPassSet(!!data.passSet);
        setLoadingSmtp(false);
      });
  }, []);

  /* ── Guardar correos de destino ── */
  async function handleSaveEmails(e: React.FormEvent) {
    e.preventDefault();
    setEmailsError("");
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const [k, v] of Object.entries(config)) {
      if (!emailRe.test(v)) {
        setEmailsError(`El correo "${v}" no es valido (${k.replace(/_/g, " ")}).`);
        return;
      }
    }
    setSavingEmails(true);
    const rows = Object.entries(config).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase.from("site_config").upsert(rows, { onConflict: "key" });
    setSavingEmails(false);
    if (error) { setEmailsError(error.message); return; }
    setSavedConfig({ ...config });
    logAdminClient("Correos de destino actualizados");
    setEmailsOk(true);
    setTimeout(() => setEmailsOk(false), 3000);
  }

  /* ── Guardar SMTP ── */
  async function handleSaveSmtp(e: React.FormEvent) {
    e.preventDefault();
    setSmtpError(""); setSmtpOk("");
    if (!smtp.host || !smtp.user) {
      setSmtpError("Host y usuario son requeridos.");
      return;
    }
    if (!smtpPassSet && !smtp.pass) {
      setSmtpError("Ingresa la contrasena del servidor de correo.");
      return;
    }
    setSavingSmtp(true);
    const res = await fetch("/api/admin/smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save", ...smtp }),
    });
    const data = await res.json();
    setSavingSmtp(false);
    if (data.error) { setSmtpError(data.error); return; }
    setSavedSmtp({ ...smtp, pass: "" });
    setSmtpPassSet(true);
    setSmtp((s) => ({ ...s, pass: "" }));
    setSmtpOk("Configuracion guardada correctamente.");
    setTimeout(() => setSmtpOk(""), 4000);
  }

  /* ── Probar SMTP ── */
  async function handleTestSmtp() {
    setSmtpError(""); setSmtpOk("");
    if (!smtp.host || !smtp.user) {
      setSmtpError("Completa host y usuario antes de probar.");
      return;
    }
    if (!smtpPassSet && !smtp.pass) {
      setSmtpError("Ingresa la contrasena para probar la conexion.");
      return;
    }
    setTestingSmtp(true);
    const res = await fetch("/api/admin/smtp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", ...smtp }),
    });
    const data = await res.json();
    setTestingSmtp(false);
    if (data.error) { setSmtpError(data.error); return; }
    setSmtpOk(data.message ?? "Conexion exitosa.");
  }

  const emailsDirty = JSON.stringify(config) !== JSON.stringify(savedConfig);
  const smtpDirty = smtp.host !== savedSmtp.host || smtp.port !== savedSmtp.port ||
    smtp.user !== savedSmtp.user || smtp.pass !== "";

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">Correos electronicos</h1>
        <p className="text-[13px] text-muted">
          Configura a donde llegan los formularios del sitio y el servidor de correo saliente.
        </p>
      </div>

      {/* ═══════ Correos de destino ═══════ */}
      <div className="bg-white border border-border rounded-2xl p-6 mb-5">
        <h2 className="text-[15px] font-black text-navy mb-1">Correos de destino</h2>
        <p className="text-[12.5px] text-muted mb-5 leading-relaxed">
          Define a que correo llega cada tipo de formulario. Se aplica de inmediato sin reiniciar el servidor.
        </p>

        {loadingEmails ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSaveEmails} className="space-y-4">
            <div>
              <label className={lbl}>Formulario de contacto</label>
              <input className={field} type="email" value={config.contact_email}
                onChange={(e) => setConfig((c) => ({ ...c, contact_email: e.target.value }))}
                placeholder="rsalazar@kyoszen.com.mx" />
              <p className="text-[11.5px] text-muted mt-1">Recibe mensajes del formulario /contacto (asuntos generales).</p>
            </div>
            <div>
              <label className={lbl}>Solicitudes de informes de cursos</label>
              <input className={field} type="email" value={config.courses_email}
                onChange={(e) => setConfig((c) => ({ ...c, courses_email: e.target.value }))}
                placeholder="info@kyoszen.com" />
              <p className="text-[11.5px] text-muted mt-1">Recibe mensajes con asunto "Informes: [curso]".</p>
            </div>
            <div>
              <label className={lbl}>Aplicaciones a vacantes</label>
              <input className={field} type="email" value={config.aplicaciones_email}
                onChange={(e) => setConfig((c) => ({ ...c, aplicaciones_email: e.target.value }))}
                placeholder="rsalazar@kyoszen.com.mx" />
              <p className="text-[11.5px] text-muted mt-1">Recibe formularios de aplicacion a vacantes (con CV adjunto).</p>
            </div>

            {emailsError && <p className="text-red-600 text-sm">{emailsError}</p>}

            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={savingEmails || !emailsDirty}
                className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-50">
                {savingEmails ? "Guardando..." : emailsOk ? "✓ Guardado" : "Guardar correos"}
              </button>
              {emailsDirty && <span className="text-[12px] text-yellow-600 font-medium">· Cambios sin guardar</span>}
            </div>
          </form>
        )}
      </div>

      {/* ═══════ Servidor SMTP ═══════ */}
      <div className="bg-white border border-border rounded-2xl p-6">
        <h2 className="text-[15px] font-black text-navy mb-1">Servidor SMTP</h2>
        <p className="text-[12.5px] text-muted mb-5 leading-relaxed">
          Credenciales del servidor de correo saliente. Se usan para enviar todos los formularios del sitio.
        </p>

        {loadingSmtp ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSaveSmtp} className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className={lbl}>Servidor (host)</label>
                <input className={field} value={smtp.host}
                  onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))}
                  placeholder="mail.kyoszen.com" />
              </div>
              <div>
                <label className={lbl}>Puerto</label>
                <input className={field} value={smtp.port}
                  onChange={(e) => setSmtp((s) => ({ ...s, port: e.target.value }))}
                  placeholder="587" />
              </div>
            </div>

            <div>
              <label className={lbl}>Usuario (correo remitente)</label>
              <input className={field} type="email" value={smtp.user}
                onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))}
                placeholder="info@kyoszen.com" />
            </div>

            <div>
              <label className={lbl}>
                Contrasena
                {smtpPassSet && !smtp.pass && (
                  <span className="ml-2 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full normal-case tracking-normal">
                    ✓ Configurada
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  className={field + " pr-12"}
                  type={showPass ? "text" : "password"}
                  value={smtp.pass}
                  onChange={(e) => setSmtp((s) => ({ ...s, pass: e.target.value }))}
                  placeholder={smtpPassSet ? "Dejar en blanco para mantener la actual" : "Contrasena del correo"}
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy transition-colors text-[12px]">
                  {showPass ? "Ocultar" : "Ver"}
                </button>
              </div>
            </div>

            {/* Mensajes de estado */}
            {smtpError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-xl">
                {smtpError}
              </div>
            )}
            {smtpOk && (
              <div className="bg-green-50 border border-green-200 text-green-700 text-[13px] px-4 py-3 rounded-xl">
                ✓ {smtpOk}
              </div>
            )}

            <div className="flex items-center gap-3 pt-1 flex-wrap">
              <button type="submit" disabled={savingSmtp}
                className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-50">
                {savingSmtp ? "Guardando..." : "Guardar SMTP"}
              </button>
              <button type="button" onClick={handleTestSmtp} disabled={testingSmtp}
                className="flex items-center gap-2 border border-border text-navy rounded-xl px-5 py-2.5 text-sm font-semibold hover:border-blue transition-colors disabled:opacity-50">
                {testingSmtp ? (
                  <><span className="w-3.5 h-3.5 border-2 border-navy border-t-transparent rounded-full animate-spin inline-block" /> Probando...</>
                ) : (
                  <><span>⚡</span> Probar conexion</>
                )}
              </button>
              {smtpDirty && <span className="text-[12px] text-yellow-600 font-medium">· Cambios sin guardar</span>}
            </div>

            <p className="text-[11.5px] text-muted pt-1">
              "Probar conexion" verifica las credenciales y envia un correo de prueba a la direccion del usuario SMTP.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
