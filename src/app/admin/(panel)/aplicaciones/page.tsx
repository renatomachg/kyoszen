"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Aplicacion {
  id: number;
  nombre: string;
  correo: string;
  whatsapp: string;
  vacante: string;
  experiencia: string;
  ubicacion: string;
  documentacion: string;
  cv_url: string | null;
  leida: boolean;
  created_at: string;
}

export default function AdminAplicaciones() {
  const [aplicaciones, setAplicaciones] = useState<Aplicacion[]>([]);
  const [selected, setSelected] = useState<Aplicacion | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("aplicaciones")
      .select("*")
      .order("created_at", { ascending: false });
    setAplicaciones((data as Aplicacion[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const marcarLeida = async (id: number) => {
    await supabase.from("aplicaciones").update({ leida: true }).eq("id", id);
    setAplicaciones((prev) => prev.map((a) => a.id === id ? { ...a, leida: true } : a));
    setSelected((prev) => prev?.id === id ? { ...prev, leida: true } : prev);
  };

  const nuevas = aplicaciones.filter((a) => !a.leida).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">Aplicaciones</h1>
        <p className="text-[13px] text-muted">{nuevas} nuevas · {aplicaciones.length} total</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : aplicaciones.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-muted text-[14px]">No hay aplicaciones aun</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* List */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {aplicaciones.map((a) => (
              <div
                key={a.id}
                onClick={() => { setSelected(a); if (!a.leida) marcarLeida(a.id); }}
                className={`flex items-start gap-3 px-5 py-4 border-b border-border last:border-0 cursor-pointer transition-colors ${
                  selected?.id === a.id ? "bg-blue-soft" : "hover:bg-bg"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5">
                  {a.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-navy truncate">{a.nombre}</p>
                    {!a.leida && <span className="w-2 h-2 rounded-full bg-blue shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted truncate">{a.vacante}</p>
                  <p className="text-[10px] text-muted mt-0.5">{new Date(a.created_at).toLocaleDateString("es-MX")}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="bg-white rounded-2xl border border-border p-6 h-fit sticky top-6">
            {!selected ? (
              <p className="text-[13px] text-muted text-center py-8">Selecciona una aplicacion para ver el detalle</p>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-full bg-navy flex items-center justify-center text-white text-[13px] font-black shrink-0">
                    {selected.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-black text-navy">{selected.nombre}</p>
                    <p className="text-[11px] text-muted">{selected.vacante}</p>
                  </div>
                </div>
                <Row label="Correo" value={selected.correo} />
                <Row label="WhatsApp" value={selected.whatsapp} />
                <Row label="Experiencia" value={selected.experiencia} />
                <Row label="Ubicacion / traslado" value={selected.ubicacion} />
                <Row label="Documentacion" value={selected.documentacion} />
                <Row label="CV adjunto" value={selected.cv_url ? "Si" : "No"} />
                <Row label="Fecha" value={new Date(selected.created_at).toLocaleDateString("es-MX", { dateStyle: "long" })} />
                <div className="pt-3 flex gap-2">
                  <a href={`https://wa.me/${selected.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"
                    className="flex-1 bg-[#25D366] text-white rounded-lg py-2 text-[12px] font-bold text-center hover:opacity-90 transition-opacity no-underline">
                    WhatsApp
                  </a>
                  <a href={`mailto:${selected.correo}`}
                    className="flex-1 bg-navy text-white rounded-lg py-2 text-[12px] font-bold text-center hover:bg-blue-dark transition-colors no-underline">
                    Correo
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-muted uppercase tracking-wide">{label}</p>
      <p className="text-[13px] text-navy mt-0.5">{value}</p>
    </div>
  );
}
