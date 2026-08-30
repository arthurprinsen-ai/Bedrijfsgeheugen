import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const runtime=await readFile(new URL('../portal/legacy-runtime.mjs',import.meta.url),'utf8');
const app=await readFile(new URL('../portal/app.mjs',import.meta.url),'utf8');
let offerState=null,renderOffer=null;
try{offerState=await import('../portal/offer-state.mjs')}catch{}
try{({renderOffer}=await import('../portal/render-offer.mjs'))}catch{}

function storageWith(value){return{getItem:key=>key==='bg_klant_acme'?value:null}}
const offer={naam:'Acme BV',titel:'Dashboard en automatisering',geldig:'30 september 2026',emails:['directie@acme.nl'],onderdelen:[{id:'basis',vast:true,prijs:3900,titel:'Basis',kort:'Werkend fundament',sprints:[{titel:'Sprint 1',wat:'Bronnen aansluiten',op:'Werkende bron'}],koppelingen:[{naam:'Exact Online',wat:'Financiële bron',week:1}],documenten:[{naam:'Definitielijst',week:1}]}]};

test('offerte bypasses the iframe bridge only through the native read-only renderer',()=>{
 assert.match(runtime,/['\"]offerte['\"]/);
 assert.match(app,/renderOffer/);
 assert.match(app,/readLegacyOffer/);
 assert.match(app,/admin\/legacy\/offerte/);
});

test('legacy offer reader is identity scoped and fails closed',()=>{
 assert.equal(typeof offerState?.readLegacyOffer,'function');
 const raw=JSON.stringify(offer);
 const ok=offerState.readLegacyOffer({storage:storageWith(raw),slug:'acme',user:{email:'DIRECTIE@ACME.NL'}});
 assert.equal(ok?.naam,'Acme BV');
 assert.equal(ok?.onderdelen?.length,1);
 assert.equal(offerState.readLegacyOffer({storage:storageWith(raw),slug:'acme',user:{email:'ander@acme.nl'}}),null);
 assert.equal(offerState.readLegacyOffer({storage:storageWith('{oops'),slug:'acme',user:{email:'directie@acme.nl'}}),null);
 assert.equal(offerState.readLegacyOffer({storage:storageWith(JSON.stringify({naam:'Acme'})),slug:'acme',user:{email:'directie@acme.nl'}}),null);
});

test('native offer renderer shows scope, price and historical signed state without creating acceptance controls',()=>{
 assert.equal(typeof renderOffer,'function');
 const html=renderOffer({...offer,getekend:{naam:'Sanne de Vries',functie:'directeur',datum:'2026-07-24'}});
 assert.match(html,/Offerte/);
 assert.match(html,/Acme BV/);
 assert.match(html,/Basis/);
 assert.match(html,/3\.900|3900/);
 assert.match(html,/Sanne de Vries/);
 assert.match(html,/alleen-lezen|read-only|bestaand akkoord/i);
 assert.match(html,/BLOCKED_HARD_BOUNDARY|menselijke bevestiging/i);
});

test('native offer renderer contains no binding or external write path',async()=>{
 const source=await readFile(new URL('../portal/render-offer.mjs',import.meta.url),'utf8').catch(()=> '');
 assert.doesNotMatch(source,/fetch\s*\(/);
 assert.doesNotMatch(source,/hook\.eu1\.make\.com/i);
 assert.doesNotMatch(source,/data-portal-action=["'][^"']*(accept|agree|sign|akkoord|onderteken)/i);
 assert.doesNotMatch(source,/method\s*:\s*["']POST["']/i);
});
