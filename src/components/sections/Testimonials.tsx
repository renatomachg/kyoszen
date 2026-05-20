"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { supabase } from "@/lib/supabase";

interface Testimonio {
  id: number;
  nombre: string;
  cargo: string;
  empresa: string;
  texto: string;
  orden: number;
}

const FALLBACK: Testimonio[] = [
  { id: 1, nombre: "Ana Martinez", cargo: "Gerente RRHH", empresa: "Logistica MX", texto: "Kyoszen cubrio nuestra vacante en menos de una semana. Los candidatos llegaron con documentacion lista y perfectamente alineados al perfil.", orden: 0 },
  { id: 2, nombre: "Carlos Reyes", cargo: "Director General", empresa: "ServiPro", texto: "Proceso agil y transparente. Nos ahorraron semanas de trabajo. Los volveria a contratar sin dudarlo para cualquier proceso de seleccion.", orden: 1 },
  { id: 3, nombre: "Laura Sanchez", cargo: "Candidata colocada", empresa: "CDMX", texto: "Encontre trabajo en 3 dias. Me orientaron en todo y me ayudaron a preparar mi documentacion. ¡Totalmente recomendados!", orden: 2 },
];

export default function Testimonials() {
  const [items, setItems] = useState<Testimonio[]>(FALLBACK);

  useEffect(() => {
    supabase
      .from("testimonios")
      .select("id, nombre, cargo, empresa, texto, orden")
      .eq("activo", true)
      .order("orden")
      .then(({ data }) => {
        if (data && data.length > 0) setItems(data as Testimonio[]);
      });
  }, []);

  return (
    <section className="py-20 px-5 md:px-10 xl:px-20 bg-blue-dark relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <AnimatedSection>
          <div className="mb-10">
            <span className="inline-block bg-yellow text-black text-[11px] font-extrabold py-1.5 px-4 rounded-full uppercase tracking-wider mb-4">
              Testimonios
            </span>
            <h2 className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.1] tracking-tight text-white">
              Lo que dicen
              <br />
              nuestros clientes
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {items.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-[#F8FAFC] rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="flex gap-0.5 mb-3">
                {[...Array(5)].map((_, j) => (<span key={j} className="text-yellow text-sm">★</span>))}
              </div>
              <p className="text-[13px] text-[#4B5563] leading-relaxed mb-6">{t.texto}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <div className="w-10 h-10 rounded-full bg-navy/10 flex items-center justify-center text-navy font-black text-sm shrink-0">
                  {t.nombre.charAt(0)}
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-navy">{t.nombre}</div>
                  <div className="text-[11px] text-muted">{t.cargo}{t.empresa ? ` · ${t.empresa}` : ""}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
