-- Proyectos Hub — Entrega K: carpetas anidadas para espacios de archivos.
-- Esta migración se entrega para revisión y NO debe aplicarse todavía.

CREATE TABLE espacio_carpetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id uuid NOT NULL REFERENCES proyecto_espacios(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES espacio_carpetas(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE espacio_archivos
  ADD COLUMN carpeta_id uuid REFERENCES espacio_carpetas(id) ON DELETE SET NULL;

ALTER TABLE espacio_carpetas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso permisivo a espacio_carpetas"
  ON espacio_carpetas FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX espacio_carpetas_espacio_id_idx ON espacio_carpetas(espacio_id);
CREATE INDEX espacio_carpetas_parent_id_idx ON espacio_carpetas(parent_id);
CREATE INDEX espacio_archivos_carpeta_id_idx ON espacio_archivos(carpeta_id);
