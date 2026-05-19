const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');

const FORMATS = {
  'facebook-post':  { width: 1080, height: 1080 },
  'facebook-story': { width: 1080, height: 1920 },
  'carousel-slide': { width: 1080, height: 1080 },
};

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function toDataURL(filePath) {
  const abs = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);
  const buf = fs.readFileSync(abs);
  const ext = path.extname(abs).slice(1).toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : 'image/png';
  return `data:${mime};base64,${buf.toString('base64')}`;
}

async function render(dataFile) {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  const { width, height } = FORMATS[data.format] || FORMATS['facebook-post'];

  const layout = data.layout ? `${data.format}-${data.layout}` : data.format;
  const templatePath = path.join(__dirname, 'templates', `${layout}.html`);
  let html = fs.readFileSync(templatePath, 'utf8');

  const overlay = data.overlay_color || '#042E7B';
  const accent  = data.accent_color  || '#10B981';
  const link    = data.link_color    || '#1883FF';

  const logoPath = path.join(ROOT, 'docs/brandkit/logos/LOGO-KYOSZEN.png');

  html = html
    .replace('{{LOGO_DATA}}',       toDataURL(logoPath))
    .replace('{{PHOTO_DATA}}',      toDataURL(path.join(ROOT, data.photo)))
    .replace(/{{OVERLAY_95}}/g,     hexToRgba(overlay, 0.95))
    .replace(/{{OVERLAY_80}}/g,     hexToRgba(overlay, 0.80))
    .replace(/{{OVERLAY_30}}/g,     hexToRgba(overlay, 0.30))
    .replace(/{{OVERLAY_00}}/g,     hexToRgba(overlay, 0.00))
    .replace(/{{ACCENT_COLOR}}/g,   accent)
    .replace(/{{LINK_COLOR}}/g,     link)
    .replace('{{BADGE}}',           data.badge        || '')
    .replace('{{HEADLINE_LINE1}}',  data.headline_line1 || '')
    .replace('{{HEADLINE_LINE2}}',  data.headline_line2 || '')
    .replace('{{HEADLINE_ACCENT}}', data.headline_accent || '')
    .replace('{{SUBTITLE}}',        data.subtitle     || '')
    .replace('{{CTA}}',             data.cta          || '')
    .replace('{{URL}}',             data.url          || 'kyoszen.com');

  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 800));

  const outputPath = path.join(ROOT, data.output);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, type: 'png', clip: { x: 0, y: 0, width, height } });
  await browser.close();

  console.log(`✓ ${data.id} → ${data.output}`);
  return outputPath;
}

// Uso: node renderer.js data/KYO-FB-001.json
const dataFile = process.argv[2];
if (!dataFile) {
  console.error('Uso: node renderer.js <ruta-al-json>');
  process.exit(1);
}

render(path.resolve(process.cwd(), dataFile)).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
