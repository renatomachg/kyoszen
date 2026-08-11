/* Lectura de resultados del administrador de anuncios de Meta.
   Solo servidor. Solo lectura: nunca modifica nada en la cuenta de anuncios. */

import type { ResultadosCampana } from "@/lib/campanas";

// Meta retira las versiones viejas cada ~2 años. Si algún día falla por versión,
// basta con poner META_API_VERSION en el servidor.
const API = process.env.META_API_VERSION || "v26.0";

const CAMPOS = [
  "impressions", "reach", "clicks", "unique_clicks", "spend",
  "cpm", "cpc", "ctr", "frequency", "actions",
  "date_start", "date_stop", "ad_id", "campaign_id",
].join(",");

export class MetaSinConfigurar extends Error {
  constructor() {
    super(
      "Falta conectar Meta. Agrega META_ACCESS_TOKEN en el servidor para poder " +
      "traer los resultados automáticamente."
    );
    this.name = "MetaSinConfigurar";
  }
}

export function metaConfigurado(): boolean {
  return Boolean(process.env.META_ACCESS_TOKEN);
}

type FilaInsight = {
  impressions?: string;
  reach?: string;
  clicks?: string;
  unique_clicks?: string;
  spend?: string;
  cpm?: string;
  cpc?: string;
  ctr?: string;
  frequency?: string;
  actions?: { action_type: string; value: string }[];
  date_start?: string;
  date_stop?: string;
  ad_id?: string;
};

const num = (v?: string) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const accion = (fila: FilaInsight, tipo: string) =>
  num(fila.actions?.find(a => a.action_type === tipo)?.value);

/** Traduce una fila de Graph API al corte que guardamos. */
export function aResultados(fila: FilaInsight, moneda: string): ResultadosCampana {
  return {
    fuente: "meta",
    actualizado_en: new Date().toISOString(),
    desde: fila.date_start,
    hasta: fila.date_stop,
    moneda,
    impresiones: num(fila.impressions),
    alcance: num(fila.reach),
    clics: num(fila.clicks),
    clics_enlace: accion(fila, "link_click"),
    gastado: num(fila.spend),
    interacciones: accion(fila, "post_engagement"),
    cpm: num(fila.cpm),
    cpc: num(fila.cpc),
    ctr: num(fila.ctr),
    frecuencia: num(fila.frequency),
  };
}

async function pedir(path: string, params: Record<string, string>) {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) throw new MetaSinConfigurar();

  const url = new URL(`https://graph.facebook.com/${API}/${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  url.searchParams.set("access_token", token);

  const res = await fetch(url, { cache: "no-store" });
  const cuerpo = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = cuerpo?.error?.message ?? `Meta respondió ${res.status}`;
    // El token vencido es el error más común, y el mensaje de Meta no lo explica bien
    if (cuerpo?.error?.code === 190) {
      throw new Error(
        "El token de Meta ya no sirve (venció o se revocó). Genera uno nuevo y actualízalo en el servidor."
      );
    }
    throw new Error(msg);
  }
  return cuerpo as { data?: FilaInsight[] };
}

/** Moneda de la cuenta de anuncios. Si falla, asume MXN. */
async function monedaDeCuenta(cuentaId: string): Promise<string> {
  try {
    const token = process.env.META_ACCESS_TOKEN!;
    const url = new URL(`https://graph.facebook.com/${API}/${cuentaId}`);
    url.searchParams.set("fields", "currency");
    url.searchParams.set("access_token", token);
    const res = await fetch(url, { cache: "no-store" });
    const cuerpo = await res.json().catch(() => ({}));
    return typeof cuerpo?.currency === "string" ? cuerpo.currency : "MXN";
  } catch {
    return "MXN";
  }
}

export interface EstadoToken {
  configurado: boolean;
  /** null = no vence (usuario del sistema). */
  vence_en?: string | null;
  dias_restantes?: number | null;
  valido?: boolean;
  error?: string;
}

/** Revisa el token contra Meta para avisar antes de que venza.
 *  Un token de usuario del sistema no vence: `expires_at` llega en 0. */
export async function revisarToken(): Promise<EstadoToken> {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return { configurado: false };

  try {
    const url = new URL(`https://graph.facebook.com/${API}/debug_token`);
    url.searchParams.set("input_token", token);
    url.searchParams.set("access_token", token);
    const res = await fetch(url, { cache: "no-store" });
    const cuerpo = await res.json().catch(() => ({}));
    const datos = cuerpo?.data;

    if (!res.ok || !datos) {
      return { configurado: true, valido: false, error: cuerpo?.error?.message ?? "Meta no reconoció el token." };
    }
    if (datos.is_valid === false) {
      return { configurado: true, valido: false, error: "El token ya no es válido. Genera uno nuevo." };
    }

    // expires_at 0 o ausente = sin vencimiento
    const expira = typeof datos.expires_at === "number" && datos.expires_at > 0 ? datos.expires_at : null;
    if (!expira) return { configurado: true, valido: true, vence_en: null, dias_restantes: null };

    const vence = new Date(expira * 1000);
    const dias = Math.floor((vence.getTime() - Date.now()) / 86_400_000);
    return { configurado: true, valido: true, vence_en: vence.toISOString(), dias_restantes: dias };
  } catch {
    return { configurado: true, valido: false, error: "No se pudo revisar el token con Meta." };
  }
}

export interface CorteDeMeta {
  campana: ResultadosCampana;
  /** Corte por anuncio, indexado por su id de Meta. */
  anuncios: Map<string, ResultadosCampana>;
}

/** Trae el acumulado de la campaña y el de cada uno de sus anuncios. */
export async function traerResultados(
  campanaMetaId: string,
  cuentaId?: string
): Promise<CorteDeMeta> {
  const moneda = cuentaId ? await monedaDeCuenta(cuentaId) : "MXN";

  const [nivelCampana, nivelAnuncio] = await Promise.all([
    pedir(`${campanaMetaId}/insights`, {
      level: "campaign",
      date_preset: "maximum",
      fields: CAMPOS,
    }),
    pedir(`${campanaMetaId}/insights`, {
      level: "ad",
      date_preset: "maximum",
      fields: CAMPOS,
      limit: "100",
    }),
  ]);

  const filaCampana = nivelCampana.data?.[0];
  if (!filaCampana) {
    throw new Error(
      "Meta no devolvió resultados para esta campaña. Puede que todavía no haya gastado nada."
    );
  }

  const anuncios = new Map<string, ResultadosCampana>();
  for (const fila of nivelAnuncio.data ?? []) {
    if (fila.ad_id) anuncios.set(fila.ad_id, aResultados(fila, moneda));
  }

  return { campana: aResultados(filaCampana, moneda), anuncios };
}
