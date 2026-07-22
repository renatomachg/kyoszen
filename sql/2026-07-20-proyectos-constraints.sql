-- Evita números de versión duplicados dentro de una misma etapa.
create unique index if not exists proyecto_entregables_etapa_version_ux
  on proyecto_entregables(etapa_id, version_num);

-- Garantiza que cada etapa tenga como máximo una versión activa.
create unique index if not exists proyecto_entregables_una_activa_ux
  on proyecto_entregables(etapa_id)
  where es_activa;
