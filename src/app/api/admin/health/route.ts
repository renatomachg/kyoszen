import { NextResponse } from "next/server";
import os from "os";
import fs from "fs";
import { execSync } from "child_process";

export const runtime = "nodejs";

export async function GET() {
  // Uptime del proceso Next.js
  const uptimeSeconds = Math.floor(process.uptime());
  const h = Math.floor(uptimeSeconds / 3600);
  const m = Math.floor((uptimeSeconds % 3600) / 60);
  const uptime = h > 0 ? `${h}h ${m}m` : `${m}m`;

  // Memoria del sistema
  const totalRam = os.totalmem();
  const freeRam = os.freemem();
  const usedRam = totalRam - freeRam;
  const ramPct = Math.round((usedRam / totalRam) * 100);

  // Memoria del proceso Node
  const mem = process.memoryUsage();
  const nodeRamMB = Math.round(mem.rss / 1024 / 1024);

  // Load average
  const load = os.loadavg();

  // Ultimo deploy
  let lastDeploy = "Desconocido";
  try {
    const deployFile = "/home/kyoszen/last-deploy.txt";
    if (fs.existsSync(deployFile)) {
      lastDeploy = fs.readFileSync(deployFile, "utf8").trim();
    }
  } catch { /* no disponible en local */ }

  // Log del watchdog (ultimas 10 lineas)
  let watchdogLog: string[] = [];
  try {
    const logFile = "/var/log/kyoszen-watchdog.log";
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, "utf8");
      watchdogLog = content.trim().split("\n").filter(Boolean).slice(-10).reverse();
    }
  } catch { /* no disponible en local */ }

  // Estado de PM2
  let pm2Processes: { name: string; status: string; uptime: string; restarts: number }[] = [];
  try {
    const raw = execSync("pm2 jlist 2>/dev/null", { timeout: 3000 }).toString();
    const list = JSON.parse(raw);
    pm2Processes = list.map((p: { name: string; pm2_env?: { status?: string; pm_uptime?: number; restart_time?: number } }) => {
      const uptimeSec = p.pm2_env?.pm_uptime
        ? Math.floor((Date.now() - p.pm2_env.pm_uptime) / 1000)
        : 0;
      const uh = Math.floor(uptimeSec / 3600);
      const um = Math.floor((uptimeSec % 3600) / 60);
      return {
        name: p.name,
        status: p.pm2_env?.status ?? "unknown",
        uptime: uh > 0 ? `${uh}h ${um}m` : `${um}m`,
        restarts: p.pm2_env?.restart_time ?? 0,
      };
    });
  } catch { /* PM2 no disponible en local */ }

  return NextResponse.json({
    uptime,
    ram: { usedMB: Math.round(usedRam / 1024 / 1024), totalMB: Math.round(totalRam / 1024 / 1024), pct: ramPct },
    nodeRamMB,
    load: load[0].toFixed(2),
    lastDeploy,
    watchdogLog,
    pm2Processes,
    node: process.version,
    env: process.env.NODE_ENV,
  });
}
