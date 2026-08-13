"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { Dot, IconUI, type IconUIName } from "@/components/ui/IconUI";
import { fetchAdmin } from "@/lib/admin-fetch";


// Use service role on admin side for unrestricted read
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Evento {
  id: number;
  tipo: string;
  valor: string | null;
  session_id: string | null;
  created_at: string;
}

interface TopRow {
  valor: string;
  count: number;
}

const TIPOS = [
  { key: "kyo_mensaje", label: "Mensajes a Kyo", color: "bg-blue", icon: "comment" },
  { key: "kyo_navegacion", label: "Navegaciones de Kyo", color: "bg-navy", icon: "navigation" },
  { key: "busqueda_vacantes", label: "Busquedas en Vacantes", color: "bg-yellow", icon: "search" },
  { key: "ver_categoria_curso", label: "Categorias de Cursos", color: "bg-green-500", icon: "book-open" },
  { key: "vacante_vista", label: "Vistas de Vacantes", color: "bg-blue", icon: "eye" },
  { key: "vacante_aplicar_click", label: "Clicks Aplicar", color: "bg-navy", icon: "mouse-pointer" },
  { key: "vacante_aplicacion_enviada", label: "Aplicaciones Enviadas", color: "bg-green-500", icon: "check" },
  { key: "curso_informes_click", label: "Clicks Informes Curso", color: "bg-yellow", icon: "clipboard" },
  { key: "whatsapp_click", label: "Clicks WhatsApp", color: "bg-green-500", icon: "phone" },
  { key: "contacto_enviado", label: "Formularios Contacto", color: "bg-blue", icon: "mail" },
];

const RANGOS = [
  { label: "Hoy", days: 1 },
  { label: "7 dias", days: 7 },
  { label: "30 dias", days: 30 },
  { label: "Todo", days: 0 },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({
  label,
  value,
  icon,
  sub,
  tone,
}: {
  label: string;
  value: number;
  icon: IconUIName;
  sub?: string;
  tone: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-[0_8px_24px_rgba(4,46,123,0.04)]">
      <div className="flex items-start justify-between mb-3">
        <span className={`w-10 h-10 rounded-xl flex items-center justify-center ${tone}`}>
          <IconUI name={icon} size={19} />
        </span>
        <Dot color="#FFCC00" size={6} />
      </div>
      <p className="text-3xl font-black text-navy">{value.toLocaleString()}</p>
      <p className="text-[12px] font-semibold text-navy mt-1">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function TopList({ title, rows, emptyMsg }: { title: string; rows: TopRow[]; emptyMsg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-[0_8px_24px_rgba(4,46,123,0.04)]">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-7 h-7 rounded-lg bg-blue/10 text-blue flex items-center justify-center">
          <IconUI name="trophy" size={14} />
        </span>
        <h3 className="text-[13px] font-black text-navy">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="text-[12px] text-muted py-4 text-center">{emptyMsg}</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-[11px] font-black text-muted w-4 shrink-0">{i + 1}</span>
              <div className="flex-1 min-w-0">
                <div
                  className="h-5 rounded-md bg-blue/10 flex items-center px-2"
                  style={{ width: `${Math.max(18, (r.count / (rows[0]?.count || 1)) * 100)}%` }}
                >
                  <span className="text-[11px] font-semibold text-navy truncate">{r.valor}</span>
                </div>
              </div>
              <span className="text-[12px] font-black text-navy shrink-0">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminAnalytics() {
  const [rango, setRango] = useState(7);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"resumen" | "feed" | "reportes">("resumen");

  /* ── Reportes state ── */
  const [reporteEmail, setReporteEmail] = useState("");
  const [reportePeriodicidad, setReportePeriodicidad] = useState<"desactivado" | "semanal" | "mensual">("desactivado");
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaved, setConfigSaved] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  // Cargar config de reportes
  useEffect(() => {
    if (tab !== "reportes") return;
    setLoadingConfig(true);
    fetchAdmin("/api/admin/resumen")
      .then((r) => r.json())
      .then((d) => {
        setReporteEmail(d.email ?? "");
        setReportePeriodicidad(d.periodicidad ?? "desactivado");
      })
      .finally(() => setLoadingConfig(false));
  }, [tab]);

  const saveReporteConfig = async () => {
    setSavingConfig(true);
    await fetchAdmin("/api/admin/resumen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "save_config", email: reporteEmail, periodicidad: reportePeriodicidad }),
    });
    setSavingConfig(false);
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 3000);
  };

  const downloadFile = async (action: "download" | "download_pdf", ext: "txt" | "pdf") => {
    const periodo = reportePeriodicidad === "desactivado" ? "mensual" : reportePeriodicidad;
    setReportMsg(action === "download_pdf" ? "Generando PDF..." : "");
    const res = await fetchAdmin("/api/admin/resumen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, periodicidad: periodo }),
    });
    if (!res.ok) { setReportMsg("Error al generar el archivo."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-kyoszen-${new Date().toISOString().slice(0, 10)}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    setReportMsg("");
  };

  const downloadReport = () => downloadFile("download", "txt");
  const downloadPdf = () => downloadFile("download_pdf", "pdf");

  const sendReport = async () => {
    if (!reporteEmail) { setReportMsg("Primero configura el correo de destino."); return; }
    const periodo = reportePeriodicidad === "desactivado" ? "mensual" : reportePeriodicidad;
    setSendingReport(true);
    setReportMsg("");
    const res = await fetchAdmin("/api/admin/resumen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", email: reporteEmail, periodicidad: periodo }),
    });
    setSendingReport(false);
    if (res.ok) setReportMsg("Resumen enviado correctamente.");
    else setReportMsg("Error al enviar. Verifica la configuración SMTP.");
  };

  useEffect(() => {
    setLoading(true);
    let query = sb.from("site_eventos").select("*").order("created_at", { ascending: false }).limit(2000);
    if (rango > 0) {
      const since = new Date(Date.now() - rango * 86400_000).toISOString();
      query = query.gte("created_at", since);
    }
    query.then(({ data }) => {
      setEventos((data as Evento[]) ?? []);
      setLoading(false);
    });
  }, [rango]);

  // ---- Helpers ----
  const conteo = (tipo: string) => eventos.filter((e) => e.tipo === tipo).length;

  const top = (tipo: string, n = 8): TopRow[] => {
    const map: Record<string, number> = {};
    for (const e of eventos) {
      if (e.tipo !== tipo || !e.valor) continue;
      map[e.valor] = (map[e.valor] ?? 0) + 1;
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([valor, count]) => ({ valor, count }));
  };

  // Para eventos con valor JSON: extrae campo "titulo"
  const topPorTitulo = (tipo: string, n = 8): TopRow[] => {
    const map: Record<string, number> = {};
    for (const e of eventos) {
      if (e.tipo !== tipo || !e.valor) continue;
      try {
        const obj = JSON.parse(e.valor);
        const key = obj.titulo ?? e.valor;
        map[key] = (map[key] ?? 0) + 1;
      } catch {
        map[e.valor] = (map[e.valor] ?? 0) + 1;
      }
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n).map(([valor, count]) => ({ valor, count }));
  };

  // ---- Metricas ----
  const totalEventos = eventos.length;
  const sessionesUnicas = new Set(eventos.map((e) => e.session_id).filter(Boolean)).size;

  // Funnel vacantes
  const vacanteVistas = conteo("vacante_vista");
  const vacanteClicks = conteo("vacante_aplicar_click");
  const vacanteEnviadas = conteo("vacante_aplicacion_enviada");
  const funnelPct1 = vacanteVistas > 0 ? Math.round((vacanteClicks / vacanteVistas) * 100) : 0;
  const funnelPct2 = vacanteClicks > 0 ? Math.round((vacanteEnviadas / vacanteClicks) * 100) : 0;

  const feed = eventos.slice(0, 200);

  const tipoLabel: Record<string, string> = {
    kyo_mensaje: "Mensaje Kyo",
    kyo_navegacion: "Navegacion Kyo",
    busqueda_vacantes: "Busqueda Vacantes",
    ver_categoria_curso: "Categoria Cursos",
    vacante_vista: "Vacante Vista",
    vacante_aplicar_click: "Click Aplicar",
    vacante_aplicacion_enviada: "Aplicacion Enviada",
    curso_informes_click: "Click Informes Curso",
    curso_informes_enviada: "Informes Enviados",
    whatsapp_click: "Click WhatsApp",
    contacto_enviado: "Contacto Enviado",
  };

  const tipoBadge: Record<string, string> = {
    kyo_mensaje: "bg-blue/10 text-blue",
    kyo_navegacion: "bg-navy/10 text-navy",
    busqueda_vacantes: "bg-yellow/30 text-yellow-700",
    ver_categoria_curso: "bg-green-100 text-green-700",
    vacante_vista: "bg-blue/10 text-blue",
    vacante_aplicar_click: "bg-navy/10 text-navy",
    vacante_aplicacion_enviada: "bg-green-100 text-green-700",
    curso_informes_click: "bg-yellow/30 text-yellow-700",
    curso_informes_enviada: "bg-green-100 text-green-700",
    whatsapp_click: "bg-green-100 text-green-700",
    contacto_enviado: "bg-blue/10 text-blue",
  };

  const tabIcon: Record<typeof tab, IconUIName> = {
    resumen: "chart",
    feed: "clock",
    reportes: "document",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="w-10 h-10 rounded-xl bg-navy text-yellow flex items-center justify-center">
              <IconUI name="chart" size={20} />
            </span>
            <h1 className="text-2xl font-black text-navy">Analytics</h1>
          </div>
          <p className="text-[13px] text-muted">Comportamiento de usuarios en el sitio y con el asistente Kyo</p>
        </div>
        {/* Rango */}
        <div className="flex gap-1.5 bg-white border border-border rounded-xl p-1">
          {RANGOS.map((r) => (
            <button
              key={r.days}
              onClick={() => setRango(r.days)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors ${
                rango === r.days ? "bg-navy text-white" : "text-muted hover:text-navy"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto">
        {(["resumen", "feed", "reportes"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold capitalize border-b-2 transition-colors whitespace-nowrap ${
              tab === t ? "border-navy text-navy" : "border-transparent text-muted hover:text-navy"
            }`}
          >
            <IconUI name={tabIcon[t]} size={15} />
            {t === "resumen" ? "Resumen" : t === "feed" ? "Feed de eventos" : "Reportes"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "resumen" ? (
        <>
          {/* KPIs principales */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Sesiones unicas" value={sessionesUnicas} icon="users" tone="bg-blue/10 text-blue" sub="Visitantes distintos" />
            <StatCard label="Vistas de vacantes" value={vacanteVistas} icon="eye" tone="bg-navy/10 text-navy" sub="Paginas de vacante abiertas" />
            <StatCard label="Aplicaciones enviadas" value={vacanteEnviadas} icon="check" tone="bg-green-50 text-green-700" sub="Candidatos que aplicaron" />
            <StatCard label="Solicitudes de cursos" value={conteo("curso_informes_enviada")} icon="clipboard" tone="bg-yellow/20 text-yellow-700" sub="Informes de curso enviados" />
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-5">

            {/* Funnel vacantes */}
            <div className="bg-white rounded-2xl border border-border p-5 shadow-[0_8px_24px_rgba(4,46,123,0.04)]">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-lg bg-yellow/20 text-navy flex items-center justify-center">
                  <IconUI name="funnel" size={14} />
                </span>
                <h3 className="text-[13px] font-black text-navy">Funnel de vacantes</h3>
              </div>
              <p className="text-[11px] text-muted mb-4">De cuantos ven a cuantos aplican</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-navy"><IconUI name="eye" size={13} /> Vieron la vacante</span>
                    <span className="text-[12px] font-black text-navy">{vacanteVistas}</span>
                  </div>
                  <div className="h-2.5 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-blue rounded-full w-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-navy"><IconUI name="mouse-pointer" size={13} /> Hicieron clic en Aplicar</span>
                    <span className="text-[12px] font-black text-navy">{vacanteClicks} <span className="text-muted font-normal">({funnelPct1}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-blue/60 rounded-full" style={{ width: `${funnelPct1}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-[12px] font-semibold text-navy"><IconUI name="check" size={13} /> Enviaron su solicitud</span>
                    <span className="text-[12px] font-black text-navy">{vacanteEnviadas} <span className="text-muted font-normal">({funnelPct2}%)</span></span>
                  </div>
                  <div className="h-2.5 bg-bg rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${funnelPct2}%` }} />
                  </div>
                </div>
              </div>
              {vacanteVistas === 0 && (
                <p className="text-[11px] text-muted text-center mt-4">Sin datos en este periodo</p>
              )}
            </div>

            {/* Vacantes mas vistas */}
            <TopList
              title="Vacantes mas vistas"
              rows={topPorTitulo("vacante_vista")}
              emptyMsg="Sin vistas en este periodo"
            />

            {/* Cursos mas solicitados */}
            <TopList
              title="Cursos con mas solicitudes"
              rows={top("curso_informes_click")}
              emptyMsg="Sin solicitudes en este periodo"
            />

            {/* Contactos por asunto */}
            <TopList
              title="Motivo de contacto"
              rows={top("contacto_enviado")}
              emptyMsg="Sin contactos en este periodo"
            />

            {/* WhatsApp + Kyo */}
            <div className="bg-white rounded-2xl border border-border p-5 shadow-[0_8px_24px_rgba(4,46,123,0.04)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-7 h-7 rounded-lg bg-navy/10 text-navy flex items-center justify-center">
                  <IconUI name="globe" size={14} />
                </span>
                <h3 className="text-[13px] font-black text-navy">Otros canales</h3>
              </div>
              <div className="space-y-4">
                {([
                  { label: "Clicks a WhatsApp", value: conteo("whatsapp_click"), icon: "phone", color: "#16A34A" },
                  { label: "Mensajes a Kyo", value: conteo("kyo_mensaje"), icon: "comment", color: "#1883FF" },
                  { label: "Navegaciones de Kyo", value: conteo("kyo_navegacion"), icon: "navigation", color: "#042E7B" },
                  { label: "Busquedas en vacantes", value: conteo("busqueda_vacantes"), icon: "search", color: "#D97706" },
                ] as { label: string; value: number; icon: IconUIName; color: string }[]).map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-bg flex items-center justify-center" style={{ color: item.color }}>
                      <IconUI name={item.icon} size={14} />
                    </span>
                    <span className="flex-1 text-[12px] font-semibold text-navy">{item.label}</span>
                    <span className="text-[14px] font-black text-navy">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lo que mas preguntan a Kyo */}
            <TopList
              title="Lo que mas preguntan a Kyo"
              rows={top("kyo_mensaje")}
              emptyMsg="Sin mensajes en este periodo"
            />
          </div>
        </>
      ) : tab === "feed" ? (
        /* Feed tab */
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide">Tipo</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide hidden md:table-cell">Sesion</th>
                <th className="text-left px-4 py-3 text-[11px] font-bold text-muted uppercase tracking-wide hidden lg:table-cell">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {feed.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-muted text-sm">
                    No hay eventos en este periodo
                  </td>
                </tr>
              ) : (
                feed.map((e, i) => (
                  <tr key={e.id} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-bg/40"}`}>
                    <td className="px-4 py-2.5">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${tipoBadge[e.tipo] ?? "bg-border/40 text-muted"}`}>
                        {tipoLabel[e.tipo] ?? e.tipo}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 max-w-xs">
                      <span className="text-[12px] text-navy truncate block">{e.valor ?? "—"}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="text-[11px] text-muted font-mono">{e.session_id?.slice(0, 8) ?? "—"}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden lg:table-cell">
                      <span className="text-[11px] text-muted">{formatDate(e.created_at)}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Reportes tab */
        <div className="max-w-xl space-y-6">
          {loadingConfig ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Config */}
              <div className="bg-white border border-border rounded-2xl p-6 space-y-5 shadow-[0_8px_24px_rgba(4,46,123,0.04)]">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-navy/10 text-navy flex items-center justify-center shrink-0">
                    <IconUI name="calendar" size={17} />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-black text-navy mb-1">Reporte periódico</h3>
                    <p className="text-[12.5px] text-muted">Recibe un resumen de actividad por correo de forma automática.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-navy uppercase tracking-wide mb-1.5">Correo de destino</label>
                  <input
                    type="email"
                    value={reporteEmail}
                    onChange={(e) => setReporteEmail(e.target.value)}
                    placeholder="rsalazar@kyoszen.com.mx"
                    className="w-full border border-border rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-blue transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-navy uppercase tracking-wide mb-1.5">Periodicidad</label>
                  <div className="flex gap-2">
                    {(["desactivado", "semanal", "mensual"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setReportePeriodicidad(p)}
                        className={`flex-1 py-2.5 rounded-xl text-[12.5px] font-semibold border transition-colors capitalize ${
                          reportePeriodicidad === p
                            ? "bg-navy text-white border-navy"
                            : "bg-bg text-muted border-border hover:border-navy hover:text-navy"
                        }`}
                      >
                        {p === "desactivado" ? "Desactivado" : p === "semanal" ? "Semanal" : "Mensual"}
                      </button>
                    ))}
                  </div>
                  {reportePeriodicidad !== "desactivado" && (
                    <p className="text-[11px] text-muted mt-2">
                      {reportePeriodicidad === "semanal"
                        ? "Se enviará cada lunes a las 8am (requiere cron en el servidor)."
                        : "Se enviará el 1° de cada mes a las 8am (requiere cron en el servidor)."}
                    </p>
                  )}
                </div>

                <button
                  onClick={saveReporteConfig}
                  disabled={savingConfig}
                  className="w-full flex items-center justify-center gap-2 bg-yellow text-navy rounded-xl py-2.5 text-[13px] font-bold hover:bg-yellow/85 transition-colors disabled:opacity-50"
                >
                  {configSaved && <IconUI name="check" size={15} />}
                  {savingConfig ? "Guardando..." : configSaved ? "Guardado" : "Guardar configuración"}
                </button>
              </div>

              {/* Acciones manuales */}
              <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-[0_8px_24px_rgba(4,46,123,0.04)]">
                <div className="flex items-start gap-3">
                  <span className="w-9 h-9 rounded-xl bg-blue/10 text-blue flex items-center justify-center shrink-0">
                    <IconUI name="document" size={17} />
                  </span>
                  <div>
                    <h3 className="text-[14px] font-black text-navy mb-1">Generar resumen ahora</h3>
                    <p className="text-[12.5px] text-muted">Genera el resumen del período seleccionado y descárgalo o envíalo al correo configurado.</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={downloadPdf}
                    className="w-full flex items-center justify-center gap-2 bg-yellow text-navy rounded-xl py-2.5 text-[13px] font-bold hover:bg-yellow/85 transition-colors"
                  >
                    <IconUI name="download" size={15} />
                    Descargar PDF con diseño
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={downloadReport}
                      className="flex-1 flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-[13px] font-semibold text-navy hover:bg-bg transition-colors"
                    >
                      <IconUI name="download" size={14} />
                      Descargar .txt
                    </button>
                    <button
                      onClick={sendReport}
                      disabled={sendingReport}
                      className="flex-1 flex items-center justify-center gap-2 border border-blue/30 text-blue rounded-xl py-2.5 text-[13px] font-semibold hover:bg-blue/5 transition-colors disabled:opacity-50"
                    >
                      <IconUI name="mail" size={14} />
                      {sendingReport ? "Enviando..." : "Enviar correo"}
                    </button>
                  </div>
                </div>

                {reportMsg && (
                  <p className={`flex items-center justify-center gap-2 text-[12.5px] font-semibold ${
                    reportMsg.startsWith("Error") ? "text-red-600" : reportMsg.includes("correctamente") ? "text-green-700" : "text-navy"
                  }`}>
                    <IconUI
                      name={reportMsg.startsWith("Error") ? "x" : reportMsg.includes("correctamente") ? "check" : "clock"}
                      size={14}
                    />
                    {reportMsg}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
