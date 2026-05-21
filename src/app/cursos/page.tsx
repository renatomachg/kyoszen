"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageHero from "@/components/ui/PageHero";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { CATEGORIES, COURSES, MODALITY_LABELS, type CourseCategory, type Course } from "@/lib/courses";
import { supabase } from "@/lib/supabase";
import { logEvent } from "@/lib/analytics";


// ─── Modal de solicitud de informes ─────────────────────────────────────────

function CourseModal({ course, onClose }: { course: Course; onClose: () => void }) {
  const [form, setForm] = useState({ nombre: "", empresa: "", correo: "", telefono: "", mensaje: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: form.nombre,
          correo: form.correo,
          asunto: `Informes: ${course.titulo}`,
          mensaje: `Empresa: ${form.empresa || "No especificada"}\nTelefono: ${form.telefono}\n\n${form.mensaje || "Solicita informes sobre el curso."}`,
        }),
      });
      setStatus(res.ok ? "ok" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <motion.div
        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        {/* Header */}
        <div className="bg-[var(--color-navy)] px-7 pt-7 pb-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-5 text-white/50 hover:text-white text-2xl leading-none transition-colors"
            aria-label="Cerrar"
          >
            ×
          </button>
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">{course.categoriaLabel}</p>
          <h2 className="text-white font-extrabold text-[18px] leading-tight pr-6">{course.titulo}</h2>
          <p className="text-white/60 text-[12.5px] mt-1.5">Solicita informes y un asesor se pondrá en contacto contigo.</p>
        </div>

        {/* Body */}
        <div className="px-7 py-6">
          {status === "ok" ? (
            <div className="text-center py-6">
              <div className="text-4xl mb-3">✓</div>
              <p className="font-extrabold text-[var(--color-navy)] text-lg mb-1">Solicitud enviada</p>
              <p className="text-sm text-[var(--color-muted)]">Nos pondremos en contacto contigo pronto.</p>
              <button onClick={onClose} className="mt-5 bg-[var(--color-blue)] text-white rounded-full py-2.5 px-7 text-sm font-bold">Cerrar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--color-navy)] uppercase tracking-wide block mb-1">Nombre *</label>
                  <input
                    required
                    type="text"
                    placeholder="Tu nombre completo"
                    className="w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-blue)] transition-colors"
                    value={form.nombre}
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--color-navy)] uppercase tracking-wide block mb-1">Empresa</label>
                  <input
                    type="text"
                    placeholder="Nombre de tu empresa"
                    className="w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-blue)] transition-colors"
                    value={form.empresa}
                    onChange={e => setForm(f => ({ ...f, empresa: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-[var(--color-navy)] uppercase tracking-wide block mb-1">Correo *</label>
                  <input
                    required
                    type="email"
                    placeholder="correo@empresa.com"
                    className="w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-blue)] transition-colors"
                    value={form.correo}
                    onChange={e => setForm(f => ({ ...f, correo: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[var(--color-navy)] uppercase tracking-wide block mb-1">Teléfono *</label>
                  <input
                    required
                    type="tel"
                    placeholder="55 0000 0000"
                    className="w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-blue)] transition-colors"
                    value={form.telefono}
                    onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--color-navy)] uppercase tracking-wide block mb-1">Curso de interés</label>
                <input
                  readOnly
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] px-3.5 py-2.5 text-sm text-[var(--color-muted)]"
                  value={course.titulo}
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-[var(--color-navy)] uppercase tracking-wide block mb-1">Comentarios</label>
                <textarea
                  rows={3}
                  placeholder="Cuantas personas, fechas preferidas, dudas..."
                  className="w-full rounded-xl border border-[var(--color-border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--color-blue)] transition-colors resize-none"
                  value={form.mensaje}
                  onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                />
              </div>
              {status === "error" && (
                <p className="text-red-600 text-xs">Ocurrió un error. Inténtalo de nuevo o escríbenos por WhatsApp.</p>
              )}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-[var(--color-blue)] hover:bg-[var(--color-blue-dark)] text-white font-extrabold rounded-full py-3 text-sm transition-colors disabled:opacity-60"
              >
                {status === "loading" ? "Enviando..." : "Solicitar informes →"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Fila de curso (lista sin imagen) ───────────────────────────────────────

function CourseRow({ course, index, onSelect }: { course: Course; index: number; onSelect: (c: Course) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-[var(--color-bg)] transition-colors cursor-default"
    >
      {/* Número */}
      <span className="text-[11px] font-black text-[var(--color-blue)] opacity-40 w-5 shrink-0 select-none text-right tabular-nums">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[13.5px] font-extrabold text-[var(--color-navy)] leading-snug">
            {course.titulo}
          </h3>
          {course.badge && (
            <span className="bg-[var(--color-yellow)] text-black text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
              {course.badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-[var(--color-muted)]">{course.horas}h</span>
          <span className="text-[var(--color-border)]">·</span>
          <span className="text-[11px] text-[var(--color-muted)]">{course.nivel}</span>
          <span className="text-[var(--color-border)]">·</span>
          <span className="text-[11px] text-[var(--color-muted)]">{MODALITY_LABELS[course.modalidad as keyof typeof MODALITY_LABELS] ?? course.modalidad}</span>
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => onSelect(course)}
        className="shrink-0 text-[11.5px] font-extrabold text-[var(--color-blue)] border border-[var(--color-blue)]/25 rounded-full px-4 py-1.5 hover:bg-[var(--color-blue)] hover:text-white hover:border-[var(--color-blue)] transition-all whitespace-nowrap"
      >
        Pedir informes
      </button>
    </motion.div>
  );
}

// ─── Tarjeta de categoría ────────────────────────────────────────────────────

function CategoryCard({
  category,
  count,
  active,
  onClick,
}: {
  category: CourseCategory;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl text-left group transition-all duration-200 ${
        active ? "ring-4 ring-[var(--color-blue)] ring-offset-2 shadow-2xl" : "shadow-md hover:shadow-xl hover:-translate-y-1"
      }`}
      whileTap={{ scale: 0.98 }}
    >
      <div className="h-[200px] relative">
        <img src={category.image} alt={category.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        {count > 0 && (
          <span className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[var(--color-navy)] text-[10px] font-extrabold px-2.5 py-1 rounded-full">
            {count} {count === 1 ? "curso" : "cursos"}
          </span>
        )}
        {active && (
          <span className="absolute top-3 left-3 bg-[var(--color-blue)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Seleccionada
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-extrabold text-[15px] leading-tight">{category.label}</h3>
          <p className="text-white/70 text-[11.5px] mt-0.5 line-clamp-1">{category.description}</p>
        </div>
      </div>
    </motion.button>
  );
}

// ─── Página principal ────────────────────────────────────────────────────────

export default function CursosPage() {
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [allCourses, setAllCourses] = useState<Course[]>(COURSES);
  const coursesRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Cargar cursos desde Supabase; si hay datos los usa, si no usa el catalogo local
  useEffect(() => {
    supabase.from("cursos").select("slug,titulo,categoria,categoria_label,modalidad,nivel,horas,descripcion_corta,badge,activo")
      .eq("activo", true).order("categoria").order("titulo")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setAllCourses(data.map((c: Record<string, unknown>) => ({
            slug: c.slug as string,
            titulo: c.titulo as string,
            categoria: c.categoria as string,
            categoriaLabel: c.categoria_label as string,
            modalidad: c.modalidad as string,
            nivel: c.nivel as string,
            horas: c.horas as number,
            descripcionCorta: c.descripcion_corta as string | undefined,
            badge: c.badge as string | undefined,
          } as Course)));
        }
      });
  }, []);

  const coursesInCategory = selectedCategory
    ? allCourses.filter(c => c.categoria === selectedCategory.id)
    : [];

  function handleCategoryClick(cat: CourseCategory) {
    const coursesForCat = allCourses.filter(c => c.categoria === cat.id);
    if (coursesForCat.length === 0) return;

    if (selectedCategory?.id === cat.id) {
      setSelectedCategory(null);
      return;
    }
    setSelectedCategory(cat);
    logEvent("ver_categoria_curso", cat.label);
    setTimeout(() => {
      coursesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 370);
  }

  return (
    <>
      <PageHero
        image="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1800&auto=format&fit=crop&q=80"
        chip="Capacitación"
        title="Nuestros cursos profesionales"
        description="Selecciona un área de interés para explorar los cursos disponibles. Todos con constancia DC-3."
      />

      <section className="py-16 px-5 md:px-10 xl:px-20 bg-[var(--color-bg)]">
        <div ref={sectionRef} className="max-w-7xl mx-auto">

          {/* Instruccion */}
          <AnimatedSection className="text-center mb-10">
            <h2 className="text-[clamp(1.3rem,2.5vw,1.9rem)] font-extrabold tracking-tight text-[var(--color-navy)] mb-2">
              Elige un área de capacitación
            </h2>
            <p className="text-sm text-[var(--color-muted)]">Da clic en cualquier categoría para ver los cursos disponibles</p>
          </AnimatedSection>

          {/* Grid de categorias */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
            {CATEGORIES.map(cat => {
              const count = allCourses.filter(c => c.categoria === cat.id).length;
              return (
                <CategoryCard
                  key={cat.id}
                  category={cat}
                  count={count}
                  active={selectedCategory?.id === cat.id}
                  onClick={() => handleCategoryClick(cat)}
                />
              );
            })}
          </div>

          {/* Grid de cursos de la categoría seleccionada */}
          <AnimatePresence>
            {selectedCategory && (
              <motion.div
                key={selectedCategory.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35 }}
                className="overflow-hidden"
              >
                <div ref={coursesRef} style={{ scrollMarginTop: "90px" }} className="mt-6 bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-[var(--color-border)]">
                  {/* Header de sección */}
                  <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-blue)] mb-0.5">Cursos disponibles</p>
                      <h3 className="text-[20px] font-extrabold text-[var(--color-navy)]">{selectedCategory.label}</h3>
                    </div>
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-sm font-bold text-[var(--color-muted)] hover:text-[var(--color-navy)] flex items-center gap-1.5 transition-colors"
                    >
                      ← Ver todas las áreas
                    </button>
                  </div>

                  {coursesInCategory.length === 0 ? (
                    <p className="text-sm text-[var(--color-muted)] py-8 text-center">
                      Próximamente — estamos preparando los cursos de esta área.
                    </p>
                  ) : (
                    <div className="grid sm:grid-cols-2 divide-y divide-[var(--color-border)] sm:divide-y-0">
                      {coursesInCategory.map((course, i) => (
                        <CourseRow key={course.slug} course={course} index={i} onSelect={setSelectedCourse} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CTA bottom */}
          <AnimatedSection className="mt-14">
            <div className="bg-[var(--color-blue)] rounded-3xl p-10 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
              <div>
                <h2 className="text-[clamp(1.3rem,2.5vw,1.8rem)] font-black text-white leading-tight">
                  ¿No encuentras el curso que necesitas?
                </h2>
                <p className="text-sm text-white/60 mt-2">Cuéntanos qué habilidades quieres desarrollar y diseñamos un programa a la medida.</p>
              </div>
              <div className="flex gap-3 flex-wrap shrink-0">
                <a href="/contacto" className="bg-[var(--color-yellow)] text-black rounded-full py-3 px-7 text-[13.5px] font-extrabold no-underline hover:bg-[#e6b800] transition-colors">
                  Solicitar programa →
                </a>
                <a href="/contacto" className="bg-transparent text-white border-2 border-white/30 rounded-full py-3 px-7 text-[13px] font-bold no-underline hover:bg-white/10 transition-colors">
                  Hablar con asesor
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <CourseModal course={selectedCourse} onClose={() => setSelectedCourse(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
