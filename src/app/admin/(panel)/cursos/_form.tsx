"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/courses";
import { logAdminClient } from "@/lib/admin-log-client";

const MODALIDADES = ["En vivo", "Online", "Hibrido"];
const NIVELES = ["Basico", "Intermedio", "Avanzado"];

function slugify(str: string) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim().replace(/\s+/g, "-");
}

interface CursoForm {
  id?: number;
  slug: string;
  titulo: string;
  categoria: string;
  categoria_label: string;
  modalidad: string;
  nivel: string;
  horas: number;
  descripcion_corta: string;
  badge: string;
  activo: boolean;
}

const EMPTY: CursoForm = {
  slug: "", titulo: "", categoria: CATEGORIES[0].id, categoria_label: CATEGORIES[0].label,
  modalidad: "En vivo", nivel: "Basico", horas: 8,
  descripcion_corta: "", badge: "", activo: true,
};

export default function CursoForm({ initial }: { initial?: Partial<CursoForm> }) {
  const router = useRouter();
  const [form, setForm] = useState<CursoForm>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseOpen, setParseOpen] = useState(!initial?.id);

  const isEdit = !!form.id;

  const parseWithAI = async () => {
    if (!rawText.trim()) return;
    setParsing(true);
    try {
      const res = await fetch("/api/admin/parse-curso", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: rawText }),
      });
      const data = await res.json();
      if (data.error) { setError("Error de IA: " + data.error); return; }
      setForm((prev) => ({
        ...prev,
        ...data,
        slug: data.titulo ? slugify(data.titulo) : prev.slug,
      }));
      setParseOpen(false);
    } catch {
      setError("Error al conectar con la IA");
    } finally {
      setParsing(false);
    }
  };

  function set<K extends keyof CursoForm>(key: K, value: CursoForm[K]) {
    setForm(f => {
      const next = { ...f, [key]: value };
      if (key === "titulo" && !isEdit) next.slug = slugify(String(value));
      if (key === "categoria") {
        const cat = CATEGORIES.find(c => c.id === value);
        if (cat) next.categoria_label = cat.label;
      }
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return setError("El titulo es obligatorio.");
    setSaving(true); setError("");

    const payload = {
      slug: form.slug || slugify(form.titulo),
      titulo: form.titulo.trim(),
      categoria: form.categoria,
      categoria_label: form.categoria_label,
      modalidad: form.modalidad,
      nivel: form.nivel,
      horas: form.horas,
      descripcion_corta: form.descripcion_corta.trim() || null,
      badge: form.badge.trim() || null,
      activo: form.activo,
    };

    const { error: err } = isEdit
      ? await supabase.from("cursos").update(payload).eq("id", form.id!)
      : await supabase.from("cursos").insert(payload);

    setSaving(false);
    if (err) return setError(err.message);
    logAdminClient(isEdit ? `Curso editado` : `Curso creado`, form.titulo);
    router.push("/admin/cursos");
    router.refresh();
  }

  const field = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white";
  const label = "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">

      {/* Panel IA */}
      <div className="bg-gradient-to-br from-blue/5 to-navy/5 border border-blue/20 rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={() => setParseOpen(!parseOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">✨</span>
            <div>
              <p className="text-[13px] font-black text-navy">Completar con IA</p>
              <p className="text-[11px] text-muted">Pega la informacion en bruto y la IA rellena el formulario</p>
            </div>
          </div>
          <span className="text-muted text-sm">{parseOpen ? "▲" : "▼"}</span>
        </button>
        {parseOpen && (
          <div className="px-5 pb-5 space-y-3">
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              placeholder={`Pega aqui cualquier informacion sobre el curso. Por ejemplo:\n\nCurso de Excel Avanzado para empresas. Aprende tablas dinamicas, macros y automatizacion. Dirigido a personal administrativo y contable. 16 horas, modalidad presencial. Incluye constancia DC-3...`}
              className="w-full border border-blue/20 rounded-xl px-4 py-3 text-[13px] text-navy bg-white focus:outline-none focus:border-blue transition-colors resize-none placeholder:text-muted/60"
            />
            <button
              type="button"
              onClick={parseWithAI}
              disabled={parsing || !rawText.trim()}
              className="flex items-center gap-2 bg-navy text-white rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-blue-dark transition-colors disabled:opacity-50 cursor-pointer"
            >
              {parsing ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" /> Interpretando...</>
              ) : (
                <><span>✨</span> Interpretar con IA</>
              )}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={label}>Titulo del curso *</label>
          <input className={field} value={form.titulo} onChange={e => set("titulo", e.target.value)} placeholder="Ej: Liderazgo y Gestion de Equipos" />
        </div>

        <div className="col-span-2">
          <label className={label}>Slug (URL)</label>
          <input className={field + " text-muted"} value={form.slug} onChange={e => set("slug", e.target.value)} placeholder="se-genera-automatico" />
          <p className="text-[11px] text-muted mt-1">Se genera automaticamente del titulo. No cambiar a menos que sea necesario.</p>
        </div>

        <div>
          <label className={label}>Area / Categoria *</label>
          <select className={field} value={form.categoria} onChange={e => set("categoria", e.target.value)}>
            {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className={label}>Modalidad *</label>
          <select className={field} value={form.modalidad} onChange={e => set("modalidad", e.target.value)}>
            {MODALIDADES.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className={label}>Nivel *</label>
          <select className={field} value={form.nivel} onChange={e => set("nivel", e.target.value)}>
            {NIVELES.map(n => <option key={n}>{n}</option>)}
          </select>
        </div>

        <div>
          <label className={label}>Duracion (horas) *</label>
          <input className={field} type="number" min={1} max={500} value={form.horas} onChange={e => set("horas", Number(e.target.value))} />
        </div>

        <div className="col-span-2">
          <label className={label}>Descripcion corta</label>
          <textarea className={field} rows={3} value={form.descripcion_corta} onChange={e => set("descripcion_corta", e.target.value)} placeholder="Breve descripcion del curso (aparece en el catalogo)" />
        </div>

        <div>
          <label className={label}>Badge / Etiqueta</label>
          <input className={field} value={form.badge} onChange={e => set("badge", e.target.value)} placeholder="Ej: Nuevo, DC-3, Popular" />
        </div>

        <div className="flex items-center gap-3 pt-5">
          <button
            type="button"
            onClick={() => set("activo", !form.activo)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? "bg-blue" : "bg-border"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? "translate-x-5" : ""}`} />
          </button>
          <span className="text-sm font-semibold text-navy">{form.activo ? "Visible en el sitio" : "Oculto"}</span>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-60">
          {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear curso"}
        </button>
        <button type="button" onClick={() => router.push("/admin/cursos")}
          className="border border-border rounded-xl px-6 py-2.5 text-sm font-semibold text-muted hover:text-navy transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}
