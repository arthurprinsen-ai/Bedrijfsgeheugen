import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {signalFollowUp,intelligenceSignalCard} from '../modules/entrepreneur-intelligence.js';

const recent=new Date(Date.now()-86400000).toISOString();
const sample={signal_key:'sig:verified',domain_key:'market',title:'Subsidiedeadline vraagt toetsing',summary:'Externe bronwaarneming',published_at:recent,observed_at:recent,impact_status:'SCORED',signal_score:80,impact_score:74,external_url:'https://www.rvo.nl/onderwerpen'};
const tenant={signal_key:'sig:verified',projection_scope:'TENANT',title:'Controleer actuele subsidieregels',canonical_action_ref:'tenant-activity:42',status:'READY'};
const generic={signal_key:'sig:verified',projection_scope:'CANONICAL_REVIEW',title:'Algemene marktreview',canonical_action_ref:'canonical:not-tenant'};
const domain=new Map([['market',{label:'Markt & subsidies'}]]);

test('exact tenant linked action is visible and routable, without fabricating completed outcome',()=>{
  const result=signalFollowUp(sample,[generic,tenant]);
  assert.equal(result.state,'EXISTING_ACTION');
  assert.equal(result.action,tenant);
  assert.equal(result.canOpen,true);
  const html=intelligenceSignalCard(sample,domain,[generic,tenant]);
  assert.match(html,/Wat kun je nu doen\?/);
  assert.match(html,/data-open-page="actieve-acties"/);
  assert.match(html,/Bekijk toegewezen actie/);
  assert.match(html,/https:\/\/www\.rvo\.nl\/onderwerpen/);
  assert.doesNotMatch(html,/LIVE_PROVEN|uitgevoerd|betaalde order/);
});

test('generic suggestion is a context review, not a tenant-mapped executable action',()=>{
  const onlyGeneric=signalFollowUp({...sample,impact_status:'NEEDS_COMPANY_CONTEXT'},[generic]);
  assert.equal(onlyGeneric.state,'CONTEXT_REVIEW_REQUIRED');
  assert.equal(onlyGeneric.canOpen,false);
  const html=intelligenceSignalCard({...sample,impact_status:'NEEDS_COMPANY_CONTEXT'},domain,[generic]);
  assert.doesNotMatch(html,/data-open-page="actieve-acties"/);
  assert.match(html,/Controleer of dit algemene voorstel/);
});

test('stale sources and past deadlines cannot silently become current customer advice',()=>{
  for(const signal of [
    {...sample,published_at:'2020-01-01T00:00:00Z'},
    {...sample,published_at:null},
    {...sample,deadline:'2020-01-01'},
    {...sample,observed_at:'2020-01-01T00:00:00Z'}
  ]){
    const result=signalFollowUp(signal,[tenant]);
    assert.equal(result.state,'SOURCE_RECHECK_REQUIRED');
    assert.equal(result.canOpen,false);
  }
});

test('untrusted source links are not executable navigation',()=>{
  const html=intelligenceSignalCard({...sample,external_url:'javascript:alert(1)'},domain,[tenant]);
  assert.doesNotMatch(html,/href="javascript:/);
});

test('existing Portal V2 action navigation binds both source cards and action shortlist buttons',()=>{
  const source=readFileSync(new URL('../modules/entrepreneur-intelligence.js',import.meta.url),'utf8');
  assert.match(source,/root\.querySelectorAll\('\[data-open-page\]'\)/);
  assert.match(source,/btn\.dataset\.openPage/);
  assert.match(source,/intelligenceSignalCard\(x,domainMap,actions\)/);
});
