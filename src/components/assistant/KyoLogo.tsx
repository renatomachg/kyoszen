interface KyoLogoProps {
  size?: number;
  className?: string;
}

/**
 * Kyo assistant logo - stylized wings/V shape with faceted geometry.
 * Uses three shades of blue + a light cyan accent.
 */
export default function KyoLogo({ size = 24, className = "" }: KyoLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Left wing - outer light blue */}
      <polygon points="8,10 30,8 32,50 22,72 6,58" fill="#2F66C9" />
      {/* Left wing - inner dark */}
      <polygon points="30,8 32,50 40,52 38,26" fill="#0D1F5E" />
      <polygon points="22,72 32,50 40,52 30,76" fill="#142C7D" />

      {/* Right wing - outer light blue */}
      <polygon points="92,10 70,8 68,50 78,72 94,58" fill="#2F66C9" />
      {/* Right wing - inner dark */}
      <polygon points="70,8 68,50 60,52 62,26" fill="#0D1F5E" />
      <polygon points="78,72 68,50 60,52 70,76" fill="#142C7D" />

      {/* Center bottom V - navy */}
      <polygon points="40,52 50,90 60,52 50,68" fill="#1A3B9B" />
      {/* Center left/right darker fills */}
      <polygon points="40,52 30,76 50,90" fill="#0E2272" />
      <polygon points="60,52 70,76 50,90" fill="#0E2272" />

      {/* Light cyan accent triangle */}
      <polygon points="43,48 57,48 50,64" fill="#6DB0E8" />
    </svg>
  );
}
