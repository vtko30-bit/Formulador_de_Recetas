-- Recetas públicas: columna publica y políticas RLS para que todos vean las publicadas.
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

-- 1) Añadir columna publica (por defecto privada)
ALTER TABLE public.recetas
  ADD COLUMN IF NOT EXISTS publica BOOLEAN NOT NULL DEFAULT false;

-- 2) Quitar la política actual que solo permitía ver las propias
DROP POLICY IF EXISTS "Usuario ve sus recetas" ON public.recetas;

-- 3) SELECT: cada usuario ve sus recetas Y las que están publicadas por cualquiera
CREATE POLICY "Usuario ve sus recetas o públicas"
  ON public.recetas FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR publica = true);

-- 4) INSERT: solo puede crear recetas propias
CREATE POLICY "Usuario crea sus recetas"
  ON public.recetas FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 5) UPDATE: solo el dueño puede actualizar (incl. marcar/desmarcar pública)
CREATE POLICY "Usuario actualiza solo sus recetas"
  ON public.recetas FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6) DELETE: solo el dueño puede eliminar
CREATE POLICY "Usuario elimina solo sus recetas"
  ON public.recetas FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
