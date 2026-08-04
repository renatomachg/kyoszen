"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const valor = identificador.trim().toLowerCase();
      let email = valor;

      if (!valor.includes("@")) {
        const response = await fetch("/api/admin/usuarios/resolver", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario: valor }),
        });
        const payload = (await response.json()) as { email?: string };
        if (!response.ok || !payload.email) {
          throw new Error("Credenciales incorrectas");
        }
        email = payload.email;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        throw error;
      }

      router.replace("/admin");
    } catch {
      setError("Usuario, correo o contraseña incorrectos");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5">
      <div className="w-full max-w-[380px]">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-navy rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-yellow font-black text-lg">KZ</span>
          </div>
          <h1 className="text-xl font-black text-navy">Panel Admin</h1>
          <p className="text-[13px] text-muted mt-1">Kyoszen · Capital Humano</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white rounded-2xl border border-border p-8 shadow-sm space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[13px] px-4 py-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-[12px] font-bold text-navy mb-1.5">Usuario o correo</label>
            <input
              type="text"
              autoComplete="username"
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-[13px] text-navy focus:outline-none focus:border-blue transition-colors"
              placeholder="tu.usuario o admin@kyoszen.com"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-navy mb-1.5">Contraseña</label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-[13px] text-navy focus:outline-none focus:border-blue transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy text-white rounded-xl py-3 text-[13px] font-bold hover:bg-blue-dark transition-colors disabled:opacity-60 cursor-pointer"
          >
            {loading ? "Entrando..." : "Entrar al panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
