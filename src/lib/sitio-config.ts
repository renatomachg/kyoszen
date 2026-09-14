import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Fila de `site_content` que prende o apaga el WhatsApp del sitio
 *  (botón del menú y caja de Contacto). Se cambia desde /admin/contenido. */
export const CLAVE_WHATSAPP = "whatsapp_visible";

let consulta: Promise<boolean> | null = null;

/** Una sola consulta por visita, compartida entre el menú y la página.
 *  Solo se muestra si la fila dice "true": si falta o falla, queda oculto. */
function leerWhatsappVisible(): Promise<boolean> {
  consulta ??= Promise.resolve(
    supabase.from("site_content").select("value").eq("key", CLAVE_WHATSAPP).maybeSingle()
  ).then(
    ({ data }) => data?.value === "true",
    () => false
  );
  return consulta;
}

/** ¿Se muestra el WhatsApp en el sitio? Arranca oculto para que un botón
 *  apagado nunca aparezca ni por un instante. */
export function useWhatsappVisible(): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let vigente = true;
    leerWhatsappVisible().then((valor) => {
      if (vigente) setVisible(valor);
    });
    return () => {
      vigente = false;
    };
  }, []);
  return visible;
}
