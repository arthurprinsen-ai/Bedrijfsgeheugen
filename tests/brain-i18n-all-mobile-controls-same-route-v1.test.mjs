import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const script = path.resolve('tools/site-shell/apply-i18n.mjs');

test('apply-i18n rewrites every existing mobile language control to the same logical route', () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'bg-i18n-multi-'));
  const stale='<nav class="bg-mobile-language" data-bg-language-switcher="mobile"><a href="/" data-bg-language-option="nl">Nederlands</a><a href="/en/" data-bg-language-option="en">English</a></nav>';
  const html='<!doctype html><html lang="nl"><head></head><body><aside id="v18MobileDrawer">'+stale+'</aside><div id="bgkopMob">'+stale+'</div></body></html>';
  fs.writeFileSync(path.join(dir,'prijzen.html'),html);
  execFileSync(process.execPath,[script],{cwd:dir,stdio:'pipe'});

  const out=fs.readFileSync(path.join(dir,'prijzen.html'),'utf8');
  const english=[...out.matchAll(/href="([^"]+)" data-bg-language-option="en"/g)].map(m=>m[1]);
  const dutch=[...out.matchAll(/href="([^"]+)" data-bg-language-option="nl"/g)].map(m=>m[1]);

  assert.equal(english.length,2);
  assert.deepEqual(english,['/en/prijzen','/en/prijzen']);
  assert.deepEqual(dutch,['/prijzen','/prijzen']);
  assert.doesNotMatch(out,/href="\/en\/" data-bg-language-option="en"/);
});
