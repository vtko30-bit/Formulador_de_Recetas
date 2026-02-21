-- Roles: Superusuario (ve y gestiona todo) y Usuario (como hasta ahora).
-- El rol se guarda en app_metadata.role en Supabase Auth.
-- Cómo dar rol de superusuario: Authentication → Users → [usuario] → Edit → App Metadata → {"role": "superusuario"}
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run

-- Función auxiliar: true si el usuario actual tiene rol "superusuario"
CREATE OR REPLACE FUNCTION public.es_superusuario()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'superusuario',
    false
  );
$$;

-- ========== RECETAS ==========
-- Quitar políticas actuales
DROP POLICY IF EXISTS "Usuario ve sus recetas o públicas" ON public.recetas;
DROP POLICY IF EXISTS "Usuario crea sus recetas" ON public.recetas;
DROP POLICY IF EXISTS "Usuario actualiza solo sus recetas" ON public.recetas;
DROP POLICY IF EXISTS "Usuario elimina solo sus recetas" ON public.recetas;

-- SELECT: superusuario ve todas; usuario ve propias o públicas
CREATE POLICY "recetas_select"
  ON public.recetas FOR SELECT TO authenticated
  USING (
    public.es_superusuario()
    OR (auth.uid() = user_id OR publica = true)
  );

-- INSERT: superusuario o usuario creando su propia receta
CREATE POLICY "recetas_insert"
  ON public.recetas FOR INSERT TO authenticated
  WITH CHECK (public.es_superusuario() OR auth.uid() = user_id);

-- UPDATE: superusuario o dueño
CREATE POLICY "recetas_update"
  ON public.recetas FOR UPDATE TO authenticated
  USING (public.es_superusuario() OR auth.uid() = user_id)
  WITH CHECK (public.es_superusuario() OR auth.uid() = user_id);

-- DELETE: superusuario o dueño
CREATE POLICY "recetas_delete"
  ON public.recetas FOR DELETE TO authenticated
  USING (public.es_superusuario() OR auth.uid() = user_id);

-- ========== BASE INGREDIENTES ==========
-- Disponible para todos: cualquier usuario autenticado puede leer la base de ingredientes.
-- Solo el superusuario puede crear, editar o eliminar ingredientes.
DROP POLICY IF EXISTS "Usuario ve sus ingredientes" ON public.base_ingredientes;
DROP POLICY IF EXISTS "base_ingredientes_all" ON public.base_ingredientes;
DROP POLICY IF EXISTS "base_ingredientes_select" ON public.base_ingredientes;
DROP POLICY IF EXISTS "base_ingredientes_insert" ON public.base_ingredientes;
DROP POLICY IF EXISTS "base_ingredientes_update" ON public.base_ingredientes;
DROP POLICY IF EXISTS "base_ingredientes_delete" ON public.base_ingredientes;

CREATE POLICY "base_ingredientes_select"
  ON public.base_ingredientes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "base_ingredientes_insert"
  ON public.base_ingredientes FOR INSERT TO authenticated
  WITH CHECK (public.es_superusuario());

CREATE POLICY "base_ingredientes_update"
  ON public.base_ingredientes FOR UPDATE TO authenticated
  USING (public.es_superusuario())
  WITH CHECK (public.es_superusuario());

CREATE POLICY "base_ingredientes_delete"
  ON public.base_ingredientes FOR DELETE TO authenticated
  USING (public.es_superusuario());

-- ========== FAMILIAS INGREDIENTES (si las usas) ==========
DROP POLICY IF EXISTS "Usuario ve sus familias" ON public.familias_ingredientes;

CREATE POLICY "familias_ingredientes_all"
  ON public.familias_ingredientes FOR ALL TO authenticated
  USING (public.es_superusuario() OR auth.uid() = user_id)
  WITH CHECK (public.es_superusuario() OR auth.uid() = user_id);
