import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const script = path.resolve('tools/site-shell/apply-i18n.mjs');
const runtime = path.resolve('assets/js/i18n.js');

test('apply-i18n injects same-route mobile locale links for Dutch and English pages', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'bg-i18n-route-'));
  fs.mkdirSync(path.join(dir,'en'),{recursive:true});
  const page = '<!doctype html><html lang="nl"><head></head><body><aside class="v18-mobile-drawer" aria-hidden="false"><a href="/inloggen">Login</a></aside></body></html>';
  fs.writeFileSync(path.join(dir,'prijzen.html'),page);
  fs.writeFileSync(path.join(dir,'en','prijzen.html'),page.replace('lang="nl"','lang="en"'));
  fs.writeFileSync(path.join(dir,'index.html'),page);

  execFileSync(process.execPath,[script],{cwd:dir,stdio:'pipe'});

  const nl = fs.readFileSync(path.join(dir,'prijzen.html'),'utf8');
  assert.match(nl,/href="\/prijzen" data-bg-language-option="nl"/);
  assert.match(nl,/href="\/en\/prijzen" data-bg-language-option="en"/);
  assert.doesNotMatch(nl,/href="\/en\/" data-bg-language-option="en"/);

  const en = fs.readFileSync(path.join(dir,'en','prijzen.html'),'utf8');
  assert.match(en,/href="\/prijzen" data-bg-language-option="nl"/);
  assert.match(en,/href="\/en\/prijzen" data-bg-language-option="en"/);
  assert.doesNotMatch(en,/\/en\/en\/prijzen/);

  const home = fs.readFileSync(path.join(dir,'index.html'),'utf8');
  assert.match(home,/href="\/" data-bg-language-option="nl"/);
  assert.match(home,/href="\/en\/" data-bg-language-option="en"/);
});


test('public runtime keeps language anchors on the equivalent current route', () => {
  const source = fs.readFileSync(runtime,'utf8');
  assert.match(source,/btn\.setAttribute\('href', localizedHref\(target\)\)/);
  assert.match(source,/btn\.setAttribute\('hreflang', target\)/);
  assert.match(source,/btn\.removeAttribute\('aria-current'\)/);
});
