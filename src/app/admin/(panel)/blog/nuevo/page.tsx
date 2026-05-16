import BlogForm from "../_form";

export default function NuevoPost() {
  return (
    <div>
      <h1 className="text-2xl font-black text-navy mb-1">Nuevo articulo</h1>
      <p className="text-[13px] text-muted mb-8">Redacta y publica un nuevo articulo en el blog de Kyoszen.</p>
      <BlogForm />
    </div>
  );
}
