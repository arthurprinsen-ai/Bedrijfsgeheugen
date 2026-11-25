import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPortalDomainState} from '../portal-v2/domain-state.js';
import {normalizeFieldValue} from '../portal-v2/form-primitives.js';

const read=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const RULE='portal|v2|production-input-causal-truth-agent-skill-borging|20261111-v1';

test('AGENTS and original three Portal / Brain / Company Intelligence skills enforce one evidence contract',async()=>{
 const [agents,portal,continuity,intelligence]=await Promise.all([
  read('AGENTS.md'),
  read('.agents/skills/portal-living-interface/SKILL.md'),
  read('.agents/skills/powerhouse-continuity/SKILL.md'),
  read('.agents/skills/powerhouse-company-intelligence-os/SKILL.md')
 ]);
 assert.ok(agents.includes(RULE),'AGENTS exact canonical incident fingerprint');
 for(const [name,doc] of [['AGENTS',agents],['portal',portal],['continuity',continuity],['intelligence',intelligence]]){
  assert.match(doc,/#4215/,name+' original P0 owner');
  assert.match(doc,/8e291bf3493fdb87d052712e97c5a8126984a3fd/,name+' exact deployed source');
  assert.match(doc,/6af411b8d9fee5cd23a504b1/,name+' exact Netlify provider receipt');
  assert.match(doc,/42975963909/,name+' independent live original browser evidence');
  assert.match(doc,/(?:demo|Demo).*?(?:Brain|ONE BRAIN)/s,name+' demo cannot claim customer Brain receipt');
  assert.match(doc,/(?:ACK|provider-ID|providerrecord)/,name+' original receipt requirement');
  assert.match(doc,/(?:EVIDENCE_DUE|OPEN)/,name+' unresolved authenticated customer completion');
  assert.match(doc,/(?:tenant|Tenant)/,name+' tenant separation');
 }
 assert.match(portal,/null/);
 assert.match(portal,/gatedOpenPage/);
 assert.match(continuity,/PORTAL_BRAIN_REPLAY_SOURCE_CONFLICT/);
 assert.match(intelligence,/afhankelijke/);
 assert.doesNotMatch(portal,/alle.*klant.*(?:volledig.*groen|bewezen werkend)/i);
});

test('explicit 0 stays real, empty numeric answers become unknown',()=>{
 for(const type of ['number','currency','percentage']) {
  assert.equal(normalizeFieldValue({type},'0'),0,type);
  assert.equal(normalizeFieldValue({type},''),null,type);
 }
});

test('demo never writes Brain pending receipt; true authenticated tenant still requires ACK',async()=>{
 let ephemeral={portal:{metrics:{revenue:0}}};
 let demoPosts=0;
 const demo=createPortalDomainState({
  load:async()=>({mode:'authenticated',state:structuredClone(ephemeral)}),
  write:async v=>({mode:'authenticated',state:ephemeral=structuredClone(v)}),
  isDemo:()=>true,currentUser:()=>({id:'demo'}),
  authHeaders:async()=>({accept:'application/json'})
 },{legacyStorage:null,businessInputSaver:async()=>{demoPosts++;return{stored:true}}});
 await demo.init();demo.set('portal.metrics.revenue',0);demo.set('portal.metrics.revenue',null);
 assert.equal(demo.pendingHandoffs().pending,false);
 await demo.flush();
 assert.equal(demoPosts,0);

 let source={portal:{metrics:{revenue:4}}};
 const real=createPortalDomainState({
  load:async()=>({mode:'authenticated',state:structuredClone(source)}),
  write:async v=>({mode:'authenticated',state:source=structuredClone(v)}),
  isDemo:()=>false,currentUser:()=>({id:'tenant-test'}),
  authHeaders:async()=>({authorization:'Bearer test'})
 },{legacyStorage:null,businessInputSaver:async()=>({stored:false})});
 await real.init();
 real.set('portal.metrics.revenue',5);
 assert.equal(real.pendingHandoffs().pending,true);
 await assert.rejects(real.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 assert.equal(real.pendingHandoffs().pending,true);
});
