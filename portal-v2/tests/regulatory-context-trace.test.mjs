import test from 'node:test';
import assert from 'node:assert/strict';
import {regulatoryContextTrace} from '../regulatory-context-trace.js';
import {buildContextualActionCards,contextualCardsForPage,inventoryPortalCustomerFields,toRoadmapProposal} from '../contextual-action-cards.js';
import {allPageIds} from '../page-registry.js';

const law=event=>buildContextualActionCards({portal:{regulatory:{events:[event]}}}).find(card=>card.id==='regulation-'+event.id);

test('verified AI Act signal shows affected AI, model, supplier, financial review and roadmap pages',()=>{
 const event={id:'ai-update',title:'Wijziging AI Act',framework:'EU_AI_ACT',sourceUrl:'https://eur-lex.europa.eu/',
   effectiveDate:'2026-08-02',authority:'source-universe-company-impact',tenantScoped:true,
   evidenceStatus:'VERIFIED',customerRelevance:'applicable'};
 const card=law(event);
 assert.equal(card.priority,'P1');
 assert.equal(card.regulatoryImpact.legalStatus,'REVIEW_REQUIRED');
 assert.equal(card.financialImpact.amount,null);
 assert.ok(card.pages.includes('eu-ai-act-audit'));
 assert.ok(card.pages.includes('data-ai'));
 assert.ok(card.pages.includes('ai-capabilities'));
 assert.ok(card.pages.includes('koppelingen'));
 assert.ok(card.pages.includes('waarde-financiering'));
 assert.ok(card.pages.includes('roadmap'));
 assert.ok(!card.pages.includes('csrd-impact'),'unrelated CSRD page must not be a named AI dependency');
 assert.ok(card.regulatoryImpact.impactByPage.some(row=>row.page==='ai-capabilities'&&row.via.includes('ai')));
 assert.ok(contextualCardsForPage('waarde-financiering',{portal:{regulatory:{events:[event]}}}).some(row=>row.id==='regulation-ai-update'));
 assert.equal(toRoadmapProposal(card).status,'Voorgesteld');
 assert.equal(toRoadmapProposal(card).expected_value,null);
});
test('CSRD event routes to sustainability, finance, sources and due diligence but not a legal attestation',()=>{
 const card=law({id:'csrd',title:'Wijziging duurzaamheidsregels',framework:'CSRD',sourceUrl:'https://eur-lex.europa.eu/'});
 assert.equal(card.priority,'P2');
 assert.equal(card.regulatoryEvidenceStatus,'SOURCE_REVIEW_REQUIRED');
 assert.equal(card.regulatoryImpact.customerRelevance,'APPLICABILITY_REVIEW_REQUIRED');
 assert.equal(card.regulatoryImpact.effectiveDate,null);
 assert.ok(card.regulatoryImpact.missingEvidence.some(x=>x.includes('Ingangsdatum')));
 for(const page of ['csrd-impact','bronnenbibliotheek','waarde-financiering','businesscase','due-diligence','roadmap'])
   assert.ok(card.pages.includes(page),page);
 assert.ok(!card.pages.includes('eu-ai-act-audit'));
});
test('NIS2/CBW and GDPR have distinct domain-specific page footprints',()=>{
 const cyber=regulatoryContextTrace({framework:'NIS2 / Cbw'});
 const privacy=regulatoryContextTrace({framework:'GDPR'});
 assert.ok(cyber.affectedPages.includes('herstel-continuiteit'));
 assert.ok(cyber.affectedPages.includes('datahubstatus'));
 assert.ok(privacy.affectedPages.includes('data-ai-passport'));
 assert.ok(privacy.affectedPages.includes('documenten'));
 assert.ok(!privacy.affectedPages.includes('herstel-continuiteit'));
});
test('unknown new regulation receives conservative generic review without claiming a specific model effect',()=>{
 const card=law({id:'unknown',title:'Nieuwe ketenregel',customerRelevance:'applicable',evidenceStatus:'VERIFIED'});
 assert.equal(card.priority,'P2');
 assert.equal(card.regulatoryImpact.domainLabels.length,0);
 assert.ok(card.pages.includes('csrd-impact'));
 assert.ok(card.pages.includes('waarde-financiering'));
 assert.ok(card.regulatoryImpact.missingEvidence.some(x=>x.includes('domeinmapping')));
 assert.equal(card.regulatoryImpact.financialStatus,'NOT_QUANTIFIED');
 assert.ok(card.pages.every(page=>allPageIds().includes(page)));
});
test('provider/source-only flags cannot escalate priority or create a false customer applicability fact',()=>{
 for(const event of [
  {id:'a',framework:'EU_AI_ACT',authority:'source-universe-company-impact',tenantScoped:false,evidenceStatus:'VERIFIED',customerRelevance:'applicable'},
  {id:'b',framework:'EU_AI_ACT',authority:'unverified',tenantScoped:true,evidenceStatus:'VERIFIED',customerRelevance:'applicable'},
  {id:'c',framework:'EU_AI_ACT',authority:'source-universe-company-impact',tenantScoped:true,evidenceStatus:'PENDING',customerRelevance:'applicable'}
 ]){
  const card=law(event);
  assert.equal(card.priority,'P2');
  assert.equal(card.regulatoryImpact.legalStatus,'REVIEW_REQUIRED');
  assert.equal(card.financialImpact.status,'NOT_QUANTIFIED');
 }
});
test('native form inventory is explicitly declaration-only and includes model/page footprints',()=>{
 const inventory=inventoryPortalCustomerFields();
 assert.ok(inventory.length>=70);
 assert.ok(inventory.some(field=>field.path==='portal.metrics.dso'&&field.affectedPages.includes('waarde-financiering')));
 assert.ok(inventory.some(field=>field.path==='portal.people.mtoScore'&&field.affectedPages.includes('roadmap')));
 assert.ok(inventory.some(field=>field.path==='portal.dataAi.aiRiskClass'&&field.affectedPages.includes('compliance-governance')));
 assert.ok(inventory.every(field=>field.declarationOnly===true&&field.readbackStatus==='TENANT_ACK_REQUIRED'));
});
