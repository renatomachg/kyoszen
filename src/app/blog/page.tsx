"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import PageHero from "@/components/ui/PageHero";
import { BLOG_POSTS } from "@/lib/blog";

interface Post {
  id?: number;
  slug: string;
  titulo: string;
  resumen: string;
  categoria: string;
  imagen_url: string | null;
  autor: string;
  fecha_publicacion: string;
}

// Fallback posts from local catalog
const FALLBACK_POSTS: Post[] = BLOG_POSTS.map((p) => ({
  slug: p.slug,
  titulo: p.titulo,
  resumen: p.intro,
  categoria: p.categoria.charAt(0) + p.categoria.slice(1).toLowerCase(),
  imagen_url: p.imagen,
  autor: "Equipo Kyoszen",
  fecha_publicacion: p.fecha, // keep as string, formatted for display
}));

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [catFilter, setCatFilter] = useState("Todas");

  useEffect(() => {
    supabase
      .from("blog_posts")
      .select("id,slug,titulo,resumen,categoria,imagen_url,autor,fecha_publicacion")
      .eq("publicado", true)
      .order("fecha_publicacion", { ascending: false })
      .then(({ data }) => {
        // If Supabase has posts, use them; otherwise show hardcoded fallback
        setPosts(data && data.length > 0 ? (data as Post[]) : FALLBACK_POSTS);
        setLoading(false);
      });
  }, []);

  const filtered = catFilter === "Todas"
    ? posts
    : posts.filter((p) => p.categoria === catFilter);

  // Only show categories that have posts
  const activeCats = ["Todas", ...Array.from(new Set(posts.map((p) => p.categoria)))];

  return (
    <>
      <PageHero
        title="Blog"
        description="Articulos, tendencias y recursos sobre recursos humanos, reclutamiento y capacitacion."
      />

      <section className="py-16 px-4 max-w-6xl mx-auto">
        {/* Category filter */}
        {!loading && posts.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-10">
            {activeCats.map((cat) => (
              <button
                key={cat}
                onClick={() => setCatFilter(cat)}
                className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                  catFilter === cat
                    ? "bg-navy text-white border-navy"
                    : "border-border text-muted hover:border-navy hover:text-navy bg-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-muted">
            {posts.length === 0
              ? "Proximamente publicaremos articulos de interes. Vuelve pronto."
              : "No hay articulos en esta categoria."}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="group">
                <article className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-md transition-shadow h-full flex flex-col">
                  {post.imagen_url ? (
                    <img
                      src={post.imagen_url}
                      alt={post.titulo}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-navy to-blue flex items-center justify-center">
                      <span className="text-white/20 text-6xl font-black select-none">K</span>
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-[11px] font-bold text-blue uppercase tracking-wide">
                        {post.categoria}
                      </span>
                      <span className="text-muted text-[11px]">·</span>
                      <span className="text-[11px] text-muted">
                        {(() => {
                          const d = new Date(post.fecha_publicacion);
                          return isNaN(d.getTime())
                            ? post.fecha_publicacion
                            : d.toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
                        })()}
                      </span>
                    </div>
                    <h2 className="text-[15px] font-black text-navy leading-snug mb-2 group-hover:text-blue transition-colors">
                      {post.titulo}
                    </h2>
                    <p className="text-[13px] text-muted leading-relaxed line-clamp-3 flex-1">
                      {post.resumen}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[12px] text-muted">{post.autor}</span>
                      <span className="text-[12px] font-bold text-blue group-hover:underline">
                        Leer mas →
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
