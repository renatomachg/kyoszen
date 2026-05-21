import CursoForm from "../_form";

export default function NuevoCurso() {
  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-1">Nuevo curso</h1>
      <p className="text-[13px] text-muted mb-8">Completa los datos para agregar un curso al catalogo.</p>
      <CursoForm />
    </div>
  );
}
