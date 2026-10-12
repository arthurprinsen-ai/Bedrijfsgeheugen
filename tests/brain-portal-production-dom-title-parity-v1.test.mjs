import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const portal=fs.readFileSync('portal-v2/index.html','utf8');
const tests=[
 fs.readFileSync('tests/integration/portal-v2-production-full-parity.spec.js','utf8'),
 fs.readFileSync('tests/integration/portal-v2-production-standalone.spec.js','utf8')
];
test('canonical portal message is the production route overview proof',()=>{
 assert.match(portal,/<h2 id="dailySteeringTitle">Wat verandert er in je bedrijf — en wat doe je ermee\?<\/h2>/);
 for(const source of tests){
  assert.ok(source.includes("name:'Wat verandert er in je bedrijf — en wat doe je ermee?'")||source.includes("name: 'Wat verandert er in je bedrijf — en wat doe je ermee?'"));
  assert.doesNotMatch(source,/Portal V2 bevat alle portalonderdelen standaard/);
  assert.match(source,/toBeAttached\(\)/);
  assert.match(source,/legacy portal/);
 }
});
test('integration checks retain standalone navigation, protected-route and legacy-traffic assertions',()=>{
 assert.match(tests[0],/isProtectedTrustPage/);
 assert.match(tests[0],/legacyRequests/);
 assert.match(tests[0],/no protected route may request an old portal runtime/);
 assert.match(tests[1],/nativeTargets/);
 assert.match(tests[1],/page\.locator\('#portalView'\)/);
 assert.match(tests[1],/Portal V2 must not request legacy portal routes/);
});
