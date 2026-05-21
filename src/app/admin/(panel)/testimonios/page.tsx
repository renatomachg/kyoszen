"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Testimonio {
  id: number;
  nombre: string;
  cargo: string;
  empresa: string;
  texto: string;
  orden: number;
  activo: boolean;
  created_at: string;
}

const EMPTY = { nombre: "", cargo: "", empresa: "", texto: "", orden: 0, activo: true };
const field = "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue transition-colors bg-white";
const lbl = "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1";

export default function AdminTestimonios() {
  const [items, setItems] = useState<Testimonio[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Omit<Testimonio, "id" | "created_at">>(EMPTY);
  const [editId, setEditId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    const { data } = await supabase.from("testimonios").select("*").order("orden").order("created_at");
    setItems((data as Testimonio[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(EMPTY);
    setEditId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (t: Testimonio) => {
    setForm({ nombre: t.nombre, cargo: t.cargo, empresa: t.empresa, texto: t.texto, orden: t.orden, activo: t.activo });
    setEditId(t.id);
    setError("");
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.texto.trim()) { setError("Nombre y testimonio son requeridos."); return; }
    setSaving(true); setError("");
    const payload = { ...form, nombre: form.nombre.trim(), cargo: form.cargo.trim(), empresa: form.empresa.trim(), texto: form.texto.trim() };
    const { error: err } = editId
      ? await supabase.from("testimonios").update(payload).eq("id", editId)
      : await supabase.from("testimonios").insert(payload);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setShowForm(false);
    load();
  };

  const toggleActivo = async (id: number, activo: boolean) => {
    await supabase.from("testimonios").update({ activo: !activo }).eq("id", id);
    setItems((prev) => prev.map((t) => t.id === id ? { ...t, activo: !activo } : t));
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este testimonio?")) return;
    await supabase.from("testimonios").delete().eq("id", id);
    setItems((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">Testimonios</h1>
          <p className="text-[13px] text-muted">Gestion de testimonios que aparecen en la pagina de inicio.</p>
        </div>
        <button onClick={openNew} className="bg-navy text-white rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors">
          + Nuevo testimonio
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-[14px] font-black text-navy mb-4">{editId ? "Editar testimonio" : "Nuevo testimonio"}</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Nombre *</label>
                <input className={field} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} placeholder="Ana Martinez" />
              </div>
              <div>
                <label className={lbl}>Cargo</label>
                <input className={field} value={form.cargo} onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))} placeholder="Gerente RRHH" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lbl}>Empresa</label>
                <input className={field} value={form.empresa} onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))} placeholder="Logistica MX" />
              </div>
              <div>
                <label className={lbl}>Orden de aparicion</label>
                <input className={field} type="number" min={0} value={form.orden} onChange={(e) => setForm((f) => ({ ...f, orden: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <label className={lbl}>Testimonio *</label>
              <textarea className={field} rows={3} value={form.texto} onChange={(e) => setForm((f) => ({ ...f, texto: e.target.value }))} placeholder="Texto del testimonio..." />
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setForm((f) => ({ ...f, activo: !f.activo }))}
              className={`relative w-9 h-5 rounded-full transition-colors ${form.activo ? "bg-blue" : "bg-border"}`}>
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.activo ? "translate-x-4" : ""}`} />
              </button>
              <span className="text-sm text-navy font-semibold">{form.activo ? "Visible en el sitio" : "Oculto"}</span>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-60">
                {saving ? "Guardando..." : editId ? "Guardar cambios" : "Crear testimonio"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border rounded-xl px-6 py-2.5 text-sm font-semibold text-muted hover:text-navy transition-colors">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-muted text-sm">No hay testimonios aun. Crea el primero.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((t) => (
            <div key={t.id} className="bg-white border border-border rounded-2xl p-5 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-extrabold text-navy">{t.nombre}</span>
                  {t.cargo && <span className="text-[11px] text-muted">· {t.cargo}{t.empresa ? `, ${t.empresa}` : ""}</span>}
                  {!t.activo && <span className="text-[10px] bg-border text-muted px-2 py-0.5 rounded-full font-semibold">Oculto</span>}
                </div>
                <p className="text-[13px] text-muted leading-relaxed line-clamp-2">"{t.texto}"</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => toggleActivo(t.id, t.activo)}
                  className={`relative w-9 h-5 rounded-full transition-colors ${t.activo ? "bg-blue" : "bg-border"}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${t.activo ? "translate-x-4" : ""}`} />
                </button>
                <button onClick={() => openEdit(t)} className="text-[12px] text-navy font-semibold hover:text-blue transition-colors px-2 py-1">Editar</button>
                <button onClick={() => handleDelete(t.id)} className="text-[12px] text-muted hover:text-red-500 transition-colors px-2 py-1">Eliminar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
