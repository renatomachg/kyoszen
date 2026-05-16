"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Vacante {
  id: number;
  titulo: string;
  empresa: string;
  ubicacion: string;
  salario: number;
  categoria: string;
  activa: boolean;
  created_at: string;
}

export default function AdminVacantes() {
  const [vacantes, setVacantes] = useState<Vacante[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("vacantes")
      .select("id,titulo,empresa,ubicacion,salario,categoria,activa,created_at")
      .order("created_at", { ascending: false });
    setVacantes((data as Vacante[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActiva = async (id: number, activa: boolean) => {
    await supabase.from("vacantes").update({ activa: !activa }).eq("id", id);
    setVacantes((prev) => prev.map((v) => v.id === id ? { ...v, activa: !activa } : v));
  };

  const eliminar = async (id: number) => {
    if (!confirm("¿Seguro que quieres eliminar esta vacante?")) return;
    await supabase.from("vacantes").delete().eq("id", id);
    setVacantes((prev) => prev.filter((v) => v.id !== id));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">Vacantes</h1>
          <p className="text-[13px] text-muted">{vacantes.filter((v) => v.activa).length} activas · {vacantes.length} total</p>
        </div>
        <Link href="/admin/vacantes/nueva"
          className="bg-navy text-white rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-blue-dark transition-colors">
          + Nueva vacante
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vacantes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center">
          <p className="text-muted text-[14px] mb-4">No hay vacantes creadas aun</p>
          <Link href="/admin/vacantes/nueva" className="text-blue font-semibold text-[13px] hover:underline">
            Crear la primera vacante →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-[11px] font-bold text-muted uppercase tracking-wider px-5 py-3">Puesto</th>
                <th className="text-left text-[11px] font-bold text-muted uppercase tracking-wider px-5 py-3 hidden md:table-cell">Ubicacion</th>
                <th className="text-left text-[11px] font-bold text-muted uppercase tracking-wider px-5 py-3 hidden lg:table-cell">Salario</th>
                <th className="text-left text-[11px] font-bold text-muted uppercase tracking-wider px-5 py-3">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {vacantes.map((v) => (
                <tr key={v.id} className="border-b border-border last:border-0 hover:bg-bg transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-[13px] font-bold text-navy">{v.titulo}</p>
                    <p className="text-[11px] text-muted">{v.empresa} · {v.categoria}</p>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <span className="text-[12px] text-muted">{v.ubicacion}</span>
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <span className="text-[12px] text-navy font-semibold">${v.salario.toLocaleString()}</span>
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActiva(v.id, v.activa)}
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                        v.activa
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {v.activa ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3 justify-end">
                      <Link href={`/admin/vacantes/${v.id}`} className="text-[12px] text-blue font-semibold hover:underline">
                        Editar
                      </Link>
                      <button onClick={() => eliminar(v.id)} className="text-[12px] text-red-500 font-semibold hover:underline cursor-pointer">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
