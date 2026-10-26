import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {signalDecision,verifiedExternalUrl} from '../portal-v2/modules/external-signal-decisions.js';

const now=Date.parse('2026-10-25T08:00:00Z');
const signal={
 signal_key:'signal:regulatory:1',external_url:'https://www.rvo.nl/subsidies-financiering/example',
 domain_key:'subsidies-tax',title:'Nieuwe subsidieregeling',source_confidence:.9,
 published_at:'2026-10-24T06:00:00Z',observed_at:'2026-10-25T06:00:00Z',
 deadline:'2026-11-15',impact_status:'SCORED',
 company_impacts:[{status:'SCORED',impact_score:82,target_label:'Eigen bedrijf',
   rationale:'Deze regeling raakt jouw opgegeven investeringsdoel.'}]
};
const action={
 signal_key:signal.signal_key,tenant_specific:true,status:'MATERIALIZED',
 canonical_action_ref:'tenant-action:42',title:'Check subsidievoorwaarden',priority_score:90
};

test('an actually assessed customer signal provides why, next step and verified source',()=>{
 const result=signalDecision(signal,[action],{now});
 assert.equal(result.relevantToCompany,true);
 assert.equal(result.executable,true);
 assert.match(result.reason,/opgegeven investeringsdoel/);
 assert.match(result.nextStep,/gekoppelde bedrijfsactie/);
 assert.equal(result.sourceUrl,signal.external_url);
 assert.equal(result.sourceStatus,'BRON_GEOBSERVEERD');
 assert.equal(result.companyLabel,'Eigen bedrijf');
});

test('market-wide news never turns into proved company exposure or an executable order',()=>{
 const generic={...signal,impact_status:'NEEDS_COMPANY_CONTEXT',company_impacts:[]};
 const candidate={...action,tenant_specific:false,status:'CANDIDATE',canonical_action_ref:null};
 const result=signalDecision(generic,[candidate],{now});
 assert.equal(result.relevantToCompany,false);
 assert.equal(result.executable,false);
 assert.match(result.reason,/nog niet bewezen/);
 assert.match(result.nextStep,/branche, doelen of klanten/);
});

test('past application deadline overrides high impact and existing materialized action',()=>{
 const old={...signal,deadline:'2026-10-06'};
 const result=signalDecision(old,[action],{now});
 assert.equal(result.deadlineExpired,true);
 assert.equal(result.executable,false);
 assert.match(result.nextStep,/Deadline verstreken/);
 assert.doesNotMatch(result.nextStep,/Aanvraag indienen/);
});

test('stale articles and unknown publication dates are not asserted fresh',()=>{
 const old=signalDecision({...signal,published_at:'2026-06-01T10:00:00Z'},[action],{now});
 assert.equal(old.stale,true);
 assert.equal(old.executable,false);
 assert.match(old.nextStep,/Verifieer publicatiedatum/);
 const noDate=signalDecision({...signal,published_at:null},[action],{now});
 assert.equal(noDate.verifiedSource,false);
 assert.equal(noDate.publishedAt,null);
 assert.equal(noDate.executable,false);
 const future=signalDecision({...signal,published_at:'2026-11-01T10:00:00Z'},[action],{now});
 assert.equal(future.verifiedSource,false);
 assert.equal(future.executable,false);
});

test('untrusted external URLs cannot inject javascript or private browser targets',()=>{
 for(const url of ['javascript:alert(1)','http://www.rvo.nl','https://user:pass@rvo.nl','https://localhost:444',
   'https://127.0.0.1/admin','data:text/html,hello','not a url']){
   assert.equal(verifiedExternalUrl(url),null,url);
   assert.equal(signalDecision({...signal,external_url:url},[action],{now}).executable,false);
 }
 assert.equal(verifiedExternalUrl('https://www.rvo.nl/test'),'https://www.rvo.nl/test');
});

test('portal cards must show customer relevance and action; their open-page control must work',async()=>{
 const src=await readFile(new URL('../portal-v2/modules/entrepreneur-intelligence.js',import.meta.url),'utf8');
 assert.match(src,/signalDecision\(item,actions\)/);
 assert.match(src,/Waarom relevant\?/);
 assert.match(src,/Wat kun je nu doen\?/);
 assert.match(src,/Bron_GEOBSERVEERD|sourceStatus/);
 assert.match(src,/data-open-page="actieve-acties"/);
 assert.match(src,/querySelectorAll\('\[data-open-page\]'\)/);
 assert.match(src,/signal\.company_impacts|company_impacts|companyImpact/);
 assert.match(src,/Wat betekent dit voor jouw bedrijf\?/);
 assert.match(src,/prioritizedActions=\[\.\.\.actions\]\.sort/);
 assert.match(src,/const safeUrl=verifiedExternalUrl\(item\.url\)/);
 assert.match(src,/const safeUrl=verifiedExternalUrl\(item\.canonical_url\)/);
 assert.doesNotMatch(src,/href="\$\{esc\(item\.url\)\}"/);
 assert.doesNotMatch(src,/href="\$\{esc\(item\.canonical_url\)\}"/);
});
