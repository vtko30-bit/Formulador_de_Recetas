# Roles: Superusuario, Editor y Usuario

La app usa tres roles definidos en **Supabase Auth** mediante `app_metadata.role`:

- **Usuario** (por defecto): ve sus recetas + las recetas públicas; solo edita/elimina las suyas. En Ingredientes solo consulta.
- **Editor**: ve **todas** las recetas y puede editarlas/eliminarlas/publicarlas; **no** puede gestionar la base de ingredientes (igual que usuario en Ingredientes).
- **Superusuario**: ve y gestiona todas las recetas **y** la base de ingredientes (Nuevo ingrediente, Importar Excel, Editar, Eliminar). Además puede **cambiar el rol de cualquier usuario** desde la app (vista "Usuarios").

## Cómo asignar un rol

### Desde la app (solo superusuario)

1. Inicia sesión como **superusuario**.
2. En la cabecera, entra en **Usuarios** (el botón solo es visible para superusuarios).
3. En la tabla verás la lista de usuarios con su correo y un desplegable de rol (Usuario, Editor, Superusuario).
4. Cambia el rol y pulsa **Guardar** en esa fila.
5. El usuario afectado debe **cerrar sesión y volver a entrar** para que el nuevo rol se aplique.

Para que esto funcione, en Supabase debes haber ejecutado antes el script **`gestion-roles-app.sql`** (crea la tabla `user_profiles` y la sincronización con Auth).

### Desde Supabase (SQL o panel)

Si no tienes aún un superusuario, asígnale el rol con **`asignar-rol-usuario.sql`** (cambia el email y ejecuta la query de superusuario en el SQL Editor). A partir de ahí, ese superusuario puede dar o quitar roles desde la app.

## SQL necesario

1. **`roles-superusuario.sql`**: funciones `es_superusuario()`, `es_editor()` y políticas RLS.
2. **`gestion-roles-app.sql`**: tabla `user_profiles`, sincronización con `auth.users` y posibilidad de gestionar roles desde la app. Ejecutar después de `roles-superusuario.sql`.

## Comportamiento por rol

| Acción | Usuario | Editor | Superusuario |
|--------|---------|--------|--------------|
| Ver sus recetas y públicas | ✓ | ✓ | ✓ |
| Ver todas las recetas | — | ✓ | ✓ |
| Editar/eliminar/publicar cualquier receta | solo propias | todas | todas |
| Ver base de ingredientes | ✓ | ✓ | ✓ |
| Añadir/editar/eliminar ingredientes | — | — | ✓ |
