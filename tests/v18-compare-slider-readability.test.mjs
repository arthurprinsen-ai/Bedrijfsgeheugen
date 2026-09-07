import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCompareSliderSource } from '../tools/site-shell/compare-slider-readability.mjs';

const broken = String.raw`
<style>
.compare-slider{position:relative;overflow:hidden}
.compare-after{clip-path:inset(0 0 0 var(--split,50%))}
.compare-copy{width:45%}
</style>
<div class="compare-slider" style="--split:50%">
  <div class="compare-side compare-before"><div class="compare-copy">Linkertekst</div></div>
  <div class="compare-side compare-after"><div class="compare-copy">Rechtertekst</div></div>
  <div class="compare-knob" role="slider" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"></div>
</div>
<script>
const pct=Math.max(8,Math.min(92,((clientX-r.left)/r.width)*100));
const n=Math.max(8,Math.min(92,now+(e.key==='ArrowRight'?3:-3)));
</script>`;

const safe = String.raw`
<style>
.compare-slider{position:relative;overflow:hidden}
.compare-after{clip-path:inset(0 0 0 var(--split,50%))}
.compare-copy{width:45%}
.compare-before .compare-copy{width:min(45%,calc(var(--split) - 68px))}
.compare-after .compare-copy{width:min(45%,calc(100% - var(--split) - 68px));margin-left:auto}
</style>
<div class="compare-slider" style="--split:50%">
  <div class="compare-side compare-before"><div class="compare-copy">Linkertekst</div></div>
  <div class="compare-side compare-after"><div class="compare-copy">Rechtertekst</div></div>
  <div class="compare-knob" role="slider" aria-valuemin="30" aria-valuemax="70" aria-valuenow="50"></div>
</div>
<script>
const pct=Math.max(30,Math.min(70,((clientX-r.left)/r.width)*100));
const n=Math.max(30,Math.min(70,now+(e.key==='ArrowRight'?3:-3)));
</script>`;

test('rejects compare sliders that can push readable copy off-screen', () => {
  const errors = validateCompareSliderSource(broken, { path: 'broken.html' });
  assert.ok(errors.some(error => error.code === 'UNSAFE_COMPARE_RANGE'));
  assert.ok(errors.some(error => error.code === 'COPY_NOT_BOUND_TO_VISIBLE_SPLIT'));
  assert.ok(errors.some(error => error.code === 'ARIA_RANGE_MISMATCH'));
});

test('accepts compare sliders whose copy remains readable across the whole drag range', () => {
  assert.deepEqual(validateCompareSliderSource(safe, { path: 'safe.html' }), []);
});
