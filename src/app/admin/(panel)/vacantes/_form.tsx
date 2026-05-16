"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface VacanteFormData {
  titulo: string;
  empresa: string;
  ubicacion: string;
  jornada: string;
  contrato: string;
  salario: number;
  categoria: string;
  badge: string;
  badge_class: string;
  descripcion: string;
  responsabilidades: string[];
  requisitos: string[];
  tags: string[];
  activa: boolean;
}

const EMPTY: VacanteFormData = {
  titulo: "",
  empresa: "Kyoszen",
  ubicacion: "Presencial",
  jornada: "Tiempo completo",
  contrato: "Indefinido",
  salario: 0,
  categoria: "Operativo",
  badge: "",
  badge_class: "",
  descripcion: "",
  responsabilidades: [],
  requisitos: [],
  tags: [],
  activa: true,
};

const UBICACIONES = ["Presencial", "Remoto", "Hibrido"];
const JORNADAS = ["Tiempo completo", "Medio tiempo", "Por proyecto"];
const CONTRATOS = ["Indefinido", "Temporal", "Por honorarios"];
const CATEGORIAS = ["Operativo", "Administrativo", "Ventas", "Recursos Humanos", "Contabilidad", "Tecnologia", "Logistica"];
const BADGES = [
  { label: "Ninguno", value: "", class: "" },
  { label: "Nuevo", value: "Nuevo", class: "bg-green-100 text-green-700" },
  { label: "Urgente", value: "Urgente", class: "bg-red-100 text-red-700" },
  { label: "Destacado", value: "Destacado", class: "bg-yellow text-black" },
];

export default function VacanteForm({ initial, id }: { initial?: Partial<VacanteFormData>; id?: number }) {
  const router = useRouter();
  const [form, setForm] = useState<VacanteFormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (key: keyof VacanteFormData, value: VacanteFormData[typeof key]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      titulo: form.titulo,
      empresa: form.empresa,
      ubicacion: form.ubicacion,
      jornada: form.jornada,
      contrato: form.contrato,
      salario: form.salario,
      categoria: form.categoria,
      badge: form.badge || null,
      badge_class: form.badge_class || null,
      descripcion: form.descripcion,
      responsabilidades: form.responsabilidades,
      requisitos: form.requisitos,
      tags: form.tags,
      activa: form.activa,
    };

    const { error } = id
      ? await supabase.from("vacantes").update(payload).eq("id", id)
      : await supabase.from("vacantes").insert(payload);

    if (error) {
      setError("Error al guardar: " + error.message);
      setSaving(false);
    } else {
      router.push("/admin/vacantes");
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h3 className="font-extrabold text-navy text-[14px]">Informacion general</h3>

        <Field label="Titulo del puesto">
          <input required value={form.titulo} onChange={(e) => set("titulo", e.target.value)}
            className={INPUT} placeholder="Ej. Ejecutivo de Ventas" />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Empresa">
            <input required value={form.empresa} onChange={(e) => set("empresa", e.target.value)} className={INPUT} />
          </Field>
          <Field label="Salario mensual (MXN)">
            <input required type="number" value={form.salario || ""} onChange={(e) => set("salario", Number(e.target.value))}
              className={INPUT} placeholder="15000" />
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Ubicacion">
            <select value={form.ubicacion} onChange={(e) => set("ubicacion", e.target.value)} className={INPUT}>
              {UBICACIONES.map((u) => <option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Jornada">
            <select value={form.jornada} onChange={(e) => set("jornada", e.target.value)} className={INPUT}>
              {JORNADAS.map((j) => <option key={j}>{j}</option>)}
            </select>
          </Field>
          <Field label="Contrato">
            <select value={form.contrato} onChange={(e) => set("contrato", e.target.value)} className={INPUT}>
              {CONTRATOS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria">
            <select value={form.categoria} onChange={(e) => set("categoria", e.target.value)} className={INPUT}>
              {CATEGORIAS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Badge / etiqueta">
            <select
              value={form.badge}
              onChange={(e) => {
                const found = BADGES.find((b) => b.value === e.target.value);
                set("badge", found?.value ?? "");
                set("badge_class", found?.class ?? "");
              }}
              className={INPUT}
            >
              {BADGES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Descripcion del puesto">
          <textarea required value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)}
            rows={4} className={INPUT + " resize-none"} placeholder="Describe las funciones principales..." />
        </Field>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="activa" checked={form.activa} onChange={(e) => set("activa", e.target.checked)}
            className="w-4 h-4 accent-blue rounded" />
          <label htmlFor="activa" className="text-[13px] font-semibold text-navy">Vacante activa (visible en el sitio)</label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-5">
        <h3 className="font-extrabold text-navy text-[14px]">Detalle</h3>
        <ArrayField label="Responsabilidades" items={form.responsabilidades} onChange={(v) => set("responsabilidades", v)} placeholder="Agregar responsabilidad..." />
        <ArrayField label="Requisitos" items={form.requisitos} onChange={(v) => set("requisitos", v)} placeholder="Agregar requisito..." />
        <ArrayField label="Tags / habilidades" items={form.tags} onChange={(v) => set("tags", v)} placeholder="Ej. Excel, SAP, Ingles..." />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={saving}
          className="bg-navy text-white rounded-xl px-6 py-2.5 text-[13px] font-bold hover:bg-blue-dark transition-colors disabled:opacity-60 cursor-pointer">
          {saving ? "Guardando..." : id ? "Guardar cambios" : "Crear vacante"}
        </button>
        <button type="button" onClick={() => router.back()}
          className="bg-white text-navy border border-border rounded-xl px-6 py-2.5 text-[13px] font-semibold hover:border-blue-mid transition-colors cursor-pointer">
          Cancelar
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-bold text-navy mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ArrayField({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState("");

  const add = () => {
    if (input.trim()) {
      onChange([...items, input.trim()]);
      setInput("");
    }
  };

  return (
    <div>
      <label className="block text-[12px] font-bold text-navy mb-1.5">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          className={INPUT + " flex-1"}
          placeholder={placeholder}
        />
        <button type="button" onClick={add}
          className="bg-blue-soft text-blue rounded-lg px-3 text-[13px] font-bold hover:bg-blue hover:text-white transition-colors cursor-pointer">
          +
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 bg-bg border border-border text-navy text-[12px] font-semibold px-3 py-1 rounded-full">
            {item}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="text-muted hover:text-red-500 transition-colors cursor-pointer leading-none">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

const INPUT = "w-full border border-border rounded-lg px-3 py-2.5 text-[13px] text-navy bg-white focus:outline-none focus:border-blue transition-colors";
