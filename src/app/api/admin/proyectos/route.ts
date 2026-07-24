import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getPlantilla,
  type ModoEtapa,
  type ProyectoEscena,
  type TipoEtapa,
} from "@/lib/proyectos";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EscenaEntrada = Pick<
  ProyectoEscena,
  "numero" | "titulo"
> & {
  locucion?: string;
  en_pantalla?: string;
};

type CrearProyectoBody = {
  titulo?: unknown;
  area?: unknown;
  descripcion?: unknown;
  folio?: unknown;
  modos?: { arte?: unknown; video?: unknown };
  escenas?: unknown;
};

type EtapaListado = {
  id: string;
  orden: number;
  proyecto_bloques?: { estado: string; etapa_id: string }[] | null;
  [key: string]: unknown;
};

type ProyectoListado = {
  proyecto_etapas?: EtapaListado[] | null;
  proyecto_escenas?: { count: number }[] | null;
  [key: string]: unknown;
};

function esModoEtapa(valor: unknown): valor is ModoEtapa {
  return valor === "por_escena" || valor === "entregable_unico";
}

function esEscenaEntrada(valor: unknown): valor is EscenaEntrada {
  if (!valor || typeof valor !== "object") return false;
  const escena = valor as Record<string, unknown>;
  return (
    typeof escena.numero === "number" &&
    Number.isFinite(escena.numero) &&
    typeof escena.titulo === "string" &&
    (escena.locucion === undefined || typeof escena.locucion === "string") &&
    (escena.en_pantalla === undefined || typeof escena.en_pantalla === "string")
  );
}

async function eliminarProyecto(id: string) {
  await sb.from("proyectos").delete().eq("id", id);
}

// GET — proyectos listos para las tarjetas del Centro de Proyectos.
export async function GET() {
  const { data, error } = await sb
    .from("proyectos")
    .select(`
      *,
      proyecto_escenas(count),
      proyecto_etapas(
        *,
        proyecto_bloques(estado, etapa_id)
      )
    `)
    .eq("proyecto_etapas.proyecto_bloques.es_activa", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const proyectos = ((data ?? []) as ProyectoListado[]).map((proyecto) => {
    const escenasCount = proyecto.proyecto_escenas?.[0]?.count ?? 0;
    const etapas = (proyecto.proyecto_etapas ?? [])
      .map(({ proyecto_bloques, ...etapa }) => {
        const bloques = proyecto_bloques ?? [];
        const aprobado = bloques.filter(({ estado }) => estado === "aprobado").length;
        const cambios = bloques.filter(({ estado }) => estado === "cambios").length;
        const pendiente = bloques.filter(({ estado }) => estado === "pendiente").length;
        return {
          ...etapa,
          progreso: {
            total: bloques.length,
            aprobado,
            cambios,
            pendiente,
          },
        };
      })
      .sort((a, b) => a.orden - b.orden);

    return {
      ...proyecto,
      proyecto_escenas: undefined,
      escenas_count: escenasCount,
      proyecto_etapas: etapas,
    };
  });

  return NextResponse.json(proyectos);
}

// POST — crea proyecto, etapas, escenas y todos sus bloques iniciales.
export async function POST(req: NextRequest) {
  let body: CrearProyectoBody;
  try {
    body = (await req.json()) as CrearProyectoBody;
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const titulo = typeof body.titulo === "string" ? body.titulo.trim() : "";
  if (!titulo) {
    return NextResponse.json({ error: "titulo es requerido" }, { status: 400 });
  }
  if (!Array.isArray(body.escenas) || body.escenas.length === 0) {
    return NextResponse.json({ error: "Se requiere al menos una escena" }, { status: 400 });
  }
  if (!body.escenas.every(esEscenaEntrada)) {
    return NextResponse.json({ error: "Las escenas no tienen un formato válido" }, { status: 400 });
  }
  if (
    (body.modos?.arte !== undefined && !esModoEtapa(body.modos.arte)) ||
    (body.modos?.video !== undefined && !esModoEtapa(body.modos.video))
  ) {
    return NextResponse.json({ error: "Modo de etapa inválido" }, { status: 400 });
  }

  const escenasEntrada = body.escenas;
  const { data: proyecto, error: proyectoError } = await sb
    .from("proyectos")
    .insert({
      tipo: "video_induccion",
      titulo,
      area: typeof body.area === "string" ? body.area : null,
      descripcion: typeof body.descripcion === "string" ? body.descripcion : null,
      folio: typeof body.folio === "string" ? body.folio : null,
      publicado: false,
      estado: "activo",
      etapa_actual: 1,
    })
    .select()
    .single();

  if (proyectoError || !proyecto) {
    return NextResponse.json(
      { error: proyectoError?.message ?? "No se pudo crear el proyecto" },
      { status: 500 }
    );
  }

  const modos: Record<TipoEtapa, ModoEtapa> = {
    guion: "por_escena",
    arte: esModoEtapa(body.modos?.arte) ? body.modos.arte : "por_escena",
    video: esModoEtapa(body.modos?.video) ? body.modos.video : "por_escena",
  };
  const { data: etapas, error: etapasError } = await sb
    .from("proyecto_etapas")
    .insert(
      getPlantilla("video_induccion").map((etapa) => ({
        proyecto_id: proyecto.id,
        tipo: etapa.tipo,
        nombre: etapa.nombre,
        orden: etapa.orden,
        modo: modos[etapa.tipo],
        estado: etapa.tipo === "guion" ? "pendiente" : "bloqueada",
      }))
    )
    .select("id, tipo, modo");

  if (etapasError || !etapas) {
    await eliminarProyecto(proyecto.id);
    return NextResponse.json(
      { error: etapasError?.message ?? "No se pudieron crear las etapas" },
      { status: 500 }
    );
  }

  const { data: escenas, error: escenasError } = await sb
    .from("proyecto_escenas")
    .insert(
      escenasEntrada.map((escena, index) => ({
        proyecto_id: proyecto.id,
        numero: escena.numero,
        titulo: escena.titulo,
        orden: index + 1,
      }))
    )
    .select("id, orden");

  if (escenasError || !escenas) {
    await eliminarProyecto(proyecto.id);
    return NextResponse.json(
      { error: escenasError?.message ?? "No se pudieron crear las escenas" },
      { status: 500 }
    );
  }

  const bloques = etapas.flatMap((etapa) => {
    if (etapa.modo === "entregable_unico") {
      return [{
        etapa_id: etapa.id,
        escena_id: null,
        estado: "pendiente",
        contenido: {},
        archivos: [],
        nota: null,
        version_num: 1,
        es_activa: true,
      }];
    }
    return escenas.map((escena) => {
      const entrada = escenasEntrada[escena.orden - 1];
      return {
        etapa_id: etapa.id,
        escena_id: escena.id,
        estado: "pendiente",
        contenido: etapa.tipo === "guion"
          ? { locucion: entrada.locucion ?? "", en_pantalla: entrada.en_pantalla ?? "" }
          : {},
        archivos: [],
        nota: etapa.tipo === "arte" ? entrada.en_pantalla ?? "" : null,
        version_num: 1,
        es_activa: true,
      };
    });
  });

  const { error: bloquesError } = await sb.from("proyecto_bloques").insert(bloques);
  if (bloquesError) {
    await eliminarProyecto(proyecto.id);
    return NextResponse.json({ error: bloquesError.message }, { status: 500 });
  }

  return NextResponse.json(proyecto, { status: 201 });
}
