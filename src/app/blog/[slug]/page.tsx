"use client";

import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import { getBlogBySlug } from "@/lib/blog";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";

export default function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const post = getBlogBySlug(slug);
  const [copied, setCopied] = useState(false);

  if (!post) {
    notFound();
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${post.titulo} — Kyoszen Blog`;

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-14 px-5 md:px-10 xl:px-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{ backgroundImage: `url('${post.imagen}')` }}
        />
        <div
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,3,61,0.92) 0%, rgba(0,3,61,0.80) 50%, rgba(0,3,61,0.65) 100%)",
          }}
        />

        <div className="relative z-[2] max-w-3xl mx-auto">
          <Link
            href="/"
            className="text-white/60 text-[13px] font-semibold hover:text-yellow transition-colors inline-flex items-center gap-1.5 mb-6"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Volver al inicio
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block bg-yellow text-navy text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded mb-4">
              {post.categoria}
            </span>
            <h1 className="text-[clamp(1.7rem,4vw,2.8rem)] font-black leading-[1.1] text-white mb-5">
              {post.titulo}
            </h1>
            <div className="flex items-center gap-4 text-[13px] text-white/60">
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                {post.fecha}
              </span>
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                {post.lectura} de lectura
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Body */}
      <section className="py-12 px-5 md:px-10 xl:px-20 bg-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-3xl mx-auto"
        >
          {/* Cover image */}
          <div className="rounded-2xl overflow-hidden mb-10 shadow-lg">
            <img
              src={post.imagen}
              alt={post.titulo}
              className="w-full h-[240px] md:h-[380px] object-cover"
            />
          </div>

          {/* Intro */}
          <p className="text-[17px] md:text-[19px] font-semibold text-navy leading-relaxed mb-10 border-l-4 border-yellow pl-5">
            {post.intro}
          </p>

          {/* Sections */}
          {post.secciones.map((sec, i) => (
            <div key={i} className="mb-10">
              <h2 className="text-[clamp(1.1rem,2.5vw,1.5rem)] font-extrabold text-navy mb-4 leading-snug">
                {sec.titulo}
              </h2>
              <div className="text-[15px] text-muted leading-[1.8] whitespace-pre-line">
                {sec.contenido}
              </div>
            </div>
          ))}

          {/* Share buttons */}
          <div className="border-t border-border pt-8 mb-10">
            <p className="text-[12px] font-bold text-muted uppercase tracking-wide mb-3">Compartir articulo</p>
            <div className="flex gap-2 flex-wrap">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText + " " + shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-wa text-white rounded-full px-4 py-2.5 text-[12.5px] font-bold no-underline hover:opacity-90 transition-opacity"
              >
                <WhatsAppIcon size={16} />
                WhatsApp
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#0077B5] text-white rounded-full px-4 py-2.5 text-[12.5px] font-bold no-underline hover:opacity-90 transition-opacity"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                LinkedIn
              </a>
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 bg-white border border-border text-navy rounded-full px-4 py-2.5 text-[12.5px] font-bold hover:bg-bg transition-colors cursor-pointer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                {copied ? "Copiado" : "Copiar link"}
              </button>
            </div>
          </div>

          {/* CTA */}
          <div className="bg-navy rounded-2xl p-8 md:p-10 text-center">
            <h3 className="text-[clamp(1.2rem,2.5vw,1.6rem)] font-black text-white leading-snug mb-3">
              ¿Quieres reducir la rotacion en tu empresa?
            </h3>
            <p className="text-[14px] text-white/70 leading-relaxed mb-6 max-w-md mx-auto">
              {post.cta.texto}
            </p>
            <Link
              href={post.cta.href}
              className="inline-block bg-yellow text-navy rounded-full py-3.5 px-8 text-[14px] font-extrabold no-underline hover:bg-[#e6b800] transition-colors"
            >
              {post.cta.boton} →
            </Link>
          </div>
        </motion.div>
      </section>
    </>
  );
}
