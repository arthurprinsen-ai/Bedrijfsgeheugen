import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PORTAL_PAGE_INDEX } from '../portal-v2/page-registry.js';
import { portalSteeringEvidenceState, applyPortalSteeringEvidenceGate } from '../portal-v2/modules/overview.js';

const html=fs.readFileSync('portal-v2/index.html','utf8');
const css=fs.readFileSync('portal-v2/experience.css','utf8');
const overview=fs.readFileSync('portal-v2/modules/overview.js','utf8');

test('first customer-facing screen explains continuous steering, not a catalog of AI agents',()=>{
 assert.match(html,/data-bg-portal-daily-steering="v1"/);
 assert.match(html,/DAGELIJKSE ONDERNEMINGSSTURING/);
 assert.match(html,/Wat verandert er in je bedrijf — en wat doe je ermee/);
 assert.match(html,/ontwikkelingen van binnen én buiten je onderneming/);
 assert.ok(html.indexOf('data-bg-portal-daily-steering="v1"')<html.indexOf('data-portal-sample-only="true"'));
 assert.equal((html.match(/data-bg-portal-daily-steering="v1"/g)||[]).length,1);
 assert.match(html,/Powerhouse in je bedrijf|Van bron tot resultaat: zo werkt jouw bedrijfssturing/);
 assert.match(html,/interactief voorbeeld, geen bevestiging van uitgevoerde klantacties/);
});

test('five real routes reuse the single existing portal navigation authority',()=>{
 const journey=html.match(/<section class="daily-steering"[^]*?<\/section>/)?.[0]||'';
 const routes=[...journey.matchAll(/data-open-page="([^"]+)"/g)].map(x=>x[1]);
 assert.deepEqual(routes,['omgevingsradar','bedrijfssituatie','strategie-naar-maandagochtend','actieve-acties','outcomes-evidence']);
 for(const route of routes){
  assert.ok(PORTAL_PAGE_INDEX[route],route+' must be in canonical portal page registry');
  assert.ok(journey.includes('href="https://www.bedrijfsgeheugen.nl/portal-v2/?page='+route+'"'));
 }
 assert.match(css,/\.daily-steering-steps/);
 assert.match(css,/@media\(max-width:720px\)/);
});

test('unverified static sample numbers are hidden by default and cannot masquerade as customer KPIs',()=>{
 const sections=html.match(/data-portal-sample-only="true" hidden/g)||[];
 assert.equal(sections.length,4,'glance, right, lower, activities should be demo-only');
 assert.match(html,/<section class="kpis" data-portal-customer-metrics="true" hidden>/);
 assert.match(css,/\[data-portal-sample-only\]\[hidden\].*display:none!important/);
 assert.match(overview,/applyPortalSteeringEvidenceGate\(root,state\)/);
 assert.match(overview,/lastStaticMetric\.hidden=!evidence\.demo/);
});

test('demo, missing and customer-entered evidence are clearly distinguished',()=>{
 assert.equal(portalSteeringEvidenceState({}).demo,false);
 assert.equal(portalSteeringEvidenceState({}).hasProfile,false);
 assert.match(portalSteeringEvidenceState({}).status,/Nog geen geverifieerde klantcijfers/);
 const partial=portalSteeringEvidenceState({portal:{profile:{maturity:{finance:2}}}});
 assert.equal(partial.hasProfile,false);
 assert.match(partial.status,/onvolledig/);
 const allDimensions=['sturing','commercie','operatie','finance','mensen','analytics','quality','governance','tech','culture','service','security','duurzaam'];
 const completeProfile={maturity:Object.fromEntries(allDimensions.map(id=>[id,3])),employees:24,hourlyCost:52};
 const entered=portalSteeringEvidenceState({portal:{profile:completeProfile}});
 assert.equal(entered.demo,false);
 assert.equal(entered.hasProfile,true);
 assert.match(entered.status,/indicatief/);
 const demo=portalSteeringEvidenceState({portal:{klant:'demo',profile:{maturity:{}}}});
 assert.equal(demo.demo,true);
 assert.match(demo.status,/fictief/);
});

test('proof gate hides all example cards for real customers and only shows derived profile KPIs',()=>{
 const examples=Array.from({length:4},()=>({hidden:false}));
 const fifth={hidden:false};
 const metrics={hidden:false,querySelector:()=>fifth};
 const status={textContent:''};
 const root={querySelectorAll:()=>examples,querySelector:selector=>selector==='#dailySteeringProof'?status:selector==='[data-portal-customer-metrics]'?metrics:null};
 applyPortalSteeringEvidenceGate(root,{});
 assert.ok(examples.every(x=>x.hidden));
 assert.equal(metrics.hidden,true);
 assert.equal(fifth.hidden,true);
 applyPortalSteeringEvidenceGate(root,{portal:{profile:{maturity:{finance:3}}}});
 assert.equal(metrics.hidden,true,'a partial input must not fabricate default staff or cost assumptions');
 const allDimensions=['sturing','commercie','operatie','finance','mensen','analytics','quality','governance','tech','culture','service','security','duurzaam'];
 applyPortalSteeringEvidenceGate(root,{portal:{profile:{maturity:Object.fromEntries(allDimensions.map(id=>[id,3])),employees:24,hourlyCost:52}}});
 assert.ok(examples.every(x=>x.hidden));
 assert.equal(metrics.hidden,false);
 assert.equal(fifth.hidden,true);
 assert.match(status.textContent,/indicatief/);
 applyPortalSteeringEvidenceGate(root,{portal:{klant:'demo'}});
 assert.ok(examples.every(x=>!x.hidden));
 assert.equal(metrics.hidden,true);
 assert.match(status.textContent,/Demonstratie/);
});
