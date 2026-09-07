import assert from 'node:assert/strict';
import { injectHomepageProcessProgress, reachedFromGeometry } from '../tools/bouw-v18-homepage-process-progress.mjs';

assert.deepEqual(reachedFromGeometry(150, [100, 400, 700, 1000]), [true, false, false, false], 'only step 01 is bright before the line reaches 02');
assert.deepEqual(reachedFromGeometry(410, [100, 400, 700, 1000]), [true, true, false, false], '01+02 are bright when the line reaches 02');
assert.deepEqual(reachedFromGeometry(760, [100, 400, 700, 1000]), [true, true, true, false], '01+02+03 stay bright when the line reaches 03');
assert.deepEqual(reachedFromGeometry(1010, [100, 400, 700, 1000]), [true, true, true, true], 'all four steps are bright when the line reaches 04');

const source = '<html><body><section><h2>Zo blijft je bedrijfsgeheugen actueel.</h2></section></body></html>';
const once = injectHomepageProcessProgress(source);
assert.match(once, /id="bg-home-process-progress-v1"/);
assert.match(once, /data-bg-process-reached/);
assert.match(once, /lijn\.end\+2>=starts\[i\]/, 'runtime must use the actual moving line endpoint');
assert.match(once, /opacity:1!important/, 'reached steps must override the dimmed presentation');
assert.equal(injectHomepageProcessProgress(once), once, 'build patch must be idempotent and may never stack duplicate runtimes');
assert.equal(injectHomepageProcessProgress('<html><body>andere pagina</body></html>'), '<html><body>andere pagina</body></html>');
console.log('homepage process progress regression: ok');
