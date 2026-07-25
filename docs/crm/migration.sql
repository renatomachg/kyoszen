CREATE TABLE crm_candidatos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text,
  correo text,
  whatsapp text,
  ubicacion text,
  experiencia text,
  cv_url text,
  estado text NOT NULL DEFAULT 'nuevo'
    CHECK (estado IN (
      'nuevo',
      'contactado',
      'entrevista',
      'enviado',
      'contratado',
      'descartado'
    )),
  origen text NOT NULL DEFAULT 'aplicacion'
    CHECK (origen IN ('aplicacion', 'contacto', 'manual')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_notas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id uuid NOT NULL REFERENCES crm_candidatos(id) ON DELETE CASCADE,
  texto text NOT NULL,
  autor text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE aplicaciones
  ADD COLUMN candidato_id uuid REFERENCES crm_candidatos(id);

ALTER TABLE crm_candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_notas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso permisivo a candidatos CRM"
  ON crm_candidatos
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acceso permisivo a notas CRM"
  ON crm_notas
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX crm_candidatos_estado_idx ON crm_candidatos(estado);
CREATE INDEX crm_notas_candidato_id_idx ON crm_notas(candidato_id);
CREATE INDEX aplicaciones_candidato_id_idx ON aplicaciones(candidato_id);
