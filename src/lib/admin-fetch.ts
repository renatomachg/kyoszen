"use client";

/* fetch para el panel: adjunta la sesión de Supabase en el header Authorization.
   Las rutas /api/admin/* la exigen para saber quién llama. */

import { supabase } from "@/lib/supabase";

export async function fetchAdmin(entrada: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);

  return fetch(entrada, { ...init, headers });
}
