"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CursoForm from "../_form";

export default function EditarCurso() {
  const { id } = useParams();
  const [curso, setCurso] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("cursos").select("*").eq("id", id).single()
      .then(({ data }) => { setCurso(data); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!curso) return <p className="text-muted text-sm">Curso no encontrado.</p>;

  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-1">Editar curso</h1>
      <p className="text-[13px] text-muted mb-8">{curso.titulo as string}</p>
      <CursoForm initial={{
        id: curso.id as number,
        slug: curso.slug as string,
        titulo: curso.titulo as string,
        categoria: curso.categoria as string,
        categoria_label: curso.categoria_label as string,
        modalidad: curso.modalidad as string,
        nivel: curso.nivel as string,
        horas: curso.horas as number,
        descripcion_corta: (curso.descripcion_corta as string) ?? "",
        badge: (curso.badge as string) ?? "",
        activo: curso.activo as boolean,
      }} />
    </div>
  );
}
