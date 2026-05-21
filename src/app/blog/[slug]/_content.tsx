"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { marked } from "marked";
import { supabase } from "@/lib/supabase";
import { BLOG_POSTS } from "@/lib/blog";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

interface Post {
  slug: string;
  titulo: string;
  resumen: string;
  contenido: string;
  categoria: string;
  imagen_url: string | null;
  autor: string;
  fecha_publicacion: string;
}

function legacyToPost(p: (typeof BLOG_POSTS)[0]): Post {
  const contenido = [
    p.intro,
    ...p.secciones.map((s) => `## ${s.titulo}\n\n${s.contenido}`),
  ].join("\n\n");
  return {
    slug: p.slug,
    titulo: p.titulo,
    resumen: p.intro,
    contenido,
    categoria: p.categoria.charAt(0) + p.categoria.slice(1).toLowerCase(),
    imagen_url: p.imagen,
    autor: "Equipo Kyoszen",
    fecha_publicacion: p.fecha,
  };
}

export default function BlogPostContent({ slug }: { slug: string }) {
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fallback = () => {
      const legacy = BLOG_POSTS.find((p) => p.slug === slug);
      setPost(legacy ? legacyToPost(legacy) : null);
      setLoading(false);
    };

    supabase
      .from("blog_posts")
      .select("slug,titulo,resumen,contenido,categoria,imagen_url,autor,fecha_publicacion")
      .eq("slug", slug)
      .eq("publicado", true)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setPost(data as Post);
          setLoading(false);
        } else {
          fallback();
        }
      }, fallback);
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!post) return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <p className="text-2xl font-black text-navy mb-2">Articulo no encontrado</p>
      <p className="text-muted text-sm mb-6">El articulo que buscas no existe o fue eliminado.</p>
      <Link href="/blog" className="bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors">
        Ver todos los articulos
      </Link>
    </div>
  );

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://kyoszen.com/blog/${slug}`;
  const shareText = `${post.titulo} — Kyoszen`;
  const contentHtml = marked(post.contenido) as string;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fechaDisplay = (() => {
    const d = new Date(post.fecha_publicacion);
    return isNaN(d.getTime())
      ? post.fecha_publicacion
      : d.toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  })();

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-14 px-5 md:px-10 xl:px-20 overflow-hidden">
        {post.imagen_url ? (
          <>
            <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url('${post.imagen_url}')` }} />
            <div className="absolute inset-0 z-[1]" style={{ background: "linear-gradient(180deg, rgba(4,46,123,0.92) 0%, rgba(4,46,123,0.82) 100%)" }} />
          </>
        ) : (
          <div className="absolute inset-0 bg-navy z-0" />
        )}

        <div className="relative z-[2] max-w-3xl mx-auto">
          <Link href="/blog" className="text-white/60 text-[13px] font-semibold hover:text-yellow transition-colors inline-flex items-center gap-1.5 mb-6">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al blog
          </Link>

          <span className="inline-block bg-yellow text-navy text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded mb-4">
            {post.categoria}
          </span>
          <h1 className="text-[clamp(1.7rem,4vw,2.8rem)] font-black leading-[1.1] text-white mb-5">
            {post.titulo}
          </h1>
          <div className="flex items-center gap-4 text-[13px] text-white/60 flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {fechaDisplay}
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
              </svg>
              {post.autor}
            </span>
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 px-5 md:px-10 xl:px-20 bg-bg">
        <div className="max-w-3xl mx-auto">
          <p className="text-[17px] md:text-[19px] font-semibold text-navy leading-relaxed mb-10 border-l-4 border-yellow pl-5">
            {post.resumen}
          </p>

          <div className="prose-blog" dangerouslySetInnerHTML={{ __html: contentHtml }} />

          {/* Share */}
          <div className="border-t border-border pt-8 mt-12 mb-10">
            <p className="text-[12px] font-bold text-muted uppercase tracking-wide mb-3">Compartir articulo</p>
            <div className="flex gap-2 flex-wrap">
              <a href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-wa text-white rounded-full px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition-opacity">
                <WhatsAppIcon size={16} /> WhatsApp
              </a>
              <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0077B5] text-white rounded-full px-4 py-2.5 text-[12.5px] font-bold hover:opacity-90 transition-opacity">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                LinkedIn
              </a>
              <button onClick={copyLink}
                className="inline-flex items-center gap-2 bg-white border border-border text-navy rounded-full px-4 py-2.5 text-[12.5px] font-bold hover:bg-bg transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copied ? "Copiado" : "Copiar link"}
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-navy rounded-2xl p-8 md:p-10 text-center">
            <h3 className="text-[clamp(1.2rem,2.5vw,1.6rem)] font-black text-white leading-snug mb-3">
              ¿Listo para transformar tu area de RRHH?
            </h3>
            <p className="text-[14px] text-white/70 leading-relaxed mb-6 max-w-md mx-auto">
              Conoce nuestros servicios de reclutamiento, capacitacion e induccion. Agenda una llamada sin costo.
            </p>
            <Link href="/contacto" className="inline-block bg-yellow text-navy rounded-full py-3.5 px-8 text-[14px] font-extrabold hover:bg-yellow/90 transition-colors">
              Contactar ahora →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
