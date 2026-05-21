/**
 * Verificador de ortografía para español (es) con nspell
 * Solo detecta palabras con acento FALTANTE (misma palabra sin tilde).
 * Uso: node scripts/check-ortografia.mjs
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');

// ── Cargar nspell + diccionario español ──────────────────────────────────────
const nspellMod = await import('nspell');
const nspell    = nspellMod.default;
const dictMod   = await import('dictionary-es');
const dictData  = dictMod.default;

const spell = nspell(dictData);

// ── Whitelist: términos válidos que el diccionario no conoce ─────────────────
const WHITELIST = new Set([
  'kyoszen','rrhh','dc','stps','imss','lft','cdmx','edomex',
  'onboarding','coaching','feedback','startup','staffing','outsourcing',
  'marketing','branding','online','hibrido',
  'microempresas','microempresa','colocados','colocacion','colocaciones',
  'normatividad','normativo','normativos','licitaciones','licitacion',
  'adiestramiento','capacitados','capacitada','capacitador',
  'pedagógicos','pedagogico','pedagogicos',
  'rodriguez','garcia','luna','martinez',
  'cta','modal','navbar','footer','slug',
  // JSX variable/prop names (not Spanish words)
  'name','item','value','label','title','type','size','ref','key',
  'max','min','map','filter','index','event','target','data',
  // Supabase field names (snake_case, not display text)
  'busqueda','categoria','ubicacion','descripcion','contrato','jornada',
  'activa','activo','badge','modalidad','nivel','horas',
  // Tailwind fragments
  'max','min',
  'mas','nos','si','tu','su','el','al','del','por','para',
  'con','sin','que','los','las','una','uno','pero','como','muy',
  'hay','han','son','fue','ser','ver','dar',
]);

const FILES = [
  'src/app/page.tsx',
  'src/app/nosotros/page.tsx',
  'src/app/servicios/page.tsx',
  'src/app/cursos/page.tsx',
  'src/app/contacto/page.tsx',
  'src/app/vacantes/page.tsx',
  'src/components/sections/Hero.tsx',
  'src/components/sections/Services.tsx',
  'src/components/sections/About.tsx',
  'src/components/sections/WhyUs.tsx',
  'src/components/sections/Courses.tsx',
  'src/components/sections/StatsBar.tsx',
  'src/components/sections/CtaFinal.tsx',
  'src/components/sections/FAQ.tsx',
  'src/components/sections/Process.tsx',
  'src/components/sections/Testimonials.tsx',
  'src/components/sections/Vacancies.tsx',
  'src/components/sections/CtaBand.tsx',
  'src/components/layout/Footer.tsx',
  'src/components/layout/Navbar.tsx',
  'src/lib/courses.ts',
  'src/lib/jobs.ts',
];

// ── Normalizar: quitar acentos ───────────────────────────────────────────────
function stripAccents(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

// ── Extraer fragmentos de texto legible de un TSX ────────────────────────────
function extractWords(content) {
  // Quitar bloques que no son texto visible
  let c = content
    .replace(/import[\s\S]*?from ['"][^'"]+['"]\n?/g, '')
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/https?:\/\/[^\s"')>]*/g, '')
    .replace(/\bclassName\s*=\s*[{"`'][^'"`}]*[`'"}]/g, '')
    .replace(/\bhref\s*=\s*["'][^"']*["']/g, '')
    .replace(/\bsrc\s*=\s*["'][^"']*["']/g, '')
    .replace(/\balt\s*=\s*["'][^"']*["']/g, '')
    .replace(/\bkey\s*=\s*[{][^}]*[}]/g, '');

  const chunks = [];

  // Texto JSX entre etiquetas: >texto<
  for (const m of c.matchAll(/>([^<\n]{3,})</g)) {
    chunks.push(m[1]);
  }
  // Strings entre comillas: "texto" o 'texto'
  for (const m of c.matchAll(/["']([A-Za-záéíóúüñÁÉÍÓÚÜÑ][^"'\n]{4,})["']/g)) {
    const chunk = m[1];
    // Skip URL slugs (hyphenated lowercase: e.g. "asesoria-capacitacion-rrhh")
    if (/^[a-z][a-z0-9-]*$/.test(chunk)) continue;
    // Skip Supabase field lists (comma-separated identifiers without spaces)
    if (/^[a-z_][a-z_,]*$/.test(chunk) && chunk.includes(',')) continue;
    // Skip snake_case identifiers
    if (/^[a-z][a-z0-9_]*$/.test(chunk) && chunk.includes('_')) continue;
    chunks.push(chunk);
  }
  // Template literals
  for (const m of c.matchAll(/`([^`\n]{6,})`/g)) {
    const t = m[1].replace(/\$\{[^}]*\}/g, '').trim();
    if (t.length > 5) chunks.push(t);
  }

  const result = [];
  for (const chunk of chunks) {
    for (const m of (chunk.match(/[A-Za-záéíóúüñÁÉÍÓÚÜÑ]{3,}/g) || [])) {
      result.push({ word: m, context: chunk.trim().slice(0, 100) });
    }
  }
  return result;
}

// ── Verificar si una palabra le falta acento ─────────────────────────────────
function missingAccent(word) {
  const lower = word.toLowerCase();
  if (WHITELIST.has(lower)) return null;
  if (spell.correct(word))  return null;   // está bien

  // Buscar sugerencias donde la versión sin acento == la palabra
  const suggestions = spell.suggest(word);
  const accentFix = suggestions.filter(s => {
    return stripAccents(s).toLowerCase() === stripAccents(word).toLowerCase()
      && s.toLowerCase() !== word.toLowerCase(); // diferente en tilde
  });

  return accentFix.length > 0 ? accentFix.slice(0, 3) : null;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
console.log('\n🔍  Verificador de acentos — Kyoszen (es)\n');

const allIssues = [];

for (const relPath of FILES) {
  const fullPath = join(ROOT, relPath);
  let content;
  try { content = readFileSync(fullPath, 'utf8'); }
  catch { continue; }

  const words   = extractWords(content);
  const issues  = [];
  const seen    = new Set();

  for (const { word, context } of words) {
    const k = word.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);

    const fix = missingAccent(word);
    if (!fix) continue;

    issues.push({ word, fix, context });
    allIssues.push({ file: relPath, word, fix, context });
  }

  const tag = issues.length > 0
    ? `\n📄  ${relPath}  (${issues.length} acento${issues.length !== 1 ? 's' : ''} faltante${issues.length !== 1 ? 's' : ''})`
    : `   ✅  ${relPath}`;
  console.log(tag);

  for (const i of issues) {
    console.log(`   ❌  "${i.word}"  →  ${i.fix.join(' / ')}`);
    console.log(`       …${i.context}…`);
  }
}

console.log('\n──────────────────────────────────────────────────────────');
console.log(`📊  Archivos: ${FILES.length}  |  Acentos faltantes: ${allIssues.length}`);

if (allIssues.length > 0) {
  console.log('\n📋  Lista de correcciones:\n');
  for (const { file, word, fix } of allIssues) {
    console.log(`  [${file.split('/').pop()}]  "${word}"  →  "${fix[0]}"`);
  }
}

console.log();
