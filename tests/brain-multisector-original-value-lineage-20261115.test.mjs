import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildCustomerValueBriefing,customerValueBriefingMarkup} from '../portal-v2/operating-system/customer-value-briefing.js';

const action=(sector,changes={})=>({id:'same-action',tenant_id:'tenant-a',title:sector,problem_id:'problem-1',next_action:'Review',status:'PROPOSED',source_refs:['system:action:1'],evidence_health:{status:'healthy'},success_metric:sector==='dienstverlening'?'Doorlooptijd':sector==='groothandel'?'Marge':'Afkeur',baseline_id:'baseline-a',expected_impact:{kind:'forecast',amount:120,unit:'HOURS'},...changes});
const outcome=(changes={})=>({action_id:'same-action',tenant_id:'tenant-a',status:'OUTCOME_VERIFIED',source_refs:['system:outcome:1'],evidence_health:{status:'healthy'},realized:{amount:2,unit:'HOURS',metric_id:'hours-saved',baseline_id:'baseline-a',period_id:'2026-11'},...changes});
const model=(a,o)=>({available:true,next_best_actions:[a],outcomes:[o],problems:[{problem_id:'problem-1',title:'Current problem',source_refs:['system:problem:1'],evidence_health:{status:'healthy'}}]});

for(const sector of ['dienstverlening','groothandel','industrie']){
 test('same ORIGINAL customer-value authority for '+sector,()=>{
  const a=action(sector);
  assert.equal(buildCustomerValueBriefing(model(a,outcome())).result?.amount,2);
  const invalidBaseline=outcome({realized:{...outcome().realized,baseline_id:'baseline-other'}});
  assert.equal(buildCustomerValueBriefing(model(a,invalidBaseline)).result,null,'never compare to a different baseline');
  assert.equal(buildCustomerValueBriefing(model(a,outcome({tenant_id:'tenant-b'}))).result,null,'explicit other tenant is not proof');
  assert.equal(buildCustomerValueBriefing(model(a,outcome({status:'EXECUTION_COMPLETED'}))).result,null,'completion is not value');
  assert.equal(buildCustomerValueBriefing(model(a,outcome({source_refs:[]}))).result,null,'source-less result is not value');
  assert.match(customerValueBriefingMarkup(model(a,invalidBaseline)),/Werkelijk resultaat:.*nog niet aangetoond/);
 });
}

test('existing authenticated server-side projection and one no-side-effect value skill remain authoritative',async()=>{
 const base=new URL('../',import.meta.url);
 const skill=await readFile(new URL('.agents/skills/powerhouse-company-intelligence-os/SKILL.md',base),'utf8');
 const source=await readFile(new URL('portal-v2/operating-system/customer-value-briefing.js',base),'utf8');
 const contract=JSON.parse(await readFile(new URL('brain/contracts/company-intelligence-os-v1.json',base),'utf8'));
 assert.match(skill,/Cross-sector verified improvement loop/);
 assert.match(skill,/original ONE BRAIN obligation/);
 assert.match(skill,/consumer receipt/);
 assert.equal(contract.canonical_runtime.orchestrator,'public.powerhouse_run_company_intelligence_os_v1(date)');
 assert.match(source,/if\(actionBaseline&&baseline!==actionBaseline\)continue/);
 assert.match(source,/if\(actionTenant&&outcomeTenant&&actionTenant!==outcomeTenant\)continue/);
 assert.doesNotMatch(source,/fetch\s*\(|setInterval\s*\(|localStorage|sessionStorage|supabase\.from/);
});
