"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const words = ["talento correcto", "equipo ideal", "personal indicado"];

export default function Hero() {
  const [typed, setTyped] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = words[wordIndex];
    const typeSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && typed === currentWord) {
      const timeout = setTimeout(() => setIsDeleting(true), 4000);
      return () => clearTimeout(timeout);
    }

    if (isDeleting && typed === "") {
      setIsDeleting(false);
      setWordIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setTyped(
        isDeleting
          ? currentWord.slice(0, typed.length - 1)
          : currentWord.slice(0, typed.length + 1)
      );
    }, typeSpeed);

    return () => clearTimeout(timeout);
  }, [typed, isDeleting, wordIndex]);

  return (
    <section className="bg-navy pt-32 pb-12 px-[5%] overflow-hidden relative">
      {/* Decorative circles */}
      <div className="absolute w-[500px] h-[500px] bg-white/[.04] rounded-full -top-[200px] -right-[100px] pointer-events-none z-0" />
      <div className="absolute w-[250px] h-[250px] bg-blue/[.12] rounded-full bottom-0 left-[5%] pointer-events-none z-0" />

      <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-[1]">
        {/* Left */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <h1 className="text-[clamp(2rem,4.5vw,3.2rem)] font-black leading-[1.08] tracking-tight text-white mb-4">
            Transforma tu empresa
            <br />
            con el{" "}
            <span className="text-yellow font-black">{typed}</span>
            <span className="inline-block w-[3px] h-[0.85em] bg-yellow ml-[3px] align-baseline animate-[cursorBlink_.7s_step-end_infinite]" />
          </h1>
          <p className="text-[14.5px] text-white/65 leading-relaxed max-w-[460px] mb-7">
            Conectamos personas que buscan empleo con empresas que necesitan
            talento. Reclutamiento agil, candidatos verificados, resultados
            reales.
          </p>

          {/* Search bar */}
          <div className="flex gap-2 max-w-[460px] mb-8 bg-white/10 border-[1.5px] border-white/20 rounded-full py-[5px] pr-[5px] pl-5 items-center">
            <input
              placeholder="¿Que puesto buscas?"
              className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#bbb] font-[inherit]"
            />
            <Link
              href="/vacantes"
              className="bg-blue-btn text-white border-none rounded-full py-3 px-7 text-[13px] font-bold cursor-pointer transition-colors duration-150 no-underline inline-flex items-center gap-1.5 hover:bg-blue-dark"
            >
              Buscar →
            </Link>
          </div>

          {/* Trust */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex">
              {[1, 2, 3, 4].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/56?img=${i}`}
                  alt=""
                  className="w-[30px] h-[30px] rounded-full border-2 border-white object-cover -ml-2 first:ml-0 bg-blue-soft"
                />
              ))}
            </div>
            <span className="text-[12.5px] text-white/65">
              <strong>+687</strong> candidatos colocados este año
            </span>
          </div>
        </motion.div>

        {/* Right - Photo collage */}
        <div className="relative flex justify-center items-end min-h-[420px] lg:min-h-[480px] py-8">
          {/* Float card top right */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute top-8 right-0 bg-white rounded-xl py-3 px-4 shadow-[0_4px_20px_rgba(0,0,0,.1)] border border-border min-w-[120px] max-w-[160px] z-[2]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-yellow-soft shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
              </div>
              <div>
                <div className="text-[17px] font-black text-navy leading-none">672+</div>
                <div className="text-[10px] text-muted mt-0.5">Empresas</div>
              </div>
            </div>
          </motion.div>

          {/* Photo collage */}
          <div className="relative w-full max-w-[440px] h-[420px] lg:h-[480px] mx-auto">
            {/* Deco icon */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.7 }}
              className="absolute -top-[18px] right-[28%] z-[3] w-14 h-14 bg-white/[.12] backdrop-blur-[8px] rounded-[14px] flex items-center justify-center border border-white/[.18]"
            >
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
            </motion.div>

            {/* Photo 1 */}
            <div className="absolute w-[48%] h-[58%] top-0 left-0 z-[1] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,.3)] border-[3px] border-white/[.12] animate-[heroSlideIn1_.9s_cubic-bezier(.22,1,.36,1)_both] [animation-delay:.3s]">
              <Image src="/images/Hero2.jpg" alt="Trabajo operativo Kyoszen" fill className="object-cover" />
            </div>

            {/* Photo 2 */}
            <div className="absolute w-[58%] h-[72%] bottom-0 right-0 z-[2] rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,.3)] border-[3px] border-white/[.12] animate-[heroSlideIn2_.9s_cubic-bezier(.22,1,.36,1)_both] [animation-delay:.55s]">
              <Image src="/images/Hero.jpg" alt="Equipo profesional Kyoszen" fill className="object-cover" />
            </div>
          </div>

          {/* Float card bottom left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1, duration: 0.6 }}
            className="absolute bottom-10 left-0 bg-white rounded-xl py-3 px-4 shadow-[0_4px_20px_rgba(0,0,0,.1)] border border-border min-w-[120px] max-w-[160px] z-[2]"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-soft shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /></svg>
              </div>
              <div>
                <div className="text-[17px] font-black text-navy leading-none">687+</div>
                <div className="text-[10px] text-muted mt-0.5">Colocados</div>
              </div>
            </div>
          </motion.div>

          {/* Float card right bottom */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="absolute bottom-[5.5rem] right-0 bg-white rounded-xl py-3 px-4 shadow-[0_4px_20px_rgba(0,0,0,.1)] border border-border min-w-[120px] max-w-[160px] z-[2] hidden lg:block"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-soft shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
              </div>
              <div>
                <div className="text-[17px] font-black text-navy leading-none">24h</div>
                <div className="text-[10px] text-muted mt-0.5">Respuesta</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
