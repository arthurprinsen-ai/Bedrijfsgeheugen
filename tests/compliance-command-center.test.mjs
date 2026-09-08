import test from 'node:test';
import assert from 'node:assert/strict';

import {
  canonicalFramework,
  evaluateControl,
  evaluatePortfolio,
  rankRisks,
  createAuditSnapshot
} from '../portal-next/compliance-engine.js';
import { COMPLIANCE_CONTROL_TEMPLATES } from '../portal-next/compliance-registry.js';
import { buildCustomerControls, buildBedrijfsgeheugenControls, deriveLegacyPortalComplianceInput } from '../portal-next/compliance-input-adapter.js';
import { COMPLIANCE_WORKSPACE_SECTIONS, buildComplianceCommandCenterMarkup } from '../portal-next/compliance-command-center.js';

const NOW = new Date('2026-09-08T12:00:00Z');
function baseControl(overrides = {}) { return { id:'CTRL-1',framework:'EU_AI_ACT',requirement:'Test requirement',applicability:'applicable',control:{implemented:true},evidence:[{id:'EV-1',label:'Evidence',verified:true}],severity:'medium',owner:'Governance',reason:'Required for test',nextAction:'Maintain evidence',sourceKeys:[],verifiedAt:'2026-09-08T10:00:00Z',...overrides }; }

test('VERIFIED requires both current evidence and verifiedAt',()=>{ assert.equal(evaluateControl(baseControl(),{now:NOW}).status,'VERIFIED');assert.equal(evaluateControl(baseControl({evidence:[]}),{now:NOW}).status,'EVIDENCE_MISSING');assert.equal(evaluateControl(baseControl({verifiedAt:null}),{now:NOW}).status,'EVIDENCE_MISSING'); });
test('unknown applicability remains UNKNOWN instead of false non-compliance',()=>{assert.equal(evaluateControl(baseControl({applicability:'unknown',control:null,evidence:[],verifiedAt:null}),{now:NOW}).status,'UNKNOWN');});
test('legacy NIS and Wbni map to NIS2/Cbw for aggregation',()=>{assert.equal(canonicalFramework('NIS'),'NIS2_CBW');assert.equal(canonicalFramework('WBNI'),'NIS2_CBW');assert.equal(canonicalFramework('NIS2_CBW'),'NIS2_CBW');});
test('portfolio does not double-count the same legacy/canonical requirement',()=>{const result=evaluatePortfolio([baseControl({id:'NIS-RISK',framework:'NIS',requirement:'Risk management'}),baseControl({id:'NIS-RISK',framework:'NIS2_CBW',requirement:'Risk management'})],{now:NOW,scope:'customer'});assert.equal(result.controls.length,1);assert.equal(result.frameworks.NIS2_CBW.total,1);});
test('risk ranking prioritises critical missing controls before low evidence gaps',()=>{const ranked=rankRisks([baseControl({id:'CRIT',severity:'critical',control:null,evidence:[],verifiedAt:null}),baseControl({id:'LOW',severity:'low',evidence:[],verifiedAt:null})],{now:NOW});assert.deepEqual(ranked.map(item=>item.id),['CRIT','LOW']);});
test('audit snapshot contains scope timestamp framework status findings and evidence index',()=>{const snapshot=createAuditSnapshot([baseControl(),baseControl({id:'MISS',severity:'high',control:null,evidence:[],verifiedAt:null,nextAction:'Implement control'})],{now:NOW,scope:'bedrijfsgeheugen'});assert.equal(snapshot.scope,'bedrijfsgeheugen');assert.equal(snapshot.timestamp,NOW.toISOString());assert.ok(snapshot.frameworks.EU_AI_ACT);assert.ok(snapshot.findings.some(item=>item.id==='MISS'));assert.ok(snapshot.evidenceIndex.some(item=>item.controlId==='CTRL-1'));});
test('canonical registry covers AI Act, NIS2/Cbw and data/privacy without legacy double score',()=>{assert.ok(COMPLIANCE_CONTROL_TEMPLATES.some(item=>item.framework==='EU_AI_ACT'));assert.ok(COMPLIANCE_CONTROL_TEMPLATES.some(item=>item.framework==='NIS2_CBW'));assert.ok(COMPLIANCE_CONTROL_TEMPLATES.some(item=>item.framework==='GDPR_DATA'));assert.equal(COMPLIANCE_CONTROL_TEMPLATES.some(item=>item.framework==='NIS'),false);});
test('missing customer input creates UNKNOWN with reason and one concrete next action',()=>{const controls=buildCustomerControls({});const aiInventory=controls.find(item=>item.id==='AI-INVENTORY');assert.equal(aiInventory.applicability,'unknown');assert.match(aiInventory.reason,/niet|onbekend/i);assert.ok(aiInventory.nextAction.length>12);assert.equal(evaluateControl(aiInventory,{now:NOW}).status,'UNKNOWN');});
test('customer answers can establish applicability but never manufacture evidence',()=>{const controls=buildCustomerControls({usesAI:true,aiInventoryPresent:true});const aiInventory=controls.find(item=>item.id==='AI-INVENTORY');assert.equal(aiInventory.applicability,'applicable');assert.equal(aiInventory.control.implemented,true);assert.deepEqual(aiInventory.evidence,[]);assert.equal(evaluateControl(aiInventory,{now:NOW}).status,'EVIDENCE_MISSING');});
test('Bedrijfsgeheugen projection stays fail-closed without legal scope or evidence',()=>{const controls=buildBedrijfsgeheugenControls({});assert.ok(controls.every(item=>item.applicability==='unknown'||item.applicability==='not_applicable'));assert.equal(evaluatePortfolio(controls,{now:NOW,scope:'bedrijfsgeheugen'}).coverage,null);});

test('legacy portal policy answers are reused without turning them into evidence',()=>{
  const input=deriveLegacyPortalComplianceInput({beleid:{aibeleid:2,toegang:3,incident:2,backup:3,continu:3,leverancier:2,verwerker:2,avg:2}});
  assert.equal(input.humanOversight,true);
  assert.equal(input.accessControls,true);
  assert.equal(input.incidentProcess,true);
  assert.equal(input.continuityTested,true);
  assert.equal(input.supplierSecurity,true);
  assert.equal(input.processesPersonalData,true);
  assert.equal(input.processingRegister,true);
  assert.equal(input.nis2Applicable,undefined);
  assert.equal(input.usesAI,undefined);
  assert.deepEqual(input.complianceEvidence,{});
});

test('command center exposes all five workspace layers',()=>{assert.deepEqual(COMPLIANCE_WORKSPACE_SECTIONS,['executive-pulse','compliance-constellation','control-matrix','remediation-flightplan','audit-room']);const markup=buildComplianceCommandCenterMarkup({controls:buildCustomerControls({}),scope:'customer',now:NOW});for(const id of COMPLIANCE_WORKSPACE_SECTIONS)assert.match(markup,new RegExp(`data-compliance-section=["']${id}["']`));assert.match(markup,/Waarom nu\?/);assert.match(markup,/EU AI Act/);assert.match(markup,/NIS2 \/ Cbw/);assert.match(markup,/Audit Room/);});
test('command center markup offers both self and customer perspectives plus print audit action',()=>{const markup=buildComplianceCommandCenterMarkup({controls:buildCustomerControls({}),scope:'customer',now:NOW});assert.match(markup,/Bedrijfsgeheugen/);assert.match(markup,/Uw organisatie/);assert.match(markup,/data-compliance-print/);assert.match(markup,/accountant|auditor/i);});
