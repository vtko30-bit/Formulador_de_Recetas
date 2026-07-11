-- Instrucciones de preparación en recetas
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

ALTER TABLE public.recetas
  ADD COLUMN IF NOT EXISTS instrucciones TEXT DEFAULT '';

COMMENT ON COLUMN public.recetas.instrucciones IS 'Paso a paso de preparación de la receta';
