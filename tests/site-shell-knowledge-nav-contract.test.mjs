import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const header = readFileSync('.github/canoniek/kop.html', 'utf8');

function kennisPanels(html) {
  const desktop = html.match(/>Kennis<[^]*?<div class="bgkop-paneel">([^]*?)<\/div>/i)?.[1] || '';
  const mobile = html.match(/>Kennis<[^]*?<div class="bgkop-mpaneel" hidden>([^]*?)<\/div>/i)?.[1] || '';
  return { desktop, mobile };
}

test('Kennisbank is first under Kennis on desktop and mobile, with absolute canonical links', () => {
  const { desktop, mobile } = kennisPanels(header);
  for (const panel of [desktop, mobile]) {
    assert.ok(panel, 'Kennis panel must exist');
    const kennisbank = panel.indexOf('https://www.bedrijfsgeheugen.nl/kennis/');
    const blog = panel.indexOf('https://www.bedrijfsgeheugen.nl/blog/');
    assert.ok(kennisbank >= 0, 'Kennisbank link must be present');
    assert.ok(blog >= 0, 'Blog link must be present');
    assert.ok(kennisbank < blog, 'Kennisbank must appear before Blog');
  }
  assert.match(desktop, /<b>Kennisbank<\/b>/);
  assert.match(mobile, />Kennisbank<\/a>/);
});
