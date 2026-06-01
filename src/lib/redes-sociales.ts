export interface RedSocialConfig {
  id: string;
  nombre: string;
  logo: string;        // ruta al logo wordmark (en /public/redes)
  color: string;       // color de marca
  colorSuave: string;  // fondo suave del badge
  icono: string;       // emoji fallback
}

export const REDES_SOCIALES: Record<string, RedSocialConfig> = {
  facebook: {
    id: "facebook",
    nombre: "Facebook",
    logo: "/redes/facebook.svg",
    color: "#0B68FD",
    colorSuave: "#E7F0FF",
    icono: "📘",
  },
  // Preparado para cuando se agreguen:
  // instagram: { id: "instagram", nombre: "Instagram", logo: "/redes/instagram.svg", color: "#E1306C", colorSuave: "#FCE7F0", icono: "📸" },
  // tiktok:    { id: "tiktok",    nombre: "TikTok",    logo: "/redes/tiktok.svg",    color: "#010101", colorSuave: "#F0F0F0", icono: "🎵" },
  // linkedin:  { id: "linkedin",  nombre: "LinkedIn",  logo: "/redes/linkedin.svg",  color: "#0A66C2", colorSuave: "#E5F0FA", icono: "💼" },
};

export function getRedSocial(id: string): RedSocialConfig {
  return REDES_SOCIALES[id] ?? REDES_SOCIALES.facebook;
}
