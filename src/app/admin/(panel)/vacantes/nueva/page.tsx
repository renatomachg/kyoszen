import VacanteForm from "../_form";

export default function NuevaVacante() {
  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-1">Nueva vacante</h1>
      <p className="text-[13px] text-muted mb-8">Completa el formulario para publicar una vacante en el sitio</p>
      <VacanteForm />
    </div>
  );
}
