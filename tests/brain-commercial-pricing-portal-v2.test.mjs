import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {planRuntimePolicy} from '../platform/saas/entitlement-policy.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('commercial catalog defines exact SaaS and consulting offers',async()=>{
  const catalog=JSON.parse(await read('config/powerhouse-commercial-catalog-v2.json'));
  assert.deepEqual(catalog.saas.map(x=>[x.code,x.monthly_price_cents]),[
    ['starter',9900],['pro',29900],['groei',74900],['enterprise',null]
  ]);
  assert.deepEqual(catalog.consulting.map(x=>[x.code,x.price_cents]),[
    ['frisse-blik',0],['directie-ai-workshop',195000],['bedrijfsscan',295000],['build-sprint',1450000],['fractional-lead',295000]
  ]);
  assert.equal(catalog.commercial_rules.credit_workshop_scan_to_build,true);
  assert.equal(catalog.commercial_rules.temporary_portal_access,true);
});

test('pricing page exposes both SaaS and consulting with approved package contents',async()=>{
  const html=await read('prijzen.html');
  for(const token of ['Powerhouse SaaS','€ 99','€ 299','€ 749','Directie & AI Workshop','€ 1.950','Bedrijfsgeheugen Scan','€ 2.950','Vanaf € 14.500','Transformation / Fractional Lead','Combineer zonder dubbel te betalen','Wat groeit mee met je abonnement?']) assert.ok(html.includes(token),token);
  for(const code of ['starter','pro','groei']) assert.match(html,new RegExp('afsluiten\\?plan='+code));
  assert.match(html,/data-tab="saas"/);
  assert.match(html,/data-tab="consulting"/);
});

test('checkout accepts the three self-serve commercial plan codes',async()=>{
  const html=await read('afsluiten.html');
  for(const code of ['starter','pro','groei']) assert.match(html,new RegExp(code+":\\{"));
  assert.match(html,/€ 99/);
  assert.match(html,/€ 299/);
  assert.match(html,/€ 749/);
});

test('portal mounts server-backed commercial entitlements',async()=>{
  const [app,module]=await Promise.all([read('portal-v2/app.js'),read('portal-v2/commercial-entitlements.js')]);
  assert.match(app,/mountCommercialEntitlements/);
  assert.match(module,/\/api\/portal-entitlements/);
  for(const token of ['Gebruikers','Integraties','Documenten','Data refresh','AI-vragen / maand','Automatiseringen']) assert.ok(module.includes(token),token);
  assert.match(module,/portal-plan-locked/);
});

test('runtime policy exposes the commercial capacity envelope',()=>{
  const policy=planRuntimePolicy({organisation_id:'o',plan_code:'groei',plan_name:'Groei',status:'active',entitlements:{
    intelligence_core:true,seats:75,data_sources:25,documents:2500,refresh_minutes:15,ai_questions_month:750,automations:12,ai_automations:6,
    forecasting:true,scenario_analysis:true,agent_mode:'approval_required',approval_workflows:true,audit_trail:true,sso:false,organisations:3,
    external_signal_scan:'daily',senior_advisory_minutes_month:60,executive_summary:'daily',monthly_review:true,custom_domain:false,model_choice:true,sla:'priority'
  }});
  assert.equal(policy.maxSeats,75);
  assert.equal(policy.maxDataSources,25);
  assert.equal(policy.maxDocuments,2500);
  assert.equal(policy.maxAiQuestionsMonth,750);
  assert.equal(policy.maxAutomations,12);
  assert.equal(policy.maxAiAutomations,6);
  assert.equal(policy.approvalWorkflows,true);
  assert.equal(policy.executiveSummary,'daily');
  assert.equal(policy.monthlyReview,true);
  assert.equal(policy.sla,'priority');
});
