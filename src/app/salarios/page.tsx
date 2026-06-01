import type { Metadata } from "next";
import ComparadorSalario from "@/components/sections/ComparadorSalario";

export const metadata: Metadata = {
  title: "Comparador de Salarios CDMX 2025 | Kyoszen",
  description: "¿Tu salario es competitivo? Compara tu sueldo contra los rangos reales del mercado laboral en CDMX y Área Metropolitana.",
};

export default function SalariosPage() {
  return <ComparadorSalario standalone />;
}
