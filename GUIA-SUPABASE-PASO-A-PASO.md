# Guía paso a paso: Crear la base de datos en Supabase

Sigue estos pasos en orden. No hace falta saber programar.

---

## Paso 1: Entrar en Supabase

1. Abre tu navegador (Chrome, Edge, etc.).
2. Ve a: **https://supabase.com**
3. Arriba a la derecha haz clic en **"Start your project"** (o **"Iniciar sesión"** si está en español).
4. Si no tienes cuenta:
   - Elige **"Sign up with GitHub"** o **"Sign up with Google"** o **"Sign up with email"**.
   - Crea la cuenta (correo y contraseña si eliges email).
5. Inicia sesión.

---

## Paso 2: Crear un proyecto nuevo

1. En la página principal de Supabase verás **"New project"** (Nuevo proyecto).
2. Haz clic en **"New project"**.
3. Rellena:
   - **Name**: pon un nombre, por ejemplo **Recetas Helados**.
   - **Database Password**: inventa una contraseña **fuerte** y **anótala** en un lugar seguro (la necesitas para la base de datos; la app no la usa directamente).
   - **Region**: elige la más cercana a ti (por ejemplo **South America (São Paulo)** si estás en Latinoamérica).
4. Haz clic en **"Create new project"**.
5. Espera 1–2 minutos hasta que el proyecto esté listo (verás una animación y luego el panel del proyecto).

---

## Paso 3: Abrir el editor SQL

1. En el menú de la izquierda verás varias opciones.
2. Haz clic en **"SQL Editor"** (icono que parece una consola o ventana de código).
3. Haz clic en **"+ New query"** (Nueva consulta).
4. Se abrirá una pantalla en blanco donde se pega el código SQL.

---

## Paso 4: Pegar el código de la base de datos

1. Abre la carpeta de tu proyecto: **Recetas de Helados**.
2. Abre la carpeta **supabase**.
3. Abre el archivo **schema.sql** con el Bloc de notas (clic derecho → Abrir con → Bloc de notas).
4. Selecciona **todo** el contenido del archivo (Ctrl + A).
5. Cópialo (Ctrl + C).
6. Vuelve al navegador, a la ventana de Supabase donde dice "New query".
7. Pega el contenido ahí (Ctrl + V).
8. Verás varias líneas de texto (es el código que crea las tablas). **No cambies nada.**

---

## Paso 5: Ejecutar el código

1. Abajo a la derecha de esa ventana verás un botón verde que dice **"Run"** (Ejecutar) o **"RUN"**.
2. Haz clic en **"Run"**.
3. Debería aparecer abajo un mensaje en verde tipo **"Success. No rows returned"** (éxito, no hay filas devueltas). Eso significa que la base de datos se creó bien.
4. Si sale un mensaje en rojo (error), no borres nada y pasa al **Paso 6 (Si hay error)** más abajo.

---

## Paso 6: Activar el login por correo (para que puedas registrarte en la app)

1. En el menú de la izquierda haz clic en **"Authentication"** (Autenticación).
2. Luego haz clic en **"Providers"** (Proveedores).
3. Verás una lista; busca **"Email"**.
4. Asegúrate de que **"Email"** esté **activado** (toggle en azul). Si no, actívalo.
5. Opcional: en **"Auth Settings"** puedes desactivar **"Confirm email"** si quieres que los usuarios entren sin confirmar el correo (más fácil para pruebas). Para producción es mejor dejarlo activado.

---

## Paso 7: Obtener la URL y la clave (para configurar la app)

1. En el menú de la izquierda haz clic en **"Project Settings"** (icono de engranaje abajo).
2. En el menú interno, haz clic en **"API"**.
3. Verás dos datos importantes:
   - **Project URL** (URL del proyecto). Algo como: `https://abcdefghijk.supabase.co`
   - **Project API keys** → **anon public** (clave pública). Una larga cadena que empieza con `eyJ...`
4. **Copia** la **Project URL** y **pégala** en un bloc de notas.
5. Haz clic en el icono de **copiar** al lado de **anon public** y **pégala** también en el bloc de notas.

---

## Paso 8: Poner la URL y la clave en tu proyecto

1. Abre la carpeta **Recetas de Helados** en tu PC.
2. Abre el archivo **config.js** con el Bloc de notas (clic derecho → Abrir con → Bloc de notas).
3. Verás dos líneas que dicen:
   ```text
   window.RECETAS_SUPABASE_URL = "";
   window.RECETAS_SUPABASE_ANON_KEY = "";
   ```
4. Sustituye así:
   - Donde están las comillas vacías después de `RECETAS_SUPABASE_URL = `, pega la **Project URL** que copiaste. Debe quedar entre comillas, por ejemplo: `window.RECETAS_SUPABASE_URL = "https://abcdefghijk.supabase.co";`
   - Donde están las comillas vacías después de `RECETAS_SUPABASE_ANON_KEY = `, pega la clave **anon public**. Debe quedar entre comillas, por ejemplo: `window.RECETAS_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";`
5. Guarda el archivo (Archivo → Guardar) y cierra.

---

## Paso 9: Probar la app

1. En la carpeta **Recetas de Helados**, haz **doble clic** en **index.html** para abrirlo en el navegador.
2. Deberías ver la pantalla de **Formulador Recetas de Helados** con correo y contraseña.
3. Haz clic en **"Crear cuenta"** y pon un correo y contraseña (por ejemplo tu correo real y una contraseña que recuerdes).
4. Si en Supabase dejaste activada la confirmación de correo, revisa tu bandeja (y spam) y haz clic en el enlace que te envíe Supabase.
5. Vuelve a **index.html**, inicia sesión con ese correo y contraseña.
6. Si entras y ves "Recetas" y "Base ingredientes", **la base de datos y la app están bien configuradas**.

---

## Si hay error al hacer Run (Paso 5)

- **"permission denied" o "relation already exists"**: A veces las tablas ya existen. Puedes ignorar si la app ya funciona.
- **"syntax error"**: Asegúrate de haber copiado **todo** el archivo **schema.sql** sin borrar ni añadir líneas.
- Si el error dice algo de **"EXECUTE FUNCTION"**:
  1. En el SQL Editor, borra todo.
  2. Abre de nuevo **schema.sql** en tu proyecto.
  3. Busca la línea que dice: `EXECUTE FUNCTION public.set_updated_at()`
  4. Cámbiala por: `EXECUTE PROCEDURE public.set_updated_at()`
  5. Vuelve a copiar todo el contenido del schema.sql y pégalo en Supabase, luego Run otra vez.

---

## Resumen rápido

| Qué hacer              | Dónde                          |
|------------------------|---------------------------------|
| Crear cuenta / proyecto | supabase.com → New project     |
| Crear tablas           | SQL Editor → New query → pegar schema.sql → Run |
| Activar correo         | Authentication → Providers → Email |
| Copiar URL y clave     | Project Settings → API         |
| Configurar la app      | Editar config.js con esa URL y clave |
| Probar                 | Abrir index.html en el navegador |

Cuando tengas la URL y la clave en **config.js** y hayas hecho **Run** del **schema.sql**, la base de datos estará creada y la app podrá usarla. Si en algún paso concreto te atascas, dime en qué paso y qué mensaje ves (o si puedes, una captura) y te digo exactamente qué hacer.
