-- Gestión de roles desde la app (solo superusuario).
-- Crea la tabla user_profiles, sincroniza con auth.users y permite que el superusuario cambie roles desde la app.
-- Ejecutar en Supabase: SQL Editor → New query → pegar y Run (después de roles-superusuario.sql).

-- Tabla de perfiles: id + email + rol (sincronizado con auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'usuario' CHECK (role IN ('usuario','editor','superusuario'))
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas: todos los autenticados pueden leer; solo superusuario puede actualizar (y así cambiar roles)
DROP POLICY IF EXISTS "user_profiles_select" ON public.user_profiles;
CREATE POLICY "user_profiles_select"
  ON public.user_profiles FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "user_profiles_update_super" ON public.user_profiles;
CREATE POLICY "user_profiles_update_super"
  ON public.user_profiles FOR UPDATE TO authenticated
  USING (public.es_superusuario())
  WITH CHECK (public.es_superusuario());

-- Insertar perfil al registrarse (trigger en auth.users)
DROP POLICY IF EXISTS "user_profiles_insert" ON public.user_profiles;
CREATE POLICY "user_profiles_insert"
  ON public.user_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Función: al insertar usuario en auth, crear fila en user_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'usuario')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Trigger en auth.users (si falla por permisos, rellenar user_profiles con asignar-rol-usuario.sql o al primer login)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- Sincronizar rol de user_profiles a auth.users (para que el JWT tenga el rol al volver a entrar)
CREATE OR REPLACE FUNCTION public.sync_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  UPDATE auth.users
  SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_profiles_role_updated ON public.user_profiles;
CREATE TRIGGER on_user_profiles_role_updated
  AFTER UPDATE OF role ON public.user_profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION public.sync_role_to_auth();

-- Rellenar user_profiles con usuarios existentes en auth (ejecutar una vez)
INSERT INTO public.user_profiles (id, email, role)
SELECT u.id, u.email, coalesce(u.raw_app_meta_data->>'role', 'usuario')
FROM auth.users u
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = CASE
    WHEN public.user_profiles.role = 'superusuario' THEN public.user_profiles.role
    ELSE EXCLUDED.role
  END;

-- RPC: asegurar que el usuario actual esté en user_profiles (llamar al iniciar sesión si el trigger en auth.users no existe)
CREATE OR REPLACE FUNCTION public.ensure_my_profile(p_email text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role)
  VALUES (auth.uid(), coalesce(p_email, (SELECT email FROM auth.users WHERE id = auth.uid())), 'usuario')
  ON CONFLICT (id) DO UPDATE SET email = coalesce(EXCLUDED.email, public.user_profiles.email);
END;
$$;
