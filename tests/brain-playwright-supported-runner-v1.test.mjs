import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const affected=[
  'portal-v2-production-dom-readback.yml',
  'portal-v2-live-preview.yml',
  'production-source-snapshot.yml',
  'live-preview-smoke.yml',
  'v18-megamenu-production-readback.yml',
  'portal-visual-density.yml',
  'website-cross-browser-screenshot-assurance.yml'
];
test('Playwright 1.55 Chromium workflows do not use moving Ubuntu runner labels',()=>{
  for(const name of affected){
    const yaml=readFileSync(new URL('../.github/workflows/'+name,import.meta.url),'utf8');
    assert.ok(yaml.includes('install-chromium.sh')||yaml.includes('playwright@1.55.0'),name+' is missing its pinned Playwright runtime');
    assert.match(yaml,/runs-on:\s*ubuntu-24\.04(?:\s|$)/m,name+' must pin supported Ubuntu 24.04');
    assert.doesNotMatch(yaml,/runs-on:\s*ubuntu-latest(?:\s|$)/m,name+' must not drift to unsupported Ubuntu 26.04');
  }
});
