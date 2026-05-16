"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Stats {
  vacantes: number;
  aplicaciones_nuevas: number;
  contactos_nuevos: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ vacantes: 0, aplicaciones_nuevas: 0, contactos_nuevos: 0 });
  const [aplicaciones, setAplicaciones] = useState<{ id: number; nombre: string; vacante: string; leida: boolean; created_at: string }[]>([]);
  const [contactos, setContactos] = useState<{ id: number; nombre: string; asunto: string; leido: boolean; created_at: string }[]>([]);

  useEffect(() => {
    async function load() {
      const [
        { count: vacantes },
        { count: aplicaciones_nuevas },
        { count: contactos_nuevos },
        { data: recentAplicaciones },
        { data: recentContactos },
      ] = await Promise.all([
        supabase.from("vacantes").select("*", { count: "exact", head: true }).eq("activa", true),
        supabase.from("aplicaciones").select("*", { count: "exact", head: true }).eq("leida", false),
        supabase.from("contactos").select("*", { count: "exact", head: true }).eq("leido", false),
        supabase.from("aplicaciones").select("id,nombre,vacante,leida,created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("contactos").select("id,nombre,asunto,leido,created_at").order("created_at", { ascending: false }).limit(5),
      ]);

      setStats({
        vacantes: vacantes ?? 0,
        aplicaciones_nuevas: aplicaciones_nuevas ?? 0,
        contactos_nuevos: contactos_nuevos ?? 0,
      });
      setAplicaciones((recentAplicaciones as typeof aplicaciones) ?? []);
      setContactos((recentContactos as typeof contactos) ?? []);
    }
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-1">Dashboard</h1>
      <p className="text-[13px] text-muted mb-8">Resumen general del sitio Kyoszen</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard label="Vacantes activas" value={stats.vacantes} href="/admin/vacantes" colorClass="text-blue" />
        <StatCard label="Aplicaciones nuevas" value={stats.aplicaciones_nuevas} href="/admin/aplicaciones" colorClass="text-yellow-600" />
        <StatCard label="Mensajes nuevos" value={stats.contactos_nuevos} href="/admin/contactos" colorClass="text-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentCard
          title="Aplicaciones recientes"
          href="/admin/aplicaciones"
          empty={aplicaciones.length === 0}
        >
          {aplicaciones.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-[13px] font-bold text-navy">{a.nombre}</p>
                <p className="text-[11px] text-muted">{a.vacante}</p>
              </div>
              {!a.leida && <span className="w-2 h-2 rounded-full bg-blue shrink-0" />}
            </div>
          ))}
        </RecentCard>

        <RecentCard
          title="Mensajes recientes"
          href="/admin/contactos"
          empty={contactos.length === 0}
        >
          {contactos.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
              <div>
                <p className="text-[13px] font-bold text-navy">{c.nombre}</p>
                <p className="text-[11px] text-muted">{c.asunto}</p>
              </div>
              {!c.leido && <span className="w-2 h-2 rounded-full bg-blue shrink-0" />}
            </div>
          ))}
        </RecentCard>
      </div>
    </div>
  );
}

function StatCard({ label, value, href, colorClass }: { label: string; value: number; href: string; colorClass: string }) {
  return (
    <Link href={href} className="bg-white rounded-2xl border border-border p-6 hover:border-blue-mid transition-colors block">
      <p className={`text-4xl font-black mb-1 ${colorClass}`}>{value}</p>
      <p className="text-[12px] text-muted font-semibold">{label}</p>
    </Link>
  );
}

function RecentCard({ title, href, empty, children }: { title: string; href: string; empty: boolean; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-extrabold text-navy text-[15px]">{title}</h2>
        <Link href={href} className="text-[12px] text-blue font-semibold hover:underline">Ver todos</Link>
      </div>
      {empty ? (
        <p className="text-[13px] text-muted text-center py-8">Sin registros aun</p>
      ) : children}
    </div>
  );
}
