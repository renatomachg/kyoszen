-- Admin — Entrega V: perfiles, roles y acceso por sección.
-- Esta migración se entrega para revisión y NO debe aplicarse todavía.

CREATE TABLE admin_perfiles (
  user_id uuid PRIMARY KEY,
  email text,
  nombre text,
  rol text NOT NULL DEFAULT 'colaborador'
    CHECK (rol IN ('admin', 'colaborador')),
  secciones text[] NOT NULL DEFAULT '{}',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso permisivo a admin_perfiles"
  ON admin_perfiles FOR ALL USING (true) WITH CHECK (true);
