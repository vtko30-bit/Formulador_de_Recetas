-- Evitar ingredientes duplicados (mismo nombre para el mismo usuario)
-- Ejecutar en Supabase: SQL Editor → New query → pegar TODO y Run
-- Si da error 23505, primero ejecuta PASO 1, luego PASO 2.

-- ========== PASO 1: Borrar duplicados (deja solo uno por nombre) ==========
DELETE FROM public.base_ingredientes a
USING public.base_ingredientes b
WHERE a.user_id = b.user_id
  AND lower(trim(a.ingrediente)) = lower(trim(b.ingrediente))
  AND a.id > b.id;

-- ========== PASO 2: Crear el índice único ==========
CREATE UNIQUE INDEX IF NOT EXISTS idx_base_ingredientes_user_nombre
  ON public.base_ingredientes (user_id, lower(trim(ingrediente)));
