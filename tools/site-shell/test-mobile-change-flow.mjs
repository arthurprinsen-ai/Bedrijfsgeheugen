import assert from 'node:assert/strict';
import test from 'node:test';
import { applyHomepageContextSliderReadability } from './fix-homepage-context-slider.mjs';

const fixture = `<!doctype html><html><head></head><body>
<section><h2>Eén wijziging. Overal doorgewerkt.</h2>
<div class="flow">
  <article><h3>Signaal komt binnen</h3><span class="status-ok">✓</span></article>
  <article><h3>Context wordt begrepen</h3><span class="status-ok">✓</span></article>
  <article><h3>Opvolging ontstaat</h3><span class="status-ok">✓</span></article>
  <article><h3>Waarde wordt gemeten</h3><span class="status-ok">✓</span></article>
</div></section>
</body></html>`;

test('mobile change flow krijgt progressieve 01-04 states zonder slidercontract te verzwakken', () => {
  const out = applyHomepageContextSliderReadability(fixture);
  assert.match(out, /data-bg-change-flow/);
  assert.match(out, /bg-change-flow-track/);
  assert.match(out, /bg-change-flow-fill/);
  assert.match(out, /data-bg-change-state/);
  assert.match(out, /aria-current/);
  assert.match(out, /--bg-change-progress/);
  assert.match(out, /requestAnimationFrame/);
  assert.match(out, /prefers-reduced-motion/);

  // Bestaande compare-slider contract mag niet terugvallen naar een geklemde 40-60 variant.
  assert.match(out, /Math\.max\(0,Math\.min\(100/);
  assert.match(out, /aria-valuemin','0/);
  assert.match(out, /aria-valuemax','100/);
  assert.doesNotMatch(out, /Math\.max\(40,Math\.min\(60/);
});
