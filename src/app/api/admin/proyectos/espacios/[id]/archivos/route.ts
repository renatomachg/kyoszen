import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { SinPermiso, exigirSeccion } from "@/lib/admin-auth";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function sanitizarNombre(nombre: string) {
  const limpio = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return limpio || "archivo";
}

async function validarEspacio(id: string) {
  return sb
    .from("proyecto_espacios")
    .select("id, tipo")
    .eq("id", id)
    .eq("tipo", "archivos")
    .maybeSingle();
}

async function validarCarpeta(espacioId: string, carpetaId: string) {
  return sb
    .from("espacio_carpetas")
    .select("id")
    .eq("id", carpetaId)
    .eq("espacio_id", espacioId)
    .maybeSingle();
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id } = await params;
    // Contrato de Entrega K: sin parámetro (o con "root") se consulta únicamente la raíz.
    const carpetaParam = req.nextUrl.searchParams.get("carpeta");
    const carpetaId = carpetaParam && carpetaParam !== "root" ? carpetaParam : null;

    if (carpetaId) {
      const { data: carpeta, error: carpetaError } = await validarCarpeta(id, carpetaId);
      if (carpetaError) {
        return NextResponse.json({ error: carpetaError.message }, { status: 500 });
      }
      if (!carpeta) {
        return NextResponse.json({ error: "Carpeta no encontrada" }, { status: 404 });
      }
    }

    let query = sb
      .from("espacio_archivos")
      .select("*")
      .eq("espacio_id", id)
      .order("orden", { ascending: true })
      .order("created_at", { ascending: false });
    query = carpetaId ? query.eq("carpeta_id", carpetaId) : query.is("carpeta_id", null);
    const { data, error } = await query;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ archivos: data ?? [] });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await exigirSeccion(req, "proyectos");
    const { id } = await params;
    const { data: espacio, error: espacioError } = await validarEspacio(id);
    if (espacioError) {
      return NextResponse.json({ error: espacioError.message }, { status: 500 });
    }
    if (!espacio) {
      return NextResponse.json({ error: "Espacio de archivos no encontrado" }, { status: 404 });
    }

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json({ error: "Formulario inválido" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ error: "Selecciona un archivo" }, { status: 400 });
    }
    const notaForm = formData.get("nota");
    const nota = typeof notaForm === "string" ? notaForm.trim() || null : null;
    const carpetaForm = formData.get("carpeta_id");
    const carpetaId = typeof carpetaForm === "string" && carpetaForm.trim() && carpetaForm !== "root"
      ? carpetaForm.trim()
      : null;
    const requiereAprobacion = formData.get("requiere_aprobacion") !== "false";
    if (carpetaId) {
      const { data: carpeta, error: carpetaError } = await validarCarpeta(id, carpetaId);
      if (carpetaError) {
        return NextResponse.json({ error: carpetaError.message }, { status: 500 });
      }
      if (!carpeta) {
        return NextResponse.json(
          { error: "La carpeta de destino no pertenece a este espacio" },
          { status: 400 }
        );
      }
    }
    const contentType = file.type || "application/octet-stream";
    const path = `proyectos/${id}/${Date.now()}-${sanitizarNombre(file.name)}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await sb.storage
      .from("media")
      .upload(path, buffer, { contentType, upsert: false });
    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = sb.storage.from("media").getPublicUrl(path);
    const { data, error } = await sb
      .from("espacio_archivos")
      .insert({
        espacio_id: id,
        nombre: file.name,
        url: publicUrl.publicUrl,
        tipo: contentType,
        peso: file.size,
        nota,
        carpeta_id: carpetaId,
        requiere_aprobacion: requiereAprobacion,
      })
      .select()
      .single();

    if (error) {
      await sb.storage.from("media").remove([path]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
