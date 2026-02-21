# Solución: Tengo 2 proyectos en Supabase y no puedo crear otro

En el plan gratuito de Supabase solo puedes tener **2 proyectos activos**. Tienes dos caminos:

---

## Opción A: Usar uno de tus 2 proyectos existentes (recomendada)

**No necesitas eliminar nada.** Puedes usar uno de los proyectos que ya tienes para la app de Recetas de Helados.

### Pasos

1. Entra en **https://supabase.com** e inicia sesión.
2. En la lista de proyectos, haz clic en **uno** de los dos proyectos (el que quieras usar para Recetas, o el que menos uses).
3. En el menú de la izquierda, haz clic en **"SQL Editor"**.
4. Haz clic en **"+ New query"**.
5. Abre en tu PC el archivo: **Recetas de Helados → supabase → schema.sql**.
6. Copia **todo** el contenido (Ctrl+A, Ctrl+C) y pégalo en la ventana de Supabase (Ctrl+V).
7. Haz clic en el botón verde **"Run"**.
8. Si sale "Success", las tablas de Recetas ya están creadas en ese proyecto.
9. Ve a **Project Settings** (icono de engranaje abajo a la izquierda) → **API**.
10. Copia la **Project URL** y la clave **anon public**.
11. En tu PC, abre **Recetas de Helados → config.js** y pega ahí la URL y la clave (como en la guía principal).
12. Abre **index.html** de Recetas de Helados y prueba a crear cuenta e iniciar sesión.

**Importante:** Si ese proyecto ya lo usas para otra app (por ejemplo la caja), las tablas de Recetas (**recetas** y **base_ingredientes**) conviven con las demás. No se pisan. Cada app usa sus propias tablas.

---

## Opción B: Eliminar un proyecto para poder crear uno nuevo

Si prefieres tener un proyecto **solo** para Recetas de Helados, puedes borrar uno de los 2 proyectos actuales.

### Dónde está el botón "Delete project"

1. Entra en **https://supabase.com** e inicia sesión.
2. Haz clic en el proyecto que quieres **eliminar** (no en el que quieres conservar).
3. En el menú de la **izquierda**, abajo del todo, haz clic en **"Project Settings"** (icono de engranaje ⚙️).
4. En el menú interno que aparece (debajo del nombre del proyecto), haz clic en **"General"**.
5. Baja con el scroll hasta el final de la página.
6. Verás una zona de **"Danger zone"** o **"Zona de peligro"** (a veces en rojo).
7. Ahí está el botón **"Delete project"** (Eliminar proyecto).

### Si no ves "Delete project"

- Asegúrate de estar en **Project Settings** → **General** (no en API ni en Database).
- Baja hasta el final de la página; a veces está muy abajo.
- Si tu cuenta está en una **organización** (no personal), a veces solo el **propietario** de la organización puede eliminar proyectos. En ese caso:
  - Entra en **https://supabase.com/dashboard**.
  - Arriba a la izquierda verás el nombre de la organización o "Personal". Haz clic ahí.
  - Si estás en una organización, prueba a cambiar a tu espacio "Personal" y ver si los proyectos están ahí; la eliminación suele estar permitida en proyectos personales.

### Al hacer clic en "Delete project"

- Te pedirán escribir el **nombre del proyecto** para confirmar (cópialo tal cual del dashboard).
- Te avisarán que **no se puede deshacer** y que se borrarán todos los datos de ese proyecto.
- Después de confirmar, el proyecto desaparece y en unos minutos podrás crear un proyecto nuevo.

---

## Resumen

| Situación | Qué hacer |
|----------|-----------|
| Te basta con usar uno de los 2 proyectos para Recetas | **Opción A**: entrar a ese proyecto → SQL Editor → pegar y ejecutar **schema.sql** → copiar URL y clave → ponerlas en **config.js**. |
| Quieres 3 proyectos y uno actual no lo usas | **Opción B**: Project Settings → General → bajar hasta "Danger zone" → Delete project → confirmar. Luego crear el nuevo proyecto. |

Si me dices si prefieres **usar un proyecto que ya tienes** o **eliminar uno** (y en qué paso te quedas), te indico el siguiente paso exacto.
