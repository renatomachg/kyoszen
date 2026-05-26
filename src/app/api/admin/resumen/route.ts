import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ─── Tipos ────────────────────────────────────────────────
interface ResumenData {
  periodo: "semanal" | "mensual";
  label: string;
  fecha: string;
  sesiones: number;
  totalEventos: number;
  vistas: number;
  clicks: number;
  enviadas: number;
  funnelPct1: number;
  funnelPct2: number;
  topVacantes: [string, number][];
  topCursos: [string, number][];
  topAsuntos: [string, number][];
  totalContactos: number;
  totalAplicaciones: number;
  kyoSesiones: number;
  kyoMensajes: number;
  whatsapp: number;
  aplicaciones: { nombre: string | null; vacante: string }[];
}

// ─── Helpers ──────────────────────────────────────────────
async function getSmtpConfig() {
  const { data } = await sb
    .from("site_config")
    .select("key, value")
    .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass", "smtp_from"]);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value;
  return map;
}

async function fetchData(periodo: "semanal" | "mensual"): Promise<ResumenData> {
  const days = periodo === "semanal" ? 7 : 30;
  const since = new Date(Date.now() - days * 86400_000).toISOString();

  const [
    { data: eventos },
    { data: contactos },
    { data: aplicaciones },
    { data: conversaciones },
  ] = await Promise.all([
    sb.from("site_eventos").select("tipo, valor, session_id").gte("created_at", since),
    sb.from("contactos").select("asunto, nombre, created_at").gte("created_at", since).order("created_at", { ascending: false }),
    sb.from("aplicaciones").select("vacante, nombre, created_at").gte("created_at", since).order("created_at", { ascending: false }),
    sb.from("kyo_conversaciones").select("session_id").gte("created_at", since),
  ]);

  const sesiones = new Set((eventos ?? []).map((e) => e.session_id).filter(Boolean)).size;
  const count = (tipo: string) => (eventos ?? []).filter((e) => e.tipo === tipo).length;

  const topValor = (tipo: string, n = 5): [string, number][] => {
    const map: Record<string, number> = {};
    for (const e of eventos ?? []) {
      if (e.tipo !== tipo || !e.valor) continue;
      let key = e.valor;
      try { const p = JSON.parse(e.valor); key = p.titulo ?? e.valor; } catch { /* noop */ }
      map[key] = (map[key] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
  };

  const asuntosCount: Record<string, number> = {};
  for (const c of contactos ?? []) {
    if (c.asunto) asuntosCount[c.asunto] = (asuntosCount[c.asunto] ?? 0) + 1;
  }
  const topAsuntos = Object.entries(asuntosCount).sort((a, b) => b[1] - a[1]).slice(0, 5) as [string, number][];

  const vistas = count("vacante_vista");
  const clicks = count("vacante_aplicar_click");
  const enviadas = count("vacante_aplicacion_enviada");

  return {
    periodo,
    label: periodo === "semanal" ? "Últimos 7 días" : "Últimos 30 días",
    fecha: new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" }),
    sesiones,
    totalEventos: (eventos ?? []).length,
    vistas,
    clicks,
    enviadas,
    funnelPct1: vistas > 0 ? Math.round((clicks / vistas) * 100) : 0,
    funnelPct2: clicks > 0 ? Math.round((enviadas / clicks) * 100) : 0,
    topVacantes: topValor("vacante_vista"),
    topCursos: topValor("curso_informes_click"),
    topAsuntos,
    totalContactos: (contactos ?? []).length,
    totalAplicaciones: (aplicaciones ?? []).length,
    kyoSesiones: (conversaciones ?? []).length,
    kyoMensajes: count("kyo_mensaje"),
    whatsapp: count("whatsapp_click"),
    aplicaciones: (aplicaciones ?? []).slice(0, 10).map((a) => ({ nombre: a.nombre ?? null, vacante: a.vacante })),
  };
}

// ─── PDF HTML Template ─────────────────────────────────────
function buildPdfHtml(d: ResumenData): string {
  const bar = (val: number, max: number, color: string) =>
    `<div style="height:8px;background:#E8EDF5;border-radius:6px;overflow:hidden;margin-top:6px">
      <div style="height:100%;width:${max > 0 ? Math.round((val / max) * 100) : 0}%;background:${color};border-radius:6px;transition:width .3s"></div>
    </div>`;

  const kpiCard = (icon: string, label: string, value: string | number, sub: string) =>
    `<div style="background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;padding:20px 18px;display:flex;flex-direction:column;gap:6px">
      <span style="font-size:22px">${icon}</span>
      <p style="margin:0;font-size:11px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:.6px">${label}</p>
      <p style="margin:0;font-size:28px;font-weight:900;color:#042E7B;line-height:1">${value}</p>
      <p style="margin:0;font-size:11px;color:#94A3B8">${sub}</p>
    </div>`;

  const topRow = (items: [string, number][], unit: string) =>
    items.length === 0
      ? `<p style="color:#94A3B8;font-size:12px;margin:0">Sin datos en este período</p>`
      : items.map(([k, v], i) =>
          `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span style="font-size:11px;font-weight:900;color:#042E7B;width:18px;text-align:right">${i + 1}</span>
            <div style="flex:1">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                <span style="font-size:12.5px;font-weight:600;color:#1E293B">${k}</span>
                <span style="font-size:12.5px;font-weight:800;color:#042E7B">${v} ${unit}</span>
              </div>
              ${bar(v, items[0][1], "#1883FF")}
            </div>
          </div>`
        ).join("");

  const sectionTitle = (title: string) =>
    `<div style="display:flex;align-items:center;gap:10px;margin:28px 0 14px">
      <div style="height:3px;width:28px;background:#FFCC00;border-radius:2px"></div>
      <h2 style="margin:0;font-size:13px;font-weight:900;color:#042E7B;text-transform:uppercase;letter-spacing:.8px">${title}</h2>
    </div>`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      background: #F8FAFC;
      color: #1E293B;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page { max-width: 860px; margin: 0 auto; padding: 0 32px 48px; }
  </style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div style="background:#042E7B;border-radius:0 0 24px 24px;padding:32px 36px 28px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-end">
    <div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
        <div style="background:#FFCC00;border-radius:10px;width:36px;height:36px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#042E7B">KZ</div>
        <span style="color:#fff;font-weight:900;font-size:16px;letter-spacing:.3px">Kyoszen</span>
      </div>
      <h1 style="margin:0;color:#fff;font-size:26px;font-weight:900;line-height:1.2">
        Reporte ${d.periodo === "semanal" ? "Semanal" : "Mensual"}<br>
        <span style="color:#FFCC00">de Actividad Digital</span>
      </h1>
    </div>
    <div style="text-align:right">
      <p style="margin:0;color:rgba(255,255,255,.5);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px">Período</p>
      <p style="margin:4px 0 0;color:#fff;font-size:14px;font-weight:700">${d.label}</p>
      <p style="margin:2px 0 0;color:rgba(255,255,255,.5);font-size:11px">${d.fecha}</p>
    </div>
  </div>

  <!-- KPIs -->
  ${sectionTitle("Resumen ejecutivo")}
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:4px">
    ${kpiCard("👥", "Sesiones únicas", d.sesiones, "Visitantes distintos")}
    ${kpiCard("👁️", "Vistas de vacantes", d.vistas, "Páginas de vacante abiertas")}
    ${kpiCard("✅", "Aplicaciones", d.totalAplicaciones, "Candidatos que aplicaron")}
    ${kpiCard("📩", "Contactos", d.totalContactos, "Formularios recibidos")}
  </div>

  <!-- FUNNEL + TOP VACANTES -->
  ${sectionTitle("Funnel de vacantes")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

    <div style="background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;padding:20px">
      <p style="margin:0 0 16px;font-size:12px;color:#64748B;font-weight:600">De cuántos ven a cuántos aplican</p>
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:12.5px;font-weight:600;color:#1E293B">👁️ Vieron la vacante</span>
          <span style="font-size:13px;font-weight:900;color:#042E7B">${d.vistas}</span>
        </div>
        ${bar(d.vistas, d.vistas || 1, "#1883FF")}
      </div>
      <div style="margin-bottom:12px">
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:12.5px;font-weight:600;color:#1E293B">🖱️ Clic en Aplicar</span>
          <span style="font-size:13px;font-weight:900;color:#042E7B">${d.clicks} <span style="color:#94A3B8;font-weight:500;font-size:11px">(${d.funnelPct1}%)</span></span>
        </div>
        ${bar(d.clicks, d.vistas || 1, "#1883FF99")}
      </div>
      <div>
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:12.5px;font-weight:600;color:#1E293B">✅ Solicitud enviada</span>
          <span style="font-size:13px;font-weight:900;color:#042E7B">${d.enviadas} <span style="color:#94A3B8;font-weight:500;font-size:11px">(${d.funnelPct2}%)</span></span>
        </div>
        ${bar(d.enviadas, d.vistas || 1, "#22C55E")}
      </div>
    </div>

    <div style="background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;padding:20px">
      <p style="margin:0 0 14px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Vacantes más vistas</p>
      ${topRow(d.topVacantes, "vistas")}
    </div>
  </div>

  <!-- CURSOS + CONTACTOS -->
  ${sectionTitle("Cursos y contactos")}
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">

    <div style="background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;padding:20px">
      <p style="margin:0 0 14px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Cursos más solicitados</p>
      ${topRow(d.topCursos, "solicitudes")}
    </div>

    <div style="background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;padding:20px">
      <p style="margin:0 0 14px;font-size:12px;color:#64748B;font-weight:600;text-transform:uppercase;letter-spacing:.5px">Motivos de contacto</p>
      ${topRow(d.topAsuntos, "contactos")}
    </div>
  </div>

  <!-- CANALES DIGITALES -->
  ${sectionTitle("Canales digitales")}
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px">
    ${kpiCard("💬", "Sesiones con Kyo", d.kyoSesiones, "Conversaciones del asistente")}
    ${kpiCard("🗨️", "Mensajes a Kyo", d.kyoMensajes, "Interacciones totales")}
    ${kpiCard("📱", "Clics WhatsApp", d.whatsapp, "Intentos de contacto directo")}
  </div>

  ${d.aplicaciones.length > 0 ? `
  <!-- APLICACIONES -->
  ${sectionTitle("Últimas aplicaciones recibidas")}
  <div style="background:#fff;border:1.5px solid #E2E8F0;border-radius:16px;overflow:hidden">
    <table style="width:100%;border-collapse:collapse;font-size:12.5px">
      <thead>
        <tr style="background:#F1F5F9">
          <th style="text-align:left;padding:10px 16px;font-size:11px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.5px">#</th>
          <th style="text-align:left;padding:10px 16px;font-size:11px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Candidato</th>
          <th style="text-align:left;padding:10px 16px;font-size:11px;color:#64748B;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Vacante</th>
        </tr>
      </thead>
      <tbody>
        ${d.aplicaciones.map((a, i) => `
        <tr style="border-top:1px solid #F1F5F9;${i % 2 === 1 ? "background:#F8FAFC" : ""}">
          <td style="padding:9px 16px;color:#94A3B8;font-weight:700">${i + 1}</td>
          <td style="padding:9px 16px;color:#1E293B;font-weight:600">${a.nombre ?? "Sin nombre"}</td>
          <td style="padding:9px 16px;color:#042E7B;font-weight:600">${a.vacante}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <!-- FOOTER -->
  <div style="margin-top:40px;padding-top:20px;border-top:1.5px solid #E2E8F0;display:flex;justify-content:space-between;align-items:center">
    <div style="display:flex;align-items:center;gap:8px">
      <div style="background:#042E7B;border-radius:7px;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:9px;color:#FFCC00">KZ</div>
      <span style="font-size:11px;color:#94A3B8;font-weight:600">Kyoszen · Panel de Administración</span>
    </div>
    <p style="margin:0;font-size:11px;color:#CBD5E1">Reporte generado el ${d.fecha}</p>
  </div>

</div>
</body>
</html>`;
}

// ─── TXT plano ─────────────────────────────────────────────
function buildTxt(d: ResumenData): string {
  const topList = (items: [string, number][], unit: string) =>
    items.length === 0 ? "  Sin datos" : items.map(([k, v]) => `  • ${k}: ${v} ${unit}`).join("\n");

  return `
REPORTE ${d.periodo.toUpperCase()} — kyoszen.com
Período: ${d.label}  |  Generado: ${d.fecha}

━━━━━━━━━━━━━━━━━━━━━━━━━
  TRÁFICO
━━━━━━━━━━━━━━━━━━━━━━━━━
  Sesiones únicas: ${d.sesiones}
  Eventos totales: ${d.totalEventos}

━━━━━━━━━━━━━━━━━━━━━━━━━
  FUNNEL DE VACANTES
━━━━━━━━━━━━━━━━━━━━━━━━━
  Vistas: ${d.vistas}
  Clics en Aplicar: ${d.clicks} (${d.funnelPct1}%)
  Solicitudes enviadas: ${d.enviadas} (${d.funnelPct2}% de clicks)

  Vacantes más vistas:
${topList(d.topVacantes, "vistas")}

━━━━━━━━━━━━━━━━━━━━━━━━━
  CURSOS
━━━━━━━━━━━━━━━━━━━━━━━━━
${topList(d.topCursos, "solicitudes")}

━━━━━━━━━━━━━━━━━━━━━━━━━
  LEADS
━━━━━━━━━━━━━━━━━━━━━━━━━
  Contactos por formulario: ${d.totalContactos}
  Motivos:
${topList(d.topAsuntos, "contactos")}

━━━━━━━━━━━━━━━━━━━━━━━━━
  ASISTENTE KYO
━━━━━━━━━━━━━━━━━━━━━━━━━
  Sesiones de chat: ${d.kyoSesiones}
  Mensajes enviados: ${d.kyoMensajes}
  Clics en WhatsApp: ${d.whatsapp}

━━━━━━━━━━━━━━━━━━━━━━━━━
  APLICACIONES (${d.totalAplicaciones})
━━━━━━━━━━━━━━━━━━━━━━━━━
${d.aplicaciones.map((a) => `  • ${a.nombre ?? "Sin nombre"} → ${a.vacante}`).join("\n") || "  Sin datos"}
`.trim();
}

// ─── GET — config actual ───────────────────────────────────
export async function GET() {
  const { data } = await sb
    .from("site_config")
    .select("key, value")
    .in("key", ["resumen_email", "resumen_periodicidad"]);
  const map: Record<string, string> = {};
  for (const row of data ?? []) map[row.key] = row.value ?? "";
  return NextResponse.json({ email: map.resumen_email ?? "", periodicidad: map.resumen_periodicidad ?? "desactivado" });
}

// ─── POST — acciones ───────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email, periodicidad } = body;

  if (action === "save_config") {
    await Promise.all([
      sb.from("site_config").upsert({ key: "resumen_email", value: email ?? "" }, { onConflict: "key" }),
      sb.from("site_config").upsert({ key: "resumen_periodicidad", value: periodicidad ?? "desactivado" }, { onConflict: "key" }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const periodo: "semanal" | "mensual" = periodicidad === "semanal" ? "semanal" : "mensual";
  const data = await fetchData(periodo);

  // ── Descargar TXT ──
  if (action === "download") {
    const txt = buildTxt(data);
    return new NextResponse(txt, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="reporte-kyoszen-${new Date().toISOString().slice(0, 10)}.txt"`,
      },
    });
  }

  // ── Descargar PDF ──
  if (action === "download_pdf") {
    const html = buildPdfHtml(data);
    // Lazy import para no bloquear el bundle en builds estáticos
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      });
      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="reporte-kyoszen-${new Date().toISOString().slice(0, 10)}.pdf"`,
        },
      });
    } finally {
      await browser.close();
    }
  }

  // ── Enviar por correo ──
  if (action === "send") {
    const destEmail = email || body.configEmail;
    if (!destEmail) return NextResponse.json({ error: "Falta el correo de destino" }, { status: 400 });

    const smtp = await getSmtpConfig();
    if (!smtp.smtp_host || !smtp.smtp_user || !smtp.smtp_pass) {
      return NextResponse.json({ error: "SMTP no configurado en site_config" }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.smtp_host,
      port: parseInt(smtp.smtp_port ?? "465"),
      secure: parseInt(smtp.smtp_port ?? "465") === 465,
      auth: { user: smtp.smtp_user, pass: smtp.smtp_pass },
    });

    const txt = buildTxt(data);
    const html = buildPdfHtml(data);

    await transporter.sendMail({
      from: `"Kyoszen Panel" <${smtp.smtp_from ?? smtp.smtp_user}>`,
      to: destEmail,
      subject: `Reporte ${periodo} Kyoszen — ${data.fecha}`,
      text: txt,
      html: html,
    });

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
}
