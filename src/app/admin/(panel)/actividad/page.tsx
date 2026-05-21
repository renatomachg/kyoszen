"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface LogEntry {
  id: number;
  accion: string;
  detalle: string | null;
  created_at: string;
}

const ICONS: Record<string, string> = {
  vacante: "M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  curso: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
  blog: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  correo: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  smtp: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  testimonio: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
};

function getIcon(accion: string) {
  const key = Object.keys(ICONS).find((k) => accion.toLowerCase().includes(k));
  return key ? ICONS[key] : "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z";
}

function getColor(accion: string) {
  if (accion.includes("eliminad")) return "bg-red-50 text-red-600 border-red-100";
  if (accion.includes("cread") || accion.includes("nuevo")) return "bg-green-50 text-green-600 border-green-100";
  return "bg-blue/5 text-blue border-blue/20";
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `hace ${d}d`;
  if (h > 0) return `hace ${h}h`;
  if (m > 0) return `hace ${m}m`;
  return "ahora";
}

export default function AdminActividad() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PER_PAGE = 30;

  const load = async (reset = false) => {
    const currentPage = reset ? 0 : page;
    const { data, count } = await supabase
      .from("admin_log")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(currentPage * PER_PAGE, (currentPage + 1) * PER_PAGE - 1);
    const entries = (data as LogEntry[]) ?? [];
    setLogs(reset ? entries : (prev) => [...prev, ...entries]);
    setHasMore((count ?? 0) > (currentPage + 1) * PER_PAGE);
    setPage(currentPage + 1);
    setLoading(false);
  };

  useEffect(() => { load(true); }, []);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">Historial de actividad</h1>
        <p className="text-[13px] text-muted">Registro de todas las acciones realizadas en el panel.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" /></div>
      ) : logs.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <p className="text-muted text-sm">No hay actividad registrada aun.</p>
          <p className="text-muted text-xs mt-1">Las acciones del panel apareceran aqui automaticamente.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="bg-white border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getColor(log.accion)}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={getIcon(log.accion)} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-navy">{log.accion}</p>
                  {log.detalle && <p className="text-[12px] text-muted truncate">{log.detalle}</p>}
                </div>
                <span className="text-[11px] text-muted shrink-0 mt-0.5">{timeAgo(log.created_at)}</span>
              </div>
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center mt-4">
              <button onClick={() => load()} className="border border-border text-navy rounded-xl px-5 py-2 text-sm font-semibold hover:border-blue transition-colors">
                Cargar mas
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
