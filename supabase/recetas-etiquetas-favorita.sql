-- Etiquetas y favoritos en la tabla recetas
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

ALTER TABLE public.recetas
  ADD COLUMN IF NOT EXISTS etiquetas TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS favorita BOOLEAN NOT NULL DEFAULT false;

-- Índice opcional para filtrar favoritas por usuario
CREATE INDEX IF NOT EXISTS idx_recetas_user_favorita
  ON public.recetas (user_id, favorita)
  WHERE favorita = true;

COMMENT ON COLUMN public.recetas.etiquetas IS 'Etiquetas separadas por comas, ej: helado,fruta,verano';
COMMENT ON COLUMN public.recetas.favorita IS 'Marcada como favorita por el propietario de la receta';
