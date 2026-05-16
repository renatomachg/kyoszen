"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Contacto {
  id: number;
  nombre: string;
  correo: string;
  asunto: string;
  mensaje: string;
  leido: boolean;
  created_at: string;
}

export default function AdminContactos() {
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [selected, setSelected] = useState<Contacto | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("contactos")
      .select("*")
      .order("created_at", { ascending: false });
    setContactos((data as Contacto[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const marcarLeido = async (id: number) => {
    await supabase.from("contactos").update({ leido: true }).eq("id", id);
    setContactos((prev) => prev.map((c) => c.id === id ? { ...c, leido: true } : c));
    setSelected((prev) => prev?.id === id ? { ...prev, leido: true } : prev);
  };

  const nuevos = contactos.filter((c) => !c.leido).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-navy mb-1">Mensajes de contacto</h1>
        <p className="text-[13px] text-muted">{nuevos} nuevos · {contactos.length} total</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : contactos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-muted text-[14px]">No hay mensajes aun</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          {/* List */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            {contactos.map((c) => (
              <div
                key={c.id}
                onClick={() => { setSelected(c); if (!c.leido) marcarLeido(c.id); }}
                className={`flex items-start gap-3 px-5 py-4 border-b border-border last:border-0 cursor-pointer transition-colors ${
                  selected?.id === c.id ? "bg-blue-soft" : "hover:bg-bg"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue flex items-center justify-center text-white text-[11px] font-black shrink-0 mt-0.5">
                  {c.nombre.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-bold text-navy truncate">{c.nombre}</p>
                    {!c.leido && <span className="w-2 h-2 rounded-full bg-blue shrink-0" />}
                  </div>
                  <p className="text-[11px] text-muted truncate">{c.asunto}</p>
                  <p className="text-[10px] text-muted mt-0.5">{new Date(c.created_at).toLocaleDateString("es-MX")}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Detail */}
          <div className="bg-white rounded-2xl border border-border p-6 h-fit sticky top-6">
            {!selected ? (
              <p className="text-[13px] text-muted text-center py-8">Selecciona un mensaje para leerlo</p>
            ) : (
              <div className="space-y-4">
                <div className="pb-4 border-b border-border">
                  <p className="font-black text-navy text-[15px]">{selected.asunto}</p>
                  <p className="text-[12px] text-muted mt-0.5">
                    {selected.nombre} · {selected.correo}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {new Date(selected.created_at).toLocaleDateString("es-MX", { dateStyle: "long" })}
                  </p>
                </div>
                <p className="text-[13.5px] text-navy leading-relaxed whitespace-pre-line">{selected.mensaje}</p>
                <div className="pt-3">
                  <a href={`mailto:${selected.correo}?subject=Re: ${selected.asunto}`}
                    className="w-full block bg-navy text-white rounded-lg py-2.5 text-[12px] font-bold text-center hover:bg-blue-dark transition-colors no-underline">
                    Responder por correo
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
