import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../.github/canoniek/kop.html', import.meta.url), 'utf8');
const origin = 'https://www.bedrijfsgeheugen.nl';

test('canonical Kennis menu houdt Kennisbank en Blog als aparte bestemmingen op desktop en mobiel', () => {
  const desktopStart = html.indexOf('>Kennis<');
  const desktopBlock = html.slice(desktopStart, html.indexOf('>Over ons<', desktopStart));
  const mobileStart = html.indexOf('>Kennis<', desktopStart + 1);
  const mobileBlock = html.slice(mobileStart, html.indexOf('>Het bedrijfsgeheugen<', mobileStart));

  for (const [label, menu] of [['desktop', desktopBlock], ['mobiel', mobileBlock]]) {
    assert.ok(menu, `${label}: Kennis-menu ontbreekt`);
    const kennis = menu.indexOf(`${origin}/kennis/`);
    const blog = menu.indexOf(`${origin}/blog/`);
    assert.ok(kennis >= 0, `${label}: Kennisbank moet naar /kennis/ wijzen`);
    assert.ok(blog >= 0, `${label}: Blog moet naar /blog/ wijzen`);
    assert.ok(kennis < blog, `${label}: Kennisbank moet vóór Blog staan`);
  }
});

test('canonical header bevat uitsluitend absolute bedrijfsgeheugen hrefs', () => {
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(match => match[1]);
  assert.ok(hrefs.length > 0, 'canonical header bevat geen links');
  assert.deepEqual(hrefs.filter(href => !href.startsWith(`${origin}/`)), []);
});
