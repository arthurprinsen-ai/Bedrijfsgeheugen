import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveLearningTelemetry, agentIntelligenceMarkup, deriveQualityReport, qualityReportMarkup } from '../portal-v2/modules/agent-intelligence-analytics.js';

const now=Date.parse('2026-10-23T11:00:00Z');
const events=[
 {id:'a',occurredAt:'2026-10-22T10:00:00Z',source:'GitHub',layer:'GitHub / Delivery',title:'CI failed',status:'FAILED',category:'delivery'},
 {id:'b',occurredAt:'2026-10-22T11:00:00Z',source:'Notion',layer:'Notion / Documentatie',title:'Learning saved',status:'OBSERVED',category:'knowledge'},
 {id:'b',occurredAt:'2026-10-22T11:00:00Z',source:'Notion',layer:'Notion / Documentatie',title:'Learning saved',status:'OBSERVED',category:'knowledge'},
 {id:'old',occurredAt:'2026-09-20T11:00:00Z',source:'Netlify',status:'SUCCESS',category:'delivery'},
 {id:'undated',occurredAt:'nonsense',source:'Supabase',status:'SUCCESS',category:'knowledge'}
];

test('daily chart counts are deduplicated and bounded to observed UTC dates',()=>{
 const m=deriveLearningTelemetry({events,now,days:7});
 assert.equal(m.observed,2);
 assert.equal(m.failures,1);
 assert.equal(m.learningSignals,1);
 assert.equal(m.undated,1);
 assert.equal(m.days.length,7);
 assert.equal(m.days.find(x=>x.day==='2026-10-22').observed,2);
 assert.equal(m.sourceRows.find(x=>x.id==='github').observations,1);
 assert.equal(m.sourceRows.find(x=>x.id==='notion').observations,1);
 assert.equal(m.sourceRows.find(x=>x.id==='netlify').observations,0);
});

test('only explicitly proven and production-verified knowledge counts, with URL allowlist',()=>{
 const runtime={learning:{items:[
  {naam:'Safe',maturity:'PROVEN',productionVerified:true,proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/22'},
  {naam:'No readback',maturity:'PROVEN',productionVerified:false,proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/23'},
  {naam:'Fake link',maturity:'PROVEN',productionVerified:true,proofRef:'javascript:alert(1)'},
  {naam:'Proposal',maturity:'CANDIDATE',productionVerified:true,proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/24'}
 ]}};
 const result=deriveLearningTelemetry({events,now,runtime});
 assert.equal(result.verifiedMemories,1);
 const markup=agentIntelligenceMarkup({events,now,runtime});
 assert.match(markup,/Safe/);
 assert.ok(markup.includes('href="https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/22"'), 'exact allowlisted HTTPS proof href must be rendered');
 assert.doesNotMatch(markup,/javascript:alert/);
 assert.match(markup,/Niet onafhankelijk als productieverbetering aangetoond/);
});

test('empty runtime remains zero observations and no invented result',()=>{
 const m=deriveLearningTelemetry({events:[],runtime:{},now});
 assert.equal(m.observed,0);
 assert.equal(m.verifiedMemories,0);
 const markup=agentIntelligenceMarkup({events:[],runtime:{},now});
 assert.match(markup,/geen volledig historisch meetarchief/i);
 assert.match(markup,/Geen bronbewijs in geladen selectie/);
 assert.doesNotMatch(markup,/100% geslaagd|alles groen/i);
});

test('raw learning titles are HTML escaped',()=>{
 const markup=agentIntelligenceMarkup({events:[],now,runtime:{learning:{items:[
  {naam:'<img src=x onerror=alert(1)>',maturity:'CANDIDATE'}
 ]}}});
 assert.doesNotMatch(markup,/<img src=x/);
 assert.match(markup,/&lt;img/);
});


test('future or out-of-period observations cannot inflate measured learning',()=>{
 const future={id:'future',occurredAt:'2026-10-23T13:30:00Z',source:'GitHub',
  layer:'GitHub / Delivery',title:'Unobserved success',status:'SUCCESS',category:'knowledge'};
 const outside={id:'prior',occurredAt:'2026-10-15T00:00:00Z',source:'Notion',
  layer:'Notion / Documentatie',title:'Prior result',status:'SUCCESS',category:'knowledge'};
 const result=deriveLearningTelemetry({events:[future,outside],days:7,now});
 assert.equal(result.observed,0);
 assert.equal(result.learningSignals,0);
 assert.equal(result.sourceRows.filter(row=>row.observations).length,0);
});


test('quality report is fail-closed for missing evidence and does not fabricate DORA scores',()=>{
 const report=deriveQualityReport({events:[],runtime:{},now});
 assert.equal(report.observedEvents,0);
 assert.equal(report.verifiedCustomerOutcomes,0);
 assert.equal(report.rows.find(x=>x.id==='delivery').status,'ONBEKEND');
 assert.equal(report.rows.find(x=>x.id==='outcomes').status,'NIET BEWEZEN');
 const html=qualityReportMarkup({events:[],runtime:{},now});
 assert.match(html,/KWALITEITSRAPPORT/);
 assert.match(html,/NIET BEWEZEN/);
 assert.doesNotMatch(html,/100% geslaagd|€100.000 gerealiseerd|alles groen/);
});

test('quality report deduplicates incidents and never equates CI events to production',()=>{
 const report=deriveQualityReport({events,now});
 assert.equal(report.observedEvents,2);
 assert.equal(report.failures,1);
 assert.equal(report.rows.find(x=>x.id==='delivery').status,'AANDACHT');
 assert.equal(report.rows.find(x=>x.id==='incidents').count,1);
 assert.equal(report.rows.find(x=>x.id==='outcomes').count,0);
});

test('customer outcomes require unique tenant, production and learning evidence',()=>{
 const runtime={customerOutcomes:{items:[
   {outcomeId:'x',tenantVerified:true,productionVerified:true,learningVerified:true,
    proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4747',
    learningProofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198',
    verificationStatus:'VERIFIED'},
   {outcomeId:'x',tenantVerified:true,productionVerified:true,learningVerified:true,
    proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4747',
    learningProofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198',
    verificationStatus:'VERIFIED'},
   {outcomeId:'y',tenantVerified:true,productionVerified:false,learningVerified:true,
    proofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4747',
    learningProofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198',
    verificationStatus:'VERIFIED'},
   {outcomeId:'z',tenantVerified:true,productionVerified:true,learningVerified:true,
    proofRef:'javascript:alert(1)',learningProofRef:'https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198',
    verificationStatus:'VERIFIED'}
 ]}};
 const report=deriveQualityReport({runtime,now});
 assert.equal(report.verifiedCustomerOutcomes,1);
 assert.equal(report.rows.find(x=>x.id==='outcomes').status,'BEWIJS GEKOPPELD');
});

test('trace ID observation is not a trace grade and markup escapes risky content',()=>{
 const report=deriveQualityReport({events:[{id:'t',occurredAt:'2026-10-23T10:00:00Z',
   traceId:'<script>alert(1)</script>',source:'GitHub',status:'SUCCESS'}],now});
 assert.equal(report.rows.find(x=>x.id==='agents').status,'TRACE WAARGENOMEN');
 const markup=qualityReportMarkup({events:[{id:'t',occurredAt:'2026-10-23T10:00:00Z',
   traceId:'<script>alert(1)</script>',source:'GitHub',status:'SUCCESS'}],now});
 assert.equal(markup.includes('alert(1)'),false,'untrusted trace payload must never be reflected in report HTML');
 assert.match(markup,/geen onafhankelijke trace-grade/);
});
