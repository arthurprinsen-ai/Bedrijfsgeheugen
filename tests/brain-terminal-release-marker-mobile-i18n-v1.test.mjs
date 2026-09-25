import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const applyI18n = fileURLToPath(new URL('../tools/site-shell/apply-i18n.mjs', import.meta.url));

test('final release evidence stamps exact commit marker into built HTML', async () => {
  const source = await readFile('tools/bouw-release-evidence.mjs','utf8');
  assert.match(source,/ensureReleaseMarker/);
  assert.match(source,/glob\('\*\*\/\*\.html'\)/);
  assert.match(source,/RELEASE_HTML_MARKERS/);
  assert.match(source,/ensureReleaseMarker\(html, commitRef\)/);
});

test('mobile language injector supports v18 and compact bgkop mobile drawers', async () => {
  const source = await readFile('tools/site-shell/apply-i18n.mjs','utf8');
  assert.match(source,/v18-mobile-drawer/);
  assert.match(source,/bgkopMob/);
  assert.match(source,/bgkop-mob/);
  assert.match(source,/bgkop-mcta/);
  assert.match(source,/data-bg-language-select/);
  assert.match(source,/html\.replace\(cta, match => MOBILE_LANGUAGE \+ match\)/);
});

test('mobile language injector is executable and injects the compact drawer safely', async () => {
  execFileSync(process.execPath,['--check',applyI18n],{stdio:'pipe'});
  const dir = await mkdtemp(path.join(tmpdir(),'bg-i18n-inject-'));
  try {
    const file = path.join(dir,'prijzen.html');
    await writeFile(file,'<!doctype html><html><head><title>Prijzen</title></head><body><div id="bgkopMob" class="bgkop-mob"><a class="bgkop-mcta" href="/frisse-blik">CTA</a></div></body></html>','utf8');
    execFileSync(process.execPath,[applyI18n],{cwd:dir,stdio:'pipe'});
    const html = await readFile(file,'utf8');
    assert.match(html,/data-bg-language-switcher="mobile"/);
    assert.match(html,/data-bg-language-select/);
    assert.ok(html.indexOf('data-bg-language-switcher="mobile"') < html.indexOf('bgkop-mcta'));
    assert.equal((html.match(/data-bg-language-switcher="mobile"/g)||[]).length,1);
    assert.equal((html.match(/\/assets\/js\/i18n\.js/g)||[]).length,1);
  } finally {
    await rm(dir,{recursive:true,force:true});
  }
});
