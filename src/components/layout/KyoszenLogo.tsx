export default function KyoszenLogo({
  height = 36,
  variant = "color",
}: {
  height?: number;
  variant?: "color" | "white";
}) {
  return (
    <img
      src="/images/logo.svg"
      alt="Kyoszen"
      height={height}
      style={{
        height,
        width: "auto",
        display: "block",
        filter: variant === "white" ? "brightness(0) invert(1)" : undefined,
      }}
    />
  );
}
