"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { Dot, IconUI } from "@/components/ui/IconUI";
import { ADMIN_SECCIONES } from "@/lib/admin-secciones";
import { PASSWORD_MINIMO } from "@/lib/admin-usuarios";
import { fetchAdmin } from "@/lib/admin-fetch";

type Rol = "admin" | "colaborador";

type Usuario = {
  user_id: string;
  usuario: string | null;
  email: string | null;
  nombre: string | null;
  rol: Rol;
  secciones: string[];
  proyectos: string[];
  activo: boolean;
  created_at: string;
  updated_at: string;
};

type ProyectoAsignable = {
  id: string;
  titulo: string;
  folio: string | null;
  espacio_id: string | null;
};

type EspacioAsignable = {
  id: string;
  nombre: string;
};

type Formulario = {
  usuario: string;
  email: string;
  nombre: string;
  rol: Rol;
  secciones: string[];
  proyectos: string[];
  activo: boolean;
  password: string;
};

type Credenciales = {
  identificador: string;
  etiqueta: "Usuario" | "Correo";
  password: string;
};

const FORM_VACIO: Formulario = {
  usuario: "",
  email: "",
  nombre: "",
  rol: "colaborador",
  secciones: [],
  proyectos: [],
  activo: true,
  password: "",
};

const field =
  "w-full border border-border rounded-xl px-3.5 py-2.5 text-sm text-navy outline-none focus:border-blue transition-colors bg-white disabled:bg-slate-50 disabled:text-muted";
const label =
  "block text-[11px] font-bold text-navy uppercase tracking-wide mb-1.5";

function fechaCorta(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(
    new Date(fecha),
  );
}

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoAsignable[]>([]);
  const [espacios, setEspacios] = useState<EspacioAsignable[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProyectos, setLoadingProyectos] = useState(true);
  const [error, setError] = useState("");
  const [errorProyectos, setErrorProyectos] = useState("");
  const [form, setForm] = useState<Formulario | null>(null);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<string | null>(null);
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [passwordNueva, setPasswordNueva] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);

  const etiquetas = useMemo(
    () =>
      new Map<string, string>(
        ADMIN_SECCIONES.map((seccion) => [seccion.key, seccion.label]),
      ),
    [],
  );

  const espaciosPorId = useMemo(
    () => new Map(espacios.map((espacio) => [espacio.id, espacio.nombre])),
    [espacios],
  );

  const cargar = useCallback(async () => {
    setError("");
    try {
      const response = await fetchAdmin("/api/admin/usuarios", { cache: "no-store" });
      const payload = (await response.json()) as {
        usuarios?: Usuario[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudieron cargar los usuarios.");
      }
      setUsuarios(payload.usuarios ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar los usuarios.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarProyectos = useCallback(async () => {
    setErrorProyectos("");
    try {
      const [proyectosResponse, espaciosResponse] = await Promise.all([
        fetchAdmin("/api/admin/proyectos", { cache: "no-store" }),
        fetchAdmin("/api/admin/proyectos/espacios", { cache: "no-store" }),
      ]);
      const proyectosPayload = (await proyectosResponse.json()) as
        | ProyectoAsignable[]
        | { error?: string };
      const espaciosPayload = (await espaciosResponse.json()) as {
        espacios?: EspacioAsignable[];
        error?: string;
      };
      if (!proyectosResponse.ok) {
        const mensaje = Array.isArray(proyectosPayload)
          ? undefined
          : proyectosPayload.error;
        throw new Error(mensaje ?? "No se pudieron cargar los proyectos.");
      }
      if (!espaciosResponse.ok) {
        throw new Error(espaciosPayload.error ?? "No se pudieron cargar los espacios.");
      }
      setProyectos(Array.isArray(proyectosPayload) ? proyectosPayload : []);
      setEspacios(espaciosPayload.espacios ?? []);
    } catch (err) {
      setErrorProyectos(
        err instanceof Error ? err.message : "No se pudieron cargar los proyectos.",
      );
    } finally {
      setLoadingProyectos(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
    void cargarProyectos();
  }, [cargar, cargarProyectos]);

  const abrirNuevo = () => {
    setForm({ ...FORM_VACIO });
    setEditandoId(null);
    setCredenciales(null);
    setPasswordNueva("");
    setError("");
  };

  const abrirEdicion = (usuario: Usuario) => {
    setForm({
      usuario: usuario.usuario ?? "",
      email: usuario.email ?? "",
      nombre: usuario.nombre ?? "",
      rol: usuario.rol,
      secciones: usuario.secciones ?? [],
      proyectos: usuario.proyectos ?? [],
      activo: usuario.activo,
      password: "",
    });
    setEditandoId(usuario.user_id);
    setCredenciales(null);
    setPasswordNueva("");
    setError("");
  };

  const cambiarSeccion = (key: string) => {
    setForm((actual) => {
      if (!actual) return actual;
      const elegidas = actual.secciones.includes(key)
        ? actual.secciones.filter((seccion) => seccion !== key)
        : [...actual.secciones, key];
      return { ...actual, secciones: elegidas };
    });
  };

  const cambiarProyecto = (id: string) => {
    setForm((actual) => {
      if (!actual) return actual;
      const elegidos = actual.proyectos.includes(id)
        ? actual.proyectos.filter((proyectoId) => proyectoId !== id)
        : [...actual.proyectos, id];
      return { ...actual, proyectos: elegidos };
    });
  };

  /** Le pone contraseña nueva a la cuenta abierta y la muestra una sola vez. */
  const cambiarPassword = async () => {
    if (!form || !editandoId) return;
    const elegida = passwordNueva.trim();
    if (elegida && elegida.length < PASSWORD_MINIMO) {
      setError(`La contraseña debe tener al menos ${PASSWORD_MINIMO} caracteres.`);
      return;
    }

    setCambiandoPassword(true);
    setError("");
    try {
      const response = await fetchAdmin(
        `/api/admin/usuarios/${encodeURIComponent(editandoId)}/password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(elegida ? { password: elegida } : {}),
        },
      );
      const payload = (await response.json()) as {
        password?: string;
        usuario?: string | null;
        email?: string;
        error?: string;
      };
      if (!response.ok || !payload.password) {
        throw new Error(payload.error ?? "No se pudo cambiar la contraseña.");
      }

      setCredenciales({
        identificador: payload.usuario || payload.email || form.usuario || form.email,
        etiqueta: payload.usuario ? "Usuario" : "Correo",
        password: payload.password,
      });
      setPasswordNueva("");
      setCopiado(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "No se pudo cambiar la contraseña.",
      );
    } finally {
      setCambiandoPassword(false);
    }
  };

  const guardar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form) return;

    setGuardando(true);
    setError("");
    try {
      const esEdicion = Boolean(editandoId);
      const response = await fetchAdmin(
        esEdicion
          ? `/api/admin/usuarios/${encodeURIComponent(editandoId!)}`
          : "/api/admin/usuarios",
        {
          method: esEdicion ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            esEdicion
              ? {
                  nombre: form.nombre,
                  rol: form.rol,
                  secciones: form.rol === "admin" ? [] : form.secciones,
                  proyectos: form.rol === "admin" ? [] : form.proyectos,
                  activo: form.activo,
                }
              : {
                  ...(form.rol === "colaborador"
                    ? { usuario: form.usuario }
                    : { email: form.email }),
                  nombre: form.nombre,
                  rol: form.rol,
                  secciones: form.rol === "admin" ? [] : form.secciones,
                  proyectos: form.rol === "admin" ? [] : form.proyectos,
                  ...(form.password.trim() ? { password: form.password } : {}),
                },
          ),
        },
      );
      const payload = (await response.json()) as {
        usuario?: Usuario;
        passwordTemporal?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo guardar el usuario.");
      }

      if (!esEdicion && payload.passwordTemporal) {
        const creado = payload.usuario;
        const usaNombreUsuario = Boolean(creado?.usuario);
        setCredenciales({
          identificador: usaNombreUsuario
            ? creado!.usuario!
            : creado?.email ?? form.email.trim().toLowerCase(),
          etiqueta: usaNombreUsuario ? "Usuario" : "Correo",
          password: payload.passwordTemporal,
        });
      }
      setForm(null);
      setEditandoId(null);
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el usuario.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const borrar = async (usuario: Usuario) => {
    const nombre = usuario.nombre || usuario.usuario || usuario.email || "este usuario";
    if (
      !window.confirm(
        `¿Borrar a ${nombre}? Se eliminará su acceso y su cuenta de autenticación. Esta acción no se puede deshacer.`,
      )
    ) {
      return;
    }

    setBorrando(usuario.user_id);
    setError("");
    try {
      const response = await fetchAdmin(
        `/api/admin/usuarios/${encodeURIComponent(usuario.user_id)}`,
        { method: "DELETE" },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "No se pudo borrar el usuario.");
      }
      if (editandoId === usuario.user_id) {
        setForm(null);
        setEditandoId(null);
      }
      await cargar();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo borrar el usuario.",
      );
    } finally {
      setBorrando(null);
    }
  };

  const copiarCredenciales = async () => {
    if (!credenciales) return;
    try {
      await navigator.clipboard.writeText(
        `${credenciales.etiqueta}: ${credenciales.identificador}\nContraseña temporal: ${credenciales.password}`,
      );
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 1800);
    } catch {
      setError("No se pudieron copiar las credenciales.");
    }
  };

  const activos = usuarios.filter((usuario) => usuario.activo).length;
  const colaboradores = usuarios.filter(
    (usuario) => usuario.rol === "colaborador",
  ).length;
  const mostrarCampoUsuario = editandoId
    ? Boolean(form?.usuario)
    : form?.rol === "colaborador";

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-navy mb-1">Usuarios</h1>
          <p className="text-[13px] text-muted">
            Administra quién entra al panel y las secciones disponibles para cada colaborador.
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="inline-flex items-center gap-2 bg-yellow text-navy rounded-xl px-5 py-2.5 text-sm font-black hover:brightness-95 transition-all shrink-0"
        >
          <IconUI name="plus" size={15} /> Nuevo usuario
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Usuarios", value: usuarios.length, color: "#1883FF" },
          { label: "Activos", value: activos, color: "#059669" },
          { label: "Colaboradores", value: colaboradores, color: "#D97706" },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-border rounded-2xl px-5 py-4">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-muted mb-1">
              <Dot color={item.color} /> {item.label}
            </p>
            <p className="text-2xl font-black text-navy">{item.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold mb-5">
          {error}
        </div>
      )}

      {credenciales && (
        <div className="bg-navy text-white rounded-2xl p-5 mb-6 border-l-4 border-yellow">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-sm font-black mb-1">
                <IconUI name="key" size={16} className="text-yellow" /> Credenciales temporales
              </p>
              <p className="text-white/60 text-xs mb-4">
                Compártelas por un medio seguro. La contraseña no volverá a mostrarse.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="bg-white/10 rounded-xl px-3.5 py-3">
                  <span className="block text-white/50 text-[10px] uppercase font-bold mb-1">
                    {credenciales.etiqueta}
                  </span>
                  <span className="font-bold break-all">{credenciales.identificador}</span>
                </div>
                <div className="bg-white/10 rounded-xl px-3.5 py-3">
                  <span className="block text-white/50 text-[10px] uppercase font-bold mb-1">Contraseña</span>
                  <span className="font-mono font-bold">{credenciales.password}</span>
                </div>
              </div>
            </div>
            <button
              onClick={copiarCredenciales}
              className="inline-flex items-center gap-1.5 bg-yellow text-navy rounded-lg px-3 py-2 text-xs font-black shrink-0"
            >
              <IconUI name={copiado ? "check" : "copy"} size={13} />
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>
      )}

      {form && (
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-[15px] font-black text-navy">
                {editandoId ? "Editar usuario" : "Crear usuario"}
              </h2>
              <p className="text-xs text-muted mt-0.5">
                {editandoId
                  ? "Actualiza su rol, estado y permisos."
                  : "La cuenta quedará confirmada y lista para iniciar sesión."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { setForm(null); setPasswordNueva(""); }}
              className="text-muted hover:text-navy"
              aria-label="Cerrar formulario"
            >
              <IconUI name="x" size={18} />
            </button>
          </div>

          <form onSubmit={guardar} className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {mostrarCampoUsuario ? (
                <div>
                  <label className={label}>Usuario *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editandoId)}
                    pattern="[A-Za-z0-9._-]+"
                    className={field}
                    value={form.usuario}
                    onChange={(event) =>
                      setForm({ ...form, usuario: event.target.value })
                    }
                    placeholder="nombre.apellido"
                  />
                  {!editandoId && (
                    <p className="text-[10px] text-muted mt-1.5">
                      Letras, números, punto, guion o guion bajo; sin espacios.
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className={label}>Correo electrónico *</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editandoId)}
                    className={field}
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    placeholder="admin@kyoszen.com.mx"
                  />
                </div>
              )}
              <div>
                <label className={label}>Nombre</label>
                <input
                  className={field}
                  value={form.nombre}
                  onChange={(event) =>
                    setForm({ ...form, nombre: event.target.value })
                  }
                  placeholder="Nombre completo"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>Rol *</label>
                <select
                  className={field}
                  value={form.rol}
                  onChange={(event) =>
                    setForm({ ...form, rol: event.target.value as Rol })
                  }
                >
                  <option value="colaborador">Colaborador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>
              {!editandoId && (
                <div>
                  <label className={label}>Contraseña temporal</label>
                  <input
                    type="text"
                    minLength={6}
                    className={field}
                    value={form.password}
                    onChange={(event) =>
                      setForm({ ...form, password: event.target.value })
                    }
                    placeholder="Vacío = generar automáticamente"
                  />
                </div>
              )}
              {editandoId && (
                <div>
                  <label className={label}>Estado</label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, activo: !form.activo })}
                    className="h-[42px] flex items-center gap-3"
                  >
                    <span className={`relative w-10 h-6 rounded-full transition-colors ${form.activo ? "bg-blue" : "bg-slate-300"}`}>
                      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.activo ? "translate-x-4" : ""}`} />
                    </span>
                    <span className="text-sm font-bold text-navy">
                      {form.activo ? "Activo" : "Inactivo"}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {form.rol === "colaborador" && (
              <div>
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div>
                    <label className={label}>Secciones permitidas</label>
                    <p className="text-xs text-muted">
                      Solo aparecerán estas opciones en su navegación.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        secciones:
                          form.secciones.length === ADMIN_SECCIONES.length
                            ? []
                            : ADMIN_SECCIONES.map((seccion) => seccion.key),
                      })
                    }
                    className="text-xs font-bold text-blue hover:text-blue-dark"
                  >
                    {form.secciones.length === ADMIN_SECCIONES.length
                      ? "Quitar todas"
                      : "Seleccionar todas"}
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {ADMIN_SECCIONES.map((seccion) => {
                    const seleccionada = form.secciones.includes(seccion.key);
                    return (
                      <label
                        key={seccion.key}
                        className={`flex items-center gap-2.5 border rounded-xl px-3 py-2.5 text-[12px] font-bold cursor-pointer transition-colors ${
                          seleccionada
                            ? "border-blue bg-blue-soft text-navy"
                            : "border-border text-muted hover:border-blue/40"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={seleccionada}
                          onChange={() => cambiarSeccion(seccion.key)}
                          className="accent-[#042E7B]"
                        />
                        {seccion.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {form.rol === "colaborador" && form.secciones.includes("proyectos") && (
              <div className="rounded-2xl border border-[#E6EBF5] bg-[#F8FAFC] p-4">
                <div className="flex items-end justify-between gap-3 mb-3">
                  <div>
                    <label className={label}>Proyectos</label>
                    <p className="text-xs text-muted">
                      El colaborador solo verá los videos seleccionados.
                    </p>
                  </div>
                  {proyectos.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setForm({
                          ...form,
                          proyectos:
                            form.proyectos.length === proyectos.length
                              ? []
                              : proyectos.map((proyecto) => proyecto.id),
                        })
                      }
                      className="text-xs font-bold text-blue hover:text-blue-dark"
                    >
                      {form.proyectos.length === proyectos.length
                        ? "Quitar todos"
                        : "Seleccionar todos"}
                    </button>
                  )}
                </div>
                {loadingProyectos ? (
                  <p className="text-xs font-semibold text-muted">Cargando proyectos…</p>
                ) : errorProyectos ? (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                    {errorProyectos}
                  </p>
                ) : proyectos.length === 0 ? (
                  <p className="text-xs font-semibold text-muted">Aún no hay proyectos disponibles.</p>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {proyectos.map((proyecto) => {
                      const seleccionado = form.proyectos.includes(proyecto.id);
                      const espacio = proyecto.espacio_id
                        ? espaciosPorId.get(proyecto.espacio_id)
                        : null;
                      return (
                        <label
                          key={proyecto.id}
                          className={`flex items-start gap-2.5 border rounded-xl px-3 py-2.5 cursor-pointer transition-colors ${
                            seleccionado
                              ? "border-blue bg-blue-soft text-navy"
                              : "border-border bg-white text-muted hover:border-blue/40"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={seleccionado}
                            onChange={() => cambiarProyecto(proyecto.id)}
                            className="mt-0.5 accent-[#042E7B]"
                          />
                          <span className="min-w-0">
                            <span className="block truncate text-[12px] font-black text-navy">
                              {proyecto.titulo}
                            </span>
                            <span className="block truncate text-[10px] font-semibold">
                              {proyecto.folio || "Sin folio"} · {espacio || "Sin espacio"}
                            </span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Acceso: la única forma de recuperar la cuenta si olvida su contraseña */}
            {editandoId && (
              <div className="border border-border rounded-xl p-4 bg-slate-50">
                <p className="text-[13px] font-black text-navy mb-1">Acceso</p>
                <p className="text-xs text-muted leading-relaxed mb-3">
                  Entra en <span className="font-semibold text-navy">kyoszen.com/admin/login</span> escribiendo
                  su usuario <span className="font-mono font-semibold text-navy">{form.usuario || form.email}</span> y su contraseña.
                  {form.email.endsWith("@acceso.kyoszen.com") && (
                    <> Ese correo es solo un identificador interno: no recibe mensajes, así que no puede recuperar
                    su contraseña sola. Si la olvida, cámbiasela aquí.</>
                  )}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={passwordNueva}
                    onChange={(event) => setPasswordNueva(event.target.value)}
                    placeholder={`Contraseña nueva (mín. ${PASSWORD_MINIMO}), o déjalo vacío`}
                    className={`${field} sm:w-72`}
                  />
                  <button
                    type="button"
                    onClick={() => void cambiarPassword()}
                    disabled={cambiandoPassword}
                    className="inline-flex items-center gap-2 border border-navy text-navy rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-navy hover:text-white transition-colors disabled:opacity-60"
                  >
                    <IconUI name="key" size={14} />
                    {cambiandoPassword
                      ? "Cambiando…"
                      : passwordNueva.trim()
                        ? "Cambiar contraseña"
                        : "Generar contraseña nueva"}
                  </button>
                </div>
                <p className="text-[11px] text-muted mt-2">
                  Se muestra una sola vez arriba, para que se la pases. La anterior deja de servir de inmediato.
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={guardando}
                className="inline-flex items-center gap-2 bg-navy text-white rounded-xl px-6 py-2.5 text-sm font-bold hover:bg-blue-dark transition-colors disabled:opacity-60"
              >
                <IconUI name="save" size={14} />
                {guardando
                  ? "Guardando…"
                  : editandoId
                    ? "Guardar cambios"
                    : "Crear usuario"}
              </button>
              <button
                type="button"
                onClick={() => { setForm(null); setPasswordNueva(""); }}
                className="border border-border rounded-xl px-6 py-2.5 text-sm font-semibold text-muted hover:text-navy"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      ) : usuarios.length === 0 ? (
        <div className="bg-white border border-border rounded-2xl p-12 text-center">
          <div className="w-12 h-12 bg-blue-soft text-navy rounded-xl flex items-center justify-center mx-auto mb-3">
            <IconUI name="users" size={24} />
          </div>
          <p className="text-navy text-sm font-black mb-1">No hay perfiles administrados</p>
          <p className="text-muted text-xs">
            Las cuentas existentes sin perfil conservan acceso de administrador.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {usuarios.map((usuario) => (
            <div
              key={usuario.user_id}
              className={`bg-white border rounded-2xl p-5 flex items-start gap-4 ${usuario.activo ? "border-border" : "border-slate-200 opacity-70"}`}
            >
              <div className="w-10 h-10 rounded-xl bg-blue-soft text-navy flex items-center justify-center shrink-0">
                <IconUI name="user" size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <span className="text-[14px] font-black text-navy">
                    {usuario.nombre || "Sin nombre"}
                  </span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] uppercase tracking-wide font-black ${usuario.rol === "admin" ? "bg-yellow/20 border-yellow text-navy" : "bg-blue-soft border-blue/20 text-blue-dark"}`}>
                    {usuario.rol === "admin" ? "Admin" : "Colaborador"}
                  </span>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${usuario.activo ? "text-emerald-700" : "text-slate-500"}`}>
                    <Dot color={usuario.activo ? "#059669" : "#94A3B8"} size={6} />
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <p className="text-xs text-muted break-all mb-3">
                  <span className="font-bold text-navy/70">
                    {usuario.usuario ? "Usuario: " : "Correo: "}
                  </span>
                  {usuario.usuario ?? usuario.email}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {usuario.rol === "admin" ? (
                    <span className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-semibold">
                      Acceso a todo el panel
                    </span>
                  ) : usuario.secciones.length > 0 ? (
                    usuario.secciones.map((seccion) => (
                      <span
                        key={seccion}
                        className="text-[10px] bg-slate-100 text-slate-600 rounded-full px-2.5 py-1 font-semibold"
                      >
                        {etiquetas.get(seccion) ?? seccion}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold">
                      Sin secciones asignadas
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-3">
                  Creado el {fechaCorta(usuario.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => abrirEdicion(usuario)}
                  className="inline-flex items-center gap-1.5 border border-border rounded-lg px-3 py-2 text-xs font-bold text-navy hover:border-blue transition-colors"
                >
                  <IconUI name="pencil" size={13} /> Editar
                </button>
                <button
                  onClick={() => borrar(usuario)}
                  disabled={borrando === usuario.user_id}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                >
                  <IconUI name="trash" size={13} />
                  {borrando === usuario.user_id ? "Borrando…" : "Borrar"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
