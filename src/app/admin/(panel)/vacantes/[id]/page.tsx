"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import VacanteForm from "../_form";

export default function EditarVacante({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("vacantes")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted text-[14px]">Vacante no encontrada</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-1">Editar vacante</h1>
      <p className="text-[13px] text-muted mb-8">{data.titulo as string}</p>
      <VacanteForm initial={data as Parameters<typeof VacanteForm>[0]["initial"]} id={Number(id)} />
    </div>
  );
}
