"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface ContentField {
  key: string;
  label: string;
  grupo: string;
  placeholder: string;
  multiline?: boolean;
  default: string;
}

const FIELDS: ContentField[] = [
  { key: "telefono",        label: "Telefono",          grupo: "Contacto",    placeholder: "+52 55 1234 5678", default: "+52 55 1234 5678" },
  { key: "whatsapp",        label: "WhatsApp (numero)",  grupo: "Contacto",    placeholder: "5215512345678", default: "5215512345678" },
  { key: "whatsapp_texto",  label: "Texto boton WhatsApp", grupo: "Contacto", placeholder: "Hablemos por WhatsApp", default: "Hablemos por WhatsApp" },
  { key: "hero_titulo",     label: "Titulo principal (Hero)", grupo: "Hero",  placeholder: "Transforma tu empresa con el talento correcto", default: "Transforma tu empresa con el", multiline: false },
  { key: "hero_subtitulo",  label: "Subtitulo (Hero)",   grupo: "Hero",        placeholder: "Reclutamiento, capacitacion e induccion...", default: "", multiline: true },
  { key: "hero_cta",        label: "Boton CTA principal", grupo: "Hero",       placeholder: "Ver vacantes", default: "Ver vacantes" },
  { key: "cta_empresa",     label: "CTA para empresas",  grupo: "Llamadas a la accion", placeholder: "Solicitar propuesta", default: "Solicitar propuesta" },
  { key: "cta_candidato",   label: "CTA para candidatos", grupo: "Llamadas a la accion", placeholder: "Ver vacantes disponibles", default: "Ver vacantes disponibles" },
];

const GROUPS = [...new Set(FIELDS.map((f) => f.grupo))];
const field = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white";
const lbl = "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

export default function AdminContenido() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.from("site_content").select("key, value").then(({ data }) => {
      const map: Record<string, string> = {};
      // Defaults primero
      FIELDS.forEach((f) => { map[f.key] = f.default; });
      // Valores de DB encima
      (data ?? []).forEach((r: { key: string; value: string }) => { map[r.key] = r.value; });
      setValues(map);
      setSaved({ ...map });
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError("");
    const rows = FIELDS.map((f) => ({
      key: f.key,
      value: values[f.key] ?? f.default,
      label: f.label,
      grupo: f.grupo,
      updated_at: new Date().toISOString(),
    }));
    const { error: err } = await supabase.from("site_content").upsert(rows, { onConflict: "key" });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved({ ...values });
    setOk(true);
    setTimeout(() => setOk(false), 3000);
  };

  const dirty = JSON.stringify(values) !== JSON.stringify(saved);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">Contenido del sitio</h1>
        <p className="text-[13px] text-muted">Edita textos, numeros de contacto y llamadas a la accion sin tocar codigo.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          {GROUPS.map((grupo) => (
            <div key={grupo} className="bg-white border border-border rounded-2xl p-6">
              <h2 className="text-[13px] font-black text-navy mb-4">{grupo}</h2>
              <div className="space-y-4">
                {FIELDS.filter((f) => f.grupo === grupo).map((f) => (
                  <div key={f.key}>
                    <label className={lbl}>{f.label}</label>
                    {f.multiline ? (
                      <textarea className={field} rows={3} value={values[f.key] ?? ""} placeholder={f.placeholder}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                    ) : (
                      <input className={field} value={values[f.key] ?? ""} placeholder={f.placeholder}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={saving || !dirty}
              className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-50">
              {saving ? "Guardando..." : ok ? "✓ Guardado" : "Guardar contenido"}
            </button>
            {dirty && <span className="text-[12px] text-yellow-600 font-medium">· Cambios sin guardar</span>}
          </div>

          <p className="text-[11.5px] text-muted">
            Los cambios se aplican en el sitio en tiempo real. Algunas secciones pueden tardar hasta 60 segundos en reflejar los cambios por el cache del servidor.
          </p>
        </form>
      )}
    </div>
  );
}
