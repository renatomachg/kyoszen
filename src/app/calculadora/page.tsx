import type { Metadata } from "next";
import Calculadora from "@/components/sections/Calculadora";

export const metadata: Metadata = {
  title: "Calculadora de Rotacion de Personal | Kyoszen",
  description: "Descubre cuanto dinero pierde tu empresa por la rotacion de personal. Calcula el impacto financiero real en segundos.",
};

export default function CalculadoraPage() {
  return <Calculadora standalone />;
}
