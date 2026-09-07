import assert from 'node:assert/strict';
import { injectHomepageProcessProgress, reachedFromGeometry } from '../tools/homepage-process-progress.mjs';

assert.deepEqual(
  reachedFromGeometry(760, [100, 400, 700, 1000]),
  [true, true, true, false],
  'every step already crossed by the progress line must stay bright'
);
assert.deepEqual(
  reachedFromGeometry(1010, [100, 400, 700, 1000]),
  [true, true, true, true],
  'all four steps must be bright when the line reaches the fourth step'
);
assert.deepEqual(
  reachedFromGeometry(150, [100, 400, 700, 1000]),
  [true, false, false, false],
  'future steps must remain subdued until the line reaches them'
);

const source = '<html><body><section><h2>Zo blijft je bedrijfsgeheugen actueel.</h2></section></body></html>';
const once = injectHomepageProcessProgress(source);
const twice = injectHomepageProcessProgress(once);
assert.match(once, /id="bg-home-process-progress-v1"/);
assert.match(once, /lijn\.end\+2>=starts\[i\]/, 'runtime must compare the moving line endpoint with each step position');
assert.equal(twice, once, 'build patch must be idempotent');
assert.equal(injectHomepageProcessProgress('<html><body>andere pagina</body></html>'), '<html><body>andere pagina</body></html>');

console.log('homepage process progress regression: ok');
