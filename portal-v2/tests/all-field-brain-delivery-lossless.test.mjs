import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createPortalDomainState} from '../domain-state.js';
import {allPageIds} from '../page-registry.js';
import {impactForMutation} from '../portal-impact-engine.js';

function harness(initial={portal:{profile:{}}},saver=async()=>({stored:true})){
 let stored=structuredClone(initial);
 const calls=[];
 const client={
  load:async()=>({mode:'authenticated',state:structuredClone(stored)}),
  write:async state=>({mode:'authenticated',state:stored=structuredClone(state)}),
  authHeaders:async()=>({authorization:'Bearer contract-test'}),
  isDemo:()=>false,
  currentUser:()=>({id:'test-user'})
 };
 const domain=createPortalDomainState(client,{
  legacyStorage:null,
  businessInputSaver:async input=>{calls.push(structuredClone(input));return saver(input,calls.length);}
 });
 return {domain,calls,current:()=>structuredClone(stored)};
}

test('all registered pages deliver causal input to the existing Brain boundary',async()=>{
 for(const page of allPageIds()){
  const {domain,calls}=harness();
  await domain.init();
  domain.set(`portal.${page}.customerChoice`,'set');
  await domain.flush();
  assert.equal(calls.length,1,`no Brain write for ${page}`);
  assert.equal(calls[0].metadata.causalImpacts.length,1,`no impact for ${page}`);
  assert.equal(calls[0].metadata.causalImpacts[0].sourcePage,page);
 }
});

test('more than fifty distinct field changes are not discarded before Brain acknowledgement',async()=>{
 const {domain,calls}=harness();
 await domain.init();
 for(let i=0;i<65;i++)domain.set(`portal.profile.answers.field${i}`,`value-${i}`);
 await domain.flush();
 assert.equal(calls.length,1);
 assert.equal(calls[0].metadata.causalImpacts.length,65);
 assert.equal(calls[0].answers.answers.field64,'value-64');
});

test('in-flight edits remain in the next causal cut rather than attaching to earlier snapshot',async()=>{
 let releaseFirst;
 const waitFirst=new Promise(resolve=>{releaseFirst=resolve});
 const {domain,calls}=harness({portal:{profile:{employees:20}}},async(input,count)=>{
  if(count===1)await waitFirst;
  return {stored:true,brainRecordId:`brain-${count}`};
 });
 await domain.init();
 domain.set('portal.profile.employees',25);
 const first=domain.flush();
 // The first Brain call is registered synchronously only after the state write.
 for(let attempts=0;calls.length===0&&attempts<12;attempts++)await Promise.resolve();
 assert.equal(calls.length,1);
 domain.set('portal.profile.employees',27);
 releaseFirst();
 await first;
 assert.equal(domain.status(),'dirty');
 assert.equal(calls[0].answers.employees,25);
 assert.equal(calls[0].metadata.causalImpacts.length,1);
 await domain.flush();
 assert.equal(calls.length,2);
 assert.equal(calls[1].answers.employees,27);
 assert.equal(calls[1].metadata.causalImpacts.length,1);
 assert.equal(calls[1].metadata.causalImpacts[0].path,'portal.profile.employees');
});

test('failed canonical acknowledgement preserves all field impacts for retry',async()=>{
 let attempts=0;
 const {domain,calls}=harness(undefined,async()=>({stored:++attempts>1}));
 await domain.init();
 for(let i=0;i<52;i++)domain.set(`portal.profile.flags.flag${i}`,true);
 await assert.rejects(domain.flush(),/CANONICAL_BUSINESS_INPUT_ACK_REQUIRED/);
 await domain.flush();
 assert.equal(calls.length,2);
 assert.equal(calls[1].metadata.causalImpacts.length,52);
});

test('unchanged customer fields do not produce redundant section-level impact revisions',async()=>{
 const {domain,calls}=harness({portal:{profile:{employees:20}}});
 await domain.init();
 domain.set('portal.profile.employees',20);
 await domain.flush();
 assert.equal(calls.length,0);
});

test('native finance and external-source changes mark cross-domain review without pretending verified outcomes',()=>{
 const cases=[
  ['cijfers-maatstaven',['finance','impact-economics'],['waarde-financiering','due-diligence','csrd-impact']],
  ['omgevingsradar',['external-intelligence','finance','csrd-esrs'],['mensen','businesscase','csrd-impact']],
  ['economie-branche-actueel',['external-intelligence'],['branche-markt','waarde-financiering']],
  ['arbeidsmarkt-personeel',['people'],['mensen','roadmap']]
 ];
 for(const [page,domains,pages] of cases){
  const before={portal:{[page]:{lastSourceRevision:'a'}}};
  const after={portal:{[page]:{lastSourceRevision:'b'}}};
  const impact=impactForMutation({path:`portal.${page}.lastSourceRevision`,before,after});
  assert.equal(impact.changed,true,page);
  assert.equal(impact.mappingStatus,'MAPPED',page);
  for(const domain of domains)assert.ok(impact.reviewDomains.includes(domain),`${page} -> ${domain}`);
  for(const destination of pages)assert.ok(impact.affectedPages.includes(destination),`${page} -> ${destination}`);
  assert.equal(impact.externalExecutionAuthorized,false);
  assert.equal(impact.evidenceStatus,'OBSERVED_NOT_VERIFIED');
 }
});

test('customer page shell exposes impacted pages without mislabelling pending Brain write as confirmed',async()=>{
 const shell=await readFile(new URL('../page-shell.js',import.meta.url),'utf8');
 assert.match(shell,/id="pvImpactMap"/);
 assert.match(shell,/data-impact-target/);
 assert.match(shell,/bg:portal-brain-pending/);
 assert.match(shell,/bg:portal-brain-synced/);
 assert.match(shell,/Wijziging — verwerking nog te bevestigen/);
 assert.match(shell,/Opgeslagen in het bedrijfsbrein/);
 assert.match(shell,/Niet alle gevolgen zijn al bewezen/);
});
