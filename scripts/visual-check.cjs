const { spawn } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');
const portableChromium = require('@sparticuz/chromium').default;

const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'artifacts');
const adminRoot = path.join(root, 'apps/admin/dist');
fs.mkdirSync(artifacts, { recursive: true });

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

const adminServer = http.createServer((request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const relative = requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, '');
  const candidate = path.resolve(adminRoot, relative);
  const safePath = candidate.startsWith(adminRoot) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()
    ? candidate
    : path.join(adminRoot, 'index.html');
  response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(safePath)] || 'application/octet-stream' });
  fs.createReadStream(safePath).pipe(response);
});

const storefront = spawn(process.execPath, ['apps/storefront/dist/server/entry.mjs'], {
  cwd: root,
  env: { ...process.env, HOST: '127.0.0.1', PORT: '4321' },
  stdio: ['ignore', 'pipe', 'pipe'],
});

let storefrontLog = '';
storefront.stdout.on('data', (chunk) => { storefrontLog += chunk.toString(); });
storefront.stderr.on('data', (chunk) => { storefrontLog += chunk.toString(); });

async function waitFor(url) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Server did not become ready: ${url}\n${storefrontLog}`);
}

async function run() {
  await new Promise((resolve) => adminServer.listen(5173, '127.0.0.1', resolve));
  await Promise.all([
    waitFor('http://127.0.0.1:4321/es/'),
    waitFor('http://127.0.0.1:5173/'),
  ]);

  const browser = await chromium.launch({
    headless: true,
    executablePath: await portableChromium.executablePath(),
    args: portableChromium.args,
  });
  const report = { consoleErrors: [], pageErrors: [], checks: {} };

  const inspectPage = (page) => {
    page.on('console', (message) => {
      if (message.type() === 'error') report.consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => report.pageErrors.push(error.message));
  };

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const storePage = await desktop.newPage();
  inspectPage(storePage);
  await storePage.goto('http://127.0.0.1:4321/es/', { waitUntil: 'domcontentloaded' });
  await storePage.waitForTimeout(3500);
  report.checks.webglSupported = await storePage.evaluate(() => {
    const testCanvas = document.createElement('canvas');
    return Boolean(testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'));
  });
  report.checks.astroIslandCount = await storePage.locator('astro-island').count();
  await storePage.screenshot({ path: path.join(artifacts, 'storefront-desktop.png'), fullPage: true });
  report.checks.desktopCanvasCount = await storePage.locator('canvas').count();
  report.checks.desktopHorizontalOverflow = await storePage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  report.checks.heroHeadingVisible = await storePage.getByRole('heading', { level: 1 }).isVisible();

  await storePage.goto('http://127.0.0.1:4321/es/producto/collar-geometria-viva/', { waitUntil: 'domcontentloaded' });
  await storePage.getByRole('button', { name: 'Probar virtualmente' }).click();
  report.checks.tryOnDialogVisible = await storePage.getByRole('dialog').isVisible();
  await storePage.screenshot({ path: path.join(artifacts, 'try-on-desktop.png'), fullPage: false });

  const adminPage = await desktop.newPage();
  inspectPage(adminPage);
  await adminPage.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(500);
  await adminPage.screenshot({ path: path.join(artifacts, 'admin-desktop.png'), fullPage: true });
  await adminPage.getByRole('button', { name: /Collar Geometría Viva/ }).first().click();
  report.checks.adminEditorVisible = await adminPage.getByRole('dialog').isVisible();
  await adminPage.screenshot({ path: path.join(artifacts, 'admin-editor-desktop.png'), fullPage: false });

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mobileStore = await mobile.newPage();
  inspectPage(mobileStore);
  await mobileStore.goto('http://127.0.0.1:4321/es/', { waitUntil: 'domcontentloaded' });
  await mobileStore.waitForTimeout(1400);
  report.checks.mobileStoreOverflow = await mobileStore.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await mobileStore.screenshot({ path: path.join(artifacts, 'storefront-mobile.png'), fullPage: true });

  const mobileAdmin = await mobile.newPage();
  inspectPage(mobileAdmin);
  await mobileAdmin.goto('http://127.0.0.1:5173/', { waitUntil: 'domcontentloaded' });
  await mobileAdmin.waitForTimeout(500);
  report.checks.mobileAdminOverflow = await mobileAdmin.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  await mobileAdmin.screenshot({ path: path.join(artifacts, 'admin-mobile.png'), fullPage: true });

  await browser.close();
  const failures = [];
  if (!report.checks.heroHeadingVisible) failures.push('Hero heading is not visible');
  if (report.checks.desktopCanvasCount > 0) failures.push('The home hero must not mount a 3D canvas');
  if (!report.checks.tryOnDialogVisible) failures.push('Try-on dialog did not open');
  if (!report.checks.adminEditorVisible) failures.push('Admin editor did not open');
  if (report.checks.desktopHorizontalOverflow || report.checks.mobileStoreOverflow || report.checks.mobileAdminOverflow) failures.push('Horizontal overflow detected');
  if (report.pageErrors.length) failures.push('Browser page errors detected');
  report.failures = failures;
  report.passed = failures.length === 0;
  fs.writeFileSync(path.join(artifacts, 'visual-report.json'), JSON.stringify(report, null, 2));
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

run()
  .catch((error) => {
    process.stderr.write(`${error.stack || error}\n`);
    process.exitCode = 1;
  })
  .finally(() => {
    storefront.kill('SIGTERM');
    adminServer.close();
  });
