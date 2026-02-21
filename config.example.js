// Formulador Helados - Configuración Supabase (ejemplo)
//
// En Vercel: no hace falta config.js. Define en el proyecto las variables de entorno
// RECETAS_SUPABASE_URL y RECETAS_SUPABASE_ANON_KEY; el build generará config.js.
//
// En local:
// 1. Copia este archivo como config.js:   cp config.example.js config.js
// 2. Entra en https://supabase.com/dashboard y abre tu proyecto
// 3. Menú izquierdo → Project Settings (engranaje) → API
// 4. Copia "Project URL" y pégalo abajo en RECETAS_SUPABASE_URL
// 5. Copia la clave "anon" "public" (la larga que empieza por eyJ...)
//    Si no ves esa, usa la "Publishable" (sb_publishable_...)
// 6. Guarda config.js y recarga la app

window.RECETAS_SUPABASE_URL = "https://riqmohctyvyibwlwrlmd.supabase.co";
window.RECETAS_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpcW1vaGN0eXZ5aWJ3bHdybG1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDE3MzUsImV4cCI6MjA4NjQxNzczNX0.E_FO_6s6lTDCrPbqAkML9WdEt8lR0yN5RHxLoYG7fvY   ";
