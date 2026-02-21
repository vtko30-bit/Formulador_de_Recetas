-- Formulador de Recetas de Helados (según Excel Escuela Dubovik)
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

-- 0) Familias de ingredientes (ej: LACTEOS, FRUTAS)
CREATE TABLE IF NOT EXISTS public.familias_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_familias_user_nombre ON public.familias_ingredientes (user_id, lower(trim(nombre)));
CREATE INDEX IF NOT EXISTS idx_familias_user ON public.familias_ingredientes (user_id);
ALTER TABLE public.familias_ingredientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuario ve sus familias" ON public.familias_ingredientes;
CREATE POLICY "Usuario ve sus familias" ON public.familias_ingredientes
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 1) Base de datos de ingredientes (como hoja "BASE DATOS INGREDIENTES")
CREATE TABLE IF NOT EXISTS public.base_ingredientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  familia_id UUID REFERENCES public.familias_ingredientes(id) ON DELETE SET NULL,
  ingrediente TEXT NOT NULL,
  pct_graso NUMERIC(10,4) DEFAULT 0,
  azucar NUMERIC(10,4) DEFAULT 0,
  solidos_totales NUMERIC(10,4) DEFAULT 0,
  pod NUMERIC(10,4) DEFAULT 0,
  pac NUMERIC(10,4) DEFAULT 0,
  lactosa NUMERIC(10,4) DEFAULT 0,
  proteina NUMERIC(10,4) DEFAULT 0,
  precio NUMERIC(10,4) DEFAULT 0,
  nota TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_base_ingredientes_user ON public.base_ingredientes (user_id);
CREATE INDEX IF NOT EXISTS idx_base_ingredientes_familia ON public.base_ingredientes (familia_id);
-- Un ingrediente no puede repetirse para el mismo usuario (nombre sin distinguir mayúsculas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_base_ingredientes_user_nombre
  ON public.base_ingredientes (user_id, lower(trim(ingrediente)));
ALTER TABLE public.base_ingredientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuario ve sus ingredientes" ON public.base_ingredientes;
CREATE POLICY "Usuario ve sus ingredientes" ON public.base_ingredientes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) Recetas / Fórmulas (como hojas "FORMULA AQUÍ", "HELADO DE FRESA - form")
-- ingredientes_lineas: [{ "ingrediente": "Leche", "cantidad": 267, "pct_graso": 0.96, "solidos_totales": 3.2, "pod": 2.14, "pac": 13.35, "lactosa": 13.35, "proteina": 1.04 }, ...]
CREATE TABLE IF NOT EXISTS public.recetas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  temperatura NUMERIC(6,2) DEFAULT NULL,  -- ej: -14, -12 (°C)
  descripcion TEXT DEFAULT '',
  ingredientes_lineas JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_recetas_user ON public.recetas (user_id);
CREATE INDEX IF NOT EXISTS idx_recetas_updated ON public.recetas (updated_at DESC);
ALTER TABLE public.recetas ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Usuario ve sus recetas" ON public.recetas;
CREATE POLICY "Usuario ve sus recetas" ON public.recetas
  FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger updated_at (search_path fijo por seguridad)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS base_ingredientes_updated ON public.base_ingredientes;
CREATE TRIGGER base_ingredientes_updated
  BEFORE UPDATE ON public.base_ingredientes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS recetas_updated ON public.recetas;
CREATE TRIGGER recetas_updated
  BEFORE UPDATE ON public.recetas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
