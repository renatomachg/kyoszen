"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const PAGES = [
  { pagina: "home",      label: "Inicio",    ruta: "/" },
  { pagina: "vacantes",  label: "Vacantes",  ruta: "/vacantes" },
  { pagina: "cursos",    label: "Cursos",    ruta: "/cursos" },
  { pagina: "nosotros",  label: "Nosotros",  ruta: "/nosotros" },
  { pagina: "servicios", label: "Servicios", ruta: "/servicios" },
  { pagina: "contacto",  label: "Contacto",  ruta: "/contacto" },
  { pagina: "blog",      label: "Blog",      ruta: "/blog" },
];

interface SeoRow { pagina: string; titulo: string; descripcion: string; }

const field = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white";
const lbl = "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

export default function AdminSeo() {
  const [data, setData] = useState<Record<string, SeoRow>>({});
  const [saved, setSaved] = useState<Record<string, SeoRow>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [suggesting, setSuggesting] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from("seo_config").select("*").then(({ data: rows }) => {
      const map: Record<string, SeoRow> = {};
      (rows ?? []).forEach((r: SeoRow) => { map[r.pagina] = r; });
      setData(map);
      setSaved(JSON.parse(JSON.stringify(map)));
      setLoading(false);
    });
  }, []);

  const update = (pagina: string, field: "titulo" | "descripcion", value: string) => {
    setData((prev) => ({
      ...prev,
      [pagina]: {
        pagina,
        titulo: prev[pagina]?.titulo ?? "",
        descripcion: prev[pagina]?.descripcion ?? "",
        [field]: value,
      },
    }));
  };

  const suggest = async (pagina: string) => {
    setSuggesting(pagina);
    setErrors((e) => ({ ...e, [pagina]: "" }));
    try {
      const res = await fetch("/api/admin/seo-suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pagina }),
      });
      const result = await res.json();
      if (result.error) {
        setErrors((e) => ({ ...e, [pagina]: result.error }));
        return;
      }
      setData((prev) => ({
        ...prev,
        [pagina]: { pagina, titulo: result.titulo ?? "", descripcion: result.descripcion ?? "" },
      }));
    } catch {
      setErrors((e) => ({ ...e, [pagina]: "Error al conectar con la IA" }));
    } finally {
      setSuggesting(null);
    }
  };

  const save = async (pagina: string) => {
    setSaving(pagina);
    const row = data[pagina] ?? { pagina, titulo: "", descripcion: "" };
    const { error } = await supabase.from("seo_config").upsert(
      { pagina, titulo: row.titulo, descripcion: row.descripcion, updated_at: new Date().toISOString() },
      { onConflict: "pagina" }
    );
    setSaving(null);
    if (!error) {
      setSaved((prev) => ({ ...prev, [pagina]: { ...row } }));
      setOk(pagina);
      setTimeout(() => setOk(null), 2500);
    }
  };

  const isDirty = (pagina: string) =>
    JSON.stringify(data[pagina]) !== JSON.stringify(saved[pagina]);

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">SEO por pagina</h1>
        <p className="text-[13px] text-muted">
          Edita el titulo y descripcion que aparecen en Google. Usa ✨ para que la IA genere una propuesta optimizada.
        </p>
      </div>

      <div className="bg-blue/5 border border-blue/20 rounded-xl px-4 py-3 mb-6 text-[12.5px] text-navy leading-relaxed">
        <strong>Recomendaciones:</strong> Titulo: 50–60 caracteres · Descripcion: 140–160 caracteres · Incluye la keyword principal al inicio.
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {PAGES.map(({ pagina, label, ruta }) => {
            const row = data[pagina] ?? { pagina, titulo: "", descripcion: "" };
            const dirty = isDirty(pagina);
            const tLen = row.titulo?.length ?? 0;
            const dLen = row.descripcion?.length ?? 0;
            const isSuggesting = suggesting === pagina;

            return (
              <div key={pagina} className="bg-white border border-border rounded-2xl p-5">
                {/* Header */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[13px] font-black text-navy">{label}</span>
                  <span className="text-[11px] text-muted font-mono bg-bg border border-border px-2 py-0.5 rounded-lg">{ruta}</span>
                  <div className="ml-auto flex items-center gap-2">
                    {dirty && <span className="text-[10px] text-yellow-600 font-bold">· Sin guardar</span>}
                    <button
                      type="button"
                      onClick={() => suggest(pagina)}
                      disabled={isSuggesting}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue/10 to-navy/10 border border-blue/20 text-navy rounded-lg px-3 py-1.5 text-[12px] font-bold hover:border-blue transition-colors disabled:opacity-60"
                    >
                      {isSuggesting ? (
                        <>
                          <span className="w-3 h-3 border-2 border-navy border-t-transparent rounded-full animate-spin inline-block" />
                          Analizando...
                        </>
                      ) : (
                        <><span>✨</span> Sugerir con IA</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Error de IA */}
                {errors[pagina] && (
                  <p className="text-red-600 text-[12px] mb-3">{errors[pagina]}</p>
                )}

                <div className="space-y-3">
                  {/* Titulo */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={lbl}>Titulo</label>
                      <span className={`text-[10px] font-mono ${tLen > 60 ? "text-red-500" : tLen > 45 ? "text-yellow-600" : "text-muted"}`}>
                        {tLen}/60
                      </span>
                    </div>
                    <input
                      className={field}
                      value={row.titulo ?? ""}
                      maxLength={80}
                      onChange={(e) => update(pagina, "titulo", e.target.value)}
                      placeholder="Ej: Reclutamiento de Personal en CDMX | Kyoszen"
                    />
                  </div>

                  {/* Descripcion */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className={lbl}>Descripcion</label>
                      <span className={`text-[10px] font-mono ${dLen > 160 ? "text-red-500" : dLen > 130 ? "text-yellow-600" : "text-muted"}`}>
                        {dLen}/160
                      </span>
                    </div>
                    <textarea
                      className={field}
                      rows={2}
                      value={row.descripcion ?? ""}
                      maxLength={200}
                      onChange={(e) => update(pagina, "descripcion", e.target.value)}
                      placeholder="Describe esta pagina para buscadores..."
                    />
                  </div>

                  {/* Preview Google */}
                  {(row.titulo || row.descripcion) && (
                    <div className="bg-bg border border-border rounded-xl p-3.5">
                      <p className="text-[10px] font-bold text-muted uppercase tracking-wide mb-2">Preview en Google</p>
                      <p className="text-[14px] text-blue font-medium leading-snug truncate">
                        {row.titulo || "Sin titulo"}
                      </p>
                      <p className="text-[11.5px] text-green-700 font-mono mb-0.5">kyoszen.com{ruta === "/" ? "" : ruta}</p>
                      <p className="text-[12.5px] text-[#4D5156] leading-relaxed line-clamp-2">
                        {row.descripcion || "Sin descripcion"}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <button
                      onClick={() => save(pagina)}
                      disabled={saving === pagina || !dirty}
                      className="bg-navy text-white rounded-xl px-5 py-2 text-[13px] font-bold hover:bg-blue-dark transition-colors disabled:opacity-50"
                    >
                      {saving === pagina ? "Guardando..." : ok === pagina ? "✓ Guardado" : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
