-- Proyectos principales del Centro de Proyectos.
create table if not exists proyectos (
  id uuid primary key default gen_random_uuid(),
  tipo text not null default 'video_induccion',
  titulo text not null,
  area text,
  descripcion text,
  estado text not null default 'activo',
  etapa_actual int not null default 1,
  publicado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Etapas ordenadas de cada proyecto.
create table if not exists proyecto_etapas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  tipo text not null,
  nombre text not null,
  orden int not null,
  estado text not null default 'bloqueada',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (proyecto_id, orden)
);

-- Versiones entregables asociadas con una etapa.
create table if not exists proyecto_entregables (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references proyecto_etapas(id) on delete cascade,
  version_num int not null default 1,
  contenido jsonb not null default '{}'::jsonb,
  archivos jsonb not null default '[]'::jsonb,
  nota text,
  es_activa boolean not null default true,
  created_at timestamptz not null default now()
);

-- Comentarios de administradores y clientes por etapa.
create table if not exists proyecto_comentarios (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references proyecto_etapas(id) on delete cascade,
  autor_nombre text not null,
  autor_rol text not null default 'cliente',
  contenido text not null,
  created_at timestamptz not null default now()
);

-- Índices para las relaciones entre proyectos, etapas y contenido.
create index if not exists proyecto_etapas_proyecto_id_idx
  on proyecto_etapas (proyecto_id);
create index if not exists proyecto_entregables_etapa_id_idx
  on proyecto_entregables (etapa_id);
create index if not exists proyecto_comentarios_etapa_id_idx
  on proyecto_comentarios (etapa_id);

-- RLS permisivo para proyectos; las API routes controlan el acceso real.
alter table proyectos enable row level security;
drop policy if exists "Acceso permisivo a proyectos" on proyectos;
create policy "Acceso permisivo a proyectos"
  on proyectos for all
  using (true)
  with check (true);

-- RLS permisivo para las etapas de proyecto.
alter table proyecto_etapas enable row level security;
drop policy if exists "Acceso permisivo a etapas de proyecto" on proyecto_etapas;
create policy "Acceso permisivo a etapas de proyecto"
  on proyecto_etapas for all
  using (true)
  with check (true);

-- RLS permisivo para los entregables de proyecto.
alter table proyecto_entregables enable row level security;
drop policy if exists "Acceso permisivo a entregables de proyecto" on proyecto_entregables;
create policy "Acceso permisivo a entregables de proyecto"
  on proyecto_entregables for all
  using (true)
  with check (true);

-- RLS permisivo para los comentarios de proyecto.
alter table proyecto_comentarios enable row level security;
drop policy if exists "Acceso permisivo a comentarios de proyecto" on proyecto_comentarios;
create policy "Acceso permisivo a comentarios de proyecto"
  on proyecto_comentarios for all
  using (true)
  with check (true);
