"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BlogForm from "../_form";

export default function EditarPost() {
  const { id } = useParams();
  const [post, setPost] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("blog_posts").select("*").eq("id", id).single()
      .then(({ data }) => { setPost(data); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!post) return <p className="text-muted text-sm">Articulo no encontrado.</p>;

  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-1">Editar articulo</h1>
      <p className="text-[13px] text-muted mb-8">{post.titulo as string}</p>
      <BlogForm initial={{
        id: post.id as number,
        slug: post.slug as string,
        titulo: post.titulo as string,
        resumen: (post.resumen as string) ?? "",
        contenido: (post.contenido as string) ?? "",
        categoria: (post.categoria as string) ?? "General",
        imagen_url: (post.imagen_url as string) ?? "",
        autor: (post.autor as string) ?? "Equipo Kyoszen",
        publicado: (post.publicado as boolean) ?? false,
        fecha_publicacion: post.fecha_publicacion
          ? (post.fecha_publicacion as string).slice(0, 10)
          : new Date().toISOString().slice(0, 10),
      }} />
    </div>
  );
}
