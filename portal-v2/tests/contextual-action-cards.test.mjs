import test from 'node:test';
import assert from 'node:assert/strict';
import {buildContextualActionCards,contextualCardsForPage,toRoadmapProposal,inventoryPortalCustomerFields} from '../contextual-action-cards.js';
import {functionalSchema} from '../modules/functional-suite.js';
import {fullCompanyInputSchema} from '../modules/full-company-input.js';
import {allPageIds} from '../page-registry.js';

const find=(state,id)=>buildContextualActionCards(state).find(card=>card.id===id);

test('MTO has actual survey result, participation, date and follow-up fields on customer input pages',()=>{
  const people=functionalSchema('mensen');
  const full=fullCompanyInputSchema();
  for(const path of ['portal.people.mto','portal.people.mtoScore','portal.people.mtoResponse','portal.people.mtoMeasuredAt','portal.people.mtoThemes','portal.people.mtoFollowup']){
    assert.ok(people.some(field=>field.path===path),'missing people field '+path);
    assert.ok(full.some(field=>field.path===path),'missing all-input field '+path);
  }
});

test('AI governance exposes accountable owner, preliminary risk assessment and human oversight',()=>{
  const ai=functionalSchema('data-ai'), full=fullCompanyInputSchema();
  for(const path of ['portal.dataAi.aiUse','portal.dataAi.aiPurpose','portal.dataAi.governanceOwner','portal.dataAi.aiRiskClass','portal.dataAi.aiHumanOversight','portal.dataAi.aiVendor','portal.dataAi.aiDataLocation','portal.dataAi.aiAssessmentDate']){
    assert.ok(ai.some(field=>field.path===path),'missing AI field '+path);
    assert.ok(full.some(field=>field.path===path),'missing all-input field '+path);
  }
});

test('registered form inventory retains exact canonical input paths and their native pages',()=>{
  const inventory=inventoryPortalCustomerFields();
  assert.ok(inventory.length>=70,'customer forms unexpectedly lost');
  const mto=inventory.find(item=>item.path==='portal.people.mtoScore');
  assert.ok(mto?.pages.includes('mensen'));
  assert.ok(mto?.pages.includes('gegevens-invullen'));
  assert.ok(inventory.every(row=>row.pages.every(page=>allPageIds().includes(page))));
});

test('low MTO result creates a P1 risk/action across relevant pages but no fictional cash benefit',()=>{
  const state={portal:{people:{mto:'3',mtoScore:4.4,mtoResponse:84,mtoMeasuredAt:'2026-10-01'}}};
  const impact=find(state,'mto-score');
  assert.equal(impact.priority,'P1');
  assert.equal(impact.sourcePath,'portal.people.mtoScore');
  assert.equal(impact.financialImpact.amount,null);
  assert.equal(impact.status,'PROPOSAL_REVIEW_REQUIRED');
  assert.ok(contextualCardsForPage('roadmap',state).some(item=>item.id==='mto-score'));
  assert.ok(contextualCardsForPage('mensen',state).some(item=>item.id==='mto-score'));
  assert.equal(find(state,'mto-results-missing'),undefined);
});

test('MTO recorded without results is an explicit data gap; low response is a review signal',()=>{
  const cards=buildContextualActionCards({portal:{people:{mto:'2',mtoResponse:38}}});
  assert.ok(cards.some(item=>item.id==='mto-results-missing'));
  assert.ok(cards.some(item=>item.id==='mto-response'));
  assert.ok(cards.every(item=>item.financialImpact.amount===null));
});

test('customer reported high-risk AI with no oversight surfaces cross-domain P1 review rather than claiming law violation',()=>{
  const state={portal:{dataAi:{aiUse:'ja',aiRiskClass:'hoog',aiPurpose:'Personeelsselectie',aiHumanOversight:false}}};
  const cards=buildContextualActionCards(state);
  assert.deepEqual(cards.filter(x=>x.priority==='P1').map(x=>x.id).sort(),['ai-oversight','ai-risk-review']);
  assert.ok(cards.some(x=>x.id==='ai-data-location'));
  const mapped=contextualCardsForPage('wet-regelgeving',state);
  assert.ok(mapped.some(x=>x.id==='ai-risk-review'));
  assert.ok(mapped.some(x=>x.id==='ai-oversight'));
  assert.equal(find(state,'ai-risk-review').status,'PROPOSAL_REVIEW_REQUIRED');
});

test('an unverified new regulation always requires applicability and source review',()=>{
  const state={portal:{regulatory:{events:[{id:'new-rule',title:'Nieuwe ketenregel',sourceUrl:'https://example.org',customerRelevance:'applicable',evidenceStatus:'VERIFIED'}]}}};
  const impact=find(state,'regulation-new-rule');
  assert.equal(impact.priority,'P2');
  assert.equal(impact.regulatoryEvidenceStatus,'SOURCE_REVIEW_REQUIRED');
  assert.ok(impact.pages.includes('csrd-impact'));
  assert.ok(impact.pages.includes('waarde-financiering'));
  assert.equal(impact.financialImpact.amount,null);
});

test('only a verified tenant-scoped canonical company-impact event is elevated, still not declared legally proven',()=>{
  const state={portal:{regulatory:{events:[{id:'rule2',title:'Sectorregel',authority:'source-universe-company-impact',tenantScoped:true,evidenceStatus:'VERIFIED',customerRelevance:'applicable'}]}}};
  const impact=find(state,'regulation-rule2');
  assert.equal(impact.priority,'P1');
  assert.equal(impact.status,'PROPOSAL_REVIEW_REQUIRED');
});

test('finance observations create review cards with explicit sensitivity, without invented euro benefits',()=>{
  const state={portal:{valueFinance:{equity:-200},metrics:{largestCustomer:42,dso:71}}};
  assert.deepEqual(buildContextualActionCards(state).map(x=>x.id),['negative-equity','cash-collection','customer-concentration']);
  assert.ok(buildContextualActionCards(state).every(x=>x.financialImpact.amount===null));
});

test('roadmap proposals are deterministic, prevent duplicate insertion and remain unconfirmed until user action',()=>{
  const entry=find({portal:{people:{mtoScore:4}}},'mto-score');
  const proposed=toRoadmapProposal(entry);
  assert.equal(proposed.sprint,1);
  assert.equal(proposed.status,'Voorgesteld');
  assert.equal(proposed.expected_value,null);
  assert.equal(toRoadmapProposal(entry,[proposed]),null);
  assert.equal(toRoadmapProposal(entry,[proposed]),null);
  assert.equal(entry.status,'PROPOSAL_REVIEW_REQUIRED');
});

test('empty customer dataset produces no spurious risks or legal conclusions',()=>{
  assert.deepEqual(buildContextualActionCards({}),[]);
});
