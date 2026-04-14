"use client";

import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";

const posts = [
  {
    img: "https://picsum.photos/seed/blog-1/600/220",
    tag: "Retencion",
    title: "Rotacion de Personal: El Costo Oculto que Frena a Tu Empresa",
    excerpt: "Cada empleado que se va puede costarte hasta $200,000 pesos.",
    date: "Mar 28, 2026",
  },
  {
    img: "https://picsum.photos/seed/blog-2/600/220",
    tag: "Tendencias RH",
    title: "5 Tendencias de Reclutamiento que No Puedes Ignorar en 2026",
    excerpt: "El mercado laboral mexicano esta en plena transformacion.",
    date: "Abr 5, 2026",
  },
  {
    img: "https://picsum.photos/seed/blog-3/600/220",
    tag: "Capacitacion",
    title: "Por Que Invertir en Capacitacion es la Mejor Decision",
    excerpt: "Empresas que capacitan crecen 3x mas rapido. Aqui los datos.",
    date: "Abr 1, 2026",
  },
];

export default function Blog() {
  return (
    <section className="py-20 px-[5%] bg-bg">
      <div className="max-w-[1200px] mx-auto">
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
              key={post.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white rounded-xl overflow-hidden border border-border transition-all duration-200 hover:shadow-[0_8px_28px_rgba(0,0,0,.07)] hover:-translate-y-[3px] cursor-pointer"
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
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
