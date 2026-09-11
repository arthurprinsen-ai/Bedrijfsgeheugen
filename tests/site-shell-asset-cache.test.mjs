import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

/* Assets zonder versienummer in de URL moeten snel hercontroleerbaar blijven,
 * anders bereikt een reparatie terugkerende bezoekers pas als hun cache
 * verloopt. netlify.toml wint van _headers (gemeten op productie: /assets/*.css
 * krijgt de toml-waarde, niet de _headers-waarde), dus hier staat het vangnet. */
const toml = readFileSync('netlify.toml', 'utf8');

function regel(pad) {
  const blok = toml.split('[[headers]]').find(b => new RegExp(`for\\s*=\\s*"${pad.replace(/[*.]/g, m => '\\' + m)}"`).test(b));
  return blok && (blok.match(/Cache-Control\s*=\s*"([^"]+)"/) || [])[1];
}

for (const pad of ['/assets/*.css', '/assets/*.js', '/assets/js/*']) {
  test(`${pad} wordt hooguit een uur gecachet en daarna hercontroleerd`, () => {
    const waarde = regel(pad);
    assert.ok(waarde, `geen Cache-Control-regel voor ${pad} in netlify.toml`);
    assert.doesNotMatch(waarde, /immutable/, `${pad} mag niet immutable zijn: er staat geen versienummer in de URL`);
    assert.match(waarde, /must-revalidate/, `${pad} wordt niet hercontroleerd`);
    const maxAge = Number((waarde.match(/max-age=(\d+)/) || [])[1]);
    assert.ok(maxAge > 0 && maxAge <= 3600, `${pad} max-age ${maxAge}s is langer dan een uur`);
  });
}
