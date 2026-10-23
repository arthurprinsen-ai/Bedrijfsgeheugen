import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveLearningTelemetry, agentIntelligenceMarkup } from '../portal-v2/modules/agent-intelligence-analytics.js';

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
