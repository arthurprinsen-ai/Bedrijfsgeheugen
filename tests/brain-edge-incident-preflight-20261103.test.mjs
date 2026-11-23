import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { evaluateIncidentSelfFix, compileChatLearningPreflight } from '../scripts/brain/chat-learning-preflight.mjs';

const policy = () => JSON.parse(fs.readFileSync('brain/policies/powerhouse-incident-register-and-self-fix-v1.json','utf8'));
const fixture = edgeFns => {
  const root=fs.mkdtempSync(path.join(os.tmpdir(),'edge-incident-coverage-'));
  fs.mkdirSync(path.join(root,'brain/observability'),{recursive:true});
  fs.writeFileSync(path.join(root,'brain/observability/incident-obligation-assurance.mjs'),'// original auditor fixture');
  for(const [name,content] of Object.entries(edgeFns)){
    fs.mkdirSync(path.join(root,'supabase/functions',name),{recursive:true});
    fs.writeFileSync(path.join(root,'supabase/functions',name,'index.ts'),content);
  }
  return root;
};
test('current edge functions are covered by explicit marker or visible debt',()=>{
  const edge=compileChatLearningPreflight().incident_self_fix.edge_functions;
  assert.ok(edge.total>0);
  assert.equal(edge.total,edge.with_protocol+edge.loop_debt.count);
});
test('new Edge Function without incident protocol fails closed',()=>{
  assert.throws(()=>evaluateIncidentSelfFix({rootDir:fixture({'new-edge':'export default 1;'}),policy:policy()}),/INCIDENT_PROTOCOL_MISSING_ON_NEW_EDGE_FUNCTION:new-edge/);
});
test('marker is declaration and legacy coverage stays visible rather than false green',()=>{
  const p=policy(),known=p.edge_function_protocol.loop_debt_baseline[0];
  const marker=p.edge_function_protocol.marker;
  const x=evaluateIncidentSelfFix({rootDir:fixture({[known]:'export default 1;','new-edge':'// '+marker}),policy:p});
  assert.equal(x.edge_functions.with_protocol,1);
  assert.deepEqual(x.edge_functions.loop_debt.functions,[known]);
  assert.match(x.edge_functions.limit,/not proof/i);
});
test('edge coverage policy tampering is rejected',()=>{
  for(const mut of [p=>delete p.edge_function_protocol,p=>p.edge_function_protocol.new_functions_must_carry_marker=false,p=>p.edge_function_protocol.marker='x']){
    const p=policy();mut(p);
    assert.throws(()=>evaluateIncidentSelfFix({rootDir:fixture({}),policy:p}),/INCIDENT_EDGE_PROTOCOL_POLICY_INVALID/);
  }
});
