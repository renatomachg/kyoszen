import { getRedSocial } from "@/lib/redes-sociales";

/**
 * Muestra el logo de la red social. Si la red aún no tiene logo cargado,
 * muestra un chip de texto con su nombre y color de marca.
 */
export function RedLogo({ red_social, height = 10 }: { red_social: string; height?: number }) {
  const r = getRedSocial(red_social);

  if (r.logo) {
    return <img src={r.logo} alt={r.nombre} title={r.nombre} style={{ height, display: "block" }} />;
  }

  // Sin logo todavía: chip de texto con el color de la red
  return (
    <span
      title={r.nombre}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        background: r.color,
        color: "#fff",
        fontSize: Math.max(8, height - 1),
        fontWeight: 800,
        lineHeight: 1,
        padding: "2px 6px",
        borderRadius: 5,
        letterSpacing: ".2px",
      }}
    >
      {r.nombre}
    </span>
  );
}
