/**
 * Genera config.js e inyecta config en index.html desde variables de entorno.
 * En Vercel: define RECETAS_SUPABASE_URL y RECETAS_SUPABASE_ANON_KEY.
 * Así la app funciona aunque no exista /api/config.
 */
const fs = require("fs");
const path = require("path");

const dir = path.resolve(__dirname, "..");
const url = process.env.RECETAS_SUPABASE_URL || "";
const key = process.env.RECETAS_SUPABASE_ANON_KEY || "";

// 1. Generar config.js
const configJs =
  "// Generado en build desde variables de entorno (Vercel)\n" +
  "window.RECETAS_SUPABASE_URL = " +
  JSON.stringify(url) +
  ";\n" +
  "window.RECETAS_SUPABASE_ANON_KEY = " +
  JSON.stringify(key) +
  ";\n";
fs.writeFileSync(path.join(dir, "config.js"), configJs, "utf8");

// 2. En deploy (con variables definidas), inyectar config en index.html para no depender de config.js ni /api
if (url && key) {
  const indexPath = path.join(dir, "index.html");
  let html = fs.readFileSync(indexPath, "utf8");
  const inlineScript =
    "<script>window.RECETAS_SUPABASE_URL=" + JSON.stringify(url) +
    ";window.RECETAS_SUPABASE_ANON_KEY=" + JSON.stringify(key) + ";<\/script>";
  html = html.replace(/<script\s+src="config\.js"><\/script>\s*/i, inlineScript + "\n    ");
  fs.writeFileSync(indexPath, html, "utf8");
  console.log("config.js e index.html actualizados correctamente");
} else {
  console.log("config.js generado (sin variables de entorno, index.html no modificado)");
}
