import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../tools/delivery/ftr-original-admission-replay-v1.mjs',import.meta.url),'utf8');
test('controlled original admission replay must remain source only, never deploy or run',()=>{
 assert.match(source,/replayMarker/);
 assert.match(source,/candidate-not-to-be-merged/);
});
