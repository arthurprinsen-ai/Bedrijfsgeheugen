import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runVisualRegression } from '../tools/site-shell/ui-visual-regression/browser-check.mjs';

const clean = '<!doctype html><html><body><main><h1>Clean page</h1><div class="copy">Copy</div><div class="visual">Visual</div></main></body></html>';

async function withServer(homeHtml, fn) {
  const server = http.createServer((req, res) => {
    res.setHeader('content-type', 'text/html; charset=utf-8');
    res.end(req.url?.startsWith('/prijzen') || req.url?.startsWith('/due-diligence') ? clean : homeHtml);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  try {
    return await fn(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
}

async function makeRegistry(viewport, interactions = []) {
  const dir = await mkdtemp(join(tmpdir(), 'bg-ui-vr-'));
  const path = join(dir, 'registry.json');
  const registry = {
    version: 'UI-VISUAL-REGRESSION-v1',
    defaults: { clsMax: 0.1, visibleRatioMin: 0.98, horizontalOverflowMaxPx: 1, overlapMaxAreaPx2: 0, viewports: [viewport] },
    pages: [
      { route: '/', required: ['main h1'], protectedPairs: [{ a: '.copy', b: '.visual', maxIntersectionAreaPx2: 0 }], interactions },
      { route: '/prijzen', required: ['main h1'], protectedPairs: [], interactions: [] },
      { route: '/due-diligence', required: ['main h1'], protectedPairs: [], interactions: [] }
    ]
  };
  await writeFile(path, JSON.stringify(registry), 'utf8');
  return { dir, path };
}

test('absolute visual covering copy fails overlap rule', async () => {
  const html = '<!doctype html><html><body><main style="position:relative"><h1>Title</h1><div class="copy" style="width:300px;height:150px">Copy</div><div class="visual" style="position:absolute;left:0;top:40px;width:300px;height:150px">Visual</div></main></body></html>';
  const { dir, path } = await makeRegistry({ name: 'desktop', width: 1440, height: 900 });
  await withServer(html, async baseUrl => {
    await assert.rejects(runVisualRegression({ baseUrl, registryPath: path, outputDir: join(dir, 'out') }), /overlap/);
  });
});

test('two-column grid passes geometry guard', async () => {
  const html = '<!doctype html><html><body><main><h1>Title</h1><section style="display:grid;grid-template-columns:1fr 1fr"><div class="copy" style="width:250px;height:100px">Copy</div><div class="visual" style="width:250px;height:100px">Visual</div></section></main></body></html>';
  const { dir, path } = await makeRegistry({ name: 'desktop', width: 1440, height: 900 });
  await withServer(html, async baseUrl => {
    const report = await runVisualRegression({ baseUrl, registryPath: path, outputDir: join(dir, 'out') });
    assert.equal(report.results.flatMap(x => x.violations).length, 0);
  });
});

test('mobile-only overlap is caught at 390px', async () => {
  const html = '<!doctype html><html><head><style>.copy,.visual{width:280px;height:100px}@media(max-width:500px){main{position:relative}.visual{position:absolute;left:0;top:40px}}</style></head><body><main><h1>Title</h1><div class="copy">Copy</div><div class="visual">Visual</div></main></body></html>';
  const { dir, path } = await makeRegistry({ name: 'phone', width: 390, height: 844 });
  await withServer(html, async baseUrl => {
    await assert.rejects(runVisualRegression({ baseUrl, registryPath: path, outputDir: join(dir, 'out') }), /overlap/);
  });
});

test('late layout shift above threshold fails CLS rule', async () => {
  const html = '<!doctype html><html><body><main><h1>Title</h1><div class="copy">Copy</div><div class="visual">Visual</div><p id="target">Target</p></main><script>setTimeout(()=>{const d=document.createElement("div");d.style.height="600px";d.textContent="late";document.body.insertBefore(d,document.body.firstChild)},100)</script></body></html>';
  const { dir, path } = await makeRegistry({ name: 'desktop', width: 1440, height: 900 });
  await withServer(html, async baseUrl => {
    await assert.rejects(runVisualRegression({ baseUrl, registryPath: path, outputDir: join(dir, 'out') }), /cls/);
  });
});

test('interaction that covers copy fails after click', async () => {
  const html = '<!doctype html><html><body><main><h1>Title</h1><button data-ui-action="cover">Cover</button><div class="copy" style="width:300px;height:120px">Copy</div><div class="visual" style="width:200px;height:80px">Visual</div></main><script>document.querySelector("button").onclick=()=>{const v=document.querySelector(".visual");v.style.position="absolute";v.style.left="0";v.style.top="60px";v.style.width="300px";v.style.height="120px"}</script></body></html>';
  const { dir, path } = await makeRegistry({ name: 'desktop', width: 1440, height: 900 }, [{ type: 'click', selector: '[data-ui-action="cover"]' }]);
  await withServer(html, async baseUrl => {
    await assert.rejects(runVisualRegression({ baseUrl, registryPath: path, outputDir: join(dir, 'out') }), /overlap/);
  });
});
