const USUARIO_VALIDO = /^[a-z0-9._-]+$/;

export function sanitizarUsuario(valor: string): string | null {
  const usuario = valor.trim().toLowerCase();
  return usuario && USUARIO_VALIDO.test(usuario) ? usuario : null;
}

export function correoInterno(usuario: string): string {
  return `${usuario}@acceso.kyoszen.com`;
}
