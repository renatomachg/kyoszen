"use client";

import { useEffect, useRef, useState } from "react";
import { IconUI, type IconUIName } from "@/components/ui/IconUI";

const C = {
  navy: "#042E7B",
  ink: "#1E293B",
  body: "#475569",
  muted: "#64748B",
  faint: "#94A3B8",
  hair: "#E6EBF5",
  wash: "#F1F5F9",
  danger: "#DC2626",
  dangerDark: "#991B1B",
};

export interface ConfirmModalProps {
  abierto: boolean;
  tono?: "peligro" | "primario";
  icono?: IconUIName;
  titulo: string;
  descripcion?: string;
  /** Lista de lo que se ve afectado. */
  puntos?: string[];
  /** Caja de advertencia destacada. */
  aviso?: string;
  /** Línea discreta al pie. */
  nota?: string;
  /** Si se define, hay que escribir esta palabra para habilitar el botón. */
  confirmarEscribiendo?: string;
  /** Convierte el modal en un mini formulario de un campo. */
  input?: { label: string; placeholder?: string; valorInicial?: string };
  confirmarLabel: string;
  cargando?: boolean;
  onConfirmar: (valor: string) => void;
  onCancelar: () => void;
}

/** Se monta solo cuando está abierto, así el contenido arranca limpio cada vez. */
export default function ConfirmModal(props: ConfirmModalProps) {
  if (!props.abierto) return null;
  return <Dialogo {...props} />;
}

function Dialogo({
  tono = "primario",
  icono,
  titulo,
  descripcion,
  puntos,
  aviso,
  nota,
  confirmarEscribiendo,
  input,
  confirmarLabel,
  cargando = false,
  onConfirmar,
  onCancelar,
}: ConfirmModalProps) {
  const [valor, setValor] = useState(input?.valorInicial ?? "");
  const [tecleado, setTecleado] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);

  // Foco en el primer campo al abrir
  useEffect(() => {
    const t = setTimeout(() => campoRef.current?.focus(), 40);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCancelar(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancelar]);

  const peligro = tono === "peligro";
  const acento = peligro ? C.danger : C.navy;
  const bloqueado =
    cargando ||
    (!!confirmarEscribiendo && tecleado.trim().toUpperCase() !== confirmarEscribiendo.toUpperCase()) ||
    (!!input && !valor.trim());

  const confirmar = () => { if (!bloqueado) onConfirmar(valor.trim()); };

  return (
    <div
      onClick={onCancelar}
      style={{ position: "fixed", inset: 0, background: "rgba(4,46,123,.55)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 28px 70px rgba(4,20,60,.32)" }}
      >
        {/* Cabecera */}
        <div style={{ background: peligro ? "#B91C1C" : C.navy, padding: "18px 22px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,.16)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IconUI name={icono ?? (peligro ? "trash" : "check")} size={17} />
          </span>
          <h3 style={{ margin: 0, fontSize: 15.5, fontWeight: 900, color: "#fff", lineHeight: 1.35 }}>{titulo}</h3>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: "20px 22px" }}>
          {descripcion && (
            <p style={{ margin: "0 0 14px", fontSize: 13.5, color: C.body, lineHeight: 1.6 }}>{descripcion}</p>
          )}

          {puntos && puntos.length > 0 && (
            <div style={{ background: C.wash, borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
              {puntos.map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", padding: "3px 0" }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: acento, marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: C.ink, fontWeight: 600, lineHeight: 1.5 }}>{p}</span>
                </div>
              ))}
            </div>
          )}

          {aviso && (
            <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12, padding: "11px 14px", marginBottom: 14, display: "flex", gap: 9, alignItems: "flex-start" }}>
              <span style={{ color: C.dangerDark, flexShrink: 0, marginTop: 1 }}><IconUI name="eye" size={15} /></span>
              <p style={{ margin: 0, fontSize: 12.5, color: C.dangerDark, fontWeight: 700, lineHeight: 1.5 }}>{aviso}</p>
            </div>
          )}

          {input && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: C.faint, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>
                {input.label}
              </label>
              <input
                ref={campoRef}
                value={valor}
                onChange={e => setValor(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmar(); }}
                placeholder={input.placeholder}
                style={{ width: "100%", border: `1.5px solid ${C.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: C.ink }}
              />
            </div>
          )}

          {confirmarEscribiendo && (
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12.5, color: C.body, marginBottom: 6, lineHeight: 1.5 }}>
                Escribe <strong style={{ color: C.dangerDark, letterSpacing: ".04em" }}>{confirmarEscribiendo}</strong> para confirmar:
              </label>
              <input
                ref={input ? undefined : campoRef}
                value={tecleado}
                onChange={e => setTecleado(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") confirmar(); }}
                placeholder={confirmarEscribiendo}
                style={{ width: "100%", border: `1.5px solid ${tecleado ? (bloqueado ? "#FCA5A5" : "#86EFAC") : C.hair}`, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, outline: "none", fontFamily: "inherit", boxSizing: "border-box", color: C.ink, letterSpacing: ".04em" }}
              />
            </div>
          )}

          {nota && (
            <p style={{ margin: "0 0 14px", fontSize: 12, color: C.faint, lineHeight: 1.55 }}>{nota}</p>
          )}

          {/* Acciones */}
          <div style={{ display: "flex", gap: 9 }}>
            <button onClick={onCancelar} disabled={cargando}
              style={{ flex: 1, padding: "12px 0", borderRadius: 11, border: `1.5px solid ${C.hair}`, background: "#fff", cursor: "pointer", fontWeight: 800, fontSize: 13.5, color: C.muted }}>
              Cancelar
            </button>
            <button onClick={confirmar} disabled={bloqueado}
              style={{ flex: 1.4, padding: "12px 0", borderRadius: 11, border: "none", cursor: bloqueado ? "default" : "pointer", fontWeight: 900, fontSize: 13.5, color: "#fff", background: peligro ? C.danger : C.navy, opacity: bloqueado ? 0.45 : 1, transition: "opacity .15s" }}>
              {cargando ? "Un momento..." : confirmarLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
