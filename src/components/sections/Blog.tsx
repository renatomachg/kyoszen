"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const posts = [
  {
    slug: "rotacion-de-personal-costo-oculto",
    img: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=600&auto=format&fit=crop&q=80",
    tag: "Retencion",
    title: "Rotacion de Personal: El Costo Oculto que Frena a Tu Empresa",
    excerpt: "Cada empleado que se va puede costarte hasta $200,000 pesos.",
    date: "Mar 28, 2026",
  },
  {
    slug: "tendencias-reclutamiento-2026",
    img: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&auto=format&fit=crop&q=80",
    tag: "Tendencias RH",
    title: "5 Tendencias de Reclutamiento que No Puedes Ignorar en 2026",
    excerpt: "El mercado laboral mexicano esta en plena transformacion.",
    date: "Abr 5, 2026",
  },
  {
    slug: "por-que-invertir-en-capacitacion",
    img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&auto=format&fit=crop&q=80",
    tag: "Capacitacion",
    title: "Por Que Invertir en Capacitacion es la Mejor Decision",
    excerpt: "Empresas que capacitan crecen 3x mas rapido. Aqui los datos.",
    date: "Abr 1, 2026",
  },
];

export default function Blog() {
  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-bg">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="flex justify-between items-end flex-wrap gap-4 mb-7">
            <div>
              <p className="text-[11px] font-bold text-blue uppercase tracking-[2px] mb-2 flex items-center gap-1.5 before:content-[''] before:w-3.5 before:h-0.5 before:bg-yellow before:rounded-sm">
                Blog y articulos
              </p>
              <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-black leading-[1.15] tracking-tight text-blue-dark">
                Recursos de
                <br />
                capital humano
              </h2>
            </div>
            <button className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold cursor-pointer no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark transition-colors">
              Ver todos →
            </button>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {posts.map((post, i) => (
            <motion.article
              key={post.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-white rounded-xl overflow-hidden border border-border transition-all duration-200 hover:shadow-xl hover:-translate-y-1 no-underline text-navy"
              >
                <img src={post.img} alt="" className="w-full h-[180px] object-cover" />
                <div className="p-5">
                  <span className="inline-block bg-blue-soft text-blue rounded-md py-0.5 px-2.5 text-[10px] font-bold uppercase mb-2">
                    {post.tag}
                  </span>
                  <h4 className="text-sm font-extrabold leading-snug mb-1.5">{post.title}</h4>
                  <p className="text-xs text-muted leading-relaxed">{post.excerpt}</p>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                    <span className="text-[11px] text-[#bbb]">{post.date}</span>
                    <span className="text-xs font-bold text-blue">Leer →</span>
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
