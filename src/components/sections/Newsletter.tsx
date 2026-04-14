"use client";

import AnimatedSection from "@/components/ui/AnimatedSection";

export default function Newsletter() {
  return (
    <section className="bg-bg py-10 sec-pad border-t border-border">
      <AnimatedSection className="max-w-[480px] mx-auto text-center">
        <h4 className="text-[1.1rem] font-extrabold mb-1.5">
          Mantente al dia con el mercado laboral
        </h4>
        <p className="text-[13px] text-muted mb-5">
          Recibe articulos, tendencias y vacantes nuevas en tu correo.
        </p>
        <div className="flex gap-2 bg-white border-[1.5px] border-border rounded-xl p-1 pl-3.5">
          <input
            type="email"
            placeholder="Tu correo electronico"
            className="flex-1 bg-transparent border-none outline-none text-[13px] text-navy placeholder:text-[#bbb]"
          />
          <button className="bg-blue-btn text-white border-none rounded-xl py-2.5 px-5 text-[13px] font-bold cursor-pointer hover:bg-blue-dark transition-colors">
            Suscribirse
          </button>
        </div>
      </AnimatedSection>
    </section>
  );
}
