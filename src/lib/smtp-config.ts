import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

let _cache: SmtpConfig | null = null;
let _cacheExpiry = 0;

export async function getSmtpConfig(): Promise<SmtpConfig> {
  if (_cache && Date.now() < _cacheExpiry) return _cache;

  try {
    const { data } = await supabaseAdmin
      .from("site_config")
      .select("key, value")
      .in("key", ["smtp_host", "smtp_port", "smtp_user", "smtp_pass"]);

    if (data && data.length > 0) {
      const map: Record<string, string> = {};
      data.forEach((r) => { map[r.key] = r.value; });

      if (map.smtp_host && map.smtp_user && map.smtp_pass) {
        _cache = {
          host: map.smtp_host,
          port: Number(map.smtp_port) || 587,
          user: map.smtp_user,
          pass: map.smtp_pass,
        };
        _cacheExpiry = Date.now() + 60_000;
        return _cache;
      }
    }
  } catch { /* fallback to env */ }

  // Fallback a .env.local
  return {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
  };
}

export function clearSmtpCache() {
  _cache = null;
  _cacheExpiry = 0;
}
