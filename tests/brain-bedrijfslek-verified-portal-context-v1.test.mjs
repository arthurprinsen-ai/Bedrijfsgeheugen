import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=readFileSync('supabase/functions/powerhouse-scan-ingest/index.ts','utf8');
function getProjection(){
 const start=source.indexOf('const BEDRIJFSLEK_DOMAINS:');
 const end=source.indexOf('function normalize(body:any)',start);
 assert.ok(start>0&&end>start,'Use the production Supabase projection source');
 const js=source.slice(start,end)
  .replace('const BEDRIJFSLEK_DOMAINS:Record<string,{label:string,action:string}>','const BEDRIJFSLEK_DOMAINS')
  .replace('function mergeProjectionItems(previous:unknown,items:any[])','function mergeProjectionItems(previous,items)')
  .replace('function claimedBedrijfslekProjection(scan:any,tenantId:string,current:any)','function claimedBedrijfslekProjection(scan,tenantId,current)')
  .replace('const nextData:any=','const nextData=')
  .replace('(row:any)=>','(row)=>');
 const safeObj=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
 const num=(v,min,max)=>{const x=Number(v);return Number.isFinite(x)&&x>=min&&x<=max?x:null};
 return new Function('safeObj','num',js+'\nreturn claimedBedrijfslekProjection;')(safeObj,num);
}
const scan={id:'scan-unique-1',submission_key:'bedrijfslek-demo-unique-20261009',soort:'bedrijfslek_scan',
 score:58,niveaus:{verkoop:1.5,continuiteit:2.25,ai:4.5,systemen:3},scan_datum:'2026-10-09',powerhouse_event_id:'runtime-event-1'};
test('a server-verified Bedrijfslek scan produces contextual canonical Brain inputs and only proposed recommendations',()=>{
 const f=getProjection(),p=f(scan,'tenant:auth-user-1',null),d=p.data;
 assert.equal(p.origin,'canonical-brain');
 assert.equal(p.tenantId,'tenant:auth-user-1');
 assert.equal(d.portal.assessments.bedrijfslekScan.score,58);
 assert.equal(d.portal.assessments.bedrijfslekScan.truthClass,'SELF_REPORTED');
 assert.equal(d.portal.assessments.bedrijfslekScan.verifiedIdentity,true);
 assert.equal(d.businessInputs[0].inputType,'DigitalMaturityAssessment');
 assert.equal(d.businessInputs[0].metadata.truthClass,'SELF_REPORTED');
 assert.equal(d.signals[0].status,'Observed');
 assert.equal(d.recommendedActions.length,3);
 assert.equal(d.recommendedActions[0].priority,'Hoog');
 assert.equal(d.recommendedActions[0].status,'voorgesteld');
 assert.equal(d.recommendedActions[0].executed,false);
 assert.equal(d.recommendedActions[0].verified,false);
 assert.equal(d.recommendedActions[0].reason.includes('30/100'),true);
 assert.equal(d.healthCards.some(x=>x.id==='bedrijfslek:verkoop'&&x.score===30),true);
 assert.match(d.managementSummary.summary,/Indicatieve uitslag/);
 assert.doesNotMatch(JSON.stringify(d),/\b(email|telefoon|contact_name|contactEmail)\b/i);
});
test('existing financial/company knowledge, recommendations and canonical BusinessInputs are preserved',()=>{
 const f=getProjection();
 const current={schemaVersion:2,tenantId:'tenant-1',origin:'canonical-brain',data:{
  company:{name:'Bestaande BV',health:80},managementSummary:{title:'Gecontroleerd jaaroverzicht',score:80},
  businessInputs:[{id:'existing:finance',answers:{turnover:123}}],
  recommendedActions:[{id:'existing-action',title:'Bestaande maatregel',verified:true,executed:true}],
  healthCards:[{id:'financial:margin',value:65}],signals:[{id:'regulatory:ai-act',title:'Wetgeving'}],
  portal:{strategy:{dna:{goal:'Bestaand doel'}}},sourceMeta:{kind:'canonical-brain',updatedAt:'2026-10-01T00:00:00Z'}
 }};
 const out=f(scan,'tenant-1',current),d=out.data;
 assert.deepEqual(d.company,current.data.company);
 assert.deepEqual(d.managementSummary,current.data.managementSummary);
 assert.equal(d.businessInputs.length,2);
 assert.equal(d.businessInputs[0].id,'existing:finance');
 assert.equal(d.recommendedActions.find(x=>x.id==='existing-action').executed,true);
 assert.deepEqual(d.portal.strategy,current.data.portal.strategy);
 assert.ok(d.healthCards.some(x=>x.id==='financial:margin'));
 assert.ok(d.signals.some(x=>x.id==='regulatory:ai-act'));
 assert.equal(out.sourceUpdatedAt>current.data.sourceMeta.updatedAt,true);
});
test('replaying one scan updates the same recommendation ids without duplicates',()=>{
 const f=getProjection();
 const once=f(scan,'tenant-1',null);
 const twice=f(scan,'tenant-1',once);
 assert.equal(twice.data.businessInputs.length,1);
 assert.equal(twice.data.signals.length,1);
 assert.equal(twice.data.recommendedActions.length,3);
 assert.equal(twice.data.healthCards.length,4);
});
test('legacy workshop businessInputs object is not overwritten by the selfscan projection',()=>{
 const f=getProjection();
 const previous={data:{businessInputs:{workshopScan:{score:65}},managementSummary:{title:'Workshop resultaat'}}};
 const projected=f(scan,'tenant-1',previous);
 assert.deepEqual(projected.data.businessInputs,previous.data.businessInputs);
 assert.equal(projected.data.portal.assessments.bedrijfslekScan.score,58);
 assert.equal(projected.data.managementSummary.title,'Workshop resultaat');
});
test('real claim remains behind verified ownership and requires provider write confirmation',()=>{
 assert.match(source,/if\(scan\.soort==='bedrijfslek_scan'\)/);
 assert.match(source,/\.eq\('tenant_identity_status',scan\.tenant_identity_status\)/);
 assert.match(source,/scan\.company_key!==companyKey/);
 assert.match(source,/bg_portal_state_get_internal/);
 assert.match(source,/bg_portal_state_put_internal/);
 assert.match(source,/put\[0\]\?\.stored!==true/);
 assert.match(source,/scan_identity_verified/);
 assert.match(source,/bedrijfslek_portal_projected:bedrijfslekProjected/);
 assert.doesNotMatch(source,/create\s+(?:table|schedule|publication)\s+\w*heartbeat/i);
});

test('real Portal V2 overview shows only verified selfreported scores and unexecuted suggestions',()=>{
 const overview=readFileSync('portal-v2/modules/overview.js','utf8');
 assert.match(overview,/function renderBedrijfslekIntelligence\(root,state\)/);
 assert.match(overview,/renderBedrijfslekIntelligence\(root,state\)/);
 assert.match(overview,/state\?\.portal\?\.assessments\?\.bedrijfslekScan/);
 assert.match(overview,/scan\?\.verifiedIdentity!==true/);
 assert.match(overview,/item\?\.status==='voorgesteld'/);
 assert.match(overview,/item\?\.executed===false/);
 assert.match(overview,/item\?\.verified===false/);
 assert.match(overview,/item\?\.source===source/);
 assert.match(overview,/nog niet uitgevoerd/);
 assert.match(overview,/Zelfgerapporteerd/);
 assert.match(overview,/bindPageButtons\(section\)/);
 assert.doesNotMatch(overview,/section\.innerHTML=.*bedrijfslekScan/);
});
