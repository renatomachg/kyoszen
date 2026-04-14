"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function CtaBand() {
  return (
    <section className="bg-blue py-11 sec-pad">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="sec-container flex items-center justify-between gap-6 flex-wrap"
      >
        <div className="flex items-center gap-6">
          <div className="text-[clamp(2rem,4vw,3rem)] font-black text-yellow leading-none">2.4M+</div>
          <div className="w-px h-[50px] bg-white/20 shrink-0" />
          <div>
            <div className="text-white text-[clamp(.95rem,2vw,1.1rem)] font-extrabold leading-tight">
              Horas de productividad recuperadas
              <br />
              para nuestros clientes
            </div>
            <div className="text-white/60 text-[12.5px] mt-1">
              Unete a las empresas que ya confian en Kyoszen
            </div>
          </div>
        </div>
        <Link
          href="/contacto"
          className="bg-yellow text-black border-none rounded-full py-3 px-7 text-[13.5px] font-extrabold cursor-pointer whitespace-nowrap no-underline inline-block hover:bg-[#e6b800] transition-colors"
        >
          Empezar ahora →
        </Link>
      </motion.div>
    </section>
  );
}
