# Formulador Recetas de Helados

Aplicación web multiusuario para crear y gestionar fórmulas de helados, basada en la estructura del Excel **FORMULADOR BASE CURSO GRATIS YT ESCUELA DUBOVIK**.

## Estructura del Excel (referencia)

- **FORMULA AQUÍ / HELADO DE FRESA - form**: recetas con temperatura (°C), ingredientes con Cantidad (g), % Graso, Sólidos totales, P.O.D, P.A.C, Lactosa, Proteína.
- **BASE DATOS INGREDIENTES**: lista maestra de ingredientes con sus parámetros (% Graso, Sólidos totales, P.O.D, P.A.C, Lactosa, Proteína).

## Características

- **Online y multiusuario**: login con Supabase (correo y contraseña).
- **Recetas**: nombre, temperatura, descripción, tabla de ingredientes (cantidad en g + parámetros).
- **Base de ingredientes**: gestionar la lista de ingredientes con % Graso, Sólidos totales, P.O.D, P.A.C, Lactosa, Proteína, Nota.
- **PWA**: instalable en Windows, Android e iOS desde el navegador (añadir a pantalla de inicio / instalar app).

## Cómo ponerla en línea

1. **Crear proyecto en Supabase**  
   [supabase.com](https://supabase.com) → New project.

2. **Ejecutar el esquema SQL**  
   En el proyecto: SQL Editor → New query → pegar el contenido de `supabase/schema.sql` → Run.

3. **Configurar la app**  
   Copiar `config.example.js` a `config.js` y rellenar:
   - `RECETAS_SUPABASE_URL`: en Supabase → Settings → API → Project URL.
   - `RECETAS_SUPABASE_ANON_KEY`: en Settings → API → anon public key.

4. **Subir los archivos**  
   Subir la carpeta del proyecto a un hosting estático (Vercel, Netlify, GitHub Pages, etc.) para que la app esté online.

5. **Registro de usuarios**  
   En Supabase → Authentication → Providers: habilitar Email. Los usuarios se registran desde la app (Crear cuenta).

## Uso local

- Abrir `index.html` en el navegador (o usar un servidor local, por ejemplo `npx serve .`).
- Sin `config.js` configurado se mostrará un mensaje para configurar Supabase.

## Compatibilidad

- **Windows**: Chrome, Edge, Firefox (instalar como app desde el menú del navegador).
- **Android**: Chrome (Añadir a pantalla de inicio).
- **iOS**: Safari (Compartir → Añadir a pantalla de inicio).

## Archivos

- `index.html` – Interfaz (login, recetas, base ingredientes).
- `app.js` – Lógica (auth, CRUD recetas e ingredientes).
- `styles.css` – Estilos responsive.
- `config.js` – URL y clave de Supabase (no subir a repos públicos).
- `supabase/schema.sql` – Tablas y políticas RLS.
- `manifest.json`, `service-worker.js` – PWA.
