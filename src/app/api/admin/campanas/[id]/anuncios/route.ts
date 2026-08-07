import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Alta de un anuncio dentro de una campaña existente
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const { data: campana } = await sb.from("campanas").select("id").eq("id", id).maybeSingle();
  if (!campana) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });

  const { data: previos } = await sb
    .from("campana_anuncios")
    .select("orden")
    .eq("campana_id", id)
    .order("orden", { ascending: false })
    .limit(1);

  const { data, error } = await sb
    .from("campana_anuncios")
    .insert({
      campana_id: id,
      puesto: body.puesto?.trim() || "Anuncio nuevo",
      texto_principal: body.texto_principal ?? null,
      titulo: body.titulo ?? null,
      descripcion: body.descripcion ?? null,
      cta: body.cta || "Registrarte",
      formulario: body.formulario ?? { preguntas: [] },
      orden: (previos?.[0]?.orden ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
