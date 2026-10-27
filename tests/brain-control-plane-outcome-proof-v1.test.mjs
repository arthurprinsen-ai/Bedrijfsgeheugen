import test from 'node:test';
import assert from 'node:assert/strict';
import {controlPlaneCockpitMarkup} from '../portal-v2/control-plane-cockpit.js';

const show=(item)=>controlPlaneCockpitMarkup({
  metrics:{obligations_total:1,obligations_fulfilled:1},
  obligations:[{obligation_key:'customer-outcome',current_state:'FULFILLED',...item}]
});

test('historic false-green replay: fulfilled is not verified without literal true outcome',()=>{
  for(const value of [undefined,null,false,0,1,'true','yes']){
    const html=show({outcome_verified:value,migration_readback_verified:true,evidence_count:9,red_evidence_count:0});
    assert.match(html,/data-state="bad"/,`invalid proof ${String(value)} cannot turn green`);
    assert.match(html,/FULFILLED · UITKOMST ONBEWEZEN/);
    assert.match(html,/Geen productiesucces bewezen/);
    assert.match(html,/Geclaimd afgerond/);
    assert.doesNotMatch(html,/data-state="ok"/);
  }
});

test('positive provider receipt allows green only for literal outcome_verified true',()=>{
  const html=show({outcome_verified:true});
  assert.match(html,/data-state="ok"/);
  assert.match(html,/Outcome bewezen/);
  assert.doesNotMatch(html,/UITKOMST ONBEWEZEN|Geen productiesucces bewezen/);
});

test('canonical HTML presentation continues to escape unknown input',()=>{
  const html=show({obligation_key:'<IMG src=x onerror=alert(1)>',outcome_verified:false});
  assert.doesNotMatch(html,/<img\b/i);
  assert.match(html,/&lt;IMG src=x onerror=alert\(1\)&gt;/);
});
