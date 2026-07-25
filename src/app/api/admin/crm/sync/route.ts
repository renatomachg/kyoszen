import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function normalizarCorreo(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizarWhatsapp(value: unknown): string {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function textoONull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST() {
  try {
    const [
      { data: aplicaciones, error: aplicacionesError },
      { data: candidatos, error: candidatosError },
    ] = await Promise.all([
      sb.from("aplicaciones").select("*").is("candidato_id", null),
      sb.from("crm_candidatos").select("id, correo, whatsapp"),
    ]);

    if (aplicacionesError || candidatosError) {
      return NextResponse.json(
        { error: aplicacionesError?.message ?? candidatosError?.message },
        { status: 500 },
      );
    }

    const porCorreo = new Map<string, string>();
    const porWhatsapp = new Map<string, string>();
    for (const candidato of candidatos ?? []) {
      const correo = normalizarCorreo(candidato.correo);
      const whatsapp = normalizarWhatsapp(candidato.whatsapp);
      if (correo && !porCorreo.has(correo)) {
        porCorreo.set(correo, candidato.id);
      }
      if (whatsapp && !porWhatsapp.has(whatsapp)) {
        porWhatsapp.set(whatsapp, candidato.id);
      }
    }

    let creados = 0;
    let vinculados = 0;

    for (const aplicacion of aplicaciones ?? []) {
      const correo = normalizarCorreo(aplicacion.correo);
      const whatsapp = normalizarWhatsapp(aplicacion.whatsapp);
      let candidatoId = correo
        ? porCorreo.get(correo)
        : whatsapp
          ? porWhatsapp.get(whatsapp)
          : undefined;

      if (!candidatoId) {
        const { data: nuevo, error: crearError } = await sb
          .from("crm_candidatos")
          .insert({
            nombre: textoONull(aplicacion.nombre),
            correo: correo || null,
            whatsapp: whatsapp || null,
            ubicacion: textoONull(aplicacion.ubicacion),
            experiencia: textoONull(aplicacion.experiencia),
            cv_url: textoONull(aplicacion.cv_url),
            origen: "aplicacion",
            estado: "nuevo",
          })
          .select("id")
          .single();

        if (crearError) throw crearError;

        const nuevoId = nuevo.id as string;
        candidatoId = nuevoId;
        creados += 1;
        if (correo) porCorreo.set(correo, nuevoId);
        if (whatsapp) porWhatsapp.set(whatsapp, nuevoId);
      }

      const { error: vincularError } = await sb
        .from("aplicaciones")
        .update({ candidato_id: candidatoId })
        .eq("id", aplicacion.id)
        .is("candidato_id", null);

      if (vincularError) throw vincularError;
      vinculados += 1;
    }

    return NextResponse.json({ creados, vinculados });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "No se pudieron sincronizar las aplicaciones.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
