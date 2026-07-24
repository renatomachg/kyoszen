CREATE TABLE public.cuestionario_respuestas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  invitado_nombre text,
  respuestas jsonb NOT NULL DEFAULT '{}'::jsonb,
  paso_actual integer NOT NULL DEFAULT 0,
  completado boolean NOT NULL DEFAULT false,
  enviado_en timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cuestionario_respuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso permisivo a cuestionario_respuestas"
  ON public.cuestionario_respuestas
  FOR ALL
  USING (true)
  WITH CHECK (true);

INSERT INTO public.cuestionario_respuestas (token, invitado_nombre)
VALUES ('rosy', 'Rosy');
