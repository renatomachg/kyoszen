"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface PageHeroProps {
  image: string;
  chip?: string;
  title: ReactNode;
  description: string;
  children?: ReactNode;
}

export default function PageHero({ image, chip, title, description, children }: PageHeroProps) {
  return (
    <section className="relative pt-32 pb-16 px-5 md:px-10 xl:px-20 overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: `url('${image}')` }}
      />
      {/* Dark to light gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(180deg, rgba(7,17,47,0.95) 0%, rgba(10,78,204,0.78) 60%, rgba(24,131,255,0.55) 100%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-[2] max-w-[600px] mx-auto text-center"
      >
        {chip && (
          <span className="inline-block bg-white/15 text-white text-xs font-bold py-1.5 px-4 rounded-full border border-white/25 mb-4 backdrop-blur-[4px]">
            {chip}
          </span>
        )}
        <h1 className="text-[clamp(2rem,4vw,3rem)] font-black leading-[1.1] text-white mb-4 drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
          {title}
        </h1>
        <p className="text-sm text-white/85 leading-relaxed">{description}</p>
        {children}
      </motion.div>
    </section>
  );
}
