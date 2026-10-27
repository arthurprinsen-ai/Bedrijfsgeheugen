import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const adapter=await import('../supabase/functions/powerhouse-forecast-calibrator/openai-calibration.mjs').catch(()=>({}));
const forecast={scope:'market',predicted_event:'Public event',topic_key:'market',created_at:'2026-10-01T00:00:00Z',horizon_end:'2026-10-20',probability:0.7,private_customer:'secret'};
test('due loading selects public scopes before the bounded batch so person forecasts cannot leak or starve it',()=>{
 const source=readFileSync(new URL('../supabase/functions/powerhouse-forecast-calibrator/index.ts',import.meta.url),'utf8');
 assert.match(source,/db\.rpc\('powerhouse_public_market_calibration_due_v1',\{p_limit:12\}\)/);
 assert.doesNotMatch(source,/from\('revenue_learning_obligations'\)\.select\('\*'\)/);
 assert.match(source,/if\(dueError\)throw new Error\('CALIBRATION_DUE_READ_FAILED'\)/);
});
test('calibration sends only public forecast fields and matching public evidence',()=>{
 assert.equal(typeof adapter.publicCalibrationPayload,'function');
 const payload=adapter.publicCalibrationPayload({forecast,external_signals:[{ref:'https://example.org/a',title:'Public event',summary:'mail alice@example.org',private:'secret'}],search_signals:[],commercial_outcomes:[{attribution_root_key:'secret'}]});
 assert.equal(payload.forecast.predicted_event,forecast.predicted_event);
 assert.equal(payload.forecast.created_at,forecast.created_at);
 assert.equal(payload.forecast.horizon_end,forecast.horizon_end);
 assert.doesNotMatch(JSON.stringify(payload),/secret|alice@example.org|private_customer|commercial_outcomes/);
 assert.equal(payload.external_signals[0].ref,'news:0');
});
test('calibration reference tokens do not leak contacts and resolve back to exact local sources',()=>{
 const context={forecast,external_signals:[{ref:'https://example.org/a?email=alice@example.org'}],search_signals:[{ref:'keyword:bob@example.org',keyword:'bob@example.org'}]};
 const payload=adapter.publicCalibrationPayload(context);
 assert.doesNotMatch(JSON.stringify(payload),/alice@example.org|bob@example.org/);
 assert.equal(typeof adapter.resolveCalibrationReferences,'function');
 const refs=[payload.external_signals[0].ref,payload.search_signals[0].ref];
 assert.deepEqual(adapter.resolveCalibrationReferences(refs,context),context.external_signals.concat(context.search_signals).map(s=>s.ref));
});
test('impossible calendar dates cannot materialize a forecast',()=>{
 const payload={forecast:{...forecast,created_at:'2026-02-01T00:00:00Z',horizon_end:'2026-03-10'},external_signals:[{ref:'a'},{ref:'b'}],search_signals:[]};
 assert.equal(adapter.canCommitCalibration({outcome:'materialized',confidence:0.8,actual_event_at:'2026-02-30',evidence_refs:['a','b']},payload),false);
});
test('calibration never fabricates negative outcomes or accepts unknown/insufficient references or invalid dates',()=>{
 assert.equal(typeof adapter.canCommitCalibration,'function');
 const payload={forecast,external_signals:[{ref:'https://example.org/a'},{ref:'https://example.org/b'}],search_signals:[]};
 const good={outcome:'materialized',confidence:0.8,actual_event_at:'2026-10-10T12:00:00Z',evidence_refs:['https://example.org/a','https://example.org/b']};
 assert.equal(adapter.canCommitCalibration(good,payload),true);
 for(const change of [{outcome:'missed'},{outcome:'uncertain'},{confidence:0.5},{evidence_refs:['invented','https://example.org/b']},{evidence_refs:['https://example.org/a','https://example.org/a']},{actual_event_at:'not-date'},{actual_event_at:'2026-10-25'},{actual_event_at:'2026-09-01'}])assert.equal(adapter.canCommitCalibration({...good,...change},payload),false);
});
