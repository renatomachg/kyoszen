import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import PublicShell from "@/components/layout/PublicShell";

export const metadata: Metadata = {
  title: "Kyoszen — Estrategia en Capital Humano",
  description: "Conectamos el talento correcto con las empresas que crecen. Reclutamiento, capacitacion y digitalizacion de RRHH en Mexico.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="antialiased">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <PublicShell>{children}</PublicShell>
        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-1P8CRFRPJS" strategy="afterInteractive" />
        <Script id="ga-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-1P8CRFRPJS', { page_path: window.location.pathname });
        `}</Script>
      </body>
    </html>
  );
}
