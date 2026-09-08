import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../.github/canoniek/kop.html', import.meta.url), 'utf8');
const origin = 'https://www.bedrijfsgeheugen.nl';

test('canonical Kennis menu houdt Kennisbank en Blog als aparte bestemmingen op desktop en mobiel', () => {
  const desktop = html.match(/<button class="bgkop-trig"[^>]*>Kennis[\s\S]*?<div class="bgkop-paneel">([\s\S]*?)<\/div><\/div><a href="https:\/\/www\.bedrijfsgeheugen\.nl\/over-ons">/i)?.[1] || '';
  const mobile = html.match(/<button class="bgkop-macc"[^>]*>Kennis[\s\S]*?<div class="bgkop-mpaneel" hidden>([\s\S]*?)<\/div><button class="bgkop-macc"[^>]*>Het bedrijfsgeheugen/i)?.[1] || '';

  for (const [label, menu] of [['desktop', desktop], ['mobiel', mobile]]) {
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
