/**
 * Genera config.js desde variables de entorno.
 * En Vercel: define RECETAS_SUPABASE_URL y RECETAS_SUPABASE_ANON_KEY.
 * En local: copia config.example.js a config.js y rellena los valores.
 */
const fs = require("fs");
const path = require("path");

const dir = path.resolve(__dirname, "..");
const url = process.env.RECETAS_SUPABASE_URL || "";
const key = process.env.RECETAS_SUPABASE_ANON_KEY || "";

const content =
  "// Generado en build desde variables de entorno (Vercel)\n" +
  "window.RECETAS_SUPABASE_URL = " +
  JSON.stringify(url) +
  ";\n" +
  "window.RECETAS_SUPABASE_ANON_KEY = " +
  JSON.stringify(key) +
  ";\n";

fs.writeFileSync(path.join(dir, "config.js"), content, "utf8");
console.log("config.js generado correctamente");
