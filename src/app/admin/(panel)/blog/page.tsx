"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { BLOG_POSTS } from "@/lib/blog";

interface Post {
  id: number;
  slug: string;
  titulo: string;
  categoria: string;
  autor: string;
  publicado: boolean;
  fecha_publicacion: string | null;
  created_at: string;
}

// Convert legacy secciones format → markdown
function seccionesToMarkdown(intro: string, secciones: { titulo: string; contenido: string }[]): string {
  const parts = [intro];
  for (const s of secciones) {
    parts.push(`## ${s.titulo}\n\n${s.contenido}`);
  }
  return parts.join("\n\n");
}

export default function AdminBlog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id,slug,titulo,categoria,autor,publicado,fecha_publicacion,created_at")
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const togglePublicado = async (id: number, publicado: boolean) => {
    await supabase.from("blog_posts").update({
      publicado: !publicado,
      fecha_publicacion: !publicado ? new Date().toISOString().slice(0, 10) : null,
    }).eq("id", id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, publicado: !publicado } : p));
  };

  const eliminar = async (id: number, titulo: string) => {
    if (!confirm(`¿Eliminar "${titulo}"? Esta accion no se puede deshacer.`)) return;
    await supabase.from("blog_posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const duplicar = async (id: number) => {
    const { data } = await supabase.from("blog_posts").select("*").eq("id", id).single();
    if (!data) return;
    const baseSlug = `${data.slug}-copia`;
    // Ensure unique slug
    const { data: existing } = await supabase.from("blog_posts").select("slug").like("slug", `${baseSlug}%`);
    const suffix = existing && existing.length > 0 ? `-${existing.length + 1}` : "";
    const { error } = await supabase.from("blog_posts").insert({
      ...data,
      id: undefined,
      slug: `${baseSlug}${suffix}`,
      titulo: `Copia de ${data.titulo}`,
      publicado: false,
      fecha_publicacion: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (!error) load();
  };

  const importarDesdeLocal = async () => {
    if (!confirm(`Importar los ${BLOG_POSTS.length} articulos del catalogo local a Supabase. ¿Continuar?`)) return;
    setImporting(true);
    // Map of slug → ISO date to avoid Date parsing issues with "28 Mar 2026" format
  const fechas: Record<string, string> = {
    "rotacion-de-personal-costo-oculto": "2026-03-28",
    "tendencias-reclutamiento-2026": "2026-04-05",
    "por-que-invertir-en-capacitacion": "2026-04-01",
  };

  const rows = BLOG_POSTS.map((p) => ({
    slug: p.slug,
    titulo: p.titulo,
    resumen: p.intro,
    contenido: seccionesToMarkdown(p.intro, p.secciones),
    categoria: p.categoria.charAt(0) + p.categoria.slice(1).toLowerCase(),
    imagen_url: p.imagen,
    autor: "Equipo Kyoszen",
    publicado: true,
    fecha_publicacion: fechas[p.slug] ?? "2026-04-01",
  }));
    const { error } = await supabase.from("blog_posts").upsert(rows, { onConflict: "slug" });
    setImporting(false);
    if (error) {
      alert(
        error.message.includes("does not exist")
          ? "La tabla blog_posts no existe en Supabase. Ejecuta el SQL de creacion de tabla primero (ve las instrucciones en el chat)."
          : "Error: " + error.message
      );
      return;
    }
    load();
  };

  const filtered = posts.filter((p) =>
    !search || p.titulo.toLowerCase().includes(search.toLowerCase())
  );

  const publicados = posts.filter((p) => p.publicado).length;
  const borradores = posts.length - publicados;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">Blog</h1>
          <p className="text-[13px] text-muted">
            {publicados} publicados · {borradores} borradores · {posts.length} total
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {posts.length === 0 && (
            <button
              onClick={importarDesdeLocal}
              disabled={importing}
              className="bg-yellow text-navy rounded-xl px-4 py-2.5 text-[13px] font-bold hover:bg-yellow/80 transition-colors disabled:opacity-60"
            >
              {importing ? "Importando..." : `⬇ Importar ${BLOG_POSTS.length} articulos del catalogo`}
            </button>
          )}
          <Link
            href="/admin/blog/nuevo"
            className="bg-navy text-white rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-blue-dark transition-colors"
          >
            + Nuevo articulo
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar articulo..."
          className="border border-border rounded-xl px-3.5 py-2 text-sm outline-none focus:border-blue transition-colors w-64"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted text-sm bg-white border border-border rounded-2xl">
          {posts.length === 0
            ? "No hay articulos en Supabase. Usa el boton de importar para cargar los articulos existentes."
            : "No se encontraron articulos con ese filtro."}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide">Articulo</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide hidden md:table-cell">Categoria</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide hidden lg:table-cell">Fecha</th>
                <th className="text-center px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide">Publicado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((post, i) => (
                <tr key={post.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-bg/40"}`}>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy text-[13px] leading-snug">{post.titulo}</p>
                    <p className="text-[11px] text-muted mt-0.5">{post.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-[12px] text-muted">{post.categoria}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-[12px] text-muted">
                      {post.fecha_publicacion
                        ? new Date(post.fecha_publicacion).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublicado(post.id, post.publicado)}
                      className={`relative w-9 h-5 rounded-full transition-colors ${post.publicado ? "bg-blue" : "bg-border"}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${post.publicado ? "translate-x-4" : ""}`} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end items-center">
                      {post.publicado && (
                        <Link href={`/blog/${post.slug}`} target="_blank" className="text-[12px] font-semibold text-muted hover:text-navy">
                          Ver
                        </Link>
                      )}
                      <button onClick={() => duplicar(post.id)} className="text-[12px] font-semibold text-muted hover:text-navy">
                        Duplicar
                      </button>
                      <Link href={`/admin/blog/${post.id}`} className="text-[12px] font-semibold text-blue hover:underline">
                        Editar
                      </Link>
                      <button onClick={() => eliminar(post.id, post.titulo)} className="text-[12px] font-semibold text-red-500 hover:underline">
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
