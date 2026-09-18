import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {scoreForecast,buildForesightPacket} from '../scripts/brain/foresight-autonomy.mjs';
import {buildCustomerForesightView} from '../portal-v2/foresight-intelligence.js';

test('autonomy contract covers code infra architecture security integrations and portal forecasts',()=>{
 const c=JSON.parse(fs.readFileSync('config/powerhouse-foresight-autonomy.json','utf8'));
 for(const k of ['discover_new_code_techniques','discover_new_infrastructure','discover_new_architecture_patterns','optimize_security','customer_portal_forecasts']) assert.equal(c.autonomy[k],true);
 assert.equal(c.control_plane.one_canonical_truth,true);
 assert.equal(c.prediction.prediction_is_not_fact,true);
 assert.equal(c.security.security_non_degradation,true);
});

test('forecast exposes benchmark scenarios confidence and uncertainty',()=>{
 const f=scoreForecast({baseline:50,benchmark:70,drivers:[{impact:10,weight:0.5}],confidence:.7,horizon:'90d'});
 assert.equal(f.expected_path,55);
 assert.equal(f.benchmark_gap,20);
 assert.ok(f.upside_case>f.expected_path);
 assert.ok(f.downside_case<f.expected_path);
 assert.equal(f.prediction_is_not_fact,true);
});

test('portal projection preserves provenance and caveat',()=>{
 const packet=buildForesightPacket({observed_at:'2026-09-18T07:00:00Z',metrics:[{id:'margin',baseline:10,benchmark:14,confidence:.8,provenance:['external:sector-benchmark'],freshness:'2026-Q3'}]});
 const v=buildCustomerForesightView(packet);
 assert.equal(v.forecasts.length,1);
 assert.deepEqual(v.forecasts[0].provenance,['external:sector-benchmark']);
 assert.match(v.forecasts[0].caveat,/geen zekerheid/);
});
