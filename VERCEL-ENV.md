# Variables de entorno en Vercel

En Vercel la app genera `config.js` en el **build** a partir de variables de entorno, así no subes claves al repositorio.

## Pasos en Vercel

1. Abre tu proyecto en [vercel.com](https://vercel.com).
2. **Settings** → **Environment Variables**.
3. Añade:

   | Nombre                      | Valor                                      | Entorno   |
   |----------------------------|--------------------------------------------|-----------|
   | `RECETAS_SUPABASE_URL`     | `https://xxxx.supabase.co` (tu Project URL) | Production (y Preview si quieres) |
   | `RECETAS_SUPABASE_ANON_KEY`| Tu clave anon/public de Supabase            | Production (y Preview si quieres) |

4. Guarda y **redeploy** el proyecto (Deployments → ⋮ → Redeploy) para que el nuevo build use las variables.

## Dónde sacar los valores

- **Supabase** → tu proyecto → **Project Settings** (engranaje) → **API**.
- **Project URL** → `RECETAS_SUPABASE_URL`.
- **anon public** (o **Publishable**) → `RECETAS_SUPABASE_ANON_KEY`.

## Cómo funciona

- En el repo está `config.example.js` (sin claves) y **no** está `config.js` (está en `.gitignore`).
- El script `scripts/generate-config.js` escribe `config.js` leyendo `process.env.RECETAS_SUPABASE_URL` y `process.env.RECETAS_SUPABASE_ANON_KEY`.
- En Vercel, el **Build Command** es `npm run build`, que ejecuta ese script y genera `config.js` antes del deploy.

## Desarrollo local

Copia `config.example.js` a `config.js`, rellena URL y clave y trabaja como siempre. No subas `config.js` (ya está en `.gitignore`).
