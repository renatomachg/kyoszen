-- Limpia el modelo v1 y sus datos de prueba desechables.
drop table if exists proyecto_entregables cascade;
drop table if exists proyecto_comentarios cascade;
delete from proyecto_etapas;
delete from proyectos;

-- Añade los datos necesarios para identificar proyectos y configurar etapas.
alter table proyectos add column if not exists folio text;
alter table proyecto_etapas
  add column if not exists modo text not null default 'por_escena';

-- Escenas que componen un proyecto, ordenadas para su presentación.
create table if not exists proyecto_escenas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos(id) on delete cascade,
  numero int not null,
  titulo text not null default '',
  orden int not null,
  created_at timestamptz not null default now(),
  unique (proyecto_id, orden)
);

-- Bloques aprobables por etapa y escena; escena_id nulo representa un entregable único.
create table if not exists proyecto_bloques (
  id uuid primary key default gen_random_uuid(),
  etapa_id uuid not null references proyecto_etapas(id) on delete cascade,
  escena_id uuid references proyecto_escenas(id) on delete cascade,
  estado text not null default 'pendiente',
  contenido jsonb not null default '{}'::jsonb,
  archivos jsonb not null default '[]'::jsonb,
  nota text,
  version_num int not null default 1,
  es_activa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índices para consultar bloques por etapa y por escena.
create index if not exists proyecto_bloques_etapa_id_idx
  on proyecto_bloques (etapa_id);
create index if not exists proyecto_bloques_escena_id_idx
  on proyecto_bloques (escena_id);

-- Mantiene una sola versión activa por celda de etapa y escena.
create unique index if not exists proyecto_bloques_activa_ux
  on proyecto_bloques (etapa_id, escena_id)
  where es_activa;

-- Conversación asociada directamente con cada bloque aprobable.
create table if not exists proyecto_comentarios (
  id uuid primary key default gen_random_uuid(),
  bloque_id uuid not null references proyecto_bloques(id) on delete cascade,
  autor_nombre text not null,
  autor_rol text not null default 'cliente',
  contenido text not null,
  created_at timestamptz not null default now()
);

create index if not exists proyecto_comentarios_bloque_id_idx
  on proyecto_comentarios (bloque_id);

-- RLS permisivo para las escenas; las API routes controlan el acceso real.
alter table proyecto_escenas enable row level security;
drop policy if exists "Acceso permisivo a escenas de proyecto" on proyecto_escenas;
create policy "Acceso permisivo a escenas de proyecto"
  on proyecto_escenas for all
  using (true)
  with check (true);

-- RLS permisivo para los bloques de proyecto.
alter table proyecto_bloques enable row level security;
drop policy if exists "Acceso permisivo a bloques de proyecto" on proyecto_bloques;
create policy "Acceso permisivo a bloques de proyecto"
  on proyecto_bloques for all
  using (true)
  with check (true);

-- RLS permisivo para los comentarios de proyecto.
alter table proyecto_comentarios enable row level security;
drop policy if exists "Acceso permisivo a comentarios de proyecto" on proyecto_comentarios;
create policy "Acceso permisivo a comentarios de proyecto"
  on proyecto_comentarios for all
  using (true)
  with check (true);
