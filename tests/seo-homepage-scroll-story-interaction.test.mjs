/**
 * Interactiecontract van de scroll story op de homepage.
 *
 * Twee asserties zijn hier verwijderd omdat ze het tegenovergestelde eisten van
 * tests/homepage-scroll-story-geometry-guard.test.mjs, die wel in CI draait en
 * groen staat:
 *
 *   - `window.scrollTo` was hier verplicht ("click navigation must move the
 *     sticky story"); de geometry-guard verbiedt het juist, omdat de story de
 *     scrollpositie van de bezoeker niet mag overnemen.
 *   - `position:sticky!important` in het desktopblok was hier verplicht; de
 *     geometry-guard verbiedt dat, omdat een bestaande homepagecontainer
 *     daarmee sticky wordt gemaakt en de ontworpen geometrie kapotgaat.
 *
 * De story navigeert nu via setStoryState en leest zijn stand af uit de
 * bestaande stapgeometrie (nearestStepToViewportCenter). Dat is de nieuwere en
 * geldende opzet. Wat hieronder overblijft is het deel van dit contract dat
 * daar niet mee botst.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

test('homepage scroll story is wired on the final built homepage output', () => {
  const scriptPath = 'tools/bouw-v18-homepage-scroll-story.mjs';
  assert.equal(existsSync(scriptPath), true, 'homepage scroll-story build step is missing');

  const pipeline = readFileSync('tools/prijzen-uit-de-homepage.mjs', 'utf8');
  assert.match(
    pipeline,
    /bouw-v18-homepage-scroll-story\.mjs/,
    'scroll-story fix is not part of the final homepage build/verification pipeline',
  );

  const source = readFileSync(scriptPath, 'utf8');

  for (const marker of [
    'Signaal komt binnen',
    'Context wordt begrepen',
    'Opvolging ontstaat',
    'Analyseer impact',
  ]) {
    assert.match(source, new RegExp(marker), `required story marker is missing: ${marker}`);
  }

  assert.match(source, /setStoryState/, 'scroll and click must share one canonical state setter');
  assert.match(source, /requestAnimationFrame/, 'scroll updates must be frame-bounded');
  assert.match(source, /addEventListener\('click'/, 'CTA and/or story steps must be clickable');
  assert.match(source, /prefers-reduced-motion/, 'reduced-motion behavior is missing');
  assert.match(source, /data-bg-story-state/, 'story state must be reflected in DOM state');
  assert.match(source, /data-bg-story-step/, 'story steps must expose explicit state hooks');
  assert.match(source, /data-bg-story-overlay/, 'cockpit must visibly change between story states');
  assert.match(source, /Sinds deze pagina opende|Reken het na/, 'cost widget overlap guard is missing');
  assert.match(source, /min-width:\s*1024px/, 'desktop sticky behavior must be desktop-only');
  assert.match(source, /max-width:\s*1023px/, 'mobile must have a non-sticky fallback');
  assert.match(source, /aria-current/, 'active step must expose its state accessibly');
});

test('de story navigeert zonder de scrollpositie van de bezoeker over te nemen', () => {
  const source = readFileSync('tools/bouw-v18-homepage-scroll-story.mjs', 'utf8');
  assert.match(source, /setStoryState/, 'klik en scroll delen niet één toestandsfunctie');
  assert.match(source, /nearestStepToViewportCenter/, 'de stand wordt niet uit de bestaande stapgeometrie afgeleid');
  assert.doesNotMatch(source, /window\.scrollTo\s*\(/, 'de story kaapt de scrollpositie van de bezoeker');
});
