# Roles: Superusuario y Usuario

La app usa dos roles definidos en **Supabase Auth** mediante `app_metadata.role`:

- **Usuario** (por defecto): ve sus recetas + las recetas públicas; solo edita/elimina las suyas.
- **Superusuario**: ve **todas** las recetas e ingredientes y puede editarlos/eliminarlos.

## Cómo dar rol de Superusuario

1. Entra en **Supabase** → tu proyecto → **Authentication** → **Users**.
2. Abre el usuario al que quieras dar el rol.
3. En **App Metadata** (o "Edit user" → App Metadata), añade:
   ```json
   {"role": "superusuario"}
   ```
   Si ya hay más campos, añade solo la clave: `"role": "superusuario"`.
4. Guarda. El usuario debe **cerrar sesión y volver a entrar** para que el rol se aplique (el JWT se actualiza al iniciar sesión).

## SQL necesario

Ejecuta en **SQL Editor** el contenido de **`roles-superusuario.sql`** para crear la función `es_superusuario()` y las políticas RLS que usan este rol.

## Comportamiento

- **Usuario normal**: ve sus recetas y las públicas; solo edita/elimina las suyas. En **Ingredientes** ve la **misma base para todos** (puede consultar y usarla en sus recetas), pero **no** puede añadir, editar ni eliminar ingredientes (solo el superusuario).
- **Superusuario**: ve todas las recetas (badge "De otro" en las ajenas) y puede editarlas/eliminarlas. En **Ingredientes** es el único que puede usar "Nuevo ingrediente", "Importar Excel", "Editar" y "Eliminar"; todos los usuarios ven y usan esa misma base al crear recetas.
