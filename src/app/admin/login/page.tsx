"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError("Correo o contraseña incorrectos");
      setLoading(false);
    } else {
      router.replace("/admin");
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
            <label className="block text-[12px] font-bold text-navy mb-1.5">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-border rounded-xl px-4 py-2.5 text-[13px] text-navy focus:outline-none focus:border-blue transition-colors"
              placeholder="admin@kyoszen.com"
            />
          </div>
          <div>
            <label className="block text-[12px] font-bold text-navy mb-1.5">Contraseña</label>
            <input
              type="password"
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
