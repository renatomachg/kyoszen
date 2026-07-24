-- Asegura una sola versión activa por etapa y escena, incluyendo escena_id NULL.
-- NULLS NOT DISTINCT está disponible en PostgreSQL 15+ (compatible con Supabase).
drop index if exists proyecto_bloques_activa_ux;

create unique index if not exists proyecto_bloques_activa_ux
  on proyecto_bloques (etapa_id, escena_id) nulls not distinct
  where es_activa;
