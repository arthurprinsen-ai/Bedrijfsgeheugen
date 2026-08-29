import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const json = path => JSON.parse(read(path));
const baseline = json('site/accepted-baseline.json');
const navigation = json('site/navigation-baseline.json');
const routeMap = new Map(baseline.routes.map(item => [item.route, item]));

const PROTECTED = ['/problemen','/oplossingen','/prijzen','/cases','/kennis','/over-ons'];
const TEST_ACCOUNT = [['/inloggen','inloggen.html'],['/aanmelden','aanmelden.html']];

test('website baseline records the real historical sources', () => {
  assert.equal(baseline.version, 3);
  assert.equal(baseline.source?.type, 'mixed-historical-baseline');
  assert.equal(baseline.source?.website_sha, '4e6444e1228903853d085a4dac45f2885e37ca99');
  assert.equal(baseline.source?.pricing_source, 'product.html');
});

test('all protected website routes still exist', () => {
  assert.ok(baseline.routes.length >= 30, 'route catalog must remain comprehensive');
  for (const item of baseline.routes) {
    if (item.mode === 'runtime-generated') continue;
    assert.ok(existsSync(item.file), `${item.route} lost its source file ${item.file}`);
  }
});

test('semantic routes keep their accepted anchors', () => {
  for (const route of PROTECTED) {
    const item = routeMap.get(route);
    assert.ok(item, `${route} must be protected`);
    const source = read(item.file);
    for (const anchor of item.required_anchors || []) {
      assert.ok(source.includes(anchor), `${route} lost accepted anchor: ${anchor}`);
    }
  }
});

test('over-ons is the historical Arthur story and is never rewritten by the build', () => {
  const page = read('over-ons.html');
  assert.match(page, /Eerst kijken hoe het werk écht loopt\. Dan pas techniek\./);
  assert.match(page, /Bedrijfsgeheugen is opgericht door Arthur Prinsen\./);
  assert.match(page, /Gewone taal/);
  assert.match(page, /Geen big bang/);
  assert.match(page, /Van jou, niet van mij/);
  assert.doesNotMatch(page, /Geen callcenter/);
  assert.doesNotMatch(page, /Ons geloof: technologie moet mensen tijd teruggeven/);
  const apply = read('tools/apply-site-baseline.mjs');
  assert.doesNotMatch(apply, /writeFile/);
  assert.match(apply, /Historical website baseline validated/);
});

test('prices are sourced from the existing product truth, not the rejected prototype tiers', () => {
  const page = read('prijzen.html');
  assert.match(page, /Eerlijke prijzen\. Kies wat past\./);
  assert.match(page, /€99 \/ maand/);
  assert.match(page, /Pro — €299 \/ maand/);
  assert.match(page, /Enterprise/);
  assert.match(page, /Frisse blik — €2\.900 excl\. btw/);
  assert.doesNotMatch(page, /Scale/);
  assert.doesNotMatch(page, /Control/);
  assert.doesNotMatch(page, /€749/);
  assert.doesNotMatch(page, /€1\.495/);
});

test('prices are exposed in both canonical and recovered desktop/mobile navigation', () => {
  for (const path of ['.github/canoniek/kop.html','assets/recovered-page-shell.js']) {
    const shell = read(path);
    assert.match(shell, /href="\/prijzen">Prijzen<\/a>/);
    assert.ok((shell.match(/href="\/prijzen">Prijzen<\/a>/g) || []).length >= 2, `${path} must expose prices on desktop and mobile`);
  }
});

test('test account views remain real protected routes', () => {
  for (const [route,file] of TEST_ACCOUNT) {
    const item = routeMap.get(route);
    assert.ok(item, `${route} must remain protected`);
    assert.equal(item.file, file);
    assert.ok(existsSync(file), `${route} is a dead link`);
  }
});

test('mobile navigation remains centrally owned and accessible', () => {
  const mobile = read('assets/js/menu.js');
  assert.match(mobile, /aria-expanded/);
  assert.match(mobile, /bgSharedMobileNav/);
  assert.match(mobile, /Escape/);
  assert.match(mobile, /Sluit menu/);
  assert.match(mobile, /Menu/);
});

test('future protected content edits require an explicit machine-readable scope contract', () => {
  assert.ok(existsSync('site/change-scope.schema.json'));
  const schema = json('site/change-scope.schema.json');
  assert.deepEqual(schema.required, ['routes', 'change_class', 'preserve']);
});

test('self-healing policy still covers semantic content drift', () => {
  assert.match(read('docs/self-healing-agents.md'), /semantic content drift/i);
  assert.match(read('docs/self-healing-agents.md'), /last-known-good/i);
  assert.match(read('AGENTS.md'), /accepted website baseline/i);
  assert.ok(Array.isArray(navigation.primary), 'navigation baseline must remain machine-readable');
});
