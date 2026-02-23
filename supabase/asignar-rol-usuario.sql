-- ============================================================
-- Asignar rol a un usuario por email
-- ============================================================
-- 1. Cambia abajo TU_EMAIL@ejemplo.com por el correo del usuario.
-- 2. Ejecuta SOLO la query del rol que quieras (las demás déjalas comentadas).
-- 3. El usuario debe cerrar sesión y volver a entrar en la app.
-- ============================================================

-- Email del usuario (cámbialo):
-- ej: 'maria@empresa.com'

-- --- Rol SUPERUSUARIO (ve y gestiona todo, incluida la base de ingredientes) ---
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "superusuario"}'::jsonb
WHERE email = 'TU_EMAIL@ejemplo.com';

-- --- Rol EDITOR (ve y edita todas las recetas, no gestiona ingredientes) ---
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data || '{"role": "editor"}'::jsonb
-- WHERE email = 'TU_EMAIL@ejemplo.com';

-- --- Quitar rol (dejar como usuario normal) ---
-- UPDATE auth.users
-- SET raw_app_meta_data = raw_app_meta_data - 'role'
-- WHERE email = 'TU_EMAIL@ejemplo.com';
