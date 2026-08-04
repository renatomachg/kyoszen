-- Admin — Entrega W: acceso al panel mediante nombre de usuario.
-- Esta migración se entrega para revisión y NO debe aplicarse todavía.

ALTER TABLE admin_perfiles ADD COLUMN usuario text UNIQUE;
