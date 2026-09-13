import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
import {
  apruebaElAdmin,
  rollupEtapa,
  type Aprobador,
  type EstadoBloque,
  type EstadoProyecto,
  type ProyectoBloque,
} from "@/lib/proyectos";
import { SinPermiso, exigirProyecto } from "@/lib/admin-auth";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type EtapaRelacion = {
  proyecto_id: string;
  orden: number;
  estado: string;
  aprobador: Aprobador;
  proyectos: { titulo: string; estado: EstadoProyecto; publicado: boolean } | { titulo: string; estado: EstadoProyecto; publicado: boolean }[] | null;
} | {
  proyecto_id: string;
  orden: number;
  estado: string;
  aprobador: Aprobador;
  proyectos: { titulo: string; estado: EstadoProyecto; publicado: boolean } | { titulo: string; estado: EstadoProyecto; publicado: boolean }[] | null;
}[] | null;

type BloqueVersion = Pick<
  ProyectoBloque,
  "id" | "etapa_id" | "escena_id" | "contenido" | "archivos" | "nota" | "estado" | "visible_cliente" | "entrega_estado"
> & { proyecto_etapas: EtapaRelacion };

function tomarEtapa(relacion: EtapaRelacion) {
  return Array.isArray(relacion) ? relacion[0] : relacion;
}

function tomarProyecto<T>(relacion: T | T[] | null) {
  return Array.isArray(relacion) ? relacion[0] : relacion;
}

function tomarTitulo(relacion: { titulo: string; estado: EstadoProyecto } | { titulo: string; estado: EstadoProyecto }[] | null) {
  return Array.isArray(relacion) ? relacion[0]?.titulo : relacion?.titulo;
}

async function getSmtp() {
  const { data } = await sb
    .from("site_config")
    .select("key,value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);
  const config: Record<string, string> = {};
  for (const row of data ?? []) config[row.key] = row.value;
  return config;
}

const ADMIN_EMAIL = "renatomachg@gmail.com";

/** Entrega interna: un colaborador subió su parte y le toca al admin revisarla.
 *  El cliente NO se entera todavía. */
async function notificarAdminEntrega(
  titulo: string,
  etapa: string,
  escena: string,
  autor: string
) {
  try {
    const smtp = await getSmtp();
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) return;
    const puerto = Number.parseInt(smtp.smtp_port ?? "465", 10);
    const transport = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: puerto,
      secure: puerto === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });

    await transport.sendMail({
      from: { name: "Kyoszen", address: smtp.smtp_from || smtp.smtp_user },
      to: ADMIN_EMAIL,
      subject: `${autor} entregó ${escena} · ${etapa} · ${titulo || "Proyecto"}`,
      html:
        `<p><strong>${autor}</strong> subió su entrega y está esperando tu revisión.</p>` +
        `<p>Proyecto: <strong>${titulo || "Proyecto"}</strong><br/>Etapa: <strong>${etapa}</strong><br/>${escena}</p>` +
        `<p>El cliente todavía no lo ve. Revísalo y, cuando esté bien, mándaselo con el botón <strong>"Enviar al cliente"</strong>.</p>` +
        `<p><a href="https://kyoszen.com/admin/proyectos">Revisar la entrega</a></p>`,
    });
  } catch (error) {
    console.error("[notif entrega interna] error al enviar:", error);
  }
}

async function notificarRevisores(titulo: string) {
  try {
    const { data: revisores } = await sb
      .from("social_reviewers")
      .select("email, nombre")
      .eq("activo", true);
    if (!revisores?.length) return;

    const smtp = await getSmtp();
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) return;
    const puerto = Number.parseInt(smtp.smtp_port ?? "465", 10);
    const transport = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: puerto,
      secure: puerto === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });

    await Promise.all(
      revisores.map((revisor) => transport.sendMail({
        from: { name: "Kyoszen", address: smtp.smtp_from || smtp.smtp_user },
        to: revisor.email,
        subject: `Nueva versión lista para revisión · ${titulo || "Proyecto"}`,
        html: `<p>Hola ${revisor.nombre || ""},</p><p>Ya hay una nueva versión de <strong>${titulo || "un proyecto"}</strong> lista para revisar.</p><p><a href="https://kyoszen.com/revisor">Revisar ahora</a></p>`,
      }))
    );
  } catch (error) {
    console.error("[notif proyecto nueva version] error al enviar:", error);
  }
}

/** Compara valores JSON sin importar el orden de las llaves: jsonb las reordena. */
function mismoValor(a: unknown, b: unknown): boolean {
  const ordenar = (valor: unknown): unknown =>
    Array.isArray(valor)
      ? valor.map(ordenar)
      : valor && typeof valor === "object"
        ? Object.fromEntries(
            Object.keys(valor as Record<string, unknown>)
              .sort()
              .map((llave) => [llave, ordenar((valor as Record<string, unknown>)[llave])])
          )
        : valor;
  return JSON.stringify(ordenar(a ?? null)) === JSON.stringify(ordenar(b ?? null));
}

function consultaCelda(etapaId: string, escenaId: string | null) {
  const query = sb.from("proyecto_bloques").select("version_num").eq("etapa_id", etapaId);
  return escenaId === null ? query.is("escena_id", null) : query.eq("escena_id", escenaId);
}

// POST — crea una nueva versión activa de la misma celda etapa × escena.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; bloqueId: string }> }
) {
  try {
    const { id, bloqueId } = await params;
    await exigirProyecto(req, id);
    let body: Record<string, unknown>;
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Body inválido" }, { status: 400 });
    }

    const { data, error: bloqueError } = await sb
      .from("proyecto_bloques")
      .select("id, etapa_id, escena_id, contenido, archivos, nota, estado, visible_cliente, entrega_estado, proyecto_etapas!inner(proyecto_id, orden, estado, aprobador, proyectos!inner(titulo, estado, publicado))")
      .eq("id", bloqueId)
      .maybeSingle();
    if (bloqueError) return NextResponse.json({ error: bloqueError.message }, { status: 500 });

    const bloque = data as BloqueVersion | null;
    const etapa = bloque ? tomarEtapa(bloque.proyecto_etapas) : null;
    const proyecto = etapa ? tomarProyecto(etapa.proyectos) : null;
    if (!bloque || !etapa || !proyecto || etapa.proyecto_id !== id) {
      return NextResponse.json({ error: "Bloque no encontrado" }, { status: 404 });
    }

    if (body.contenido !== undefined && (!body.contenido || typeof body.contenido !== "object" || Array.isArray(body.contenido))) {
      return NextResponse.json({ error: "contenido debe ser un objeto" }, { status: 400 });
    }
    if (body.archivos !== undefined && !Array.isArray(body.archivos)) {
      return NextResponse.json({ error: "archivos debe ser un arreglo" }, { status: 400 });
    }
    if (body.nota !== undefined && typeof body.nota !== "string" && body.nota !== null) {
      return NextResponse.json({ error: "nota debe ser texto o null" }, { status: 400 });
    }

    // Mandar otra vez exactamente lo mismo solo duplica el correo (al cliente, o
    // al admin si es un colaborador): no se crea otra versión.
    const esInterno = body.destino === "interno";
    const mismoContenido =
      mismoValor(body.contenido ?? bloque.contenido, bloque.contenido) &&
      mismoValor(body.archivos ?? bloque.archivos, bloque.archivos) &&
      mismoValor(body.nota !== undefined ? body.nota : bloque.nota, bloque.nota);
    if (mismoContenido && (esInterno ? bloque.entrega_estado === "entregado" : bloque.visible_cliente)) {
      return NextResponse.json(
        {
          error: esInterno
            ? "Esto ya está en revisión: no se volvió a mandar el aviso. Si cambias algo, podrás enviarlo de nuevo."
            : "El cliente ya tiene esta misma versión: no se le volvió a avisar. Si cambias algo, podrás mandársela de nuevo.",
          sin_cambios: true,
        },
        { status: 409 }
      );
    }

    const { data: ultima, error: ultimaError } = await consultaCelda(bloque.etapa_id, bloque.escena_id)
      .order("version_num", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (ultimaError) return NextResponse.json({ error: ultimaError.message }, { status: 500 });

    let desactivar = sb
      .from("proyecto_bloques")
      .update({ es_activa: false, updated_at: new Date().toISOString() })
      .eq("etapa_id", bloque.etapa_id)
      .eq("es_activa", true);
    desactivar = bloque.escena_id === null
      ? desactivar.is("escena_id", null)
      : desactivar.eq("escena_id", bloque.escena_id);
    const { error: desactivarError } = await desactivar;
    if (desactivarError) return NextResponse.json({ error: desactivarError.message }, { status: 500 });

    // `destino: "interno"` = entrega de un colaborador. Se guarda igual, pero el
    // cliente no la ve hasta que el admin la revise y la mande.
    const interno = body.destino === "interno";
    const autor = typeof body.autor_nombre === "string" && body.autor_nombre.trim()
      ? body.autor_nombre.trim()
      : "Un colaborador";
    const ahoraEntrega = new Date().toISOString();

    const { data: nuevaVersion, error: insertarError } = await sb
      .from("proyecto_bloques")
      .insert({
        etapa_id: bloque.etapa_id,
        escena_id: bloque.escena_id,
        // En las etapas que aprueba Kyoszen, mandarle el material al cliente no
        // deshace el visto bueno del admin: es él mismo quien lo está enviando.
        estado:
          !interno && apruebaElAdmin(etapa) && bloque.estado === "aprobado"
            ? "aprobado"
            : "pendiente",
        contenido: body.contenido ?? bloque.contenido,
        archivos: body.archivos ?? bloque.archivos,
        nota: body.nota !== undefined ? body.nota : bloque.nota,
        version_num: (ultima?.version_num ?? 0) + 1,
        es_activa: true,
        visible_cliente: !interno,
        entrega_estado: interno ? "entregado" : "ninguna",
        entrega_nombre: interno ? autor : null,
        entrega_at: interno ? ahoraEntrega : null,
      })
      .select()
      .single();

    if (insertarError || !nuevaVersion) {
      await sb.from("proyecto_bloques").update({ es_activa: true }).eq("id", bloque.id);
      return NextResponse.json(
        { error: insertarError?.message ?? "No se pudo crear la versión" },
        { status: 500 }
      );
    }

    const { data: bloquesEtapa, error: rollupError } = await sb
      .from("proyecto_bloques")
      .select("estado")
      .eq("etapa_id", bloque.etapa_id)
      .eq("es_activa", true);
    if (rollupError) return NextResponse.json({ error: rollupError.message }, { status: 500 });

    if (etapa.estado !== "bloqueada") {
      const estado = rollupEtapa((bloquesEtapa ?? []) as { estado: EstadoBloque }[]);
      const { error: etapaError } = await sb
        .from("proyecto_etapas")
        .update({ estado, updated_at: new Date().toISOString() })
        .eq("id", bloque.etapa_id);
      if (etapaError) return NextResponse.json({ error: etapaError.message }, { status: 500 });

      if (estado !== "aprobado") {
        const ahora = new Date().toISOString();
        const [{ error: bloqueoError }, { error: proyectoError }] = await Promise.all([
          sb
            .from("proyecto_etapas")
            .update({ estado: "bloqueada", updated_at: ahora })
            .eq("proyecto_id", etapa.proyecto_id)
            .gt("orden", etapa.orden)
            .neq("estado", "bloqueada"),
          sb
            .from("proyectos")
            .update({
              etapa_actual: etapa.orden,
              estado: proyecto.estado === "completado" ? "activo" : proyecto.estado,
              updated_at: ahora,
            })
            .eq("id", etapa.proyecto_id),
        ]);
        if (bloqueoError || proyectoError) {
          return NextResponse.json(
            { error: bloqueoError?.message ?? proyectoError?.message ?? "No se pudo reabrir la etapa" },
            { status: 500 }
          );
        }
      }
    }

    try {
      if (interno) {
        // Nombre de la escena y de la etapa, para que el correo diga qué revisar
        const [{ data: escena }, { data: datosEtapa }] = await Promise.all([
          bloque.escena_id
            ? sb.from("proyecto_escenas").select("numero, titulo").eq("id", bloque.escena_id).maybeSingle()
            : Promise.resolve({ data: null }),
          sb.from("proyecto_etapas").select("nombre").eq("id", bloque.etapa_id).maybeSingle(),
        ]);
        const nombreEscena = escena
          ? `Escena ${escena.numero} · ${escena.titulo}`
          : "el entregable de la etapa";
        await notificarAdminEntrega(
          tomarTitulo(etapa.proyectos) ?? "",
          datosEtapa?.nombre ?? "",
          nombreEscena,
          autor
        );
      } else if (proyecto.publicado) {
        // Un proyecto oculto no se le anuncia al cliente: no lo puede ver
        await notificarRevisores(tomarTitulo(etapa.proyectos) ?? "");
      }
    } catch (error) {
      console.error("[notif proyecto nueva version] fallo:", error);
    }
    return NextResponse.json(nuevaVersion, { status: 201 });
  } catch (error) {
    if (error instanceof SinPermiso) return error.respuesta;
    console.error(error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
