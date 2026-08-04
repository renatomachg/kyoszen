-- Admin — Entrega X: acceso a proyectos específicos por colaborador.
-- Esta migración se entrega para revisión y NO debe aplicarse todavía.

ALTER TABLE admin_perfiles ADD COLUMN proyectos uuid[] NOT NULL DEFAULT '{}';
