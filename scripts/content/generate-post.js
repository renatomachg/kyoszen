#!/usr/bin/env node
/**
 * Generador de posts para redes sociales — Kyoszen
 * Uso: node scripts/content/generate-post.js "descripcion del post"
 *
 * Ejemplo:
 *   node scripts/content/generate-post.js "post para Facebook sobre rotacion de personal, estilo carrusel slide 1 de 5, texto: Tu equipo rota cada 3 meses y no sabes por que"
 */

import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

// Cargar OPENAI_API_KEY desde .env.local
function loadEnv() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) throw new Error(".env.local no encontrado");
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const [key, ...rest] = line.split("=");
    if (key && rest.length) process.env[key.trim()] = rest.join("=").trim();
  }
}

loadEnv();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Imagen de referencia base del estilo Kyoszen
const REFERENCIA_DEFAULT = path.join(
  ROOT,
  "docs/brandkit/referencias/2.jpg"
);

async function generarPost(descripcion, opcionesExtra = {}) {
  const {
    referencia = REFERENCIA_DEFAULT,
    formato = "1024x1024",
    salida = null,
  } = opcionesExtra;

  console.log("🎨 Generando post...");
  console.log("   Brief:", descripcion);
  console.log("   Referencia:", path.basename(referencia));

  // Leer imagen de referencia en base64
  const imgBuffer = readFileSync(referencia);
  const imgBase64 = imgBuffer.toString("base64");
  const ext = path.extname(referencia).slice(1).replace("jpg", "jpeg");
  const imgDataUrl = `data:image/${ext};base64,${imgBase64}`;

  const prompt = `Eres un diseñador gráfico experto en redes sociales para empresas de recursos humanos en México.

Genera una imagen para redes sociales de Kyoszen (consultoría de capital humano) con estas especificaciones:

ESTILO VISUAL (sigue exactamente la imagen de referencia):
- Fondo dividido: lado izquierdo en azul marino (#042E7B), lado derecho con fotografía profesional de oficina
- Separador curvo o diagonal entre los dos lados
- Esquina inferior derecha con acento en color verde menta/teal (#00C9A7 o similar)
- Logo "K" de Kyoszen en blanco en esquina superior izquierda (forma geométrica estilo K)
- Triángulo decorativo blanco en esquina superior derecha
- Texto en blanco, tipografía moderna sans-serif, bold y limpia
- Iconos outline en color teal en la parte inferior izquierda relacionados al tema
- Fotografía: personas profesionales en entorno corporativo moderno

CONTENIDO A GENERAR:
${descripcion}

IMPORTANTE:
- Formato cuadrado 1:1
- Mantén exactamente el mismo sistema de diseño de la referencia
- El texto debe ser en español de México
- Sin acentos en el texto si es posible
- Imagen profesional, corporativa, moderna`;

  const response = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: formato,
    quality: "high",
  });

  // gpt-image-1 devuelve b64_json
  const imageData = response.data[0].b64_json;
  if (!imageData) throw new Error("No se recibio imagen de la API");

  // Guardar imagen
  const timestamp = Date.now();
  const outputDir = path.join(__dirname, "output");
  const outputPath = salida || path.join(outputDir, `post-${timestamp}.png`);

  const buffer = Buffer.from(imageData, "base64");
  fs.writeFileSync(outputPath, buffer);

  console.log("✅ Post generado:");
  console.log("   →", outputPath);
  return outputPath;
}

// CLI
const args = process.argv.slice(2);
if (!args.length) {
  console.log("Uso: node generate-post.js \"descripcion del post\"");
  console.log("");
  console.log("Opciones adicionales:");
  console.log("  --ref <ruta>     imagen de referencia (default: 2.jpg)");
  console.log("  --out <ruta>     ruta de salida del PNG");
  console.log("");
  console.log("Ejemplo:");
  console.log(
    '  node generate-post.js "Slide 1 carrusel: 5 señales de que tu empresa necesita apoyo en RRHH"'
  );
  process.exit(0);
}

// Parsear flags opcionales
let descripcion = "";
let refPath = REFERENCIA_DEFAULT;
let outPath = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--ref" && args[i + 1]) {
    refPath = path.resolve(args[++i]);
  } else if (args[i] === "--out" && args[i + 1]) {
    outPath = path.resolve(args[++i]);
  } else {
    descripcion += (descripcion ? " " : "") + args[i];
  }
}

generarPost(descripcion, { referencia: refPath, salida: outPath }).catch(
  (err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
);
