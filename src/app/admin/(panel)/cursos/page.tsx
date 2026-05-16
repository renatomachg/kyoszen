"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { COURSES, CATEGORIES } from "@/lib/courses";

interface Curso {
  id: number;
  slug: string;
  titulo: string;
  categoria: string;
  categoria_label: string;
  modalidad: string;
  nivel: string;
  horas: number;
  activo: boolean;
  created_at: string;
}

export default function AdminCursos() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Todas");

  const load = async () => {
    const { data } = await supabase
      .from("cursos")
      .select("id,slug,titulo,categoria,categoria_label,modalidad,nivel,horas,activo,created_at")
      .order("categoria").order("titulo");
    setCursos((data as Curso[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActivo = async (id: number, activo: boolean) => {
    await supabase.from("cursos").update({ activo: !activo }).eq("id", id);
    setCursos(prev => prev.map(c => c.id === id ? { ...c, activo: !activo } : c));
  };

  const eliminar = async (id: number, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"?`)) return;
    await supabase.from("cursos").delete().eq("id", id);
    setCursos(prev => prev.filter(c => c.id !== id));
  };

  const importarDesdeCatalogo = async () => {
    if (!confirm(`Esto importara ${COURSES.length} cursos del catalogo local a Supabase. ¿Continuar?`)) return;
    setImporting(true);
    const rows = COURSES.map(c => ({
      slug: c.slug,
      titulo: c.titulo,
      categoria: c.categoria,
      categoria_label: c.categoriaLabel,
      modalidad: c.modalidad,
      nivel: c.nivel,
      horas: c.horas,
      descripcion_corta: c.descripcionCorta ?? null,
      badge: c.badge ?? null,
      activo: true,
    }));
    const { error } = await supabase.from("cursos").upsert(rows, { onConflict: "slug" });
    setImporting(false);
    if (error) { alert("Error: " + error.message); return; }
    load();
  };

  const filtered = cursos.filter(c => {
    const matchCat = catFilter === "Todas" || c.categoria === catFilter;
    const matchSearch = !search || c.titulo.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">Cursos</h1>
          <p className="text-[13px] text-muted">
            {cursos.filter(c => c.activo).length} activos · {cursos.length} total
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {cursos.length === 0 && (
            <button onClick={importarDesdeCatalogo} disabled={importing}
              className="bg-yellow text-navy rounded-xl px-4 py-2.5 text-[13px] font-bold hover:bg-yellow/80 transition-colors disabled:opacity-60">
              {importing ? "Importando..." : `⬇ Importar ${COURSES.length} cursos del catalogo`}
            </button>
          )}
          <Link href="/admin/cursos/nuevo"
            className="bg-navy text-white rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-blue-dark transition-colors">
            + Nuevo curso
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar curso..."
          className="border border-border rounded-xl px-3.5 py-2 text-sm outline-none focus:border-blue transition-colors w-56"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="border border-border rounded-xl px-3.5 py-2 text-sm outline-none focus:border-blue transition-colors"
        >
          <option value="Todas">Todas las areas</option>
          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted text-sm">
          {cursos.length === 0
            ? "No hay cursos en Supabase. Usa el boton de importar para cargar el catalogo."
            : "No se encontraron cursos con ese filtro."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide">Curso</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide hidden md:table-cell">Area</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide hidden lg:table-cell">Modalidad</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide hidden lg:table-cell">Horas</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide">Visible</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((curso, i) => (
                <tr key={curso.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-bg/40"}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy text-[13px] leading-snug">{curso.titulo}</p>
                    <p className="text-[11px] text-muted mt-0.5">{curso.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-muted">{curso.categoria_label}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[12px] text-muted">{curso.modalidad}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[12px] text-muted">{curso.horas}h</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => toggleActivo(curso.id, curso.activo)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${curso.activo ? "bg-blue" : "bg-border"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${curso.activo ? "translate-x-4" : ""}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Link href={`/admin/cursos/${curso.id}`}
                        className="text-[12px] font-semibold text-blue hover:underline">
                        Editar
                      </Link>
                      <button onClick={() => eliminar(curso.id, curso.titulo)}
                        className="text-[12px] font-semibold text-red-500 hover:underline">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
