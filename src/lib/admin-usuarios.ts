const USUARIO_VALIDO = /^[a-z0-9._-]+$/;

export function sanitizarUsuario(valor: string): string | null {
  const usuario = valor.trim().toLowerCase();
  return usuario && USUARIO_VALIDO.test(usuario) ? usuario : null;
}

export function correoInterno(usuario: string): string {
  return `${usuario}@acceso.kyoszen.com`;
}

/** Mínimo que acepta Supabase Auth. */
export const PASSWORD_MINIMO = 6;

/** Contraseña temporal legible, para dictarla o mandarla por WhatsApp.
 *  Usa Web Crypto para que el archivo sirva igual en servidor y en cliente. */
export function generarPasswordTemporal(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const codigo = Array.from(bytes, b => b.toString(16).padStart(2, "0")).join("");
  return `Kyoszen-${codigo}!`;
}
