-- Proyectos Hub: esquema completo de Espacios (Entregas G, H e I).
-- Esta migración se entrega para revisión y NO debe aplicarse todavía.

CREATE TABLE proyecto_espacios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('aprobacion', 'archivos', 'tablero')),
  descripcion text,
  icono text,
  color text,
  orden int NOT NULL DEFAULT 0,
  publicado boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE proyectos
  ADD COLUMN espacio_id uuid REFERENCES proyecto_espacios(id);

CREATE TABLE espacio_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id uuid NOT NULL REFERENCES proyecto_espacios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  url text NOT NULL,
  tipo text,
  peso bigint,
  nota text,
  estado text NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'aprobado', 'cambios')),
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE espacio_columnas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espacio_id uuid NOT NULL REFERENCES proyecto_espacios(id) ON DELETE CASCADE,
  nombre text NOT NULL,
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE espacio_tarjetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  columna_id uuid NOT NULL REFERENCES espacio_columnas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descripcion text,
  orden int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE espacio_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  archivo_id uuid REFERENCES espacio_archivos(id) ON DELETE CASCADE,
  tarjeta_id uuid REFERENCES espacio_tarjetas(id) ON DELETE CASCADE,
  autor_nombre text,
  autor_rol text CHECK (autor_rol IN ('admin', 'cliente')),
  contenido text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proyecto_espacios ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacio_archivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacio_columnas ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacio_tarjetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE espacio_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso permisivo a proyecto_espacios"
  ON proyecto_espacios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso permisivo a espacio_archivos"
  ON espacio_archivos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso permisivo a espacio_columnas"
  ON espacio_columnas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso permisivo a espacio_tarjetas"
  ON espacio_tarjetas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso permisivo a espacio_comentarios"
  ON espacio_comentarios FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX proyectos_espacio_id_idx ON proyectos(espacio_id);
CREATE INDEX espacio_archivos_espacio_id_idx ON espacio_archivos(espacio_id);
CREATE INDEX espacio_columnas_espacio_id_idx ON espacio_columnas(espacio_id);
CREATE INDEX espacio_tarjetas_columna_id_idx ON espacio_tarjetas(columna_id);
CREATE INDEX espacio_comentarios_archivo_id_idx ON espacio_comentarios(archivo_id);
CREATE INDEX espacio_comentarios_tarjeta_id_idx ON espacio_comentarios(tarjeta_id);

DO $$
DECLARE
  videos_id uuid;
  plataforma_id uuid;
BEGIN
  INSERT INTO proyecto_espacios (nombre, tipo, icono, orden, publicado)
  VALUES ('Videos de inducción', 'aprobacion', '🎬', 1, true)
  RETURNING id INTO videos_id;

  INSERT INTO proyecto_espacios (nombre, tipo, icono, orden, publicado)
  VALUES ('Artes', 'archivos', '🎨', 2, true);

  INSERT INTO proyecto_espacios (nombre, tipo, icono, orden, publicado)
  VALUES ('Plataforma', 'tablero', '🧩', 3, true)
  RETURNING id INTO plataforma_id;

  UPDATE proyectos SET espacio_id = videos_id;

  INSERT INTO espacio_columnas (espacio_id, nombre, orden)
  VALUES
    (plataforma_id, 'Por hacer', 0),
    (plataforma_id, 'En progreso', 1),
    (plataforma_id, 'Listo', 2);
END
$$;
