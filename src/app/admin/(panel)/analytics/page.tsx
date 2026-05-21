"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

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
  { key: "kyo_mensaje", label: "Mensajes a Kyo", color: "bg-blue", icon: "💬" },
  { key: "kyo_navegacion", label: "Navegaciones de Kyo", color: "bg-navy", icon: "🧭" },
  { key: "busqueda_vacantes", label: "Busquedas en Vacantes", color: "bg-yellow", icon: "🔍" },
  { key: "ver_categoria_curso", label: "Categorias de Cursos", color: "bg-green-500", icon: "📚" },
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

function StatCard({ label, value, icon, sub }: { label: string; value: number; icon: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-black text-navy">{value.toLocaleString()}</p>
      <p className="text-[12px] font-semibold text-navy mt-1">{label}</p>
      {sub && <p className="text-[11px] text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function TopList({ title, rows, emptyMsg }: { title: string; rows: TopRow[]; emptyMsg: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5">
      <h3 className="text-[13px] font-black text-navy mb-4">{title}</h3>
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
  const [tab, setTab] = useState<"resumen" | "feed">("resumen");

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

  // ---- Metricas ----
  const totalEventos = eventos.length;
  const sessionesUnicas = new Set(eventos.map((e) => e.session_id).filter(Boolean)).size;

  const conteo = (tipo: string) => eventos.filter((e) => e.tipo === tipo).length;

  const top = (tipo: string, n = 10): TopRow[] => {
    const map: Record<string, number> = {};
    for (const e of eventos) {
      if (e.tipo !== tipo || !e.valor) continue;
      map[e.valor] = (map[e.valor] ?? 0) + 1;
    }
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([valor, count]) => ({ valor, count }));
  };

  const feed = eventos.slice(0, 200);

  const tipoLabel: Record<string, string> = {
    kyo_mensaje: "Mensaje Kyo",
    kyo_navegacion: "Navegacion Kyo",
    busqueda_vacantes: "Busqueda Vacantes",
    ver_categoria_curso: "Categoria Cursos",
  };

  const tipoBadge: Record<string, string> = {
    kyo_mensaje: "bg-blue/10 text-blue",
    kyo_navegacion: "bg-navy/10 text-navy",
    busqueda_vacantes: "bg-yellow/30 text-yellow-700",
    ver_categoria_curso: "bg-green-100 text-green-700",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">Analytics</h1>
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
      <div className="flex gap-1 mb-6 border-b border-border">
        {(["resumen", "feed"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[13px] font-bold capitalize border-b-2 transition-colors ${
              tab === t ? "border-blue text-blue" : "border-transparent text-muted hover:text-navy"
            }`}
          >
            {t === "resumen" ? "Resumen" : "Feed de eventos"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === "resumen" ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <StatCard label="Total eventos" value={totalEventos} icon="📊" />
            <StatCard label="Sesiones unicas" value={sessionesUnicas} icon="👥" />
            <StatCard label="Mensajes a Kyo" value={conteo("kyo_mensaje")} icon="💬" />
            <StatCard label="Navegaciones Kyo" value={conteo("kyo_navegacion")} icon="🧭" />
            <StatCard label="Busquedas vacantes" value={conteo("busqueda_vacantes")} icon="🔍" />
            <StatCard label="Vistas categoria" value={conteo("ver_categoria_curso")} icon="📚" />
          </div>

          {/* Top lists */}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            <TopList
              title="Lo que mas preguntan a Kyo"
              rows={top("kyo_mensaje")}
              emptyMsg="Sin mensajes en este periodo"
            />
            <TopList
              title="Rutas donde navega Kyo"
              rows={top("kyo_navegacion")}
              emptyMsg="Sin navegaciones en este periodo"
            />
            <TopList
              title="Terminos buscados en Vacantes"
              rows={top("busqueda_vacantes")}
              emptyMsg="Sin busquedas en este periodo"
            />
            <TopList
              title="Categorias de cursos mas vistas"
              rows={top("ver_categoria_curso")}
              emptyMsg="Sin clics en este periodo"
            />

            {/* Actividad por tipo */}
            <div className="bg-white rounded-2xl border border-border p-5 md:col-span-2">
              <h3 className="text-[13px] font-black text-navy mb-4">Distribucion de eventos</h3>
              {TIPOS.map((t) => {
                const n = conteo(t.key);
                const pct = totalEventos > 0 ? Math.round((n / totalEventos) * 100) : 0;
                return (
                  <div key={t.key} className="flex items-center gap-3 mb-3 last:mb-0">
                    <span className="text-base w-6">{t.icon}</span>
                    <span className="text-[12px] font-semibold text-navy w-40 shrink-0">{t.label}</span>
                    <div className="flex-1 bg-bg rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-blue rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[12px] font-black text-navy w-10 text-right">{n}</span>
                    <span className="text-[11px] text-muted w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SQL hint */}
          <div className="mt-6 bg-navy/5 border border-navy/10 rounded-xl p-4">
            <p className="text-[11px] text-muted font-mono">
              Tabla Supabase requerida: <strong className="text-navy">site_eventos</strong> (id serial, tipo text, valor text, session_id text, created_at timestamptz default now())
            </p>
          </div>
        </>
      ) : (
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
      )}
    </div>
  );
}
