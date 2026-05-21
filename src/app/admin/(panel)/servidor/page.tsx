"use client";

import { useEffect, useState } from "react";

interface HealthData {
  uptime: string;
  ram: { usedMB: number; totalMB: number; pct: number };
  nodeRamMB: number;
  load: string;
  lastDeploy: string;
  watchdogLog: string[];
  pm2Processes: { name: string; status: string; uptime: string; restarts: number }[];
  node: string;
  env: string;
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-green-500" : "bg-red-500"}`} />
  );
}

export default function AdminServidor() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/health");
      const json = await res.json();
      setData(json);
      setLastChecked(new Date());
    } catch {
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchHealth(); }, []);

  const card = "bg-white border border-border rounded-2xl p-5";
  const statLabel = "text-[11px] font-bold text-muted uppercase tracking-wide mb-1";
  const statValue = "text-[22px] font-black text-navy leading-none";

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">Estado del servidor</h1>
          <p className="text-[13px] text-muted">
            {lastChecked ? `Ultima actualizacion: ${lastChecked.toLocaleTimeString("es-MX")}` : "Cargando..."}
          </p>
        </div>
        <button onClick={fetchHealth} disabled={loading}
          className="flex items-center gap-2 border border-border text-navy rounded-xl px-4 py-2 text-[13px] font-semibold hover:border-blue transition-colors disabled:opacity-50">
          {loading ? <span className="w-3.5 h-3.5 border-2 border-navy border-t-transparent rounded-full animate-spin inline-block" /> : "↻"}
          Actualizar
        </button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" /></div>
      ) : !data ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-6 text-sm">No se pudo obtener informacion del servidor.</div>
      ) : (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className={card}>
              <p className={statLabel}>Uptime app</p>
              <p className={statValue}>{data.uptime}</p>
            </div>
            <div className={card}>
              <p className={statLabel}>RAM sistema</p>
              <p className={statValue}>{data.ram.pct}%</p>
              <p className="text-[11px] text-muted mt-1">{data.ram.usedMB} / {data.ram.totalMB} MB</p>
            </div>
            <div className={card}>
              <p className={statLabel}>RAM Node.js</p>
              <p className={statValue}>{data.nodeRamMB} MB</p>
            </div>
            <div className={card}>
              <p className={statLabel}>Carga CPU</p>
              <p className={statValue}>{data.load}</p>
            </div>
          </div>

          {/* Info general */}
          <div className={card}>
            <h2 className="text-[13px] font-black text-navy mb-3">Informacion del sistema</h2>
            <div className="grid grid-cols-2 gap-y-2">
              {[
                { label: "Node.js", value: data.node },
                { label: "Entorno", value: data.env },
                { label: "Ultimo deploy", value: data.lastDeploy },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted w-28">{label}</span>
                  <span className="text-[12px] font-mono text-navy">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PM2 */}
          {data.pm2Processes.length > 0 && (
            <div className={card}>
              <h2 className="text-[13px] font-black text-navy mb-3">Procesos PM2</h2>
              <div className="space-y-2">
                {data.pm2Processes.map((p) => (
                  <div key={p.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <StatusDot ok={p.status === "online"} />
                      <span className="text-[13px] font-bold text-navy">{p.name}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.status === "online" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-muted">
                      <span>Uptime: {p.uptime}</span>
                      <span>Reinicios: {p.restarts}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Watchdog log */}
          <div className={card}>
            <h2 className="text-[13px] font-black text-navy mb-3">Log del watchdog
              <span className="text-[11px] font-normal text-muted ml-2">(ultimas 10 entradas)</span>
            </h2>
            {data.watchdogLog.length === 0 ? (
              <p className="text-[12.5px] text-green-600 font-semibold">✓ Sin incidentes registrados — el sitio ha estado estable.</p>
            ) : (
              <div className="bg-bg border border-border rounded-xl p-3 space-y-1 font-mono">
                {data.watchdogLog.map((line, i) => (
                  <p key={i} className={`text-[11.5px] ${line.includes("CRITICO") ? "text-red-600" : line.includes("CAIDO") || line.includes("ALERTA") ? "text-yellow-700" : line.includes("RECUPERADO") || line.includes("exitosamente") ? "text-green-600" : "text-muted"}`}>
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
