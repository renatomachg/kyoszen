const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function render({ templatePath, outputPath, width = 1080, height = 1080 }) {
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });

  const html = fs.readFileSync(templatePath, 'utf8');
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));

  await page.screenshot({ path: outputPath, type: 'png', clip: { x: 0, y: 0, width, height } });
  await browser.close();

  console.log(`✓ Exportado: ${outputPath}`);
}

const outputDir = path.join(__dirname, '../../docs/contenido/mayo-2026');
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

render({
  templatePath: path.join(__dirname, 'templates/KYO-FB-001.html'),
  outputPath: path.join(outputDir, 'KYO-FB-001_presentacion-marca_2026-05-19.png'),
});
