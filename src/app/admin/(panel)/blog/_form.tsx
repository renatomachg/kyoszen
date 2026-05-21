"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import { supabase } from "@/lib/supabase";

const CATEGORIAS = ["General", "RRHH", "Reclutamiento", "Capacitacion", "Liderazgo", "Tecnologia", "Noticias"];

/* ── Curated Unsplash images per category ── */
const UNSPLASH_BASE = "https://images.unsplash.com";
const IMG: Record<string, { id: string; alt: string }[]> = {
  General: [
    { id: "photo-1486312338219-ce68d2c6f44d", alt: "Laptop trabajo" },
    { id: "photo-1504384308090-c894fdcc538d", alt: "Oficina aerea" },
    { id: "photo-1568992687947-868a62a9f521", alt: "Profesional negocios" },
    { id: "photo-1600880292203-757bb62b4baf", alt: "Trabajo remoto" },
    { id: "photo-1559136555-9303baea8ebd", alt: "Equipo oficina" },
    { id: "photo-1553877522-43269d4ea984", alt: "Reunion negocios" },
  ],
  RRHH: [
    { id: "photo-1521791136064-7986c2920216", alt: "Reunion equipo RRHH" },
    { id: "photo-1507003211169-0a1dd7228f2d", alt: "Profesional RRHH" },
    { id: "photo-1454165804606-c3d57bc86b40", alt: "Documentos RRHH" },
    { id: "photo-1573496799652-408c2ac9fe98", alt: "Entrevista RRHH" },
    { id: "photo-1551836022-deb4988cc6c0", alt: "Mesa RRHH" },
    { id: "photo-1565688534245-05d6b5be184a", alt: "Proceso seleccion" },
  ],
  Reclutamiento: [
    { id: "photo-1552664730-d307ca884978", alt: "Reclutamiento" },
    { id: "photo-1573496799652-408c2ac9fe98", alt: "Entrevista candidato" },
    { id: "photo-1565688534245-05d6b5be184a", alt: "Entrevista laboral" },
    { id: "photo-1551836022-deb4988cc6c0", alt: "Seleccion personal" },
    { id: "photo-1507003211169-0a1dd7228f2d", alt: "Candidato" },
    { id: "photo-1521791136064-7986c2920216", alt: "Equipo reclutamiento" },
  ],
  Capacitacion: [
    { id: "photo-1524178232363-1fb2b075b655", alt: "Capacitacion empresarial" },
    { id: "photo-1434030216411-0b793f4b6374", alt: "Aprendizaje" },
    { id: "photo-1513475382585-d06e58bcb0e0", alt: "Taller formacion" },
    { id: "photo-1488190211105-8b0e65b80b4e", alt: "Estudio cursos" },
    { id: "photo-1509062522246-3755977927d7", alt: "Salon capacitacion" },
    { id: "photo-1580582932707-520aed937b7b", alt: "Presentacion capacitacion" },
  ],
  Liderazgo: [
    { id: "photo-1519389950473-47ba0277781c", alt: "Trabajo en equipo" },
    { id: "photo-1542744173-8e7e53415bb0", alt: "Reunion liderazgo" },
    { id: "photo-1517245386807-bb43f82c33c4", alt: "Discusion liderazgo" },
    { id: "photo-1532619675605-1ede6c2ed2b0", alt: "Lider equipo" },
    { id: "photo-1600880292203-757bb62b4baf", alt: "Estrategia" },
    { id: "photo-1553877522-43269d4ea984", alt: "Direccion empresarial" },
  ],
  Tecnologia: [
    { id: "photo-1518770660439-4636190af475", alt: "Tecnologia circuito" },
    { id: "photo-1550751827-4bd374c3f58b", alt: "Ciberseguridad" },
    { id: "photo-1504384308090-c894fdcc538d", alt: "Oficina tech" },
    { id: "photo-1486312338219-ce68d2c6f44d", alt: "Laptop desarrollo" },
    { id: "photo-1555949963-aa79dcee981c", alt: "Programacion" },
    { id: "photo-1531297484001-80022131f5a1", alt: "Digital trabajo" },
  ],
  Noticias: [
    { id: "photo-1504711434969-e33886168f5c", alt: "Noticias periodico" },
    { id: "photo-1504384308090-c894fdcc538d", alt: "Oficina noticias" },
    { id: "photo-1486312338219-ce68d2c6f44d", alt: "Noticias digital" },
    { id: "photo-1553877522-43269d4ea984", alt: "Reunion noticias" },
    { id: "photo-1568992687947-868a62a9f521", alt: "Negocios noticias" },
    { id: "photo-1600880292203-757bb62b4baf", alt: "Tendencias" },
  ],
};

function getImages(categoria: string) {
  return IMG[categoria] ?? IMG.General;
}

function unsplashUrl(id: string, w = 600) {
  return `${UNSPLASH_BASE}/${id}?w=${w}&auto=format&fit=crop&q=80`;
}

function unsplashFull(id: string) {
  return `${UNSPLASH_BASE}/${id}?w=1200&auto=format&fit=crop&q=80`;
}

/* ── Types ── */
interface BlogFormData {
  id?: number;
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: string;
  imagen_url: string;
  autor: string;
  publicado: boolean;
  fecha_publicacion: string;
}

const EMPTY: BlogFormData = {
  slug: "",
  titulo: "",
  resumen: "",
  contenido: "",
  categoria: "General",
  imagen_url: "",
  autor: "Equipo Kyoszen",
  publicado: false,
  fecha_publicacion: new Date().toISOString().slice(0, 10),
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 80);
}

const field = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white";
const lbl = "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

export default function BlogForm({ initial }: { initial?: BlogFormData }) {
  const router = useRouter();
  const isEditing = !!initial?.id;

  const [form, setForm] = useState<BlogFormData>(initial ?? EMPTY);
  const [slugManual, setSlugManual] = useState(isEditing);
  const [preview, setPreview] = useState(false);
  const [showImgPicker, setShowImgPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleTitulo(v: string) {
    setForm((f) => ({
      ...f,
      titulo: v,
      slug: slugManual ? f.slug : slugify(v),
    }));
  }

  function selectImage(id: string) {
    setForm((f) => ({ ...f, imagen_url: unsplashFull(id) }));
    setShowImgPicker(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return setError("El titulo es obligatorio.");
    if (!form.slug.trim()) return setError("El slug es obligatorio.");
    if (!form.resumen.trim()) return setError("El resumen es obligatorio.");
    if (!form.contenido.trim()) return setError("El contenido es obligatorio.");

    setSaving(true);
    setError("");

    const payload = {
      slug: form.slug.trim(),
      titulo: form.titulo.trim(),
      resumen: form.resumen.trim(),
      contenido: form.contenido.trim(),
      categoria: form.categoria,
      imagen_url: form.imagen_url.trim() || null,
      autor: form.autor.trim() || "Equipo Kyoszen",
      publicado: form.publicado,
      fecha_publicacion: form.publicado ? (form.fecha_publicacion || new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString(),
    };

    const { error: err } = isEditing
      ? await supabase.from("blog_posts").update(payload).eq("id", initial!.id!)
      : await supabase.from("blog_posts").insert(payload);

    setSaving(false);
    if (err) return setError(err.message);
    router.push("/admin/blog");
  }

  const previewHtml = marked(form.contenido || "_Sin contenido aun._") as string;
  const suggestions = getImages(form.categoria);

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl">

      {/* Metadata */}
      <div className="bg-white border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-[14px] font-black text-navy">Informacion del articulo</h2>

        <div>
          <label className={lbl}>Titulo *</label>
          <input className={field} value={form.titulo} onChange={(e) => handleTitulo(e.target.value)}
            placeholder="Como mejorar la retencion de talento en tu empresa" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Slug (URL) *</label>
            <input className={field} value={form.slug}
              onChange={(e) => { setSlugManual(true); setForm((f) => ({ ...f, slug: slugify(e.target.value) })); }}
              placeholder="como-mejorar-retencion-talento" />
            <p className="text-[11px] text-muted mt-1">kyoszen.com/blog/{form.slug || "slug"}</p>
          </div>
          <div>
            <label className={lbl}>Categoria</label>
            <select className={field} value={form.categoria}
              onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className={lbl}>Resumen *</label>
          <textarea className={field} rows={2} value={form.resumen}
            onChange={(e) => setForm((f) => ({ ...f, resumen: e.target.value }))}
            placeholder="Breve descripcion que aparece en la lista del blog (2-3 oraciones)..." />
        </div>

        {/* Image field + picker */}
        <div>
          <label className={lbl}>Imagen de portada</label>
          <div className="flex gap-2">
            <input className={field} value={form.imagen_url}
              onChange={(e) => setForm((f) => ({ ...f, imagen_url: e.target.value }))}
              placeholder="https://images.unsplash.com/..." />
            <button type="button" onClick={() => setShowImgPicker((v) => !v)}
              className="shrink-0 border border-border rounded-xl px-4 py-2.5 text-[12.5px] font-bold text-navy hover:bg-bg transition-colors whitespace-nowrap">
              {showImgPicker ? "Cerrar" : "✦ Sugerir"}
            </button>
          </div>

          {/* Current image preview */}
          {form.imagen_url && !showImgPicker && (
            <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-border">
              <img src={form.imagen_url} alt="Portada" className="w-full h-full object-cover" />
              <button type="button" onClick={() => setForm((f) => ({ ...f, imagen_url: "" }))}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-lg px-2 py-1 text-[11px] font-bold hover:bg-black/80">
                Quitar
              </button>
            </div>
          )}

          {/* Image picker panel */}
          {showImgPicker && (
            <div className="mt-3 bg-bg border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-[12px] font-bold text-navy">
                  Imagenes sugeridas — {form.categoria}
                </p>
                <a href={`https://unsplash.com/s/photos/${encodeURIComponent(form.categoria + " recursos humanos oficina")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-[11.5px] font-semibold text-blue hover:underline">
                  Buscar mas en Unsplash →
                </a>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {suggestions.map((img) => (
                  <button key={img.id} type="button" onClick={() => selectImage(img.id)}
                    className="relative group rounded-xl overflow-hidden border-2 border-transparent hover:border-blue transition-all aspect-video">
                    <img src={unsplashUrl(img.id, 400)} alt={img.alt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-navy/0 group-hover:bg-navy/30 transition-colors flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-navy/70 px-2 py-1 rounded">
                        Usar esta
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-3">
                Imagenes de <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a> — uso libre. Haz clic en una para usarla como portada.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Autor</label>
            <input className={field} value={form.autor}
              onChange={(e) => setForm((f) => ({ ...f, autor: e.target.value }))}
              placeholder="Equipo Kyoszen" />
          </div>
          <div className="flex items-center gap-6 pt-5">
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm((f) => ({ ...f, publicado: !f.publicado }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.publicado ? "bg-blue" : "bg-border"}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.publicado ? "translate-x-5" : ""}`} />
              </button>
              <span className="text-sm font-semibold text-navy">{form.publicado ? "Publicado" : "Borrador"}</span>
            </div>
          </div>
        </div>

        {form.publicado && (
          <div>
            <label className={lbl}>Fecha de publicacion</label>
            <input className="border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-blue"
              type="date" value={form.fecha_publicacion}
              onChange={(e) => setForm((f) => ({ ...f, fecha_publicacion: e.target.value }))} />
          </div>
        )}
      </div>

      {/* Content editor */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <h2 className="text-[14px] font-black text-navy">Contenido</h2>
          <div className="flex gap-1 bg-bg border border-border rounded-lg p-0.5">
            <button type="button" onClick={() => setPreview(false)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${!preview ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy"}`}>
              Editar
            </button>
            <button type="button" onClick={() => setPreview(true)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${preview ? "bg-white text-navy shadow-sm" : "text-muted hover:text-navy"}`}>
              Vista previa
            </button>
          </div>
        </div>

        {!preview ? (
          <div className="p-4">
            <p className="text-[11.5px] text-muted mb-2">
              Usa Markdown: **negrita**, *italica*, # Titulo, ## Subtitulo, - listas, [texto](url)
            </p>
            <textarea
              className="w-full border border-border rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-blue transition-colors bg-white leading-relaxed"
              rows={20} value={form.contenido}
              onChange={(e) => setForm((f) => ({ ...f, contenido: e.target.value }))}
              placeholder={`# Titulo del articulo\n\nEscribe el contenido aqui...\n\n## Subtitulo\n\nParrafo de contenido...\n\n- Punto 1\n- Punto 2`}
            />
          </div>
        ) : (
          <div className="prose-blog p-8 min-h-64" dangerouslySetInnerHTML={{ __html: previewHtml }} />
        )}
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-60">
          {saving ? "Guardando..." : isEditing ? "Guardar cambios" : form.publicado ? "Publicar articulo" : "Guardar borrador"}
        </button>
        <button type="button" onClick={() => router.push("/admin/blog")}
          className="border border-border rounded-xl px-6 py-2.5 text-sm font-semibold text-muted hover:text-navy transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  );
}
