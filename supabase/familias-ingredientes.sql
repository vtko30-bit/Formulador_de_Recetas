-- Familias de ingredientes (ej: LACTEOS → Leche, Crema, Yogurt)
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

-- Tabla de familias
CREATE TABLE IF NOT EXISTS public.familias_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_familias_user_nombre
  ON public.familias_ingredientes (user_id, lower(trim(nombre)));
CREATE INDEX IF NOT EXISTS idx_familias_user ON public.familias_ingredientes (user_id);

ALTER TABLE public.familias_ingredientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuario ve sus familias" ON public.familias_ingredientes;
CREATE POLICY "Usuario ve sus familias" ON public.familias_ingredientes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Columna familia en ingredientes (opcional)
ALTER TABLE public.base_ingredientes
  ADD COLUMN IF NOT EXISTS familia_id UUID REFERENCES public.familias_ingredientes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_base_ingredientes_familia ON public.base_ingredientes (familia_id);
