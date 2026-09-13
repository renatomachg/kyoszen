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

export interface ProgresoSubida {
  /** "subiendo" mientras viaja el archivo; "procesando" cuando ya llegó y el
   *  servidor lo está comprimiendo o guardando. */
  fase: "subiendo" | "procesando";
  porcentaje: number;
}

/** Lo más que acepta el servidor (Nginx `client_max_body_size`). Se revisa
 *  antes de mandar nada, para no esperar minutos a que Nginx lo rechace. */
export const LIMITE_SUBIDA_MB = 1024;

function pesoLegible(megas: number) {
  return megas >= 1024 ? `${(megas / 1024).toFixed(1)} GB` : `${Math.round(megas)} MB`;
}

/** Sube un archivo a /api/admin/social/upload y devuelve su URL pública.
 *  Usa XMLHttpRequest y no fetch porque fetch no reporta el avance de la subida. */
export async function subirArchivoAdmin(
  file: File,
  onProgreso?: (progreso: ProgresoSubida) => void,
): Promise<string> {
  const megas = file.size / 1048576;
  if (megas > LIMITE_SUBIDA_MB) {
    throw new Error(`${file.name} pesa ${pesoLegible(megas)} y lo más que se puede subir es ${pesoLegible(LIMITE_SUBIDA_MB)}.`);
  }

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const formData = new FormData();
  formData.append("file", file);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/social/upload");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (evento) => {
      if (!evento.lengthComputable) return;
      onProgreso?.({ fase: "subiendo", porcentaje: Math.min(99, Math.round((evento.loaded / evento.total) * 100)) });
    };
    // Ya llegó completo: lo que sigue es trabajo del servidor
    xhr.upload.onload = () => onProgreso?.({ fase: "procesando", porcentaje: 100 });

    xhr.onerror = () =>
      reject(new Error(`Se cortó la conexión mientras se subía ${file.name}. Revisa tu internet y vuelve a intentarlo.`));

    xhr.onload = () => {
      let cuerpo: Record<string, unknown> | null = null;
      try {
        const leido: unknown = JSON.parse(xhr.responseText);
        if (leido && typeof leido === "object") cuerpo = leido as Record<string, unknown>;
      } catch {
        /* Nginx responde HTML cuando corta: se traduce abajo por el código */
      }

      if (xhr.status >= 200 && xhr.status < 300 && typeof cuerpo?.url === "string") {
        resolve(cuerpo.url);
        return;
      }
      if (typeof cuerpo?.error === "string") {
        reject(new Error(cuerpo.error));
        return;
      }
      if (xhr.status === 413) {
        reject(new Error(`${file.name} pesa ${pesoLegible(megas)}: es más de lo que acepta el servidor.`));
        return;
      }
      if (xhr.status === 502 || xhr.status === 504) {
        reject(new Error(`El servidor tardó demasiado procesando ${file.name}. Si es un video muy largo, expórtalo más ligero o recórtalo.`));
        return;
      }
      reject(new Error(`No se pudo subir ${file.name} (error ${xhr.status}).`));
    };

    xhr.send(formData);
  });
}
