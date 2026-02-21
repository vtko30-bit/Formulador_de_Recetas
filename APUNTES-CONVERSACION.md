# Apuntes de conversación – Formulador Recetas de Helados

Copia de lo tratado en la conversación para usarlo como referencia.

---

## 1. Ajustes de columnas en la tabla de ingredientes

- **Columna Ingrediente**: ancho máximo **240px** (en `styles.css`, regla `#form-section .ingredientes-table th:first-child, td:first-child` → `max-width: 240px`).
- **Columnas numéricas** (Cant. (g), % MG, S.N.G, Sólidos tot., P.O.D, P.A.C, Precio): ancho fijo **120px** (width, min-width y max-width en las reglas correspondientes de `#form-section .ingredientes-table`).

---

## 2. Compatibilidad con Android, Windows e iOS

### index.html
- Viewport: `maximum-scale=5` para permitir zoom de accesibilidad.
- `meta name="format-detection" content="telephone=no"` (evita que iOS convierta números en enlaces de teléfono).
- `theme-color` para modo claro y oscuro (barra de estado en móviles).

### styles.css
- **body**: `-webkit-text-size-adjust: 100%`, `-webkit-tap-highlight-color`, `touch-action: manipulation`.
- **Safe area**: `.main` y header usan `env(safe-area-inset-left/right)` para notch y bordes en iPhone/Android.
- **Botones y elementos táctiles**: `min-height: 44px` en `.btn`, `.nav-btn`, `.recipe-item`; `touch-action: manipulation` y `-webkit-appearance: none` donde aplica.
- **Inputs**: `font-size: 16px` en pantallas pequeñas (formulario receta, búsqueda, modal) para evitar zoom automático en iOS al enfocar.

### manifest.json
- `scope: "./"` y `categories: ["productivity", "utilities"]` para PWA en todas las plataformas.

---

## 3. Cómo compartir la app

La app es una PWA; para compartirla hay que **publicarla en un servidor con HTTPS** y dar la URL.

Opciones mencionadas:
- **Netlify**: [app.netlify.com/drop](https://app.netlify.com/drop) → arrastrar carpeta del proyecto (sin `node_modules`).
- **Vercel**: conectar repositorio de GitHub y desplegar.
- **GitHub Pages**: repo en GitHub → Settings → Pages.

En todos los casos, en **Supabase → Authentication → URL Configuration → Redirect URLs** hay que añadir la URL de producción (ej. `https://tu-dominio.vercel.app/**`).

---

## 4. Despliegue con GitHub + Vercel (flujo que usas)

1. **Crear repo en GitHub** (ej. `recetas-helados`).
2. **Subir el proyecto**:
   ```bash
   cd "ruta\Recetas de Helados"
   git init
   git add .
   git commit -m "Formulador Recetas de Helados - app inicial"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/recetas-helados.git
   git push -u origin main
   ```
3. **Vercel**: Add New → Project → importar el repo → Deploy (proyecto estático, sin build).
4. **Supabase**: añadir la URL de Vercel en Redirect URLs.

El proyecto tiene `.gitignore` para no subir `node_modules`, `.env`, etc.

---

*Generado como apunte a partir de la conversación.*
