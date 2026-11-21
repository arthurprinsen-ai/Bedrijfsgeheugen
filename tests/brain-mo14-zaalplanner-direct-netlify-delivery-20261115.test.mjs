import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const config=JSON.parse(readFileSync('config/brain-delivery-system.json','utf8'));
const website=config.lanes.find(lane=>lane.id==='website');
const actual='pw-mo14-1/zaalplanner/index.html';
test('MO14 zaalplanner has an exact independent website delivery owner',()=>{
  assert.ok(website?.paths.includes('pw-mo14-1/zaalplanner/'));
  assert.ok(!website.paths.includes('pw-mo14-1/'));
  assert.ok(actual.startsWith('pw-mo14-1/zaalplanner/'));
});
test('MO14 planner includes keeper, absent roster, bench and matchday-aware multi-fixture export',()=>{
  const html=readFileSync(actual,'utf8');
  for(const marker of ['id="keeper"','id="roster"','id="bench"','id="pdfAll"','function rotationsFor','id="pdfGame"']) {
    assert.ok(html.includes(marker),`Missing planner contract: ${marker}`);
  }
  assert.match(html,/Array\.from\(\{length:state\.matches\.length\}/);
  assert.doesNotMatch(html,/make\.com|hook\.make\.com|buffer\.com/i);
});
